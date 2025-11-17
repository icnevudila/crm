-- ============================================
-- 109_partial_payment_and_stock_reservation.sql
-- Kısmi Ödeme Sistemi ve Stok Rezervasyonu
-- ============================================
-- Bu migration şunları yapar:
-- 1. Payment tablosu oluşturur (kısmi ödemeler için)
-- 2. Invoice tablosuna paidAmount kolonu ekler
-- 3. Payment oluşturulduğunda otomatik PAID durumu kontrolü
-- 4. Payment oluşturulduğunda otomatik Finance kaydı
-- 5. StockReservation tablosu oluşturur (Quote için stok rezervasyonu)
-- 6. Quote SENT → Stok rezervasyonu oluştur
-- 7. Quote ACCEPTED → Rezervasyon kalıcı stok düşümüne dönüşür
-- 8. Quote REJECTED/EXPIRED → Rezervasyon kaldır
-- ============================================

-- ============================================
-- PART 1: KISMI ÖDEME SİSTEMİ
-- ============================================

-- 1. Payment tablosu oluştur
CREATE TABLE IF NOT EXISTS "Payment" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "invoiceId" UUID NOT NULL REFERENCES "Invoice"(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
  "paymentDate" DATE NOT NULL DEFAULT CURRENT_DATE,
  "paymentMethod" VARCHAR(50) DEFAULT 'CASH', -- CASH, BANK_TRANSFER, CREDIT_CARD, CHECK, OTHER
  notes TEXT,
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdBy" UUID REFERENCES "User"(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_payment_invoice ON "Payment"("invoiceId");
CREATE INDEX IF NOT EXISTS idx_payment_company ON "Payment"("companyId");
CREATE INDEX IF NOT EXISTS idx_payment_date ON "Payment"("paymentDate");

-- 2. Invoice tablosuna paidAmount kolonu ekle
ALTER TABLE "Invoice" 
ADD COLUMN IF NOT EXISTS "paidAmount" DECIMAL(15, 2) DEFAULT 0 CHECK ("paidAmount" >= 0);

-- Index ekle
CREATE INDEX IF NOT EXISTS idx_invoice_paid_amount ON "Invoice"("paidAmount");

-- 3. Payment oluşturulduğunda Invoice.paidAmount'ı güncelle ve PAID durumu kontrolü yap
CREATE OR REPLACE FUNCTION update_invoice_paid_amount()
RETURNS TRIGGER AS $$
DECLARE
  invoice_total DECIMAL(15, 2);
  total_paid DECIMAL(15, 2);
BEGIN
  -- Invoice toplam tutarını al
  SELECT COALESCE(total, 0) INTO invoice_total
  FROM "Invoice"
  WHERE id = NEW."invoiceId";
  
  -- Toplam ödenen tutarı hesapla
  SELECT COALESCE(SUM(amount), 0) INTO total_paid
  FROM "Payment"
  WHERE "invoiceId" = NEW."invoiceId";
  
  -- Invoice.paidAmount'ı güncelle
  UPDATE "Invoice"
  SET "paidAmount" = total_paid,
      "updatedAt" = NOW()
  WHERE id = NEW."invoiceId";
  
  -- Tüm tutar ödendiyse otomatik PAID durumuna geç
  IF total_paid >= invoice_total AND invoice_total > 0 THEN
    UPDATE "Invoice"
    SET status = 'PAID',
        "updatedAt" = NOW()
    WHERE id = NEW."invoiceId"
      AND status != 'PAID'; -- Zaten PAID ise güncelleme yapma
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_invoice_paid_amount ON "Payment";
CREATE TRIGGER trigger_update_invoice_paid_amount
  AFTER INSERT OR UPDATE OR DELETE ON "Payment"
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_paid_amount();

-- 4. Payment silindiğinde Invoice.paidAmount'ı güncelle
CREATE OR REPLACE FUNCTION update_invoice_paid_amount_on_delete()
RETURNS TRIGGER AS $$
DECLARE
  total_paid DECIMAL(15, 2);
  invoice_total DECIMAL(15, 2);
BEGIN
  -- Toplam ödenen tutarı hesapla (silinen kayıt hariç)
  SELECT COALESCE(SUM(amount), 0) INTO total_paid
  FROM "Payment"
  WHERE "invoiceId" = OLD."invoiceId";
  
  -- Invoice toplam tutarını al
  SELECT COALESCE(total, 0) INTO invoice_total
  FROM "Invoice"
  WHERE id = OLD."invoiceId";
  
  -- Invoice.paidAmount'ı güncelle
  UPDATE "Invoice"
  SET "paidAmount" = total_paid,
      "updatedAt" = NOW()
  WHERE id = OLD."invoiceId";
  
  -- Tüm tutar ödenmemişse PAID durumundan çıkar (SENT veya OVERDUE'ye dön)
  IF total_paid < invoice_total AND invoice_total > 0 THEN
    UPDATE "Invoice"
    SET status = CASE 
      WHEN status = 'PAID' THEN 'SENT' -- PAID ise SENT'e dön
      ELSE status -- Diğer durumlarda olduğu gibi kalsın
    END,
    "updatedAt" = NOW()
    WHERE id = OLD."invoiceId";
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger zaten yukarıda oluşturuldu, sadece DELETE için de çalışacak

-- 5. Payment oluşturulduğunda otomatik Finance kaydı oluştur
CREATE OR REPLACE FUNCTION create_finance_on_payment()
RETURNS TRIGGER AS $$
DECLARE
  invoice_record RECORD;
BEGIN
  -- Invoice bilgilerini al
  SELECT 
    "companyId",
    "customerCompanyId",
    total,
    title
  INTO invoice_record
  FROM "Invoice"
  WHERE id = NEW."invoiceId";
  
  -- Finance tablosu var mı kontrol et
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'Finance'
  ) THEN
    -- Finance kaydı oluştur (INCOME - gelir)
    INSERT INTO "Finance" (
      type,
      amount,
      category,
      description,
      "relatedTo",
      "relatedEntityType",
      "relatedEntityId",
      "customerCompanyId",
      "companyId",
      "paymentMethod",
      "paymentDate",
      "createdAt"
    ) VALUES (
      'INCOME',
      NEW.amount,
      'PAYMENT',
      'Ödeme: ' || COALESCE(invoice_record.title, 'Fatura #' || NEW."invoiceId"::TEXT) || ' - ' || NEW.amount || ' TRY',
      'Payment',
      'Payment',
      NEW.id,
      invoice_record."customerCompanyId",
      invoice_record."companyId",
      NEW."paymentMethod",
      NEW."paymentDate",
      NOW()
    )
    ON CONFLICT DO NOTHING; -- Duplicate önleme
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_finance_on_payment ON "Payment";
CREATE TRIGGER trigger_create_finance_on_payment
  AFTER INSERT ON "Payment"
  FOR EACH ROW
  EXECUTE FUNCTION create_finance_on_payment();

-- 6. RLS Policies
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;

-- Policy: Kullanıcılar sadece kendi companyId'lerindeki payment'ları görebilir
CREATE POLICY "Users can view payments in their company"
  ON "Payment" FOR SELECT
  USING (
    "companyId" IN (
      SELECT "companyId" FROM "User" WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid() 
      AND role = 'SUPER_ADMIN'
    )
  );

-- Policy: Kullanıcılar sadece kendi companyId'lerinde payment oluşturabilir
CREATE POLICY "Users can create payments in their company"
  ON "Payment" FOR INSERT
  WITH CHECK (
    "companyId" IN (
      SELECT "companyId" FROM "User" WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid() 
      AND role = 'SUPER_ADMIN'
    )
  );

-- Policy: Kullanıcılar sadece kendi companyId'lerindeki payment'ları güncelleyebilir
CREATE POLICY "Users can update payments in their company"
  ON "Payment" FOR UPDATE
  USING (
    "companyId" IN (
      SELECT "companyId" FROM "User" WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid() 
      AND role = 'SUPER_ADMIN'
    )
  );

-- Policy: Kullanıcılar sadece kendi companyId'lerindeki payment'ları silebilir
CREATE POLICY "Users can delete payments in their company"
  ON "Payment" FOR DELETE
  USING (
    "companyId" IN (
      SELECT "companyId" FROM "User" WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid() 
      AND role = 'SUPER_ADMIN'
    )
  );

-- ============================================
-- PART 2: STOK REZERVASYONU SİSTEMİ
-- ============================================

-- 1. StockReservation tablosu oluştur
CREATE TABLE IF NOT EXISTS "StockReservation" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "quoteId" UUID NOT NULL REFERENCES "Quote"(id) ON DELETE CASCADE,
  "productId" UUID NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  quantity DECIMAL(10, 2) NOT NULL CHECK (quantity > 0),
  "expiresAt" TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, CONFIRMED, CANCELLED
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("quoteId", "productId") -- Aynı quote ve product için tek rezervasyon
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_stock_reservation_quote ON "StockReservation"("quoteId");
CREATE INDEX IF NOT EXISTS idx_stock_reservation_product ON "StockReservation"("productId");
CREATE INDEX IF NOT EXISTS idx_stock_reservation_status ON "StockReservation"(status);
CREATE INDEX IF NOT EXISTS idx_stock_reservation_expires ON "StockReservation"("expiresAt");

-- 2. Product tablosunda reservedQuantity kolonu zaten var (008_reserved_stock_system.sql'de eklenmiş)
-- Kontrol edelim ve yoksa ekleyelim
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Product' 
    AND column_name = 'reservedQuantity'
  ) THEN
    ALTER TABLE "Product" 
    ADD COLUMN "reservedQuantity" DECIMAL(10, 2) DEFAULT 0;
  END IF;
END $$;

-- 3. Quote SENT → Stok rezervasyonu oluştur
CREATE OR REPLACE FUNCTION create_stock_reservation_on_quote_sent()
RETURNS TRIGGER AS $$
DECLARE
  quote_item RECORD;
  valid_until TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Quote SENT durumuna geçtiğinde
  IF NEW.status = 'SENT' AND (OLD.status IS NULL OR OLD.status != 'SENT') THEN
    
    -- validUntil tarihini al (varsa), yoksa 30 gün sonra
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'Quote' 
      AND column_name = 'validUntil'
    ) THEN
      SELECT COALESCE("validUntil", NOW() + INTERVAL '30 days') INTO valid_until
      FROM "Quote"
      WHERE id = NEW.id;
    ELSE
      valid_until := NOW() + INTERVAL '30 days';
    END IF;
    
    -- QuoteItem tablosu var mı kontrol et
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'QuoteItem'
    ) THEN
      -- QuoteItem'ları çek ve rezervasyon oluştur
      FOR quote_item IN 
        SELECT "productId", quantity
        FROM "QuoteItem"
        WHERE "quoteId" = NEW.id
      LOOP
        -- Rezervasyon oluştur
        INSERT INTO "StockReservation" (
          "quoteId",
          "productId",
          quantity,
          "expiresAt",
          status,
          "companyId"
        ) VALUES (
          NEW.id,
          quote_item."productId",
          quote_item.quantity,
          valid_until,
          'ACTIVE',
          NEW."companyId"
        )
        ON CONFLICT ("quoteId", "productId") DO UPDATE
        SET quantity = EXCLUDED.quantity,
            "expiresAt" = EXCLUDED."expiresAt",
            status = 'ACTIVE',
            "updatedAt" = NOW();
        
        -- Product.reservedQuantity'yi güncelle
        UPDATE "Product"
        SET "reservedQuantity" = COALESCE("reservedQuantity", 0) + quote_item.quantity,
            "updatedAt" = NOW()
        WHERE id = quote_item."productId";
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_stock_reservation_on_quote_sent ON "Quote";
CREATE TRIGGER trigger_create_stock_reservation_on_quote_sent
  AFTER UPDATE OF status ON "Quote"
  FOR EACH ROW
  WHEN (NEW.status = 'SENT' AND (OLD.status IS NULL OR OLD.status != 'SENT'))
  EXECUTE FUNCTION create_stock_reservation_on_quote_sent();

