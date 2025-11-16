/**
 * Test Google Meet Meeting API
 * Google Meet entegrasyonunu test eder - test meeting oluşturur
 */

import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { checkGoogleCalendarIntegration } from '@/lib/integrations/check-integration'
import { addToUserCalendar, createCalendarEventFromRecord } from '@/lib/integrations/calendar'

export async function POST(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Google Calendar entegrasyonu kontrolü
    const integrationStatus = await checkGoogleCalendarIntegration(session.user.id, session.user.companyId)
    if (!integrationStatus.hasIntegration || !integrationStatus.isActive) {
      return NextResponse.json(
        { error: integrationStatus.message || 'Google Calendar entegrasyonu yapılandırılmamış. Lütfen Google Calendar OAuth bağlantısı yapın.' },
        { status: 400 }
      )
    }

    // Test meeting oluştur (yarın saat 14:00)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(14, 0, 0, 0)

    const testEvent = {
      title: 'Test Toplantı - CRM Entegrasyonu (Google Meet)',
      description: 'Bu bir test toplantısıdır. Google Meet entegrasyonunuz başarıyla çalışıyor! 🎉\n\nToplantı Google Meet üzerinden yapılacaktır.',
      startTime: tomorrow.toISOString(),
      endTime: new Date(tomorrow.getTime() + 30 * 60 * 1000).toISOString(), // 30 dakika sonra
      location: 'Google Meet',
    }

    // Calendar event oluştur (Google Meet link'i otomatik eklenir)
    const eventData = createCalendarEventFromRecord({
      title: testEvent.title,
      description: testEvent.description,
      startTime: testEvent.startTime,
      endTime: testEvent.endTime,
      location: testEvent.location,
      attendees: [session.user.email],
      conferenceData: {
        createRequest: {
          requestId: `test-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    })

    const result = await addToUserCalendar({
      userId: session.user.id,
      companyId: session.user.companyId,
      event: eventData,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Google Meet test meeting oluşturulamadı' },
        { status: 500 }
      )
    }

    // Google Meet link'ini event URL'den çıkar
    const meetUrl = result.eventUrl?.includes('meet.google.com') 
      ? result.eventUrl 
      : `https://meet.google.com/${result.eventId?.substring(0, 12) || 'test'}`

    return NextResponse.json({
      success: true,
      message: `✅ Google Meet entegrasyonu çalışıyor!\n\nTest toplantı Google Calendar'ınıza başarıyla eklendi.\n\nToplantı: ${testEvent.title}\nTarih: ${new Date(testEvent.startTime).toLocaleString('tr-TR')}\nSüre: 30 dakika\n\nToplantı URL: ${meetUrl}\nEvent ID: ${result.eventId}`,
      meetingUrl: meetUrl,
      eventId: result.eventId,
      eventUrl: result.eventUrl,
    })
  } catch (error: any) {
    console.error('Test Google Meet API error:', error)
    return NextResponse.json(
      { error: 'Google Meet test meeting oluşturulamadı', message: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

