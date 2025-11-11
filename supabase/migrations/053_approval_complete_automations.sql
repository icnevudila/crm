-- ============================================
-- 053_approval_complete_automations.sql
-- Onaylar Modülü Tam Otomasyon Entegrasyonu
-- ============================================
-- Bu dosya şunları yapar:
-- 1. Onay talebi oluşturulduğunda onaylayıcılara otomatik bildirim
-- 2. Invoice threshold otomasyonu (> 75K TRY)
-- 3. Contract threshold otomasyonu (> 50K TRY)
-- 4. Onay sonrası otomatik işlemler (Quote → Invoice, Deal → Contract)
-- 5. Daha fazla otomatik işlem senaryosu
-- ============================================

-- ============================================
-- PART 1: ONAY TALEBİ OLUŞTURULDUĞUNDA ONAYLAYICILARA BİLDİRİM
-- ============================================

CREATE OR REPLACE FUNCTION notify_approvers_on_approval_created()
RETURNS TRIGGER AS $$
DECLARE
  approver_id UUID;
  approver_name VARCHAR;
  requester_name VARCHAR;
BEGIN
  -- Yeni onay talebi oluşturulduğunda
  IF TG_OP = 'INSERT' AND NEW.status = 'PENDING' THEN
    
    -- Talep edenin adını al
    SELECT name INTO requester_name
    FROM "User"
    WHERE id = NEW."requestedBy";
    
    -- Her onaylayıcıya bildirim gönder
    IF NEW."approverIds" IS NOT NULL AND array_length(NEW."approverIds", 1) > 0 THEN
      FOREACH approver_id IN ARRAY NEW."approverIds"
      LOOP
        BEGIN
          -- Onaylayıcının adını al
          SELECT name INTO approver_name
          FROM "User"
          WHERE id = approver_id;
          
          -- Bildirim oluştur
          INSERT INTO "Notification" (
            title,
            message,
            type,
            "relatedTo",
            "relatedId",
            "companyId",
            "userId",
            link,
            priority
          )
          VALUES (
            '🔔 Yeni Onay Talebi',
            COALESCE(requester_name, 'Bir kullanıcı') || ' tarafından ' || 
            COALESCE(NEW.title, 'Başlıksız') || ' onay talebi oluşturuldu.',
            'info',
            'ApprovalRequest',
            NEW.id,
            NEW."companyId",
            approver_id,
            '/tr/approvals/' || NEW.id,
            CASE 
              WHEN NEW.priority = 'HIGH' THEN 'high'
              WHEN NEW.priority = 'URGENT' THEN 'high'
              ELSE 'normal'
            END
          )
          ON CONFLICT DO NOTHING;
          
          RAISE NOTICE 'Notification sent to approver % for approval %', approver_id, NEW.id;
          
        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING 'Failed to send notification to approver %: %', approver_id, SQLERRM;
        END;
      END LOOP;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_approvers_on_approval_created ON "ApprovalRequest";
CREATE TRIGGER trigger_notify_approvers_on_approval_created
  AFTER INSERT
  ON "ApprovalRequest"
  FOR EACH ROW
  EXECUTE FUNCTION notify_approvers_on_approval_created();

COMMENT ON FUNCTION notify_approvers_on_approval_created IS 'Onay talebi oluşturulduğunda tüm onaylayıcılara otomatik bildirim gönderir.';

-- ============================================
-- PART 2: INVOICE THRESHOLD OTOMASYONu (> 75K TRY)
-- ============================================

CREATE OR REPLACE FUNCTION check_invoice_needs_approval()
RETURNS TRIGGER AS $$
DECLARE
  approval_threshold DECIMAL(15,2) := 75000; -- 75K TRY
  manager_id UUID;
  approval_exists BOOLEAN;
