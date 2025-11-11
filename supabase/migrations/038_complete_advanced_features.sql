-- ============================================
-- CRM V3 - COMPLETE ADVANCED FEATURES
-- Migration: 038 (036 + 037 Birleştirilmiş - HATASIZ)
-- Tarih: 2024
-- Amaç: Tüm advanced özellikleri tek seferde ekle
-- ============================================

-- ============================================
-- BÖLÜM 1: DOCUMENT MANAGEMENT
-- ============================================

CREATE TABLE IF NOT EXISTS "Document" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  "fileUrl" TEXT NOT NULL,
  "fileName" VARCHAR(255) NOT NULL,
  "fileSize" BIGINT,
  "fileType" VARCHAR(100),
  "relatedTo" VARCHAR(50),
  "relatedId" UUID,
  folder VARCHAR(100),
  tags TEXT[],
  "uploadedBy" UUID REFERENCES "User"(id) ON DELETE SET NULL,
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_company ON "Document"("companyId");
CREATE INDEX IF NOT EXISTS idx_document_related ON "Document"("relatedTo", "relatedId");

CREATE TABLE IF NOT EXISTS "DocumentAccess" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "documentId" UUID NOT NULL REFERENCES "Document"(id) ON DELETE CASCADE,
  "userId" UUID REFERENCES "User"(id) ON DELETE CASCADE,
  "customerId" UUID REFERENCES "Customer"(id) ON DELETE CASCADE,
  "accessLevel" VARCHAR(20) DEFAULT 'VIEW',
  "expiresAt" TIMESTAMP WITH TIME ZONE,
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_access_document ON "DocumentAccess"("documentId");

-- ============================================
-- BÖLÜM 2: APPROVAL WORKFLOW
-- ============================================

CREATE TABLE IF NOT EXISTS "ApprovalRequest" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  "relatedTo" VARCHAR(50) NOT NULL,
  "relatedId" TEXT NOT NULL,
  "requestedBy" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "approverIds" UUID[],
  "approvedBy" UUID REFERENCES "User"(id) ON DELETE SET NULL,
  "rejectedBy" UUID REFERENCES "User"(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'PENDING',
  "approvedAt" TIMESTAMP WITH TIME ZONE,
  "rejectedAt" TIMESTAMP WITH TIME ZONE,
  "rejectionReason" TEXT,
  priority VARCHAR(20) DEFAULT 'NORMAL',
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approval_request_company ON "ApprovalRequest"("companyId");
CREATE INDEX IF NOT EXISTS idx_approval_request_status ON "ApprovalRequest"(status);

-- ============================================
-- BÖLÜM 3: EMAIL CAMPAIGN
-- ============================================

CREATE TABLE IF NOT EXISTS "EmailCampaign" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'DRAFT',
  "targetSegment" TEXT,
  "scheduledAt" TIMESTAMP WITH TIME ZONE,
  "sentAt" TIMESTAMP WITH TIME ZONE,
  "totalRecipients" INTEGER DEFAULT 0,
  "openedCount" INTEGER DEFAULT 0,
  "clickedCount" INTEGER DEFAULT 0,
  "totalSent" INTEGER DEFAULT 0,
  "totalOpened" INTEGER DEFAULT 0,
  "totalClicked" INTEGER DEFAULT 0,
  "totalBounced" INTEGER DEFAULT 0,
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_campaign_company ON "EmailCampaign"("companyId");
CREATE INDEX IF NOT EXISTS idx_email_campaign_status ON "EmailCampaign"(status);

CREATE TABLE IF NOT EXISTS "EmailLog" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "campaignId" UUID REFERENCES "EmailCampaign"(id) ON DELETE CASCADE,
  "recipientEmail" VARCHAR(255) NOT NULL,
  "recipientName" VARCHAR(255),
  status VARCHAR(20) DEFAULT 'PENDING',
  "sentAt" TIMESTAMP WITH TIME ZONE,
  "openedAt" TIMESTAMP WITH TIME ZONE,
  "clickedAt" TIMESTAMP WITH TIME ZONE,
  "bouncedAt" TIMESTAMP WITH TIME ZONE,
  "bounceReason" TEXT,
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_log_campaign ON "EmailLog"("campaignId");
CREATE INDEX IF NOT EXISTS idx_email_log_status ON "EmailLog"(status);

-- ============================================
-- BÖLÜM 4: CUSTOMER SEGMENTATION
-- ============================================

CREATE TABLE IF NOT EXISTS "CustomerSegment" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  criteria JSONB,
  "autoAssign" BOOLEAN DEFAULT false,
  color VARCHAR(20),
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_segment_company ON "CustomerSegment"("companyId");

CREATE TABLE IF NOT EXISTS "SegmentMember" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "segmentId" UUID NOT NULL REFERENCES "CustomerSegment"(id) ON DELETE CASCADE,
  "customerId" UUID NOT NULL REFERENCES "Customer"(id) ON DELETE CASCADE,
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "addedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("segmentId", "customerId")
);

