-- Notification table - Kullanıcı bildirimleri için
CREATE TABLE IF NOT EXISTS "Notification" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info', -- info, success, warning, error, task_assigned, etc.
  "entityType" VARCHAR(100), -- Task, Deal, Quote, Invoice, etc.
  "entityId" UUID, -- İlgili entity'nin ID'si
  read BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index'ler (Performans için)
CREATE INDEX IF NOT EXISTS idx_notification_user ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS idx_notification_company ON "Notification"("companyId");
CREATE INDEX IF NOT EXISTS idx_notification_read ON "Notification"("read");
CREATE INDEX IF NOT EXISTS idx_notification_created ON "Notification"("createdAt");

-- RLS Policies
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi bildirimlerini görebilir
CREATE POLICY "Users can view their own notifications"
  ON "Notification" FOR SELECT
  USING (auth.uid()::text = (SELECT id::text FROM "User" WHERE id = "Notification"."userId"));

-- SuperAdmin tüm bildirimleri görebilir
CREATE POLICY "SuperAdmin can view all notifications"
  ON "Notification" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE id::text = auth.uid()::text
      AND role = 'SUPER_ADMIN'
    )
  );




