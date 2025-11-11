-- ============================================
-- 051_smart_user_automations.sql
-- AKILLI KULLANICI OTOMASYONLARI
-- ============================================
-- Bu dosya şunları yapar:
-- 1. Invoice SENT → Otomatik Shipment oluştur
-- 2. Quote REJECTED → Otomatik revizyon önerisi
-- 3. Deal LOST → Otomatik analiz görevi
-- 4. Invoice OVERDUE → Otomatik hatırlatma görevi
-- 5. Product düşük stok → Otomatik satın alma görevi
-- 6. Meeting bitince → Otomatik follow-up görevi
-- 7. Ticket RESOLVED → Otomatik memnuniyet anketi görevi
-- 8. Deal CONTACTED → Otomatik demo takvimi önerisi
-- 9. Contract ACTIVE (RECURRING) → Otomatik periyodik Invoice
-- 10. Customer VIP → Otomatik özel segment atama
-- ============================================

-- ============================================
-- PART 1: INVOICE SENT → OTOMATIK SHIPMENT OLUŞTUR
-- ============================================
CREATE OR REPLACE FUNCTION auto_create_shipment_on_invoice_sent()
RETURNS TRIGGER AS $$
DECLARE
  shipment_id UUID;
  shipment_number VARCHAR;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Invoice SENT olduğunda ve henüz Shipment yoksa
  IF NEW.status = 'SENT' AND (OLD.status IS NULL OR OLD.status != 'SENT') THEN
    BEGIN
      -- Zaten Shipment var mı kontrol et
      IF NOT EXISTS (SELECT 1 FROM "Shipment" WHERE "invoiceId" = NEW.id) THEN
        -- Shipment numarası oluştur
        shipment_number := 'SHIP-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(
          COALESCE(
            (SELECT MAX(CAST(SUBSTRING("shipmentNumber" FROM '[0-9]+$') AS INTEGER)) 
             FROM "Shipment" 
             WHERE "shipmentNumber" LIKE 'SHIP-' || TO_CHAR(NOW(), 'YYYY') || '-%'), 
            0
          ) + 1, 
          4, 
          '0'
        );

        -- Shipment oluştur
        INSERT INTO "Shipment" (
          "shipmentNumber",
          "invoiceId",
          "customerId",
          "customerCompanyId",
          status,
          "shippingAddress",
          "shippingMethod",
          "estimatedDeliveryDate",
          notes,
          "companyId",
          "createdBy"
        )
        VALUES (
          shipment_number,
          NEW.id,
          NEW."customerId",
          NEW."customerCompanyId",
          'PENDING',
          (SELECT "address" FROM "Customer" WHERE id = NEW."customerId" LIMIT 1),
          'STANDARD',
          NEW."dueDate" + INTERVAL '3 days', -- Vade tarihinden 3 gün sonra teslimat
          'Fatura #' || NEW."invoiceNumber" || ' için otomatik oluşturuldu',
          NEW."companyId",
          NEW."createdBy"
        )
        RETURNING id INTO shipment_id;

        -- ActivityLog
        INSERT INTO "ActivityLog" (entity, action, description, meta, "companyId", "userId")
        VALUES (
          'Shipment',
          'CREATE',
          'Fatura gönderildi, otomatik sevkiyat oluşturuldu: ' || shipment_number,
          jsonb_build_object(
            'invoiceId', NEW.id,
            'invoiceNumber', NEW."invoiceNumber",
            'shipmentId', shipment_id,
            'shipmentNumber', shipment_number
          ),
          NEW."companyId",
          NEW."createdBy"
        );

        -- Notification
        notification_title := '📦 Sevkiyat Oluşturuldu';
        notification_message := 'Fatura #' || NEW."invoiceNumber" || ' için sevkiyat #' || shipment_number || ' otomatik olarak oluşturuldu.';
        
        INSERT INTO "Notification" (title, message, type, "relatedTo", "relatedId", "companyId", "userId", link)
        VALUES (
          notification_title,
          notification_message,
          'success',
          'Shipment',
          shipment_id,
          NEW."companyId",
          NEW."createdBy",
          '/tr/shipments/' || shipment_id
        ) ON CONFLICT DO NOTHING;

        RAISE NOTICE 'Shipment auto-created for invoice %: %', NEW.id, shipment_id;
      ELSE
        RAISE NOTICE 'Shipment already exists for invoice %', NEW.id;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to auto-create shipment for invoice %: %', NEW.id, SQLERRM;
      
      -- Hata bildirimi
      INSERT INTO "Notification" (title, message, type, "relatedTo", "relatedId", "companyId", "userId", link)
      VALUES (
        '❌ Sevkiyat Oluşturulamadı',
        'Fatura #' || NEW."invoiceNumber" || ' için sevkiyat oluşturulurken bir hata oluştu: ' || SQLERRM || '. Lütfen manuel olarak oluşturun.',
        'error',
        'Invoice',
        NEW.id,
        NEW."companyId",
        NEW."createdBy",
        '/tr/invoices/' || NEW.id
      ) ON CONFLICT DO NOTHING;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_create_shipment_on_invoice_sent ON "Invoice";