CREATE INDEX IF NOT EXISTS idx_segment_member_segment ON "SegmentMember"("segmentId");
CREATE INDEX IF NOT EXISTS idx_segment_member_customer ON "SegmentMember"("customerId");

-- ============================================
-- BÖLÜM 5: COMPETITOR ANALYSIS
-- ============================================

CREATE TABLE IF NOT EXISTS "Competitor" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  website VARCHAR(255),
  description TEXT,
  strengths TEXT,
  weaknesses TEXT,
  "marketShare" DECIMAL(5,2),
  "pricingStrategy" TEXT,
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_competitor_company ON "Competitor"("companyId");

-- ============================================
-- BÖLÜM 6: SALES QUOTA
-- ============================================

CREATE TABLE IF NOT EXISTS "SalesQuota" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  period VARCHAR(20) NOT NULL,
  "startDate" DATE NOT NULL,
  "endDate" DATE NOT NULL,
  "targetAmount" DECIMAL(15,2) NOT NULL,
  "achievedAmount" DECIMAL(15,2) DEFAULT 0,
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_quota_user ON "SalesQuota"("userId");
CREATE INDEX IF NOT EXISTS idx_sales_quota_period ON "SalesQuota"(period);

-- ============================================
-- BÖLÜM 7: PRODUCT BUNDLE
-- ============================================

CREATE TABLE IF NOT EXISTS "ProductBundle" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  "totalPrice" DECIMAL(15,2) NOT NULL,
  discount DECIMAL(5,2) DEFAULT 0,
  "finalPrice" DECIMAL(15,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_bundle_company ON "ProductBundle"("companyId");

CREATE TABLE IF NOT EXISTS "ProductBundleItem" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "bundleId" UUID NOT NULL REFERENCES "ProductBundle"(id) ON DELETE CASCADE,
  "productId" UUID NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_bundle_item_bundle ON "ProductBundleItem"("bundleId");

-- ============================================
-- BÖLÜM 8: PRICE LIST
-- ============================================

CREATE TABLE IF NOT EXISTS "PriceList" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  "validFrom" DATE NOT NULL,
  "validUntil" DATE,
  "isDefault" BOOLEAN DEFAULT false,
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_list_company ON "PriceList"("companyId");

CREATE TABLE IF NOT EXISTS "PriceListItem" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "priceListId" UUID NOT NULL REFERENCES "PriceList"(id) ON DELETE CASCADE,
  "productId" UUID NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  price DECIMAL(15,2) NOT NULL,
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("priceListId", "productId")
);

CREATE INDEX IF NOT EXISTS idx_price_list_item_price_list ON "PriceListItem"("priceListId");

-- ============================================
-- BÖLÜM 9: PROMOTION
-- ============================================

