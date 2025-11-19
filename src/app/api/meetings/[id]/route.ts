import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

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

    // Permission check - canRead kontrolü (meeting modülü için)
    // Not: Meeting için özel bir modül yok, genel olarak activity veya task yetkisi kullanılabilir
    // Şimdilik activity yetkisi ile kontrol ediyoruz
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canRead = await hasPermission('activity', 'read', session.user.id)
    if (!canRead) {
      return buildPermissionDeniedResponse()
    }

    const { id } = await params
    const supabase = getSupabaseWithServiceRole()

    // SuperAdmin tüm şirketlerin verilerini görebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId

    // Meeting'i ilişkili verilerle çek
    // NOT: createdBy kolonu migration'da yoksa hata verir, bu yüzden kaldırıldı
    let query = supabase
      .from('Meeting')
      .select(
        `
        id, title, description, meetingDate, meetingDuration, location, meetingType, meetingUrl, meetingPassword, status, companyId, customerId, dealId, createdAt, updatedAt,
        Customer:Customer(id, name, email, phone),
        Deal:Deal(id, title, stage, value)
      `
      )
      .eq('id', id)

    // SuperAdmin değilse companyId filtresi ekle
    if (!isSuperAdmin) {
      query = query.eq('companyId', companyId)
    }

    const { data, error } = await query.single()

    if (error || !data) {
      if (error?.code === 'PGRST116' || error?.message?.includes('No rows')) {
        return NextResponse.json({ error: 'Görüşme bulunamadı' }, { status: 404 })
      }
      return NextResponse.json({ error: error?.message || 'Görüşme bulunamadı' }, { status: 404 })
    }

    // Participant'ları da çek (çoklu kullanıcı atama) - OPTİMİZE: User bilgilerini de çek + SuperAdmin filtrele
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
      .eq('meetingId', id)

    // Gider bilgilerini Finance tablosundan çek (relatedTo='Meeting')
    const { data: expenses } = await supabase
      .from('Finance')
      .select('*')
      .eq('relatedTo', 'Meeting')
      .eq('relatedId', id)
      .eq('type', 'EXPENSE')
      .order('createdAt', { ascending: false })

    // ActivityLog'lar KALDIRILDI - Lazy load için ayrı endpoint kullanılacak (/api/activity?entity=Meeting&id=...)
    // (Performans optimizasyonu: Detay sayfası daha hızlı açılır, ActivityLog'lar gerektiğinde yüklenir)
    
    // Participant'ları filtrele - SuperAdmin'leri ve farklı companyId'ye sahip olanları çıkar
    const filteredParticipants = (participants || []).filter((p: any) => {
      if (!p.User) return false
      if (p.User.role === 'SUPER_ADMIN') return false
      if (p.User.companyId !== companyId) return false
      return true
    })

    return NextResponse.json({
      ...(data as any),
      participants: filteredParticipants,
      expenses: expenses || [],
      activities: [], // Boş array - lazy load için ayrı endpoint kullanılacak
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120, max-age=30',
        'CDN-Cache-Control': 'public, s-maxage=60',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=60',
      },
    })
  } catch (error: any) {
    console.error('Meetings [id] GET API exception:', error)
    return NextResponse.json(
      { error: 'Görüşme yüklenemedi', message: error?.message || 'Unknown error' },
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

    // Permission check - canUpdate kontrolü (meeting modülü için activity yetkisi kullanıyoruz)
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canUpdate = await hasPermission('activity', 'update', session.user.id)
    if (!canUpdate) {
      return buildPermissionDeniedResponse()
    }

    const { id } = await params

    // Body parse
    let body
    try {
      body = await request.json()
    } catch (jsonError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Meetings [id] PUT API JSON parse error:', jsonError)
      }
      return NextResponse.json(
        { error: 'Geçersiz JSON', message: jsonError?.message || 'İstek gövdesi çözümlenemedi' },
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

    // SuperAdmin kontrolü
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId

    // Meeting'in var olup olmadığını ve yetki kontrolü yap
    let checkQuery = supabase
      .from('Meeting')
      .select('id, companyId')
      .eq('id', id)

    if (!isSuperAdmin) {
      checkQuery = checkQuery.eq('companyId', companyId)
    }

    const { data: existingMeeting } = await checkQuery.single()

    if (!existingMeeting) {
      return NextResponse.json({ error: 'Görüşme bulunamadı' }, { status: 404 })
    }

    // ✅ ZAMAN ÇAKIŞMASI KONTROLÜ - Meeting güncellenmeden önce kontrol et
    const meetingDate = new Date(body.meetingDate)
    const meetingDuration = body.meetingDuration || 60 // dakika cinsinden
    const meetingEndTime = new Date(meetingDate.getTime() + meetingDuration * 60000)

    // Çakışan meeting'leri kontrol et
    const conflictChecks: string[] = []

    // 1. Participant bazlı çakışma kontrolü (eğer participantIds varsa)
    if (body.participantIds && Array.isArray(body.participantIds) && body.participantIds.length > 0) {
      // Tüm participant'ların o zaman aralığındaki meeting'lerini kontrol et
      const { data: participantMeetings, error: participantError } = await supabase
        .from('Meeting')
        .select(`
          id,
          title,
          meetingDate,
          meetingDuration,
          status,
          MeetingParticipant:MeetingParticipant!inner(userId)
        `)
        .eq('companyId', companyId)
        .eq('status', 'PLANNED') // Sadece planlanmış meeting'leri kontrol et
        .neq('id', id) // Kendi ID'sini hariç tut

      if (!participantError && participantMeetings) {
        // Participant meetings'leri filtrele - sadece ilgili participant'ları içerenleri al
        const relevantMeetings = participantMeetings.filter((m: any) => {
          return m.MeetingParticipant?.some((mp: any) => body.participantIds.includes(mp.userId))
        })

        for (const existingMeeting of relevantMeetings) {
          const existingStart = new Date(existingMeeting.meetingDate)
          const existingDuration = existingMeeting.meetingDuration || 60
          const existingEnd = new Date(existingStart.getTime() + existingDuration * 60000)

          // Zaman aralıkları çakışıyor mu?
          if (
            (meetingDate >= existingStart && meetingDate < existingEnd) ||
            (meetingEndTime > existingStart && meetingEndTime <= existingEnd) ||
            (meetingDate <= existingStart && meetingEndTime >= existingEnd)
          ) {
            // Çakışan participant'ları bul
            const conflictingParticipants = body.participantIds.filter((pid: string) => {
              return existingMeeting.MeetingParticipant?.some((mp: any) => mp.userId === pid)
            })

            if (conflictingParticipants.length > 0) {
              // Kullanıcı isimlerini al
              const { data: conflictingUsers } = await supabase
                .from('User')
                .select('id, name, email')
                .in('id', conflictingParticipants)

              const userNames = conflictingUsers?.map((u: any) => u.name || u.email).join(', ') || 'Kullanıcılar'
              conflictChecks.push(
                `${userNames} için "${existingMeeting.title}" görüşmesi ile çakışma var (${new Date(existingMeeting.meetingDate).toLocaleString('tr-TR')})`
              )
            }
          }
        }
      }
    }

    // 2. Customer bazlı çakışma kontrolü (eğer customerId varsa)
    if (body.customerId) {
      const { data: customerMeetings, error: customerError } = await supabase
        .from('Meeting')
        .select('id, title, meetingDate, meetingDuration, status')
        .eq('companyId', companyId)
        .eq('customerId', body.customerId)
        .eq('status', 'PLANNED') // Sadece planlanmış meeting'leri kontrol et
        .neq('id', id) // Kendi ID'sini hariç tut

      if (!customerError && customerMeetings) {
        for (const existingMeeting of customerMeetings) {
          const existingStart = new Date(existingMeeting.meetingDate)
          const existingDuration = existingMeeting.meetingDuration || 60
          const existingEnd = new Date(existingStart.getTime() + existingDuration * 60000)

          // Zaman aralıkları çakışıyor mu?
          if (
            (meetingDate >= existingStart && meetingDate < existingEnd) ||
            (meetingEndTime > existingStart && meetingEndTime <= existingEnd) ||
            (meetingDate <= existingStart && meetingEndTime >= existingEnd)
          ) {
            conflictChecks.push(
              `Müşteri için "${existingMeeting.title}" görüşmesi ile çakışma var (${new Date(existingMeeting.meetingDate).toLocaleString('tr-TR')})`
            )
          }
        }
      }
    }

    // 3. CreatedBy (oluşturan kullanıcı) bazlı çakışma kontrolü
    const { data: creatorMeetings, error: creatorError } = await supabase
      .from('Meeting')
      .select('id, title, meetingDate, meetingDuration, status')
      .eq('companyId', companyId)
      .eq('createdBy', session.user.id)
      .eq('status', 'PLANNED') // Sadece planlanmış meeting'leri kontrol et
      .neq('id', id) // Kendi ID'sini hariç tut

    if (!creatorError && creatorMeetings) {
      for (const existingMeeting of creatorMeetings) {
        const existingStart = new Date(existingMeeting.meetingDate)
        const existingDuration = existingMeeting.meetingDuration || 60
        const existingEnd = new Date(existingStart.getTime() + existingDuration * 60000)

        // Zaman aralıkları çakışıyor mu?
        if (
          (meetingDate >= existingStart && meetingDate < existingEnd) ||
          (meetingEndTime > existingStart && meetingEndTime <= existingEnd) ||
          (meetingDate <= existingStart && meetingEndTime >= existingEnd)
        ) {
          conflictChecks.push(
            `Sizin "${existingMeeting.title}" görüşmeniz ile çakışma var (${new Date(existingMeeting.meetingDate).toLocaleString('tr-TR')})`
          )
        }
      }
    }

    // Çakışma varsa hata döndür
    if (conflictChecks.length > 0) {
      return NextResponse.json(
        {
          error: 'Zaman çakışması tespit edildi',
          conflicts: conflictChecks,
          message: conflictChecks.join('\n'),
        },
        { status: 409 } // 409 Conflict
      )
    }

    // Meeting verilerini güncelle
    const updateData: any = {
      title: body.title.trim(),
      description: body.description || null,
      meetingDate: body.meetingDate,
      meetingDuration: body.meetingDuration || 60,
      location: body.location || null,
      meetingType: body.meetingType || 'IN_PERSON',
      meetingUrl: body.meetingUrl || null,
      meetingPassword: body.meetingPassword || null,
      status: body.status || 'SCHEDULED',
      customerId: body.customerId || null,
      dealId: body.dealId || null,
      customerCompanyId: body.customerCompanyId || null,
      notes: body.notes || null,
      outcomes: body.outcomes || null,
      actionItems: body.actionItems || null,
      attendees: body.attendees || null,
      updatedAt: new Date().toISOString(),
      // ✅ Recurring meeting alanları (sadece parent meeting için güncellenebilir)
      isRecurring: body.isRecurring || false,
      recurrenceType: body.recurrenceType || null,
      recurrenceInterval: body.recurrenceInterval || null,
      recurrenceEndDate: body.recurrenceEndDate || null,
      recurrenceCount: body.recurrenceCount || null,
      recurrenceDaysOfWeek: body.recurrenceDaysOfWeek || null, // JSONB - direkt array gönderilebilir
    }

    // Update işlemi - SuperAdmin için companyId filtresi yok
    let updateQuery = (supabase
      .from('Meeting') as any)
      .update(updateData)
      .eq('id', id)
    
    if (!isSuperAdmin) {
      updateQuery = updateQuery.eq('companyId', companyId)
    }
    
    const { error: updateError } = await updateQuery

    if (updateError) {
      console.error('Meetings [id] PUT API update error:', updateError)
      const { createErrorResponse } = await import('@/lib/error-handling')
      
      if (updateError.code && ['23505', '23503', '23502', '23514', '42P01', '42703'].includes(updateError.code)) {
        return createErrorResponse(updateError)
      }
      
      return NextResponse.json(
        { 
          error: updateError.message || 'Toplantı güncellenemedi',
          code: updateError.code || 'UPDATE_ERROR',
        },
        { status: 500 }
      )
    }
    
    // Update başarılı - güncellenmiş veriyi çek (SuperAdmin için companyId filtresi yok)
    let selectQuery = supabase
      .from('Meeting')
      .select(`
        id, title, description, meetingDate, meetingDuration, location, meetingType, meetingUrl, meetingPassword, status, companyId, customerId, dealId, createdAt, updatedAt
      `)
      .eq('id', id)
    
    if (!isSuperAdmin) {
      selectQuery = selectQuery.eq('companyId', companyId)
    }
    
    const { data: meeting, error } = await selectQuery.single()

    if (error) {
      console.error('Meetings [id] PUT API select error:', error)
      return NextResponse.json(
        { 
          error: error.message || 'Güncellenmiş toplantı bulunamadı',
          code: error.code || 'SELECT_ERROR',
        },
        { status: 500 }
      )
    }

    // Participant'ları güncelle (çoklu kullanıcı atama)
    if (body.participantIds !== undefined) {
      try {
        // Mevcut participant'ları sil
        // @ts-ignore - Supabase type inference issue
        await supabase
          .from('MeetingParticipant')
          .delete()
          .eq('meetingId', id)
          .eq('companyId', session.user.companyId)

        // Yeni participant'ları ekle
        if (Array.isArray(body.participantIds) && body.participantIds.length > 0) {
          const participants = body.participantIds.map((userId: string) => ({
            meetingId: id,
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
            console.error('MeetingParticipant update error:', participantError)
            // Participant hatası ana işlemi engellemez, sadece log
          }
          // Trigger otomatik olarak yeni eklenen participant'lara bildirim gönderecek
        }
      } catch (participantError) {
        console.error('MeetingParticipant update error:', participantError)
        // Participant hatası ana işlemi engellemez
      }
    }

    // ActivityLog kaydı
    try {
      // @ts-ignore - Supabase type inference issue
      await supabase.from('ActivityLog').insert([
        {
          entity: 'Meeting',
          action: 'UPDATE',
          description: `Görüşme bilgileri güncellendi: ${body.title}`,
          meta: { 
            entity: 'Meeting', 
            action: 'update', 
            meetingId: id,
            companyId: session.user.companyId,
            createdBy: session.user.id,
            ...body 
          },
          userId: session.user.id,
          companyId: session.user.companyId,
        },
      ] as any)
    } catch (activityError) {
      console.error('ActivityLog error:', activityError)
    }

    return NextResponse.json(meeting)
  } catch (error: any) {
    console.error('Meetings [id] PUT API exception:', error)
    return NextResponse.json(
      { error: 'Failed to update meeting', message: error?.message || 'Unknown error' },
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

    // Permission check - canDelete kontrolü (meeting modülü için activity yetkisi kullanıyoruz)
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canDelete = await hasPermission('activity', 'delete', session.user.id)
    if (!canDelete) {
      return buildPermissionDeniedResponse()
    }

    const { id } = await params
    const supabase = getSupabaseWithServiceRole()

    // SuperAdmin kontrolü
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId

    // Meeting'in var olup olmadığını ve yetki kontrolü yap
    let checkQuery = supabase
      .from('Meeting')
      .select('id, title, companyId')
      .eq('id', id)

    if (!isSuperAdmin) {
      checkQuery = checkQuery.eq('companyId', companyId)
    }

    const { data: meeting } = await checkQuery.single()

    if (!meeting) {
      return NextResponse.json({ error: 'Görüşme bulunamadı' }, { status: 404 })
    }

    // Önce giderleri sil (Finance tablosundan)
    await supabase
      .from('Finance')
      .delete()
      .eq('relatedTo', 'Meeting')
      .eq('relatedId', id)

    // Meeting'i sil
    const { error } = await supabase
      .from('Meeting')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Meetings [id] DELETE API error:', error)
      return NextResponse.json(
        { error: error.message || 'Toplantı silinemedi' },
        { status: 500 }
      )
    }

    // ActivityLog kaydı
    try {
      // @ts-ignore - Supabase type inference issue
      await supabase.from('ActivityLog').insert([
        {
          entity: 'Meeting',
          action: 'DELETE',
          description: `Görüşme silindi: ${(meeting as any)?.title || 'Unknown'}`,
          meta: { 
            entity: 'Meeting', 
            action: 'delete', 
            meetingId: id,
            companyId: session.user.companyId,
            createdBy: session.user.id,
          },
          userId: session.user.id,
          companyId: session.user.companyId,
        },
      ] as any)
    } catch (activityError) {
      console.error('ActivityLog error:', activityError)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Meetings [id] DELETE API exception:', error)
    return NextResponse.json(
      { error: 'Toplantı silinemedi', message: error?.message || 'Bilinmeyen hata' },
      { status: 500 }
    )
  }
}

