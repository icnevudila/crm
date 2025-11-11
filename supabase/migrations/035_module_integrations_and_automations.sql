-- ============================================
-- CRM V3 - MODULE INTEGRATIONS & AUTOMATIONS
-- Migration: 035
-- Tarih: 2024
-- Amaç: Modüller arası bağlantılar, otomasyonlar, iş akışları
-- ============================================

-- ============================================
-- BÖLÜM 1: CONTRACT → INVOICE OTOMASYON
-- ============================================

-- Contract ACTIVE olduğunda ilk fatura oluştur
CREATE OR REPLACE FUNCTION create_invoice_on_contract_active()
RETURNS TRIGGER AS $$
DECLARE
  invoice_number VARCHAR;
  invoice_id UUID;
BEGIN
  -- Contract DRAFT → ACTIVE oldu
  IF NEW.status = 'ACTIVE' AND OLD.status != 'ACTIVE' THEN
    -- Invoice number oluştur
    invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('invoice_number_seq')::TEXT, 4, '0');
    
    -- ONE_TIME sözleşme ise tek fatura
    IF NEW."billingCycle" = 'ONE_TIME' THEN
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
        "companyId"
      )
      VALUES (
        invoice_number,
        'Fatura - ' || NEW.title,
        NEW."customerId",
        NEW."customerCompanyId",
        NULL,
        CURRENT_DATE + (NEW."paymentTerms" || ' days')::INTERVAL,
        NEW."totalValue",
        NEW.currency,
        'DRAFT',
        'Contract: ' || NEW."contractNumber" || ' için otomatik oluşturuldu',
        NEW."companyId"
      )
      RETURNING id INTO invoice_id;
      
      -- Contract metadata'ya invoice linkini ekle
      UPDATE "Contract"
      SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('firstInvoiceId', invoice_id)
      WHERE id = NEW.id;
      
    -- RECURRING sözleşme ise ilk fatura + sonraki vadeler için task
    ELSIF NEW."billingCycle" IN ('MONTHLY', 'QUARTERLY', 'YEARLY') THEN
      -- İlk fatura
      INSERT INTO "Invoice" (
        "invoiceNumber",
        title,
        "customerId",
        "customerCompanyId",
        "dueDate",
        "totalAmount",
        currency,
        status,
        notes,
        "companyId"
      )
      VALUES (
        invoice_number,
        'Fatura - ' || NEW.title || ' (1. Dönem)',
        NEW."customerId",
        NEW."customerCompanyId",
        CURRENT_DATE + (NEW."paymentTerms" || ' days')::INTERVAL,
        NEW.value, -- Her dönem için contract value
        NEW.currency,
        'DRAFT',
        'Recurring contract: ' || NEW."contractNumber",
        NEW."companyId"
      )
      RETURNING id INTO invoice_id;
      
      -- Contract metadata'ya ekle
      UPDATE "Contract"
      SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
        'firstInvoiceId', invoice_id,
        'lastInvoiceDate', CURRENT_DATE,
        'nextInvoiceDate', CURRENT_DATE + 
          CASE 
            WHEN NEW."billingCycle" = 'MONTHLY' THEN INTERVAL '1 month'
            WHEN NEW."billingCycle" = 'QUARTERLY' THEN INTERVAL '3 months'
            WHEN NEW."billingCycle" = 'YEARLY' THEN INTERVAL '1 year'
          END
      )
      WHERE id = NEW.id;
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
      'Fatura Oluşturuldu',
      NEW.title || ' sözleşmesi için otomatik fatura oluşturuldu: ' || invoice_number,
      'info',
      'Invoice',
      invoice_id,
      NEW."companyId"
    );
    
    -- ActivityLog
    INSERT INTO "ActivityLog" (
      entity,
      action,
      description,
      meta,
      "companyId"
    )
    VALUES (
      'Invoice',
      'CREATE',
      'Contract aktif oldu, otomatik fatura oluşturuldu: ' || invoice_number,
      jsonb_build_object(
        'contractId', NEW.id,
        'contractNumber', NEW."contractNumber",
        'invoiceId', invoice_id,
        'invoiceNumber', invoice_number
      ),
      NEW."companyId"
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Sequence oluştur (invoice number için - eğer yoksa)
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

DROP TRIGGER IF EXISTS trigger_contract_active_create_invoice ON "Contract";
CREATE TRIGGER trigger_contract_active_create_invoice
AFTER UPDATE ON "Contract"
FOR EACH ROW
EXECUTE FUNCTION create_invoice_on_contract_active();

-- ============================================
-- BÖLÜM 2: RECURRING INVOICE GENERATION
-- ============================================

-- Recurring contract'lar için otomatik fatura oluştur
CREATE OR REPLACE FUNCTION generate_recurring_invoices()
RETURNS void AS $$
DECLARE
  contract_rec RECORD;
  invoice_number VARCHAR;
  next_invoice_date DATE;
BEGIN
  -- Recurring billing olan aktif sözleşmeler
  FOR contract_rec IN 
    SELECT *
    FROM "Contract"
    WHERE 
      status = 'ACTIVE'
      AND "billingCycle" IN ('MONTHLY', 'QUARTERLY', 'YEARLY')
      AND (metadata->>'nextInvoiceDate')::DATE <= CURRENT_DATE
  LOOP
    -- Invoice number
    invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('invoice_number_seq')::TEXT, 4, '0');
    
    -- Fatura oluştur
    INSERT INTO "Invoice" (
      "invoiceNumber",
      title,
      "customerId",
      "customerCompanyId",
      "dueDate",
      "totalAmount",
      currency,
      status,
      notes,
      "companyId"
    )
    VALUES (
      invoice_number,
      'Fatura - ' || contract_rec.title,
      contract_rec."customerId",
      contract_rec."customerCompanyId",
      CURRENT_DATE + (contract_rec."paymentTerms" || ' days')::INTERVAL,
      contract_rec.value,
      contract_rec.currency,
      'DRAFT',
      'Recurring contract: ' || contract_rec."contractNumber",
      contract_rec."companyId"
    );
    
    -- Sonraki fatura tarihini hesapla
    next_invoice_date := CURRENT_DATE + 
      CASE 
        WHEN contract_rec."billingCycle" = 'MONTHLY' THEN INTERVAL '1 month'
        WHEN contract_rec."billingCycle" = 'QUARTERLY' THEN INTERVAL '3 months'
        WHEN contract_rec."billingCycle" = 'YEARLY' THEN INTERVAL '1 year'
      END;
    
    -- Contract metadata güncelle
    UPDATE "Contract"
    SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
      'lastInvoiceDate', CURRENT_DATE,
      'nextInvoiceDate', next_invoice_date
    )
    WHERE id = contract_rec.id;
    
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
      'Recurring Fatura Oluşturuldu',
      contract_rec.title || ' için dönemsel fatura: ' || invoice_number,
      'info',
      'Contract',
      contract_rec.id,
      contract_rec."companyId"
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- BÖLÜM 3: MEETING → CONTACT INTEGRATION
-- ============================================

