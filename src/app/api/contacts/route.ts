import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { createRecord } from '@/lib/crud'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { hasPermission } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Session error:', sessionError)
      }
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Failed to get session' },
        { status: 500 }
      )
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const role = searchParams.get('role') || ''
    const customerCompanyId = searchParams.get('customerCompanyId') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)

    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId
    const supabase = getSupabaseWithServiceRole()

    // Count query
    let countQuery = supabase
      .from('Contact')
      .select('*', { count: 'exact', head: true })
    
    if (!isSuperAdmin) {
      countQuery = countQuery.eq('companyId', companyId)
    }

    if (search) {
      countQuery = countQuery.or(`firstName.ilike.%${search}%,lastName.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
    }
    if (status) {
      countQuery = countQuery.eq('status', status)
    }
    if (role) {
      countQuery = countQuery.eq('role', role)
    }
    if (customerCompanyId) {
      countQuery = countQuery.eq('customerCompanyId', customerCompanyId)
    }

    const { count } = await countQuery

    // Data query
    let dataQuery = supabase
      .from('Contact')
      .select(`
        id, 
        firstName,
        lastName,
        email, 
        phone,
        title,
        role,
        isPrimary,
        linkedin,
        notes,
        status, 
        createdAt,
        customerCompanyId,
        CustomerCompany (
          id,
          name,
          sector,
          city
        )
      `)
    
    if (!isSuperAdmin) {
      dataQuery = dataQuery.eq('companyId', companyId)
    }

    if (search) {
      dataQuery = dataQuery.or(`firstName.ilike.%${search}%,lastName.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
    }
    if (status) {
      dataQuery = dataQuery.eq('status', status)
    }
    if (role) {
      dataQuery = dataQuery.eq('role', role)
    }
    if (customerCompanyId) {
      dataQuery = dataQuery.eq('customerCompanyId', customerCompanyId)
    }

    dataQuery = dataQuery
      .order('createdAt', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1)

    const { data, error } = await dataQuery

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Contacts GET API query error:', error)
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const totalPages = Math.ceil((count || 0) / pageSize)

    return NextResponse.json(
      {
        data: data || [],
        pagination: {
          page,
          pageSize,
          totalItems: count || 0,
          totalPages,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
        },
      }
    )
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Contacts API error:', error)
    }
    return NextResponse.json(
      { 
        error: error?.message || 'Failed to fetch contacts',
        ...(process.env.NODE_ENV === 'development' && { stack: error?.stack }),
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Session error:', sessionError)
      }
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Failed to get session' },
        { status: 500 }
      )
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body
    try {
      body = await request.json()
    } catch (jsonError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Contacts POST API JSON parse error:', jsonError)
      }
      return NextResponse.json(
        { error: 'Invalid JSON body', message: jsonError?.message || 'Failed to parse request body' },
        { status: 400 }
      )
    }

    // Zorunlu alanları kontrol et
    if (!body.firstName || body.firstName.trim() === '') {
      return NextResponse.json(
        { error: 'İsim gereklidir' },
        { status: 400 }
      )
    }

    const contactData: any = {
      firstName: body.firstName.trim(),
      status: body.status || 'ACTIVE',
      role: body.role || 'OTHER',
      isPrimary: body.isPrimary || false,
      companyId: session.user.companyId,
    }

    if (body.lastName) contactData.lastName = body.lastName.trim()
    if (body.email) contactData.email = body.email.trim()
    if (body.phone) contactData.phone = body.phone.trim()
    if (body.title) contactData.title = body.title.trim()
    if (body.linkedin) contactData.linkedin = body.linkedin.trim()
    if (body.notes) contactData.notes = body.notes
    if (body.customerCompanyId) contactData.customerCompanyId = body.customerCompanyId

    const created = await createRecord(
      'Contact',
      contactData,
      `Yeni contact eklendi: ${body.firstName} ${body.lastName || ''}`
    )

    // Get full data with relations
    const supabase = getSupabaseWithServiceRole()
    const { data: fullData } = await supabase
      .from('Contact')
      .select(`
        id, 
        firstName,
        lastName,
        email, 
        phone,
        title,
        role,
        isPrimary,
        linkedin,
        notes,
        status, 
        createdAt,
        customerCompanyId,
        CustomerCompany (
          id,
          name,
          sector,
          city
        )
      `)
      .eq('id', (created as any)?.id)
      .single()

    const responseData = fullData || created

    // Notification
    if (responseData?.id) {
      try {
        const { createNotificationForRole } = await import('@/lib/notification-helper')
        await createNotificationForRole({
          companyId: session.user.companyId,
          role: ['ADMIN', 'SALES'],
          title: 'Yeni Contact Oluşturuldu',
          message: `Yeni bir contact oluşturuldu: ${body.firstName} ${body.lastName || ''}`,
          type: 'info',
          relatedTo: 'Contact',
          relatedId: (responseData as any).id,
        })
      } catch (notificationError) {
        // Silent fail
      }
    }

    return NextResponse.json(responseData, {
      status: 201,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    })
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Contacts POST API error:', error)
    }
    return NextResponse.json(
      { error: error?.message || 'Failed to create contact' },
      { status: 500 }
    )
  }
}



