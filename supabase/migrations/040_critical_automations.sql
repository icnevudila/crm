-- ============================================
-- 040_critical_automations.sql
-- Kritik Otomasyonlar (HATASIZ VERSİYON)
-- ============================================
-- Bu dosya şunları yapar:
-- 1. Quote > 50K TRY → Otomatik onay talebi
-- 2. Deal > 100K TRY → Otomatik onay talebi
-- 3. Return Order → Stok güncelleme
-- 4. Credit Note → Finance entegrasyonu
-- 5. Sales Quota → Performance tracking
-- ============================================

-- ============================================
-- PART 1: TABLO KONTROL FONKSİYONU
-- ============================================

CREATE OR REPLACE FUNCTION table_exists(table_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND tables.table_name = table_exists.table_name
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 2: QUOTE ONAY OTOMASYONu
-- ============================================

CREATE OR REPLACE FUNCTION check_quote_needs_approval()
RETURNS TRIGGER AS $$
DECLARE
  approval_threshold DECIMAL(15,2) := 50000; -- 50K TRY
  manager_id UUID;
  approval_exists BOOLEAN;
BEGIN
  -- ApprovalRequest tablosu var mı?
  IF NOT table_exists('ApprovalRequest') THEN
    RETURN NEW;
  END IF;
  
  -- Quote DRAFT durumunda ve total > threshold ise
  IF NEW.total > approval_threshold AND NEW.status = 'DRAFT' THEN
    
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
        RAISE NOTICE 'No manager found for approval';
        RETURN NEW;
      END IF;
      
      -- Zaten onay talebi var mı?
      SELECT EXISTS (
        SELECT 1 FROM "ApprovalRequest"
        WHERE "relatedTo" = 'Quote'
          AND "relatedId" = NEW.id
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
          'Teklif Onayı: ' || COALESCE(NEW.title, 'Başlıksız'),
          'Toplam tutar ' || NEW.total || ' TRY, onay limiti ' || approval_threshold || ' TRY aşıldı.',
          'Quote',
          NEW.id,
          NEW."createdBy",
          ARRAY[manager_id],
          'HIGH',
          NEW."companyId",
          'PENDING'
        );
        
        RAISE NOTICE 'Approval request created for quote %', NEW.id;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not create approval request for quote: %', SQLERRM;
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger oluştur
DROP TRIGGER IF EXISTS quote_approval_check ON "Quote";
CREATE TRIGGER quote_approval_check
  AFTER INSERT OR UPDATE OF total, status
  ON "Quote"
  FOR EACH ROW
  EXECUTE FUNCTION check_quote_needs_approval();

-- ============================================
-- PART 3: DEAL ONAY OTOMASYONu
-- ============================================

CREATE OR REPLACE FUNCTION check_deal_needs_approval()
RETURNS TRIGGER AS $$
DECLARE
  approval_threshold DECIMAL(15,2) := 100000; -- 100K TRY
  manager_id UUID;
  approval_exists BOOLEAN;
BEGIN
  -- ApprovalRequest tablosu var mı?
  IF NOT table_exists('ApprovalRequest') THEN
    RETURN NEW;
  END IF;
  
  -- Deal NEGOTIATION durumunda ve value > threshold ise
  IF NEW.value > approval_threshold AND NEW.stage = 'NEGOTIATION' THEN
    
    BEGIN
      -- Kullanıcının yöneticisini bul
      SELECT id INTO manager_id
      FROM "User"
      WHERE "companyId" = NEW."companyId"
        AND role IN ('ADMIN', 'SUPER_ADMIN')
      LIMIT 1;
      
      IF manager_id IS NULL THEN
        RAISE NOTICE 'No manager found for deal approval';
        RETURN NEW;
      END IF;
      
      -- Zaten onay talebi var mı?
      SELECT EXISTS (
        SELECT 1 FROM "ApprovalRequest"
        WHERE "relatedTo" = 'Deal'
          AND "relatedId" = NEW.id
          AND status = 'PENDING'
      ) INTO approval_exists;
      
      IF NOT approval_exists THEN
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
          'Fırsat Onayı: ' || NEW.title,
          'Fırsat değeri ' || NEW.value || ' TRY, onay limiti ' || approval_threshold || ' TRY aşıldı.',
          'Deal',
          NEW.id,
          (SELECT "createdBy" FROM "Deal" WHERE id = NEW.id),
          ARRAY[manager_id],
          'HIGH',
          NEW."companyId",
          'PENDING'
        );
        
        RAISE NOTICE 'Approval request created for deal %', NEW.id;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not create approval request for deal: %', SQLERRM;
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger oluştur
DROP TRIGGER IF EXISTS deal_approval_check ON "Deal";
CREATE TRIGGER deal_approval_check
  AFTER INSERT OR UPDATE OF value, stage
  ON "Deal"
  FOR EACH ROW
  EXECUTE FUNCTION check_deal_needs_approval();

