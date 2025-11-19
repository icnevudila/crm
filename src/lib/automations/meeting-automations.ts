/**
 * Meeting Automation Helpers
 * Meeting oluşturulduğunda/hatırlatmasında otomatik email/SMS/WhatsApp gönderimi
 */

import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { sendEmail } from '@/lib/integrations/email'
import { getUserAutomationPreference, shouldSendAutomation } from './preference-helpers'
import { logAction } from '@/lib/logger'
import { getAndRenderEmailTemplate } from '@/lib/template-renderer'

export interface MeetingAutomationOptions {
  meeting: {
    id: string
    title: string
    meetingDate: string
    meetingDuration?: number
    location?: string
    meetingUrl?: string
    meetingPassword?: string
    customerId?: string
  }
  userId: string
  companyId: string
  trigger: 'CREATED' | 'REMINDER_24H' | 'REMINDER_1H'
}

/**
 * Meeting oluşturulduğunda otomatik email gönder
 */
export async function sendMeetingCreatedEmail(options: MeetingAutomationOptions): Promise<boolean> {
  const { meeting, userId, companyId, trigger } = options

  // Tercih kontrolü
  const preference = await shouldSendAutomation(userId, companyId, 'emailOnMeetingReminder')
  if (preference === 'NEVER') {
    return false
  }

  // Customer bilgisini çek
  const supabase = getSupabaseWithServiceRole()
  const { data: customer } = await supabase
    .from('Customer')
    .select('id, name, email, phone')
    .eq('id', meeting.customerId)
    .maybeSingle()

  if (!customer?.email) {
    return false
  }

  // Meeting tarih formatı
  const meetingDate = new Date(meeting.meetingDate)
  const formattedDate = meetingDate.toLocaleString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  // Email template'i render et
  const template = await getAndRenderEmailTemplate({
    companyId,
    templateName: 'meeting_created',
    variables: {
      meetingTitle: meeting.title,
      meetingDate: formattedDate,
      meetingDuration: meeting.meetingDuration ? `${meeting.meetingDuration} dakika` : 'Belirtilmemiş',
      meetingLocation: meeting.location || 'Belirtilmemiş',
      meetingUrl: meeting.meetingUrl || '',
      meetingPassword: meeting.meetingPassword || '',
      customerName: customer.name,
    },
  })

  const subject = template?.subject || `Toplantı Daveti: ${meeting.title}`
  const html = template?.html || `
    <p>Merhaba ${customer.name},</p>
    <p>Yeni toplantı planlandı:</p>
    <ul>
      <li><strong>Başlık:</strong> ${meeting.title}</li>
      <li><strong>Tarih:</strong> ${formattedDate}</li>
      ${meeting.meetingDuration ? `<li><strong>Süre:</strong> ${meeting.meetingDuration} dakika</li>` : ''}
      ${meeting.location ? `<li><strong>Konum:</strong> ${meeting.location}</li>` : ''}
      ${meeting.meetingUrl ? `<li><strong>Toplantı Linki:</strong> <a href="${meeting.meetingUrl}">${meeting.meetingUrl}</a></li>` : ''}
      ${meeting.meetingPassword ? `<li><strong>Şifre:</strong> ${meeting.meetingPassword}</li>` : ''}
    </ul>
  `

  // Email gönder
  const result = await sendEmail(companyId, {
    to: customer.email,
    subject,
    html,
  })

  if (result.success) {
    // ActivityLog
    await logAction({
      entity: 'Meeting',
      entityId: meeting.id,
      action: 'EMAIL_SENT',
      description: `Toplantı oluşturuldu - E-posta gönderildi: ${customer.email}`,
      meta: {
        trigger,
        customerId: customer.id,
        customerEmail: customer.email,
        subject,
      },
      userId,
      companyId,
    })
    return true
  }

  return false
}

/**
 * Meeting hatırlatması email gönder
 */
export async function sendMeetingReminderEmail(options: MeetingAutomationOptions): Promise<boolean> {
  const { meeting, userId, companyId, trigger } = options

  // Customer bilgisini çek
  const supabase = getSupabaseWithServiceRole()
  const { data: customer } = await supabase
    .from('Customer')
    .select('id, name, email, phone')
    .eq('id', meeting.customerId)
    .maybeSingle()

  if (!customer?.email) {
    return false
  }

  // Meeting tarih formatı
  const meetingDate = new Date(meeting.meetingDate)
  const formattedDate = meetingDate.toLocaleString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const reminderLabels = {
    REMINDER_24H: '24 saat',
    REMINDER_1H: '1 saat',
  }

  const reminderLabel = reminderLabels[trigger] || 'Yakında'

  // Email template'i render et
  const template = await getAndRenderEmailTemplate({
    companyId,
    templateName: 'meeting_reminder',
    variables: {
      meetingTitle: meeting.title,
      meetingDate: formattedDate,
      meetingDuration: meeting.meetingDuration ? `${meeting.meetingDuration} dakika` : 'Belirtilmemiş',
      meetingLocation: meeting.location || 'Belirtilmemiş',
      meetingUrl: meeting.meetingUrl || '',
      meetingPassword: meeting.meetingPassword || '',
      customerName: customer.name,
      reminderTime: reminderLabel,
    },
  })

  const subject = template?.subject || `Toplantı Hatırlatması (${reminderLabel}): ${meeting.title}`
  const html = template?.html || `
    <p>Merhaba ${customer.name},</p>
    <p><strong>Toplantı hatırlatması:</strong> ${reminderLabel} sonra toplantınız var.</p>
    <ul>
      <li><strong>Başlık:</strong> ${meeting.title}</li>
      <li><strong>Tarih:</strong> ${formattedDate}</li>
      ${meeting.meetingDuration ? `<li><strong>Süre:</strong> ${meeting.meetingDuration} dakika</li>` : ''}
      ${meeting.location ? `<li><strong>Konum:</strong> ${meeting.location}</li>` : ''}
      ${meeting.meetingUrl ? `<li><strong>Toplantı Linki:</strong> <a href="${meeting.meetingUrl}">${meeting.meetingUrl}</a></li>` : ''}
      ${meeting.meetingPassword ? `<li><strong>Şifre:</strong> ${meeting.meetingPassword}</li>` : ''}
    </ul>
  `

  // Email gönder
  const result = await sendEmail(companyId, {
    to: customer.email,
    subject,
    html,
  })

  if (result.success) {
    // ActivityLog
    await logAction({
      entity: 'Meeting',
      entityId: meeting.id,
      action: 'EMAIL_SENT',
      description: `Toplantı hatırlatması gönderildi (${reminderLabel}) - E-posta: ${customer.email}`,
      meta: {
        trigger,
        customerId: customer.id,
        customerEmail: customer.email,
        subject,
      },
      userId,
      companyId,
    })
    return true
  }

  return false
}



