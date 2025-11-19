import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { updateRecord } from '@/lib/crud'
import { 
  isValidDealTransition, 
  isDealImmutable, 
  canDeleteDeal,
  getTransitionErrorMessage
} from '@/lib/stageValidation'

// Dynamic route - PUT/DELETE sonrası fresh data için cache'i kapat
export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // DEBUG: API endpoint çağrıldı
    console.log('[Deals [id] API] 🚀 GET endpoint called')
    
    // Session kontrolü - hata yakalama ile
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      console.error('[Deals [id] API] ❌ Session Error:', sessionError)
      return sessionError
    }

    // ✅ ÇÖZÜM: SuperAdmin için companyId kontrolü bypass et
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    if (!isSuperAdmin && !session?.user?.companyId) {
      const { getErrorMessage } = await import('@/lib/api-locale')
      return NextResponse.json({ error: getErrorMessage('errors.unauthorized', request) }, { status: 401 })
    }

    // DEBUG: SuperAdmin kontrolü
    if (process.env.NODE_ENV === 'development') {
      console.log('[Deals [id] API] 🔍 Session Check:', {
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role,
        companyId: session.user.companyId,
        isSuperAdmin,
      })
    }

    // Permission check - canRead kontrolü
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canRead = await hasPermission('deal', 'read', session.user.id)
    if (!canRead) {
      return buildPermissionDeniedResponse()
    }

    const { id } = await params
    
    // DEBUG: Deal ID kontrolü
    if (process.env.NODE_ENV === 'development') {
      console.log('[Deals [id] API] 🔍 Fetching Deal:', {
        dealId: id,
        isSuperAdmin,
      })
    }
    
    const supabase = getSupabaseWithServiceRole()

    // SuperAdmin tüm şirketlerin verilerini görebilir
    // ✅ ÇÖZÜM: SuperAdmin'in companyId'si null olabilir, bu durumda filtreleme yapma
    const companyId = session.user.companyId || null

    // Deal'ı sadece gerekli kolonlarla çek (performans için)
    // NOT: createdBy/updatedBy kolonları migration'da yoksa hata verir, bu yüzden kaldırıldı
    let query = supabase
      .from('Deal')
      .select(
        `
        id, title, stage, value, status, customerId, customerCompanyId, priorityScore, isPriority, leadSource, description, companyId, createdAt, updatedAt,
        Customer (
          id,
          name,
          email
        ),
        Quote (
          id,
          title,
          status,
          totalAmount,
          createdAt
        )
      `
      )
      .eq('id', id)
    
    // SuperAdmin değilse ve companyId varsa filtrele
    if (!isSuperAdmin && companyId) {
      query = query.eq('companyId', companyId)
    } else if (isSuperAdmin) {
      // DEBUG: SuperAdmin bypass - tüm şirketlerden deal çekiliyor
      if (process.env.NODE_ENV === 'development') {
        console.log('[Deals [id] API] ✅ SuperAdmin bypass - fetching deal from all companies')
      }
    }
    
    let { data, error } = await query.single()
    
    // Hata varsa (kolon bulunamadı veya foreign key hatası), tekrar dene
    if (error && (error.code === 'PGRST200' || error.message?.includes('Could not find a relationship') || error.message?.includes('does not exist'))) {
      console.warn('Deal GET API: Hata oluştu, tekrar deneniyor...', error.message)
      let queryWithoutJoin = supabase
        .from('Deal')
        .select(
          `
          id, title, stage, value, status, customerId, customerCompanyId, priorityScore, isPriority, leadSource, description, companyId, createdAt, updatedAt,
          Customer (
            id,
            name,
            email
          ),
          Quote (
            id,
            title,
            status,
            totalAmount,
            createdAt
          )
        `
        )
        .eq('id', id)
      
      if (!isSuperAdmin && companyId) {
        queryWithoutJoin = queryWithoutJoin.eq('companyId', companyId)
      }
      
      const retryResult = await queryWithoutJoin.single()
      const retryData: any = retryResult.data
      error = retryResult.error
      
      // createdBy/updatedBy kolonları kaldırıldı, User bilgileri çekilmiyor
      data = retryData
    }
    
    // DEBUG: Query sonucu
    if (process.env.NODE_ENV === 'development') {
      console.log('[Deals [id] API] 🔍 Query Result:', {
        dealId: id,
        hasData: !!data,
        error: error?.message || null,
        errorCode: error?.code || null,
      })
    }

    if (error || !data) {
      // DEBUG: Detaylı hata bilgisi
      if (process.env.NODE_ENV === 'development') {
        console.error('[Deals [id] API] ❌ Deal Not Found:', {
          dealId: id,
          error: error?.message || 'No error message',
          errorCode: error?.code || 'No error code',
          isSuperAdmin,
          companyId,
          queryApplied: !isSuperAdmin && companyId ? `companyId=${companyId}` : 'No companyId filter (SuperAdmin)',
        })
      }
      
      // Hata mesajını Türkçe ve anlaşılır yap
      const debugInfo = {
        dealId: id,
        isSuperAdmin,
        companyId,
        queryApplied: !isSuperAdmin && companyId ? `companyId=${companyId}` : 'No companyId filter (SuperAdmin)',
        errorCode: error?.code,
        errorMessage: error?.message,
        nodeEnv: process.env.NODE_ENV,
      }
      
      const { getErrorMessage } = await import('@/lib/api-locale')
      if (error?.code === 'PGRST116' || error?.message?.includes('No rows')) {
        return NextResponse.json({ 
          error: getErrorMessage('errors.api.dealNotFound', request),
          debug: debugInfo, // Her zaman ekle - development kontrolü kaldırıldı
        }, { status: 404 })
      }
      return NextResponse.json({ 
        error: error?.message || getErrorMessage('errors.api.dealNotFound', request),
        debug: debugInfo, // Her zaman ekle - development kontrolü kaldırıldı
      }, { status: 404 })
    }

    // Meeting'leri çek (dealId ile ilişkili)
    const { data: meetings } = await supabase
      .from('Meeting')
      .select('id, title, meetingDate, status, createdAt')
      .eq('dealId', id)
      .order('meetingDate', { ascending: false })
      .limit(10)

    // ✅ ÇÖZÜM: Contract'ları ayrı query ile çek (PGRST201 hatası nedeniyle)
    // Deal ve Contract arasında çift yönlü ilişki var (Contract.dealId ve Deal.contractId)
    // Bu yüzden Supabase hangi foreign key'i kullanacağını bilemiyor
    let contractQuery = supabase
      .from('Contract')
      .select('id, title, status, createdAt, contractNumber')
      .eq('dealId', id)
      .order('createdAt', { ascending: false })
      .limit(10)
    
    // SuperAdmin değilse ve companyId varsa filtrele
    if (!isSuperAdmin && companyId) {
      contractQuery = contractQuery.eq('companyId', companyId)
    }
    
    const { data: contracts } = await contractQuery

    // ActivityLog'lar KALDIRILDI - Lazy load için ayrı endpoint kullanılacak (/api/activity?entity=Deal&id=...)
    // (Performans optimizasyonu: Detay sayfası daha hızlı açılır, ActivityLog'lar gerektiğinde yüklenir)
    // NOT: Deal WON/LOST/CLOSED için ActivityLog'lar hala tutuluyor (PUT endpoint'inde)
    
    return NextResponse.json({
      ...(data as any),
      Meeting: meetings || [],
      Contract: contracts || [], // ✅ ÇÖZÜM: Ayrı query ile çekilen Contract'lar
      activities: [], // Boş array - lazy load için ayrı endpoint kullanılacak
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch deal' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Session kontrolü - hata yakalama ile
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }

    // ✅ ÇÖZÜM: SuperAdmin için companyId kontrolü bypass et
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    if (!isSuperAdmin && !session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    let body
    try {
      body = await request.json()
    } catch (jsonError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Deals [id] PUT API JSON parse error:', jsonError)
      }
      return NextResponse.json(
        { error: 'Invalid JSON body', message: jsonError?.message || 'Failed to parse request body' },
        { status: 400 }
      )
    }
    
    const supabase = getSupabaseWithServiceRole()

    // SuperAdmin tüm şirketlerin verilerini görebilir
    // ✅ ÇÖZÜM: SuperAdmin'in companyId'si null olabilir
    const companyId = session.user.companyId || null

    // Permission check - canUpdate kontrolü
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canUpdate = await hasPermission('deal', 'update', session.user.id)
    if (!canUpdate) {
      return buildPermissionDeniedResponse()
    }

    // Önce mevcut deal'ı çek - sadece gönderilen alanları güncelle (partial update)
    let existingDealQuery = supabase
      .from('Deal')
      .select('title, stage, status, value, customerId, companyId')
      .eq('id', id)
    
    // SuperAdmin değilse ve companyId varsa filtrele
    if (!isSuperAdmin && companyId) {
      existingDealQuery = existingDealQuery.eq('companyId', companyId)
    }
    
    const { data: existingDeal, error: existingDealError } = await existingDealQuery.single()

    if (existingDealError || !existingDeal) {
      // Hata mesajını Türkçe ve anlaşılır yap
      const { getErrorMessage } = await import('@/lib/api-locale')
      if (existingDealError?.code === 'PGRST116' || existingDealError?.message?.includes('No rows')) {
        return NextResponse.json({ error: getErrorMessage('errors.api.dealNotFound', request) }, { status: 404 })
      }
      return NextResponse.json({ error: getErrorMessage('errors.api.dealNotFound', request) }, { status: 404 })
    }

    // ÖNEMLİ: Stage validation - Immutable kontrol
    const { getErrorMessage, getMessages, getLocaleFromRequest, getActivityMessage } = await import('@/lib/api-locale')
    const locale = getLocaleFromRequest(request)
    const msgs = getMessages(locale)
    const currentStage = (existingDeal as any)?.stage
    if (currentStage && isDealImmutable(currentStage)) {
      return NextResponse.json(
        { 
          error: getErrorMessage('errors.api.dealCannotBeChanged', request),
          message: getErrorMessage('errors.api.dealCannotBeChangedMessage', request, { stage: currentStage }),
          reason: 'IMMUTABLE_DEAL',
          stage: currentStage
        },
        { status: 403 }
      )
    }

    // ÖNEMLİ: Stage transition validation
    if (body.stage !== undefined && body.stage !== currentStage) {
      const validation = isValidDealTransition(currentStage, body.stage)
      
      if (!validation.valid) {
        return NextResponse.json(
          { 
            error: 'Geçersiz stage geçişi',
            message: validation.error || getTransitionErrorMessage('deal', currentStage, body.stage),
            reason: 'INVALID_STAGE_TRANSITION',
            currentStage,
            attemptedStage: body.stage,
            allowedTransitions: validation.allowed || []
          },
          { status: 400 }
        )
      }
    }

    // ÖNEMLİ: LOST stage'inde lostReason zorunlu
    if (body.stage === 'LOST' || (body.stage === undefined && currentStage === 'LOST')) {
      const lostReasonToCheck = body.lostReason !== undefined ? body.lostReason : (existingDeal as any)?.lostReason
      if (!lostReasonToCheck || typeof lostReasonToCheck !== 'string' || lostReasonToCheck.trim().length === 0) {
        return NextResponse.json(
          {
            error: getErrorMessage('errors.api.dealLostReasonRequired', request),
            message: getErrorMessage('errors.api.dealLostReasonRequired', request),
            reason: 'LOST_REASON_REQUIRED',
            stage: body.stage || currentStage
          },
          { status: 400 }
        )
      }
    }

    // ÖNEMLİ: Deal CLOSED olduğunda değiştirilemez
    if ((existingDeal as any)?.status === 'CLOSED') {
      return NextResponse.json(
        { 
          error: getErrorMessage('errors.api.dealClosedCannotBeChanged', request),
          message: getErrorMessage('errors.api.dealClosedCannotBeChangedMessage', request),
          reason: 'CLOSED_DEAL_CANNOT_BE_UPDATED'
        },
        { status: 403 }
      )
    }

    // Deal verilerini güncelle - SADECE gönderilen alanları güncelle (partial update)
    // schema.sql: title, stage, value, status, companyId, customerId, updatedAt
    // schema-extension.sql: winProbability, expectedCloseDate, description (migration çalıştırılmamış olabilir - GÖNDERME!)
    // Güvenlik: createdBy ve updatedBy otomatik dolduruluyor (CRUD fonksiyonunda), body'den alınmamalı
    const { id: bodyId, companyId: bodyCompanyId, createdAt, updatedAt, createdBy, updatedBy, ...cleanBody } = body
    
    const updateData: any = {
      // updatedAt ve updatedBy CRUD fonksiyonunda otomatik ekleniyor
    }

    // Sadece gönderilen alanları güncelle (undefined olanları mevcut değerle koru)
    // NOT: Sadece temel kolonları güncelle - migration kolonları (leadSource, lostReason, status) opsiyonel
    if (cleanBody.title !== undefined) updateData.title = cleanBody.title
    if (cleanBody.stage !== undefined) {
      updateData.stage = cleanBody.stage
      // NOT: Status kolonu opsiyonel - kolon yoksa hata vermemesi için status'u updateData'ya ekleme
      // Status kolonu varsa ayrı bir update ile güncellenecek (aşağıda)
    }
    // NOT: Status kolonu güncelleme kaldırıldı - kolon yoksa hata vermemesi için
    if (cleanBody.value !== undefined) updateData.value = typeof cleanBody.value === 'string' ? parseFloat(cleanBody.value) || 0 : (cleanBody.value || 0)
    if (cleanBody.customerId !== undefined) updateData.customerId = cleanBody.customerId || null
    // lostReason: LOST stage'inde gönderilirse ekle (kolon yoksa hata vermemesi için try-catch ile)
    if (cleanBody.lostReason !== undefined && cleanBody.stage === 'LOST') {
      updateData.lostReason = cleanBody.lostReason
    }
    // NOT: leadSource gibi migration kolonları kaldırıldı - kolon yoksa hata vermemesi için
    // NOT: description, winProbability, expectedCloseDate schema-extension'da var ama migration çalıştırılmamış olabilir - GÖNDERME!

    // updateRecord kullanarak audit trail desteği (updatedBy otomatik eklenir)
    // NOT: Status kolonu yoksa hata vermemesi için status'u updateData'dan çıkarıyoruz
    const updateDataFinal = { ...updateData }
    delete updateDataFinal.status // Status kolonunu kaldır (yoksa hata vermemesi için)
    
    try {
      const dealTitle = cleanBody.title || existingDeal?.title || msgs.activity.defaultDealTitle
      const updatedDealData = await updateRecord(
        'Deal',
        id,
        updateDataFinal,
        getActivityMessage(locale, 'dealUpdated', { title: dealTitle })
      )
      
      if (!updatedDealData) {
        return NextResponse.json({ error: getErrorMessage('errors.api.dealCannotBeUpdated', request) }, { status: 500 })
      }
      
      // Güncellenmiş veriyi çek
      let query = supabase
        .from('Deal')
        .select('*')
        .eq('id', id)
      
      if (!isSuperAdmin && companyId) {
        query = query.eq('companyId', companyId)
      }
      
      const { data: deal, error: fetchError } = await query.single()
      
      if (fetchError || !deal) {
        return NextResponse.json({ error: getErrorMessage('errors.api.dealNotFound', request) }, { status: 404 })
      }
      
      return NextResponse.json(deal)
    } catch (updateError: any) {
      // lostReason kolonu yoksa hatayı yok say (opsiyonel kolon)
      if (updateError?.message?.includes('lostReason') || updateError?.code === '42703') {
        // lostReason'ı updateData'dan kaldır ve tekrar dene
        const { lostReason, ...updateDataWithoutLostReason } = updateDataFinal
        try {
          const updatedDealData = await updateRecord(
            'Deal',
            id,
            updateDataWithoutLostReason,
            getActivityMessage(locale, 'dealUpdated', { title: cleanBody.title || existingDeal?.title || getActivityMessage(locale, 'defaultDealTitle') })
          )
          
          if (!updatedDealData) {
            return NextResponse.json({ error: getErrorMessage('errors.api.dealCannotBeUpdated', request) }, { status: 500 })
          }
          
          // Güncellenmiş veriyi çek
          let query = supabase
            .from('Deal')
            .select('*')
            .eq('id', id)
          
          if (!isSuperAdmin && companyId) {
            query = query.eq('companyId', companyId)
          }
          
          const { data: deal, error: fetchError } = await query.single()
          
          if (fetchError || !deal) {
            return NextResponse.json({ error: getErrorMessage('errors.api.dealNotFound', request) }, { status: 404 })
          }
          
          return NextResponse.json(deal)
        } catch (retryError: any) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Deals [id] PUT API update error (retry):', {
              error: retryError?.message,
              code: retryError?.code,
              updateData: updateDataWithoutLostReason,
              dealId: id,
            })
          }
          return NextResponse.json(
            { 
              error: retryError?.message || 'Failed to update deal',
            },
            { status: 500 }
          )
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.error('Deals [id] PUT API update error:', {
            error: updateError?.message,
            code: updateError?.code,
            updateData,
            dealId: id,
          })
        }
        return NextResponse.json(
          { 
            error: updateError?.message || 'Failed to update deal',
          },
          { status: 500 }
        )
      }
    }

    // ÖNEMLİ: Deal CLOSED olduğunda özel ActivityLog ve bildirim
    if (cleanBody.status === 'CLOSED' && (existingDeal as any)?.status !== 'CLOSED') {
      try {
        const dealTitle = cleanBody.title || (existingDeal as any)?.title || getActivityMessage(locale, 'defaultDealTitle')
        
        // Özel ActivityLog kaydı
        // @ts-ignore - Supabase type inference issue with dynamic table names
        await (supabase.from('ActivityLog') as any).insert([
          {
            entity: 'Deal',
            action: 'UPDATE',
            description: getActivityMessage(locale, 'dealClosed', { title: dealTitle }),
            meta: { 
              entity: 'Deal', 
              action: 'closed', 
              id, 
              dealId: id,
              closedAt: new Date().toISOString()
            },
            userId: session.user.id,
            companyId: session.user.companyId,
          },
        ])

        // Bildirim: Fırsat kapatıldı
        const { createNotificationForRole } = await import('@/lib/notification-helper')
        await createNotificationForRole({
          companyId: session.user.companyId,
          role: ['ADMIN', 'SALES', 'SUPER_ADMIN'],
          title: msgs.activity.dealClosedTitle,
          message: getActivityMessage(locale, 'dealClosedMessage', { title: dealTitle }),
          type: 'info',
          relatedTo: 'Deal',
          relatedId: id,
        })
      } catch (activityError) {
        // ActivityLog hatası ana işlemi engellemez
        if (process.env.NODE_ENV === 'development') {
          console.error('Deal CLOSED ActivityLog error:', activityError)
        }
      }
    }

    // Otomasyon bilgilerini sakla (response'a eklemek için)
    const automationInfo: any = {}
    
    // ÖNEMLİ: Deal WON olduğunda otomatik Quote ve Contract oluştur
    if (cleanBody.stage === 'WON' && (existingDeal as any)?.stage !== 'WON') {
      let newQuote: any = null
      let newContract: any = null
      
      try {
        const dealTitle = cleanBody.title || (existingDeal as any)?.title || getActivityMessage(locale, 'defaultDealTitle')
        const dealValue = cleanBody.value !== undefined ? cleanBody.value : ((existingDeal as any)?.value || 0)
        const dealCustomerId = cleanBody.customerId || (existingDeal as any)?.customerId || null
        
        // Otomatik Quote oluştur
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const validUntil = new Date(now)
        validUntil.setDate(validUntil.getDate() + 30) // 30 gün geçerlilik
        
        // Bu ay oluşturulan teklif sayısını al
        const { count } = await supabase
          .from('Quote')
          .select('*', { count: 'exact', head: true })
          .eq('companyId', session.user.companyId)
          .like('title', `QUO-${year}-${month}-%`)
        
        const nextNumber = String((count || 0) + 1).padStart(4, '0')
        const quoteNumber = `QUO-${year}-${month}-${nextNumber}`
        const quoteTitle = `${quoteNumber} - ${dealTitle}`
        
        // Quote oluştur
        // ÖNEMLİ: customerCompanyId kolonu Quote tablosunda olmayabilir, kullanma
        // @ts-ignore - Supabase type inference issue with dynamic table names
        const { data: quoteData, error: quoteError } = await (supabase.from('Quote') as any)
          .insert([
            {
              title: quoteTitle,
              status: 'DRAFT',
              total: dealValue,
              dealId: id,
              customerId: dealCustomerId, // customerId kullan, customerCompanyId değil
              validUntil: validUntil.toISOString().split('T')[0],
              discount: 0,
              taxRate: 18,
              companyId: session.user.companyId,
            },
          ])
          .select()
          .single()
        
        if (!quoteError && quoteData) {
          newQuote = quoteData
          // Otomasyon bilgilerini sakla
          automationInfo.quoteId = (newQuote as any).id
          automationInfo.quoteCreated = true
          automationInfo.quoteTitle = quoteTitle
          // ActivityLog: Otomatik Quote oluşturuldu
          // @ts-ignore - Supabase type inference issue with dynamic table names
          await (supabase.from('ActivityLog') as any).insert([
            {
              entity: 'Quote',
              action: 'CREATE',
              description: getActivityMessage(locale, 'autoQuoteCreatedMessage', { dealTitle, quoteTitle }),
              meta: { 
                entity: 'Quote', 
                action: 'auto_created_from_deal', 
                quoteId: (newQuote as any).id,
                dealId: id,
                dealTitle,
              },
              userId: session.user.id,
              companyId: session.user.companyId,
            },
          ])
          
          // Bildirim: Otomatik Quote oluşturuldu
          const { createNotificationForRole } = await import('@/lib/notification-helper')
          await createNotificationForRole({
            companyId: session.user.companyId,
            role: ['ADMIN', 'SALES', 'SUPER_ADMIN'],
            title: msgs.activity.autoQuoteCreated,
            message: getActivityMessage(locale, 'autoQuoteCreatedMessage', { dealTitle, quoteTitle }),
            type: 'success',
            relatedTo: 'Quote',
            relatedId: (newQuote as any).id,
          })
        } else if (process.env.NODE_ENV === 'development') {
          console.error('Deal WON → Quote creation error:', quoteError)
        }
        
        // ✅ Otomatik Contract oluştur (Deal WON olduğunda)
        // Zaten Contract var mı kontrol et (idempotent - tekrar oluşturma)
        const { data: existingContract } = await supabase
          .from('Contract')
          .select('id, contractNumber')
          .eq('dealId', id)
          .eq('companyId', session.user.companyId)
          .limit(1)
          .maybeSingle()
        
        if (!existingContract) {
          // Contract number oluştur
          const contractYear = new Date().getFullYear()
          const { data: lastContract } = await supabase
            .from('Contract')
            .select('contractNumber')
            .eq('companyId', session.user.companyId)
            .order('createdAt', { ascending: false })
            .limit(1)
            .maybeSingle()
          
          let nextNum = 1
          if (lastContract?.contractNumber) {
            const match = lastContract.contractNumber.match(/SOZL-\d{4}-(\d+)/)
            if (match) {
              nextNum = parseInt(match[1]) + 1
            }
          }
          
          const contractNumber = `SOZL-${contractYear}-${String(nextNum).padStart(4, '0')}`
          const contractTitle = `Sözleşme - ${dealTitle}`
          
          // Calculate totalValue (KDV dahil)
          const taxRate = 18
          const totalValue = dealValue + (dealValue * taxRate / 100)
          
          // Contract oluştur
          // @ts-ignore - Supabase type inference issue with dynamic table names
          const { data: contractData, error: contractError } = await (supabase.from('Contract') as any)
            .insert([
              {
                contractNumber,
                title: contractTitle,
                description: `Deal ${dealTitle} kazanıldı, otomatik oluşturuldu`,
                customerId: dealCustomerId,
                dealId: id,
                type: 'SERVICE',
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 yıl sonra
                value: dealValue,
                currency: 'TRY',
                taxRate: taxRate,
                totalValue: totalValue,
                status: 'DRAFT',
                notes: `Deal ${dealTitle} kazanıldı, otomatik oluşturuldu`,
                companyId: session.user.companyId,
              },
            ])
            .select()
            .single()
          
          if (!contractError && contractData) {
            newContract = contractData
            // Otomasyon bilgilerini sakla
            automationInfo.contractId = (newContract as any).id
            automationInfo.contractCreated = true
            automationInfo.contractNumber = contractNumber
            automationInfo.contractTitle = contractTitle
            
            // ActivityLog: Otomatik Contract oluşturuldu
            // @ts-ignore - Supabase type inference issue with dynamic table names
            await (supabase.from('ActivityLog') as any).insert([
              {
                entity: 'Contract',
                action: 'CREATE',
                description: getActivityMessage(locale, 'autoContractCreatedMessage', { dealTitle, contractNumber }),
                meta: { 
                  entity: 'Contract', 
                  action: 'auto_created_from_deal', 
                  contractId: (newContract as any).id,
                  contractNumber,
                  dealId: id,
                  dealTitle,
                },
                userId: session.user.id,
                companyId: session.user.companyId,
              },
            ])
            
            // Bildirim: Otomatik Contract oluşturuldu
            const { createNotificationForRole } = await import('@/lib/notification-helper')
            await createNotificationForRole({
              companyId: session.user.companyId,
              role: ['ADMIN', 'SALES', 'SUPER_ADMIN'],
              title: msgs.activity.autoContractCreated,
              message: getActivityMessage(locale, 'autoContractCreatedMessage', { dealTitle, contractNumber }),
              type: 'success',
              relatedTo: 'Contract',
              relatedId: (newContract as any).id,
            })
          } else if (process.env.NODE_ENV === 'development') {
            console.error('Deal WON → Contract creation error:', contractError)
          }
        } else {
          // Contract zaten var - otomasyon bilgilerini güncelle
          automationInfo.contractId = existingContract.id
          automationInfo.contractCreated = true
          automationInfo.contractNumber = existingContract.contractNumber
        }
        
        // ✅ Email otomasyonu: Deal WON → Müşteriye email gönder
        if (newQuote) {
          try {
            const { getAndRenderEmailTemplate, getTemplateVariables } = await import('@/lib/template-renderer')
            const { sendEmail } = await import('@/lib/email-service')
            
            // Deal verisini çek (email için)
            const { data: dealData } = await supabase
              .from('Deal')
              .select('*')
              .eq('id', id)
              .single()
            
            if (dealData) {
              // Template değişkenlerini hazırla
              const variables = await getTemplateVariables('Deal', dealData, session.user.companyId)
              
              // Email template'ini çek ve render et
              const emailTemplate = await getAndRenderEmailTemplate('DEAL', session.user.companyId, variables)
              
              if (emailTemplate && variables.customerEmail) {
                // Email gönder
                const emailResult = await sendEmail({
                  to: variables.customerEmail as string,
                  subject: emailTemplate.subject || msgs.activity.dealWonEmailSubject,
                  html: emailTemplate.body,
                })
                
                if (emailResult.success) {
                  if (process.env.NODE_ENV !== 'production') {
                    console.log('✅ Deal WON email sent to:', variables.customerEmail)
                  }
                } else {
                  console.error('Deal WON email send error:', emailResult.error)
                }
              }
            }
          } catch (emailError) {
            // Email hatası ana işlemi engellemez
            if (process.env.NODE_ENV !== 'production') {
              console.error('Deal WON email automation error:', emailError)
            }
          }
        }
      } catch (autoError) {
        // Otomatik işlemler hatası ana işlemi engellemez
        if (process.env.NODE_ENV === 'development') {
          console.error('Deal WON → Auto Quote/Contract error:', autoError)
        }
      }
    }

    // ÖNEMLİ: Deal LOST olduğunda özel ActivityLog ve bildirim
    if (cleanBody.stage === 'LOST' && (existingDeal as any)?.stage !== 'LOST') {
      try {
        const dealTitle = cleanBody.title || (existingDeal as any)?.title || getActivityMessage(locale, 'defaultDealTitle')
        
        // Özel ActivityLog kaydı
        // @ts-ignore - Supabase type inference issue with dynamic table names
        await (supabase.from('ActivityLog') as any).insert([
          {
            entity: 'Deal',
            action: 'UPDATE',
            description: getActivityMessage(locale, 'dealLost', { title: dealTitle }),
            meta: { 
              entity: 'Deal', 
              action: 'lost', 
              id, 
              dealId: id,
              lostAt: new Date().toISOString()
            },
            userId: session.user.id,
            companyId: session.user.companyId,
          },
        ])

        // Bildirim: Fırsat kaybedildi
        const { createNotificationForRole } = await import('@/lib/notification-helper')
        await createNotificationForRole({
          companyId: session.user.companyId,
          role: ['ADMIN', 'SALES', 'SUPER_ADMIN'],
          title: msgs.activity.dealLostTitle,
          message: getActivityMessage(locale, 'dealLostMessage', { title: dealTitle }),
          type: 'warning',
          relatedTo: 'Deal',
          relatedId: id,
        })
      } catch (activityError) {
        // ActivityLog hatası ana işlemi engellemez
        if (process.env.NODE_ENV === 'development') {
          console.error('Deal LOST ActivityLog error:', activityError)
        }
      }
    }

    // Cache headers - PUT sonrası fresh data için cache'i kapat
    // NOT: dynamic = 'force-dynamic' ile cache zaten kapalı
    // Update başarılı - güncellenmiş deal'ı çek
    let updatedDealQuery = supabase
      .from('Deal')
      .select('*')
      .eq('id', id)
    
    if (!isSuperAdmin && companyId) {
      updatedDealQuery = updatedDealQuery.eq('companyId', companyId)
    }
    
    const { data: updatedDealData } = await updatedDealQuery.single()
    const updatedDeal = updatedDealData || existingDeal
    
    // LOST durumunda Task oluşturuldu mu kontrol et
    if (cleanBody.stage === 'LOST' && (existingDeal as any)?.stage !== 'LOST') {
      try {
        const { data: tasks } = await supabase
          .from('Task')
          .select('id')
          .eq('relatedTo', `Deal: ${id}`)
          .eq('companyId', session.user.companyId)
          .order('createdAt', { ascending: false })
          .limit(1)
        
        if (tasks && tasks.length > 0) {
          automationInfo.taskId = tasks[0].id
          automationInfo.taskCreated = true
        }
      } catch (taskError) {
        // Task kontrolü hatası ana işlemi engellemez
      }
    }
    
    return NextResponse.json({
      ...updatedDeal,
      automation: automationInfo,
    }, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate', // PUT sonrası fresh data için cache'i kapat
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update deal' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Session kontrolü - hata yakalama ile
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }

    // ✅ ÇÖZÜM: SuperAdmin için companyId kontrolü bypass et
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    if (!isSuperAdmin && !session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canDelete kontrolü
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canDelete = await hasPermission('deal', 'delete', session.user.id)
    if (!canDelete) {
      return buildPermissionDeniedResponse()
    }

    const { id } = await params
    const supabase = getSupabaseWithServiceRole()

    // ✅ ÇÖZÜM: SuperAdmin'in companyId'si null olabilir
    const companyId = session.user.companyId || null

    // Önce deal'ı kontrol et - koruma kontrolü için
    let dealQuery = supabase
      .from('Deal')
      .select('title, stage, status')
      .eq('id', id)
    
    // SuperAdmin değilse ve companyId varsa filtrele
    if (!isSuperAdmin && companyId) {
      dealQuery = dealQuery.eq('companyId', companyId)
    }
    
    const { data: deal } = await dealQuery.maybeSingle()

    const { getErrorMessage, getMessages, getLocaleFromRequest, getActivityMessage } = await import('@/lib/api-locale')
    const deleteLocale = getLocaleFromRequest(request)
    const deleteMsgs = getMessages(deleteLocale)
    
    if (!deal) {
      return NextResponse.json({ error: getErrorMessage('errors.api.dealNotFound', request) }, { status: 404 })
    }

    // ÖNEMLİ: Delete validation - Stage kontrolü
    const deleteCheck = canDeleteDeal((deal as any)?.stage)
    if (!deleteCheck.canDelete) {
      return NextResponse.json(
        { 
          error: getErrorMessage('errors.api.dealCannotBeDeleted', request),
          message: deleteCheck.error,
          reason: 'CANNOT_DELETE_DEAL',
          stage: (deal as any)?.stage,
          alternative: deleteMsgs.activity.dealCannotBeDeletedAlternative
        },
        { status: 403 }
      )
    }

    // ÖNEMLİ: Deal CLOSED olduğunda silinemez (Kapatılmış fırsat)
    if ((deal as any)?.status === 'CLOSED') {
      return NextResponse.json(
        { 
          error: getErrorMessage('errors.api.dealClosedCannotBeDeleted', request),
          message: getErrorMessage('errors.api.dealClosedCannotBeDeletedMessage', request),
          reason: 'CLOSED_DEAL_CANNOT_BE_DELETED'
        },
        { status: 403 }
      )
    }

    let deleteQuery = supabase
      .from('Deal')
      .delete()
      .eq('id', id)
    
    // SuperAdmin değilse ve companyId varsa filtrele
    if (!isSuperAdmin && companyId) {
      deleteQuery = deleteQuery.eq('companyId', companyId)
    }
    
    const { error } = await deleteQuery

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (deal) {
      // ActivityLog kaydı - hata olsa bile ana işlem başarılı
      try {
        // @ts-ignore - Supabase type inference issue with dynamic table names
        await (supabase.from('ActivityLog') as any).insert([
          {
            entity: 'Deal',
            action: 'DELETE',
            description: getActivityMessage(deleteLocale, 'dealDeleted', { title: (deal as any).title || getActivityMessage(deleteLocale, 'defaultDealTitle') }),
            meta: { entity: 'Deal', action: 'delete', id },
            userId: session.user.id,
            companyId: session.user.companyId,
          },
        ])
      } catch (logError) {
        // ActivityLog hatası ana işlemi etkilemez
        console.error('ActivityLog insert error:', logError)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete deal' },
      { status: 500 }
    )
  }
}




