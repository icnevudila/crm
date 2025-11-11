-- ============================================
-- 055_backfill_approval_records.sql
-- Mevcut Tüm İşlemler İçin Onay Kayıtları Oluştur
-- ============================================
-- Bu dosya şunları yapar:
-- 1. Mevcut tüm Quote'lar için onay kaydı oluşturur
-- 2. Mevcut tüm Deal'ler için onay kaydı oluşturur
-- 3. Mevcut tüm Invoice'lar için onay kaydı oluşturur
-- 4. Mevcut tüm Contract'lar için onay kaydı oluşturur
-- 5. Threshold'a göre otomatik onaylar veya PENDING bırakır
-- ============================================

-- ============================================
-- PART 1: QUOTE BACKFILL
-- ============================================

DO $$
DECLARE
  approval_threshold DECIMAL(15,2) := 50000; -- 50K TRY
  quote_record RECORD;
  manager_id UUID;
  quote_amount DECIMAL(15,2) := 0;
  auto_approve BOOLEAN := false;
  approval_exists BOOLEAN;
  has_total_amount BOOLEAN;
  has_total BOOLEAN;
  has_created_by BOOLEAN;
  has_assigned_to BOOLEAN;
  quote_user_id UUID;
  created_count INTEGER := 0;
  skipped_count INTEGER := 0;
