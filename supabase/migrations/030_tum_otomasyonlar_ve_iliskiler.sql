-- ============================================
-- CRM V3 - TÜM OTOMASYONLAR VE İLİŞKİLER
-- Tek dosyada tüm migration'lar
-- Tarih: 2024
-- ============================================

-- ============================================
-- BÖLÜM 1: KOLON KONTROLLERİ VE EKLEMELERİ
-- ============================================

-- Invoice tablosuna dueDate ve invoiceNumber kolonları ekle (eğer yoksa)
ALTER TABLE "Invoice" 
ADD COLUMN IF NOT EXISTS "dueDate" DATE;

ALTER TABLE "Invoice" 
ADD COLUMN IF NOT EXISTS "invoiceNumber" VARCHAR(100);

-- ============================================
-- BÖLÜM 2: INDEX'LER (Performans için)
-- ============================================

-- Invoice index'leri
CREATE INDEX IF NOT EXISTS idx_invoice_due_date ON "Invoice"("dueDate") WHERE "dueDate" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoice_number ON "Invoice"("invoiceNumber") WHERE "invoiceNumber" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoice_status_due_date ON "Invoice"("status", "dueDate") WHERE "dueDate" IS NOT NULL AND status NOT IN ('PAID', 'CANCELLED');

-- Quote index'leri
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Quote' 
    AND column_name = 'validUntil'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_quote_valid_until ON "Quote"("validUntil") WHERE "validUntil" IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_quote_status_valid_until ON "Quote"("status", "validUntil") WHERE "validUntil" IS NOT NULL AND status = 'SENT';
  END IF;
END $$;

-- Task index'leri
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Task' 
    AND column_name = 'dueDate'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_task_due_date ON "Task"("dueDate") WHERE "dueDate" IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_task_status_due_date ON "Task"("status", "dueDate") WHERE "dueDate" IS NOT NULL AND status != 'DONE';
  END IF;
END $$;

-- Ticket index'leri
CREATE INDEX IF NOT EXISTS idx_ticket_created_at ON "Ticket"("createdAt");
CREATE INDEX IF NOT EXISTS idx_ticket_status_created_at ON "Ticket"("status", "createdAt") WHERE status NOT IN ('RESOLVED', 'CLOSED');

-- ============================================
-- BÖLÜM 3: FOREIGN KEY CONSTRAINTS
-- ============================================

-- Invoice → CustomerCompany ilişkisi
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Invoice' 
    AND column_name = 'customerCompanyId'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_schema = 'public' 
      AND table_name = 'Invoice' 
      AND constraint_name = 'fk_invoice_customercompany'
    ) THEN
      ALTER TABLE "Invoice" 
      ADD CONSTRAINT fk_invoice_customercompany 
      FOREIGN KEY ("customerCompanyId") 
      REFERENCES "CustomerCompany"(id) 
      ON DELETE SET NULL;
      
      CREATE INDEX IF NOT EXISTS idx_invoice_customercompany ON "Invoice"("customerCompanyId") WHERE "customerCompanyId" IS NOT NULL;
      
      -- Comment ekle
      COMMENT ON CONSTRAINT fk_invoice_customercompany ON "Invoice" IS 'Invoice → CustomerCompany foreign key constraint';
    END IF;
  END IF;
END $$;

-- Quote → CustomerCompany ilişkisi
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Quote' 
    AND column_name = 'customerCompanyId'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_schema = 'public' 
      AND table_name = 'Quote' 
      AND constraint_name = 'fk_quote_customercompany'
    ) THEN
      ALTER TABLE "Quote" 
      ADD CONSTRAINT fk_quote_customercompany 
      FOREIGN KEY ("customerCompanyId") 
      REFERENCES "CustomerCompany"(id) 
      ON DELETE SET NULL;
      
      CREATE INDEX IF NOT EXISTS idx_quote_customercompany ON "Quote"("customerCompanyId") WHERE "customerCompanyId" IS NOT NULL;
      
      -- Comment ekle
      COMMENT ON CONSTRAINT fk_quote_customercompany ON "Quote" IS 'Quote → CustomerCompany foreign key constraint';
    END IF;
  END IF;