-- 4. Quote ACCEPTED → Rezervasyon kalıcı stok düşümüne dönüşür
CREATE OR REPLACE FUNCTION convert_reservation_to_stock_deduction()
RETURNS TRIGGER AS $$
DECLARE
  reservation_record RECORD;
BEGIN
  -- Quote ACCEPTED durumuna geçtiğinde
  IF NEW.status = 'ACCEPTED' AND (OLD.status IS NULL OR OLD.status != 'ACCEPTED') THEN
    
    -- StockReservation tablosu var mı kontrol et
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'StockReservation'
    ) THEN
      -- Rezervasyonları çek ve stok düşümü yap
      FOR reservation_record IN 
        SELECT "productId", quantity
        FROM "StockReservation"
        WHERE "quoteId" = NEW.id
          AND status = 'ACTIVE'
      LOOP
        -- Stoku düş ve rezerve miktarı azalt
        UPDATE "Product"
        SET stock = GREATEST(0, COALESCE(stock, 0) - reservation_record.quantity),
            "reservedQuantity" = GREATEST(0, COALESCE("reservedQuantity", 0) - reservation_record.quantity),
            "updatedAt" = NOW()
        WHERE id = reservation_record."productId";
        
        -- Rezervasyon durumunu CONFIRMED olarak işaretle
        UPDATE "StockReservation"
        SET status = 'CONFIRMED',
            "updatedAt" = NOW()
        WHERE "quoteId" = NEW.id
          AND "productId" = reservation_record."productId";
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_convert_reservation_to_stock_deduction ON "Quote";
CREATE TRIGGER trigger_convert_reservation_to_stock_deduction
  AFTER UPDATE OF status ON "Quote"
  FOR EACH ROW
  WHEN (NEW.status = 'ACCEPTED' AND (OLD.status IS NULL OR OLD.status != 'ACCEPTED'))
  EXECUTE FUNCTION convert_reservation_to_stock_deduction();

