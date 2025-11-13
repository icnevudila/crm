-- Internal Firms Integration Migration
-- Kurum içi firmalar (CustomerCompany) ile iş nesneleri arasındaki ilişkileri kurar
-- Next.js 15 + Supabase + Prisma uyumlu

BEGIN;

-- 1. CustomerCompany tablosuna foreign key kolonları ekle (eğer yoksa)
-- Deal tablosuna customerCompanyId ekle
ALTER TABLE "Deal" 
ADD COLUMN IF NOT EXISTS "customerCompanyId" UUID REFERENCES "CustomerCompany"(id) ON DELETE SET NULL;

-- Quote tablosuna customerCompanyId ekle
ALTER TABLE "Quote" 
ADD COLUMN IF NOT EXISTS "customerCompanyId" UUID REFERENCES "CustomerCompany"(id) ON DELETE SET NULL;

-- Invoice tablosuna customerCompanyId ekle
ALTER TABLE "Invoice" 
ADD COLUMN IF NOT EXISTS "customerCompanyId" UUID REFERENCES "CustomerCompany"(id) ON DELETE SET NULL;

-- Shipment tablosuna customerCompanyId ekle
ALTER TABLE "Shipment" 
ADD COLUMN IF NOT EXISTS "customerCompanyId" UUID REFERENCES "CustomerCompany"(id) ON DELETE SET NULL;

-- Finance tablosuna customerCompanyId ekle
ALTER TABLE "Finance" 
ADD COLUMN IF NOT EXISTS "customerCompanyId" UUID REFERENCES "CustomerCompany"(id) ON DELETE SET NULL;

-- Meeting tablosuna customerCompanyId ekle (eğer Meeting tablosu varsa)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Meeting') THEN
    ALTER TABLE "Meeting" 
    ADD COLUMN IF NOT EXISTS "customerCompanyId" UUID REFERENCES "CustomerCompany"(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Task tablosuna customerCompanyId ekle (eğer Task tablosu varsa)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Task') THEN
    ALTER TABLE "Task" 
    ADD COLUMN IF NOT EXISTS "customerCompanyId" UUID REFERENCES "CustomerCompany"(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 2. Index'ler (performans için)
CREATE INDEX IF NOT EXISTS idx_deal_customercompany ON "Deal"("customerCompanyId");
CREATE INDEX IF NOT EXISTS idx_quote_customercompany ON "Quote"("customerCompanyId");
CREATE INDEX IF NOT EXISTS idx_invoice_customercompany ON "Invoice"("customerCompanyId");
CREATE INDEX IF NOT EXISTS idx_shipment_customercompany ON "Shipment"("customerCompanyId");
CREATE INDEX IF NOT EXISTS idx_finance_customercompany ON "Finance"("customerCompanyId");

-- Meeting ve Task için index'ler (eğer tablolar varsa)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Meeting') THEN
    CREATE INDEX IF NOT EXISTS idx_meeting_customercompany ON "Meeting"("customerCompanyId");
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Task') THEN
    CREATE INDEX IF NOT EXISTS idx_task_customercompany ON "Task"("customerCompanyId");
  END IF;
END $$;

-- 3. RLS Policy'ler (CustomerCompany zaten RLS aktif, sadece kontrol)
-- CustomerCompany tablosu zaten companyId bazlı RLS'e sahip
-- Yeni eklenen foreign key'ler otomatik olarak RLS kurallarına uyar

COMMIT;



