-- Meeting tablosuna contactId ekle (eğer yoksa)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Meeting' AND column_name = 'contactId'
  ) THEN
    ALTER TABLE "Meeting"
    ADD COLUMN "contactId" UUID REFERENCES "Contact"(id) ON DELETE SET NULL;
    
    CREATE INDEX IF NOT EXISTS idx_meeting_contact ON "Meeting"("contactId");
  END IF;
END $$;

-- Meeting oluşturulduğunda Contact ile ilişkilendir
CREATE OR REPLACE FUNCTION link_meeting_to_contact()
RETURNS TRIGGER AS $$
DECLARE
  primary_contact_id UUID;
BEGIN
  -- Eğer customerCompanyId varsa, o firmanın primary contact'ını bul ve otomatik bağla
  IF NEW."customerCompanyId" IS NOT NULL AND NEW."contactId" IS NULL THEN
    SELECT id INTO primary_contact_id
    FROM "Contact"
    WHERE "customerCompanyId" = NEW."customerCompanyId"
      AND "isPrimary" = true
      AND "companyId" = NEW."companyId"
    LIMIT 1;
    
    IF primary_contact_id IS NOT NULL THEN
      NEW."contactId" := primary_contact_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_meeting_link_contact ON "Meeting";
CREATE TRIGGER trigger_meeting_link_contact
BEFORE INSERT ON "Meeting"
FOR EACH ROW
EXECUTE FUNCTION link_meeting_to_contact();

-- ============================================
-- BÖLÜM 4: DEAL → CONTACT INTEGRATION
-- ============================================

