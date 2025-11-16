# 📧 Email, SMS, WhatsApp Canlı Test Rehberi

**Tarih:** 2024  
**Durum:** ✅ Email Hazır, SMS/WhatsApp Yok

---

## 📋 ÖZET

**Email entegrasyonu hazır!** ✅ Resend paketi kurulu ve API endpoint'leri mevcut. SMS ve WhatsApp entegrasyonları henüz yok.

---

## ✅ EMAIL ENTEGRASYONU (HAZIR)

### Mevcut Durum

#### 1. **Package Dependencies** ✅
- ✅ `resend` paketi kurulu (`package.json` satır 68)
- ✅ Versiyon: `^6.4.2`

#### 2. **API Endpoint'leri** ✅
- ✅ `/api/integrations/email/send` - Resend ile email gönderme
- ✅ `/api/integrations/email/send-smtp` - SMTP ile email gönderme
- ✅ `/api/integrations/email/check` - Email kontrolü
- ✅ `/api/email-templates` - Email template'leri
- ✅ `/api/email-campaigns` - Email kampanyaları

#### 3. **Servis Dosyaları** ✅
- ✅ `src/lib/email-service.ts` - Email servisi
- ✅ `src/lib/email-helper.ts` - Email helper fonksiyonları

#### 4. **UI Component'leri** ✅
- ✅ `src/components/integrations/SendEmailButton.tsx` - Email gönderme butonu
- ✅ `src/components/ui/ContextualActionsBar.tsx` - Email gönderme butonu entegre

---

## 🔧 CANLIYA ALMADAN ÖNCE YAPILMASI GEREKENLER

### 1. Environment Variables Ayarlama

#### Vercel/Production Ortamında:
```env
# Resend API Key (Önerilen)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# veya SMTP için
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com
```

#### Resend API Key Alma:
1. [Resend.com](https://resend.com) hesabı oluştur
2. API Keys sayfasına git
3. Yeni API key oluştur
4. API key'i `.env` dosyasına ekle

---

### 2. Email Servis Kontrolü

#### `src/lib/email-service.ts` Kontrolü
- [ ] Resend client doğru yapılandırılmış mı?
- [ ] Environment variable kontrolü var mı?
- [ ] Error handling doğru mu?

#### `src/app/api/integrations/email/send/route.ts` Kontrolü
- [ ] Auth kontrolü var mı?
- [ ] RLS kontrolü var mı?
- [ ] Request validation var mı?
- [ ] Error handling doğru mu?

---

### 3. Test Senaryoları

#### Test 1: Email Gönderme (Resend)
```bash
# API endpoint'ini test et
curl -X POST https://your-domain.com/api/integrations/email/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "html": "<h1>Test</h1>"
  }'
```

#### Test 2: Email Gönderme (UI)
1. Quote detay sayfasına git (`/quotes/[id]`)
2. "Email Gönder" butonuna tıkla
3. Email gönderilip gönderilmediğini kontrol et

#### Test 3: Email Template
1. Email template oluştur
2. Template'i kullanarak email gönder
3. Template'in doğru render edildiğini kontrol et

---

## ❌ SMS ENTEGRASYONU (YOK)

### Mevcut Durum
- ❌ SMS API endpoint'i yok
- ❌ SMS servis dosyası yok
- ❌ Twilio paketi yok
- ❌ UI'da SMS butonu yok

### Yapılması Gerekenler
1. Twilio paketi kurulumu
2. SMS servis dosyası oluşturma
3. SMS API endpoint'i oluşturma
4. UI'da SMS butonu ekleme

---

## ❌ WHATSAPP ENTEGRASYONU (YOK)

### Mevcut Durum
- ❌ WhatsApp API endpoint'i yok
- ❌ WhatsApp servis dosyası yok
- ❌ WhatsApp SDK paketi yok
- ❌ UI'da WhatsApp butonu yok

### Yapılması Gerekenler
1. Twilio WhatsApp API entegrasyonu
2. WhatsApp servis dosyası oluşturma
3. WhatsApp API endpoint'i oluşturma
4. UI'da WhatsApp butonu ekleme

---

## 🧪 CANLI TEST ADIMLARI

### Email Test Senaryoları

#### Senaryo 1: Quote Email Gönderme
1. Quote detay sayfasına git (`/quotes/[id]`)
2. ContextualActionsBar'da "Email Gönder" butonuna tıkla
3. Email gönderilip gönderilmediğini kontrol et
4. Email'in doğru içerikle gönderildiğini kontrol et

#### Senaryo 2: Invoice Email Gönderme
1. Invoice detay sayfasına git (`/invoices/[id]`)
2. ContextualActionsBar'da "Email Gönder" butonuna tıkla
3. Email gönderilip gönderilmediğini kontrol et
4. PDF ekli mi kontrol et

#### Senaryo 3: Deal Email Gönderme
1. Deal detay sayfasına git (`/deals/[id]`)
2. ContextualActionsBar'da "Email Gönder" butonuna tıkla
3. Email gönderilip gönderilmediğini kontrol et

#### Senaryo 4: Customer Email Gönderme
1. Customer detay sayfasına git (`/customers/[id]`)
2. ContextualActionsBar'da "Email Gönder" butonuna tıkla
3. Email gönderilip gönderilmediğini kontrol et

---

## 🔍 KONTROL LİSTESİ

### Email Entegrasyonu
- [ ] Resend API key environment variable'da var mı?
- [ ] Email servis dosyası çalışıyor mu?
- [ ] API endpoint'leri çalışıyor mu?
- [ ] Auth kontrolü çalışıyor mu?
- [ ] RLS kontrolü çalışıyor mu?
- [ ] Error handling çalışıyor mu?
- [ ] Email template'leri çalışıyor mu?
- [ ] UI butonları çalışıyor mu?

### SMS Entegrasyonu
- [ ] ❌ Henüz yok

### WhatsApp Entegrasyonu
- [ ] ❌ Henüz yok

---

## ⚠️ ÖNEMLİ NOTLAR

### Email İçin
1. **Resend API Key mutlaka ayarlanmalı** - Aksi halde email gönderilemez
2. **Domain verification** - Resend'de domain doğrulaması yapılmalı
3. **Rate limiting** - Resend'in rate limit'leri kontrol edilmeli
4. **Error handling** - Email gönderme hatalarında kullanıcıya anlamlı mesaj gösterilmeli

### SMS ve WhatsApp İçin
- Şu anda **hiçbir entegrasyon yok**
- Canlıya almadan önce **opsiyonel** olarak eklenebilir
- Email entegrasyonu **zorunlu**, SMS ve WhatsApp **opsiyonel**

---

## 🚀 HIZLI BAŞLANGIÇ

### 1. Resend API Key Alma
1. [Resend.com](https://resend.com) hesabı oluştur
2. API Keys sayfasına git
3. Yeni API key oluştur
4. API key'i kopyala

### 2. Environment Variable Ekleme
```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

### 3. Test Etme
1. Quote detay sayfasına git
2. "Email Gönder" butonuna tıkla
3. Email'in gönderildiğini kontrol et

---

## 📊 SONUÇ

**Email:** ✅ Hazır - Sadece Resend API key eklenmeli  
**SMS:** ❌ Yok - Henüz entegre edilmemiş  
**WhatsApp:** ❌ Yok - Henüz entegre edilmemiş

**Canlıya Almadan Önce:**
- ✅ Email için Resend API key eklenmeli
- ⚠️ SMS ve WhatsApp opsiyonel (şu anda yok)

---

**Rapor Tarihi:** 2024  
**Durum:** ✅ Email Hazır, SMS/WhatsApp Yok



