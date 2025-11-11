-- ============================================
-- CRM V3 - FIX MISSING COLUMNS
-- Migration: 039
-- Tarih: 2024
-- Amaç: Eksik kolonları ekle
-- ============================================

-- EmailCampaign tablosuna createdBy ekle
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'EmailCampaign' AND column_name = 'createdBy') THEN
    ALTER TABLE "EmailCampaign" ADD COLUMN "createdBy" UUID REFERENCES "User"(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_email_campaign_created_by ON "EmailCampaign"("createdBy");
    RAISE NOTICE '✅ EmailCampaign.createdBy eklendi';
  END IF;
END $$;

-- EmailCampaign tablosuna targetSegment ekle (eğer TEXT değilse)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'EmailCampaign' AND column_name = 'targetSegment' 
             AND data_type = 'text') THEN
    -- Zaten TEXT, güzel
    RAISE NOTICE '✅ EmailCampaign.targetSegment zaten TEXT';
  ELSE
    -- Ya yok ya da farklı tip, düzelt
    ALTER TABLE "EmailCampaign" DROP COLUMN IF EXISTS "targetSegment";
    ALTER TABLE "EmailCampaign" ADD COLUMN "targetSegment" TEXT;
    RAISE NOTICE '✅ EmailCampaign.targetSegment düzeltildi';
  END IF;
END $$;

-- Competitor tablosundaki field'ları kontrol et
DO $$
BEGIN
  -- strengths TEXT olmalı
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'Competitor' AND column_name = 'strengths') THEN
    ALTER TABLE "Competitor" ADD COLUMN "strengths" TEXT;
    RAISE NOTICE '✅ Competitor.strengths eklendi';
  END IF;

  -- weaknesses TEXT olmalı
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'Competitor' AND column_name = 'weaknesses') THEN
    ALTER TABLE "Competitor" ADD COLUMN "weaknesses" TEXT;
    RAISE NOTICE '✅ Competitor.weaknesses eklendi';
  END IF;

  -- pricingStrategy TEXT olmalı
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'Competitor' AND column_name = 'pricingStrategy') THEN
    ALTER TABLE "Competitor" ADD COLUMN "pricingStrategy" TEXT;
    RAISE NOTICE '✅ Competitor.pricingStrategy eklendi';
  END IF;
END $$;

-- CustomerSegment tablosuna memberCount ekle (istatistik için)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'CustomerSegment' AND column_name = 'memberCount') THEN
    ALTER TABLE "CustomerSegment" ADD COLUMN "memberCount" INTEGER DEFAULT 0;
    
    -- Mevcut kayıtları güncelle
    UPDATE "CustomerSegment" cs
    SET "memberCount" = (
      SELECT COUNT(*) 
      FROM "SegmentMember" sm 
      WHERE sm."segmentId" = cs.id
    );
    
    RAISE NOTICE '✅ CustomerSegment.memberCount eklendi';
  END IF;
END $$;

-- SegmentMember count trigger
CREATE OR REPLACE FUNCTION update_segment_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE "CustomerSegment"
    SET "memberCount" = COALESCE("memberCount", 0) + 1
    WHERE id = NEW."segmentId";
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE "CustomerSegment"
    SET "memberCount" = GREATEST(COALESCE("memberCount", 0) - 1, 0)
    WHERE id = OLD."segmentId";
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_segment_count ON "SegmentMember";
CREATE TRIGGER trigger_update_segment_count
AFTER INSERT OR DELETE ON "SegmentMember"
FOR EACH ROW
EXECUTE FUNCTION update_segment_member_count();

-- Document tablosuna description NULL yapma (opsiyonel olmalı)
ALTER TABLE "Document" ALTER COLUMN description DROP NOT NULL;

-- ApprovalRequest için approverIds array NULL yapma (opsiyonel olabilir)
-- (Zaten nullable ama emin olalım)

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ Migration 039 tamamlandı: Missing Columns Fixed';
  RAISE NOTICE '============================================';
  RAISE NOTICE '📦 Eklenen/Düzeltilen:';
  RAISE NOTICE '  - EmailCampaign.createdBy';
  RAISE NOTICE '  - EmailCampaign.targetSegment';
  RAISE NOTICE '  - CustomerSegment.memberCount';
  RAISE NOTICE '  - Segment member count trigger';
  RAISE NOTICE '============================================';
END $$;


