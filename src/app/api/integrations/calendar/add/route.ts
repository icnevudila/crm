/**
 * Google Calendar Etkinlik Ekleme API
 * Kullanıcı bazlı Google Calendar'a etkinlik ekler
 */

import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { addToUserCalendar, createCalendarEventFromRecord } from '@/lib/integrations/calendar'
import { logAction } from '@/lib/logger'

export async function POST(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.id || !session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: {
      recordType: 'deal' | 'quote' | 'invoice' | 'meeting' | 'task'
      record: any
      startTime?: string
      endTime?: string
      location?: string
      attendees?: Array<{ email: string; displayName?: string }>
    }

    try {
      body = await request.json()
    } catch (jsonError: any) {
      return NextResponse.json(
        { error: 'Geçersiz JSON', message: jsonError?.message || 'İstek gövdesi çözümlenemedi' },
        { status: 400 }
      )
    }

    const { recordType, record, startTime, endTime, location, attendees } = body

    // Validation
    if (!recordType || !record) {
      return NextResponse.json(
        { error: 'recordType ve record gereklidir' },
        { status: 400 }
      )
    }

    // Calendar event options oluştur
    const eventOptions = createCalendarEventFromRecord(recordType, record, {
      startTime,
      endTime,
      location,
      attendees,
    })

    // Kullanıcının Google Calendar'ına ekle
    const result = await addToUserCalendar(
      session.user.id,
      session.user.companyId,
      eventOptions
    )

    if (!result.success) {
      // ActivityLog: Takvim ekleme hatası
      try {
        await logAction({
          entity: 'Integration',
          action: 'CALENDAR_ADD_FAILED',
          description: `Google Calendar'a etkinlik eklenemedi: ${recordType}`,
          meta: {
            entity: 'Integration',
            action: 'calendar_add_failed',
            recordType,
            recordId: record?.id,
            error: result.error,
          },
          userId: session.user.id,
          companyId: session.user.companyId,
        })
      } catch (logError) {
        console.error('ActivityLog error:', logError)
      }
      
      return NextResponse.json(
        { error: result.error || 'Etkinlik oluşturulamadı' },
        { status: 500 }
      )
    }

    // ActivityLog: Başarılı takvim ekleme
    try {
      await logAction({
        entity: 'Integration',
        action: 'CALENDAR_ADDED',
        description: `Google Calendar'a etkinlik eklendi: ${recordType}`,
        meta: {
          entity: 'Integration',
          action: 'calendar_added',
          recordType,
          recordId: record?.id,
          eventId: result.eventId,
        },
        userId: session.user.id,
        companyId: session.user.companyId,
      })
    } catch (logError) {
      console.error('ActivityLog error:', logError)
    }

    return NextResponse.json({
      success: true,
      eventId: result.eventId,
      htmlLink: result.htmlLink,
    })
  } catch (error: any) {
    console.error('Calendar add API error:', error)
    return NextResponse.json(
      { error: 'Etkinlik oluşturulamadı', message: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}



