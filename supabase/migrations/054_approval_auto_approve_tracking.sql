-- ============================================
-- 054_approval_auto_approve_tracking.sql
-- Her İşlem İçin Onay Kaydı + Otomatik Onaylama
-- ============================================
-- Bu dosya şunları yapar:
-- 1. Her Quote/Deal/Invoice/Contract için onay kaydı oluşturur
-- 2. Threshold altındakileri otomatik onaylar (APPROVED)
-- 3. Threshold üstündekileri PENDING bırakır (manuel onay)
-- 4. Tüm işlemler takip edilebilir
-- ============================================

-- ============================================
-- PART 1: QUOTE - HER İŞLEM İÇİN KAYIT + OTOMATİK ONAY
-- ============================================

CREATE OR REPLACE FUNCTION check_quote_needs_approval()
RETURNS TRIGGER AS $$
DECLARE
  approval_threshold DECIMAL(15,2) := 50000; -- 50K TRY
  manager_id UUID;
  approval_exists BOOLEAN;
  approval_id UUID;
  auto_approve BOOLEAN := false;
  quote_amount DECIMAL(15,2) := 0;
  has_total_amount BOOLEAN;
  has_total BOOLEAN;
BEGIN
  -- ApprovalRequest tablosu var mı?
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'ApprovalRequest'
  ) THEN
    RETURN NEW;
  END IF;
  
  -- Sadece DRAFT durumunda çalış
  IF NEW.status = 'DRAFT' THEN
    
    BEGIN
      -- Quote tutarını al (total veya totalAmount kolonu)
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Quote' AND column_name = 'totalAmount'
      ) INTO has_total_amount;
      
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Quote' AND column_name = 'total'
      ) INTO has_total;
      
      -- Önce totalAmount kontrol et, yoksa total kontrol et
      IF has_total_amount THEN
        quote_amount := COALESCE(NEW."totalAmount", 0);
      ELSIF has_total THEN
        quote_amount := COALESCE(NEW.total, 0);
      END IF;
      
      -- Kullanıcının yöneticisini bul (ADMIN/SUPER_ADMIN)
      SELECT id INTO manager_id
      FROM "User"
      WHERE "companyId" = NEW."companyId"
        AND role IN ('ADMIN', 'SUPER_ADMIN')
        AND id != NEW."createdBy" -- Kendisi olmasın
      LIMIT 1;
      
      -- Manager yoksa, kendisini onaylayıcı olarak kullan (otomatik onay için)
      IF manager_id IS NULL THEN
        manager_id := NEW."createdBy";
        auto_approve := true; -- Manager yoksa otomatik onayla
      END IF;
      
      -- Threshold altındaysa otomatik onayla
      IF quote_amount <= approval_threshold THEN
        auto_approve := true;
      END IF;
      
      -- Zaten onay talebi var mı?
      SELECT EXISTS (
        SELECT 1 FROM "ApprovalRequest"
        WHERE "relatedTo" = 'Quote'
          AND "relatedId" = NEW.id::TEXT
          AND status IN ('PENDING', 'APPROVED')
      ) INTO approval_exists;
      
      IF NOT approval_exists THEN
        -- Yeni onay talebi oluştur
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
          "approvedAt"
        ) VALUES (
          'Teklif Onayı: ' || COALESCE(NEW.title, 'Başlıksız'),
          CASE 
            WHEN quote_amount <= approval_threshold THEN 
              'Toplam tutar ' || quote_amount || ' TRY, onay limiti altında. Otomatik onaylandı.'
            ELSE 
              'Toplam tutar ' || quote_amount || ' TRY, onay limiti ' || approval_threshold || ' TRY aşıldı.'
          END,
          'Quote',
          NEW.id::TEXT,
          NEW."createdBy",
          ARRAY[manager_id],
          CASE WHEN quote_amount > approval_threshold THEN 'HIGH' ELSE 'NORMAL' END,
          NEW."companyId",
          CASE WHEN auto_approve THEN 'APPROVED' ELSE 'PENDING' END,
          CASE WHEN auto_approve THEN NEW."createdBy" ELSE NULL END,
          CASE WHEN auto_approve THEN NOW() ELSE NULL END
        )
        RETURNING id INTO approval_id;
        
        -- Otomatik onaylandıysa, Quote'u da güncelle
        IF auto_approve THEN
          UPDATE "Quote" 
          SET status = 'ACCEPTED'
          WHERE id = NEW.id;
          
          RAISE NOTICE 'Approval request created and auto-approved for quote %', NEW.id;
        ELSE
          RAISE NOTICE 'Approval request created (pending) for quote %', NEW.id;
        END IF;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not create approval request for quote: %', SQLERRM;
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS quote_approval_check ON "Quote";

