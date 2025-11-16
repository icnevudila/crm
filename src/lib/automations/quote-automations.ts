/**
 * Quote Automation Helpers
 * Quote oluşturulduğunda/gönderildiğinde otomatik email/SMS/WhatsApp gönderimi
 */

import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { sendEmail } from '@/lib/integrations/email'
import { getUserAutomationPreference, shouldSendAutomation } from './preference-helpers'
import { logAction } from '@/lib/logger'
import { getAndRenderEmailTemplate } from '@/lib/template-renderer'

export interface QuoteAutomationOptions {
  quote: {
    id: string
    title: string
    status?: string
    totalAmount?: number
    dealId?: string
    customerId?: string
  }
  userId: string
  companyId: string
  trigger: 'CREATED' | 'SENT' | 'ACCEPTED'
}

/**
 * Quote oluşturulduğunda otomatik email gönder
 */
export async function sendQuoteCreatedEmail(options: QuoteAutomationOptions): Promise<boolean> {
  const { quote, userId, companyId, trigger } = options

  // Tercih kontrolü
  const preference = await shouldSendAutomation(userId, companyId, 'emailOnQuoteSent')
  if (preference === 'NEVER') {
    return false
  }

  // Deal ve Customer bilgisini çek
  const supabase = getSupabaseWithServiceRole()
  const { data: deal } = await supabase
    .from('Deal')
    .select('customerId')
    .eq('id', quote.dealId)
    .maybeSingle()

  const customerId = quote.customerId || deal?.customerId
  if (!customerId) {
    return false
  }

  const { data: customer } = await supabase
    .from('Customer')
    .select('id, name, email, phone')
    .eq('id', customerId)
    .maybeSingle()

  if (!customer?.email) {
    return false
  }

  // Email template'i render et
  const template = await getAndRenderEmailTemplate({
    companyId,
    templateName: 'quote_created',
    variables: {
      quoteTitle: quote.title,
      quoteStatus: quote.status || 'Yeni',
      quoteAmount: quote.totalAmount ? `₺${quote.totalAmount.toLocaleString('tr-TR')}` : 'Belirtilmemiş',
      customerName: customer.name,
    },
  })

  const subject = template?.subject || `Yeni Teklif: ${quote.title}`
  const html = template?.html || `<p>Merhaba ${customer.name},<br><br>Yeni teklif oluşturuldu: <strong>${quote.title}</strong></p>`

  // Email gönder
  const result = await sendEmail(companyId, {
    to: customer.email,
    subject,
    html,
  })

  if (result.success) {
    // ActivityLog
    await logAction({
      entity: 'Quote',
      entityId: quote.id,
      action: 'EMAIL_SENT',
      description: `Teklif oluşturuldu - E-posta gönderildi: ${customer.email}`,
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
 * Quote gönderildiğinde otomatik email gönder
 */
export async function sendQuoteSentEmail(options: QuoteAutomationOptions): Promise<boolean> {
  const { quote, userId, companyId, trigger } = options

  // Deal ve Customer bilgisini çek
  const supabase = getSupabaseWithServiceRole()
  const { data: deal } = await supabase
    .from('Deal')
    .select('customerId')
    .eq('id', quote.dealId)
    .maybeSingle()

  const customerId = quote.customerId || deal?.customerId
  if (!customerId) {
    return false
  }

  const { data: customer } = await supabase
    .from('Customer')
    .select('id, name, email, phone')
    .eq('id', customerId)
    .maybeSingle()

  if (!customer?.email) {
    return false
  }

  // Email template'i render et
  const template = await getAndRenderEmailTemplate({
    companyId,
    templateName: 'quote_sent',
    variables: {
      quoteTitle: quote.title,
      quoteStatus: quote.status || 'Gönderildi',
      quoteAmount: quote.totalAmount ? `₺${quote.totalAmount.toLocaleString('tr-TR')}` : 'Belirtilmemiş',
      customerName: customer.name,
    },
  })

  const subject = template?.subject || `Teklif Gönderildi: ${quote.title}`
  const html = template?.html || `<p>Merhaba ${customer.name},<br><br>Teklif gönderildi: <strong>${quote.title}</strong></p>`

  // Email gönder
  const result = await sendEmail(companyId, {
    to: customer.email,
    subject,
    html,
  })

  if (result.success) {
    // ActivityLog
    await logAction({
      entity: 'Quote',
      entityId: quote.id,
      action: 'EMAIL_SENT',
      description: `Teklif gönderildi - E-posta gönderildi: ${customer.email}`,
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



