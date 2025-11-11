# 🚀 Supabase Migration Talimatları

## ✅ Yapılacaklar Listesi

### 1️⃣ Migration'ları Çalıştır (Supabase Studio'da)

Supabase Studio'ya gir: https://supabase.com/dashboard

**SQL Editor** sekmesine git ve sırayla şu dosyaları çalıştır:

#### A) Ana Migration Dosyası
```sql
-- supabase/migrations/036_advanced_crm_features.sql
```
Bu dosyayı kopyala yapıştır ve **RUN** butonuna bas.
- 30+ yeni tablo oluşturur (Document, Approval, EmailCampaign, vs.)
- RLS policy'leri ekler
- Index'leri oluşturur

#### B) Otomasyon Migration'ı (YENİ DÜZELTILMIŞ)
```sql
-- supabase/migrations/037_advanced_features_automations.sql
```
Bu dosyayı kopyala yapıştır ve **RUN** butonuna bas.
- Eksik kolonları ekler (Customer.totalRevenue, vs.)
- Trigger'ları oluşturur
- Otomasyonları aktif eder

### 2️⃣ Test Data Ekle (Opsiyonel)

Test verisi eklemek istersen:

```sql
-- supabase/test_advanced_features.sql
```

Bu dosyayı çalıştır - örnek dökümanlar, approval'lar, campaign'ler ekler.

---

## 📋 Migration Sonrası Kontrol Listesi

### ✅ Tablo Kontrolü

SQL Editor'da çalıştır:

```sql
-- Yeni tabloları kontrol et
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'Document', 'DocumentAccess', 
  'ApprovalRequest', 
  'EmailCampaign', 'EmailLog',
  'CustomerSegment', 'SegmentMember',
  'Competitor',
  'SalesQuota', 'UserPerformanceMetrics',
  'ProductBundle', 'ProductBundleItem',
  'PriceList', 'PriceListItem',
  'Promotion', 'Survey', 'SurveyResponse',
  'PaymentPlan', 'PaymentInstallment',
  'CreditNote', 'ReturnOrder', 'ReturnOrderItem',
  'Territory', 'Partner', 'TaxRate',
  'MarketingCampaign', 'LeadSource',
  'Workflow', 'WorkflowExecution'
)
ORDER BY table_name;
```

**Beklenen sonuç:** 27 tablo görmeli

### ✅ Kolon Kontrolü

```sql
-- Customer tablosundaki yeni kolonları kontrol et
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Customer' 
AND column_name IN ('totalRevenue', 'lifetimeValue', 'churnRisk')
ORDER BY column_name;
```

**Beklenen sonuç:** 3 kolon görmeli

### ✅ Trigger Kontrolü

```sql
-- Trigger'ları kontrol et
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name IN (
  'trigger_auto_assign_segments',
  'trigger_update_entity_on_approval',
  'trigger_update_campaign_stats',
  'trigger_auto_create_approval'
)
ORDER BY trigger_name;
```

**Beklenen sonuç:** 4 trigger görmeli

---

## 🖥️ Frontend'i Başlat

Migration başarılı olduktan sonra:

```bash
# 1. Dependencies yükle (eğer yüklemediysen)
npm install

# 2. Dev server'ı başlat
npm run dev
```

---

## 🧪 UI Test Listesi

### Test Edilecek Sayfalar:

1. **Müşteri Segmentleri**
   - http://localhost:3000/tr/segments
   - ✅ Liste görünüyor mu?
   - ✅ Yeni segment oluşturuluyor mu?
   - ✅ Filtreleme çalışıyor mu?

2. **Onay Talepleri**
   - http://localhost:3000/tr/approvals
   - ✅ Liste görünüyor mu?
   - ✅ Status filtreleme çalışıyor mu?
   - ✅ Onaylama/Reddetme butonları çalışıyor mu?

3. **Email Kampanyaları**
   - http://localhost:3000/tr/email-campaigns
   - ✅ Liste görünüyor mu?
   - ✅ İstatistikler doğru mu? (açılma, tıklama oranları)

4. **Rakip Analizi**
   - http://localhost:3000/tr/competitors
   - ✅ Liste görünüyor mu?
   - ✅ Yeni rakip eklenebiliyor mu?
   - ✅ Düzenleme çalışıyor mu?

5. **Dökümanlar**
   - http://localhost:3000/tr/documents
   - ✅ Liste görünüyor mu?
   - ✅ Arama çalışıyor mu?
   - ✅ Download butonu çalışıyor mu?

---

## ⚠️ Olası Hatalar ve Çözümleri

### Hata 1: "relation already exists"
**Çözüm:** Normaldi, zaten tablo var demek. Devam et.

### Hata 2: "column already exists"
**Çözüm:** Normaldi, kolon zaten eklenmişti. Devam et.

### Hata 3: "permission denied"
**Çözüm:** Supabase'de SQL Editor'dan çalıştır, terminal'den değil.

### Hata 4: "Cannot find module '@/components/ui/label'"
**Çözüm:**
```bash
npx shadcn@latest add label
```

---

## 📊 Sonuç Raporu

Migration sonrası şunlar aktif olacak:

### ✅ Yeni Modüller (5 adet)
- 🎯 Müşteri Segmentleri
- ✅ Onay Talepleri
- 📧 Email Kampanyaları
- 🎯 Rakip Analizi
- 📁 Dökümanlar

### ✅ Yeni Tablolar (30+ adet)
- Document, Approval, EmailCampaign, Competitor
- Segment, ProductBundle, PriceList, Promotion
- Survey, PaymentPlan, CreditNote, ReturnOrder
- Territory, Partner, TaxRate, MarketingCampaign
- Workflow, LeadSource, SalesQuota, vs.

### ✅ Otomasyonlar (7 adet)
- 🔄 Müşteri segment'lere otomatik atama
- 🔄 Onay sonrası entity güncelleme (Quote/Deal/Contract)
- 🔄 Email kampanya istatistikleri güncelleme
- 🔄 Yüksek değerli teklifler için otomatik onay talebi
- 🔄 Doküman erişim loglama
- 🔄 Rakip istatistikleri tracking
- 🔄 Zamanlanmış kampanya gönderimi

### ✅ API Endpoints (13 adet)
- `/api/documents` (GET, POST)
- `/api/documents/[id]` (GET, DELETE)
- `/api/approvals` (GET, POST)
- `/api/approvals/[id]/approve` (POST)
- `/api/approvals/[id]/reject` (POST)
- `/api/email-campaigns` (GET, POST)
- `/api/segments` (GET, POST)
- `/api/segments/[id]` (GET, PUT, DELETE)
- `/api/competitors` (GET, POST)
- `/api/competitors/[id]` (GET, PUT, DELETE)

---

## 🎉 Tamamlandı mı?

Migration başarılı olduysa ve test sayfaları çalışıyorsa:

✅ **38 yeni özellik** aktif!
✅ **5 yeni modül** kullanıma hazır!
✅ **7 otomasyon** çalışıyor!

---

## 📞 Sorun mu var?

Herhangi bir hata alırsan:

1. Hata mesajının ekran görüntüsünü al
2. Hangi migration'da olduğunu belirt (036 mı, 037 mi?)
3. SQL Editor'daki tam hata mesajını paylaş

Ben düzeltirim! 🚀


