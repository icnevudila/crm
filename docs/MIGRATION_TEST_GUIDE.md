# 🧪 Migration Test Rehberi

## 📋 Çalıştırılacak Migration Dosyaları

### 1. ✅ `005_enhance_product_system.sql` (ÖNCE BU!)
**Ne yapar:**
- `InvoiceItem` tablosunu oluşturur
- `StockMovement` tablosunu oluşturur
- `Product` tablosuna yeni kolonlar ekler:
  - `category`, `sku`, `barcode`, `status`, `minStock`, `maxStock`, `unit`, `weight`, `dimensions`
- Index'ler oluşturur
- RLS policies ekler
- InvoiceItem trigger'ları oluşturur (stok düşürme/artırma)

**Test Adımları:**
1. Supabase Dashboard → SQL Editor
2. `supabase/migrations/005_enhance_product_system.sql` dosyasını aç
3. Tüm SQL'i kopyala ve yapıştır
4. "Run" butonuna tıkla
5. Hata kontrolü yap (eğer hata varsa, hangi satırda olduğunu not et)

**Kontrol Sorguları (Migration sonrası çalıştır):**
```sql
-- 1. Product tablosunda yeni kolonlar var mı?
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Product' 
AND column_name IN ('category', 'sku', 'barcode', 'status', 'minStock', 'maxStock', 'unit');

-- 2. InvoiceItem tablosu oluşturuldu mu?
SELECT COUNT(*) FROM "InvoiceItem";

-- 3. StockMovement tablosu oluşturuldu mu?
SELECT COUNT(*) FROM "StockMovement";

-- 4. Trigger'lar oluşturuldu mu?
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE '%invoice_item%';
```

---

### 2. ✅ `006_update_invoice_item_trigger_for_vendor.sql` (SONRA BU!)
**Ne yapar:**
- `InvoiceItem` trigger fonksiyonunu günceller
- `vendorId` kontrolü ekler:
  - Invoice'da `vendorId` varsa → Stok artışı (IN) - Tedarikçi alışı
  - Invoice'da `vendorId` yoksa → Stok düşüşü (OUT) - Satış faturası

**Test Adımları:**
1. Supabase Dashboard → SQL Editor
2. `supabase/migrations/006_update_invoice_item_trigger_for_vendor.sql` dosyasını aç
3. Tüm SQL'i kopyala ve yapıştır
4. "Run" butonuna tıkla
5. Hata kontrolü yap

**Kontrol Sorguları (Migration sonrası çalıştır):**
```sql
-- 1. Trigger fonksiyonu güncellendi mi?
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_name = 'update_stock_on_invoice_item';

-- 2. Trigger aktif mi?
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_update_stock_on_invoice_item';
```

---

## 🧪 Fonksiyonel Testler

### Test 1: Product Tablosu Yeni Kolonlar
```sql
-- Yeni bir ürün ekle (yeni kolonlarla)
INSERT INTO "Product" (
  name, price, stock, category, sku, barcode, status, 
  "minStock", "maxStock", unit, "companyId"
) VALUES (
  'Test Ürünü', 100.00, 50, 'Elektronik', 'TEST-001', 
  '1234567890123', 'ACTIVE', 10, 100, 'ADET', 
  (SELECT id FROM "Company" LIMIT 1)
);

-- Kontrol et
SELECT name, category, sku, barcode, status, "minStock", "maxStock", unit 
FROM "Product" 
WHERE name = 'Test Ürünü';
```

### Test 2: InvoiceItem Oluşturma (Satış Faturası - Stok Düşüşü)
```sql
-- 1. Bir ürün oluştur
INSERT INTO "Product" (name, price, stock, "companyId")
VALUES ('Test Ürünü 2', 50.00, 100, (SELECT id FROM "Company" LIMIT 1))
RETURNING id;

-- 2. Bir invoice oluştur (vendorId YOK - satış faturası)
INSERT INTO "Invoice" (title, status, total, "companyId")
VALUES ('Test Satış Faturası', 'DRAFT', 50.00, (SELECT id FROM "Company" LIMIT 1))
RETURNING id;

-- 3. InvoiceItem ekle (stok düşmeli)
INSERT INTO "InvoiceItem" (
  "invoiceId", "productId", quantity, "unitPrice", total, "companyId"
)
VALUES (
  (SELECT id FROM "Invoice" WHERE title = 'Test Satış Faturası' LIMIT 1),
  (SELECT id FROM "Product" WHERE name = 'Test Ürünü 2' LIMIT 1),
  10, 50.00, 500.00,
  (SELECT id FROM "Company" LIMIT 1)
);

-- 4. Kontrol et: Stok düştü mü? (100 - 10 = 90 olmalı)
SELECT stock FROM "Product" WHERE name = 'Test Ürünü 2';

-- 5. Kontrol et: StockMovement kaydı oluşturuldu mu?
SELECT type, quantity, reason, "relatedTo"
FROM "StockMovement"
WHERE "productId" = (SELECT id FROM "Product" WHERE name = 'Test Ürünü 2' LIMIT 1)
ORDER BY "createdAt" DESC
LIMIT 1;
-- Beklenen: type='OUT', quantity=-10, reason='SATIS', relatedTo='Invoice'
```

