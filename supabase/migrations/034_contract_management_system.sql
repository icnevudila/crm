-- ============================================
-- CRM V3 - CONTRACT MANAGEMENT SYSTEM
-- Migration: 034
-- Tarih: 2024
-- Amaç: Sözleşme yönetimi, yenileme takibi, otomasyonlar
-- ============================================

-- ============================================
-- BÖLÜM 1: CONTRACT (SÖZLEŞME) TABLOSU
-- ============================================

CREATE TABLE IF NOT EXISTS "Contract" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "contractNumber" VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- İlişkiler
  "customerId" UUID REFERENCES "Customer"(id) ON DELETE SET NULL,
  "customerCompanyId" UUID REFERENCES "CustomerCompany"(id) ON DELETE SET NULL,
  "dealId" UUID REFERENCES "Deal"(id) ON DELETE SET NULL,
  
  -- Sözleşme Tipi ve Kategorisi
  type VARCHAR(50) DEFAULT 'SERVICE', -- SERVICE/PRODUCT/SUBSCRIPTION/MAINTENANCE/LICENSE/CONSULTING
  category VARCHAR(50), -- Özel kategori (Yazılım, Donanım, Danışmanlık, vb.)
  
  -- Tarihler
  "startDate" DATE NOT NULL,
  "endDate" DATE NOT NULL,
  "signedDate" DATE,
  
  -- Yenileme
  "renewalType" VARCHAR(20) DEFAULT 'MANUAL', -- AUTO/MANUAL/NONE
  "renewalNoticeDays" INTEGER DEFAULT 30, -- Kaç gün önce bildirim gönderilsin
  "nextRenewalDate" DATE,
  "autoRenewEnabled" BOOLEAN DEFAULT false,
  
  -- Faturalandırma
  "billingCycle" VARCHAR(20) DEFAULT 'YEARLY', -- MONTHLY/QUARTERLY/YEARLY/ONE_TIME
  "billingDay" INTEGER, -- Ayın hangi günü faturalanacak
  "paymentTerms" INTEGER DEFAULT 30, -- Ödeme vadesi (gün)
  
  -- Değer
  value DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'TRY',
  "taxRate" DECIMAL(5,2) DEFAULT 18.00,
  "totalValue" DECIMAL(15,2), -- value + tax
  
  -- Durum
  status VARCHAR(20) DEFAULT 'DRAFT', -- DRAFT/ACTIVE/EXPIRED/CANCELLED/RENEWED/SUSPENDED
  
  -- Dökümanlar
  "attachmentUrl" TEXT,
  terms TEXT, -- Sözleşme şartları
  notes TEXT,
  
  -- Onay ve İmza
  "approvedBy" UUID REFERENCES "User"(id) ON DELETE SET NULL,
  "approvedAt" TIMESTAMP WITH TIME ZONE,
  "signedBy" VARCHAR(255), -- Müşteri tarafında imzalayan
  
  -- Meta
  tags TEXT[], -- Etiketler
  metadata JSONB, -- Ekstra bilgiler
  
  -- Sistem
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contract indexes
CREATE INDEX IF NOT EXISTS idx_contract_customer ON "Contract"("customerId");
CREATE INDEX IF NOT EXISTS idx_contract_customer_company ON "Contract"("customerCompanyId");
CREATE INDEX IF NOT EXISTS idx_contract_deal ON "Contract"("dealId");
CREATE INDEX IF NOT EXISTS idx_contract_company ON "Contract"("companyId");
CREATE INDEX IF NOT EXISTS idx_contract_status ON "Contract"(status);
CREATE INDEX IF NOT EXISTS idx_contract_number ON "Contract"("contractNumber");
CREATE INDEX IF NOT EXISTS idx_contract_dates ON "Contract"("startDate", "endDate");
CREATE INDEX IF NOT EXISTS idx_contract_renewal_date ON "Contract"("nextRenewalDate") WHERE "nextRenewalDate" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contract_end_date ON "Contract"("endDate") WHERE status = 'ACTIVE';

