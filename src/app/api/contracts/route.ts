import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { getSafeSession } from '@/lib/safe-session'

export const dynamic = 'force-dynamic'

// GET /api/contracts - Liste
export async function GET(request: NextRequest) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canRead kontrolü
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canRead = await hasPermission('contract', 'read', session.user.id)
    if (!canRead) {
      return buildPermissionDeniedResponse()
    }

    const supabase = getSupabaseWithServiceRole()
    const { searchParams } = new URL(request.url)

    // SuperAdmin kontrolü
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId

    // ✅ FIX: Contract tablosu yoksa boş array döndür (cache sorunu olabilir)
    try {
      const { error: tableCheckError } = await supabase
        .from('Contract')
        .select('id')
        .limit(0)
      
      if (tableCheckError) {
        const errorMessage = tableCheckError.message || ''
        const errorCode = tableCheckError.code || ''
        
        if (errorMessage.includes('Could not find the table') || 
            errorMessage.includes('relation') ||
            errorMessage.includes('does not exist') ||
            errorCode === 'PGRST204' ||
            errorCode === '42P01') {
          console.warn('Contract tablosu bulunamadı (cache sorunu olabilir). Boş array döndürülüyor.', {
            message: errorMessage,
            code: errorCode
          })
          return NextResponse.json({
            data: [],
            pagination: {
              page: 1,
              pageSize: 20,
              totalItems: 0,
              totalPages: 0,
            },
          }, {
            headers: {
              'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
            }
          })
        }
        throw tableCheckError
      }
    } catch (tableError: any) {
      const errorMessage = tableError?.message || ''
      const errorCode = tableError?.code || ''
      
      if (errorMessage.includes('Could not find the table') || 
          errorMessage.includes('relation') ||
          errorMessage.includes('does not exist') ||
          errorCode === 'PGRST204' ||
          errorCode === '42P01') {
        console.warn('Contract tablosu bulunamadı. Boş array döndürülüyor.', {
          message: errorMessage,
          code: errorCode
        })
        return NextResponse.json({
          data: [],
          pagination: {
            page: 1,
            pageSize: 20,
            totalItems: 0,
            totalPages: 0,
          },
        }, {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        })
      }
      throw tableError
    }

    // Filters
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const type = searchParams.get('type') || ''
    const customerId = searchParams.get('customerId') || ''
    const filterCompanyId = searchParams.get('filterCompanyId') || '' // SuperAdmin için firma filtresi
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || searchParams.get('limit') || '20')
    const limit = pageSize
    const offset = (page - 1) * limit

    // Base query
    let query = supabase
      .from('Contract')
      .select(`
        *,
        customer:Customer(id, name, email),
        customerCompany:CustomerCompany(id, name),
        deal:Deal(id, title)
      `, { count: 'exact' })
      .order('createdAt', { ascending: false })

    // SuperAdmin değilse companyId filtresi ekle
    if (!isSuperAdmin) {
      query = query.eq('companyId', companyId)
    } else if (filterCompanyId) {
      // SuperAdmin ise ve firma filtresi varsa, o firmaya göre filtrele
      query = query.eq('companyId', filterCompanyId)
    }
    // SuperAdmin ise ve firma filtresi yoksa, tüm şirketlerin contract'larını göster

    // Search
    if (search) {
      query = query.or(`contractNumber.ilike.%${search}%,title.ilike.%${search}%`)
    }

    // Filters
    if (status) {
      query = query.eq('status', status)
    }
    if (type) {
      query = query.eq('type', type)
    }
    if (customerId) {
      query = query.eq('customerId', customerId)
    }

    // Pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      // Tablo bulunamadı hatası - cache sorunu olabilir, boş array döndür
      const errorMessage = error.message || ''
      const errorCode = error.code || ''
      
      if (errorMessage.includes('Could not find the table') || 
          errorMessage.includes('relation') ||
          errorMessage.includes('does not exist') ||
          errorCode === 'PGRST204' ||
          errorCode === '42P01') {
        console.warn('Contract tablosu bulunamadı (query sırasında). Boş array döndürülüyor.', {
          message: errorMessage,
          code: errorCode
        })
        return NextResponse.json({
          data: [],
          pagination: {
            page,
            pageSize: limit,
            totalItems: 0,
            totalPages: 0,
          },
        }, {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        })
      }
      
      console.error('Contract list error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(
      {
        data,
        pagination: {
          page,
          pageSize: limit,
          totalItems: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
        },
      }
    )
  } catch (error: any) {
    console.error('Contract list error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/contracts - Yeni sözleşme oluştur
export async function POST(request: NextRequest) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canCreate kontrolü
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canCreate = await hasPermission('contract', 'create', session.user.id)
    if (!canCreate) {
      return buildPermissionDeniedResponse()
    }

    const supabase = getSupabaseWithServiceRole()
    const body = await request.json()

    // Validation
    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    if (!body.startDate || !body.endDate) {
      return NextResponse.json({ error: 'Start and end dates are required' }, { status: 400 })
    }
    if (!body.value) {
      return NextResponse.json({ error: 'Value is required' }, { status: 400 })
    }

    // Contract number oluştur (eğer yoksa)
    let contractNumber = body.contractNumber // Schema'da yok, body'den al
    if (!contractNumber) {
      // Get next sequence number
      const { data: lastContract } = await supabase
        .from('Contract')
        .select('contractNumber')
        .eq('companyId', session.user.companyId)
        .order('createdAt', { ascending: false })
        .limit(1)
        .single()

      const year = new Date().getFullYear()
      let nextNum = 1

      if (lastContract?.contractNumber) {
        const match = lastContract.contractNumber.match(/SOZL-\d{4}-(\d+)/)
        if (match) {
          nextNum = parseInt(match[1]) + 1
        }
      }

      contractNumber = `SOZL-${year}-${String(nextNum).padStart(4, '0')}`
    }

    // Calculate totalValue
    const taxRate = body.taxRate || 18
    const value = body.value
    const totalValue = value + (value * taxRate / 100)
    
    // validatedData oluştur - body'den gelen verileri kullan (Zod validation yok, manuel validation var)
    const validatedData = {
      title: body.title,
      description: body.description,
      customerId: body.customerId,
      customerCompanyId: body.customerCompanyId,
      dealId: body.dealId,
      type: body.type,
      category: body.category,
      startDate: body.startDate,
      endDate: body.endDate,
      signedDate: body.signedDate,
      renewalType: body.renewalType,
      renewalNoticeDays: body.renewalNoticeDays,
      autoRenewEnabled: body.autoRenewEnabled,
      billingCycle: body.billingCycle,
      billingDay: body.billingDay,
      paymentTerms: body.paymentTerms,
      currency: body.currency,
      taxRate: body.taxRate,
      status: body.status,
      terms: body.terms,
      notes: body.notes,
      // Optional fields (schema'da yok ama body'den alınabilir)
      nextRenewalDate: body.nextRenewalDate,
      attachmentUrl: body.attachmentUrl,
      tags: body.tags,
      metadata: body.metadata,
    }

    // Insert
    const { data, error } = await supabase
      .from('Contract')
      .insert({
        contractNumber,
        title: validatedData.title,
        description: validatedData.description || null,
        customerId: validatedData.customerId || null,
        customerCompanyId: validatedData.customerCompanyId || null,
        dealId: validatedData.dealId || null,
        type: validatedData.type || 'SERVICE',
        category: validatedData.category || null,
        startDate: validatedData.startDate,
        endDate: validatedData.endDate,
        signedDate: validatedData.signedDate || null,
        renewalType: validatedData.renewalType || 'MANUAL',
        renewalNoticeDays: validatedData.renewalNoticeDays || 30,
        nextRenewalDate: validatedData.nextRenewalDate || null,
        autoRenewEnabled: validatedData.autoRenewEnabled || false,
        billingCycle: validatedData.billingCycle || 'YEARLY',
        billingDay: validatedData.billingDay || null,
        paymentTerms: validatedData.paymentTerms || 30,
        value: value,
        currency: validatedData.currency || 'TRY',
        taxRate: taxRate,
        totalValue: totalValue,
        status: validatedData.status || 'DRAFT',
        attachmentUrl: validatedData.attachmentUrl || null,
        terms: validatedData.terms || null,
        notes: validatedData.notes || null,
        tags: validatedData.tags || null,
        metadata: validatedData.metadata || null,
        companyId: session.user.companyId,
      })
      .select()
      .single()

    if (error) {
      console.error('Contract create error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ActivityLog
    await supabase.from('ActivityLog').insert({
      entity: 'Contract',
      action: 'CREATE',
      description: `Yeni sözleşme oluşturuldu: ${data.title}`,
      meta: {
        contractId: data.id,
        contractNumber: data.contractNumber,
        value: data.value,
        status: data.status,
      },
      userId: session.user.id,
      companyId: session.user.companyId,
    })

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Contract create error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

