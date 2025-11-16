-- Add resendEnabled column if missing
-- Migration: 999
-- Tarih: 2024
-- Amaç: resendEnabled kolonunu ekle (034 migration'ında eksik olabilir)

BEGIN;

-- Resend email entegrasyonu alanları
ALTER TABLE "CompanyIntegration"
ADD COLUMN IF NOT EXISTS "resendEnabled" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "resendApiKey" TEXT;

COMMIT;


