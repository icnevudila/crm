# 📧 Ücretsiz Email Servisi Kurulum Rehberi

Bu rehber, CRM sistemine ücretsiz email gönderme servisi entegrasyonu için adım adım talimatlar içerir.

---

## 🎯 ÖNERİLEN SERVİSLER (ÜCRETSİZ PLANLAR)

### 1. Resend (ÖNERİLEN) ⭐
- **Ücretsiz Plan:** 100 email/gün
- **API Limit:** 3,000 email/ay
- **Özellikler:** Modern API, kolay kurulum, güvenilir
- **Website:** https://resend.com

### 2. SendGrid
- **Ücretsiz Plan:** 100 email/gün
- **API Limit:** 40,000 email/ay (ilk ay)
- **Özellikler:** Güçlü API, detaylı analytics
- **Website:** https://sendgrid.com

### 3. Brevo (Eski Sendinblue)
- **Ücretsiz Plan:** 300 email/gün
- **API Limit:** 9,000 email/ay
- **Özellikler:** En yüksek ücretsiz limit
- **Website:** https://www.brevo.com

### 4. Mailgun
- **Ücretsiz Plan:** 5,000 email/ay (ilk 3 ay)
- **Sonra:** Ücretli plan gerekir
- **Website:** https://www.mailgun.com

---

## 🚀 ADIM 1: RESEND KURULUMU (ÖNERİLEN)

### 1.1. Resend Hesabı Oluştur

1. https://resend.com adresine gidin
2. **Sign Up** butonuna tıklayın
3. Email ve şifre ile kayıt olun
4. Email doğrulaması yapın

### 1.2. API Key Oluştur

1. Resend Dashboard'a giriş yapın
2. Sol menüden **API Keys** sekmesine tıklayın
3. **Create API Key** butonuna tıklayın
4. **Name:** `CRM Production` (veya istediğiniz isim)
5. **Permission:** `Full Access` seçin
6. **Create** butonuna tıklayın
7. **API Key'i kopyalayın** (sadece bir kez gösterilir!)

### 1.3. Domain Ekleme (Opsiyonel - Gelişmiş)

**Not:** Test için domain eklemenize gerek yok, Resend'in test domain'i ile çalışabilirsiniz.

Eğer kendi domain'inizi kullanmak isterseniz:
1. **Domains** sekmesine gidin
2. **Add Domain** butonuna tıklayın
3. Domain'inizi girin (örn: `mail.yourcompany.com`)
4. DNS kayıtlarını ekleyin (Resend size verecek)
5. Doğrulama tamamlanana kadar bekleyin (5-10 dakika)

---

## 📦 ADIM 2: PAKET KURULUMU

### Resend Kurulumu

```bash
npm install resend
```

### SendGrid Kurulumu (Alternatif)

```bash
npm install @sendgrid/mail
```

---

## ⚙️ ADIM 3: ENVIRONMENT VARIABLES

`.env.local` dosyanıza ekleyin:

```env
# Resend için
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Email gönderen adres (Resend'de domain doğruladıysanız)
EMAIL_FROM=noreply@yourdomain.com

# Veya Resend'in test domain'i ile (domain doğrulamadan)
EMAIL_FROM=onboarding@resend.dev

# Uygulama URL'i (email linkleri için)
NEXT_PUBLIC_APP_URL=http://localhost:3000
# Production'da: NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

## 🔧 ADIM 4: EMAIL HELPER GÜNCELLEMESİ

`src/lib/email-helper.ts` dosyasını güncelleyin:

```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail({
  to,
  subject,
  body,
  html,
  from,
}: {
  to: string | string[]
  subject: string
  body?: string
  html?: string
  from?: string
}) {
  try {
    const recipients = Array.isArray(to) ? to : [to]
    
    // Resend ile email gönder
    const { data, error } = await resend.emails.send({
      from: from || process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: recipients,
      subject,
      html: html || body || '',
    })

    if (error) {
      console.error('Resend error:', error)
      throw new Error(`Email gönderilemedi: ${error.message}`)
    }

    console.log('✅ Email gönderildi:', data?.id)

    return {
      success: true,
      messageId: data?.id,
      recipients,
    }
  } catch (error: any) {
    console.error('Email gönderme hatası:', error)
    throw new Error(`Email gönderilemedi: ${error.message}`)
  }
}
```

---

## 🧪 ADIM 5: TEST ETME

### 5.1. Manuel Test (API Route ile)

`src/app/api/test-email/route.ts` dosyası oluşturun:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { sendEmail } from '@/lib/email-helper'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { to, subject, html } = body

    if (!to || !subject) {
      return NextResponse.json(
        { error: 'to ve subject gereklidir' },
        { status: 400 }
      )
    }

    const result = await sendEmail({
      to,
      subject,
      html: html || '<p>Test email</p>',
    })

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: 'Email başarıyla gönderildi',
    })
  } catch (error: any) {
    console.error('Test email error:', error)
    return NextResponse.json(
      { error: error.message || 'Email gönderilemedi' },
      { status: 500 }
    )
  }
}
```

### 5.2. Browser Console'dan Test

1. Tarayıcıda CRM'e giriş yapın
2. F12 → Console sekmesine gidin
3. Şu komutu çalıştırın:

