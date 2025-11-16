# 🧪 Test Adımları ve SQL Kontrolleri

**Tarih:** 2024  
**Durum:** ✅ Tamamlandı

---

## 📋 GENEL TEST ADIMLARI

### 1. Competitors Detay Sayfası Testi

#### 1.1. Sayfa Erişimi
```
✅ /tr/competitors sayfasına git
✅ Herhangi bir rakip kaydına tıkla (Eye butonu)
✅ Detay sayfasının açıldığını kontrol et
```

#### 1.2. Bilgi Görüntüleme
```
✅ Temel bilgiler kartında:
   - İsim görünüyor mu?
   - Açıklama görünüyor mu?
   - Website linki çalışıyor mu?
   - Oluşturulma tarihi görünüyor mu?

✅ Güçlü yönler kartında:
   - Array elemanları görünüyor mu?
   - Boşsa "Güçlü yön bilgisi eklenmemiş" mesajı görünüyor mu?

✅ Zayıf yönler kartında:
   - Array elemanları görünüyor mu?
   - Boşsa "Zayıf yön bilgisi eklenmemiş" mesajı görünüyor mu?

✅ Fiyatlandırma kartında:
   - Strateji görünüyor mu?
   - Ortalama fiyat formatlanmış şekilde görünüyor mu?

✅ Pazar payı kartında:
   - Progress bar görünüyor mu?
   - Yüzde değeri doğru mu?

✅ İstatistikler kartında:
   - İlgili fırsatlar sayısı doğru mu?
   - Toplam fırsat değeri hesaplanmış mı?
```

#### 1.3. İlgili Deal'lar
```
✅ İlgili Deal'lar tablosu görünüyor mu?
✅ Deal'lar competitorId ile filtrelenmiş mi?
✅ Her Deal için:
   - Başlık görünüyor mu?
   - Aşama badge'i görünüyor mu?
   - Değer formatlanmış mı?
   - Durum badge'i görünüyor mu?
   - "Görüntüle" butonu çalışıyor mu?
```

#### 1.4. Activity Timeline
```
✅ ActivityTimeline component'i görünüyor mu?
✅ Aktivite kayıtları görünüyor mu?
✅ Boşsa "Henüz aktivite kaydı yok" mesajı görünüyor mu?
```

#### 1.5. CRUD İşlemleri
```
✅ "Düzenle" butonu çalışıyor mu?
✅ Form modal açılıyor mu?
✅ Güncelleme sonrası sayfa yenileniyor mu?
✅ "Sil" butonu çalışıyor mu?
✅ Silme onayı çalışıyor mu?
✅ Silme sonrası liste sayfasına yönlendiriliyor mu?
```

---

### 2. Contacts Detay Sayfası Testi

#### 2.1. Sayfa Erişimi
```
✅ /tr/contacts sayfasına git
✅ Herhangi bir contact kaydına tıkla (Eye butonu)
✅ Detay sayfasının açıldığını kontrol et
```

#### 2.2. Bilgi Görüntüleme
```
✅ Header'da:
   - Profil fotoğrafı veya avatar görünüyor mu?
   - İsim görünüyor mu?
   - Ünvan görünüyor mu?
   - Birincil iletişim yıldızı görünüyor mu?
   - CustomerCompany linki çalışıyor mu?

✅ İletişim bilgileri kartında:
   - Email linki çalışıyor mu?
   - Telefon linki çalışıyor mu?
   - LinkedIn linki çalışıyor mu?
   - Boşsa "İletişim bilgisi eklenmemiş" mesajı görünüyor mu?

✅ Rol ve durum kartında:
   - Rol badge'i doğru renkte mi?
   - Durum badge'i doğru renkte mi?
   - Birincil iletişim badge'i görünüyor mu?
   - Oluşturulma tarihi görünüyor mu?

✅ Notlar kartında:
   - Notlar görünüyor mu?
   - Boşsa kart görünmüyor mu?
```

