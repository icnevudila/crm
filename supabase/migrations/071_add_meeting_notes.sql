-- Meeting tablosuna notes, outcomes, actionItems, attendees kolonları ekle
-- Migration: 071_add_meeting_notes.sql
-- Tarih: 2024

-- Meeting tablosuna toplantı notları ve çıktıları için kolonlar ekle
DO $$
BEGIN
  -- notes kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Meeting' AND column_name = 'notes'
  ) THEN
    ALTER TABLE "Meeting" ADD COLUMN "notes" TEXT;
  END IF;
  
  -- outcomes kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Meeting' AND column_name = 'outcomes'
  ) THEN
    ALTER TABLE "Meeting" ADD COLUMN "outcomes" TEXT;
  END IF;
  
  -- actionItems kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Meeting' AND column_name = 'actionItems'
  ) THEN
    ALTER TABLE "Meeting" ADD COLUMN "actionItems" TEXT;
  END IF;
  
  -- attendees kolonu yoksa ekle (metin olarak katılımcılar)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Meeting' AND column_name = 'attendees'
  ) THEN
    ALTER TABLE "Meeting" ADD COLUMN "attendees" TEXT;
  END IF;
  
  -- customerCompanyId kolonu yoksa ekle (firma bazlı ilişki için)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Meeting' AND column_name = 'customerCompanyId'
  ) THEN
    ALTER TABLE "Meeting" ADD COLUMN "customerCompanyId" UUID REFERENCES "CustomerCompany"(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Index ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_meeting_customer_company ON "Meeting"("customerCompanyId");

-- Migration tamamlandı
SELECT 'Migration 071: Meeting notes kolonları eklendi' AS result;