CREATE TRIGGER trigger_auto_create_shipment_on_invoice_sent
  AFTER UPDATE OF status ON "Invoice"
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_shipment_on_invoice_sent();

-- ============================================
-- PART 2: QUOTE REJECTED → OTOMATIK REVİZYON ÖNERİSİ
-- ============================================
CREATE OR REPLACE FUNCTION auto_suggest_revision_on_quote_rejected()
RETURNS TRIGGER AS $$
DECLARE
  task_id UUID;
BEGIN
  -- Quote REJECTED olduğunda
  IF NEW.status = 'REJECTED' AND (OLD.status IS NULL OR OLD.status != 'REJECTED') THEN
    BEGIN
      -- Otomatik revizyon görevi oluştur
      INSERT INTO "Task" (
        title,
        description,
        status,
        priority,
        "dueDate",
        "relatedTo",
        "relatedId",
        "companyId",
        "createdBy",
        "assignedTo"
      )
      VALUES (
        'Teklif Revizyonu: ' || COALESCE(NEW.title, NEW."quoteNumber"),
        'Teklif #' || NEW."quoteNumber" || ' reddedildi. Lütfen müşteri geri bildirimlerini değerlendirip revizyon yapın veya yeni teklif hazırlayın.',
        'TODO',
        'HIGH',
        CURRENT_DATE + INTERVAL '2 days', -- 2 gün içinde tamamlanmalı
        'Quote',
        NEW.id,
        NEW."companyId",
        NEW."createdBy",
        NEW."assignedTo" -- Teklifi oluşturan kişiye atanır
      )
      RETURNING id INTO task_id;

      -- Notification
      INSERT INTO "Notification" (title, message, type, "relatedTo", "relatedId", "companyId", "userId", link, priority)
      VALUES (
        '📝 Teklif Revizyonu Gerekli',
        'Teklif #' || NEW."quoteNumber" || ' reddedildi. Revizyon görevi oluşturuldu.',
        'warning',
        'Task',
        task_id,
        NEW."companyId",
        NEW."assignedTo",
        '/tr/tasks/' || task_id,
        'high'
      ) ON CONFLICT DO NOTHING;

      RAISE NOTICE 'Revision task created for rejected quote %', NEW.id;

    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to create revision task for quote %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_suggest_revision_on_quote_rejected ON "Quote";
CREATE TRIGGER trigger_auto_suggest_revision_on_quote_rejected
  AFTER UPDATE OF status ON "Quote"
  FOR EACH ROW
  EXECUTE FUNCTION auto_suggest_revision_on_quote_rejected();

-- ============================================
-- PART 3: DEAL LOST → OTOMATIK ANALİZ GÖREVİ
-- ============================================
CREATE OR REPLACE FUNCTION auto_create_analysis_task_on_deal_lost()
RETURNS TRIGGER AS $$
DECLARE
  task_id UUID;