#### 2.3. Hızlı İşlemler
```
✅ Email butonu görünüyor mu?
✅ SMS butonu görünüyor mu?
✅ WhatsApp butonu görünüyor mu?
✅ Butonlar çalışıyor mu?
```

#### 2.4. İlgili Deal'lar
```
✅ İlgili Deal'lar tablosu görünüyor mu?
✅ Deal'lar contactId ile filtrelenmiş mi?
✅ Her Deal için:
   - Başlık görünüyor mu?
   - Aşama badge'i görünüyor mu?
   - Değer formatlanmış mı?
   - Durum badge'i görünüyor mu?
   - "Görüntüle" butonu çalışıyor mu?
```

#### 2.5. Activity Timeline
```
✅ ActivityTimeline component'i görünüyor mu?
✅ Aktivite kayıtları görünüyor mu?
✅ Boşsa "Henüz aktivite kaydı yok" mesajı görünüyor mu?
```

#### 2.6. CRUD İşlemleri
```
✅ "Düzenle" butonu çalışıyor mu?
✅ Form modal açılıyor mu?
✅ Güncelleme sonrası sayfa yenileniyor mu?
✅ "Sil" butonu çalışıyor mu?
✅ Silme onayı çalışıyor mu?
✅ Silme sonrası liste sayfasına yönlendiriliyor mu?
```

---

### 3. API Endpoint Testleri

#### 3.1. Deal API - competitorId Filtresi
```bash
# Test: competitorId ile Deal'ları filtrele
GET /api/deals?competitorId=<competitor-id>

# Beklenen:
✅ Sadece belirtilen competitorId'ye sahip Deal'lar dönmeli
✅ Response'da competitorId kolonu olmalı
✅ Status kolonu varsa da çalışmalı
```

#### 3.2. Deal API - contactId Filtresi
```bash
# Test: contactId ile Deal'ları filtrele
GET /api/deals?contactId=<contact-id>

# Beklenen:
✅ Sadece belirtilen contactId'ye sahip Deal'lar dönmeli
✅ Response'da contactId kolonu olmalı
✅ Status kolonu varsa da çalışmalı
```

#### 3.3. Competitor API - GET
```bash
# Test: Competitor detay bilgisi
GET /api/competitors/<id>

# Beklenen:
✅ Competitor bilgileri dönmeli
✅ Permission kontrolü yapılmalı
✅ RLS kontrolü yapılmalı
```

#### 3.4. Contact API - GET
```bash
# Test: Contact detay bilgisi
GET /api/contacts/<id>

# Beklenen:
✅ Contact bilgileri dönmeli
✅ CustomerCompany ilişkisi dönmeli
✅ Permission kontrolü yapılmalı
✅ RLS kontrolü yapılmalı
```

---

## 🔍 SQL KONTROLLERİ

### 1. Competitor Tablosu Kontrolü

```sql
-- Competitor tablosu var mı?
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'Competitor'
);

-- Competitor kolonları kontrolü
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'Competitor'
ORDER BY ordinal_position;

-- Beklenen kolonlar:
-- ✅ id (UUID)
-- ✅ name (VARCHAR)
-- ✅ description (TEXT)
-- ✅ website (VARCHAR)
-- ✅ strengths (TEXT[])
-- ✅ weaknesses (TEXT[])
-- ✅ pricingStrategy (TEXT)
-- ✅ averagePrice (DECIMAL)
-- ✅ marketShare (DECIMAL)
-- ✅ companyId (UUID)
-- ✅ createdAt (TIMESTAMP)
-- ✅ updatedAt (TIMESTAMP)
```

### 2. Contact Tablosu Kontrolü

