/**
 * WhatsApp Entegrasyonu Kontrol API
 * Company'nin aktif WhatsApp entegrasyonu var mı kontrol eder
 */

import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { checkWhatsAppIntegration } from '@/lib/integrations/check-integration'

export async function GET(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const status = await checkWhatsAppIntegration(session.user.companyId)

    return NextResponse.json(status)
  } catch (error: any) {
    console.error('WhatsApp check error:', error)
    return NextResponse.json(
      { error: 'WhatsApp durumu kontrol edilemedi', message: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}