-- Contract updatedAt trigger
CREATE OR REPLACE FUNCTION update_contract_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_contract_updated
BEFORE UPDATE ON "Contract"
FOR EACH ROW
EXECUTE FUNCTION update_contract_timestamp();

-- ============================================
-- BÖLÜM 2: CONTRACT RENEWAL (YENİLEME) TABLOSU
-- ============================================

CREATE TABLE IF NOT EXISTS "ContractRenewal" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- İlişkiler
  "contractId" UUID NOT NULL REFERENCES "Contract"(id) ON DELETE CASCADE,
  "originalContractId" UUID REFERENCES "Contract"(id) ON DELETE SET NULL, -- İlk sözleşme
  "previousContractId" UUID REFERENCES "Contract"(id) ON DELETE SET NULL, -- Bir önceki yenileme
  "newContractId" UUID REFERENCES "Contract"(id) ON DELETE SET NULL, -- Yeni oluşturulan sözleşme
  
  -- Yenileme Bilgileri
  "renewalDate" DATE NOT NULL,
  "notificationSentAt" TIMESTAMP WITH TIME ZONE,
  "reminderSentAt" TIMESTAMP WITH TIME ZONE,
  
  -- Değer Değişiklikleri
  "oldValue" DECIMAL(15,2),
  "newValue" DECIMAL(15,2),
  "valueChange" DECIMAL(15,2), -- Fark
  "valueChangePercent" DECIMAL(5,2), -- Yüzde fark
  
  -- Durum
  status VARCHAR(20) DEFAULT 'PENDING', -- PENDING/APPROVED/REJECTED/COMPLETED/CANCELLED
  
  -- Onay
  "requestedBy" UUID REFERENCES "User"(id) ON DELETE SET NULL,
  "approvedBy" UUID REFERENCES "User"(id) ON DELETE SET NULL,
  "approvedAt" TIMESTAMP WITH TIME ZONE,
  
  -- Notlar
  notes TEXT,
  "rejectionReason" TEXT,
  
  -- Sistem
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ContractRenewal indexes
CREATE INDEX IF NOT EXISTS idx_contract_renewal_contract ON "ContractRenewal"("contractId");
CREATE INDEX IF NOT EXISTS idx_contract_renewal_company ON "ContractRenewal"("companyId");
CREATE INDEX IF NOT EXISTS idx_contract_renewal_status ON "ContractRenewal"(status);
CREATE INDEX IF NOT EXISTS idx_contract_renewal_date ON "ContractRenewal"("renewalDate");

-- ============================================
-- BÖLÜM 3: CONTRACT TERMS (SÖZLEŞME MADDELERİ)
-- ============================================

CREATE TABLE IF NOT EXISTS "ContractTerm" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- İlişki
  "contractId" UUID NOT NULL REFERENCES "Contract"(id) ON DELETE CASCADE,
  
  -- Madde Bilgileri
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  "orderIndex" INTEGER DEFAULT 0,
  
  -- Kategori
  category VARCHAR(50), -- SLA/PAYMENT/DELIVERY/WARRANTY/TERMINATION
  
  -- Sistem
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contract_term_contract ON "ContractTerm"("contractId");

-- ============================================
-- BÖLÜM 4: CONTRACT MILESTONE (AŞAMALAR)
-- ============================================

