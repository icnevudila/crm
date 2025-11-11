# 📤 "Gönder" Butonuna Basıldığında Ne Oluyor?

## 🎯 ÖZET

"Gönder" butonuna basıldığında sistem şunları yapar:

1. **Quote Tablosu Güncellenir** ✅
2. **ActivityLog Tablosuna Kayıt Eklenir** ✅
3. **Notification Tablosuna Kayıt Eklenir** (opsiyonel - hata olsa bile devam eder)

---

## 📋 ADIM ADIM İŞLEM AKIŞI

### 1. **Frontend (Kullanıcı Arayüzü)**

**Dosya:** `src/components/charts/QuoteKanbanChart.tsx`

```typescript
// Butona tıklanınca:
fetch(`/api/quotes/${quote.id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'SENT' }), // Status'u SENT yap
})
```

**Ne Olur:**
- ✅ API'ye `PUT` request gönderilir
- ✅ Body'de `{ status: 'SENT' }` gönderilir
- ✅ Başarılı olursa toast mesajı: "Teklif gönderildi"
- ✅ Sayfa yenilenir (`window.location.reload()`)

---

### 2. **Backend API (Next.js Route)**

**Dosya:** `src/app/api/quotes/[id]/route.ts`

#### 2.1. **Session Kontrolü**
- ✅ Kullanıcı giriş yapmış mı?
- ✅ CompanyId var mı?
- ❌ Yoksa → 401 Unauthorized

#### 2.2. **Quote Kontrolü**
- ✅ Quote var mı?
- ✅ CompanyId eşleşiyor mu?
- ✅ Status immutable değil mi? (ACCEPTED, REJECTED değil)
- ❌ Hata varsa → 404 veya 403

#### 2.3. **Status Transition Validation**
- ✅ `DRAFT` → `SENT` geçişi geçerli mi?
- ❌ Geçersizse → 400 Bad Request

#### 2.4. **Quote Tablosu Güncellenir** ✅

**Tablo:** `Quote`

**Güncellenen Alanlar:**
```sql
UPDATE "Quote"
SET 
  status = 'SENT',           -- DRAFT → SENT
  updatedAt = NOW()          -- Güncelleme tarihi
WHERE id = '{quoteId}'
  AND companyId = '{companyId}'
```

**Sonuç:**
- ✅ Quote kaydı güncellenir
- ✅ Status `SENT` olur
- ✅ `updatedAt` güncellenir

#### 2.5. **ActivityLog Kaydı Yapılır** ✅

**Tablo:** `ActivityLog`

**Eklenen Kayıt:**
```sql
INSERT INTO "ActivityLog" (
  entity,           -- 'Quote'
  action,           -- 'UPDATE'
  description,       -- 'Teklif güncellendi: SENT'
  meta,             -- JSON: { status: 'SENT', ... }
  userId,           -- İşlemi yapan kullanıcı
  companyId         -- Şirket ID
)
```

**Sonuç:**
- ✅ Aktivite geçmişine kaydedilir
- ✅ Detay sayfasında "Aktivite Geçmişi" bölümünde görünür

---

### 3. **Database Trigger (Otomatik)**

**Dosya:** `supabase/migrations/042_user_automations.sql`

**Trigger:** `trigger_quote_sent_notification`

Quote status'u `SENT` olduğunda **otomatik olarak** çalışır:

#### 3.1. **ActivityLog Kaydı Yapılır** ✅

**Tablo:** `ActivityLog`

**Eklenen Kayıt:**
```sql
INSERT INTO "ActivityLog" (
  entity,           -- 'Quote'
  action,           -- 'UPDATE'
  description,      -- 'Teklif müşteriye gönderildi'
  meta,             -- JSON: { quoteId, quoteNumber, status: 'SENT' }
  userId,           -- Quote'u oluşturan kullanıcı (createdBy)
  companyId         -- Şirket ID
)
```

**Sonuç:**
- ✅ Aktivite geçmişine kaydedilir
- ✅ Detay sayfasında görünür

#### 3.2. **Notification Oluşturulur** (Opsiyonel)

**Tablo:** `Notification`

**Eklenen Kayıtlar:**
```sql
INSERT INTO "Notification" (
  userId,           -- Admin/Sales rolündeki her kullanıcı için
  companyId,        -- Şirket ID
  title,            -- 'Teklif Gönderildi'
  message,          -- '{Teklif Başlığı} teklifi müşteriye gönderildi.'
  type,             -- 'info'
  relatedTo,        -- 'Quote'
  relatedId,        -- Quote ID
  link              -- '/tr/quotes/{quoteId}'
)
SELECT u.id, ... FROM "User" u
WHERE u.role IN ('ADMIN', 'SALES', 'SUPER_ADMIN')
  AND u.status = 'ACTIVE'