-- Trigger oluştur - mevcut kolona göre
DO $$
BEGIN
  -- totalAmount kolonu varsa onu kullan
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Quote' AND column_name = 'totalAmount'
  ) THEN
    CREATE TRIGGER quote_approval_check
      AFTER INSERT OR UPDATE OF "totalAmount", status
      ON "Quote"
      FOR EACH ROW
      EXECUTE FUNCTION check_quote_needs_approval();
  -- total kolonu varsa onu kullan
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Quote' AND column_name = 'total'
  ) THEN
    CREATE TRIGGER quote_approval_check
      AFTER INSERT OR UPDATE OF total, status
      ON "Quote"
      FOR EACH ROW
      EXECUTE FUNCTION check_quote_needs_approval();
  END IF;
END $$;

COMMENT ON FUNCTION check_quote_needs_approval IS 'Her Quote için onay kaydı oluşturur. Threshold altındakileri otomatik onaylar.';

-- ============================================
-- PART 2: DEAL - HER İŞLEM İÇİN KAYIT + OTOMATİK ONAY
-- ============================================

CREATE OR REPLACE FUNCTION check_deal_needs_approval()
RETURNS TRIGGER AS $$
DECLARE
  approval_threshold DECIMAL(15,2) := 100000; -- 100K TRY
  manager_id UUID;
  approval_exists BOOLEAN;
  approval_id UUID;
  auto_approve BOOLEAN := false;
BEGIN
  -- ApprovalRequest tablosu var mı?
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'ApprovalRequest'
  ) THEN
    RETURN NEW;
  END IF;
  
  -- Sadece NEGOTIATION durumunda çalış
  IF NEW.stage = 'NEGOTIATION' THEN
    
    BEGIN
      -- Kullanıcının yöneticisini bul (ADMIN/SUPER_ADMIN)
      SELECT id INTO manager_id
      FROM "User"
      WHERE "companyId" = NEW."companyId"
        AND role IN ('ADMIN', 'SUPER_ADMIN')
        AND id != NEW."createdBy" -- Kendisi olmasın
      LIMIT 1;
      
      -- Manager yoksa, kendisini onaylayıcı olarak kullan (otomatik onay için)
      IF manager_id IS NULL THEN
        manager_id := NEW."createdBy";
        auto_approve := true; -- Manager yoksa otomatik onayla
      END IF;
      
      -- Threshold altındaysa otomatik onayla
      IF NEW.value <= approval_threshold THEN
        auto_approve := true;
      END IF;
      
      -- Zaten onay talebi var mı?
      SELECT EXISTS (
        SELECT 1 FROM "ApprovalRequest"
        WHERE "relatedTo" = 'Deal'
          AND "relatedId" = NEW.id::TEXT
          AND status IN ('PENDING', 'APPROVED')
      ) INTO approval_exists;
      
      IF NOT approval_exists THEN
        -- Yeni onay talebi oluştur
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
          "approvedAt"
        ) VALUES (
          'Fırsat Onayı: ' || COALESCE(NEW.title, 'Başlıksız'),
          CASE 
            WHEN NEW.value <= approval_threshold THEN 
              'Fırsat değeri ' || NEW.value || ' TRY, onay limiti altında. Otomatik onaylandı.'
            ELSE 
              'Fırsat değeri ' || NEW.value || ' TRY, onay limiti ' || approval_threshold || ' TRY aşıldı.'
          END,
          'Deal',
          NEW.id::TEXT,
          NEW."createdBy",
          ARRAY[manager_id],
          CASE WHEN NEW.value > approval_threshold THEN 'HIGH' ELSE 'NORMAL' END,
          NEW."companyId",
          CASE WHEN auto_approve THEN 'APPROVED' ELSE 'PENDING' END,
          CASE WHEN auto_approve THEN NEW."createdBy" ELSE NULL END,
          CASE WHEN auto_approve THEN NOW() ELSE NULL END
        )
        RETURNING id INTO approval_id;
        
        -- Otomatik onaylandıysa, Deal'i de güncelle
        IF auto_approve THEN
          -- Deal zaten NEGOTIATION durumunda, değişiklik yapmaya gerek yok
          RAISE NOTICE 'Approval request created and auto-approved for deal %', NEW.id;
        ELSE
          RAISE NOTICE 'Approval request created (pending) for deal %', NEW.id;
        END IF;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not create approval request for deal: %', SQLERRM;
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS deal_approval_check ON "Deal";
CREATE TRIGGER deal_approval_check
  AFTER INSERT OR UPDATE OF value, stage
  ON "Deal"
  FOR EACH ROW
  EXECUTE FUNCTION check_deal_needs_approval();

COMMENT ON FUNCTION check_deal_needs_approval IS 'Her Deal için onay kaydı oluşturur. Threshold altındakileri otomatik onaylar.';

