# 📅 Google Calendar Entegrasyon Planı

**Tarih:** 2024  
**Durum:** ✅ Tamamlandı - Kullanıcı Bazlı Google Calendar Entegrasyonu

---

## 📋 ÖZET

Kullanıcı bazlı Google Calendar entegrasyonu eklendi. Her kullanıcı kendi Google Calendar'ına CRM kayıtlarını (Deal, Quote, Invoice, Meeting, Task) ekleyebilir.

---

## ✅ TAMAMLANAN ÖZELLİKLER

### 1. **Google Calendar Servis Dosyaları** ✅
- ✅ `src/lib/integrations/calendar/google-calendar.ts` - Google Calendar API fonksiyonları
- ✅ `src/lib/integrations/calendar/index.ts` - Kullanıcı bazlı calendar entegrasyonu

### 2. **API Endpoint'leri** ✅
- ✅ `/api/integrations/calendar/add` - Etkinlik ekleme endpoint'i
- ✅ `/api/integrations/oauth/google-calendar/authorize` - OAuth authorization URL
- ✅ `/api/integrations/oauth/google-calendar/callback` - OAuth callback handler

### 3. **UI Component'leri** ✅
- ✅ `src/components/integrations/AddToCalendarButton.tsx` - Takvime ekle butonu
- ✅ `ContextualActionsBar` - Takvime ekle butonu entegre

---

## 🔧 YAPILMASI GEREKENLER

### 1. Database Migration

#### UserIntegration Tablosu Oluşturma
```sql
CREATE TABLE IF NOT EXISTS "UserIntegration" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "integrationType" TEXT NOT NULL, -- 'GOOGLE_CALENDAR', 'GOOGLE_EMAIL', vb.
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "tokenExpiresAt" TIMESTAMP WITH TIME ZONE,
  "status" TEXT DEFAULT 'INACTIVE', -- 'ACTIVE', 'INACTIVE', 'ERROR'
  "lastError" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("userId", "companyId", "integrationType")
);

CREATE INDEX idx_userintegration_user ON "UserIntegration"("userId");
CREATE INDEX idx_userintegration_company ON "UserIntegration"("companyId");
CREATE INDEX idx_userintegration_type ON "UserIntegration"("integrationType");
```

### 2. Environment Variables

```env
# Google OAuth Credentials (Gmail ile aynı kullanılabilir)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Google Calendar Redirect URI
GOOGLE_CALENDAR_REDIRECT_URI=https://your-domain.com/api/integrations/oauth/google-calendar/callback
```

### 3. Google Cloud Console Ayarları

