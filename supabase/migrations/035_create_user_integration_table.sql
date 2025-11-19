-- UserIntegration Table Migration
-- Kullanıcı bazlı entegrasyonlar için (Google Calendar vb.)

BEGIN;

CREATE TABLE IF NOT EXISTS "UserIntegration" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "integrationType" TEXT NOT NULL, -- 'GOOGLE_CALENDAR', 'GOOGLE_EMAIL', vb.
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "tokenExpiresAt" TIMESTAMP WITH TIME ZONE,
  "status" TEXT DEFAULT 'INACTIVE', -- 'ACTIVE', 'INACTIVE', 'ERROR'
  "lastError" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("userId", "companyId", "integrationType")
);

-- Index'ler (performans için)
CREATE INDEX IF NOT EXISTS idx_userintegration_user ON "UserIntegration"("userId");
CREATE INDEX IF NOT EXISTS idx_userintegration_company ON "UserIntegration"("companyId");
CREATE INDEX IF NOT EXISTS idx_userintegration_type ON "UserIntegration"("integrationType");
CREATE INDEX IF NOT EXISTS idx_userintegration_status ON "UserIntegration"("status");

-- RLS Policies
ALTER TABLE "UserIntegration" ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi entegrasyonlarını görebilir
DROP POLICY IF EXISTS "userintegration_user_isolation" ON "UserIntegration";
CREATE POLICY "userintegration_user_isolation" ON "UserIntegration"
  FOR ALL
  USING (
    auth.uid()::text IN (
      SELECT id::text FROM "User" WHERE id = "UserIntegration"."userId"
    )
  );

-- SuperAdmin tüm entegrasyonları görebilir
DROP POLICY IF EXISTS "userintegration_superadmin_access" ON "UserIntegration";
CREATE POLICY "userintegration_superadmin_access" ON "UserIntegration"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE id::text = auth.uid()::text
      AND role = 'SUPER_ADMIN'
    )
  );

-- ============================================
-- TRIGGER: updatedAt Otomatik Güncelleme
-- ============================================
CREATE OR REPLACE FUNCTION set_userintegration_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_userintegration_updated_at ON "UserIntegration";
CREATE TRIGGER trigger_userintegration_updated_at
  BEFORE UPDATE ON "UserIntegration"
  FOR EACH ROW
  EXECUTE FUNCTION set_userintegration_updated_at();

-- ============================================
-- TRIGGER: ActivityLog Kayıtları
-- ============================================
CREATE OR REPLACE FUNCTION handle_userintegration_activity()
RETURNS TRIGGER AS $$
DECLARE
  integration_type_name TEXT;
  user_name TEXT;