END $$;

-- Deal → CustomerCompany ilişkisi
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Deal' 
    AND column_name = 'customerCompanyId'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_schema = 'public' 
      AND table_name = 'Deal' 
      AND constraint_name = 'fk_deal_customercompany'
    ) THEN
      ALTER TABLE "Deal" 
      ADD CONSTRAINT fk_deal_customercompany 
      FOREIGN KEY ("customerCompanyId") 
      REFERENCES "CustomerCompany"(id) 
      ON DELETE SET NULL;
      
      CREATE INDEX IF NOT EXISTS idx_deal_customercompany ON "Deal"("customerCompanyId") WHERE "customerCompanyId" IS NOT NULL;
      
      -- Comment ekle
      COMMENT ON CONSTRAINT fk_deal_customercompany ON "Deal" IS 'Deal → CustomerCompany foreign key constraint';
    END IF;
  END IF;
END $$;

-- Invoice → Vendor ilişkisi
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Invoice' 
    AND column_name = 'vendorId'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_schema = 'public' 
      AND table_name = 'Invoice' 
      AND constraint_name = 'fk_invoice_vendor'
    ) THEN
      ALTER TABLE "Invoice" 
      ADD CONSTRAINT fk_invoice_vendor 
      FOREIGN KEY ("vendorId") 
      REFERENCES "Vendor"(id) 
      ON DELETE SET NULL;
      
      CREATE INDEX IF NOT EXISTS idx_invoice_vendor ON "Invoice"("vendorId") WHERE "vendorId" IS NOT NULL;
      
      -- Comment ekle
      COMMENT ON CONSTRAINT fk_invoice_vendor ON "Invoice" IS 'Invoice → Vendor foreign key constraint';
    END IF;
  END IF;
END $$;

-- ============================================
-- BÖLÜM 4: INVOICE VADESİ BİLDİRİMLERİ
-- ============================================

