-- Enterprise Release Migration
-- Full Enterprise Release için veritabanı değişiklikleri
-- Next.js 15 + Supabase + Prisma uyumlu

-- 1. Company tablosuna city ve status alanları ekle
ALTER TABLE "Company" 
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'POTANSİYEL';

-- 2. Product tablosuna brand ve imageUrl alanları ekle
ALTER TABLE "Product" 
ADD COLUMN IF NOT EXISTS brand VARCHAR(100),
ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;

-- 3. Quote tablosuna discountPercent ve revisionNo alanları ekle
ALTER TABLE "Quote" 
ADD COLUMN IF NOT EXISTS "discountPercent" DECIMAL(5, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "revisionNo" INTEGER DEFAULT 1;

-- 4. Finance tablosuna approved ve dueDate alanları ekle
ALTER TABLE "Finance" 
ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "dueDate" DATE;

-- 5. Index'ler (performans için)
CREATE INDEX IF NOT EXISTS idx_company_status ON "Company"("status");
CREATE INDEX IF NOT EXISTS idx_company_city ON "Company"("city");
CREATE INDEX IF NOT EXISTS idx_product_brand ON "Product"("brand");
CREATE INDEX IF NOT EXISTS idx_quote_revision ON "Quote"("revisionNo");
CREATE INDEX IF NOT EXISTS idx_finance_approved ON "Finance"("approved");
CREATE INDEX IF NOT EXISTS idx_finance_due_date ON "Finance"("dueDate");

-- 6. Trigger 1: Teklif onaylandığında seri numarası kontrolü
CREATE OR REPLACE FUNCTION enforce_quote_serial()
RETURNS TRIGGER AS $$
BEGIN
  -- Teklif onaylandığında (status='APPROVED') seri numarası boşsa hata ver
  IF NEW.status = 'APPROVED' AND (OLD.status IS NULL OR OLD.status != 'APPROVED') THEN
    -- Seri numarası kontrolü (invoiceNumber veya serialNumber alanı varsa kontrol et)
    IF (NEW."invoiceNumber" IS NULL OR NEW."invoiceNumber" = '') AND 
       (NEW."serialNumber" IS NULL OR NEW."serialNumber" = '') THEN
      RAISE EXCEPTION 'Teklif onaylanmadan önce seri numarası girilmelidir';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_enforce_quote_serial ON "Quote";
CREATE TRIGGER trigger_enforce_quote_serial
  BEFORE UPDATE ON "Quote"
  FOR EACH ROW
  WHEN (NEW.status = 'APPROVED' AND (OLD.status IS NULL OR OLD.status != 'APPROVED'))
  EXECUTE FUNCTION enforce_quote_serial();

-- 7. Trigger 2: Firma duplicate kontrolü (taxOffice + taxNumber)
CREATE OR REPLACE FUNCTION prevent_duplicate_company()
RETURNS TRIGGER AS $$
DECLARE
  existing_count INTEGER;
BEGIN
  -- taxOffice ve taxNumber eşleşiyorsa duplicate kontrolü
  IF NEW."taxOffice" IS NOT NULL AND NEW."taxNumber" IS NOT NULL THEN
    SELECT COUNT(*) INTO existing_count
    FROM "Company"
    WHERE "taxOffice" = NEW."taxOffice"
      AND "taxNumber" = NEW."taxNumber"
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);
    
    IF existing_count > 0 THEN
      RAISE EXCEPTION 'Bu vergi dairesi ve vergi numarasına sahip bir firma zaten mevcut. Duplicate kayıt oluşturulamaz.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_duplicate_company ON "Company";
CREATE TRIGGER trigger_prevent_duplicate_company
  BEFORE INSERT OR UPDATE ON "Company"
  FOR EACH ROW
  EXECUTE FUNCTION prevent_duplicate_company();

-- 8. Company tablosuna taxOffice ve taxNumber alanları ekle (eğer yoksa)
ALTER TABLE "Company" 
ADD COLUMN IF NOT EXISTS "taxOffice" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "taxNumber" VARCHAR(50);

-- 9. Index'ler (duplicate kontrolü için)
CREATE INDEX IF NOT EXISTS idx_company_tax_office_number ON "Company"("taxOffice", "taxNumber");

-- 10. Quote tablosuna serialNumber alanı ekle (eğer yoksa)
ALTER TABLE "Quote" 
ADD COLUMN IF NOT EXISTS "serialNumber" VARCHAR(50);

-- 11. Index (seri numarası için)
CREATE INDEX IF NOT EXISTS idx_quote_serial_number ON "Quote"("serialNumber");

-- 12. Kontrol sorguları
SELECT 
  'Company.city kolonu eklendi' as message,
  COUNT(*) as column_exists
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'Company'
  AND column_name = 'city';

SELECT 
  'Company.status kolonu eklendi' as message,
  COUNT(*) as column_exists
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'Company'
  AND column_name = 'status';

SELECT 
  'Product.brand kolonu eklendi' as message,
  COUNT(*) as column_exists
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'Product'
  AND column_name = 'brand';

SELECT 
  'Quote.discountPercent kolonu eklendi' as message,
  COUNT(*) as column_exists
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'Quote'
  AND column_name = 'discountPercent';

SELECT 
  'Quote.revisionNo kolonu eklendi' as message,
  COUNT(*) as column_exists
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'Quote'
  AND column_name = 'revisionNo';

SELECT 
  'Finance.approved kolonu eklendi' as message,
  COUNT(*) as column_exists
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'Finance'
  AND column_name = 'approved';

SELECT 
  'Finance.dueDate kolonu eklendi' as message,
  COUNT(*) as column_exists
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'Finance'
  AND column_name = 'dueDate';

SELECT 
  'Trigger enforce_quote_serial oluşturuldu' as message,
  COUNT(*) as trigger_exists
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name = 'trigger_enforce_quote_serial';

SELECT 
  'Trigger prevent_duplicate_company oluşturuldu' as message,
  COUNT(*) as trigger_exists
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name = 'trigger_prevent_duplicate_company';

