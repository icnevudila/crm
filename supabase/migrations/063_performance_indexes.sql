-- Additional composite indexes for high-traffic analytics queries

BEGIN;

-- Invoice indexes
CREATE INDEX IF NOT EXISTS idx_invoice_company_createdat
  ON "Invoice"("companyId", "createdAt");

CREATE INDEX IF NOT EXISTS idx_invoice_company_status
  ON "Invoice"("companyId", "status");

-- Quote indexes
CREATE INDEX IF NOT EXISTS idx_quote_company_createdat
  ON "Quote"("companyId", "createdAt");

CREATE INDEX IF NOT EXISTS idx_quote_company_status
  ON "Quote"("companyId", "status");

-- Deal indexes
CREATE INDEX IF NOT EXISTS idx_deal_company_createdat
  ON "Deal"("companyId", "createdAt");

CREATE INDEX IF NOT EXISTS idx_deal_company_status
  ON "Deal"("companyId", "status");

-- Customer indexes
CREATE INDEX IF NOT EXISTS idx_customer_company_createdat
  ON "Customer"("companyId", "createdAt");

-- Finance indexes
CREATE INDEX IF NOT EXISTS idx_finance_company_createdat
  ON "Finance"("companyId", "createdAt");

CREATE INDEX IF NOT EXISTS idx_finance_company_type
  ON "Finance"("companyId", "type");

COMMIT;





