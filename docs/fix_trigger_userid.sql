-- Trigger'ları düzelt - userId kolonu hatası
-- Bu SQL'i Supabase SQL Editor'de çalıştırın

-- 1. update_stock_on_invoice_item fonksiyonunu güncelle
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

