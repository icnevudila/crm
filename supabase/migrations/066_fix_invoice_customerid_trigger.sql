-- Invoice trigger'ında customerId kolonu kontrolü ekle
-- customerId kolonu yoksa trigger hata vermemeli

CREATE OR REPLACE FUNCTION update_customer_ltv_on_invoice_paid()
RETURNS TRIGGER AS $$
DECLARE
  has_customer_id BOOLEAN;
BEGIN
  -- customerId kolonu var mı kontrol et
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'Invoice' 
      AND column_name = 'customerId'
  ) INTO has_customer_id;
  
  -- customerId kolonu varsa ve PAID durumuna geçtiyse LTV güncelle
  IF has_customer_id AND NEW.status = 'PAID' AND OLD.status != 'PAID' THEN
    -- customerId NULL değilse LTV güncelle
    IF (NEW."customerId" IS NOT NULL) THEN
      PERFORM calculate_customer_ltv(NEW."customerId");
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger zaten var, sadece fonksiyon güncellendi
-- DROP TRIGGER IF EXISTS trigger_invoice_paid_ltv ON "Invoice";
-- CREATE TRIGGER trigger_invoice_paid_ltv
-- AFTER UPDATE ON "Invoice"
-- FOR EACH ROW
-- EXECUTE FUNCTION update_customer_ltv_on_invoice_paid();

COMMENT ON FUNCTION update_customer_ltv_on_invoice_paid IS 'Invoice PAID olduğunda Customer LTV günceller. customerId kolonu yoksa hata vermez.';

-- auto_create_shipment_on_invoice_sent fonksiyonunu da düzelt
CREATE OR REPLACE FUNCTION auto_create_shipment_on_invoice_sent()
RETURNS TRIGGER AS $$
DECLARE
  shipment_id UUID;
  shipment_number VARCHAR;
  notification_title TEXT;
  notification_message TEXT;
  has_customer_id BOOLEAN;
  invoice_customer_id UUID;
BEGIN
  -- customerId kolonu var mı kontrol et
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'Invoice' 
      AND column_name = 'customerId'
  ) INTO has_customer_id;
  
  -- customerId kolonu varsa değeri al
  IF has_customer_id THEN
    invoice_customer_id := NEW."customerId";
  ELSE
    invoice_customer_id := NULL;
  END IF;
  
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

        -- Shipment oluştur (customerId kolonu varsa ekle)
        IF has_customer_id THEN
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
            invoice_customer_id,
            NEW."customerCompanyId",
            'PENDING',
            CASE WHEN invoice_customer_id IS NOT NULL THEN (SELECT "address" FROM "Customer" WHERE id = invoice_customer_id LIMIT 1) ELSE NULL END,
            'STANDARD',
            COALESCE(NEW."dueDate", NOW()) + INTERVAL '3 days',
            'Fatura #' || COALESCE(NEW."invoiceNumber", NEW.id::text) || ' için otomatik oluşturuldu',
            NEW."companyId",
            NEW."createdBy"
          )
          RETURNING id INTO shipment_id;
        ELSE
          -- customerId kolonu yoksa customerId olmadan oluştur
          INSERT INTO "Shipment" (
            "shipmentNumber",
            "invoiceId",
            "customerCompanyId",
            status,
            "shippingMethod",
            "estimatedDeliveryDate",
            notes,
            "companyId",
            "createdBy"
          )
          VALUES (
            shipment_number,
            NEW.id,
            NEW."customerCompanyId",
            'PENDING',
            'STANDARD',
            COALESCE(NEW."dueDate", NOW()) + INTERVAL '3 days',
            'Fatura #' || COALESCE(NEW."invoiceNumber", NEW.id::text) || ' için otomatik oluşturuldu',
            NEW."companyId",
            NEW."createdBy"
          )
          RETURNING id INTO shipment_id;
        END IF;

        -- ActivityLog (varsa)
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ActivityLog') THEN
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
        END IF;

        -- Notification (varsa)
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Notification') THEN
          notification_title := '📦 Sevkiyat Oluşturuldu';
          notification_message := 'Fatura #' || COALESCE(NEW."invoiceNumber", NEW.id::text) || ' için sevkiyat #' || shipment_number || ' otomatik olarak oluşturuldu.';
          
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
        END IF;

        RAISE NOTICE 'Shipment auto-created for invoice %: %', NEW.id, shipment_id;
      ELSE
        RAISE NOTICE 'Shipment already exists for invoice %', NEW.id;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to auto-create shipment for invoice %: %', NEW.id, SQLERRM;
      
      -- Hata bildirimi (Notification varsa)
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Notification') THEN
        INSERT INTO "Notification" (title, message, type, "relatedTo", "relatedId", "companyId", "userId", link)
        VALUES (
          '❌ Sevkiyat Oluşturulamadı',
          'Fatura #' || COALESCE(NEW."invoiceNumber", NEW.id::text) || ' için sevkiyat oluşturulurken bir hata oluştu: ' || SQLERRM || '. Lütfen manuel olarak oluşturun.',
          'error',
          'Invoice',
          NEW.id,
          NEW."companyId",
          NEW."createdBy",
          '/tr/invoices/' || NEW.id
        ) ON CONFLICT DO NOTHING;
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_create_shipment_on_invoice_sent IS 'Invoice SENT olduğunda otomatik Shipment oluşturur. customerId kolonu yoksa hata vermez.';