BEGIN
  -- ApprovalRequest tablosu var mı?
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'ApprovalRequest'
  ) THEN
    RAISE NOTICE 'ApprovalRequest tablosu bulunamadı, backfill atlandı.';
    RETURN;
  END IF;

  -- Quote tablosunda totalAmount veya total kolonu var mı?
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Quote' AND column_name = 'totalAmount'
  ) INTO has_total_amount;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Quote' AND column_name = 'total'
  ) INTO has_total;

  -- Quote tablosunda createdBy veya assignedTo kolonu var mı?
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Quote' AND column_name = 'createdBy'
  ) INTO has_created_by;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Quote' AND column_name = 'assignedTo'
  ) INTO has_assigned_to;

  IF NOT has_total_amount AND NOT has_total THEN
    RAISE NOTICE 'Quote tablosunda total veya totalAmount kolonu bulunamadı, backfill atlandı.';
    RETURN;
  END IF;

  RAISE NOTICE 'Quote backfill başlıyor...';

  -- Tüm Quote'ları işle - Dinamik SELECT sorgusu
  IF has_total_amount THEN
    -- totalAmount kolonu varsa
    IF has_created_by THEN
      -- createdBy varsa
      FOR quote_record IN 
        SELECT 
          q.id,
          q.title,
          q.status,
          q."companyId",
          q."createdBy" as user_id,
          q."createdAt",
          COALESCE(q."totalAmount", 0) AS amount
        FROM "Quote" q
        WHERE q.status IN ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'DECLINED', 'WAITING')
      LOOP
        BEGIN
          quote_user_id := quote_record.user_id;
          
          -- Zaten onay kaydı var mı?
          SELECT EXISTS (
            SELECT 1 FROM "ApprovalRequest"
            WHERE "relatedTo" = 'Quote'
              AND "relatedId" = quote_record.id::TEXT
          ) INTO approval_exists;

          IF approval_exists THEN
            skipped_count := skipped_count + 1;
            CONTINUE;
          END IF;

          -- Quote tutarını al
          quote_amount := COALESCE(quote_record.amount, 0);

          -- Manager bul
          SELECT id INTO manager_id
          FROM "User"
          WHERE "companyId" = quote_record."companyId"
            AND role IN ('ADMIN', 'SUPER_ADMIN')
            AND (quote_user_id IS NULL OR id != quote_user_id)
          LIMIT 1;

          -- Manager yoksa, kendisini onaylayıcı olarak kullan
          IF manager_id IS NULL THEN
            manager_id := quote_user_id;
            auto_approve := true;
          END IF;

          -- Threshold altındaysa otomatik onayla
          IF quote_amount <= approval_threshold THEN
            auto_approve := true;
          END IF;

          -- Onay kaydı oluştur
          INSERT INTO "ApprovalRequest" (
            title,
            description,
            "relatedTo",
            "relatedId",
            "requestedBy",
            "approverIds",
            priority,
            "companyId",
            status,
            "approvedBy",
            "approvedAt",
            "createdAt"
          ) VALUES (
            'Teklif Onayı: ' || COALESCE(quote_record.title, 'Başlıksız'),
            CASE 
              WHEN quote_amount <= approval_threshold THEN 
                'Toplam tutar ' || quote_amount || ' TRY, onay limiti altında. Otomatik onaylandı. (Backfill)'
              ELSE 
                'Toplam tutar ' || quote_amount || ' TRY, onay limiti ' || approval_threshold || ' TRY aşıldı. (Backfill)'
            END,
            'Quote',
            quote_record.id::TEXT,
            quote_user_id,
            ARRAY[manager_id],
            CASE WHEN quote_amount > approval_threshold THEN 'HIGH' ELSE 'NORMAL' END,
            quote_record."companyId",
            CASE WHEN auto_approve THEN 'APPROVED' ELSE 'PENDING' END,
            CASE WHEN auto_approve THEN quote_user_id ELSE NULL END,
            CASE WHEN auto_approve THEN quote_record."createdAt" ELSE NULL END,
            quote_record."createdAt"
          );

          created_count := created_count + 1;
          auto_approve := false;

        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING 'Quote % için onay kaydı oluşturulamadı: %', quote_record.id, SQLERRM;
        END;
      END LOOP;
    ELSIF has_assigned_to THEN
      -- assignedTo varsa
      FOR quote_record IN 
        SELECT 
          q.id,
          q.title,
          q.status,
          q."companyId",
          q."assignedTo" as user_id,
          q."createdAt",
          COALESCE(q."totalAmount", 0) AS amount
        FROM "Quote" q
        WHERE q.status IN ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'DECLINED', 'WAITING')
      LOOP
        BEGIN
          quote_user_id := quote_record.user_id;
          
          -- Zaten onay kaydı var mı?
          SELECT EXISTS (
            SELECT 1 FROM "ApprovalRequest"
            WHERE "relatedTo" = 'Quote'
              AND "relatedId" = quote_record.id::TEXT
          ) INTO approval_exists;

          IF approval_exists THEN
            skipped_count := skipped_count + 1;
            CONTINUE;
          END IF;

          -- Quote tutarını al
          quote_amount := COALESCE(quote_record.amount, 0);

          -- Manager bul
          SELECT id INTO manager_id
          FROM "User"
          WHERE "companyId" = quote_record."companyId"
            AND role IN ('ADMIN', 'SUPER_ADMIN')
            AND (quote_user_id IS NULL OR id != quote_user_id)
          LIMIT 1;

          -- Manager yoksa, kendisini onaylayıcı olarak kullan
          IF manager_id IS NULL THEN
            manager_id := quote_user_id;
            auto_approve := true;
          END IF;

          -- Threshold altındaysa otomatik onayla
          IF quote_amount <= approval_threshold THEN
            auto_approve := true;
          END IF;

          -- Onay kaydı oluştur
          INSERT INTO "ApprovalRequest" (
            title,
            description,
            "relatedTo",
            "relatedId",
            "requestedBy",
            "approverIds",
            priority,
            "companyId",
            status,
            "approvedBy",
            "approvedAt",
            "createdAt"
          ) VALUES (
            'Teklif Onayı: ' || COALESCE(quote_record.title, 'Başlıksız'),
            CASE 
              WHEN quote_amount <= approval_threshold THEN 
                'Toplam tutar ' || quote_amount || ' TRY, onay limiti altında. Otomatik onaylandı. (Backfill)'
              ELSE 
                'Toplam tutar ' || quote_amount || ' TRY, onay limiti ' || approval_threshold || ' TRY aşıldı. (Backfill)'
            END,
            'Quote',
            quote_record.id::TEXT,
            quote_user_id,
            ARRAY[manager_id],
            CASE WHEN quote_amount > approval_threshold THEN 'HIGH' ELSE 'NORMAL' END,
            quote_record."companyId",
            CASE WHEN auto_approve THEN 'APPROVED' ELSE 'PENDING' END,
            CASE WHEN auto_approve THEN quote_user_id ELSE NULL END,
            CASE WHEN auto_approve THEN quote_record."createdAt" ELSE NULL END,
            quote_record."createdAt"
          );

          created_count := created_count + 1;
          auto_approve := false;

        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING 'Quote % için onay kaydı oluşturulamadı: %', quote_record.id, SQLERRM;
        END;
      END LOOP;
    ELSE
      -- Hiçbir kullanıcı kolonu yoksa, NULL kullan
      FOR quote_record IN 
        SELECT 
          q.id,
          q.title,
          q.status,
          q."companyId",
          q."createdAt",
          COALESCE(q."totalAmount", 0) AS amount
        FROM "Quote" q
        WHERE q.status IN ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'DECLINED', 'WAITING')
      LOOP
        BEGIN
          quote_user_id := NULL;
          
          -- Zaten onay kaydı var mı?
          SELECT EXISTS (
            SELECT 1 FROM "ApprovalRequest"
            WHERE "relatedTo" = 'Quote'
              AND "relatedId" = quote_record.id::TEXT
          ) INTO approval_exists;

          IF approval_exists THEN
            skipped_count := skipped_count + 1;
            CONTINUE;
          END IF;

          -- Quote tutarını al
          quote_amount := COALESCE(quote_record.amount, 0);

          -- Manager bul
          SELECT id INTO manager_id
          FROM "User"
          WHERE "companyId" = quote_record."companyId"
            AND role IN ('ADMIN', 'SUPER_ADMIN')
          LIMIT 1;

          -- Manager yoksa, otomatik onayla
          IF manager_id IS NULL THEN
            auto_approve := true;
          END IF;

          -- Threshold altındaysa otomatik onayla
          IF quote_amount <= approval_threshold THEN
            auto_approve := true;
          END IF;

          -- Onay kaydı oluştur
          INSERT INTO "ApprovalRequest" (
            title,
            description,
            "relatedTo",
            "relatedId",
            "requestedBy",
            "approverIds",
            priority,
            "companyId",
            status,
            "approvedBy",
            "approvedAt",
            "createdAt"
          ) VALUES (
            'Teklif Onayı: ' || COALESCE(quote_record.title, 'Başlıksız'),
            CASE 
              WHEN quote_amount <= approval_threshold THEN 
                'Toplam tutar ' || quote_amount || ' TRY, onay limiti altında. Otomatik onaylandı. (Backfill)'
              ELSE 
                'Toplam tutar ' || quote_amount || ' TRY, onay limiti ' || approval_threshold || ' TRY aşıldı. (Backfill)'
            END,
            'Quote',
            quote_record.id::TEXT,
            quote_user_id,
            ARRAY[manager_id],
            CASE WHEN quote_amount > approval_threshold THEN 'HIGH' ELSE 'NORMAL' END,
            quote_record."companyId",
            CASE WHEN auto_approve THEN 'APPROVED' ELSE 'PENDING' END,
            CASE WHEN auto_approve THEN quote_user_id ELSE NULL END,
            CASE WHEN auto_approve THEN quote_record."createdAt" ELSE NULL END,
            quote_record."createdAt"
          );

          created_count := created_count + 1;
          auto_approve := false;

        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING 'Quote % için onay kaydı oluşturulamadı: %', quote_record.id, SQLERRM;
        END;
      END LOOP;
    END IF;
  ELSIF has_total THEN
    -- total kolonu varsa - aynı mantık
    IF has_created_by THEN
      FOR quote_record IN 
        SELECT 
          q.id,
          q.title,
          q.status,
          q."companyId",
          q."createdBy" as user_id,
          q."createdAt",
          COALESCE(q.total, 0) AS amount
        FROM "Quote" q
        WHERE q.status IN ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'DECLINED', 'WAITING')
      LOOP
        BEGIN
          quote_user_id := quote_record.user_id;
          
          SELECT EXISTS (
            SELECT 1 FROM "ApprovalRequest"
            WHERE "relatedTo" = 'Quote' AND "relatedId" = quote_record.id::TEXT
          ) INTO approval_exists;

          IF approval_exists THEN
            skipped_count := skipped_count + 1;
            CONTINUE;
          END IF;

          quote_amount := COALESCE(quote_record.amount, 0);

          SELECT id INTO manager_id
          FROM "User"
          WHERE "companyId" = quote_record."companyId"
            AND role IN ('ADMIN', 'SUPER_ADMIN')
            AND (quote_user_id IS NULL OR id != quote_user_id)
          LIMIT 1;

          IF manager_id IS NULL THEN
            manager_id := quote_user_id;
            auto_approve := true;
          END IF;

          IF quote_amount <= approval_threshold THEN
            auto_approve := true;
          END IF;

          INSERT INTO "ApprovalRequest" (
            title, description, "relatedTo", "relatedId", "requestedBy", "approverIds",
            priority, "companyId", status, "approvedBy", "approvedAt", "createdAt"
          ) VALUES (
            'Teklif Onayı: ' || COALESCE(quote_record.title, 'Başlıksız'),
            CASE 
              WHEN quote_amount <= approval_threshold THEN 
                'Toplam tutar ' || quote_amount || ' TRY, onay limiti altında. Otomatik onaylandı. (Backfill)'
              ELSE 
                'Toplam tutar ' || quote_amount || ' TRY, onay limiti ' || approval_threshold || ' TRY aşıldı. (Backfill)'
            END,
            'Quote', quote_record.id::TEXT, quote_user_id, ARRAY[manager_id],
            CASE WHEN quote_amount > approval_threshold THEN 'HIGH' ELSE 'NORMAL' END,
            quote_record."companyId",
            CASE WHEN auto_approve THEN 'APPROVED' ELSE 'PENDING' END,
            CASE WHEN auto_approve THEN quote_user_id ELSE NULL END,
            CASE WHEN auto_approve THEN quote_record."createdAt" ELSE NULL END,
            quote_record."createdAt"
          );

          created_count := created_count + 1;
          auto_approve := false;

        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING 'Quote % için onay kaydı oluşturulamadı: %', quote_record.id, SQLERRM;
        END;
      END LOOP;
    ELSIF has_assigned_to THEN
      FOR quote_record IN 
        SELECT 
          q.id, q.title, q.status, q."companyId", q."assignedTo" as user_id, q."createdAt",
          COALESCE(q.total, 0) AS amount
        FROM "Quote" q
        WHERE q.status IN ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'DECLINED', 'WAITING')
      LOOP
        BEGIN
          quote_user_id := quote_record.user_id;
          
          SELECT EXISTS (
            SELECT 1 FROM "ApprovalRequest"
            WHERE "relatedTo" = 'Quote' AND "relatedId" = quote_record.id::TEXT
          ) INTO approval_exists;

          IF approval_exists THEN
            skipped_count := skipped_count + 1;
            CONTINUE;
          END IF;

          quote_amount := COALESCE(quote_record.amount, 0);

          SELECT id INTO manager_id
          FROM "User"
          WHERE "companyId" = quote_record."companyId"
            AND role IN ('ADMIN', 'SUPER_ADMIN')
            AND (quote_user_id IS NULL OR id != quote_user_id)
          LIMIT 1;

          IF manager_id IS NULL THEN
            manager_id := quote_user_id;
            auto_approve := true;
          END IF;

          IF quote_amount <= approval_threshold THEN
            auto_approve := true;
          END IF;

          INSERT INTO "ApprovalRequest" (
            title, description, "relatedTo", "relatedId", "requestedBy", "approverIds",
            priority, "companyId", status, "approvedBy", "approvedAt", "createdAt"
          ) VALUES (
            'Teklif Onayı: ' || COALESCE(quote_record.title, 'Başlıksız'),
            CASE 
              WHEN quote_amount <= approval_threshold THEN 
                'Toplam tutar ' || quote_amount || ' TRY, onay limiti altında. Otomatik onaylandı. (Backfill)'
              ELSE 
                'Toplam tutar ' || quote_amount || ' TRY, onay limiti ' || approval_threshold || ' TRY aşıldı. (Backfill)'
            END,
            'Quote', quote_record.id::TEXT, quote_user_id, ARRAY[manager_id],
            CASE WHEN quote_amount > approval_threshold THEN 'HIGH' ELSE 'NORMAL' END,
            quote_record."companyId",
            CASE WHEN auto_approve THEN 'APPROVED' ELSE 'PENDING' END,
            CASE WHEN auto_approve THEN quote_user_id ELSE NULL END,
            CASE WHEN auto_approve THEN quote_record."createdAt" ELSE NULL END,
            quote_record."createdAt"
          );

          created_count := created_count + 1;
          auto_approve := false;

        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING 'Quote % için onay kaydı oluşturulamadı: %', quote_record.id, SQLERRM;
        END;
      END LOOP;
    ELSE
      FOR quote_record IN 
        SELECT 
          q.id, q.title, q.status, q."companyId", q."createdAt",
          COALESCE(q.total, 0) AS amount
        FROM "Quote" q
        WHERE q.status IN ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'DECLINED', 'WAITING')
      LOOP
        BEGIN
          quote_user_id := NULL;
          
          SELECT EXISTS (
            SELECT 1 FROM "ApprovalRequest"
            WHERE "relatedTo" = 'Quote' AND "relatedId" = quote_record.id::TEXT
          ) INTO approval_exists;

          IF approval_exists THEN
            skipped_count := skipped_count + 1;
            CONTINUE;
          END IF;

          quote_amount := COALESCE(quote_record.amount, 0);

          SELECT id INTO manager_id
          FROM "User"
          WHERE "companyId" = quote_record."companyId"
            AND role IN ('ADMIN', 'SUPER_ADMIN')
          LIMIT 1;

          IF manager_id IS NULL THEN
            auto_approve := true;
          END IF;

          IF quote_amount <= approval_threshold THEN
            auto_approve := true;
          END IF;

          INSERT INTO "ApprovalRequest" (
            title, description, "relatedTo", "relatedId", "requestedBy", "approverIds",
            priority, "companyId", status, "approvedBy", "approvedAt", "createdAt"
          ) VALUES (
            'Teklif Onayı: ' || COALESCE(quote_record.title, 'Başlıksız'),
            CASE 
              WHEN quote_amount <= approval_threshold THEN 
                'Toplam tutar ' || quote_amount || ' TRY, onay limiti altında. Otomatik onaylandı. (Backfill)'
              ELSE 
                'Toplam tutar ' || quote_amount || ' TRY, onay limiti ' || approval_threshold || ' TRY aşıldı. (Backfill)'
            END,
            'Quote', quote_record.id::TEXT, quote_user_id, ARRAY[manager_id],
            CASE WHEN quote_amount > approval_threshold THEN 'HIGH' ELSE 'NORMAL' END,
            quote_record."companyId",
            CASE WHEN auto_approve THEN 'APPROVED' ELSE 'PENDING' END,
            CASE WHEN auto_approve THEN quote_user_id ELSE NULL END,
            CASE WHEN auto_approve THEN quote_record."createdAt" ELSE NULL END,
            quote_record."createdAt"
          );

          created_count := created_count + 1;
          auto_approve := false;

        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING 'Quote % için onay kaydı oluşturulamadı: %', quote_record.id, SQLERRM;
        END;
      END LOOP;
    END IF;
  END IF;

  RAISE NOTICE 'Quote backfill tamamlandı: % kayıt oluşturuldu, % kayıt atlandı', created_count, skipped_count;