BEGIN
  -- Deal LOST olduğunda ve lostReason varsa
  IF NEW.stage = 'LOST' AND (OLD.stage IS NULL OR OLD.stage != 'LOST') AND NEW."lostReason" IS NOT NULL THEN
    BEGIN
      -- Analiz görevi oluştur
      INSERT INTO "Task" (
        title,
        description,
        status,
        priority,
        "dueDate",
        "relatedTo",
        "relatedId",
        "companyId",
        "createdBy",
        "assignedTo"
      )
      VALUES (
        'Fırsat Analizi: ' || COALESCE(NEW.title, 'Başlıksız'),
        'Fırsat "' || COALESCE(NEW.title, 'Başlıksız') || '" kaybedildi. Sebep: ' || NEW."lostReason" || '. Lütfen süreci analiz edin ve iyileştirme önerileri belirleyin.',
        'TODO',
        'NORMAL',
        CURRENT_DATE + INTERVAL '7 days', -- 1 hafta içinde analiz
        'Deal',
        NEW.id,
        NEW."companyId",
        NEW."createdBy",
        NEW."assignedTo"
      )
      RETURNING id INTO task_id;

      -- Notification
      INSERT INTO "Notification" (title, message, type, "relatedTo", "relatedId", "companyId", "userId", link)
      VALUES (
        '📊 Fırsat Analizi Gerekli',
        'Fırsat "' || COALESCE(NEW.title, 'Başlıksız') || '" kaybedildi. Analiz görevi oluşturuldu.',
        'info',
        'Task',
        task_id,
        NEW."companyId",
        NEW."assignedTo",
        '/tr/tasks/' || task_id
      ) ON CONFLICT DO NOTHING;

      RAISE NOTICE 'Analysis task created for lost deal %', NEW.id;

    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to create analysis task for deal %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_create_analysis_task_on_deal_lost ON "Deal";
CREATE TRIGGER trigger_auto_create_analysis_task_on_deal_lost
  AFTER UPDATE OF stage ON "Deal"
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_analysis_task_on_deal_lost();

-- ============================================
-- PART 4: INVOICE OVERDUE → OTOMATIK HATIRLATMA GÖREVİ
-- ============================================
CREATE OR REPLACE FUNCTION auto_create_reminder_task_on_invoice_overdue()
RETURNS TRIGGER AS $$
DECLARE
  task_id UUID;
  customer_name TEXT;
BEGIN
  -- Invoice OVERDUE olduğunda
  IF NEW.status = 'OVERDUE' AND (OLD.status IS NULL OR OLD.status != 'OVERDUE') THEN
    BEGIN
      -- Müşteri adını al
      SELECT name INTO customer_name FROM "Customer" WHERE id = NEW."customerId" LIMIT 1;

      -- Hatırlatma görevi oluştur
      INSERT INTO "Task" (
        title,
        description,
        status,
        priority,
        "dueDate",
        "relatedTo",
        "relatedId",
        "companyId",
        "createdBy",
        "assignedTo"
      )
      VALUES (
        'Fatura Hatırlatması: ' || NEW."invoiceNumber",
        'Fatura #' || NEW."invoiceNumber" || ' vadesi geçti. Müşteri: ' || COALESCE(customer_name, 'Bilinmiyor') || '. Lütfen müşteri ile iletişime geçin.',
        'TODO',
        'HIGH',
        CURRENT_DATE + INTERVAL '1 day', -- 1 gün içinde hatırlat
        'Invoice',
        NEW.id,
        NEW."companyId",
        NEW."createdBy",
        NEW."assignedTo"
      )
      RETURNING id INTO task_id;

      -- Notification
      INSERT INTO "Notification" (title, message, type, "relatedTo", "relatedId", "companyId", "userId", link, priority)
      VALUES (
        '⚠️ Fatura Vadesi Geçti - Hatırlatma Görevi',
        'Fatura #' || NEW."invoiceNumber" || ' vadesi geçti. Hatırlatma görevi oluşturuldu.',
        'error',
        'Task',
        task_id,
        NEW."companyId",
        NEW."assignedTo",
        '/tr/tasks/' || task_id,
        'high'
      ) ON CONFLICT DO NOTHING;

      RAISE NOTICE 'Reminder task created for overdue invoice %', NEW.id;

    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to create reminder task for invoice %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_create_reminder_task_on_invoice_overdue ON "Invoice";
CREATE TRIGGER trigger_auto_create_reminder_task_on_invoice_overdue
  AFTER UPDATE OF status ON "Invoice"
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_reminder_task_on_invoice_overdue();

-- ============================================
-- PART 5: PRODUCT DÜŞÜK STOK → OTOMATIK SATIN ALMA GÖREVİ
-- ============================================
CREATE OR REPLACE FUNCTION auto_create_purchase_task_on_low_stock()
RETURNS TRIGGER AS $$
DECLARE
  task_id UUID;
  existing_task_id UUID;
