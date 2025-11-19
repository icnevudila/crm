-- CRM V3 - Lead Scoring Otomasyonu
-- Deal oluşturulduğunda/güncellendiğinde otomatik priority score hesaplama
-- Next.js 15 + Supabase uyumlu

-- ============================================
-- 1. TRIGGER FUNCTION: Auto Calculate Priority Score
-- ============================================
CREATE OR REPLACE FUNCTION auto_calculate_priority_score()
RETURNS TRIGGER AS $$
DECLARE
  calculated_score DECIMAL(10, 2);
BEGIN
  -- Sadece OPEN durumundaki deal'lar için hesapla
  IF NEW.status = 'OPEN' THEN
    -- calculate_priority_score fonksiyonunu kullan
    SELECT calculate_priority_score(NEW.id, NEW."companyId")
    INTO calculated_score;
    
    -- Priority score'u güncelle
    NEW."priorityScore" := COALESCE(calculated_score, 0);
    
    -- Priority score > 100 ise isPriority = true
    IF calculated_score > 100 THEN
      NEW."isPriority" := true;
    ELSE
      NEW."isPriority" := false;
    END IF;
  ELSE
    -- CLOSED durumundaki deal'lar için priority score'u sıfırla
    NEW."priorityScore" := 0;
    NEW."isPriority" := false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. TRIGGER: Deal INSERT/UPDATE
-- ============================================
DROP TRIGGER IF EXISTS trigger_auto_calculate_priority_score ON "Deal";
CREATE TRIGGER trigger_auto_calculate_priority_score
  BEFORE INSERT OR UPDATE ON "Deal"
  FOR EACH ROW
  EXECUTE FUNCTION auto_calculate_priority_score();

-- ============================================
-- 3. COMMENT'LER
-- ============================================
COMMENT ON FUNCTION auto_calculate_priority_score() IS 'Deal oluşturulduğunda/güncellendiğinde otomatik priority score hesaplar';
COMMENT ON TRIGGER trigger_auto_calculate_priority_score ON "Deal" IS 'Deal INSERT/UPDATE olduğunda otomatik priority score hesaplama trigger''ı';

-- ============================================
-- 4. MEVCUT DEAL'LAR İÇİN SCORE HESAPLAMA (OPSİYONEL)
-- ============================================
-- Mevcut OPEN durumundaki deal'lar için priority score hesapla
UPDATE "Deal"
SET "priorityScore" = calculate_priority_score(id, "companyId"),
    "isPriority" = (calculate_priority_score(id, "companyId") > 100)
WHERE status = 'OPEN'
  AND ("priorityScore" IS NULL OR "priorityScore" = 0);

-- ✅ Migration tamamlandı!


























