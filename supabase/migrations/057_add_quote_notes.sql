-- Add notes column to Quote table
-- Quote tablosuna notes kolonu ekle - reddetme sebebi için

-- notes kolonu ekle (eğer yoksa)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Quote' 
    AND column_name = 'notes'
  ) THEN
    ALTER TABLE "Quote" 
    ADD COLUMN "notes" TEXT;
    
    COMMENT ON COLUMN "Quote"."notes" IS 'Teklif notları - reddetme sebebi ve diğer notlar için kullanılır';
  END IF;
END $$;

