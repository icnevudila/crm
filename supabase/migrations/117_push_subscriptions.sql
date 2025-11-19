-- ============================================
-- CRM V3 - PUSH SUBSCRIPTIONS
-- Migration: 117
-- Tarih: 2024
-- Amaç: Web Push Notifications için PushSubscription tablosu
-- ============================================

-- PushSubscription tablosu oluştur
CREATE TABLE IF NOT EXISTS "PushSubscription" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("userId", endpoint)
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_push_subscription_user 
  ON "PushSubscription"("userId");

CREATE INDEX IF NOT EXISTS idx_push_subscription_company 
  ON "PushSubscription"("companyId");

CREATE INDEX IF NOT EXISTS idx_push_subscription_endpoint 
  ON "PushSubscription"("endpoint");

-- RLS Policies
ALTER TABLE "PushSubscription" ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi subscription'larını görebilir
CREATE POLICY "Users can view own push subscriptions"
  ON "PushSubscription"
  FOR SELECT
  USING (auth.uid()::text = "userId"::text);

-- Kullanıcılar sadece kendi subscription'larını oluşturabilir
CREATE POLICY "Users can insert own push subscriptions"
  ON "PushSubscription"
  FOR INSERT
  WITH CHECK (auth.uid()::text = "userId"::text);

-- Kullanıcılar sadece kendi subscription'larını güncelleyebilir
CREATE POLICY "Users can update own push subscriptions"
  ON "PushSubscription"
  FOR UPDATE
  USING (auth.uid()::text = "userId"::text);

-- Kullanıcılar sadece kendi subscription'larını silebilir
CREATE POLICY "Users can delete own push subscriptions"
  ON "PushSubscription"
  FOR DELETE
  USING (auth.uid()::text = "userId"::text);

-- SuperAdmin tüm subscription'ları görebilir (API'den)
-- Service role kullanıldığı için RLS bypass edilir

-- Yorumlar
COMMENT ON TABLE "PushSubscription" IS 'Web Push Notifications için kullanıcı subscription bilgileri';
COMMENT ON COLUMN "PushSubscription"."endpoint" IS 'Push service endpoint URL';
COMMENT ON COLUMN "PushSubscription"."p256dh" IS 'P256DH public key (base64)';
COMMENT ON COLUMN "PushSubscription"."auth" IS 'Auth secret (base64)';

