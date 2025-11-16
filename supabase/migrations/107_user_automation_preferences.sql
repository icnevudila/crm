-- ============================================
-- 107_user_automation_preferences.sql
-- Kullanıcı Otomasyon Tercihleri Tablosu
-- ============================================
-- Kullanıcıların email/SMS/WhatsApp otomasyonları için tercihlerini saklar
-- ALWAYS: Her zaman otomatik gönder
-- ASK: Kullanıcıya sor (toast ile)
-- NEVER: Hiç gönderme

-- Kullanıcı otomasyon tercihleri tablosu
CREATE TABLE IF NOT EXISTS "UserAutomationPreference" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  
  -- Email tercihleri
  "emailOnDealCreated" VARCHAR(20) DEFAULT 'ASK', -- 'ALWAYS', 'ASK', 'NEVER'
  "emailOnQuoteSent" VARCHAR(20) DEFAULT 'ASK',
  "emailOnInvoiceCreated" VARCHAR(20) DEFAULT 'ASK',
  "emailOnMeetingReminder" VARCHAR(20) DEFAULT 'ASK',
  
  -- SMS tercihleri
  "smsOnDealCreated" VARCHAR(20) DEFAULT 'NEVER', -- SMS genelde opsiyonel
  "smsOnQuoteSent" VARCHAR(20) DEFAULT 'NEVER',
  "smsOnInvoiceCreated" VARCHAR(20) DEFAULT 'NEVER',
  "smsOnMeetingReminder" VARCHAR(20) DEFAULT 'ASK',
  
  -- WhatsApp tercihleri
  "whatsappOnDealCreated" VARCHAR(20) DEFAULT 'NEVER',
  "whatsappOnQuoteSent" VARCHAR(20) DEFAULT 'NEVER',
  "whatsappOnInvoiceCreated" VARCHAR(20) DEFAULT 'NEVER',
  "whatsappOnMeetingReminder" VARCHAR(20) DEFAULT 'NEVER',
  
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("userId", "companyId")
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_userautomationpreference_user ON "UserAutomationPreference"("userId");
CREATE INDEX IF NOT EXISTS idx_userautomationpreference_company ON "UserAutomationPreference"("companyId");

-- RLS Policies
ALTER TABLE "UserAutomationPreference" ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi tercihlerini görebilir
CREATE POLICY "Users can view their own automation preferences"
  ON "UserAutomationPreference"
  FOR SELECT
  USING (
    auth.uid()::text = "userId"::text OR
    EXISTS (
      SELECT 1 FROM "User"
      WHERE "User".id = auth.uid()::uuid
      AND ("User".role = 'ADMIN' OR "User".role = 'SUPER_ADMIN')
      AND "User"."companyId" = "UserAutomationPreference"."companyId"
    )
  );

-- Kullanıcılar sadece kendi tercihlerini güncelleyebilir
CREATE POLICY "Users can update their own automation preferences"
  ON "UserAutomationPreference"
  FOR UPDATE
  USING (
    auth.uid()::text = "userId"::text OR
    EXISTS (
      SELECT 1 FROM "User"
      WHERE "User".id = auth.uid()::uuid
      AND ("User".role = 'ADMIN' OR "User".role = 'SUPER_ADMIN')
      AND "User"."companyId" = "UserAutomationPreference"."companyId"
    )
  );

-- Kullanıcılar sadece kendi tercihlerini oluşturabilir
CREATE POLICY "Users can insert their own automation preferences"
  ON "UserAutomationPreference"
  FOR INSERT
  WITH CHECK (
    auth.uid()::text = "userId"::text OR
    EXISTS (
      SELECT 1 FROM "User"
      WHERE "User".id = auth.uid()::uuid
      AND ("User".role = 'ADMIN' OR "User".role = 'SUPER_ADMIN')
      AND "User"."companyId" = "UserAutomationPreference"."companyId"
    )
  );

-- SuperAdmin tüm tercihleri görebilir
CREATE POLICY "SuperAdmin can view all automation preferences"
  ON "UserAutomationPreference"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE "User".id = auth.uid()::uuid
      AND "User".role = 'SUPER_ADMIN'
    )
  );



