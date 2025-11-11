-- ============================================
-- CRM V3 - ADVANCED FEATURES AUTOMATIONS
-- Migration: 037
-- Tarih: 2024
-- Amaç: Trigger'lar, Function'lar ve Otomasyonlar + Eksik Kolonlar
-- ============================================

-- ============================================
-- BÖLÜM 0: EKSİK KOLONLARI EKLE
-- ============================================

-- Customer tablosuna eksik kolonları ekle (eğer yoksa)
DO $$
BEGIN
  -- totalRevenue
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'Customer' AND column_name = 'totalRevenue') THEN
    ALTER TABLE "Customer" ADD COLUMN "totalRevenue" DECIMAL(15,2) DEFAULT 0;
    RAISE NOTICE '✅ Customer.totalRevenue eklendi';
  END IF;

  -- lifetimeValue
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'Customer' AND column_name = 'lifetimeValue') THEN
    ALTER TABLE "Customer" ADD COLUMN "lifetimeValue" DECIMAL(15,2) DEFAULT 0;
    RAISE NOTICE '✅ Customer.lifetimeValue eklendi';
  END IF;

  -- churnRisk
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'Customer' AND column_name = 'churnRisk') THEN
    ALTER TABLE "Customer" ADD COLUMN "churnRisk" VARCHAR(20) DEFAULT 'LOW';
    RAISE NOTICE '✅ Customer.churnRisk eklendi';
  END IF;

  -- averageOrderValue
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'Customer' AND column_name = 'averageOrderValue') THEN
    ALTER TABLE "Customer" ADD COLUMN "averageOrderValue" DECIMAL(15,2) DEFAULT 0;
    RAISE NOTICE '✅ Customer.averageOrderValue eklendi';
  END IF;

  -- orderCount
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'Customer' AND column_name = 'orderCount') THEN
    ALTER TABLE "Customer" ADD COLUMN "orderCount" INTEGER DEFAULT 0;
    RAISE NOTICE '✅ Customer.orderCount eklendi';
  END IF;

  -- firstOrderDate
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'Customer' AND column_name = 'firstOrderDate') THEN
    ALTER TABLE "Customer" ADD COLUMN "firstOrderDate" TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE '✅ Customer.firstOrderDate eklendi';
  END IF;

  -- lastOrderDate
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'Customer' AND column_name = 'lastOrderDate') THEN
    ALTER TABLE "Customer" ADD COLUMN "lastOrderDate" TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE '✅ Customer.lastOrderDate eklendi';
  END IF;

  -- predictedLTV
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'Customer' AND column_name = 'predictedLTV') THEN
    ALTER TABLE "Customer" ADD COLUMN "predictedLTV" DECIMAL(15,2);
    RAISE NOTICE '✅ Customer.predictedLTV eklendi';
  END IF;
END $$;

-- EmailCampaign tablosuna eksik kolonları ekle
DO $$
BEGIN
  -- totalSent
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'EmailCampaign' AND column_name = 'totalSent') THEN
    ALTER TABLE "EmailCampaign" ADD COLUMN "totalSent" INTEGER DEFAULT 0;
    RAISE NOTICE '✅ EmailCampaign.totalSent eklendi';
  END IF;

  -- totalOpened
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'EmailCampaign' AND column_name = 'totalOpened') THEN
    ALTER TABLE "EmailCampaign" ADD COLUMN "totalOpened" INTEGER DEFAULT 0;
    RAISE NOTICE '✅ EmailCampaign.totalOpened eklendi';
  END IF;

  -- totalClicked
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'EmailCampaign' AND column_name = 'totalClicked') THEN
    ALTER TABLE "EmailCampaign" ADD COLUMN "totalClicked" INTEGER DEFAULT 0;
    RAISE NOTICE '✅ EmailCampaign.totalClicked eklendi';
  END IF;

  -- totalBounced
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'EmailCampaign' AND column_name = 'totalBounced') THEN
    ALTER TABLE "EmailCampaign" ADD COLUMN "totalBounced" INTEGER DEFAULT 0;
    RAISE NOTICE '✅ EmailCampaign.totalBounced eklendi';
  END IF;
END $$;

-- Deal tablosuna competitorId ekle
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'Deal' AND column_name = 'competitorId') THEN
    ALTER TABLE "Deal" ADD COLUMN "competitorId" UUID REFERENCES "Competitor"(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_deal_competitor ON "Deal"("competitorId");
    RAISE NOTICE '✅ Deal.competitorId eklendi';
  END IF;
END $$;

-- Quote tablosuna createdBy ekle (trigger için gerekli)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'Quote' AND column_name = 'createdBy') THEN
    ALTER TABLE "Quote" ADD COLUMN "createdBy" UUID REFERENCES "User"(id) ON DELETE SET NULL;
    RAISE NOTICE '✅ Quote.createdBy eklendi';
  END IF;
