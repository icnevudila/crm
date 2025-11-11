-- CRM V3 - Invoice Due Date Notifications
-- Fatura vadesi bildirimleri için trigger'lar
-- OVERDUE bildirimi ve vade yaklaşıyor bildirimleri

-- ============================================
-- 0. ÖNCE KOLONLARI KONTROL ET VE EKLE (Eğer yoksa)
-- ============================================
-- Invoice tablosuna dueDate kolonu ekle (eğer yoksa)
ALTER TABLE "Invoice" 
ADD COLUMN IF NOT EXISTS "dueDate" DATE;

-- Invoice tablosuna invoiceNumber kolonu ekle (eğer yoksa)
ALTER TABLE "Invoice" 
ADD COLUMN IF NOT EXISTS "invoiceNumber" VARCHAR(100);

-- Index'ler (performans için)
CREATE INDEX IF NOT EXISTS idx_invoice_due_date ON "Invoice"("dueDate") WHERE "dueDate" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoice_number ON "Invoice"("invoiceNumber") WHERE "invoiceNumber" IS NOT NULL;

-- ============================================
-- 1. INVOICE OVERDUE → Bildirim (Vade Geçtiğinde)
-- ============================================
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

-- ============================================
-- 2. INVOICE VADESİ YAKLAŞIYOR → Bildirim (3 Gün Öncesi Uyarı, 1 Gün Öncesi Kritik)
-- ============================================
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
-- 3. SCHEDULED JOB: Günlük OVERDUE Kontrolü
-- ============================================
-- Not: Supabase'de pg_cron yoksa, bu kontrolü API endpoint ile yapabiliriz
-- Her gün çalışacak bir cron job oluşturulabilir (Vercel Cron veya Supabase Edge Function)

-- ============================================
-- 4. INDEX'LER (Performans için)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_invoice_due_date ON "Invoice"("dueDate") WHERE "dueDate" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoice_status_due_date ON "Invoice"("status", "dueDate") WHERE "dueDate" IS NOT NULL AND status NOT IN ('PAID', 'CANCELLED');

-- ============================================
-- 5. COMMENT'LER
-- ============================================
COMMENT ON FUNCTION auto_notify_invoice_overdue() IS 'Fatura vadesi geçtiğinde otomatik bildirim gönderir';
COMMENT ON FUNCTION auto_notify_invoice_due_soon() IS 'Fatura vadesi yaklaştığında otomatik bildirim gönderir (3 gün öncesi uyarı, 1 gün öncesi kritik)';

