# 📹 Meeting API Entegrasyonları - Kullanım Kılavuzu

**Tarih:** 2024  
**Durum:** ✅ Hazır

---

## 📋 Genel Bakış

Meeting modülüne Zoom, Google Meet ve Microsoft Teams API entegrasyonları eklendi. Artık toplantı oluştururken otomatik olarak video meeting linkleri oluşturulabilir.

---

## 🚀 Özellikler

### ✅ Tamamlanan Özellikler

1. **Zoom API Entegrasyonu**
   - Otomatik Zoom meeting oluşturma
   - Meeting link ve şifre otomatik kaydedilir
   - Server-to-Server OAuth desteği

2. **Google Meet API Entegrasyonu**
   - Google Calendar üzerinden Meet meeting oluşturma
   - Otomatik Calendar event oluşturma
   - Meet linki otomatik kaydedilir

3. **Microsoft Teams API Entegrasyonu**
   - Microsoft Graph API üzerinden Teams meeting oluşturma
   - Online meeting oluşturma
   - Teams linki otomatik kaydedilir

4. **MeetingForm Güncellemeleri**
   - "Otomatik Oluştur" butonu eklendi
   - Meeting tipi seçimi (Zoom/Meet/Teams)
   - Meeting link ve şifre otomatik doldurulur

---

## 🔧 Kurulum

### 1. Migration Çalıştırma

Önce `CompanyIntegration` tablosunu oluşturun:

```sql
-- Supabase SQL Editor'de çalıştırın:
supabase/migrations/104_add_company_integrations.sql
```

### 2. API Credentials Ayarlama (Her Şirket Kendi Credentials'ını Girer)

**ÖNEMLİ:** Artık environment variable'lara gerek yok! Her şirket kendi credentials'larını **Settings** sayfasından girebilir.

#### Adımlar:

1. **Settings Sayfasına Git:**
   - Sol menüden "Ayarlar" sekmesine tıklayın
   - Sadece **Admin** ve **SuperAdmin** rolündeki kullanıcılar görebilir

2. **API Entegrasyonları Sekmesini Aç:**
   - "API Entegrasyonları" sekmesine tıklayın
   - Zoom, Google Meet veya Microsoft Teams entegrasyonunu açın (toggle butonu)

3. **Credentials Gir:**
   - **Zoom için:** Account ID, Client ID, Client Secret girin
   - **Google Meet için:** Access Token girin
   - **Microsoft Teams için:** Access Token girin
   - "API Entegrasyonlarını Kaydet" butonuna tıklayın

4. **Kullanıma Hazır:**
   - Artık meeting oluştururken "Otomatik Oluştur" butonu çalışacak
   - Şirketinizin credentials'ı otomatik kullanılacak

#### API Credentials Nasıl Alınır:

**Zoom API:**
1. https://marketplace.zoom.us/ adresine gidin
2. "Develop" > "Build App" seçin
3. "Server-to-Server OAuth" app tipini seçin
4. App'i oluşturun ve credentials'ları kopyalayın
5. Settings > API Entegrasyonları'na girin

**Google Meet API:**
1. https://console.cloud.google.com/ adresine gidin
2. Google Calendar API'yi etkinleştirin
3. OAuth 2.0 credentials oluşturun
4. OAuth flow ile access token alın
5. Settings > API Entegrasyonları'na girin

**Microsoft Teams API:**
1. https://portal.azure.com/ adresine gidin
2. Azure Active Directory > App registrations
3. Yeni app kaydı oluşturun
4. Microsoft Graph API permissions ekleyin (OnlineMeetings.ReadWrite)
5. OAuth flow ile access token alın
6. Settings > API Entegrasyonları'na girin

---

## 📖 Kullanım

### 1. Admin: API Credentials Ayarlama (İlk Kez)

1. **Settings Sayfasına Git:**
   - Sol menüden "Ayarlar" > "API Entegrasyonları" sekmesine git
   - Sadece **Admin** ve **SuperAdmin** görebilir

2. **Entegrasyonu Aktifleştir:**
   - Zoom/Google Meet/Teams için toggle butonuna tıkla (Açık/Kapalı)
   - Credentials form alanları görünecek

3. **Credentials Gir:**
   - API credentials'larını gir (yukarıdaki "API Credentials Nasıl Alınır" bölümüne bak)
   - "API Entegrasyonlarını Kaydet" butonuna tıkla

4. **Hazır:**
   - Artık tüm kullanıcılar bu credentials'ı kullanarak meeting oluşturabilir

### 2. Kullanıcı: MeetingForm'da Otomatik Meeting Oluşturma

1. **Toplantı Formu Aç:**
   - Yeni görüşme oluştur sayfasına git
   - Toplantı başlığı ve tarihini gir

2. **Toplantı Tipi Seç:**
   - "Toplantı Tipi" dropdown'dan Zoom, Google Meet veya Teams seçin

3. **Otomatik Oluştur Butonuna Tıkla:**
   - "Otomatik Oluştur" butonu görünecek (eğer entegrasyon aktifse)
   - Butona tıklayın
   - Şirketinizin credentials'ı kullanılarak API otomatik meeting oluşturacak
   - Meeting link ve şifre otomatik olarak form'a doldurulacak

4. **Toplantıyı Kaydet:**
   - Form'u doldurup kaydedin
   - Meeting link veritabanına kaydedilecek

### 3. Manuel Link Girişi (Alternatif)

