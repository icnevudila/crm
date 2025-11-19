-- Add createdBy and updatedBy columns to all tables
-- Audit trail için kullanıcı takibi - Her kayıtta kim oluşturdu ve kim güncelledi bilgisi
-- Next.js 15 + Supabase uyumlu

BEGIN;

-- ============================================
-- 1. CUSTOMER TABLOSU
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Customer') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Customer' AND column_name = 'createdBy'
    ) THEN
      ALTER TABLE "Customer" ADD COLUMN "createdBy" UUID REFERENCES "User"(id) ON DELETE SET NULL;
      COMMENT ON COLUMN "Customer"."createdBy" IS 'Kaydı oluşturan kullanıcı';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Customer' AND column_name = 'updatedBy'
    ) THEN
      ALTER TABLE "Customer" ADD COLUMN "updatedBy" UUID REFERENCES "User"(id) ON DELETE SET NULL;
      COMMENT ON COLUMN "Customer"."updatedBy" IS 'Kaydı son güncelleyen kullanıcı';
    END IF;
  END IF;
END $$;

-- ============================================
-- 2. DEAL TABLOSU
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Deal') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Deal' AND column_name = 'createdBy'
    ) THEN
      ALTER TABLE "Deal" ADD COLUMN "createdBy" UUID REFERENCES "User"(id) ON DELETE SET NULL;
      COMMENT ON COLUMN "Deal"."createdBy" IS 'Kaydı oluşturan kullanıcı';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Deal' AND column_name = 'updatedBy'
    ) THEN
      ALTER TABLE "Deal" ADD COLUMN "updatedBy" UUID REFERENCES "User"(id) ON DELETE SET NULL;
      COMMENT ON COLUMN "Deal"."updatedBy" IS 'Kaydı son güncelleyen kullanıcı';
    END IF;
  END IF;
END $$;

-- ============================================
-- 3. QUOTE TABLOSU
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Quote') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Quote' AND column_name = 'createdBy'
    ) THEN
      ALTER TABLE "Quote" ADD COLUMN "createdBy" UUID REFERENCES "User"(id) ON DELETE SET NULL;
      COMMENT ON COLUMN "Quote"."createdBy" IS 'Kaydı oluşturan kullanıcı';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Quote' AND column_name = 'updatedBy'
    ) THEN
      ALTER TABLE "Quote" ADD COLUMN "updatedBy" UUID REFERENCES "User"(id) ON DELETE SET NULL;
      COMMENT ON COLUMN "Quote"."updatedBy" IS 'Kaydı son güncelleyen kullanıcı';
    END IF;
  END IF;
END $$;

-- ============================================
-- 4. INVOICE TABLOSU
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Invoice') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Invoice' AND column_name = 'createdBy'
    ) THEN
      ALTER TABLE "Invoice" ADD COLUMN "createdBy" UUID REFERENCES "User"(id) ON DELETE SET NULL;
      COMMENT ON COLUMN "Invoice"."createdBy" IS 'Kaydı oluşturan kullanıcı';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Invoice' AND column_name = 'updatedBy'
    ) THEN
      ALTER TABLE "Invoice" ADD COLUMN "updatedBy" UUID REFERENCES "User"(id) ON DELETE SET NULL;
      COMMENT ON COLUMN "Invoice"."updatedBy" IS 'Kaydı son güncelleyen kullanıcı';
    END IF;
  END IF;
END $$;

-- ============================================
-- 5. PRODUCT TABLOSU
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Product') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Product' AND column_name = 'createdBy'
    ) THEN
      ALTER TABLE "Product" ADD COLUMN "createdBy" UUID REFERENCES "User"(id) ON DELETE SET NULL;
      COMMENT ON COLUMN "Product"."createdBy" IS 'Kaydı oluşturan kullanıcı';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Product' AND column_name = 'updatedBy'
    ) THEN
      ALTER TABLE "Product" ADD COLUMN "updatedBy" UUID REFERENCES "User"(id) ON DELETE SET NULL;
      COMMENT ON COLUMN "Product"."updatedBy" IS 'Kaydı son güncelleyen kullanıcı';
    END IF;
  END IF;