END $$;

-- ============================================
-- PART 2: DEAL BACKFILL
-- ============================================

DO $$
DECLARE
  approval_threshold DECIMAL(15,2) := 100000; -- 100K TRY
  deal_record RECORD;
  manager_id UUID;
  auto_approve BOOLEAN := false;
  approval_exists BOOLEAN;
  has_created_by BOOLEAN;
  has_assigned_to BOOLEAN;
  deal_user_id UUID;
  created_count INTEGER := 0;
  skipped_count INTEGER := 0;
BEGIN
  -- ApprovalRequest tablosu var mı?
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'ApprovalRequest'
  ) THEN
    RETURN;
  END IF;

  RAISE NOTICE 'Deal backfill başlıyor...';

  -- Deal tablosunda createdBy veya assignedTo kolonu var mı?
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Deal' AND column_name = 'createdBy'
  ) INTO has_created_by;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Deal' AND column_name = 'assignedTo'
  ) INTO has_assigned_to;

  -- Tüm Deal'leri işle - Dinamik SELECT sorgusu
  IF has_created_by THEN
    -- createdBy kolonu varsa
    FOR deal_record IN 
      SELECT 
        d.id,
        d.title,
        d.stage,
        d.value,
        d."companyId",
        d."createdBy" as user_id,
        d."createdAt"
      FROM "Deal" d
      WHERE d.stage IN ('PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST')
    LOOP
      BEGIN
        deal_user_id := deal_record.user_id;
        
        -- Zaten onay kaydı var mı?
        SELECT EXISTS (
          SELECT 1 FROM "ApprovalRequest"
          WHERE "relatedTo" = 'Deal'
            AND "relatedId" = deal_record.id::TEXT
        ) INTO approval_exists;

        IF approval_exists THEN
          skipped_count := skipped_count + 1;
          CONTINUE;
        END IF;

        -- Manager bul
        SELECT id INTO manager_id
        FROM "User"
        WHERE "companyId" = deal_record."companyId"
          AND role IN ('ADMIN', 'SUPER_ADMIN')
          AND (deal_user_id IS NULL OR id != deal_user_id)
        LIMIT 1;

        -- Manager yoksa, kendisini onaylayıcı olarak kullan
        IF manager_id IS NULL THEN
          manager_id := deal_user_id;
          auto_approve := true;
        END IF;

        -- Threshold altındaysa otomatik onayla
        IF COALESCE(deal_record.value, 0) <= approval_threshold THEN
          auto_approve := true;
        END IF;

        -- Onay kaydı oluştur
        INSERT INTO "ApprovalRequest" (
          title,
          description,
          "relatedTo",
          "relatedId",
          "requestedBy",
          "approverIds",
          priority,
          "companyId",
          status,
          "approvedBy",
          "approvedAt",
          "createdAt"
        ) VALUES (
          'Fırsat Onayı: ' || COALESCE(deal_record.title, 'Başlıksız'),
          CASE 
            WHEN COALESCE(deal_record.value, 0) <= approval_threshold THEN 
              'Fırsat değeri ' || deal_record.value || ' TRY, onay limiti altında. Otomatik onaylandı. (Backfill)'
            ELSE 
              'Fırsat değeri ' || deal_record.value || ' TRY, onay limiti ' || approval_threshold || ' TRY aşıldı. (Backfill)'
          END,
          'Deal',
          deal_record.id::TEXT,
          deal_user_id,
          ARRAY[manager_id],
          CASE WHEN COALESCE(deal_record.value, 0) > approval_threshold THEN 'HIGH' ELSE 'NORMAL' END,
          deal_record."companyId",
          CASE WHEN auto_approve THEN 'APPROVED' ELSE 'PENDING' END,
          CASE WHEN auto_approve THEN deal_user_id ELSE NULL END,
          CASE WHEN auto_approve THEN deal_record."createdAt" ELSE NULL END,
          deal_record."createdAt"
        );

        created_count := created_count + 1;
        auto_approve := false;

      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Deal % için onay kaydı oluşturulamadı: %', deal_record.id, SQLERRM;
      END;
    END LOOP;
  ELSIF has_assigned_to THEN
    -- assignedTo kolonu varsa
    FOR deal_record IN 
      SELECT 
        d.id,
        d.title,
        d.stage,
        d.value,
        d."companyId",
        d."assignedTo" as user_id,
        d."createdAt"
      FROM "Deal" d
      WHERE d.stage IN ('PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST')
    LOOP
      BEGIN
        deal_user_id := deal_record.user_id;
        
        -- Zaten onay kaydı var mı?
        SELECT EXISTS (
          SELECT 1 FROM "ApprovalRequest"
          WHERE "relatedTo" = 'Deal'
            AND "relatedId" = deal_record.id::TEXT
        ) INTO approval_exists;

        IF approval_exists THEN
          skipped_count := skipped_count + 1;
          CONTINUE;
        END IF;

        -- Manager bul
        SELECT id INTO manager_id
        FROM "User"
        WHERE "companyId" = deal_record."companyId"
          AND role IN ('ADMIN', 'SUPER_ADMIN')
          AND (deal_user_id IS NULL OR id != deal_user_id)
        LIMIT 1;

        -- Manager yoksa, kendisini onaylayıcı olarak kullan
        IF manager_id IS NULL THEN
          manager_id := deal_user_id;
          auto_approve := true;
        END IF;

        -- Threshold altındaysa otomatik onayla
        IF COALESCE(deal_record.value, 0) <= approval_threshold THEN
          auto_approve := true;
        END IF;

        -- Onay kaydı oluştur
        INSERT INTO "ApprovalRequest" (
          title,
          description,
          "relatedTo",
          "relatedId",
          "requestedBy",
          "approverIds",
          priority,
          "companyId",
          status,
          "approvedBy",
          "approvedAt",
          "createdAt"
        ) VALUES (
          'Fırsat Onayı: ' || COALESCE(deal_record.title, 'Başlıksız'),
          CASE 
            WHEN COALESCE(deal_record.value, 0) <= approval_threshold THEN 
              'Fırsat değeri ' || deal_record.value || ' TRY, onay limiti altında. Otomatik onaylandı. (Backfill)'
            ELSE 
              'Fırsat değeri ' || deal_record.value || ' TRY, onay limiti ' || approval_threshold || ' TRY aşıldı. (Backfill)'
          END,
          'Deal',
          deal_record.id::TEXT,
          deal_user_id,
          ARRAY[manager_id],
          CASE WHEN COALESCE(deal_record.value, 0) > approval_threshold THEN 'HIGH' ELSE 'NORMAL' END,
          deal_record."companyId",
          CASE WHEN auto_approve THEN 'APPROVED' ELSE 'PENDING' END,
          CASE WHEN auto_approve THEN deal_user_id ELSE NULL END,
          CASE WHEN auto_approve THEN deal_record."createdAt" ELSE NULL END,
          deal_record."createdAt"
        );

        created_count := created_count + 1;
        auto_approve := false;

      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Deal % için onay kaydı oluşturulamadı: %', deal_record.id, SQLERRM;
      END;
    END LOOP;
  ELSE
    -- Hiçbir kullanıcı kolonu yoksa, NULL kullan
    FOR deal_record IN 
      SELECT 
        d.id,
        d.title,
        d.stage,
        d.value,
        d."companyId",
        d."createdAt"
      FROM "Deal" d
      WHERE d.stage IN ('PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST')
    LOOP
      BEGIN
        deal_user_id := NULL;
        
        -- Zaten onay kaydı var mı?
        SELECT EXISTS (
          SELECT 1 FROM "ApprovalRequest"
          WHERE "relatedTo" = 'Deal'
            AND "relatedId" = deal_record.id::TEXT
        ) INTO approval_exists;

        IF approval_exists THEN
          skipped_count := skipped_count + 1;
          CONTINUE;
        END IF;

        -- Manager bul
        SELECT id INTO manager_id
        FROM "User"
        WHERE "companyId" = deal_record."companyId"
          AND role IN ('ADMIN', 'SUPER_ADMIN')
        LIMIT 1;

        -- Manager yoksa, otomatik onayla
        IF manager_id IS NULL THEN
          auto_approve := true;
        END IF;

        -- Threshold altındaysa otomatik onayla
        IF COALESCE(deal_record.value, 0) <= approval_threshold THEN
          auto_approve := true;
        END IF;

        -- Onay kaydı oluştur
        INSERT INTO "ApprovalRequest" (
          title,
          description,
          "relatedTo",
          "relatedId",
          "requestedBy",
          "approverIds",
          priority,
          "companyId",
          status,
          "approvedBy",
          "approvedAt",
          "createdAt"
        ) VALUES (
          'Fırsat Onayı: ' || COALESCE(deal_record.title, 'Başlıksız'),
          CASE 
            WHEN COALESCE(deal_record.value, 0) <= approval_threshold THEN 
              'Fırsat değeri ' || deal_record.value || ' TRY, onay limiti altında. Otomatik onaylandı. (Backfill)'
            ELSE 
              'Fırsat değeri ' || deal_record.value || ' TRY, onay limiti ' || approval_threshold || ' TRY aşıldı. (Backfill)'
          END,
          'Deal',
          deal_record.id::TEXT,
          deal_user_id,
          ARRAY[manager_id],
          CASE WHEN COALESCE(deal_record.value, 0) > approval_threshold THEN 'HIGH' ELSE 'NORMAL' END,
          deal_record."companyId",
          CASE WHEN auto_approve THEN 'APPROVED' ELSE 'PENDING' END,
          CASE WHEN auto_approve THEN deal_user_id ELSE NULL END,
          CASE WHEN auto_approve THEN deal_record."createdAt" ELSE NULL END,
          deal_record."createdAt"
        );

        created_count := created_count + 1;
        auto_approve := false;

      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Deal % için onay kaydı oluşturulamadı: %', deal_record.id, SQLERRM;
      END;
    END LOOP;
  END IF;

  RAISE NOTICE 'Deal backfill tamamlandı: % kayıt oluşturuldu, % kayıt atlandı', created_count, skipped_count;