-- 5. Quote REJECTED/EXPIRED → Rezervasyon kaldır
CREATE OR REPLACE FUNCTION cancel_stock_reservation_on_quote_rejected()
RETURNS TRIGGER AS $$
DECLARE
  reservation_record RECORD;
BEGIN
  -- Quote REJECTED veya EXPIRED durumuna geçtiğinde
  IF (NEW.status = 'REJECTED' OR NEW.status = 'EXPIRED') 
     AND (OLD.status IS NULL OR (OLD.status != 'REJECTED' AND OLD.status != 'EXPIRED')) THEN
    
    -- StockReservation tablosu var mı kontrol et
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'StockReservation'
    ) THEN
      -- Rezervasyonları çek ve iptal et
      FOR reservation_record IN 
        SELECT "productId", quantity
        FROM "StockReservation"
        WHERE "quoteId" = NEW.id
          AND status = 'ACTIVE'
      LOOP
        -- Product.reservedQuantity'yi azalt
        UPDATE "Product"
        SET "reservedQuantity" = GREATEST(0, COALESCE("reservedQuantity", 0) - reservation_record.quantity),
            "updatedAt" = NOW()
        WHERE id = reservation_record."productId";
        
        -- Rezervasyon durumunu CANCELLED olarak işaretle
        UPDATE "StockReservation"
        SET status = 'CANCELLED',
            "updatedAt" = NOW()
        WHERE "quoteId" = NEW.id
          AND "productId" = reservation_record."productId";
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_cancel_stock_reservation_on_quote_rejected ON "Quote";
CREATE TRIGGER trigger_cancel_stock_reservation_on_quote_rejected
  AFTER UPDATE OF status ON "Quote"
  FOR EACH ROW
  WHEN ((NEW.status = 'REJECTED' OR NEW.status = 'EXPIRED') 
        AND (OLD.status IS NULL OR (OLD.status != 'REJECTED' AND OLD.status != 'EXPIRED')))
  EXECUTE FUNCTION cancel_stock_reservation_on_quote_rejected();

