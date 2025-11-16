# 🚀 ENTEGRASYON KURULUM REHBERİ - ADIM ADIM

**Tarih:** 2024  
**Durum:** ✅ Tüm Entegrasyonlar Hazır

---

## 📋 HAZIRLIK

### 1. Migration'ları Çalıştır
```bash
# Terminal'de çalıştır:
supabase db push
```

**Kontrol:** Migration'lar başarıyla çalıştı mı? ✅

---

## 📧 1. EMAIL ENTEGRASYONU (Resend)

### Adım 1: Resend Hesabı Oluştur
1. https://resend.com adresine git
2. "Sign Up" butonuna tıkla
3. Ücretsiz hesap oluştur (Free tier: 3,000 email/ay)
4. Email adresini doğrula

### Adım 2: API Key Al
1. Resend dashboard'a git
2. Sol menüden "API Keys" seç
3. "Create API Key" butonuna tıkla
4. Key adı ver (örn: "CRM Production")
5. "Full Access" seç
6. "Create" butonuna tıkla
7. **API Key'i kopyala** (sadece bir kez gösterilir!)

### Adım 3: API Key'i Sisteme Gir
1. CRM'de `/user-integrations` sayfasına git
2. "Email (Resend)" kartını bul
3. "Resend API Key" alanına API key'i yapıştır
4. "Bilgileri Kaydet" butonuna tıkla
5. ✅ Başarı mesajını gör

### Adım 4: Test Et
1. "API'yi Test Et" butonuna tıkla
2. ✅ "Test başarılı!" mesajını gör
3. Email gönderimi çalışıyor mu kontrol et

### Adım 5: Gerçek Test
1. Bir müşteri detay sayfasına git (örn: `/customers/[id]`)
2. "Hızlı İşlemler" kartında "Mail Gönder" butonuna tıkla
3. Email şablonu seç (veya özel mesaj yaz)
4. "Gönder" butonuna tıkla
5. ✅ Email gönderildi mi kontrol et

**✅ EMAIL ENTEGRASYONU TAMAMLANDI!**

---

## 📱 2. SMS ENTEGRASYONU (Twilio)

### Adım 1: Twilio Hesabı Oluştur
1. https://www.twilio.com/try-twilio adresine git
2. "Start Free Trial" butonuna tıkla
3. Ücretsiz hesap oluştur (Free tier: $15.50 kredi)
4. Telefon numaranı doğrula

### Adım 2: Account SID ve Auth Token Al
1. Twilio Console'a git (https://console.twilio.com)
2. Dashboard'da "Account SID" ve "Auth Token" görünür
3. **Account SID'i kopyala**
4. **Auth Token'ı kopyala** (göster/gizle butonuna tıkla)

### Adım 3: Phone Number Al (Opsiyonel - Test için gerekli değil)
1. Twilio Console'da "Phone Numbers" > "Buy a Number" seç
2. Ülke seç (Türkiye için "Turkey")
3. "Search" butonuna tıkla
4. Bir numara seç ve "Buy" butonuna tıkla
5. **Phone Number'ı not et**

### Adım 4: API Bilgilerini Sisteme Gir
1. CRM'de `/user-integrations` sayfasına git
2. "SMS (Twilio)" kartını bul
3. "Twilio Account SID" alanına Account SID'i yapıştır
4. "Twilio Auth Token" alanına Auth Token'ı yapıştır
5. "Twilio Phone Number" alanına Phone Number'ı yapıştır (opsiyonel)
6. "Bilgileri Kaydet" butonuna tıkla
7. ✅ Başarı mesajını gör

### Adım 5: Test Et
1. "API'yi Test Et" butonuna tıkla
2. ✅ "Test başarılı!" mesajını gör
3. SMS gönderimi çalışıyor mu kontrol et

### Adım 6: Gerçek Test
1. Bir müşteri detay sayfasına git
2. "Hızlı İşlemler" kartında "SMS Gönder" butonuna tıkla
3. Mesaj yaz
4. "Gönder" butonuna tıkla
5. ✅ SMS gönderildi mi kontrol et (telefona bak)

**✅ SMS ENTEGRASYONU TAMAMLANDI!**

---

## 💬 3. WHATSAPP ENTEGRASYONU (Twilio)

### Adım 1: Twilio WhatsApp Sandbox'a Katıl
1. Twilio Console'da "Messaging" > "Try it out" > "Send a WhatsApp message" seç
2. "Get started with Twilio Sandbox" butonuna tıkla
3. WhatsApp numaranı sandbox'a ekle (QR kod ile veya mesaj gönder)
4. ✅ Sandbox'a katıldın mı kontrol et

