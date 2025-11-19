-- ============================================
-- CRM V3 - Company Integrations
-- Migration: 104
-- Tarih: 2024
-- Amaç: Her şirketin kendi API credentials'larını saklamak için CompanyIntegration tablosu
-- ============================================

-- ============================================
-- 1. COMPANY INTEGRATION TABLOSU
-- ============================================

CREATE TABLE IF NOT EXISTS "CompanyIntegration" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  
  -- Zoom API Credentials
  "zoomAccountId" TEXT,
  "zoomClientId" TEXT,
  "zoomClientSecret" TEXT,
  "zoomEnabled" BOOLEAN DEFAULT false,
  
  -- Google Meet API Credentials
  "googleAccessToken" TEXT,
  "googleRefreshToken" TEXT,
  "googleTokenExpiresAt" TIMESTAMP WITH TIME ZONE,
  "googleEnabled" BOOLEAN DEFAULT false,
  
  -- Microsoft Teams API Credentials
  "microsoftAccessToken" TEXT,
  "microsoftRefreshToken" TEXT,
  "microsoftTokenExpiresAt" TIMESTAMP WITH TIME ZONE,
  "microsoftEnabled" BOOLEAN DEFAULT false,
  
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Her şirket için tek bir integration kaydı olmalı
  UNIQUE("companyId")
);

-- ============================================
-- 2. INDEX'LER (PERFORMANS İÇİN)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_company_integration_company ON "CompanyIntegration"("companyId");
CREATE INDEX IF NOT EXISTS idx_company_integration_zoom_enabled ON "CompanyIntegration"("zoomEnabled") WHERE "zoomEnabled" = true;
CREATE INDEX IF NOT EXISTS idx_company_integration_google_enabled ON "CompanyIntegration"("googleEnabled") WHERE "googleEnabled" = true;
CREATE INDEX IF NOT EXISTS idx_company_integration_microsoft_enabled ON "CompanyIntegration"("microsoftEnabled") WHERE "microsoftEnabled" = true;

-- ============================================
-- 3. RLS POLICIES
-- ============================================

ALTER TABLE "CompanyIntegration" ENABLE ROW LEVEL SECURITY;

-- Policy: Kullanıcılar sadece kendi şirketlerinin integration'larını görebilir
DROP POLICY IF EXISTS "company_integration_company_isolation" ON "CompanyIntegration";
CREATE POLICY "company_integration_company_isolation" ON "CompanyIntegration"
  FOR ALL
  USING (
    "companyId" IN (
      SELECT "companyId" FROM "User" WHERE id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM "User" 
      WHERE "User".id = auth.uid() 
      AND "User".role = 'SUPER_ADMIN'
    )
  );

-- ============================================
-- 4. TRIGGER: updatedAt OTOMATİK GÜNCELLEME
-- ============================================

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
-- 5. COMMENT'LER
-- ============================================

COMMENT ON TABLE "CompanyIntegration" IS 'Şirket API entegrasyonları (Zoom, Google Meet, Microsoft Teams)';
COMMENT ON COLUMN "CompanyIntegration"."zoomAccountId" IS 'Zoom Account ID';
COMMENT ON COLUMN "CompanyIntegration"."zoomClientId" IS 'Zoom OAuth Client ID';
COMMENT ON COLUMN "CompanyIntegration"."zoomClientSecret" IS 'Zoom OAuth Client Secret (encrypted saklanmalı)';
COMMENT ON COLUMN "CompanyIntegration"."googleAccessToken" IS 'Google OAuth Access Token';
COMMENT ON COLUMN "CompanyIntegration"."googleRefreshToken" IS 'Google OAuth Refresh Token';
COMMENT ON COLUMN "CompanyIntegration"."microsoftAccessToken" IS 'Microsoft Graph Access Token';
COMMENT ON COLUMN "CompanyIntegration"."microsoftRefreshToken" IS 'Microsoft Graph Refresh Token';

-- ============================================
-- MIGRATION TAMAMLANDI
-- ============================================







