-- Tüm Invoice Sorunlarını Tek Seferde Düzelt
-- Bu SQL'i Supabase SQL Editor'de çalıştırın

-- 1. Invoice tablosuna invoiceType kolonu ekle (migration 007)
ALTER TABLE "Invoice" 
ADD COLUMN IF NOT EXISTS "invoiceType" VARCHAR(20) DEFAULT 'SALES';

-- Mevcut faturalar için type belirle (vendorId varsa PURCHASE, yoksa SALES)
UPDATE "Invoice" 
SET "invoiceType" = CASE 
  WHEN "vendorId" IS NOT NULL THEN 'PURCHASE'
  ELSE 'SALES'
END
WHERE "invoiceType" IS NULL OR "invoiceType" = 'SALES';

-- Index ekle
CREATE INDEX IF NOT EXISTS idx_invoice_type ON "Invoice"("invoiceType");

-- 2. InvoiceItem tablosunu kontrol et ve unitPrice kolonunu düzelt
-- Eğer unitprice (küçük harf) varsa, unitPrice (camelCase) olarak yeniden adlandır
DO $$
BEGIN
  -- unitprice kolonu varsa unitPrice olarak yeniden adlandır
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'InvoiceItem' 
    AND column_name = 'unitprice'
  ) THEN
    ALTER TABLE "InvoiceItem" RENAME COLUMN "unitprice" TO "unitPrice";
  END IF;
  
  -- Eğer hiç unitPrice/unitprice yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'InvoiceItem' 
    AND (column_name = 'unitPrice' OR column_name = 'unitprice')
  ) THEN
    ALTER TABLE "InvoiceItem" 
    ADD COLUMN "unitPrice" DECIMAL(15, 2) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- 3. Trigger fonksiyonunu güncelle - invoiceType kontrolü ve userId hatası düzelt
CREATE OR REPLACE FUNCTION update_stock_on_invoice_item()
RETURNS TRIGGER AS $$
DECLARE
  current_stock DECIMAL(10, 2);
  invoice_vendor_id UUID;
  invoice_type VARCHAR(20);
  movement_type VARCHAR(20);
  movement_reason VARCHAR(100);
BEGIN
  -- Mevcut stoku al
  SELECT stock INTO current_stock FROM "Product" WHERE id = NEW."productId";
  
  -- Invoice'ın type ve vendorId'sini kontrol et
  SELECT "invoiceType", "vendorId" INTO invoice_type, invoice_vendor_id 
  FROM "Invoice" 
  WHERE id = NEW."invoiceId" 
  LIMIT 1;
  
  -- invoiceType varsa onu kullan, yoksa vendorId kontrolü yap (geriye dönük uyumluluk için)
  IF invoice_type = 'PURCHASE' OR (invoice_type IS NULL AND invoice_vendor_id IS NOT NULL) THEN
    -- Alış faturası - stok artışı (IN)
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

-- 4. Trigger'ı yeniden oluştur
DROP TRIGGER IF EXISTS trigger_update_stock_on_invoice_item ON "InvoiceItem";
CREATE TRIGGER trigger_update_stock_on_invoice_item
  AFTER INSERT ON "InvoiceItem"
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_on_invoice_item();

-- 5. Sonuçları kontrol et
SELECT 
  'Invoice tablosu kolonları:' AS check_type,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'Invoice'
AND column_name IN ('invoiceType', 'vendorId')
ORDER BY column_name;

SELECT 
  'InvoiceItem tablosu kolonları:' AS check_type,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'InvoiceItem'
AND (column_name = 'unitPrice' OR column_name = 'unitprice')
ORDER BY column_name;

