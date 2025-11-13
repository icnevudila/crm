import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { hasPermission, buildPermissionDeniedResponse } from '@/lib/permissions'

// Dengeli cache - 60 saniye revalidate (performans + veri güncelliği dengesi)
export const revalidate = 60

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Session kontrolü - hata yakalama ile
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // SuperAdmin tüm şirketlerin verilerini görebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId

    // Permission check - canRead kontrolü
    const canRead = await hasPermission('customer', 'read', session.user.id)
    if (!canRead) {
      return buildPermissionDeniedResponse()
    }

    const { id } = await params
    
    // Service role key ile RLS bypass - singleton pattern kullan
    const supabase = getSupabaseWithServiceRole()

    // Customer'ı sadece gerekli kolonlarla çek (performans için)
    // NOT: Invoice/Quote join'leri hata verebiliyor (totalAmount kolonu yoksa), bu yüzden sadece Customer kolonlarını çekiyoruz
    // İlişkili veriler gerekirse ayrı query'lerle çekilebilir
    let customerQuery = supabase
      .from('Customer')
      .select('id, name, email, phone, city, status, customerCompanyId, companyId, logoUrl, createdAt, updatedAt')
      .eq('id', id)
    
    // SuperAdmin değilse companyId filtresi ekle
    if (!isSuperAdmin) {
      customerQuery = customerQuery.eq('companyId', companyId)
    }
    
    const { data, error } = await customerQuery.single()

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Customer GET API error:', {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          customerId: id,
        })
      }
      
      // 404 hatası için özel mesaj
      if (error.code === 'PGRST116' || error.message?.includes('No rows')) {
        return NextResponse.json(
          { error: 'Müşteri bulunamadı', message: 'Bu müşteri kaydı bulunamadı veya silinmiş olabilir.' },
          { status: 404 }
        )
      }
      
      return NextResponse.json(
        { 
          error: 'Müşteri bilgileri alınamadı',
          message: error.message || 'Müşteri verilerine erişirken bir hata oluştu.',
          ...(process.env.NODE_ENV === 'development' && {
            details: error,
            code: error.code,
          }),
        },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Müşteri bulunamadı', message: 'Bu müşteri kaydı bulunamadı.' },
        { status: 404 }
      )
    }

    // ActivityLog'lar KALDIRILDI - Lazy load için ayrı endpoint kullanılacak (/api/activity?entity=Customer&id=...)
    // (Performans optimizasyonu: Detay sayfası daha hızlı açılır, ActivityLog'lar gerektiğinde yüklenir)
    
    return NextResponse.json(
      {
        ...(data as any),
        activities: [], // Boş array - lazy load için ayrı endpoint kullanılacak
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120, max-age=30',
          'CDN-Cache-Control': 'public, s-maxage=60',
          'Vercel-CDN-Cache-Control': 'public, s-maxage=60',
        },
      }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Session kontrolü - hata yakalama ile
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canUpdate kontrolü
    const canUpdate = await hasPermission('customer', 'update', session.user.id)
    if (!canUpdate) {
      return buildPermissionDeniedResponse()
    }

    const { id } = await params
    const body = await request.json()
    
    // Service role key ile RLS bypass - singleton pattern kullan
    const supabase = getSupabaseWithServiceRole()

    // Sadece schema.sql'de olan kolonları gönder
    // schema.sql: name, email, phone, city, status, companyId, updatedAt
    // schema-extension.sql: address, sector, website, taxNumber, fax, notes (migration çalıştırılmamış olabilir - GÖNDERME!)
    // migration 004: customerCompanyId (müşteri hangi firmada çalışıyor)
    const customerData: any = {
      name: body.name,
      email: body.email || null,
      phone: body.phone || null,
      city: body.city || null,
      status: body.status || 'ACTIVE',
      updatedAt: new Date().toISOString(),
    }
    // customerCompanyId - müşteri hangi firmada çalışıyor (migration 004'te eklendi)
    if (body.customerCompanyId !== undefined && body.customerCompanyId !== null && body.customerCompanyId !== '') {
      customerData.customerCompanyId = body.customerCompanyId
    } else if (body.customerCompanyId === null || body.customerCompanyId === '') {
      // Boş string veya null ise NULL yap (ilişkiyi kaldır)
      customerData.customerCompanyId = null
    }
    // logoUrl - müşteri logosu (migration 070'te eklendi)
    if (body.logoUrl !== undefined && body.logoUrl !== null && body.logoUrl !== '') {
      customerData.logoUrl = body.logoUrl
    } else if (body.logoUrl === null || body.logoUrl === '') {
      // Boş string veya null ise NULL yap
      customerData.logoUrl = null
    }
    // NOT: address, sector, website, taxNumber, fax, notes schema-extension'da var ama migration çalıştırılmamış olabilir - GÖNDERME!

    // @ts-ignore - Supabase database type tanımları eksik, update metodu dinamik tip bekliyor
    // @ts-ignore - Supabase type inference issue with dynamic table names
    const { data, error } = await (supabase
      .from('Customer') as any)
      .update(customerData)
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ActivityLog KALDIRILDI - Sadece kritik işlemler için ActivityLog tutulacak
    // (Performans optimizasyonu: Gereksiz log'lar veritabanını yavaşlatıyor)

    // Cache'i kapat - PUT işleminden sonra fresh data gelsin
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Session kontrolü - hata yakalama ile
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canDelete kontrolü
    const canDelete = await hasPermission('customer', 'delete', session.user.id)
    if (!canDelete) {
      return buildPermissionDeniedResponse()
    }

    const { id } = await params
    
    // Service role key ile RLS bypass - singleton pattern kullan
    const supabase = getSupabaseWithServiceRole()

    // ÖNEMLİ: Customer silinmeden önce ilişkili Deal/Quote/Invoice kontrolü
    // İlişkili Deal kontrolü
    const { data: deals, error: dealsError } = await supabase
      .from('Deal')
      .select('id, title')
      .eq('customerId', id)
      .eq('companyId', session.user.companyId)
      .limit(1)
    
    if (dealsError && process.env.NODE_ENV === 'development') {
      console.error('Customer DELETE - Deal check error:', dealsError)
    }
    
    if (deals && deals.length > 0) {
      return NextResponse.json(
        { 
          error: 'Müşteri silinemez',
          message: 'Bu müşteriye ait fırsatlar var. Müşteriyi silmek için önce ilgili fırsatları silmeniz gerekir.',
          reason: 'CUSTOMER_HAS_DEALS',
          relatedItems: {
            deals: deals.length,
            exampleDeal: {
              id: deals[0]?.id,
              title: deals[0]?.title
            }
          }
        },
        { status: 403 }
      )
    }
    
    // İlişkili Quote kontrolü
    const { data: quotes, error: quotesError } = await supabase
      .from('Quote')
      .select('id, title')
      .eq('customerId', id)
      .eq('companyId', session.user.companyId)
      .limit(1)
    
    if (quotesError && process.env.NODE_ENV === 'development') {
      console.error('Customer DELETE - Quote check error:', quotesError)
    }
    
    if (quotes && quotes.length > 0) {
      return NextResponse.json(
        { 
          error: 'Müşteri silinemez',
          message: 'Bu müşteriye ait teklifler var. Müşteriyi silmek için önce ilgili teklifleri silmeniz gerekir.',
          reason: 'CUSTOMER_HAS_QUOTES',
          relatedItems: {
            quotes: quotes.length,
            exampleQuote: {
              id: quotes[0]?.id,
              title: quotes[0]?.title
            }
          }
        },
        { status: 403 }
      )
    }
    
    // İlişkili Invoice kontrolü
    const { data: invoices, error: invoicesError } = await supabase
      .from('Invoice')
      .select('id, title')
      .eq('customerId', id)
      .eq('companyId', session.user.companyId)
      .limit(1)
    
    if (invoicesError && process.env.NODE_ENV === 'development') {
      console.error('Customer DELETE - Invoice check error:', invoicesError)
    }
    
    if (invoices && invoices.length > 0) {
      return NextResponse.json(
        { 
          error: 'Müşteri silinemez',
          message: 'Bu müşteriye ait faturalar var. Müşteriyi silmek için önce ilgili faturaları silmeniz gerekir.',
          reason: 'CUSTOMER_HAS_INVOICES',
          relatedItems: {
            invoices: invoices.length,
            exampleInvoice: {
              id: invoices[0]?.id,
              title: invoices[0]?.title
            }
          }
        },
        { status: 403 }
      )
    }

    // Önce customer'ı al (ActivityLog için)
    const { data: customer } = await supabase
      .from('Customer')
      .select('name')
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .single()

    // Silme işlemi - companyId kontrolü API seviyesinde yapılıyor (güvenlik)
    const { error } = await supabase
      .from('Customer')
      .delete()
      .eq('id', id)
      .eq('companyId', session.user.companyId)

    if (error) {
      console.error('Delete error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ActivityLog KALDIRILDI - Sadece kritik işlemler için ActivityLog tutulacak
    // (Performans optimizasyonu: Gereksiz log'lar veritabanını yavaşlatıyor)

    // Cache'i kapat - DELETE işleminden sonra fresh data gelsin
    return NextResponse.json(
      { success: true },
      {
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
        },
      }
    )
  } catch (error: any) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to delete customer' },
      { status: 500 }
    )
  }
}



