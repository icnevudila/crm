import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { createMeetingByType } from '@/lib/meeting-apis'

/**
 * POST /api/meetings/create-video-meeting
 * Video meeting (Zoom/Meet/Teams) oluşturma endpoint'i
 */
export async function POST(request: Request) {
  try {
    // Session kontrolü
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canCreate kontrolü
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
      return NextResponse.json(
        { error: 'Geçersiz JSON', message: jsonError?.message || 'İstek gövdesi çözümlenemedi' },
        { status: 400 }
      )
    }

    // Zorunlu alanları kontrol et
    const { meetingType, title, meetingDate, meetingDuration, description, attendees } = body

    if (!meetingType || !['ZOOM', 'GOOGLE_MEET', 'TEAMS'].includes(meetingType)) {
      return NextResponse.json(
        { error: 'Geçersiz meeting tipi. ZOOM, GOOGLE_MEET veya TEAMS olmalı.' },
        { status: 400 }
      )
    }

    if (!title || title.trim() === '') {
      return NextResponse.json({ error: 'Toplantı başlığı gereklidir' }, { status: 400 })
    }

    if (!meetingDate) {
      return NextResponse.json({ error: 'Toplantı tarihi gereklidir' }, { status: 400 })
    }

    if (!meetingDuration || meetingDuration < 1) {
      return NextResponse.json({ error: 'Toplantı süresi gereklidir (dakika cinsinden)' }, { status: 400 })
    }

    // Meeting Date'i ISO 8601 formatına çevir
    const startTime = new Date(meetingDate).toISOString()

    // Company integrations'ı getir
    const supabase = getSupabaseWithServiceRole()
    const { data: companyIntegration } = await supabase
      .from('CompanyIntegration')
      .select('*')
      .eq('companyId', session.user.companyId)
      .maybeSingle()

    // Video meeting oluştur - company credentials kullan
    const result = await createMeetingByType(
      meetingType,
      {
        title: title.trim(),
        startTime,
        duration: meetingDuration || 60,
        description: description || '',
        attendees: attendees || [],
        password: body.password,
      },
      companyIntegration // Company credentials'ları geç
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Video meeting oluşturulamadı' },
        { status: 500 }
      )
    }

    // Başarılı yanıt döndür
    return NextResponse.json({
      success: true,
      meetingUrl: result.meetingUrl,
      meetingId: result.meetingId,
      password: result.password,
      joinUrl: result.joinUrl,
      message: `${meetingType} meeting başarıyla oluşturuldu`,
    })
  } catch (error: any) {
    console.error('Create video meeting API error:', error)
    return NextResponse.json(
      { error: 'Video meeting oluşturulamadı', message: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