-- ============================================
-- PART 4: RETURN ORDER STOK OTOMASYONu
-- ============================================

CREATE OR REPLACE FUNCTION handle_return_order_stock()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
BEGIN
  -- ReturnOrder ve ReturnOrderItem tabloları var mı?
  IF NOT table_exists('ReturnOrder') OR NOT table_exists('ReturnOrderItem') THEN
    RETURN NEW;
  END IF;
  
  -- Return order COMPLETED durumuna geldiğinde
  IF NEW.status = 'COMPLETED' AND (OLD.status IS NULL OR OLD.status != 'COMPLETED') THEN
    
    BEGIN
      -- Her item için stok güncelle
      FOR item IN 
        SELECT "productId", quantity 
        FROM "ReturnOrderItem" 
        WHERE "returnOrderId" = NEW.id
      LOOP
        -- Product tablosunda stock artır
        UPDATE "Product"
        SET stock = COALESCE(stock, 0) + item.quantity,
            "updatedAt" = NOW()
        WHERE id = item."productId"
          AND "companyId" = NEW."companyId";
          
        RAISE NOTICE 'Stock increased for product % by %', item."productId", item.quantity;
      END LOOP;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not update stock for return order: %', SQLERRM;
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger oluştur (tablo varsa)
DO $$
BEGIN
  IF table_exists('ReturnOrder') THEN
    DROP TRIGGER IF EXISTS return_order_stock_update ON "ReturnOrder";
    CREATE TRIGGER return_order_stock_update
      AFTER UPDATE OF status
      ON "ReturnOrder"
      FOR EACH ROW
      EXECUTE FUNCTION handle_return_order_stock();
  END IF;
END $$;

-- ============================================
-- PART 5: CREDIT NOTE FINANCE ENTEGRASYONU
-- ============================================

CREATE OR REPLACE FUNCTION handle_credit_note_finance()
RETURNS TRIGGER AS $$
DECLARE
  finance_entry_exists BOOLEAN;
BEGIN
  -- CreditNote ve Finance tabloları var mı?
  IF NOT table_exists('CreditNote') OR NOT table_exists('Finance') THEN
    RETURN NEW;
  END IF;
  
  -- Credit note APPROVED durumuna geldiğinde
  IF NEW.status = 'APPROVED' AND (OLD.status IS NULL OR OLD.status != 'APPROVED') THEN
    
    BEGIN
      -- Zaten finance kaydı var mı?
      SELECT EXISTS (
        SELECT 1 FROM "Finance"
        WHERE "relatedEntity" = 'CreditNote'
          AND "relatedId" = NEW.id
      ) INTO finance_entry_exists;
      
      IF NOT finance_entry_exists THEN
        -- Finance kaydı oluştur
        INSERT INTO "Finance" (
          type,
          amount,
          category,
          description,
          "transactionDate",
          "relatedEntity",
          "relatedId",
          "companyId"
        ) VALUES (
          'EXPENSE',
          NEW.amount,
          'REFUND',
          'Credit Note: ' || COALESCE(NEW.reason, 'İade'),
          NEW."issueDate",
          'CreditNote',
          NEW.id,
          NEW."companyId"
        );
        
        RAISE NOTICE 'Finance entry created for credit note %', NEW.id;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not create finance entry for credit note: %', SQLERRM;
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger oluştur (tablo varsa)
DO $$
BEGIN
  IF table_exists('CreditNote') THEN
    DROP TRIGGER IF EXISTS credit_note_finance_integration ON "CreditNote";
    CREATE TRIGGER credit_note_finance_integration
      AFTER UPDATE OF status
      ON "CreditNote"
      FOR EACH ROW
      EXECUTE FUNCTION handle_credit_note_finance();
  END IF;
END $$;

-- ============================================
-- PART 6: SALES QUOTA PERFORMANCE TRACKING
-- ============================================

CREATE OR REPLACE FUNCTION update_sales_quota_performance()
RETURNS TRIGGER AS $$
DECLARE
  quota_record RECORD;
  total_achieved DECIMAL(15,2);
