/**
 * Google Calendar Entegrasyonu Kontrol API
 * Kullanıcının aktif Google Calendar entegrasyonu var mı kontrol eder
 */

import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { checkGoogleCalendarIntegration } from '@/lib/integrations/check-integration'

export async function GET(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.id || !session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const status = await checkGoogleCalendarIntegration(session.user.companyId)

    return NextResponse.json(status)
  } catch (error: any) {
    console.error('Google Calendar check error:', error)
    return NextResponse.json(
      { error: 'Google Calendar durumu kontrol edilemedi', message: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

