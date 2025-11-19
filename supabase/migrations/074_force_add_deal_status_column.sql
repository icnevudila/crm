-- Deal Status Kolonu Zorla Ekleme Migration
-- Migration: 074_force_add_deal_status_column.sql
-- Tarih: 2024
-- ÖNEMLİ: Bu migration status kolonunu ZORLA ekler (varsa bile yeniden oluşturur)

-- 1. Mevcut status kolonunu ve constraint'leri temizle
DO $$
BEGIN
  -- CHECK constraint'i sil
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public'
    AND table_name = 'Deal' 
    AND constraint_name = 'check_deal_status'
  ) THEN
    ALTER TABLE "Deal" DROP CONSTRAINT check_deal_status;
    RAISE NOTICE '✅ Mevcut check_deal_status constraint silindi';
  END IF;
  
  -- Status kolonunu sil (varsa)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Deal' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE "Deal" DROP COLUMN "status";
    RAISE NOTICE '✅ Mevcut status kolonu silindi';
  END IF;
END $$;

-- 2. Status kolonunu YENİDEN ekle
ALTER TABLE "Deal" ADD COLUMN "status" VARCHAR(20) NOT NULL DEFAULT 'OPEN';

-- 3. Mevcut kayıtlar için varsayılan değer ata
UPDATE "Deal" 
SET "status" = CASE 
  WHEN stage IN ('WON', 'LOST') THEN 'CLOSED'
  ELSE 'OPEN'
END;

-- 4. CHECK constraint ekle
ALTER TABLE "Deal" 
ADD CONSTRAINT check_deal_status 
CHECK ("status" IN ('OPEN', 'CLOSED'));

-- 5. Index'leri ekle
DROP INDEX IF EXISTS idx_deal_status;
DROP INDEX IF EXISTS idx_deal_status_company;
CREATE INDEX idx_deal_status ON "Deal"("status");
CREATE INDEX idx_deal_status_company ON "Deal"("status", "companyId");

-- 6. Sonuç kontrolü
SELECT 
  '✅ Deal.status kolonu başarıyla eklendi' AS migration_result,
  (
    SELECT COUNT(*) 
    FROM "Deal" 
    WHERE "status" IS NULL
  ) AS null_status_count,
  (
    SELECT COUNT(*) 
    FROM "Deal" 
    WHERE "status" = 'OPEN'
  ) AS open_count,
  (
    SELECT COUNT(*) 
    FROM "Deal" 
    WHERE "status" = 'CLOSED'
  ) AS closed_count,
  (
    SELECT COUNT(*) 
    FROM "Deal"
  ) AS total_deals;







