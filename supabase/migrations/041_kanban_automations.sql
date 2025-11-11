-- ============================================
-- 041_kanban_automations.sql
-- Kanban Otomasyonları (Auto-expire, Auto-overdue)
-- ============================================
-- Bu dosya şunları yapar:
-- 1. Quote > 30 gün → AUTO-EXPIRE
-- 2. Invoice > dueDate → AUTO-OVERDUE
-- 3. Contract > endDate → AUTO-EXPIRED
-- 4. Scheduled job fonksiyonları
-- ============================================

-- ============================================
-- PART 1: QUOTE AUTO-EXPIRE (30 gün)
-- ============================================

-- Önce mevcut fonksiyonları sil (varsa)
DROP FUNCTION IF EXISTS auto_expire_quotes() CASCADE;
DROP FUNCTION IF EXISTS auto_overdue_invoices() CASCADE;
DROP FUNCTION IF EXISTS auto_expire_contracts() CASCADE;
DROP FUNCTION IF EXISTS run_auto_expiry_jobs() CASCADE;

CREATE OR REPLACE FUNCTION auto_expire_quotes()
RETURNS void AS $$
BEGIN
  -- Quote SENT durumunda ve 30 günden eski ise EXPIRED yap
  UPDATE "Quote"
  SET 
    status = 'EXPIRED',
    "updatedAt" = NOW()
  WHERE status = 'SENT'
    AND "createdAt" < NOW() - INTERVAL '30 days'
    AND status != 'EXPIRED';
    
  RAISE NOTICE 'Auto-expired old quotes';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_expire_quotes IS 
  'SENT durumundaki ve 30 günden eski teklifleri otomatik olarak EXPIRED yapar';

-- ============================================
-- PART 2: INVOICE AUTO-OVERDUE (dueDate geçmiş)
-- ============================================

CREATE OR REPLACE FUNCTION auto_overdue_invoices()
RETURNS void AS $$
BEGIN
  -- Invoice SENT durumunda ve dueDate geçmiş ise OVERDUE yap
  UPDATE "Invoice"
  SET 
    status = 'OVERDUE',
    "updatedAt" = NOW()
  WHERE status = 'SENT'
    AND "dueDate" < CURRENT_DATE
    AND status != 'OVERDUE'
    AND status != 'PAID'
    AND status != 'CANCELLED';
    
  RAISE NOTICE 'Auto-overdue unpaid invoices';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_overdue_invoices IS 
  'SENT durumundaki ve vadesi geçmiş faturaları otomatik olarak OVERDUE yapar';

-- ============================================
-- PART 3: CONTRACT AUTO-EXPIRED (endDate geçmiş)
-- ============================================

CREATE OR REPLACE FUNCTION auto_expire_contracts()
RETURNS void AS $$
BEGIN
  -- Contract ACTIVE durumunda ve endDate geçmiş ise EXPIRED yap
  -- (auto-renew enabled değilse)
  UPDATE "Contract"
  SET 
    status = 'EXPIRED',
    "updatedAt" = NOW()
  WHERE status = 'ACTIVE'
    AND "endDate" < CURRENT_DATE
    AND "autoRenewEnabled" = FALSE
    AND status != 'EXPIRED'
    AND status != 'TERMINATED';
    
  RAISE NOTICE 'Auto-expired contracts';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_expire_contracts IS 
  'ACTIVE durumundaki ve süresi dolmuş sözleşmeleri otomatik olarak EXPIRED yapar (auto-renew kapalıysa)';

-- ============================================
-- PART 4: COMBINED AUTO-EXPIRY JOB
-- ============================================

CREATE OR REPLACE FUNCTION run_auto_expiry_jobs()
RETURNS void AS $$
BEGIN
  -- Tüm auto-expiry fonksiyonlarını çalıştır
  PERFORM auto_expire_quotes();
  PERFORM auto_overdue_invoices();
  PERFORM auto_expire_contracts();
  
  RAISE NOTICE 'All auto-expiry jobs completed';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION run_auto_expiry_jobs IS 
  'Tüm otomat ik expiry ve overdue işlemlerini toplu olarak çalıştırır (Cron job için)';

-- ============================================
-- PART 5: ACTIVITY LOG FOR AUTO-CHANGES
-- ============================================

-- Önce mevcut trigger fonksiyonlarını sil (varsa)
DROP FUNCTION IF EXISTS log_quote_expired() CASCADE;
DROP FUNCTION IF EXISTS log_invoice_overdue() CASCADE;
DROP FUNCTION IF EXISTS log_contract_expired() CASCADE;

