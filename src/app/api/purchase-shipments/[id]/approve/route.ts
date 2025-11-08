import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// PUT: Mal Kabul'ü onayla (stok girişi tetiklenir - trigger ile)
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
    const supabase = getSupabaseWithServiceRole()

    // Mevcut mal kabulü al
    const { data: currentPurchase } = await supabase
      .from('PurchaseTransaction')
      .select('status, invoiceId')
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .single()

    if (!currentPurchase) {
      return NextResponse.json({ error: 'Mal kabul bulunamadı' }, { status: 404 })
    }

    if (currentPurchase.status === 'APPROVED') {
      return NextResponse.json({ error: 'Mal kabul zaten onaylanmış' }, { status: 400 })
    }

    // Durumu APPROVED yap - trigger otomatik olarak stok girişi yapacak
    const { data, error } = await supabase
      .from('PurchaseTransaction')
      // @ts-expect-error - Supabase database type tanımları eksik
      .update({
        status: 'APPROVED',
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Mal kabul onaylandığında faturaya bildirim ekle ve fatura durumunu güncelle
    if (currentPurchase.invoiceId) {
      try {
        // Fatura bilgilerini al
        const { data: invoiceData } = await supabase
          .from('Invoice')
          .select('id, title, invoiceNumber, status')
          .eq('id', currentPurchase.invoiceId)
          .eq('companyId', session.user.companyId)
          .maybeSingle()

        if (invoiceData) {
          const invoiceTitle = invoiceData.title || invoiceData.invoiceNumber || `Fatura #${currentPurchase.invoiceId.substring(0, 8)}`
          const purchaseId = id.substring(0, 8)

          // Fatura durumunu güncelle (mal kabul onaylandığında fatura "Mal Kabul Edildi" olur)
          // ÖNEMLİ: Mal kabul onaylandığında fatura HER ZAMAN RECEIVED durumuna geçer
          const invoiceUpdateData: any = {
            status: 'RECEIVED', // Mal kabul edildi durumu
            updatedAt: new Date().toISOString(),
          }

          // Fatura tablosunu güncelle
          const { error: invoiceUpdateError } = await supabase
            .from('Invoice')
            .update(invoiceUpdateData)
            .eq('id', currentPurchase.invoiceId)
            .eq('companyId', session.user.companyId)

          if (invoiceUpdateError) {
            console.error('Invoice update error:', invoiceUpdateError)
          }

          // Faturaya ActivityLog ekle (bildirim)
          // @ts-expect-error - Supabase database type tanımları eksik
          await supabase.from('ActivityLog').insert([{
            entity: 'Invoice',
            action: 'UPDATE',
            description: `Mal kabul onaylandı: ${purchaseId} - ${invoiceTitle} faturasına ait mal kabul onaylandı ve stok girişi yapıldı. İlgili fatura "Mal Kabul Edildi" olarak işaretlendi.`,
            meta: { 
              entity: 'Invoice', 
              action: 'purchase_approved', 
              invoiceId: currentPurchase.invoiceId,
              purchaseTransactionId: id,
              purchaseId,
              status: 'APPROVED',
              invoiceStatusChanged: true,
              oldInvoiceStatus: invoiceData.status,
              newInvoiceStatus: 'RECEIVED',
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

    // ActivityLog kaydı (Mal Kabul için)
    try {
      // @ts-expect-error - Supabase database type tanımları eksik
      await supabase.from('ActivityLog').insert([{
        entity: 'PurchaseTransaction',
        action: 'APPROVE',
        description: `Mal kabul onaylandı: Fatura #${currentPurchase.invoiceId?.substring(0, 8) || id.substring(0, 8)}`,
        meta: { 
          entity: 'PurchaseTransaction', 
          action: 'approve', 
          id,
          invoiceId: currentPurchase.invoiceId,
        },
        userId: session.user.id,
        companyId: session.user.companyId,
      }])
    } catch (activityError) {
      // ActivityLog hatası ana işlemi engellemez
    }

    return NextResponse.json({
      ...data,
      message: `Mal kabul #${id.substring(0, 8)} onaylandı. Stok girişleri yapıldı.`,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to approve purchase shipment' },
      { status: 500 }
    )
  }
}