BEGIN
  -- ApprovalRequest tablosu var mı?
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'ApprovalRequest'
  ) THEN
    RETURN NEW;
  END IF;
  
  -- Invoice DRAFT durumunda ve totalAmount > threshold ise
  IF NEW."totalAmount" > approval_threshold AND NEW.status = 'DRAFT' THEN
    
    BEGIN
      -- Kullanıcının yöneticisini bul (ADMIN/SUPER_ADMIN)
      SELECT id INTO manager_id
      FROM "User"
      WHERE "companyId" = NEW."companyId"
        AND role IN ('ADMIN', 'SUPER_ADMIN')
        AND id != NEW."createdBy" -- Kendisi olmasın
      LIMIT 1;
      
      -- Manager yoksa devam et
      IF manager_id IS NULL THEN
        RAISE NOTICE 'No manager found for invoice approval';
        RETURN NEW;
      END IF;
      
      -- Zaten onay talebi var mı?
      SELECT EXISTS (
        SELECT 1 FROM "ApprovalRequest"
        WHERE "relatedTo" = 'Invoice'
          AND "relatedId" = NEW.id::TEXT
          AND status = 'PENDING'
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
          status
        ) VALUES (
          'Fatura Onayı: ' || COALESCE(NEW."invoiceNumber", 'Başlıksız'),
          'Fatura tutarı ' || NEW."totalAmount" || ' TRY, onay limiti ' || approval_threshold || ' TRY aşıldı.',
          'Invoice',
          NEW.id::TEXT,
          NEW."createdBy",
          ARRAY[manager_id],
          'HIGH',
          NEW."companyId",
          'PENDING'
        );
        
        RAISE NOTICE 'Approval request created for invoice %', NEW.id;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not create approval request for invoice: %', SQLERRM;
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS invoice_approval_check ON "Invoice";
CREATE TRIGGER invoice_approval_check
  AFTER INSERT OR UPDATE OF "totalAmount", status
  ON "Invoice"
  FOR EACH ROW
  EXECUTE FUNCTION check_invoice_needs_approval();

COMMENT ON FUNCTION check_invoice_needs_approval IS 'Invoice totalAmount > 75K TRY ise otomatik onay talebi oluşturur.';

-- ============================================
-- PART 3: CONTRACT THRESHOLD OTOMASYONu (> 50K TRY)
-- ============================================

CREATE OR REPLACE FUNCTION check_contract_needs_approval()
RETURNS TRIGGER AS $$
DECLARE
  approval_threshold DECIMAL(15,2) := 50000; -- 50K TRY
  manager_id UUID;
  approval_exists BOOLEAN;
BEGIN
  -- ApprovalRequest tablosu var mı?
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'ApprovalRequest'
  ) THEN
    RETURN NEW;
  END IF;
  
  -- Contract DRAFT durumunda ve value > threshold ise
  IF NEW.value > approval_threshold AND NEW.status = 'DRAFT' THEN
    
    BEGIN
      -- Kullanıcının yöneticisini bul (ADMIN/SUPER_ADMIN)
      SELECT id INTO manager_id
      FROM "User"
      WHERE "companyId" = NEW."companyId"
        AND role IN ('ADMIN', 'SUPER_ADMIN')
        AND id != NEW."createdBy" -- Kendisi olmasın
      LIMIT 1;
      
      -- Manager yoksa devam et
      IF manager_id IS NULL THEN
        RAISE NOTICE 'No manager found for contract approval';
        RETURN NEW;
      END IF;
      
      -- Zaten onay talebi var mı?
      SELECT EXISTS (
        SELECT 1 FROM "ApprovalRequest"
        WHERE "relatedTo" = 'Contract'
          AND "relatedId" = NEW.id::TEXT
          AND status = 'PENDING'
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
          status
        ) VALUES (
          'Sözleşme Onayı: ' || COALESCE(NEW.title, 'Başlıksız'),
          'Sözleşme değeri ' || NEW.value || ' TRY, onay limiti ' || approval_threshold || ' TRY aşıldı.',
          'Contract',
          NEW.id::TEXT,
          NEW."createdBy",
          ARRAY[manager_id],
          'HIGH',
          NEW."companyId",
          'PENDING'
        );
        
        RAISE NOTICE 'Approval request created for contract %', NEW.id;
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

