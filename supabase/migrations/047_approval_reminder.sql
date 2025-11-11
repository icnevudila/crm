-- ============================================
-- 047_approval_reminder.sql
-- Onay Bekleyen Talepler İçin Hatırlatıcı Sistemi
-- ============================================

-- Onay bekleyen talepler için günlük hatırlatıcı
CREATE OR REPLACE FUNCTION notify_pending_approvals()
RETURNS VOID AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT
      a.id AS approval_id,
      a."relatedTo" AS related_to,
      a."relatedId" AS related_id,
      a."companyId" AS company_id,
      a."requestedBy" AS requester_id,
      a."createdAt" AS created_at,
      unnest(a."approverIds") AS approver_id
    FROM "ApprovalRequest" a
    WHERE a.status = 'PENDING'
      AND a."createdAt" < NOW() - INTERVAL '1 day' -- 1 günden fazla bekliyor
      AND NOT EXISTS (
        SELECT 1 FROM "Notification" n
        WHERE n."relatedTo" = 'ApprovalRequest'
          AND n."relatedId" = a.id
          AND n.title LIKE '⏰ Onay Hatırlatıcısı%'
          AND n."createdAt" >= CURRENT_DATE - INTERVAL '1 day' -- Son 24 saatte gönderilmemişse
      )
  ) LOOP
    BEGIN
      INSERT INTO "Notification" (title, message, type, "relatedTo", "relatedId", "companyId", "userId", link, priority)
      VALUES (
        '⏰ Onay Hatırlatıcısı',
        'Onayınızı bekleyen bir ' || r.related_to || ' talebi var. Lütfen inceleyin.',
        'warning',
        'ApprovalRequest',
        r.approval_id,
        r.company_id,
        r.approver_id,
        '/tr/approvals/' || r.approval_id,
        'high'
      ) ON CONFLICT DO NOTHING;
      
      RAISE NOTICE 'Pending approval reminder sent for approval %', r.approval_id;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to send pending approval reminder for approval %: %', r.approval_id, SQLERRM;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION notify_pending_approvals IS '1 günden fazla süredir PENDING durumunda olan onay talepleri için günlük hatırlatıcı bildirimi gönderir.';

-- CRON JOB (Manuel olarak çalıştırılmalı):
-- SELECT cron.schedule('pending-approval-reminder-job', '0 10 * * *', 'SELECT notify_pending_approvals();');

-- ============================================
-- Migration tamamlandı!
-- ============================================

