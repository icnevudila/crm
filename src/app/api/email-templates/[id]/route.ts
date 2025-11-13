import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Dynamic route - PUT/DELETE sonrası fresh data için cache'i kapat
export const dynamic = 'force-dynamic'

export async function GET(
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

    // Permission check - canRead kontrolü
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canRead = await hasPermission('email-template', 'read', session.user.id)
    if (!canRead) {
      return buildPermissionDeniedResponse()
    }

    const { id } = await params
    const supabase = getSupabaseWithServiceRole()

    // SuperAdmin tüm şirketlerin verilerini görebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId

    let query = supabase
      .from('EmailTemplate')
      .select('*')
      .eq('id', id)
    
    if (!isSuperAdmin) {
      query = query.eq('companyId', companyId)
    }
    
    const { data, error } = await query.single()

    if (error || !data) {
      if (error?.code === 'PGRST116' || error?.message?.includes('No rows')) {
        return NextResponse.json({ error: 'Email template bulunamadı' }, { status: 404 })
      }
      return NextResponse.json({ error: error?.message || 'Email template bulunamadı' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch email template' },
      { status: 500 }
    )
  }
}

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

    // Permission check - canUpdate kontrolü
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canUpdate = await hasPermission('email-template', 'update', session.user.id)
    if (!canUpdate) {
      return buildPermissionDeniedResponse()
    }

    const { id } = await params
    const body = await request.json()
    const supabase = getSupabaseWithServiceRole()

    // SuperAdmin tüm şirketlerin verilerini görebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId

    // Önce mevcut template'i çek
    let existingTemplateQuery = supabase
      .from('EmailTemplate')
      .select('name, companyId')
      .eq('id', id)
    
    if (!isSuperAdmin) {
      existingTemplateQuery = existingTemplateQuery.eq('companyId', companyId)
    }
    
    const { data: existingTemplate, error: existingTemplateError } = await existingTemplateQuery.single()

    if (existingTemplateError || !existingTemplate) {
      if (existingTemplateError?.code === 'PGRST116' || existingTemplateError?.message?.includes('No rows')) {
        return NextResponse.json({ error: 'Email template bulunamadı' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Email template bulunamadı' }, { status: 404 })
    }

    // Template verilerini güncelle
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    }

    if (body.name !== undefined) updateData.name = body.name.trim()
    if (body.subject !== undefined) updateData.subject = body.subject?.trim() || null
    if (body.body !== undefined) updateData.body = body.body.trim()
    if (body.variables !== undefined) updateData.variables = body.variables
    if (body.category !== undefined) updateData.category = body.category
    if (body.isActive !== undefined) updateData.isActive = body.isActive

    // Update query
    let updateQuery = supabase
      .from('EmailTemplate')
      .update(updateData)
      .eq('id', id)
    
    if (!isSuperAdmin) {
      updateQuery = updateQuery.eq('companyId', companyId)
    }
    
    const { data, error } = await updateQuery
      .select()
      .single()

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Email Templates PUT API update error:', error)
      }
      return NextResponse.json(
        { error: error.message || 'Failed to update email template' },
        { status: 500 }
      )
    }

    // ActivityLog kaydı
    try {
      await supabase.from('ActivityLog').insert([
        {
          entity: 'EmailTemplate',
          action: 'UPDATE',
          description: `E-posta şablonu güncellendi: ${body.name || existingTemplate.name}`,
          meta: { entity: 'EmailTemplate', action: 'update', id },
          userId: session.user.id,
          companyId: session.user.companyId,
        },
      ])
    } catch (logError) {
      // ActivityLog hatası ana işlemi etkilemez
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to update email template' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Permission check - canDelete kontrolü
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canDelete = await hasPermission('email-template', 'delete', session.user.id)
    if (!canDelete) {
      return buildPermissionDeniedResponse()
    }

    const { id } = await params
    const supabase = getSupabaseWithServiceRole()

    const { data: template } = await supabase
      .from('EmailTemplate')
      .select('name')
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .single()

    const { error } = await supabase
      .from('EmailTemplate')
      .delete()
      .eq('id', id)
      .eq('companyId', session.user.companyId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (template) {
      // ActivityLog kaydı
      try {
        await supabase.from('ActivityLog').insert([
          {
            entity: 'EmailTemplate',
            action: 'DELETE',
            description: `E-posta şablonu silindi: ${(template as any).name}`,
            meta: { entity: 'EmailTemplate', action: 'delete', id },
            userId: session.user.id,
            companyId: session.user.companyId,
          },
        ])
      } catch (logError) {
        // ActivityLog hatası ana işlemi etkilemez
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to delete email template' },
      { status: 500 }
    )
  }
}









