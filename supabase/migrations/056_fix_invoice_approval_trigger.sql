-- ============================================
-- 056_fix_invoice_approval_trigger.sql
-- Invoice Onay Trigger'ını Düzelt
-- ============================================
-- Sorun: Invoice tablosunda createdBy kolonu yok, assignedTo var
-- Çözüm: Trigger'ı dinamik kolon kontrolü ile güncelle
-- ============================================

CREATE OR REPLACE FUNCTION check_invoice_needs_approval()
RETURNS TRIGGER AS $$
DECLARE
  approval_threshold DECIMAL(15,2) := 75000; -- 75K TRY
  manager_id UUID;
  approval_exists BOOLEAN;
  approval_id UUID;
  auto_approve BOOLEAN := false;
  invoice_user_id UUID; -- createdBy veya assignedTo
  invoice_amount DECIMAL(15,2) := 0;
  has_total_amount BOOLEAN;
  has_total BOOLEAN;
  has_created_by BOOLEAN;
  has_assigned_to BOOLEAN;
BEGIN
  -- ApprovalRequest tablosu var mı?
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'ApprovalRequest'
  ) THEN
    RETURN NEW;
  END IF;
  
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
  
  -- Invoice tablosunda createdBy veya assignedTo kolonu var mı?
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'Invoice' 
      AND column_name = 'createdBy'
  ) INTO has_created_by;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'Invoice' 
      AND column_name = 'assignedTo'
  ) INTO has_assigned_to;
  
  -- Tutarı al (totalAmount veya total)
  IF has_total_amount THEN
    invoice_amount := COALESCE(NEW."totalAmount", 0);
  ELSIF has_total THEN
    invoice_amount := COALESCE(NEW.total, 0);
  ELSE
    invoice_amount := 0;
  END IF;
  
  -- Kullanıcı ID'sini al (createdBy veya assignedTo)
  IF has_created_by THEN
    invoice_user_id := NEW."createdBy";
  ELSIF has_assigned_to THEN
    invoice_user_id := NEW."assignedTo";
  ELSE
    invoice_user_id := NULL;
  END IF;
  
  -- Sadece DRAFT durumunda çalış
  IF NEW.status = 'DRAFT' THEN
    
    BEGIN
      -- Kullanıcının yöneticisini bul (ADMIN/SUPER_ADMIN)
      IF invoice_user_id IS NOT NULL THEN
        SELECT id INTO manager_id
        FROM "User"
        WHERE "companyId" = NEW."companyId"
          AND role IN ('ADMIN', 'SUPER_ADMIN')
          AND id != invoice_user_id -- Kendisi olmasın
        LIMIT 1;
      ELSE
        -- Kullanıcı ID yoksa, şirketteki herhangi bir admin'i bul
        SELECT id INTO manager_id
        FROM "User"
        WHERE "companyId" = NEW."companyId"
          AND role IN ('ADMIN', 'SUPER_ADMIN')
        LIMIT 1;
      END IF;
      
      -- Manager yoksa, kullanıcıyı onaylayıcı olarak kullan (otomatik onay için)
      IF manager_id IS NULL THEN
        manager_id := invoice_user_id;
        auto_approve := true; -- Manager yoksa otomatik onayla
      END IF;
      
      -- Threshold altındaysa otomatik onayla
      IF invoice_amount <= approval_threshold THEN
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
          'Fatura Onayı: ' || COALESCE(NEW."invoiceNumber", NEW.title, 'Başlıksız'),
          CASE 
            WHEN invoice_amount <= approval_threshold THEN 
              'Fatura tutarı ' || invoice_amount || ' TRY, onay limiti altında. Otomatik onaylandı.'
            ELSE 
              'Fatura tutarı ' || invoice_amount || ' TRY, onay limiti ' || approval_threshold || ' TRY aşıldı.'
          END,
          'Invoice',
          NEW.id::TEXT,
          invoice_user_id, -- createdBy veya assignedTo
          CASE WHEN manager_id IS NOT NULL THEN ARRAY[manager_id] ELSE ARRAY[]::UUID[] END,
          CASE WHEN invoice_amount > approval_threshold THEN 'HIGH' ELSE 'NORMAL' END,
          NEW."companyId",
          CASE WHEN auto_approve THEN 'APPROVED' ELSE 'PENDING' END,
          CASE WHEN auto_approve THEN invoice_user_id ELSE NULL END,
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
  
  -- Eski trigger'ı sil
  DROP TRIGGER IF EXISTS invoice_approval_check ON "Invoice";
  
  -- Yeni trigger'ı dinamik olarak oluştur
  EXECUTE format('
    CREATE TRIGGER invoice_approval_check
      AFTER INSERT OR UPDATE OF %s
      ON "Invoice"
      FOR EACH ROW
      EXECUTE FUNCTION check_invoice_needs_approval();
  ', trigger_columns);
  
  RAISE NOTICE 'Trigger oluşturuldu: UPDATE OF %', trigger_columns;
END $$;

COMMENT ON FUNCTION check_invoice_needs_approval IS 'Her Invoice için onay kaydı oluşturur. Threshold altındakileri otomatik onaylar. Dinamik kolon kontrolü ile çalışır (totalAmount/total, createdBy/assignedTo).';