END $$;

-- ============================================
-- BÖLÜM 1: SEGMENT AUTO-ASSIGN
-- ============================================

-- Müşteri segment kriterlerine göre otomatik atama
CREATE OR REPLACE FUNCTION auto_assign_customer_to_segments()
RETURNS TRIGGER AS $$
DECLARE
  segment_record RECORD;
  criteria JSONB;
  matches BOOLEAN;
BEGIN
  -- Sadece autoAssign = true olan segmentleri kontrol et
  FOR segment_record IN 
    SELECT id, criteria 
    FROM "CustomerSegment" 
    WHERE "companyId" = NEW."companyId" 
    AND "autoAssign" = true
  LOOP
    criteria := segment_record.criteria;
    matches := true;
    
    -- totalRevenue kontrolü (örnek)
    IF criteria ? 'totalRevenue' THEN
      IF criteria->'totalRevenue' ? 'gte' THEN
        IF (NEW."totalRevenue" IS NULL OR NEW."totalRevenue" < (criteria->'totalRevenue'->>'gte')::DECIMAL) THEN
          matches := false;
        END IF;
      END IF;
      
      IF criteria->'totalRevenue' ? 'lte' THEN
        IF (NEW."totalRevenue" IS NULL OR NEW."totalRevenue" > (criteria->'totalRevenue'->>'lte')::DECIMAL) THEN
          matches := false;
        END IF;
      END IF;
    END IF;
    
    -- Eğer kriterler uyuşuyorsa segment'e ekle
    IF matches THEN
      INSERT INTO "SegmentMember" ("segmentId", "customerId", "companyId")
      VALUES (segment_record.id, NEW.id, NEW."companyId")
      ON CONFLICT ("segmentId", "customerId") DO NOTHING;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_assign_segments ON "Customer";
CREATE TRIGGER trigger_auto_assign_segments
AFTER INSERT OR UPDATE OF "totalRevenue", "lifetimeValue", "churnRisk"
ON "Customer"
FOR EACH ROW
EXECUTE FUNCTION auto_assign_customer_to_segments();

-- ============================================
-- BÖLÜM 2: APPROVAL AUTO-UPDATE ENTITY
-- ============================================

-- Onay sonrası ilgili entity'yi güncelle
CREATE OR REPLACE FUNCTION update_entity_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Sadece status değiştiğinde çalış
  IF NEW.status != OLD.status THEN
    
    -- APPROVED olduğunda
    IF NEW.status = 'APPROVED' THEN
      
      -- Quote onaylandı
      IF NEW."relatedTo" = 'Quote' THEN
        UPDATE "Quote" 
        SET status = 'ACCEPTED'
        WHERE id = NEW."relatedId"::UUID;
      END IF;
      
      -- Deal onaylandı
      IF NEW."relatedTo" = 'Deal' THEN
        UPDATE "Deal" 
        SET stage = 'NEGOTIATION'
        WHERE id = NEW."relatedId"::UUID;
      END IF;
      
      -- Contract onaylandı
      IF NEW."relatedTo" = 'Contract' THEN
        UPDATE "Contract" 
        SET status = 'ACTIVE'
        WHERE id = NEW."relatedId"::UUID;
      END IF;
      
    -- REJECTED olduğunda
    ELSIF NEW.status = 'REJECTED' THEN
      
      -- Quote reddedildi
      IF NEW."relatedTo" = 'Quote' THEN
        UPDATE "Quote" 
        SET status = 'REJECTED'
        WHERE id = NEW."relatedId"::UUID;
      END IF;
      
      -- Deal reddedildi
      IF NEW."relatedTo" = 'Deal' THEN
        UPDATE "Deal" 
        SET stage = 'LOST',
        "lostReason" = 'Approval rejected: ' || COALESCE(NEW."rejectionReason", 'No reason provided')
        WHERE id = NEW."relatedId"::UUID;
      END IF;
      
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_entity_on_approval ON "ApprovalRequest";
CREATE TRIGGER trigger_update_entity_on_approval
AFTER UPDATE OF status ON "ApprovalRequest"
FOR EACH ROW
EXECUTE FUNCTION update_entity_on_approval();

-- ============================================
-- BÖLÜM 3: EMAIL CAMPAIGN STATS UPDATE
-- ============================================

