-- ============================================
-- Trigger Durumunu Kontrol Et
-- ============================================

-- 1. Trigger'ın var olup olmadığını kontrol et
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'trigger_auto_suggest_revision_on_quote_rejected'
  AND event_object_table = 'Quote';

-- 2. Trigger fonksiyonunun var olup olmadığını kontrol et
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name = 'auto_suggest_revision_on_quote_rejected'
  AND routine_type = 'FUNCTION';

-- 3. Tüm Quote trigger'larını listele
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'Quote'
ORDER BY trigger_name;

-- 4. Task tablosunun var olup olmadığını kontrol et
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'Task';

-- 5. Task tablosundaki tüm kolonları listele
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'Task'
ORDER BY ordinal_position;