CREATE TABLE IF NOT EXISTS "ContractMilestone" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- İlişki
  "contractId" UUID NOT NULL REFERENCES "Contract"(id) ON DELETE CASCADE,
  
  -- Milestone Bilgileri
  title VARCHAR(255) NOT NULL,
  description TEXT,
  "dueDate" DATE NOT NULL,
  "completedDate" DATE,
  
  -- Değer
  value DECIMAL(15,2),
  "paymentDue" DECIMAL(15,2), -- Bu milestone için ödenecek tutar
  
  -- Durum
  status VARCHAR(20) DEFAULT 'PENDING', -- PENDING/IN_PROGRESS/COMPLETED/DELAYED/CANCELLED
  
  -- Progress
  "progressPercent" INTEGER DEFAULT 0,
  
  -- Notlar
  notes TEXT,
  
  -- Sistem
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contract_milestone_contract ON "ContractMilestone"("contractId");
CREATE INDEX IF NOT EXISTS idx_contract_milestone_due_date ON "ContractMilestone"("dueDate");
CREATE INDEX IF NOT EXISTS idx_contract_milestone_status ON "ContractMilestone"(status);

-- ============================================
-- BÖLÜM 5: OTOMASYONLAR - CONTRACT STATUS UPDATE
-- ============================================

-- Contract expire olduğunda otomatik status güncelleme
CREATE OR REPLACE FUNCTION auto_expire_contracts()
RETURNS void AS $$
BEGIN
  -- Süresi dolan aktif sözleşmeleri EXPIRED yap
  UPDATE "Contract"
  SET 
    status = 'EXPIRED',
    "updatedAt" = NOW()
  WHERE 
    status = 'ACTIVE'
    AND "endDate" < CURRENT_DATE;
    
  -- ActivityLog'a yaz
  INSERT INTO "ActivityLog" (
    entity,
    action,
    description,
    meta,
    "companyId"
  )
  SELECT 
    'Contract',
    'UPDATE',
    'Sözleşme süresi doldu: ' || title,
    jsonb_build_object(
      'contractId', id,
      'contractNumber', "contractNumber",
      'endDate', "endDate"
    ),
    "companyId"
  FROM "Contract"
  WHERE 
    status = 'EXPIRED'
    AND "endDate" = CURRENT_DATE - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- BÖLÜM 6: OTOMASYONLAR - RENEWAL NOTIFICATIONS
-- ============================================

-- Yenileme bildirimlerini oluştur
CREATE OR REPLACE FUNCTION create_renewal_notifications()
RETURNS void AS $$
DECLARE
  contract_rec RECORD;
  notification_date DATE;
