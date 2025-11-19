-- ============================================
-- CRM V3 - Google Calendar Integration
-- Migration: 108
-- Tarih: 2024
-- Amaç: CompanyIntegration tablosuna Google Calendar entegrasyonu kolonları ekleme
-- ============================================

-- ============================================
-- 1. GOOGLE CALENDAR ENTEGRASYONU KOLONLARI
-- ============================================

-- Google Calendar OAuth Credentials
ALTER TABLE "CompanyIntegration"
ADD COLUMN IF NOT EXISTS "googleCalendarClientId" TEXT;

ALTER TABLE "CompanyIntegration"
ADD COLUMN IF NOT EXISTS "googleCalendarClientSecret" TEXT;

ALTER TABLE "CompanyIntegration"
ADD COLUMN IF NOT EXISTS "googleCalendarRedirectUri" TEXT;

ALTER TABLE "CompanyIntegration"
ADD COLUMN IF NOT EXISTS "googleCalendarEnabled" BOOLEAN DEFAULT false;

ALTER TABLE "CompanyIntegration"
ADD COLUMN IF NOT EXISTS "googleCalendarStatus" VARCHAR(20);

ALTER TABLE "CompanyIntegration"
ADD COLUMN IF NOT EXISTS "googleCalendarLastError" TEXT;

-- ============================================
-- 2. CHECK CONSTRAINT'LER
-- ============================================

-- Google Calendar Status Check
ALTER TABLE "CompanyIntegration"
DROP CONSTRAINT IF EXISTS check_google_calendar_status;

ALTER TABLE "CompanyIntegration"
ADD CONSTRAINT check_google_calendar_status
CHECK ("googleCalendarStatus" IN ('ACTIVE', 'INACTIVE', 'ERROR') OR "googleCalendarStatus" IS NULL);

-- ============================================
-- 3. INDEX'LER (PERFORMANS İÇİN)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_company_integration_google_calendar_enabled 
ON "CompanyIntegration"("googleCalendarEnabled") 
WHERE "googleCalendarEnabled" = true;

CREATE INDEX IF NOT EXISTS idx_company_integration_google_calendar_status 
ON "CompanyIntegration"("googleCalendarStatus");

-- ============================================
-- 4. COMMENT'LER
-- ============================================

COMMENT ON COLUMN "CompanyIntegration"."googleCalendarClientId" IS 'Google Calendar OAuth Client ID';
COMMENT ON COLUMN "CompanyIntegration"."googleCalendarClientSecret" IS 'Google Calendar OAuth Client Secret (encrypted saklanmalı)';
COMMENT ON COLUMN "CompanyIntegration"."googleCalendarRedirectUri" IS 'Google Calendar OAuth Redirect URI';
COMMENT ON COLUMN "CompanyIntegration"."googleCalendarEnabled" IS 'Google Calendar entegrasyonu aktif mi?';
COMMENT ON COLUMN "CompanyIntegration"."googleCalendarStatus" IS 'Google Calendar entegrasyon durumu (ACTIVE, INACTIVE, ERROR)';
COMMENT ON COLUMN "CompanyIntegration"."googleCalendarLastError" IS 'Son Google Calendar entegrasyon hatası';

-- ============================================
-- MIGRATION TAMAMLANDI
-- ============================================


