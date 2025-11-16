/**
 * Test Calendar Event API
 * Kullanıcının Google Calendar'ına test event ekler
 */

import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { checkGoogleCalendarIntegration } from '@/lib/integrations/check-integration'
import { addToUserCalendar, createCalendarEventFromRecord } from '@/lib/integrations/calendar'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

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
        { error: integrationStatus.message },
        { status: 400 }
      )
    }

    // Test event oluştur (yarın saat 14:00)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(14, 0, 0, 0)

    const testEvent = {
      title: 'Test Etkinlik - CRM Entegrasyonu',
      description: 'Bu bir test etkinliğidir. Google Calendar entegrasyonunuz başarıyla çalışıyor! 🎉',
      startTime: tomorrow.toISOString(),
      endTime: new Date(tomorrow.getTime() + 60 * 60 * 1000).toISOString(), // 1 saat sonra
      location: 'CRM Sistemi',
    }

    // Calendar event oluştur
    const eventData = createCalendarEventFromRecord({
      title: testEvent.title,
      description: testEvent.description,
      startTime: testEvent.startTime,
      endTime: testEvent.endTime,
      location: testEvent.location,
      attendees: [session.user.email],
    })

    const result = await addToUserCalendar({
      userId: session.user.id,
      companyId: session.user.companyId,
      event: eventData,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Test event eklenemedi' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `✅ Google Calendar entegrasyonu çalışıyor!\n\nTest etkinlik Google Calendar'ınıza başarıyla eklendi.\n\nEtkinlik: ${testEvent.title}\nTarih: ${new Date(testEvent.startTime).toLocaleString('tr-TR')}\n\nEvent ID: ${result.eventId}`,
      eventId: result.eventId,
      eventUrl: result.eventUrl,
    })
  } catch (error: any) {
    console.error('Test Calendar API error:', error)
    return NextResponse.json(
      { error: 'Test event eklenemedi', message: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

