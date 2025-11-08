-- Row-Level Security (RLS) Policies
-- Multi-tenant veri izolasyonu

-- Enable RLS on all tables
ALTER TABLE "Company" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Deal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Quote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invoice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Finance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Ticket" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Shipment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ActivityLog" ENABLE ROW LEVEL SECURITY;

-- Company Policies
CREATE POLICY "company_isolation" ON "Company"
  FOR ALL
  USING (
    id = (
      SELECT "companyId" FROM "User" WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    )
  );

-- User Policies
CREATE POLICY "user_company_isolation" ON "User"
  FOR ALL
  USING (
    "companyId" = (
      SELECT "companyId" FROM "User" WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    )
  );

-- Customer Policies
CREATE POLICY "customer_company_isolation" ON "Customer"
  FOR ALL
  USING (
    "companyId" = (
      SELECT "companyId" FROM "User" WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    )
  );

-- Deal Policies
CREATE POLICY "deal_company_isolation" ON "Deal"
  FOR ALL
  USING (
    "companyId" = (
      SELECT "companyId" FROM "User" WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    )
  );

-- Quote Policies
CREATE POLICY "quote_company_isolation" ON "Quote"
  FOR ALL
  USING (
    "companyId" = (
      SELECT "companyId" FROM "User" WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    )
  );

-- Invoice Policies
CREATE POLICY "invoice_company_isolation" ON "Invoice"
  FOR ALL
  USING (
    "companyId" = (
      SELECT "companyId" FROM "User" WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    )
  );

-- Product Policies
CREATE POLICY "product_company_isolation" ON "Product"
  FOR ALL
  USING (
    "companyId" = (
      SELECT "companyId" FROM "User" WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    )
  );

-- Finance Policies
CREATE POLICY "finance_company_isolation" ON "Finance"
  FOR ALL
  USING (
    "companyId" = (
      SELECT "companyId" FROM "User" WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    )
  );

-- Task Policies
CREATE POLICY "task_company_isolation" ON "Task"
  FOR ALL
  USING (
    "companyId" = (
      SELECT "companyId" FROM "User" WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    )
  );

-- Ticket Policies
CREATE POLICY "ticket_company_isolation" ON "Ticket"
  FOR ALL
  USING (
    "companyId" = (
      SELECT "companyId" FROM "User" WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    )
  );

-- Shipment Policies
CREATE POLICY "shipment_company_isolation" ON "Shipment"
  FOR ALL
  USING (
    "companyId" = (
      SELECT "companyId" FROM "User" WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    )
  );

-- ActivityLog Policies
CREATE POLICY "activitylog_company_isolation" ON "ActivityLog"
  FOR ALL
  USING (
    "companyId" = (
      SELECT "companyId" FROM "User" WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    )
  );