-- Deal tablosuna contactId ekle (eğer yoksa)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Deal' AND column_name = 'contactId'
  ) THEN
    ALTER TABLE "Deal"
    ADD COLUMN "contactId" UUID REFERENCES "Contact"(id) ON DELETE SET NULL;
    
    CREATE INDEX IF NOT EXISTS idx_deal_contact ON "Deal"("contactId");
  END IF;
END $$;

-- Deal oluşturulduğunda primary contact'ı otomatik bağla
CREATE OR REPLACE FUNCTION link_deal_to_contact()
RETURNS TRIGGER AS $$
DECLARE
  primary_contact_id UUID;
BEGIN
  -- customerCompanyId varsa primary contact'ı bul
  IF NEW."customerCompanyId" IS NOT NULL AND NEW."contactId" IS NULL THEN
    SELECT id INTO primary_contact_id
    FROM "Contact"
    WHERE "customerCompanyId" = NEW."customerCompanyId"
      AND "isPrimary" = true
      AND "companyId" = NEW."companyId"
    LIMIT 1;
    
    IF primary_contact_id IS NOT NULL THEN
      NEW."contactId" := primary_contact_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_deal_link_contact ON "Deal";
CREATE TRIGGER trigger_deal_link_contact
BEFORE INSERT ON "Deal"
FOR EACH ROW
EXECUTE FUNCTION link_deal_to_contact();

-- ============================================
-- BÖLÜM 5: CUSTOMER COMPANY CASCADE PROTECTION
-- ============================================

-- CustomerCompany silinmeye çalışıldığında uyarı ver
CREATE OR REPLACE FUNCTION prevent_customer_company_delete_if_has_data()
RETURNS TRIGGER AS $$
DECLARE
  contact_count INTEGER;
  contract_count INTEGER;
  deal_count INTEGER;
BEGIN
  -- İlişkili kayıtları say
  SELECT COUNT(*) INTO contact_count FROM "Contact" WHERE "customerCompanyId" = OLD.id;
  SELECT COUNT(*) INTO contract_count FROM "Contract" WHERE "customerCompanyId" = OLD.id;
  SELECT COUNT(*) INTO deal_count FROM "Deal" WHERE "customerCompanyId" = OLD.id;
  
  -- Eğer ilişkili kayıt varsa silmeyi engelle
  IF contact_count > 0 OR contract_count > 0 OR deal_count > 0 THEN
    RAISE EXCEPTION 'Bu firmayı silemezsiniz! İlişkili kayıtlar var: % yetkili, % sözleşme, % fırsat', 
      contact_count, contract_count, deal_count;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_company_delete ON "CustomerCompany";
CREATE TRIGGER trigger_prevent_company_delete
BEFORE DELETE ON "CustomerCompany"
FOR EACH ROW
EXECUTE FUNCTION prevent_customer_company_delete_if_has_data();

-- ============================================
-- BÖLÜM 6: CONTACT → CUSTOMER COMPANY STATS
-- ============================================

-- CustomerCompany'ye contact stats kolonları ekle
ALTER TABLE "CustomerCompany"
ADD COLUMN IF NOT EXISTS "contactsCount" INTEGER DEFAULT 0;

ALTER TABLE "CustomerCompany"
ADD COLUMN IF NOT EXISTS "primaryContactId" UUID REFERENCES "Contact"(id) ON DELETE SET NULL;

-- Contact stats hesaplama
CREATE OR REPLACE FUNCTION calculate_customer_company_contact_stats(company_id UUID)
RETURNS void AS $$
DECLARE
  contacts_count INTEGER;
  primary_contact UUID;
BEGIN
  -- Contact sayısı
  SELECT COUNT(*) INTO contacts_count
  FROM "Contact"
  WHERE "customerCompanyId" = company_id;
  
  -- Primary contact
  SELECT id INTO primary_contact
  FROM "Contact"
  WHERE "customerCompanyId" = company_id
    AND "isPrimary" = true
  LIMIT 1;
  
  -- CustomerCompany güncelle
  UPDATE "CustomerCompany"
  SET 
    "contactsCount" = contacts_count,
    "primaryContactId" = primary_contact
  WHERE id = company_id;
END;
$$ LANGUAGE plpgsql;

