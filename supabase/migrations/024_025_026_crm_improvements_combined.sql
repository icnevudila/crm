-- ============================================
-- CRM V3 - Tüm CRM İyileştirmeleri (Birleştirilmiş)
-- Lead Scoring, Lead Source Tracking, Email Templates
-- Next.js 15 + Supabase uyumlu
-- ============================================

-- ============================================
-- BÖLÜM 1: LEAD SOURCE TRACKING
-- ============================================

-- Deal tablosuna leadSource kolonu ekle
ALTER TABLE "Deal" 
ADD COLUMN IF NOT EXISTS "leadSource" VARCHAR(50);

-- Index ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_deal_lead_source ON "Deal"("leadSource");

-- Comment ekle
COMMENT ON COLUMN "Deal"."leadSource" IS 'Potansiyel müşterinin kaynağı (WEB, EMAIL, PHONE, REFERRAL, SOCIAL, OTHER)';

-- ============================================
-- BÖLÜM 2: EMAIL TEMPLATES SİSTEMİ
-- ============================================

-- EmailTemplate tablosu oluştur
CREATE TABLE IF NOT EXISTS "EmailTemplate" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  body TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  category VARCHAR(50),
  "isActive" BOOLEAN DEFAULT true,
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index'ler (performans için)
CREATE INDEX IF NOT EXISTS idx_email_template_company ON "EmailTemplate"("companyId");
CREATE INDEX IF NOT EXISTS idx_email_template_category ON "EmailTemplate"("category");
CREATE INDEX IF NOT EXISTS idx_email_template_active ON "EmailTemplate"("isActive");

-- CHECK constraint (category değerleri)
ALTER TABLE "EmailTemplate"
DROP CONSTRAINT IF EXISTS check_email_template_category;

ALTER TABLE "EmailTemplate"
ADD CONSTRAINT check_email_template_category 
CHECK (category IN ('QUOTE', 'INVOICE', 'DEAL', 'CUSTOMER', 'GENERAL'));

-- Comment'ler
COMMENT ON TABLE "EmailTemplate" IS 'E-posta şablonları tablosu';
COMMENT ON COLUMN "EmailTemplate".name IS 'Template adı';
COMMENT ON COLUMN "EmailTemplate".subject IS 'E-posta konusu (template değişkenleri kullanılabilir)';
COMMENT ON COLUMN "EmailTemplate".body IS 'E-posta içeriği (template değişkenleri kullanılabilir: {{variableName}})';
COMMENT ON COLUMN "EmailTemplate".variables IS 'Template değişkenleri listesi (JSON array)';
COMMENT ON COLUMN "EmailTemplate".category IS 'Template kategorisi (QUOTE, INVOICE, DEAL, CUSTOMER, GENERAL)';

-- ============================================
-- BÖLÜM 3: LEAD SCORING OTOMASYONU
-- ============================================

-- calculate_priority_score fonksiyonunu güvenli hale getir (Invoice.customerId kontrolü)
CREATE OR REPLACE FUNCTION calculate_priority_score(deal_id UUID, company_id UUID)
RETURNS DECIMAL(10, 2) AS $$
DECLARE
  deal_value DECIMAL(15, 2);
  customer_score DECIMAL(10, 2);
  win_probability INTEGER;
  days_since_creation INTEGER;
  priority_score DECIMAL(10, 2);
  deal_customer_id UUID;
  invoice_has_customer_id BOOLEAN;
