-- Sevkiyat Onay Trigger Kontrolü ve Düzeltme Scripti
-- Bu script'i Supabase Dashboard > SQL Editor'de çalıştırın

-- 1. Trigger'ın var olup olmadığını kontrol et
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'trigger_update_stock_on_shipment_approval'
  AND event_object_table = 'Shipment';

-- 2. Trigger fonksiyonunun var olup olmadığını kontrol et
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'update_stock_on_shipment_approval'
  AND routine_type = 'FUNCTION';

-- 3. StockMovement tablosunun var olup olmadığını kontrol et
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'StockMovement'
ORDER BY ordinal_position;

-- 4. Eğer trigger yoksa, migration'ı çalıştır
-- NOT: Aşağıdaki kod sadece trigger yoksa çalışacak

-- Önce fonksiyonu oluştur (eğer yoksa)
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

-- Trigger'ı oluştur (eğer yoksa)
DROP TRIGGER IF EXISTS trigger_update_stock_on_shipment_approval ON "Shipment";
CREATE TRIGGER trigger_update_stock_on_shipment_approval
  AFTER UPDATE ON "Shipment"
  FOR EACH ROW
  WHEN (NEW.status = 'APPROVED' AND (OLD.status IS NULL OR OLD.status != 'APPROVED'))
  EXECUTE FUNCTION update_stock_on_shipment_approval();

-- 5. Test: Son onaylanan sevkiyatları kontrol et
SELECT 
  s.id,
  s.status,
  s."invoiceId",
  s."createdAt",
  COUNT(sm.id) as stock_movement_count
FROM "Shipment" s
LEFT JOIN "StockMovement" sm ON sm."relatedId" = s.id AND sm."relatedTo" = 'Shipment'
WHERE s.status = 'APPROVED'
GROUP BY s.id, s.status, s."invoiceId", s."createdAt"
ORDER BY s."createdAt" DESC
LIMIT 10;

-- 6. Son stok hareketlerini kontrol et
SELECT 
  sm.id,
  sm.type,
  sm.quantity,
  sm.reason,
  sm."relatedTo",
  sm."relatedId",
  sm."createdAt",
  p.name as product_name
FROM "StockMovement" sm
LEFT JOIN "Product" p ON p.id = sm."productId"
WHERE sm."relatedTo" = 'Shipment'
ORDER BY sm."createdAt" DESC
LIMIT 20;

