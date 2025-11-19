/**
 * E-posta Gönderim API
 * Company credentials kullanarak e-posta gönderir
 */

import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { sendEmail } from '@/lib/integrations/email'
import { checkEmailIntegration } from '@/lib/integrations/check-integration'
import { logAction } from '@/lib/logger'

export async function POST(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Email entegrasyonu kontrolü
    const integrationStatus = await checkEmailIntegration(session.user.companyId)
    if (!integrationStatus.hasIntegration || !integrationStatus.isActive) {
      return NextResponse.json(
        { error: integrationStatus.message },
        { status: 400 }
      )
    }

    let body: { to: string | string[]; subject: string; html: string; text?: string; from?: string; fromName?: string }
    try {
      body = await request.json()
    } catch (jsonError: any) {
      return NextResponse.json(
        { error: 'Geçersiz JSON', message: jsonError?.message || 'İstek gövdesi çözümlenemedi' },
        { status: 400 }
      )
    }

    const { to, subject, html, text, from, fromName } = body

    // Validation
    if (!to) {
      return NextResponse.json({ error: 'Alıcı e-posta adresi gereklidir' }, { status: 400 })
    }
    if (!subject || !html) {
      return NextResponse.json({ error: 'E-posta konusu ve içeriği gereklidir' }, { status: 400 })
    }

    // Company credentials kullanarak e-posta gönder
    const result = await sendEmail(session.user.companyId, {
      to,
      subject,
      html,
      text,
      from,
      fromName,
    })

    if (!result.success) {
      // ActivityLog: E-posta gönderim hatası
      try {
        await logAction({
          entity: 'Integration',
          action: 'EMAIL_SEND_FAILED',
          description: `E-posta gönderilemedi: ${subject} → ${Array.isArray(to) ? to.join(', ') : to}`,
          meta: {
            entity: 'Integration',
            action: 'email_send_failed',
            to: Array.isArray(to) ? to : [to],
            subject,
            error: result.error,
          },
          userId: session.user.id,
          companyId: session.user.companyId,
        })
      } catch (logError) {
        // ActivityLog hatası ana işlemi engellemez
        console.error('ActivityLog error:', logError)
      }
      
      return NextResponse.json({ error: result.error || 'E-posta gönderilemedi' }, { status: 500 })
    }

    // ActivityLog: Başarılı e-posta gönderimi
    try {
      await logAction({
        entity: 'Integration',
        action: 'EMAIL_SENT',
        description: `E-posta gönderildi: ${subject} → ${Array.isArray(to) ? to.join(', ') : to}`,
        meta: {
          entity: 'Integration',
          action: 'email_sent',
          to: Array.isArray(to) ? to : [to],
          subject,
          messageId: result.messageId,
        },
        userId: session.user.id,
        companyId: session.user.companyId,
      })
    } catch (logError) {
      // ActivityLog hatası ana işlemi engellemez
      console.error('ActivityLog error:', logError)
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    })
  } catch (error: any) {
    console.error('Email send API error:', error)
    return NextResponse.json(
      { error: 'E-posta gönderilemedi', message: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}



