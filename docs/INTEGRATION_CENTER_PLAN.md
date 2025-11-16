# 🔌 Entegrasyon Merkezi (Integration Center) - Plan

**Tarih:** 2024  
**Durum:** 📋 Planlama Aşaması

---

## 🎯 Amaç

CRM'de kullanılacak tüm dış servis entegrasyonlarını tek bir merkezden yönetmek. Her şirket kendi entegrasyonlarını bağlayabilsin ve otomatik olarak aktif hale gelsin.

---

## 📋 Entegrasyon Listesi

### ✅ Video Meeting (Zaten Var)
- [x] Zoom
- [x] Google Meet  
- [x] Microsoft Teams

### 🆕 E-posta Entegrasyonları
- [ ] Gmail API (OAuth 2.0)
- [ ] Outlook/Microsoft 365 (OAuth 2.0)
- [ ] SMTP (Genel SMTP servisleri - SendGrid, Brevo, vb.)

### 🆕 SMS Entegrasyonları
- [ ] Twilio SMS
- [ ] Nexmo/Vonage SMS
- [ ] Netgsm (Türkiye)
- [ ] İleti Merkezi (Türkiye)

### 🆕 WhatsApp Entegrasyonları
- [ ] WhatsApp Business API (Meta)
- [ ] Twilio WhatsApp API
- [ ] WhatsApp Cloud API

### 🆕 Google Services
- [ ] Google Sheets API (OAuth 2.0)
- [ ] Google Drive API (OAuth 2.0)
- [ ] Google Contacts API (OAuth 2.0)

### 🆕 Diğer Entegrasyonlar
- [ ] Slack API
- [ ] Telegram Bot API
- [ ] WhatsApp Business API
- [ ] Facebook Messenger

---

## 🏗️ Mimari Tasarım

### 1. Veritabanı Yapısı

```
CompanyIntegration (Mevcut - Genişletilecek)
├── Zoom credentials ✅ (var)
├── Google Meet credentials ✅ (var)
├── Microsoft Teams credentials ✅ (var)
└── YENİ KOLONLAR:
    ├── emailProvider (GMAIL, OUTLOOK, SMTP)
    ├── emailSmtpHost, emailSmtpPort, emailSmtpUser, emailSmtpPassword
    ├── emailOAuthToken, emailOAuthRefreshToken
    ├── smsProvider (TWILIO, NEXMO, NETGSM, ILETI_MERKEZI)
    ├── smsApiKey, smsApiSecret, smsSenderNumber
    ├── whatsappProvider (WHATSAPP_BUSINESS, TWILIO_WHATSAPP)
    ├── whatsappApiKey, whatsappApiSecret, whatsappPhoneNumberId
    ├── googleSheetsEnabled, googleSheetsToken
    ├── googleDriveEnabled, googleDriveToken
    └── status (ACTIVE, INACTIVE, ERROR)
```

### 2. Frontend Yapısı

```
Settings > API Entegrasyonları (Mevcut - Genişletilecek)
├── Video Meeting (Zoom, Meet, Teams) ✅ (var)
└── YENİ SEKMELER:
    ├── E-posta Entegrasyonları
    │   ├── Gmail (OAuth bağlantısı)
    │   ├── Outlook (OAuth bağlantısı)
    │   └── SMTP (Manuel credentials)
    ├── SMS Entegrasyonları
    │   ├── Twilio
    │   ├── Netgsm
    │   └── İleti Merkezi
    ├── WhatsApp Entegrasyonları
    │   ├── WhatsApp Business API
    │   └── Twilio WhatsApp
    └── Google Services
        ├── Google Sheets
        ├── Google Drive
        └── Google Contacts
```

### 3. OAuth Flow Implementasyonu

Her OAuth entegrasyonu için:
1. **Settings'te "Bağlan" Butonu** → OAuth URL'ine yönlendir
2. **OAuth Callback Endpoint** → Token'ları al ve kaydet
3. **Auto-Refresh Token** → Token expire olduğunda otomatik yenile
4. **Status Gösterimi** → Bağlı/Bağlı Değil durumu

---

## 📝 Detaylı Plan

### Faz 1: Veritabanı Genişletme (1 saat)
- [ ] `CompanyIntegration` tablosuna yeni kolonlar ekle
- [ ] Migration dosyası oluştur
- [ ] RLS policies güncelle

### Faz 2: E-posta Entegrasyonları (3-4 saat)
- [ ] Gmail OAuth flow
- [ ] Outlook OAuth flow
- [ ] SMTP manuel credentials
- [ ] Email gönderim API'leri

### Faz 3: SMS Entegrasyonları (2-3 saat)
- [ ] Twilio SMS API
- [ ] Netgsm SMS API
- [ ] İleti Merkezi SMS API
- [ ] SMS gönderim fonksiyonları

### Faz 4: WhatsApp Entegrasyonları (3-4 saat)
- [ ] WhatsApp Business API
- [ ] Twilio WhatsApp API
- [ ] WhatsApp mesaj gönderim

### Faz 5: Google Services (2-3 saat)
- [ ] Google Sheets API
- [ ] Google Drive API
- [ ] Google Contacts API

