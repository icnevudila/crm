-- Fix SuperAdmin notification companyId issue
-- SuperAdmin bildirimlerinde kullanıcının kendi companyId'sini kullanmalıyız
-- Bu migration tüm trigger'larda SuperAdmin için companyId'yi düzeltir

-- ============================================
-- 1. QUOTE TRIGGER - SuperAdmin için companyId düzeltmesi
-- ============================================
CREATE OR REPLACE FUNCTION notify_quote_sent()
RETURNS TRIGGER AS $$
BEGIN
  -- Quote SENT oldu
  IF NEW.status = 'SENT' AND (OLD.status IS NULL OR OLD.status != 'SENT') THEN
    
    -- Notification tablosu yoksa atla
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'Notification'
    ) THEN
      BEGIN
        -- Notification oluştur - Admin, Sales ve SuperAdmin rolündeki kullanıcılara
        -- ÖNEMLİ: SuperAdmin için kullanıcının kendi companyId'sini kullan
        INSERT INTO "Notification" (
          "userId",
          "companyId",
          title,
          message,
          type,
          "relatedTo",
          "relatedId",
          link
        )
        SELECT 
          u.id,
          -- SuperAdmin için kullanıcının kendi companyId'sini kullan, diğerleri için NEW."companyId"
          CASE 
            WHEN u.role = 'SUPER_ADMIN' THEN u."companyId"
            ELSE NEW."companyId"
          END,
          'Teklif Gönderildi',
          COALESCE(NEW.title, 'Başlıksız') || ' teklifi müşteriye gönderildi.',
          'info',
          'Quote',
          NEW.id,
          '/tr/quotes/' || NEW.id
        FROM "User" u
        WHERE (
          -- Normal kullanıcılar: Aynı companyId'ye sahip olmalı
          (u.role IN ('ADMIN', 'SALES') AND u."companyId" = NEW."companyId")
          OR
          -- SuperAdmin: Tüm şirketlerin bildirimlerini alabilir (companyId kontrolü yok)
          (u.role = 'SUPER_ADMIN')
        )
          AND u.status = 'ACTIVE'
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Quote sent notification created for quote %', NEW.id;
        
      EXCEPTION WHEN OTHERS THEN
        -- Notification hatası ana işlemi engellemez
        RAISE NOTICE 'Could not create notification for quote: %', SQLERRM;
      END;
    END IF;
    
    -- ActivityLog - tablo yoksa atla
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'ActivityLog'
    ) THEN
      BEGIN
        INSERT INTO "ActivityLog" (
          entity,
          action,
          description,
          meta,
          "companyId",
          "userId"
        )
        VALUES (
          'Quote',
          'UPDATE',
          'Teklif gönderildi: ' || COALESCE(NEW.title, 'Başlıksız'),
          jsonb_build_object(
            'quoteId', NEW.id,
            'quoteTitle', NEW.title,
            'status', NEW.status
          ),
          NEW."companyId",
          COALESCE(NEW."createdBy", (SELECT id FROM "User" WHERE "companyId" = NEW."companyId" LIMIT 1))
        );
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not create ActivityLog for quote: %', SQLERRM;
      END;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. TASK ASSIGNMENT TRIGGER - Zaten düzeltildi, kontrol edelim
-- ============================================
-- handle_task_assigned() fonksiyonu zaten userId içeriyor, bu migration'da sadece kontrol ediyoruz