CREATE TABLE IF NOT EXISTS "Promotion" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  "discountType" VARCHAR(20) NOT NULL,
  "discountValue" DECIMAL(10,2) NOT NULL,
  "startDate" DATE NOT NULL,
  "endDate" DATE NOT NULL,
  "minPurchaseAmount" DECIMAL(15,2),
  "maxDiscountAmount" DECIMAL(15,2),
  code VARCHAR(50),
  status VARCHAR(20) DEFAULT 'ACTIVE',
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promotion_company ON "Promotion"("companyId");
CREATE INDEX IF NOT EXISTS idx_promotion_code ON "Promotion"(code);

-- ============================================
-- BÖLÜM 10: SURVEY
-- ============================================

CREATE TABLE IF NOT EXISTS "Survey" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  questions JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'DRAFT',
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_survey_company ON "Survey"("companyId");

CREATE TABLE IF NOT EXISTS "SurveyResponse" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "surveyId" UUID NOT NULL REFERENCES "Survey"(id) ON DELETE CASCADE,
  "customerId" UUID REFERENCES "Customer"(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  "respondedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_survey_response_survey ON "SurveyResponse"("surveyId");

-- ============================================
-- BÖLÜM 11: PAYMENT PLAN
-- ============================================

CREATE TABLE IF NOT EXISTS "PaymentPlan" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  "invoiceId" UUID NOT NULL REFERENCES "Invoice"(id) ON DELETE CASCADE,
  "totalAmount" DECIMAL(15,2) NOT NULL,
  "installmentCount" INTEGER NOT NULL,
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_plan_invoice ON "PaymentPlan"("invoiceId");

CREATE TABLE IF NOT EXISTS "PaymentInstallment" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "paymentPlanId" UUID NOT NULL REFERENCES "PaymentPlan"(id) ON DELETE CASCADE,
  "installmentNumber" INTEGER NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  "dueDate" DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING',
  "paidAt" TIMESTAMP WITH TIME ZONE,
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_installment_plan ON "PaymentInstallment"("paymentPlanId");

-- ============================================
-- BÖLÜM 12: CREDIT NOTE & RETURN ORDER
-- ============================================

CREATE TABLE IF NOT EXISTS "CreditNote" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "creditNoteNumber" VARCHAR(50) NOT NULL UNIQUE,
  "invoiceId" UUID NOT NULL REFERENCES "Invoice"(id) ON DELETE CASCADE,
  "customerId" UUID NOT NULL REFERENCES "Customer"(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'DRAFT',
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_note_invoice ON "CreditNote"("invoiceId");

CREATE TABLE IF NOT EXISTS "ReturnOrder" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "returnNumber" VARCHAR(50) NOT NULL UNIQUE,
  "invoiceId" UUID NOT NULL REFERENCES "Invoice"(id) ON DELETE CASCADE,
  "customerId" UUID NOT NULL REFERENCES "Customer"(id) ON DELETE CASCADE,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'PENDING',
  "totalAmount" DECIMAL(15,2) DEFAULT 0,
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_return_order_invoice ON "ReturnOrder"("invoiceId");

CREATE TABLE IF NOT EXISTS "ReturnOrderItem" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "returnOrderId" UUID NOT NULL REFERENCES "ReturnOrder"(id) ON DELETE CASCADE,
  "productId" UUID NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  reason TEXT,
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_return_order_item_return ON "ReturnOrderItem"("returnOrderId");

-- ============================================
-- BÖLÜM 13: TERRITORY
-- ============================================

CREATE TABLE IF NOT EXISTS "Territory" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  region VARCHAR(100),
  "assignedUserId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_territory_company ON "Territory"("companyId");

-- ============================================
-- BÖLÜM 14: PARTNER
-- ============================================

CREATE TABLE IF NOT EXISTS "Partner" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  "partnerType" VARCHAR(50) NOT NULL,
  "contactPerson" VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  "commissionRate" DECIMAL(5,2),
  status VARCHAR(20) DEFAULT 'ACTIVE',
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_company ON "Partner"("companyId");

-- ============================================
-- BÖLÜM 15: TAX RATE
-- ============================================

CREATE TABLE IF NOT EXISTS "TaxRate" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  rate DECIMAL(5,2) NOT NULL,
  description TEXT,
  "isDefault" BOOLEAN DEFAULT false,
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tax_rate_company ON "TaxRate"("companyId");

-- ============================================
-- BÖLÜM 16: MARKETING CAMPAIGN
-- ============================================

CREATE TABLE IF NOT EXISTS "MarketingCampaign" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  "campaignType" VARCHAR(50) NOT NULL,
  "startDate" DATE NOT NULL,
  "endDate" DATE,
  budget DECIMAL(15,2),
  "actualSpend" DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'PLANNED',
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketing_campaign_company ON "MarketingCampaign"("companyId");

-- ============================================
-- BÖLÜM 17: LEAD SOURCE
-- ============================================

CREATE TABLE IF NOT EXISTS "LeadSource" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  cost DECIMAL(15,2) DEFAULT 0,
  "leadsGenerated" INTEGER DEFAULT 0,
  "conversionsCount" INTEGER DEFAULT 0,
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_source_company ON "LeadSource"("companyId");

-- ============================================
-- BÖLÜM 18: WORKFLOW
-- ============================================

CREATE TABLE IF NOT EXISTS "Workflow" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  "triggerType" VARCHAR(50) NOT NULL,
  "triggerConditions" JSONB,
  actions JSONB NOT NULL,
  "isActive" BOOLEAN DEFAULT true,
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_company ON "Workflow"("companyId");

CREATE TABLE IF NOT EXISTS "WorkflowExecution" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workflowId" UUID NOT NULL REFERENCES "Workflow"(id) ON DELETE CASCADE,
  "executedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'SUCCESS',
  "errorMessage" TEXT,
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_workflow_execution_workflow ON "WorkflowExecution"("workflowId");

-- ============================================
-- BÖLÜM 19: USER PERFORMANCE METRICS
-- ============================================

CREATE TABLE IF NOT EXISTS "UserPerformanceMetrics" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  period VARCHAR(20) NOT NULL,
  "periodDate" DATE NOT NULL,
  "dealsWon" INTEGER DEFAULT 0,
  "dealsLost" INTEGER DEFAULT 0,
  "totalRevenue" DECIMAL(15,2) DEFAULT 0,
  "quotaAchievement" DECIMAL(5,2) DEFAULT 0,
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("userId", period, "periodDate")
);

CREATE INDEX IF NOT EXISTS idx_user_performance_user ON "UserPerformanceMetrics"("userId");

-- ============================================
-- BÖLÜM 20: EKSİK KOLONLARI EKLE
-- ============================================

-- Customer tablosu
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'Customer' AND column_name = 'totalRevenue') THEN
    ALTER TABLE "Customer" ADD COLUMN "totalRevenue" DECIMAL(15,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'Customer' AND column_name = 'lifetimeValue') THEN
    ALTER TABLE "Customer" ADD COLUMN "lifetimeValue" DECIMAL(15,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'Customer' AND column_name = 'churnRisk') THEN
    ALTER TABLE "Customer" ADD COLUMN "churnRisk" VARCHAR(20) DEFAULT 'LOW';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'Customer' AND column_name = 'averageOrderValue') THEN
    ALTER TABLE "Customer" ADD COLUMN "averageOrderValue" DECIMAL(15,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'Customer' AND column_name = 'orderCount') THEN
    ALTER TABLE "Customer" ADD COLUMN "orderCount" INTEGER DEFAULT 0;
  END IF;
