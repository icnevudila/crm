import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

export const revalidate = 3600

export async function GET(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId
    const supabase = getSupabaseWithServiceRole()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''

    // ÖNEMLİ: PurchaseTransaction tablosu yoksa boş array döndür (cache sorunu olabilir)
    // Tablo kontrolü için önce basit bir sorgu yap
    try {
      const { error: tableCheckError } = await supabase
        .from('PurchaseTransaction')
        .select('id')
        .limit(0)
      
      if (tableCheckError) {
        // Tablo bulunamadı hatası - cache sorunu olabilir, boş array döndür
        if (tableCheckError.message?.includes('Could not find the table') || 
            tableCheckError.message?.includes('relation') ||
            tableCheckError.code === 'PGRST204') {
          console.warn('PurchaseTransaction tablosu bulunamadı (cache sorunu olabilir). Boş array döndürülüyor.')
          return NextResponse.json([])
        }
        // Diğer hatalar için throw et
        throw tableCheckError
      }
    } catch (tableError: any) {
      // Tablo yoksa veya cache sorunu varsa boş array döndür
      if (tableError?.message?.includes('Could not find the table') || 
          tableError?.message?.includes('relation') ||
          tableError?.code === 'PGRST204') {
        console.warn('PurchaseTransaction tablosu bulunamadı. Boş array döndürülüyor.')
        return NextResponse.json([])
      }
      throw tableError
    }

    // PurchaseTransaction'ları Invoice bilgileriyle çek
    // Vendor ilişkisi opsiyonel (Invoice'da vendorId olmayabilir)
    // NOT: PurchaseTransaction ve Invoice arasında iki ilişki var:
    // 1. PurchaseTransaction_invoiceId_fkey (one-to-one): PurchaseTransaction.invoiceId -> Invoice.id
    // 2. Invoice_purchaseShipmentId_fkey (one-to-many): PurchaseTransaction.id -> Invoice.purchaseShipmentId
    // Burada PurchaseTransaction_invoiceId_fkey kullanıyoruz (invoiceId üzerinden)
    let query = supabase
      .from('PurchaseTransaction')
      .select(`
        id,
        status,
        invoiceId,
        companyId,
        createdAt,
        updatedAt,
        Invoice!PurchaseTransaction_invoiceId_fkey (
          id,
          title,
          totalAmount,
          createdAt,
          companyId,
          vendorId
        )
      `)
      .order('createdAt', { ascending: false })
      .limit(100)
    
    if (!isSuperAdmin) {
      query = query.eq('companyId', companyId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (dateFrom) {
      query = query.gte('createdAt', dateFrom)
    }
    if (dateTo) {
      query = query.lte('createdAt', dateTo)
    }

    const { data, error } = await query

    if (error) {
      console.error('PurchaseTransaction query error:', error)
      // Daha detaylı hata mesajı
      return NextResponse.json({ 
        error: error.message || 'Failed to fetch purchase transactions',
        details: error.details || error.hint || null,
        code: error.code || null
      }, { status: 500 })
    }

    return NextResponse.json(data || [], {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200, max-age=1800',
      },
    })
  } catch (error: any) {
    console.error('PurchaseTransaction GET error:', error)
    return NextResponse.json(
      { 
        error: error?.message || 'Failed to fetch purchase shipments',
        details: error?.details || error?.hint || null,
        code: error?.code || null
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    if (!body.invoiceId || body.invoiceId.trim() === '') {
      return NextResponse.json(
        { error: 'Fatura ID gereklidir' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseWithServiceRole()

    // PurchaseTransaction oluştur
    const purchaseData: any = {
      companyId: session.user.companyId,
      invoiceId: body.invoiceId,
      status: 'DRAFT',
    }

    const { data: insertData, error } = await supabase
      .from('PurchaseTransaction')
      // @ts-expect-error - Supabase database type tanımları eksik
      .insert([purchaseData])
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to create purchase shipment' },
        { status: 500 }
      )
    }

    // Invoice'ı güncelle (purchaseShipmentId ekle)
    await supabase
      .from('Invoice')
      // @ts-expect-error - Supabase database type tanımları eksik
      .update({ purchaseShipmentId: insertData.id })
      .eq('id', body.invoiceId)
      .eq('companyId', session.user.companyId)

    // ActivityLog kaydı
    try {
      // @ts-expect-error - Supabase database type tanımları eksik
      await supabase.from('ActivityLog').insert([{
        entity: 'PurchaseTransaction',
        action: 'CREATE',
        description: `Yeni satın alma kaydı oluşturuldu`,
        meta: { entity: 'PurchaseTransaction', action: 'create', id: insertData.id },
        userId: session.user.id,
        companyId: session.user.companyId,
      }])
    } catch (activityError) {
      // ActivityLog hatası ana işlemi engellemez
    }

    return NextResponse.json({
      ...insertData,
        message: `Bu alış faturası için taslak satın alma kaydı oluşturuldu (#${insertData.id.substring(0, 8)}).`,
    }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to create purchase shipment' },
      { status: 500 }
    )
  }
}