BEGIN
  -- Stok minimum seviyenin altına düştüğünde
  IF NEW.stock IS NOT NULL AND NEW."minimumStock" IS NOT NULL 
     AND NEW.stock <= NEW."minimumStock" 
     AND (OLD.stock IS NULL OR OLD.stock > OLD."minimumStock") THEN
    BEGIN
      -- Zaten benzer bir görev var mı kontrol et (son 7 günde)
      SELECT id INTO existing_task_id
      FROM "Task"
      WHERE "relatedTo" = 'Product'
        AND "relatedId" = NEW.id
        AND title LIKE 'Satın Alma:%'
        AND status != 'COMPLETED'
        AND "createdAt" >= NOW() - INTERVAL '7 days'
      LIMIT 1;

      -- Eğer yoksa yeni görev oluştur
      IF existing_task_id IS NULL THEN
        INSERT INTO "Task" (
          title,
          description,
          status,
          priority,
          "dueDate",
          "relatedTo",
          "relatedId",
          "companyId",
          "createdBy",
          "assignedTo"
        )
        VALUES (
          'Satın Alma: ' || NEW.name,
          'Ürün "' || NEW.name || '" stoku kritik seviyede (' || NEW.stock || '). Minimum stok: ' || NEW."minimumStock" || '. Lütfen satın alma işlemi yapın.',
          'TODO',
          'HIGH',
          CURRENT_DATE + INTERVAL '3 days', -- 3 gün içinde satın al
          'Product',
          NEW.id,
          NEW."companyId",
          (SELECT id FROM "User" WHERE "companyId" = NEW."companyId" AND role IN ('ADMIN', 'SUPER_ADMIN') LIMIT 1),
          (SELECT id FROM "User" WHERE "companyId" = NEW."companyId" AND role IN ('ADMIN', 'SUPER_ADMIN') LIMIT 1)
        )
        RETURNING id INTO task_id;

        -- Notification (ADMIN'lere)
        INSERT INTO "Notification" (title, message, type, "relatedTo", "relatedId", "companyId", "userId", link, priority)
        SELECT
          '⚠️ Düşük Stok - Satın Alma Gerekli',
          'Ürün "' || NEW.name || '" stoku kritik seviyede. Satın alma görevi oluşturuldu.',
          'warning',
          'Task',
          task_id,
          NEW."companyId",
          u.id,
          '/tr/tasks/' || task_id,
          'high'
        FROM "User" u
        WHERE u."companyId" = NEW."companyId"
          AND u.role IN ('ADMIN', 'SUPER_ADMIN')
        ON CONFLICT DO NOTHING;

        RAISE NOTICE 'Purchase task created for low stock product %', NEW.id;
      ELSE
        RAISE NOTICE 'Purchase task already exists for product %', NEW.id;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to create purchase task for product %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_create_purchase_task_on_low_stock ON "Product";
CREATE TRIGGER trigger_auto_create_purchase_task_on_low_stock
  AFTER UPDATE OF stock ON "Product"
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_purchase_task_on_low_stock();

-- ============================================
-- PART 6: MEETING BİTİNCE → OTOMATIK FOLLOW-UP GÖREVİ
-- ============================================
CREATE OR REPLACE FUNCTION auto_create_followup_task_on_meeting_end()
RETURNS TRIGGER AS $$
DECLARE
  task_id UUID;
  participant_id UUID;
  meeting_ended BOOLEAN;
  meeting_end_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Meeting bitiş zamanını hesapla (meetingDate + meetingDuration)
  IF NEW."meetingDate" IS NOT NULL AND NEW."meetingDuration" IS NOT NULL THEN
    meeting_end_time := NEW."meetingDate" + (NEW."meetingDuration" || ' minutes')::INTERVAL;
  ELSE
    meeting_end_time := NULL;
  END IF;

  -- Meeting bitiş zamanı geçtiyse ve status DONE değilse
  meeting_ended := meeting_end_time IS NOT NULL 
                   AND meeting_end_time < NOW() 
                   AND NEW.status != 'DONE';

  IF meeting_ended AND (
    OLD."meetingDate" IS NULL 
    OR (OLD."meetingDate" + (COALESCE(OLD."meetingDuration", 60) || ' minutes')::INTERVAL) >= NOW() 
    OR OLD.status = 'DONE'
  ) THEN
    BEGIN
      -- Her katılımcı için follow-up görevi oluştur
      FOR participant_id IN 
        SELECT "userId" FROM "MeetingParticipant" WHERE "meetingId" = NEW.id
      LOOP
        -- Zaten benzer bir görev var mı kontrol et
        IF NOT EXISTS (
          SELECT 1 FROM "Task"
          WHERE "relatedTo" = 'Meeting'
            AND "relatedId" = NEW.id
            AND "assignedTo" = participant_id
            AND title LIKE 'Görüşme Takibi:%'
            AND status != 'COMPLETED'
            AND "createdAt" >= NOW() - INTERVAL '1 day'
        ) THEN
          INSERT INTO "Task" (
            title,
            description,
            status,
            priority,
            "dueDate",
            "relatedTo",
            "relatedId",
            "companyId",
            "createdBy",
            "assignedTo"
          )
          VALUES (
            'Görüşme Takibi: ' || NEW.title,
            'Görüşme "' || NEW.title || '" tamamlandı. Lütfen görüşme notlarını gözden geçirin ve gerekli aksiyonları alın.',
            'TODO',
            'NORMAL',
            CURRENT_DATE + INTERVAL '2 days', -- 2 gün içinde takip
            'Meeting',
            NEW.id,
            NEW."companyId",
            participant_id,
            participant_id
          )
          RETURNING id INTO task_id;

          -- Notification
          INSERT INTO "Notification" (title, message, type, "relatedTo", "relatedId", "companyId", "userId", link)
          VALUES (
            '📋 Görüşme Takibi Gerekli',
            'Görüşme "' || NEW.title || '" tamamlandı. Takip görevi oluşturuldu.',
            'info',
            'Task',
            task_id,
            NEW."companyId",
            participant_id,
            '/tr/tasks/' || task_id
          ) ON CONFLICT DO NOTHING;

          RAISE NOTICE 'Follow-up task created for meeting % (participant %)', NEW.id, participant_id;
        END IF;
      END LOOP;

    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to create follow-up task for meeting %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_create_followup_task_on_meeting_end ON "Meeting";
CREATE TRIGGER trigger_auto_create_followup_task_on_meeting_end
  AFTER UPDATE OF "meetingDate", "meetingDuration", status ON "Meeting"
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_followup_task_on_meeting_end();

-- ============================================
-- PART 7: TICKET RESOLVED → OTOMATIK MEMNUNİYET ANKETİ GÖREVİ
-- ============================================
CREATE OR REPLACE FUNCTION auto_create_satisfaction_task_on_ticket_resolved()
RETURNS TRIGGER AS $$
DECLARE
  task_id UUID;
  customer_id UUID;
BEGIN
  -- Ticket RESOLVED olduğunda
  IF NEW.status = 'RESOLVED' AND (OLD.status IS NULL OR OLD.status != 'RESOLVED') THEN
    BEGIN
      customer_id := NEW."customerId";

      IF customer_id IS NOT NULL THEN
        -- Memnuniyet anketi görevi oluştur
        INSERT INTO "Task" (
          title,
          description,
          status,
          priority,
          "dueDate",
          "relatedTo",
          "relatedId",
          "companyId",
          "createdBy",
          "assignedTo"
        )
        VALUES (
          'Müşteri Memnuniyeti: Ticket #' || NEW."ticketNumber",
          'Ticket #' || NEW."ticketNumber" || ' çözüldü. Lütfen müşteri ile iletişime geçip memnuniyet anketi yapın.',
          'TODO',
          'NORMAL',
          CURRENT_DATE + INTERVAL '3 days', -- 3 gün içinde anket
          'Ticket',
          NEW.id,
          NEW."companyId",
          NEW."createdBy",
          NEW."assignedTo"
        )
        RETURNING id INTO task_id;

        -- Notification
        INSERT INTO "Notification" (title, message, type, "relatedTo", "relatedId", "companyId", "userId", link)
        VALUES (
          '📊 Müşteri Memnuniyeti Anketi',
          'Ticket #' || NEW."ticketNumber" || ' çözüldü. Memnuniyet anketi görevi oluşturuldu.',
          'info',
          'Task',
          task_id,
          NEW."companyId",
          NEW."assignedTo",
          '/tr/tasks/' || task_id
        ) ON CONFLICT DO NOTHING;

        RAISE NOTICE 'Satisfaction task created for resolved ticket %', NEW.id;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to create satisfaction task for ticket %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_create_satisfaction_task_on_ticket_resolved ON "Ticket";
CREATE TRIGGER trigger_auto_create_satisfaction_task_on_ticket_resolved
  AFTER UPDATE OF status ON "Ticket"
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_satisfaction_task_on_ticket_resolved();

-- ============================================
-- PART 8: DEAL CONTACTED → OTOMATIK DEMO TAKVİMİ ÖNERİSİ
-- ============================================
CREATE OR REPLACE FUNCTION auto_suggest_demo_on_deal_contacted()
RETURNS TRIGGER AS $$
DECLARE
  task_id UUID;
BEGIN
  -- Deal CONTACTED olduğunda ve henüz demo yoksa
  IF NEW.stage = 'CONTACTED' AND (OLD.stage IS NULL OR OLD.stage != 'CONTACTED') THEN
    BEGIN
      -- Demo takvimi önerisi görevi oluştur
      INSERT INTO "Task" (
        title,
        description,
        status,
        priority,
        "dueDate",
        "relatedTo",
        "relatedId",
        "companyId",
        "createdBy",
        "assignedTo"
      )
      VALUES (
        'Demo Planla: ' || COALESCE(NEW.title, 'Başlıksız'),
        'Fırsat "' || COALESCE(NEW.title, 'Başlıksız') || '" CONTACTED aşamasına geçti. Müşteri ile demo görüşmesi planlayın.',
        'TODO',
        'HIGH',
        CURRENT_DATE + INTERVAL '3 days', -- 3 gün içinde demo planla
        'Deal',
        NEW.id,
        NEW."companyId",
        NEW."createdBy",
        NEW."assignedTo"
      )
      RETURNING id INTO task_id;

      -- Notification
      INSERT INTO "Notification" (title, message, type, "relatedTo", "relatedId", "companyId", "userId", link, priority)
      VALUES (
        '📅 Demo Planlama Gerekli',
        'Fırsat "' || COALESCE(NEW.title, 'Başlıksız') || '" için demo planlama görevi oluşturuldu.',
        'info',
        'Task',
        task_id,
        NEW."companyId",
        NEW."assignedTo",
        '/tr/tasks/' || task_id,
        'high'
      ) ON CONFLICT DO NOTHING;

      RAISE NOTICE 'Demo suggestion task created for deal %', NEW.id;

    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to create demo suggestion task for deal %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_suggest_demo_on_deal_contacted ON "Deal";
CREATE TRIGGER trigger_auto_suggest_demo_on_deal_contacted
  AFTER UPDATE OF stage ON "Deal"
  FOR EACH ROW
  EXECUTE FUNCTION auto_suggest_demo_on_deal_contacted();

-- ============================================
-- PART 9: CONTRACT ACTIVE (RECURRING) → OTOMATIK PERİYODİK INVOICE
-- ============================================
CREATE OR REPLACE FUNCTION auto_create_recurring_invoice_on_contract_active()
RETURNS TRIGGER AS $$
DECLARE
  invoice_id UUID;
  invoice_number VARCHAR;
  next_invoice_date DATE;
BEGIN
  -- Contract ACTIVE olduğunda ve periyodik faturalandırma varsa (billingCycle MONTHLY/QUARTERLY/YEARLY)
  IF NEW.status = 'ACTIVE' 
     AND (OLD.status IS NULL OR OLD.status != 'ACTIVE') 
     AND NEW."billingCycle" IN ('MONTHLY', 'QUARTERLY', 'YEARLY') THEN
    BEGIN
      -- İlk faturayı oluştur
      IF NOT EXISTS (SELECT 1 FROM "Invoice" WHERE "contractId" = NEW.id) THEN
        invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(
          COALESCE(
            (SELECT MAX(CAST(SUBSTRING("invoiceNumber" FROM '[0-9]+$') AS INTEGER)) 
             FROM "Invoice" 
             WHERE "invoiceNumber" LIKE 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-%'), 
            0
          ) + 1, 
          4, 
          '0'
        );

        -- Billing cycle'e göre sonraki fatura tarihini hesapla
        CASE NEW."billingCycle"
          WHEN 'MONTHLY' THEN next_invoice_date := NEW."startDate" + INTERVAL '1 month';
          WHEN 'QUARTERLY' THEN next_invoice_date := NEW."startDate" + INTERVAL '3 months';
          WHEN 'YEARLY' THEN next_invoice_date := NEW."startDate" + INTERVAL '1 year';
          ELSE next_invoice_date := NEW."startDate" + INTERVAL '1 month';
        END CASE;

        INSERT INTO "Invoice" (
          "invoiceNumber",
          title,
          "customerId",
          "customerCompanyId",
          "contractId",
          "issueDate",
          "dueDate",
          "totalAmount",
          "taxRate",
          "grandTotal",
          status,
          notes,
          "companyId",
          "createdBy"
        )
        VALUES (
          invoice_number,
          'Fatura - ' || COALESCE(NEW.title, 'Başlıksız') || ' (Periyodik)',
          NEW."customerId",
          NEW."customerCompanyId",
          NEW.id,
          NEW."startDate",
          next_invoice_date,
          NEW.value,
          NEW."taxRate",
          NEW."totalValue",
          'DRAFT',
          'Sözleşme #' || NEW."contractNumber" || ' için otomatik oluşturuldu (Periyodik)',
          NEW."companyId",
          NEW."createdBy"
        )
        RETURNING id INTO invoice_id;

        -- ActivityLog
        INSERT INTO "ActivityLog" (entity, action, description, meta, "companyId", "userId")
        VALUES (
          'Invoice',
          'CREATE',
          'Periyodik sözleşme aktif edildi, ilk fatura oluşturuldu: ' || invoice_number,
          jsonb_build_object(
            'contractId', NEW.id,
            'contractNumber', NEW."contractNumber",
            'invoiceId', invoice_id,
            'invoiceNumber', invoice_number,
            'billingCycle', NEW."billingCycle"
          ),
          NEW."companyId",
          NEW."createdBy"
        );

        -- Notification
        INSERT INTO "Notification" (title, message, type, "relatedTo", "relatedId", "companyId", "userId", link)
        VALUES (
          '💰 Periyodik Fatura Oluşturuldu',
          'Sözleşme #' || NEW."contractNumber" || ' için ilk periyodik fatura #' || invoice_number || ' oluşturuldu.',
          'success',
          'Invoice',
          invoice_id,
          NEW."companyId",
          NEW."createdBy",
          '/tr/invoices/' || invoice_id
        ) ON CONFLICT DO NOTHING;

        RAISE NOTICE 'Recurring invoice created for contract %: %', NEW.id, invoice_id;
      ELSE
        RAISE NOTICE 'Invoice already exists for contract %', NEW.id;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to create recurring invoice for contract %: %', NEW.id, SQLERRM;
      
      -- Hata bildirimi
      INSERT INTO "Notification" (title, message, type, "relatedTo", "relatedId", "companyId", "userId", link)
      VALUES (
        '❌ Periyodik Fatura Oluşturulamadı',
        'Sözleşme #' || NEW."contractNumber" || ' için periyodik fatura oluşturulurken bir hata oluştu: ' || SQLERRM || '. Lütfen manuel olarak oluşturun.',
        'error',
        'Contract',
        NEW.id,
        NEW."companyId",
        NEW."createdBy",
        '/tr/contracts/' || NEW.id
      ) ON CONFLICT DO NOTHING;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_create_recurring_invoice_on_contract_active ON "Contract";
CREATE TRIGGER trigger_auto_create_recurring_invoice_on_contract_active
  AFTER UPDATE OF status ON "Contract"
  FOR EACH ROW
  WHEN (NEW."billingCycle" IN ('MONTHLY', 'QUARTERLY', 'YEARLY')) -- Sadece periyodik faturalandırma olan sözleşmeler için
  EXECUTE FUNCTION auto_create_recurring_invoice_on_contract_active();

-- ============================================
-- PART 10: CUSTOMER VIP → OTOMATIK ÖZEL SEGMENT ATAMA
-- ============================================
-- Önce Customer tablosuna type kolonu ekle (eğer yoksa)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Customer' AND column_name = 'type'
  ) THEN
    ALTER TABLE "Customer" ADD COLUMN type VARCHAR(50) DEFAULT 'LEAD';
    -- type değerleri: LEAD, ACTIVE, VIP, LOST
    RAISE NOTICE 'Customer.type kolonu eklendi';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION auto_assign_vip_segment()
RETURNS TRIGGER AS $$
DECLARE
  vip_segment_id UUID;
BEGIN
  -- Customer VIP olduğunda
  IF NEW.type = 'VIP' AND (OLD.type IS NULL OR OLD.type != 'VIP') THEN
    BEGIN
      -- VIP segmentini bul veya oluştur
      SELECT id INTO vip_segment_id
      FROM "CustomerSegment"
      WHERE "companyId" = NEW."companyId"
        AND name = 'VIP Müşteriler'
      LIMIT 1;

      -- Eğer yoksa oluştur
      IF vip_segment_id IS NULL THEN
        INSERT INTO "CustomerSegment" (
          name,
          description,
          "autoAssign",
          criteria,
          "companyId",
          "createdBy"
        )
        VALUES (
          'VIP Müşteriler',
          'VIP müşteriler için otomatik segment',
          true,
          jsonb_build_object('type', 'VIP'),
          NEW."companyId",
          (SELECT id FROM "User" WHERE "companyId" = NEW."companyId" AND role IN ('ADMIN', 'SUPER_ADMIN') LIMIT 1)
        )
        RETURNING id INTO vip_segment_id;
      END IF;

      -- Müşteriyi segmente ekle (eğer yoksa)
      IF NOT EXISTS (
        SELECT 1 FROM "SegmentMember"
        WHERE "segmentId" = vip_segment_id
          AND "customerId" = NEW.id
      ) THEN
        INSERT INTO "SegmentMember" (
          "segmentId",
          "customerId",
          "companyId"
        )
        VALUES (
          vip_segment_id,
          NEW.id,
          NEW."companyId"
        );

        -- Segment member count'u güncelle
        UPDATE "CustomerSegment"
        SET "memberCount" = (
          SELECT COUNT(*) FROM "SegmentMember"
          WHERE "segmentId" = vip_segment_id
        )
        WHERE id = vip_segment_id;

        RAISE NOTICE 'VIP customer % assigned to VIP segment %', NEW.id, vip_segment_id;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to assign VIP segment for customer %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_assign_vip_segment ON "Customer";
CREATE TRIGGER trigger_auto_assign_vip_segment
  AFTER UPDATE OF type ON "Customer"
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_vip_segment();

-- ============================================
-- ÖZET VE YORUMLAR
-- ============================================

COMMENT ON FUNCTION auto_create_shipment_on_invoice_sent IS 'Fatura gönderildiğinde otomatik sevkiyat oluşturur';
COMMENT ON FUNCTION auto_suggest_revision_on_quote_rejected IS 'Teklif reddedildiğinde otomatik revizyon görevi oluşturur';
COMMENT ON FUNCTION auto_create_analysis_task_on_deal_lost IS 'Fırsat kaybedildiğinde otomatik analiz görevi oluşturur';
COMMENT ON FUNCTION auto_create_reminder_task_on_invoice_overdue IS 'Fatura vadesi geçtiğinde otomatik hatırlatma görevi oluşturur';
COMMENT ON FUNCTION auto_create_purchase_task_on_low_stock IS 'Ürün stoku düşük olduğunda otomatik satın alma görevi oluşturur';
COMMENT ON FUNCTION auto_create_followup_task_on_meeting_end IS 'Görüşme bittiğinde otomatik takip görevi oluşturur';
COMMENT ON FUNCTION auto_create_satisfaction_task_on_ticket_resolved IS 'Ticket çözüldüğünde otomatik memnuniyet anketi görevi oluşturur';
COMMENT ON FUNCTION auto_suggest_demo_on_deal_contacted IS 'Fırsat CONTACTED olduğunda otomatik demo planlama görevi oluşturur';
COMMENT ON FUNCTION auto_create_recurring_invoice_on_contract_active IS 'Periyodik sözleşme aktif edildiğinde otomatik fatura oluşturur';
COMMENT ON FUNCTION auto_assign_vip_segment IS 'Müşteri VIP olduğunda otomatik VIP segmentine atar';

-- ============================================
-- TAMAMLANDI!
-- ============================================

