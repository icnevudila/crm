import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Dynamic route - POST/PUT sonrası fresh data için cache'i kapat
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canRead kontrolü
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canRead = await hasPermission('email-template', 'read', session.user.id)
    if (!canRead) {
      return buildPermissionDeniedResponse()
    }

    const supabase = getSupabaseWithServiceRole()
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || ''
    const isActive = searchParams.get('isActive')
    const search = searchParams.get('search') || ''

    // SuperAdmin tüm şirketlerin verilerini görebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId

    let query = supabase
      .from('EmailTemplate')
      .select('*')
      .order('createdAt', { ascending: false })
    
    if (!isSuperAdmin) {
      query = query.eq('companyId', companyId)
    }

    if (category) {
      query = query.eq('category', category)
    }

    if (isActive !== null && isActive !== undefined) {
      query = query.eq('isActive', isActive === 'true')
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,subject.ilike.%${search}%,body.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Email Templates API query error:', error)
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [], {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch email templates' },
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

    // Permission check - canCreate kontrolü
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canCreate = await hasPermission('email-template', 'create', session.user.id)
    if (!canCreate) {
      return buildPermissionDeniedResponse()
    }

    const body = await request.json()

    // Zorunlu alanları kontrol et
    if (!body.name || body.name.trim() === '') {
      return NextResponse.json(
        { error: 'Template adı gereklidir' },
        { status: 400 }
      )
    }

    if (!body.body || body.body.trim() === '') {
      return NextResponse.json(
        { error: 'Template içeriği gereklidir' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseWithServiceRole()

    const templateData: any = {
      name: body.name.trim(),
      subject: body.subject?.trim() || null,
      body: body.body.trim(),
      variables: body.variables || [],
      category: body.category || 'GENERAL',
      isActive: body.isActive !== undefined ? body.isActive : true,
      companyId: session.user.companyId,
    }

    const { data, error } = await supabase
      .from('EmailTemplate')
      .insert([templateData])
      .select()
      .single()

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Email Templates POST API insert error:', error)
      }
      return NextResponse.json(
        { error: error.message || 'Failed to create email template' },
        { status: 500 }
      )
    }

    // ActivityLog kaydı
    try {
      await supabase.from('ActivityLog').insert([
        {
          entity: 'EmailTemplate',
          action: 'CREATE',
          description: `Yeni e-posta şablonu oluşturuldu: ${body.name}`,
          meta: { entity: 'EmailTemplate', action: 'create', id: (data as any)?.id },
          userId: session.user.id,
          companyId: session.user.companyId,
        },
      ])
    } catch (logError) {
      // ActivityLog hatası ana işlemi etkilemez
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Email Templates POST API error:', error)
    }
    return NextResponse.json(
      { error: error?.message || 'Failed to create email template' },
      { status: 500 }
    )
  }
}