COMMENT ON FUNCTION check_contract_needs_approval IS 'Contract value > 50K TRY ise otomatik onay talebi oluşturur.';

-- ============================================
-- PART 4: ONAY SONRASI OTOMATİK İŞLEMLER
-- ============================================

-- Quote APPROVED → Invoice oluştur (zaten var ama kontrol edelim)
-- Deal APPROVED → Contract oluştur (yeni)

CREATE OR REPLACE FUNCTION handle_approval_approved_automations()
RETURNS TRIGGER AS $$
DECLARE
  quote_record RECORD;
  deal_record RECORD;
  invoice_id UUID;
  contract_id UUID;
  invoice_number VARCHAR;
  contract_number VARCHAR;
BEGIN
  -- Approval onaylandığında
  IF NEW.status = 'APPROVED' AND (OLD.status IS NULL OR OLD.status != 'APPROVED') THEN
    
    -- Quote onaylandıysa → Invoice oluştur (eğer yoksa)
    IF NEW."relatedTo" = 'Quote' THEN
      BEGIN
        -- Quote bilgisini al
        SELECT * INTO quote_record
        FROM "Quote"
        WHERE id = NEW."relatedId"::UUID;
        
        -- Quote bulundu ve ACCEPTED durumunda
        IF quote_record.id IS NOT NULL AND quote_record.status = 'ACCEPTED' THEN
          -- Zaten invoice var mı kontrol et
          IF NOT EXISTS (
            SELECT 1 FROM "Invoice"
            WHERE "quoteId" = quote_record.id
          ) THEN
            -- Invoice number oluştur
            invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || 
              LPAD(COALESCE((
                SELECT MAX(CAST(SUBSTRING("invoiceNumber" FROM '[0-9]+$') AS INTEGER)) 
                FROM "Invoice" 
                WHERE "invoiceNumber" LIKE 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-%'
              ), 0) + 1, 4, '0');
            
            -- Invoice oluştur
            INSERT INTO "Invoice" (
              "invoiceNumber",
              title,
              "customerId",
              "customerCompanyId",
              "quoteId",
              "dueDate",
              "totalAmount",
              currency,
              status,
              notes,
              "companyId",
              "createdBy"
            )
            VALUES (
              invoice_number,
              'Fatura - ' || COALESCE(quote_record.title, 'Başlıksız'),
              quote_record."customerId",
              quote_record."customerCompanyId",
              quote_record.id,
              CURRENT_DATE + INTERVAL '30 days', -- 30 gün vade
              quote_record."totalAmount",
              COALESCE(quote_record.currency, 'TRY'),
              'DRAFT',
              'Quote ' || COALESCE(quote_record."quoteNumber", '') || ' onaylandı, otomatik oluşturuldu',
              quote_record."companyId",
              quote_record."createdBy"
            )
            RETURNING id INTO invoice_id;
            
            -- ActivityLog
            INSERT INTO "ActivityLog" (
              entity,
              action,
              description,
              meta,
              "companyId",
              "userId"
            )
            VALUES (
              'Invoice',
              'CREATE',
              'Quote onaylandı, fatura oluşturuldu: ' || invoice_number,
              jsonb_build_object(
                'quoteId', quote_record.id,
                'quoteNumber', quote_record."quoteNumber",
                'invoiceId', invoice_id,
                'invoiceNumber', invoice_number
              ),
              quote_record."companyId",
              quote_record."createdBy"
            );
            
            RAISE NOTICE 'Invoice created for approved quote %: %', quote_record.id, invoice_number;
          END IF;
        END IF;
        
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not create invoice for approved quote: %', SQLERRM;
      END;
    END IF;
    
    -- Deal onaylandıysa → Contract oluştur (eğer yoksa)
    IF NEW."relatedTo" = 'Deal' THEN
      BEGIN
        -- Deal bilgisini al
        SELECT * INTO deal_record
        FROM "Deal"
        WHERE id = NEW."relatedId"::UUID;
        
        -- Deal bulundu ve NEGOTIATION durumunda
        IF deal_record.id IS NOT NULL AND deal_record.stage = 'NEGOTIATION' THEN
          -- Zaten contract var mı kontrol et
          IF NOT EXISTS (
            SELECT 1 FROM "Contract"
            WHERE "dealId" = deal_record.id
          ) THEN
            -- Contract number oluştur
            contract_number := 'CNT-' || TO_CHAR(NOW(), 'YYYY') || '-' || 
              LPAD(COALESCE((
                SELECT MAX(CAST(SUBSTRING("contractNumber" FROM '[0-9]+$') AS INTEGER)) 
                FROM "Contract" 
                WHERE "contractNumber" LIKE 'CNT-' || TO_CHAR(NOW(), 'YYYY') || '-%'
              ), 0) + 1, 4, '0');
            
            -- Contract oluştur
            INSERT INTO "Contract" (
              "contractNumber",
              title,
              "customerId",
              "customerCompanyId",
              "dealId",
              value,
              currency,
              status,
              notes,
              "companyId",
              "createdBy"
            )
            VALUES (
              contract_number,
              'Sözleşme - ' || COALESCE(deal_record.title, 'Başlıksız'),
              deal_record."customerId",
              deal_record."customerCompanyId",
              deal_record.id,
              deal_record.value,
              COALESCE(deal_record.currency, 'TRY'),
              'DRAFT',
              'Deal ' || COALESCE(deal_record.title, '') || ' onaylandı, otomatik oluşturuldu',
              deal_record."companyId",
              deal_record."createdBy"
            )
            RETURNING id INTO contract_id;
            
            -- ActivityLog
            INSERT INTO "ActivityLog" (
              entity,
              action,
              description,
              meta,
              "companyId",
              "userId"
            )
            VALUES (
              'Contract',
              'CREATE',
              'Deal onaylandı, sözleşme oluşturuldu: ' || contract_number,
              jsonb_build_object(
                'dealId', deal_record.id,
                'dealTitle', deal_record.title,
                'contractId', contract_id,
                'contractNumber', contract_number
              ),
              deal_record."companyId",
              deal_record."createdBy"
            );
            
            RAISE NOTICE 'Contract created for approved deal %: %', deal_record.id, contract_number;
          END IF;
        END IF;
        
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not create contract for approved deal: %', SQLERRM;
      END;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Mevcut trigger'ı güncelle veya yeni oluştur
