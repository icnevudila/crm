# 📄 SÖZLEŞME MODÜLÜ - HIZLI BAŞLANGIÇ

**Oluşturma Tarihi:** 9 Kasım 2025  
**Migration:** 034_contract_management_system.sql  
**Durum:** ✅ Hazır

---

## 🎯 NE EKLENDİ?

### 4 Yeni Tablo
1. **Contract** - Ana sözleşme tablosu
2. **ContractRenewal** - Yenileme takibi
3. **ContractTerm** - Sözleşme maddeleri
4. **ContractMilestone** - Aşamalar/milestone'lar

### 6 Otomasyon
1. ✅ **Auto-Expire** - Süresi dolan sözleşmeler otomatik EXPIRED
2. ✅ **Renewal Notifications** - 30 gün önce bildirim
3. ✅ **Auto-Renew** - Otomatik yenileme (opsiyonel)
4. ✅ **Deal→Contract** - Deal WON olunca taslak sözleşme
5. ✅ **Customer Stats** - Müşteri sözleşme istatistikleri
6. ✅ **MRR/ARR Calculation** - Recurring revenue hesaplama

---

## 🗄️ TABLO YAPISI

### Contract (Ana Tablo)
```sql
Contract:
- contractNumber (SOZL-2024-0001) → Unique
- title (Sözleşme adı)
- customerId → Customer ile ilişki
- type (SERVICE/PRODUCT/SUBSCRIPTION/MAINTENANCE/LICENSE/CONSULTING)
- startDate, endDate
- value (tutar)
- renewalType (AUTO/MANUAL/NONE)
- autoRenewEnabled (otomatik yenileme aktif mi?)
- billingCycle (MONTHLY/QUARTERLY/YEARLY/ONE_TIME)
- status (DRAFT/ACTIVE/EXPIRED/CANCELLED/RENEWED/SUSPENDED)
```

### İlişkiler
```
Customer → N Contract (bir müşterinin birden fazla sözleşmesi)
CustomerCompany → N Contract
Deal → N Contract (kazanılan fırsat → sözleşme)
Contract → N ContractRenewal (yenileme geçmişi)
Contract → N ContractTerm (sözleşme maddeleri)
Contract → N ContractMilestone (aşamalar)
```

---

## 🚀 HEMEN KULLANMAYA BAŞLAYIN

### 1. Migration'ı Çalıştırın
```
Supabase Dashboard → SQL Editor
→ 034_contract_management_system.sql dosyasını aç
→ Kopyala → Yapıştır → RUN
```

### 2. İlk Sözleşmeyi Oluşturun
```sql
INSERT INTO "Contract" (
  "contractNumber",
  title,
  "customerId",
  type,
  "startDate",
  "endDate",
  value,
  "renewalType",
  "renewalNoticeDays",
  status,
  "companyId"
)
VALUES (
  'SOZL-2024-0001',
  'Yıllık Yazılım Bakım Sözleşmesi',
  'customer-id-buraya',  -- Mevcut bir customer ID
  'MAINTENANCE',
  '2024-01-01',
  '2024-12-31',
  50000.00,
  'MANUAL',
  30,
  'ACTIVE',
  'company-id-buraya'  -- Mevcut company ID
);
```

### 3. Otomasyonları Test Edin

#### A. Yenileme Bildirimi Test
```sql
-- Süresi 30 gün içinde dolacak sözleşme oluştur
INSERT INTO "Contract" (..., "endDate", ...) 
VALUES (..., CURRENT_DATE + INTERVAL '25 days', ...);

-- Bildirimleri çalıştır
SELECT create_renewal_notifications();

-- Notification'ları kontrol et
SELECT * FROM "Notification" WHERE "relatedTo" = 'Contract';
```

#### B. Otomatik Expire Test
```sql
-- Süresi dün dolmuş sözleşme oluştur
INSERT INTO "Contract" (..., "endDate", status, ...) 
VALUES (..., CURRENT_DATE - INTERVAL '1 day', 'ACTIVE', ...);

-- Expire fonksiyonunu çalıştır
SELECT auto_expire_contracts();

-- Status kontrol et
SELECT "contractNumber", status FROM "Contract";
-- → EXPIRED olmalı
```