-- Quote EXPIRED → ActivityLog + Notification
CREATE OR REPLACE FUNCTION log_quote_expired()
RETURNS TRIGGER AS $$
DECLARE
  admin_user_id UUID;
  user_record RECORD;
BEGIN
  -- Quote EXPIRED durumuna geldiğinde log yaz ve bildirim gönder
  IF NEW.status = 'EXPIRED' AND OLD.status != 'EXPIRED' THEN
    BEGIN
      -- System user (admin) bul
      SELECT id INTO admin_user_id
      FROM "User" 
      WHERE role IN ('ADMIN', 'SUPER_ADMIN') 
        AND "companyId" = NEW."companyId" 
      LIMIT 1;
      
      -- ActivityLog ekle
      INSERT INTO "ActivityLog" (
        action,
        entityType,
        "entityId",
        "userId",
        "companyId",
        description,
        meta
      ) VALUES (
        'UPDATE',
        'Quote',
        NEW.id,
        admin_user_id,
        NEW."companyId",
        'Teklif süresi doldu: ' || NEW.title,
        jsonb_build_object(
          'entityType', 'Quote',
          'action', 'auto_expired',
          'quoteId', NEW.id,
          'expiredAt', NOW()
        )
      );
      
      -- Bildirim gönder (SALES ve ADMIN rollerine)
      FOR user_record IN 
        SELECT id FROM "User" 
        WHERE "companyId" = NEW."companyId" 
          AND role IN ('ADMIN', 'SALES', 'SUPER_ADMIN')
          AND status = 'ACTIVE'
      LOOP
        BEGIN
          INSERT INTO "Notification" (
            "userId",
            "companyId",
            title,
            message,
            type,
            "relatedTo",
            "relatedId",
            "isRead",
            "createdAt"
          ) VALUES (
            user_record.id,
            NEW."companyId",
            'Teklif Süresi Doldu',
            'Teklif "' || NEW.title || '" 30 gün geçtiği için otomatik olarak süresi doldu (EXPIRED).',
            'warning',
            'Quote',
            NEW.id,
            FALSE,
            NOW()
          );
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Could not create notification for user %: %', user_record.id, SQLERRM;
        END;
      END LOOP;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not create activity log for expired quote: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS quote_expired_log ON "Quote";
CREATE TRIGGER quote_expired_log
  AFTER UPDATE OF status
  ON "Quote"
  FOR EACH ROW
  EXECUTE FUNCTION log_quote_expired();

-- Invoice OVERDUE → ActivityLog + Notification
CREATE OR REPLACE FUNCTION log_invoice_overdue()
RETURNS TRIGGER AS $$
DECLARE
  admin_user_id UUID;
  user_record RECORD;
BEGIN
  -- Invoice OVERDUE durumuna geldiğinde log yaz ve bildirim gönder
  IF NEW.status = 'OVERDUE' AND OLD.status != 'OVERDUE' THEN
    BEGIN
      -- System user (admin) bul
      SELECT id INTO admin_user_id
      FROM "User" 
      WHERE role IN ('ADMIN', 'SUPER_ADMIN') 
        AND "companyId" = NEW."companyId" 
      LIMIT 1;
      
      -- ActivityLog ekle
      INSERT INTO "ActivityLog" (
        action,
        entityType,
        "entityId",
        "userId",
        "companyId",
        description,
        meta
      ) VALUES (
        'UPDATE',
        'Invoice',
        NEW.id,
        admin_user_id,
        NEW."companyId",
        'Fatura vadesi geçti: ' || NEW.title,
        jsonb_build_object(
          'entityType', 'Invoice',
          'action', 'auto_overdue',
          'invoiceId', NEW.id,
          'overdueAt', NOW(),
          'dueDate', NEW."dueDate"
        )
      );
      
      -- Bildirim gönder (ADMIN ve FINANCE rollerine) - Öncelikli!
      FOR user_record IN 
        SELECT id FROM "User" 
        WHERE "companyId" = NEW."companyId" 
          AND role IN ('ADMIN', 'SUPER_ADMIN')
          AND status = 'ACTIVE'
      LOOP
        BEGIN
          INSERT INTO "Notification" (
            "userId",
            "companyId",
            title,
            message,
            type,
            "relatedTo",
            "relatedId",
            "isRead",
            "createdAt"
          ) VALUES (
            user_record.id,
            NEW."companyId",
            '⚠️ Fatura Vadesi Geçti',
            'Fatura "' || NEW.title || '" vadesi geçti! Müşteri ile iletişime geçin. Vade tarihi: ' || NEW."dueDate"::TEXT,
            'error', -- Kritik!
            'Invoice',
            NEW.id,
            FALSE,
            NOW()
          );
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Could not create notification for user %: %', user_record.id, SQLERRM;
        END;
      END LOOP;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not create activity log for overdue invoice: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS invoice_overdue_log ON "Invoice";
