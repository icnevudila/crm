import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
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
    // Session kontrolü - hata yakalama ile
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    // Permission check - canRead kontrolü
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canRead = await hasPermission('deal', 'read', session.user.id)
    if (!canRead) {
      return buildPermissionDeniedResponse()
    }

    const { id } = await params
    const supabase = getSupabaseWithServiceRole()

    // SuperAdmin tüm şirketlerin verilerini görebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId

    // Deal'ı sadece gerekli kolonlarla çek (performans için)
    let query = supabase
      .from('Deal')
      .select(
        `
        id, title, stage, value, status, customerId, customerCompanyId, priorityScore, isPriority, leadSource, companyId, createdAt, updatedAt,
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
        ),
        Contract (
          id,
          title,
          status,
          createdAt
        )
      `
      )
      .eq('id', id)
    
    // SuperAdmin değilse companyId filtresi ekle
    if (!isSuperAdmin) {
      query = query.eq('companyId', companyId)
    }
    
    const { data, error } = await query.single()

    if (error || !data) {
      // Hata mesajını Türkçe ve anlaşılır yap
      if (error?.code === 'PGRST116' || error?.message?.includes('No rows')) {
        return NextResponse.json({ error: 'Fırsat bulunamadı' }, { status: 404 })
      }
      return NextResponse.json({ error: error?.message || 'Fırsat bulunamadı' }, { status: 404 })
    }

    // Meeting'leri çek (dealId ile ilişkili)
    const { data: meetings } = await supabase
      .from('Meeting')
      .select('id, title, meetingDate, status, createdAt')
      .eq('dealId', id)
      .order('meetingDate', { ascending: false })
      .limit(10)

    // ActivityLog'lar KALDIRILDI - Lazy load için ayrı endpoint kullanılacak (/api/activity?entity=Deal&id=...)
    // (Performans optimizasyonu: Detay sayfası daha hızlı açılır, ActivityLog'lar gerektiğinde yüklenir)
    // NOT: Deal WON/LOST/CLOSED için ActivityLog'lar hala tutuluyor (PUT endpoint'inde)
    
    return NextResponse.json({
      ...(data as any),
      Meeting: meetings || [],
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

    if (!session?.user?.companyId) {
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
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId

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
    
    // SuperAdmin değilse companyId filtresi ekle
    if (!isSuperAdmin) {
      existingDealQuery = existingDealQuery.eq('companyId', companyId)
    }
    
    const { data: existingDeal, error: existingDealError } = await existingDealQuery.single()

    if (existingDealError || !existingDeal) {
      // Hata mesajını Türkçe ve anlaşılır yap
      if (existingDealError?.code === 'PGRST116' || existingDealError?.message?.includes('No rows')) {
        return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    // ÖNEMLİ: Stage validation - Immutable kontrol
    const currentStage = (existingDeal as any)?.stage
    if (currentStage && isDealImmutable(currentStage)) {
      return NextResponse.json(
        { 
          error: 'Bu fırsat artık değiştirilemez',
          message: `${currentStage} durumundaki fırsatlar değiştirilemez (immutable). Sözleşme oluşturulmuştur.`,
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

    // ÖNEMLİ: Deal CLOSED olduğunda değiştirilemez
    if ((existingDeal as any)?.status === 'CLOSED') {
      return NextResponse.json(
        { 
          error: 'Kapatılmış fırsatlar değiştirilemez',
          message: 'Bu fırsat kapatıldı. Fırsat bilgilerini değiştirmek mümkün değildir.',
          reason: 'CLOSED_DEAL_CANNOT_BE_UPDATED'
        },
        { status: 403 }
      )
    }

    // Deal verilerini güncelle - SADECE gönderilen alanları güncelle (partial update)
    // schema.sql: title, stage, value, status, companyId, customerId, updatedAt
    // schema-extension.sql: winProbability, expectedCloseDate, description (migration çalıştırılmamış olabilir - GÖNDERME!)
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    }

    // Sadece gönderilen alanları güncelle (undefined olanları mevcut değerle koru)
    // NOT: Sadece temel kolonları güncelle - migration kolonları (leadSource, lostReason) opsiyonel
    if (body.title !== undefined) updateData.title = body.title
    if (body.stage !== undefined) updateData.stage = body.stage
    if (body.status !== undefined) updateData.status = body.status
    if (body.value !== undefined) updateData.value = typeof body.value === 'string' ? parseFloat(body.value) || 0 : (body.value || 0)
    if (body.customerId !== undefined) updateData.customerId = body.customerId || null
    // lostReason: LOST stage'inde gönderilirse ekle (kolon yoksa hata vermemesi için try-catch ile)
    if (body.lostReason !== undefined && body.stage === 'LOST') {
      updateData.lostReason = body.lostReason
    }
    // NOT: leadSource gibi migration kolonları kaldırıldı - kolon yoksa hata vermemesi için
    // NOT: description, winProbability, expectedCloseDate schema-extension'da var ama migration çalıştırılmamış olabilir - GÖNDERME!

    // Update query - Supabase'in otomatik join'ini önlemek için select yapmıyoruz
    // NOT: Supabase update query'si Invoice tablosuna otomatik join yapıyor (i.total hatası)
    // Bu yüzden select çağrısını tamamen kaldırıyoruz ve response'u manuel oluşturuyoruz
    // NOT: Supabase'in update metodu select yapmadan da çalışır, sadece error döner
    
    // Update işlemini yap - select yapmıyoruz (Invoice join'i i.total hatası veriyor)
    // NOT: Supabase'in update metodu select yapmadan da çalışır, sadece error döner
    let updateQuery = supabase
      .from('Deal')
      .update(updateData)
      .eq('id', id)
    
    // SuperAdmin değilse companyId filtresi ekle
    if (!isSuperAdmin) {
      updateQuery = updateQuery.eq('companyId', companyId)
    }
    
    // Update işlemini yap - select yapmıyoruz (Invoice join'i i.total hatası veriyor)
    const { error, data: updatedDealData } = await updateQuery.select('id, title, stage, status, value, customerId, companyId, updatedAt').single()

    if (error) {
      // lostReason kolonu yoksa hatayı yok say (opsiyonel kolon)
      if (error.message?.includes('lostReason') || error.code === '42703') {
        // lostReason'ı updateData'dan kaldır ve tekrar dene
        const { lostReason, ...updateDataWithoutLostReason } = updateData
        const { error: retryError } = await supabase
          .from('Deal')
          .update(updateDataWithoutLostReason)
          .eq('id', id)
          .eq('companyId', companyId)
        
        if (retryError) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Deals [id] PUT API update error (retry):', {
              error: retryError.message,
              code: retryError.code,
              updateData: updateDataWithoutLostReason,
              dealId: id,
            })
          }
          return NextResponse.json(
            { 
              error: retryError.message || 'Failed to update deal',
            },
            { status: 500 }
          )
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.error('Deals [id] PUT API update error:', {
            error: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
            updateData,
            dealId: id,
          })
        }
        return NextResponse.json(
          { 
            error: error.message || 'Failed to update deal',
            ...(process.env.NODE_ENV === 'development' && {
              details: error,
              code: error.code,
              hint: error.hint,
            }),
          },
          { status: 500 }
        )
      }
    }

    // ActivityLog kaydı - hata olsa bile ana işlem başarılı
    try {
      let activityDescription = `Fırsat güncellendi: ${body.title || existingDeal?.title || 'Fırsat'}`
      
      // Stage değiştiyse özel mesaj
      if (body.stage !== undefined && body.stage !== currentStage) {
        if (body.stage === 'WON') {
          activityDescription = `Fırsat kazanıldı: ${body.title || existingDeal?.title || 'Fırsat'}. Sözleşme otomatik oluşturuldu.`
        } else if (body.stage === 'LOST') {
          activityDescription = `Fırsat kaybedildi: ${body.title || existingDeal?.title || 'Fırsat'}${body.lostReason ? '. Sebep: ' + body.lostReason : ''}`
        } else {
          activityDescription = `Fırsat aşaması değiştirildi: ${currentStage} → ${body.stage}`
        }
      }
      
      // @ts-ignore - Supabase type inference issue with dynamic table names
      await (supabase.from('ActivityLog') as any).insert([
        {
          entity: 'Deal',
          action: body.stage === 'WON' ? 'WON' : body.stage === 'LOST' ? 'LOST' : 'UPDATE',
          description: activityDescription,
          meta: { 
            entity: 'Deal', 
            action: body.stage === 'WON' ? 'won' : body.stage === 'LOST' ? 'lost' : 'update', 
            id,
            ...(body.stage === 'LOST' && body.lostReason && { lostReason: body.lostReason }),
            ...(body.stage && { stage: body.stage, previousStage: currentStage }),
          },
          userId: session.user.id,
          companyId: session.user.companyId,
        },
      ])
    } catch (logError) {
      // ActivityLog hatası ana işlemi etkilemez
      console.error('ActivityLog insert error:', logError)
    }
    
    // Response oluştur - updatedDealData varsa onu kullan, yoksa existingDeal'ı kullan
    const responseData = updatedDealData || existingDeal

    // ÖNEMLİ: Deal CLOSED olduğunda özel ActivityLog ve bildirim
    if (body.status === 'CLOSED' && (existingDeal as any)?.status !== 'CLOSED') {
      try {
        const dealTitle = body.title || (existingDeal as any)?.title || 'Fırsat'
        
        // Özel ActivityLog kaydı
        // @ts-ignore - Supabase type inference issue with dynamic table names
        await (supabase.from('ActivityLog') as any).insert([
          {
            entity: 'Deal',
            action: 'UPDATE',
            description: `Fırsat kapatıldı: ${dealTitle}`,
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
          title: 'Fırsat Kapatıldı',
          message: `${dealTitle} fırsatı kapatıldı. Detayları görmek ister misiniz?`,
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
    
    // ÖNEMLİ: Deal WON olduğunda otomatik Quote oluştur
    if (body.stage === 'WON' && (existingDeal as any)?.stage !== 'WON') {
      try {
        const dealTitle = body.title || (existingDeal as any)?.title || 'Fırsat'
        const dealValue = body.value !== undefined ? body.value : ((existingDeal as any)?.value || 0)
        const dealCustomerId = body.customerId || (existingDeal as any)?.customerId || null
        
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
        const { data: newQuote, error: quoteError } = await (supabase.from('Quote') as any)
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
        
        if (!quoteError && newQuote) {
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
              description: `Fırsat kazanıldığı için otomatik teklif oluşturuldu: ${quoteTitle}`,
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
            title: 'Otomatik Teklif Oluşturuldu',
            message: `${dealTitle} fırsatı kazanıldı. Otomatik olarak ${quoteTitle} teklifi oluşturuldu.`,
            type: 'success',
            relatedTo: 'Quote',
            relatedId: (newQuote as any).id,
          })
        } else if (process.env.NODE_ENV === 'development') {
          console.error('Deal WON → Quote creation error:', quoteError)
        } else if (quote) {
          // ✅ Email otomasyonu: Deal WON → Müşteriye email gönder
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
                  subject: emailTemplate.subject || 'Fırsat Kazanıldı',
                  html: emailTemplate.body,
                })
                
                if (emailResult.success) {
                  if (process.env.NODE_ENV === 'development') {
                    console.log('✅ Deal WON email sent to:', variables.customerEmail)
                  }
                } else {
                  console.error('Deal WON email send error:', emailResult.error)
                }
              }
            }
          } catch (emailError) {
            // Email hatası ana işlemi engellemez
            if (process.env.NODE_ENV === 'development') {
              console.error('Deal WON email automation error:', emailError)
            }
          }
        }
      } catch (autoQuoteError) {
        // Otomatik Quote oluşturma hatası ana işlemi engellemez
        if (process.env.NODE_ENV === 'development') {
          console.error('Deal WON → Auto Quote error:', autoQuoteError)
        }
      }
    }

    // ÖNEMLİ: Deal LOST olduğunda özel ActivityLog ve bildirim
    if (body.stage === 'LOST' && (existingDeal as any)?.stage !== 'LOST') {
      try {
        const dealTitle = body.title || (existingDeal as any)?.title || 'Fırsat'
        
        // Özel ActivityLog kaydı
        // @ts-ignore - Supabase type inference issue with dynamic table names
        await (supabase.from('ActivityLog') as any).insert([
          {
            entity: 'Deal',
            action: 'UPDATE',
            description: `Fırsat kaybedildi: ${dealTitle}`,
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
          title: 'Fırsat Kaybedildi',
          message: `${dealTitle} fırsatı kaybedildi. Detayları görmek ister misiniz?`,
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
    // Update başarılı - güncellenmiş deal'ı manuel oluştur (select yapmıyoruz - Invoice join hatası)
    // Response oluştur - updatedDealData varsa onu kullan, yoksa existingDeal + updateData birleştir
    const updatedDeal = responseData ? {
      ...responseData,
      ...updateData,
    } : {
      id,
      ...updateData,
      ...existingDeal,
    }
    
    // LOST durumunda Task oluşturuldu mu kontrol et
    if (body.stage === 'LOST' && (existingDeal as any)?.stage !== 'LOST') {
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

    if (!session?.user?.companyId) {
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

    // Önce deal'ı kontrol et - koruma kontrolü için
    const { data: deal } = await supabase
      .from('Deal')
      .select('title, stage, status')
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .maybeSingle()

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    // ÖNEMLİ: Delete validation - Stage kontrolü
    const deleteCheck = canDeleteDeal((deal as any)?.stage)
    if (!deleteCheck.canDelete) {
      return NextResponse.json(
        { 
          error: 'Bu fırsat silinemez',
          message: deleteCheck.error,
          reason: 'CANNOT_DELETE_DEAL',
          stage: (deal as any)?.stage,
          alternative: 'Fırsatı kapatmak için durumunu CLOSED yapabilirsiniz'
        },
        { status: 403 }
      )
    }

    // ÖNEMLİ: Deal CLOSED olduğunda silinemez (Kapatılmış fırsat)
    if ((deal as any)?.status === 'CLOSED') {
      return NextResponse.json(
        { 
          error: 'Kapatılmış fırsatlar silinemez',
          message: 'Bu fırsat kapatıldı. Kapatılmış fırsatları silmek mümkün değildir.',
          reason: 'CLOSED_DEAL_CANNOT_BE_DELETED'
        },
        { status: 403 }
      )
    }

    const { error } = await supabase
      .from('Deal')
      .delete()
      .eq('id', id)
      .eq('companyId', session.user.companyId)

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
            description: `Fırsat silindi: ${(deal as any).title}`,
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