### Adım 2: WhatsApp API Bilgilerini Sisteme Gir
1. CRM'de `/user-integrations` sayfasına git
2. "WhatsApp (Twilio)" kartını bul
3. "Twilio Account SID" alanına Account SID'i yapıştır (SMS ile aynı)
4. "Twilio Auth Token" alanına Auth Token'ı yapıştır (SMS ile aynı)
5. "Twilio WhatsApp From" alanına sandbox numarasını yapıştır (örn: `whatsapp:+14155238886`)
6. "Bilgileri Kaydet" butonuna tıkla
7. ✅ Başarı mesajını gör

### Adım 3: Test Et
1. "API'yi Test Et" butonuna tıkla
2. ✅ "Test başarılı!" mesajını gör
3. WhatsApp gönderimi çalışıyor mu kontrol et

### Adım 4: Gerçek Test
1. Bir müşteri detay sayfasına git
2. "Hızlı İşlemler" kartında "WhatsApp Gönder" butonuna tıkla
3. Mesaj yaz
4. "Gönder" butonuna tıkla
5. ✅ WhatsApp mesajı gönderildi mi kontrol et (WhatsApp'a bak)

**Not:** Sandbox'ta sadece kayıtlı numaralara mesaj gönderebilirsin. Production için Twilio WhatsApp Business API'ye geçmen gerekir.

**✅ WHATSAPP ENTEGRASYONU TAMAMLANDI!**

---

## 📅 4. GOOGLE CALENDAR ENTEGRASYONU

### Adım 1: Google Cloud Console'da Proje Oluştur
1. https://console.cloud.google.com adresine git
2. Üst menüden proje seçiciyi aç
3. "New Project" butonuna tıkla
4. Proje adı ver (örn: "CRM Calendar Integration")
5. "Create" butonuna tıkla
6. ✅ Proje oluşturuldu mu kontrol et

### Adım 2: Google Calendar API'yi Etkinleştir
1. Google Cloud Console'da "APIs & Services" > "Library" seç
2. Arama kutusuna "Google Calendar API" yaz
3. "Google Calendar API" seç
4. "Enable" butonuna tıkla
5. ✅ API etkinleştirildi mi kontrol et

### Adım 3: OAuth Consent Screen Yapılandır
1. "APIs & Services" > "OAuth consent screen" seç
2. "External" seç (test için yeterli)
3. "Create" butonuna tıkla
4. **App information:**
   - App name: "CRM Calendar Integration"
   - User support email: Kendi email'in
   - Developer contact: Kendi email'in
5. "Save and Continue" butonuna tıkla
6. **Scopes:** "Add or Remove Scopes" butonuna tıkla
   - `https://www.googleapis.com/auth/calendar` seç
   - "Update" butonuna tıkla
7. "Save and Continue" butonuna tıkla
8. **Test users:** Kendi email'ini ekle
9. "Save and Continue" butonuna tıkla
10. ✅ OAuth consent screen tamamlandı mı kontrol et

### Adım 4: OAuth 2.0 Credentials Oluştur
1. "APIs & Services" > "Credentials" seç
2. "Create Credentials" > "OAuth client ID" seç
3. **Application type:** "Web application" seç
4. **Name:** "CRM Calendar Web Client" yaz
5. **Authorized redirect URIs:** 
   - `http://localhost:3000/api/integrations/oauth/google-calendar/callback` (development için)
   - `https://yourdomain.com/api/integrations/oauth/google-calendar/callback` (production için)
6. "Create" butonuna tıkla
7. **Client ID'i kopyala**
8. **Client Secret'i kopyala** (göster/gizle butonuna tıkla)

### Adım 5: API Bilgilerini Sisteme Gir
1. CRM'de `/user-integrations` sayfasına git
2. "Google Calendar" kartını bul
3. "Google Client ID" alanına Client ID'i yapıştır
4. "Google Client Secret" alanına Client Secret'ı yapıştır
5. "Bilgileri Kaydet" butonuna tıkla
6. ✅ Başarı mesajını gör

### Adım 6: OAuth Bağlantısı Yap
1. "Google Calendar'a Bağlan" butonuna tıkla
2. Google hesabını seç
3. İzinleri onayla
4. ✅ Bağlantı başarılı mı kontrol et

### Adım 7: Test Et
1. "API'yi Test Et" butonuna tıkla
2. ✅ "Test başarılı!" mesajını gör
3. Calendar entegrasyonu çalışıyor mu kontrol et

### Adım 8: Gerçek Test
1. Bir deal detay sayfasına git
2. "Hızlı İşlemler" kartında "Takvime Ekle" butonuna tıkla
3. ✅ Etkinlik Google Calendar'a eklendi mi kontrol et (Google Calendar'ı aç)

