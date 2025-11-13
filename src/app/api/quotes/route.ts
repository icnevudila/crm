import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Dengeli cache - 60 saniye revalidate (performans + veri güncelliği dengesi)
export const revalidate = 60

export async function GET(request: Request) {
  try {
    // Session kontrolü - cache ile (30 dakika cache - çok daha hızlı!)
    const { session, error: sessionError } = await getSafeSession(request)
    
    if (sessionError) {
      return sessionError
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // DEBUG: Session ve permission bilgisini logla
    if (process.env.NODE_ENV === 'development') {
      console.log('[Quotes API] 🔍 Session Check:', {
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role,
        companyId: session.user.companyId,
        companyName: session.user.companyName,
      })
    }

    // Permission check - canRead kontrolü
    const { hasPermission, PERMISSION_DENIED_MESSAGE } = await import('@/lib/permissions')
    const canRead = await hasPermission('quote', 'read', session.user.id)
    if (!canRead) {
      // DEBUG: Permission denied logla
      if (process.env.NODE_ENV === 'development') {
        console.log('[Quotes API] ❌ Permission Denied:', {
          module: 'quote',
          action: 'read',
          userId: session.user.id,
          role: session.user.role,
        })
      }
      return NextResponse.json(
        { error: 'Forbidden', message: PERMISSION_DENIED_MESSAGE },
        { status: 403 }
      )
    }

    // SuperAdmin tüm şirketlerin verilerini görebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId
    const supabase = getSupabaseWithServiceRole()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const customerCompanyId = searchParams.get('customerCompanyId') || ''
    const filterCompanyId = searchParams.get('filterCompanyId') || '' // SuperAdmin için firma filtresi

    // Pagination parametreleri
    const all = searchParams.get('all') === 'true' // Raporlama için tüm veriler
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10) // Default 20 kayıt/sayfa

    // OPTİMİZE: Sadece gerekli kolonları seç - performans için
    // SuperAdmin için Company bilgisi ekle
    let query = supabase
      .from('Quote')
      .select(`
        id, title, status, totalAmount, dealId, createdAt, companyId, customerCompanyId,
        Company:companyId (
          id,
          name
        )
      `, { count: 'exact' })
      .order('createdAt', { ascending: false })
    
    // ÖNCE companyId filtresi (SuperAdmin değilse veya SuperAdmin firma filtresi seçtiyse)
    if (!isSuperAdmin) {
      query = query.eq('companyId', companyId)
    } else if (filterCompanyId) {
      // SuperAdmin firma filtresi seçtiyse sadece o firmayı göster
      query = query.eq('companyId', filterCompanyId)
    }
    // SuperAdmin ve firma filtresi yoksa tüm firmaları göster

    if (search) {
      query = query.or(`title.ilike.%${search}%`)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (customerCompanyId) {
      query = query.eq('customerCompanyId', customerCompanyId)
    }

    // Raporlama için tüm veriler çek (all=true), liste için pagination
    if (!all) {
      query = query.range((page - 1) * pageSize, page * pageSize - 1)
    }

    const { data, error, count } = await query

    if (error) {
      // Production'da console.error kaldırıldı
      if (process.env.NODE_ENV === 'development') {
        console.error('Quotes API error:', error)
      }
      return NextResponse.json(
        { error: error.message || 'Failed to fetch quotes' },
        { status: 500 }
      )
    }

    const totalPages = all ? 1 : Math.ceil((count || (data?.length || 0)) / pageSize)

    // Dengeli cache - 60 saniye (performans + veri güncelliği dengesi)
    // stale-while-revalidate: Eski veri gösterilirken arka planda yenilenir (kullanıcı beklemez)
    return NextResponse.json(
      all
        ? data || [] // Raporlama için direkt array
        : {
            // Liste için pagination ile
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
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120, max-age=30',
        'CDN-Cache-Control': 'public, s-maxage=60',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=60',
      },
    })
  } catch (error: any) {
    // Production'da console.error kaldırıldı
    if (process.env.NODE_ENV === 'development') {
      console.error('Quotes API exception:', error)
    }
    return NextResponse.json(
      { 
        error: error?.message || 'Failed to fetch quotes',
        ...(process.env.NODE_ENV === 'development' && { stack: error?.stack }),
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    // Session kontrolü - cache ile (30 dakika cache - çok daha hızlı!)
    const { session, error: sessionError } = await getSafeSession(request)
    
    if (sessionError) {
      return sessionError
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canCreate kontrolü
    const { hasPermission, PERMISSION_DENIED_MESSAGE } = await import('@/lib/permissions')
    const canCreate = await hasPermission('quote', 'create', session.user.id)
    if (!canCreate) {
      return NextResponse.json(
        { error: 'Forbidden', message: PERMISSION_DENIED_MESSAGE },
        { status: 403 }
      )
    }

    // Body parse - hata yakalama ile
    let body
    try {
      body = await request.json()
    } catch (jsonError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Quotes POST API JSON parse error:', jsonError)
      }
      return NextResponse.json(
        { error: 'Invalid JSON body', message: jsonError?.message || 'Failed to parse request body' },
        { status: 400 }
      )
    }

    // Zorunlu alanları kontrol et
    if (!body.title || body.title.trim() === '') {
      return NextResponse.json(
        { error: 'Teklif başlığı gereklidir' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseWithServiceRole()

    // Otomatik teklif numarası oluştur (eğer quoteNumber gönderilmemişse)
    // Not: Quote tablosunda quoteNumber kolonu yoksa, title'a eklenebilir veya ayrı bir kolon eklenebilir
    // Şimdilik title'a ekleyeceğiz: "QUO-2024-01-0001 - [Başlık]" formatında
    let quoteNumber = body.quoteNumber
    let quoteTitle = body.title.trim()
    
    if (!quoteNumber || quoteNumber.trim() === '') {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      
      // Bu ay oluşturulan teklif sayısını al (title'da QUO- ile başlayanlar)
      const { count } = await supabase
        .from('Quote')
        .select('*', { count: 'exact', head: true })
        .eq('companyId', session.user.companyId)
        .like('title', `QUO-${year}-${month}-%`)
      
      // Sıradaki numara
      const nextNumber = String((count || 0) + 1).padStart(4, '0')
      quoteNumber = `QUO-${year}-${month}-${nextNumber}`
      
      // Title'a numarayı ekle
      quoteTitle = `${quoteNumber} - ${quoteTitle}`
    }

    // Quote verilerini oluştur - SADECE schema.sql'de olan kolonları gönder
    // schema.sql: title, status, total, dealId, companyId
    // schema-extension.sql: description, validUntil, discount, taxRate (migration çalıştırılmamış olabilir - GÖNDERME!)
    // schema-vendor.sql: vendorId (migration çalıştırılmamış olabilir - GÖNDERME!)
    const quoteData: any = {
      title: quoteTitle, // Otomatik numara ile birlikte
      status: body.status || 'DRAFT',
      totalAmount: body.totalAmount !== undefined ? parseFloat(body.totalAmount) : (body.total !== undefined ? parseFloat(body.total) : 0),
      companyId: session.user.companyId,
    }

    // Sadece schema.sql'de olan alanlar
    if (body.dealId) quoteData.dealId = body.dealId
    if (body.customerCompanyId) quoteData.customerCompanyId = body.customerCompanyId
    // NOT: description, vendorId, validUntil, discount, taxRate schema-extension'da var ama migration çalıştırılmamış olabilir - GÖNDERME!

    // @ts-ignore - Supabase type inference issue with Quote table
    const { data, error } = await supabase
      .from('Quote')
      // @ts-ignore - Supabase database type tanımları eksik, insert metodu dinamik tip bekliyor
      .insert([quoteData])
      .select()
      .single()

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Quotes POST API insert error:', error)
      }
      return NextResponse.json(
        { error: error.message || 'Failed to create quote' },
        { status: 500 }
      )
    }

    // ActivityLog KALDIRILDI - Sadece kritik işlemler için ActivityLog tutulacak
    // (Performans optimizasyonu: Gereksiz log'lar veritabanını yavaşlatıyor)
    // Quote ACCEPTED/REJECTED durumlarında ActivityLog tutulacak (quotes/[id]/route.ts'de)

    // Deal stage'ini PROPOSAL'a taşı (eğer dealId varsa ve deal CONTACTED veya LEAD aşamasındaysa)
    let dealStageUpdated = false
    if (body.dealId) {
      try {
        // Deal'ı çek - önce companyId olmadan kontrol et (service role ile RLS bypass)
        const { data: dealById, error: errorById } = await supabase
          .from('Deal')
          .select('id, title, stage, companyId')
          .eq('id', body.dealId)
          .maybeSingle()

        if (errorById) {
          console.error('Deal fetch error (by ID):', {
            dealId: body.dealId,
            error: errorById.message,
            code: errorById.code,
          })
        } else if (dealById) {
          // Deal bulundu - companyId kontrolü yap
          const deal = dealById as { id: string; title: string; stage: string; companyId: string }
          const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
          
          if (deal.companyId === session.user.companyId || isSuperAdmin) {
            // Deal CONTACTED veya LEAD aşamasındaysa PROPOSAL'a taşı
            const currentStage = deal.stage
            
            if (process.env.NODE_ENV === 'development') {
              console.log('Quote deal stage check:', {
                dealId: body.dealId,
                dealTitle: deal.title,
                currentStage,
                shouldUpdate: currentStage === 'CONTACTED' || currentStage === 'LEAD',
                expectedStages: ['CONTACTED', 'LEAD'],
              })
            }
            
            if (currentStage === 'CONTACTED' || currentStage === 'LEAD') {
              // Deal'in kendi companyId'sini kullan
              const dealCompanyId = deal.companyId || session.user.companyId
              
              // @ts-ignore - Supabase type inference issue
              const { error: updateError, data: updatedDeal } = await supabase
                .from('Deal')
                // @ts-ignore - Supabase type inference issue
                .update({ stage: 'PROPOSAL', updatedAt: new Date().toISOString() })
                .eq('id', body.dealId)
                .eq('companyId', dealCompanyId) // Deal'in kendi companyId'sini kullan
                .select('id, stage')
                .single()

              if (!updateError && updatedDeal && (updatedDeal as any)?.stage === 'PROPOSAL') {
                dealStageUpdated = true
                
                if (process.env.NODE_ENV === 'development') {
                  console.log('Deal stage successfully updated:', {
                    dealId: body.dealId,
                    from: currentStage,
                    to: 'PROPOSAL',
                    updatedDeal,
                  })
                }
                // ActivityLog kaydı - Deal stage değişikliği
                // @ts-ignore - Supabase type inference issue
                await supabase.from('ActivityLog').insert([
                  {
                    entity: 'Deal',
                    action: 'UPDATE',
                    description: `Fırsat aşaması güncellendi: ${currentStage} → PROPOSAL (Teklif oluşturuldu)`,
                    meta: { 
                      entity: 'Deal', 
                      action: 'stage_change', 
                      id: body.dealId, 
                      dealId: body.dealId,
                      from: currentStage, 
                      to: 'PROPOSAL',
                      reason: 'quote_created',
                      quoteId: (data as any).id,
                      quoteTitle: body.title,
                      companyId: session.user.companyId,
                      createdBy: session.user.id,
                    },
                    userId: session.user.id,
                    companyId: session.user.companyId,
                  },
                ])

                // Notification oluştur - Deal stage değişikliği
                try {
                  const { createNotificationForRole } = await import('@/lib/notification-helper')
                  
                  // Deal başlığını kullan (zaten dealById'den var)
                  const dealTitle = deal.title || 'Fırsat'
                  
                  await createNotificationForRole({
                    companyId: session.user.companyId,
                    role: ['ADMIN', 'SALES', 'SUPER_ADMIN'],
                    title: '📄 Fırsat Aşaması Güncellendi',
                    message: `${dealTitle} fırsatı "Teklif" aşamasına taşındı. Teklif oluşturuldu.`,
                    type: 'success',
                    relatedTo: 'Deal',
                    relatedId: body.dealId,
                    link: `/deals/${body.dealId}`,
                  })
                } catch (notificationError) {
                  // Notification hatası kritik değil
                  if (process.env.NODE_ENV === 'development') {
                    console.error('Deal stage notification error (non-critical):', notificationError)
                  }
                }
              } else {
                // Update hatası veya stage yanlış
                console.warn('Deal stage update returned unexpected data:', {
                  dealId: body.dealId,
                  currentStage,
                  targetStage: 'PROPOSAL',
                  updateError,
                  updatedDeal,
                })
              }
            } else {
              // Deal PROPOSAL'a taşınacak aşamada değil
              if (process.env.NODE_ENV === 'development') {
                console.log('Deal stage not CONTACTED/LEAD, skipping auto-update:', {
                  dealId: body.dealId,
                  dealTitle: deal.title,
                  currentStage,
                  expectedStages: ['CONTACTED', 'LEAD'],
                })
              }
            }
          } else {
            console.warn('Deal found but companyId mismatch (not SuperAdmin):', {
              dealId: body.dealId,
              dealCompanyId: deal.companyId,
              userCompanyId: session.user.companyId,
              userRole: session.user.role,
              dealTitle: deal.title,
            })
          }
        } else {
          console.warn('Deal not found:', {
            dealId: body.dealId,
            companyId: session.user.companyId,
          })
        }
      } catch (dealUpdateError: any) {
        // Deal güncelleme hatası kritik değil, sadece log
        if (process.env.NODE_ENV === 'development') {
          console.error('Deal stage update error (non-critical):', dealUpdateError)
        }
      }
    }

    // AutoTaskFromQuote: Teklif oluşturulduğunda otomatik görev aç
    // Görev: "Bu teklif için 3 gün içinde müşteriyi ara"
    try {
      const taskData = {
        title: `Bu teklif için 3 gün içinde müşteriyi ara: ${body.title}`,
        status: 'TODO',
        assignedTo: session.user.id, // Teklif sahibine atanır
        companyId: session.user.companyId,
        description: `Teklif: ${body.title} - Müşteri ile 3 gün içinde görüşme yapılmalı`,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 gün sonra
        priority: 'MEDIUM',
      }
      
      // @ts-ignore - Supabase database type tanımları eksik
      const { data: task, error: taskError } = await supabase.from('Task').insert([taskData]).select().single()
      
      if (task && !taskError) {
        // Bildirim: Görev oluşturuldu
        const { createNotification } = await import('@/lib/notification-helper')
        await createNotification({
          userId: session.user.id,
          companyId: session.user.companyId,
          title: 'Yeni Görev Oluşturuldu',
          message: `Teklif için otomatik görev oluşturuldu. Görevi görmek ister misiniz?`,
          type: 'info',
          relatedTo: 'Task',
          relatedId: (task as any).id,
        })
      }
    } catch (taskError) {
      // Görev oluşturma hatası ana işlemi engellemez
      if (process.env.NODE_ENV === 'development') {
        console.error('AutoTaskFromQuote error:', taskError)
      }
    }

    // Bildirim: Teklif oluşturuldu
    try {
      const { createNotificationForRole } = await import('@/lib/notification-helper')
      
      // Firma bilgisini çek (eğer customerCompanyId varsa)
      let companyName = ''
      if (body.customerCompanyId) {
        const { data: companyData } = await supabase
          .from('CustomerCompany')
          .select('name')
          .eq('id', body.customerCompanyId)
          .single()
        if (companyData) {
          companyName = companyData.name
        }
      }
      
      // Deal bilgisini çek (eğer dealId varsa)
      let dealTitle = ''
      if (body.dealId) {
        const { data: dealData } = await supabase
          .from('Deal')
          .select('title')
          .eq('id', body.dealId)
          .single()
        if (dealData) {
          dealTitle = dealData.title
        }
      }
      
      // Bildirim mesajını oluştur
      let notificationMessage = `"${(data as any).title}" teklifi oluşturuldu.`
      if (companyName) {
        notificationMessage = `${companyName} firması için "${(data as any).title}" teklifi oluşturuldu.`
      } else if (dealTitle) {
        notificationMessage = `"${dealTitle}" fırsatı için "${(data as any).title}" teklifi oluşturuldu.`
      }
      
      const notificationResult = await createNotificationForRole({
        companyId: session.user.companyId,
        role: ['ADMIN', 'SALES', 'SUPER_ADMIN'],
        title: 'Yeni Teklif Oluşturuldu',
        message: notificationMessage,
        type: 'info',
        relatedTo: 'Quote',
        relatedId: (data as any).id,
      })
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Quote notification sent:', {
          quoteId: (data as any).id,
          quoteTitle: (data as any).title,
          companyId: session.user.companyId,
          notificationResult,
        })
      }
    } catch (notificationError: any) {
      // Bildirim hatası ana işlemi engellemez ama logla
      console.error('Quote notification error:', {
        error: notificationError?.message || notificationError,
        quoteId: (data as any)?.id,
        companyId: session.user.companyId,
      })
    }

    // Response'a stage güncelleme bilgisini ekle
    const responseData: any = { ...(data as any) }
    if (body.dealId) {
      responseData.dealId = body.dealId
      responseData.dealStageUpdated = dealStageUpdated
      
      // Deal bilgilerini de ekle (frontend'de kontrol için)
      try {
        const { data: finalDealData, error: finalDealError } = await supabase
          .from('Deal')
          .select('id, title, stage, companyId')
          .eq('id', body.dealId)
          .maybeSingle()
        
        if (finalDealError) {
          console.error('Final deal fetch error:', {
            dealId: body.dealId,
            error: finalDealError.message,
            code: finalDealError.code,
          })
        } else if (finalDealData) {
          // Deal bulundu - companyId kontrolü yap
          const finalDeal = finalDealData as { id: string; title: string; stage: string; companyId: string }
          if (finalDeal.companyId === session.user.companyId || session.user.role === 'SUPER_ADMIN') {
            responseData.dealCurrentStage = finalDeal.stage
            responseData.dealTitle = finalDeal.title
          }
        }
      } catch (finalDealError) {
        console.error('Final deal fetch exception:', finalDealError)
      }
    }

    return NextResponse.json(responseData, { status: 201 })
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Quotes POST API error:', error)
    }
    return NextResponse.json(
      { error: error?.message || 'Failed to create quote' },
      { status: 500 }
    )
  }
}