### Test 3: InvoiceItem Oluşturma (Tedarikçi Alış Faturası - Stok Artışı)
```sql
-- 1. Bir ürün oluştur
INSERT INTO "Product" (name, price, stock, "companyId")
VALUES ('Test Ürünü 3', 30.00, 50, (SELECT id FROM "Company" LIMIT 1))
RETURNING id;

-- 2. Bir vendor oluştur
INSERT INTO "Vendor" (name, status, "companyId")
VALUES ('Test Tedarikçi', 'ACTIVE', (SELECT id FROM "Company" LIMIT 1))
RETURNING id;

-- 3. Bir invoice oluştur (vendorId VAR - tedarikçi alış faturası)
INSERT INTO "Invoice" (title, status, total, "vendorId", "companyId")
VALUES (
  'Test Tedarikçi Alış Faturası', 
  'DRAFT', 
  300.00, 
  (SELECT id FROM "Vendor" WHERE name = 'Test Tedarikçi' LIMIT 1),
  (SELECT id FROM "Company" LIMIT 1)
)
RETURNING id;

-- 4. InvoiceItem ekle (stok artmalı)
INSERT INTO "InvoiceItem" (
  "invoiceId", "productId", quantity, "unitPrice", total, "companyId"
)
VALUES (
  (SELECT id FROM "Invoice" WHERE title = 'Test Tedarikçi Alış Faturası' LIMIT 1),
  (SELECT id FROM "Product" WHERE name = 'Test Ürünü 3' LIMIT 1),
  20, 30.00, 600.00,
  (SELECT id FROM "Company" LIMIT 1)
);

-- 5. Kontrol et: Stok arttı mı? (50 + 20 = 70 olmalı)
SELECT stock FROM "Product" WHERE name = 'Test Ürünü 3';

-- 6. Kontrol et: StockMovement kaydı oluşturuldu mu?
SELECT type, quantity, reason, "relatedTo"
FROM "StockMovement"
WHERE "productId" = (SELECT id FROM "Product" WHERE name = 'Test Ürünü 3' LIMIT 1)
ORDER BY "createdAt" DESC
LIMIT 1;
-- Beklenen: type='IN', quantity=20, reason='TEDARIKCI', relatedTo='Invoice'
```

### Test 4: Manuel Stok Hareketi (StockMovement API)
```sql
-- 1. Bir ürün oluştur
INSERT INTO "Product" (name, price, stock, "companyId")
VALUES ('Test Ürünü 4', 25.00, 30, (SELECT id FROM "Company" LIMIT 1))
RETURNING id;

-- 2. Manuel stok girişi (IN)
INSERT INTO "StockMovement" (
  "productId", type, quantity, "previousStock", "newStock",
  reason, "companyId", "userId"
)
VALUES (
  (SELECT id FROM "Product" WHERE name = 'Test Ürünü 4' LIMIT 1),
  'IN', 15, 30, 45,
  'MANUEL',
  (SELECT id FROM "Company" LIMIT 1),
  (SELECT id FROM "User" LIMIT 1)
);

-- 3. Kontrol et: Stok arttı mı? (30 + 15 = 45 olmalı)
SELECT stock FROM "Product" WHERE name = 'Test Ürünü 4';

-- 4. Manuel stok çıkışı (OUT)
INSERT INTO "StockMovement" (
  "productId", type, quantity, "previousStock", "newStock",
  reason, "companyId", "userId"
)
VALUES (
  (SELECT id FROM "Product" WHERE name = 'Test Ürünü 4' LIMIT 1),
  'OUT', -10, 45, 35,
  'MANUEL',
  (SELECT id FROM "Company" LIMIT 1),
  (SELECT id FROM "User" LIMIT 1)
);

-- 5. Kontrol et: Stok düştü mü? (45 - 10 = 35 olmalı)
SELECT stock FROM "Product" WHERE name = 'Test Ürünü 4';
```