-- ============================================
-- PART 3: INVOICE - HER İŞLEM İÇİN KAYIT + OTOMATİK ONAY
-- ============================================

CREATE OR REPLACE FUNCTION check_invoice_needs_approval()
RETURNS TRIGGER AS $$
DECLARE
  approval_threshold DECIMAL(15,2) := 75000; -- 75K TRY
  manager_id UUID;
  approval_exists BOOLEAN;
  approval_id UUID;
  auto_approve BOOLEAN := false;
BEGIN
  -- ApprovalRequest tablosu var mı?
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'ApprovalRequest'
  ) THEN
    RETURN NEW;
  END IF;
  
  -- Sadece DRAFT durumunda çalış
  IF NEW.status = 'DRAFT' THEN
    
    BEGIN
      -- Kullanıcının yöneticisini bul (ADMIN/SUPER_ADMIN)
      SELECT id INTO manager_id
      FROM "User"
      WHERE "companyId" = NEW."companyId"
        AND role IN ('ADMIN', 'SUPER_ADMIN')
        AND id != NEW."createdBy" -- Kendisi olmasın
      LIMIT 1;
      
      -- Manager yoksa, kendisini onaylayıcı olarak kullan (otomatik onay için)
      IF manager_id IS NULL THEN
        manager_id := NEW."createdBy";
        auto_approve := true; -- Manager yoksa otomatik onayla
      END IF;
      
      -- Threshold altındaysa otomatik onayla
      IF NEW."totalAmount" <= approval_threshold THEN
        auto_approve := true;
      END IF;
      
      -- Zaten onay talebi var mı?
      SELECT EXISTS (
        SELECT 1 FROM "ApprovalRequest"
        WHERE "relatedTo" = 'Invoice'
          AND "relatedId" = NEW.id::TEXT
          AND status IN ('PENDING', 'APPROVED')
      ) INTO approval_exists;
      
      IF NOT approval_exists THEN
        -- Yeni onay talebi oluştur
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
          "approvedAt"
        ) VALUES (
          'Fatura Onayı: ' || COALESCE(NEW."invoiceNumber", 'Başlıksız'),
          CASE 
            WHEN NEW."totalAmount" <= approval_threshold THEN 
              'Fatura tutarı ' || NEW."totalAmount" || ' TRY, onay limiti altında. Otomatik onaylandı.'
            ELSE 
              'Fatura tutarı ' || NEW."totalAmount" || ' TRY, onay limiti ' || approval_threshold || ' TRY aşıldı.'
          END,
          'Invoice',
          NEW.id::TEXT,
          NEW."createdBy",
          ARRAY[manager_id],
          CASE WHEN NEW."totalAmount" > approval_threshold THEN 'HIGH' ELSE 'NORMAL' END,
          NEW."companyId",
          CASE WHEN auto_approve THEN 'APPROVED' ELSE 'PENDING' END,
          CASE WHEN auto_approve THEN NEW."createdBy" ELSE NULL END,
          CASE WHEN auto_approve THEN NOW() ELSE NULL END
        )
        RETURNING id INTO approval_id;
        
        -- Otomatik onaylandıysa, Invoice'u da güncelle
        IF auto_approve THEN
          UPDATE "Invoice" 
          SET status = 'SENT'
          WHERE id = NEW.id;
          
          RAISE NOTICE 'Approval request created and auto-approved for invoice %', NEW.id;
        ELSE
          RAISE NOTICE 'Approval request created (pending) for invoice %', NEW.id;
        END IF;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not create approval request for invoice: %', SQLERRM;
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS invoice_approval_check ON "Invoice";

-- Trigger'ı dinamik olarak oluştur (sadece var olan kolonlar için)
DO $$
DECLARE
  has_total_amount BOOLEAN;
  has_total BOOLEAN;
  trigger_columns TEXT := 'status'; -- status her zaman var
