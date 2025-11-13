-- ============================================
-- 069_verify_notification_priority.sql
-- Notification tablosunda priority kolonunun varlığını kontrol et
-- ============================================
-- Bu migration sadece kontrol amaçlıdır - hata vermez
-- Eğer priority kolonu yoksa, 068_add_notification_priority.sql migration'ını çalıştırın
-- ============================================

-- Priority kolonunun varlığını kontrol et
DO $$
DECLARE
  has_priority_column BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Notification' 
    AND column_name = 'priority'
  ) INTO has_priority_column;
  
  IF has_priority_column THEN
    RAISE NOTICE '✅ Notification.priority kolonu mevcut';
  ELSE
    RAISE WARNING '❌ Notification.priority kolonu YOK! 068_add_notification_priority.sql migration''ını çalıştırın.';
  END IF;
END $$;

-- expiresAt kolonunun varlığını kontrol et
DO $$
DECLARE
  has_expires_at_column BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Notification' 
    AND column_name = 'expiresAt'
  ) INTO has_expires_at_column;
  
  IF has_expires_at_column THEN
    RAISE NOTICE '✅ Notification.expiresAt kolonu mevcut';
  ELSE
    RAISE WARNING '❌ Notification.expiresAt kolonu YOK! 068_add_notification_priority.sql migration''ını çalıştırın.';
  END IF;
END $$;

-- actionType kolonunun varlığını kontrol et
DO $$
DECLARE
  has_action_type_column BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Notification' 
    AND column_name = 'actionType'
  ) INTO has_action_type_column;
  
  IF has_action_type_column THEN
    RAISE NOTICE '✅ Notification.actionType kolonu mevcut';
  ELSE
    RAISE WARNING '❌ Notification.actionType kolonu YOK! 068_add_notification_priority.sql migration''ını çalıştırın.';
  END IF;
END $$;

-- actionDone kolonunun varlığını kontrol et
DO $$
DECLARE
  has_action_done_column BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Notification' 
    AND column_name = 'actionDone'
  ) INTO has_action_done_column;
  
  IF has_action_done_column THEN
    RAISE NOTICE '✅ Notification.actionDone kolonu mevcut';
  ELSE
    RAISE WARNING '❌ Notification.actionDone kolonu YOK! 068_add_notification_priority.sql migration''ını çalıştırın.';
  END IF;
END $$;

