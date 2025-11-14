-- Deal Status Kolonu Kontrol ve Düzeltme Migration
-- Migration: 073_check_deal_status_column.sql
-- Tarih: 2024

-- Bu migration, Deal tablosunda status kolonunun varlığını kontrol eder ve yoksa ekler

-- 1. Status kolonunu kontrol et ve yoksa ekle
DO $$
BEGIN
  -- status kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Deal' 
    AND column_name = 'status'
  ) THEN
    -- Kolonu ekle (NULL olabilir önce)
    ALTER TABLE "Deal" ADD COLUMN "status" VARCHAR(20);
    
    -- Mevcut kayıtlar için varsayılan değer ata
    -- WON veya LOST stage'inde olanlar CLOSED, diğerleri OPEN
    UPDATE "Deal" 
    SET "status" = CASE 
      WHEN stage IN ('WON', 'LOST') THEN 'CLOSED'
      ELSE 'OPEN'
    END;
    
    -- NOT NULL constraint ekle (varsayılan değer atandıktan sonra)
    ALTER TABLE "Deal" ALTER COLUMN "status" SET NOT NULL;
    ALTER TABLE "Deal" ALTER COLUMN "status" SET DEFAULT 'OPEN';
    
    RAISE NOTICE '✅ Deal.status kolonu eklendi ve mevcut kayıtlar güncellendi';
  ELSE
    RAISE NOTICE '✅ Deal.status kolonu zaten mevcut';
  END IF;
END $$;

-- 2. CHECK constraint ekle (sadece OPEN veya CLOSED değerleri kabul et)
DO $$
BEGIN
  -- Mevcut constraint'i sil
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public'
    AND table_name = 'Deal' 
    AND constraint_name = 'check_deal_status'
  ) THEN
    ALTER TABLE "Deal" DROP CONSTRAINT check_deal_status;
  END IF;
  
  -- Yeni constraint ekle
  ALTER TABLE "Deal" 
  ADD CONSTRAINT check_deal_status 
  CHECK ("status" IN ('OPEN', 'CLOSED'));
  
  RAISE NOTICE '✅ Deal.status CHECK constraint eklendi';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '⚠️ CHECK constraint eklenirken hata: %', SQLERRM;
END $$;

-- 3. Index ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_deal_status ON "Deal"("status");
CREATE INDEX IF NOT EXISTS idx_deal_status_company ON "Deal"("status", "companyId");

-- 4. Migration sonucunu kontrol et ve göster
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'Deal' 
      AND column_name = 'status'
    ) THEN '✅ Deal.status kolonu başarıyla eklendi veya zaten mevcut'
    ELSE '❌ Deal.status kolonu eklenemedi - Lütfen manuel olarak kontrol edin'
  END AS migration_result,
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
  ) AS closed_count;



