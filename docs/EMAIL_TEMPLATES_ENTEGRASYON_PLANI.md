# 📧 Email Templates Entegrasyon Planı

## 🎯 AMAÇ
Email Templates'i sistem olaylarına bağlayarak otomatik e-posta gönderimi yapmak.

---

## 📋 ADIM 1: Email Gönderme Servisi Kurulumu

### 1.1. Nodemailer veya Resend Kurulumu

**Seçenek 1: Resend (Önerilen - Modern, Kolay)**
```bash
npm install resend
```

**Seçenek 2: Nodemailer (Klasik)**
```bash
npm install nodemailer
```

### 1.2. Environment Variables (.env)
```env
# Resend için
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Veya Nodemailer için
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourcompany.com
```

---

## 📋 ADIM 2: Email Service Oluşturma

### 2.1. Email Service Dosyası
`src/lib/email-service.ts` dosyası oluştur:

```typescript
import { Resend } from 'resend'
// veya import nodemailer from 'nodemailer'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
}

export async function sendEmail({ to, subject, html, from }: SendEmailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from: from || process.env.SMTP_FROM || 'noreply@yourcompany.com',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    })

    if (error) {
      console.error('Email send error:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Email service error:', error)
    throw error
  }
}
```

---

## 📋 ADIM 3: Template Renderer Oluşturma

### 3.1. Template Renderer Dosyası
`src/lib/template-renderer.ts` dosyası oluştur:

```typescript
interface TemplateVariables {
  [key: string]: string | number | null | undefined
}

export function renderTemplate(
  template: string,
  variables: TemplateVariables
): string {
  let rendered = template

  // {{variableName}} formatındaki değişkenleri değiştir
  Object.keys(variables).forEach((key) => {
    const value = variables[key] ?? ''
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    rendered = rendered.replace(regex, String(value))
  })

  return rendered
}

export async function getEmailTemplate(
  category: string,
  companyId: string
): Promise<any | null> {
  const supabase = getSupabaseWithServiceRole()
  
  const { data, error } = await supabase
    .from('EmailTemplate')
    .select('*')
    .eq('category', category)
    .eq('companyId', companyId)
    .eq('isActive', true)
    .limit(1)
    .single()

  if (error || !data) {
    return null
  }

  return data
}
```

---

## 📋 ADIM 4: Event Handler'lar Oluşturma

### 4.1. Quote ACCEPTED Event Handler
`src/lib/email-handlers/quote-accepted.ts`:

```typescript
import { sendEmail } from '@/lib/email-service'
import { renderTemplate, getEmailTemplate } from '@/lib/template-renderer'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

export async function handleQuoteAccepted(quoteId: string, companyId: string) {
  try {
    // Quote bilgilerini çek
    const supabase = getSupabaseWithServiceRole()
    const { data: quote } = await supabase
      .from('Quote')
      .select(`
        *,
        Deal (
          *,
          Customer (*)
        )
      `)
      .eq('id', quoteId)
      .single()

    if (!quote || !quote.Deal || !quote.Deal.Customer) {
      return
    }

    // Email template'i çek
    const template = await getEmailTemplate('QUOTE', companyId)
    if (!template) {
      console.log('No email template found for QUOTE category')
      return
    }

    // Değişkenleri hazırla
    const variables = {
      customerName: quote.Deal.Customer.name || '',
      dealTitle: quote.Deal.title || '',
      dealValue: quote.Deal.value || 0,
      quoteTitle: quote.title || '',
      quoteTotal: quote.total || 0,
      companyName: 'Your Company Name', // Company tablosundan çekilebilir
      userName: 'System', // User tablosundan çekilebilir
    }

    // Template'i render et
    const subject = renderTemplate(template.subject || '', variables)
    const body = renderTemplate(template.body, variables)

    // E-posta gönder
    if (quote.Deal.Customer.email) {
      await sendEmail({
        to: quote.Deal.Customer.email,
        subject,
        html: body,
      })

      // ActivityLog'a kaydet
      await supabase.from('ActivityLog').insert({
        entity: 'Quote',
        action: 'EMAIL_SENT',
        description: `E-posta gönderildi: ${quote.Deal.Customer.email}`,
        meta: { quoteId, templateId: template.id },
        userId: null, // System
        companyId,
      })
    }
  } catch (error) {
    console.error('Quote accepted email error:', error)
  }
}
```