-- ============================================
-- 3. DEAL ASSIGNMENT TRIGGER - SuperAdmin için companyId düzeltmesi
-- ============================================
CREATE OR REPLACE FUNCTION notify_deal_assigned()
RETURNS TRIGGER AS $$
BEGIN
  -- Fırsat oluşturulduğunda veya assignedTo değiştiğinde atanan kullanıcıya bildirim gönder
  IF NEW."assignedTo" IS NOT NULL AND (OLD."assignedTo" IS NULL OR OLD."assignedTo" != NEW."assignedTo") THEN
    INSERT INTO "Notification" ("userId", "companyId", title, message, type, "relatedTo", "relatedId", link)
    SELECT 
      NEW."assignedTo",
      -- SuperAdmin için kullanıcının kendi companyId'sini kullan, diğerleri için NEW."companyId"
      CASE 
        WHEN u.role = 'SUPER_ADMIN' THEN u."companyId"
        ELSE NEW."companyId"
      END,
      'Yeni Fırsat Atandı',
      NEW.title || ' fırsatı size atandı. Detayları görmek ister misiniz?',
      'info',
      'Deal',
      NEW.id,
      '/tr/deals/' || NEW.id
    FROM "User" u
    WHERE u.id = NEW."assignedTo"
    LIMIT 1
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. TICKET ASSIGNMENT TRIGGER - SuperAdmin için companyId düzeltmesi
-- ============================================
CREATE OR REPLACE FUNCTION notify_ticket_assigned()
RETURNS TRIGGER AS $$
BEGIN
  -- Destek talebi oluşturulduğunda veya assignedTo değiştiğinde atanan kullanıcıya bildirim gönder
  IF NEW."assignedTo" IS NOT NULL AND (OLD."assignedTo" IS NULL OR OLD."assignedTo" != NEW."assignedTo") THEN
    INSERT INTO "Notification" ("userId", "companyId", title, message, type, "relatedTo", "relatedId", link)
    SELECT 
      NEW."assignedTo",
      -- SuperAdmin için kullanıcının kendi companyId'sini kullan, diğerleri için NEW."companyId"
      CASE 
        WHEN u.role = 'SUPER_ADMIN' THEN u."companyId"
        ELSE NEW."companyId"
      END,
      'Yeni Destek Talebi Atandı',
      NEW.subject || ' destek talebi size atandı. Detayları görmek ister misiniz?',
      'info',
      'Ticket',
      NEW.id,
      '/tr/tickets/' || NEW.id
    FROM "User" u
    WHERE u.id = NEW."assignedTo"
    LIMIT 1
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. INVOICE ASSIGNMENT TRIGGER - SuperAdmin için companyId düzeltmesi
-- ============================================
CREATE OR REPLACE FUNCTION notify_invoice_assigned()
RETURNS TRIGGER AS $$
BEGIN
  -- Fatura oluşturulduğunda veya assignedTo değiştiğinde atanan kullanıcıya bildirim gönder
  IF NEW."assignedTo" IS NOT NULL AND (OLD."assignedTo" IS NULL OR OLD."assignedTo" != NEW."assignedTo") THEN
    INSERT INTO "Notification" ("userId", "companyId", title, message, type, "relatedTo", "relatedId", link)
    SELECT 
      NEW."assignedTo",
      -- SuperAdmin için kullanıcının kendi companyId'sini kullan, diğerleri için NEW."companyId"
      CASE 
        WHEN u.role = 'SUPER_ADMIN' THEN u."companyId"
        ELSE NEW."companyId"
      END,
      'Yeni Fatura Atandı',
      NEW.title || ' faturası size atandı. Detayları görmek ister misiniz?',
      'info',
      'Invoice',
      NEW.id,
      '/tr/invoices/' || NEW.id
    FROM "User" u
    WHERE u.id = NEW."assignedTo"
    LIMIT 1
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. MEETING ASSIGNMENT TRIGGER - SuperAdmin için companyId düzeltmesi
-- ============================================
CREATE OR REPLACE FUNCTION notify_meeting_assigned()
RETURNS TRIGGER AS $$
BEGIN
  -- Görüşme oluşturulduğunda veya assignedTo değiştiğinde atanan kullanıcıya bildirim gönder
  IF NEW."assignedTo" IS NOT NULL AND (OLD."assignedTo" IS NULL OR OLD."assignedTo" != NEW."assignedTo") THEN
    INSERT INTO "Notification" ("userId", "companyId", title, message, type, "relatedTo", "relatedId", link)
    SELECT 
      NEW."assignedTo",
      -- SuperAdmin için kullanıcının kendi companyId'sini kullan, diğerleri için NEW."companyId"
      CASE 
        WHEN u.role = 'SUPER_ADMIN' THEN u."companyId"
        ELSE NEW."companyId"
      END,
      'Yeni Görüşme Atandı',
      NEW.title || ' görüşmesi size atandı. Detayları görmek ister misiniz?',
      'info',
      'Meeting',
      NEW.id,
      '/tr/meetings/' || NEW.id
    FROM "User" u
    WHERE u.id = NEW."assignedTo"
    LIMIT 1
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION notify_quote_sent() IS 'Teklif gönderildiğinde bildirim oluşturur. SuperAdmin için kullanıcının kendi companyId''sini kullanır.';
COMMENT ON FUNCTION notify_deal_assigned() IS 'Fırsat atandığında bildirim oluşturur. SuperAdmin için kullanıcının kendi companyId''sini kullanır.';
COMMENT ON FUNCTION notify_ticket_assigned() IS 'Destek talebi atandığında bildirim oluşturur. SuperAdmin için kullanıcının kendi companyId''sini kullanır.';
COMMENT ON FUNCTION notify_invoice_assigned() IS 'Fatura atandığında bildirim oluşturur. SuperAdmin için kullanıcının kendi companyId''sini kullanır.';
COMMENT ON FUNCTION notify_meeting_assigned() IS 'Görüşme atandığında bildirim oluşturur. SuperAdmin için kullanıcının kendi companyId''sini kullanır.';

