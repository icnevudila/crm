import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { updateRecord } from '@/lib/crud'
import { 
  isValidQuoteTransition, 
  isQuoteImmutable, 
  canDeleteQuote,
  getTransitionErrorMessage
} from '@/lib/stageValidation'

// ✅ %100 KESİN ÇÖZÜM: Cache'i tamamen kapat - her çağrıda fresh data
// ÖNEMLİ: Next.js App Router'ın API route cache'ini tamamen kapat
export const revalidate = 0 // Revalidation'ı kapat
export const dynamic = 'force-dynamic' // Dynamic route - her zaman çalıştır
export const fetchCache = 'force-no-store' // Fetch cache'ini kapat
export const runtime = 'nodejs' // Edge yerine Node zorla (cache sorunlarını önlemek için)

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

    // ✅ ÇÖZÜM: SuperAdmin için companyId kontrolü bypass et
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    if (!isSuperAdmin && !session?.user?.companyId) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    // Permission check - canRead kontrolü
    const { hasPermission, PERMISSION_DENIED_MESSAGE } = await import('@/lib/permissions')
    const canRead = await hasPermission('quote', 'read', session.user.id)
    if (!canRead) {
      return NextResponse.json(
        { error: 'Forbidden', message: PERMISSION_DENIED_MESSAGE },
        { status: 403 }
      )
    }

    const { id } = await params
    const supabase = getSupabaseWithServiceRole()

    // SuperAdmin tüm şirketlerin verilerini görebilir
    // ✅ ÇÖZÜM: SuperAdmin'in companyId'si null olabilir, bu durumda filtreleme yapma
    const companyId = session.user.companyId || null

    // Quote'u sadece gerekli kolonlarla çek (performans için)
    // NOT: createdBy/updatedBy kolonları migration'da yoksa hata verir, bu yüzden kaldırıldı
    let query = supabase
      .from('Quote')
      .select(
        `
        id, title, status, totalAmount, dealId, customerCompanyId, companyId, notes, validUntil, discount, taxRate, createdAt, updatedAt,
        Deal (
          id,
          title,
          Customer (
            id,
            name,
            email,
            phone,
            address
          )
        ),
        Invoice (
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
    }
    
    let { data, error } = await query.maybeSingle()
    
    // Hata varsa (kolon bulunamadı veya foreign key hatası), tekrar dene
    if (error && (error.code === 'PGRST200' || error.message?.includes('Could not find a relationship') || error.message?.includes('does not exist'))) {
      console.warn('Quote GET API: Hata oluştu, tekrar deneniyor...', error.message)
      let queryWithoutJoin = supabase
        .from('Quote')
        .select(
          `
          id, title, status, totalAmount, dealId, customerCompanyId, companyId, notes, validUntil, discount, taxRate, createdAt, updatedAt,
          Deal (
            id,
            title,
            Customer (
              id,
              name,
              email,
              phone,
              address
            )
          ),
          Invoice (
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
      
      const retryResult = await queryWithoutJoin.maybeSingle()
      const retryData: any = retryResult.data
      error = retryResult.error
      
      // createdBy/updatedBy kolonları kaldırıldı, User bilgileri çekilmiyor
      data = retryData
    }

    if (error) {
      console.error('Quote GET error:', error)
      const { getErrorMessage } = await import('@/lib/api-locale')
      return NextResponse.json(
        { error: error.message || getErrorMessage('errors.api.quoteCannotBeFetched', request) },
        { status: 500 }
      )
    }

    if (!data) {
      const { getErrorMessage } = await import('@/lib/api-locale')
      return NextResponse.json(
        { error: getErrorMessage('errors.api.quoteNotFound', request) },
        { status: 404 }
      )
    }

    // DEBUG: SuperAdmin için quote verilerini kontrol et
    if (process.env.NODE_ENV === 'development') {
      console.log('[Quotes [id] API] 🔍 Quote Data Check:', {
        quoteId: id,
        isSuperAdmin,
        companyId,
        hasStatus: !!data.status,
        status: data.status,
        statusType: typeof data.status,
        quoteKeys: Object.keys(data),
      })
    }

    // QuoteItem'ları çek (hata olsa bile devam et)
    // @ts-ignore - Supabase type inference issue with QuoteItem table
    let quoteItems: any[] = []
    try {
      let itemQuery = supabase
        .from('QuoteItem')
        .select('*, Product(id, name, price, stock)')
        .eq('quoteId', id)
      
      // SuperAdmin değilse ve companyId varsa filtrele
      if (!isSuperAdmin && companyId) {
        itemQuery = itemQuery.eq('companyId', companyId)
      }
      
      const { data: items } = await itemQuery.order('createdAt', { ascending: true })
      quoteItems = items || []
    } catch (itemError) {
      // QuoteItem hatası ana işlemi engellemez
      if (process.env.NODE_ENV === 'development') {
        console.error('QuoteItem fetch error:', itemError)
      }
    }

    // ActivityLog'lar KALDIRILDI - Lazy load için ayrı endpoint kullanılacak (/api/activity?entity=Quote&id=...)
    // (Performans optimizasyonu: Detay sayfası daha hızlı açılır, ActivityLog'lar gerektiğinde yüklenir)
    
    return NextResponse.json({
      ...(data as any),
      quoteItems: quoteItems || [],
      activities: [], // Boş array - lazy load için ayrı endpoint kullanılacak
    })
  } catch (error) {
      const { getErrorMessage } = await import('@/lib/api-locale')
      return NextResponse.json(
        { error: getErrorMessage('errors.api.quoteCannotBeFetched', request) },
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

    // Permission check - canUpdate kontrolü
    const { hasPermission, PERMISSION_DENIED_MESSAGE } = await import('@/lib/permissions')
    const canUpdate = await hasPermission('quote', 'update', session.user.id)
    if (!canUpdate) {
      return NextResponse.json(
        { error: 'Forbidden', message: PERMISSION_DENIED_MESSAGE },
        { status: 403 }
      )
    }

    const { id } = await params
    const bodyRaw = await request.json()
    // Güvenlik: createdBy ve updatedBy otomatik dolduruluyor (CRUD fonksiyonunda), body'den alınmamalı
    const { id: bodyId, companyId: bodyCompanyId, createdAt, updatedAt, createdBy, updatedBy, ...body } = bodyRaw
    const supabase = getSupabaseWithServiceRole()

    // ÖNEMLİ: Mevcut quote'u çek - validation için
    // SuperAdmin tüm şirketlerin verilerini görebilir
    const isSuperAdminPUT = session.user.role === 'SUPER_ADMIN'
    let quoteQuery = supabase
      .from('Quote')
      .select('status, title, companyId')
      .eq('id', id)
    
    // SuperAdmin değilse companyId filtresi ekle
    if (!isSuperAdminPUT) {
      quoteQuery = quoteQuery.eq('companyId', session.user.companyId)
    }
    
    const { data: currentQuote, error: quoteError } = await quoteQuery.maybeSingle()

    if (quoteError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Quote fetch error in PUT:', quoteError)
      }
      const { getErrorMessage } = await import('@/lib/api-locale')
      return NextResponse.json(
        { error: getErrorMessage('errors.api.quoteNotFound', request), message: quoteError.message || getErrorMessage('errors.api.quoteCannotBeFetched', request) },
        { status: 404 }
      )
    }

    if (!currentQuote) {
      // Quote bulunamadı - daha detaylı hata mesajı
      if (process.env.NODE_ENV === 'development') {
        console.error('Quote not found in PUT:', {
          quoteId: id,
          companyId: session.user.companyId,
          isSuperAdmin: isSuperAdminPUT,
        })
      }
      return NextResponse.json(
        { 
          error: 'Quote not found',
          message: 'Bu teklif bulunamadı. Silinmiş olabilir veya erişim yetkiniz olmayabilir.',
          quoteId: id
        },
        { status: 404 }
      )
    }

    // CompanyId kontrolü - SuperAdmin değilse ve companyId eşleşmiyorsa hata
    if (!isSuperAdminPUT && (currentQuote as any).companyId !== session.user.companyId) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Quote PUT: Company ID mismatch', {
          quoteId: id,
          quoteCompanyId: (currentQuote as any).companyId,
          sessionCompanyId: session.user.companyId,
        })
      }
      return NextResponse.json(
        { 
          error: 'Quote not found or access denied',
          message: 'Bu teklife erişim yetkiniz yok.'
        },
        { status: 404 }
      )
    }

    // ÖNEMLİ: Immutability kontrol
    const currentStatus = currentQuote?.status
    if (currentStatus && isQuoteImmutable(currentStatus)) {
      return NextResponse.json(
        { 
          error: 'Bu teklif artık değiştirilemez',
          message: `${currentStatus} durumundaki teklifler değiştirilemez (immutable). Fatura oluşturulmuştur.`,
          reason: 'IMMUTABLE_QUOTE',
          status: currentStatus
        },
        { status: 403 }
      )
    }

    // ÖNEMLİ: Status transition validation
    if (body.status !== undefined && body.status !== currentStatus) {
      const validation = isValidQuoteTransition(currentStatus, body.status)
      
      if (!validation.valid) {
        return NextResponse.json(
          { 
            error: 'Geçersiz status geçişi',
            message: validation.error || getTransitionErrorMessage('quote', currentStatus, body.status),
            reason: 'INVALID_STATUS_TRANSITION',
            currentStatus,
            attemptedStatus: body.status,
            allowedTransitions: validation.allowed || []
          },
          { status: 400 }
        )
      }

      // ✅ ACCEPTED veya DECLINED'e geçiş için onay talebi kontrolü
      // Not: Teklif status değişiklikleri için artık onay süreci gerekmiyor
    }

    // Status değiştirme yetkisi kontrolü
    if (body.status !== undefined) {
      const { checkUserPermission } = await import('@/lib/permissions')
      const permissions = await checkUserPermission('quotes')
      
      if (!permissions.canUpdate) {
        return NextResponse.json(
          { error: 'Status değiştirme yetkiniz yok' },
          { status: 403 }
        )
      }
    }

    // Quote verilerini güncelle - SADECE gönderilen alanları güncelle
    // schema.sql: title, status, total, dealId, companyId, updatedAt
    // schema-extension.sql: description, validUntil, discount, taxRate (migration çalıştırılmamış olabilir - GÖNDERME!)
    // schema-vendor.sql: vendorId (migration çalıştırılmamış olabilir - GÖNDERME!)
    // NOT: updatedAt ve updatedBy updateRecord fonksiyonunda otomatik ekleniyor
    const updateData: Record<string, unknown> = {}

    // Sadece gönderilen alanları güncelle (status güncellemesi için sadece status gönderilebilir)
    if (body.title !== undefined) updateData.title = body.title
    if (body.status !== undefined) updateData.status = body.status
    if (body.totalAmount !== undefined) {
      updateData.totalAmount = parseFloat(body.totalAmount)
    } else if (body.total !== undefined) {
      updateData.totalAmount = parseFloat(body.total) // Fallback: total → totalAmount
    }
    if (body.dealId !== undefined) updateData.dealId = body.dealId || null
    if (body.customerCompanyId !== undefined) updateData.customerCompanyId = body.customerCompanyId || null
    // ✅ ÇÖZÜM: notes kolonu migration ile eklendi (057_add_quote_notes.sql)
    if (body.notes !== undefined) {
      updateData.notes = body.notes
    }
    // NOT: description, vendorId, validUntil, discount, taxRate schema-extension'da var ama migration çalıştırılmamış olabilir - GÖNDERME!

    // ✅ %100 KESİN ÇÖZÜM: Service role ile update yap - RLS bypass
    // ÖNEMLİ: Service role zaten RLS bypass ediyor, ama companyId kontrolü yapalım
    // ÖNEMLİ: Önce quote'u kontrol et - companyId eşleşiyor mu?
    const { data: existingQuote, error: checkError } = await supabase
      .from('Quote')
      .select('id, companyId, status')
      .eq('id', id)
      .maybeSingle()

    if (checkError) {
      console.error('Quote check error:', checkError)
      return NextResponse.json({ error: checkError.message }, { status: 500 })
    }

    if (!existingQuote) {
      const { getErrorMessage } = await import('@/lib/api-locale')
      return NextResponse.json({ error: getErrorMessage('errors.api.quoteNotFound', request) }, { status: 404 })
    }

    // ✅ ÇÖZÜM: companyId kontrolü - SuperAdmin değilse companyId eşleşmeli
    if (!isSuperAdminPUT && (existingQuote as any).companyId !== session.user.companyId) {
      const { getErrorMessage } = await import('@/lib/api-locale')
      return NextResponse.json({ error: getErrorMessage('errors.unauthorized', request) }, { status: 403 })
    }

    // updateRecord kullanarak audit trail desteği (updatedBy otomatik eklenir)
    const { getErrorMessage, getMessages, getLocaleFromRequest, getActivityMessage } = await import('@/lib/api-locale')
    const locale = getLocaleFromRequest(request)
    const msgs = getMessages(locale)
    const quoteTitle = body.title || currentQuote?.title || id
    const updateDescription = getActivityMessage(locale, 'quoteUpdated', { title: quoteTitle })
    
    const updateResult = await updateRecord(
      'Quote',
      id,
      updateData,
      updateDescription
    )

    // updateRecord'dan dönen data'yı kontrol et
    if (!updateResult) {
      console.error('Quote update failed: No data returned from updateRecord')
      return NextResponse.json({ error: getErrorMessage('errors.api.quoteCannotBeUpdated', request) }, { status: 500 })
    }
    
    // ✅ %100 KESİN ÇÖZÜM: Update işleminin gerçekten başarılı olup olmadığını kontrol et
    // ÖNEMLİ: Eğer updateResult boşsa, update başarısız demektir
    if (!updateResult || (Array.isArray(updateResult) && updateResult.length === 0)) {
      console.error('Quote update failed: No rows updated', {
        updateData,
        existingQuote,
        id,
        companyId: session.user.companyId,
      })
      return NextResponse.json({ 
        error: 'Quote update failed: No rows updated',
        updateData,
      }, { status: 500 })
    }
    
    // ✅ %100 KESİN ÇÖZÜM: Update sonrası dönen data'da status doğru mu kontrol et
    // ÖNEMLİ: Eğer status yanlışsa, update işlemi başarısız olmuş demektir
    const updatedQuoteFromUpdate = (Array.isArray(updateResult) ? updateResult[0] : updateResult) as any
    if (body.status !== undefined && updatedQuoteFromUpdate.status !== body.status) {
      console.error('Quote update failed: Status mismatch in update result', {
        expected: body.status,
        actual: updatedQuoteFromUpdate.status,
        updateData,
        updateResult,
      })
      return NextResponse.json({ 
        error: 'Quote update failed: Status mismatch in update result',
        expected: body.status,
        actual: updatedQuoteFromUpdate.status,
      }, { status: 500 })
    }
    
    // ✅ ÇÖZÜM: Update başarılı oldu, updateData'yı log'la
    if (process.env.NODE_ENV === 'development') {
      console.log('Quote update data sent:', updateData)
      console.log('Quote update result:', updateResult)
      console.log('Existing quote before update:', existingQuote)
    }
    
    // ✅ %100 KESİN ÇÖZÜM: Update başarılı oldu, şimdi güncellenmiş veriyi çek
    // ÖNEMLİ: updatedAt'in gerçekten güncellendiğini kontrol et
    // ÖNEMLİ: Update sonrası ayrı select yap - RLS policy'si select'e izin verebilir
    // OPTİMİZE: Bekleme kaldırıldı - trigger'lar zaten anında çalışır (performans için)
    // await new Promise(resolve => setTimeout(resolve, 200)) // KALDIRILDI - gereksiz gecikme
    
    let query = supabase
      .from('Quote')
      .select('*')
      .eq('id', id)
    
    if (!isSuperAdminPUT) {
      query = query.eq('companyId', session.user.companyId)
    }
    
    let { data, error: fetchError } = await query.maybeSingle()
    
    if (fetchError) {
      console.error('Quote fetch after update error:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Quote bulunamadı veya güncellenemedi' }, { status: 404 })
    }
    
    // ✅ %100 KESİN ÇÖZÜM: Update sonrası dönen data'da status doğru mu kontrol et
    // ÖNEMLİ: Eğer status yanlışsa, update işlemi başarısız olmuş demektir
    // ÖNEMLİ: Status yanlışsa kesinlikle hata döndür - 200 dönmemeli
    if (body.status !== undefined && (data as any).status !== body.status) {
      console.error('Quote update failed: Status mismatch after update', {
        expected: body.status,
        actual: (data as any).status,
        updateData,
        fetchedData: data,
      })
      
      // ✅ ÇÖZÜM: Update işlemini tekrar dene - belki trigger veya RLS policy'si engelliyor
      // ÖNEMLİ: İlk deneme başarısız oldu, tekrar dene
      const retryUpdate = await supabase
        .from('Quote')
        // @ts-ignore
        .update(updateData)
        .eq('id', id)
        .eq('companyId', session.user.companyId)
      
      if (retryUpdate.error) {
        console.error('Quote update retry failed:', retryUpdate.error)
        return NextResponse.json({ 
          error: 'Quote update failed: Status mismatch after update',
          expected: body.status,
          actual: (data as any).status,
          retryError: (retryUpdate.error as any).message,
        }, { status: 500 })
      }
      
      // OPTİMİZE: Bekleme kaldırıldı - anında kontrol et (performans için)
      // await new Promise(resolve => setTimeout(resolve, 200)) // KALDIRILDI - gereksiz gecikme
      let retryQuery = supabase
        .from('Quote')
        .select('*')
        .eq('id', id)
      
      if (!isSuperAdminPUT) {
        retryQuery = retryQuery.eq('companyId', session.user.companyId)
      }
      
      const retryResult = await retryQuery.maybeSingle()
      const retryData = retryResult.data as any
      
      if (retryData && retryData.status === body.status) {
        // ✅ ÇÖZÜM: Retry başarılı, retryData'yı kullan
        data = retryData
      } else {
        // ❌ Retry de başarısız, kesinlikle hata döndür
        console.error('Quote update retry failed: Status still incorrect', {
          expected: body.status,
          actual: (data as any).status,
          retryActual: retryData?.status,
        })
        return NextResponse.json({ 
          error: 'Quote update failed: Status mismatch after update and retry',
          expected: body.status,
          actual: (data as any).status,
          retryActual: retryData?.status,
        }, { status: 500 })
      }
    }
    
    // ✅ ÇÖZÜM: updatedAt'in gerçekten güncellendiğini log'la
    if (process.env.NODE_ENV === 'development' && data) {
      console.log('Quote updated successfully:', {
        id,
        status: (data as any).status,
        updatedAt: (data as any).updatedAt,
        previousUpdatedAt: updateData.updatedAt,
        updateData: updateData, // ✅ ÇÖZÜM: updateData'yı log'la - status var mı kontrol et
        bodyStatus: body.status, // ✅ ÇÖZÜM: body.status'u log'la - gönderilen status'u kontrol et
      })
    }

    if (fetchError) {
      console.error('Quote fetch after update error:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!data) {
      const { getErrorMessage } = await import('@/lib/api-locale')
      return NextResponse.json({ error: getErrorMessage('errors.api.quoteNotFoundOrDeleted', request) }, { status: 404 })
    }

    // Otomasyon bilgilerini sakla (response'a eklemek için)
    const automationInfo: any = {}
    
    // Quote ACCEPTED olduğunda otomatik Invoice oluştur
    if (body.status === 'ACCEPTED' && data) {
      const { getMessages, getLocaleFromRequest } = await import('@/lib/api-locale')
      const localeForInvoice = getLocaleFromRequest(request)
      const msgsForInvoice = getMessages(localeForInvoice)
      const { getActivityMessage: getActivityMessageForInvoice } = await import('@/lib/api-locale')
      const invoiceTitle = getActivityMessageForInvoice(localeForInvoice, 'invoiceTitlePrefix', { title: (data as any).title || getActivityMessageForInvoice(localeForInvoice, 'defaultQuoteTitle') })
      
      const invoiceData = {
        title: invoiceTitle,
        status: 'DRAFT',
        totalAmount: (data as any).totalAmount || 0,
        quoteId: (data as any).id,
        companyId: session.user.companyId,
      }
      
      const { data: invoice, error: invoiceError } = await supabase
        .from('Invoice')
        // @ts-ignore - Supabase database type tanımları eksik, insert metodu dinamik tip bekliyor
        .insert([invoiceData])
        .select()
        .maybeSingle() // .single() yerine .maybeSingle() kullan - hata vermez, sadece null döner

      if (invoiceError) {
        console.error('Invoice creation error:', invoiceError)
        // Invoice oluşturma hatası ana işlemi engellemez, sadece log'la
      } else if (invoice) {
        // Otomasyon bilgilerini sakla
        automationInfo.invoiceId = (invoice as any).id
        automationInfo.invoiceCreated = true
        automationInfo.invoiceTitle = invoiceData.title
        automationInfo.invoiceNumber = (invoice as any).invoiceNumber || null
        // ✅ Email otomasyonu: Quote ACCEPTED → Müşteriye email gönder
        try {
          const { getAndRenderEmailTemplate, getTemplateVariables } = await import('@/lib/template-renderer')
          const { sendEmail } = await import('@/lib/email-service')
          
          // Template değişkenlerini hazırla
          const variables = await getTemplateVariables('Quote', data, session.user.companyId)
          
          // Email template'ini çek ve render et
          const emailTemplate = await getAndRenderEmailTemplate('QUOTE', session.user.companyId, variables)
          
          if (emailTemplate && variables.customerEmail) {
            // Email gönder
            const emailResult = await sendEmail({
              to: variables.customerEmail as string,
              subject: emailTemplate.subject || msgsForInvoice.activity.quoteAcceptedEmailSubject,
              html: emailTemplate.body,
            })
            
            if (emailResult.success) {
              if (process.env.NODE_ENV === 'development') {
                console.log('✅ Quote ACCEPTED email sent to:', variables.customerEmail)
              }
            } else {
              console.error('Quote ACCEPTED email send error:', emailResult.error)
            }
          }
        } catch (emailError) {
          // Email hatası ana işlemi engellemez
          if (process.env.NODE_ENV === 'development') {
            console.error('Quote ACCEPTED email automation error:', emailError)
          }
        }
      }

      if (invoice) {
        // ActivityLog kaydı
        // msgsForActivity zaten yukarıda tanımlanmış (satır 659), tekrar tanımlamaya gerek yok
        
        const activityData = {
          entity: 'Invoice',
          action: 'CREATE',
          description: msgsForInvoice.activity.quoteAcceptedInvoiceCreated,
          meta: { entity: 'Invoice', action: 'create', id: (invoice as any).id, fromQuote: (data as any).id },
          userId: session.user.id,
          companyId: session.user.companyId,
        }
        
        // @ts-ignore - Supabase database type tanımları eksik, insert metodu dinamik tip bekliyor
        await supabase.from('ActivityLog').insert([activityData])

        // Bildirim: Fatura oluşturuldu
        const { createNotificationForRole } = await import('@/lib/notification-helper')
        await createNotificationForRole({
          companyId: session.user.companyId,
          role: ['ADMIN', 'SALES', 'SUPER_ADMIN'],
          title: msgs.activity.invoiceCreated,
          message: msgs.activity.invoiceCreatedMessage,
          type: 'success',
          relatedTo: 'Invoice',
          relatedId: (invoice as any).id,
        })
      }
    }

    // AutoNoteOnEdit: Değişiklik günlüğü - fiyat güncellemeleri
    // msgs zaten yukarıda tanımlanmış (satır 420), tekrar tanımlamaya gerek yok
    
    let changeDescription = ''
    if (body.status) {
      changeDescription = getActivityMessage(locale, 'quoteStatusUpdated', { status: body.status })
    } else if (body.totalAmount !== undefined && (data as any)?.totalAmount !== undefined) {
      const oldTotal = parseFloat((data as any).totalAmount) || 0
      const newTotal = parseFloat(body.totalAmount) || 0
      if (oldTotal !== newTotal) {
        const localeStr = locale === 'en' ? 'en-US' : 'tr-TR'
        const currency = locale === 'en' ? 'USD' : 'TRY'
        changeDescription = getActivityMessage(locale, 'quotePriceUpdated', { 
          oldTotal: oldTotal.toLocaleString(localeStr, { style: 'currency', currency }),
          newTotal: newTotal.toLocaleString(localeStr, { style: 'currency', currency })
        })
      } else {
        const quoteTitle = body.title || (data as any)?.title || getActivityMessage(locale, 'defaultQuoteTitle')
        changeDescription = getActivityMessage(locale, 'quoteUpdated', { title: quoteTitle })
      }
    } else {
      const quoteTitle = body.title || (data as any)?.title || getActivityMessage(locale, 'defaultQuoteTitle')
      changeDescription = getActivityMessage(locale, 'quoteUpdated', { title: quoteTitle })
    }

    // ÖNEMLİ: Quote DECLINED olduğunda özel ActivityLog ve bildirim
    if (body.status === 'DECLINED' && (data as any)?.status !== 'DECLINED') {
      try {
        const quoteTitle = body.title || (data as any)?.title || getActivityMessage(locale, 'defaultQuoteTitle')
        
        // Özel ActivityLog kaydı
        const declinedActivityData = {
          entity: 'Quote',
          action: 'UPDATE',
          description: getActivityMessage(locale, 'quoteRejected', { title: quoteTitle }),
          meta: { 
            entity: 'Quote', 
            action: 'declined', 
            id, 
            quoteId: id,
            declinedAt: new Date().toISOString()
          },
          userId: session.user.id,
          companyId: session.user.companyId,
        }
        
        // @ts-ignore - Supabase database type tanımları eksik, insert metodu dinamik tip bekliyor
        await supabase.from('ActivityLog').insert([declinedActivityData])

        // Bildirim: Teklif reddedildi
        const { createNotificationForRole } = await import('@/lib/notification-helper')
        await createNotificationForRole({
          companyId: session.user.companyId,
          role: ['ADMIN', 'SALES', 'SUPER_ADMIN'],
          title: msgs.activity.quoteRejectedTitle,
          message: getActivityMessage(locale, 'quoteRejectedMessage', { title: quoteTitle }),
          type: 'warning',
          relatedTo: 'Quote',
          relatedId: id,
        })
      } catch (activityError) {
        // ActivityLog hatası ana işlemi engellemez
        if (process.env.NODE_ENV === 'development') {
          console.error('Quote DECLINED ActivityLog error:', activityError)
        }
      }
    }

    // ActivityLog kaydı
    const activityData = {
      entity: 'Quote',
      action: 'UPDATE',
      description: changeDescription,
      meta: {
        entity: 'Quote',
        action: 'update',
        id,
        status: body.status || null,
        oldTotal: body.totalAmount !== undefined ? (data as any)?.totalAmount : null,
        newTotal: body.totalAmount !== undefined ? body.totalAmount : null,
      },
      userId: session.user.id,
      companyId: session.user.companyId,
    }

    await supabase.from('ActivityLog').insert([activityData])

    // Bildirim: Teklif güncellendi (sadece önemli değişiklikler için)
    if (body.status || (body.totalAmount !== undefined && (data as any)?.totalAmount !== undefined)) {
      try {
        const { createNotificationForRole } = await import('@/lib/notification-helper')
        const viewDetailsMsg = locale === 'en' ? ' Would you like to view details?' : ' Detayları görmek ister misiniz?'
        await createNotificationForRole({
          companyId: session.user.companyId,
          role: ['ADMIN', 'SALES', 'SUPER_ADMIN'],
          title: msgs.activity.quoteUpdatedTitle,
          message: changeDescription + viewDetailsMsg,
          type: 'info',
          relatedTo: 'Quote',
          relatedId: id,
        })
      } catch (notificationError) {
        // Bildirim hatası ana işlemi engellemez
      }
    }

    // REJECTED/DECLINED durumunda Task oluşturuldu mu kontrol et ve Notification gönder
    if ((body.status === 'REJECTED' || body.status === 'DECLINED') && (data as any)?.status !== body.status) {
      try {
        // REJECTED notification gönder
        const { createNotificationForRole } = await import('@/lib/notification-helper')
        const rejectedQuoteTitle = (data as any)?.title || getActivityMessage(locale, 'defaultQuoteTitle')
        await createNotificationForRole({
          companyId: session.user.companyId,
          role: ['ADMIN', 'SALES', 'SUPER_ADMIN'],
          title: msgs.activity.quoteRejectedWarningTitle,
          message: getActivityMessage(locale, 'quoteRejectedWarningMessage', { title: rejectedQuoteTitle }),
          type: 'warning',
          priority: 'high',
          relatedTo: 'Quote',
          relatedId: id,
        }).catch(() => {}) // Notification hatası ana işlemi engellemez

        const { data: tasks } = await supabase
          .from('Task')
          .select('id')
          .eq('relatedTo', `Quote: ${id}`)
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
    
    // ✅ %100 KESİN ÇÖZÜM: Cache-Control header'ları ekle - Next.js ve browser cache'ini kapat
    // ÖNEMLİ: API response'da cache'i tamamen kapat - refresh sonrası kesinlikle fresh data çekilsin
    return NextResponse.json({
      ...data,
      automation: automationInfo,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error: any) {
    console.error('Quote PUT error:', error)
    return NextResponse.json(
      { 
        error: error?.message || 'Teklif güncellenemedi',
        details: error?.details || error?.hint || null,
        code: error?.code || null
      },
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
    const { hasPermission, PERMISSION_DENIED_MESSAGE } = await import('@/lib/permissions')
    const canDelete = await hasPermission('quote', 'delete', session.user.id)
    if (!canDelete) {
      return NextResponse.json(
        { error: 'Forbidden', message: PERMISSION_DENIED_MESSAGE },
        { status: 403 }
      )
    }

    const { id } = await params
    const supabase = getSupabaseWithServiceRole()

    // Debug: Gelen parametreleri logla
    if (process.env.NODE_ENV === 'development') {
      console.log('Quote DELETE request:', {
        quoteId: id,
        companyId: session.user.companyId,
        userId: session.user.id,
      })
    }

    // Önce quote'u kontrol et - ActivityLog için title lazım ve ACCEPTED kontrolü için
    const { data: quote, error: fetchError } = await supabase
      .from('Quote')
      .select('id, title, companyId, status')
      .eq('id', id)
      .maybeSingle() // .single() yerine .maybeSingle() kullan - hata vermez, sadece null döner

    // Debug: Quote kontrolü sonucu
    if (process.env.NODE_ENV === 'development') {
      console.log('Quote fetch result:', {
        quote,
        fetchError,
        quoteCompanyId: quote?.companyId,
        sessionCompanyId: session.user.companyId,
        match: quote?.companyId === session.user.companyId,
      })
    }

    // CompanyId kontrolü - quote varsa ama companyId eşleşmiyorsa hata döndür
    if (quote && quote.companyId !== session.user.companyId) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Quote DELETE: Company ID mismatch', {
          quoteId: id,
          quoteCompanyId: quote.companyId,
          sessionCompanyId: session.user.companyId,
        })
      }
      return NextResponse.json({ error: 'Quote not found or access denied' }, { status: 404 })
    }

    // ÖNEMLİ: Delete validation - Status kontrolü
    const deleteCheck = canDeleteQuote(quote?.status)
    if (!deleteCheck.canDelete) {
      // İlgili Invoice'ı kontrol et (kullanıcıya bilgi vermek için)
      const { data: relatedInvoice } = await supabase
        .from('Invoice')
        .select('id, title')
        .eq('quoteId', id)
        .eq('companyId', session.user.companyId)
        .maybeSingle()

      const { getErrorMessage } = await import('@/lib/api-locale')
      return NextResponse.json(
        { 
          error: getErrorMessage('errors.api.quoteCannotBeDeleted', request),
          message: deleteCheck.error,
          reason: 'CANNOT_DELETE_QUOTE',
          status: quote?.status,
          relatedInvoice: relatedInvoice ? {
            id: relatedInvoice.id,
            title: relatedInvoice.title,
            link: `/invoices/${relatedInvoice.id}`
          } : null
        },
        { status: 403 }
      )
    }

    // Silme işlemini yap - data kontrolü ile
    // ÖNEMLİ: companyId kontrolünü burada da yapıyoruz (güvenlik için)
    const { data: deletedData, error: deleteError } = await supabase
      .from('Quote')
      .delete()
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .select()

    if (deleteError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Quote DELETE error:', deleteError)
      }
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // Silme işleminin başarılı olduğunu kontrol et
    if (!deletedData || deletedData.length === 0) {
      // Quote'u companyId olmadan da kontrol et - belki companyId yanlış
      const { data: quoteWithoutCompany } = await supabase
        .from('Quote')
        .select('id, companyId')
        .eq('id', id)
        .maybeSingle()

      if (process.env.NODE_ENV === 'development') {
        console.error('Quote DELETE: No data deleted', {
          quoteId: id,
          companyId: session.user.companyId,
          deletedData,
          quoteExists: !!quoteWithoutCompany,
          quoteCompanyId: quoteWithoutCompany?.companyId,
          match: quoteWithoutCompany?.companyId === session.user.companyId,
        })
      }
      const { getErrorMessage } = await import('@/lib/api-locale')
      return NextResponse.json({ error: getErrorMessage('errors.api.quoteNotFoundOrDeleted', request) }, { status: 404 })
    }

    // Debug: Silme işleminin başarılı olduğunu logla
    if (process.env.NODE_ENV === 'development') {
      console.log('Quote DELETE success:', {
        quoteId: id,
        deletedCount: deletedData.length,
        deletedQuote: deletedData[0],
      })
    }

    // ActivityLog kaydı - hata olsa bile ana işlem başarılı
    // quote null olabilir (maybeSingle() kullandık), o yüzden deletedData'dan title al
    try {
      const { getMessages, getLocaleFromRequest, getActivityMessage } = await import('@/lib/api-locale')
      const deleteLocale = getLocaleFromRequest(request)
      const deleteMsgs = getMessages(deleteLocale)
      const quoteTitle = quote?.title || deletedData[0]?.title || getActivityMessage(deleteLocale, 'defaultQuoteTitle')
      const activityData = {
        entity: 'Quote',
        action: 'DELETE',
        description: getActivityMessage(deleteLocale, 'quoteDeleted', { title: quoteTitle }),
        meta: { entity: 'Quote', action: 'delete', id },
        userId: session.user.id,
        companyId: session.user.companyId,
      }
      
      await supabase.from('ActivityLog').insert([activityData])
    } catch (logError) {
      // ActivityLog hatası ana işlemi etkilemez
      if (process.env.NODE_ENV === 'development') {
        console.error('ActivityLog insert error:', logError)
      }
    }

    return NextResponse.json({ 
      success: true,
      deletedCount: deletedData.length,
      deletedQuote: deletedData[0],
    })
  } catch (error: any) {
    // Detaylı hata mesajı - development'ta daha fazla bilgi
    if (process.env.NODE_ENV === 'development') {
      console.error('Quote DELETE catch error:', error)
    }
    return NextResponse.json(
      { 
        error: 'Teklif silinemedi',
        ...(process.env.NODE_ENV === 'development' && {
          message: error?.message || 'Bilinmeyen hata',
          stack: error?.stack,
        }),
      },
      { status: 500 }
    )
  }
}







