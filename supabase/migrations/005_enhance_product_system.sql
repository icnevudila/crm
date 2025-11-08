-- Product System Enhancement Migration
-- InvoiceItem, StockMovement tabloları ve Product tablosuna yeni kolonlar

-- 1. InvoiceItem tablosu - Invoice ile Product arasındaki ilişki
CREATE TABLE IF NOT EXISTS "InvoiceItem" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "invoiceId" UUID NOT NULL REFERENCES "Invoice"(id) ON DELETE CASCADE,
  "productId" UUID NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
  unitPrice DECIMAL(15, 2) NOT NULL DEFAULT 0,
  total DECIMAL(15, 2) NOT NULL DEFAULT 0,
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("invoiceId", "productId") -- Aynı ürün aynı faturada birden fazla eklenemez
);

-- 2. StockMovement tablosu - Stok hareketleri takibi
CREATE TABLE IF NOT EXISTS "StockMovement" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "productId" UUID NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- IN (giriş), OUT (çıkış), ADJUSTMENT (düzeltme), RETURN (iade)
  quantity DECIMAL(10, 2) NOT NULL, -- Pozitif veya negatif olabilir
  "previousStock" DECIMAL(10, 2) NOT NULL, -- Önceki stok miktarı
  "newStock" DECIMAL(10, 2) NOT NULL, -- Yeni stok miktarı
  reason VARCHAR(100), -- Sebep (SATIS, ALIS, DÜZELTME, IADE, vb.)
  "relatedTo" VARCHAR(50), -- İlişkili tablo (Invoice, Quote, vb.)
  "relatedId" UUID, -- İlişkili kayıt ID
  notes TEXT, -- Notlar
  "userId" UUID REFERENCES "User"(id) ON DELETE SET NULL, -- İşlemi yapan kullanıcı
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Product tablosuna yeni kolonlar ekle
ALTER TABLE "Product" 
ADD COLUMN IF NOT EXISTS "category" VARCHAR(100), -- Kategori (schema-extension.sql'de var ama migration'da eksikti)
ADD COLUMN IF NOT EXISTS "sku" VARCHAR(100), -- SKU (Stok Kodu) - schema-extension.sql'de var ama migration'da eksikti
ADD COLUMN IF NOT EXISTS "barcode" VARCHAR(100), -- Barkod/QR kod
ADD COLUMN IF NOT EXISTS "status" VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, DISCONTINUED
ADD COLUMN IF NOT EXISTS "minStock" DECIMAL(10, 2) DEFAULT 0, -- Minimum stok seviyesi (uyarı için)
ADD COLUMN IF NOT EXISTS "maxStock" DECIMAL(10, 2) DEFAULT 0, -- Maksimum stok seviyesi
ADD COLUMN IF NOT EXISTS "unit" VARCHAR(20) DEFAULT 'ADET', -- Birim (ADET, KG, LITRE, vb.)
ADD COLUMN IF NOT EXISTS "weight" DECIMAL(10, 2), -- Ağırlık - schema-extension.sql'de var ama migration'da eksikti
ADD COLUMN IF NOT EXISTS "dimensions" VARCHAR(100); -- Boyutlar - schema-extension.sql'de var ama migration'da eksikti

-- 4. Index'ler (Performans için)
CREATE INDEX IF NOT EXISTS idx_invoiceitem_invoice ON "InvoiceItem"("invoiceId");
CREATE INDEX IF NOT EXISTS idx_invoiceitem_product ON "InvoiceItem"("productId");
CREATE INDEX IF NOT EXISTS idx_invoiceitem_company ON "InvoiceItem"("companyId");
CREATE INDEX IF NOT EXISTS idx_stockmovement_product ON "StockMovement"("productId");
CREATE INDEX IF NOT EXISTS idx_stockmovement_company ON "StockMovement"("companyId");
CREATE INDEX IF NOT EXISTS idx_stockmovement_type ON "StockMovement"("type");
CREATE INDEX IF NOT EXISTS idx_stockmovement_created ON "StockMovement"("createdAt");
CREATE INDEX IF NOT EXISTS idx_product_barcode ON "Product"("barcode");
CREATE INDEX IF NOT EXISTS idx_product_status ON "Product"("status");
CREATE INDEX IF NOT EXISTS idx_product_category ON "Product"("category");

-- 5. RLS Policies
ALTER TABLE "InvoiceItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StockMovement" ENABLE ROW LEVEL SECURITY;

-- InvoiceItem Policies
DROP POLICY IF EXISTS "invoiceitem_company_isolation" ON "InvoiceItem";
CREATE POLICY "invoiceitem_company_isolation" ON "InvoiceItem"
  FOR ALL
  USING (true) -- API seviyesinde companyId kontrolü yapılıyor
  WITH CHECK (true);