-- 6. RLS Policies for StockReservation
ALTER TABLE "StockReservation" ENABLE ROW LEVEL SECURITY;

-- Policy: Kullanıcılar sadece kendi companyId'lerindeki rezervasyonları görebilir
CREATE POLICY "Users can view stock reservations in their company"
  ON "StockReservation" FOR SELECT
  USING (
    "companyId" IN (
      SELECT "companyId" FROM "User" WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid() 
      AND role = 'SUPER_ADMIN'
    )
  );

-- Policy: Kullanıcılar sadece kendi companyId'lerinde rezervasyon oluşturabilir
CREATE POLICY "Users can create stock reservations in their company"
  ON "StockReservation" FOR INSERT
  WITH CHECK (
    "companyId" IN (
      SELECT "companyId" FROM "User" WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid() 
      AND role = 'SUPER_ADMIN'
    )
  );

-- Policy: Kullanıcılar sadece kendi companyId'lerindeki rezervasyonları güncelleyebilir
CREATE POLICY "Users can update stock reservations in their company"
  ON "StockReservation" FOR UPDATE
  USING (
    "companyId" IN (
      SELECT "companyId" FROM "User" WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid() 
      AND role = 'SUPER_ADMIN'
    )
  );

-- Policy: Kullanıcılar sadece kendi companyId'lerindeki rezervasyonları silebilir
CREATE POLICY "Users can delete stock reservations in their company"
  ON "StockReservation" FOR DELETE
  USING (
    "companyId" IN (
      SELECT "companyId" FROM "User" WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid() 
      AND role = 'SUPER_ADMIN'
    )
  );

-- ============================================
-- MIGRATION TAMAMLANDI
-- ============================================

-- Kontrol sorguları
SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns
WHERE table_name = 'Invoice' 
  AND column_name = 'paidAmount';

SELECT 
  column_name, 
  data_type
FROM information_schema.columns
WHERE table_name = 'Product' 
  AND column_name = 'reservedQuantity';

SELECT 
  table_name
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name IN ('Payment', 'StockReservation');