-- 4.1. INVOICE OVERDUE → Bildirim (Vade Geçtiğinde)
CREATE OR REPLACE FUNCTION auto_notify_invoice_overdue()
RETURNS TRIGGER AS $$
BEGIN
  -- Fatura vadesi geçtiğinde ve ödenmemişse bildirim gönder
  IF NEW."dueDate" IS NOT NULL 
     AND NEW."dueDate" < CURRENT_DATE
     AND NEW.status NOT IN ('PAID', 'CANCELLED')
     AND (OLD."dueDate" IS NULL OR OLD."dueDate" >= CURRENT_DATE OR OLD.status IN ('PAID', 'CANCELLED')) THEN
    -- Vade geçmiş faturalar için bildirim gönder
    INSERT INTO "Notification" ("userId", "companyId", title, message, type, priority, "relatedTo", "relatedId", link)
    SELECT 
      u.id,
      NEW."companyId",
      'Fatura Vadesi Geçti',
      COALESCE(NEW."invoiceNumber", NEW.title) || ' faturasının vadesi geçti. Ödeme yapılması gerekiyor. Detayları görmek ister misiniz?',
      'error',
      'high',
      'Invoice',
      NEW.id,
      '/tr/invoices/' || NEW.id
    FROM "User" u
    WHERE u."companyId" = NEW."companyId"
      AND u.role IN ('ADMIN', 'SALES', 'SUPER_ADMIN')
      AND NOT EXISTS (
        -- Aynı fatura için daha önce OVERDUE bildirimi gönderilmişse tekrar gönderme
        SELECT 1 FROM "Notification" n
        WHERE n."relatedTo" = 'Invoice'
          AND n."relatedId" = NEW.id
          AND n.title = 'Fatura Vadesi Geçti'
          AND n."isRead" = false
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_invoice_overdue ON "Invoice";
CREATE TRIGGER trg_invoice_overdue
  AFTER INSERT OR UPDATE ON "Invoice"
  FOR EACH ROW
  WHEN (NEW."dueDate" IS NOT NULL AND NEW.status NOT IN ('PAID', 'CANCELLED'))
  EXECUTE FUNCTION auto_notify_invoice_overdue();

-- 4.2. INVOICE VADESİ YAKLAŞIYOR → Bildirim (3 Gün Öncesi Uyarı, 1 Gün Öncesi Kritik)
CREATE OR REPLACE FUNCTION auto_notify_invoice_due_soon()
RETURNS TRIGGER AS $$
DECLARE
  days_until_due INTEGER;
  notification_priority TEXT;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Fatura vadesi yaklaşıyorsa bildirim gönder
  IF NEW."dueDate" IS NOT NULL 
     AND NEW."dueDate" > CURRENT_DATE
     AND NEW."dueDate" <= (CURRENT_DATE + INTERVAL '3 days')
     AND NEW.status NOT IN ('PAID', 'CANCELLED')
     AND (OLD."dueDate" IS NULL OR OLD."dueDate" > (CURRENT_DATE + INTERVAL '3 days') OR OLD.status IN ('PAID', 'CANCELLED')) THEN
    -- Kaç gün kaldığını hesapla
    days_until_due := NEW."dueDate" - CURRENT_DATE;
    
    -- Öncelik belirle: 1 gün öncesi kritik, 3 gün öncesi uyarı
    IF days_until_due <= 1 THEN
      notification_priority := 'critical';
      notification_title := 'Fatura Vadesi Yaklaşıyor (Kritik)';
      notification_message := COALESCE(NEW."invoiceNumber", NEW.title) || ' faturasının vadesi ' || days_until_due || ' gün sonra. Acil ödeme yapılması gerekiyor. Detayları görmek ister misiniz?';
    ELSE
      notification_priority := 'high';
      notification_title := 'Fatura Vadesi Yaklaşıyor';
      notification_message := COALESCE(NEW."invoiceNumber", NEW.title) || ' faturasının vadesi ' || days_until_due || ' gün sonra. Ödeme yapılması gerekiyor. Detayları görmek ister misiniz?';
    END IF;
    
    -- Bildirim gönder
    INSERT INTO "Notification" ("userId", "companyId", title, message, type, priority, "relatedTo", "relatedId", link, "expiresAt")
    SELECT 
      u.id,
      NEW."companyId",
      notification_title,
      notification_message,
      'warning',
      notification_priority,
      'Invoice',
      NEW.id,
      '/tr/invoices/' || NEW.id,
      NEW."dueDate"  -- Bildirim vade tarihinde geçersiz olacak
    FROM "User" u
    WHERE u."companyId" = NEW."companyId"
      AND u.role IN ('ADMIN', 'SALES', 'SUPER_ADMIN')
      AND NOT EXISTS (
        -- Aynı fatura için daha önce vade yaklaşıyor bildirimi gönderilmişse tekrar gönderme
        SELECT 1 FROM "Notification" n
        WHERE n."relatedTo" = 'Invoice'
          AND n."relatedId" = NEW.id
          AND n.title LIKE 'Fatura Vadesi Yaklaşıyor%'
          AND n."isRead" = false
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_invoice_due_soon ON "Invoice";
CREATE TRIGGER trg_invoice_due_soon
  AFTER INSERT OR UPDATE ON "Invoice"
  FOR EACH ROW
  WHEN (NEW."dueDate" IS NOT NULL AND NEW."dueDate" > CURRENT_DATE AND NEW."dueDate" <= (CURRENT_DATE + INTERVAL '3 days') AND NEW.status NOT IN ('PAID', 'CANCELLED'))
  EXECUTE FUNCTION auto_notify_invoice_due_soon();

-- ============================================
-- BÖLÜM 5: INVOICE SENT → OVERDUE KONTROLÜ
-- ============================================

-- Invoice SENT durumuna geçtiğinde dueDate varsa OVERDUE kontrolü yap
CREATE OR REPLACE FUNCTION auto_check_invoice_overdue_on_sent()
RETURNS TRIGGER AS $$
BEGIN
  -- Invoice SENT durumuna geçtiğinde ve dueDate varsa OVERDUE kontrolü yap
  IF NEW.status = 'SENT' 
     AND (OLD.status IS NULL OR OLD.status != 'SENT')
     AND NEW."dueDate" IS NOT NULL 
     AND NEW."dueDate" < CURRENT_DATE
     AND NEW.status != 'PAID' 
     AND NEW.status != 'CANCELLED' THEN
    -- Status'u OVERDUE yap
    NEW.status := 'OVERDUE';
    
    -- Bildirim gönder (auto_notify_invoice_overdue fonksiyonu zaten gönderecek)
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_invoice_check_overdue_on_sent ON "Invoice";
CREATE TRIGGER trg_invoice_check_overdue_on_sent
  BEFORE UPDATE ON "Invoice"
  FOR EACH ROW
  WHEN (NEW.status = 'SENT' AND (OLD.status IS NULL OR OLD.status != 'SENT') AND NEW."dueDate" IS NOT NULL)
  EXECUTE FUNCTION auto_check_invoice_overdue_on_sent();

-- ============================================
-- BÖLÜM 6: INVOICE PAYMENTDATE → PAID OTOMASYONU (OPSİYONEL)
-- ============================================

-- Invoice paymentDate doldurulduğunda otomatik PAID yap (opsiyonel - kullanıcı tercihine bağlı)
CREATE OR REPLACE FUNCTION auto_set_invoice_paid_on_payment_date()
RETURNS TRIGGER AS $$
BEGIN
  -- paymentDate doldurulduğunda ve status PAID değilse otomatik PAID yap
  IF NEW."paymentDate" IS NOT NULL 
     AND (OLD."paymentDate" IS NULL OR OLD."paymentDate" IS DISTINCT FROM NEW."paymentDate")
     AND NEW.status != 'PAID'
     AND NEW.status != 'CANCELLED' THEN
    NEW.status := 'PAID';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_invoice_auto_paid_on_payment_date ON "Invoice";
-- Opsiyonel: Bu trigger'ı aktif etmek için yorumu kaldırın
-- CREATE TRIGGER trg_invoice_auto_paid_on_payment_date
--   BEFORE UPDATE ON "Invoice"
--   FOR EACH ROW
--   WHEN (NEW."paymentDate" IS NOT NULL AND OLD."paymentDate" IS DISTINCT FROM NEW."paymentDate")
--   EXECUTE FUNCTION auto_set_invoice_paid_on_payment_date();

-- ============================================
-- BÖLÜM 7: PRODUCT STOK SIFIR → BİLDİRİM
-- ============================================

-- Stok sıfır olduğunda kritik bildirim gönder
CREATE OR REPLACE FUNCTION auto_notify_product_stock_zero()
RETURNS TRIGGER AS $$
BEGIN
  -- Stok 0 olduğunda ve daha önce 0 değildi kritik bildirim gönder
  IF NEW.stock = 0 
     AND (OLD.stock IS NULL OR OLD.stock > 0) THEN
    INSERT INTO "Notification" ("userId", "companyId", title, message, type, priority, "relatedTo", "relatedId", link)
    SELECT 
      u.id,
      NEW."companyId",
      'Stok Sıfır - Kritik',
      NEW.name || ' ürününün stoku sıfır. Acil stok girişi yapılması gerekiyor. Detayları görmek ister misiniz?',
      'error',
      'critical',
      'Product',
      NEW.id,
      '/tr/products/' || NEW.id
    FROM "User" u
    WHERE u."companyId" = NEW."companyId"
      AND u.role IN ('ADMIN', 'SUPER_ADMIN')
      AND NOT EXISTS (
        -- Aynı ürün için daha önce stok sıfır bildirimi gönderilmişse tekrar gönderme
        SELECT 1 FROM "Notification" n
        WHERE n."relatedTo" = 'Product'
          AND n."relatedId" = NEW.id
          AND n.title = 'Stok Sıfır - Kritik'
          AND n."isRead" = false
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_product_stock_zero ON "Product";
CREATE TRIGGER trg_product_stock_zero
  AFTER INSERT OR UPDATE ON "Product"
  FOR EACH ROW
  WHEN (NEW.stock = 0)
  EXECUTE FUNCTION auto_notify_product_stock_zero();

-- ============================================
-- BÖLÜM 8: CUSTOMER DOĞUM GÜNÜ → BİLDİRİM
-- ============================================

-- Customer doğum günü yaklaştığında bildirim gönder (7 gün öncesi)
CREATE OR REPLACE FUNCTION auto_notify_customer_birthday()
RETURNS TRIGGER AS $$
DECLARE
  current_year INTEGER;
  birthday_this_year DATE;
  days_until_birthday INTEGER;
BEGIN
  -- Customer birthday alanı varsa ve yaklaşıyorsa bildirim gönder
  IF NEW.birthday IS NOT NULL THEN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE);
    -- Doğum günü tarihini bu yıl için oluştur
    birthday_this_year := MAKE_DATE(current_year, EXTRACT(MONTH FROM NEW.birthday)::INTEGER, EXTRACT(DAY FROM NEW.birthday)::INTEGER);
    
    -- Eğer bu yılki doğum günü geçtiyse gelecek yıla bak
    IF birthday_this_year < CURRENT_DATE THEN
      birthday_this_year := MAKE_DATE(current_year + 1, EXTRACT(MONTH FROM NEW.birthday)::INTEGER, EXTRACT(DAY FROM NEW.birthday)::INTEGER);
    END IF;
    
    days_until_birthday := birthday_this_year - CURRENT_DATE;
    
    -- 7 gün öncesi bildirim gönder (sadece yeni kayıt veya birthday değiştiğinde)
    IF days_until_birthday = 7 
       AND (OLD.birthday IS NULL OR OLD.birthday IS DISTINCT FROM NEW.birthday) THEN
      INSERT INTO "Notification" ("userId", "companyId", title, message, type, priority, "relatedTo", "relatedId", link)
      SELECT 
        u.id,
        NEW."companyId",
        'Müşteri Doğum Günü Yaklaşıyor',
        NEW.name || ' müşterisinin doğum günü 7 gün sonra. Detayları görmek ister misiniz?',
        'info',
        'normal',
        'Customer',
        NEW.id,
        '/tr/customers/' || NEW.id
      FROM "User" u
      WHERE u."companyId" = NEW."companyId"
        AND u.role IN ('ADMIN', 'SALES', 'SUPER_ADMIN')
        AND NOT EXISTS (
          -- Aynı müşteri için daha önce doğum günü bildirimi gönderilmişse tekrar gönderme
          SELECT 1 FROM "Notification" n
          WHERE n."relatedTo" = 'Customer'
            AND n."relatedId" = NEW.id
            AND n.title = 'Müşteri Doğum Günü Yaklaşıyor'
            AND n."isRead" = false
        );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_customer_birthday ON "Customer";
-- Customer birthday kolonu varsa trigger'ı aktif et
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Customer' 
    AND column_name = 'birthday'
  ) THEN
    CREATE TRIGGER trg_customer_birthday
      AFTER INSERT OR UPDATE ON "Customer"
      FOR EACH ROW
      WHEN (NEW.birthday IS NOT NULL)
      EXECUTE FUNCTION auto_notify_customer_birthday();
  END IF;
END $$;

-- ============================================
-- BÖLÜM 9: CUSTOMER UZUN SÜRE İLETİŞİM YOK → BİLDİRİM
-- ============================================

-- Customer ile 30 günden uzun süredir iletişim yoksa bildirim gönder
CREATE OR REPLACE FUNCTION auto_notify_customer_no_contact()
RETURNS TRIGGER AS $$
DECLARE
  days_since_last_contact INTEGER;
  old_days_since_last_contact INTEGER;
BEGIN
  -- lastInteractionDate varsa kontrol et
  IF NEW."lastInteractionDate" IS NOT NULL THEN
    days_since_last_contact := CURRENT_DATE - NEW."lastInteractionDate"::DATE;
    
    -- Eski değeri kontrol et
    IF OLD."lastInteractionDate" IS NOT NULL THEN
      old_days_since_last_contact := CURRENT_DATE - OLD."lastInteractionDate"::DATE;
    ELSE
      old_days_since_last_contact := 0;
    END IF;
    
    -- 30 günden uzun süredir iletişim yoksa ve daha önce 30 günden azsa bildirim gönder
    IF days_since_last_contact >= 30 
       AND old_days_since_last_contact < 30 THEN
      INSERT INTO "Notification" ("userId", "companyId", title, message, type, priority, "relatedTo", "relatedId", link)
      SELECT 
        u.id,
        NEW."companyId",
        'Müşteri ile Uzun Süre İletişim Yok',
        NEW.name || ' müşterisi ile ' || days_since_last_contact || ' gündür iletişim kurulmadı. Detayları görmek ister misiniz?',
        'warning',
        'high',
        'Customer',
        NEW.id,
        '/tr/customers/' || NEW.id
      FROM "User" u
      WHERE u."companyId" = NEW."companyId"
        AND u.role IN ('ADMIN', 'SALES', 'SUPER_ADMIN')
        AND NOT EXISTS (
          -- Aynı müşteri için daha önce uzun süre iletişim yok bildirimi gönderilmişse tekrar gönderme
          SELECT 1 FROM "Notification" n
          WHERE n."relatedTo" = 'Customer'
            AND n."relatedId" = NEW.id
            AND n.title = 'Müşteri ile Uzun Süre İletişim Yok'
            AND n."isRead" = false
        );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_customer_no_contact ON "Customer";
-- Customer lastInteractionDate kolonu varsa trigger'ı aktif et
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Customer' 
    AND column_name = 'lastInteractionDate'
  ) THEN
    CREATE TRIGGER trg_customer_no_contact
      AFTER INSERT OR UPDATE ON "Customer"
      FOR EACH ROW
      WHEN (NEW."lastInteractionDate" IS NOT NULL)
      EXECUTE FUNCTION auto_notify_customer_no_contact();
  END IF;
