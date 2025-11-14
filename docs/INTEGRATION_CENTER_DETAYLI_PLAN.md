# 🔌 Entegrasyon Merkezi - Detaylı Uygulama Planı

**Tarih:** 2024  
**Durum:** 📋 Uygulama Planı

---

## 🎯 Genel Bakış

CRM'de kullanılacak tüm dış servis entegrasyonlarını tek bir merkezden yönetmek. Her şirket kendi entegrasyonlarını bağlayabilir ve otomatik olarak aktif hale gelir.

---

## 📋 Entegrasyon Listesi ve Öncelik

### 🔴 Faz 1: Temel Entegrasyonlar (Yüksek Öncelik)

#### 1. E-posta Entegrasyonları
- ✅ **Gmail OAuth 2.0** - OAuth flow ile otomatik bağlanma
- ✅ **Outlook/Microsoft 365 OAuth 2.0** - OAuth flow ile otomatik bağlanma
- ✅ **SMTP (Genel)** - SendGrid, Brevo, Gmail SMTP, Outlook SMTP (manuel credentials)

**Kullanım Senaryoları:**
- Deal oluşturulduğunda müşteriye e-posta
- Quote gönderildiğinde e-posta
- Invoice oluşturulduğunda e-posta
- Meeting hatırlatması e-posta

#### 2. SMS Entegrasyonları
- ✅ **Twilio SMS API** - Uluslararası
- ✅ **Netgsm API** - Türkiye
- ✅ **İleti Merkezi API** - Türkiye

**Kullanım Senaryoları:**
- Meeting hatırlatması SMS
- Deal güncellemesi SMS
- Quote gönderimi SMS
- Invoice hatırlatması SMS

#### 3. WhatsApp Entegrasyonları
- ✅ **WhatsApp Business API (Meta)** - Resmi WhatsApp Business API
- ✅ **Twilio WhatsApp API** - Twilio üzerinden WhatsApp

**Kullanım Senaryoları:**
- Meeting hatırlatması WhatsApp
- Deal güncellemesi WhatsApp
- Quote gönderimi WhatsApp
- Müşteri iletişimi WhatsApp

### 🟡 Faz 2: Google Services (Orta Öncelik)

#### 4. Google Services
- ✅ **Google Sheets API** - Rapor export için
- ✅ **Google Drive API** - Dosya yedekleme için
- ✅ **Google Contacts API** - Müşteri senkronizasyonu için

**Kullanım Senaryoları:**
- Raporları Google Sheets'e export
- Dokümanları Google Drive'a yedekle
- Google Contacts ile müşteri senkronizasyonu

---

## 🏗️ Teknik Mimari

### 1. Veritabanı Yapısı

**Dosya:** `supabase/migrations/105_expand_company_integrations.sql`

```sql
-- CompanyIntegration tablosunu genişlet
ALTER TABLE "CompanyIntegration" ADD COLUMN IF NOT EXISTS:
  -- E-posta Entegrasyonları
  "emailProvider" VARCHAR(20), -- GMAIL, OUTLOOK, SMTP
  "emailSmtpHost" TEXT,
  "emailSmtpPort" INTEGER,
  "emailSmtpUser" TEXT,
  "emailSmtpPassword" TEXT,
  "emailOAuthToken" TEXT,
  "emailOAuthRefreshToken" TEXT,
  "emailOAuthTokenExpiresAt" TIMESTAMP WITH TIME ZONE,
  "emailEnabled" BOOLEAN DEFAULT false,
  
  -- SMS Entegrasyonları
  "smsProvider" VARCHAR(20), -- TWILIO, NEXMO, NETGSM, ILETI_MERKEZI
  "smsApiKey" TEXT,
  "smsApiSecret" TEXT,
  "smsSenderNumber" TEXT,
  "smsEnabled" BOOLEAN DEFAULT false,
  
  -- WhatsApp Entegrasyonları
  "whatsappProvider" VARCHAR(20), -- WHATSAPP_BUSINESS, TWILIO_WHATSAPP
  "whatsappApiKey" TEXT,
  "whatsappApiSecret" TEXT,
  "whatsappPhoneNumberId" TEXT,
  "whatsappBusinessAccountId" TEXT,
  "whatsappEnabled" BOOLEAN DEFAULT false,
  
  -- Google Services
  "googleSheetsEnabled" BOOLEAN DEFAULT false,
  "googleSheetsToken" TEXT,
  "googleDriveEnabled" BOOLEAN DEFAULT false,
  "googleDriveToken" TEXT,
  "googleContactsEnabled" BOOLEAN DEFAULT false,
  "googleContactsToken" TEXT
```