-- Contact değiştiğinde CustomerCompany stats güncelle
CREATE OR REPLACE FUNCTION update_customer_company_contact_stats_on_change()
RETURNS TRIGGER AS $$
BEGIN
  -- INSERT veya UPDATE
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW."customerCompanyId" IS NOT NULL THEN
      PERFORM calculate_customer_company_contact_stats(NEW."customerCompanyId");
    END IF;
  END IF;
  
  -- DELETE
  IF TG_OP = 'DELETE' THEN
    IF OLD."customerCompanyId" IS NOT NULL THEN
      PERFORM calculate_customer_company_contact_stats(OLD."customerCompanyId");
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_contact_update_company_stats ON "Contact";
CREATE TRIGGER trigger_contact_update_company_stats
AFTER INSERT OR UPDATE OR DELETE ON "Contact"
FOR EACH ROW
EXECUTE FUNCTION update_customer_company_contact_stats_on_change();

-- ============================================
-- BÖLÜM 7: QUOTE → CONTRACT OTOMASYON
-- ============================================

-- Quote ACCEPTED olduğunda Contract taslağı oluştur
CREATE OR REPLACE FUNCTION create_contract_on_quote_accepted()
RETURNS TRIGGER AS $$
DECLARE
  contract_number VARCHAR;
  contract_id UUID;
BEGIN
  -- Quote ACCEPTED oldu
  IF NEW.status = 'ACCEPTED' AND OLD.status != 'ACCEPTED' THEN
    -- Contract number
    contract_number := 'SOZL-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('contract_number_seq')::TEXT, 4, '0');
    
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
      "companyId"
    )
    VALUES (
      contract_number,
      'Sözleşme - ' || NEW.title,
      NEW."customerId",
      NEW."customerCompanyId",
      NEW."dealId",
      'SERVICE',
      CURRENT_DATE,
      CURRENT_DATE + INTERVAL '1 year',
      NEW."totalAmount" / 1.18, -- KDV'siz tutar
      'TRY',
      18.00,
      NEW."totalAmount",
      'DRAFT',
      'Quote ' || NEW."quoteNumber" || ' onaylandı, otomatik oluşturuldu',
      NEW."companyId"
    )
    RETURNING id INTO contract_id;
    
    -- Quote'a contract linkini ekle
    UPDATE "Quote"
    SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('contractId', contract_id)
    WHERE id = NEW.id;
    
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
      'Taslak Sözleşme Oluşturuldu',
      NEW.title || ' teklifi onaylandı. Taslak sözleşme oluşturuldu: ' || contract_number,
      'info',
      'Contract',
      contract_id,
      NEW."companyId"
    );
    
    -- ActivityLog
    INSERT INTO "ActivityLog" (
      entity,
      action,
      description,
      meta,
      "companyId"
    )
    VALUES (
      'Contract',
      'CREATE',
      'Quote onaylandı, taslak sözleşme oluşturuldu: ' || contract_number,
      jsonb_build_object(
        'quoteId', NEW.id,
        'quoteNumber', NEW."quoteNumber",
        'contractId', contract_id,
        'contractNumber', contract_number
      ),
      NEW."companyId"
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_quote_accepted_create_contract ON "Quote";
CREATE TRIGGER trigger_quote_accepted_create_contract
AFTER UPDATE ON "Quote"
FOR EACH ROW
EXECUTE FUNCTION create_contract_on_quote_accepted();

-- ============================================
-- MIGRATION TAMAMLANDI
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ Migration 035 tamamlandı: Module Integrations & Automations';
  RAISE NOTICE '============================================';
  RAISE NOTICE '📌 Yeni Otomasyonlar:';
  RAISE NOTICE '  1. Contract ACTIVE → Invoice oluştur';
  RAISE NOTICE '  2. Recurring contracts → Otomatik fatura';
  RAISE NOTICE '  3. Meeting → Primary contact bağlantısı';
  RAISE NOTICE '  4. Deal → Primary contact bağlantısı';
  RAISE NOTICE '  5. CustomerCompany → Silme koruması';
  RAISE NOTICE '  6. Contact → CustomerCompany stats';
  RAISE NOTICE '  7. Quote ACCEPTED → Contract taslağı';
  RAISE NOTICE '============================================';
  RAISE NOTICE '🔗 Yeni İlişkiler:';
  RAISE NOTICE '  - Meeting.contactId';
  RAISE NOTICE '  - Deal.contactId';
  RAISE NOTICE '  - CustomerCompany.contactsCount';
  RAISE NOTICE '  - CustomerCompany.primaryContactId';
  RAISE NOTICE '============================================';
END $$;



