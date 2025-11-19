/**
 * Invoice Created Email Automation API
 * Invoice oluşturulduğunda email gönderir (kullanıcı tercihine göre)
 */

import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { sendInvoiceCreatedEmail } from '@/lib/automations/invoice-automations'
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
    const { invoice } = body

    if (!invoice || !invoice.id) {
      return NextResponse.json(
        { error: 'Invoice bilgisi gereklidir' },
        { status: 400 }
      )
    }

    // Tercih kontrolü
    const preference = await shouldSendAutomation(
      session.user.id,
      session.user.companyId,
      'emailOnInvoiceCreated'
    )

    if (preference === 'NEVER') {
      return NextResponse.json({
        success: false,
        message: 'Kullanıcı tercihi: Hiç gönderme',
      })
    }

    // ALWAYS ise direkt gönder, ASK ise frontend'e bildir
    if (preference === 'ALWAYS') {
      const result = await sendInvoiceCreatedEmail({
        invoice,
        userId: session.user.id,
        companyId: session.user.companyId,
        trigger: 'CREATED',
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
    console.error('Invoice created email automation error:', error)
    return NextResponse.json(
      { error: 'E-posta gönderilemedi', message: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}



