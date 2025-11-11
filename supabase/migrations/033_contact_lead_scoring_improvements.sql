-- ============================================
-- CRM V3 - CONTACT, LEAD SCORING & IMPROVEMENTS
-- Migration: 033
-- Tarih: 2024
-- Amaç: Contact Management, Lead Scoring, Deal Stage History, Quote Versioning, Meeting Notes
-- ============================================

-- ============================================
-- BÖLÜM 1: CONTACT MANAGEMENT
-- ============================================

-- Contact tablosu (Müşteri firma birden fazla kişi)
CREATE TABLE IF NOT EXISTS "Contact" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firstName VARCHAR(255) NOT NULL,
  lastName VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  title VARCHAR(100), -- Job title (CEO, CFO, Manager, etc.)
  role VARCHAR(50) DEFAULT 'OTHER', -- DECISION_MAKER/INFLUENCER/END_USER/GATEKEEPER/OTHER
  isPrimary BOOLEAN DEFAULT false,
  customerCompanyId UUID REFERENCES "CustomerCompany"(id) ON DELETE CASCADE,
  linkedin VARCHAR(255),
  notes TEXT,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  companyId UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contact indexes
CREATE INDEX IF NOT EXISTS idx_contact_customer_company ON "Contact"("customerCompanyId");
CREATE INDEX IF NOT EXISTS idx_contact_company ON "Contact"("companyId");
CREATE INDEX IF NOT EXISTS idx_contact_email ON "Contact"("email") WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contact_status ON "Contact"("status");

-- Contact trigger (updatedAt otomatik güncelleme)
CREATE OR REPLACE FUNCTION update_contact_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_contact_updated
BEFORE UPDATE ON "Contact"
FOR EACH ROW
EXECUTE FUNCTION update_contact_timestamp();

-- ============================================
-- BÖLÜM 2: LEAD SCORING
-- ============================================

-- LeadScore tablosu
CREATE TABLE IF NOT EXISTS "LeadScore" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customerId UUID REFERENCES "Customer"(id) ON DELETE CASCADE,
  dealId UUID REFERENCES "Deal"(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  temperature VARCHAR(20) DEFAULT 'COLD', -- HOT/WARM/COLD
  lastInteractionDate TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  engagementLevel VARCHAR(20) DEFAULT 'LOW', -- HIGH/MEDIUM/LOW
  companyId UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- LeadScore indexes
CREATE INDEX IF NOT EXISTS idx_leadscore_customer ON "LeadScore"("customerId");
CREATE INDEX IF NOT EXISTS idx_leadscore_deal ON "LeadScore"("dealId");
CREATE INDEX IF NOT EXISTS idx_leadscore_company ON "LeadScore"("companyId");
CREATE INDEX IF NOT EXISTS idx_leadscore_temperature ON "LeadScore"("temperature");

-- Lead scoring function
CREATE OR REPLACE FUNCTION calculate_lead_score(deal_id UUID)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
  deal_value DECIMAL;
  deal_stage VARCHAR;
  days_since_created INTEGER;
  quote_count INTEGER;
  meeting_count INTEGER;
BEGIN
  -- Deal bilgilerini al
  SELECT value, stage, EXTRACT(DAY FROM NOW() - "createdAt")
  INTO deal_value, deal_stage, days_since_created
  FROM "Deal"
  WHERE id = deal_id;
  
  -- Value-based scoring (30 puan max)
  IF deal_value > 100000 THEN 
    score := score + 30;
  ELSIF deal_value > 50000 THEN 
    score := score + 25;
  ELSIF deal_value > 10000 THEN 
    score := score + 20;
  ELSE 
    score := score + 10;
  END IF;
  
  -- Stage-based scoring (40 puan max)
  CASE deal_stage
    WHEN 'NEGOTIATION' THEN score := score + 40;
    WHEN 'PROPOSAL' THEN score := score + 30;
    WHEN 'QUALIFIED' THEN score := score + 20;
    WHEN 'CONTACTED' THEN score := score + 10;
    WHEN 'LEAD' THEN score := score + 5;
    ELSE score := score + 0;
  END CASE;
  
  -- Quote count scoring (15 puan max)
  SELECT COUNT(*) INTO quote_count
  FROM "Quote"
  WHERE "dealId" = deal_id;
  
  IF quote_count > 0 THEN
    score := score + LEAST(quote_count * 5, 15);
  END IF;
  
  -- Meeting count scoring (15 puan max)
  SELECT COUNT(*) INTO meeting_count
  FROM "Meeting"
  WHERE "dealId" = deal_id;
  
  IF meeting_count > 0 THEN
    score := score + LEAST(meeting_count * 5, 15);
  END IF;
  
  -- Recency penalty (son aktiviteden beri geçen süre)
  IF days_since_created > 60 THEN 
    score := score - 30;
  ELSIF days_since_created > 30 THEN 
    score := score - 20;
  ELSIF days_since_created > 14 THEN 
    score := score - 10;
  END IF;
  
  -- Score'u 0-100 arasında tut
  RETURN GREATEST(0, LEAST(100, score));
END;
$$ LANGUAGE plpgsql;

-- Lead temperature hesaplama function
CREATE OR REPLACE FUNCTION get_lead_temperature(lead_score INTEGER)
RETURNS VARCHAR AS $$
BEGIN
  IF lead_score >= 70 THEN
    RETURN 'HOT';
  ELSIF lead_score >= 40 THEN
    RETURN 'WARM';
  ELSE
    RETURN 'COLD';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- BÖLÜM 3: DEAL STAGE HISTORY
-- ============================================

-- DealStageHistory tablosu (conversion tracking için)
CREATE TABLE IF NOT EXISTS "DealStageHistory" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealId UUID NOT NULL REFERENCES "Deal"(id) ON DELETE CASCADE,
  fromStage VARCHAR(50),
  toStage VARCHAR(50) NOT NULL,
  changedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  durationDays INTEGER,
  changedBy UUID REFERENCES "User"(id) ON DELETE SET NULL,
  notes TEXT,
  companyId UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE
);