BEGIN
  -- Aktif sözleşmeleri kontrol et
  FOR contract_rec IN 
    SELECT 
      c.id,
      c."contractNumber",
      c.title,
      c."endDate",
      c."renewalNoticeDays",
      c."customerId",
      c."companyId"
    FROM "Contract" c
    WHERE 
      c.status = 'ACTIVE'
      AND c."renewalType" != 'NONE'
      AND c."endDate" IS NOT NULL
      AND c."endDate" > CURRENT_DATE
  LOOP
    -- Bildirim tarihi hesapla
    notification_date := contract_rec."endDate" - INTERVAL '1 day' * contract_rec."renewalNoticeDays";
    
    -- Bugün bildirim gönderilmesi gereken sözleşme mi?
    IF notification_date = CURRENT_DATE THEN
      -- ContractRenewal kaydı oluştur (eğer yoksa)
      INSERT INTO "ContractRenewal" (
        "contractId",
        "renewalDate",
        "oldValue",
        status,
        "companyId"
      )
      SELECT 
        contract_rec.id,
        contract_rec."endDate",
        c.value,
        'PENDING',
        contract_rec."companyId"
      FROM "Contract" c
      WHERE c.id = contract_rec.id
      ON CONFLICT DO NOTHING;
      
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
        'Sözleşme Yenileme Bildirimi',
        contract_rec.title || ' sözleşmesi ' || contract_rec."endDate" || ' tarihinde sona erecek. Yenileme işlemini başlatın.',
        'warning',
        'Contract',
        contract_rec.id,
        contract_rec."companyId"
      );
      
      -- ActivityLog'a yaz
      INSERT INTO "ActivityLog" (
        entity,
        action,
        description,
        meta,
        "companyId"
      )
      VALUES (
        'Contract',
        'NOTIFICATION',
        'Sözleşme yenileme bildirimi gönderildi: ' || contract_rec.title,
        jsonb_build_object(
          'contractId', contract_rec.id,
          'contractNumber', contract_rec."contractNumber",
          'endDate', contract_rec."endDate",
          'daysRemaining', contract_rec."endDate" - CURRENT_DATE
        ),
        contract_rec."companyId"
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- BÖLÜM 7: OTOMASYONLAR - AUTO RENEWAL
-- ============================================

-- Otomatik yenileme (auto-renew enabled olan sözleşmeler için)
CREATE OR REPLACE FUNCTION auto_renew_contracts()
RETURNS void AS $$
DECLARE
  contract_rec RECORD;
  new_contract_id UUID;
  new_contract_number VARCHAR;
BEGIN
  -- Auto-renew aktif, süresi 7 gün içinde dolacak sözleşmeler
  FOR contract_rec IN 
    SELECT *
    FROM "Contract"
    WHERE 
      status = 'ACTIVE'
      AND "autoRenewEnabled" = true
      AND "renewalType" = 'AUTO'
      AND "endDate" BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
  LOOP
    -- Yeni contract number oluştur
    new_contract_number := contract_rec."contractNumber" || '-R' || EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- Yeni sözleşme oluştur
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
      "companyId"
    )
    VALUES (
      new_contract_number,
      contract_rec.title || ' (Yenileme)',
      contract_rec.description,
      contract_rec."customerId",
      contract_rec."customerCompanyId",
      contract_rec."dealId",
      contract_rec.type,
      contract_rec.category,
      contract_rec."endDate" + INTERVAL '1 day', -- Eski bitiş + 1 gün
      contract_rec."endDate" + INTERVAL '1 year', -- 1 yıl daha
      contract_rec."renewalType",
      contract_rec."renewalNoticeDays",
      contract_rec."autoRenewEnabled",
      contract_rec."billingCycle",
      contract_rec."billingDay",
      contract_rec."paymentTerms",
      contract_rec.value, -- Aynı değer (fiyat artışı manuel yapılmalı)
      contract_rec.currency,
      contract_rec."taxRate",
      contract_rec."totalValue",
      'ACTIVE',
      contract_rec.terms,
      contract_rec."companyId"
    )
    RETURNING id INTO new_contract_id;
    
    -- Eski sözleşmeyi RENEWED yap
    UPDATE "Contract"
    SET 
      status = 'RENEWED',
      "updatedAt" = NOW()
    WHERE id = contract_rec.id;
    
    -- ContractRenewal kaydı oluştur
    INSERT INTO "ContractRenewal" (
      "contractId",
      "originalContractId",
      "previousContractId",
      "newContractId",
      "renewalDate",
      "oldValue",
      "newValue",
      "valueChange",
      status,
      "companyId"
    )
    VALUES (
      new_contract_id,
      contract_rec.id,
      contract_rec.id,
      new_contract_id,
      CURRENT_DATE,
      contract_rec.value,
      contract_rec.value,
      0,
      'COMPLETED',
      contract_rec."companyId"
    );
    
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
      'Sözleşme Otomatik Yenilendi',
      contract_rec.title || ' sözleşmesi otomatik olarak yenilendi. Yeni sözleşme numarası: ' || new_contract_number,
      'success',
      'Contract',
      new_contract_id,
      contract_rec."companyId"
    );
    
    -- ActivityLog'a yaz
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
      'Sözleşme otomatik yenilendi: ' || contract_rec.title,
      jsonb_build_object(
        'oldContractId', contract_rec.id,
        'newContractId', new_contract_id,
        'oldContractNumber', contract_rec."contractNumber",
        'newContractNumber', new_contract_number,
        'renewalDate', CURRENT_DATE
      ),
      contract_rec."companyId"
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- BÖLÜM 8: CUSTOMER İLE İLİŞKİ GÜÇLENDİRME
-- ============================================

-- Customer'a contract stats kolonları ekle
ALTER TABLE "Customer"
ADD COLUMN IF NOT EXISTS "activeContractsCount" INTEGER DEFAULT 0;

