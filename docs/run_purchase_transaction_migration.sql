-- PurchaseTransaction Tablosu Oluşturma Scripti
-- Bu script'i Supabase Dashboard > SQL Editor'de çalıştırın

-- 0. Product tablosuna incomingQuantity (beklenen giriş) alanı ekle
ALTER TABLE "Product" 
ADD COLUMN IF NOT EXISTS "incomingQuantity" DECIMAL(10, 2) DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_product_incoming ON "Product"("incomingQuantity");

-- 1. PurchaseTransaction tablosu oluştur
CREATE TABLE IF NOT EXISTS "PurchaseTransaction" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "invoiceId" UUID NOT NULL REFERENCES "Invoice"(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'DRAFT', -- DRAFT (Taslak), APPROVED (Onaylı), CANCELLED (İptal)
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("invoiceId") -- Bir fatura için sadece bir alış işlemi olabilir
);

-- 2. Invoice tablosuna purchaseShipmentId alanı ekle (eğer yoksa)
ALTER TABLE "Invoice" 
ADD COLUMN IF NOT EXISTS "purchaseShipmentId" UUID REFERENCES "PurchaseTransaction"(id) ON DELETE SET NULL;

-- 3. Index'ler (performans için)
CREATE INDEX IF NOT EXISTS idx_purchasetransaction_invoice ON "PurchaseTransaction"("invoiceId");
CREATE INDEX IF NOT EXISTS idx_purchasetransaction_company ON "PurchaseTransaction"("companyId");
CREATE INDEX IF NOT EXISTS idx_purchasetransaction_status ON "PurchaseTransaction"("status");
CREATE INDEX IF NOT EXISTS idx_invoice_purchase_shipment ON "Invoice"("purchaseShipmentId");

-- 4. RLS Policies
DROP POLICY IF EXISTS "purchasetransaction_company_isolation" ON "PurchaseTransaction";
CREATE POLICY "purchasetransaction_company_isolation" ON "PurchaseTransaction"
  FOR ALL
  USING (true) -- API seviyesinde companyId kontrolü yapılıyor
  WITH CHECK (true);

-- 5. InvoiceItem silindiğinde incomingQuantity geri ekle (trigger)
CREATE OR REPLACE FUNCTION restore_incoming_on_invoice_item_delete()
RETURNS TRIGGER AS $$
DECLARE
  invoice_type VARCHAR(20);
BEGIN
  -- Invoice'ın tipini kontrol et (sadece PURCHASE ise incomingQuantity güncelle)
  SELECT "invoiceType" INTO invoice_type FROM "Invoice" WHERE id = OLD."invoiceId" LIMIT 1;
  
  -- Alış faturası (PURCHASE) ise incomingQuantity geri ekle
  IF invoice_type = 'PURCHASE' THEN
    UPDATE "Product" 
    SET "incomingQuantity" = GREATEST(0, "incomingQuantity" - OLD.quantity),
        "updatedAt" = NOW()
    WHERE id = OLD."productId";
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_restore_incoming_on_invoice_item_delete ON "InvoiceItem";
CREATE TRIGGER trigger_restore_incoming_on_invoice_item_delete
  AFTER DELETE ON "InvoiceItem"
  FOR EACH ROW
  EXECUTE FUNCTION restore_incoming_on_invoice_item_delete();

-- 6. Trigger: Alış işlemi onaylandığında stok artışı
CREATE OR REPLACE FUNCTION update_stock_on_purchase_approval()
RETURNS TRIGGER AS $$
DECLARE
  invoice_id UUID;
  invoice_item RECORD;
  current_stock DECIMAL(10, 2);
  current_incoming DECIMAL(10, 2);
BEGIN
  -- Sadece durum "APPROVED" olduğunda çalışsın
  IF NEW.status = 'APPROVED' AND (OLD.status IS NULL OR OLD.status != 'APPROVED') THEN
    -- Invoice ID'yi al
    invoice_id := NEW."invoiceId";
    
    IF invoice_id IS NOT NULL THEN
      -- InvoiceItem'ları çek
      FOR invoice_item IN 
        SELECT "productId", quantity
        FROM "InvoiceItem"
        WHERE "invoiceId" = invoice_id
      LOOP
        -- Mevcut stok ve incoming miktarı al
        SELECT COALESCE(stock, 0), COALESCE("incomingQuantity", 0) INTO current_stock, current_incoming
        FROM "Product"
        WHERE id = invoice_item."productId";
        
        -- Stok hareketi kaydı oluştur (giriş)
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
          invoice_item."productId",
          'IN',
          invoice_item.quantity,
          current_stock,
          current_stock + invoice_item.quantity,
          'TEDARIKCI',
          'PurchaseTransaction',
          NEW.id,
          NEW."companyId",
          NULL -- PurchaseTransaction tablosunda userId kolonu yok
        );
        
        -- Stoku artır ve incomingQuantity azalt
        UPDATE "Product" 
        SET stock = current_stock + invoice_item.quantity,
            "incomingQuantity" = GREATEST(0, current_incoming - invoice_item.quantity),
            "updatedAt" = NOW()
        WHERE id = invoice_item."productId";
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_stock_on_purchase_approval ON "PurchaseTransaction";
CREATE TRIGGER trigger_update_stock_on_purchase_approval
  AFTER UPDATE ON "PurchaseTransaction"
  FOR EACH ROW
  WHEN (NEW.status = 'APPROVED' AND (OLD.status IS NULL OR OLD.status != 'APPROVED'))
  EXECUTE FUNCTION update_stock_on_purchase_approval();

-- 7. Kontrol sorguları
SELECT 
  'PurchaseTransaction tablosu oluşturuldu' as message,
  COUNT(*) as table_exists
FROM information_schema.tables
WHERE table_name = 'PurchaseTransaction';

SELECT 
  'Invoice.purchaseShipmentId kolonu eklendi' as message,
  COUNT(*) as column_exists
FROM information_schema.columns
WHERE table_name = 'Invoice' 
  AND column_name = 'purchaseShipmentId';

SELECT 
  'Product.incomingQuantity kolonu eklendi' as message,
  COUNT(*) as column_exists
FROM information_schema.columns
WHERE table_name = 'Product' 
  AND column_name = 'incomingQuantity';