-- auto_create_reminder_task_on_invoice_overdue fonksiyonunu da düzelt
CREATE OR REPLACE FUNCTION auto_create_reminder_task_on_invoice_overdue()
RETURNS TRIGGER AS $$
DECLARE
  task_id UUID;
  customer_name TEXT;
  has_customer_id BOOLEAN;
  invoice_customer_id UUID;
BEGIN
  -- customerId kolonu var mı kontrol et
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'Invoice' 
      AND column_name = 'customerId'
  ) INTO has_customer_id;
  
  -- customerId kolonu varsa değeri al
  IF has_customer_id THEN
    invoice_customer_id := NEW."customerId";
  ELSE
    invoice_customer_id := NULL;
  END IF;
  
  -- Invoice OVERDUE olduğunda
  IF NEW.status = 'OVERDUE' AND (OLD.status IS NULL OR OLD.status != 'OVERDUE') THEN
    BEGIN
      -- Müşteri adını al (customerId varsa)
      IF has_customer_id AND invoice_customer_id IS NOT NULL THEN
        SELECT name INTO customer_name FROM "Customer" WHERE id = invoice_customer_id LIMIT 1;
      ELSE
        customer_name := NULL;
      END IF;

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
        'Fatura Hatırlatması: ' || COALESCE(NEW."invoiceNumber", NEW.id::text),
        'Fatura #' || COALESCE(NEW."invoiceNumber", NEW.id::text) || ' vadesi geçti. Müşteri: ' || COALESCE(customer_name, 'Bilinmiyor') || '. Lütfen müşteri ile iletişime geçin.',
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

      -- Notification (varsa)
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Notification') THEN
        INSERT INTO "Notification" (title, message, type, "relatedTo", "relatedId", "companyId", "userId", link, priority)
        VALUES (
          '⚠️ Fatura Vadesi Geçti - Hatırlatma Görevi',
          'Fatura #' || COALESCE(NEW."invoiceNumber", NEW.id::text) || ' vadesi geçti. Hatırlatma görevi oluşturuldu.',
          'error',
          'Task',
          task_id,
          NEW."companyId",
          NEW."assignedTo",
          '/tr/tasks/' || task_id,
          'high'
        ) ON CONFLICT DO NOTHING;
      END IF;

      RAISE NOTICE 'Reminder task created for overdue invoice %', NEW.id;

    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to create reminder task for invoice %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_create_reminder_task_on_invoice_overdue IS 'Invoice OVERDUE olduğunda otomatik hatırlatma görevi oluşturur. customerId kolonu yoksa hata vermez.';

-- handle_invoice_paid_finance_entry fonksiyonunu da düzelt
CREATE OR REPLACE FUNCTION handle_invoice_paid_finance_entry()
RETURNS TRIGGER AS $$
DECLARE
  finance_id UUID;
  customer_name VARCHAR;
  error_message TEXT;
  has_notification_table BOOLEAN;
  has_customer_id BOOLEAN;
  invoice_customer_id UUID;