ALTER TABLE "Customer"
ADD COLUMN IF NOT EXISTS "totalContractValue" DECIMAL(15,2) DEFAULT 0;

ALTER TABLE "Customer"
ADD COLUMN IF NOT EXISTS "lastContractDate" DATE;

-- Customer contract stats hesaplama function
CREATE OR REPLACE FUNCTION calculate_customer_contract_stats(customer_id UUID)
RETURNS void AS $$
DECLARE
  active_count INTEGER;
  total_value DECIMAL;
  last_date DATE;
BEGIN
  -- Aktif sözleşme sayısı
  SELECT COUNT(*) INTO active_count
  FROM "Contract"
  WHERE "customerId" = customer_id
    AND status = 'ACTIVE';
  
  -- Toplam sözleşme değeri (aktif olanlar)
  SELECT COALESCE(SUM(value), 0) INTO total_value
  FROM "Contract"
  WHERE "customerId" = customer_id
    AND status = 'ACTIVE';
  
  -- Son sözleşme tarihi
  SELECT MAX("startDate") INTO last_date
  FROM "Contract"
  WHERE "customerId" = customer_id;
  
  -- Customer güncelle
  UPDATE "Customer"
  SET 
    "activeContractsCount" = active_count,
    "totalContractValue" = total_value,
    "lastContractDate" = last_date
  WHERE id = customer_id;
END;
$$ LANGUAGE plpgsql;

-- Contract değiştiğinde Customer stats güncelle
CREATE OR REPLACE FUNCTION update_customer_contract_stats_on_change()
RETURNS TRIGGER AS $$
BEGIN
  -- INSERT veya UPDATE
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW."customerId" IS NOT NULL THEN
      PERFORM calculate_customer_contract_stats(NEW."customerId");
    END IF;
  END IF;
  
  -- DELETE
  IF TG_OP = 'DELETE' THEN
    IF OLD."customerId" IS NOT NULL THEN
      PERFORM calculate_customer_contract_stats(OLD."customerId");
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_contract_update_customer_stats
AFTER INSERT OR UPDATE OR DELETE ON "Contract"
FOR EACH ROW
EXECUTE FUNCTION update_customer_contract_stats_on_change();

-- ============================================
-- BÖLÜM 9: DEAL İLE İLİŞKİ
-- ============================================

-- Deal WON olduğunda otomatik Contract (taslak) oluştur
CREATE OR REPLACE FUNCTION create_contract_on_deal_won()
RETURNS TRIGGER AS $$
DECLARE
  new_contract_number VARCHAR;
  contract_id UUID;
BEGIN
  -- Deal WON oldu ve daha önce contract oluşturulmadıysa
  IF NEW.stage = 'WON' AND OLD.stage != 'WON' THEN
    -- Contract number oluştur
    new_contract_number := 'SOZL-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('contract_number_seq')::TEXT, 4, '0');
    
    -- Draft contract oluştur
    INSERT INTO "Contract" (
      "contractNumber",
      title,
      "customerId",
      "dealId",
      type,
      "startDate",
      "endDate",
      value,
      status,
      "companyId"
    )
    VALUES (
      new_contract_number,
      'Sözleşme - ' || NEW.title,
      NEW."customerId",
      NEW.id,
      'SERVICE',
      CURRENT_DATE,
      CURRENT_DATE + INTERVAL '1 year',
      NEW.value,
      'DRAFT',
      NEW."companyId"
    )
    RETURNING id INTO contract_id;
    
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
      NEW.title || ' fırsatı kazanıldı. Taslak sözleşme oluşturuldu: ' || new_contract_number,
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
      'Deal kazanıldı, taslak sözleşme oluşturuldu: ' || new_contract_number,
      jsonb_build_object(
        'dealId', NEW.id,
        'contractId', contract_id,
        'contractNumber', new_contract_number
      ),
      NEW."companyId"
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Sequence oluştur (contract number için)
CREATE SEQUENCE IF NOT EXISTS contract_number_seq START 1;

