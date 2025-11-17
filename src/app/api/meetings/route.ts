import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Dynamic route - her zaman fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0 // Cache'i devre dışı bırak

export async function GET(request: Request) {
  try {
    // Session kontrolü
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // DEBUG: Session ve permission bilgisini logla
    if (process.env.NODE_ENV === 'development') {
      console.log('[Meetings API] 🔍 Session Check:', {
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role,
        companyId: session.user.companyId,
        companyName: session.user.companyName,
      })
    }

    // Permission check - canRead kontrolü (meeting modülü için activity yetkisi kullanıyoruz)
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canRead = await hasPermission('activity', 'read', session.user.id)
    if (!canRead) {
      // DEBUG: Permission denied logla
      if (process.env.NODE_ENV === 'development') {
        console.log('[Meetings API] ❌ Permission Denied:', {
          module: 'activity',
          action: 'read',
          userId: session.user.id,
          role: session.user.role,
        })
      }
      return buildPermissionDeniedResponse()
    }

    // SuperAdmin tüm şirketlerin verilerini görebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId
    const supabase = getSupabaseWithServiceRole()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const statusFilter = searchParams.get('status') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''
    const userId = searchParams.get('userId') || '' // Admin filtreleme için
    const customerId = searchParams.get('customerId') || ''
    const filterCompanyId = searchParams.get('filterCompanyId') || '' // SuperAdmin için firma filtresi
    // NOT: customerCompanyId kolonu Meeting tablosunda yok, bu yüzden kaldırıldı
    // const customerCompanyId = searchParams.get('customerCompanyId') || '' // Firma bazlı filtreleme

    // ÖNEMLİ: Meeting tablosu yoksa boş array döndür (cache sorunu olabilir)
    // Tablo kontrolü için önce basit bir sorgu yap - cache bypass ile
    try {
      // Cache bypass için özel header ekle
      const { error: tableCheckError } = await supabase
        .from('Meeting')
        .select('id')
        .limit(0)
      
      if (tableCheckError) {
        // Tablo bulunamadı hatası - cache sorunu olabilir, boş array döndür
        const errorMessage = tableCheckError.message || ''
        const errorCode = tableCheckError.code || ''
        
        if (errorMessage.includes('Could not find the table') || 
            errorMessage.includes('relation') ||
            errorMessage.includes('does not exist') ||
            errorCode === 'PGRST204' ||
            errorCode === '42P01') {
          console.warn('Meeting tablosu bulunamadı (cache sorunu olabilir). Boş array döndürülüyor.', {
            message: errorMessage,
            code: errorCode
          })
          return NextResponse.json([], {
            headers: {
              'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
            }
          })
        }
        // Diğer hatalar için throw et
        throw tableCheckError
      }
    } catch (tableError: any) {
      // Tablo yoksa veya cache sorunu varsa boş array döndür
      const errorMessage = tableError?.message || ''
      const errorCode = tableError?.code || ''
      
      if (errorMessage.includes('Could not find the table') || 
          errorMessage.includes('relation') ||
          errorMessage.includes('does not exist') ||
          errorCode === 'PGRST204' ||
          errorCode === '42P01') {
        console.warn('Meeting tablosu bulunamadı. Boş array döndürülüyor.', {
          message: errorMessage,
          code: errorCode
        })
        return NextResponse.json([], {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        })
      }
      throw tableError
    }

    // Query builder
    // NOT: createdBy kolonu migration'da yoksa hata verir, bu yüzden kaldırıldı
    let query = supabase
      .from('Meeting')
      .select(`
        id,
        title,
        description,
        meetingDate,
        meetingDuration,
        location,
        meetingType,
        meetingUrl,
        meetingPassword,
        status,
        companyId,
        customerId,
        dealId,
        createdAt,
        updatedAt,
        Customer:Customer(id, name, email, phone),
        Deal:Deal(id, title, stage)
      `, { count: 'exact' })
      .order('meetingDate', { ascending: false })

    // ÖNCE companyId filtresi (SuperAdmin değilse veya SuperAdmin firma filtresi seçtiyse)
    if (!isSuperAdmin) {
      query = query.eq('companyId', companyId)
    } else if (filterCompanyId) {
      // SuperAdmin firma filtresi seçtiyse sadece o firmayı göster
      query = query.eq('companyId', filterCompanyId)
    }
    // SuperAdmin ve firma filtresi yoksa tüm firmaları göster

    // Status filtresi
    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    // Search filtresi (title veya description'da arama)
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Tarih aralığı filtresi
    if (dateFrom) {
      query = query.gte('meetingDate', dateFrom)
    }
    if (dateTo) {
      query = query.lte('meetingDate', dateTo)
    }

    // Kullanıcı filtresi (Admin için) - Normal kullanıcılar sadece kendi görüşmelerini görür
    // SuperAdmin tüm görüşmeleri görebilir (filtre yoksa)
    if (!isSuperAdmin && session.user.role !== 'ADMIN') {
      // Normal kullanıcı sadece kendi görüşmelerini görür
      query = query.eq('createdBy', session.user.id)
    } else if (userId && userId !== 'all' && userId !== '' && (session.user.role === 'ADMIN' || isSuperAdmin)) {
      // Admin belirli bir kullanıcının görüşmelerini filtreleyebilir
      // NOT: userId='all' veya boş ise filtreleme yapma (UUID hatası vermemesi için)
      try {
        query = query.eq('createdBy', userId)
      } catch (uuidError) {
        // UUID hatası varsa filtreleme yapma
        console.warn('Invalid userId filter:', userId)
      }
    }

    // Müşteri filtresi
    if (customerId && customerId !== 'all') {
      query = query.eq('customerId', customerId)
    }

    // NOT: customerCompanyId kolonu Meeting tablosunda yok, bu yüzden filtreleme kaldırıldı
    // Firma bazlı filtreleme için customerId üzerinden Customer tablosundaki customerCompanyId kullanılabilir
    // Şimdilik bu filtreleme kaldırıldı

    // Participant'ları da çek (çoklu kullanıcı atama)
    const { data: meetings, error } = await query

    // DEBUG: Query sonuçlarını logla
    if (process.env.NODE_ENV === 'development') {
      console.log('[Meetings API] Query Results:', {
        meetingsCount: meetings?.length || 0,
        isSuperAdmin,
        companyId,
        filterCompanyId,
        userId,
        statusFilter,
        search,
        error: error?.message,
      })
    }

    // Her meeting için participant'ları çek - OPTİMİZE: User bilgilerini de çek + SuperAdmin filtrele
    if (meetings && meetings.length > 0) {
      const meetingIds = meetings.map((m: any) => m.id)
      
      // @ts-ignore - Supabase type inference issue
      const { data: participants } = await supabase
        .from('MeetingParticipant')
        .select(`
          meetingId, 
          userId, 
          role, 
          status,
          User:User!MeetingParticipant_userId_fkey(id, name, email, role, companyId)
        `)
        .in('meetingId', meetingIds)

      // Participant'ları meeting'lere ekle - OPTİMİZE: SuperAdmin'leri ve farklı companyId'ye sahip olanları filtrele
      if (participants) {
        meetings.forEach((meeting: any) => {
          // SuperAdmin'leri filtrele + companyId kontrolü (JavaScript'te filtrele - Supabase nested filter çalışmayabilir)
          meeting.participants = participants
            .filter((p: any) => {
              // Meeting ID eşleşmesi
              if (p.meetingId !== meeting.id) return false
              
              // User bilgisi yoksa filtrele
              if (!p.User) return false
              
              // SuperAdmin kontrolü - SuperAdmin'ler her zaman gösterilmez (participant olarak)
              if (p.User.role === 'SUPER_ADMIN') return false
              
              // companyId kontrolü - SuperAdmin ise tüm participant'ları göster, değilse sadece aynı companyId'yi göster
              if (!isSuperAdmin && p.User.companyId !== companyId) return false
              
              return true
            })
            .map((p: any) => ({
              meetingId: p.meetingId,
              userId: p.userId,
              role: p.role,
              status: p.status,
              User: p.User, // User bilgisini de ekle
            }))
        })
      }
    }

    if (error) {
      // Tablo bulunamadı hatası - cache sorunu olabilir, boş array döndür
      const errorMessage = error.message || ''
      const errorCode = error.code || ''
      
      if (errorMessage.includes('Could not find the table') || 
          errorMessage.includes('relation') ||
          errorMessage.includes('does not exist') ||
          errorCode === 'PGRST204' ||
          errorCode === '42P01') {
        console.warn('Meeting tablosu bulunamadı (query sırasında). Boş array döndürülüyor.', {
          message: errorMessage,
          code: errorCode
        })
        return NextResponse.json([], {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        })
      }
      
      console.error('Meetings GET API error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to fetch meetings' },
        { status: 500 }
      )
    }

    // Her görüşme için gider bilgilerini Finance tablosundan çek (relatedTo='Meeting')
    const meetingsWithExpenses = await Promise.all(
      (meetings || []).map(async (meeting: any) => {
        // Finance tablosundan Meeting ile ilişkili giderleri çek
        const { data: expenses } = await supabase
          .from('Finance')
          .select('id, type, amount, description, createdAt, relatedTo, relatedId')
          .eq('relatedTo', 'Meeting')
          .eq('relatedId', meeting.id)
          .eq('type', 'EXPENSE')

        // Gider tiplerine göre grupla
        const fuelExpense = expenses?.filter((e: any) => e.description?.includes('Yakıt') || e.description?.includes('FUEL')).reduce((sum: number, e: any) => sum + parseFloat(e.amount || 0), 0) || 0
        const accommodationExpense = expenses?.filter((e: any) => e.description?.includes('Konaklama') || e.description?.includes('ACCOMMODATION')).reduce((sum: number, e: any) => sum + parseFloat(e.amount || 0), 0) || 0
        const foodExpense = expenses?.filter((e: any) => e.description?.includes('Yemek') || e.description?.includes('FOOD')).reduce((sum: number, e: any) => sum + parseFloat(e.amount || 0), 0) || 0
        const otherExpense = expenses?.filter((e: any) => e.description?.includes('Diğer') || e.description?.includes('OTHER')).reduce((sum: number, e: any) => sum + parseFloat(e.amount || 0), 0) || 0
        const totalExpense = expenses?.reduce((sum: number, e: any) => sum + parseFloat(e.amount || 0), 0) || 0

        return {
          ...meeting,
          expenses: expenses || [],
          expenseBreakdown: {
            fuel: fuelExpense,
            accommodation: accommodationExpense,
            food: foodExpense,
            other: otherExpense,
            total: totalExpense,
          },
          totalExpense,
        }
      })
    )

    return NextResponse.json({
      data: meetingsWithExpenses || [],
      pagination: {
        page,
        pageSize,
        totalItems: count || 0,
        totalPages,
      },
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    })
  } catch (error: any) {
    console.error('Meetings GET API exception:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meetings', message: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    // Session kontrolü - hata yakalama ile
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canCreate kontrolü (meeting modülü için activity yetkisi kullanıyoruz)
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canCreate = await hasPermission('activity', 'create', session.user.id)
    if (!canCreate) {
      return buildPermissionDeniedResponse()
    }

    // Body parse
    let body
    try {
      body = await request.json()
    } catch (jsonError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Meetings POST API JSON parse error:', jsonError)
      }
      return NextResponse.json(
        { error: 'Invalid JSON body', message: jsonError?.message || 'Failed to parse request body' },
        { status: 400 }
      )
    }

    // Zorunlu alanları kontrol et
    if (!body.title || body.title.trim() === '') {
      return NextResponse.json(
        { error: 'Görüşme başlığı gereklidir' },
        { status: 400 }
      )
    }

    if (!body.meetingDate) {
      return NextResponse.json(
        { error: 'Görüşme tarihi gereklidir' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseWithServiceRole()

    // Meeting verilerini oluştur
    const meetingData: any = {
      title: body.title.trim(),
      description: body.description || null,
      meetingDate: body.meetingDate,
      meetingDuration: body.meetingDuration || 60,
      location: body.location || null,
      meetingType: body.meetingType || 'IN_PERSON',
      meetingUrl: body.meetingUrl || null,
      meetingPassword: body.meetingPassword || null,
      status: body.status || 'SCHEDULED',
      companyId: session.user.companyId,
      customerId: body.customerId || null,
      dealId: body.dealId || null,
      customerCompanyId: body.customerCompanyId || null,
      notes: body.notes || null,
      outcomes: body.outcomes || null,
      actionItems: body.actionItems || null,
      attendees: body.attendees || null,
      createdBy: session.user.id,
    }

    const { data: meeting, error } = await supabase
      .from('Meeting')
      .insert([meetingData])
      .select(`
        *,
        Customer:Customer(id, name, email, phone)
      `)
      .single()

    if (error) {
      console.error('Meetings POST API error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to create meeting' },
        { status: 500 }
      )
    }

    // Google Calendar'a otomatik ekle (eğer meetingUrl varsa ve Google Calendar entegrasyonu aktifse)
    try {
      const { checkGoogleCalendarIntegration } = await import('@/lib/integrations/check-integration')
      const calendarStatus = await checkGoogleCalendarIntegration(session.user.companyId)
      
      if (calendarStatus.hasIntegration && calendarStatus.isActive && meeting.meetingUrl) {
        // Kullanıcının Google Calendar'ına ekle
        const { addToUserCalendar, createCalendarEventFromRecord } = await import('@/lib/integrations/calendar')
        
        const endTime = meeting.meetingDuration 
          ? new Date(new Date(meeting.meetingDate).getTime() + meeting.meetingDuration * 60000).toISOString()
          : new Date(new Date(meeting.meetingDate).getTime() + 60 * 60 * 1000).toISOString() // Varsayılan 1 saat
        
        const calendarEvent = createCalendarEventFromRecord('meeting', meeting, {
          startTime: new Date(meeting.meetingDate).toISOString(),
          endTime,
          location: meeting.location || undefined,
          attendees: meeting.Customer?.email ? [{ email: meeting.Customer.email, displayName: meeting.Customer.name }] : undefined,
        })
        
        // Toplantı linkini açıklamaya ekle
        calendarEvent.description = `${calendarEvent.description || ''}\n\nToplantı Linki: ${meeting.meetingUrl}${meeting.meetingPassword ? `\nŞifre: ${meeting.meetingPassword}` : ''}`
        
        const calendarResult = await addToUserCalendar(
          session.user.id,
          session.user.companyId,
          calendarEvent
        )
        
        if (calendarResult.success) {
          // Google Calendar event ID'sini kaydet
          await supabase
            .from('Meeting')
            .update({ googleCalendarEventId: calendarResult.eventId })
            .eq('id', meeting.id)
        }
      }
    } catch (calendarError: any) {
      // Calendar hatası ana işlemi engellemez
      console.error('Auto-add to calendar error:', calendarError)
    }

    // ActivityLog kaydı - Meeting için
    try {
      await supabase.from('ActivityLog').insert([
        {
          entity: 'Meeting',
          action: 'CREATE',
          description: `Yeni görüşme oluşturuldu: ${body.title}`,
          meta: { 
            entity: 'Meeting', 
            action: 'create', 
            id: meeting.id,
            meetingId: meeting.id,
            companyId: session.user.companyId,
            createdBy: session.user.id,
            ...body 
          },
          userId: session.user.id,
          companyId: session.user.companyId,
        },
      ])
    } catch (activityError) {
      // ActivityLog hatası ana işlemi engellemez
      console.error('ActivityLog error:', activityError)
    }

    // Deal ile ilgili işlemler (dealId varsa)
    let dealStageUpdated = false
    if (body.dealId) {
      try {
        // Deal bilgilerini çek - önce companyId olmadan kontrol et (service role ile RLS bypass)
        // Eğer deal bulunamazsa, companyId kontrolü yap
        let dealData: any = null
        let dealFetchError: any = null
        
        // Önce sadece ID ile kontrol et
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
          dealFetchError = errorById
        } else if (dealById) {
          // Deal bulundu - companyId kontrolü yap
          const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
          
          if (dealById.companyId === session.user.companyId || isSuperAdmin) {
            // CompanyId uyuşuyor veya SuperAdmin - deal'i kullan
            dealData = dealById
            
            if (process.env.NODE_ENV === 'development') {
              console.log('Deal found and authorized:', {
                dealId: body.dealId,
                dealCompanyId: dealById.companyId,
                userCompanyId: session.user.companyId,
                isSuperAdmin,
                dealTitle: dealById.title,
              })
            }
          } else {
            console.warn('Deal found but companyId mismatch (not SuperAdmin):', {
              dealId: body.dealId,
              dealCompanyId: dealById.companyId,
              userCompanyId: session.user.companyId,
              userRole: session.user.role,
              dealTitle: dealById.title,
            })
            // CompanyId uyuşmuyor ve SuperAdmin değil - devam et ama stage güncellemesi yapma
          }
        } else {
          console.warn('Deal not found:', {
            dealId: body.dealId,
            companyId: session.user.companyId,
          })
        }

        if (dealData) {
          const currentStage = (dealData as any)?.stage
          
          if (process.env.NODE_ENV === 'development') {
            console.log('Deal stage check:', {
              dealId: body.dealId,
              dealTitle: dealData.title,
              currentStage,
              shouldUpdate: currentStage === 'PROPOSAL',
            })
          }
          
          // Eğer deal PROPOSAL aşamasındaysa, otomatik olarak NEGOTIATION'a taşı
          if (currentStage === 'PROPOSAL') {
            // NOT: Direkt Supabase update yerine, internal API call yapabiliriz ama bu daha yavaş
            // Şimdilik direkt Supabase update yapıyoruz (service role ile RLS bypass)
            // NOT: updatedAt eklenmeli (quotes/route.ts pattern'i ile)
            // Deal'in kendi companyId'sini kullan (SuperAdmin için veya normal kullanıcı için)
            const dealCompanyId = dealData.companyId || session.user.companyId
            
            const { error: updateError, data: updatedDeal } = await supabase
              .from('Deal')
              .update({ 
                stage: 'NEGOTIATION',
                updatedAt: new Date().toISOString()
              })
              .eq('id', body.dealId)
              .eq('companyId', dealCompanyId) // Deal'in kendi companyId'sini kullan
              .select('id, stage')
              .single()

            if (updateError) {
              // Stage güncelleme hatası - detaylı log
              console.error('Deal stage update error:', {
                dealId: body.dealId,
                currentStage,
                targetStage: 'NEGOTIATION',
                error: updateError.message,
                code: updateError.code,
                details: updateError.details,
                hint: updateError.hint,
              })
              
              // Hata durumunda alternatif yöntem: Internal API call (daha yavaş ama validation çalışır)
              // NOT: Bu yöntem validation yapar ama daha yavaş, şimdilik denemiyoruz
              // const internalUpdateRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/deals/${body.dealId}`, {
              //   method: 'PUT',
              //   headers: {
              //     'Content-Type': 'application/json',
              //     'Cookie': request.headers.get('Cookie') || '',
              //   },
              //   body: JSON.stringify({ stage: 'NEGOTIATION' }),
              // })
              
              // Stage güncelleme hatası ana işlemi engellemez ama log'la
            } else if (updatedDeal && (updatedDeal as any)?.stage === 'NEGOTIATION') {
              // Başarılı güncelleme - stage kontrolü yap
              dealStageUpdated = true
              
              if (process.env.NODE_ENV === 'development') {
                console.log('Deal stage successfully updated:', {
                  dealId: body.dealId,
                  from: 'PROPOSAL',
                  to: 'NEGOTIATION',
                  updatedDeal,
                })
              }
              
              // Stage değişikliği için ActivityLog kaydı
              try {
                await supabase.from('ActivityLog').insert([
                  {
                    entity: 'Deal',
                    action: 'UPDATE',
                    description: `Fırsat aşaması güncellendi: PROPOSAL → NEGOTIATION (Görüşme planlandı)`,
                    meta: { 
                      entity: 'Deal', 
                      action: 'stage_change', 
                      id: dealData.id,
                      dealId: dealData.id,
                      from: 'PROPOSAL',
                      to: 'NEGOTIATION',
                      reason: 'meeting_created',
                      meetingId: meeting.id,
                      meetingTitle: body.title,
                      companyId: session.user.companyId,
                      createdBy: session.user.id,
                    },
                    userId: session.user.id,
                    companyId: session.user.companyId,
                  },
                ])
              } catch (stageActivityError) {
                console.error('Deal stage ActivityLog error:', stageActivityError)
              }
            } else {
              // updatedDeal null/undefined veya stage yanlış - güncelleme başarısız olabilir
              console.warn('Deal stage update returned unexpected data:', {
                dealId: body.dealId,
                currentStage,
                targetStage: 'NEGOTIATION',
                updatedDeal,
                actualStage: (updatedDeal as any)?.stage,
              })
            }
          } else {
            // Deal PROPOSAL aşamasında değil - log'la
            if (process.env.NODE_ENV === 'development') {
              console.log('Deal stage not PROPOSAL, skipping auto-update:', {
                dealId: body.dealId,
                dealTitle: dealData.title,
                currentStage,
                expectedStage: 'PROPOSAL',
              })
            }
          }

          // Görüşme oluşturulması için ActivityLog kaydı
          await supabase.from('ActivityLog').insert([
            {
              entity: 'Deal',
              action: 'UPDATE',
              description: `Fırsat için görüşme planlandı: ${body.title}`,
              meta: { 
                entity: 'Deal', 
                action: 'meeting_created', 
                id: dealData.id,
                dealId: dealData.id,
                meetingId: meeting.id,
                meetingTitle: body.title,
                companyId: session.user.companyId,
                createdBy: session.user.id,
              },
              userId: session.user.id,
              companyId: session.user.companyId,
            },
          ])
        }
      } catch (dealActivityError) {
        // ActivityLog hatası ana işlemi engellemez
        console.error('Deal ActivityLog error:', dealActivityError)
      }
    }

    // Response'a stage güncelleme bilgisini ekle
    const responseData: any = { ...meeting }
    if (body.dealId) {
      responseData.dealId = body.dealId
      responseData.dealStageUpdated = dealStageUpdated
      
      // Deal bilgilerini de ekle (frontend'de kontrol için) - companyId olmadan kontrol et
      try {
        const { data: finalDealById, error: finalErrorById } = await supabase
          .from('Deal')
          .select('id, title, stage, companyId')
          .eq('id', body.dealId)
          .maybeSingle()
        
        if (finalErrorById) {
          console.error('Final deal fetch error (by ID):', {
            dealId: body.dealId,
            error: finalErrorById.message,
            code: finalErrorById.code,
          })
        } else if (finalDealById) {
          // Deal bulundu - companyId kontrolü yap
          if (finalDealById.companyId === session.user.companyId) {
            responseData.dealCurrentStage = (finalDealById as any)?.stage
            responseData.dealTitle = finalDealById.title
          } else {
            console.warn('Final deal found but companyId mismatch:', {
              dealId: body.dealId,
              dealCompanyId: finalDealById.companyId,
              userCompanyId: session.user.companyId,
            })
          }
        } else {
          console.warn('Final deal not found:', {
            dealId: body.dealId,
            companyId: session.user.companyId,
          })
        }
      } catch (finalDealError) {
        // Final deal fetch hatası ana işlemi engellemez
        console.error('Final deal fetch exception:', finalDealError)
      }
    }

    // Quote ile ilgili ActivityLog kaydı (quoteId varsa - eğer quote'dan dealId alındıysa)
    // NOT: Quote'dan dealId alınmışsa, quote için de log atılabilir
    // Şimdilik sadece deal için log atıyoruz

    // Participant'ları kaydet (çoklu kullanıcı atama)
    if (body.participantIds && Array.isArray(body.participantIds) && body.participantIds.length > 0) {
      try {
        const participants = body.participantIds.map((userId: string) => ({
          meetingId: meeting.id,
          userId: userId,
          companyId: session.user.companyId,
          role: 'PARTICIPANT',
          status: 'PENDING',
        }))

        // @ts-ignore - Supabase type inference issue
        const { error: participantError } = await supabase
          .from('MeetingParticipant')
          .insert(participants)

        if (participantError) {
          console.error('MeetingParticipant insert error:', participantError)
          // Participant hatası ana işlemi engellemez, sadece log
        }
        // Trigger otomatik olarak her participant'a bildirim gönderecek
      } catch (participantError) {
        console.error('MeetingParticipant error:', participantError)
        // Participant hatası ana işlemi engellemez
      }
    }

    // Gider uyarısı kontrolü - eğer gider yoksa expenseWarning true olacak (trigger ile)
    // Frontend'de kullanıcıya uyarı gösterilecek

    // ✅ Otomasyon: Meeting oluşturulduğunda email gönder (kullanıcı tercihine göre)
    try {
      const automationRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/automations/meeting-created-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meeting: meeting,
        }),
      })
      // Automation hatası ana işlemi engellemez (sadece log)
      if (!automationRes.ok) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Meeting Automation] Email gönderimi başarısız veya kullanıcı tercihi ASK')
        }
      }
    } catch (automationError) {
      // Automation hatası ana işlemi engellemez
      if (process.env.NODE_ENV === 'development') {
        console.error('[Meeting Automation] Error:', automationError)
      }
    }

    return NextResponse.json(responseData, { status: 201 })
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Meetings POST API error:', error)
    }
    return NextResponse.json(
      { error: 'Failed to create meeting', message: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
