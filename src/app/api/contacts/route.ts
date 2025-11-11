import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { logAction } from '@/lib/logger'
import { hasPermission, PERMISSION_DENIED_MESSAGE } from '@/lib/permissions'

const CONTACT_SCHEMA_HINT =
  'Supabase şemasında Contact tablosu keşfedilemedi. Lütfen tüm Supabase migrationlarını (özellikle 033_contact_lead_scoring_improvements) çalıştırın.'

const schemaErrorResponse = () =>
  NextResponse.json(
    {
      error: 'Contact tablosu bulunamadı',
      message: CONTACT_SCHEMA_HINT,
    },
    { status: 500 }
  )

const isContactSchemaError = (message?: string) => {
  if (!message) return false
  const normalized = message.toLowerCase()
  return (
    normalized.includes('schema cache') ||
    normalized.includes('contact') && normalized.includes('does not exist')
  )
}

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

    const canRead = await hasPermission('contact', 'read', session.user.id)
    if (!canRead) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: PERMISSION_DENIED_MESSAGE,
        },
        { status: 403 }
      )
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

    const { count, error: countError } = await countQuery
    if (countError) {
      const message = countError.message || 'Failed to fetch contacts'
      if (isContactSchemaError(message)) {
        return schemaErrorResponse()
      }
      if (process.env.NODE_ENV === 'development') {
        console.error('Contacts count query error:', countError)
      }
      return NextResponse.json({ error: message }, { status: 500 })
    }

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
      const message = error.message || 'Failed to fetch contacts'
      if (isContactSchemaError(message)) {
        return schemaErrorResponse()
      }
      if (process.env.NODE_ENV === 'development') {
        console.error('Contacts GET API query error:', error)
      }
      return NextResponse.json({ error: message }, { status: 500 })
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
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const canCreate = await hasPermission('contact', 'create', session.user.id)
    if (!canCreate) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: PERMISSION_DENIED_MESSAGE,
        },
        { status: 403 }
      )
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

    const contactData: Record<string, any> = {
      firstName: body.firstName.trim(),
      status: body.status || 'ACTIVE',
      role: body.role || 'OTHER',
      isPrimary: body.isPrimary || false,
    }

    if (body.lastName) contactData.lastName = body.lastName.trim()
    if (body.email) contactData.email = body.email.trim()
    if (body.phone) contactData.phone = body.phone.trim()
    if (body.title) contactData.title = body.title.trim()
    if (body.linkedin) contactData.linkedin = body.linkedin.trim()
    if (body.notes) contactData.notes = body.notes
    if (body.customerCompanyId) contactData.customerCompanyId = body.customerCompanyId

    const supabase = getSupabaseWithServiceRole()
    const { data: created, error: insertError } = await supabase
      .from('Contact')
      .insert({
        ...contactData,
        companyId: session.user.companyId,
      })
      .select('id')
      .single()

    if (insertError) {
      const message = insertError.message || 'Failed to create contact'
      if (isContactSchemaError(message)) {
        return schemaErrorResponse()
      }
      if (process.env.NODE_ENV === 'development') {
        console.error('Contacts POST insert error:', insertError)
      }
      return NextResponse.json({ error: message }, { status: 500 })
    }

    const contactId = (created as any)?.id

    // ActivityLog
    if (contactId) {
      await logAction({
        entity: 'Contact',
        action: 'CREATE',
        description: `Yeni contact eklendi: ${body.firstName} ${body.lastName || ''}`,
        meta: { entity: 'Contact', action: 'create', id: contactId, ...contactData },
        userId: session.user.id,
        companyId: session.user.companyId,
      })
    }

    // Get full data with relations
    const { data: fullData, error: fetchError } = await supabase
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
      .eq('id', contactId)
      .single()

    if (fetchError) {
      const message = fetchError.message || 'Failed to load created contact'
      if (isContactSchemaError(message)) {
        return schemaErrorResponse()
      }
      if (process.env.NODE_ENV === 'development') {
        console.error('Contacts POST fetch error:', fetchError)
      }
    }

    const responseData = fullData || { id: contactId, ...contactData }

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