DROP TRIGGER IF EXISTS trigger_deal_won_create_contract ON "Deal";
CREATE TRIGGER trigger_deal_won_create_contract
AFTER UPDATE ON "Deal"
FOR EACH ROW
EXECUTE FUNCTION create_contract_on_deal_won();

-- ============================================
-- BÖLÜM 10: RLS (ROW LEVEL SECURITY)
-- ============================================

-- Contract RLS
ALTER TABLE "Contract" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Contract company isolation" ON "Contract";
CREATE POLICY "Contract company isolation"
ON "Contract"
FOR ALL
USING ("companyId" = current_setting('app.current_company_id', TRUE)::UUID);

-- ContractRenewal RLS
ALTER TABLE "ContractRenewal" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ContractRenewal company isolation" ON "ContractRenewal";
CREATE POLICY "ContractRenewal company isolation"
ON "ContractRenewal"
FOR ALL
USING ("companyId" = current_setting('app.current_company_id', TRUE)::UUID);

-- ContractTerm RLS
ALTER TABLE "ContractTerm" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ContractTerm company isolation" ON "ContractTerm";
CREATE POLICY "ContractTerm company isolation"
ON "ContractTerm"
FOR ALL
USING ("companyId" = current_setting('app.current_company_id', TRUE)::UUID);

-- ContractMilestone RLS
ALTER TABLE "ContractMilestone" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ContractMilestone company isolation" ON "ContractMilestone";
CREATE POLICY "ContractMilestone company isolation"
ON "ContractMilestone"
FOR ALL
USING ("companyId" = current_setting('app.current_company_id', TRUE)::UUID);

-- ============================================
-- BÖLÜM 11: MRR/ARR HESAPLAMA (RECURRING REVENUE)
-- ============================================

-- MRR (Monthly Recurring Revenue) hesaplama
CREATE OR REPLACE FUNCTION calculate_mrr()
RETURNS DECIMAL AS $$
DECLARE
  total_mrr DECIMAL := 0;
BEGIN
  SELECT 
    SUM(
      CASE 
        WHEN "billingCycle" = 'MONTHLY' THEN value
        WHEN "billingCycle" = 'QUARTERLY' THEN value / 3
        WHEN "billingCycle" = 'YEARLY' THEN value / 12
        ELSE 0
      END
    ) INTO total_mrr
  FROM "Contract"
  WHERE status = 'ACTIVE'
    AND type = 'SUBSCRIPTION';
  
  RETURN COALESCE(total_mrr, 0);
END;
$$ LANGUAGE plpgsql;

-- ARR (Annual Recurring Revenue) hesaplama
CREATE OR REPLACE FUNCTION calculate_arr()
RETURNS DECIMAL AS $$
DECLARE
  total_arr DECIMAL := 0;
BEGIN
  SELECT 
    SUM(
      CASE 
        WHEN "billingCycle" = 'MONTHLY' THEN value * 12
        WHEN "billingCycle" = 'QUARTERLY' THEN value * 4
        WHEN "billingCycle" = 'YEARLY' THEN value
        ELSE 0
      END
    ) INTO total_arr
  FROM "Contract"
  WHERE status = 'ACTIVE'
    AND type = 'SUBSCRIPTION';
  
  RETURN COALESCE(total_arr, 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- MIGRATION TAMAMLANDI
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 034 tamamlandı: Contract Management System';
  RAISE NOTICE '📄 Yeni tablolar: Contract, ContractRenewal, ContractTerm, ContractMilestone';
  RAISE NOTICE '🤖 Otomasyonlar: Auto-expire, Renewal notifications, Auto-renew, Deal→Contract';
  RAISE NOTICE '📊 Functions: MRR/ARR calculation, Customer contract stats';
  RAISE NOTICE '🔐 RLS policies aktif';
END $$;



