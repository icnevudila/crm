-- CRM V3 - Foreign Key Constraints
-- Eksik foreign key constraint'lerini ekler
-- Invoice, Quote, Deal → CustomerCompany ilişkileri
-- Invoice → Vendor ilişkisi

-- ============================================
-- 1. INVOICE → CUSTOMERCOMPANY İLİŞKİSİ
-- ============================================
-- Eğer customerCompanyId kolonu varsa ve constraint yoksa ekle
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Invoice' 
    AND column_name = 'customerCompanyId'
  ) THEN
    -- Constraint yoksa ekle
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_schema = 'public' 
      AND table_name = 'Invoice' 
      AND constraint_name = 'fk_invoice_customercompany'
    ) THEN
      ALTER TABLE "Invoice" 
      ADD CONSTRAINT fk_invoice_customercompany 
      FOREIGN KEY ("customerCompanyId") 
      REFERENCES "CustomerCompany"(id) 
      ON DELETE SET NULL;
      
      -- Index ekle (performans için)
      CREATE INDEX IF NOT EXISTS idx_invoice_customercompany ON "Invoice"("customerCompanyId") WHERE "customerCompanyId" IS NOT NULL;
    END IF;
  END IF;
END $$;

-- ============================================
-- 2. QUOTE → CUSTOMERCOMPANY İLİŞKİSİ
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Quote' 
    AND column_name = 'customerCompanyId'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_schema = 'public' 
      AND table_name = 'Quote' 
      AND constraint_name = 'fk_quote_customercompany'
    ) THEN
      ALTER TABLE "Quote" 
      ADD CONSTRAINT fk_quote_customercompany 
      FOREIGN KEY ("customerCompanyId") 
      REFERENCES "CustomerCompany"(id) 
      ON DELETE SET NULL;
      
      -- Index ekle (performans için)
      CREATE INDEX IF NOT EXISTS idx_quote_customercompany ON "Quote"("customerCompanyId") WHERE "customerCompanyId" IS NOT NULL;
    END IF;
  END IF;
END $$;

-- ============================================
-- 3. DEAL → CUSTOMERCOMPANY İLİŞKİSİ
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Deal' 
    AND column_name = 'customerCompanyId'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_schema = 'public' 
      AND table_name = 'Deal' 
      AND constraint_name = 'fk_deal_customercompany'
    ) THEN
      ALTER TABLE "Deal" 
      ADD CONSTRAINT fk_deal_customercompany 
      FOREIGN KEY ("customerCompanyId") 
      REFERENCES "CustomerCompany"(id) 
      ON DELETE SET NULL;
      
      -- Index ekle (performans için)
      CREATE INDEX IF NOT EXISTS idx_deal_customercompany ON "Deal"("customerCompanyId") WHERE "customerCompanyId" IS NOT NULL;
    END IF;
  END IF;
END $$;

-- ============================================
-- 4. INVOICE → VENDOR İLİŞKİSİ
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Invoice' 
    AND column_name = 'vendorId'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_schema = 'public' 
      AND table_name = 'Invoice' 
      AND constraint_name = 'fk_invoice_vendor'
    ) THEN
      ALTER TABLE "Invoice" 
      ADD CONSTRAINT fk_invoice_vendor 
      FOREIGN KEY ("vendorId") 
      REFERENCES "Vendor"(id) 
      ON DELETE SET NULL;
      
      -- Index ekle (performans için)
      CREATE INDEX IF NOT EXISTS idx_invoice_vendor ON "Invoice"("vendorId") WHERE "vendorId" IS NOT NULL;
    END IF;
  END IF;
END $$;

-- ============================================
-- 5. COMMENT'LER
-- ============================================
COMMENT ON CONSTRAINT fk_invoice_customercompany ON "Invoice" IS 'Invoice → CustomerCompany foreign key constraint';
COMMENT ON CONSTRAINT fk_quote_customercompany ON "Quote" IS 'Quote → CustomerCompany foreign key constraint';
COMMENT ON CONSTRAINT fk_deal_customercompany ON "Deal" IS 'Deal → CustomerCompany foreign key constraint';
COMMENT ON CONSTRAINT fk_invoice_vendor ON "Invoice" IS 'Invoice → Vendor foreign key constraint';