-- StockMovement Policies
DROP POLICY IF EXISTS "stockmovement_company_isolation" ON "StockMovement";
CREATE POLICY "stockmovement_company_isolation" ON "StockMovement"
  FOR ALL
  USING (true) -- API seviyesinde companyId kontrolü yapılıyor
  WITH CHECK (true);

-- 6. Trigger: InvoiceItem eklendiğinde stok güncelle (vendorId kontrolü ile)
-- Invoice'da vendorId varsa stok artışı (IN - Tedarikçi alışı), yoksa stok düşüşü (OUT - Satış faturası)
CREATE OR REPLACE FUNCTION update_stock_on_invoice_item()
RETURNS TRIGGER AS $$
DECLARE
  current_stock DECIMAL(10, 2);
  invoice_vendor_id UUID;
  movement_type VARCHAR(20);
  movement_reason VARCHAR(100);
BEGIN
  -- Mevcut stoku al
  SELECT stock INTO current_stock FROM "Product" WHERE id = NEW."productId";
  
  -- Invoice'ın vendorId'sini kontrol et
  SELECT "vendorId" INTO invoice_vendor_id FROM "Invoice" WHERE id = NEW."invoiceId" LIMIT 1;
  
  -- Tedarikçi alış faturası ise (vendorId varsa) stok artışı, değilse stok düşüşü
  IF invoice_vendor_id IS NOT NULL THEN
    -- Tedarikçi alışı - stok artışı (IN)
    movement_type := 'IN';
    movement_reason := 'TEDARIKCI';
  ELSE
    -- Satış faturası - stok düşüşü (OUT)
    movement_type := 'OUT';
    movement_reason := 'SATIS';
  END IF;
  
  -- Stok hareketi kaydı oluştur
  -- NOT: Invoice tablosunda userId kolonu yok, bu yüzden NULL kullanıyoruz
  INSERT INTO "StockMovement" (
    "productId",
    type,
    quantity,
    "previousStock",
    "newStock",
    reason,
    "relatedTo",
    "relatedId",
    "companyId",
    "userId"
  ) VALUES (
    NEW."productId",
    movement_type,
    CASE WHEN movement_type = 'IN' THEN NEW.quantity ELSE -NEW.quantity END,
    current_stock,
    CASE 
      WHEN movement_type = 'IN' THEN current_stock + NEW.quantity 
      ELSE current_stock - NEW.quantity 
    END,
    movement_reason,
    'Invoice',
    NEW."invoiceId",
    NEW."companyId",
    NULL -- Invoice tablosunda userId kolonu yok, NULL kullanıyoruz
  );
  
  -- Stoku güncelle
  UPDATE "Product" 
  SET stock = CASE 
    WHEN movement_type = 'IN' THEN stock + NEW.quantity 
    ELSE stock - NEW.quantity 
  END,
      "updatedAt" = NOW()
  WHERE id = NEW."productId";
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_stock_on_invoice_item ON "InvoiceItem";
CREATE TRIGGER trigger_update_stock_on_invoice_item
  AFTER INSERT ON "InvoiceItem"
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_on_invoice_item();

-- 7. Trigger: InvoiceItem silindiğinde stok geri ekle
CREATE OR REPLACE FUNCTION restore_stock_on_invoice_item_delete()
RETURNS TRIGGER AS $$
DECLARE
  current_stock DECIMAL(10, 2);
BEGIN
  -- Mevcut stoku al
  SELECT stock INTO current_stock FROM "Product" WHERE id = OLD."productId";
  
  -- Stok hareketi kaydı oluştur (iade)
  INSERT INTO "StockMovement" (
    "productId",
    type,
    quantity,
    "previousStock",
    "newStock",
    reason,
    "relatedTo",
    "relatedId",
    "companyId"
  ) VALUES (
    OLD."productId",
    'RETURN',
    OLD.quantity, -- Pozitif (geri ekleme)
    current_stock,
    current_stock + OLD.quantity,
    'IADE',
    'Invoice',
    OLD."invoiceId",
    OLD."companyId"
  );
  
  -- Stoku geri ekle
  UPDATE "Product" 
  SET stock = stock + OLD.quantity,
      "updatedAt" = NOW()
  WHERE id = OLD."productId";
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_restore_stock_on_invoice_item_delete ON "InvoiceItem";
CREATE TRIGGER trigger_restore_stock_on_invoice_item_delete
  AFTER DELETE ON "InvoiceItem"
  FOR EACH ROW
  EXECUTE FUNCTION restore_stock_on_invoice_item_delete();