### 4.2. Invoice PAID Event Handler
`src/lib/email-handlers/invoice-paid.ts`:

```typescript
import { sendEmail } from '@/lib/email-service'
import { renderTemplate, getEmailTemplate } from '@/lib/template-renderer'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

export async function handleInvoicePaid(invoiceId: string, companyId: string) {
  try {
    // Invoice bilgilerini çek
    const supabase = getSupabaseWithServiceRole()
    const { data: invoice } = await supabase
      .from('Invoice')
      .select(`
        *,
        Quote (
          Deal (
            Customer (*)
          )
        )
      `)
      .eq('id', invoiceId)
      .single()

    if (!invoice || !invoice.Quote || !invoice.Quote.Deal || !invoice.Quote.Deal.Customer) {
      return
    }

    // Email template'i çek
    const template = await getEmailTemplate('INVOICE', companyId)
    if (!template) {
      console.log('No email template found for INVOICE category')
      return
    }

    // Değişkenleri hazırla
    const variables = {
      customerName: invoice.Quote.Deal.Customer.name || '',
      invoiceTitle: invoice.title || '',
      invoiceTotal: invoice.total || 0,
      companyName: 'Your Company Name',
      userName: 'System',
    }

    // Template'i render et
    const subject = renderTemplate(template.subject || '', variables)
    const body = renderTemplate(template.body, variables)

    // E-posta gönder
    if (invoice.Quote.Deal.Customer.email) {
      await sendEmail({
        to: invoice.Quote.Deal.Customer.email,
        subject,
        html: body,
      })

      // ActivityLog'a kaydet
      await supabase.from('ActivityLog').insert({
        entity: 'Invoice',
        action: 'EMAIL_SENT',
        description: `E-posta gönderildi: ${invoice.Quote.Deal.Customer.email}`,
        meta: { invoiceId, templateId: template.id },
        userId: null,
        companyId,
      })
    }
  } catch (error) {
    console.error('Invoice paid email error:', error)
  }
}
```

### 4.3. Deal WON Event Handler
`src/lib/email-handlers/deal-won.ts`:

```typescript
import { sendEmail } from '@/lib/email-service'
import { renderTemplate, getEmailTemplate } from '@/lib/template-renderer'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

export async function handleDealWon(dealId: string, companyId: string) {
  try {
    // Deal bilgilerini çek
    const supabase = getSupabaseWithServiceRole()
    const { data: deal } = await supabase
      .from('Deal')
      .select(`
        *,
        Customer (*)
      `)
      .eq('id', dealId)
      .single()

    if (!deal || !deal.Customer) {
      return
    }

    // Email template'i çek
    const template = await getEmailTemplate('DEAL', companyId)
    if (!template) {
      console.log('No email template found for DEAL category')
      return
    }

    // Değişkenleri hazırla
    const variables = {
      customerName: deal.Customer.name || '',
      dealTitle: deal.title || '',
      dealValue: deal.value || 0,
      companyName: 'Your Company Name',
      userName: 'System',
    }

    // Template'i render et
    const subject = renderTemplate(template.subject || '', variables)
    const body = renderTemplate(template.body, variables)

    // E-posta gönder
    if (deal.Customer.email) {
      await sendEmail({
        to: deal.Customer.email,
        subject,
        html: body,
      })

      // ActivityLog'a kaydet
      await supabase.from('ActivityLog').insert({
        entity: 'Deal',
        action: 'EMAIL_SENT',
        description: `E-posta gönderildi: ${deal.Customer.email}`,
        meta: { dealId, templateId: template.id },
        userId: null,
        companyId,
      })
    }
  } catch (error) {
    console.error('Deal won email error:', error)
  }
}
```

