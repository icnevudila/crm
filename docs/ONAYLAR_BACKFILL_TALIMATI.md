# 📥 Onaylar Backfill Talimatı

**Tarih:** 2024  
**Migration:** `055_backfill_approval_records.sql`  
**Amaç:** Mevcut tüm işlemler için geriye dönük onay kayıtları oluşturma

---

## 📋 NE YAPAR?

Bu script, **mevcut tüm işlemler** için onaylar sayfasına kayıt oluşturur:

1. ✅ **Tüm Quote'lar** → Onay kaydı oluşturur
2. ✅ **Tüm Deal'ler** → Onay kaydı oluşturur
3. ✅ **Tüm Invoice'lar** → Onay kaydı oluşturur
4. ✅ **Tüm Contract'lar** → Onay kaydı oluşturur

### Otomatik Onaylama Kuralları:

| Modül | Threshold | Durum |
|-------|-----------|-------|
| **Quote** | ≤ 50.000 TRY | Otomatik **APPROVED** |
| **Quote** | > 50.000 TRY | **PENDING** (Yönetici onayı gerekir) |
| **Deal** | ≤ 100.000 TRY | Otomatik **APPROVED** |
| **Deal** | > 100.000 TRY | **PENDING** (Yönetici onayı gerekir) |
| **Invoice** | ≤ 75.000 TRY | Otomatik **APPROVED** |
| **Invoice** | > 75.000 TRY | **PENDING** (Yönetici onayı gerekir) |
| **Contract** | ≤ 50.000 TRY | Otomatik **APPROVED** |
| **Contract** | > 50.000 TRY | **PENDING** (Yönetici onayı gerekir) |

---

## 🚀 KURULUM

### 1. Migration Dosyasını Çalıştır

```sql
-- Supabase SQL Editor'de
\i supabase/migrations/055_backfill_approval_records.sql
```

**VEYA** dosya içeriğini kopyala-yapıştır yap ve **RUN** butonuna bas.

### 2. Sonuçları Kontrol Et

Script çalıştıktan sonra **NOTICE** mesajları göreceksiniz:

```
NOTICE: Quote backfill başlıyor...
NOTICE: Quote backfill tamamlandı: 150 kayıt oluşturuldu, 20 kayıt atlandı
NOTICE: Deal backfill başlıyor...
NOTICE: Deal backfill tamamlandı: 80 kayıt oluşturuldu, 10 kayıt atlandı
NOTICE: Invoice backfill başlıyor...
NOTICE: Invoice backfill tamamlandı: 200 kayıt oluşturuldu, 5 kayıt atlandı
NOTICE: Contract backfill başlıyor...
NOTICE: Contract backfill tamamlandı: 50 kayıt oluşturuldu, 0 kayıt atlandı
```

---

## 📊 NE OLUR?

### Senaryo 1: Quote 30.000 TRY (Threshold Altı)

```
1. Script çalışır
   ↓
2. Quote için onay kaydı oluşturulur
   ↓
3. Tutar 30.000 TRY ≤ 50.000 TRY
   ↓
4. Otomatik APPROVED olur
   ↓
5. Onaylar sayfasında görünür (APPROVED durumunda)
```

### Senaryo 2: Quote 80.000 TRY (Threshold Üstü)

```
1. Script çalışır
   ↓
2. Quote için onay kaydı oluşturulur
   ↓
3. Tutar 80.000 TRY > 50.000 TRY
   ↓
4. PENDING durumunda kalır
   ↓
5. Onaylar sayfasında görünür (PENDING durumunda)
   ↓
6. Yönetici onaylaması gerekir
```

---

## ⚠️ ÖNEMLİ NOTLAR

### 1. Duplicate Kontrolü
- ✅ Script, **zaten onay kaydı olan** işlemleri atlar
- ✅ Duplicate kayıt oluşturmaz
- ✅ Güvenli çalıştırılabilir (idempotent)

### 2. Orijinal Tarihler
- ✅ Onay kayıtları, **orijinal işlem tarihleri** ile oluşturulur
- ✅ `createdAt` = Orijinal işlem tarihi
- ✅ Geçmiş işlemler için doğru tarihleme

### 3. Manager Kontrolü
- ✅ Her şirket için ADMIN/SUPER_ADMIN rolündeki kullanıcılar onaylayıcı olarak atanır
- ✅ Manager yoksa, işlemi oluşturan kullanıcı onaylayıcı olur (otomatik onay)

### 4. Kolon Uyumluluğu
- ✅ `total` ve `totalAmount` kolonlarını otomatik kontrol eder
- ✅ Hangi kolon varsa onu kullanır
- ✅ Her iki durumda da çalışır

---

## 🔍 KONTROL

### Backfill Sonrası Kontrol

```sql
-- Toplam onay kaydı sayısı
SELECT COUNT(*) FROM "ApprovalRequest";

-- Modül bazlı sayılar
SELECT 
  "relatedTo",
  status,
  COUNT(*) as count
FROM "ApprovalRequest"
GROUP BY "relatedTo", status
ORDER BY "relatedTo", status;

-- Otomatik onaylananlar
SELECT COUNT(*) 
FROM "ApprovalRequest" 
WHERE status = 'APPROVED' 
  AND description LIKE '%Otomatik onaylandı%';

-- Bekleyen onaylar
SELECT COUNT(*) 
FROM "ApprovalRequest" 
WHERE status = 'PENDING';
```

---

## ✅ SONUÇ

Backfill script'i çalıştıktan sonra:

1. ✅ **Tüm mevcut işlemler** için onay kaydı oluşturulur
2. ✅ **Threshold altındakiler** otomatik onaylanır
3. ✅ **Threshold üstündekiler** PENDING durumunda kalır
4. ✅ **Onaylar sayfasında** tüm işlemler görünür
5. ✅ **Takip edilebilir** hale gelir

**Artık tüm işlemleriniz onaylar sayfasında! 🎉**






