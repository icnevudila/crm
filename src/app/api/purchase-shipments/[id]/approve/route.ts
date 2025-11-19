import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// PurchaseTransaction tipi (Supabase type cache güncel olmayabilir)
interface PurchaseTransaction {
  id: string
  status: string
  invoiceId: string | null
  companyId: string
  createdAt?: string
  updatedAt?: string
}

// PUT: Satın Alma'yı onayla (stok girişi tetiklenir - trigger ile)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = getSupabaseWithServiceRole()

    // Mevcut satın alma kaydını al
    // @ts-ignore - Supabase type inference issue (maybeSingle returns never type)
    const { data: currentPurchaseData, error: fetchError } = await supabase
      .from('PurchaseTransaction')
      .select('status, invoiceId')
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .maybeSingle()

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message || 'Satın alma kaydı bulunamadı' }, { status: 500 })
    }

    if (!currentPurchaseData) {
      return NextResponse.json({ error: 'Satın alma kaydı bulunamadı' }, { status: 404 })
    }

    // Type assertion - Supabase type cache güncel olmayabilir
    // currentPurchase değişkeni kaldırıldı, direkt currentPurchaseData kullanılıyor

    // @ts-ignore - Supabase type inference issue (maybeSingle returns never type)
    if ((currentPurchaseData as any).status === 'APPROVED') {
      // @ts-ignore - Supabase type inference issue
      return NextResponse.json({ error: 'Satın alma zaten onaylanmış' }, { status: 400 })
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

    // Satın alma onaylandığında faturaya bildirim ekle ve fatura durumunu güncelle
    // @ts-ignore - Supabase type inference issue
    if ((currentPurchaseData as any).invoiceId) {
      try {
        // Fatura bilgilerini al
        const { data: invoiceData } = await supabase
          .from('Invoice')
          .select('id, title, invoiceNumber, status')
          // @ts-ignore - Supabase type inference issue
          .eq('id', (currentPurchaseData as any).invoiceId)
          .eq('companyId', session.user.companyId)
          .maybeSingle()

        if (invoiceData) {
          // @ts-ignore - Supabase type inference issue
          const invoiceTitle = invoiceData.title || invoiceData.invoiceNumber || `Fatura #${(currentPurchaseData as any).invoiceId.substring(0, 8)}`
          const purchaseId = id.substring(0, 8)

          // Fatura durumunu güncelle (satın alma onaylandığında fatura "Satın Alma Onaylandı" olur)
          // ÖNEMLİ: Satın alma onaylandığında fatura HER ZAMAN RECEIVED durumuna geçer
          const invoiceUpdateData: any = {
            status: 'RECEIVED', // Satın alma onaylandı durumu
            updatedAt: new Date().toISOString(),
          }

          // Fatura tablosunu güncelle
          const { error: invoiceUpdateError } = await supabase
            .from('Invoice')
            .update(invoiceUpdateData)
            // @ts-ignore - Supabase type inference issue
          .eq('id', (currentPurchaseData as any).invoiceId)
            .eq('companyId', session.user.companyId)

          if (invoiceUpdateError) {
            console.error('Invoice update error:', invoiceUpdateError)
          }

          // Faturaya ActivityLog ekle (bildirim)
          // @ts-expect-error - Supabase database type tanımları eksik
          await supabase.from('ActivityLog').insert([{
            entity: 'Invoice',
            action: 'UPDATE',
            description: `✅ Satın alma onaylandı ve fatura durumu güncellendi: ${invoiceTitle} faturası "Satın Alma Onaylandı" (RECEIVED) durumuna taşındı. Stok girişleri yapıldı.`,
            meta: { 
              entity: 'Invoice', 
              action: 'purchase_approved', 
              // @ts-ignore - Supabase type inference issue
              invoiceId: (currentPurchaseData as any).invoiceId,
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

          // Notification ekle - Kullanıcıya bildirim göster
          try {
            // @ts-expect-error - Supabase database type tanımları eksik
            await supabase.from('Notification').insert([{
              title: '✅ Satın Alma Onaylandı',
              message: `${invoiceTitle} faturasına ait satın alma onaylandı. Fatura "Satın Alma Onaylandı" durumuna taşındı ve stok girişleri yapıldı.`,
              type: 'success',
              relatedTo: 'Invoice',
              // @ts-ignore - Supabase type inference issue
              relatedId: (currentPurchaseData as any).invoiceId,
              companyId: session.user.companyId,
              userId: session.user.id,
            }])
          } catch (notificationError) {
            // Notification hatası ana işlemi engellemez
            if (process.env.NODE_ENV === 'development') {
              console.error('Notification error:', notificationError)
            }
          }
        }
      } catch (invoiceActivityError) {
        // Fatura ActivityLog hatası ana işlemi engellemez
        if (process.env.NODE_ENV === 'development') {
          console.error('Invoice ActivityLog error:', invoiceActivityError)
        }
      }
    }

    // ActivityLog kaydı (Satın Alma için)
    try {
      // @ts-expect-error - Supabase database type tanımları eksik
      await supabase.from('ActivityLog').insert([{
        entity: 'PurchaseTransaction',
        action: 'APPROVE',
        // @ts-ignore - Supabase type inference issue
        description: `✅ Satın alma kaydı onaylandı: Fatura #${(currentPurchaseData as any).invoiceId?.substring(0, 8) || id.substring(0, 8)} için satın alma onaylandı. Stok girişleri yapıldı ve fatura durumu güncellendi.`,
        meta: { 
          entity: 'PurchaseTransaction', 
          action: 'approve', 
          id,
          // @ts-ignore - Supabase type inference issue
          invoiceId: (currentPurchaseData as any).invoiceId,
        },
        userId: session.user.id,
        companyId: session.user.companyId,
      }])
    } catch (activityError) {
      // ActivityLog hatası ana işlemi engellemez
      if (process.env.NODE_ENV === 'development') {
        console.error('PurchaseTransaction ActivityLog error:', activityError)
      }
    }

    return NextResponse.json({
      ...data,
      message: `Satın alma #${id.substring(0, 8)} onaylandı. Stok girişleri yapıldı.`,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to approve purchase shipment' },
      { status: 500 }
    )
  }
}

