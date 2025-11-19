-- Microsoft OAuth Fields Migration
-- CompanyIntegration tablosuna Microsoft OAuth credentials alanları ekler

BEGIN;

-- Microsoft OAuth Client ID ve Client Secret ekle
ALTER TABLE "CompanyIntegration"
ADD COLUMN IF NOT EXISTS "microsoftClientId" TEXT,
ADD COLUMN IF NOT EXISTS "microsoftClientSecret" TEXT,
ADD COLUMN IF NOT EXISTS "microsoftRedirectUri" TEXT;

-- Index'ler (performans için)
CREATE INDEX IF NOT EXISTS idx_companyintegration_microsoft_client ON "CompanyIntegration"("microsoftClientId") WHERE "microsoftClientId" IS NOT NULL;

COMMIT;