```javascript
fetch('/api/test-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: 'your-email@example.com', // Kendi email adresiniz
    subject: 'Test Email',
    html: '<h1>Merhaba!</h1><p>Bu bir test emailidir.</p>'
  })
})
.then(res => res.json())
.then(data => console.log('Sonuç:', data))
```

### 5.3. Approval Email Testi

1. Bir onay talebi oluşturun
2. Onaylayıcı olarak kendi email adresinizi seçin
3. Onay talebi oluşturulduğunda email gelmeli

### 5.4. Email Campaign Testi

1. Yeni bir email kampanyası oluşturun
2. Kendi email adresinizi müşteri olarak ekleyin
3. Kampanyayı gönderin
4. Email gelmeli

---

## 🔄 ALTERNATİF: SENDGRID KURULUMU

Eğer Resend yerine SendGrid kullanmak isterseniz:

### 1. SendGrid Hesabı Oluştur

1. https://sendgrid.com adresine gidin
2. **Start for Free** butonuna tıklayın
3. Kayıt olun ve email doğrulaması yapın

### 2. API Key Oluştur

1. Dashboard → **Settings** → **API Keys**
2. **Create API Key** butonuna tıklayın
3. **Full Access** seçin
4. API Key'i kopyalayın

### 3. Environment Variable

```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
```

### 4. Email Helper Güncelleme

```typescript
import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

export async function sendEmail({ to, subject, html, from }: {...}) {
  const [response] = await sgMail.send({
    to: Array.isArray(to) ? to : [to],
    from: from || process.env.EMAIL_FROM!,
    subject,
    html,
  })

  return {
    success: true,
    messageId: response.headers['x-message-id'],
  }
}
```

---

## 🔄 ALTERNATİF: BREVO KURULUMU (EN YÜKSEK LİMİT)

### 1. Brevo Hesabı Oluştur

1. https://www.brevo.com adresine gidin
2. **Sign Up Free** butonuna tıklayın
3. Kayıt olun

### 2. API Key Oluştur

1. Dashboard → **Settings** → **SMTP & API**
2. **API Keys** sekmesine gidin
3. **Generate a new API key** butonuna tıklayın
4. API Key'i kopyalayın

### 3. Paket Kurulumu

```bash
npm install @getbrevo/brevo
```

### 4. Environment Variable

```env
BREVO_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
```

### 5. Email Helper Güncelleme

```typescript
import * as brevo from '@getbrevo/brevo'

const apiInstance = new brevo.TransactionalEmailsApi()
apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY!)

export async function sendEmail({ to, subject, html, from }: {...}) {
  const sendSmtpEmail = new brevo.SendSmtpEmail()
  sendSmtpEmail.subject = subject
  sendSmtpEmail.htmlContent = html
  sendSmtpEmail.sender = { email: from || process.env.EMAIL_FROM! }
  sendSmtpEmail.to = Array.isArray(to) ? to.map(email => ({ email })) : [{ email: to }]

  const data = await apiInstance.sendTransacEmail(sendSmtpEmail)

  return {
    success: true,
    messageId: data.messageId,
  }
}
```

---

## ✅ KURULUM SONRASI KONTROL LİSTESİ

- [ ] Email servisi hesabı oluşturuldu
- [ ] API Key alındı ve `.env.local`'e eklendi
- [ ] Paket kuruldu (`npm install`)
- [ ] `src/lib/email-helper.ts` güncellendi
- [ ] Test email gönderildi ve başarılı oldu
- [ ] Approval email test edildi
- [ ] Email Campaign test edildi

---

## 🐛 SORUN GİDERME

### Sorun 1: "Invalid API Key"
**Çözüm:** 
- API Key'i `.env.local`'e doğru eklediğinizden emin olun
- `.env.local` dosyasını yeniden başlatın (dev server'ı durdurup başlatın)

### Sorun 2: "Domain not verified"
**Çözüm:**
- Resend için: `onboarding@resend.dev` kullanın (domain doğrulamadan)
- Veya kendi domain'inizi doğrulayın

### Sorun 3: "Rate limit exceeded"
**Çözüm:**
- Ücretsiz plan limitini aştınız
- Ertesi gün bekleyin veya ücretli plana geçin

### Sorun 4: Email gelmiyor
**Çözüm:**
- Spam klasörünü kontrol edin
- Email servisi dashboard'unda gönderim loglarını kontrol edin
- Console'da hata var mı kontrol edin (F12)

---

## 📊 EMAIL SERVİSİ KARŞILAŞTIRMASI

| Servis | Ücretsiz Limit | Kurulum | Önerilen |
|--------|---------------|---------|----------|
| **Resend** | 100/gün | ⭐⭐⭐⭐⭐ Çok Kolay | ✅ Evet |
| **SendGrid** | 100/gün | ⭐⭐⭐⭐ Kolay | ✅ Evet |
| **Brevo** | 300/gün | ⭐⭐⭐ Orta | ✅ Yüksek limit için |
| **Mailgun** | 5,000/ay (3 ay) | ⭐⭐⭐ Orta | ⚠️ Sadece ilk 3 ay |

---

## 🎯 ÖNERİLEN ADIMLAR

1. **Resend ile başlayın** (en kolay kurulum)
2. Test email gönderin
3. Approval ve Campaign email'lerini test edin
4. Limit yetersizse Brevo'ya geçin (300/gün)

---

**Son Güncelleme:** 2024  
**Durum:** ✅ Ücretsiz email servisi kurulum rehberi hazır