```

**Sonuç:**
- ✅ Her Admin/Sales kullanıcısı için bildirim oluşturulur
- ✅ Header'daki bildirim menüsünde görünür
- ⚠️ Hata olsa bile ana işlem devam eder

---

## 📊 TABLO ÖZETİ

| Tablo | İşlem | Açıklama |
|-------|-------|----------|
| **Quote** | UPDATE | Status `DRAFT` → `SENT`, `updatedAt` güncellenir |
| **ActivityLog** | INSERT | API route'da: "Teklif güncellendi: SENT" |
| **ActivityLog** | INSERT | Trigger'da: "Teklif müşteriye gönderildi" |
| **Notification** | INSERT | Admin/Sales kullanıcılarına bildirim (opsiyonel) |

---

## 🔍 KAYITLAR NEREDE OLUŞUYOR?

### 1. **Quote Tablosu** (Güncelleme)
- **Tablo:** `public.Quote`
- **İşlem:** UPDATE
- **Alanlar:** `status`, `updatedAt`
- **Nerede:** API route'da (`src/app/api/quotes/[id]/route.ts`)

### 2. **ActivityLog Tablosu** (2 Kayıt)
- **Tablo:** `public.ActivityLog`
- **İşlem:** INSERT (2 kez)
- **1. Kayıt:** API route'da - "Teklif güncellendi: SENT"
- **2. Kayıt:** Database trigger'da - "Teklif müşteriye gönderildi"
- **Nerede:** 
  - API route'da (`src/app/api/quotes/[id]/route.ts`)
  - Database trigger'da (`supabase/migrations/042_user_automations.sql`)

### 3. **Notification Tablosu** (Opsiyonel)
- **Tablo:** `public.Notification`
- **İşlem:** INSERT (her Admin/Sales kullanıcısı için)
- **Nerede:** Database trigger'da (`supabase/migrations/042_user_automations.sql`)

---

## ✅ SONUÇ

"Gönder" butonuna basıldığında:

1. ✅ **Quote tablosunda** 1 kayıt güncellenir (status: SENT)
2. ✅ **ActivityLog tablosunda** 2 kayıt oluşturulur:
   - API route'dan: "Teklif güncellendi: SENT"
   - Trigger'dan: "Teklif müşteriye gönderildi"
3. ✅ **Notification tablosunda** N kayıt oluşturulur (N = Admin/Sales kullanıcı sayısı)

**Toplam:** 1 UPDATE + 2 INSERT + N INSERT (Notification)

---

## 🎯 ÖNEMLİ NOTLAR

1. **Notification Hataları Kritik Değil**
   - Notification oluşturulurken hata olsa bile ana işlem devam eder
   - Quote güncellenir, ActivityLog kaydı yapılır
   - Sadece bildirim gönderilmez

2. **ActivityLog İki Kez Oluşuyor**
   - API route'da 1 kayıt
   - Database trigger'da 1 kayıt
   - İkisi de farklı açıklamalarla kaydedilir

3. **Status Transition Validation**
   - `DRAFT` → `SENT` geçişi kontrol edilir
   - Geçersiz geçişler engellenir

4. **CompanyId Kontrolü**
   - Her işlemde companyId kontrolü yapılır
   - Multi-tenant güvenlik sağlanır

