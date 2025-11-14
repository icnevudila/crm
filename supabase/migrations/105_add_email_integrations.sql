-- ============================================
-- CRM V3 - Email Integrations
-- Migration: 105
-- Tarih: 2024
-- Amaç: CompanyIntegration tablosuna e-posta entegrasyonları kolonları ekleme
-- NOT: CompanyIntegration tablosu 104_add_company_integrations.sql'de oluşturulmuş olmalı
-- Eğer tablo yoksa bu migration önce tabloyu oluşturur
-- ============================================

-- ============================================
-- 0. COMPANY INTEGRATION TABLOSU YOKSA OLUŞTUR (104 bağımlılığı)
-- ============================================

CREATE TABLE IF NOT EXISTS "CompanyIntegration" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  
  -- Zoom API Credentials (104'ten)
  "zoomAccountId" TEXT,
  "zoomClientId" TEXT,
  "zoomClientSecret" TEXT,
  "zoomEnabled" BOOLEAN DEFAULT false,
  
  -- Google Meet API Credentials (104'ten)
  "googleAccessToken" TEXT,
  "googleRefreshToken" TEXT,
  "googleTokenExpiresAt" TIMESTAMP WITH TIME ZONE,
  "googleEnabled" BOOLEAN DEFAULT false,
  
  -- Microsoft Teams API Credentials (104'ten)
  "microsoftAccessToken" TEXT,
  "microsoftRefreshToken" TEXT,
  "microsoftTokenExpiresAt" TIMESTAMP WITH TIME ZONE,
  "microsoftEnabled" BOOLEAN DEFAULT false,
  
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Her şirket için tek bir integration kaydı olmalı
  UNIQUE("companyId")
);

-- RLS aktif et (eğer aktif değilse)
ALTER TABLE "CompanyIntegration" ENABLE ROW LEVEL SECURITY;

-- RLS Policy (eğer yoksa oluştur - User tablosu varsa)
-- NOT: User tablosu yoksa policy oluşturulmaz (güvenlik kontrolü API seviyesinde yapılır)
DO $$
BEGIN
  -- User tablosu var mı kontrol et
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'User'
  ) THEN
    -- RLS Policy oluştur
    DROP POLICY IF EXISTS "company_integration_company_isolation" ON "CompanyIntegration";
    CREATE POLICY "company_integration_company_isolation" ON "CompanyIntegration"
      FOR ALL
      USING (
        "companyId" IN (
          SELECT "companyId" FROM public."User" WHERE id = auth.uid()
        )
        OR
        EXISTS (
          SELECT 1 FROM public."User" 
          WHERE public."User".id = auth.uid() 
          AND public."User".role = 'SUPER_ADMIN'
        )
      );
  END IF;
END $$;

-- Trigger (eğer yoksa oluştur)
CREATE OR REPLACE FUNCTION update_company_integration_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_company_integration_updated_at ON "CompanyIntegration";
CREATE TRIGGER trigger_update_company_integration_updated_at
  BEFORE UPDATE ON "CompanyIntegration"
  FOR EACH ROW
  EXECUTE FUNCTION update_company_integration_updated_at();

-- ============================================
-- 1. E-POSTA ENTEGRASYONLARI KOLONLARI
-- ============================================

-- Email Provider (GMAIL, OUTLOOK, SMTP)
ALTER TABLE "CompanyIntegration"
ADD COLUMN IF NOT EXISTS "emailProvider" VARCHAR(20);

-- Gmail OAuth (OAuth flow ile bağlanma)
ALTER TABLE "CompanyIntegration"
ADD COLUMN IF NOT EXISTS "gmailOAuthToken" TEXT;

ALTER TABLE "CompanyIntegration"
ADD COLUMN IF NOT EXISTS "gmailOAuthRefreshToken" TEXT;

ALTER TABLE "CompanyIntegration"
ADD COLUMN IF NOT EXISTS "gmailOAuthTokenExpiresAt" TIMESTAMP WITH TIME ZONE;

ALTER TABLE "CompanyIntegration"
ADD COLUMN IF NOT EXISTS "gmailEnabled" BOOLEAN DEFAULT false;

-- Outlook OAuth (OAuth flow ile bağlanma)
ALTER TABLE "CompanyIntegration"
ADD COLUMN IF NOT EXISTS "outlookOAuthToken" TEXT;

ALTER TABLE "CompanyIntegration"
ADD COLUMN IF NOT EXISTS "outlookOAuthRefreshToken" TEXT;

ALTER TABLE "CompanyIntegration"
ADD COLUMN IF NOT EXISTS "outlookOAuthTokenExpiresAt" TIMESTAMP WITH TIME ZONE;

ALTER TABLE "CompanyIntegration"
ADD COLUMN IF NOT EXISTS "outlookEnabled" BOOLEAN DEFAULT false;

-- SMTP (Genel SMTP servisleri - Gmail SMTP, SendGrid, Brevo, vb.)
ALTER TABLE "CompanyIntegration"
ADD COLUMN IF NOT EXISTS "smtpHost" TEXT;

ALTER TABLE "CompanyIntegration"
ADD COLUMN IF NOT EXISTS "smtpPort" INTEGER;

ALTER TABLE "CompanyIntegration"
ADD COLUMN IF NOT EXISTS "smtpUser" TEXT;

ALTER TABLE "CompanyIntegration"
ADD COLUMN IF NOT EXISTS "smtpPassword" TEXT;

ALTER TABLE "CompanyIntegration"
ADD COLUMN IF NOT EXISTS "smtpFromEmail" TEXT;

ALTER TABLE "CompanyIntegration"
ADD COLUMN IF NOT EXISTS "smtpFromName" TEXT;

ALTER TABLE "CompanyIntegration"
ADD COLUMN IF NOT EXISTS "smtpEnabled" BOOLEAN DEFAULT false;

-- Email Status (ACTIVE, INACTIVE, ERROR)
ALTER TABLE "CompanyIntegration"
ADD COLUMN IF NOT EXISTS "emailStatus" VARCHAR(20);

ALTER TABLE "CompanyIntegration"
ADD COLUMN IF NOT EXISTS "emailLastError" TEXT;

-- ============================================
-- 2. CHECK CONSTRAINT'LER
-- ============================================

-- Email Provider Check
ALTER TABLE "CompanyIntegration"
DROP CONSTRAINT IF EXISTS check_email_provider;

ALTER TABLE "CompanyIntegration"
ADD CONSTRAINT check_email_provider
CHECK ("emailProvider" IN ('GMAIL', 'OUTLOOK', 'SMTP') OR "emailProvider" IS NULL);

-- Email Status Check
ALTER TABLE "CompanyIntegration"
DROP CONSTRAINT IF EXISTS check_email_status;

ALTER TABLE "CompanyIntegration"
ADD CONSTRAINT check_email_status
CHECK ("emailStatus" IN ('ACTIVE', 'INACTIVE', 'ERROR') OR "emailStatus" IS NULL);

-- SMTP Port Check (1-65535 arası)
ALTER TABLE "CompanyIntegration"
DROP CONSTRAINT IF EXISTS check_smtp_port;

ALTER TABLE "CompanyIntegration"
ADD CONSTRAINT check_smtp_port
CHECK ("smtpPort" IS NULL OR ("smtpPort" >= 1 AND "smtpPort" <= 65535));

-- ============================================
-- 3. INDEX'LER (PERFORMANS İÇİN)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_company_integration_email_provider ON "CompanyIntegration"("emailProvider");
CREATE INDEX IF NOT EXISTS idx_company_integration_gmail_enabled ON "CompanyIntegration"("gmailEnabled") WHERE "gmailEnabled" = true;
CREATE INDEX IF NOT EXISTS idx_company_integration_outlook_enabled ON "CompanyIntegration"("outlookEnabled") WHERE "outlookEnabled" = true;
CREATE INDEX IF NOT EXISTS idx_company_integration_smtp_enabled ON "CompanyIntegration"("smtpEnabled") WHERE "smtpEnabled" = true;
CREATE INDEX IF NOT EXISTS idx_company_integration_email_status ON "CompanyIntegration"("emailStatus");

-- ============================================
-- 4. COMMENT'LER
-- ============================================

COMMENT ON COLUMN "CompanyIntegration"."emailProvider" IS 'E-posta provider tipi (GMAIL, OUTLOOK, SMTP)';
COMMENT ON COLUMN "CompanyIntegration"."gmailOAuthToken" IS 'Gmail OAuth Access Token';
COMMENT ON COLUMN "CompanyIntegration"."gmailOAuthRefreshToken" IS 'Gmail OAuth Refresh Token';
COMMENT ON COLUMN "CompanyIntegration"."gmailOAuthTokenExpiresAt" IS 'Gmail OAuth Token Expire Tarihi';
COMMENT ON COLUMN "CompanyIntegration"."gmailEnabled" IS 'Gmail entegrasyonu aktif mi?';
COMMENT ON COLUMN "CompanyIntegration"."outlookOAuthToken" IS 'Outlook OAuth Access Token';
COMMENT ON COLUMN "CompanyIntegration"."outlookOAuthRefreshToken" IS 'Outlook OAuth Refresh Token';
COMMENT ON COLUMN "CompanyIntegration"."outlookOAuthTokenExpiresAt" IS 'Outlook OAuth Token Expire Tarihi';
COMMENT ON COLUMN "CompanyIntegration"."outlookEnabled" IS 'Outlook entegrasyonu aktif mi?';
COMMENT ON COLUMN "CompanyIntegration"."smtpHost" IS 'SMTP Host (örn: smtp.gmail.com)';
COMMENT ON COLUMN "CompanyIntegration"."smtpPort" IS 'SMTP Port (örn: 587, 465)';
COMMENT ON COLUMN "CompanyIntegration"."smtpUser" IS 'SMTP Kullanıcı Adı (e-posta adresi)';
COMMENT ON COLUMN "CompanyIntegration"."smtpPassword" IS 'SMTP Şifresi (App Password veya gerçek şifre)';
COMMENT ON COLUMN "CompanyIntegration"."smtpFromEmail" IS 'Gönderen E-posta Adresi';
COMMENT ON COLUMN "CompanyIntegration"."smtpFromName" IS 'Gönderen İsmi';
COMMENT ON COLUMN "CompanyIntegration"."smtpEnabled" IS 'SMTP entegrasyonu aktif mi?';
COMMENT ON COLUMN "CompanyIntegration"."emailStatus" IS 'E-posta entegrasyon durumu (ACTIVE, INACTIVE, ERROR)';
COMMENT ON COLUMN "CompanyIntegration"."emailLastError" IS 'Son e-posta gönderim hatası';

-- ============================================
-- MIGRATION TAMAMLANDI
-- ============================================