#### C. Auto-Renew Test
```sql
-- 7 gün içinde bitecek, auto-renew aktif sözleşme
INSERT INTO "Contract" (
  ...,
  "endDate",
  "autoRenewEnabled",
  "renewalType",
  ...
) 
VALUES (
  ...,
  CURRENT_DATE + INTERVAL '5 days',
  true,
  'AUTO',
  ...
);

-- Auto-renew çalıştır
SELECT auto_renew_contracts();

-- Yeni sözleşme oluştu mu kontrol et
SELECT "contractNumber", status, "startDate", "endDate" 
FROM "Contract" 
ORDER BY "createdAt" DESC;
```

---

## 💡 KULLANIM ÖRNEKLERİ

### Örnek 1: Yıllık Bakım Sözleşmesi
```sql
INSERT INTO "Contract" (
  "contractNumber", title, "customerId",
  type, "startDate", "endDate", value,
  "billingCycle", "renewalType", "renewalNoticeDays",
  "autoRenewEnabled", status, "companyId"
)
VALUES (
  'SOZL-2024-0001',
  'ABC Teknoloji - Yıllık Yazılım Bakım',
  'customer-123',
  'MAINTENANCE',
  '2024-01-01', '2024-12-31',
  50000.00,
  'YEARLY',
  'AUTO',
  30,
  true,  -- Otomatik yenilenecek
  'ACTIVE',
  'company-456'
);
```
**Sonuç:** 
- 30 gün önce bildirim gelir
- 7 gün kala otomatik yenilenir
- Yeni sözleşme: SOZL-2024-0001-R2024

### Örnek 2: Aylık SaaS Abonelik
```sql
INSERT INTO "Contract" (
  "contractNumber", title, "customerId",
  type, "startDate", "endDate", value,
  "billingCycle", "renewalType",
  status, "companyId"
)
VALUES (
  'SOZL-2024-0002',
  'XYZ Şirketi - SaaS Premium Abonelik',
  'customer-789',
  'SUBSCRIPTION',
  '2024-01-01', '2024-12-31',
  10000.00,  -- Aylık 10K
  'MONTHLY',
  'NONE',  -- Yenileme yok (sürekli aktif)
  'ACTIVE',
  'company-456'
);
```

### Örnek 3: Proje Bazlı Sözleşme (Milestone'lı)
```sql
-- 1. Sözleşme oluştur
INSERT INTO "Contract" (
  "contractNumber", title, type,
  "startDate", "endDate", value,
  status, "companyId"
)
VALUES (
  'SOZL-2024-0003',
  'Web Sitesi Geliştirme Projesi',
  'PROJECT',
  '2024-01-01', '2024-06-30',
  100000.00,
  'ACTIVE',
  'company-456'
)
RETURNING id;

-- 2. Milestone'lar ekle
INSERT INTO "ContractMilestone" (
  "contractId", title, "dueDate", value, "paymentDue", status, "companyId"
)
VALUES 
  ('contract-id', 'Analiz ve Tasarım', '2024-02-28', 25000, 25000, 'COMPLETED', 'company-456'),
  ('contract-id', 'Frontend Geliştirme', '2024-04-30', 35000, 35000, 'IN_PROGRESS', 'company-456'),
  ('contract-id', 'Backend Geliştirme', '2024-05-31', 30000, 30000, 'PENDING', 'company-456'),
  ('contract-id', 'Test ve Yayın', '2024-06-30', 10000, 10000, 'PENDING', 'company-456');
```

---

## 📊 RAPORLAR ve SORGULAR

### 1. Aktif Sözleşme Sayısı ve Değeri
```sql
SELECT 
  COUNT(*) as "activeSozlesmeSayisi",
  SUM(value) as "toplamDeger",
  AVG(value) as "ortalamaDeger"
FROM "Contract"
WHERE status = 'ACTIVE';
```

### 2. Yenileme Bekleyen Sözleşmeler (30 Gün İçinde)
```sql
SELECT 
  "contractNumber",
  title,
  "endDate",
  "endDate" - CURRENT_DATE as "kalanGun",
  value
FROM "Contract"
WHERE 
  status = 'ACTIVE'
  AND "endDate" BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
ORDER BY "endDate";
```

### 3. Müşteri Bazlı Sözleşme İstatistikleri
```sql
SELECT 
  c.name as "musteriAdi",
  COUNT(con.id) as "sozlesmeSayisi",
  SUM(CASE WHEN con.status = 'ACTIVE' THEN 1 ELSE 0 END) as "aktifSozlesme",
  SUM(con.value) as "toplamDeger"
FROM "Customer" c
LEFT JOIN "Contract" con ON c.id = con."customerId"
GROUP BY c.id, c.name
ORDER BY "toplamDeger" DESC;
```