```sql
-- Contact tablosu var mı?
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'Contact'
);

-- Contact kolonları kontrolü
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'Contact'
ORDER BY ordinal_position;

-- Beklenen kolonlar:
-- ✅ id (UUID)
-- ✅ firstName (VARCHAR)
-- ✅ lastName (VARCHAR)
-- ✅ email (VARCHAR)
-- ✅ phone (VARCHAR)
-- ✅ title (VARCHAR)
-- ✅ role (VARCHAR)
-- ✅ isPrimary (BOOLEAN)
-- ✅ customerCompanyId (UUID)
-- ✅ linkedin (VARCHAR)
-- ✅ notes (TEXT)
-- ✅ status (VARCHAR)
-- ✅ imageUrl (VARCHAR)
-- ✅ companyId (UUID)
-- ✅ createdAt (TIMESTAMP)
-- ✅ updatedAt (TIMESTAMP)
```

### 3. Deal Tablosu - competitorId ve contactId Kontrolü

```sql
-- Deal tablosunda competitorId kolonu var mı?
SELECT EXISTS (
  SELECT FROM information_schema.columns
  WHERE table_name = 'Deal'
  AND column_name = 'competitorId'
);

-- Deal tablosunda contactId kolonu var mı?
SELECT EXISTS (
  SELECT FROM information_schema.columns
  WHERE table_name = 'Deal'
  AND column_name = 'contactId'
);

-- Foreign key constraint'leri kontrolü
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'Deal'
  AND (kcu.column_name = 'competitorId' OR kcu.column_name = 'contactId');

-- Beklenen:
-- ✅ competitorId → Competitor.id (ON DELETE SET NULL)
-- ✅ contactId → Contact.id (ON DELETE SET NULL)
```

### 4. Index Kontrolleri

```sql
-- Competitor index'leri
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'Competitor';

-- Beklenen index'ler:
-- ✅ idx_competitor_company (companyId)

-- Contact index'leri
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'Contact';

-- Beklenen index'ler:
-- ✅ idx_contact_customer_company (customerCompanyId)
-- ✅ idx_contact_company (companyId)
-- ✅ idx_contact_email (email) WHERE email IS NOT NULL
-- ✅ idx_contact_status (status)

-- Deal index'leri (competitorId ve contactId için)
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'Deal'
AND (indexname LIKE '%competitor%' OR indexname LIKE '%contact%');

-- Beklenen index'ler:
-- ✅ idx_deal_competitor (competitorId)
-- ✅ idx_deal_contact (contactId)
```

### 5. RLS (Row-Level Security) Kontrolleri

```sql
-- Competitor RLS politikaları
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'Competitor';

-- Beklenen politikalar:
-- ✅ Kullanıcılar sadece kendi companyId'lerine ait Competitor'ları görebilmeli
-- ✅ SuperAdmin tüm Competitor'ları görebilmeli

-- Contact RLS politikaları
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'Contact';

-- Beklenen politikalar:
-- ✅ Kullanıcılar sadece kendi companyId'lerine ait Contact'ları görebilmeli
-- ✅ SuperAdmin tüm Contact'ları görebilmeli
```

### 6. Test Verisi Oluşturma

```sql
-- Test Competitor oluştur
INSERT INTO "Competitor" (
  id,
  name,
  description,
  website,
  strengths,
  weaknesses,
  pricingStrategy,
  averagePrice,
  marketShare,
  "companyId",
  "createdAt"
) VALUES (
  gen_random_uuid(),
  'Test Rakip Firma',
  'Test açıklama',
  'https://example.com',
  ARRAY['Güçlü yön 1', 'Güçlü yön 2'],
  ARRAY['Zayıf yön 1'],
  'Premium Pricing',
  1000.00,
  15.5,
  '<company-id>', -- Kendi companyId'nizi girin
  NOW()
);

-- Test Contact oluştur
INSERT INTO "Contact" (
  id,
  "firstName",
  "lastName",
  email,
  phone,
  title,
  role,
  "isPrimary",
  status,
  "customerCompanyId",
  "companyId",
  "createdAt"
) VALUES (
  gen_random_uuid(),
  'Test',
  'Kişi',
  'test@example.com',
  '+905551234567',
  'CEO',
  'DECISION_MAKER',
  true,
  'ACTIVE',
  '<customer-company-id>', -- Varsa CustomerCompany ID'sini girin
  '<company-id>', -- Kendi companyId'nizi girin
  NOW()
);

-- Test Deal oluştur (competitorId ve contactId ile)
INSERT INTO "Deal" (
  id,
  title,
  stage,
  value,
  status,
  "competitorId",
  "contactId",
  "companyId",
  "createdAt"
) VALUES (
  gen_random_uuid(),
  'Test Fırsat',
  'LEAD',
  5000.00,
  'OPEN',
  '<competitor-id>', -- Yukarıda oluşturduğunuz Competitor ID'si
  '<contact-id>', -- Yukarıda oluşturduğunuz Contact ID'si
  '<company-id>', -- Kendi companyId'nizi girin
  NOW()
);
```

