# ✅ Onaylar Modülü Tam Otomasyon Entegrasyonu

**Tarih:** 2024  
**Migration:** `053_approval_complete_automations.sql`  
**Durum:** ✅ Tamamlandı

---

## 📋 ÖZET

Onaylar modülü artık **tam otomasyon** ile entegre edildi. Tüm işlemler otomatik olarak gerçekleşiyor:

1. ✅ **Onay talebi oluşturulduğunda** → Onaylayıcılara otomatik bildirim
2. ✅ **Quote/Deal/Invoice/Contract threshold** → Otomatik onay talebi
3. ✅ **Onay sonrası** → Otomatik işlemler (Quote → Invoice, Deal → Contract)
4. ✅ **Red sonrası** → Otomatik entity güncelleme
5. ✅ **Hatırlatıcılar** → 1 gün sonra otomatik bildirim

---

## 🚀 YENİ OTOMASYONLAR

### 1. Onay Talebi Oluşturulduğunda Otomatik Bildirim

**Trigger:** `trigger_notify_approvers_on_approval_created`  
**Fonksiyon:** `notify_approvers_on_approval_created()`

**Ne Yapar:**
- Yeni onay talebi oluşturulduğunda
- Tüm onaylayıcılara (`approverIds`) otomatik bildirim gönderir
- Bildirim: "🔔 Yeni Onay Talebi - [Talep Eden] tarafından [Başlık] onay talebi oluşturuldu"
- Link: `/tr/approvals/[id]`
- Öncelik: HIGH/URGENT ise `high`, diğerleri `normal`

**Örnek:**
```sql
-- Manuel onay talebi oluşturulduğunda
INSERT INTO "ApprovalRequest" (...)
-- → Otomatik olarak tüm onaylayıcılara bildirim gönderilir
```

---

### 2. Invoice Threshold Otomasyonu

**Trigger:** `invoice_approval_check`  
**Fonksiyon:** `check_invoice_needs_approval()`

**Ne Yapar:**
- Invoice `totalAmount > 75.000 TRY` ve `status = 'DRAFT'` ise
- Otomatik onay talebi oluşturur
- Onaylayıcı: ADMIN/SUPER_ADMIN (kendisi hariç)
- Öncelik: HIGH

**Örnek:**
```sql
-- Invoice oluşturulduğunda
INSERT INTO "Invoice" (totalAmount: 80000, status: 'DRAFT')
-- → Otomatik onay talebi oluşturulur
```

---

### 3. Contract Threshold Otomasyonu

**Trigger:** `contract_approval_check`  
**Fonksiyon:** `check_contract_needs_approval()`

**Ne Yapar:**
- Contract `value > 50.000 TRY` ve `status = 'DRAFT'` ise
- Otomatik onay talebi oluşturur
- Onaylayıcı: ADMIN/SUPER_ADMIN (kendisi hariç)
- Öncelik: HIGH

**Örnek:**
```sql
-- Contract oluşturulduğunda
INSERT INTO "Contract" (value: 60000, status: 'DRAFT')
-- → Otomatik onay talebi oluşturulur
```

---

### 4. Onay Sonrası Otomatik İşlemler

**Trigger:** `trigger_approval_approved_automations`  
**Fonksiyon:** `handle_approval_approved_automations()`

**Ne Yapar:**

#### Quote APPROVED → Invoice Oluştur
- Quote onaylandığında (`status = 'ACCEPTED'`)
- Eğer invoice yoksa → Otomatik invoice oluşturur
- Invoice number: `INV-YYYY-XXXX`
- Vade: 30 gün
- ActivityLog kaydı

**Örnek:**
```sql
-- Quote onaylandığında
UPDATE "ApprovalRequest" SET status = 'APPROVED' WHERE relatedTo = 'Quote'
-- → Otomatik invoice oluşturulur
```

#### Deal APPROVED → Contract Oluştur
- Deal onaylandığında (`stage = 'NEGOTIATION'`)
- Eğer contract yoksa → Otomatik contract oluşturur
- Contract number: `CNT-YYYY-XXXX`
- ActivityLog kaydı

**Örnek:**
```sql
-- Deal onaylandığında
UPDATE "ApprovalRequest" SET status = 'APPROVED' WHERE relatedTo = 'Deal'
-- → Otomatik contract oluşturulur
```

---

### 5. Bildirim İyileştirmeleri

**Güncellenen Fonksiyonlar:**
- `handle_approval_approved()` - userId eklendi
- `handle_approval_rejected()` - userId eklendi

**Ne Yapar:**
- Onay/Red sonrası bildirimler artık `userId` ile gönderiliyor
- Daha doğru bildirim yönlendirmesi

---

## 📊 TAM İŞ AKIŞI

### Senaryo 1: Manuel Onay Talebi

```
1. Kullanıcı "Yeni Onay Talebi" oluşturur
   ↓
2. ApprovalRequest INSERT → Trigger tetiklenir
   ↓
3. Tüm onaylayıcılara otomatik bildirim gönderilir
   ↓
4. Onaylayıcılar bildirim alır → "Benim Onaylarım" sekmesinde görür
   ↓
5. Onaylayıcı onaylar/reddeder
   ↓
6. Entity otomatik güncellenir (Quote → ACCEPTED, Deal → NEGOTIATION)
   ↓
7. Talep edene bildirim gönderilir
   ↓
8. Otomatik işlemler (Quote → Invoice, Deal → Contract)
```

