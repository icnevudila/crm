import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Dynamic route - PUT/DELETE sonrası fresh data için cache'i kapat
export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Session kontrolü - hata yakalama ile
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Quotes [id] GET API session error:', sessionError)
      }
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Failed to get session' },
        { status: 500 }
      )
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const { id } = await params
    const supabase = getSupabaseWithServiceRole()

    // SuperAdmin tüm şirketlerin verilerini görebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId

    // Quote'u ilişkili verilerle çek
    let query = supabase
      .from('Quote')
      .select(
        `
        *,
        Deal (
          id,
          title,
          Customer (
            id,
            name,
            email
          )
        ),
        Invoice (
          id,
          title,
          status,
          total,
          createdAt
        )
      `
      )
      .eq('id', id)
    
    // SuperAdmin değilse companyId filtresi ekle
    if (!isSuperAdmin) {
      query = query.eq('companyId', companyId)
    }
    
    const { data, error } = await query.single()

    // QuoteItem'ları çek (hata olsa bile devam et)
    // @ts-ignore - Supabase type inference issue with QuoteItem table
    let quoteItems: any[] = []
    try {
      let itemQuery = supabase
        .from('QuoteItem')
        .select('*, Product(id, name, price, stock)')
        .eq('quoteId', id)
      
      // SuperAdmin değilse companyId filtresi ekle
      if (!isSuperAdmin) {
        itemQuery = itemQuery.eq('companyId', companyId)
      }
      
      const { data: items } = await itemQuery.order('createdAt', { ascending: true })
      quoteItems = items || []
    } catch (itemError) {
      // QuoteItem hatası ana işlemi engellemez
      if (process.env.NODE_ENV === 'development') {
        console.error('QuoteItem fetch error:', itemError)
      }
    }

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Quote API error:', error)
      }
      // Eğer kayıt bulunamadıysa 404, diğer hatalar için 500
      if (error.code === 'PGRST116' || error.message?.includes('No rows')) {
        return NextResponse.json({ error: 'Teklif bulunamadı' }, { status: 404 })
      }
      return NextResponse.json(
        { error: error.message || 'Teklif yüklenirken bir hata oluştu' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json({ error: 'Teklif bulunamadı' }, { status: 404 })
    }

    // ActivityLog'ları çek
    let activityQuery = supabase
      .from('ActivityLog')
      .select(
        `
        *,
        User (
          name,
          email
        )
      `
      )
      .eq('entity', 'Quote')
      .eq('meta->>id', id)
    
    // SuperAdmin değilse companyId filtresi ekle
    if (!isSuperAdmin) {
      activityQuery = activityQuery.eq('companyId', companyId)
    }
    
    const { data: activities } = await activityQuery
      .order('createdAt', { ascending: false })
      .limit(20)

    return NextResponse.json({
      ...(data as any),
      quoteItems: quoteItems || [],
      activities: activities || [],
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch quote' },
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
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Quotes [id] PUT API session error:', sessionError)
      }
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Failed to get session' },
        { status: 500 }
      )
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const supabase = getSupabaseWithServiceRole()

    // Quote verilerini güncelle - SADECE schema.sql'de olan kolonları gönder
    // schema.sql: title, status, total, dealId, companyId, updatedAt
    // schema-extension.sql: description, validUntil, discount, taxRate (migration çalıştırılmamış olabilir - GÖNDERME!)
    // schema-vendor.sql: vendorId (migration çalıştırılmamış olabilir - GÖNDERME!)
    const updateData: Record<string, unknown> = {
      title: body.title,
      status: body.status,
      total: body.total,
      updatedAt: new Date().toISOString(),
    }

    // Sadece schema.sql'de olan alanlar
    if (body.dealId !== undefined) updateData.dealId = body.dealId || null
    // NOT: description, vendorId, validUntil, discount, taxRate schema-extension'da var ama migration çalıştırılmamış olabilir - GÖNDERME!

    // TypeScript strict mode için tip assertion - Supabase'in update metodu dinamik tip bekliyor
    const { data, error } = await supabase
      .from('Quote')
      // @ts-ignore - Supabase database type tanımları eksik, update metodu dinamik tip bekliyor
      .update(updateData)
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Quote ACCEPTED olduğunda otomatik Invoice oluştur
    if (body.status === 'ACCEPTED' && data) {
      const invoiceData = {
        title: `Fatura - ${(data as any).title}`,
        status: 'DRAFT',
        total: (data as any).total,
        quoteId: (data as any).id,
        companyId: session.user.companyId,
      }
      
      const { data: invoice } = await supabase
        .from('Invoice')
        // @ts-ignore - Supabase database type tanımları eksik, insert metodu dinamik tip bekliyor
        .insert([invoiceData])
        .select()
        .single()

      if (invoice) {
        // ActivityLog kaydı
        const activityData = {
          entity: 'Invoice',
          action: 'CREATE',
          description: `Teklif kabul edildi, fatura oluşturuldu: ${(invoice as any).title}`,
          meta: { entity: 'Invoice', action: 'create', id: (invoice as any).id, fromQuote: (data as any).id },
          userId: session.user.id,
          companyId: session.user.companyId,
        }
        
        // @ts-ignore - Supabase database type tanımları eksik, insert metodu dinamik tip bekliyor
        await supabase.from('ActivityLog').insert([activityData])
      }
    }

    // ActivityLog kaydı
    const activityData = {
      entity: 'Quote',
      action: 'UPDATE',
      description: `Teklif güncellendi: ${body.title || (data as any).title}`,
      meta: { entity: 'Quote', action: 'update', id },
      userId: session.user.id,
      companyId: session.user.companyId,
    }
    
    // @ts-expect-error - Supabase database type tanımları eksik, insert metodu dinamik tip bekliyor
    await supabase.from('ActivityLog').insert([activityData])

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update quote' },
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
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Quotes [id] DELETE API session error:', sessionError)
      }
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Failed to get session' },
        { status: 500 }
      )
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = getSupabaseWithServiceRole()

    // Debug: Gelen parametreleri logla
    if (process.env.NODE_ENV === 'development') {
      console.log('Quote DELETE request:', {
        quoteId: id,
        companyId: session.user.companyId,
        userId: session.user.id,
      })
    }

    // Önce quote'u kontrol et - ActivityLog için title lazım (optional - hata olsa bile silme işlemi yapılır)
    const { data: quote, error: fetchError } = await supabase
      .from('Quote')
      .select('id, title, companyId')
      .eq('id', id)
      .maybeSingle() // .single() yerine .maybeSingle() kullan - hata vermez, sadece null döner

    // Debug: Quote kontrolü sonucu
    if (process.env.NODE_ENV === 'development') {
      console.log('Quote fetch result:', {
        quote,
        fetchError,
        quoteCompanyId: quote?.companyId,
        sessionCompanyId: session.user.companyId,
        match: quote?.companyId === session.user.companyId,
      })
    }

    // CompanyId kontrolü - quote varsa ama companyId eşleşmiyorsa hata döndür
    if (quote && quote.companyId !== session.user.companyId) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Quote DELETE: Company ID mismatch', {
          quoteId: id,
          quoteCompanyId: quote.companyId,
          sessionCompanyId: session.user.companyId,
        })
      }
      return NextResponse.json({ error: 'Quote not found or access denied' }, { status: 404 })
    }

    // Silme işlemini yap - data kontrolü ile
    // ÖNEMLİ: companyId kontrolünü burada da yapıyoruz (güvenlik için)
    const { data: deletedData, error: deleteError } = await supabase
      .from('Quote')
      .delete()
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .select()

    if (deleteError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Quote DELETE error:', deleteError)
      }
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // Silme işleminin başarılı olduğunu kontrol et
    if (!deletedData || deletedData.length === 0) {
      // Quote'u companyId olmadan da kontrol et - belki companyId yanlış
      const { data: quoteWithoutCompany } = await supabase
        .from('Quote')
        .select('id, companyId')
        .eq('id', id)
        .maybeSingle()

      if (process.env.NODE_ENV === 'development') {
        console.error('Quote DELETE: No data deleted', {
          quoteId: id,
          companyId: session.user.companyId,
          deletedData,
          quoteExists: !!quoteWithoutCompany,
          quoteCompanyId: quoteWithoutCompany?.companyId,
          match: quoteWithoutCompany?.companyId === session.user.companyId,
        })
      }
      return NextResponse.json({ error: 'Quote not found or could not be deleted' }, { status: 404 })
    }

    // Debug: Silme işleminin başarılı olduğunu logla
    if (process.env.NODE_ENV === 'development') {
      console.log('Quote DELETE success:', {
        quoteId: id,
        deletedCount: deletedData.length,
        deletedQuote: deletedData[0],
      })
    }

    // ActivityLog kaydı - hata olsa bile ana işlem başarılı
    // quote null olabilir (maybeSingle() kullandık), o yüzden deletedData'dan title al
    try {
      const quoteTitle = quote?.title || deletedData[0]?.title || 'Teklif'
      const activityData = {
        entity: 'Quote',
        action: 'DELETE',
        description: `Teklif silindi: ${quoteTitle}`,
        meta: { entity: 'Quote', action: 'delete', id },
        userId: session.user.id,
        companyId: session.user.companyId,
      }
      
      // @ts-expect-error - Supabase database type tanımları eksik, insert metodu dinamik tip bekliyor
      await supabase.from('ActivityLog').insert([activityData])
    } catch (logError) {
      // ActivityLog hatası ana işlemi etkilemez
      if (process.env.NODE_ENV === 'development') {
        console.error('ActivityLog insert error:', logError)
      }
    }

    return NextResponse.json({ 
      success: true,
      deletedCount: deletedData.length,
      deletedQuote: deletedData[0],
    })
  } catch (error: any) {
    // Detaylı hata mesajı - development'ta daha fazla bilgi
    if (process.env.NODE_ENV === 'development') {
      console.error('Quote DELETE catch error:', error)
    }
    return NextResponse.json(
      { 
        error: 'Failed to delete quote',
        ...(process.env.NODE_ENV === 'development' && {
          message: error?.message || 'Unknown error',
          stack: error?.stack,
        }),
      },
      { status: 500 }
    )
  }
}