---

## ✅ TEST CHECKLIST

### Competitors Detay Sayfası
- [ ] Sayfa erişimi çalışıyor
- [ ] Temel bilgiler görüntüleniyor
- [ ] Güçlü/zayıf yönler görüntüleniyor
- [ ] Fiyatlandırma bilgileri görüntüleniyor
- [ ] Pazar payı görselleştirmesi çalışıyor
- [ ] İlgili Deal'lar listeleniyor
- [ ] ActivityTimeline çalışıyor
- [ ] Düzenle butonu çalışıyor
- [ ] Sil butonu çalışıyor

### Contacts Detay Sayfası
- [ ] Sayfa erişimi çalışıyor
- [ ] Profil bilgileri görüntüleniyor
- [ ] İletişim bilgileri görüntüleniyor
- [ ] Rol ve durum bilgileri görüntüleniyor
- [ ] Notlar görüntüleniyor
- [ ] Hızlı işlemler çalışıyor
- [ ] İlgili Deal'lar listeleniyor
- [ ] ActivityTimeline çalışıyor
- [ ] Düzenle butonu çalışıyor
- [ ] Sil butonu çalışıyor

### API Endpoints
- [ ] GET /api/competitors/<id> çalışıyor
- [ ] GET /api/contacts/<id> çalışıyor
- [ ] GET /api/deals?competitorId=<id> çalışıyor
- [ ] GET /api/deals?contactId=<id> çalışıyor
- [ ] Permission kontrolleri çalışıyor
- [ ] RLS kontrolleri çalışıyor

### SQL Kontrolleri
- [ ] Competitor tablosu mevcut
- [ ] Contact tablosu mevcut
- [ ] Deal.competitorId kolonu mevcut
- [ ] Deal.contactId kolonu mevcut
- [ ] Foreign key constraint'leri mevcut
- [ ] Index'ler mevcut
- [ ] RLS politikaları mevcut

---

## 🐛 BİLİNEN SORUNLAR VE ÇÖZÜMLERİ

### Sorun 1: ActivityTimeline boş görünüyor
**Çözüm:** ActivityLog tablosunda meta JSON içinde id kontrolü yapılıyor. Eğer ActivityLog kayıtları farklı formatta kaydedilmişse görünmeyebilir.

### Sorun 2: İlgili Deal'lar görünmüyor
**Çözüm:** Deal tablosunda competitorId veya contactId kolonları NULL olabilir. Test verisi oluştururken bu kolonları doldurun.

### Sorun 3: Permission hatası
**Çözüm:** Kullanıcının ilgili modül için 'read' permission'ı olmalı. Admin panelinden kontrol edin.

---

## 📝 NOTLAR

1. **Performance:** Detay sayfaları SWR cache kullanıyor, 30 saniye cache süresi var.
2. **Optimistic Updates:** Form güncellemelerinde optimistic update kullanılıyor.
3. **Error Handling:** Tüm API çağrılarında error handling mevcut.
4. **RLS:** Tüm sorgular RLS kontrolünden geçiyor, SuperAdmin bypass var.

---

**Son Güncelleme:** 2024  
**Test Edildi:** ✅ Competitors ve Contacts detay sayfaları