### 2. OAuth Flow Endpoints

```
GET  /api/integrations/oauth/gmail/authorize
GET  /api/integrations/oauth/gmail/callback
GET  /api/integrations/oauth/outlook/authorize
GET  /api/integrations/oauth/outlook/callback
GET  /api/integrations/oauth/google/authorize
GET  /api/integrations/oauth/google/callback
POST /api/integrations/oauth/[provider]/disconnect
POST /api/integrations/test/[provider] - Test endpoint
```

### 3. Helper Fonksiyonlar

```
lib/integrations/
├── email/
│   ├── gmail.ts - Gmail API helper
│   ├── outlook.ts - Outlook API helper
│   └── smtp.ts - SMTP helper
├── sms/
│   ├── twilio.ts - Twilio SMS
│   ├── netgsm.ts - Netgsm SMS
│   └── iletimerkezi.ts - İleti Merkezi SMS
├── whatsapp/
│   ├── whatsapp-business.ts - Meta WhatsApp Business API
│   └── twilio-whatsapp.ts - Twilio WhatsApp
├── google/
│   ├── sheets.ts - Google Sheets API
│   ├── drive.ts - Google Drive API
│   └── contacts.ts - Google Contacts API
└── oauth/
    ├── gmail-oauth.ts - Gmail OAuth flow
    ├── outlook-oauth.ts - Outlook OAuth flow
    └── google-oauth.ts - Google OAuth flow (Sheets, Drive, Contacts)
```

---

## 📝 Uygulama Adımları

### Faz 1: Veritabanı Genişletme (30 dk)

**Dosya:** `supabase/migrations/105_expand_company_integrations.sql`

Yapılacaklar:
1. ✅ CompanyIntegration tablosuna yeni kolonlar ekle
2. ✅ CHECK constraint'ler ekle (emailProvider, smsProvider, whatsappProvider)
3. ✅ Index'ler ekle
4. ✅ RLS policies güncelle (zaten var, genişletilecek)

### Faz 2: OAuth Flow Implementasyonu (2-3 saat)

**Dosyalar:**
- `src/lib/integrations/oauth/gmail-oauth.ts`
- `src/lib/integrations/oauth/outlook-oauth.ts`
- `src/lib/integrations/oauth/google-oauth.ts`
- `src/app/api/integrations/oauth/[provider]/authorize/route.ts`
- `src/app/api/integrations/oauth/[provider]/callback/route.ts`

**Yapılacaklar:**
1. ✅ OAuth URL oluşturma fonksiyonları
2. ✅ Callback endpoint'leri (token alma)
3. ✅ Token refresh mekanizması
4. ✅ Token expire kontrolü

### Faz 3: E-posta Entegrasyonları (2-3 saat)

**Dosyalar:**
- `src/lib/integrations/email/gmail.ts`
- `src/lib/integrations/email/outlook.ts`
- `src/lib/integrations/email/smtp.ts`
- `src/app/api/integrations/test/email/route.ts`

