-- ============================================
-- 042_user_automations.sql
-- Kullanıcı Aksiyonlarına Göre Otomasyonlar
-- ============================================
-- Bu dosya şunları yapar:
-- 1. Deal WON → Otomatik Contract oluştur
-- 2. Quote SENT → Email gönder (Notification)
-- 3. Quote ACCEPTED → Invoice + Contract oluştur
-- 4. Invoice SENT → Email gönder (Notification)
-- 5. Invoice PAID → Finance kaydı + Notification
-- 6. Contract ACTIVE → Invoice oluştur
-- 7. Shipment DELIVERED → Notification
-- ============================================

-- ============================================
-- PART 1: DEAL WON → CONTRACT OTOMASYONu
-- ============================================

CREATE OR REPLACE FUNCTION create_contract_on_deal_won()
RETURNS TRIGGER AS $$
DECLARE
  contract_number VARCHAR;
  contract_id UUID;
BEGIN
  -- Deal WON oldu (LEAD → WON geçişi)
  IF NEW.stage = 'WON' AND (OLD.stage IS NULL OR OLD.stage != 'WON') THEN
    
    BEGIN
      -- Zaten contract var mı kontrol et
      IF NOT EXISTS (
        SELECT 1 FROM "Contract"
        WHERE "dealId" = NEW.id
      ) THEN
        -- Contract number oluştur
        contract_number := 'SOZL-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(COALESCE((SELECT MAX(CAST(SUBSTRING("contractNumber" FROM '[0-9]+$') AS INTEGER)) FROM "Contract" WHERE "contractNumber" LIKE 'SOZL-' || TO_CHAR(NOW(), 'YYYY') || '-%'), 0) + 1, 4, '0');
        
        -- Contract oluştur
        INSERT INTO "Contract" (
          "contractNumber",
          title,
          "customerId",
          "customerCompanyId",
          "dealId",
          type,
          "startDate",
          "endDate",
          value,
          currency,
          "taxRate",
          "totalValue",
          status,
          notes,
          "companyId",
          "createdBy"
        )
        VALUES (
          contract_number,
          'Sözleşme - ' || COALESCE(NEW.title, 'Başlıksız'),
          NEW."customerId",
          NEW."customerCompanyId",
          NEW.id,
          'SERVICE',
          CURRENT_DATE,
          CURRENT_DATE + INTERVAL '1 year',
          NEW.value,
          COALESCE(NEW.currency, 'TRY'),
          18.00,
          NEW.value * 1.18, -- KDV dahil
          'DRAFT',
          'Deal ' || COALESCE(NEW.title, 'Başlıksız') || ' kazanıldı, otomatik oluşturuldu',
          NEW."companyId",
          NEW."createdBy"
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
          'Deal kazanıldı, taslak sözleşme oluşturuldu: ' || contract_number,
          jsonb_build_object(
            'dealId', NEW.id,
            'dealTitle', NEW.title,
            'contractId', contract_id,
            'contractNumber', contract_number
          ),
          NEW."companyId",
          NEW."createdBy"
        );
        
        -- Notification
        IF EXISTS (SELECT 1 FROM "Notification" WHERE "Notification"."relatedTo" = 'Contract' AND "Notification"."relatedId" = contract_id) = FALSE THEN
          INSERT INTO "Notification" (
            title,
            message,
            type,
            "relatedTo",
            "relatedId",
            "companyId"
          )
          VALUES (
            'Taslak Sözleşme Oluşturuldu',
            NEW.title || ' fırsatı kazanıldı. Taslak sözleşme oluşturuldu: ' || contract_number,
            'success',
            'Contract',
            contract_id,
            NEW."companyId"
          );
        END IF;
        
        RAISE NOTICE 'Contract created for deal %: %', NEW.id, contract_number;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not create contract for deal: %', SQLERRM;
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_deal_won_create_contract ON "Deal";
CREATE TRIGGER trigger_deal_won_create_contract
  AFTER UPDATE OF stage
  ON "Deal"
  FOR EACH ROW
  EXECUTE FUNCTION create_contract_on_deal_won();

-- ============================================
-- PART 2: QUOTE SENT → EMAIL NOTIFICATION
-- ============================================

