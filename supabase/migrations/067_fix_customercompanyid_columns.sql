-- Fix customerCompanyId Columns Migration
-- Deal, Quote, Invoice, Shipment, Finance, Meeting, Task tablolarına customerCompanyId kolonunu ekler
-- Eğer kolon zaten varsa hata vermez (IF NOT EXISTS)
-- Next.js 15 + Supabase uyumlu

BEGIN;

-- 1. Deal tablosuna customerCompanyId ekle
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Deal' 
    AND column_name = 'customerCompanyId'
  ) THEN
    ALTER TABLE "Deal" 
    ADD COLUMN "customerCompanyId" UUID REFERENCES "CustomerCompany"(id) ON DELETE SET NULL;
    
    -- Index ekle
    CREATE INDEX IF NOT EXISTS idx_deal_customercompany ON "Deal"("customerCompanyId");
  END IF;
END $$;

-- 2. Quote tablosuna customerCompanyId ekle
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Quote' 
    AND column_name = 'customerCompanyId'
  ) THEN
    ALTER TABLE "Quote" 
    ADD COLUMN "customerCompanyId" UUID REFERENCES "CustomerCompany"(id) ON DELETE SET NULL;
    
    -- Index ekle
    CREATE INDEX IF NOT EXISTS idx_quote_customercompany ON "Quote"("customerCompanyId");
  END IF;
END $$;

-- 3. Invoice tablosuna customerCompanyId ekle
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Invoice' 
    AND column_name = 'customerCompanyId'
  ) THEN
    ALTER TABLE "Invoice" 
    ADD COLUMN "customerCompanyId" UUID REFERENCES "CustomerCompany"(id) ON DELETE SET NULL;
    
    -- Index ekle
    CREATE INDEX IF NOT EXISTS idx_invoice_customercompany ON "Invoice"("customerCompanyId");
  END IF;
END $$;

-- 4. Shipment tablosuna customerCompanyId ekle
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Shipment' 
    AND column_name = 'customerCompanyId'
  ) THEN
    ALTER TABLE "Shipment" 
    ADD COLUMN "customerCompanyId" UUID REFERENCES "CustomerCompany"(id) ON DELETE SET NULL;
    
    -- Index ekle
    CREATE INDEX IF NOT EXISTS idx_shipment_customercompany ON "Shipment"("customerCompanyId");
  END IF;
END $$;

-- 5. Finance tablosuna customerCompanyId ekle
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Finance' 
    AND column_name = 'customerCompanyId'
  ) THEN
    ALTER TABLE "Finance" 
    ADD COLUMN "customerCompanyId" UUID REFERENCES "CustomerCompany"(id) ON DELETE SET NULL;
    
    -- Index ekle
    CREATE INDEX IF NOT EXISTS idx_finance_customercompany ON "Finance"("customerCompanyId");
  END IF;
END $$;

-- 6. Meeting tablosuna customerCompanyId ekle (eğer tablo varsa)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Meeting') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'Meeting' 
      AND column_name = 'customerCompanyId'
    ) THEN
      ALTER TABLE "Meeting" 
      ADD COLUMN "customerCompanyId" UUID REFERENCES "CustomerCompany"(id) ON DELETE SET NULL;
      
      -- Index ekle
      CREATE INDEX IF NOT EXISTS idx_meeting_customercompany ON "Meeting"("customerCompanyId");
    END IF;
  END IF;
END $$;

-- 7. Task tablosuna customerCompanyId ekle (eğer tablo varsa)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Task') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'Task' 
      AND column_name = 'customerCompanyId'
    ) THEN
      ALTER TABLE "Task" 
      ADD COLUMN "customerCompanyId" UUID REFERENCES "CustomerCompany"(id) ON DELETE SET NULL;
      
      -- Index ekle
      CREATE INDEX IF NOT EXISTS idx_task_customercompany ON "Task"("customerCompanyId");
    END IF;
  END IF;
END $$;

COMMIT;

