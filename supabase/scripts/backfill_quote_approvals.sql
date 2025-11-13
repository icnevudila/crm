-- ============================================
-- Backfill Quote Approval Requests
-- ============================================
-- Çalıştırma talimatı:
--   supabase db remote commit --file supabase/scripts/backfill_quote_approvals.sql
-- ya da psql üzerinden doğrudan çalıştırabilirsiniz.
--
-- Bu script;
--   1. Status'ü ACCEPTED veya DECLINED olan Quote kayıtları için
--      ApprovalRequest tablosuna geçmişe dönük kayıt ekler.
--   2. Her quote için daha önce onay kaydı olup olmadığını kontrol eder
--      (aynı kaydı iki kez oluşturmamak için).
--   3. Şirkette aktif ADMIN / SUPER_ADMIN varsa onları approver olarak ekler.
--      Yoksa quote'u güncelleyen / oluşturan kullanıcıyı approver olarak kullanır.
--   4. ACCEPTED durumundaki kayıtları APPROVED, DECLINED durumundakileri REJECTED olarak işaretler.
--
-- Notlar:
--   - requestedBy alanı için öncelikle quote.createdBy (varsa), yoksa assignedTo (varsa) kullanılır.
--   - approvedAt / rejectedAt alanları için quote.updatedAt tarihi kullanılır.
--   - Quote.notes kolonu varsa, reddedilen kayıtlar için rejectionReason olarak kaydedilir.
--   - priority alanı 50.000 TRY üzerindeki tutarlar için HIGH olarak işaretlenir.
-- ============================================

DO $$
DECLARE
  approval_threshold NUMERIC(15,2) := 50000;
  rec RECORD;
  approver_list UUID[];
  requested_by UUID;
  has_notes BOOLEAN;
  has_created_by BOOLEAN;
  has_assigned_to BOOLEAN;
  user_table_exists BOOLEAN;
  has_user_status BOOLEAN;
  select_query TEXT;
  created_expr TEXT;
  assigned_expr TEXT;
  notes_expr TEXT;
  created_count INTEGER := 0;
  skipped_count INTEGER := 0;
BEGIN
  -- Gerekli tablolar mevcut mu?
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'ApprovalRequest'
  ) THEN
    RAISE NOTICE 'ApprovalRequest tablosu bulunamadı. Backfill atlandı.';
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'Quote'
  ) THEN
    RAISE NOTICE 'Quote tablosu bulunamadı. Backfill atlandı.';
    RETURN;
  END IF;

  -- Quote.notes kolonu var mı?
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Quote' AND column_name = 'notes'
  ) INTO has_notes;

  -- Quote.createdBy kolonu var mı?
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Quote' AND column_name = 'createdBy'
  ) INTO has_created_by;

  -- Quote.assignedTo kolonu var mı?
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Quote' AND column_name = 'assignedTo'
  ) INTO has_assigned_to;

  -- User tablosu ve status kolonu kontrolü
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'User'
  ) INTO user_table_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'User' AND column_name = 'status'
  ) INTO has_user_status;

  created_expr := CASE
    WHEN has_created_by THEN 'q."createdBy"'
    ELSE 'NULL::UUID'
  END;

  assigned_expr := CASE
    WHEN has_assigned_to THEN 'q."assignedTo"'
    ELSE 'NULL::UUID'
  END;

  notes_expr := CASE
    WHEN has_notes THEN 'q."notes"'
    ELSE 'NULL::TEXT'
  END;

  select_query := format($SQL$
    SELECT
      q.id,
      q.title,
      q.status,
      q."companyId",
      %s AS "createdBy",
      %s AS "assignedTo",
      q."updatedAt",
      q."totalAmount",
      %s AS notes
    FROM "Quote" q
    WHERE q.status IN ('ACCEPTED', 'DECLINED')
      AND NOT EXISTS (
        SELECT 1 FROM "ApprovalRequest"
        WHERE "relatedTo" = 'Quote'
          AND "relatedId" = q.id::TEXT
      )
  $SQL$, created_expr, assigned_expr, notes_expr);

  FOR rec IN EXECUTE select_query
  LOOP
    -- Onaylayıcıları hazırla
    IF user_table_exists THEN
      IF has_user_status THEN
        SELECT ARRAY(
            SELECT DISTINCT u.id
            FROM "User" u
            WHERE u."companyId" = rec."companyId"
              AND u.role IN ('ADMIN', 'SUPER_ADMIN')
              AND u.status = 'ACTIVE'
          )
        INTO approver_list;
      ELSE
        SELECT ARRAY(
            SELECT DISTINCT u.id
            FROM "User" u
            WHERE u."companyId" = rec."companyId"
              AND u.role IN ('ADMIN', 'SUPER_ADMIN')
          )
        INTO approver_list;
      END IF;
    ELSE
      approver_list := ARRAY[]::UUID[];
    END IF;

    requested_by := COALESCE(rec."createdBy", rec."assignedTo", approver_list[1]);

    IF requested_by IS NULL THEN
      -- Onay kaydı oluşturmak için kullanıcı bulunamadı
      skipped_count := skipped_count + 1;
      RAISE NOTICE 'Quote % için requestedBy bulunamadı, kayıt atlandı.', rec.id;
      CONTINUE;
    END IF;

    IF approver_list IS NULL OR array_length(approver_list, 1) = 0 THEN
      approver_list := ARRAY[requested_by];
    END IF;

    INSERT INTO "ApprovalRequest" (
      title,
      description,
      "relatedTo",
      "relatedId",
      "requestedBy",
      "approverIds",
      priority,
      status,
      "companyId",
      "approvedBy",
      "approvedAt",
      "rejectedBy",
      "rejectedAt",
      "rejectionReason",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      COALESCE('Teklif Onayı: ' || NULLIF(rec.title, ''), 'Teklif Onayı'),
      CASE
        WHEN rec.status = 'ACCEPTED' THEN
          'Teklif kabul edildiği için geçmişe dönük onay kaydı oluşturuldu.'
        ELSE
          'Teklif reddedildiği için geçmişe dönük onay kaydı oluşturuldu.'
      END,
      'Quote',
      rec.id::TEXT,
      requested_by,
      approver_list,
      CASE
        WHEN COALESCE(rec."totalAmount", 0) > approval_threshold THEN 'HIGH'
        ELSE 'NORMAL'
      END,
      CASE
        WHEN rec.status = 'ACCEPTED' THEN 'APPROVED'
        ELSE 'REJECTED'
      END,
      rec."companyId",
      CASE
        WHEN rec.status = 'ACCEPTED' THEN approver_list[1]
        ELSE NULL
      END,
      CASE
        WHEN rec.status = 'ACCEPTED' THEN COALESCE(rec."updatedAt", NOW())
        ELSE NULL
      END,
      CASE
        WHEN rec.status <> 'ACCEPTED' THEN approver_list[1]
        ELSE NULL
      END,
      CASE
        WHEN rec.status <> 'ACCEPTED' THEN COALESCE(rec."updatedAt", NOW())
        ELSE NULL
      END,
      CASE
        WHEN rec.status <> 'ACCEPTED' THEN rec.notes
        ELSE NULL
      END,
      COALESCE(rec."updatedAt", NOW()),
      COALESCE(rec."updatedAt", NOW())
    );

    created_count := created_count + 1;
  END LOOP;

  RAISE NOTICE 'Quote approval backfill tamamlandı. Oluşturulan: %, Atlanan: %', created_count, skipped_count;
END $$;