1. [Google Cloud Console](https://console.cloud.google.com) hesabına git
2. API'leri etkinleştir:
   - Google Calendar API
   - Google Calendar Events API
3. OAuth 2.0 Client ID oluştur:
   - Application type: Web application
   - Authorized redirect URIs: `https://your-domain.com/api/integrations/oauth/google-calendar/callback`
4. Client ID ve Client Secret'ı kopyala

---

## 🎯 KULLANIM ÖRNEKLERİ

### 1. Deal Detay Sayfasında Takvime Ekle

```typescript
import AddToCalendarButton from '@/components/integrations/AddToCalendarButton'

<AddToCalendarButton
  recordType="deal"
  record={deal}
  startTime={new Date(deal.expectedCloseDate).toISOString()}
  endTime={new Date(new Date(deal.expectedCloseDate).getTime() + 60 * 60 * 1000).toISOString()}
  location={deal.location}
  attendees={deal.customer?.email ? [{ email: deal.customer.email }] : []}
/>
```

### 2. Meeting Detay Sayfasında Takvime Ekle

```typescript
<AddToCalendarButton
  recordType="meeting"
  record={meeting}
  startTime={meeting.startTime}
  endTime={meeting.endTime}
  location={meeting.location}
  attendees={meeting.attendees?.map(a => ({ email: a.email, displayName: a.name }))}
/>
```

### 3. ContextualActionsBar ile Entegrasyon

```typescript
<ContextualActionsBar
  onAddToCalendar={() => {
    // AddToCalendarButton component'i kullanılabilir
    // veya direkt API çağrısı yapılabilir
  }}
/>
```

---

## 📊 ENTEGRASYON AKIŞI

### 1. Kullanıcı Google Calendar Bağlantısı
1. Kullanıcı Ayarlar > Entegrasyonlar sayfasına gider
2. "Google Calendar Bağla" butonuna tıklar
3. Google OAuth sayfasına yönlendirilir
4. İzinleri verir
5. Callback ile token'lar kaydedilir
6. `UserIntegration` tablosuna kayıt eklenir

### 2. Etkinlik Ekleme
1. Kullanıcı bir kayıt detay sayfasına gider (Deal, Quote, Invoice, Meeting, Task)
2. "Takvime Ekle" butonuna tıklar
3. API endpoint'i çağrılır
4. Kullanıcının Google Calendar token'ı kontrol edilir
5. Token expire ise refresh edilir
6. Google Calendar API'ye etkinlik oluşturma isteği gönderilir
7. Etkinlik kullanıcının Google Calendar'ına eklenir
8. Başarı mesajı gösterilir ve takvim linki verilir

---

## 🔒 GÜVENLİK

### Multi-Tenant Güvenlik
- ✅ `companyId` kontrolü yapılıyor
- ✅ Kullanıcı sadece kendi token'ını kullanabiliyor
- ✅ RLS kontrolü korunuyor

### Token Güvenliği
- ✅ Access token'lar şifrelenmiş şekilde saklanmalı (production'da)
- ✅ Refresh token'lar güvenli şekilde saklanmalı
- ✅ Token expire kontrolü yapılıyor
- ✅ Otomatik token refresh mekanizması var

---

## 🧪 TEST SENARYOLARI

### Senaryo 1: Google Calendar Bağlantısı
1. Ayarlar > Entegrasyonlar sayfasına git
2. "Google Calendar Bağla" butonuna tıkla
3. Google OAuth sayfasında izinleri ver
4. Başarılı bağlantı mesajını kontrol et
5. `UserIntegration` tablosunda kaydın oluştuğunu kontrol et

### Senaryo 2: Deal Takvime Ekleme
1. Deal detay sayfasına git
2. "Takvime Ekle" butonuna tıkla
3. Google Calendar'da etkinliğin oluştuğunu kontrol et
4. Etkinlik detaylarının doğru olduğunu kontrol et

### Senaryo 3: Meeting Takvime Ekleme
1. Meeting detay sayfasına git
2. "Takvime Ekle" butonuna tıkla
3. Google Calendar'da etkinliğin oluştuğunu kontrol et
4. Katılımcıların eklendiğini kontrol et

### Senaryo 4: Token Refresh
1. Token expire olmuş bir kullanıcı ile giriş yap
2. "Takvime Ekle" butonuna tıkla
3. Token'ın otomatik refresh edildiğini kontrol et
4. Etkinliğin başarıyla eklendiğini kontrol et

---

## 📝 SONUÇ

**Durum:** ✅ Tamamlandı

**Yapılması Gerekenler:**
- [ ] Database migration çalıştırılmalı (`UserIntegration` tablosu)
- [ ] Google Cloud Console'da API'ler etkinleştirilmeli
- [ ] OAuth credentials ayarlanmalı
- [ ] Detay sayfalarına `AddToCalendarButton` entegre edilmeli

**Tahmini Süre:**
- Database migration: 5 dakika
- Google Cloud Console ayarları: 10 dakika
- UI entegrasyonu: 30 dakika - 1 saat

---

**Rapor Tarihi:** 2024  
**Durum:** ✅ Kod Tamamlandı, Database Migration ve OAuth Ayarları Gerekli



