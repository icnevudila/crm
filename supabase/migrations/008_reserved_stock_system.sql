-- Reserved Stock System Migration
-- Fatura kesildiğinde stok hemen düşmesin, rezerve miktar sistemi ile beklemeye alınsın
-- Sevkiyat onaylandığında stok düşsün

-- 1. Product tablosuna reservedQuantity (rezerve_miktar) alanı ekle
ALTER TABLE "Product" 
ADD COLUMN IF NOT EXISTS "reservedQuantity" DECIMAL(10, 2) DEFAULT 0;

-- 2. Invoice tablosuna shipmentId (sevkiyat_id) alanı ekle
ALTER TABLE "Invoice" 
ADD COLUMN IF NOT EXISTS "shipmentId" UUID REFERENCES "Shipment"(id) ON DELETE SET NULL;

-- 3. Index ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_invoice_shipment ON "Invoice"("shipmentId");
CREATE INDEX IF NOT EXISTS idx_product_reserved ON "Product"("reservedQuantity");

-- 4. InvoiceItem trigger'ını KALDIR - stok hemen düşmesin
-- NOT: Bu trigger artık kullanılmayacak, rezerve miktar sistemi kullanılacak
DROP TRIGGER IF EXISTS trigger_update_stock_on_invoice_item ON "InvoiceItem";
DROP FUNCTION IF EXISTS update_stock_on_invoice_item();

-- 5. InvoiceItem silindiğinde rezerve miktarı geri ekle (trigger'ı güncelle)
CREATE OR REPLACE FUNCTION restore_reserved_on_invoice_item_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- InvoiceItem silindiğinde rezerve miktarı geri ekle
  UPDATE "Product" 
  SET "reservedQuantity" = GREATEST(0, "reservedQuantity" - OLD.quantity),
      "updatedAt" = NOW()
  WHERE id = OLD."productId";
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_restore_reserved_on_invoice_item_delete ON "InvoiceItem";
CREATE TRIGGER trigger_restore_reserved_on_invoice_item_delete
  AFTER DELETE ON "InvoiceItem"
  FOR EACH ROW
  EXECUTE FUNCTION restore_reserved_on_invoice_item_delete();

-- 6. Sevkiyat onaylandığında stok düşsün ve rezerve miktarı azalsın (trigger)
CREATE OR REPLACE FUNCTION update_stock_on_shipment_approval()
RETURNS TRIGGER AS $$
DECLARE
  invoice_id UUID;
  invoice_item RECORD;
  current_stock DECIMAL(10, 2);
  current_reserved DECIMAL(10, 2);
BEGIN
  -- Sadece durum "onayli" (APPROVED) olduğunda çalışsın
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
        -- Mevcut stok ve rezerve miktarı al
        SELECT COALESCE(stock, 0), COALESCE("reservedQuantity", 0) INTO current_stock, current_reserved
        FROM "Product"
        WHERE id = invoice_item."productId";
        
        -- Stok hareketi kaydı oluştur (çıkış)
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
          'OUT',
          -invoice_item.quantity,
          current_stock,
          GREATEST(0, current_stock - invoice_item.quantity),
          'SEVKIYAT',
          'Shipment',
          NEW.id,
          NEW."companyId",
          NULL -- Shipment tablosunda userId kolonu yok
        );
        
        -- Stoku düş ve rezerve miktarı azalt
        UPDATE "Product" 
        SET stock = GREATEST(0, stock - invoice_item.quantity),
            "reservedQuantity" = GREATEST(0, COALESCE("reservedQuantity", 0) - invoice_item.quantity),
            "updatedAt" = NOW()
        WHERE id = invoice_item."productId";
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_stock_on_shipment_approval ON "Shipment";
CREATE TRIGGER trigger_update_stock_on_shipment_approval
  AFTER UPDATE ON "Shipment"
  FOR EACH ROW
  WHEN (NEW.status = 'APPROVED' AND (OLD.status IS NULL OR OLD.status != 'APPROVED'))
  EXECUTE FUNCTION update_stock_on_shipment_approval();

-- 7. RLS Policy güncellemeleri (gerekirse)
-- Product.reservedQuantity için policy zaten var (company isolation)

-- 8. Migration tamamlandı - kontrol sorguları
SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns
WHERE table_name = 'Product' 
  AND column_name = 'reservedQuantity';

SELECT 
  column_name, 
  data_type
FROM information_schema.columns
WHERE table_name = 'Invoice' 
  AND column_name = 'shipmentId';