END $$;

-- ============================================
-- 6. FINANCE TABLOSU
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Finance') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Finance' AND column_name = 'createdBy'
    ) THEN
      ALTER TABLE "Finance" ADD COLUMN "createdBy" UUID REFERENCES "User"(id) ON DELETE SET NULL;
      COMMENT ON COLUMN "Finance"."createdBy" IS 'Kaydı oluşturan kullanıcı';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Finance' AND column_name = 'updatedBy'
    ) THEN
      ALTER TABLE "Finance" ADD COLUMN "updatedBy" UUID REFERENCES "User"(id) ON DELETE SET NULL;
      COMMENT ON COLUMN "Finance"."updatedBy" IS 'Kaydı son güncelleyen kullanıcı';
    END IF;
  END IF;
END $$;

-- ============================================
-- 7. TASK TABLOSU
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Task') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Task' AND column_name = 'createdBy'
    ) THEN
      ALTER TABLE "Task" ADD COLUMN "createdBy" UUID REFERENCES "User"(id) ON DELETE SET NULL;
      COMMENT ON COLUMN "Task"."createdBy" IS 'Kaydı oluşturan kullanıcı';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Task' AND column_name = 'updatedBy'
    ) THEN
      ALTER TABLE "Task" ADD COLUMN "updatedBy" UUID REFERENCES "User"(id) ON DELETE SET NULL;
      COMMENT ON COLUMN "Task"."updatedBy" IS 'Kaydı son güncelleyen kullanıcı';
    END IF;
  END IF;
END $$;

-- ============================================
-- 8. TICKET TABLOSU
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Ticket') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Ticket' AND column_name = 'createdBy'
    ) THEN
      ALTER TABLE "Ticket" ADD COLUMN "createdBy" UUID REFERENCES "User"(id) ON DELETE SET NULL;
      COMMENT ON COLUMN "Ticket"."createdBy" IS 'Kaydı oluşturan kullanıcı';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Ticket' AND column_name = 'updatedBy'
    ) THEN
      ALTER TABLE "Ticket" ADD COLUMN "updatedBy" UUID REFERENCES "User"(id) ON DELETE SET NULL;
      COMMENT ON COLUMN "Ticket"."updatedBy" IS 'Kaydı son güncelleyen kullanıcı';
    END IF;
  END IF;
END $$;

-- ============================================
-- 9. SHIPMENT TABLOSU
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Shipment') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Shipment' AND column_name = 'createdBy'
    ) THEN
      ALTER TABLE "Shipment" ADD COLUMN "createdBy" UUID REFERENCES "User"(id) ON DELETE SET NULL;
      COMMENT ON COLUMN "Shipment"."createdBy" IS 'Kaydı oluşturan kullanıcı';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Shipment' AND column_name = 'updatedBy'
    ) THEN
      ALTER TABLE "Shipment" ADD COLUMN "updatedBy" UUID REFERENCES "User"(id) ON DELETE SET NULL;
      COMMENT ON COLUMN "Shipment"."updatedBy" IS 'Kaydı son güncelleyen kullanıcı';
    END IF;
  END IF;
END $$;

-- ============================================
-- 10. CONTRACT TABLOSU (varsa)
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Contract') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Contract' AND column_name = 'createdBy'
    ) THEN
      ALTER TABLE "Contract" ADD COLUMN "createdBy" UUID REFERENCES "User"(id) ON DELETE SET NULL;
      COMMENT ON COLUMN "Contract"."createdBy" IS 'Kaydı oluşturan kullanıcı';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Contract' AND column_name = 'updatedBy'
    ) THEN
      ALTER TABLE "Contract" ADD COLUMN "updatedBy" UUID REFERENCES "User"(id) ON DELETE SET NULL;
      COMMENT ON COLUMN "Contract"."updatedBy" IS 'Kaydı son güncelleyen kullanıcı';
    END IF;
  END IF;
END $$;

