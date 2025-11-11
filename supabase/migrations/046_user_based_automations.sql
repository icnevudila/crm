-- ============================================
-- 046_user_based_automations.sql
-- Kullanıcı Bazlı Otomasyonlar
-- ============================================
-- 1. Hatırlatıcı Sistemi (Reminder)
-- 2. Görev Takip Otomasyonları
-- 3. Meeting Hatırlatıcıları
-- 4. Müşteri Takip Sistemi
-- 5. Günlük Özet Bildirimleri
-- ============================================

-- ============================================
-- PART 1: REMINDER TABLOSU
-- ============================================

CREATE TABLE IF NOT EXISTS "Reminder" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "relatedTo" TEXT NOT NULL,
  "relatedId" UUID NOT NULL,
  "remindAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('task_due', 'task_overdue', 'meeting_soon', 'follow_up', 'birthday', 'deal_follow_up', 'quote_follow_up')) DEFAULT 'follow_up',
  status TEXT CHECK (status IN ('PENDING', 'SENT', 'DISMISSED')) DEFAULT 'PENDING',
  priority TEXT CHECK (priority IN ('low', 'normal', 'high', 'critical')) DEFAULT 'normal',
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexler
CREATE INDEX IF NOT EXISTS idx_reminder_user ON "Reminder"("userId");
CREATE INDEX IF NOT EXISTS idx_reminder_status ON "Reminder"(status);
CREATE INDEX IF NOT EXISTS idx_reminder_time ON "Reminder"("remindAt") WHERE status = 'PENDING';
CREATE INDEX IF NOT EXISTS idx_reminder_company ON "Reminder"("companyId");

