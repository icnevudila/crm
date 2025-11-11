-- CRM V3 - Smart Notification Layer (Light Edition)
-- Priority, Auto-Reminder, and Click-to-Action integration for notifications
-- Mevcut schema'ya zarar vermez, güvenli migration

-- ============================================
-- 1. ADD LIGHT INTELLIGENCE FIELDS
-- ============================================
ALTER TABLE "Notification"
ADD COLUMN IF NOT EXISTS priority TEXT CHECK (priority IN ('low', 'normal', 'high', 'critical')) DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "actionType" TEXT,  -- optional follow-up action (e.g., "create_task")
ADD COLUMN IF NOT EXISTS "actionDone" BOOLEAN DEFAULT false;

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_notification_priority ON "Notification"(priority);
CREATE INDEX IF NOT EXISTS idx_notification_expires ON "Notification"("expiresAt") WHERE "expiresAt" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notification_action ON "Notification"("actionType") WHERE "actionType" IS NOT NULL;

-- ============================================
-- 2. SMART DEADLINE REMINDER (Auto notification for expiring quotes)
-- ============================================
CREATE OR REPLACE FUNCTION auto_notify_quote_expiring()
RETURNS TRIGGER AS $$
BEGIN
  -- Teklif SENT durumunda ve 2 gün içinde geçerliliğini yitirecekse bildirim gönder
  IF NEW.status = 'SENT' AND NEW."expiryDate" IS NOT NULL AND NEW."expiryDate" <= (NOW() + INTERVAL '2 days') THEN
    -- Sadece daha önce bildirim gönderilmemişse gönder (status değişikliği kontrolü)
    IF OLD.status IS NULL OR OLD.status != 'SENT' OR OLD."expiryDate" IS NULL OR OLD."expiryDate" > (NOW() + INTERVAL '2 days') THEN
      INSERT INTO "Notification" ("userId", "companyId", title, message, type, priority, "relatedTo", "relatedId", link, "expiresAt")
      SELECT 
        u.id,
        NEW."companyId",
        'Teklif Süresi Dolmak Üzere',
        'Teklif #' || SUBSTRING(NEW.id::TEXT, 1, 8) || ' 2 gün içinde geçerliliğini yitirecek. Detayları görmek ister misiniz?',
        'warning',
        'high',
        'Quote',
        NEW.id,
        '/tr/quotes/' || NEW.id,
        NEW."expiryDate"  -- Bildirim de teklifle birlikte geçersiz olacak
      FROM "User" u
      WHERE u."companyId" = NEW."companyId"
        AND u.role IN ('ADMIN', 'SALES')  -- SuperAdmin'e bildirim gönderme (filtreleme)
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_quote_expiring ON "Quote";
CREATE TRIGGER trg_quote_expiring
  AFTER INSERT OR UPDATE ON "Quote"
  FOR EACH ROW
  WHEN (NEW."expiryDate" IS NOT NULL AND NEW.status = 'SENT')
  EXECUTE FUNCTION auto_notify_quote_expiring();

-- ============================================
-- 3. AUTO-ACTION FOR CRITICAL NOTIFICATIONS → Create task suggestion
-- ============================================
CREATE OR REPLACE FUNCTION auto_task_from_critical_notification()
RETURNS TRIGGER AS $$
DECLARE
  task_id UUID;