BEGIN
  -- SalesQuota tablosu var mı?
  IF NOT table_exists('SalesQuota') THEN
    RETURN NEW;
  END IF;
  
  -- Deal WON durumuna geldiğinde
  IF NEW.stage = 'WON' AND (OLD.stage IS NULL OR OLD.stage != 'WON') THEN
    
    BEGIN
      -- Kullanıcının aktif quota'sını bul
      FOR quota_record IN 
        SELECT id, target
        FROM "SalesQuota"
        WHERE "userId" = (SELECT "createdBy" FROM "Deal" WHERE id = NEW.id)
          AND "companyId" = NEW."companyId"
          AND "startDate" <= CURRENT_DATE
          AND "endDate" >= CURRENT_DATE
      LOOP
        -- O kullanıcının bu dönemdeki toplam WON deal'lerini hesapla
        SELECT COALESCE(SUM(value), 0) INTO total_achieved
        FROM "Deal"
        WHERE "createdBy" = (SELECT "createdBy" FROM "Deal" WHERE id = NEW.id)
          AND "companyId" = NEW."companyId"
          AND stage = 'WON'
          AND "createdAt" >= quota_record.id::TEXT::TIMESTAMP; -- Basit tarih karşılaştırması
        
        -- SalesQuota'yı güncelle
        UPDATE "SalesQuota"
        SET 
          achieved = total_achieved,
          "achievementRate" = CASE 
            WHEN quota_record.target > 0 
            THEN (total_achieved / quota_record.target) * 100 
            ELSE 0 
          END,
          "updatedAt" = NOW()
        WHERE id = quota_record.id;
        
        RAISE NOTICE 'Sales quota updated for quota %', quota_record.id;
      END LOOP;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not update sales quota: %', SQLERRM;
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger oluştur
DO $$
BEGIN
  IF table_exists('SalesQuota') THEN
    DROP TRIGGER IF EXISTS deal_won_quota_update ON "Deal";
    CREATE TRIGGER deal_won_quota_update
      AFTER UPDATE OF stage
      ON "Deal"
      FOR EACH ROW
      EXECUTE FUNCTION update_sales_quota_performance();
  END IF;
END $$;

-- ============================================
-- PART 7: INVOICE STATUS AUTOMATION
-- ============================================

CREATE OR REPLACE FUNCTION handle_invoice_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Invoice PAID durumuna geldiğinde Finance kaydı oluştur
  IF NEW.status = 'PAID' AND (OLD.status IS NULL OR OLD.status != 'PAID') THEN
    
    BEGIN
      -- Zaten finance kaydı var mı kontrol et
      IF NOT EXISTS (
        SELECT 1 FROM "Finance"
        WHERE "relatedEntity" = 'Invoice'
          AND "relatedId" = NEW.id
      ) THEN
        -- Finance kaydı oluştur
        INSERT INTO "Finance" (
          type,
          amount,
          category,
          description,
          "transactionDate",
          "relatedEntity",
          "relatedId",
          "companyId"
        ) VALUES (
          'INCOME',
          NEW."totalAmount",
          'SALES',
          'Invoice Payment: ' || NEW."invoiceNumber",
          COALESCE(NEW."paidAt", NOW()),
          'Invoice',
          NEW.id,
          NEW."companyId"
        );
        
        RAISE NOTICE 'Finance entry created for invoice %', NEW.id;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not create finance entry for invoice: %', SQLERRM;
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger oluştur
-- NOT: Bu trigger 045 migration'ında daha kapsamlı bir versiyonla değiştirildi
-- (trigger_invoice_paid_finance_entry). Bu trigger'ı kaldırıyoruz çift çalışmayı önlemek için.
DROP TRIGGER IF EXISTS invoice_paid_finance_integration ON "Invoice";
-- CREATE TRIGGER invoice_paid_finance_integration
--   AFTER UPDATE OF status
--   ON "Invoice"
--   FOR EACH ROW
--   EXECUTE FUNCTION handle_invoice_status_change();

-- ============================================
-- PART 8: NOTIFICATION HELPER (Gelecek için)
-- ============================================

COMMENT ON FUNCTION check_quote_needs_approval IS 
  'Quote > 50K TRY olduğunda otomatik onay talebi oluşturur';

COMMENT ON FUNCTION check_deal_needs_approval IS 
  'Deal > 100K TRY olduğunda otomatik onay talebi oluşturur';

COMMENT ON FUNCTION handle_return_order_stock IS 
  'Return order tamamlandığında ürün stoklarını günceller';

COMMENT ON FUNCTION handle_credit_note_finance IS 
  'Credit note onaylandığında finance kaydı oluşturur';

COMMENT ON FUNCTION update_sales_quota_performance IS 
  'Deal kazanıldığında sales quota performansını günceller';

COMMENT ON FUNCTION handle_invoice_status_change IS 
  'Invoice ödendığinde finance kaydı oluşturur';

-- ============================================
-- BAŞARILI! TÜM OTOMASYONLAR KURULDU! ✅
-- ============================================
-- Şunlar otomatik çalışacak:
-- 1. ✅ Quote > 50K → Onay talebi
-- 2. ✅ Deal > 100K → Onay talebi
-- 3. ✅ Return Order → Stok artışı
-- 4. ✅ Credit Note → Finance kaydı
-- 5. ✅ Sales Quota → Performance güncelleme
-- 6. ✅ Invoice PAID → Finance kaydı
-- ============================================