-- DealStageHistory indexes
CREATE INDEX IF NOT EXISTS idx_deal_stage_history_deal ON "DealStageHistory"("dealId");
CREATE INDEX IF NOT EXISTS idx_deal_stage_history_company ON "DealStageHistory"("companyId");
CREATE INDEX IF NOT EXISTS idx_deal_stage_history_from_stage ON "DealStageHistory"("fromStage");
CREATE INDEX IF NOT EXISTS idx_deal_stage_history_to_stage ON "DealStageHistory"("toStage");

-- Deal stage change trigger (otomatik loglama)
CREATE OR REPLACE FUNCTION log_deal_stage_change()
RETURNS TRIGGER AS $$
DECLARE
  previous_duration INTEGER;
BEGIN
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    -- Önceki stage'de geçen süreyi hesapla
    SELECT EXTRACT(DAY FROM NOW() - "changedAt")::INTEGER
    INTO previous_duration
    FROM "DealStageHistory"
    WHERE "dealId" = NEW.id
    ORDER BY "changedAt" DESC
    LIMIT 1;
    
    -- Stage değişikliğini logla
    INSERT INTO "DealStageHistory" (
      "dealId", 
      "fromStage", 
      "toStage", 
      "durationDays",
      "companyId"
    )
    VALUES (
      NEW.id, 
      OLD.stage, 
      NEW.stage,
      COALESCE(previous_duration, EXTRACT(DAY FROM NOW() - OLD."createdAt")::INTEGER),
      NEW."companyId"
    );
    
    -- ActivityLog'a yaz
    INSERT INTO "ActivityLog" (
      entity,
      action,
      description,
      meta,
      "companyId"
    )
    VALUES (
      'Deal',
      'UPDATE',
      'Deal stage değiştirildi: ' || COALESCE(OLD.stage, 'NULL') || ' → ' || NEW.stage,
      jsonb_build_object(
        'dealId', NEW.id,
        'dealTitle', NEW.title,
        'fromStage', OLD.stage,
        'toStage', NEW.stage
      ),
      NEW."companyId"
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_deal_stage_change ON "Deal";
CREATE TRIGGER trigger_deal_stage_change
AFTER UPDATE ON "Deal"
FOR EACH ROW
EXECUTE FUNCTION log_deal_stage_change();

-- ============================================
-- BÖLÜM 4: QUOTE VERSIONING
-- ============================================

-- Quote tablosuna versioning kolonları ekle
ALTER TABLE "Quote" 
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

ALTER TABLE "Quote" 
ADD COLUMN IF NOT EXISTS "parentQuoteId" UUID REFERENCES "Quote"(id) ON DELETE SET NULL;

ALTER TABLE "Quote" 
ADD COLUMN IF NOT EXISTS "revisionNotes" TEXT;

-- Quote versioning index
CREATE INDEX IF NOT EXISTS idx_quote_parent ON "Quote"("parentQuoteId") WHERE "parentQuoteId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quote_version ON "Quote"(version);

-- ============================================
-- BÖLÜM 5: MEETING NOTES & OUTCOMES
-- ============================================

-- Meeting tablosuna notes kolonları ekle
ALTER TABLE "Meeting" 
ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE "Meeting" 
ADD COLUMN IF NOT EXISTS outcomes TEXT;

ALTER TABLE "Meeting" 
ADD COLUMN IF NOT EXISTS "actionItems" JSONB;

ALTER TABLE "Meeting" 
ADD COLUMN IF NOT EXISTS attendees JSONB;

ALTER TABLE "Meeting"
ADD COLUMN IF NOT EXISTS "nextMeetingDate" TIMESTAMP WITH TIME ZONE;

-- Meeting'e dealId ekle (eğer yoksa)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Meeting' 
    AND column_name = 'dealId'
  ) THEN
    ALTER TABLE "Meeting" ADD COLUMN "dealId" UUID REFERENCES "Deal"(id) ON DELETE SET NULL;
    CREATE INDEX idx_meeting_deal ON "Meeting"("dealId");
  END IF;
