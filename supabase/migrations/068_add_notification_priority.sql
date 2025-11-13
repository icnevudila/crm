-- ============================================
-- 068_add_notification_priority.sql
-- Notification tablosuna priority kolonu ekle
-- ============================================
-- Sorun: notification-helper.ts ve diğer yerlerde priority kullanılıyor ama tabloda kolon yok
-- Çözüm: priority kolonunu ekle (low, normal, high, critical)
-- ============================================

-- Priority kolonunu ekle (eğer yoksa)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Notification' 
    AND column_name = 'priority'
  ) THEN
    ALTER TABLE "Notification" 
    ADD COLUMN "priority" VARCHAR(20) 
    CHECK ("priority" IN ('low', 'normal', 'high', 'critical')) 
    DEFAULT 'normal';
    
    -- Index ekle (performans için)
    CREATE INDEX IF NOT EXISTS idx_notification_priority ON "Notification"("priority");
    
    RAISE NOTICE 'Notification.priority kolonu eklendi';
  ELSE
    RAISE NOTICE 'Notification.priority kolonu zaten mevcut';
  END IF;
END $$;

-- expiresAt ve actionType kolonlarını da ekle (eğer yoksa - notification-helper.ts'de kullanılıyor)
DO $$
BEGIN
  -- expiresAt kolonu
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Notification' 
    AND column_name = 'expiresAt'
  ) THEN
    ALTER TABLE "Notification" 
    ADD COLUMN "expiresAt" TIMESTAMP WITH TIME ZONE;
    
    RAISE NOTICE 'Notification.expiresAt kolonu eklendi';
  END IF;
  
  -- actionType kolonu
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Notification' 
    AND column_name = 'actionType'
  ) THEN
    ALTER TABLE "Notification" 
    ADD COLUMN "actionType" TEXT;
    
    RAISE NOTICE 'Notification.actionType kolonu eklendi';
  END IF;
  
  -- actionDone kolonu
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Notification' 
    AND column_name = 'actionDone'
  ) THEN
    ALTER TABLE "Notification" 
    ADD COLUMN "actionDone" BOOLEAN DEFAULT false;
    
    RAISE NOTICE 'Notification.actionDone kolonu eklendi';
  END IF;
END $$;

-- Comment ekle
COMMENT ON COLUMN "Notification"."priority" IS 'Bildirim önceliği: low, normal, high, critical';
COMMENT ON COLUMN "Notification"."expiresAt" IS 'Bildirimin geçerlilik süresi (opsiyonel)';
COMMENT ON COLUMN "Notification"."actionType" IS 'Bildirim aksiyon tipi (opsiyonel)';
COMMENT ON COLUMN "Notification"."actionDone" IS 'Aksiyon tamamlandı mı?';

