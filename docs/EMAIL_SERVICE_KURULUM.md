# 📧 Email Service Kurulum Rehberi

## 🎯 Genel Bakış

CRM sistemi artık gerçek email servisleri ile entegre edilmiştir. 3 farklı email servisi desteklenmektedir (öncelik sırasına göre):

1. **Resend** (Önerilen - Modern, Kolay)
2. **SendGrid** (Popüler, Güvenilir)
3. **Nodemailer** (SMTP - Herhangi bir SMTP sunucusu)

Eğer hiçbiri yapılandırılmamışsa, sistem mock modda çalışır (development'ta console'a log yazar).

---

## ✅ 1. Resend Kurulumu (Önerilen)

### 1.1. Resend Hesabı Oluşturma
1. [Resend.com](https://resend.com) adresine gidin
2. Ücretsiz hesap oluşturun
3. API Key oluşturun

### 1.2. Environment Variables
`.env.local` dosyasına ekleyin:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
SMTP_FROM=noreply@yourdomain.com
```

**Önemli:** `SMTP_FROM` adresinin Resend'de doğrulanmış bir domain'den olması gerekir.

### 1.3. Domain Doğrulama
1. Resend dashboard'da "Domains" bölümüne gidin
2. Domain'inizi ekleyin
3. DNS kayıtlarını ekleyin (SPF, DKIM, DMARC)
4. Domain doğrulandıktan sonra email gönderebilirsiniz

---

## ✅ 2. SendGrid Kurulumu

### 2.1. SendGrid Hesabı Oluşturma
1. [SendGrid.com](https://sendgrid.com) adresine gidin
2. Ücretsiz hesap oluşturun (100 email/gün ücretsiz)
3. API Key oluşturun

### 2.2. Environment Variables
`.env.local` dosyasına ekleyin:

```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
SMTP_FROM=noreply@yourdomain.com
```

### 2.3. Domain Doğrulama
1. SendGrid dashboard'da "Settings" > "Sender Authentication"
2. Domain'inizi doğrulayın
3. DNS kayıtlarını ekleyin

---

## ✅ 3. Nodemailer (SMTP) Kurulumu

### 3.1. SMTP Sunucusu
Herhangi bir SMTP sunucusu kullanabilirsiniz:
- Gmail (App Password gerekir)
- Outlook/Hotmail
- Custom SMTP sunucusu
- AWS SES
- Mailgun
- vb.

### 3.2. Environment Variables
`.env.local` dosyasına ekleyin:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com
```

### 3.3. Gmail Örneği
Gmail için App Password oluşturmanız gerekir:
1. Google Account > Security > 2-Step Verification (aktif olmalı)
2. App Passwords > Generate
3. Oluşturulan şifreyi `SMTP_PASS` olarak kullanın

**Gmail SMTP Ayarları:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
SMTP_FROM=your-email@gmail.com
```

---

## 🔄 Öncelik Sırası

Sistem email gönderirken şu sırayı takip eder:

1. **RESEND_API_KEY** varsa → Resend kullanılır
2. **SENDGRID_API_KEY** varsa → SendGrid kullanılır
3. **SMTP_HOST, SMTP_USER, SMTP_PASS** varsa → Nodemailer kullanılır
4. Hiçbiri yoksa → Mock mod (sadece console'a log)

**Not:** Bir servis başarısız olursa otomatik olarak bir sonrakine geçer.

---

## 🧪 Test Etme

### Development Modda Test
```bash
npm run dev
```

Email gönderildiğinde console'da şunu göreceksiniz:
- `📧 [RESEND] Email gönderildi: ...` (Resend kullanılıyorsa)
- `📧 [SENDGRID] Email gönderildi: ...` (SendGrid kullanılıyorsa)
- `📧 [NODEMAILER] Email gönderildi: ...` (Nodemailer kullanılıyorsa)
- `📧 [MOCK] Email gönderiliyor...` (Hiçbiri yapılandırılmamışsa)

### Production'da Test
1. Environment variable'ları production'a ekleyin (Vercel, Railway, vb.)
2. Bir email gönderme işlemi tetikleyin (ör: Meeting oluştur, Deal kapat)
3. Email'in gerçekten gönderildiğini kontrol edin

---

## 📝 Kullanım Örnekleri

### API Endpoint'lerinde Kullanım
```typescript
import { sendEmail } from '@/lib/email-service'

// Meeting oluşturulduğunda
await sendEmail({
  to: customer.email,
  subject: 'Yeni Randevu Oluşturuldu',
  html: '<h1>Randevu Detayları</h1>...',
  from: 'noreply@yourdomain.com',
})
```

### Toplu Email Gönderme
```typescript
import { sendBulkEmail } from '@/lib/email-service'

await sendBulkEmail(
  [
    { email: 'customer1@example.com', name: 'Müşteri 1' },
    { email: 'customer2@example.com', name: 'Müşteri 2' },
  ],
  'Toplu Email Konusu',
  '<h1>Email İçeriği</h1>...',
  'noreply@yourdomain.com'
)
```

---

## ⚠️ Önemli Notlar

1. **Rate Limiting:** Her servisin kendi rate limit'i vardır. Resend ücretsiz planında 100 email/gün, SendGrid 100 email/gün.

2. **Domain Doğrulama:** Production'da email göndermek için domain doğrulaması şarttır. Development'ta test email'leri gönderebilirsiniz.

3. **Spam Kontrolü:** Email'lerin spam klasörüne düşmemesi için:
   - SPF, DKIM, DMARC kayıtlarını ekleyin
   - Email içeriğini spam kurallarına uygun yazın
   - Gönderen adresini doğrulayın

4. **Error Handling:** Email gönderme hatası ana işlemi engellemez. Hatalar console'a loglanır.

---

## 🔧 Troubleshooting

### Email Gönderilmiyor
1. Environment variable'ların doğru olduğundan emin olun
2. Domain doğrulamasının tamamlandığını kontrol edin
3. Console loglarını kontrol edin
4. API key'lerin geçerli olduğunu kontrol edin

### "Invalid API Key" Hatası
- API key'i yeniden oluşturun
- Environment variable'ın doğru yüklendiğinden emin olun
- Production'da environment variable'ların set edildiğini kontrol edin

### Email Spam Klasörüne Düşüyor
- SPF, DKIM, DMARC kayıtlarını ekleyin
- Email içeriğini daha profesyonel yazın
- Gönderen adresini doğrulayın

---

## 📚 Daha Fazla Bilgi

- [Resend Dokümantasyonu](https://resend.com/docs)
- [SendGrid Dokümantasyonu](https://docs.sendgrid.com)
- [Nodemailer Dokümantasyonu](https://nodemailer.com)

---

**Son Güncelleme:** 2024
**Versiyon:** 1.0.0



## 🎯 Genel Bakış

CRM sistemi artık gerçek email servisleri ile entegre edilmiştir. 3 farklı email servisi desteklenmektedir (öncelik sırasına göre):

1. **Resend** (Önerilen - Modern, Kolay)
2. **SendGrid** (Popüler, Güvenilir)
3. **Nodemailer** (SMTP - Herhangi bir SMTP sunucusu)

Eğer hiçbiri yapılandırılmamışsa, sistem mock modda çalışır (development'ta console'a log yazar).

---

## ✅ 1. Resend Kurulumu (Önerilen)

### 1.1. Resend Hesabı Oluşturma
1. [Resend.com](https://resend.com) adresine gidin
2. Ücretsiz hesap oluşturun
3. API Key oluşturun

### 1.2. Environment Variables
`.env.local` dosyasına ekleyin:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
SMTP_FROM=noreply@yourdomain.com
```

**Önemli:** `SMTP_FROM` adresinin Resend'de doğrulanmış bir domain'den olması gerekir.

### 1.3. Domain Doğrulama
1. Resend dashboard'da "Domains" bölümüne gidin
2. Domain'inizi ekleyin
3. DNS kayıtlarını ekleyin (SPF, DKIM, DMARC)
4. Domain doğrulandıktan sonra email gönderebilirsiniz

---

## ✅ 2. SendGrid Kurulumu

### 2.1. SendGrid Hesabı Oluşturma
1. [SendGrid.com](https://sendgrid.com) adresine gidin
2. Ücretsiz hesap oluşturun (100 email/gün ücretsiz)
3. API Key oluşturun

### 2.2. Environment Variables
`.env.local` dosyasına ekleyin:

```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
SMTP_FROM=noreply@yourdomain.com
```

### 2.3. Domain Doğrulama
1. SendGrid dashboard'da "Settings" > "Sender Authentication"
2. Domain'inizi doğrulayın
3. DNS kayıtlarını ekleyin

---

## ✅ 3. Nodemailer (SMTP) Kurulumu

### 3.1. SMTP Sunucusu
Herhangi bir SMTP sunucusu kullanabilirsiniz:
- Gmail (App Password gerekir)
- Outlook/Hotmail
- Custom SMTP sunucusu
- AWS SES
- Mailgun
- vb.

### 3.2. Environment Variables
`.env.local` dosyasına ekleyin:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com
```

### 3.3. Gmail Örneği
Gmail için App Password oluşturmanız gerekir:
1. Google Account > Security > 2-Step Verification (aktif olmalı)
2. App Passwords > Generate
3. Oluşturulan şifreyi `SMTP_PASS` olarak kullanın

**Gmail SMTP Ayarları:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
SMTP_FROM=your-email@gmail.com
```

---

## 🔄 Öncelik Sırası

Sistem email gönderirken şu sırayı takip eder:

1. **RESEND_API_KEY** varsa → Resend kullanılır
2. **SENDGRID_API_KEY** varsa → SendGrid kullanılır
3. **SMTP_HOST, SMTP_USER, SMTP_PASS** varsa → Nodemailer kullanılır
4. Hiçbiri yoksa → Mock mod (sadece console'a log)

**Not:** Bir servis başarısız olursa otomatik olarak bir sonrakine geçer.

---

## 🧪 Test Etme

### Development Modda Test
```bash
npm run dev
```

Email gönderildiğinde console'da şunu göreceksiniz:
- `📧 [RESEND] Email gönderildi: ...` (Resend kullanılıyorsa)
- `📧 [SENDGRID] Email gönderildi: ...` (SendGrid kullanılıyorsa)
- `📧 [NODEMAILER] Email gönderildi: ...` (Nodemailer kullanılıyorsa)
- `📧 [MOCK] Email gönderiliyor...` (Hiçbiri yapılandırılmamışsa)

### Production'da Test
1. Environment variable'ları production'a ekleyin (Vercel, Railway, vb.)
2. Bir email gönderme işlemi tetikleyin (ör: Meeting oluştur, Deal kapat)
3. Email'in gerçekten gönderildiğini kontrol edin

---

## 📝 Kullanım Örnekleri

### API Endpoint'lerinde Kullanım
```typescript
import { sendEmail } from '@/lib/email-service'

// Meeting oluşturulduğunda
await sendEmail({
  to: customer.email,
  subject: 'Yeni Randevu Oluşturuldu',
  html: '<h1>Randevu Detayları</h1>...',
  from: 'noreply@yourdomain.com',
})
```

### Toplu Email Gönderme
```typescript
import { sendBulkEmail } from '@/lib/email-service'

await sendBulkEmail(
  [
    { email: 'customer1@example.com', name: 'Müşteri 1' },
    { email: 'customer2@example.com', name: 'Müşteri 2' },
  ],
  'Toplu Email Konusu',
  '<h1>Email İçeriği</h1>...',
  'noreply@yourdomain.com'
)
```

---

## ⚠️ Önemli Notlar

1. **Rate Limiting:** Her servisin kendi rate limit'i vardır. Resend ücretsiz planında 100 email/gün, SendGrid 100 email/gün.

2. **Domain Doğrulama:** Production'da email göndermek için domain doğrulaması şarttır. Development'ta test email'leri gönderebilirsiniz.

3. **Spam Kontrolü:** Email'lerin spam klasörüne düşmemesi için:
   - SPF, DKIM, DMARC kayıtlarını ekleyin
   - Email içeriğini spam kurallarına uygun yazın
   - Gönderen adresini doğrulayın

4. **Error Handling:** Email gönderme hatası ana işlemi engellemez. Hatalar console'a loglanır.

---

## 🔧 Troubleshooting

### Email Gönderilmiyor
1. Environment variable'ların doğru olduğundan emin olun
2. Domain doğrulamasının tamamlandığını kontrol edin
3. Console loglarını kontrol edin
4. API key'lerin geçerli olduğunu kontrol edin

### "Invalid API Key" Hatası
- API key'i yeniden oluşturun
- Environment variable'ın doğru yüklendiğinden emin olun
- Production'da environment variable'ların set edildiğini kontrol edin

### Email Spam Klasörüne Düşüyor
- SPF, DKIM, DMARC kayıtlarını ekleyin
- Email içeriğini daha profesyonel yazın
- Gönderen adresini doğrulayın

---

## 📚 Daha Fazla Bilgi

- [Resend Dokümantasyonu](https://resend.com/docs)
- [SendGrid Dokümantasyonu](https://docs.sendgrid.com)
- [Nodemailer Dokümantasyonu](https://nodemailer.com)

---

**Son Güncelleme:** 2024
**Versiyon:** 1.0.0