---

## 📋 ADIM 5: API Endpoint'lerine Entegrasyon

### 5.1. Quote API'ye Entegrasyon
`src/app/api/quotes/[id]/route.ts` dosyasında:

```typescript
// PUT endpoint'inde, status ACCEPTED olduğunda
if (body.status === 'ACCEPTED') {
  // ... mevcut kod ...
  
  // Email gönder
  try {
    const { handleQuoteAccepted } = await import('@/lib/email-handlers/quote-accepted')
    await handleQuoteAccepted(quote.id, session.user.companyId)
  } catch (error) {
    // Email hatası ana işlemi engellemez
    console.error('Email send error:', error)
  }
}
```

### 5.2. Invoice API'ye Entegrasyon
`src/app/api/invoices/[id]/route.ts` dosyasında:

```typescript
// PUT endpoint'inde, status PAID olduğunda
if (body.status === 'PAID') {
  // ... mevcut kod ...
  
  // Email gönder
  try {
    const { handleInvoicePaid } = await import('@/lib/email-handlers/invoice-paid')
    await handleInvoicePaid(invoice.id, session.user.companyId)
  } catch (error) {
    // Email hatası ana işlemi engellemez
    console.error('Email send error:', error)
  }
}
```

### 5.3. Deal API'ye Entegrasyon
`src/app/api/deals/[id]/route.ts` dosyasında:

```typescript
// PUT endpoint'inde, stage WON olduğunda
if (body.stage === 'WON') {
  // ... mevcut kod ...
  
  // Email gönder
  try {
    const { handleDealWon } = await import('@/lib/email-handlers/deal-won')
    await handleDealWon(deal.id, session.user.companyId)
  } catch (error) {
    // Email hatası ana işlemi engellemez
    console.error('Email send error:', error)
  }
}
```

---

## 📋 ADIM 6: Database Trigger'ları (Opsiyonel)

### 6.1. Quote Status Trigger
`supabase/migrations/027_email_automation_triggers.sql`:

```sql
-- Quote ACCEPTED olduğunda email gönder
CREATE OR REPLACE FUNCTION trigger_quote_accepted_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'ACCEPTED' AND OLD.status != 'ACCEPTED' THEN
    -- Background job olarak email gönderimi yapılabilir
    -- Şimdilik API endpoint'ten çağrılacak
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quote_accepted_email_trigger
AFTER UPDATE ON "Quote"
FOR EACH ROW
WHEN (NEW.status = 'ACCEPTED' AND OLD.status != 'ACCEPTED')
EXECUTE FUNCTION trigger_quote_accepted_email();
```

---

## 📋 ADIM 7: Test

### 7.1. Test Senaryosu
1. Email template oluştur (QUOTE kategorisinde)
2. Bir quote'u ACCEPTED yap
3. E-postanın gönderildiğini kontrol et
4. ActivityLog'da kaydın oluştuğunu kontrol et

---

## 🎯 ÖZET

1. **Email Service Kurulumu**: Resend veya Nodemailer
2. **Template Renderer**: Değişkenleri gerçek değerlerle değiştirme
3. **Event Handler'lar**: Her olay için email gönderme fonksiyonu
4. **API Entegrasyonu**: Quote/Invoice/Deal API'lerine entegrasyon
5. **Test**: Senaryoları test et

---

## ⚠️ DİKKAT EDİLMESİ GEREKENLER

1. **Email Service API Key**: Environment variable olarak saklanmalı
2. **Error Handling**: Email gönderme hatası ana işlemi engellememeli
3. **Rate Limiting**: Çok fazla email gönderimini önlemek için
4. **Template Validation**: Template'de kullanılan değişkenlerin mevcut olduğunu kontrol et
5. **Email Format**: HTML formatında gönderilecek, CSS inline olmalı

---

**Hangi adımdan başlayalım?** 🚀