**✅ GOOGLE CALENDAR ENTEGRASYONU TAMAMLANDI!**

---

## 🎥 5. ZOOM ENTEGRASYONU

### Adım 1: Zoom App Oluştur
1. https://marketplace.zoom.us adresine git
2. "Develop" > "Build App" seç
3. "Server-to-Server OAuth" seç
4. "Create" butonuna tıkla

### Adım 2: App Bilgilerini Doldur
1. **App Name:** "CRM Zoom Integration" yaz
2. **Company Name:** Şirket adını yaz
3. **Developer Email:** Email'ini yaz
4. "Continue" butonuna tıkla

### Adım 3: App Credentials Al
1. **Account ID'i kopyala**
2. **Client ID'i kopyala**
3. **Client Secret'i kopyala** (göster/gizle butonuna tıkla)

### Adım 4: API Bilgilerini Sisteme Gir
1. CRM'de `/user-integrations` sayfasına git
2. "Zoom" kartını bul
3. "Zoom Account ID" alanına Account ID'i yapıştır
4. "Zoom Client ID" alanına Client ID'i yapıştır
5. "Zoom Client Secret" alanına Client Secret'ı yapıştır
6. "Bilgileri Kaydet" butonuna tıkla
7. ✅ Başarı mesajını gör

### Adım 5: Test Et
1. "API'yi Test Et" butonuna tıkla
2. ✅ "Test başarılı!" mesajını gör
3. Zoom entegrasyonu çalışıyor mu kontrol et

### Adım 6: Gerçek Test
1. MeetingForm'u aç (yeni toplantı oluştur)
2. "Zoom Toplantı Oluştur" butonuna tıkla
3. ✅ Zoom link'i oluşturuldu mu kontrol et
4. Meeting kaydedildiğinde Zoom link'i görünüyor mu kontrol et

**✅ ZOOM ENTEGRASYONU TAMAMLANDI!**

---

## 🎥 6. GOOGLE MEET ENTEGRASYONU

### Adım 1: Google Cloud Console'da Proje Kullan (Calendar ile aynı proje)
1. Google Calendar entegrasyonu için oluşturduğun projeyi kullan
2. ✅ Proje mevcut mu kontrol et

### Adım 2: Google Meet API'yi Etkinleştir
1. Google Cloud Console'da "APIs & Services" > "Library" seç
2. Arama kutusuna "Google Meet API" yaz
3. "Google Meet API" seç
4. "Enable" butonuna tıkla
5. ✅ API etkinleştirildi mi kontrol et

### Adım 3: OAuth Consent Screen'e Scope Ekle
1. "APIs & Services" > "OAuth consent screen" seç
2. "Edit App" butonuna tıkla
3. "Add or Remove Scopes" butonuna tıkla
4. `https://www.googleapis.com/auth/meetings.space.created` scope'unu ekle
5. "Update" butonuna tıkla
6. "Save and Continue" butonuna tıkla
7. ✅ Scope eklendi mi kontrol et

### Adım 4: OAuth Credentials Kullan (Calendar ile aynı)
1. Google Calendar için oluşturduğun Client ID ve Secret'ı kullan
2. ✅ Credentials mevcut mu kontrol et

### Adım 5: API Bilgilerini Sisteme Gir
1. CRM'de `/user-integrations` sayfasına git
2. "Google Meet" kartını bul
3. "Google Client ID" alanına Client ID'i yapıştır (Calendar ile aynı)
4. "Google Client Secret" alanına Client Secret'ı yapıştır (Calendar ile aynı)
5. "Bilgileri Kaydet" butonuna tıkla
6. ✅ Başarı mesajını gör

### Adım 6: Test Et
1. "API'yi Test Et" butonuna tıkla
2. ✅ "Test başarılı!" mesajını gör
3. Google Meet entegrasyonu çalışıyor mu kontrol et

### Adım 7: Gerçek Test
1. MeetingForm'u aç (yeni toplantı oluştur)
2. "Google Meet Toplantı Oluştur" butonuna tıkla
3. ✅ Google Meet link'i oluşturuldu mu kontrol et
4. Meeting kaydedildiğinde Meet link'i görünüyor mu kontrol et

**✅ GOOGLE MEET ENTEGRASYONU TAMAMLANDI!**

---

## 🎥 7. MICROSOFT TEAMS ENTEGRASYONU

