import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { getSafeSession } from '@/lib/safe-session'
import { 
  isValidContractTransition, 
  isContractImmutable, 
  canDeleteContract,
  getTransitionErrorMessage
} from '@/lib/stageValidation'

// GET /api/contracts/[id] - Detay
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseWithServiceRole()

    // NOT: createdBy/updatedBy kolonları migration'da yoksa hata verir, bu yüzden kaldırıldı
    // approvedBy kolonu da kontrol edilmeli (varsa kullanılır)
    let contractQuery = supabase
      .from('Contract')
      .select(`
        id, title, description, customerId, customerCompanyId, dealId, type, category, startDate, endDate, signedDate, renewalType, renewalNoticeDays, nextRenewalDate, autoRenewEnabled, billingCycle, billingDay, paymentTerms, value, currency, taxRate, totalValue, status, contractNumber, attachmentUrl, terms, notes, tags, metadata, companyId, createdAt, updatedAt,
        customer:Customer(id, name, email, phone),
        customerCompany:CustomerCompany(id, name),
        deal:Deal(id, title, value, stage)
      `)
      .eq('id', params.id)
      .eq('companyId', session.user.companyId)
    
    let { data, error } = await contractQuery.single()

    // Hata varsa (kolon bulunamadı), tekrar dene
    if (error && (error.code === 'PGRST200' || error.message?.includes('Could not find a relationship') || error.message?.includes('does not exist'))) {
      console.warn('Contract GET API: Hata oluştu, tekrar deneniyor...', error.message)
      let contractQueryWithoutJoin = supabase
        .from('Contract')
        .select(`
          id, title, description, customerId, customerCompanyId, dealId, type, category, startDate, endDate, signedDate, renewalType, renewalNoticeDays, nextRenewalDate, autoRenewEnabled, billingCycle, billingDay, paymentTerms, value, currency, taxRate, totalValue, status, contractNumber, attachmentUrl, terms, notes, tags, metadata, companyId, createdAt, updatedAt
        `)
        .eq('id', params.id)
        .eq('companyId', session.user.companyId)
      
      const retryResult = await contractQueryWithoutJoin.single()
      const retryData: any = retryResult.data
      error = retryResult.error
      
      // createdBy/updatedBy kolonları kaldırıldı
      data = retryData
    }

    if (error) {
      console.error('Contract detail error:', error)
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    // ActivityLog'ları getir
    const { data: activityLogs } = await supabase
      .from('ActivityLog')
      .select('*, user:User(name, email)')
      .eq('entity', 'Contract')
      .contains('meta', { contractId: params.id })
      .order('createdAt', { ascending: false })
      .limit(20)

    // Milestones getir
    const { data: milestones } = await supabase
      .from('ContractMilestone')
      .select('*')
      .eq('contractId', params.id)
      .order('dueDate', { ascending: true })

    // Renewals getir
    const { data: renewals } = await supabase
      .from('ContractRenewal')
      .select('*')
      .eq('contractId', params.id)
      .order('createdAt', { ascending: false })

    return NextResponse.json({
      ...data,
      activityLogs: activityLogs || [],
      milestones: milestones || [],
      renewals: renewals || [],
    })
  } catch (error: any) {
    console.error('Contract detail error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/contracts/[id] - Güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canUpdate kontrolü
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canUpdate = await hasPermission('contract', 'update', session.user.id)
    if (!canUpdate) {
      return buildPermissionDeniedResponse()
    }

    const supabase = getSupabaseWithServiceRole()
    const body = await request.json()
    
    // SuperAdmin kontrolü
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'

    // Mevcut kaydı kontrol et (SuperAdmin için companyId kontrolü yapma)
    let existingQuery = supabase
      .from('Contract')
      .select('*')
      .eq('id', params.id)
    
    if (!isSuperAdmin) {
      existingQuery = existingQuery.eq('companyId', session.user.companyId)
    }
    
    const { data: existing, error: existingError } = await existingQuery.single()

    if (existingError || !existing) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    // ÖNEMLİ: Immutability kontrol
    const currentStatus = (existing as any)?.status
    if (currentStatus && isContractImmutable(currentStatus)) {
      return NextResponse.json(
        { 
          error: 'Bu sözleşme artık değiştirilemez',
          message: `${currentStatus} durumundaki sözleşmeler değiştirilemez (immutable). ${
            currentStatus === 'EXPIRED' ? 'Süresi dolmuştur.' : 'Sonlandırılmıştır.'
          }`,
          reason: 'IMMUTABLE_CONTRACT',
          status: currentStatus
        },
        { status: 403 }
      )
    }

    // ÖNEMLİ: Status transition validation
    if (body.status !== undefined && body.status !== currentStatus) {
      const validation = isValidContractTransition(currentStatus, body.status)
      
      if (!validation.valid) {
        return NextResponse.json(
          { 
            error: 'Geçersiz status geçişi',
            message: validation.error || getTransitionErrorMessage('contract', currentStatus, body.status),
            reason: 'INVALID_STATUS_TRANSITION',
            currentStatus,
            attemptedStatus: body.status,
            allowedTransitions: validation.allowed || []
          },
          { status: 400 }
        )
      }
    }

    // Calculate totalValue if value or taxRate changed
    let totalValue = existing.totalValue
    if (body.value !== undefined || body.taxRate !== undefined) {
      const value = body.value !== undefined ? parseFloat(body.value) : existing.value
      const taxRate = body.taxRate !== undefined ? body.taxRate : existing.taxRate
      totalValue = value + (value * taxRate / 100)
    }

    // SuperAdmin kontrolü
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'

    // Update işlemi - SuperAdmin için companyId filtresi yok
    let updateQuery = supabase
      .from('Contract')
      .update({
        title: body.title !== undefined ? body.title : existing.title,
        description: body.description !== undefined ? body.description : existing.description,
        customerId: body.customerId !== undefined ? body.customerId : existing.customerId,
        customerCompanyId: body.customerCompanyId !== undefined ? body.customerCompanyId : existing.customerCompanyId,
        dealId: body.dealId !== undefined ? body.dealId : existing.dealId,
        type: body.type !== undefined ? body.type : existing.type,
        category: body.category !== undefined ? body.category : existing.category,
        startDate: body.startDate !== undefined ? body.startDate : existing.startDate,
        endDate: body.endDate !== undefined ? body.endDate : existing.endDate,
        signedDate: body.signedDate !== undefined ? body.signedDate : existing.signedDate,
        renewalType: body.renewalType !== undefined ? body.renewalType : existing.renewalType,
        renewalNoticeDays: body.renewalNoticeDays !== undefined ? body.renewalNoticeDays : existing.renewalNoticeDays,
        nextRenewalDate: body.nextRenewalDate !== undefined ? body.nextRenewalDate : existing.nextRenewalDate,
        autoRenewEnabled: body.autoRenewEnabled !== undefined ? body.autoRenewEnabled : existing.autoRenewEnabled,
        billingCycle: body.billingCycle !== undefined ? body.billingCycle : existing.billingCycle,
        billingDay: body.billingDay !== undefined ? body.billingDay : existing.billingDay,
        paymentTerms: body.paymentTerms !== undefined ? body.paymentTerms : existing.paymentTerms,
        value: body.value !== undefined ? parseFloat(body.value) : existing.value,
        currency: body.currency !== undefined ? body.currency : existing.currency,
        taxRate: body.taxRate !== undefined ? body.taxRate : existing.taxRate,
        totalValue: totalValue,
        status: body.status !== undefined ? body.status : existing.status,
        attachmentUrl: body.attachmentUrl !== undefined ? body.attachmentUrl : existing.attachmentUrl,
        terms: body.terms !== undefined ? body.terms : existing.terms,
        notes: body.notes !== undefined ? body.notes : existing.notes,
        tags: body.tags !== undefined ? body.tags : existing.tags,
        metadata: body.metadata !== undefined ? body.metadata : existing.metadata,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', params.id)
    
    if (!isSuperAdmin) {
      updateQuery = updateQuery.eq('companyId', session.user.companyId)
    }
    
    const { error: updateError } = await updateQuery

    if (updateError) {
      console.error('Contract update error:', updateError)
      const { createErrorResponse } = await import('@/lib/error-handling')
      
      if (updateError.code && ['23505', '23503', '23502', '23514', '42P01', '42703'].includes(updateError.code)) {
        return createErrorResponse(updateError)
      }
      
      return NextResponse.json(
        { 
          error: updateError.message || 'Sözleşme güncellenemedi',
          code: updateError.code || 'UPDATE_ERROR',
        },
        { status: 500 }
      )
    }
    
    // Update başarılı - güncellenmiş veriyi çek (SuperAdmin için companyId filtresi yok)
    let selectQuery = supabase
      .from('Contract')
      .select(`
        id, title, description, customerId, customerCompanyId, dealId, type, category, startDate, endDate, signedDate, renewalType, renewalNoticeDays, nextRenewalDate, autoRenewEnabled, billingCycle, billingDay, paymentTerms, value, currency, taxRate, totalValue, status, contractNumber, attachmentUrl, terms, notes, tags, metadata, companyId, createdAt, updatedAt
      `)
      .eq('id', params.id)
    
    if (!isSuperAdmin) {
      selectQuery = selectQuery.eq('companyId', session.user.companyId)
    }
    
    const { data, error } = await selectQuery.single()

    if (error) {
      console.error('Contract select after update error:', error)
      return NextResponse.json(
        { 
          error: error.message || 'Güncellenmiş sözleşme bulunamadı',
          code: error.code || 'SELECT_ERROR',
        },
        { status: 500 }
      )
    }

    // ActivityLog
    await supabase.from('ActivityLog').insert({
      entity: 'Contract',
      action: 'UPDATE',
      description: `Sözleşme güncellendi: ${data.title}`,
      meta: {
        contractId: data.id,
        contractNumber: data.contractNumber,
        changes: body,
      },
      userId: session.user.id,
      companyId: session.user.companyId,
    })

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Contract update error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/contracts/[id] - Sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canDelete kontrolü
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canDelete = await hasPermission('contract', 'delete', session.user.id)
    if (!canDelete) {
      return buildPermissionDeniedResponse()
    }

    const supabase = getSupabase()

    // Mevcut kaydı kontrol et
    const { data: existing } = await supabase
      .from('Contract')
      .select('*')
      .eq('id', params.id)
      .eq('companyId', session.user.companyId)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    // ÖNEMLİ: Delete validation - Status kontrolü
    const deleteCheck = canDeleteContract((existing as any)?.status)
    if (!deleteCheck.canDelete) {
      return NextResponse.json(
        { 
          error: 'Bu sözleşme silinemez',
          message: deleteCheck.error,
          reason: 'CANNOT_DELETE_CONTRACT',
          status: (existing as any)?.status
        },
        { status: 403 }
      )
    }

    // Delete
    const { error } = await supabase
      .from('Contract')
      .delete()
      .eq('id', params.id)
      .eq('companyId', session.user.companyId)

    if (error) {
      console.error('Contract delete error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ActivityLog
    await supabase.from('ActivityLog').insert({
      entity: 'Contract',
      action: 'DELETE',
      description: `Sözleşme silindi: ${existing.title}`,
      meta: {
        contractId: existing.id,
        contractNumber: existing.contractNumber,
      },
      userId: session.user.id,
      companyId: session.user.companyId,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Contract delete error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

