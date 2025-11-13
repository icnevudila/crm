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

    // Filters
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const type = searchParams.get('type') || ''
    const customerId = searchParams.get('customerId') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
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
      .eq('companyId', session.user.companyId)
      .order('createdAt', { ascending: false })

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
      console.error('Contract list error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(
      {
        data,
        pagination: {
          page,
          limit,
          total: count || 0,
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
    let contractNumber = body.contractNumber
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
    const value = parseFloat(body.value)
    const totalValue = value + (value * taxRate / 100)

    // Insert
    const { data, error } = await supabase
      .from('Contract')
      .insert({
        contractNumber,
        title: body.title,
        description: body.description || null,
        customerId: body.customerId || null,
        customerCompanyId: body.customerCompanyId || null,
        dealId: body.dealId || null,
        type: body.type || 'SERVICE',
        category: body.category || null,
        startDate: body.startDate,
        endDate: body.endDate,
        signedDate: body.signedDate || null,
        renewalType: body.renewalType || 'MANUAL',
        renewalNoticeDays: body.renewalNoticeDays || 30,
        nextRenewalDate: body.nextRenewalDate || null,
        autoRenewEnabled: body.autoRenewEnabled || false,
        billingCycle: body.billingCycle || 'YEARLY',
        billingDay: body.billingDay || null,
        paymentTerms: body.paymentTerms || 30,
        value: value,
        currency: body.currency || 'TRY',
        taxRate: taxRate,
        totalValue: totalValue,
        status: body.status || 'DRAFT',
        attachmentUrl: body.attachmentUrl || null,
        terms: body.terms || null,
        notes: body.notes || null,
        tags: body.tags || null,
        metadata: body.metadata || null,
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