### 4. MRR ve ARR Hesaplama
```sql
-- Monthly Recurring Revenue
SELECT calculate_mrr() as "MRR";

-- Annual Recurring Revenue  
SELECT calculate_arr() as "ARR";
```

### 5. En Yakında Dolacak 10 Sözleşme
```sql
SELECT 
  "contractNumber",
  title,
  "endDate",
  "endDate" - CURRENT_DATE as "kalanGun",
  "renewalType",
  "autoRenewEnabled"
FROM "Contract"
WHERE 
  status = 'ACTIVE'
  AND "endDate" > CURRENT_DATE
ORDER BY "endDate" ASC
LIMIT 10;
```

### 6. Sözleşme Tipi Dağılımı
```sql
SELECT 
  type,
  COUNT(*) as "sayi",
  SUM(value) as "toplamDeger",
  AVG(value) as "ortalamaDeger"
FROM "Contract"
WHERE status = 'ACTIVE'
GROUP BY type
ORDER BY "toplamDeger" DESC;
```

---

## 🤖 CRON JOB KURULUMU (Önerilen)

Otomasyonların günlük çalışması için:

### Supabase Edge Functions ile
```typescript
// functions/daily-contract-automation/index.ts
Deno.serve(async (req) => {
  const supabaseClient = createClient(...)
  
  // 1. Expire contracts
  await supabaseClient.rpc('auto_expire_contracts')
  
  // 2. Send renewal notifications
  await supabaseClient.rpc('create_renewal_notifications')
  
  // 3. Auto-renew contracts
  await supabaseClient.rpc('auto_renew_contracts')
  
  return new Response('OK')
})
```

### Vercel Cron ile
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/contract-automation",
      "schedule": "0 9 * * *"  // Her gün saat 09:00
    }
  ]
}
```

---

## 🎨 UI COMPONENT ÖNERİLERİ (Sonra Eklenebilir)

Şu an sadece database hazır. UI eklemek isterseniz:

1. **ContractList** - Sözleşme listesi
2. **ContractForm** - Yeni sözleşme oluştur/düzenle
3. **ContractDetail** - Detay sayfası
4. **ContractRenewalModal** - Yenileme formu
5. **ContractTimeline** - Milestone timeline

---

## ⚠️ ÖNEMLİ NOTLAR

### 1. Contract Number Sequence
Contract number otomatik artar. İlk sözleşme SOZL-2024-0001 olacak.

### 2. Auto-Renew Dikkat!
`autoRenewEnabled=true` olan sözleşmeler 7 gün kala otomatik yenilenir. Test ederken dikkat edin.

### 3. Customer Stats
Customer tablosuna 3 yeni kolon eklendi:
- `activeContractsCount`
- `totalContractValue`
- `lastContractDate`

Bu kolonlar otomatik güncellenir (trigger ile).

### 4. Deal Entegrasyonu
Deal WON olduğunda otomatik DRAFT contract oluşur. İsterseniz bu trigger'ı devre dışı bırakabilirsiniz:
```sql
DROP TRIGGER trigger_deal_won_create_contract ON "Deal";
```

---

## 🆘 SORUN GİDERME

### Hata: "relation already exists"
**Çözüm:** Tablo zaten varsa, migration'daki ilgili CREATE TABLE satırını comment'leyin.

### Contract Number Duplicate Hatası
**Çözüm:** Sequence'i sıfırlayın:
```sql
SELECT setval('contract_number_seq', 1, false);
```

### Auto-Renew Çalışmıyor
**Çözüm:** Kontrol listesi:
1. `autoRenewEnabled = true` mi?
2. `renewalType = 'AUTO'` mu?
3. `endDate` 7 gün içinde mi?
4. `status = 'ACTIVE'` mi?

---

## 🎯 SONRAKI ADIMLAR

1. ✅ Migration'ı çalıştır
2. ✅ Test sözleşmeleri oluştur
3. ✅ Otomasyonları test et
4. 📊 Raporları kontrol et
5. 🤖 Cron job kur (günlük çalışsın)
6. 🎨 UI component'leri ekle (opsiyonel)

---

**Sistem hazır! İyi kullanımlar!** 🚀

*Migration dosyası: `supabase/migrations/034_contract_management_system.sql`*



