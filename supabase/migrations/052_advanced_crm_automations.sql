-- ============================================
-- 052_advanced_crm_automations.sql
-- İLERİ SEVİYE CRM OTOMASYONLARI
-- ============================================
-- Bu dosya şunları yapar:
-- 1. Contract yenileme otomasyonu (auto-renew)
-- 2. Periyodik Invoice otomasyonu (recurring invoices)
-- 3. Shipment tracking otomasyonu
-- 4. Document expiration takibi
-- 5. Deal win probability otomatik güncelleme
-- 6. Customer churn risk hesaplama
-- 7. Task completion sonrası otomasyonlar
-- 8. Meeting no-show takibi
-- 9. Ticket escalation otomasyonu
-- 10. Quote expiration uyarıları (7 gün kala)
-- ============================================

-- ============================================
-- PART 1: CONTRACT YENİLEME OTOMASYONU (Auto-Renew)
-- ============================================
CREATE OR REPLACE FUNCTION auto_renew_contracts()
RETURNS VOID AS $$
DECLARE
  contract_record RECORD;
  new_contract_id UUID;
  new_contract_number VARCHAR;
BEGIN
  -- Yenileme tarihi gelmiş ve auto-renew aktif olan sözleşmeleri yenile
  FOR contract_record IN
    SELECT *
    FROM "Contract"
    WHERE status = 'ACTIVE'
      AND "autoRenewEnabled" = true
      AND "nextRenewalDate" IS NOT NULL
      AND "nextRenewalDate" <= CURRENT_DATE
      AND "renewalType" = 'AUTO'
  LOOP
    BEGIN
      -- Yeni sözleşme numarası oluştur
      new_contract_number := 'SOZL-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(
        COALESCE(
          (SELECT MAX(CAST(SUBSTRING("contractNumber" FROM '[0-9]+$') AS INTEGER)) 
           FROM "Contract" 
           WHERE "contractNumber" LIKE 'SOZL-' || TO_CHAR(NOW(), 'YYYY') || '-%'), 
          0
        ) + 1, 
        4, 
        '0'
      );

      -- Yeni sözleşme oluştur (eski sözleşmenin bilgileriyle)
      INSERT INTO "Contract" (
        "contractNumber",
        title,
        description,
        "customerId",
        "customerCompanyId",
        "dealId",
        type,
        category,
        "startDate",
        "endDate",
        "renewalType",
        "renewalNoticeDays",
        "nextRenewalDate",
        "autoRenewEnabled",
        "billingCycle",
        "billingDay",
        "paymentTerms",
        value,
        currency,
        "taxRate",
        "totalValue",
        status,
        terms,
        notes,
        "companyId",
        "createdBy"
      )
      VALUES (
        new_contract_number,
        contract_record.title || ' (Yenilendi)',
        contract_record.description || ' - ' || contract_record."contractNumber" || ' sözleşmesinden otomatik yenilendi',
        contract_record."customerId",
        contract_record."customerCompanyId",
        contract_record."dealId",
        contract_record.type,
        contract_record.category,
        contract_record."endDate" + INTERVAL '1 day', -- Eski bitiş + 1 gün
        contract_record."endDate" + INTERVAL '1 year', -- 1 yıl daha
        contract_record."renewalType",
        contract_record."renewalNoticeDays",
        (contract_record."endDate" + INTERVAL '1 year') - (contract_record."renewalNoticeDays" || ' days')::INTERVAL, -- Yeni yenileme tarihi
        contract_record."autoRenewEnabled",
        contract_record."billingCycle",
        contract_record."billingDay",
        contract_record."paymentTerms",
        contract_record.value,
        contract_record.currency,
        contract_record."taxRate",
        contract_record."totalValue",
        'DRAFT', -- Yeni sözleşme DRAFT olarak başlar
        contract_record.terms,
        'Sözleşme #' || contract_record."contractNumber" || ' otomatik yenilendi',
        contract_record."companyId",
        contract_record."createdBy"
      )
      RETURNING id INTO new_contract_id;

      -- Eski sözleşmeyi RENEWED olarak işaretle
      UPDATE "Contract"
      SET 
        status = 'RENEWED',
        "nextRenewalDate" = NULL,
        notes = COALESCE(notes, '') || ' - ' || new_contract_number || ' ile yenilendi'
      WHERE id = contract_record.id;

      -- ActivityLog
      INSERT INTO "ActivityLog" (entity, action, description, meta, "companyId", "userId")
      VALUES (
        'Contract',
        'RENEW',
        'Sözleşme otomatik yenilendi: ' || contract_record."contractNumber" || ' → ' || new_contract_number,
        jsonb_build_object(
          'oldContractId', contract_record.id,
          'oldContractNumber', contract_record."contractNumber",
          'newContractId', new_contract_id,
          'newContractNumber', new_contract_number
        ),
        contract_record."companyId",
        contract_record."createdBy"
      );

      -- Notification (ADMIN/FINANCE)
      INSERT INTO "Notification" (title, message, type, "relatedTo", "relatedId", "companyId", "userId", link, priority)
      SELECT
        '🔄 Sözleşme Otomatik Yenilendi',
        'Sözleşme #' || contract_record."contractNumber" || ' otomatik olarak yenilendi. Yeni sözleşme: #' || new_contract_number || ' (DRAFT)',
        'success',
        'Contract',
        new_contract_id,
        contract_record."companyId",
        u.id,
        '/tr/contracts/' || new_contract_id,
        'high'
      FROM "User" u
      WHERE u."companyId" = contract_record."companyId"
        AND u.role IN ('ADMIN', 'FINANCE', 'SUPER_ADMIN')
      ON CONFLICT DO NOTHING;

      RAISE NOTICE 'Contract auto-renewed: % → %', contract_record."contractNumber", new_contract_number;

    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to auto-renew contract %: %', contract_record.id, SQLERRM;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_renew_contracts IS 'Yenileme tarihi gelmiş ve auto-renew aktif olan sözleşmeleri otomatik yeniler';

