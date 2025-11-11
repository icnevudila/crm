-- ============================================
-- Quote REJECTED → Revizyon Görevi Trigger Kontrolü
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

-- 3. Son reddedilen teklifleri kontrol et (sadece var olan kolonlar)
SELECT 
  id,
  title,
  status,
  "companyId",
  "createdAt",
  "updatedAt"
FROM "Quote"
WHERE status = 'REJECTED'
ORDER BY "updatedAt" DESC
LIMIT 5;

-- 4. Task tablosundaki kolonları kontrol et
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'Task'
  AND column_name IN ('description', 'priority', 'relatedTo', 'relatedId', 'dueDate')
ORDER BY column_name;

-- 5. Son oluşturulan görevleri kontrol et (revizyon görevleri) - sadece var olan kolonlar
SELECT 
  id,
  title,
  status,
  "companyId",
  "assignedTo",
  "createdAt"
FROM "Task"
WHERE title LIKE '%Revizyon%'
ORDER BY "createdAt" DESC
LIMIT 5;

-- 6. Son reddedilen teklif ile ilgili görev var mı? (relatedTo/relatedId varsa)
-- Önce relatedTo ve relatedId kolonlarının var olup olmadığını kontrol et
DO $$
DECLARE
  has_related_to BOOLEAN;
  has_related_id BOOLEAN;
BEGIN
  -- relatedTo kolonu var mı?
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'Task' 
      AND column_name = 'relatedTo'
  ) INTO has_related_to;
  
  -- relatedId kolonu var mı?
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'Task' 
      AND column_name = 'relatedId'
  ) INTO has_related_id;
  
  -- Eğer her iki kolon da varsa, ilişkili görevleri göster
  IF has_related_to AND has_related_id THEN
    RAISE NOTICE 'relatedTo ve relatedId kolonları mevcut - ilişkili görevleri gösteriliyor';
  ELSE
    RAISE NOTICE 'relatedTo veya relatedId kolonları mevcut değil - ilişkili görevler gösterilemiyor';
  END IF;
END $$;

-- 7. Son reddedilen teklif ile ilgili görev var mı? (relatedTo/relatedId varsa)
-- Önce kolonların var olup olmadığını kontrol et, sonra dinamik sorgu çalıştır
DO $$
DECLARE
  has_related_to BOOLEAN;
  has_related_id BOOLEAN;
BEGIN
  -- relatedTo kolonu var mı?
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'Task' 
      AND column_name = 'relatedTo'
  ) INTO has_related_to;
  
  -- relatedId kolonu var mı?
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'Task' 
      AND column_name = 'relatedId'
  ) INTO has_related_id;
  
  -- Eğer her iki kolon da varsa, ilişkili görevleri göster
  IF has_related_to AND has_related_id THEN
    RAISE NOTICE 'relatedTo ve relatedId kolonları mevcut - ilişkili görevler kontrol ediliyor';
    -- Dinamik sorgu çalıştır
    EXECUTE format('
      SELECT 
        q.id as quote_id,
        q.title as quote_title,
        q.status as quote_status,
        q."updatedAt" as quote_rejected_at,
        t.id as task_id,
        t.title as task_title,
        t.status as task_status,
        t."createdAt" as task_created_at
      FROM "Quote" q
      LEFT JOIN "Task" t ON t."relatedId" = q.id AND t."relatedTo" = ''Quote''
      WHERE q.status = ''REJECTED''
      ORDER BY q."updatedAt" DESC
      LIMIT 10
    ');
  ELSE
    RAISE NOTICE 'relatedTo veya relatedId kolonları mevcut değil - ilişkili görevler gösterilemiyor';
  END IF;
END $$;