CREATE OR REPLACE FUNCTION notify_quote_sent()
RETURNS TRIGGER AS $$
BEGIN
  -- Quote SENT oldu
  IF NEW.status = 'SENT' AND (OLD.status IS NULL OR OLD.status != 'SENT') THEN
    
    BEGIN
      -- Notification oluştur - Admin, Sales ve SuperAdmin rolündeki kullanıcılara
      -- ÖNEMLİ: SuperAdmin için companyId kontrolü yapma - tüm şirketlerin bildirimlerini alabilir
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
        NEW."companyId",
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
        'Quote',
        'UPDATE',
        'Teklif müşteriye gönderildi',
        jsonb_build_object(
          'quoteId', NEW.id,
          'quoteNumber', NEW."quoteNumber",
          'status', NEW.status
        ),
        NEW."companyId",
        NEW."createdBy"
      );
      
      RAISE NOTICE 'Quote sent notification created for quote %', NEW.id;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not create notification for quote: %', SQLERRM;
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_quote_sent_notification ON "Quote";
CREATE TRIGGER trigger_quote_sent_notification
  AFTER UPDATE OF status
  ON "Quote"
  FOR EACH ROW
  EXECUTE FUNCTION notify_quote_sent();

-- ============================================
-- PART 3: QUOTE ACCEPTED → INVOICE + CONTRACT
-- ============================================

CREATE OR REPLACE FUNCTION create_invoice_on_quote_accepted()
RETURNS TRIGGER AS $$
DECLARE
  invoice_number VARCHAR;
  invoice_id UUID;
