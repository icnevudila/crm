import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// PUT: Sevkiyat durumunu güncelle
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const supabase = getSupabaseWithServiceRole()

    if (!body.status) {
      return NextResponse.json({ error: 'Status gereklidir' }, { status: 400 })
    }

    // Geçerli durum kontrolü
    const validStatuses = ['DRAFT', 'PENDING', 'APPROVED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED']
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json({ error: 'Geçersiz durum' }, { status: 400 })
    }

    // Mevcut sevkiyatı al
    const { data: currentShipment } = await supabase
      .from('Shipment')
      .select('status, invoiceId')
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .single()

    if (!currentShipment) {
      return NextResponse.json({ error: 'Sevkiyat bulunamadı' }, { status: 404 })
    }

    // ÖNEMLİ: Onaylı sevkiyatlar iptal edilemez veya durumu değiştirilemez (sadece IN_TRANSIT ve DELIVERED'a geçilebilir)
    if (currentShipment.status?.toUpperCase() === 'APPROVED') {
      // Onaylı sevkiyatlar sadece IN_TRANSIT veya DELIVERED durumuna geçebilir
      if (body.status === 'CANCELLED' || body.status === 'DRAFT' || body.status === 'PENDING') {
        return NextResponse.json({ error: 'Onaylı sevkiyatlar iptal edilemez veya geri alınamaz!' }, { status: 400 })
      }
      // APPROVED'dan APPROVED'a geçişe izin ver (aynı durum)
      if (body.status === 'APPROVED') {
        return NextResponse.json({ error: 'Sevkiyat zaten onaylı durumda' }, { status: 400 })
      }
    }

    // Durumu güncelle
    // ÖNEMLİ: Status'ü kesinlikle güncelle (database'de değişmeli)
    const updateData: any = {
      status: body.status, // Kesinlikle body.status kullan
      updatedAt: new Date().toISOString(),
    }
    
    // Debug: Güncelleme verisini kontrol et
    if (process.env.NODE_ENV === 'development') {
      console.log('Shipment status update - Update Data:', {
        id,
        oldStatus: currentShipment.status,
        newStatus: body.status,
        updateData,
      })
    }

    // APPROVED durumuna geçildiğinde tahmini teslim tarihi hesapla (2 gün sonra)
    // NOT: estimatedDelivery kolonu schema-extension.sql'de var ama migration çalıştırılmamış olabilir
    // Bu yüzden kolonun varlığını kontrol ediyoruz - kolon yoksa hata vermez
    if (body.status === 'APPROVED' && currentShipment.status !== 'APPROVED') {
      // estimatedDelivery kolonunun varlığını kontrol et
      try {
        const { error: columnCheckError } = await supabase
          .from('Shipment')
          .select('estimatedDelivery')
          .limit(1)
        
        // Eğer kolon varsa (hata yoksa), estimatedDelivery ekle
        if (!columnCheckError) {
          const estimatedDate = new Date()
          estimatedDate.setDate(estimatedDate.getDate() + 2)
          updateData.estimatedDelivery = estimatedDate.toISOString()
        } else {
          // Kolon yoksa, estimatedDelivery ekleme (hata vermez)
          if (process.env.NODE_ENV === 'development') {
            console.log('estimatedDelivery column not found, skipping')
          }
        }
      } catch (columnErr) {
        // Kolon kontrolü başarısız oldu, estimatedDelivery ekleme (hata vermez)
        if (process.env.NODE_ENV === 'development') {
          console.log('estimatedDelivery column check failed, skipping')
        }
      }
    }

    const { data: updateResult, error } = await supabase
      .from('Shipment')
      // @ts-expect-error - Supabase database type tanımları eksik
      .update(updateData)
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .select()

    if (error) {
      console.error('Shipment update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Array ise ilk elemanı al, değilse direkt kullan
    const data = Array.isArray(updateResult) && updateResult.length > 0 ? updateResult[0] : updateResult

    if (!data) {
      console.error('Shipment update failed - no data returned')
      return NextResponse.json({ error: 'Sevkiyat güncellenemedi' }, { status: 500 })
    }

    // ÖNEMLİ: Database'den güncellenmiş veriyi tekrar çek (güncelleme başarılı olduğundan emin ol)
    const { data: verifyData, error: verifyError } = await supabase
      .from('Shipment')
      .select('id, status, tracking, invoiceId, updatedAt')
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .single()

    if (verifyError) {
      console.error('Shipment verify error:', verifyError)
    }

    // Debug: Database'den gelen veriyi kontrol et
    if (process.env.NODE_ENV === 'development') {
      console.log('Shipment status update - Database Verify:', {
        id,
        requestedStatus: body.status,
        databaseStatus: verifyData?.status,
        updateResultStatus: (data as any)?.status,
      })
    }

    // Database'den gelen veriyi kullan (en güncel veri)
    const finalData = verifyData || data

    // ActivityLog kaydı (Sevkiyat için)
    try {
      // @ts-expect-error - Supabase database type tanımları eksik
      await supabase.from('ActivityLog').insert([{
        entity: 'Shipment',
        action: 'UPDATE',
        description: `Sevkiyat durumu değiştirildi: ${currentShipment.status} → ${body.status}`,
        meta: { 
          entity: 'Shipment', 
          action: 'status_change', 
          id,
          oldStatus: currentShipment.status,
          newStatus: body.status,
        },
        userId: session.user.id,
        companyId: session.user.companyId,
      }])
    } catch (activityError) {
      // ActivityLog hatası ana işlemi engellemez
    }

    // Sevkiyat onaylandığında (APPROVED) faturaya bildirim ekle ve fatura durumunu güncelle
    if (body.status === 'APPROVED' && currentShipment.status !== 'APPROVED' && currentShipment.invoiceId) {
      try {
        // Fatura bilgilerini al (sevkiyat ismi için)
        const { data: invoiceData } = await supabase
          .from('Invoice')
          .select('id, title, invoiceNumber, status')
          .eq('id', currentShipment.invoiceId)
          .eq('companyId', session.user.companyId)
          .maybeSingle()

        if (invoiceData) {
          const invoiceTitle = invoiceData.title || invoiceData.invoiceNumber || `Fatura #${currentShipment.invoiceId.substring(0, 8)}`
          const shipmentTracking = (data as any)?.tracking || id.substring(0, 8)

          // Fatura durumunu güncelle (sevkiyat onaylandığında fatura "Sevkiyatı Yapıldı" olur)
          // ÖNEMLİ: Sevkiyat onaylandığında fatura HER ZAMAN SHIPPED durumuna geçer
          const invoiceUpdateData: any = {
            status: 'SHIPPED', // Her durumda SHIPPED yap
            updatedAt: new Date().toISOString(),
          }

          // Fatura tablosunu güncelle
          const { error: invoiceUpdateError } = await supabase
            .from('Invoice')
            .update(invoiceUpdateData)
            .eq('id', currentShipment.invoiceId)
            .eq('companyId', session.user.companyId)

          if (invoiceUpdateError) {
            console.error('Invoice update error:', invoiceUpdateError)
          }

          // Faturaya ActivityLog ekle (bildirim)
          // @ts-expect-error - Supabase database type tanımları eksik
          await supabase.from('ActivityLog').insert([{
            entity: 'Invoice',
            action: 'UPDATE',
            description: `Sevkiyat onaylandı: ${shipmentTracking} - ${invoiceTitle} faturasına ait sevkiyat onaylandı ve stok düşümü yapıldı. İlgili fatura "Sevkiyatı Yapıldı" olarak işaretlendi.`,
            meta: { 
              entity: 'Invoice', 
              action: 'shipment_approved', 
              invoiceId: currentShipment.invoiceId,
              shipmentId: id,
              shipmentTracking,
              status: 'APPROVED',
              invoiceStatusChanged: true, // Her zaman değişir
              oldInvoiceStatus: invoiceData.status,
              newInvoiceStatus: 'SHIPPED', // Her zaman SHIPPED
            },
            userId: session.user.id,
            companyId: session.user.companyId,
          }])
        }
      } catch (invoiceActivityError) {
        // Fatura ActivityLog hatası ana işlemi engellemez
        if (process.env.NODE_ENV === 'development') {
          console.error('Invoice ActivityLog error:', invoiceActivityError)
        }
      }
    }

    // ÖNEMLİ: Database'den gelen status'ü kullan (en güncel veri)
    // Eğer database'de status güncellenmemişse, body.status kullan
    const finalStatus = (finalData as any)?.status || body.status
    
    // Debug: Final response'u kontrol et
    if (process.env.NODE_ENV === 'development') {
      console.log('Shipment status update - Final Response:', {
        id,
        requestedStatus: body.status,
        databaseStatus: (finalData as any)?.status,
        finalStatus,
      })
    }

    // ÖNEMLİ: Database'den gelen veriyi kullan (en güncel veri)
    const responseData = {
      ...(finalData as any),
      status: finalStatus, // Database'den gelen status (güncellenmiş)
      message: `Sevkiyat #${(finalData as any)?.tracking || id.substring(0, 8)} '${body.status}' durumuna alındı.`,
    }

    return NextResponse.json(responseData)
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to update shipment status' },
      { status: 500 }
    )
  }
}