### Senaryo 2: Otomatik Onay Talebi (Threshold)

```
1. Quote/Deal/Invoice/Contract oluşturulur (threshold aşıldı)
   ↓
2. Trigger tetiklenir → Otomatik onay talebi oluşturulur
   ↓
3. Tüm onaylayıcılara otomatik bildirim gönderilir
   ↓
4. Onaylayıcılar bildirim alır → "Benim Onaylarım" sekmesinde görür
   ↓
5. Onaylayıcı onaylar/reddeder
   ↓
6. Entity otomatik güncellenir
   ↓
7. Talep edene bildirim gönderilir
   ↓
8. Otomatik işlemler (Quote → Invoice, Deal → Contract)
```

### Senaryo 3: Hatırlatıcı

```
1. Onay talebi 1 günden fazla PENDING durumunda
   ↓
2. Günlük cron job çalışır (saat 10:00)
   ↓
3. Tüm onaylayıcılara hatırlatıcı bildirim gönderilir
   ↓
4. "⏰ Onay Hatırlatıcısı" bildirimi
```

---

## 🔧 KURULUM

### 1. Migration Dosyasını Çalıştır

```sql
-- Supabase SQL Editor'de
\i supabase/migrations/053_approval_complete_automations.sql
```

### 2. Cron Job Kurulumu (Hatırlatıcı İçin)

```sql
-- pg_cron extension aktif mi kontrol et
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- Eğer yoksa:
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Cron job oluştur (günlük saat 10:00)
SELECT cron.schedule(
  'pending-approval-reminder-job',
  '0 10 * * *', -- Her gün saat 10:00
  'SELECT notify_pending_approvals();'
);
```

### 3. Test

```sql
-- 1. Manuel onay talebi oluştur
INSERT INTO "ApprovalRequest" (
  title, "relatedTo", "relatedId", "requestedBy", 
  "approverIds", "companyId", status
) VALUES (
  'Test Onay Talebi',
  'Quote',
  '...', -- Quote ID
  '...', -- User ID
  ARRAY['...'], -- Approver IDs
  '...', -- Company ID
  'PENDING'
);

-- → Onaylayıcılara bildirim gönderilmeli

-- 2. Invoice threshold test
INSERT INTO "Invoice" (
  "invoiceNumber", "totalAmount", status, "companyId", "createdBy"
) VALUES (
  'INV-2024-0001',
  80000, -- > 75K
  'DRAFT',
  '...', -- Company ID
  '...'  -- User ID
);

-- → Otomatik onay talebi oluşturulmalı

-- 3. Contract threshold test
INSERT INTO "Contract" (
  "contractNumber", value, status, "companyId", "createdBy"
) VALUES (
  'CNT-2024-0001',
  60000, -- > 50K
  'DRAFT',
  '...', -- Company ID
  '...'  -- User ID
);

-- → Otomatik onay talebi oluşturulmalı
```

---

## 📝 MEVCUT OTOMASYONLAR (ÖNCEDEN VAR)

### 1. Quote Threshold Otomasyonu
- **Trigger:** `quote_approval_check`
- **Threshold:** `total > 50.000 TRY`
- **Durum:** `status = 'DRAFT'`

### 2. Deal Threshold Otomasyonu
- **Trigger:** `deal_approval_check`
- **Threshold:** `value > 100.000 TRY`
- **Durum:** `stage = 'NEGOTIATION'`

### 3. Entity Güncelleme Otomasyonu
- **Trigger:** `trigger_update_entity_on_approval`
- **Ne Yapar:**
  - Quote APPROVED → `status = 'ACCEPTED'`
  - Quote REJECTED → `status = 'REJECTED'`
  - Deal APPROVED → `stage = 'NEGOTIATION'`
  - Deal REJECTED → `stage = 'LOST'`
  - Contract APPROVED → `status = 'ACTIVE'`

### 4. Hatırlatıcı Sistemi
- **Fonksiyon:** `notify_pending_approvals()`
- **Cron Job:** Günlük saat 10:00
- **Ne Yapar:** 1 günden fazla PENDING onay talepleri için hatırlatıcı

---

## 🎯 THRESHOLD DEĞERLERİ

| Modül | Threshold | Durum |
|-------|-----------|-------|
| **Quote** | 50.000 TRY | DRAFT |
| **Deal** | 100.000 TRY | NEGOTIATION |
| **Invoice** | 75.000 TRY | DRAFT |
| **Contract** | 50.000 TRY | DRAFT |

---

## ✅ SONUÇ

Onaylar modülü artık **tam otomasyon** ile çalışıyor:

1. ✅ **Otomatik onay talebi oluşturma** (threshold)
2. ✅ **Otomatik bildirim gönderme** (onaylayıcılara)
3. ✅ **Otomatik entity güncelleme** (onay/red sonrası)
4. ✅ **Otomatik işlemler** (Quote → Invoice, Deal → Contract)
5. ✅ **Otomatik hatırlatıcılar** (1 gün sonra)

**Tüm işlemler artık otomatik! 🎉**






