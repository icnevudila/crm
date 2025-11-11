-- CRM V3 - User-Scoped Real-time Notification System
-- Kullanıcı bazlı bildirimler sistemi
-- Real-time sync ve role filtering ile
-- Mevcut schema'ya zarar vermez, güvenli migration

-- ============================================
-- 1. NOTIFICATIONS TABLOSU
-- ============================================
CREATE TABLE IF NOT EXISTS "Notification" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type VARCHAR(20) CHECK (type IN ('info', 'success', 'warning', 'error', 'system')) DEFAULT 'info',
  link TEXT,
  "relatedTo" TEXT,
  "relatedId" UUID,
  "isRead" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_notification_user ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS idx_notification_company ON "Notification"("companyId");
CREATE INDEX IF NOT EXISTS idx_notification_is_read ON "Notification"("isRead");
CREATE INDEX IF NOT EXISTS idx_notification_created ON "Notification"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_notification_user_unread ON "Notification"("userId", "isRead") WHERE "isRead" = false;

-- ============================================
-- 2. TRIGGER: Quote ACCEPTED → Admin + Sales'e Bildirim
-- ============================================
CREATE OR REPLACE FUNCTION notify_quote_accepted()
RETURNS TRIGGER AS $$
BEGIN
  -- Teklif ACCEPTED olduğunda Admin ve Sales rolündeki kullanıcılara bildirim gönder
  IF NEW.status = 'ACCEPTED' AND (OLD.status IS NULL OR OLD.status != 'ACCEPTED') THEN
    INSERT INTO "Notification" ("userId", "companyId", title, message, type, "relatedTo", "relatedId", link)
    SELECT 
      u.id,
      NEW."companyId",
      'Teklif Onaylandı',
      'Teklif onaylandı. Detayları görmek ister misiniz?',
      'success',
      'Quote',
      NEW.id,
      '/tr/quotes/' || NEW.id
    FROM "User" u
    WHERE u."companyId" = NEW."companyId"
      AND u.role IN ('ADMIN', 'SALES', 'SUPER_ADMIN');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_quote_accepted_notify ON "Quote";
CREATE TRIGGER trigger_quote_accepted_notify
  AFTER UPDATE ON "Quote"
  FOR EACH ROW
  WHEN (NEW.status = 'ACCEPTED' AND (OLD.status IS NULL OR OLD.status != 'ACCEPTED'))
  EXECUTE FUNCTION notify_quote_accepted();

-- ============================================
-- 3. TRIGGER: Düşük Stok Uyarısı
-- ============================================
CREATE OR REPLACE FUNCTION notify_low_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- Stok minimum seviyenin altına düştüğünde Admin ve STOCK rolündeki kullanıcılara bildirim gönder
  IF NEW.stock <= COALESCE(NEW."minStock", 0) AND (OLD.stock IS NULL OR OLD.stock > COALESCE(NEW."minStock", 0)) THEN
    -- minStock kolonu varsa kontrol et
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Product' AND column_name = 'minStock'
    ) THEN
      INSERT INTO "Notification" ("userId", "companyId", title, message, type, "relatedTo", "relatedId", link)
      SELECT 
        u.id,
        NEW."companyId",
        'Düşük Stok Uyarısı',
        NEW.name || ' ürünü minimum stok seviyesinin altına düştü. (Mevcut: ' || NEW.stock || ', Minimum: ' || COALESCE(NEW."minStock", 0) || ') Detayları görmek ister misiniz?',
        'warning',
        'Product',
        NEW.id,
        '/tr/products/' || NEW.id
      FROM "User" u
      WHERE u."companyId" = NEW."companyId"
        AND u.role IN ('ADMIN', 'STOCK', 'SUPER_ADMIN');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_product_low_stock ON "Product";
CREATE TRIGGER trigger_product_low_stock
  AFTER UPDATE ON "Product"
  FOR EACH ROW
  WHEN (
    EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Product' AND column_name = 'minStock'
    )
    AND NEW.stock <= COALESCE(NEW."minStock", 0)
    AND (OLD.stock IS NULL OR OLD.stock > COALESCE(NEW."minStock", 0))
  )
  EXECUTE FUNCTION notify_low_stock();

-- ============================================
-- 4. VIEW: Kullanıcı Bildirimleri (Filtrelenmiş)
-- ============================================
CREATE OR REPLACE VIEW "UserNotifications" AS
SELECT 
  n.id,
  n."userId",
  n."companyId",
  n.title,
  n.message,
  n.type,
  n.link,
  n."relatedTo",
  n."relatedId",
  n."isRead",
  n."createdAt"
FROM "Notification" n
WHERE n."isRead" = false
ORDER BY n."createdAt" DESC;

-- ============================================
-- 5. RLS POLICIES
-- ============================================
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;

-- Policy: Kullanıcılar sadece kendi bildirimlerini görebilir
DROP POLICY IF EXISTS "notification_user_isolation" ON "Notification";
CREATE POLICY "notification_user_isolation" ON "Notification"
  FOR ALL
  USING (
    "userId" = auth.uid()::text::uuid
    OR EXISTS (
      SELECT 1 FROM "User" u
      WHERE u.id::text = auth.uid()::text
        AND u.role = 'SUPER_ADMIN'
    )
  );

-- ============================================
-- 6. FUNCTION: Bildirimi Okundu İşaretle
-- ============================================
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE "Notification"
  SET "isRead" = true
  WHERE id = notification_id
    AND "userId" = user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. FUNCTION: Tüm Bildirimleri Okundu İşaretle
-- ============================================
CREATE OR REPLACE FUNCTION mark_all_notifications_read(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE "Notification"
  SET "isRead" = true
  WHERE "userId" = user_id
    AND "isRead" = false;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. COMMENT'LER
-- ============================================
COMMENT ON TABLE "Notification" IS 'Kullanıcı bazlı bildirimler tablosu - Real-time notification system';
COMMENT ON COLUMN "Notification"."userId" IS 'Bildirimin gönderileceği kullanıcı';
COMMENT ON COLUMN "Notification"."companyId" IS 'Şirket ID (multi-tenant)';
COMMENT ON COLUMN "Notification".type IS 'Bildirim tipi: info, success, warning, error, system';
COMMENT ON COLUMN "Notification"."relatedTo" IS 'İlişkili entity: Quote, Invoice, Product, vb.';
COMMENT ON COLUMN "Notification"."relatedId" IS 'İlişkili entity ID';
COMMENT ON COLUMN "Notification"."isRead" IS 'Bildirim okundu mu?';

-- ============================================
-- MIGRATION TAMAMLANDI
-- ============================================

