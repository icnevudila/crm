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
        console.error('Deals [id] GET API session error:', sessionError)
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

    // Deal'ı ilişkili verilerle çek - companyId kontrolü API seviyesinde
    let query = supabase
      .from('Deal')
      .select(
        `
        *,
        Customer (
          id,
          name,
          email
        ),
        Quote (
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

    if (error || !data) {
      // Hata mesajını Türkçe ve anlaşılır yap
      if (error?.code === 'PGRST116' || error?.message?.includes('No rows')) {
        return NextResponse.json({ error: 'Fırsat bulunamadı' }, { status: 404 })
      }
      return NextResponse.json({ error: error?.message || 'Fırsat bulunamadı' }, { status: 404 })
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
      .eq('entity', 'Deal')
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
      activities: activities || [],
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch deal' },
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
        console.error('Deals [id] PUT API session error:', sessionError)
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
    let body
    try {
      body = await request.json()
    } catch (jsonError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Deals [id] PUT API JSON parse error:', jsonError)
      }
      return NextResponse.json(
        { error: 'Invalid JSON body', message: jsonError?.message || 'Failed to parse request body' },
        { status: 400 }
      )
    }
    
    const supabase = getSupabaseWithServiceRole()

    // Önce mevcut deal'ı çek - sadece gönderilen alanları güncelle (partial update)
    const { data: existingDeal } = await supabase
      .from('Deal')
      .select('title, stage, status, value, customerId')
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .single()

    if (!existingDeal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    // Deal verilerini güncelle - SADECE gönderilen alanları güncelle (partial update)
    // schema.sql: title, stage, value, status, companyId, customerId, updatedAt
    // schema-extension.sql: winProbability, expectedCloseDate, description (migration çalıştırılmamış olabilir - GÖNDERME!)
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    }

    // Sadece gönderilen alanları güncelle (undefined olanları mevcut değerle koru)
    if (body.title !== undefined) updateData.title = body.title
    if (body.stage !== undefined) updateData.stage = body.stage
    if (body.status !== undefined) updateData.status = body.status
    if (body.value !== undefined) updateData.value = typeof body.value === 'string' ? parseFloat(body.value) || 0 : (body.value || 0)
    if (body.customerId !== undefined) updateData.customerId = body.customerId || null
    // NOT: description, winProbability, expectedCloseDate schema-extension'da var ama migration çalıştırılmamış olabilir - GÖNDERME!

    // @ts-ignore - Supabase type inference issue with dynamic table names
    const { data, error } = await (supabase
      .from('Deal') as any)
      .update(updateData)
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .select()
      .single()

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Deals [id] PUT API update error:', {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          updateData,
          dealId: id,
        })
      }
      return NextResponse.json(
        { 
          error: error.message || 'Failed to update deal',
          ...(process.env.NODE_ENV === 'development' && {
            details: error,
            code: error.code,
            hint: error.hint,
          }),
        },
        { status: 500 }
      )
    }

    // ActivityLog kaydı - hata olsa bile ana işlem başarılı
    try {
      // @ts-ignore - Supabase type inference issue with dynamic table names
      await (supabase.from('ActivityLog') as any).insert([
        {
          entity: 'Deal',
          action: 'UPDATE',
          description: `Fırsat güncellendi: ${body.title || (data as any).title}`,
          meta: { entity: 'Deal', action: 'update', id },
          userId: session.user.id,
          companyId: session.user.companyId,
        },
      ])
    } catch (logError) {
      // ActivityLog hatası ana işlemi etkilemez
      console.error('ActivityLog insert error:', logError)
    }

    // Cache headers - PUT sonrası fresh data için cache'i kapat
    // NOT: dynamic = 'force-dynamic' ile cache zaten kapalı
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate', // PUT sonrası fresh data için cache'i kapat
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update deal' },
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
        console.error('Deals [id] DELETE API session error:', sessionError)
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

    const { data: deal } = await supabase
      .from('Deal')
      .select('title')
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .single()

    const { error } = await supabase
      .from('Deal')
      .delete()
      .eq('id', id)
      .eq('companyId', session.user.companyId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (deal) {
      // ActivityLog kaydı - hata olsa bile ana işlem başarılı
      try {
        // @ts-ignore - Supabase type inference issue with dynamic table names
        await (supabase.from('ActivityLog') as any).insert([
          {
            entity: 'Deal',
            action: 'DELETE',
            description: `Fırsat silindi: ${(deal as any).title}`,
            meta: { entity: 'Deal', action: 'delete', id },
            userId: session.user.id,
            companyId: session.user.companyId,
          },
        ])
      } catch (logError) {
        // ActivityLog hatası ana işlemi etkilemez
        console.error('ActivityLog insert error:', logError)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete deal' },
      { status: 500 }
    )
  }
}