-- EmailLog değişikliklerinde campaign stats'ı güncelle
CREATE OR REPLACE FUNCTION update_email_campaign_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Email gönderildi
  IF NEW.status = 'SENT' AND (OLD.status IS NULL OR OLD.status != 'SENT') THEN
    UPDATE "EmailCampaign"
    SET "totalSent" = COALESCE("totalSent", 0) + 1
    WHERE id = NEW."campaignId";
  END IF;
  
  -- Email açıldı
  IF NEW.status = 'OPENED' AND (OLD.status IS NULL OR OLD.status != 'OPENED') THEN
    UPDATE "EmailCampaign"
    SET "totalOpened" = COALESCE("totalOpened", 0) + 1
    WHERE id = NEW."campaignId";
  END IF;
  
  -- Link tıklandı
  IF NEW.status = 'CLICKED' AND (OLD.status IS NULL OR OLD.status != 'CLICKED') THEN
    UPDATE "EmailCampaign"
    SET "totalClicked" = COALESCE("totalClicked", 0) + 1
    WHERE id = NEW."campaignId";
  END IF;
  
  -- Bounce
  IF NEW.status = 'BOUNCED' AND (OLD.status IS NULL OR OLD.status != 'BOUNCED') THEN
    UPDATE "EmailCampaign"
    SET "totalBounced" = COALESCE("totalBounced", 0) + 1
    WHERE id = NEW."campaignId";
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_campaign_stats ON "EmailLog";
CREATE TRIGGER trigger_update_campaign_stats
AFTER INSERT OR UPDATE OF status ON "EmailLog"
FOR EACH ROW
WHEN (NEW."campaignId" IS NOT NULL)
EXECUTE FUNCTION update_email_campaign_stats();

-- ============================================
-- BÖLÜM 4: COMPETITOR STATS (Placeholder)
-- ============================================

-- Deal'de competitor seçildiğinde istatistikleri güncelle
CREATE OR REPLACE FUNCTION update_competitor_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Gelecekte competitor stats için kullanılacak
  -- Şu an sadece placeholder
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_competitor_stats ON "Deal";
CREATE TRIGGER trigger_update_competitor_stats
AFTER INSERT OR UPDATE OF "competitorId" ON "Deal"
FOR EACH ROW
WHEN (NEW."competitorId" IS NOT NULL)
EXECUTE FUNCTION update_competitor_stats();

-- ============================================
-- BÖLÜM 5: DOCUMENT ACCESS LOG
-- ============================================