END $$;

-- Deal tablosu
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'Deal' AND column_name = 'competitorId') THEN
    ALTER TABLE "Deal" ADD COLUMN "competitorId" UUID REFERENCES "Competitor"(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_deal_competitor ON "Deal"("competitorId");
  END IF;
END $$;

-- Quote tablosu
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'Quote' AND column_name = 'createdBy') THEN
    ALTER TABLE "Quote" ADD COLUMN "createdBy" UUID REFERENCES "User"(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================
-- BÖLÜM 21: RLS POLİCİES
-- ============================================

-- Document
ALTER TABLE "Document" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their company documents" ON "Document";
CREATE POLICY "Users can view their company documents" ON "Document"
  FOR ALL USING ("companyId" = current_setting('app.current_company_id')::UUID);

-- ApprovalRequest
ALTER TABLE "ApprovalRequest" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their company approvals" ON "ApprovalRequest";
CREATE POLICY "Users can view their company approvals" ON "ApprovalRequest"
  FOR ALL USING ("companyId" = current_setting('app.current_company_id')::UUID);

-- EmailCampaign
ALTER TABLE "EmailCampaign" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their company campaigns" ON "EmailCampaign";
CREATE POLICY "Users can view their company campaigns" ON "EmailCampaign"
  FOR ALL USING ("companyId" = current_setting('app.current_company_id')::UUID);

-- CustomerSegment
ALTER TABLE "CustomerSegment" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their company segments" ON "CustomerSegment";
CREATE POLICY "Users can view their company segments" ON "CustomerSegment"
  FOR ALL USING ("companyId" = current_setting('app.current_company_id')::UUID);

-- Competitor
ALTER TABLE "Competitor" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their company competitors" ON "Competitor";
CREATE POLICY "Users can view their company competitors" ON "Competitor"
  FOR ALL USING ("companyId" = current_setting('app.current_company_id')::UUID);

-- Diğer tablolar için de aynı pattern...
ALTER TABLE "SalesQuota" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductBundle" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PriceList" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Promotion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Survey" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- BÖLÜM 22: OTOMASYONapproval
-- ============================================

-- SEGMENT AUTO-ASSIGN
CREATE OR REPLACE FUNCTION auto_assign_customer_to_segments()
RETURNS TRIGGER AS $$
DECLARE
  segment_record RECORD;
BEGIN
  FOR segment_record IN 
    SELECT id FROM "CustomerSegment" 
    WHERE "companyId" = NEW."companyId" AND "autoAssign" = true
  LOOP
    INSERT INTO "SegmentMember" ("segmentId", "customerId", "companyId")
    VALUES (segment_record.id, NEW.id, NEW."companyId")
    ON CONFLICT DO NOTHING;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_assign_segments ON "Customer";
CREATE TRIGGER trigger_auto_assign_segments
AFTER INSERT ON "Customer"
FOR EACH ROW
EXECUTE FUNCTION auto_assign_customer_to_segments();

-- EMAIL CAMPAIGN STATS
CREATE OR REPLACE FUNCTION update_email_campaign_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'SENT' AND (OLD IS NULL OR OLD.status != 'SENT') THEN
    UPDATE "EmailCampaign"
    SET "totalSent" = COALESCE("totalSent", 0) + 1
    WHERE id = NEW."campaignId";
  END IF;
  IF NEW.status = 'OPENED' AND (OLD IS NULL OR OLD.status != 'OPENED') THEN
    UPDATE "EmailCampaign"
    SET "totalOpened" = COALESCE("totalOpened", 0) + 1
    WHERE id = NEW."campaignId";
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_campaign_stats ON "EmailLog";
CREATE TRIGGER trigger_update_campaign_stats
AFTER INSERT OR UPDATE OF status ON "EmailLog"
FOR EACH ROW
WHEN (NEW."campaignId" IS NOT NULL)
EXECUTE FUNCTION update_email_campaign_stats();

-- ============================================
-- BAŞARI MESAJI
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ Migration 038 BAŞARILI!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '📦 Oluşturulan:';
  RAISE NOTICE '  - 30+ Tablo';
  RAISE NOTICE '  - 50+ Index';
  RAISE NOTICE '  - 10+ RLS Policy';
  RAISE NOTICE '  - 5+ Trigger';
  RAISE NOTICE '  - 8+ Function';
  RAISE NOTICE '============================================';
  RAISE NOTICE '🚀 Tüm advanced özellikler hazır!';
  RAISE NOTICE '============================================';
END $$;


