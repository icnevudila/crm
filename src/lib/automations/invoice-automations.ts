/**
 * Invoice Automation Helpers
 * Invoice oluşturulduğunda/gönderildiğinde otomatik email/SMS/WhatsApp gönderimi
 */

import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { sendEmail } from '@/lib/integrations/email'
import { getUserAutomationPreference, shouldSendAutomation } from './preference-helpers'
import { logAction } from '@/lib/logger'
import { getAndRenderEmailTemplate } from '@/lib/template-renderer'

export interface InvoiceAutomationOptions {
  invoice: {
    id: string
    title: string
    status?: string
    totalAmount?: number
    quoteId?: string
    customerId?: string
  }
  userId: string
  companyId: string
  trigger: 'CREATED' | 'SENT' | 'PAID'
}

/**
 * Invoice oluşturulduğunda otomatik email gönder
 */
export async function sendInvoiceCreatedEmail(options: InvoiceAutomationOptions): Promise<boolean> {
  const { invoice, userId, companyId, trigger } = options

  // Tercih kontrolü
  const preference = await shouldSendAutomation(userId, companyId, 'emailOnInvoiceCreated')
  if (preference === 'NEVER') {
    return false
  }

  // Quote, Deal ve Customer bilgisini çek
  const supabase = getSupabaseWithServiceRole()
  let customerId = invoice.customerId

  if (!customerId && invoice.quoteId) {
    const { data: quote } = await supabase
      .from('Quote')
      .select('dealId, customerId')
      .eq('id', invoice.quoteId)
      .maybeSingle()

    if (quote?.dealId) {
      const { data: deal } = await supabase
        .from('Deal')
        .select('customerId')
        .eq('id', quote.dealId)
        .maybeSingle()
      customerId = quote.customerId || deal?.customerId
    } else {
      customerId = quote?.customerId
    }
  }

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
    templateName: 'invoice_created',
    variables: {
      invoiceTitle: invoice.title,
      invoiceStatus: invoice.status || 'Yeni',
      invoiceAmount: invoice.totalAmount ? `₺${invoice.totalAmount.toLocaleString('tr-TR')}` : 'Belirtilmemiş',
      customerName: customer.name,
    },
  })

  const subject = template?.subject || `Yeni Fatura: ${invoice.title}`
  const html = template?.html || `<p>Merhaba ${customer.name},<br><br>Yeni fatura oluşturuldu: <strong>${invoice.title}</strong></p>`

  // Email gönder
  const result = await sendEmail(companyId, {
    to: customer.email,
    subject,
    html,
  })

  if (result.success) {
    // ActivityLog
    await logAction({
      entity: 'Invoice',
      entityId: invoice.id,
      action: 'EMAIL_SENT',
      description: `Fatura oluşturuldu - E-posta gönderildi: ${customer.email}`,
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
 * Invoice gönderildiğinde/ödendiğinde otomatik email gönder
 */
export async function sendInvoiceStatusEmail(options: InvoiceAutomationOptions): Promise<boolean> {
  const { invoice, userId, companyId, trigger } = options

  // Quote, Deal ve Customer bilgisini çek
  const supabase = getSupabaseWithServiceRole()
  let customerId = invoice.customerId

  if (!customerId && invoice.quoteId) {
    const { data: quote } = await supabase
      .from('Quote')
      .select('dealId, customerId')
      .eq('id', invoice.quoteId)
      .maybeSingle()

    if (quote?.dealId) {
      const { data: deal } = await supabase
        .from('Deal')
        .select('customerId')
        .eq('id', quote.dealId)
        .maybeSingle()
      customerId = quote.customerId || deal?.customerId
    } else {
      customerId = quote?.customerId
    }
  }

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

  const statusLabels = {
    SENT: 'Gönderildi',
    PAID: 'Ödendi',
  }

  const statusLabel = statusLabels[trigger] || trigger

  // Email template'i render et
  const template = await getAndRenderEmailTemplate({
    companyId,
    templateName: `invoice_${trigger.toLowerCase()}`,
    variables: {
      invoiceTitle: invoice.title,
      invoiceStatus: invoice.status || statusLabel,
      invoiceAmount: invoice.totalAmount ? `₺${invoice.totalAmount.toLocaleString('tr-TR')}` : 'Belirtilmemiş',
      customerName: customer.name,
      status: statusLabel,
    },
  })

  const subject = template?.subject || `Fatura ${statusLabel}: ${invoice.title}`
  const html = template?.html || `<p>Merhaba ${customer.name},<br><br>Fatura durumu güncellendi: <strong>${invoice.title}</strong> - <strong>${statusLabel}</strong></p>`

  // Email gönder
  const result = await sendEmail(companyId, {
    to: customer.email,
    subject,
    html,
  })

  if (result.success) {
    // ActivityLog
    await logAction({
      entity: 'Invoice',
      entityId: invoice.id,
      action: 'EMAIL_SENT',
      description: `Fatura ${statusLabel} - E-posta gönderildi: ${customer.email}`,
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