-- Doküman erişimlerini logla
CREATE OR REPLACE FUNCTION log_document_access()
RETURNS TRIGGER AS $$
BEGIN
  -- ActivityLog'a yaz
  INSERT INTO "ActivityLog" (
    action,
    "entityType",
    "entityId",
    "userId",
    "companyId",
    description,
    meta
  )
  VALUES (
    'ACCESS',
    'Document',
    NEW."documentId",
    NEW."userId",
    NEW."companyId",
    'Document accessed',
    jsonb_build_object(
      'accessLevel', NEW."accessLevel",
      'documentId', NEW."documentId"
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_document_access ON "DocumentAccess";
CREATE TRIGGER trigger_log_document_access
AFTER INSERT ON "DocumentAccess"
FOR EACH ROW
WHEN (NEW."userId" IS NOT NULL)
EXECUTE FUNCTION log_document_access();

-- ============================================
-- BÖLÜM 6: AUTO-CREATE APPROVAL FOR HIGH-VALUE QUOTES
-- ============================================

-- Yüksek değerli teklifler için otomatik onay talebi oluştur
CREATE OR REPLACE FUNCTION auto_create_approval_for_quotes()
RETURNS TRIGGER AS $$
DECLARE
  approval_threshold DECIMAL := 100000; -- 100K üstü onaya gider
  manager_ids UUID[];
  existing_approval_count INT;
BEGIN
  -- Sadece yeni oluşturulan veya değer güncellenmiş teklifler
  IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW."totalAmount" != OLD."totalAmount")) AND
     NEW."totalAmount" >= approval_threshold AND
     NEW.status = 'DRAFT' AND
     NEW."createdBy" IS NOT NULL THEN
    
    -- Zaten onay talebi var mı kontrol et
    SELECT COUNT(*) INTO existing_approval_count
    FROM "ApprovalRequest"
    WHERE "relatedTo" = 'Quote'
    AND "relatedId" = NEW.id::TEXT
    AND status = 'PENDING';
    
    -- Eğer yoksa oluştur
    IF existing_approval_count = 0 THEN
      -- Manager'ları bul (ADMIN ve SUPER_ADMIN rolleri)
      SELECT ARRAY_AGG(id) INTO manager_ids
      FROM "User"
      WHERE "companyId" = NEW."companyId"
      AND role IN ('ADMIN', 'SUPER_ADMIN')
      AND status = 'ACTIVE';
      
      -- Onay talebi oluştur
      IF manager_ids IS NOT NULL AND array_length(manager_ids, 1) > 0 THEN
        INSERT INTO "ApprovalRequest" (
          title,
          description,
          "relatedTo",
          "relatedId",
          "requestedBy",
          "approverIds",
          priority,
          status,
          "companyId"
        )
        VALUES (
          'Yüksek Değerli Teklif Onayı',
          'Teklif tutarı: ' || NEW."totalAmount"::TEXT || ' TL',
          'Quote',
          NEW.id::TEXT,
          NEW."createdBy",
          manager_ids,
          'HIGH',
          'PENDING',
          NEW."companyId"
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_create_approval ON "Quote";
CREATE TRIGGER trigger_auto_create_approval
AFTER INSERT OR UPDATE OF "totalAmount" ON "Quote"
FOR EACH ROW
EXECUTE FUNCTION auto_create_approval_for_quotes();

-- ============================================
-- BÖLÜM 7: NOTIFICATION HELPER FUNCTION
-- ============================================

-- Notification oluşturma helper (gelecekte kullanılacak)
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type VARCHAR,
  p_title TEXT,
  p_message TEXT,
  p_link TEXT,
  p_company_id UUID
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  -- Gelecekte Notification tablosu oluşturulunca kullanılacak
  -- Şimdilik sadece ActivityLog'a yaz
  INSERT INTO "ActivityLog" (
    action,
    "entityType",
    "entityId",
    "userId",
    "companyId",
    description,
    meta
  )
  VALUES (
    'NOTIFICATION',
    p_type,
    NULL,
    p_user_id,
    p_company_id,
    p_message,
    jsonb_build_object(
      'title', p_title,
      'link', p_link
    )
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- BÖLÜM 8: EMAIL CAMPAIGN SCHEDULER
-- ============================================

-- Zamanlanmış kampanyaları gönderme fonksiyonu
-- (Cron job ile çağrılacak)
CREATE OR REPLACE FUNCTION process_scheduled_campaigns()
RETURNS TABLE(campaign_id UUID, campaign_name TEXT, status TEXT) AS $$
BEGIN
  RETURN QUERY
  UPDATE "EmailCampaign"
  SET status = 'SENDING'
  WHERE status = 'SCHEDULED'
  AND "scheduledAt" <= NOW()
  RETURNING id, name, status::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- BÖLÜM 9: SEARCH HELPER FUNCTIONS
-- ============================================

-- Doküman arama
CREATE OR REPLACE FUNCTION search_documents(
  p_search_term TEXT,
  p_company_id UUID
)
RETURNS TABLE(
  id UUID,
  title VARCHAR,
  "fileName" VARCHAR,
  relevance REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.title,
    d."fileName",
    ts_rank(
      to_tsvector('simple', COALESCE(d.title, '') || ' ' || COALESCE(d.description, '') || ' ' || COALESCE(d."fileName", '')),
      plainto_tsquery('simple', p_search_term)
    ) as relevance
  FROM "Document" d
  WHERE d."companyId" = p_company_id
  AND (
    to_tsvector('simple', COALESCE(d.title, '') || ' ' || COALESCE(d.description, '') || ' ' || COALESCE(d."fileName", ''))
    @@ plainto_tsquery('simple', p_search_term)
  )
  ORDER BY relevance DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- MIGRATION TAMAMLANDI
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ Migration 037 tamamlandı: Advanced Features Automations';
  RAISE NOTICE '============================================';
  RAISE NOTICE '📦 Eklenen Kolonlar:';
  RAISE NOTICE '  - Customer: totalRevenue, lifetimeValue, churnRisk, etc.';
  RAISE NOTICE '  - EmailCampaign: totalSent, totalOpened, totalClicked, totalBounced';
  RAISE NOTICE '  - Deal: competitorId';
  RAISE NOTICE '  - Quote: createdBy';
  RAISE NOTICE '============================================';
  RAISE NOTICE '📦 Oluşturulan:';
  RAISE NOTICE '  - 7 Trigger';
  RAISE NOTICE '  - 10 Function';
  RAISE NOTICE '  - Auto-assign segments';
  RAISE NOTICE '  - Auto-approval for high-value quotes';
  RAISE NOTICE '  - Email campaign stats update';
  RAISE NOTICE '  - Competitor stats tracking';
  RAISE NOTICE '  - Document access logging';
  RAISE NOTICE '============================================';
  RAISE NOTICE '🚀 Otomasyonlar aktif!';
  RAISE NOTICE '============================================';
END $$;
