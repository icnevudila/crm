-- =====================================================
-- FIX: Competitor tablosuna averagePrice kolonu ekle
-- =====================================================
-- Sorun: Competitor tablosunda averagePrice kolonu eksik olabilir
-- Çözüm: Kolonu ekle (eğer yoksa)

DO $$ 
BEGIN
  -- averagePrice kolonu ekle (eğer yoksa)
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Competitor' 
    AND column_name = 'averagePrice'
  ) THEN
    ALTER TABLE "Competitor" 
    ADD COLUMN "averagePrice" DECIMAL(15,2);
    
    RAISE NOTICE '✅ averagePrice kolonu eklendi';
  ELSE
    RAISE NOTICE 'ℹ️  averagePrice kolonu zaten var';
  END IF;

  -- marketShare kolonu ekle (eğer yoksa)
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Competitor' 
    AND column_name = 'marketShare'
  ) THEN
    ALTER TABLE "Competitor" 
    ADD COLUMN "marketShare" DECIMAL(5,2);
    
    RAISE NOTICE '✅ marketShare kolonu eklendi';
  ELSE
    RAISE NOTICE 'ℹ️  marketShare kolonu zaten var';
  END IF;

  -- pricingStrategy kolonu ekle (eğer yoksa)
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Competitor' 
    AND column_name = 'pricingStrategy'
  ) THEN
    ALTER TABLE "Competitor" 
    ADD COLUMN "pricingStrategy" TEXT;
    
    RAISE NOTICE '✅ pricingStrategy kolonu eklendi';
  ELSE
    RAISE NOTICE 'ℹ️  pricingStrategy kolonu zaten var';
  END IF;

  -- strengths kolonu TEXT[] formatına dönüştür (eğer TEXT ise)
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Competitor' 
    AND column_name = 'strengths'
    AND data_type = 'text'
    AND udt_name = 'text'
  ) THEN
    -- TEXT kolonunu TEXT[]'a dönüştür
    ALTER TABLE "Competitor" 
    ALTER COLUMN "strengths" TYPE TEXT[] USING CASE 
      WHEN "strengths" IS NULL THEN NULL
      WHEN "strengths" = '' THEN ARRAY[]::TEXT[]
      ELSE ARRAY["strengths"]::TEXT[]
    END;
    
    RAISE NOTICE '✅ strengths kolonu TEXT[] formatına dönüştürüldü';
  ELSIF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Competitor' 
    AND column_name = 'strengths'
    AND udt_name = '_text'
  ) THEN
    RAISE NOTICE 'ℹ️  strengths kolonu zaten TEXT[] formatında';
  END IF;

  -- weaknesses kolonu TEXT[] formatına dönüştür (eğer TEXT ise)
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Competitor' 
    AND column_name = 'weaknesses'
    AND data_type = 'text'
    AND udt_name = 'text'
  ) THEN
    -- TEXT kolonunu TEXT[]'a dönüştür
    ALTER TABLE "Competitor" 
    ALTER COLUMN "weaknesses" TYPE TEXT[] USING CASE 
      WHEN "weaknesses" IS NULL THEN NULL
      WHEN "weaknesses" = '' THEN ARRAY[]::TEXT[]
      ELSE ARRAY["weaknesses"]::TEXT[]
    END;
    
    RAISE NOTICE '✅ weaknesses kolonu TEXT[] formatına dönüştürüldü';
  ELSIF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Competitor' 
    AND column_name = 'weaknesses'
    AND udt_name = '_text'
  ) THEN
    RAISE NOTICE 'ℹ️  weaknesses kolonu zaten TEXT[] formatında';
  END IF;

  RAISE NOTICE '=====================================================';
  RAISE NOTICE '✅ Competitor tablosu düzeltmeleri tamamlandı!';
  RAISE NOTICE '=====================================================';
END $$;

