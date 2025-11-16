/**
 * Toplu Gönderim API
 * Birden fazla müşteriye toplu mesaj gönderimi
 */

import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { sendEmail } from '@/lib/integrations/email'
import { sendSms } from '@/lib/integrations/sms'
import { sendWhatsApp } from '@/lib/integrations/whatsapp'
import { checkEmailIntegration, checkSmsIntegration, checkWhatsAppIntegration } from '@/lib/integrations/check-integration'
import { logAction } from '@/lib/logger'
import { renderTemplate } from '@/lib/template-renderer'

interface BulkSendRequest {
  recipients: Array<{
    id: string
    email?: string
    phone?: string
    name?: string
    [key: string]: any // Template değişkenleri için
  }>
  type: 'email' | 'sms' | 'whatsapp'
  subject?: string // Email için
  message: string // Template string ({{variableName}} formatında)
  templateId?: string
  sendImmediately?: boolean
  scheduledAt?: string
  delayBetweenMessages?: number // Saniye cinsinden
}

export async function POST(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: BulkSendRequest = await request.json()
    const { recipients, type, subject, message, templateId, sendImmediately = true, delayBetweenMessages = 1 } = body

    // Validation
    if (!recipients || recipients.length === 0) {
      return NextResponse.json({ error: 'Alıcı listesi boş' }, { status: 400 })
    }
    if (!message || message.trim() === '') {
      return NextResponse.json({ error: 'Mesaj içeriği boş' }, { status: 400 })
    }
    if (type === 'email' && !subject) {
      return NextResponse.json({ error: 'E-posta konusu gereklidir' }, { status: 400 })
    }

    // Entegrasyon kontrolü
    if (type === 'email') {
      const emailIntegration = await checkEmailIntegration(session.user.companyId)
      if (!emailIntegration.hasIntegration || !emailIntegration.isActive) {
        return NextResponse.json({ error: emailIntegration.message }, { status: 400 })
      }
    } else if (type === 'sms') {
      const smsIntegration = await checkSmsIntegration(session.user.companyId)
      if (!smsIntegration.hasIntegration || !smsIntegration.isActive) {
        return NextResponse.json({ error: smsIntegration.message }, { status: 400 })
      }
    } else if (type === 'whatsapp') {
      const whatsappIntegration = await checkWhatsAppIntegration(session.user.companyId)
      if (!whatsappIntegration.hasIntegration || !whatsappIntegration.isActive) {
        return NextResponse.json({ error: whatsappIntegration.message }, { status: 400 })
      }
    }

    const results = {
      sent: [] as Array<{ recipient: string; success: boolean; error?: string }>,
      failed: [] as Array<{ recipient: string; error: string }>,
      total: recipients.length,
    }

    // Her alıcıya mesaj gönder
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i]
      
      try {
        // Template değişkenlerini hazırla
        const variables: Record<string, any> = {
          customerName: recipient.name || '',
          companyName: recipient.companyName || recipient.company?.name || '',
          ...recipient, // Tüm recipient özelliklerini değişken olarak ekle
        }

        // Template'i render et
        const renderedMessage = renderTemplate(message, variables)
        const renderedSubject = subject ? renderTemplate(subject, variables) : undefined

        // Gönderim tipine göre mesaj gönder
        if (type === 'email' && recipient.email) {
          await sendEmail({
            to: recipient.email,
            subject: renderedSubject || 'Mesaj',
            html: renderedMessage,
            text: renderedMessage.replace(/<[^>]*>/g, ''), // HTML'den düz metin çıkar
          })

          // ActivityLog
          await logAction({
            entity: 'Integration',
            action: 'EMAIL_SENT',
            description: `Toplu e-posta gönderildi: ${recipient.email}`,
            meta: {
              type: 'bulk',
              recipient: recipient.email,
              recipientId: recipient.id,
              templateId,
              subject: renderedSubject,
            },
          })

          results.sent.push({ recipient: recipient.email, success: true })
        } else if (type === 'sms' && recipient.phone) {
          const phoneNumber = recipient.phone.startsWith('+') 
            ? recipient.phone 
            : `+${recipient.phone.replace(/\D/g, '')}`

          await sendSms({
            to: phoneNumber,
            message: renderedMessage,
          })

          // ActivityLog
          await logAction({
            entity: 'Integration',
            action: 'SMS_SENT',
            description: `Toplu SMS gönderildi: ${phoneNumber}`,
            meta: {
              type: 'bulk',
              recipient: phoneNumber,
              recipientId: recipient.id,
              templateId,
            },
          })

          results.sent.push({ recipient: phoneNumber, success: true })
        } else if (type === 'whatsapp' && recipient.phone) {
          const phoneNumber = recipient.phone.startsWith('+') 
            ? recipient.phone 
            : `+${recipient.phone.replace(/\D/g, '')}`

          await sendWhatsApp({
            to: phoneNumber,
            message: renderedMessage,
          })

          // ActivityLog
          await logAction({
            entity: 'Integration',
            action: 'WHATSAPP_SENT',
            description: `Toplu WhatsApp mesajı gönderildi: ${phoneNumber}`,
            meta: {
              type: 'bulk',
              recipient: phoneNumber,
              recipientId: recipient.id,
              templateId,
            },
          })

          results.sent.push({ recipient: phoneNumber, success: true })
        } else {
          // Geçersiz alıcı bilgisi
          const error = type === 'email' 
            ? 'E-posta adresi yok' 
            : 'Telefon numarası yok'
          results.failed.push({ 
            recipient: recipient.name || recipient.id, 
            error 
          })
        }

        // Mesajlar arası gecikme (rate limiting için)
        if (i < recipients.length - 1 && delayBetweenMessages > 0) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenMessages * 1000))
        }
      } catch (error: any) {
        console.error(`Bulk send error for recipient ${recipient.id}:`, error)
        const recipientInfo = type === 'email' 
          ? recipient.email 
          : recipient.phone || recipient.name || recipient.id
        
        results.failed.push({
          recipient: recipientInfo || 'Bilinmeyen',
          error: error?.message || 'Bilinmeyen hata',
        })

        // ActivityLog - Hata
        await logAction({
          entity: 'Integration',
          action: type === 'email' ? 'EMAIL_SEND_FAILED' : type === 'sms' ? 'SMS_SEND_FAILED' : 'WHATSAPP_SEND_FAILED',
          description: `Toplu ${type} gönderimi başarısız: ${recipientInfo}`,
          meta: {
            type: 'bulk',
            recipient: recipientInfo,
            recipientId: recipient.id,
            templateId,
            error: error?.message,
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      results: {
        sent: results.sent.length,
        failed: results.failed.length,
        total: results.total,
        details: {
          sent: results.sent,
          failed: results.failed,
        },
      },
    })
  } catch (error: any) {
    console.error('Bulk send error:', error)
    return NextResponse.json(
      { error: error?.message || 'Toplu gönderim başarısız oldu' },
      { status: 500 }
    )
  }
}