-- ============================================
-- 11. MEETING TABLOSU (createdBy zaten varsa kontrol et)
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Meeting') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Meeting' AND column_name = 'createdBy'
    ) THEN
      ALTER TABLE "Meeting" ADD COLUMN "createdBy" UUID REFERENCES "User"(id) ON DELETE SET NULL;
      COMMENT ON COLUMN "Meeting"."createdBy" IS 'Kaydı oluşturan kullanıcı';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Meeting' AND column_name = 'updatedBy'
    ) THEN
      ALTER TABLE "Meeting" ADD COLUMN "updatedBy" UUID REFERENCES "User"(id) ON DELETE SET NULL;
      COMMENT ON COLUMN "Meeting"."updatedBy" IS 'Kaydı son güncelleyen kullanıcı';
    END IF;
  END IF;
END $$;

-- ============================================
-- 12. DOCUMENT TABLOSU (varsa)
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Document') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Document' AND column_name = 'createdBy'
    ) THEN
      ALTER TABLE "Document" ADD COLUMN "createdBy" UUID REFERENCES "User"(id) ON DELETE SET NULL;
      COMMENT ON COLUMN "Document"."createdBy" IS 'Kaydı oluşturan kullanıcı';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Document' AND column_name = 'updatedBy'
    ) THEN
      ALTER TABLE "Document" ADD COLUMN "updatedBy" UUID REFERENCES "User"(id) ON DELETE SET NULL;
      COMMENT ON COLUMN "Document"."updatedBy" IS 'Kaydı son güncelleyen kullanıcı';
    END IF;
  END IF;
END $$;

-- ============================================
-- 13. VENDOR TABLOSU (varsa)
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Vendor') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Vendor' AND column_name = 'createdBy'
    ) THEN
      ALTER TABLE "Vendor" ADD COLUMN "createdBy" UUID REFERENCES "User"(id) ON DELETE SET NULL;
      COMMENT ON COLUMN "Vendor"."createdBy" IS 'Kaydı oluşturan kullanıcı';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Vendor' AND column_name = 'updatedBy'
    ) THEN
      ALTER TABLE "Vendor" ADD COLUMN "updatedBy" UUID REFERENCES "User"(id) ON DELETE SET NULL;
      COMMENT ON COLUMN "Vendor"."updatedBy" IS 'Kaydı son güncelleyen kullanıcı';
    END IF;
  END IF;
END $$;

-- ============================================
-- 14. INDEX'LER (Performans için) - Sadece tablo varsa oluştur
-- ============================================
DO $$ 
BEGIN
  -- Customer index'leri
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Customer') THEN
    CREATE INDEX IF NOT EXISTS idx_customer_created_by ON "Customer"("createdBy") WHERE "createdBy" IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_customer_updated_by ON "Customer"("updatedBy") WHERE "updatedBy" IS NOT NULL;
  END IF;
  
  -- Deal index'leri
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Deal') THEN
    CREATE INDEX IF NOT EXISTS idx_deal_created_by ON "Deal"("createdBy") WHERE "createdBy" IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_deal_updated_by ON "Deal"("updatedBy") WHERE "updatedBy" IS NOT NULL;
  END IF;
  
  -- Quote index'leri
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Quote') THEN
    CREATE INDEX IF NOT EXISTS idx_quote_created_by ON "Quote"("createdBy") WHERE "createdBy" IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_quote_updated_by ON "Quote"("updatedBy") WHERE "updatedBy" IS NOT NULL;
  END IF;
  
  -- Invoice index'leri
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Invoice') THEN
    CREATE INDEX IF NOT EXISTS idx_invoice_created_by ON "Invoice"("createdBy") WHERE "createdBy" IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_invoice_updated_by ON "Invoice"("updatedBy") WHERE "updatedBy" IS NOT NULL;
  END IF;
  
  -- Product index'leri
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Product') THEN
    CREATE INDEX IF NOT EXISTS idx_product_created_by ON "Product"("createdBy") WHERE "createdBy" IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_product_updated_by ON "Product"("updatedBy") WHERE "updatedBy" IS NOT NULL;
  END IF;
END $$;

COMMIT;

