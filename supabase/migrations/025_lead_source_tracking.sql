-- CRM V3 - Lead Source Tracking
-- Deal tablosuna leadSource kolonu ekleme
-- Next.js 15 + Supabase uyumlu

-- ============================================
-- 1. DEAL TABLOSUNA LEAD SOURCE KOLONU
-- ============================================
ALTER TABLE "Deal" 
ADD COLUMN IF NOT EXISTS "leadSource" VARCHAR(50);

-- ============================================
-- 2. INDEX EKLE (PERFORMANS İÇİN)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_deal_lead_source ON "Deal"("leadSource");

-- ============================================
-- 3. CHECK CONSTRAINT (OPSİYONEL - Lead Source Değerleri)
-- ============================================
-- Lead source değerleri: WEB, EMAIL, PHONE, REFERRAL, SOCIAL, OTHER
-- NOT: CHECK constraint eklenmedi - esneklik için (gelecekte yeni kaynaklar eklenebilir)

-- ============================================
-- 4. COMMENT'LER
-- ============================================
COMMENT ON COLUMN "Deal"."leadSource" IS 'Potansiyel müşterinin kaynağı (WEB, EMAIL, PHONE, REFERRAL, SOCIAL, OTHER)';

-- ✅ Migration tamamlandı!


























