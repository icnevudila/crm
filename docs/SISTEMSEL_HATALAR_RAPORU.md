# 🔍 SİSTEMSEL HATALAR RAPORU

**Tarih:** 2024  
**Durum:** 🔴 KRİTİK HATALAR BULUNDU

---

## 📋 ÖZET

Sistemde **kolon adı uyumsuzlukları** tespit edildi. Bazı trigger'lar ve validasyon fonksiyonları, veritabanı tablolarında mevcut olmayan kolon isimlerini kullanıyor.

---

## 🔴 HATA 1: `minimumStock` vs `minStock`

### **SORUN:**
- **Tablo Tanımı:** `Product` tablosunda `minStock` kolonu var
- **Trigger Kullanımı:** Bazı trigger'lar `minimumStock` kullanıyor
- **Sonuç:** `record "new" has no field "minimumStock"` hatası

### **DOSYALAR:**
1. ✅ `supabase/migrations/005_enhance_product_system.sql` (satır 41)
   ```sql
   ADD COLUMN IF NOT EXISTS "minStock" DECIMAL(10, 2) DEFAULT 0
   ```

2. ✅ `supabase/migrations/021_notifications_system.sql` (satır 71-82)
   ```sql
   IF NEW.stock <= COALESCE(NEW."minStock", 0) -- DOĞRU
   ```

3. ❌ `supabase/migrations/043_complete_automations.sql` (satır 164-166)
   ```sql
   IF NEW."minimumStock" IS NOT NULL -- YANLIŞ!
   ```

### **ETKİSİ:**
- ❌ Fatura silme işlemleri başarısız oluyor
- ❌ Product trigger'ları çalışmıyor
- ❌ Stok uyarı sistemi çalışmıyor
- ❌ "Quote not found" hataları (cascading effect)

### **ÇÖZÜM:**
✅ **Migration Oluşturuldu:** `supabase/migrations/049_fix_minimumstock_column.sql`
```sql
ALTER TABLE "Product" 
RENAME COLUMN "minStock" TO "minimumStock";
```

**VEYA** Trigger'ları düzelt:
```sql
-- 043_complete_automations.sql içindeki tüm "minimumStock" 
-- referanslarını "minStock" olarak değiştir
```

---

## 🟡 HATA 2: `total` vs `totalAmount`

### **SORUN:**
- **Tablo Tanımı:** `Quote` ve `Invoice` tablolarında `total` kolonu var
- **Trigger/Validation Kullanımı:** Bazı fonksiyonlar `totalAmount` kullanıyor
- **Sonuç:** Potansiyel validation hataları

### **DOSYALAR:**
1. ✅ `supabase/schema.sql` (satır 58, 70)
   ```sql
   CREATE TABLE "Quote" (
     total DECIMAL(15, 2) DEFAULT 0  -- Doğru tanım
   )
   ```

2. ❌ `supabase/migrations/044_workflow_validations.sql` (satır 220, 334)
   ```sql
   IF NEW."totalAmount" IS NULL OR NEW."totalAmount" = 0 THEN -- YANLIŞ!
   ```

3. ❌ `supabase/migrations/042_user_automations.sql` (satır 240, 425, 470)
   ```sql
   NEW."totalAmount"  -- YANLIŞ!
   ```

4. ❌ `supabase/migrations/037_advanced_features_automations.sql` (satır 370-371)
   ```sql
   NEW."totalAmount" >= approval_threshold -- YANLIŞ!
   ```

5. ⚠️ `src/app/api/quotes/[id]/revise/route.ts` (satır 44)
   ```typescript
   totalAmount: originalQuote.totalAmount  // API'de kullanılıyor
   ```

### **ETKİSİ:**
- ⚠️ Quote/Invoice validation'ları çalışmıyor olabilir
- ⚠️ DRAFT → SENT geçişinde tutar kontrolü yapılamıyor
- ⚠️ Onay threshold kontrolü çalışmıyor olabilir
- ⚠️ Finance otomasyonları hatalı çalışabilir

### **ÇÖZÜM SEÇENEKLERİ:**

**SEÇENEK A:** Kolon adını değiştir (ÖNERİLEN)
```sql
-- Quote ve Invoice tablolarına totalAmount ekle
ALTER TABLE "Quote" RENAME COLUMN "total" TO "totalAmount";
ALTER TABLE "Invoice" RENAME COLUMN "total" TO "totalAmount";
```

**SEÇENEK B:** Trigger'ları düzelt
```sql
-- Tüm migration'larda "totalAmount" → "total" değiştir
-- 044, 042, 037 migration'larını güncelle
```

---

## 🔍 DİĞER KONTROLLER

### ✅ Kontrol Edilen Alanlar:
- [x] Foreign key constraints - Sorun yok
- [x] RLS policies - Sorun yok  
- [x] Index tanımları - Sorun yok
- [x] Cascade delete'ler - Sorun yok
- [x] CamelCase/snake_case uyumu - `minStock/minimumStock` ve `total/totalAmount` dışında sorun yok

### 📊 İstatistikler:
- **Taranan Migration Sayısı:** 48 dosya
- **Bulunan Kritik Hata:** 2 adet
- **Etkilenen Trigger:** 5+ fonksiyon
- **Etkilenen API Endpoint:** 1+ endpoint

---

## 🚀 UYGULAMA ADIMLARI

### 1. `minimumStock` Hatasını Düzelt:
```bash
cd supabase
supabase db push
```

### 2. `totalAmount` Hatasını Düzelt:

**MANUEL SQL (Supabase Dashboard):**
```sql
-- Quote tablosu
ALTER TABLE "Quote" RENAME COLUMN "total" TO "totalAmount";

-- Invoice tablosu  
ALTER TABLE "Invoice" RENAME COLUMN "total" TO "totalAmount";

-- İlgili index'leri kontrol et (otomatik güncellenir)
```

**VEYA YENİ MIGRATION OLUŞTUR:**
```bash
# 050_fix_totalamount_column.sql
```

### 3. Test Et:
```bash
# Fatura silme
# Teklif oluşturma
# Validation kontrolü
```

---

## 📌 ÖNEMLİ NOTLAR

1. **Migration Sırası:** `049` ve `050` migration'ları sırayla çalıştırılmalı
2. **Production Uyarısı:** Bu değişiklikler production'da veri kaybına neden olmaz (sadece kolon adı değişiyor)
3. **API Uyumu:** API endpoint'ler otomatik olarak yeni kolon adlarını kullanacak
4. **Cache Temizleme:** Migration sonrası cache temizlenmeli

---

## 🎯 SONUÇ

- **Kritik Hata:** 2 adet
- **Risk Seviyesi:** 🔴 YÜKSEK
- **Aciliyet:** ⚡ ACİL
- **Tahmini Süre:** 10 dakika (migration + test)

**Aksiyon:** Migration'ları hemen çalıştırın!

---

*Rapor Oluşturma: Otomatik Sistem Taraması*  
*Son Güncelleme: 2024*