BEGIN
  -- Deal bilgilerini al
  SELECT value, "winProbability", "customerId", EXTRACT(DAY FROM (NOW() - "createdAt"))::INTEGER
  INTO deal_value, win_probability, deal_customer_id, days_since_creation
  FROM "Deal"
  WHERE id = deal_id AND "companyId" = company_id;
  
  -- Deal bulunamadıysa 0 döndür
  IF deal_value IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Invoice tablosunda customerId kolonu var mı kontrol et
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'Invoice' 
    AND column_name = 'customerId'
  ) INTO invoice_has_customer_id;
  
  -- Müşteri skoru hesapla
  customer_score := 1; -- Varsayılan değer
  
  IF invoice_has_customer_id AND deal_customer_id IS NOT NULL THEN
    -- Invoice tablosunda customerId varsa ve deal'da customerId varsa hesapla
    -- NOT: Invoice tablosunda total kolonu yok, totalAmount kullanıyoruz
    SELECT COALESCE(SUM(COALESCE("totalAmount", 0)) / 10000, 1)
    INTO customer_score
    FROM "Invoice"
    WHERE "customerId" = deal_customer_id
      AND "companyId" = company_id
      AND status = 'PAID';
  ELSIF deal_customer_id IS NOT NULL THEN
    -- Invoice tablosunda customerId yoksa ama deal'da customerId varsa
    -- Quote üzerinden Invoice'a ulaşmaya çalış
    -- NOT: Invoice tablosunda total kolonu yok, totalAmount kullanıyoruz
    SELECT COALESCE(SUM(COALESCE(i."totalAmount", 0)) / 10000, 1)
    INTO customer_score
    FROM "Invoice" i
    INNER JOIN "Quote" q ON i."quoteId" = q.id
    INNER JOIN "Deal" d ON q."dealId" = d.id
    WHERE d."customerId" = deal_customer_id
      AND i."companyId" = company_id
      AND i.status = 'PAID';
  END IF;
  
  -- Müşteri skorunu 1-10 arasına sınırla
  customer_score := LEAST(10, GREATEST(1, customer_score));
  
  -- Olasılık (winProbability yoksa stage'e göre)
  IF win_probability IS NULL THEN
    -- Stage'e göre varsayılan olasılık
    SELECT CASE 
      WHEN stage = 'LEAD' THEN 10
      WHEN stage = 'CONTACTED' THEN 30
      WHEN stage = 'PROPOSAL' THEN 50
      WHEN stage = 'NEGOTIATION' THEN 70
      WHEN stage = 'WON' THEN 100
      WHEN stage = 'LOST' THEN 0
      ELSE 50
    END
    INTO win_probability
    FROM "Deal"
    WHERE id = deal_id;
    
    -- Hala NULL ise varsayılan 50
    IF win_probability IS NULL THEN
      win_probability := 50;
    END IF;
  END IF;
  
  -- Gün sayısı (minimum 1)
  days_since_creation := GREATEST(1, COALESCE(days_since_creation, 1));
  
  -- Deal değeri (minimum 0)
  deal_value := COALESCE(deal_value, 0);
  
  -- Puan hesapla: (teklif_tutarı × müşteri_skoru × olasılık) / gün_sayısı
  priority_score := (deal_value * customer_score * (win_probability::DECIMAL / 100)) / days_since_creation;
  
  RETURN COALESCE(priority_score, 0);
END;
$$ LANGUAGE plpgsql;

-- Comment ekle
COMMENT ON FUNCTION calculate_priority_score(UUID, UUID) IS 'Deal için öncelik skorunu hesaplar. (Değer × Müşteri Skoru × Kazanma Olasılığı) / Geçen Gün Sayısı';

-- Trigger function: Auto Calculate Priority Score
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

-- Comment ekle
COMMENT ON FUNCTION auto_calculate_priority_score() IS 'Deal oluşturulduğunda/güncellendiğinde otomatik priority score hesaplar';

-- Trigger: Deal INSERT/UPDATE
DROP TRIGGER IF EXISTS trigger_auto_calculate_priority_score ON "Deal";
CREATE TRIGGER trigger_auto_calculate_priority_score
  BEFORE INSERT OR UPDATE ON "Deal"
  FOR EACH ROW
  EXECUTE FUNCTION auto_calculate_priority_score();

-- Comment ekle
COMMENT ON TRIGGER trigger_auto_calculate_priority_score ON "Deal" IS 'Deal INSERT/UPDATE olduğunda otomatik priority score hesaplama trigger''ı';

-- ============================================
-- BÖLÜM 4: MEVCUT DEAL'LAR İÇİN SCORE HESAPLAMA (OPSİYONEL)
-- ============================================

-- Mevcut OPEN durumundaki deal'lar için priority score hesapla
-- NOT: Bu işlem büyük tablolarda yavaş olabilir, gerekirse ayrı çalıştırılabilir
DO $$
DECLARE
  deal_record RECORD;
  calculated_score DECIMAL(10, 2);
BEGIN
  FOR deal_record IN 
    SELECT id, "companyId" 
    FROM "Deal" 
    WHERE status = 'OPEN' 
      AND ("priorityScore" IS NULL OR "priorityScore" = 0)
    LIMIT 1000 -- Güvenlik için limit
  LOOP
    SELECT calculate_priority_score(deal_record.id, deal_record."companyId")
    INTO calculated_score;
    
    UPDATE "Deal"
    SET 
      "priorityScore" = COALESCE(calculated_score, 0),
      "isPriority" = (COALESCE(calculated_score, 0) > 100)
    WHERE id = deal_record.id;
  END LOOP;
END $$;

-- ============================================
-- BÖLÜM 5: YENİ MODÜLLERİ SİSTEME EKLE
-- ============================================

-- Yeni modülleri Module tablosuna ekle
INSERT INTO "Module" (code, name, description, icon, "displayOrder", "isActive") VALUES
  ('lead-scoring', 'Lead Scoring', 'Potansiyel müşteri puanlama sistemi', 'TrendingUp', 11, true),
  ('email-templates', 'E-posta Şablonları', 'E-posta şablonları yönetimi', 'Mail', 12, true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  "displayOrder" = EXCLUDED."displayOrder",
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = NOW();

-- ============================================
-- BÖLÜM 6: SUPER_ADMIN'E YENİ MODÜLLER İÇİN OTOMATİK YETKİ VER
-- ============================================

-- SUPER_ADMIN rolüne yeni modüller için otomatik tam yetki ver
INSERT INTO "RolePermission" ("roleId", "moduleId", "canCreate", "canRead", "canUpdate", "canDelete")
SELECT 
  r.id,
  m.id,
  true, -- canCreate
  true, -- canRead
  true, -- canUpdate
  true  -- canDelete
FROM "Role" r
CROSS JOIN "Module" m
WHERE r.code = 'SUPER_ADMIN'
  AND m.code IN ('lead-scoring', 'email-templates')
ON CONFLICT ("roleId", "moduleId") DO UPDATE SET
  "canCreate" = true,
  "canRead" = true,
  "canUpdate" = true,
  "canDelete" = true,
  "updatedAt" = NOW();

-- ============================================
-- BÖLÜM 7: ADMIN ROLÜNE YENİ MODÜLLER İÇİN OTOMATİK YETKİ VER
-- ============================================

-- ADMIN rolüne yeni modüller için otomatik tam yetki ver (kendi şirketi için)
INSERT INTO "RolePermission" ("roleId", "moduleId", "canCreate", "canRead", "canUpdate", "canDelete")
SELECT 
  r.id,
  m.id,
  true, -- canCreate
  true, -- canRead
  true, -- canUpdate
  true  -- canDelete
FROM "Role" r
CROSS JOIN "Module" m
WHERE r.code = 'ADMIN'
  AND m.code IN ('lead-scoring', 'email-templates')
ON CONFLICT ("roleId", "moduleId") DO UPDATE SET
  "canCreate" = true,
  "canRead" = true,
  "canUpdate" = true,
  "canDelete" = true,
  "updatedAt" = NOW();

-- ============================================
-- BÖLÜM 8: TÜM ŞİRKETLERE YENİ MODÜLLER İÇİN OTOMATİK İZİN VER
-- ============================================

-- Tüm aktif şirketlere yeni modüller için otomatik izin ver
INSERT INTO "CompanyModulePermission" ("companyId", "moduleId", enabled)
SELECT 
  c.id,
  m.id,
  true
FROM "Company" c
CROSS JOIN "Module" m
WHERE m.code IN ('lead-scoring', 'email-templates')
  AND m."isActive" = true
  AND c.status = 'ACTIVE'
ON CONFLICT ("companyId", "moduleId") DO UPDATE SET
  enabled = true,
  "updatedAt" = NOW();

-- ============================================
-- MİGRATİON TAMAMLANDI!
-- ============================================

-- ✅ Tüm CRM iyileştirmeleri başarıyla uygulandı:
-- ✅ Lead Source Tracking (Deal.leadSource)
-- ✅ Email Templates Sistemi (EmailTemplate tablosu)
-- ✅ Lead Scoring Otomasyonu (otomatik priority score hesaplama)
-- ✅ Yeni modüller sisteme eklendi (lead-scoring, email-templates)
-- ✅ SUPER_ADMIN'e yeni modüller için otomatik tam yetki verildi
-- ✅ ADMIN rolüne yeni modüller için otomatik tam yetki verildi
-- ✅ Tüm şirketlere yeni modüller için otomatik izin verildi