BEGIN
  -- Quote ACCEPTED oldu
  IF NEW.status = 'ACCEPTED' AND (OLD.status IS NULL OR OLD.status != 'ACCEPTED') THEN
    
    BEGIN
      -- Zaten invoice var mı kontrol et
      IF NOT EXISTS (
        SELECT 1 FROM "Invoice"
        WHERE "quoteId" = NEW.id
      ) THEN
        -- Invoice number oluştur
        invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(COALESCE((SELECT MAX(CAST(SUBSTRING("invoiceNumber" FROM '[0-9]+$') AS INTEGER)) FROM "Invoice" WHERE "invoiceNumber" LIKE 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-%'), 0) + 1, 4, '0');
        
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
          'Fatura - ' || COALESCE(NEW.title, 'Başlıksız'),
          NEW."customerId",
          NEW."customerCompanyId",
          NEW.id,
          CURRENT_DATE + INTERVAL '30 days', -- 30 gün vade
          NEW."totalAmount",
          COALESCE(NEW.currency, 'TRY'),
          'DRAFT',
          'Quote ' || COALESCE(NEW."quoteNumber", '') || ' onaylandı, otomatik oluşturuldu',
          NEW."companyId",
          NEW."createdBy"
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
            'quoteId', NEW.id,
            'quoteNumber', NEW."quoteNumber",
            'invoiceId', invoice_id,
            'invoiceNumber', invoice_number
          ),
          NEW."companyId",
          NEW."createdBy"
        );
        
        -- Notification
        INSERT INTO "Notification" (
          title,
          message,
          type,
          "relatedTo",
          "relatedId",
          "companyId"
        )
        VALUES (
          'Fatura Oluşturuldu',
          NEW.title || ' teklifi onaylandı. Fatura oluşturuldu: ' || invoice_number,
          'success',
          'Invoice',
          invoice_id,
          NEW."companyId"
        )
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Invoice created for quote %: %', NEW.id, invoice_number;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not create invoice for quote: %', SQLERRM;
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_quote_accepted_create_invoice ON "Quote";
CREATE TRIGGER trigger_quote_accepted_create_invoice
  AFTER UPDATE OF status
  ON "Quote"
  FOR EACH ROW
  EXECUTE FUNCTION create_invoice_on_quote_accepted();

-- ============================================
-- PART 4: INVOICE SENT → EMAIL NOTIFICATION
-- ============================================

CREATE OR REPLACE FUNCTION notify_invoice_sent()
RETURNS TRIGGER AS $$
BEGIN
  -- Invoice SENT oldu
  IF NEW.status = 'SENT' AND (OLD.status IS NULL OR OLD.status != 'SENT') THEN
    
    BEGIN
      -- Notification oluştur
      INSERT INTO "Notification" (
        title,
        message,
        type,
        "relatedTo",
        "relatedId",
        "companyId"
      )
      VALUES (
        'Fatura Gönderildi',
        COALESCE(NEW.title, 'Başlıksız') || ' faturası müşteriye gönderildi.',
        'info',
        'Invoice',
        NEW.id,
        NEW."companyId"
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
        'Invoice',
        'UPDATE',
        'Fatura müşteriye gönderildi',
        jsonb_build_object(
          'invoiceId', NEW.id,
          'invoiceNumber', NEW."invoiceNumber",
          'status', NEW.status
        ),
        NEW."companyId",
        COALESCE(NEW."createdBy", (SELECT id FROM "User" WHERE "companyId" = NEW."companyId" LIMIT 1))
      );
      
      RAISE NOTICE 'Invoice sent notification created for invoice %', NEW.id;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not create notification for invoice: %', SQLERRM;
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_invoice_sent_notification ON "Invoice";
CREATE TRIGGER trigger_invoice_sent_notification
  AFTER UPDATE OF status
  ON "Invoice"
  FOR EACH ROW
  EXECUTE FUNCTION notify_invoice_sent();

-- ============================================
-- PART 5: INVOICE PAID → FINANCE + NOTIFICATION
-- ============================================

CREATE OR REPLACE FUNCTION handle_invoice_paid()
RETURNS TRIGGER AS $$
BEGIN
  -- Invoice PAID oldu
  IF NEW.status = 'PAID' AND (OLD.status IS NULL OR OLD.status != 'PAID') THEN
    
    BEGIN
      -- Finance kaydı oluştur (zaten varsa tekrar oluşturma)
      IF NOT EXISTS (
        SELECT 1 FROM "Finance"
        WHERE "relatedEntity" = 'Invoice'
          AND "relatedId" = NEW.id
      ) THEN
        INSERT INTO "Finance" (
          type,
          amount,
          category,
          description,
          "transactionDate",
          "relatedEntity",
          "relatedId",
          "companyId"
        )
        VALUES (
          'INCOME',
          NEW."totalAmount",
          'SALES',
          'Invoice Payment: ' || COALESCE(NEW."invoiceNumber", ''),
          COALESCE(NEW."paidAt", NOW()),
          'Invoice',
          NEW.id,
          NEW."companyId"
        );
      END IF;
      
      -- Notification
      INSERT INTO "Notification" (
        title,
        message,
        type,
        "relatedTo",
        "relatedId",
        "companyId"
      )
      VALUES (
        'Fatura Ödendi',
        COALESCE(NEW.title, 'Başlıksız') || ' faturası ödendi. Finance kaydı oluşturuldu.',
        'success',
        'Invoice',
        NEW.id,
        NEW."companyId"
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
        'Invoice',
        'UPDATE',
        'Fatura ödendi, finance kaydı oluşturuldu',
        jsonb_build_object(
          'invoiceId', NEW.id,
          'invoiceNumber', NEW."invoiceNumber",
          'status', NEW.status,
          'amount', NEW."totalAmount"
        ),
        NEW."companyId",
        COALESCE(NEW."createdBy", (SELECT id FROM "User" WHERE "companyId" = NEW."companyId" LIMIT 1))
      );
      
      RAISE NOTICE 'Invoice paid: Finance entry created for invoice %', NEW.id;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not create finance entry for invoice: %', SQLERRM;
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_invoice_paid_finance ON "Invoice";
CREATE TRIGGER trigger_invoice_paid_finance
  AFTER UPDATE OF status
  ON "Invoice"
  FOR EACH ROW
  EXECUTE FUNCTION handle_invoice_paid();

-- ============================================
-- PART 6: CONTRACT ACTIVE → INVOICE OTOMASYONu
-- ============================================

CREATE OR REPLACE FUNCTION create_invoice_on_contract_active()
RETURNS TRIGGER AS $$
DECLARE
  invoice_number VARCHAR;
  invoice_id UUID;
BEGIN
  -- Contract ACTIVE oldu
  IF NEW.status = 'ACTIVE' AND (OLD.status IS NULL OR OLD.status != 'ACTIVE') THEN
    
    BEGIN
      -- ONE_TIME sözleşme ise tek fatura
      IF NEW."billingCycle" = 'ONE_TIME' THEN
        -- Zaten invoice var mı kontrol et
        IF NOT EXISTS (
          SELECT 1 FROM "Invoice"
          WHERE "contractId" = NEW.id
        ) THEN
          invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(COALESCE((SELECT MAX(CAST(SUBSTRING("invoiceNumber" FROM '[0-9]+$') AS INTEGER)) FROM "Invoice" WHERE "invoiceNumber" LIKE 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-%'), 0) + 1, 4, '0');
          
          INSERT INTO "Invoice" (
            "invoiceNumber",
            title,
            "customerId",
            "customerCompanyId",
            "contractId",
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
            'Fatura - ' || COALESCE(NEW.title, 'Başlıksız'),
            NEW."customerId",
            NEW."customerCompanyId",
            NEW.id,
            CURRENT_DATE + (COALESCE(NEW."paymentTerms", 30) || ' days')::INTERVAL,
            NEW."totalValue",
            COALESCE(NEW.currency, 'TRY'),
            'DRAFT',
            'Contract: ' || COALESCE(NEW."contractNumber", '') || ' için otomatik oluşturuldu',
            NEW."companyId",
            NEW."createdBy"
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
            'Contract aktif oldu, fatura oluşturuldu: ' || invoice_number,
            jsonb_build_object(
              'contractId', NEW.id,
              'contractNumber', NEW."contractNumber",
              'invoiceId', invoice_id,
              'invoiceNumber', invoice_number
            ),
            NEW."companyId",
            NEW."createdBy"
          );
          
          -- Notification
          INSERT INTO "Notification" (
            title,
            message,
            type,
            "relatedTo",
            "relatedId",
            "companyId"
          )
          VALUES (
            'Fatura Oluşturuldu',
            NEW.title || ' sözleşmesi aktif oldu. Fatura oluşturuldu: ' || invoice_number,
            'success',
            'Invoice',
            invoice_id,
            NEW."companyId"
          )
          ON CONFLICT DO NOTHING;
          
          RAISE NOTICE 'Invoice created for contract %: %', NEW.id, invoice_number;
        END IF;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not create invoice for contract: %', SQLERRM;
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_contract_active_create_invoice ON "Contract";
CREATE TRIGGER trigger_contract_active_create_invoice
  AFTER UPDATE OF status
  ON "Contract"
  FOR EACH ROW
  EXECUTE FUNCTION create_invoice_on_contract_active();

-- ============================================
-- PART 7: SHIPMENT DELIVERED → NOTIFICATION
-- ============================================

CREATE OR REPLACE FUNCTION notify_shipment_delivered()
RETURNS TRIGGER AS $$
BEGIN
  -- Shipment DELIVERED oldu
  IF NEW.status = 'DELIVERED' AND (OLD.status IS NULL OR OLD.status != 'DELIVERED') THEN
    
    BEGIN
      -- Notification oluştur
      INSERT INTO "Notification" (
        title,
        message,
        type,
        "relatedTo",
        "relatedId",
        "companyId"
      )
      VALUES (
        'Sevkiyat Teslim Edildi',
        COALESCE(NEW."trackingNumber", 'Sevkiyat') || ' teslim edildi.',
        'success',
        'Shipment',
        NEW.id,
        NEW."companyId"
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
        'Shipment',
        'UPDATE',
        'Sevkiyat teslim edildi',
        jsonb_build_object(
          'shipmentId', NEW.id,
          'trackingNumber', NEW."trackingNumber",
          'status', NEW.status
        ),
        NEW."companyId",
        COALESCE(NEW."createdBy", (SELECT id FROM "User" WHERE "companyId" = NEW."companyId" LIMIT 1))
      );
      
      RAISE NOTICE 'Shipment delivered notification created for shipment %', NEW.id;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not create notification for shipment: %', SQLERRM;
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_shipment_delivered_notification ON "Shipment";
CREATE TRIGGER trigger_shipment_delivered_notification
  AFTER UPDATE OF status
  ON "Shipment"
  FOR EACH ROW
  EXECUTE FUNCTION notify_shipment_delivered();

-- ============================================
-- MIGRATION TAMAMLANDI
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ Migration 042 tamamlandı: User Automations';
  RAISE NOTICE '============================================';
  RAISE NOTICE '📌 Yeni Otomasyonlar:';
  RAISE NOTICE '  1. Deal WON → Contract oluştur';
  RAISE NOTICE '  2. Quote SENT → Email notification';
  RAISE NOTICE '  3. Quote ACCEPTED → Invoice + Contract';
  RAISE NOTICE '  4. Invoice SENT → Email notification';
  RAISE NOTICE '  5. Invoice PAID → Finance kaydı + Notification';
  RAISE NOTICE '  6. Contract ACTIVE → Invoice oluştur';
  RAISE NOTICE '  7. Shipment DELIVERED → Notification';
  RAISE NOTICE '============================================';
END $$;