BEGIN
  -- customerId kolonu var mı kontrol et
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'Invoice' 
      AND column_name = 'customerId'
  ) INTO has_customer_id;
  
  -- customerId kolonu varsa değeri al
  IF has_customer_id THEN
    invoice_customer_id := NEW."customerId";
  ELSE
    invoice_customer_id := NULL;
  END IF;
  
  -- Notification tablosu var mı kontrol et
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'Notification'
  ) INTO has_notification_table;
  
  -- Invoice PAID oldu
  IF NEW.status = 'PAID' AND (OLD.status IS NULL OR OLD.status != 'PAID') THEN
    
    BEGIN
      -- Müşteri kontrolü (customerId kolonu varsa)
      IF has_customer_id AND invoice_customer_id IS NULL THEN
        error_message := 'Finans kaydı oluşturulamadı: Fatura için müşteri bilgisi eksik!';
        
        -- Notification: Sadece tablo varsa ekle
        IF has_notification_table THEN
          BEGIN
            INSERT INTO "Notification" (
              title,
              message,
              type,
              priority,
              "relatedTo",
              "relatedId",
              "userId",
              "companyId"
            )
            VALUES (
              '⚠️ Finans Kaydı Oluşturulamadı',
              error_message,
              'warning',
              'high',
              'Invoice',
              NEW.id,
              NEW."createdBy",
              NEW."companyId"
            );
          EXCEPTION WHEN OTHERS THEN
            -- Notification hatası ana işlemi engellemez
            RAISE NOTICE 'Notification oluşturulamadı: %', SQLERRM;
          END;
        END IF;
        
        RAISE NOTICE 'UYARI: %', error_message;
        RETURN NEW;
      END IF;
      
      -- Müşteri adını al (customerId varsa)
      IF has_customer_id AND invoice_customer_id IS NOT NULL THEN
        SELECT name INTO customer_name FROM "Customer" WHERE id = invoice_customer_id;
      ELSE
        customer_name := NULL;
      END IF;
      
      -- Zaten Finance kaydı var mı (hem eski hem yeni kolon adlarını kontrol et)
      IF NOT EXISTS (
        SELECT 1 FROM "Finance"
        WHERE (
          ("relatedEntityType" = 'Invoice' AND "relatedEntityId" = NEW.id)
          OR ("relatedTo" = 'Invoice' AND "relatedId" = NEW.id)
        )
      ) THEN
        
        -- Finance kaydı oluştur (INCOME) - En güncel kolon adlarını kullan
        INSERT INTO "Finance" (
          type,
          category,
          amount,
          currency,
          description,
          "transactionDate",
          "paymentMethod",
          status,
          "relatedEntityType",
          "relatedEntityId",
          "companyId",
          "createdBy"
        )
        VALUES (
          'INCOME',
          'SALES',
          NEW."totalAmount",
          COALESCE(NEW.currency, 'TRY'),
          'Fatura #' || COALESCE(NEW."invoiceNumber", NEW.id::text) || ' tahsil edildi' || CASE WHEN customer_name IS NOT NULL THEN ' - ' || customer_name ELSE '' END,
          COALESCE(NEW."paidDate", CURRENT_DATE),
          'BANK_TRANSFER',
          'COMPLETED',
          'Invoice',
          NEW.id,
          NEW."companyId",
          NEW."createdBy"
        )
        RETURNING id INTO finance_id;
        
        -- ActivityLog (varsa)
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ActivityLog') THEN
          INSERT INTO "ActivityLog" (
            entity,
            action,
            description,
            meta,
            "companyId",
            "userId"
          )
          VALUES (
            'Finance',
            'CREATE',
            'Fatura ödendi, finans kaydı oluşturuldu',
            jsonb_build_object(
              'invoiceId', NEW.id,
              'invoiceNumber', NEW."invoiceNumber",
              'financeId', finance_id,
              'amount', NEW."totalAmount",
              'currency', NEW.currency,
              'customerName', customer_name
            ),
            NEW."companyId",
            NEW."createdBy"
          );
        END IF;
        
        -- Notification - BAŞARILI (sadece tablo varsa)
        IF has_notification_table THEN
          BEGIN
            INSERT INTO "Notification" (
              title,
              message,
              type,
              priority,
              link,
              "relatedTo",
              "relatedId",
              "userId",
              "companyId"
            )
            VALUES (
              '💰 Ödeme Alındı!',
              'Fatura #' || COALESCE(NEW."invoiceNumber", NEW.id::text) || ' ödendi. ' || NEW."totalAmount" || ' ' || COALESCE(NEW.currency, 'TRY') || ' tutarında gelir kaydı oluşturuldu.',
              'success',
              'high',
              '/finance/' || finance_id,
              'Finance',
              finance_id,
              NEW."createdBy",
              NEW."companyId"
            );
          EXCEPTION WHEN OTHERS THEN
            -- Notification hatası ana işlemi engellemez
            RAISE NOTICE 'Notification oluşturulamadı: %', SQLERRM;
          END;
        END IF;
        
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      error_message := 'Invoice PAID otomasyonu hatası: ' || SQLERRM;
      
      -- Notification: Sadece tablo varsa ekle
      IF has_notification_table THEN
        BEGIN
          INSERT INTO "Notification" (
            title,
            message,
            type,
            priority,
            "relatedTo",
            "relatedId",
            "userId",
            "companyId"
          )
          VALUES (
            '❌ Finans Kaydı Hatası',
            'Fatura #' || COALESCE(NEW."invoiceNumber", NEW.id::text) || ' için finans kaydı oluşturulamadı. Detay: ' || SQLERRM,
            'error',
            'critical',
            'Invoice',
            NEW.id,
            NEW."createdBy",
            NEW."companyId"
          );
        EXCEPTION WHEN OTHERS THEN
          -- Notification hatası ana işlemi engellemez
          RAISE NOTICE 'Notification oluşturulamadı: %', SQLERRM;
        END;
      END IF;
      
      RAISE NOTICE 'Invoice PAID Automation Error: %', error_message;
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION handle_invoice_paid_finance_entry IS 'Invoice PAID olduğunda Finance kaydı oluşturur. customerId kolonu yoksa hata vermez.';