-- ============================================
-- PART 2: PERİYODİK FATURA OTOMASYONU (Recurring Invoices)
-- ============================================
CREATE OR REPLACE FUNCTION create_recurring_invoices()
RETURNS VOID AS $$
DECLARE
  contract_record RECORD;
  invoice_id UUID;
  invoice_number VARCHAR;
  next_invoice_date DATE;
  last_invoice_date DATE;
BEGIN
  -- Periyodik faturalandırma olan aktif sözleşmeler için fatura oluştur
  FOR contract_record IN
    SELECT *
    FROM "Contract"
    WHERE status = 'ACTIVE'
      AND "billingCycle" IN ('MONTHLY', 'QUARTERLY', 'YEARLY')
      AND EXISTS (
        SELECT 1 FROM "Invoice" 
        WHERE "contractId" = "Contract".id 
        ORDER BY "issueDate" DESC 
        LIMIT 1
      )
  LOOP
    BEGIN
      -- Son faturayı bul
      SELECT MAX("issueDate") INTO last_invoice_date
      FROM "Invoice"
      WHERE "contractId" = contract_record.id;

      -- Sonraki fatura tarihini hesapla
      CASE contract_record."billingCycle"
        WHEN 'MONTHLY' THEN 
          next_invoice_date := COALESCE(last_invoice_date, contract_record."startDate") + INTERVAL '1 month';
        WHEN 'QUARTERLY' THEN 
          next_invoice_date := COALESCE(last_invoice_date, contract_record."startDate") + INTERVAL '3 months';
        WHEN 'YEARLY' THEN 
          next_invoice_date := COALESCE(last_invoice_date, contract_record."startDate") + INTERVAL '1 year';
        ELSE 
          next_invoice_date := NULL;
      END CASE;

      -- Eğer sonraki fatura tarihi bugün veya geçmişteyse fatura oluştur
      IF next_invoice_date IS NOT NULL AND next_invoice_date <= CURRENT_DATE THEN
        -- Bu tarihte zaten fatura var mı kontrol et
        IF NOT EXISTS (
          SELECT 1 FROM "Invoice"
          WHERE "contractId" = contract_record.id
            AND "issueDate" = next_invoice_date
        ) THEN
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
            'Fatura - ' || COALESCE(contract_record.title, 'Başlıksız') || ' (Periyodik - ' || contract_record."billingCycle" || ')',
            contract_record."customerId",
            contract_record."customerCompanyId",
            contract_record.id,
            next_invoice_date,
            next_invoice_date + (contract_record."paymentTerms" || ' days')::INTERVAL,
            contract_record.value,
            contract_record."taxRate",
            contract_record."totalValue",
            'DRAFT',
            'Sözleşme #' || contract_record."contractNumber" || ' için periyodik fatura (' || contract_record."billingCycle" || ')',
            contract_record."companyId",
            contract_record."createdBy"
          )
          RETURNING id INTO invoice_id;

          -- ActivityLog
          INSERT INTO "ActivityLog" (entity, action, description, meta, "companyId", "userId")
          VALUES (
            'Invoice',
            'CREATE',
            'Periyodik fatura oluşturuldu: ' || invoice_number || ' (Sözleşme: ' || contract_record."contractNumber" || ')',
            jsonb_build_object(
              'contractId', contract_record.id,
              'contractNumber', contract_record."contractNumber",
              'invoiceId', invoice_id,
              'invoiceNumber', invoice_number,
              'billingCycle', contract_record."billingCycle"
            ),
            contract_record."companyId",
            contract_record."createdBy"
          );

          -- Notification
          INSERT INTO "Notification" (title, message, type, "relatedTo", "relatedId", "companyId", "userId", link)
          VALUES (
            '💰 Periyodik Fatura Oluşturuldu',
            'Sözleşme #' || contract_record."contractNumber" || ' için periyodik fatura #' || invoice_number || ' oluşturuldu.',
            'info',
            'Invoice',
            invoice_id,
            contract_record."companyId",
            contract_record."createdBy",
            '/tr/invoices/' || invoice_id
          ) ON CONFLICT DO NOTHING;

          RAISE NOTICE 'Recurring invoice created for contract %: %', contract_record."contractNumber", invoice_number;
        END IF;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to create recurring invoice for contract %: %', contract_record.id, SQLERRM;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_recurring_invoices IS 'Periyodik faturalandırma olan aktif sözleşmeler için otomatik fatura oluşturur';

