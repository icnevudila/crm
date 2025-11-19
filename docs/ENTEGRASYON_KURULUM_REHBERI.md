# 🚀 Entegrasyon Kurulum Rehberi - ÜCRETSİZ Versiyonlar

> 💡 **ÖNEMLİ:** Bu rehber tamamen **ÜCRETSİZ** versiyonlar için hazırlanmıştır. Başlangıç için hiçbir ücret ödemeden tüm entegrasyonları kurabilirsin!

## 📋 İçindekiler

1. [Zoom Entegrasyonu (ÜCRETSİZ Plan)](#1-zoom-entegrasyonu-ücretsiz-plan)
2. [Google Meet Entegrasyonu (TAMAMEN ÜCRETSİZ)](#2-google-meet-entegrasyonu-tamamen-ücretsiz)
3. [Microsoft Teams Entegrasyonu (ÜCRETSİZ Plan)](#3-microsoft-teams-entegrasyonu-ücretsiz-plan)
4. [E-posta Entegrasyonu - Resend (3,000 Email/Ay ÜCRETSİZ)](#4-e-posta-entegrasyonu-resend-3000-emailay-ücretsiz)
5. [SMS Entegrasyonu - Twilio (Trial $15.50 ÜCRETSİZ)](#5-sms-entegrasyonu-twilio-trial-1550-ücretsiz)
6. [WhatsApp Entegrasyonu - Twilio Sandbox (ÜCRETSİZ)](#6-whatsapp-entegrasyonu-twilio-sandbox-ücretsiz)
7. [Google Calendar Entegrasyonu (TAMAMEN ÜCRETSİZ)](#7-google-calendar-entegrasyonu-tamamen-ücretsiz)

---

## 1. Zoom Entegrasyonu (ÜCRETSİZ Plan)

> ✅ **ÜCRETSİZ:** Zoom'un ücretsiz planı ile sınırsız 1-on-1 toplantı ve 40 dakikaya kadar grup toplantıları yapabilirsin!

### 1.1. Zoom Hesabından Ne Alacaksın?

1. **Zoom hesabı oluştur (ÜCRETSİZ)**
   - URL: https://zoom.us/signup
   - Ücretsiz hesap oluştur (kredi kartı gerekmez!)

2. **Zoom Marketplace'e git**
   - URL: https://marketplace.zoom.us/
   - Zoom hesabınla giriş yap

2. **Server-to-Server OAuth App oluştur**
   - Sol menüden "Develop" > "Build App" tıkla
   - "Server-to-Server OAuth" seçeneğini seç
   - App adı ver (örn: "CRM Entegrasyonu")
   - "Create" tıkla

3. **Credentials'ları al**
   - **Account ID**: App sayfasında "Account ID" bölümünden kopyala
   - **Client ID**: "App Credentials" bölümünden "Client ID" kopyala
   - **Client Secret**: "App Credentials" bölümünden "Client Secret" kopyala (sadece bir kez gösterilir!)

### 1.2. CRM'de Nereye Yazacaksın?

1. **SuperAdmin olarak giriş yap**
   - URL: `http://localhost:3000/tr/login` (veya production URL'in)

2. **Entegrasyonlar sayfasına git**
   - Sol menüden "SuperAdmin" > "Entegrasyonlar" tıkla
   - Veya direkt: `/tr/superadmin/integrations`

3. **Şirket seç**
   - Üstteki dropdown'dan test edeceğin şirketi seç

4. **"Video Toplantılar" sekmesine git**

5. **Zoom bilgilerini gir**
   - "Zoom Entegrasyonu" switch'ini aç
   - **Zoom Account ID**: Account ID'yi yapıştır
   - **Zoom Client ID**: Client ID'yi yapıştır
   - **Zoom Client Secret**: Client Secret'ı yapıştır (göz ikonuna tıklayarak görebilirsin)

6. **Kaydet**
   - Sağ alttaki "Kaydet" butonuna tıkla
   - Başarı mesajını gör

### 1.3. Nasıl Test Edeceksin?

1. **Yeni toplantı oluştur**
   - Sol menüden "Toplantılar" > "Yeni Toplantı" tıkla
   - Veya: `/tr/meetings/new`

2. **Toplantı bilgilerini doldur**
   - Başlık: "Test Zoom Toplantısı"
   - Tarih: Gelecek bir tarih seç
   - Süre: 60 dakika

3. **Toplantı tipini seç**
   - "Toplantı Tipi" dropdown'ından **"Zoom"** seç

4. **Otomatik link oluştur**
   - "Otomatik Oluştur" butonuna tıkla
   - 2-3 saniye bekle
   - Link otomatik olarak "Toplantı Linki" alanına doldurulmalı
   - Şifre varsa "Toplantı Şifresi" alanına doldurulmalı

5. **Toplantıyı kaydet**
   - "Kaydet" butonuna tıkla
   - Toplantı başarıyla oluşturuldu mesajını gör

6. **Doğrulama**
   - Toplantı detay sayfasına git
   - Toplantı linkinin `https://zoom.us/j/...` formatında olduğunu kontrol et
   - Linke tıklayarak Zoom'da açılıp açılmadığını test et

---

## 2. Google Meet Entegrasyonu (TAMAMEN ÜCRETSİZ)

> ✅ **TAMAMEN ÜCRETSİZ:** Google Meet tamamen ücretsizdir! Sadece Google hesabı yeterli.

### 2.1. Google Cloud Console'dan Ne Alacaksın?

1. **Google Cloud Console'a git (ÜCRETSİZ)**
   - URL: https://console.cloud.google.com/
   - Google hesabınla giriş yap (Gmail hesabın yeterli!)
   - **Ücretsiz tier:** $300 kredi ve her zaman ücretsiz servisler

2. **Proje oluştur**
   - Üstteki proje seçiciden "New Project" tıkla
   - Proje adı ver (örn: "CRM Entegrasyonu")
   - "Create" tıkla

3. **Google Calendar API'yi etkinleştir**
   - Sol menüden "APIs & Services" > "Library" tıkla
   - "Google Calendar API" ara
   - "Enable" tıkla

4. **OAuth Consent Screen yapılandır**
   - Sol menüden "APIs & Services" > "OAuth consent screen" tıkla
   - User Type: "External" seç
   - App name: "CRM Entegrasyonu" yaz
   - User support email: Kendi e-postanı seç
   - Developer contact: Kendi e-postanı yaz
   - "Save and Continue" tıkla
   - Scopes: Varsayılanları kabul et, "Save and Continue" tıkla
   - Test users: Kendi e-postanı ekle, "Save and Continue" tıkla

5. **OAuth 2.0 Client ID oluştur**
   - Sol menüden "APIs & Services" > "Credentials" tıkla
   - "Create Credentials" > "OAuth client ID" tıkla
   - Application type: "Web application" seç
   - Name: "CRM Web Client" yaz
   - Authorized redirect URIs: `http://localhost:3000/api/integrations/oauth/google-calendar/callback` ekle (production'da domain'i değiştir)
   - "Create" tıkla

6. **Credentials'ları al**
   - **Client ID**: Açılan popup'tan kopyala (xxxxx.apps.googleusercontent.com formatında)
   - **Client Secret**: Aynı popup'tan kopyala (GOCSPX-xxxxx formatında)

### 2.2. CRM'de Nereye Yazacaksın?

1. **SuperAdmin > Entegrasyonlar > Google Calendar sekmesi**

2. **Google Calendar bilgilerini gir**
   - **Google Calendar Client ID**: Client ID'yi yapıştır
   - **Google Calendar Client Secret**: Client Secret'ı yapıştır
   - **Redirect URI**: Otomatik doldurulmuş olmalı, kontrol et

3. **Kaydet**

### 2.3. Kullanıcı Google Hesabını Bağlama

1. **Kullanıcı olarak giriş yap** (SuperAdmin değil, normal kullanıcı)

2. **Kullanıcı Entegrasyonları sayfasına git**
   - Sol menüden "Yönetim" > "Kullanıcı Entegrasyonları" tıkla
   - Veya: `/tr/user-integrations`

3. **Google Calendar bağla**
   - "Google Calendar Bağla" butonuna tıkla
   - Google OAuth sayfası açılır
   - Google hesabını seç
   - İzinleri kabul et
   - Yönlendirme sonrası "Bağlantı başarılı" mesajını gör

### 2.4. Nasıl Test Edeceksin?

1. **Yeni toplantı oluştur**
   - Toplantı tipini **"Google Meet"** seç
   - "Otomatik Oluştur" butonuna tıkla
   - Link `https://meet.google.com/...` formatında oluşturulmalı

2. **Google Calendar'ı kontrol et**
   - Google Calendar'ı aç: https://calendar.google.com/
   - Toplantının otomatik eklendiğini gör
   - Toplantı linkine tıklayarak Google Meet'in açıldığını test et

---

## 3. Microsoft Teams Entegrasyonu (ÜCRETSİZ Plan)

> ✅ **ÜCRETSİZ:** Microsoft Teams'in ücretsiz planı ile sınırsız toplantı yapabilirsin!

### 3.1. Microsoft Azure'dan Ne Alacaksın?

1. **Azure Portal'a git (ÜCRETSİZ)**
   - URL: https://portal.azure.com/
   - Microsoft hesabınla giriş yap (Outlook/Hotmail hesabın yeterli!)
   - **Ücretsiz tier:** Her zaman ücretsiz servisler mevcut

2. **Azure Active Directory'ye git**
   - Sol menüden "Azure Active Directory" tıkla

3. **App Registration oluştur**
   - Sol menüden "App registrations" > "New registration" tıkla
   - Name: "CRM Entegrasyonu" yaz
   - Supported account types: "Accounts in any organizational directory and personal Microsoft accounts" seç
   - Redirect URI: Platform "Web" seç, URI: `http://localhost:3000/api/integrations/oauth/microsoft/callback`
   - "Register" tıkla

4. **API Permissions ekle**
   - Sol menüden "API permissions" tıkla
   - "Add a permission" tıkla
   - "Microsoft Graph" seç
   - "Delegated permissions" seç
   - Şunları ekle:
     - `OnlineMeetings.ReadWrite`
     - `Calendars.ReadWrite`
   - "Add permissions" tıkla
   - "Grant admin consent" tıkla (eğer admin isen)

5. **Client Secret oluştur**
   - Sol menüden "Certificates & secrets" tıkla
   - "New client secret" tıkla
   - Description: "CRM Secret" yaz
   - Expires: 24 months seç
   - "Add" tıkla
   - **Value**'yu kopyala (sadece bir kez gösterilir!)

6. **Credentials'ları al**
   - **Client ID**: Overview sayfasından "Application (client) ID" kopyala
   - **Client Secret**: Az önce oluşturduğun secret'ın value'su

### 3.2. CRM'de Nereye Yazacaksın?

1. **SuperAdmin > Entegrasyonlar > Video Toplantılar sekmesi**

2. **Microsoft Teams entegrasyonunu aktifleştir**
   - "Microsoft Teams Entegrasyonu" switch'ini aç
   - **Not:** Şu an için Microsoft Teams için kullanıcı bazlı OAuth gerekiyor (gelecekte şirket bazlı eklenecek)

3. **Kaydet**

### 3.3. Nasıl Test Edeceksin?

1. **Kullanıcı Microsoft hesabını bağla** (eğer kullanıcı entegrasyonları sayfası varsa)

2. **Yeni toplantı oluştur**
   - Toplantı tipini **"Teams"** seç
   - "Otomatik Oluştur" butonuna tıkla
   - Link `https://teams.microsoft.com/...` formatında oluşturulmalı

---

## 4. E-posta Entegrasyonu - Resend (3,000 Email/Ay ÜCRETSİZ)

> ✅ **ÜCRETSİZ:** Resend'in ücretsiz planı ile ayda 3,000 e-posta gönderebilirsin! (Kredi kartı gerekmez)

### 4.1. Resend'den Ne Alacaksın?

1. **Resend.com'a git (ÜCRETSİZ)**
   - URL: https://resend.com/
   - Hesap oluştur (kredi kartı gerekmez!)
   - **Ücretsiz tier:** 3,000 email/ay tamamen ücretsiz

2. **API Key oluştur**
   - Dashboard'a git
   - Sol menüden "API Keys" tıkla
   - "Create API Key" tıkla
   - Name: "CRM Production" yaz
   - Permission: "Sending access" seç
   - "Create" tıkla
   - **API Key**'i kopyala (sadece bir kez gösterilir! `re_...` formatında)

### 4.2. CRM'de Nereye Yazacaksın?

1. **SuperAdmin > Entegrasyonlar > Email sekmesi**

2. **Resend API Key'i gir**
   - "Resend API Key" alanına API key'i yapıştır
   - Göz ikonuna tıklayarak kontrol edebilirsin

3. **Kaydet**

### 4.3. Nasıl Test Edeceksin?

1. **Herhangi bir müşteri detay sayfasına git**
   - Örn: `/tr/customers/[id]`

2. **"E-posta Gönder" butonuna tıkla**
   - E-posta gönderme modal'ı açılır
   - Konu ve içerik gir
   - "Gönder" tıkla

3. **Doğrulama**
   - Müşterinin e-posta kutusunu kontrol et
   - E-postanın geldiğini gör

---

## 5. SMS Entegrasyonu - Twilio (Trial $15.50 ÜCRETSİZ)

> ✅ **ÜCRETSİZ:** Twilio'nun trial hesabı ile $15.50 kredi alırsın! (Kredi kartı gerekmez, sadece telefon doğrulaması)

### 5.1. Twilio'dan Ne Alacaksın?

1. **Twilio.com'a git (ÜCRETSİZ Trial)**
   - URL: https://www.twilio.com/try-twilio
   - Hesap oluştur (kredi kartı gerekmez!)
   - Telefon numaranı doğrula
   - **Ücretsiz trial:** $15.50 kredi (yaklaşık 1,000 SMS)

2. **Credentials'ları al**
   - Dashboard'a git
   - **Account SID**: Ana sayfada görünür (`AC...` formatında)
   - **Auth Token**: Ana sayfada görünür (göz ikonuna tıklayarak görebilirsin)

3. **Telefon numarası al (ÜCRETSİZ Trial)**
   - Sol menüden "Phone Numbers" > "Buy a number" tıkla
   - Ülke seç (Türkiye için "Turkey")
   - **ÖNEMLİ:** Trial hesabında bazı ülkelerde numara alınamayabilir
   - **Alternatif:** Trial için ABD numarası alabilirsin (ücretsiz)
   - **Phone Number**: Aldığın numara (`+1...` veya `+90...` formatında)
   - **Not:** Trial bitince numara iptal edilir, ücretli plana geçmen gerekir

### 5.2. CRM'de Nereye Yazacaksın?

1. **SuperAdmin > Entegrasyonlar > SMS sekmesi**

2. **Twilio bilgilerini gir**
   - "SMS Entegrasyonu" switch'ini aç
   - **Twilio Account SID**: Account SID'yi yapıştır
   - **Twilio Auth Token**: Auth Token'ı yapıştır
   - **Twilio Telefon Numarası**: Telefon numarasını yapıştır (E.164 formatında: +905551234567)

3. **Kaydet**

### 5.3. Nasıl Test Edeceksin?

1. **Herhangi bir müşteri detay sayfasına git**
   - Müşterinin telefon numarası olmalı

2. **"SMS Gönder" butonuna tıkla**
   - SMS gönderme modal'ı açılır
   - Mesaj gir
   - "Gönder" tıkla

3. **Doğrulama**
   - Müşterinin telefonuna SMS geldiğini kontrol et

---

## 6. WhatsApp Entegrasyonu - Twilio Sandbox (ÜCRETSİZ)

> ✅ **TAMAMEN ÜCRETSİZ:** Twilio WhatsApp Sandbox tamamen ücretsizdir! Sadece kayıtlı numaralara gönderebilirsin.

### 6.1. Twilio WhatsApp'tan Ne Alacaksın?

1. **Twilio Console'a git**
   - URL: https://console.twilio.com/
   - Twilio hesabınla giriş yap (SMS için oluşturduğun hesap)

2. **WhatsApp Sandbox'ı aktifleştir (ÜCRETSİZ)**
   - Sol menüden "Messaging" > "Try it out" > "Send a WhatsApp message" tıkla
   - Sandbox'ı aktifleştir
   - Kendi telefon numaranı sandbox'a ekle (QR kod ile veya mesaj göndererek)
   - **ÜCRETSİZ:** Sandbox tamamen ücretsizdir, sınırsız mesaj gönderebilirsin!

3. **WhatsApp numarasını al**
   - Sandbox sayfasında **WhatsApp numarası** görünür (`whatsapp:+14155238886` formatında)
   - **Not:** Sandbox modunda sadece kayıtlı numaralara gönderebilirsin (test için yeterli!)

### 6.2. CRM'de Nereye Yazacaksın?

1. **SuperAdmin > Entegrasyonlar > WhatsApp sekmesi**

2. **Twilio WhatsApp bilgilerini gir**
   - "WhatsApp Entegrasyonu" switch'ini aç
   - **Twilio Account SID**: SMS ile aynı Account SID'yi kullan
   - **Twilio Auth Token**: SMS ile aynı Auth Token'ı kullan
   - **Twilio WhatsApp Numarası**: WhatsApp numarasını yapıştır (`whatsapp:+14155238886` formatında)

3. **Kaydet**

### 6.3. Nasıl Test Edeceksin?

1. **Herhangi bir müşteri detay sayfasına git**
   - Müşterinin telefon numarası olmalı

2. **"WhatsApp Gönder" butonuna tıkla**
   - WhatsApp gönderme modal'ı açılır
   - Mesaj gir
   - "Gönder" tıkla

3. **Doğrulama**
   - Müşterinin WhatsApp'ına mesaj geldiğini kontrol et
   - **Not:** Sandbox modunda sadece kayıtlı numaralara gönderebilirsin

---

## 7. Google Calendar Entegrasyonu (TAMAMEN ÜCRETSİZ)

> ✅ **TAMAMEN ÜCRETSİZ:** Google Calendar tamamen ücretsizdir! Sadece Google hesabı yeterli.

### 7.1. Google Cloud Console'dan Ne Alacaksın?

**Google Meet entegrasyonu ile aynı credentials'ları kullan!** (Zaten ücretsiz)

- Client ID: Google Meet'teki Client ID
- Client Secret: Google Meet'teki Client Secret
- Redirect URI: Google Meet'teki Redirect URI

### 7.2. CRM'de Nereye Yazacaksın?

1. **SuperAdmin > Entegrasyonlar > Google Calendar sekmesi**

2. **Google Calendar bilgilerini gir** (Google Meet ile aynı)

3. **Kaydet**

### 7.3. Kullanıcı Google Hesabını Bağlama

**Google Meet entegrasyonu ile aynı adımlar!**

1. **Kullanıcı Entegrasyonları sayfasına git**
2. **"Google Calendar Bağla" butonuna tıkla**
3. **Google OAuth akışını tamamla**

### 7.4. Nasıl Test Edeceksin?

1. **Toplantı oluştur**
   - Toplantı tipi: Zoom, Google Meet veya Teams
   - Toplantı linki otomatik oluşturulur
   - Toplantıyı kaydet

2. **Google Calendar'ı kontrol et**
   - Google Calendar'ı aç: https://calendar.google.com/
   - Toplantının otomatik eklendiğini gör
   - Toplantı linki ve şifre açıklamada olmalı

---

## 🎯 Hızlı Test Senaryosu

### Senaryo: Zoom Toplantısı Oluştur ve Gönder

1. **Zoom credentials'ları gir** (SuperAdmin > Entegrasyonlar > Video Toplantılar)
2. **Yeni toplantı oluştur** (Toplantılar > Yeni Toplantı)
3. **Toplantı tipi: Zoom seç**
4. **"Otomatik Oluştur" tıkla** → Link oluşturulur
5. **Toplantıyı kaydet**
6. **Toplantı detay sayfasında "Toplantı Linki Gönder" tıkla**
7. **E-posta veya WhatsApp seç**
8. **Gönder**
9. **Müşterinin e-postasını/WhatsApp'ını kontrol et** → Link geldi mi?

---

## ⚠️ Önemli Notlar

1. **Secret'ları sakla!**
   - Client Secret, API Key, Auth Token gibi bilgileri kimseyle paylaşma
   - CRM'de maskelenmiş görünürler (`***`)

2. **Test ortamı**
   - İlk testleri localhost'ta yap
   - Production'a geçmeden önce tüm entegrasyonları test et

3. **ÜCRETSİZ Limitler (Başlangıç İçin Yeterli!)**
   - ✅ **Resend:** 3,000 email/ay (tamamen ücretsiz, kredi kartı gerekmez)
   - ✅ **Twilio SMS:** $15.50 trial kredi (yaklaşık 1,000 SMS, kredi kartı gerekmez)
   - ✅ **Twilio WhatsApp:** Sandbox tamamen ücretsiz (sınırsız, sadece kayıtlı numaralara)
   - ✅ **Zoom:** Ücretsiz plan (40 dakikaya kadar grup toplantıları, sınırsız 1-on-1)
   - ✅ **Google Meet:** Tamamen ücretsiz (sınırsız)
   - ✅ **Microsoft Teams:** Ücretsiz plan (sınırsız toplantı)
   - ✅ **Google Calendar:** Tamamen ücretsiz (sınırsız)

4. **OAuth redirect URI'ları**
   - Localhost: `http://localhost:3000/api/integrations/oauth/[provider]/callback`
   - Production: `https://yourdomain.com/api/integrations/oauth/[provider]/callback`

5. **Ücretsiz Başlangıç İçin Yeterli!**
   - Tüm entegrasyonlar ücretsiz planlarla başlayabilirsin
   - İhtiyaç duyduğunda ücretli plana geçebilirsin
   - Hiçbir entegrasyon için başlangıçta kredi kartı gerekmez!

---

## 🐛 Sorun Giderme

### Zoom linki oluşturulmuyor
- ✅ Credentials doğru mu? (Account ID, Client ID, Client Secret)
- ✅ Browser console'da hata var mı? (F12 > Console)
- ✅ Network sekmesinde API hatası var mı? (F12 > Network)

### Google Meet linki oluşturulmuyor
- ✅ Google Calendar entegrasyonu aktif mi?
- ✅ Kullanıcının Google hesabı bağlı mı?
- ✅ Google Calendar API etkinleştirildi mi?

### E-posta gönderilmiyor
- ✅ Resend API key doğru mu?
- ✅ Müşterinin e-posta adresi geçerli mi?
- ✅ Resend dashboard'da gönderim logları var mı?

### SMS/WhatsApp gönderilmiyor
- ✅ Twilio credentials doğru mu?
- ✅ Telefon numarası E.164 formatında mı? (+90...)
- ✅ Twilio dashboard'da kredi var mı? (Trial: $15.50)
- ✅ WhatsApp Sandbox'ta numara kayıtlı mı? (Sandbox için gerekli)

---

## ✅ Kontrol Listesi

- [ ] Zoom credentials girildi ve test edildi
- [ ] Google Meet credentials girildi ve test edildi
- [ ] Microsoft Teams credentials girildi ve test edildi
- [ ] Resend API key girildi ve test edildi
- [ ] Twilio SMS credentials girildi ve test edildi
- [ ] Twilio WhatsApp credentials girildi ve test edildi
- [ ] Google Calendar credentials girildi ve test edildi
- [ ] Kullanıcı Google hesabını bağladı
- [ ] Toplantı linki gönderme test edildi
- [ ] Otomatik takvim ekleme test edildi

---

## 💰 Ücretsiz Başlangıç Özeti

| Entegrasyon | Ücretsiz Limit | Kredi Kartı Gerekli? |
|------------|----------------|---------------------|
| **Zoom** | 40 dk grup toplantıları, sınırsız 1-on-1 | ❌ Hayır |
| **Google Meet** | Sınırsız | ❌ Hayır |
| **Microsoft Teams** | Sınırsız | ❌ Hayır |
| **Resend (Email)** | 3,000 email/ay | ❌ Hayır |
| **Twilio SMS** | $15.50 trial kredi (~1,000 SMS) | ❌ Hayır |
| **Twilio WhatsApp** | Sandbox sınırsız (kayıtlı numaralara) | ❌ Hayır |
| **Google Calendar** | Sınırsız | ❌ Hayır |

> 🎉 **Sonuç:** Tüm entegrasyonlar ücretsiz planlarla başlayabilirsin! Hiçbir entegrasyon için başlangıçta kredi kartı gerekmez!

---

**Son Güncelleme:** 2024

**Sorular için:** Bu rehberi takip ederek tüm entegrasyonları **ÜCRETSİZ** olarak kurup test edebilirsin. Herhangi bir sorun olursa browser console'u (F12) kontrol et ve hata mesajlarını oku.