CREATE TRIGGER invoice_overdue_log
  AFTER UPDATE OF status
  ON "Invoice"
  FOR EACH ROW
  EXECUTE FUNCTION log_invoice_overdue();

-- Contract EXPIRED → ActivityLog + Notification
CREATE OR REPLACE FUNCTION log_contract_expired()
RETURNS TRIGGER AS $$
DECLARE
  admin_user_id UUID;
  user_record RECORD;
BEGIN
  -- Contract EXPIRED durumuna geldiğinde log yaz ve bildirim gönder
  IF NEW.status = 'EXPIRED' AND OLD.status != 'EXPIRED' THEN
    BEGIN
      -- System user (admin) bul
      SELECT id INTO admin_user_id
      FROM "User" 
      WHERE role IN ('ADMIN', 'SUPER_ADMIN') 
        AND "companyId" = NEW."companyId" 
      LIMIT 1;
      
      -- ActivityLog ekle
      INSERT INTO "ActivityLog" (
        action,
        entityType,
        "entityId",
        "userId",
        "companyId",
        description,
        meta
      ) VALUES (
        'UPDATE',
        'Contract',
        NEW.id,
        admin_user_id,
        NEW."companyId",
        'Sözleşme süresi doldu: ' || NEW.title,
        jsonb_build_object(
          'entityType', 'Contract',
          'action', 'auto_expired',
          'contractId', NEW.id,
          'expiredAt', NOW(),
          'endDate', NEW."endDate"
        )
      );
      
      -- Bildirim gönder (ADMIN ve SALES rollerine) - Yenileme fırsatı!
      FOR user_record IN 
        SELECT id FROM "User" 
        WHERE "companyId" = NEW."companyId" 
          AND role IN ('ADMIN', 'SALES', 'SUPER_ADMIN')
          AND status = 'ACTIVE'
      LOOP
        BEGIN
          INSERT INTO "Notification" (
            "userId",
            "companyId",
            title,
            message,
            type,
            "relatedTo",
            "relatedId",
            "isRead",
            "createdAt"
          ) VALUES (
            user_record.id,
            NEW."companyId",
            '📄 Sözleşme Süresi Doldu',
            'Sözleşme "' || NEW.title || '" süresi doldu. Yenileme görüşmeleri başlatılabilir. Bitiş tarihi: ' || NEW."endDate"::TEXT,
            'warning',
            'Contract',
            NEW.id,
            FALSE,
            NOW()
          );
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Could not create notification for user %: %', user_record.id, SQLERRM;
        END;
      END LOOP;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not create activity log for expired contract: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS contract_expired_log ON "Contract";
CREATE TRIGGER contract_expired_log
  AFTER UPDATE OF status
  ON "Contract"
  FOR EACH ROW
  EXECUTE FUNCTION log_contract_expired();

-- ============================================
-- PART 6: CRON JOB SETUP (Supabase Dashboard'tan elle ayarlanacak)
-- ============================================

-- Supabase Dashboard > Database > Cron Jobs sayfasından aşağıdaki job'u ekle:
-- 
-- Name: auto_expiry_jobs
-- Schedule: 0 */6 * * * (Her 6 saatte bir)
-- Command: SELECT run_auto_expiry_jobs();
-- 
-- Veya terminal'den:
-- SELECT cron.schedule('auto_expiry_jobs', '0 */6 * * *', 'SELECT run_auto_expiry_jobs();');

-- ============================================
-- BAŞARILI! TÜM OTOMASYONLAR KURULDU! ✅
-- ============================================
-- Şunlar otomatik çalışacak:
-- 1. ✅ Quote > 30 gün → EXPIRED
-- 2. ✅ Invoice > dueDate → OVERDUE
-- 3. ✅ Contract > endDate → EXPIRED
-- 4. ✅ Her durum değişikliğinde ActivityLog
-- 
-- NOT: Cron job'u Supabase Dashboard'tan manuel olarak ayarlamanız gerekir!
-- ============================================

CRM sistemindeki eksik modüllerin raporu