-- ============================================
-- PART 3: SHIPMENT TRACKING OTOMASYONU
-- ============================================
CREATE OR REPLACE FUNCTION auto_update_shipment_tracking()
RETURNS TRIGGER AS $$
DECLARE
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Shipment status değiştiğinde
  IF NEW.status != OLD.status THEN
    BEGIN
      -- Status'a göre bildirim mesajı
      CASE NEW.status
        WHEN 'PENDING' THEN
          notification_title := '📦 Sevkiyat Hazırlanıyor';
          notification_message := 'Sevkiyat #' || NEW."shipmentNumber" || ' hazırlanıyor.';
        WHEN 'IN_TRANSIT' THEN
          notification_title := '🚚 Sevkiyat Yolda';
          notification_message := 'Sevkiyat #' || NEW."shipmentNumber" || ' yola çıktı. Takip numarası: ' || COALESCE(NEW.tracking, 'Henüz atanmadı');
        WHEN 'OUT_FOR_DELIVERY' THEN
          notification_title := '🚛 Teslimata Çıktı';
          notification_message := 'Sevkiyat #' || NEW."shipmentNumber" || ' teslimata çıktı.';
        WHEN 'DELIVERED' THEN
          notification_title := '✅ Sevkiyat Teslim Edildi';
          notification_message := 'Sevkiyat #' || NEW."shipmentNumber" || ' başarıyla teslim edildi.';
        WHEN 'RETURNED' THEN
          notification_title := '↩️ Sevkiyat İade Edildi';
          notification_message := 'Sevkiyat #' || NEW."shipmentNumber" || ' iade edildi.';
        ELSE
          notification_title := '📦 Sevkiyat Durumu Güncellendi';
          notification_message := 'Sevkiyat #' || NEW."shipmentNumber" || ' durumu güncellendi: ' || NEW.status;
      END CASE;

      -- Notification (Invoice'a atanan kullanıcıya)
      INSERT INTO "Notification" (title, message, type, "relatedTo", "relatedId", "companyId", "userId", link)
      SELECT
        notification_title,
        notification_message,
        CASE NEW.status
          WHEN 'DELIVERED' THEN 'success'
          WHEN 'RETURNED' THEN 'error'
          ELSE 'info'
        END,
        'Shipment',
        NEW.id,
        NEW."companyId",
        COALESCE(
          (SELECT "createdBy" FROM "Invoice" WHERE id = NEW."invoiceId" LIMIT 1),
          (SELECT id FROM "User" WHERE "companyId" = NEW."companyId" AND role IN ('ADMIN', 'SALES') LIMIT 1)
        ),
        '/tr/shipments/' || NEW.id
      ON CONFLICT DO NOTHING;

      -- ActivityLog
      INSERT INTO "ActivityLog" (entity, action, description, meta, "companyId", "userId")
      VALUES (
        'Shipment',
        'UPDATE',
        'Sevkiyat durumu güncellendi: ' || NEW."shipmentNumber" || ' → ' || NEW.status,
        jsonb_build_object(
          'shipmentId', NEW.id,
          'shipmentNumber', NEW."shipmentNumber",
          'oldStatus', OLD.status,
          'newStatus', NEW.status
        ),
        NEW."companyId",
        COALESCE(
          (SELECT "createdBy" FROM "Invoice" WHERE id = NEW."invoiceId" LIMIT 1),
          (SELECT id FROM "User" WHERE "companyId" = NEW."companyId" LIMIT 1)
        )
      );

      RAISE NOTICE 'Shipment status updated: % → %', NEW."shipmentNumber", NEW.status;

    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to update shipment tracking for %: %', NEW.id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_update_shipment_tracking ON "Shipment";
CREATE TRIGGER trigger_auto_update_shipment_tracking
  AFTER UPDATE OF status ON "Shipment"
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_shipment_tracking();

-- ============================================
-- PART 4: QUOTE EXPIRATION UYARISI (7 Gün Kala)
-- ============================================
CREATE OR REPLACE FUNCTION check_quote_expiration_warnings()
RETURNS VOID AS $$
DECLARE
  quote_record RECORD;
  days_until_expiry INTEGER;
BEGIN
  -- 7 gün içinde süresi dolacak teklifler için uyarı
  FOR quote_record IN
    SELECT *
    FROM "Quote"
    WHERE status = 'SENT'
      AND "validUntil" IS NOT NULL
      AND "validUntil" > CURRENT_DATE
      AND "validUntil" <= CURRENT_DATE + INTERVAL '7 days'
      AND NOT EXISTS (
        SELECT 1 FROM "Notification" n
        WHERE n."relatedTo" = 'Quote'
          AND n."relatedId" = "Quote".id
          AND n.title LIKE '%Süresi Doluyor%'
          AND n."createdAt" >= CURRENT_DATE - INTERVAL '1 day'
      )
  LOOP
    BEGIN
      days_until_expiry := (quote_record."validUntil" - CURRENT_DATE)::INTEGER;

      -- Notification
      INSERT INTO "Notification" (title, message, type, "relatedTo", "relatedId", "companyId", "userId", link, priority)
      VALUES (
        '⏰ Teklif Süresi Doluyor',
        'Teklif #' || quote_record."quoteNumber" || ' ' || days_until_expiry || ' gün sonra süresi dolacak. Lütfen müşteriyi takip edin.',
        'warning',
        'Quote',
        quote_record.id,
        quote_record."companyId",
        quote_record."assignedTo",
        '/tr/quotes/' || quote_record.id,
        'high'
      ) ON CONFLICT DO NOTHING;

      RAISE NOTICE 'Quote expiration warning sent: % (expires in % days)', quote_record."quoteNumber", days_until_expiry;

    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to send expiration warning for quote %: %', quote_record.id, SQLERRM;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_quote_expiration_warnings IS '7 gün içinde süresi dolacak teklifler için uyarı bildirimi gönderir';

-- ============================================
-- PART 5: DEAL WIN PROBABILITY OTOMATIK GÜNCELLEME
-- ============================================
CREATE OR REPLACE FUNCTION auto_update_deal_win_probability()
RETURNS TRIGGER AS $$
DECLARE
  new_probability DECIMAL(5,2);
BEGIN
  -- Stage'e göre win probability otomatik güncelle
  IF NEW.stage != OLD.stage THEN
    CASE NEW.stage
      WHEN 'LEAD' THEN new_probability := 10.00;
      WHEN 'CONTACTED' THEN new_probability := 25.00;
      WHEN 'PROPOSAL' THEN new_probability := 50.00;
      WHEN 'NEGOTIATION' THEN new_probability := 75.00;
      WHEN 'WON' THEN new_probability := 100.00;
      WHEN 'LOST' THEN new_probability := 0.00;
      ELSE new_probability := NEW."winProbability"; -- Değişiklik yok
    END CASE;

    -- Eğer manuel olarak değiştirilmemişse otomatik güncelle
    IF NEW."winProbability" = OLD."winProbability" OR NEW."winProbability" IS NULL THEN
      NEW."winProbability" := new_probability;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_update_deal_win_probability ON "Deal";
CREATE TRIGGER trigger_auto_update_deal_win_probability
  BEFORE UPDATE OF stage ON "Deal"
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_deal_win_probability();

-- ============================================
-- PART 6: CUSTOMER CHURN RISK HESAPLAMA
-- ============================================
CREATE OR REPLACE FUNCTION calculate_customer_churn_risk()
RETURNS VOID AS $$
DECLARE
  customer_record RECORD;
  days_since_last_order INTEGER;
  days_since_last_interaction INTEGER;
  churn_risk VARCHAR(20);
BEGIN
  -- Tüm aktif müşteriler için churn risk hesapla
  FOR customer_record IN
    SELECT 
      c.*,
      MAX(i."createdAt") as last_order_date,
      MAX(al."createdAt") as last_interaction_date
    FROM "Customer" c
    LEFT JOIN "Invoice" i ON i."customerId" = c.id AND i.status = 'PAID'
    LEFT JOIN "ActivityLog" al ON al.entity = 'Customer' AND al."relatedId" = c.id
    WHERE c.status = 'ACTIVE'
    GROUP BY c.id
  LOOP
    BEGIN
      -- Son siparişten bu yana geçen gün
      days_since_last_order := CASE 
        WHEN customer_record.last_order_date IS NOT NULL 
        THEN (CURRENT_DATE - customer_record.last_order_date::DATE)::INTEGER
        ELSE 999
      END;

      -- Son etkileşimden bu yana geçen gün
      days_since_last_interaction := CASE 
        WHEN customer_record.last_interaction_date IS NOT NULL 
        THEN (CURRENT_DATE - customer_record.last_interaction_date::DATE)::INTEGER
        ELSE 999
      END;

      -- Churn risk hesapla
      IF days_since_last_order > 180 OR days_since_last_interaction > 90 THEN
        churn_risk := 'HIGH';
      ELSIF days_since_last_order > 90 OR days_since_last_interaction > 60 THEN
        churn_risk := 'MEDIUM';
      ELSE
        churn_risk := 'LOW';
      END IF;

      -- Churn risk'i güncelle (sadece değiştiyse)
      IF customer_record."churnRisk" IS NULL OR customer_record."churnRisk" != churn_risk THEN
        UPDATE "Customer"
        SET "churnRisk" = churn_risk
        WHERE id = customer_record.id;

        -- Eğer HIGH risk ise uyarı gönder
        IF churn_risk = 'HIGH' THEN
          INSERT INTO "Notification" (title, message, type, "relatedTo", "relatedId", "companyId", "userId", link, priority)
          SELECT
            '⚠️ Yüksek Churn Riski',
            'Müşteri "' || customer_record.name || '" için yüksek churn riski tespit edildi. Lütfen iletişime geçin.',
            'error',
            'Customer',
            customer_record.id,
            customer_record."companyId",
            u.id,
            '/tr/customers/' || customer_record.id,
            'high'
          FROM "User" u
          WHERE u."companyId" = customer_record."companyId"
            AND u.role IN ('ADMIN', 'SALES', 'SUPER_ADMIN')
          ON CONFLICT DO NOTHING;
        END IF;

        RAISE NOTICE 'Churn risk updated for customer %: %', customer_record.id, churn_risk;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to calculate churn risk for customer %: %', customer_record.id, SQLERRM;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_customer_churn_risk IS 'Aktif müşteriler için churn risk hesaplar ve yüksek riskli müşteriler için uyarı gönderir';

-- ============================================
-- PART 7: TASK COMPLETION SONRASI OTOMASYONLAR
-- ============================================
CREATE OR REPLACE FUNCTION handle_task_completion_automations()
RETURNS TRIGGER AS $$
DECLARE
  related_entity_type TEXT;
  related_entity_id UUID;
  next_task_id UUID;
BEGIN
  -- Task COMPLETED olduğunda
  IF NEW.status = 'COMPLETED' AND (OLD.status IS NULL OR OLD.status != 'COMPLETED') THEN
    BEGIN
      related_entity_type := NEW."relatedTo";
      related_entity_id := NEW."relatedId";

      -- İlgili entity'ye göre otomasyon
      IF related_entity_type = 'Deal' AND related_entity_id IS NOT NULL THEN
        -- Deal ile ilgili görev tamamlandıysa, Deal stage'ini ilerlet
        -- Örnek: "Demo Planla" görevi tamamlandıysa → Deal PROPOSAL'a geç
        IF NEW.title LIKE '%Demo%' OR NEW.title LIKE '%demo%' THEN
          UPDATE "Deal"
          SET stage = CASE 
            WHEN stage = 'CONTACTED' THEN 'PROPOSAL'
            ELSE stage
          END
          WHERE id = related_entity_id
            AND stage = 'CONTACTED';
        END IF;

      ELSIF related_entity_type = 'Quote' AND related_entity_id IS NOT NULL THEN
        -- Quote ile ilgili görev tamamlandıysa, Quote'u SENT yap (eğer DRAFT ise)
        IF NEW.title LIKE '%Revizyon%' OR NEW.title LIKE '%revizyon%' THEN
          UPDATE "Quote"
          SET status = 'SENT', "sentAt" = NOW()
          WHERE id = related_entity_id
            AND status = 'DRAFT';
        END IF;

      ELSIF related_entity_type = 'Customer' AND related_entity_id IS NOT NULL THEN
        -- Customer ile ilgili görev tamamlandıysa, Customer'ın lastInteractionDate'ini güncelle
        UPDATE "Customer"
        SET "lastInteractionDate" = NOW()
        WHERE id = related_entity_id;

      END IF;

      -- ActivityLog
      INSERT INTO "ActivityLog" (entity, action, description, meta, "companyId", "userId")
      VALUES (
        'Task',
        'COMPLETE',
        'Görev tamamlandı: ' || NEW.title,
        jsonb_build_object(
          'taskId', NEW.id,
          'relatedTo', related_entity_type,
          'relatedId', related_entity_id
        ),
        NEW."companyId",
        NEW."assignedTo"
      );

      RAISE NOTICE 'Task completion automation executed for task %', NEW.id;

    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to execute task completion automation for task %: %', NEW.id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_handle_task_completion_automations ON "Task";
CREATE TRIGGER trigger_handle_task_completion_automations
  AFTER UPDATE OF status ON "Task"
  FOR EACH ROW
  EXECUTE FUNCTION handle_task_completion_automations();

-- ============================================
-- PART 8: MEETING NO-SHOW TAKİBİ
-- ============================================
CREATE OR REPLACE FUNCTION check_meeting_no_shows()
RETURNS VOID AS $$
DECLARE
  meeting_record RECORD;
  participant_id UUID;
BEGIN
  -- Başlamış ama status DONE olmayan görüşmeler için no-show kontrolü
  FOR meeting_record IN
    SELECT *
    FROM "Meeting"
    WHERE "meetingDate" < NOW() - INTERVAL '1 hour'
      AND status != 'DONE'
      AND status != 'CANCELLED'
      AND NOT EXISTS (
        SELECT 1 FROM "Notification" n
        WHERE n."relatedTo" = 'Meeting'
          AND n."relatedId" = "Meeting".id
          AND n.title LIKE '%No-Show%'
          AND n."createdAt" >= CURRENT_DATE
      )
  LOOP
    BEGIN
      -- Her katılımcı için no-show bildirimi
      FOR participant_id IN
        SELECT "userId" FROM "MeetingParticipant" WHERE "meetingId" = meeting_record.id
      LOOP
        INSERT INTO "Notification" (title, message, type, "relatedTo", "relatedId", "companyId", "userId", link, priority)
        VALUES (
          '⚠️ Görüşme No-Show',
          'Görüşme "' || meeting_record.title || '" başladı ama katılım sağlanmadı. Lütfen durumu kontrol edin.',
          'warning',
          'Meeting',
          meeting_record.id,
          meeting_record."companyId",
          participant_id,
          '/tr/meetings/' || meeting_record.id,
          'normal'
        ) ON CONFLICT DO NOTHING;
      END LOOP;

      RAISE NOTICE 'No-show notification sent for meeting %', meeting_record.id;

    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to send no-show notification for meeting %: %', meeting_record.id, SQLERRM;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_meeting_no_shows IS 'Başlamış ama tamamlanmamış görüşmeler için no-show bildirimi gönderir';

-- ============================================
-- PART 9: TICKET ESCALATION OTOMASYONU
-- ============================================
CREATE OR REPLACE FUNCTION auto_escalate_tickets()
RETURNS TRIGGER AS $$
DECLARE
  hours_since_creation NUMERIC;
  escalation_priority VARCHAR(20);
BEGIN
  -- Ticket oluşturulduğunda veya güncellendiğinde escalation kontrolü
  IF NEW.status = 'OPEN' OR NEW.status = 'IN_PROGRESS' THEN
    BEGIN
      -- Oluşturulma tarihinden bu yana geçen saat
      hours_since_creation := EXTRACT(EPOCH FROM (NOW() - NEW."createdAt")) / 3600;

      -- 24 saat geçtiyse HIGH priority
      IF hours_since_creation >= 24 AND NEW.priority != 'HIGH' AND NEW.priority != 'CRITICAL' THEN
        escalation_priority := 'HIGH';
      -- 48 saat geçtiyse CRITICAL priority
      ELSIF hours_since_creation >= 48 AND NEW.priority != 'CRITICAL' THEN
        escalation_priority := 'CRITICAL';
      ELSE
        escalation_priority := NEW.priority;
      END IF;

      -- Priority güncelle
      IF escalation_priority != NEW.priority THEN
        NEW.priority := escalation_priority;

        -- Escalation bildirimi
        INSERT INTO "Notification" (title, message, type, "relatedTo", "relatedId", "companyId", "userId", link, priority)
        SELECT
          '🚨 Ticket Escalated',
          'Ticket #' || NEW."ticketNumber" || ' ' || hours_since_creation::INTEGER || ' saatten fazla açık. Öncelik: ' || escalation_priority,
          'error',
          'Ticket',
          NEW.id,
          NEW."companyId",
          u.id,
          '/tr/tickets/' || NEW.id,
          escalation_priority
        FROM "User" u
        WHERE u."companyId" = NEW."companyId"
          AND u.role IN ('ADMIN', 'SUPER_ADMIN', 'SUPPORT')
        ON CONFLICT DO NOTHING;

        RAISE NOTICE 'Ticket escalated: % (hours: %, priority: %)', NEW."ticketNumber", hours_since_creation, escalation_priority;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to escalate ticket %: %', NEW.id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_escalate_tickets ON "Ticket";
CREATE TRIGGER trigger_auto_escalate_tickets
  BEFORE UPDATE OF status, priority ON "Ticket"
  FOR EACH ROW
  EXECUTE FUNCTION auto_escalate_tickets();

-- ============================================
-- PART 10: DOCUMENT EXPIRATION TAKİBİ
-- ============================================
CREATE OR REPLACE FUNCTION check_document_expiration()
RETURNS VOID AS $$
DECLARE
  document_record RECORD;
  days_until_expiry INTEGER;
BEGIN
  -- 30 gün içinde süresi dolacak dökümanlar için uyarı
  FOR document_record IN
    SELECT *
    FROM "Document"
    WHERE "expiresAt" IS NOT NULL
      AND "expiresAt" > CURRENT_DATE
      AND "expiresAt" <= CURRENT_DATE + INTERVAL '30 days'
      AND NOT EXISTS (
        SELECT 1 FROM "Notification" n
        WHERE n."relatedTo" = 'Document'
          AND n."relatedId" = "Document".id
          AND n.title LIKE '%Süresi Doluyor%'
          AND n."createdAt" >= CURRENT_DATE - INTERVAL '7 days'
      )
  LOOP
    BEGIN
      days_until_expiry := (document_record."expiresAt" - CURRENT_DATE)::INTEGER;

      -- Notification (dökümanı yükleyen kullanıcıya)
      INSERT INTO "Notification" (title, message, type, "relatedTo", "relatedId", "companyId", "userId", link, priority)
      VALUES (
        '📄 Döküman Süresi Doluyor',
        'Döküman "' || document_record.title || '" ' || days_until_expiry || ' gün sonra süresi dolacak. Lütfen yenileyin.',
        'warning',
        'Document',
        document_record.id,
        document_record."companyId",
        document_record."uploadedBy",
        '/tr/documents/' || document_record.id,
        CASE 
          WHEN days_until_expiry <= 7 THEN 'high'
          ELSE 'normal'
        END
      ) ON CONFLICT DO NOTHING;

      RAISE NOTICE 'Document expiration warning sent: % (expires in % days)', document_record.title, days_until_expiry;

    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to send expiration warning for document %: %', document_record.id, SQLERRM;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_document_expiration IS '30 gün içinde süresi dolacak dökümanlar için uyarı bildirimi gönderir';

-- ============================================
-- ÖZET VE YORUMLAR
-- ============================================

COMMENT ON FUNCTION auto_renew_contracts IS 'Yenileme tarihi gelmiş ve auto-renew aktif olan sözleşmeleri otomatik yeniler';
COMMENT ON FUNCTION create_recurring_invoices IS 'Periyodik faturalandırma olan aktif sözleşmeler için otomatik fatura oluşturur';
COMMENT ON FUNCTION auto_update_shipment_tracking IS 'Sevkiyat durumu değiştiğinde otomatik bildirim gönderir';
COMMENT ON FUNCTION check_quote_expiration_warnings IS '7 gün içinde süresi dolacak teklifler için uyarı bildirimi gönderir';
COMMENT ON FUNCTION auto_update_deal_win_probability IS 'Deal stage değiştiğinde win probability otomatik günceller';
COMMENT ON FUNCTION calculate_customer_churn_risk IS 'Aktif müşteriler için churn risk hesaplar ve yüksek riskli müşteriler için uyarı gönderir';
COMMENT ON FUNCTION handle_task_completion_automations IS 'Görev tamamlandığında ilgili entity için otomatik aksiyonlar alır';
COMMENT ON FUNCTION check_meeting_no_shows IS 'Başlamış ama tamamlanmamış görüşmeler için no-show bildirimi gönderir';
COMMENT ON FUNCTION auto_escalate_tickets IS 'Açık ticketlar için otomatik escalation yapar (24 saat → HIGH, 48 saat → CRITICAL)';
COMMENT ON FUNCTION check_document_expiration IS '30 gün içinde süresi dolacak dökümanlar için uyarı bildirimi gönderir';

-- ============================================
-- TAMAMLANDI!
-- ============================================