END $$;

-- ============================================
-- PART 3: INVOICE BACKFILL
-- ============================================

DO $$
DECLARE
  approval_threshold DECIMAL(15,2) := 75000; -- 75K TRY
  invoice_record RECORD;
  manager_id UUID;
  auto_approve BOOLEAN := false;
  approval_exists BOOLEAN;
  invoice_amount DECIMAL(15,2) := 0;
  has_total_amount BOOLEAN;
  has_total BOOLEAN;
  has_created_by BOOLEAN;
  has_assigned_to BOOLEAN;
  invoice_user_id UUID;
  created_count INTEGER := 0;
  skipped_count INTEGER := 0;
BEGIN
  -- ApprovalRequest tablosu var mı?
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'ApprovalRequest'
  ) THEN
    RETURN;
  END IF;

  -- Invoice tablosunda totalAmount veya total kolonu var mı?
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Invoice' AND column_name = 'totalAmount'
  ) INTO has_total_amount;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Invoice' AND column_name = 'total'
  ) INTO has_total;

  -- Invoice tablosunda createdBy veya assignedTo kolonu var mı?
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Invoice' AND column_name = 'createdBy'
  ) INTO has_created_by;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Invoice' AND column_name = 'assignedTo'
  ) INTO has_assigned_to;

  IF NOT has_total_amount AND NOT has_total THEN
    RAISE NOTICE 'Invoice tablosunda total veya totalAmount kolonu bulunamadı, backfill atlandı.';
    RETURN;
  END IF;

  RAISE NOTICE 'Invoice backfill başlıyor...';

  -- Tüm Invoice'ları işle - Dinamik SELECT sorgusu
  IF has_total_amount THEN
    -- totalAmount kolonu varsa
    IF has_created_by THEN
      -- createdBy varsa
      FOR invoice_record IN 
        SELECT 
          i.id, i.title, i."invoiceNumber", i.status, i."companyId",
          i."createdBy" as user_id, i."createdAt",
          COALESCE(i."totalAmount", 0) AS amount
        FROM "Invoice" i
        WHERE i.status IN ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED')
      LOOP
        BEGIN
          invoice_user_id := invoice_record.user_id;
          
          SELECT EXISTS (
            SELECT 1 FROM "ApprovalRequest"
            WHERE "relatedTo" = 'Invoice' AND "relatedId" = invoice_record.id::TEXT
          ) INTO approval_exists;

          IF approval_exists THEN
            skipped_count := skipped_count + 1;
            CONTINUE;
          END IF;

          invoice_amount := COALESCE(invoice_record.amount, 0);

          SELECT id INTO manager_id
          FROM "User"
          WHERE "companyId" = invoice_record."companyId"
            AND role IN ('ADMIN', 'SUPER_ADMIN')
            AND (invoice_user_id IS NULL OR id != invoice_user_id)
          LIMIT 1;

          IF manager_id IS NULL THEN
            manager_id := invoice_user_id;
            auto_approve := true;
          END IF;

          IF invoice_amount <= approval_threshold THEN
            auto_approve := true;
          END IF;

          INSERT INTO "ApprovalRequest" (
            title, description, "relatedTo", "relatedId", "requestedBy", "approverIds",
            priority, "companyId", status, "approvedBy", "approvedAt", "createdAt"
          ) VALUES (
            'Fatura Onayı: ' || COALESCE(invoice_record."invoiceNumber", invoice_record.title, 'Başlıksız'),
            CASE 
              WHEN invoice_amount <= approval_threshold THEN 
                'Fatura tutarı ' || invoice_amount || ' TRY, onay limiti altında. Otomatik onaylandı. (Backfill)'
              ELSE 
                'Fatura tutarı ' || invoice_amount || ' TRY, onay limiti ' || approval_threshold || ' TRY aşıldı. (Backfill)'
            END,
            'Invoice', invoice_record.id::TEXT, invoice_user_id, ARRAY[manager_id],
            CASE WHEN invoice_amount > approval_threshold THEN 'HIGH' ELSE 'NORMAL' END,
            invoice_record."companyId",
            CASE WHEN auto_approve THEN 'APPROVED' ELSE 'PENDING' END,
            CASE WHEN auto_approve THEN invoice_user_id ELSE NULL END,
            CASE WHEN auto_approve THEN invoice_record."createdAt" ELSE NULL END,
            invoice_record."createdAt"
          );

          created_count := created_count + 1;
          auto_approve := false;

        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING 'Invoice % için onay kaydı oluşturulamadı: %', invoice_record.id, SQLERRM;
        END;
      END LOOP;
    ELSIF has_assigned_to THEN
      -- assignedTo varsa
      FOR invoice_record IN 
        SELECT 
          i.id, i.title, i."invoiceNumber", i.status, i."companyId",
          i."assignedTo" as user_id, i."createdAt",
          COALESCE(i."totalAmount", 0) AS amount
        FROM "Invoice" i
        WHERE i.status IN ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED')
      LOOP
        BEGIN
          invoice_user_id := invoice_record.user_id;
          
          SELECT EXISTS (
            SELECT 1 FROM "ApprovalRequest"
            WHERE "relatedTo" = 'Invoice' AND "relatedId" = invoice_record.id::TEXT
          ) INTO approval_exists;

          IF approval_exists THEN
            skipped_count := skipped_count + 1;
            CONTINUE;
          END IF;

          invoice_amount := COALESCE(invoice_record.amount, 0);

          SELECT id INTO manager_id
          FROM "User"
          WHERE "companyId" = invoice_record."companyId"
            AND role IN ('ADMIN', 'SUPER_ADMIN')
            AND (invoice_user_id IS NULL OR id != invoice_user_id)
          LIMIT 1;

          IF manager_id IS NULL THEN
            manager_id := invoice_user_id;
            auto_approve := true;
          END IF;

          IF invoice_amount <= approval_threshold THEN
            auto_approve := true;
          END IF;

          INSERT INTO "ApprovalRequest" (
            title, description, "relatedTo", "relatedId", "requestedBy", "approverIds",
            priority, "companyId", status, "approvedBy", "approvedAt", "createdAt"
          ) VALUES (
            'Fatura Onayı: ' || COALESCE(invoice_record."invoiceNumber", invoice_record.title, 'Başlıksız'),
            CASE 
              WHEN invoice_amount <= approval_threshold THEN 
                'Fatura tutarı ' || invoice_amount || ' TRY, onay limiti altında. Otomatik onaylandı. (Backfill)'
              ELSE 
                'Fatura tutarı ' || invoice_amount || ' TRY, onay limiti ' || approval_threshold || ' TRY aşıldı. (Backfill)'
            END,
            'Invoice', invoice_record.id::TEXT, invoice_user_id, ARRAY[manager_id],
            CASE WHEN invoice_amount > approval_threshold THEN 'HIGH' ELSE 'NORMAL' END,
            invoice_record."companyId",
            CASE WHEN auto_approve THEN 'APPROVED' ELSE 'PENDING' END,
            CASE WHEN auto_approve THEN invoice_user_id ELSE NULL END,
            CASE WHEN auto_approve THEN invoice_record."createdAt" ELSE NULL END,
            invoice_record."createdAt"
          );

          created_count := created_count + 1;
          auto_approve := false;

        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING 'Invoice % için onay kaydı oluşturulamadı: %', invoice_record.id, SQLERRM;
        END;
      END LOOP;
    ELSE
      -- Hiçbir kullanıcı kolonu yoksa, NULL kullan
      FOR invoice_record IN 
        SELECT 
          i.id, i.title, i."invoiceNumber", i.status, i."companyId", i."createdAt",
          COALESCE(i."totalAmount", 0) AS amount
        FROM "Invoice" i
        WHERE i.status IN ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED')
      LOOP
        BEGIN
          invoice_user_id := NULL;
          
          SELECT EXISTS (
            SELECT 1 FROM "ApprovalRequest"
            WHERE "relatedTo" = 'Invoice' AND "relatedId" = invoice_record.id::TEXT
          ) INTO approval_exists;

          IF approval_exists THEN
            skipped_count := skipped_count + 1;
            CONTINUE;
          END IF;

          invoice_amount := COALESCE(invoice_record.amount, 0);

          SELECT id INTO manager_id
          FROM "User"
          WHERE "companyId" = invoice_record."companyId"
            AND role IN ('ADMIN', 'SUPER_ADMIN')
          LIMIT 1;

          IF manager_id IS NULL THEN
            auto_approve := true;
          END IF;

          IF invoice_amount <= approval_threshold THEN
            auto_approve := true;
          END IF;

          INSERT INTO "ApprovalRequest" (
            title, description, "relatedTo", "relatedId", "requestedBy", "approverIds",
            priority, "companyId", status, "approvedBy", "approvedAt", "createdAt"
          ) VALUES (
            'Fatura Onayı: ' || COALESCE(invoice_record."invoiceNumber", invoice_record.title, 'Başlıksız'),
            CASE 
              WHEN invoice_amount <= approval_threshold THEN 
                'Fatura tutarı ' || invoice_amount || ' TRY, onay limiti altında. Otomatik onaylandı. (Backfill)'
              ELSE 
                'Fatura tutarı ' || invoice_amount || ' TRY, onay limiti ' || approval_threshold || ' TRY aşıldı. (Backfill)'
            END,
            'Invoice', invoice_record.id::TEXT, invoice_user_id, ARRAY[manager_id],
            CASE WHEN invoice_amount > approval_threshold THEN 'HIGH' ELSE 'NORMAL' END,
            invoice_record."companyId",
            CASE WHEN auto_approve THEN 'APPROVED' ELSE 'PENDING' END,
            CASE WHEN auto_approve THEN invoice_user_id ELSE NULL END,
            CASE WHEN auto_approve THEN invoice_record."createdAt" ELSE NULL END,
            invoice_record."createdAt"
          );

          created_count := created_count + 1;
          auto_approve := false;

        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING 'Invoice % için onay kaydı oluşturulamadı: %', invoice_record.id, SQLERRM;
        END;
      END LOOP;
    END IF;
  ELSIF has_total THEN
    -- total kolonu varsa - aynı mantık
    IF has_created_by THEN
      FOR invoice_record IN 
        SELECT 
          i.id, i.title, i."invoiceNumber", i.status, i."companyId",
          i."createdBy" as user_id, i."createdAt",
          COALESCE(i.total, 0) AS amount
        FROM "Invoice" i
        WHERE i.status IN ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED')
      LOOP
        BEGIN
          invoice_user_id := invoice_record.user_id;
          
          SELECT EXISTS (
            SELECT 1 FROM "ApprovalRequest"
            WHERE "relatedTo" = 'Invoice' AND "relatedId" = invoice_record.id::TEXT
          ) INTO approval_exists;

          IF approval_exists THEN
            skipped_count := skipped_count + 1;
            CONTINUE;
          END IF;

          invoice_amount := COALESCE(invoice_record.amount, 0);

          SELECT id INTO manager_id
          FROM "User"
          WHERE "companyId" = invoice_record."companyId"
            AND role IN ('ADMIN', 'SUPER_ADMIN')
            AND (invoice_user_id IS NULL OR id != invoice_user_id)
          LIMIT 1;

          IF manager_id IS NULL THEN
            manager_id := invoice_user_id;
            auto_approve := true;
          END IF;

          IF invoice_amount <= approval_threshold THEN
            auto_approve := true;
          END IF;

          INSERT INTO "ApprovalRequest" (
            title, description, "relatedTo", "relatedId", "requestedBy", "approverIds",
            priority, "companyId", status, "approvedBy", "approvedAt", "createdAt"
          ) VALUES (
            'Fatura Onayı: ' || COALESCE(invoice_record."invoiceNumber", invoice_record.title, 'Başlıksız'),
            CASE 
              WHEN invoice_amount <= approval_threshold THEN 
                'Fatura tutarı ' || invoice_amount || ' TRY, onay limiti altında. Otomatik onaylandı. (Backfill)'
              ELSE 
                'Fatura tutarı ' || invoice_amount || ' TRY, onay limiti ' || approval_threshold || ' TRY aşıldı. (Backfill)'
            END,
            'Invoice', invoice_record.id::TEXT, invoice_user_id, ARRAY[manager_id],
            CASE WHEN invoice_amount > approval_threshold THEN 'HIGH' ELSE 'NORMAL' END,
            invoice_record."companyId",
            CASE WHEN auto_approve THEN 'APPROVED' ELSE 'PENDING' END,
            CASE WHEN auto_approve THEN invoice_user_id ELSE NULL END,
            CASE WHEN auto_approve THEN invoice_record."createdAt" ELSE NULL END,
            invoice_record."createdAt"
          );

          created_count := created_count + 1;
          auto_approve := false;

        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING 'Invoice % için onay kaydı oluşturulamadı: %', invoice_record.id, SQLERRM;
        END;
      END LOOP;
    ELSIF has_assigned_to THEN
      FOR invoice_record IN 
        SELECT 
          i.id, i.title, i."invoiceNumber", i.status, i."companyId",
          i."assignedTo" as user_id, i."createdAt",
          COALESCE(i.total, 0) AS amount
        FROM "Invoice" i
        WHERE i.status IN ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED')
      LOOP
        BEGIN
          invoice_user_id := invoice_record.user_id;
          
          SELECT EXISTS (
            SELECT 1 FROM "ApprovalRequest"
            WHERE "relatedTo" = 'Invoice' AND "relatedId" = invoice_record.id::TEXT
          ) INTO approval_exists;

          IF approval_exists THEN
            skipped_count := skipped_count + 1;
            CONTINUE;
          END IF;

          invoice_amount := COALESCE(invoice_record.amount, 0);

          SELECT id INTO manager_id
          FROM "User"
          WHERE "companyId" = invoice_record."companyId"
            AND role IN ('ADMIN', 'SUPER_ADMIN')
            AND (invoice_user_id IS NULL OR id != invoice_user_id)
          LIMIT 1;

          IF manager_id IS NULL THEN
            manager_id := invoice_user_id;
            auto_approve := true;
          END IF;

          IF invoice_amount <= approval_threshold THEN
            auto_approve := true;
          END IF;

          INSERT INTO "ApprovalRequest" (
            title, description, "relatedTo", "relatedId", "requestedBy", "approverIds",
            priority, "companyId", status, "approvedBy", "approvedAt", "createdAt"
          ) VALUES (
            'Fatura Onayı: ' || COALESCE(invoice_record."invoiceNumber", invoice_record.title, 'Başlıksız'),
            CASE 
              WHEN invoice_amount <= approval_threshold THEN 
                'Fatura tutarı ' || invoice_amount || ' TRY, onay limiti altında. Otomatik onaylandı. (Backfill)'
              ELSE 
                'Fatura tutarı ' || invoice_amount || ' TRY, onay limiti ' || approval_threshold || ' TRY aşıldı. (Backfill)'
            END,
            'Invoice', invoice_record.id::TEXT, invoice_user_id, ARRAY[manager_id],
            CASE WHEN invoice_amount > approval_threshold THEN 'HIGH' ELSE 'NORMAL' END,
            invoice_record."companyId",
            CASE WHEN auto_approve THEN 'APPROVED' ELSE 'PENDING' END,
            CASE WHEN auto_approve THEN invoice_user_id ELSE NULL END,
            CASE WHEN auto_approve THEN invoice_record."createdAt" ELSE NULL END,
            invoice_record."createdAt"
          );

          created_count := created_count + 1;
          auto_approve := false;

        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING 'Invoice % için onay kaydı oluşturulamadı: %', invoice_record.id, SQLERRM;
        END;
      END LOOP;
    ELSE
      FOR invoice_record IN 
        SELECT 
          i.id, i.title, i."invoiceNumber", i.status, i."companyId", i."createdAt",
          COALESCE(i.total, 0) AS amount
        FROM "Invoice" i
        WHERE i.status IN ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED')
      LOOP
        BEGIN
          invoice_user_id := NULL;
          
          SELECT EXISTS (
            SELECT 1 FROM "ApprovalRequest"
            WHERE "relatedTo" = 'Invoice' AND "relatedId" = invoice_record.id::TEXT
          ) INTO approval_exists;

          IF approval_exists THEN
            skipped_count := skipped_count + 1;
            CONTINUE;
          END IF;

          invoice_amount := COALESCE(invoice_record.amount, 0);

          SELECT id INTO manager_id
          FROM "User"
          WHERE "companyId" = invoice_record."companyId"
            AND role IN ('ADMIN', 'SUPER_ADMIN')
          LIMIT 1;

          IF manager_id IS NULL THEN
            auto_approve := true;
          END IF;

          IF invoice_amount <= approval_threshold THEN
            auto_approve := true;
          END IF;

          INSERT INTO "ApprovalRequest" (
            title, description, "relatedTo", "relatedId", "requestedBy", "approverIds",
            priority, "companyId", status, "approvedBy", "approvedAt", "createdAt"
          ) VALUES (
            'Fatura Onayı: ' || COALESCE(invoice_record."invoiceNumber", invoice_record.title, 'Başlıksız'),
            CASE 
              WHEN invoice_amount <= approval_threshold THEN 
                'Fatura tutarı ' || invoice_amount || ' TRY, onay limiti altında. Otomatik onaylandı. (Backfill)'
              ELSE 
                'Fatura tutarı ' || invoice_amount || ' TRY, onay limiti ' || approval_threshold || ' TRY aşıldı. (Backfill)'
            END,
            'Invoice', invoice_record.id::TEXT, invoice_user_id, ARRAY[manager_id],
            CASE WHEN invoice_amount > approval_threshold THEN 'HIGH' ELSE 'NORMAL' END,
            invoice_record."companyId",
            CASE WHEN auto_approve THEN 'APPROVED' ELSE 'PENDING' END,
            CASE WHEN auto_approve THEN invoice_user_id ELSE NULL END,
            CASE WHEN auto_approve THEN invoice_record."createdAt" ELSE NULL END,
            invoice_record."createdAt"
          );

          created_count := created_count + 1;
          auto_approve := false;

        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING 'Invoice % için onay kaydı oluşturulamadı: %', invoice_record.id, SQLERRM;
        END;
      END LOOP;
    END IF;
  END IF;

  RAISE NOTICE 'Invoice backfill tamamlandı: % kayıt oluşturuldu, % kayıt atlandı', created_count, skipped_count;
