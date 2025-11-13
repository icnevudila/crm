import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'

import { createNotification } from '@/lib/notification-helper'

/**
 * Test endpoint - Bildirim oluşturma testi için
 * GET /api/notifications/test
 */
export async function GET(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Test bildirimi oluştur
    await createNotification({
      userId: session.user.id,
      companyId: session.user.companyId,
      title: 'Test Bildirimi',
      message: 'Bu bir test bildirimidir. Bildirim sistemi çalışıyor! 🎉',
      type: 'info',
      priority: 'normal',
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Test bildirimi oluşturuldu. Bildirim menüsünü kontrol edin.' 
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create test notification' },
      { status: 500 }
    )
  }
}


