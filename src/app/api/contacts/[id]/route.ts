import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { updateRecord, deleteRecord } from '@/lib/crud'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Contacts [id] GET API session error:', sessionError)
      }
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Failed to get session' },
        { status: 500 }
      )
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId
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
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
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
      { error: 'Failed to fetch contact' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Contacts [id] PUT API session error:', sessionError)
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
        { error: 'Invalid JSON body', message: jsonError?.message || 'Failed to parse request body' },
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
        { error: 'Contact not found or access denied' },
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

    const updated = await updateRecord(
      'Contact',
      id,
      contactData,
      `Contact güncellendi: ${existingContact.firstName} ${existingContact.lastName}`
    )

    // Updated data with relations
    const { data: fullData } = await supabase
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

    return NextResponse.json(fullData || updated, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    })
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Contacts [id] PUT API error:', error)
    }
    return NextResponse.json(
      { error: error?.message || 'Failed to update contact' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Contacts [id] DELETE API session error:', sessionError)
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

    await deleteRecord(
      'Contact',
      id,
      `Contact silindi: ${existingContact.firstName} ${existingContact.lastName}`
    )

    return NextResponse.json(
      { message: 'Contact deleted successfully' },
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
      { error: error?.message || 'Failed to delete contact' },
      { status: 500 }
    )
  }
}