END $$;

-- ============================================
-- PART 4: CONTRACT BACKFILL
-- ============================================

DO $$
DECLARE
  approval_threshold DECIMAL(15,2) := 50000; -- 50K TRY
  contract_record RECORD;
  manager_id UUID;
  auto_approve BOOLEAN := false;
  approval_exists BOOLEAN;
  has_created_by BOOLEAN;
  has_assigned_to BOOLEAN;
  contract_user_id UUID;
  created_count INTEGER := 0;
  skipped_count INTEGER := 0;
BEGIN
  -- ApprovalRequest tablosu var mı?
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'ApprovalRequest'
  ) THEN
    RETURN;
  END IF;

  -- Contract tablosu var mı?
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'Contract'
  ) THEN
    RAISE NOTICE 'Contract tablosu bulunamadı, backfill atlandı.';
    RETURN;
  END IF;

  RAISE NOTICE 'Contract backfill başlıyor...';

  -- Contract tablosunda createdBy veya assignedTo kolonu var mı?
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Contract' AND column_name = 'createdBy'
  ) INTO has_created_by;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Contract' AND column_name = 'assignedTo'
  ) INTO has_assigned_to;

  -- Tüm Contract'ları işle - Dinamik SELECT sorgusu
  IF has_created_by THEN
    -- createdBy kolonu varsa
    FOR contract_record IN 
      SELECT 
        c.id, c.title, c."contractNumber", c.status, c.value,
        c."companyId", c."createdBy" as user_id, c."createdAt"
      FROM "Contract" c
      WHERE c.status IN ('DRAFT', 'ACTIVE', 'EXPIRED', 'CANCELLED')
    LOOP
      BEGIN
        contract_user_id := contract_record.user_id;
        
        SELECT EXISTS (
          SELECT 1 FROM "ApprovalRequest"
          WHERE "relatedTo" = 'Contract' AND "relatedId" = contract_record.id::TEXT
        ) INTO approval_exists;

        IF approval_exists THEN
          skipped_count := skipped_count + 1;
          CONTINUE;
        END IF;

        SELECT id INTO manager_id
        FROM "User"
        WHERE "companyId" = contract_record."companyId"
          AND role IN ('ADMIN', 'SUPER_ADMIN')
          AND (contract_user_id IS NULL OR id != contract_user_id)
        LIMIT 1;

        IF manager_id IS NULL THEN
          manager_id := contract_user_id;
          auto_approve := true;
        END IF;

        IF COALESCE(contract_record.value, 0) <= approval_threshold THEN
          auto_approve := true;
        END IF;

        INSERT INTO "ApprovalRequest" (
          title, description, "relatedTo", "relatedId", "requestedBy", "approverIds",
          priority, "companyId", status, "approvedBy", "approvedAt", "createdAt"
        ) VALUES (
          'Sözleşme Onayı: ' || COALESCE(contract_record."contractNumber", contract_record.title, 'Başlıksız'),
          CASE 
            WHEN COALESCE(contract_record.value, 0) <= approval_threshold THEN 
              'Sözleşme değeri ' || contract_record.value || ' TRY, onay limiti altında. Otomatik onaylandı. (Backfill)'
            ELSE 
              'Sözleşme değeri ' || contract_record.value || ' TRY, onay limiti ' || approval_threshold || ' TRY aşıldı. (Backfill)'
          END,
          'Contract', contract_record.id::TEXT, contract_user_id, ARRAY[manager_id],
          CASE WHEN COALESCE(contract_record.value, 0) > approval_threshold THEN 'HIGH' ELSE 'NORMAL' END,
          contract_record."companyId",
          CASE WHEN auto_approve THEN 'APPROVED' ELSE 'PENDING' END,
          CASE WHEN auto_approve THEN contract_user_id ELSE NULL END,
          CASE WHEN auto_approve THEN contract_record."createdAt" ELSE NULL END,
          contract_record."createdAt"
        );

        created_count := created_count + 1;
        auto_approve := false;

      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Contract % için onay kaydı oluşturulamadı: %', contract_record.id, SQLERRM;
      END;
    END LOOP;
  ELSIF has_assigned_to THEN
    -- assignedTo kolonu varsa
    FOR contract_record IN 
      SELECT 
        c.id, c.title, c."contractNumber", c.status, c.value,
        c."companyId", c."assignedTo" as user_id, c."createdAt"
      FROM "Contract" c
      WHERE c.status IN ('DRAFT', 'ACTIVE', 'EXPIRED', 'CANCELLED')
    LOOP
      BEGIN
        contract_user_id := contract_record.user_id;
        
        SELECT EXISTS (
          SELECT 1 FROM "ApprovalRequest"
          WHERE "relatedTo" = 'Contract' AND "relatedId" = contract_record.id::TEXT
        ) INTO approval_exists;

        IF approval_exists THEN
          skipped_count := skipped_count + 1;
          CONTINUE;
        END IF;

        SELECT id INTO manager_id
        FROM "User"
        WHERE "companyId" = contract_record."companyId"
          AND role IN ('ADMIN', 'SUPER_ADMIN')
          AND (contract_user_id IS NULL OR id != contract_user_id)
        LIMIT 1;

        IF manager_id IS NULL THEN
          manager_id := contract_user_id;
          auto_approve := true;
        END IF;

        IF COALESCE(contract_record.value, 0) <= approval_threshold THEN
          auto_approve := true;
        END IF;

        INSERT INTO "ApprovalRequest" (
          title, description, "relatedTo", "relatedId", "requestedBy", "approverIds",
          priority, "companyId", status, "approvedBy", "approvedAt", "createdAt"
        ) VALUES (
          'Sözleşme Onayı: ' || COALESCE(contract_record."contractNumber", contract_record.title, 'Başlıksız'),
          CASE 
            WHEN COALESCE(contract_record.value, 0) <= approval_threshold THEN 
              'Sözleşme değeri ' || contract_record.value || ' TRY, onay limiti altında. Otomatik onaylandı. (Backfill)'
            ELSE 
              'Sözleşme değeri ' || contract_record.value || ' TRY, onay limiti ' || approval_threshold || ' TRY aşıldı. (Backfill)'
          END,
          'Contract', contract_record.id::TEXT, contract_user_id, ARRAY[manager_id],
          CASE WHEN COALESCE(contract_record.value, 0) > approval_threshold THEN 'HIGH' ELSE 'NORMAL' END,
          contract_record."companyId",
          CASE WHEN auto_approve THEN 'APPROVED' ELSE 'PENDING' END,
          CASE WHEN auto_approve THEN contract_user_id ELSE NULL END,
          CASE WHEN auto_approve THEN contract_record."createdAt" ELSE NULL END,
          contract_record."createdAt"
        );

        created_count := created_count + 1;
        auto_approve := false;

      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Contract % için onay kaydı oluşturulamadı: %', contract_record.id, SQLERRM;
      END;
    END LOOP;
  ELSE
    -- Hiçbir kullanıcı kolonu yoksa, NULL kullan
    FOR contract_record IN 
      SELECT 
        c.id, c.title, c."contractNumber", c.status, c.value,
        c."companyId", c."createdAt"
      FROM "Contract" c
      WHERE c.status IN ('DRAFT', 'ACTIVE', 'EXPIRED', 'CANCELLED')
    LOOP
      BEGIN
        contract_user_id := NULL;
        
        SELECT EXISTS (
          SELECT 1 FROM "ApprovalRequest"
          WHERE "relatedTo" = 'Contract' AND "relatedId" = contract_record.id::TEXT
        ) INTO approval_exists;

        IF approval_exists THEN
          skipped_count := skipped_count + 1;
          CONTINUE;
        END IF;

        SELECT id INTO manager_id
        FROM "User"
        WHERE "companyId" = contract_record."companyId"
          AND role IN ('ADMIN', 'SUPER_ADMIN')
        LIMIT 1;

        IF manager_id IS NULL THEN
          auto_approve := true;
        END IF;

        IF COALESCE(contract_record.value, 0) <= approval_threshold THEN
          auto_approve := true;
        END IF;

        INSERT INTO "ApprovalRequest" (
          title, description, "relatedTo", "relatedId", "requestedBy", "approverIds",
          priority, "companyId", status, "approvedBy", "approvedAt", "createdAt"
        ) VALUES (
          'Sözleşme Onayı: ' || COALESCE(contract_record."contractNumber", contract_record.title, 'Başlıksız'),
          CASE 
            WHEN COALESCE(contract_record.value, 0) <= approval_threshold THEN 
              'Sözleşme değeri ' || contract_record.value || ' TRY, onay limiti altında. Otomatik onaylandı. (Backfill)'
            ELSE 
              'Sözleşme değeri ' || contract_record.value || ' TRY, onay limiti ' || approval_threshold || ' TRY aşıldı. (Backfill)'
          END,
          'Contract', contract_record.id::TEXT, contract_user_id, ARRAY[manager_id],
          CASE WHEN COALESCE(contract_record.value, 0) > approval_threshold THEN 'HIGH' ELSE 'NORMAL' END,
          contract_record."companyId",
          CASE WHEN auto_approve THEN 'APPROVED' ELSE 'PENDING' END,
          CASE WHEN auto_approve THEN contract_user_id ELSE NULL END,
          CASE WHEN auto_approve THEN contract_record."createdAt" ELSE NULL END,
          contract_record."createdAt"
        );

        created_count := created_count + 1;
        auto_approve := false;

      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Contract % için onay kaydı oluşturulamadı: %', contract_record.id, SQLERRM;
      END;
    END LOOP;
  END IF;

  RAISE NOTICE 'Contract backfill tamamlandı: % kayıt oluşturuldu, % kayıt atlandı', created_count, skipped_count;
END $$;

-- ============================================
-- Migration tamamlandı!
-- ============================================

COMMENT ON FUNCTION check_quote_needs_approval IS 'Her Quote için onay kaydı oluşturur. Threshold altındakileri otomatik onaylar.';
COMMENT ON FUNCTION check_deal_needs_approval IS 'Her Deal için onay kaydı oluşturur. Threshold altındakileri otomatik onaylar.';
COMMENT ON FUNCTION check_invoice_needs_approval IS 'Her Invoice için onay kaydı oluşturur. Threshold altındakileri otomatik onaylar.';
COMMENT ON FUNCTION check_contract_needs_approval IS 'Her Contract için onay kaydı oluşturur. Threshold altındakileri otomatik onaylar.';