Eğer "Otomatik Oluştur" kullanmak istemezseniz:
1. Toplantı tipini seçin
2. Toplantı linkini manuel olarak girin
3. Şifre varsa girin
4. Kaydedin

---

## 🔌 API Endpoints

### POST /api/meetings/create-video-meeting

**Amaç:** Video meeting (Zoom/Meet/Teams) oluşturma

**Request Body:**
```json
{
  "meetingType": "ZOOM" | "GOOGLE_MEET" | "TEAMS",
  "title": "Toplantı Başlığı",
  "meetingDate": "2024-01-01T10:00:00Z",
  "meetingDuration": 60,
  "description": "Toplantı açıklaması",
  "attendees": ["email1@example.com", "email2@example.com"],
  "password": "optional_password"
}
```

**Response:**
```json
{
  "success": true,
  "meetingUrl": "https://zoom.us/j/123456789",
  "meetingId": "123456789",
  "password": "123456",
  "joinUrl": "https://zoom.us/j/123456789",
  "message": "ZOOM meeting başarıyla oluşturuldu"
}
```

**Error Response:**
```json
{
  "error": "Zoom OAuth failed: Invalid credentials",
  "message": "Zoom API credentials are required..."
}
```

---

## 🛠️ Kod Yapısı

### 1. API Helper Fonksiyonları

**Dosya:** `src/lib/meeting-apis.ts`

```typescript
// Zoom meeting oluştur
createZoomMeeting(params)

// Google Meet meeting oluştur
createGoogleMeetMeeting(params)

// Microsoft Teams meeting oluştur
createTeamsMeeting(params)

// Meeting type'a göre otomatik meeting oluştur
createMeetingByType(meetingType, params)
```

### 2. API Route

**Dosya:** `src/app/api/meetings/create-video-meeting/route.ts`

- Session kontrolü
- Permission kontrolü
- API çağrısı
- Yanıt döndürme

### 3. Frontend Component

**Dosya:** `src/components/meetings/MeetingForm.tsx`

- "Otomatik Oluştur" butonu
- API çağrısı
- Form otomatik doldurma
- Hata yönetimi

---

## ⚠️ Önemli Notlar

### 1. Company-Level Credentials (Her Şirket Kendi Credentials'ını Girer)

**✅ Yeni Sistem:** Her şirket kendi API credentials'larını ayarlar
- Settings > API Entegrasyonları sayfasından
- Sadece Admin ve SuperAdmin görebilir
- Credentials şirket bazlı saklanır (CompanyIntegration tablosu)
- Her şirket farklı Zoom/Google/Teams hesapları kullanabilir

**Avantajlar:**
- ✅ Her şirket kendi hesabını kullanır
- ✅ Multi-tenant yapıya uygun
- ✅ Environment variable'lara gerek yok
- ✅ Güvenli (credentials şirket bazlı izole)

### 2. OAuth Flow (Production - Gelecek İyileştirme)

**Şu anki implementasyon:** Manuel access token giriliyor  
**Production için (gelecek):** OAuth flow implementasyonu önerilir

**Önerilen Çözüm (gelecek):**
- Settings sayfasında "Google ile Bağlan" butonu ekle
- OAuth flow otomatik başlasın
- Access token ve refresh token otomatik kaydedilsin
- Token expire olduğunda otomatik refresh et

### 2. Zoom API

- Server-to-Server OAuth kullanılıyor
- Account-level credentials gerekli
- JWT token yerine OAuth token kullanılıyor

### 3. Google Meet API

- Google Calendar API üzerinden çalışıyor
- Calendar event oluşturuluyor
- Meet linki otomatik ekleniyor

### 4. Microsoft Teams API

- Microsoft Graph API kullanılıyor
- Online Meetings API endpoint'i kullanılıyor
- Teams linki otomatik oluşturuluyor

---

## 🔒 Güvenlik

### Environment Variables

- ✅ API credentials environment variable'larda saklanıyor
- ✅ Production'da `.env.local` kullanılmalı
- ✅ Credentials asla git'e commit edilmemeli

### API Güvenliği

- ✅ Session kontrolü yapılıyor
- ✅ Permission kontrolü yapılıyor
- ✅ Company isolation korunuyor

---

## 🐛 Hata Yönetimi

### Yaygın Hatalar

1. **"Zoom API credentials are required"**
   - Çözüm: `.env.local` dosyasına Zoom credentials ekleyin

2. **"Google OAuth access token is required"**
   - Çözüm: `.env.local` dosyasına Google access token ekleyin (veya OAuth flow implementasyonu yapın)

3. **"Microsoft OAuth access token is required"**
   - Çözüm: `.env.local` dosyasına Microsoft access token ekleyin (veya OAuth flow implementasyonu yapın)

---

## 📚 Kaynaklar

- [Zoom API Documentation](https://marketplace.zoom.us/docs/api-reference/zoom-api/)
- [Google Calendar API](https://developers.google.com/calendar/api/v3/reference)
- [Microsoft Graph API](https://learn.microsoft.com/en-us/graph/api/application-post-onlinemeetings)

---

## ✅ Test Checklist

- [ ] Zoom meeting oluşturma test edildi
- [ ] Google Meet meeting oluşturma test edildi
- [ ] Microsoft Teams meeting oluşturma test edildi
- [ ] Meeting link otomatik dolduruluyor
- [ ] Meeting şifre otomatik dolduruluyor
- [ ] Hata durumları test edildi
- [ ] Environment variables doğru ayarlandı

---

**Son Güncelleme:** 2024

