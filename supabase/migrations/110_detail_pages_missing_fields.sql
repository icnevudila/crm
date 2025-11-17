-- Detail Pages Missing Fields Migration
-- Detay sayfalarında gösterilmesi gereken eksik alanları ekler
-- Next.js 15 + Supabase uyumlu

BEGIN;

-- ============================================
-- 1. CUSTOMER TABLOSU - notes kolonu kontrolü
-- ============================================
-- schema-extension.sql'de var ama migration'da olmayabilir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Customer' AND column_name = 'notes'
  ) THEN
    ALTER TABLE "Customer" ADD COLUMN notes TEXT;
    COMMENT ON COLUMN "Customer"."notes" IS 'Müşteri notları ve açıklamaları';
  END IF;
END $$;

-- ============================================
-- 2. DEAL TABLOSU - description kolonu kontrolü
-- ============================================
-- schema-extension.sql'de var ama migration'da olmayabilir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Deal' AND column_name = 'description'
  ) THEN
    ALTER TABLE "Deal" ADD COLUMN description TEXT;
    COMMENT ON COLUMN "Deal"."description" IS 'Fırsat açıklaması ve detayları';
  END IF;
END $$;

-- ============================================
-- 3. QUOTE TABLOSU - validUntil, discount, taxRate kolonları kontrolü
-- ============================================
-- schema-extension.sql'de var ama migration'da olmayabilir

-- validUntil
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Quote' AND column_name = 'validUntil'
  ) THEN
    ALTER TABLE "Quote" ADD COLUMN "validUntil" DATE;
    COMMENT ON COLUMN "Quote"."validUntil" IS 'Teklif geçerlilik tarihi';
  END IF;
END $$;

-- discount
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Quote' AND column_name = 'discount'
  ) THEN
    ALTER TABLE "Quote" ADD COLUMN discount DECIMAL(10, 2) DEFAULT 0;
    COMMENT ON COLUMN "Quote"."discount" IS 'Teklif indirim tutarı';
  END IF;
END $$;

-- taxRate
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Quote' AND column_name = 'taxRate'
  ) THEN
    ALTER TABLE "Quote" ADD COLUMN "taxRate" DECIMAL(5, 2) DEFAULT 18;
    COMMENT ON COLUMN "Quote"."taxRate" IS 'KDV oranı (varsayılan %18)';
  END IF;
END $$;

-- ============================================
-- 4. INVOICE TABLOSU - paymentDate, taxRate, notes kolonları kontrolü
-- ============================================

-- paymentDate (schema-extension.sql'de var)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Invoice' AND column_name = 'paymentDate'
  ) THEN
    ALTER TABLE "Invoice" ADD COLUMN "paymentDate" DATE;
    COMMENT ON COLUMN "Invoice"."paymentDate" IS 'Ödeme tarihi';
  END IF;
END $$;

-- taxRate (schema-extension.sql'de var)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Invoice' AND column_name = 'taxRate'
  ) THEN
    ALTER TABLE "Invoice" ADD COLUMN "taxRate" DECIMAL(5, 2) DEFAULT 18;
    COMMENT ON COLUMN "Invoice"."taxRate" IS 'KDV oranı (varsayılan %18)';
  END IF;
END $$;

-- notes (Invoice tablosunda olmayabilir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Invoice' AND column_name = 'notes'
  ) THEN
    ALTER TABLE "Invoice" ADD COLUMN notes TEXT;
    COMMENT ON COLUMN "Invoice"."notes" IS 'Fatura notları ve açıklamaları';
  END IF;
END $$;

-- ============================================
-- 5. INDEX'LER (Performans için)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_customer_notes ON "Customer"(notes) WHERE notes IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deal_description ON "Deal"(description) WHERE description IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quote_valid_until ON "Quote"("validUntil") WHERE "validUntil" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoice_payment_date ON "Invoice"("paymentDate") WHERE "paymentDate" IS NOT NULL;

COMMIT;













