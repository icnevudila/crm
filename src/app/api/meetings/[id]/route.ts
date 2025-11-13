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
    let query = supabase
      .from('Meeting')
      .select(
        `
        *,
        Customer:Customer(id, name, email, phone),
        Deal:Deal(id, title, stage, value),
        CreatedBy:User!Meeting_createdBy_fkey(id, name, email)
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

    // Meeting verilerini güncelle
    const updateData: any = {
      title: body.title.trim(),
      description: body.description || null,
      meetingDate: body.meetingDate,
      meetingDuration: body.meetingDuration || 60,
      location: body.location || null,
      status: body.status || 'SCHEDULED',
      customerId: body.customerId || null,
      dealId: body.dealId || null,
      updatedAt: new Date().toISOString(),
    }

    // @ts-ignore - Supabase type inference issue
    const { data: meeting, error } = await (supabase
      .from('Meeting') as any)
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Meetings [id] PUT API error:', error)
      return NextResponse.json(
        { error: error.message || 'Toplantı güncellenemedi' },
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

