-- CRM V3 - Email Templates Sistemi
-- Email template tablosu ve ilişkileri
-- Next.js 15 + Supabase uyumlu

-- ============================================
-- 1. EMAIL TEMPLATE TABLOSU
-- ============================================
CREATE TABLE IF NOT EXISTS "EmailTemplate" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  body TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb, -- Template değişkenleri: ["customerName", "dealTitle", vb.]
  category VARCHAR(50), -- QUOTE, INVOICE, DEAL, CUSTOMER, GENERAL
  "isActive" BOOLEAN DEFAULT true,
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. INDEX'LER (PERFORMANS İÇİN)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_email_template_company ON "EmailTemplate"("companyId");
CREATE INDEX IF NOT EXISTS idx_email_template_category ON "EmailTemplate"("category");
CREATE INDEX IF NOT EXISTS idx_email_template_active ON "EmailTemplate"("isActive");

-- ============================================
-- 3. CHECK CONSTRAINT (CATEGORY DEĞERLERİ)
-- ============================================
ALTER TABLE "EmailTemplate"
DROP CONSTRAINT IF EXISTS check_email_template_category;

ALTER TABLE "EmailTemplate"
ADD CONSTRAINT check_email_template_category 
CHECK (category IN ('QUOTE', 'INVOICE', 'DEAL', 'CUSTOMER', 'GENERAL'));

-- ============================================
-- 4. COMMENT'LER
-- ============================================
COMMENT ON TABLE "EmailTemplate" IS 'E-posta şablonları tablosu';
COMMENT ON COLUMN "EmailTemplate".name IS 'Template adı';
COMMENT ON COLUMN "EmailTemplate".subject IS 'E-posta konusu (template değişkenleri kullanılabilir)';
COMMENT ON COLUMN "EmailTemplate".body IS 'E-posta içeriği (template değişkenleri kullanılabilir: {{variableName}})';
COMMENT ON COLUMN "EmailTemplate".variables IS 'Template değişkenleri listesi (JSON array)';
COMMENT ON COLUMN "EmailTemplate".category IS 'Template kategorisi (QUOTE, INVOICE, DEAL, CUSTOMER, GENERAL)';

-- ✅ Migration tamamlandı!