BEGIN
  -- Invoice tablosunda totalAmount veya total kolonu var mı?
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'Invoice' 
      AND column_name = 'totalAmount'
  ) INTO has_total_amount;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'Invoice' 
      AND column_name = 'total'
  ) INTO has_total;
  
  -- Var olan kolonları trigger'a ekle
  IF has_total_amount THEN
    trigger_columns := trigger_columns || ', "totalAmount"';
  ELSIF has_total THEN
    trigger_columns := trigger_columns || ', total';
  END IF;
  
  -- Yeni trigger'ı dinamik olarak oluştur
  EXECUTE format('
    CREATE TRIGGER invoice_approval_check
      AFTER INSERT OR UPDATE OF %s
      ON "Invoice"
      FOR EACH ROW
      EXECUTE FUNCTION check_invoice_needs_approval();
  ', trigger_columns);
  
  RAISE NOTICE 'Invoice trigger oluşturuldu: UPDATE OF %', trigger_columns;
END $$;

COMMENT ON FUNCTION check_invoice_needs_approval IS 'Her Invoice için onay kaydı oluşturur. Threshold altındakileri otomatik onaylar.';

-- ============================================
-- PART 4: CONTRACT - HER İŞLEM İÇİN KAYIT + OTOMATİK ONAY
-- ============================================

CREATE OR REPLACE FUNCTION check_contract_needs_approval()
RETURNS TRIGGER AS $$
DECLARE
  approval_threshold DECIMAL(15,2) := 50000; -- 50K TRY
  manager_id UUID;
  approval_exists BOOLEAN;
  approval_id UUID;
  auto_approve BOOLEAN := false;
BEGIN
  -- ApprovalRequest tablosu var mı?
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'ApprovalRequest'
  ) THEN
    RETURN NEW;
  END IF;
  
  -- Sadece DRAFT durumunda çalış
  IF NEW.status = 'DRAFT' THEN
    
    BEGIN
      -- Kullanıcının yöneticisini bul (ADMIN/SUPER_ADMIN)
      SELECT id INTO manager_id
      FROM "User"
      WHERE "companyId" = NEW."companyId"
        AND role IN ('ADMIN', 'SUPER_ADMIN')
        AND id != NEW."createdBy" -- Kendisi olmasın
      LIMIT 1;
      
      -- Manager yoksa, kendisini onaylayıcı olarak kullan (otomatik onay için)
      IF manager_id IS NULL THEN
        manager_id := NEW."createdBy";
        auto_approve := true; -- Manager yoksa otomatik onayla
      END IF;
      
      -- Threshold altındaysa otomatik onayla
      IF NEW.value <= approval_threshold THEN
        auto_approve := true;
      END IF;
      
      -- Zaten onay talebi var mı?
      SELECT EXISTS (
        SELECT 1 FROM "ApprovalRequest"
        WHERE "relatedTo" = 'Contract'
          AND "relatedId" = NEW.id::TEXT
          AND status IN ('PENDING', 'APPROVED')
      ) INTO approval_exists;
      
      IF NOT approval_exists THEN
        -- Yeni onay talebi oluştur
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
          "approvedAt"
        ) VALUES (
          'Sözleşme Onayı: ' || COALESCE(NEW.title, 'Başlıksız'),
          CASE 
            WHEN NEW.value <= approval_threshold THEN 
              'Sözleşme değeri ' || NEW.value || ' TRY, onay limiti altında. Otomatik onaylandı.'
            ELSE 
              'Sözleşme değeri ' || NEW.value || ' TRY, onay limiti ' || approval_threshold || ' TRY aşıldı.'
          END,
          'Contract',
          NEW.id::TEXT,
          NEW."createdBy",
          ARRAY[manager_id],
          CASE WHEN NEW.value > approval_threshold THEN 'HIGH' ELSE 'NORMAL' END,
          NEW."companyId",
          CASE WHEN auto_approve THEN 'APPROVED' ELSE 'PENDING' END,
          CASE WHEN auto_approve THEN NEW."createdBy" ELSE NULL END,
          CASE WHEN auto_approve THEN NOW() ELSE NULL END
        )
        RETURNING id INTO approval_id;
        
        -- Otomatik onaylandıysa, Contract'ı da güncelle
        IF auto_approve THEN
          UPDATE "Contract" 
          SET status = 'ACTIVE'
          WHERE id = NEW.id;
          
          RAISE NOTICE 'Approval request created and auto-approved for contract %', NEW.id;
        ELSE
          RAISE NOTICE 'Approval request created (pending) for contract %', NEW.id;
        END IF;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not create approval request for contract: %', SQLERRM;
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS contract_approval_check ON "Contract";
CREATE TRIGGER contract_approval_check
  AFTER INSERT OR UPDATE OF value, status
  ON "Contract"
  FOR EACH ROW
  EXECUTE FUNCTION check_contract_needs_approval();

COMMENT ON FUNCTION check_contract_needs_approval IS 'Her Contract için onay kaydı oluşturur. Threshold altındakileri otomatik onaylar.';

-- ============================================
-- Migration tamamlandı!
-- ============================================

COMMENT ON FUNCTION check_quote_needs_approval IS 'Her Quote için onay kaydı oluşturur. Threshold altındakileri otomatik onaylar.';
COMMENT ON FUNCTION check_deal_needs_approval IS 'Her Deal için onay kaydı oluşturur. Threshold altındakileri otomatik onaylar.';
COMMENT ON FUNCTION check_invoice_needs_approval IS 'Her Invoice için onay kaydı oluşturur. Threshold altındakileri otomatik onaylar.';
COMMENT ON FUNCTION check_contract_needs_approval IS 'Her Contract için onay kaydı oluşturur. Threshold altındakileri otomatik onaylar.';

