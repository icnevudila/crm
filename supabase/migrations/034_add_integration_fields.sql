-- Integration Fields Migration
-- CompanyIntegration tablosuna SMS, WhatsApp ve Resend alanları ekler

BEGIN;

-- SMS entegrasyonu alanları
ALTER TABLE "CompanyIntegration"
ADD COLUMN IF NOT EXISTS "smsEnabled" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "smsProvider" TEXT,
ADD COLUMN IF NOT EXISTS "smsStatus" TEXT DEFAULT 'INACTIVE',
ADD COLUMN IF NOT EXISTS "smsLastError" TEXT,
ADD COLUMN IF NOT EXISTS "twilioAccountSid" TEXT,
ADD COLUMN IF NOT EXISTS "twilioAuthToken" TEXT,
ADD COLUMN IF NOT EXISTS "twilioPhoneNumber" TEXT;

-- WhatsApp entegrasyonu alanları
ALTER TABLE "CompanyIntegration"
ADD COLUMN IF NOT EXISTS "whatsappEnabled" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "whatsappProvider" TEXT,
ADD COLUMN IF NOT EXISTS "whatsappStatus" TEXT DEFAULT 'INACTIVE',
ADD COLUMN IF NOT EXISTS "whatsappLastError" TEXT,
ADD COLUMN IF NOT EXISTS "twilioWhatsappNumber" TEXT;

-- Resend email entegrasyonu alanları
ALTER TABLE "CompanyIntegration"
ADD COLUMN IF NOT EXISTS "resendEnabled" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "resendApiKey" TEXT;

-- Index'ler (performans için)
CREATE INDEX IF NOT EXISTS idx_companyintegration_sms ON "CompanyIntegration"("smsEnabled", "smsStatus");
CREATE INDEX IF NOT EXISTS idx_companyintegration_whatsapp ON "CompanyIntegration"("whatsappEnabled", "whatsappStatus");

COMMIT;