### Adım 1: Azure Portal'da App Registration Oluştur
1. https://portal.azure.com adresine git
2. "Azure Active Directory" > "App registrations" seç
3. "New registration" butonuna tıkla
4. **Name:** "CRM Teams Integration" yaz
5. **Supported account types:** "Accounts in any organizational directory and personal Microsoft accounts" seç
6. **Redirect URI:** 
   - Type: "Web"
   - URI: `http://localhost:3000/api/integrations/oauth/teams/callback` (development için)
   - URI: `https://yourdomain.com/api/integrations/oauth/teams/callback` (production için)
7. "Register" butonuna tıkla
8. ✅ App oluşturuldu mu kontrol et

### Adım 2: API Permissions Ekle
1. "API permissions" seç
2. "Add a permission" butonuna tıkla
3. "Microsoft Graph" seç
4. "Delegated permissions" seç
5. Şu permission'ları ekle:
   - `OnlineMeetings.ReadWrite`
   - `User.Read`
6. "Add permissions" butonuna tıkla
7. ✅ Permissions eklendi mi kontrol et

### Adım 3: Client Credentials Al
1. "Overview" sayfasına git
2. **Application (client) ID'i kopyala**
3. "Certificates & secrets" seç
4. "New client secret" butonuna tıkla
5. **Description:** "CRM Teams Secret" yaz
6. **Expires:** "24 months" seç
7. "Add" butonuna tıkla
8. **Value'i kopyala** (sadece bir kez gösterilir!)

### Adım 4: API Bilgilerini Sisteme Gir
1. CRM'de `/user-integrations` sayfasına git
2. "Microsoft Teams" kartını bul
3. "Microsoft Client ID" alanına Application (client) ID'i yapıştır
4. "Microsoft Client Secret" alanına Client Secret'ı yapıştır
5. "Bilgileri Kaydet" butonuna tıkla
6. ✅ Başarı mesajını gör

### Adım 5: Test Et
1. "API'yi Test Et" butonuna tıkla
2. ✅ "Test başarılı!" mesajını gör
3. Microsoft Teams entegrasyonu çalışıyor mu kontrol et

### Adım 6: Gerçek Test
1. MeetingForm'u aç (yeni toplantı oluştur)
2. "Teams Toplantı Oluştur" butonuna tıkla
3. ✅ Teams link'i oluşturuldu mu kontrol et
4. Meeting kaydedildiğinde Teams link'i görünüyor mu kontrol et

**✅ MICROSOFT TEAMS ENTEGRASYONU TAMAMLANDI!**

---

## 📊 8. ANALYTICS DASHBOARD TESTİ

### Adım 1: Analytics Sayfasına Git
1. CRM'de `/integrations/analytics` sayfasına git
2. ✅ Sayfa yükleniyor mu kontrol et

### Adım 2: KPI Kartlarını Kontrol Et
1. ✅ Toplam gönderim sayısı görünüyor mu?
2. ✅ Başarı oranı görünüyor mu?
3. ✅ En çok kullanılan entegrasyon görünüyor mu?
4. ✅ Tahmini maliyet görünüyor mu?

### Adım 3: Grafikleri Kontrol Et
1. ✅ Günlük trend grafiği görünüyor mu?
2. ✅ Entegrasyon dağılımı pie chart görünüyor mu?
3. ✅ Hata trend grafiği görünüyor mu?

### Adım 4: Tarih Aralığı Filtreleme
1. Tarih aralığı dropdown'ından "7 gün" seç
2. ✅ Veriler filtreleniyor mu?
3. "30 gün" seç
4. ✅ Veriler filtreleniyor mu?

**✅ ANALYTICS DASHBOARD ÇALIŞIYOR!**

---

## ⌨️ 9. COMMAND PALETTE VE KEYBOARD SHORTCUTS TESTİ

### Adım 1: Command Palette'i Aç
1. `Cmd+K` (Mac) veya `Ctrl+K` (Windows) tuşlarına bas
2. ✅ Command Palette açılıyor mu?
3. Header'daki "Komutlar" butonuna tıkla
4. ✅ Command Palette açılıyor mu?

### Adım 2: Sayfa Navigasyonu Test Et
1. Command Palette'te "müşteri" yaz
2. ✅ "Müşteriler" sayfası görünüyor mu?
3. Enter'a bas
4. ✅ Müşteriler sayfasına gidiyor mu?

### Adım 3: Müşteri Arama Test Et
1. Command Palette'te bir müşteri adı yaz (3+ karakter)
2. ✅ Müşteri sonuçları görünüyor mu?
3. Enter'a bas
4. ✅ Müşteri detay sayfasına gidiyor mu?

