/**
 * User Automation Preferences API
 * Kullanıcı otomasyon tercihlerini yönetir
 */

import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getUserAutomationPreference, updateUserAutomationPreference } from '@/lib/automations/preference-helpers'

export async function GET(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const preference = await getUserAutomationPreference(session.user.id, session.user.companyId)
    return NextResponse.json(preference)
  } catch (error: any) {
    console.error('Get automation preferences error:', error)
    return NextResponse.json(
      { error: 'Tercihler alınamadı', message: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { automationType, preference } = body

    if (!automationType || !preference) {
      return NextResponse.json(
        { error: 'automationType ve preference gereklidir' },
        { status: 400 }
      )
    }

    if (!['ALWAYS', 'ASK', 'NEVER'].includes(preference)) {
      return NextResponse.json(
        { error: 'preference ALWAYS, ASK veya NEVER olmalıdır' },
        { status: 400 }
      )
    }

    const updated = await updateUserAutomationPreference(
      session.user.id,
      session.user.companyId,
      { [automationType]: preference }
    )

    if (!updated) {
      return NextResponse.json(
        { error: 'Tercih güncellenemedi' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, preference: updated })
  } catch (error: any) {
    console.error('Update automation preferences error:', error)
    return NextResponse.json(
      { error: 'Tercih güncellenemedi', message: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}



