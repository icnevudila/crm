-- ============================================
-- 119_document_version_control.sql
-- Document Version Control Sistemi
-- ============================================

-- Document tablosuna version ve parentDocumentId kolonları ekle
ALTER TABLE "Document" 
ADD COLUMN IF NOT EXISTS "version" INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS "parentDocumentId" UUID REFERENCES "Document"(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS "isLatestVersion" BOOLEAN DEFAULT true;

-- Version için index
CREATE INDEX IF NOT EXISTS idx_document_version ON "Document"("parentDocumentId", "version");
CREATE INDEX IF NOT EXISTS idx_document_latest_version ON "Document"("parentDocumentId", "isLatestVersion") WHERE "isLatestVersion" = true;

-- Mevcut dokümanlar için version = 1 ve isLatestVersion = true set et
UPDATE "Document" 
SET "version" = 1, "isLatestVersion" = true 
WHERE "version" IS NULL;

-- Otomatik version arttırma fonksiyonu
CREATE OR REPLACE FUNCTION increment_document_version()
RETURNS TRIGGER AS $$
DECLARE
  max_version INTEGER;
  parent_id UUID;
BEGIN
  -- Eğer parentDocumentId varsa, parent'ın version'ını al
  IF NEW."parentDocumentId" IS NOT NULL THEN
    parent_id := NEW."parentDocumentId";
    
    -- Parent'ın en yüksek version'ını bul
    SELECT COALESCE(MAX("version"), 0) INTO max_version
    FROM "Document"
    WHERE "parentDocumentId" = parent_id OR id = parent_id;
    
    -- Yeni version = max_version + 1
    NEW."version" := max_version + 1;
    
    -- Eski versiyonları isLatestVersion = false yap
    UPDATE "Document"
    SET "isLatestVersion" = false
    WHERE ("parentDocumentId" = parent_id OR id = parent_id)
      AND id != NEW.id;
    
    -- Yeni versiyon isLatestVersion = true
    NEW."isLatestVersion" := true;
  ELSE
    -- Yeni doküman, version = 1
    NEW."version" := 1;
    NEW."isLatestVersion" := true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger oluştur
DROP TRIGGER IF EXISTS trigger_increment_document_version ON "Document";
CREATE TRIGGER trigger_increment_document_version
  BEFORE INSERT ON "Document"
  FOR EACH ROW
  EXECUTE FUNCTION increment_document_version();

COMMENT ON COLUMN "Document"."version" IS 'Doküman versiyon numarası (1, 2, 3, ...)';
COMMENT ON COLUMN "Document"."parentDocumentId" IS 'Ana doküman ID (ilk versiyon NULL, sonraki versiyonlar parent ID)';
COMMENT ON COLUMN "Document"."isLatestVersion" IS 'Bu doküman en son versiyon mu?';

-- ============================================
-- Migration tamamlandı!
-- ============================================