BEGIN
  -- Kritik bildirim ve action_type = 'create_task' ise otomatik görev oluştur
  IF NEW.priority = 'critical' AND NEW."actionType" = 'create_task' AND NEW."actionDone" = false THEN
    -- Task tablosuna görev ekle
    INSERT INTO "Task" (title, status, "companyId", "assignedTo", "createdAt")
    VALUES (
      NEW.title || ' - Aksiyon Gerekiyor',
      'TODO',
      NEW."companyId",
      NEW."userId",
      NOW()
    )
    RETURNING id INTO task_id;
    
    -- Bildirimi action_done olarak işaretle
    UPDATE "Notification" 
    SET "actionDone" = true 
    WHERE id = NEW.id;
    
    -- ActivityLog kaydı
    INSERT INTO "ActivityLog" (entity, action, description, meta, "userId", "companyId")
    VALUES (
      'Task',
      'CREATE',
      'Kritik bildirimden otomatik görev oluşturuldu: ' || NEW.title,
      jsonb_build_object(
        'entity', 'Task',
        'action', 'create',
        'id', task_id,
        'fromNotification', NEW.id
      ),
      NEW."userId",
      NEW."companyId"
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_task_on_notification ON "Notification";
CREATE TRIGGER trg_auto_task_on_notification
  AFTER INSERT ON "Notification"
  FOR EACH ROW
  WHEN (NEW.priority = 'critical' AND NEW."actionType" IS NOT NULL)
  EXECUTE FUNCTION auto_task_from_critical_notification();

-- ============================================
-- 4. AUTO-ARCHIVE EXPIRED NOTIFICATIONS
-- ============================================
CREATE OR REPLACE FUNCTION auto_archive_expired_notifications()
RETURNS void AS $$
BEGIN
  -- Süresi dolan bildirimleri otomatik olarak okundu işaretle
  UPDATE "Notification"
  SET "isRead" = true
  WHERE "expiresAt" IS NOT NULL 
    AND "expiresAt" < NOW() 
    AND "isRead" = false;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. COMMENT'LER
-- ============================================
COMMENT ON COLUMN "Notification".priority IS 'Bildirim önceliği: low, normal, high, critical';
COMMENT ON COLUMN "Notification"."expiresAt" IS 'Bildirim geçerlilik tarihi (otomatik arşivleme için)';
COMMENT ON COLUMN "Notification"."actionType" IS 'İsteğe bağlı aksiyon tipi (örn: create_task)';
COMMENT ON COLUMN "Notification"."actionDone" IS 'Aksiyon tamamlandı mı?';

-- ============================================
-- MIGRATION TAMAMLANDI
-- ============================================


-- Mevcut schema'ya zarar vermez, güvenli migration

-- ============================================
-- 1. ADD LIGHT INTELLIGENCE FIELDS
-- ============================================
ALTER TABLE "Notification"
ADD COLUMN IF NOT EXISTS priority TEXT CHECK (priority IN ('low', 'normal', 'high', 'critical')) DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "actionType" TEXT,  -- optional follow-up action (e.g., "create_task")
ADD COLUMN IF NOT EXISTS "actionDone" BOOLEAN DEFAULT false;

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_notification_priority ON "Notification"(priority);
CREATE INDEX IF NOT EXISTS idx_notification_expires ON "Notification"("expiresAt") WHERE "expiresAt" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notification_action ON "Notification"("actionType") WHERE "actionType" IS NOT NULL;

-- ============================================
-- 2. SMART DEADLINE REMINDER (Auto notification for expiring quotes)
-- ============================================
CREATE OR REPLACE FUNCTION auto_notify_quote_expiring()
RETURNS TRIGGER AS $$
BEGIN
  -- Teklif SENT durumunda ve 2 gün içinde geçerliliğini yitirecekse bildirim gönder
  IF NEW.status = 'SENT' AND NEW."expiryDate" IS NOT NULL AND NEW."expiryDate" <= (NOW() + INTERVAL '2 days') THEN
    -- Sadece daha önce bildirim gönderilmemişse gönder (status değişikliği kontrolü)
    IF OLD.status IS NULL OR OLD.status != 'SENT' OR OLD."expiryDate" IS NULL OR OLD."expiryDate" > (NOW() + INTERVAL '2 days') THEN
      INSERT INTO "Notification" ("userId", "companyId", title, message, type, priority, "relatedTo", "relatedId", link, "expiresAt")
      SELECT 
        u.id,
        NEW."companyId",
        'Teklif Süresi Dolmak Üzere',
        'Teklif #' || SUBSTRING(NEW.id::TEXT, 1, 8) || ' 2 gün içinde geçerliliğini yitirecek. Detayları görmek ister misiniz?',
        'warning',
        'high',
        'Quote',
        NEW.id,
        '/tr/quotes/' || NEW.id,
        NEW."expiryDate"  -- Bildirim de teklifle birlikte geçersiz olacak
      FROM "User" u
      WHERE u."companyId" = NEW."companyId"
        AND u.role IN ('ADMIN', 'SALES')  -- SuperAdmin'e bildirim gönderme (filtreleme)
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_quote_expiring ON "Quote";
CREATE TRIGGER trg_quote_expiring
  AFTER INSERT OR UPDATE ON "Quote"
  FOR EACH ROW
  WHEN (NEW."expiryDate" IS NOT NULL AND NEW.status = 'SENT')
  EXECUTE FUNCTION auto_notify_quote_expiring();

-- ============================================
-- 3. AUTO-ACTION FOR CRITICAL NOTIFICATIONS → Create task suggestion
-- ============================================
CREATE OR REPLACE FUNCTION auto_task_from_critical_notification()
RETURNS TRIGGER AS $$
DECLARE
  task_id UUID;
BEGIN
  -- Kritik bildirim ve action_type = 'create_task' ise otomatik görev oluştur
  IF NEW.priority = 'critical' AND NEW."actionType" = 'create_task' AND NEW."actionDone" = false THEN
    -- Task tablosuna görev ekle
    INSERT INTO "Task" (title, status, "companyId", "assignedTo", "createdAt")
    VALUES (
      NEW.title || ' - Aksiyon Gerekiyor',
      'TODO',
      NEW."companyId",
      NEW."userId",
      NOW()
    )
    RETURNING id INTO task_id;
    
    -- Bildirimi action_done olarak işaretle
    UPDATE "Notification" 
    SET "actionDone" = true 
    WHERE id = NEW.id;
    
    -- ActivityLog kaydı
    INSERT INTO "ActivityLog" (entity, action, description, meta, "userId", "companyId")
    VALUES (
      'Task',
      'CREATE',
      'Kritik bildirimden otomatik görev oluşturuldu: ' || NEW.title,
      jsonb_build_object(
        'entity', 'Task',
        'action', 'create',
        'id', task_id,
        'fromNotification', NEW.id
      ),
      NEW."userId",
      NEW."companyId"
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_task_on_notification ON "Notification";
CREATE TRIGGER trg_auto_task_on_notification
  AFTER INSERT ON "Notification"
  FOR EACH ROW
  WHEN (NEW.priority = 'critical' AND NEW."actionType" IS NOT NULL)
  EXECUTE FUNCTION auto_task_from_critical_notification();

-- ============================================
-- 4. AUTO-ARCHIVE EXPIRED NOTIFICATIONS
-- ============================================
CREATE OR REPLACE FUNCTION auto_archive_expired_notifications()
RETURNS void AS $$
BEGIN
  -- Süresi dolan bildirimleri otomatik olarak okundu işaretle
  UPDATE "Notification"
  SET "isRead" = true
  WHERE "expiresAt" IS NOT NULL 
    AND "expiresAt" < NOW() 
    AND "isRead" = false;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. COMMENT'LER
-- ============================================
COMMENT ON COLUMN "Notification".priority IS 'Bildirim önceliği: low, normal, high, critical';
COMMENT ON COLUMN "Notification"."expiresAt" IS 'Bildirim geçerlilik tarihi (otomatik arşivleme için)';
COMMENT ON COLUMN "Notification"."actionType" IS 'İsteğe bağlı aksiyon tipi (örn: create_task)';
COMMENT ON COLUMN "Notification"."actionDone" IS 'Aksiyon tamamlandı mı?';

-- ============================================
-- MIGRATION TAMAMLANDI
-- ============================================


-- Mevcut schema'ya zarar vermez, güvenli migration

-- ============================================
-- 1. ADD LIGHT INTELLIGENCE FIELDS
-- ============================================
ALTER TABLE "Notification"
ADD COLUMN IF NOT EXISTS priority TEXT CHECK (priority IN ('low', 'normal', 'high', 'critical')) DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "actionType" TEXT,  -- optional follow-up action (e.g., "create_task")
ADD COLUMN IF NOT EXISTS "actionDone" BOOLEAN DEFAULT false;

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_notification_priority ON "Notification"(priority);
CREATE INDEX IF NOT EXISTS idx_notification_expires ON "Notification"("expiresAt") WHERE "expiresAt" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notification_action ON "Notification"("actionType") WHERE "actionType" IS NOT NULL;

-- ============================================
-- 2. SMART DEADLINE REMINDER (Auto notification for expiring quotes)
-- ============================================
CREATE OR REPLACE FUNCTION auto_notify_quote_expiring()
RETURNS TRIGGER AS $$
BEGIN
  -- Teklif SENT durumunda ve 2 gün içinde geçerliliğini yitirecekse bildirim gönder
  IF NEW.status = 'SENT' AND NEW."expiryDate" IS NOT NULL AND NEW."expiryDate" <= (NOW() + INTERVAL '2 days') THEN
    -- Sadece daha önce bildirim gönderilmemişse gönder (status değişikliği kontrolü)
    IF OLD.status IS NULL OR OLD.status != 'SENT' OR OLD."expiryDate" IS NULL OR OLD."expiryDate" > (NOW() + INTERVAL '2 days') THEN
      INSERT INTO "Notification" ("userId", "companyId", title, message, type, priority, "relatedTo", "relatedId", link, "expiresAt")
      SELECT 
        u.id,
        NEW."companyId",
        'Teklif Süresi Dolmak Üzere',
        'Teklif #' || SUBSTRING(NEW.id::TEXT, 1, 8) || ' 2 gün içinde geçerliliğini yitirecek. Detayları görmek ister misiniz?',
        'warning',
        'high',
        'Quote',
        NEW.id,
        '/tr/quotes/' || NEW.id,
        NEW."expiryDate"  -- Bildirim de teklifle birlikte geçersiz olacak
      FROM "User" u
      WHERE u."companyId" = NEW."companyId"
        AND u.role IN ('ADMIN', 'SALES')  -- SuperAdmin'e bildirim gönderme (filtreleme)
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_quote_expiring ON "Quote";
CREATE TRIGGER trg_quote_expiring
  AFTER INSERT OR UPDATE ON "Quote"
  FOR EACH ROW
  WHEN (NEW."expiryDate" IS NOT NULL AND NEW.status = 'SENT')
  EXECUTE FUNCTION auto_notify_quote_expiring();

-- ============================================
-- 3. AUTO-ACTION FOR CRITICAL NOTIFICATIONS → Create task suggestion
-- ============================================
CREATE OR REPLACE FUNCTION auto_task_from_critical_notification()
RETURNS TRIGGER AS $$
DECLARE
  task_id UUID;
BEGIN
  -- Kritik bildirim ve action_type = 'create_task' ise otomatik görev oluştur
  IF NEW.priority = 'critical' AND NEW."actionType" = 'create_task' AND NEW."actionDone" = false THEN
    -- Task tablosuna görev ekle
    INSERT INTO "Task" (title, status, "companyId", "assignedTo", "createdAt")
    VALUES (
      NEW.title || ' - Aksiyon Gerekiyor',
      'TODO',
      NEW."companyId",
      NEW."userId",
      NOW()
    )
    RETURNING id INTO task_id;
    
    -- Bildirimi action_done olarak işaretle
    UPDATE "Notification" 
    SET "actionDone" = true 
    WHERE id = NEW.id;
    
    -- ActivityLog kaydı
    INSERT INTO "ActivityLog" (entity, action, description, meta, "userId", "companyId")
    VALUES (
      'Task',
      'CREATE',
      'Kritik bildirimden otomatik görev oluşturuldu: ' || NEW.title,
      jsonb_build_object(
        'entity', 'Task',
        'action', 'create',
        'id', task_id,
        'fromNotification', NEW.id
      ),
      NEW."userId",
      NEW."companyId"
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_task_on_notification ON "Notification";
CREATE TRIGGER trg_auto_task_on_notification
  AFTER INSERT ON "Notification"
  FOR EACH ROW
  WHEN (NEW.priority = 'critical' AND NEW."actionType" IS NOT NULL)
  EXECUTE FUNCTION auto_task_from_critical_notification();

-- ============================================
-- 4. AUTO-ARCHIVE EXPIRED NOTIFICATIONS
-- ============================================
CREATE OR REPLACE FUNCTION auto_archive_expired_notifications()
RETURNS void AS $$
BEGIN
  -- Süresi dolan bildirimleri otomatik olarak okundu işaretle
  UPDATE "Notification"
  SET "isRead" = true
  WHERE "expiresAt" IS NOT NULL 
    AND "expiresAt" < NOW() 
    AND "isRead" = false;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. COMMENT'LER
-- ============================================
COMMENT ON COLUMN "Notification".priority IS 'Bildirim önceliği: low, normal, high, critical';
COMMENT ON COLUMN "Notification"."expiresAt" IS 'Bildirim geçerlilik tarihi (otomatik arşivleme için)';
COMMENT ON COLUMN "Notification"."actionType" IS 'İsteğe bağlı aksiyon tipi (örn: create_task)';
COMMENT ON COLUMN "Notification"."actionDone" IS 'Aksiyon tamamlandı mı?';

-- ============================================
-- MIGRATION TAMAMLANDI
-- ============================================


-- Mevcut schema'ya zarar vermez, güvenli migration

-- ============================================
-- 1. ADD LIGHT INTELLIGENCE FIELDS
-- ============================================
ALTER TABLE "Notification"
ADD COLUMN IF NOT EXISTS priority TEXT CHECK (priority IN ('low', 'normal', 'high', 'critical')) DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "actionType" TEXT,  -- optional follow-up action (e.g., "create_task")
ADD COLUMN IF NOT EXISTS "actionDone" BOOLEAN DEFAULT false;

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_notification_priority ON "Notification"(priority);
CREATE INDEX IF NOT EXISTS idx_notification_expires ON "Notification"("expiresAt") WHERE "expiresAt" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notification_action ON "Notification"("actionType") WHERE "actionType" IS NOT NULL;

-- ============================================
-- 2. SMART DEADLINE REMINDER (Auto notification for expiring quotes)
-- ============================================
CREATE OR REPLACE FUNCTION auto_notify_quote_expiring()
RETURNS TRIGGER AS $$
BEGIN
  -- Teklif SENT durumunda ve 2 gün içinde geçerliliğini yitirecekse bildirim gönder
  IF NEW.status = 'SENT' AND NEW."expiryDate" IS NOT NULL AND NEW."expiryDate" <= (NOW() + INTERVAL '2 days') THEN
    -- Sadece daha önce bildirim gönderilmemişse gönder (status değişikliği kontrolü)
    IF OLD.status IS NULL OR OLD.status != 'SENT' OR OLD."expiryDate" IS NULL OR OLD."expiryDate" > (NOW() + INTERVAL '2 days') THEN
      INSERT INTO "Notification" ("userId", "companyId", title, message, type, priority, "relatedTo", "relatedId", link, "expiresAt")
      SELECT 
        u.id,
        NEW."companyId",
        'Teklif Süresi Dolmak Üzere',
        'Teklif #' || SUBSTRING(NEW.id::TEXT, 1, 8) || ' 2 gün içinde geçerliliğini yitirecek. Detayları görmek ister misiniz?',
        'warning',
        'high',
        'Quote',
        NEW.id,
        '/tr/quotes/' || NEW.id,
        NEW."expiryDate"  -- Bildirim de teklifle birlikte geçersiz olacak
      FROM "User" u
      WHERE u."companyId" = NEW."companyId"
        AND u.role IN ('ADMIN', 'SALES')  -- SuperAdmin'e bildirim gönderme (filtreleme)
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_quote_expiring ON "Quote";
CREATE TRIGGER trg_quote_expiring
  AFTER INSERT OR UPDATE ON "Quote"
  FOR EACH ROW
  WHEN (NEW."expiryDate" IS NOT NULL AND NEW.status = 'SENT')
  EXECUTE FUNCTION auto_notify_quote_expiring();

-- ============================================
-- 3. AUTO-ACTION FOR CRITICAL NOTIFICATIONS → Create task suggestion
-- ============================================
CREATE OR REPLACE FUNCTION auto_task_from_critical_notification()
RETURNS TRIGGER AS $$
DECLARE
  task_id UUID;
BEGIN
  -- Kritik bildirim ve action_type = 'create_task' ise otomatik görev oluştur
  IF NEW.priority = 'critical' AND NEW."actionType" = 'create_task' AND NEW."actionDone" = false THEN
    -- Task tablosuna görev ekle
    INSERT INTO "Task" (title, status, "companyId", "assignedTo", "createdAt")
    VALUES (
      NEW.title || ' - Aksiyon Gerekiyor',
      'TODO',
      NEW."companyId",
      NEW."userId",
      NOW()
    )
    RETURNING id INTO task_id;
    
    -- Bildirimi action_done olarak işaretle
    UPDATE "Notification" 
    SET "actionDone" = true 
    WHERE id = NEW.id;
    
    -- ActivityLog kaydı
    INSERT INTO "ActivityLog" (entity, action, description, meta, "userId", "companyId")
    VALUES (
      'Task',
      'CREATE',
      'Kritik bildirimden otomatik görev oluşturuldu: ' || NEW.title,
      jsonb_build_object(
        'entity', 'Task',
        'action', 'create',
        'id', task_id,
        'fromNotification', NEW.id
      ),
      NEW."userId",
      NEW."companyId"
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_task_on_notification ON "Notification";
CREATE TRIGGER trg_auto_task_on_notification
  AFTER INSERT ON "Notification"
  FOR EACH ROW
  WHEN (NEW.priority = 'critical' AND NEW."actionType" IS NOT NULL)
  EXECUTE FUNCTION auto_task_from_critical_notification();

-- ============================================
-- 4. AUTO-ARCHIVE EXPIRED NOTIFICATIONS
-- ============================================
CREATE OR REPLACE FUNCTION auto_archive_expired_notifications()
RETURNS void AS $$
BEGIN
  -- Süresi dolan bildirimleri otomatik olarak okundu işaretle
  UPDATE "Notification"
  SET "isRead" = true
  WHERE "expiresAt" IS NOT NULL 
    AND "expiresAt" < NOW() 
    AND "isRead" = false;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. COMMENT'LER
-- ============================================
COMMENT ON COLUMN "Notification".priority IS 'Bildirim önceliği: low, normal, high, critical';
COMMENT ON COLUMN "Notification"."expiresAt" IS 'Bildirim geçerlilik tarihi (otomatik arşivleme için)';
COMMENT ON COLUMN "Notification"."actionType" IS 'İsteğe bağlı aksiyon tipi (örn: create_task)';
COMMENT ON COLUMN "Notification"."actionDone" IS 'Aksiyon tamamlandı mı?';

-- ============================================
-- MIGRATION TAMAMLANDI
-- ============================================


-- Mevcut schema'ya zarar vermez, güvenli migration

-- ============================================
-- 1. ADD LIGHT INTELLIGENCE FIELDS
-- ============================================
ALTER TABLE "Notification"
ADD COLUMN IF NOT EXISTS priority TEXT CHECK (priority IN ('low', 'normal', 'high', 'critical')) DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "actionType" TEXT,  -- optional follow-up action (e.g., "create_task")
ADD COLUMN IF NOT EXISTS "actionDone" BOOLEAN DEFAULT false;

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_notification_priority ON "Notification"(priority);
CREATE INDEX IF NOT EXISTS idx_notification_expires ON "Notification"("expiresAt") WHERE "expiresAt" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notification_action ON "Notification"("actionType") WHERE "actionType" IS NOT NULL;

-- ============================================
-- 2. SMART DEADLINE REMINDER (Auto notification for expiring quotes)
-- ============================================
CREATE OR REPLACE FUNCTION auto_notify_quote_expiring()
RETURNS TRIGGER AS $$
BEGIN
  -- Teklif SENT durumunda ve 2 gün içinde geçerliliğini yitirecekse bildirim gönder
  IF NEW.status = 'SENT' AND NEW."expiryDate" IS NOT NULL AND NEW."expiryDate" <= (NOW() + INTERVAL '2 days') THEN
    -- Sadece daha önce bildirim gönderilmemişse gönder (status değişikliği kontrolü)
    IF OLD.status IS NULL OR OLD.status != 'SENT' OR OLD."expiryDate" IS NULL OR OLD."expiryDate" > (NOW() + INTERVAL '2 days') THEN
      INSERT INTO "Notification" ("userId", "companyId", title, message, type, priority, "relatedTo", "relatedId", link, "expiresAt")
      SELECT 
        u.id,
        NEW."companyId",
        'Teklif Süresi Dolmak Üzere',
        'Teklif #' || SUBSTRING(NEW.id::TEXT, 1, 8) || ' 2 gün içinde geçerliliğini yitirecek. Detayları görmek ister misiniz?',
        'warning',
        'high',
        'Quote',
        NEW.id,
        '/tr/quotes/' || NEW.id,
        NEW."expiryDate"  -- Bildirim de teklifle birlikte geçersiz olacak
      FROM "User" u
      WHERE u."companyId" = NEW."companyId"
        AND u.role IN ('ADMIN', 'SALES')  -- SuperAdmin'e bildirim gönderme (filtreleme)
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_quote_expiring ON "Quote";
CREATE TRIGGER trg_quote_expiring
  AFTER INSERT OR UPDATE ON "Quote"
  FOR EACH ROW
  WHEN (NEW."expiryDate" IS NOT NULL AND NEW.status = 'SENT')
  EXECUTE FUNCTION auto_notify_quote_expiring();

-- ============================================
-- 3. AUTO-ACTION FOR CRITICAL NOTIFICATIONS → Create task suggestion
-- ============================================
CREATE OR REPLACE FUNCTION auto_task_from_critical_notification()
RETURNS TRIGGER AS $$
DECLARE
  task_id UUID;
BEGIN
  -- Kritik bildirim ve action_type = 'create_task' ise otomatik görev oluştur
  IF NEW.priority = 'critical' AND NEW."actionType" = 'create_task' AND NEW."actionDone" = false THEN
    -- Task tablosuna görev ekle
    INSERT INTO "Task" (title, status, "companyId", "assignedTo", "createdAt")
    VALUES (
      NEW.title || ' - Aksiyon Gerekiyor',
      'TODO',
      NEW."companyId",
      NEW."userId",
      NOW()
    )
    RETURNING id INTO task_id;
    
    -- Bildirimi action_done olarak işaretle
    UPDATE "Notification" 
    SET "actionDone" = true 
    WHERE id = NEW.id;
    
    -- ActivityLog kaydı
    INSERT INTO "ActivityLog" (entity, action, description, meta, "userId", "companyId")
    VALUES (
      'Task',
      'CREATE',
      'Kritik bildirimden otomatik görev oluşturuldu: ' || NEW.title,
      jsonb_build_object(
        'entity', 'Task',
        'action', 'create',
        'id', task_id,
        'fromNotification', NEW.id
      ),
      NEW."userId",
      NEW."companyId"
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_task_on_notification ON "Notification";
CREATE TRIGGER trg_auto_task_on_notification
  AFTER INSERT ON "Notification"
  FOR EACH ROW
  WHEN (NEW.priority = 'critical' AND NEW."actionType" IS NOT NULL)
  EXECUTE FUNCTION auto_task_from_critical_notification();

-- ============================================
-- 4. AUTO-ARCHIVE EXPIRED NOTIFICATIONS
-- ============================================
CREATE OR REPLACE FUNCTION auto_archive_expired_notifications()
RETURNS void AS $$
BEGIN
  -- Süresi dolan bildirimleri otomatik olarak okundu işaretle
  UPDATE "Notification"
  SET "isRead" = true
  WHERE "expiresAt" IS NOT NULL 
    AND "expiresAt" < NOW() 
    AND "isRead" = false;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. COMMENT'LER
-- ============================================
COMMENT ON COLUMN "Notification".priority IS 'Bildirim önceliği: low, normal, high, critical';
COMMENT ON COLUMN "Notification"."expiresAt" IS 'Bildirim geçerlilik tarihi (otomatik arşivleme için)';
COMMENT ON COLUMN "Notification"."actionType" IS 'İsteğe bağlı aksiyon tipi (örn: create_task)';
COMMENT ON COLUMN "Notification"."actionDone" IS 'Aksiyon tamamlandı mı?';

-- ============================================
-- MIGRATION TAMAMLANDI
-- ============================================


-- Mevcut schema'ya zarar vermez, güvenli migration

-- ============================================
-- 1. ADD LIGHT INTELLIGENCE FIELDS
-- ============================================
ALTER TABLE "Notification"
ADD COLUMN IF NOT EXISTS priority TEXT CHECK (priority IN ('low', 'normal', 'high', 'critical')) DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "actionType" TEXT,  -- optional follow-up action (e.g., "create_task")
ADD COLUMN IF NOT EXISTS "actionDone" BOOLEAN DEFAULT false;

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_notification_priority ON "Notification"(priority);
CREATE INDEX IF NOT EXISTS idx_notification_expires ON "Notification"("expiresAt") WHERE "expiresAt" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notification_action ON "Notification"("actionType") WHERE "actionType" IS NOT NULL;

-- ============================================
-- 2. SMART DEADLINE REMINDER (Auto notification for expiring quotes)
-- ============================================
CREATE OR REPLACE FUNCTION auto_notify_quote_expiring()
RETURNS TRIGGER AS $$
BEGIN
  -- Teklif SENT durumunda ve 2 gün içinde geçerliliğini yitirecekse bildirim gönder
  IF NEW.status = 'SENT' AND NEW."expiryDate" IS NOT NULL AND NEW."expiryDate" <= (NOW() + INTERVAL '2 days') THEN
    -- Sadece daha önce bildirim gönderilmemişse gönder (status değişikliği kontrolü)
    IF OLD.status IS NULL OR OLD.status != 'SENT' OR OLD."expiryDate" IS NULL OR OLD."expiryDate" > (NOW() + INTERVAL '2 days') THEN
      INSERT INTO "Notification" ("userId", "companyId", title, message, type, priority, "relatedTo", "relatedId", link, "expiresAt")
      SELECT 
        u.id,
        NEW."companyId",
        'Teklif Süresi Dolmak Üzere',
        'Teklif #' || SUBSTRING(NEW.id::TEXT, 1, 8) || ' 2 gün içinde geçerliliğini yitirecek. Detayları görmek ister misiniz?',
        'warning',
        'high',
        'Quote',
        NEW.id,
        '/tr/quotes/' || NEW.id,
        NEW."expiryDate"  -- Bildirim de teklifle birlikte geçersiz olacak
      FROM "User" u
      WHERE u."companyId" = NEW."companyId"
        AND u.role IN ('ADMIN', 'SALES')  -- SuperAdmin'e bildirim gönderme (filtreleme)
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_quote_expiring ON "Quote";
CREATE TRIGGER trg_quote_expiring
  AFTER INSERT OR UPDATE ON "Quote"
  FOR EACH ROW
  WHEN (NEW."expiryDate" IS NOT NULL AND NEW.status = 'SENT')
  EXECUTE FUNCTION auto_notify_quote_expiring();

-- ============================================
-- 3. AUTO-ACTION FOR CRITICAL NOTIFICATIONS → Create task suggestion
-- ============================================
CREATE OR REPLACE FUNCTION auto_task_from_critical_notification()
RETURNS TRIGGER AS $$
DECLARE
  task_id UUID;
BEGIN
  -- Kritik bildirim ve action_type = 'create_task' ise otomatik görev oluştur
  IF NEW.priority = 'critical' AND NEW."actionType" = 'create_task' AND NEW."actionDone" = false THEN
    -- Task tablosuna görev ekle
    INSERT INTO "Task" (title, status, "companyId", "assignedTo", "createdAt")
    VALUES (
      NEW.title || ' - Aksiyon Gerekiyor',
      'TODO',
      NEW."companyId",
      NEW."userId",
      NOW()
    )
    RETURNING id INTO task_id;
    
    -- Bildirimi action_done olarak işaretle
    UPDATE "Notification" 
    SET "actionDone" = true 
    WHERE id = NEW.id;
    
    -- ActivityLog kaydı
    INSERT INTO "ActivityLog" (entity, action, description, meta, "userId", "companyId")
    VALUES (
      'Task',
      'CREATE',
      'Kritik bildirimden otomatik görev oluşturuldu: ' || NEW.title,
      jsonb_build_object(
        'entity', 'Task',
        'action', 'create',
        'id', task_id,
        'fromNotification', NEW.id
      ),
      NEW."userId",
      NEW."companyId"
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_task_on_notification ON "Notification";
CREATE TRIGGER trg_auto_task_on_notification
  AFTER INSERT ON "Notification"
  FOR EACH ROW
  WHEN (NEW.priority = 'critical' AND NEW."actionType" IS NOT NULL)
  EXECUTE FUNCTION auto_task_from_critical_notification();

-- ============================================
-- 4. AUTO-ARCHIVE EXPIRED NOTIFICATIONS
-- ============================================
CREATE OR REPLACE FUNCTION auto_archive_expired_notifications()
RETURNS void AS $$
BEGIN
  -- Süresi dolan bildirimleri otomatik olarak okundu işaretle
  UPDATE "Notification"
  SET "isRead" = true
  WHERE "expiresAt" IS NOT NULL 
    AND "expiresAt" < NOW() 
    AND "isRead" = false;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. COMMENT'LER
-- ============================================
COMMENT ON COLUMN "Notification".priority IS 'Bildirim önceliği: low, normal, high, critical';
COMMENT ON COLUMN "Notification"."expiresAt" IS 'Bildirim geçerlilik tarihi (otomatik arşivleme için)';
COMMENT ON COLUMN "Notification"."actionType" IS 'İsteğe bağlı aksiyon tipi (örn: create_task)';
COMMENT ON COLUMN "Notification"."actionDone" IS 'Aksiyon tamamlandı mı?';

-- ============================================
-- MIGRATION TAMAMLANDI
-- ============================================


-- Mevcut schema'ya zarar vermez, güvenli migration

-- ============================================
-- 1. ADD LIGHT INTELLIGENCE FIELDS
-- ============================================
ALTER TABLE "Notification"
ADD COLUMN IF NOT EXISTS priority TEXT CHECK (priority IN ('low', 'normal', 'high', 'critical')) DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "actionType" TEXT,  -- optional follow-up action (e.g., "create_task")
ADD COLUMN IF NOT EXISTS "actionDone" BOOLEAN DEFAULT false;

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_notification_priority ON "Notification"(priority);
CREATE INDEX IF NOT EXISTS idx_notification_expires ON "Notification"("expiresAt") WHERE "expiresAt" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notification_action ON "Notification"("actionType") WHERE "actionType" IS NOT NULL;

-- ============================================
-- 2. SMART DEADLINE REMINDER (Auto notification for expiring quotes)
-- ============================================
CREATE OR REPLACE FUNCTION auto_notify_quote_expiring()
RETURNS TRIGGER AS $$
BEGIN
  -- Teklif SENT durumunda ve 2 gün içinde geçerliliğini yitirecekse bildirim gönder
  IF NEW.status = 'SENT' AND NEW."expiryDate" IS NOT NULL AND NEW."expiryDate" <= (NOW() + INTERVAL '2 days') THEN
    -- Sadece daha önce bildirim gönderilmemişse gönder (status değişikliği kontrolü)
    IF OLD.status IS NULL OR OLD.status != 'SENT' OR OLD."expiryDate" IS NULL OR OLD."expiryDate" > (NOW() + INTERVAL '2 days') THEN
      INSERT INTO "Notification" ("userId", "companyId", title, message, type, priority, "relatedTo", "relatedId", link, "expiresAt")
      SELECT 
        u.id,
        NEW."companyId",
        'Teklif Süresi Dolmak Üzere',
        'Teklif #' || SUBSTRING(NEW.id::TEXT, 1, 8) || ' 2 gün içinde geçerliliğini yitirecek. Detayları görmek ister misiniz?',
        'warning',
        'high',
        'Quote',
        NEW.id,
        '/tr/quotes/' || NEW.id,
        NEW."expiryDate"  -- Bildirim de teklifle birlikte geçersiz olacak
      FROM "User" u
      WHERE u."companyId" = NEW."companyId"
        AND u.role IN ('ADMIN', 'SALES')  -- SuperAdmin'e bildirim gönderme (filtreleme)
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_quote_expiring ON "Quote";
CREATE TRIGGER trg_quote_expiring
  AFTER INSERT OR UPDATE ON "Quote"
  FOR EACH ROW
  WHEN (NEW."expiryDate" IS NOT NULL AND NEW.status = 'SENT')
  EXECUTE FUNCTION auto_notify_quote_expiring();

-- ============================================
-- 3. AUTO-ACTION FOR CRITICAL NOTIFICATIONS → Create task suggestion
-- ============================================
CREATE OR REPLACE FUNCTION auto_task_from_critical_notification()
RETURNS TRIGGER AS $$
DECLARE
  task_id UUID;
BEGIN
  -- Kritik bildirim ve action_type = 'create_task' ise otomatik görev oluştur
  IF NEW.priority = 'critical' AND NEW."actionType" = 'create_task' AND NEW."actionDone" = false THEN
    -- Task tablosuna görev ekle
    INSERT INTO "Task" (title, status, "companyId", "assignedTo", "createdAt")
    VALUES (
      NEW.title || ' - Aksiyon Gerekiyor',
      'TODO',
      NEW."companyId",
      NEW."userId",
      NOW()
    )
    RETURNING id INTO task_id;
    
    -- Bildirimi action_done olarak işaretle
    UPDATE "Notification" 
    SET "actionDone" = true 
    WHERE id = NEW.id;
    
    -- ActivityLog kaydı
    INSERT INTO "ActivityLog" (entity, action, description, meta, "userId", "companyId")
    VALUES (
      'Task',
      'CREATE',
      'Kritik bildirimden otomatik görev oluşturuldu: ' || NEW.title,
      jsonb_build_object(
        'entity', 'Task',
        'action', 'create',
        'id', task_id,
        'fromNotification', NEW.id
      ),
      NEW."userId",
      NEW."companyId"
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_task_on_notification ON "Notification";
CREATE TRIGGER trg_auto_task_on_notification
  AFTER INSERT ON "Notification"
  FOR EACH ROW
  WHEN (NEW.priority = 'critical' AND NEW."actionType" IS NOT NULL)
  EXECUTE FUNCTION auto_task_from_critical_notification();

-- ============================================
-- 4. AUTO-ARCHIVE EXPIRED NOTIFICATIONS
-- ============================================
CREATE OR REPLACE FUNCTION auto_archive_expired_notifications()
RETURNS void AS $$
BEGIN
  -- Süresi dolan bildirimleri otomatik olarak okundu işaretle
  UPDATE "Notification"
  SET "isRead" = true
  WHERE "expiresAt" IS NOT NULL 
    AND "expiresAt" < NOW() 
    AND "isRead" = false;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. COMMENT'LER
-- ============================================
COMMENT ON COLUMN "Notification".priority IS 'Bildirim önceliği: low, normal, high, critical';
COMMENT ON COLUMN "Notification"."expiresAt" IS 'Bildirim geçerlilik tarihi (otomatik arşivleme için)';
COMMENT ON COLUMN "Notification"."actionType" IS 'İsteğe bağlı aksiyon tipi (örn: create_task)';
COMMENT ON COLUMN "Notification"."actionDone" IS 'Aksiyon tamamlandı mı?';

-- ============================================
-- MIGRATION TAMAMLANDI
-- ============================================


-- Mevcut schema'ya zarar vermez, güvenli migration

-- ============================================
-- 1. ADD LIGHT INTELLIGENCE FIELDS
-- ============================================
ALTER TABLE "Notification"
ADD COLUMN IF NOT EXISTS priority TEXT CHECK (priority IN ('low', 'normal', 'high', 'critical')) DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "actionType" TEXT,  -- optional follow-up action (e.g., "create_task")
ADD COLUMN IF NOT EXISTS "actionDone" BOOLEAN DEFAULT false;

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_notification_priority ON "Notification"(priority);
CREATE INDEX IF NOT EXISTS idx_notification_expires ON "Notification"("expiresAt") WHERE "expiresAt" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notification_action ON "Notification"("actionType") WHERE "actionType" IS NOT NULL;

-- ============================================
-- 2. SMART DEADLINE REMINDER (Auto notification for expiring quotes)
-- ============================================
CREATE OR REPLACE FUNCTION auto_notify_quote_expiring()
RETURNS TRIGGER AS $$
BEGIN
  -- Teklif SENT durumunda ve 2 gün içinde geçerliliğini yitirecekse bildirim gönder
  IF NEW.status = 'SENT' AND NEW."expiryDate" IS NOT NULL AND NEW."expiryDate" <= (NOW() + INTERVAL '2 days') THEN
    -- Sadece daha önce bildirim gönderilmemişse gönder (status değişikliği kontrolü)
    IF OLD.status IS NULL OR OLD.status != 'SENT' OR OLD."expiryDate" IS NULL OR OLD."expiryDate" > (NOW() + INTERVAL '2 days') THEN
      INSERT INTO "Notification" ("userId", "companyId", title, message, type, priority, "relatedTo", "relatedId", link, "expiresAt")
      SELECT 
        u.id,
        NEW."companyId",
        'Teklif Süresi Dolmak Üzere',
        'Teklif #' || SUBSTRING(NEW.id::TEXT, 1, 8) || ' 2 gün içinde geçerliliğini yitirecek. Detayları görmek ister misiniz?',
        'warning',
        'high',
        'Quote',
        NEW.id,
        '/tr/quotes/' || NEW.id,
        NEW."expiryDate"  -- Bildirim de teklifle birlikte geçersiz olacak
      FROM "User" u
      WHERE u."companyId" = NEW."companyId"
        AND u.role IN ('ADMIN', 'SALES')  -- SuperAdmin'e bildirim gönderme (filtreleme)
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_quote_expiring ON "Quote";
CREATE TRIGGER trg_quote_expiring
  AFTER INSERT OR UPDATE ON "Quote"
  FOR EACH ROW
  WHEN (NEW."expiryDate" IS NOT NULL AND NEW.status = 'SENT')
  EXECUTE FUNCTION auto_notify_quote_expiring();

-- ============================================
-- 3. AUTO-ACTION FOR CRITICAL NOTIFICATIONS → Create task suggestion
-- ============================================
CREATE OR REPLACE FUNCTION auto_task_from_critical_notification()
RETURNS TRIGGER AS $$
DECLARE
  task_id UUID;
BEGIN
  -- Kritik bildirim ve action_type = 'create_task' ise otomatik görev oluştur
  IF NEW.priority = 'critical' AND NEW."actionType" = 'create_task' AND NEW."actionDone" = false THEN
    -- Task tablosuna görev ekle
    INSERT INTO "Task" (title, status, "companyId", "assignedTo", "createdAt")
    VALUES (
      NEW.title || ' - Aksiyon Gerekiyor',
      'TODO',
      NEW."companyId",
      NEW."userId",
      NOW()
    )
    RETURNING id INTO task_id;
    
    -- Bildirimi action_done olarak işaretle
    UPDATE "Notification" 
    SET "actionDone" = true 
    WHERE id = NEW.id;
    
    -- ActivityLog kaydı
    INSERT INTO "ActivityLog" (entity, action, description, meta, "userId", "companyId")
    VALUES (
      'Task',
      'CREATE',
      'Kritik bildirimden otomatik görev oluşturuldu: ' || NEW.title,
      jsonb_build_object(
        'entity', 'Task',
        'action', 'create',
        'id', task_id,
        'fromNotification', NEW.id
      ),
      NEW."userId",
      NEW."companyId"
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_task_on_notification ON "Notification";
CREATE TRIGGER trg_auto_task_on_notification
  AFTER INSERT ON "Notification"
  FOR EACH ROW
  WHEN (NEW.priority = 'critical' AND NEW."actionType" IS NOT NULL)
  EXECUTE FUNCTION auto_task_from_critical_notification();

-- ============================================
-- 4. AUTO-ARCHIVE EXPIRED NOTIFICATIONS
-- ============================================
CREATE OR REPLACE FUNCTION auto_archive_expired_notifications()
RETURNS void AS $$
BEGIN
  -- Süresi dolan bildirimleri otomatik olarak okundu işaretle
  UPDATE "Notification"
  SET "isRead" = true
  WHERE "expiresAt" IS NOT NULL 
    AND "expiresAt" < NOW() 
    AND "isRead" = false;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. COMMENT'LER
-- ============================================
COMMENT ON COLUMN "Notification".priority IS 'Bildirim önceliği: low, normal, high, critical';
COMMENT ON COLUMN "Notification"."expiresAt" IS 'Bildirim geçerlilik tarihi (otomatik arşivleme için)';
COMMENT ON COLUMN "Notification"."actionType" IS 'İsteğe bağlı aksiyon tipi (örn: create_task)';
COMMENT ON COLUMN "Notification"."actionDone" IS 'Aksiyon tamamlandı mı?';

-- ============================================
-- MIGRATION TAMAMLANDI
-- ============================================