### Adım 4: Quick Actions Test Et
1. Command Palette'te "yeni müşteri" yaz
2. ✅ "Yeni Müşteri" seçeneği görünüyor mu?
3. Enter'a bas
4. ✅ Yeni müşteri sayfasına gidiyor mu?

### Adım 5: Keyboard Shortcuts Test Et
1. Bir liste sayfasında `N` tuşuna bas
2. ✅ Yeni kayıt sayfası açılıyor mu?
3. Bir form sayfasında `Ctrl+S` (Windows) veya `Cmd+S` (Mac) tuşuna bas
4. ✅ Form kaydediliyor mu?
5. `?` tuşuna bas
6. ✅ Kısayollar listesi gösteriliyor mu?

**✅ COMMAND PALETTE VE KEYBOARD SHORTCUTS ÇALIŞIYOR!**

---

## 📦 10. TOPLU GÖNDERİM TESTİ

### Adım 1: Müşterileri Seç
1. Müşteriler sayfasına git (`/customers`)
2. Checkbox'larla birkaç müşteri seç
3. ✅ "Toplu Mesaj Gönder" butonu görünüyor mu?

### Adım 2: BulkSendDialog'u Aç
1. "Toplu Mesaj Gönder" butonuna tıkla
2. ✅ Dialog açılıyor mu?
3. ✅ Seçili müşteriler yükleniyor mu?

### Adım 3: Gönderim Tipi Seç
1. "E-posta" seçeneğini seç
2. ✅ Geçerli müşteri sayısı doğru mu?
3. "SMS" seçeneğini seç
4. ✅ Geçerli müşteri sayısı doğru mu?

### Adım 4: Template Seç (Email için)
1. "Şablon Seç" dropdown'ından bir template seç
2. ✅ Konu ve mesaj dolduruldu mu?
3. ✅ Template değişkenleri render edildi mi?

### Adım 5: Önizleme Kontrol Et
1. Mesaj içeriği yaz
2. ✅ Önizleme gösteriliyor mu? (ilk 3 müşteri)
3. ✅ Template değişkenleri doğru render ediliyor mu?

### Adım 6: Gönderim Yap
1. "Gönder" butonuna tıkla
2. ✅ İlerleme bar'ı görünüyor mu?
3. ✅ Başarı/hata sayıları gösteriliyor mu?
4. ✅ Gönderim tamamlandı mı?

**✅ TOPLU GÖNDERİM ÇALIŞIYOR!**

---

## ✅ TÜM ENTEGRASYONLAR TAMAMLANDI!

### Kontrol Listesi:
- [ ] Email entegrasyonu çalışıyor mu?
- [ ] SMS entegrasyonu çalışıyor mu?
- [ ] WhatsApp entegrasyonu çalışıyor mu?
- [ ] Google Calendar entegrasyonu çalışıyor mu?
- [ ] Zoom entegrasyonu çalışıyor mu?
- [ ] Google Meet entegrasyonu çalışıyor mu?
- [ ] Microsoft Teams entegrasyonu çalışıyor mu?
- [ ] Analytics dashboard çalışıyor mu?
- [ ] Command Palette çalışıyor mu?
- [ ] Toplu gönderim çalışıyor mu?

---

## 🐛 SORUN GİDERME

### Email Gönderilemiyor
- ✅ Resend API key doğru mu?
- ✅ API key aktif mi?
- ✅ Email adresi geçerli mi?

### SMS/WhatsApp Gönderilemiyor
- ✅ Twilio Account SID doğru mu?
- ✅ Twilio Auth Token doğru mu?
- ✅ Telefon numarası E.164 formatında mı? (örn: +905551234567)
- ✅ Twilio hesabında kredi var mı?

### Google Calendar Bağlanamıyor
- ✅ OAuth consent screen tamamlandı mı?
- ✅ Redirect URI doğru mu?
- ✅ Client ID ve Secret doğru mu?
- ✅ Test user olarak eklendin mi?

### Zoom/Meet/Teams Toplantı Oluşturulamıyor
- ✅ API credentials doğru mu?
- ✅ API permissions eklendi mi?
- ✅ OAuth bağlantısı yapıldı mı?

---

## 📞 YARDIM

Sorun yaşıyorsan:
1. Browser console'u aç (F12)
2. Hata mesajlarını kontrol et
3. Network tab'ında API isteklerini kontrol et
4. Test butonlarını kullan
5. `/user-integrations` sayfasından entegrasyon durumunu kontrol et

---

**Son Güncelleme:** 2024  
**Durum:** ✅ Tüm Entegrasyonlar Hazır - Test Edilmeye Hazır