**Yapılacaklar:**
1. ✅ Gmail API e-posta gönderim fonksiyonu
2. ✅ Outlook API e-posta gönderim fonksiyonu
3. ✅ SMTP e-posta gönderim fonksiyonu
4. ✅ Email helper fonksiyonu (provider'a göre otomatik seçim)

### Faz 4: SMS Entegrasyonları (2-3 saat)

**Dosyalar:**
- `src/lib/integrations/sms/twilio.ts`
- `src/lib/integrations/sms/netgsm.ts`
- `src/lib/integrations/sms/iletimerkezi.ts`
- `src/app/api/integrations/test/sms/route.ts`

**Yapılacaklar:**
1. ✅ Twilio SMS gönderim fonksiyonu
2. ✅ Netgsm SMS gönderim fonksiyonu
3. ✅ İleti Merkezi SMS gönderim fonksiyonu
4. ✅ SMS helper fonksiyonu (provider'a göre otomatik seçim)

### Faz 5: WhatsApp Entegrasyonları (2-3 saat)

**Dosyalar:**
- `src/lib/integrations/whatsapp/whatsapp-business.ts`
- `src/lib/integrations/whatsapp/twilio-whatsapp.ts`
- `src/app/api/integrations/test/whatsapp/route.ts`

**Yapılacaklar:**
1. ✅ WhatsApp Business API mesaj gönderim fonksiyonu
2. ✅ Twilio WhatsApp API mesaj gönderim fonksiyonu
3. ✅ WhatsApp helper fonksiyonu (provider'a göre otomatik seçim)

### Faz 6: Google Services (2-3 saat)

**Dosyalar:**
- `src/lib/integrations/google/sheets.ts`
- `src/lib/integrations/google/drive.ts`
- `src/lib/integrations/google/contacts.ts`

**Yapılacaklar:**
1. ✅ Google Sheets'e veri export fonksiyonu
2. ✅ Google Drive'a dosya upload fonksiyonu
3. ✅ Google Contacts senkronizasyon fonksiyonu

### Faz 7: Frontend - Entegrasyon Merkezi UI (3-4 saat)

**Dosya:** `src/app/[locale]/settings/page.tsx` (genişletilecek)

**Yapılacaklar:**
1. ✅ E-posta Entegrasyonları sekmesi
   - Gmail OAuth bağlantı butonu
   - Outlook OAuth bağlantı butonu
   - SMTP manuel credentials formu
   - Test butonu

2. ✅ SMS Entegrasyonları sekmesi
   - Provider seçimi (Twilio, Netgsm, İleti Merkezi)
   - Credentials formu
   - Test butonu

3. ✅ WhatsApp Entegrasyonları sekmesi
   - Provider seçimi (WhatsApp Business, Twilio WhatsApp)
   - Credentials formu
   - Test butonu

4. ✅ Google Services sekmesi
   - Google Sheets OAuth bağlantı butonu
   - Google Drive OAuth bağlantı butonu
   - Google Contacts OAuth bağlantı butonu

5. ✅ Durum göstergeleri
   - Bağlı/Bağlı Değil badge'leri
   - Son test sonucu
   - Hata mesajları

---

## 🔐 OAuth Flow Detayları

### Gmail OAuth Flow

1. **OAuth URL Oluştur:**
```
GET /api/integrations/oauth/gmail/authorize
→ Google OAuth URL'ine yönlendir
```

2. **OAuth Callback:**
```
GET /api/integrations/oauth/gmail/callback?code=xxx
→ Access token ve refresh token al
→ CompanyIntegration tablosuna kaydet
→ Settings sayfasına yönlendir (başarılı/hatalı mesaj ile)
```

3. **Token Refresh (Otomatik):**
```
- Token expire olduğunda otomatik refresh et
- Background job veya API çağrısında kontrol
```

### Outlook OAuth Flow

1. **OAuth URL Oluştur:**
```
GET /api/integrations/oauth/outlook/authorize
→ Microsoft OAuth URL'ine yönlendir
```

2. **OAuth Callback:**
```
GET /api/integrations/oauth/outlook/callback?code=xxx
→ Access token ve refresh token al
→ CompanyIntegration tablosuna kaydet
→ Settings sayfasına yönlendir
```

---

## 💡 Kullanım Senaryoları

### Senaryo 1: Deal Oluşturulduğunda E-posta Gönder

```typescript
// Deal oluşturulduğunda otomatik e-posta
const integration = await getCompanyIntegration(companyId)
if (integration?.emailEnabled && integration.emailProvider) {
  await sendEmail({
    to: customer.email,
    subject: 'Yeni Fırsat Oluşturuldu',
    html: renderEmailTemplate('deal_created', { deal, customer }),
    provider: integration.emailProvider,
    companyId,
  })
}
```

### Senaryo 2: Meeting Hatırlatması SMS + WhatsApp

```typescript
// Meeting'den 1 saat önce SMS + WhatsApp gönder
const integration = await getCompanyIntegration(companyId)

if (integration?.smsEnabled) {
  await sendSMS({
    to: customer.phone,
    message: `Toplantı hatırlatması: ${meeting.title} - ${meeting.meetingDate}`,
    provider: integration.smsProvider,
    companyId,
  })
}

if (integration?.whatsappEnabled) {
  await sendWhatsApp({
    to: customer.phone,
    message: `Toplantı hatırlatması: ${meeting.title} - ${meeting.meetingDate}`,
    provider: integration.whatsappProvider,
    companyId,
  })
}
```

### Senaryo 3: Google Sheets'e Rapor Export

```typescript
// Raporları Google Sheets'e export
const integration = await getCompanyIntegration(companyId)
if (integration?.googleSheetsEnabled) {
  await exportToGoogleSheets({
    data: reportData,
    spreadsheetName: 'Raporlar',
    sheetName: 'Deal Raporu',
    companyId,
  })
}
```

---

## 📊 Öncelik Matrisi

| Entegrasyon | Öncelik | Süre | Kullanım Sıklığı |
|-------------|---------|------|------------------|
| Gmail OAuth | 🔴 Yüksek | 2 saat | Çok Yüksek |
| Outlook OAuth | 🔴 Yüksek | 2 saat | Çok Yüksek |
| SMTP | 🔴 Yüksek | 1 saat | Yüksek |
| Twilio SMS | 🔴 Yüksek | 1 saat | Orta |
| Netgsm SMS | 🔴 Yüksek | 1 saat | Orta-Yüksek (TR) |
| WhatsApp Business | 🟡 Orta | 2 saat | Orta-Yüksek |
| Google Sheets | 🟡 Orta | 1.5 saat | Orta |
| Google Drive | 🟢 Düşük | 1.5 saat | Düşük |

---

## ✅ Uygulama Checklist

### Veritabanı
- [ ] Migration dosyası oluşturuldu
- [ ] Yeni kolonlar eklendi
- [ ] Index'ler eklendi
- [ ] RLS policies güncellendi

### Backend
- [ ] OAuth endpoints oluşturuldu
- [ ] Email helper fonksiyonları yazıldı
- [ ] SMS helper fonksiyonları yazıldı
- [ ] WhatsApp helper fonksiyonları yazıldı
- [ ] Google Services helper fonksiyonları yazıldı
- [ ] Token refresh mekanizması kuruldu

### Frontend
- [ ] Settings sayfasına yeni sekmeler eklendi
- [ ] OAuth bağlantı butonları eklendi
- [ ] Credentials formları eklendi
- [ ] Durum göstergeleri eklendi
- [ ] Test butonları eklendi

### Test
- [ ] Her entegrasyon test edildi
- [ ] OAuth flow çalışıyor
- [ ] Token refresh çalışıyor
- [ ] Otomasyon senaryoları test edildi

---

## 🚀 Başlangıç Adımları

### 1. Veritabanı Migration (ŞİMDİ)
```sql
-- Supabase SQL Editor'de çalıştır:
supabase/migrations/105_expand_company_integrations.sql
```

### 2. OAuth Credentials Al (Senin Yapman Gerekenler)

**Gmail OAuth:**
1. https://console.cloud.google.com/ → Project oluştur
2. Gmail API'yi etkinleştir
3. OAuth 2.0 credentials oluştur
4. Redirect URI ekle: `https://yourdomain.com/api/integrations/oauth/gmail/callback`
5. Client ID ve Client Secret'ı kopyala → `.env.local`'e ekle

**Outlook OAuth:**
1. https://portal.azure.com/ → App registration oluştur
2. Microsoft Graph API permissions ekle (Mail.Send)
3. Redirect URI ekle: `https://yourdomain.com/api/integrations/oauth/outlook/callback`
4. Client ID ve Client Secret'ı kopyala → `.env.local`'e ekle

**SMS Provider:**
- Twilio: https://console.twilio.com/ → API Key oluştur
- Netgsm: https://www.netgsm.com.tr/ → API Key al
- İleti Merkezi: https://www.iletimerkezi.com/ → API Key al

**WhatsApp Business:**
- Meta Business: https://business.facebook.com/ → WhatsApp Business API setup
- Twilio WhatsApp: Twilio Console'dan WhatsApp number al

### 3. Environment Variables (.env.local)

```bash
# Gmail OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/integrations/oauth/gmail/callback

# Outlook OAuth
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
MICROSOFT_REDIRECT_URI=https://yourdomain.com/api/integrations/oauth/outlook/callback

# SMS Providers (Opsiyonel - test için)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
NETGSM_USERCODE=your_netgsm_usercode
NETGSM_PASSWORD=your_netgsm_password
```

---

## 📚 Kaynaklar

- [Gmail API](https://developers.google.com/gmail/api)
- [Microsoft Graph API](https://learn.microsoft.com/en-us/graph/api/overview)
- [Twilio SMS API](https://www.twilio.com/docs/sms)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [Google Sheets API](https://developers.google.com/sheets/api)
- [Netgsm API](https://www.netgsm.com.tr/api/)

---

**Tahmini Toplam Süre:** 14-18 saat  
**Başlangıç:** Faz 1 (Veritabanı Genişletme)

**Sonraki Adım:** Migration dosyasını oluştur ve veritabanını genişlet!