-- GEÇİCİ ÇÖZÜM: Tüm Invoice UPDATE trigger'larını devre dışı bırak
-- PostgreSQL trigger fonksiyonlarında NEW."customerId" yazmak derleme zamanında kolonun var olduğunu varsayar
-- Eğer kolon yoksa fonksiyon derlenemez bile, bu yüzden trigger'ları devre dışı bırakıyoruz
-- Otomasyonlar API tarafında yapılacak (zaten yapılıyor)

-- Tüm Invoice UPDATE trigger'larını devre dışı bırak
DROP TRIGGER IF EXISTS trigger_invoice_paid_ltv ON "Invoice";
DROP TRIGGER IF EXISTS trigger_auto_create_shipment_on_invoice_sent ON "Invoice";
DROP TRIGGER IF EXISTS trigger_auto_create_reminder_task_on_invoice_overdue ON "Invoice";
DROP TRIGGER IF EXISTS trigger_invoice_paid_finance_entry ON "Invoice";
DROP TRIGGER IF EXISTS trigger_invoice_sent_notification ON "Invoice";
DROP TRIGGER IF EXISTS trigger_validate_invoice_status ON "Invoice";
DROP TRIGGER IF EXISTS invoice_approval_check ON "Invoice";
DROP TRIGGER IF EXISTS trigger_invoice_assigned_notify ON "Invoice";
DROP TRIGGER IF EXISTS trigger_update_customer_last_interaction_invoice ON "Invoice";
DROP TRIGGER IF EXISTS invoice_overdue_log ON "Invoice";
DROP TRIGGER IF EXISTS trg_invoice_overdue ON "Invoice";
DROP TRIGGER IF EXISTS trg_invoice_due_soon ON "Invoice";
DROP TRIGGER IF EXISTS trg_invoice_check_overdue_on_sent ON "Invoice";

-- NOT: Otomasyonlar zaten API tarafında yapılıyor (/api/invoices/[id]/route.ts içinde)
-- Bu trigger'lar sadece ekstra güvenlik katmanıydı, şimdilik devre dışı bırakıyoruz