BEGIN
  -- Integration type'ı okunabilir formata çevir
  integration_type_name := CASE NEW."integrationType"
    WHEN 'GOOGLE_CALENDAR' THEN 'Google Takvim'
    WHEN 'GOOGLE_EMAIL' THEN 'Google E-posta'
    WHEN 'MICROSOFT_CALENDAR' THEN 'Microsoft Takvim'
    WHEN 'MICROSOFT_EMAIL' THEN 'Microsoft E-posta'
    ELSE NEW."integrationType"
  END;

  -- Kullanıcı adını al
  SELECT name INTO user_name FROM "User" WHERE id = NEW."userId" LIMIT 1;

  -- INSERT durumu
  IF TG_OP = 'INSERT' THEN
    BEGIN
      INSERT INTO "ActivityLog" (
        entity,
        action,
        description,
        meta,
        "companyId",
        "userId"
      )
      VALUES (
        'UserIntegration',
        'CREATE',
        'Yeni entegrasyon eklendi: ' || integration_type_name,
        jsonb_build_object(
          'integrationId', NEW.id,
          'integrationType', NEW."integrationType",
          'status', NEW.status,
          'userName', COALESCE(user_name, 'Bilinmeyen')
        ),
        NEW."companyId",
        NEW."userId"
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not create activity log for user integration: %', SQLERRM;
    END;
  END IF;

  -- UPDATE durumu - Status değişikliği önemli
  IF TG_OP = 'UPDATE' THEN
    -- Status değiştiyse özel kayıt
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      BEGIN
        INSERT INTO "ActivityLog" (
          entity,
          action,
          description,
          meta,
          "companyId",
          "userId"
        )
        VALUES (
          'UserIntegration',
          'UPDATE',
          'Entegrasyon durumu değişti: ' || integration_type_name || ' → ' || NEW.status,
          jsonb_build_object(
            'integrationId', NEW.id,
            'integrationType', NEW."integrationType",
            'oldStatus', OLD.status,
            'newStatus', NEW.status,
            'userName', COALESCE(user_name, 'Bilinmeyen')
          ),
          NEW."companyId",
          NEW."userId"
        );
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not create activity log for user integration status change: %', SQLERRM;
      END;
    END IF;

    -- Token yenilendiğinde kayıt
    IF OLD."accessToken" IS DISTINCT FROM NEW."accessToken" AND NEW."accessToken" IS NOT NULL THEN
      BEGIN
        INSERT INTO "ActivityLog" (
          entity,
          action,
          description,
          meta,
          "companyId",
          "userId"
        )
        VALUES (
          'UserIntegration',
          'UPDATE',
          'Entegrasyon token yenilendi: ' || integration_type_name,
          jsonb_build_object(
            'integrationId', NEW.id,
            'integrationType', NEW."integrationType",
            'status', NEW.status
          ),
          NEW."companyId",
          NEW."userId"
        );
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not create activity log for token refresh: %', SQLERRM;
      END;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_userintegration_activity ON "UserIntegration";
CREATE TRIGGER trigger_userintegration_activity
  AFTER INSERT OR UPDATE ON "UserIntegration"
  FOR EACH ROW
  EXECUTE FUNCTION handle_userintegration_activity();

-- ============================================
-- TRIGGER: Notification Sistemi
-- ============================================
CREATE OR REPLACE FUNCTION notify_userintegration_status_change()
RETURNS TRIGGER AS $$
DECLARE
  integration_type_name TEXT;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Sadece status değişikliğinde bildirim gönder
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Integration type'ı okunabilir formata çevir
    integration_type_name := CASE NEW."integrationType"
      WHEN 'GOOGLE_CALENDAR' THEN 'Google Takvim'
      WHEN 'GOOGLE_EMAIL' THEN 'Google E-posta'
      WHEN 'MICROSOFT_CALENDAR' THEN 'Microsoft Takvim'
      WHEN 'MICROSOFT_EMAIL' THEN 'Microsoft E-posta'
      ELSE NEW."integrationType"
    END;

    -- Status'a göre bildirim mesajı
    IF NEW.status = 'ACTIVE' THEN
      notification_title := '✅ Entegrasyon Aktif';
      notification_message := integration_type_name || ' entegrasyonu başarıyla aktifleştirildi.';
    ELSIF NEW.status = 'ERROR' THEN
      notification_title := '⚠️ Entegrasyon Hatası';
      notification_message := integration_type_name || ' entegrasyonunda hata oluştu.';
      IF NEW."lastError" IS NOT NULL THEN
        notification_message := notification_message || ' Hata: ' || NEW."lastError";
      END IF;
    ELSIF NEW.status = 'INACTIVE' THEN
      notification_title := '🔴 Entegrasyon Devre Dışı';
      notification_message := integration_type_name || ' entegrasyonu devre dışı bırakıldı.';
    END IF;

    -- Notification oluştur
    BEGIN
      INSERT INTO "Notification" (
        title,
        message,
        type,
        "relatedTo",
        "relatedId",
        "companyId",
        "userId"
      )
      VALUES (
        notification_title,
        notification_message,
        CASE NEW.status
          WHEN 'ACTIVE' THEN 'success'
          WHEN 'ERROR' THEN 'error'
          ELSE 'warning'
        END,
        'UserIntegration',
        NEW.id,
        NEW."companyId",
        NEW."userId"
      )
      ON CONFLICT DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not create notification for user integration: %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_userintegration_notification ON "UserIntegration";
CREATE TRIGGER trigger_userintegration_notification
  AFTER UPDATE OF status ON "UserIntegration"
  FOR EACH ROW
  EXECUTE FUNCTION notify_userintegration_status_change();

-- ============================================
-- FUNCTION: Token Expiry Kontrolü
-- ============================================
CREATE OR REPLACE FUNCTION check_token_expiry()
RETURNS void AS $$
BEGIN
  -- Token'ı süresi dolmuş entegrasyonları ERROR durumuna al
  UPDATE "UserIntegration"
  SET 
    status = 'ERROR',
    "lastError" = 'Token süresi doldu. Lütfen yenileyin.',
    "updatedAt" = NOW()
  WHERE 
    status = 'ACTIVE'
    AND "tokenExpiresAt" IS NOT NULL
    AND "tokenExpiresAt" < NOW()
    AND "refreshToken" IS NULL; -- Refresh token yoksa hata ver

  -- Refresh token varsa ama access token yoksa da hata ver
  UPDATE "UserIntegration"
  SET 
    status = 'ERROR',
    "lastError" = 'Access token eksik. Lütfen yeniden bağlanın.',
    "updatedAt" = NOW()
  WHERE 
    status = 'ACTIVE'
    AND "accessToken" IS NULL
    AND "refreshToken" IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Bu fonksiyon manuel olarak veya cron job ile çağrılabilir
-- Örnek: SELECT check_token_expiry();

COMMIT;

