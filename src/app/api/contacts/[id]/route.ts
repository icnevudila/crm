import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { logAction } from '@/lib/logger'
import { hasPermission, buildPermissionDeniedResponse } from '@/lib/permissions'

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

    const canRead = await hasPermission('contact', 'read', session.user.id)
    if (!canRead) {
      return buildPermissionDeniedResponse()
    }

    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId
    const canUpdate = await hasPermission('contact', 'update', session.user.id)
    if (!canUpdate) {
      return buildPermissionDeniedResponse()
    }

    const { id } = await params
    
    const supabase = getSupabaseWithServiceRole()

    let contactQuery = supabase
      .from('Contact')
      .select(`
        *,
        CustomerCompany (
          id,
          name,
          sector,
          city
        )
      `)
      .eq('id', id)
    
    if (!isSuperAdmin) {
      contactQuery = contactQuery.eq('companyId', companyId)
    }
    
    const { data, error } = await contactQuery.single()

    if (error) {
      const message = error.message || 'İletişim kaydı getirilemedi'
      if (message.includes('schema cache')) {
        return NextResponse.json(
          {
            error: 'Contact tablosu bulunamadı',
            message:
              'Supabase şemasında Contact tablosu keşfedilemedi. Lütfen tüm Supabase migrationlarını (özellikle 033_contact_lead_scoring_improvements) çalıştırın.',
          },
          { status: 500 }
        )
      }
      if (process.env.NODE_ENV === 'development') {
        console.error('Contacts [id] GET query error:', error)
      }
      return NextResponse.json({ error: message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'İletişim kaydı bulunamadı' }, { status: 404 })
    }

    // ActivityLog'ları çek
    let activityQuery = supabase
      .from('ActivityLog')
      .select(`
        *,
        User (
          name,
          email
        )
      `)
      .eq('entity', 'Contact')
      .eq('meta->>id', id)
    
    if (!isSuperAdmin) {
      activityQuery = activityQuery.eq('companyId', companyId)
    }
    
    const { data: activities } = await activityQuery
      .order('createdAt', { ascending: false })
      .limit(20)

    return NextResponse.json(
      {
        ...(data as any),
        activities: activities || [],
      },
      {
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
        },
      }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'İletişim kaydı getirilemedi' },
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

    const canDelete = await hasPermission('contact', 'delete', session.user.id)
    if (!canDelete) {
      return buildPermissionDeniedResponse()
    }

    const { id } = await params
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId

    // Body parse
    let body
    try {
      body = await request.json()
    } catch (jsonError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Contacts [id] PUT API JSON parse error:', jsonError)
      }
      return NextResponse.json(
        { error: 'Geçersiz JSON', message: jsonError?.message || 'İstek gövdesi çözümlenemedi' },
        { status: 400 }
      )
    }

    // Önce mevcut contact'ı kontrol et
    const supabase = getSupabaseWithServiceRole()
    let checkQuery = supabase
      .from('Contact')
      .select('id, companyId, firstName, lastName')
      .eq('id', id)

    if (!isSuperAdmin) {
      checkQuery = checkQuery.eq('companyId', companyId)
    }

    const { data: existingContact, error: checkError } = await checkQuery.single()

    if (checkError || !existingContact) {
      return NextResponse.json(
        { error: 'İletişim kaydı bulunamadı veya erişim yetkiniz yok' },
        { status: 404 }
      )
    }

    // Update data hazırla
    const contactData: any = {}

    if (body.firstName) contactData.firstName = body.firstName.trim()
    if (body.lastName !== undefined) contactData.lastName = body.lastName?.trim() || ''
    if (body.email !== undefined) contactData.email = body.email?.trim() || null
    if (body.phone !== undefined) contactData.phone = body.phone?.trim() || null
    if (body.title !== undefined) contactData.title = body.title?.trim() || null
    if (body.role !== undefined) contactData.role = body.role
    if (body.linkedin !== undefined) contactData.linkedin = body.linkedin?.trim() || null
    if (body.notes !== undefined) contactData.notes = body.notes
    if (body.isPrimary !== undefined) contactData.isPrimary = body.isPrimary
    if (body.status !== undefined) contactData.status = body.status
    if (body.customerCompanyId !== undefined) contactData.customerCompanyId = body.customerCompanyId

    const { data: updatedContact, error: updateError } = await supabase
      .from('Contact')
      .update({
        ...contactData,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('companyId', existingContact.companyId)
      .select(`
        *,
        CustomerCompany (
          id,
          name,
          sector,
          city
        )
      `)
      .single()

    if (updateError) {
      const message = updateError.message || 'İletişim kaydı güncellenemedi'
      if (message.includes('schema cache')) {
        return NextResponse.json(
          {
            error: 'Contact tablosu bulunamadı',
            message:
              'Supabase şemasında Contact tablosu keşfedilemedi. Lütfen tüm Supabase migrationlarını (özellikle 033_contact_lead_scoring_improvements) çalıştırın.',
          },
          { status: 500 }
        )
      }
      if (process.env.NODE_ENV === 'development') {
        console.error('Contacts [id] update error:', updateError)
      }
      return NextResponse.json({ error: message }, { status: 500 })
    }

    await logAction({
      entity: 'Contact',
      action: 'UPDATE',
      description: `Contact güncellendi: ${existingContact.firstName} ${existingContact.lastName}`,
      meta: { entity: 'Contact', action: 'update', id, ...contactData },
      userId: session.user.id,
      companyId: session.user.companyId,
    })

    // Updated data with relations (already selected above but ensure fallback)
    const { data: fullData, error: fetchError } = await supabase
      .from('Contact')
      .select(`
        *,
        CustomerCompany (
          id,
          name,
          sector,
          city
        )
      `)
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.message?.includes('schema cache')) {
        return NextResponse.json(
          {
            error: 'Contact tablosu bulunamadı',
            message:
              'Supabase şemasında Contact tablosu keşfedilemedi. Lütfen tüm Supabase migrationlarını (özellikle 033_contact_lead_scoring_improvements) çalıştırın.',
          },
          { status: 500 }
        )
      }
      if (process.env.NODE_ENV === 'development') {
        console.error('Contacts [id] fetch error:', fetchError)
      }
    }

    return NextResponse.json(fullData || updatedContact, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    })
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Contacts [id] PUT API error:', error)
    }
    return NextResponse.json(
      { error: error?.message || 'İletişim kaydı güncellenemedi' },
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

    const { id } = await params
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId

    // Önce mevcut contact'ı kontrol et
    const supabase = getSupabaseWithServiceRole()
    let checkQuery = supabase
      .from('Contact')
      .select('id, companyId, firstName, lastName')
      .eq('id', id)

    if (!isSuperAdmin) {
      checkQuery = checkQuery.eq('companyId', companyId)
    }

    const { data: existingContact, error: checkError } = await checkQuery.single()

    if (checkError || !existingContact) {
      return NextResponse.json(
        { error: 'Contact not found or access denied' },
        { status: 404 }
      )
    }

    const { error: deleteError } = await supabase
      .from('Contact')
      .delete()
      .eq('id', id)
      .eq('companyId', existingContact.companyId)

    if (deleteError) {
      const message = deleteError.message || 'İletişim kaydı silinemedi'
      if (message.includes('schema cache')) {
        return NextResponse.json(
          {
            error: 'Contact tablosu bulunamadı',
            message:
              'Supabase şemasında Contact tablosu keşfedilemedi. Lütfen tüm Supabase migrationlarını (özellikle 033_contact_lead_scoring_improvements) çalıştırın.',
          },
          { status: 500 }
        )
      }
      if (process.env.NODE_ENV === 'development') {
        console.error('Contacts [id] delete error:', deleteError)
      }
      return NextResponse.json({ error: message }, { status: 500 })
    }

    await logAction({
      entity: 'Contact',
      action: 'DELETE',
      description: `Contact silindi: ${existingContact.firstName} ${existingContact.lastName}`,
      meta: { entity: 'Contact', action: 'delete', id },
      userId: session.user.id,
      companyId: session.user.companyId,
    })

    return NextResponse.json(
      { message: 'Kişi başarıyla silindi' },
      {
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
        },
      }
    )
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Contacts [id] DELETE API error:', error)
    }
    return NextResponse.json(
      { error: error?.message || 'İletişim kaydı silinemedi' },
      { status: 500 }
    )
  }
}