### Test 5: Sevkiyat Oluşturma (Shipment API)
```sql
-- 1. Bir invoice ve invoiceItem oluştur (önceki testlerden)
-- 2. Sevkiyat oluştur
INSERT INTO "Shipment" (
  "invoiceId", tracking, status, "companyId"
)
VALUES (
  (SELECT id FROM "Invoice" WHERE title = 'Test Satış Faturası' LIMIT 1),
  'TRACKING-123',
  'PENDING',
  (SELECT id FROM "Company" LIMIT 1)
);

-- 3. Kontrol et: StockMovement kaydı oluşturuldu mu? (SEVKIYAT reason ile)
SELECT type, quantity, reason, "relatedTo", notes
FROM "StockMovement"
WHERE "relatedTo" = 'Shipment'
ORDER BY "createdAt" DESC
LIMIT 1;
-- Beklenen: type='OUT', reason='SEVKIYAT', relatedTo='Shipment'
```

---

## ✅ Migration Sonrası Kontrol Listesi

### Database Kontrolleri
- [ ] `Product` tablosunda yeni kolonlar var mı? (`category`, `sku`, `barcode`, `status`, `minStock`, `maxStock`, `unit`)
- [ ] `InvoiceItem` tablosu oluşturuldu mu?
- [ ] `StockMovement` tablosu oluşturuldu mu?
- [ ] Trigger'lar oluşturuldu mu? (`trigger_update_stock_on_invoice_item`)
- [ ] Index'ler oluşturuldu mu?
- [ ] RLS policies aktif mi?

### Fonksiyonel Testler
- [ ] Satış faturası oluşturulduğunda stok düşüyor mu? (vendorId yok)
- [ ] Tedarikçi alış faturası oluşturulduğunda stok artıyor mu? (vendorId var)
- [ ] StockMovement kayıtları oluşturuluyor mu?
- [ ] Sevkiyat oluşturulduğunda stok hareketi kaydı oluşturuluyor mu?
- [ ] Manuel stok giriş/çıkış çalışıyor mu?

### API Testleri
- [ ] `GET /api/products` - Yeni kolonlar dönüyor mu?
- [ ] `GET /api/products/[id]` - Stok geçmişi dönüyor mu?
- [ ] `GET /api/stock-movements` - Stok hareketleri listeleniyor mu?
- [ ] `POST /api/stock-movements` - Yeni stok hareketi oluşturuluyor mu?
- [ ] `POST /api/invoice-items` - InvoiceItem oluşturuluyor mu?
- [ ] `POST /api/shipments` - Sevkiyat oluşturuluyor mu?

---

## 🚨 Hata Durumunda

### Hata: "column does not exist"
- **Çözüm:** Migration dosyasını tekrar çalıştırın veya eksik kolonları manuel ekleyin

### Hata: "trigger already exists"
- **Çözüm:** Normal, trigger zaten var. Migration sadece fonksiyonu güncelliyor.

### Hata: "table already exists"
- **Çözüm:** Normal, `IF NOT EXISTS` kullanıldığı için hata vermez.

### Hata: "permission denied"
- **Çözüm:** Supabase Dashboard'dan Service Role key ile çalıştırın veya RLS policies'i kontrol edin.

---

## 📝 Test Sonuçları

Migration'ları çalıştırdıktan sonra bu testleri yapın ve sonuçları not edin:

1. **Migration 005:**
   - [ ] Başarılı mı?
   - [ ] Hata var mı? (varsa hangi satırda?)

2. **Migration 006:**
   - [ ] Başarılı mı?
   - [ ] Hata var mı? (varsa hangi satırda?)

3. **Fonksiyonel Testler:**
   - [ ] Test 1: Product yeni kolonlar ✅/❌
   - [ ] Test 2: Satış faturası stok düşüşü ✅/❌
   - [ ] Test 3: Tedarikçi alış stok artışı ✅/❌
   - [ ] Test 4: Manuel stok hareketi ✅/❌
   - [ ] Test 5: Sevkiyat stok hareketi ✅/❌

---

## 🎯 Önemli Notlar

1. **Migration Sırası:** Önce `005_enhance_product_system.sql`, sonra `006_update_invoice_item_trigger_for_vendor.sql`
2. **Trigger Güncelleme:** Migration 006 sadece trigger fonksiyonunu günceller, trigger'ı yeniden oluşturmaz
3. **Test Verileri:** Test sonrası test verilerini temizlemek için:
   ```sql
   DELETE FROM "StockMovement" WHERE reason IN ('MANUEL', 'SATIS', 'TEDARIKCI', 'SEVKIYAT');
   DELETE FROM "InvoiceItem" WHERE "invoiceId" IN (SELECT id FROM "Invoice" WHERE title LIKE 'Test%');
   DELETE FROM "Invoice" WHERE title LIKE 'Test%';
   DELETE FROM "Product" WHERE name LIKE 'Test%';
   DELETE FROM "Vendor" WHERE name LIKE 'Test%';
   ```

