/**
 * SMS Gönderim API
 * Twilio ile SMS gönderir
 */

import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { sendSms } from '@/lib/integrations/sms'
import { checkSmsIntegration } from '@/lib/integrations/check-integration'
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

    // SMS entegrasyonu kontrolü
    const integrationStatus = await checkSmsIntegration(session.user.companyId)
    if (!integrationStatus.hasIntegration || !integrationStatus.isActive) {
      return NextResponse.json(
        { error: integrationStatus.message },
        { status: 400 }
      )
    }

    let body: { to: string; message: string; from?: string }
    try {
      body = await request.json()
    } catch (jsonError: any) {
      return NextResponse.json(
        { error: 'Geçersiz JSON', message: jsonError?.message || 'İstek gövdesi çözümlenemedi' },
        { status: 400 }
      )
    }

    const { to, message, from } = body

    // Validation
    if (!to) {
      return NextResponse.json({ error: 'Alıcı telefon numarası gereklidir' }, { status: 400 })
    }
    if (!message) {
      return NextResponse.json({ error: 'SMS mesajı gereklidir' }, { status: 400 })
    }

    // Telefon numarası formatı kontrolü (E.164 formatında olmalı)
    if (!to.startsWith('+')) {
      return NextResponse.json(
        { error: 'Telefon numarası E.164 formatında olmalıdır (örn: +905551234567)' },
        { status: 400 }
      )
    }

    // SMS gönder (companyId ile)
    const result = await sendSms({
      to,
      message,
      from,
      companyId: session.user.companyId,
    })

    if (!result.success) {
      // ActivityLog: SMS gönderim hatası
      try {
        await logAction({
          entity: 'Integration',
          action: 'SMS_SEND_FAILED',
          description: `SMS gönderilemedi: ${to}`,
          meta: {
            entity: 'Integration',
            action: 'sms_send_failed',
            to,
            error: result.error,
          },
          userId: session.user.id,
          companyId: session.user.companyId,
        })
      } catch (logError) {
        console.error('ActivityLog error:', logError)
      }
      
      return NextResponse.json({ error: result.error || 'SMS gönderilemedi' }, { status: 500 })
    }

    // ActivityLog: Başarılı SMS gönderimi
    try {
      await logAction({
        entity: 'Integration',
        action: 'SMS_SENT',
        description: `SMS gönderildi: ${to}`,
        meta: {
          entity: 'Integration',
          action: 'sms_sent',
          to,
          messageId: result.messageId,
        },
        userId: session.user.id,
        companyId: session.user.companyId,
      })
    } catch (logError) {
      console.error('ActivityLog error:', logError)
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    })
  } catch (error: any) {
    console.error('SMS send API error:', error)
    return NextResponse.json(
      { error: 'SMS gönderilemedi', message: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

