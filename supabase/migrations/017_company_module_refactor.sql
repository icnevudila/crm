-- Company Module Refactor Migration
-- Firmalar modülü için veritabanı değişiklikleri
-- Next.js 15 + Supabase + Prisma uyumlu

-- 1. CustomerCompany tablosuna yeni alanlar ekle
ALTER TABLE "CustomerCompany" 
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS district VARCHAR(100),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'POT',
ADD COLUMN IF NOT EXISTS "logoUrl" TEXT,
ADD COLUMN IF NOT EXISTS "lastMeetingDate" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "taxOffice" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "taxNumber" VARCHAR(50),
ADD COLUMN IF NOT EXISTS "contactPerson" VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS "countryCode" VARCHAR(10) DEFAULT '+90';

-- 2. Status ENUM kontrolü için CHECK constraint
ALTER TABLE "CustomerCompany"
DROP CONSTRAINT IF EXISTS check_customercompany_status;

ALTER TABLE "CustomerCompany"
ADD CONSTRAINT check_customercompany_status 
CHECK (status IN ('POT', 'MUS', 'ALT', 'PAS'));

-- 3. Duplicate kontrolü için UNIQUE constraint (taxOffice + taxNumber)
-- ÖNEMLİ: NULL değerler için unique constraint çalışmaz, bu yüzden partial unique index kullanıyoruz
CREATE UNIQUE INDEX IF NOT EXISTS idx_customercompany_tax_unique 
ON "CustomerCompany"("taxOffice", "taxNumber", "companyId")
WHERE "taxOffice" IS NOT NULL AND "taxNumber" IS NOT NULL;

-- 4. Index'ler (performans için)
CREATE INDEX IF NOT EXISTS idx_customercompany_status ON "CustomerCompany"("status");
CREATE INDEX IF NOT EXISTS idx_customercompany_city ON "CustomerCompany"("city");
CREATE INDEX IF NOT EXISTS idx_customercompany_tax_office ON "CustomerCompany"("taxOffice");
CREATE INDEX IF NOT EXISTS idx_customercompany_tax_number ON "CustomerCompany"("taxNumber");
CREATE INDEX IF NOT EXISTS idx_customercompany_last_meeting ON "CustomerCompany"("lastMeetingDate");

-- 5. Trigger: Duplicate kontrolü (taxOffice + taxNumber)
CREATE OR REPLACE FUNCTION prevent_duplicate_customercompany()
RETURNS TRIGGER AS $$
BEGIN
  -- Aynı companyId içinde taxOffice + taxNumber kombinasyonu varsa hata ver
  IF NEW."taxOffice" IS NOT NULL AND NEW."taxNumber" IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM "CustomerCompany"
      WHERE "taxOffice" = NEW."taxOffice"
        AND "taxNumber" = NEW."taxNumber"
        AND "companyId" = NEW."companyId"
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
      RAISE EXCEPTION 'Bu vergi dairesi ve vergi numarası kombinasyonu zaten kayıtlı';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_duplicate_customercompany ON "CustomerCompany";
CREATE TRIGGER trigger_prevent_duplicate_customercompany
  BEFORE INSERT OR UPDATE ON "CustomerCompany"
  FOR EACH ROW
  EXECUTE FUNCTION prevent_duplicate_customercompany();

-- 6. Trigger: lastMeetingDate güncelleme (Meeting oluşturulduğunda)
CREATE OR REPLACE FUNCTION update_customercompany_last_meeting()
RETURNS TRIGGER AS $$
BEGIN
  -- Meeting oluşturulduğunda veya güncellendiğinde ilgili CustomerCompany'nin lastMeetingDate'ini güncelle
  IF NEW."customerId" IS NOT NULL THEN
    -- Customer'dan CustomerCompany'yi bul
    UPDATE "CustomerCompany"
    SET "lastMeetingDate" = NEW."meetingDate"
    WHERE id = (
      SELECT "customerCompanyId" FROM "Customer"
      WHERE id = NEW."customerId"
    )
    AND "companyId" = NEW."companyId";
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_customercompany_last_meeting ON "Meeting";
CREATE TRIGGER trigger_update_customercompany_last_meeting
  AFTER INSERT OR UPDATE ON "Meeting"
  FOR EACH ROW
  WHEN (NEW."meetingDate" IS NOT NULL)
  EXECUTE FUNCTION update_customercompany_last_meeting();

-- 7. RLS Policy güncellemeleri (mevcut policy'ler korunur, yeni alanlar için ek kontrol gerekmez)
-- RLS zaten companyId bazlı çalışıyor, yeni alanlar için ek policy gerekmez

-- 8. Varsayılan değerler
UPDATE "CustomerCompany"
SET status = 'POT'
WHERE status IS NULL;

UPDATE "CustomerCompany"
SET "countryCode" = '+90'
WHERE "countryCode" IS NULL;