-- RLS
ALTER TABLE "Reminder" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reminders"
  ON "Reminder" FOR SELECT
  USING (
    "userId" = (SELECT id FROM "User" WHERE id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM "User"
      WHERE id = auth.uid()
        AND "companyId" = "Reminder"."companyId"
        AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

CREATE POLICY "Users can create reminders"
  ON "Reminder" FOR INSERT
  WITH CHECK (
    "userId" = (SELECT id FROM "User" WHERE id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM "User"
      WHERE id = auth.uid()
        AND "companyId" = "Reminder"."companyId"
        AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- ============================================
-- PART 2: OTOMATIK REMINDER OLUŞTURMA
-- ============================================

-- Task için reminder (1 gün önce)
CREATE OR REPLACE FUNCTION create_task_reminder()
RETURNS TRIGGER AS $$
BEGIN
  -- Task oluşturulduğunda ve dueDate varsa, 1 gün önce reminder oluştur
  IF NEW."dueDate" IS NOT NULL AND NEW."assignedTo" IS NOT NULL THEN
    
    -- 1 gün öncesi reminder
    IF NEW."dueDate" > CURRENT_DATE + INTERVAL '1 day' THEN
      INSERT INTO "Reminder" (
        "userId",
        "relatedTo",
        "relatedId",
        "remindAt",
        title,
        message,
        type,
        priority,
        "companyId"
      )
      VALUES (
        NEW."assignedTo",
        'Task',
        NEW.id,
        NEW."dueDate" - INTERVAL '1 day' + TIME '09:00:00',
        '⏰ Görev Hatırlatıcı',
        'Yarın son gün! "' || COALESCE(NEW.title, 'Başlıksız') || '" görevi için son tarih yarın.',
        'task_due',
        CASE WHEN NEW.priority = 'HIGH' THEN 'high' ELSE 'normal' END,
        NEW."companyId"
      )
      ON CONFLICT DO NOTHING;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_task_reminder ON "Task";
CREATE TRIGGER trigger_create_task_reminder
  AFTER INSERT OR UPDATE OF "dueDate", "assignedTo"
  ON "Task"
  FOR EACH ROW
  EXECUTE FUNCTION create_task_reminder();

-- Meeting için reminder (1 saat önce ve 1 gün önce)
CREATE OR REPLACE FUNCTION create_meeting_reminder()
RETURNS TRIGGER AS $$
DECLARE
  participant_record RECORD;
BEGIN
  -- Meeting oluşturulduğunda tüm katılımcılara reminder oluştur
  IF NEW."startTime" IS NOT NULL THEN
    
    -- Meeting'e katılan tüm kullanıcılar için
    FOR participant_record IN 
      SELECT "userId" 
      FROM "MeetingParticipant" 
      WHERE "meetingId" = NEW.id
    LOOP
      
      -- 1 gün öncesi reminder
      IF NEW."startTime" > NOW() + INTERVAL '1 day' THEN
        INSERT INTO "Reminder" (
          "userId",
          "relatedTo",
          "relatedId",
          "remindAt",
          title,
          message,
          type,
          priority,
          "companyId"
        )
        VALUES (
          participant_record."userId",
          'Meeting',
          NEW.id,
          NEW."startTime" - INTERVAL '1 day' + TIME '09:00:00',
          '📅 Yarın Görüşmeniz Var',
          'Yarın "' || COALESCE(NEW.title, 'Başlıksız') || '" görüşmeniz var.',
          'meeting_soon',
          'normal',
          NEW."companyId"
        )
        ON CONFLICT DO NOTHING;
      END IF;
      
      -- 1 saat öncesi reminder
      IF NEW."startTime" > NOW() + INTERVAL '1 hour' THEN
        INSERT INTO "Reminder" (
          "userId",
          "relatedTo",
          "relatedId",
          "remindAt",
          title,
          message,
          type,
          priority,
          "companyId"
        )
        VALUES (
          participant_record."userId",
          'Meeting',
          NEW.id,
          NEW."startTime" - INTERVAL '1 hour',
          '🔔 1 Saat Sonra Görüşmeniz Var!',
          '"' || COALESCE(NEW.title, 'Başlıksız') || '" görüşmeniz 1 saat sonra başlıyor.',
          'meeting_soon',
          'high',
          NEW."companyId"
        )
        ON CONFLICT DO NOTHING;
      END IF;
      
    END LOOP;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_meeting_reminder ON "Meeting";
CREATE TRIGGER trigger_create_meeting_reminder
  AFTER INSERT OR UPDATE OF "startTime"
  ON "Meeting"
  FOR EACH ROW
  EXECUTE FUNCTION create_meeting_reminder();

-- ============================================
-- PART 3: ZAMANLANMIŞ OTOMASYONLAR
-- ============================================

-- Bekleyen reminder'ları gönder (her 15 dakikada bir çalışır)
CREATE OR REPLACE FUNCTION send_pending_reminders()
RETURNS INTEGER AS $$
DECLARE
  sent_count INTEGER := 0;
BEGIN
  -- Zamanı gelen reminder'ları bildirime çevir
  INSERT INTO "Notification" (
    title,
    message,
    type,
    priority,
    "relatedTo",
    "relatedId",
    "userId",
    "companyId",
    link
  )
  SELECT
    r.title,
    r.message,
    CASE r.type
      WHEN 'task_due' THEN 'warning'
      WHEN 'task_overdue' THEN 'error'
      WHEN 'meeting_soon' THEN 'info'
      ELSE 'info'
    END,
    r.priority,
    r."relatedTo",
    r."relatedId",
    r."userId",
    r."companyId",
    CASE r."relatedTo"
      WHEN 'Task' THEN '/tasks'
      WHEN 'Meeting' THEN '/meetings/' || r."relatedId"
      WHEN 'Deal' THEN '/deals/' || r."relatedId"
      WHEN 'Customer' THEN '/customers/' || r."relatedId"
      ELSE NULL
    END
  FROM "Reminder" r
  WHERE r.status = 'PENDING'
    AND r."remindAt" <= NOW();
  
  GET DIAGNOSTICS sent_count = ROW_COUNT;
  
  -- Gönderilen reminder'ları işaretle
  UPDATE "Reminder"
  SET 
    status = 'SENT',
    "updatedAt" = NOW()
  WHERE status = 'PENDING'
    AND "remindAt" <= NOW();
  
  RAISE NOTICE 'Sent % reminders', sent_count;
  
  RETURN sent_count;
END;
$$ LANGUAGE plpgsql;

-- Gecikmiş görevler için uyarı oluştur (her gün sabah 9:00)
CREATE OR REPLACE FUNCTION check_overdue_tasks()
RETURNS INTEGER AS $$
DECLARE
  task_count INTEGER := 0;
BEGIN
  -- Gecikmiş görevler için bildirim oluştur
  INSERT INTO "Notification" (
    title,
    message,
    type,
    priority,
    "relatedTo",
    "relatedId",
    "userId",
    "companyId",
    link
  )
  SELECT
    '⚠️ Gecikmiş Görev',
    '"' || COALESCE(t.title, 'Başlıksız') || '" görevi son tarihini geçti!',
    'error',
    'high',
    'Task',
    t.id,
    t."assignedTo",
    t."companyId",
    '/tasks'
  FROM "Task" t
  WHERE t."dueDate" < CURRENT_DATE
    AND t.status != 'DONE'
    AND t."assignedTo" IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM "Notification" n
      WHERE n."relatedTo" = 'Task'
        AND n."relatedId" = t.id
        AND n.title LIKE '%Gecikmiş Görev%'
        AND n."createdAt" > CURRENT_DATE
    );
  
  GET DIAGNOSTICS task_count = ROW_COUNT;
  
  RAISE NOTICE 'Created % overdue task notifications', task_count;
  
  RETURN task_count;
END;
$$ LANGUAGE plpgsql;

-- Müşteri takip kontrolü (her gün sabah 9:00)
CREATE OR REPLACE FUNCTION check_customer_follow_ups()
RETURNS INTEGER AS $$
DECLARE
  follow_up_count INTEGER := 0;
BEGIN
  -- 30 gün iletişim yok - Otomatik görev oluştur
  INSERT INTO "Task" (
    title,
    description,
    "assignedTo",
    "dueDate",
    priority,
    "relatedTo",
    "relatedId",
    "companyId",
    "createdBy",
    status
  )
  SELECT
    'Müşteri Takibi: ' || c.name,
    'Bu müşteri ile 30 gündür iletişim yok. Lütfen arayın ve durumu öğrenin.',
    COALESCE(c."assignedTo", (SELECT id FROM "User" WHERE "companyId" = c."companyId" AND role IN ('SALES', 'ADMIN') LIMIT 1)),
    CURRENT_DATE + INTERVAL '2 days',
    'HIGH',
    'Customer',
    c.id,
    c."companyId",
    (SELECT id FROM "User" WHERE "companyId" = c."companyId" AND role = 'ADMIN' LIMIT 1),
    'TODO'
  FROM "Customer" c
  WHERE c."lastInteractionDate" IS NOT NULL
    AND c."lastInteractionDate" + INTERVAL '30 days' < CURRENT_DATE
    AND c.status = 'ACTIVE'
    AND NOT EXISTS (
      SELECT 1 FROM "Task" t
      WHERE t."relatedTo" = 'Customer'
        AND t."relatedId" = c.id
        AND t."createdAt" > NOW() - INTERVAL '7 days'
    );
  
  GET DIAGNOSTICS follow_up_count = ROW_COUNT;
  
  -- VIP müşteriler için 7 gün kontrolü
  INSERT INTO "Task" (
    title,
    description,
    "assignedTo",
    "dueDate",
    priority,
    "relatedTo",
    "relatedId",
    "companyId",
    "createdBy",
    status
  )
  SELECT
    '⭐ VIP Müşteri Takibi: ' || c.name,
    'VIP müşteriniz ile 7 gündür iletişim yok. Öncelikli olarak arayın!',
    COALESCE(c."assignedTo", (SELECT id FROM "User" WHERE "companyId" = c."companyId" AND role IN ('SALES', 'ADMIN') LIMIT 1)),
    CURRENT_DATE + INTERVAL '1 day',
    'HIGH',
    'Customer',
    c.id,
    c."companyId",
    (SELECT id FROM "User" WHERE "companyId" = c."companyId" AND role = 'ADMIN' LIMIT 1),
    'TODO'
  FROM "Customer" c
  WHERE c."lastInteractionDate" IS NOT NULL
    AND c."lastInteractionDate" + INTERVAL '7 days' < CURRENT_DATE
    AND c.status = 'ACTIVE'
    AND c.type = 'VIP'
    AND NOT EXISTS (
      SELECT 1 FROM "Task" t
      WHERE t."relatedTo" = 'Customer'
        AND t."relatedId" = c.id
        AND t."createdAt" > NOW() - INTERVAL '3 days'
    );
  
  GET DIAGNOSTICS follow_up_count = follow_up_count + ROW_COUNT;
  
  RAISE NOTICE 'Created % customer follow-up tasks', follow_up_count;
  
  RETURN follow_up_count;
END;
$$ LANGUAGE plpgsql;

-- Deal takip kontrolü (her gün sabah 10:00)
CREATE OR REPLACE FUNCTION check_deal_follow_ups()
RETURNS INTEGER AS $$
DECLARE
  deal_count INTEGER := 0;
BEGIN
  -- 7 gün LEAD'de kalan deal'ler için görev oluştur
  INSERT INTO "Task" (
    title,
    description,
    "assignedTo",
    "dueDate",
    priority,
    "relatedTo",
    "relatedId",
    "companyId",
    "createdBy",
    status
  )
  SELECT
    'Fırsat Takibi: ' || d.title,
    'Bu fırsat 7 gündür LEAD aşamasında. Lütfen müşteri ile görüşün ve ilerleyin.',
    COALESCE(d."assignedTo", (SELECT id FROM "User" WHERE "companyId" = d."companyId" AND role IN ('SALES', 'ADMIN') LIMIT 1)),
    CURRENT_DATE + INTERVAL '1 day',
    'HIGH',
    'Deal',
    d.id,
    d."companyId",
    (SELECT id FROM "User" WHERE "companyId" = d."companyId" AND role = 'ADMIN' LIMIT 1),
    'TODO'
  FROM "Deal" d
  WHERE d.stage = 'LEAD'
    AND d."createdAt" + INTERVAL '7 days' < NOW()
    AND NOT EXISTS (
      SELECT 1 FROM "Task" t
      WHERE t."relatedTo" = 'Deal'
        AND t."relatedId" = d.id
        AND t."createdAt" > NOW() - INTERVAL '3 days'
    );
  
  GET DIAGNOSTICS deal_count = ROW_COUNT;
  
  RAISE NOTICE 'Created % deal follow-up tasks', deal_count;
  
  RETURN deal_count;
END;
$$ LANGUAGE plpgsql;

-- Quote takip kontrolü (her gün sabah 10:00)
CREATE OR REPLACE FUNCTION check_quote_follow_ups()
RETURNS INTEGER AS $$
DECLARE
  quote_count INTEGER := 0;
BEGIN
  -- 2 gün SENT'te kalan quote'lar için görev oluştur
  INSERT INTO "Task" (
    title,
    description,
    "assignedTo",
    "dueDate",
    priority,
    "relatedTo",
    "relatedId",
    "companyId",
    "createdBy",
    status
  )
  SELECT
    'Teklif Takibi: #' || q."quoteNumber",
    'Teklif 2 gündür yanıtsız. Müşteriyi arayın ve durumu öğrenin.',
    COALESCE(q."assignedTo", (SELECT id FROM "User" WHERE "companyId" = q."companyId" AND role IN ('SALES', 'ADMIN') LIMIT 1)),
    CURRENT_DATE + INTERVAL '1 day',
    'NORMAL',
    'Quote',
    q.id,
    q."companyId",
    (SELECT id FROM "User" WHERE "companyId" = q."companyId" AND role = 'ADMIN' LIMIT 1),
    'TODO'
  FROM "Quote" q
  WHERE q.status = 'SENT'
    AND q."updatedAt" + INTERVAL '2 days' < NOW()
    AND NOT EXISTS (
      SELECT 1 FROM "Task" t
      WHERE t."relatedTo" = 'Quote'
        AND t."relatedId" = q.id
        AND t."createdAt" > NOW() - INTERVAL '2 days'
    );
  
  GET DIAGNOSTICS quote_count = ROW_COUNT;
  
  RAISE NOTICE 'Created % quote follow-up tasks', quote_count;
  
  RETURN quote_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 4: GÜNLÜK ÖZET BİLDİRİMİ
-- ============================================

-- Her gün sabah 8:00 - Kullanıcılara günlük özet gönder
CREATE OR REPLACE FUNCTION send_daily_summary()
RETURNS INTEGER AS $$
DECLARE
  user_count INTEGER := 0;
BEGIN
  INSERT INTO "Notification" (
    title,
    message,
    type,
    priority,
    "userId",
    "companyId"
  )
  SELECT
    '☀️ Günaydın! Günlük Özet',
    'Bugün ' || 
    COALESCE(task_count::TEXT, '0') || ' göreviniz, ' ||
    COALESCE(meeting_count::TEXT, '0') || ' görüşmeniz var. İyi günler!',
    'info',
    'normal',
    u.id,
    u."companyId"
  FROM "User" u
  LEFT JOIN (
    SELECT "assignedTo", COUNT(*) as task_count
    FROM "Task"
    WHERE "dueDate" = CURRENT_DATE
      AND status != 'DONE'
    GROUP BY "assignedTo"
  ) t ON t."assignedTo" = u.id
  LEFT JOIN (
    SELECT mp."userId", COUNT(*) as meeting_count
    FROM "MeetingParticipant" mp
    JOIN "Meeting" m ON m.id = mp."meetingId"
    WHERE DATE(m."startTime") = CURRENT_DATE
    GROUP BY mp."userId"
  ) m ON m."userId" = u.id
  WHERE u.status = 'ACTIVE'
    AND (task_count > 0 OR meeting_count > 0);
  
  GET DIAGNOSTICS user_count = ROW_COUNT;
  
  RAISE NOTICE 'Sent daily summary to % users', user_count;
  
  RETURN user_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 5: CRON JOB KAYITLARI (Manuel Kurulum)
-- ============================================

-- Not: pg_cron extension gereklidir
-- Supabase Dashboard'da SQL Editor'de şu komutları çalıştırın:

/*
-- Extension ekle (bir kere)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Her 15 dakikada reminder gönder
SELECT cron.schedule(
  'send-reminders-15min',
  '*/15 * * * *',
  $$SELECT send_pending_reminders()$$
);

-- Her gün sabah 8:00 günlük özet
SELECT cron.schedule(
  'daily-summary-8am',
  '0 8 * * *',
  $$SELECT send_daily_summary()$$
);

-- Her gün sabah 9:00 gecikmiş görevler
SELECT cron.schedule(
  'overdue-tasks-9am',
  '0 9 * * *',
  $$SELECT check_overdue_tasks()$$
);

-- Her gün sabah 9:00 müşteri takibi
SELECT cron.schedule(
  'customer-follow-ups-9am',
  '0 9 * * *',
  $$SELECT check_customer_follow_ups()$$
);

-- Her gün sabah 10:00 deal takibi
SELECT cron.schedule(
  'deal-follow-ups-10am',
  '0 10 * * *',
  $$SELECT check_deal_follow_ups()$$
);

-- Her gün sabah 10:00 quote takibi
SELECT cron.schedule(
  'quote-follow-ups-10am',
  '0 10 * * *',
  $$SELECT check_quote_follow_ups()$$
);
*/

-- ============================================
-- PART 6: BILGILENDIRME NOTIFICATION
-- ============================================

-- Kullanıcılara yeni özellikler hakkında bilgi ver
DO $$
BEGIN
  INSERT INTO "Notification" (
    title,
    message,
    type,
    priority,
    "userId",
    "companyId"
  )
  SELECT
    '🎉 Yeni Özellik: Otomatik Hatırlatıcılar!',
    'CRM sisteminizde artık otomatik hatırlatıcılar çalışıyor:\n' ||
    '• Görev tarihleri için hatırlatma\n' ||
    '• Görüşme saatleri için hatırlatma\n' ||
    '• Müşteri takip hatırlatmaları\n' ||
    '• Günlük özet bildirimleri\n' ||
    'Artık hiçbir önemli tarihi kaçırmazsınız!',
    'success',
    'high',
    u.id,
    u."companyId"
  FROM "User" u
  WHERE u.role IN ('ADMIN', 'SALES', 'SUPER_ADMIN')
    AND NOT EXISTS (
      SELECT 1 FROM "Notification"
      WHERE "userId" = u.id
        AND title = '🎉 Yeni Özellik: Otomatik Hatırlatıcılar!'
    );
END $$;