END $$;

-- ============================================
-- BÖLÜM 10: COMMENT'LER
-- ============================================

-- Function comment'leri (her zaman eklenebilir - function'lar CREATE OR REPLACE ile oluşturuluyor)
COMMENT ON FUNCTION auto_notify_invoice_overdue() IS 'Fatura vadesi geçtiğinde otomatik bildirim gönderir';
COMMENT ON FUNCTION auto_notify_invoice_due_soon() IS 'Fatura vadesi yaklaştığında otomatik bildirim gönderir (3 gün öncesi uyarı, 1 gün öncesi kritik)';
COMMENT ON FUNCTION auto_check_invoice_overdue_on_sent() IS 'Invoice SENT durumuna geçtiğinde dueDate varsa OVERDUE kontrolü yapar';
COMMENT ON FUNCTION auto_set_invoice_paid_on_payment_date() IS 'Invoice paymentDate doldurulduğunda otomatik PAID yapar (opsiyonel)';
COMMENT ON FUNCTION auto_notify_product_stock_zero() IS 'Ürün stoku sıfır olduğunda kritik bildirim gönderir';
COMMENT ON FUNCTION auto_notify_customer_birthday() IS 'Müşteri doğum günü yaklaştığında bildirim gönderir (7 gün öncesi)';
COMMENT ON FUNCTION auto_notify_customer_no_contact() IS 'Müşteri ile 30 günden uzun süredir iletişim yoksa bildirim gönderir';

-- Index comment'leri (IF NOT EXISTS ile oluşturulduğu için güvenli)
DO $$
BEGIN
  -- Quote validUntil index comment
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND indexname = 'idx_quote_valid_until'
  ) THEN
    COMMENT ON INDEX idx_quote_valid_until IS 'Quote validUntil index - süre dolmak üzere kontrolü için';
  END IF;
  
  -- Task dueDate index comment
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND indexname = 'idx_task_due_date'
  ) THEN
    COMMENT ON INDEX idx_task_due_date IS 'Task dueDate index - geç kaldı/yaklaşıyor kontrolü için';
  END IF;
  
  -- Ticket createdAt index comment
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND indexname = 'idx_ticket_created_at'
  ) THEN
    COMMENT ON INDEX idx_ticket_created_at IS 'Ticket createdAt index - geç kaldı kontrolü için';
  END IF;
END $$;