END $$;

-- ============================================
-- BÖLÜM 6: DEAL IMPROVEMENTS
-- ============================================

-- Deal tablosuna eksik kolonları ekle
ALTER TABLE "Deal"
ADD COLUMN IF NOT EXISTS "winProbability" DECIMAL(5,2) DEFAULT 50.00;

ALTER TABLE "Deal"
ADD COLUMN IF NOT EXISTS "expectedCloseDate" DATE;

ALTER TABLE "Deal"
ADD COLUMN IF NOT EXISTS "lostReason" TEXT;

ALTER TABLE "Deal"
ADD COLUMN IF NOT EXISTS "competitorId" UUID;

-- Deal indexes
CREATE INDEX IF NOT EXISTS idx_deal_expected_close ON "Deal"("expectedCloseDate") WHERE "expectedCloseDate" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deal_win_probability ON "Deal"("winProbability");

-- ============================================
-- BÖLÜM 7: CUSTOMER IMPROVEMENTS
-- ============================================

-- Customer tablosuna CLV (Customer Lifetime Value) kolonları ekle
ALTER TABLE "Customer"
ADD COLUMN IF NOT EXISTS "totalRevenue" DECIMAL(15,2) DEFAULT 0;

ALTER TABLE "Customer"
ADD COLUMN IF NOT EXISTS "averageOrderValue" DECIMAL(15,2) DEFAULT 0;

ALTER TABLE "Customer"
ADD COLUMN IF NOT EXISTS "orderCount" INTEGER DEFAULT 0;

ALTER TABLE "Customer"
ADD COLUMN IF NOT EXISTS "firstOrderDate" DATE;

ALTER TABLE "Customer"
ADD COLUMN IF NOT EXISTS "lastOrderDate" DATE;

ALTER TABLE "Customer"
ADD COLUMN IF NOT EXISTS "lifetimeValue" DECIMAL(15,2) DEFAULT 0;

-- Customer indexes
CREATE INDEX IF NOT EXISTS idx_customer_lifetime_value ON "Customer"("lifetimeValue");
CREATE INDEX IF NOT EXISTS idx_customer_total_revenue ON "Customer"("totalRevenue");

