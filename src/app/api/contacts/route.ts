import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { logAction } from '@/lib/logger'
import { hasPermission, buildPermissionDeniedResponse } from '@/lib/permissions'

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

    // DEBUG: Session ve permission bilgisini logla (sadece gerekirse)
    // if (process.env.NODE_ENV === 'development') {
    //   console.log('[Contacts API] 🔍 Session Check:', {
    //     userId: session.user.id,
    //     email: session.user.email,
    //     role: session.user.role,
    //     companyId: session.user.companyId,
    //     companyName: session.user.companyName,
    //   })
    // }

    const canRead = await hasPermission('contact', 'read', session.user.id)
    if (!canRead) {
      // DEBUG: Permission denied logla
      if (process.env.NODE_ENV === 'development') {
        console.log('[Contacts API] ❌ Permission Denied:', {
          module: 'contact',
          action: 'read',
          userId: session.user.id,
          role: session.user.role,
        })
      }
      return buildPermissionDeniedResponse()
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
    
    // SuperAdmin için firma filtresi parametresi
    const filterCompanyId = searchParams.get('filterCompanyId') || ''

    // ✅ ÖNEMLİ: Service role key kullanıldığında RLS bypass edilir
    // Ama bazen RLS policy yanlış yapılandırılmışsa sorun çıkarabilir
    // Bu durumda direkt companyId filtresi ile sorgu yapıyoruz

    // Count query
    let countQuery = supabase
      .from('Contact')
      .select('*', { count: 'exact', head: true })
    
    // ÖNCE companyId filtresi (SuperAdmin değilse veya SuperAdmin firma filtresi seçtiyse)
    if (!isSuperAdmin) {
      countQuery = countQuery.eq('companyId', companyId)
    } else if (filterCompanyId) {
      // SuperAdmin firma filtresi seçtiyse sadece o firmayı göster
      countQuery = countQuery.eq('companyId', filterCompanyId)
    }
    // SuperAdmin ve firma filtresi yoksa tüm firmaları göster

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
      const message = countError.message || 'Kişiler getirilemedi'
      const errorCode = countError.code || ''
      
      // Development'ta detaylı hata logla
      if (process.env.NODE_ENV === 'development') {
        console.error('Contacts count query error:', {
          message,
          code: errorCode,
          details: countError.details,
          hint: countError.hint,
          fullError: countError,
        })
      }
      
      // Tablo bulunamadı hatası - daha detaylı mesaj
      if (message.includes('Could not find the table') || 
          message.includes('relation') ||
          message.includes('does not exist') ||
          errorCode === 'PGRST204' ||
          errorCode === '42P01') {
        return NextResponse.json(
          {
            error: 'Contact tablosu bulunamadı',
            message: 'Contact tablosu veritabanında bulunamadı. Lütfen migration 033_contact_lead_scoring_improvements.sql dosyasını Supabase SQL Editor\'da çalıştırın.',
            hint: 'Supabase Dashboard > SQL Editor > supabase/migrations/033_contact_lead_scoring_improvements.sql dosyasını çalıştırın',
            code: errorCode,
            details: process.env.NODE_ENV === 'development' ? countError.details : undefined,
          },
          { status: 500 }
        )
      }
      
      // RLS policy hatası
      if (message.includes('permission denied') || 
          message.includes('policy') ||
          message.includes('RLS') ||
          errorCode === '42501') {
        return NextResponse.json(
          {
            error: 'RLS Policy Hatası',
            message: 'Contact tablosu için RLS policy hatası. Lütfen migration 999_fix_contact_rls_policy.sql dosyasını Supabase SQL Editor\'da çalıştırın.',
            hint: 'Supabase Dashboard > SQL Editor > supabase/migrations/999_fix_contact_rls_policy.sql dosyasını çalıştırın',
            code: errorCode,
            details: process.env.NODE_ENV === 'development' ? countError.details : undefined,
          },
          { status: 500 }
        )
      }
      
      if (isContactSchemaError(message)) {
        return schemaErrorResponse()
      }
      
      return NextResponse.json(
        { 
          error: message,
          code: errorCode,
          details: process.env.NODE_ENV === 'development' ? countError.details : undefined,
          hint: process.env.NODE_ENV === 'development' ? countError.hint : undefined,
        },
        { status: 500 }
      )
    }

    // Data query
    // ÖNEMLİ: imageUrl kolonu migration'da olmayabilir, retry pattern ile handle ediyoruz
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
        imageUrl,
        createdAt,
        customerCompanyId,
        CustomerCompany (
          id,
          name,
          sector,
          city
        )
      `)
    
    // ÖNCE companyId filtresi (SuperAdmin değilse veya SuperAdmin firma filtresi seçtiyse)
    if (!isSuperAdmin) {
      dataQuery = dataQuery.eq('companyId', companyId)
    } else if (filterCompanyId) {
      // SuperAdmin firma filtresi seçtiyse sadece o firmayı göster
      dataQuery = dataQuery.eq('companyId', filterCompanyId)
    }
    // SuperAdmin ve firma filtresi yoksa tüm firmaları göster

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

    let { data, error } = await dataQuery

    // ✅ ÇÖZÜM: Kolon hatası varsa (42703 = column does not exist), imageUrl olmadan retry yap
    if (error && (error.code === '42703' || error.message?.includes('does not exist') || error.message?.includes('column'))) {
      // Development'ta log
      if (process.env.NODE_ENV === 'development') {
        console.warn('Contact imageUrl kolonu bulunamadı, imageUrl olmadan retry yapılıyor:', error.message)
      }
      
      // Retry: imageUrl kolonu olmadan tekrar dene
      let retryQuery = supabase
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
      
      // Aynı filtreleri uygula
      if (!isSuperAdmin) {
        retryQuery = retryQuery.eq('companyId', companyId)
      } else if (filterCompanyId) {
        retryQuery = retryQuery.eq('companyId', filterCompanyId)
      }
      if (search) {
        retryQuery = retryQuery.or(`firstName.ilike.%${search}%,lastName.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
      }
      if (status) {
        retryQuery = retryQuery.eq('status', status)
      }
      if (role) {
        retryQuery = retryQuery.eq('role', role)
      }
      if (customerCompanyId) {
        retryQuery = retryQuery.eq('customerCompanyId', customerCompanyId)
      }
      retryQuery = retryQuery
        .order('createdAt', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)
      
      const retryResult = await retryQuery
      data = retryResult.data
      error = retryResult.error
    }

    if (error) {
      const message = error.message || 'Kişiler getirilemedi'
      const errorCode = error.code || ''
      
      // Development'ta detaylı hata logla
      if (process.env.NODE_ENV === 'development') {
        console.error('Contacts data query error:', {
          message,
          code: errorCode,
          details: error.details,
          hint: error.hint,
          fullError: error,
        })
      }
      
      // Tablo bulunamadı hatası - daha detaylı mesaj
      if (message.includes('Could not find the table') || 
          message.includes('relation') ||
          message.includes('does not exist') ||
          errorCode === 'PGRST204' ||
          errorCode === '42P01') {
        return NextResponse.json(
          {
            error: 'Contact tablosu bulunamadı',
            message: 'Contact tablosu veritabanında bulunamadı. Lütfen migration 033_contact_lead_scoring_improvements.sql dosyasını Supabase SQL Editor\'da çalıştırın.',
            hint: 'Supabase Dashboard > SQL Editor > supabase/migrations/033_contact_lead_scoring_improvements.sql dosyasını çalıştırın',
            code: errorCode,
            details: process.env.NODE_ENV === 'development' ? error.details : undefined,
          },
          { status: 500 }
        )
      }
      
      // RLS policy hatası
      if (message.includes('permission denied') || 
          message.includes('policy') ||
          message.includes('RLS') ||
          errorCode === '42501') {
        return NextResponse.json(
          {
            error: 'RLS Policy Hatası',
            message: 'Contact tablosu için RLS policy hatası. Lütfen migration 999_fix_contact_rls_policy.sql dosyasını Supabase SQL Editor\'da çalıştırın.',
            hint: 'Supabase Dashboard > SQL Editor > supabase/migrations/999_fix_contact_rls_policy.sql dosyasını çalıştırın',
            code: errorCode,
            details: process.env.NODE_ENV === 'development' ? error.details : undefined,
          },
          { status: 500 }
        )
      }
      
      if (isContactSchemaError(message)) {
        return schemaErrorResponse()
      }
      
      return NextResponse.json(
        { 
          error: message,
          code: errorCode,
          details: process.env.NODE_ENV === 'development' ? error.details : undefined,
          hint: process.env.NODE_ENV === 'development' ? error.hint : undefined,
        },
        { status: 500 }
      )
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
        error: error?.message || 'Kişiler getirilemedi',
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
      return buildPermissionDeniedResponse()
    }

    let body
    try {
      body = await request.json()
    } catch (jsonError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Contacts POST API JSON parse error:', jsonError)
      }
      return NextResponse.json(
        { error: 'Geçersiz JSON', message: jsonError?.message || 'İstek gövdesi çözümlenemedi' },
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
    if (body.imageUrl) contactData.imageUrl = body.imageUrl.trim()

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
      const message = insertError.message || 'İletişim kaydı oluşturulamadı'
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
      const message = fetchError.message || 'Oluşturulan iletişim kaydı yüklenemedi'
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
      { error: error?.message || 'İletişim kaydı oluşturulamadı' },
      { status: 500 }
    )
  }
}



