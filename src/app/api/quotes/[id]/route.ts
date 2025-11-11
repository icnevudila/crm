import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
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
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Quotes [id] GET API session error:', sessionError)
      }
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Failed to get session' },
        { status: 500 }
      )
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    // Permission check - canRead kontrolü
    const { hasPermission } = await import('@/lib/permissions')
    const canRead = await hasPermission('quote', 'read', session.user.id)
    if (!canRead) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Teklif görüntüleme yetkiniz yok' },
        { status: 403 }
      )
    }

    const { id } = await params
    const supabase = getSupabaseWithServiceRole()

    // SuperAdmin tüm şirketlerin verilerini görebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId

    // Quote'u ilişkili verilerle çek
    let query = supabase
      .from('Quote')
      .select(
        `
        *,
        Deal (
          id,
          title,
          Customer (
            id,
            name,
            email
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
    
    // SuperAdmin değilse companyId filtresi ekle
    if (!isSuperAdmin) {
      query = query.eq('companyId', companyId)
    }
    
    const { data, error } = await query.maybeSingle() // .single() yerine .maybeSingle() kullan - hata vermez, sadece null döner

    if (error) {
      console.error('Quote GET error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to fetch quote' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Quote bulunamadı' },
        { status: 404 }
      )
    }

    // QuoteItem'ları çek (hata olsa bile devam et)
    // @ts-ignore - Supabase type inference issue with QuoteItem table
    let quoteItems: any[] = []
    try {
      let itemQuery = supabase
        .from('QuoteItem')
        .select('*, Product(id, name, price, stock)')
        .eq('quoteId', id)
      
      // SuperAdmin değilse companyId filtresi ekle
      if (!isSuperAdmin) {
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

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Quote API error:', error)
      }
      // Eğer kayıt bulunamadıysa 404, diğer hatalar için 500
      if (error.code === 'PGRST116' || error.message?.includes('No rows')) {
        return NextResponse.json({ error: 'Teklif bulunamadı' }, { status: 404 })
      }
      return NextResponse.json(
        { error: error.message || 'Teklif yüklenirken bir hata oluştu' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json({ error: 'Teklif bulunamadı' }, { status: 404 })
    }

    // ActivityLog'ları çek
    let activityQuery = supabase
      .from('ActivityLog')
      .select(
        `
        *,
        User (
          name,
          email
        )
      `
      )
      .eq('entity', 'Quote')
      .eq('meta->>id', id)
    
    // SuperAdmin değilse companyId filtresi ekle
    if (!isSuperAdmin) {
      activityQuery = activityQuery.eq('companyId', companyId)
    }
    
    const { data: activities } = await activityQuery
      .order('createdAt', { ascending: false })
      .limit(20)

    return NextResponse.json({
      ...(data as any),
      quoteItems: quoteItems || [],
      activities: activities || [],
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch quote' },
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
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Quotes [id] PUT API session error:', sessionError)
      }
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Failed to get session' },
        { status: 500 }
      )
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canUpdate kontrolü
    const { hasPermission } = await import('@/lib/permissions')
    const canUpdate = await hasPermission('quote', 'update', session.user.id)
    if (!canUpdate) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Teklif güncelleme yetkiniz yok' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
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
      return NextResponse.json(
        { error: 'Quote not found', message: quoteError.message || 'Failed to fetch quote' },
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
      if ((body.status === 'ACCEPTED' || body.status === 'DECLINED') && currentStatus === 'SENT') {
        const resolvedParams = await params
        const quoteId = resolvedParams.id
        
        // Zaten onay talebi var mı kontrol et
        const { data: existingApproval } = await supabase
          .from('ApprovalRequest')
          .select('id, status')
          .eq('relatedTo', 'Quote')
          .eq('relatedId', quoteId)
          .eq('status', 'PENDING')
          .maybeSingle()

        // Eğer onay talebi yoksa oluştur
        if (!existingApproval) {
          // Manager'ları bul (ADMIN ve SUPER_ADMIN rolleri)
          const { data: managers } = await supabase
            .from('User')
            .select('id')
            .eq('companyId', session.user.companyId)
            .in('role', ['ADMIN', 'SUPER_ADMIN'])
            .eq('status', 'ACTIVE')

          if (managers && managers.length > 0) {
            const managerIds = managers.map((m: any) => m.id)
            
            // Onay talebi oluştur
            const { data: approvalRequest, error: approvalError } = await supabase
              .from('ApprovalRequest')
              .insert({
                title: `Teklif ${body.status === 'ACCEPTED' ? 'Onay' : 'Red'} Talebi: ${(currentQuote as any)?.title || 'Teklif'}`,
                description: `Teklif durumu ${body.status === 'ACCEPTED' ? 'Kabul Edildi' : 'Reddedildi'} olarak değiştirilmek isteniyor.`,
                relatedTo: 'Quote',
                relatedId: quoteId,
                requestedBy: session.user.id,
                approverIds: managerIds,
                priority: 'HIGH',
                status: 'PENDING',
                companyId: session.user.companyId,
              } as any)
              .select()
              .single()

            if (approvalError) {
              console.error('Approval request creation error:', approvalError)
            }

            // Onay talebi oluşturuldu, status değişikliğini engelle
            return NextResponse.json(
              {
                error: 'Onay talebi oluşturuldu',
                message: `Teklif durumu değiştirmek için onay gerekiyor. Onay talebi oluşturuldu ve yöneticilere bildirildi.`,
                reason: 'APPROVAL_REQUIRED',
                approvalRequestId: (approvalRequest as any)?.id,
                currentStatus,
                attemptedStatus: body.status,
              },
              { status: 202 } // 202 Accepted - Onay talebi oluşturuldu
            )
          }
        } else {
          // Onay talebi var ama henüz onaylanmamış
          return NextResponse.json(
            {
              error: 'Onay bekleniyor',
              message: `Bu teklif için zaten bir onay talebi var ve henüz onaylanmadı. Lütfen onaylar sayfasından kontrol edin.`,
              reason: 'APPROVAL_PENDING',
              approvalRequestId: (existingApproval as any)?.id,
              currentStatus,
              attemptedStatus: body.status,
            },
            { status: 403 }
          )
        }
      }
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
    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    }

    // Sadece gönderilen alanları güncelle (status güncellemesi için sadece status gönderilebilir)
    if (body.title !== undefined) updateData.title = body.title
    if (body.status !== undefined) updateData.status = body.status
    if (body.totalAmount !== undefined) {
      updateData.totalAmount = parseFloat(body.totalAmount)
    } else if (body.total !== undefined) {
      updateData.totalAmount = parseFloat(body.total) // Fallback: total → totalAmount
    }
    if (body.dealId !== undefined) updateData.dealId = body.dealId || null
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
      return NextResponse.json({ error: 'Quote bulunamadı' }, { status: 404 })
    }

    // ✅ ÇÖZÜM: companyId kontrolü - SuperAdmin değilse companyId eşleşmeli
    if (!isSuperAdminPUT && (existingQuote as any).companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
    }

    // ✅ %100 KESİN ÇÖZÜM: Service role ile update yap - RLS bypass
    // ÖNEMLİ: Service role zaten RLS bypass ediyor, companyId kontrolünü kaldıralım
    // ÖNEMLİ: Sadece id ile update yap - service role zaten RLS bypass ediyor
    const { data: updateResult, error: updateError } = await supabase
      .from('Quote')
      // @ts-ignore - Supabase database type tanımları eksik, update metodu dinamik tip bekliyor
      .update(updateData)
      .eq('id', id)
      .select('id, status, updatedAt') // ✅ ÇÖZÜM: Update sonrası data döndür

    if (updateError) {
      console.error('Quote update error:', updateError)
      console.error('Quote update data:', updateData)
      console.error('Existing quote:', existingQuote)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }
    
    // ✅ %100 KESİN ÇÖZÜM: Update işleminin gerçekten başarılı olup olmadığını kontrol et
    // ÖNEMLİ: Eğer updateResult boşsa, update başarısız demektir
    if (!updateResult || updateResult.length === 0) {
      console.error('Quote update failed: No rows updated', {
        updateData,
        updateError,
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
    const updatedQuoteFromUpdate = updateResult[0] as any
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
    // ✅ ÇÖZÜM: Update sonrası kısa bir bekleme ekle - trigger'ların çalışması için
    // ÖNEMLİ: Supabase trigger'ları asenkron çalışabilir, kısa bir bekleme ekle
    await new Promise(resolve => setTimeout(resolve, 200)) // 200ms bekle - trigger'ların çalışması için
    
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
      
      // ✅ ÇÖZÜM: Retry sonrası tekrar kontrol et
      await new Promise(resolve => setTimeout(resolve, 200)) // 200ms bekle
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
      return NextResponse.json({ error: 'Quote bulunamadı veya güncellenemedi' }, { status: 404 })
    }

    // Quote ACCEPTED olduğunda otomatik Invoice oluştur
    if (body.status === 'ACCEPTED' && data) {
      const invoiceData = {
        title: `Fatura - ${(data as any).title}`,
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
              subject: emailTemplate.subject || 'Teklifiniz Kabul Edildi',
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
        const activityData = {
          entity: 'Invoice',
          action: 'CREATE',
          description: `Teklif kabul edildi, fatura oluşturuldu`,
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
          title: 'Fatura Oluşturuldu',
          message: `Teklif kabul edildi ve fatura oluşturuldu. Faturayı görmek ister misiniz?`,
          type: 'success',
          relatedTo: 'Invoice',
          relatedId: (invoice as any).id,
        })
      }
    }

    // AutoNoteOnEdit: Değişiklik günlüğü - fiyat güncellemeleri
    let changeDescription = ''
    if (body.status) {
      changeDescription = `Teklif durumu güncellendi: ${body.status}`
    } else if (body.totalAmount !== undefined && (data as any)?.totalAmount !== undefined) {
      const oldTotal = parseFloat((data as any).totalAmount) || 0
      const newTotal = parseFloat(body.totalAmount) || 0
      if (oldTotal !== newTotal) {
        changeDescription = `Fiyat güncellendi (eski: ${oldTotal.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })} → yeni: ${newTotal.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })})`
      } else {
        changeDescription = `Teklif güncellendi: ${body.title || (data as any)?.title || 'Teklif'}`
      }
    } else {
      changeDescription = `Teklif güncellendi: ${body.title || (data as any)?.title || 'Teklif'}`
    }

    // ÖNEMLİ: Quote DECLINED olduğunda özel ActivityLog ve bildirim
    if (body.status === 'DECLINED' && (data as any)?.status !== 'DECLINED') {
      try {
        const quoteTitle = body.title || (data as any)?.title || 'Teklif'
        
        // Özel ActivityLog kaydı
        const declinedActivityData = {
          entity: 'Quote',
          action: 'UPDATE',
          description: `Teklif reddedildi: ${quoteTitle}`,
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
          title: 'Teklif Reddedildi',
          message: `${quoteTitle} teklifi reddedildi. Detayları görmek ister misiniz?`,
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

    // @ts-expect-error - Supabase database type tanımları eksik, insert metodu dinamik tip bekliyor
    await supabase.from('ActivityLog').insert([activityData])

    // Bildirim: Teklif güncellendi (sadece önemli değişiklikler için)
    if (body.status || (body.totalAmount !== undefined && (data as any)?.totalAmount !== undefined)) {
      try {
        const { createNotificationForRole } = await import('@/lib/notification-helper')
        await createNotificationForRole({
          companyId: session.user.companyId,
          role: ['ADMIN', 'SALES', 'SUPER_ADMIN'],
          title: 'Teklif Güncellendi',
          message: changeDescription + ' Detayları görmek ister misiniz?',
          type: 'info',
          relatedTo: 'Quote',
          relatedId: id,
        })
      } catch (notificationError) {
        // Bildirim hatası ana işlemi engellemez
      }
    }

    // ✅ %100 KESİN ÇÖZÜM: Cache-Control header'ları ekle - Next.js ve browser cache'ini kapat
    // ÖNEMLİ: API response'da cache'i tamamen kapat - refresh sonrası kesinlikle fresh data çekilsin
    return NextResponse.json(data, {
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
        error: error?.message || 'Failed to update quote',
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
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Quotes [id] DELETE API session error:', sessionError)
      }
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Failed to get session' },
        { status: 500 }
      )
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canDelete kontrolü
    const { hasPermission } = await import('@/lib/permissions')
    const canDelete = await hasPermission('quote', 'delete', session.user.id)
    if (!canDelete) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Teklif silme yetkiniz yok' },
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

      return NextResponse.json(
        { 
          error: 'Bu teklif silinemez',
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
      return NextResponse.json({ error: 'Quote not found or could not be deleted' }, { status: 404 })
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
      const quoteTitle = quote?.title || deletedData[0]?.title || 'Teklif'
      const activityData = {
        entity: 'Quote',
        action: 'DELETE',
        description: `Teklif silindi: ${quoteTitle}`,
        meta: { entity: 'Quote', action: 'delete', id },
        userId: session.user.id,
        companyId: session.user.companyId,
      }
      
      // @ts-expect-error - Supabase database type tanımları eksik, insert metodu dinamik tip bekliyor
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
        error: 'Failed to delete quote',
        ...(process.env.NODE_ENV === 'development' && {
          message: error?.message || 'Unknown error',
          stack: error?.stack,
        }),
      },
      { status: 500 }
    )
  }
}