### Faz 6: Frontend - Entegrasyon Merkezi UI (2-3 saat)
- [ ] Settings sayfasında yeni sekmeler
- [ ] Her entegrasyon için bağlantı adımları
- [ ] OAuth flow UI
- [ ] Durum göstergeleri

---

## 🔐 OAuth Flow Detayları

### Gmail OAuth Flow
1. Kullanıcı Settings > E-posta Entegrasyonları > Gmail'de "Bağlan" tıklar
2. Google OAuth sayfasına yönlendirilir
3. İzin verir
4. Callback endpoint'e döner (`/api/integrations/oauth/google/callback`)
5. Access token ve refresh token alınır
6. `CompanyIntegration` tablosuna kaydedilir
7. Entegrasyon aktif olur

### Outlook OAuth Flow
1. Kullanıcı Settings > E-posta Entegrasyonları > Outlook'da "Bağlan" tıklar
2. Microsoft OAuth sayfasına yönlendirilir
3. İzin verir
4. Callback endpoint'e döner (`/api/integrations/oauth/microsoft/callback`)
5. Access token ve refresh token alınır
6. `CompanyIntegration` tablosuna kaydedilir
7. Entegrasyon aktif olur

---

## 💡 Kullanım Senaryoları

### Senaryo 1: E-posta Gönderimi
1. Deal/Quote/Invoice oluşturulduğunda
2. CRM otomatik olarak Gmail/Outlook üzerinden e-posta gönderir
3. Şirketin bağlı e-posta hesabı kullanılır

### Senaryo 2: SMS Gönderimi
1. Müşteri bilgileri güncellendiğinde
2. SMS ile bilgilendirme gönderilir
3. Şirketin bağlı SMS provider'ı kullanılır

### Senaryo 3: WhatsApp Mesajı
1. Meeting hatırlatması gönderilir
2. WhatsApp Business API üzerinden mesaj gider
3. Şirketin bağlı WhatsApp hesabı kullanılır

### Senaryo 4: Google Sheets Export
1. Raporlar sayfasında "Export to Google Sheets" butonu
2. Otomatik olarak Google Sheets'e aktarılır
3. Şirketin Google hesabı kullanılır

---

## 📊 Öncelik Sırası

### 🔴 YÜKSEK ÖNCELİK (İlk Yapılacaklar)
1. **E-posta Entegrasyonları** - Gmail, Outlook, SMTP
2. **SMS Entegrasyonları** - Twilio, Netgsm
3. **Entegrasyon Merkezi UI** - Settings sayfasında yeni sekme

### 🟡 ORTA ÖNCELİK
4. **WhatsApp Entegrasyonları** - WhatsApp Business API
5. **Google Sheets** - Rapor export için

### 🟢 DÜŞÜK ÖNCELİK
6. **Google Drive** - Doküman yedekleme
7. **Slack/Telegram** - Bildirim entegrasyonları

---

## 🔄 Otomasyon Senaryoları

### 1. Deal Created → E-posta Gönder
- Deal oluşturulduğunda müşteriye otomatik e-posta

### 2. Quote Sent → SMS + E-posta
- Quote gönderildiğinde hem e-posta hem SMS

### 3. Meeting Reminder → WhatsApp
- Meeting'den 1 saat önce WhatsApp hatırlatması

### 4. Invoice Paid → Gmail + Sheets
- Fatura ödendiğinde e-posta gönder + Google Sheets'e kaydet

---

## 🛠️ Teknik Detaylar

### OAuth Endpoints
```
GET  /api/integrations/oauth/[provider]/authorize - OAuth başlat
GET  /api/integrations/oauth/[provider]/callback - OAuth callback
POST /api/integrations/oauth/[provider]/disconnect - Bağlantıyı kes
```

### API Endpoints
```
GET  /api/integrations - Tüm entegrasyonları getir
PUT  /api/integrations - Entegrasyonları güncelle
POST /api/integrations/test/[provider] - Entegrasyon test et
```

### Helper Functions
```
lib/integrations/
├── email/
│   ├── gmail.ts
│   ├── outlook.ts
│   └── smtp.ts
├── sms/
│   ├── twilio.ts
│   ├── netgsm.ts
│   └── iletimerkezi.ts
├── whatsapp/
│   ├── whatsapp-business.ts
│   └── twilio-whatsapp.ts
└── google/
    ├── sheets.ts
    ├── drive.ts
    └── contacts.ts
```

---

## ✅ Checklist

### Faz 1: Veritabanı
- [ ] CompanyIntegration tablosu genişletildi
- [ ] Migration oluşturuldu
- [ ] RLS policies güncellendi

### Faz 2: Backend
- [ ] OAuth endpoints oluşturuldu
- [ ] API helper fonksiyonları yazıldı
- [ ] Token refresh mekanizması kuruldu

### Faz 3: Frontend
- [ ] Settings sayfasına yeni sekmeler eklendi
- [ ] Bağlantı adımları UI oluşturuldu
- [ ] Durum göstergeleri eklendi

### Faz 4: Test
- [ ] Her entegrasyon test edildi
- [ ] OAuth flow çalışıyor
- [ ] Otomasyon senaryoları test edildi

---

**Tahmini Toplam Süre:** 12-16 saat  
**Başlangıç:** Faz 1 (Veritabanı Genişletme)







