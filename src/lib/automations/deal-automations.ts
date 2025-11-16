/**
 * Deal Automation Helpers
 * Deal oluşturulduğunda/güncellendiğinde otomatik email/SMS/WhatsApp gönderimi
 */

import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { sendEmail } from '@/lib/integrations/email'
import { getUserAutomationPreference, shouldSendAutomation } from './preference-helpers'
import { logAction } from '@/lib/logger'
import { getAndRenderEmailTemplate } from '@/lib/template-renderer'

export interface DealAutomationOptions {
  deal: {
    id: string
    title: string
    stage?: string
    value?: number
    customerId?: string
    customerCompanyId?: string
  }
  userId: string
  companyId: string
  trigger: 'CREATED' | 'WON' | 'LOST' | 'CLOSED'
}

/**
 * Deal oluşturulduğunda otomatik email gönder
 */
export async function sendDealCreatedEmail(options: DealAutomationOptions): Promise<boolean> {
  const { deal, userId, companyId, trigger } = options

  // Tercih kontrolü
  const preference = await shouldSendAutomation(userId, companyId, 'emailOnDealCreated')
  if (preference === 'NEVER') {
    return false
  }

  // Customer bilgisini çek
  const supabase = getSupabaseWithServiceRole()
  const { data: customer } = await supabase
    .from('Customer')
    .select('id, name, email, phone')
    .eq('id', deal.customerId)
    .maybeSingle()

  if (!customer?.email) {
    return false
  }

  // Email template'i render et
  const template = await getAndRenderEmailTemplate({
    companyId,
    templateName: 'deal_created',
    variables: {
      dealTitle: deal.title,
      dealStage: deal.stage || 'Yeni',
      dealValue: deal.value ? `₺${deal.value.toLocaleString('tr-TR')}` : 'Belirtilmemiş',
      customerName: customer.name,
    },
  })

  const subject = template?.subject || `Yeni Fırsat: ${deal.title}`
  const html = template?.html || `<p>Merhaba ${customer.name},<br><br>Yeni fırsat oluşturuldu: <strong>${deal.title}</strong></p>`

  // Email gönder
  const result = await sendEmail(companyId, {
    to: customer.email,
    subject,
    html,
  })

  if (result.success) {
    // ActivityLog
    await logAction({
      entity: 'Deal',
      entityId: deal.id,
      action: 'EMAIL_SENT',
      description: `Fırsat oluşturuldu - E-posta gönderildi: ${customer.email}`,
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
 * Deal WON/LOST/CLOSED durumunda otomatik email gönder
 */
export async function sendDealStatusEmail(options: DealAutomationOptions): Promise<boolean> {
  const { deal, userId, companyId, trigger } = options

  // Customer bilgisini çek
  const supabase = getSupabaseWithServiceRole()
  const { data: customer } = await supabase
    .from('Customer')
    .select('id, name, email, phone')
    .eq('id', deal.customerId)
    .maybeSingle()

  if (!customer?.email) {
    return false
  }

  const statusLabels = {
    WON: 'Kazanıldı',
    LOST: 'Kaybedildi',
    CLOSED: 'Kapatıldı',
  }

  const statusLabel = statusLabels[trigger] || trigger

  // Email template'i render et
  const template = await getAndRenderEmailTemplate({
    companyId,
    templateName: `deal_${trigger.toLowerCase()}`,
    variables: {
      dealTitle: deal.title,
      dealStage: deal.stage || 'Yeni',
      dealValue: deal.value ? `₺${deal.value.toLocaleString('tr-TR')}` : 'Belirtilmemiş',
      customerName: customer.name,
      status: statusLabel,
    },
  })

  const subject = template?.subject || `Fırsat ${statusLabel}: ${deal.title}`
  const html = template?.html || `<p>Merhaba ${customer.name},<br><br>Fırsat durumu güncellendi: <strong>${deal.title}</strong> - <strong>${statusLabel}</strong></p>`

  // Email gönder
  const result = await sendEmail(companyId, {
    to: customer.email,
    subject,
    html,
  })

  if (result.success) {
    // ActivityLog
    await logAction({
      entity: 'Deal',
      entityId: deal.id,
      action: 'EMAIL_SENT',
      description: `Fırsat ${statusLabel} - E-posta gönderildi: ${customer.email}`,
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