DROP TRIGGER IF EXISTS trigger_approval_approved_automations ON "ApprovalRequest";
CREATE TRIGGER trigger_approval_approved_automations
  AFTER UPDATE OF status
  ON "ApprovalRequest"
  FOR EACH ROW
  WHEN (NEW.status = 'APPROVED' AND (OLD.status IS NULL OR OLD.status != 'APPROVED'))
  EXECUTE FUNCTION handle_approval_approved_automations();

COMMENT ON FUNCTION handle_approval_approved_automations IS 'Onay talebi onaylandığında otomatik işlemler yapar: Quote → Invoice, Deal → Contract';

-- ============================================
-- PART 5: ONAY BİLDİRİMLERİNİ İYİLEŞTİR
-- ============================================

-- Mevcut handle_approval_approved fonksiyonunu güncelle - userId ekle
CREATE OR REPLACE FUNCTION handle_approval_approved()
RETURNS TRIGGER AS $$
BEGIN
  -- Approval onaylandığında
  IF NEW.status = 'APPROVED' AND (OLD.status IS NULL OR OLD.status != 'APPROVED') THEN
    
    BEGIN
      -- Notification (İstek sahibine) - userId ekle
      INSERT INTO "Notification" (
        title,
        message,
        type,
        "relatedTo",
        "relatedId",
        "companyId",
        "userId",
        link,
        priority
      )
      VALUES (
        '✅ Onay Talebi Onaylandı',
        COALESCE(NEW.title, 'Başlıksız') || ' onay talebi onaylandı.',
        'success',
        'ApprovalRequest',
        NEW.id,
        NEW."companyId",
        NEW."requestedBy", -- Talep edene bildirim
        '/tr/approvals/' || NEW.id,
        'normal'
      )
      ON CONFLICT DO NOTHING;
      
      -- ActivityLog
      INSERT INTO "ActivityLog" (
        entity,
        action,
        description,
        meta,
        "companyId",
        "userId"
      )
      VALUES (
        'ApprovalRequest',
        'UPDATE',
        'Onay talebi onaylandı: ' || COALESCE(NEW.title, 'Başlıksız'),
        jsonb_build_object(
          'approvalId', NEW.id,
          'approvalTitle', NEW.title,
          'relatedTo', NEW."relatedTo",
          'relatedId', NEW."relatedId",
          'approvedBy', NEW."approvedBy"
        ),
        NEW."companyId",
        COALESCE(NEW."approvedBy", NEW."requestedBy")
      );
      
      RAISE NOTICE 'Approval approved: %', NEW.id;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not create approval notification: %', SQLERRM;
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Mevcut handle_approval_rejected fonksiyonunu güncelle - userId ekle
CREATE OR REPLACE FUNCTION handle_approval_rejected()
RETURNS TRIGGER AS $$
BEGIN
  -- Approval reddedildiğinde
  IF NEW.status = 'REJECTED' AND (OLD.status IS NULL OR OLD.status != 'REJECTED') THEN
    
    BEGIN
      -- Notification (İstek sahibine) - userId ekle
      INSERT INTO "Notification" (
        title,
        message,
        type,
        "relatedTo",
        "relatedId",
        "companyId",
        "userId",
        link,
        priority
      )
      VALUES (
        '❌ Onay Talebi Reddedildi',
        COALESCE(NEW.title, 'Başlıksız') || ' onay talebi reddedildi. Sebep: ' || COALESCE(NEW."rejectionReason", 'Belirtilmedi'),
        'error',
        'ApprovalRequest',
        NEW.id,
        NEW."companyId",
        NEW."requestedBy", -- Talep edene bildirim
        '/tr/approvals/' || NEW.id,
        'normal'
      )
      ON CONFLICT DO NOTHING;
      
      -- ActivityLog
      INSERT INTO "ActivityLog" (
        entity,
        action,
        description,
        meta,
        "companyId",
        "userId"
      )
      VALUES (
        'ApprovalRequest',
        'UPDATE',
        'Onay talebi reddedildi: ' || COALESCE(NEW.title, 'Başlıksız'),
        jsonb_build_object(
          'approvalId', NEW.id,
          'approvalTitle', NEW.title,
          'relatedTo', NEW."relatedTo",
          'relatedId', NEW."relatedId",
          'rejectedBy', NEW."rejectedBy",
          'rejectionReason', NEW."rejectionReason"
        ),
        NEW."companyId",
        COALESCE(NEW."rejectedBy", NEW."requestedBy")
      );
      
      RAISE NOTICE 'Approval rejected: %', NEW.id;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not create approval rejection notification: %', SQLERRM;
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Migration tamamlandı!
-- ============================================

COMMENT ON FUNCTION notify_approvers_on_approval_created IS 'Onay talebi oluşturulduğunda tüm onaylayıcılara otomatik bildirim gönderir.';
COMMENT ON FUNCTION check_invoice_needs_approval IS 'Invoice totalAmount > 75K TRY ise otomatik onay talebi oluşturur.';
COMMENT ON FUNCTION check_contract_needs_approval IS 'Contract value > 50K TRY ise otomatik onay talebi oluşturur.';
COMMENT ON FUNCTION handle_approval_approved_automations IS 'Onay talebi onaylandığında otomatik işlemler yapar: Quote → Invoice, Deal → Contract';