-- Customer CLV hesaplama function
CREATE OR REPLACE FUNCTION calculate_customer_ltv(customer_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  total_revenue DECIMAL;
  order_count INTEGER;
  first_order DATE;
  last_order DATE;
  avg_order_value DECIMAL;
BEGIN
  -- Invoice'lardan topla (SALE tipi ve PAID)
  SELECT 
    COALESCE(SUM(total), 0),
    COUNT(*),
    MIN("createdAt"::DATE),
    MAX("createdAt"::DATE),
    COALESCE(AVG(total), 0)
  INTO total_revenue, order_count, first_order, last_order, avg_order_value
  FROM "Invoice"
  WHERE "customerId" = customer_id
    AND type = 'SALE'
    AND status = 'PAID';
  
  -- Customer tablosunu güncelle
  UPDATE "Customer"
  SET 
    "totalRevenue" = total_revenue,
    "orderCount" = order_count,
    "firstOrderDate" = first_order,
    "lastOrderDate" = last_order,
    "averageOrderValue" = avg_order_value,
    "lifetimeValue" = total_revenue
  WHERE id = customer_id;
  
  RETURN total_revenue;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- BÖLÜM 8: OTOMASYONLAR
-- ============================================

-- Deal WON olduğunda LeadScore güncelle
CREATE OR REPLACE FUNCTION update_lead_score_on_deal_won()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stage = 'WON' AND OLD.stage != 'WON' THEN
    -- LeadScore'u güncelle veya oluştur
    INSERT INTO "LeadScore" (
      "dealId",
      "customerId",
      score,
      temperature,
      "engagementLevel",
      "lastInteractionDate",
      "companyId"
    )
    VALUES (
      NEW.id,
      NEW."customerId",
      100, -- WON deal'ler max score alır
      'HOT',
      'HIGH',
      NOW(),
      NEW."companyId"
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_deal_won_lead_score ON "Deal";
CREATE TRIGGER trigger_deal_won_lead_score
AFTER UPDATE ON "Deal"
FOR EACH ROW
EXECUTE FUNCTION update_lead_score_on_deal_won();

-- Invoice PAID olduğunda Customer LTV güncelle
CREATE OR REPLACE FUNCTION update_customer_ltv_on_invoice_paid()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'PAID' AND OLD.status != 'PAID' AND NEW."customerId" IS NOT NULL THEN
    PERFORM calculate_customer_ltv(NEW."customerId");
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_invoice_paid_ltv ON "Invoice";
CREATE TRIGGER trigger_invoice_paid_ltv
AFTER UPDATE ON "Invoice"
FOR EACH ROW
EXECUTE FUNCTION update_customer_ltv_on_invoice_paid();

-- ============================================
-- BÖLÜM 9: SEED DATA (İLK KURULUM İÇİN)
-- ============================================

-- Mevcut Customer'lar için primary contact oluştur (eğer email veya phone varsa)
DO $$
DECLARE
  customer_rec RECORD;
BEGIN
  FOR customer_rec IN 
    SELECT id, name, email, phone, "companyId", "customerCompanyId"
    FROM "Customer"
    WHERE (email IS NOT NULL OR phone IS NOT NULL)
    AND NOT EXISTS (
      SELECT 1 FROM "Contact" WHERE "customerId" = "Customer".id AND "isPrimary" = true
    )
  LOOP
    INSERT INTO "Contact" (
      "firstName",
      "lastName",
      email,
      phone,
      "isPrimary",
      "customerCompanyId",
      "companyId",
      status
    )
    VALUES (
      customer_rec.name,
      '',
      customer_rec.email,
      customer_rec.phone,
      true,
      customer_rec."customerCompanyId",
      customer_rec."companyId",
      'ACTIVE'
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- ============================================
-- BÖLÜM 10: RLS (ROW LEVEL SECURITY) POLICIES
-- ============================================

-- Contact RLS
ALTER TABLE "Contact" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Contact company isolation" ON "Contact";
CREATE POLICY "Contact company isolation"
ON "Contact"
FOR ALL
USING ("companyId" = current_setting('app.current_company_id', TRUE)::UUID);

-- LeadScore RLS
ALTER TABLE "LeadScore" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "LeadScore company isolation" ON "LeadScore";
CREATE POLICY "LeadScore company isolation"
ON "LeadScore"
FOR ALL
USING ("companyId" = current_setting('app.current_company_id', TRUE)::UUID);

-- DealStageHistory RLS
ALTER TABLE "DealStageHistory" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "DealStageHistory company isolation" ON "DealStageHistory";
CREATE POLICY "DealStageHistory company isolation"
ON "DealStageHistory"
FOR ALL
USING ("companyId" = current_setting('app.current_company_id', TRUE)::UUID);

-- ============================================
-- MIGRATION TAMAMLANDI
-- ============================================

-- Migration başarılı mesajı
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 033 tamamlandı: Contact Management, Lead Scoring, Deal Stage History, Quote Versioning, Meeting Notes';
  RAISE NOTICE '📊 Yeni tablolar: Contact (%), LeadScore (%), DealStageHistory (%)', 
    (SELECT COUNT(*) FROM "Contact"),
    (SELECT COUNT(*) FROM "LeadScore"),
    (SELECT COUNT(*) FROM "DealStageHistory");
END $$;



