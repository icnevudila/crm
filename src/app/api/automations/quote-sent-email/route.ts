/**
 * Quote Sent Email Automation API
 * Quote gönderildiğinde email gönderir (kullanıcı tercihine göre)
 */

import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { sendQuoteSentEmail } from '@/lib/automations/quote-automations'
import { shouldSendAutomation } from '@/lib/automations/preference-helpers'

export async function POST(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { quote } = body

    if (!quote || !quote.id) {
      return NextResponse.json(
        { error: 'Quote bilgisi gereklidir' },
        { status: 400 }
      )
    }

    // Tercih kontrolü
    const preference = await shouldSendAutomation(
      session.user.id,
      session.user.companyId,
      'emailOnQuoteSent'
    )

    if (preference === 'NEVER') {
      return NextResponse.json({
        success: false,
        message: 'Kullanıcı tercihi: Hiç gönderme',
      })
    }

    // ALWAYS ise direkt gönder, ASK ise frontend'e bildir
    if (preference === 'ALWAYS') {
      const result = await sendQuoteSentEmail({
        quote,
        userId: session.user.id,
        companyId: session.user.companyId,
        trigger: 'SENT',
      })

      return NextResponse.json({
        success: result,
        message: result ? 'E-posta gönderildi' : 'E-posta gönderilemedi',
      })
    }

    // ASK - Frontend'e bildir (toast gösterilecek)
    return NextResponse.json({
      success: true,
      shouldAsk: true,
      message: 'Kullanıcıya sorulacak',
    })
  } catch (error: any) {
    console.error('Quote sent email automation error:', error)
    return NextResponse.json(
      { error: 'E-posta gönderilemedi', message: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}



