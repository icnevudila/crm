-- Performance Indexes Migration
-- Bu migration dosyası performans optimizasyonu için ek index'ler ekler

-- Vendor table indexes
CREATE INDEX IF NOT EXISTS idx_vendor_company ON "Vendor"("companyId");
CREATE INDEX IF NOT EXISTS idx_vendor_status ON "Vendor"("status");

-- Deal table indexes
CREATE INDEX IF NOT EXISTS idx_deal_stage ON "Deal"("stage");
CREATE INDEX IF NOT EXISTS idx_deal_customer ON "Deal"("customerId");
CREATE INDEX IF NOT EXISTS idx_deal_status ON "Deal"("status");
CREATE INDEX IF NOT EXISTS idx_deal_created ON "Deal"("createdAt" DESC);

-- Quote table indexes
CREATE INDEX IF NOT EXISTS idx_quote_deal ON "Quote"("dealId");
CREATE INDEX IF NOT EXISTS idx_quote_created ON "Quote"("createdAt" DESC);

-- Invoice table indexes
CREATE INDEX IF NOT EXISTS idx_invoice_quote ON "Invoice"("quoteId");
CREATE INDEX IF NOT EXISTS idx_invoice_created ON "Invoice"("createdAt" DESC);

-- Product table indexes
-- Note: Product table does NOT have a "status" column
CREATE INDEX IF NOT EXISTS idx_product_stock ON "Product"("stock");
CREATE INDEX IF NOT EXISTS idx_product_company ON "Product"("companyId");

-- Task table indexes
CREATE INDEX IF NOT EXISTS idx_task_company ON "Task"("companyId");
CREATE INDEX IF NOT EXISTS idx_task_status ON "Task"("status");
CREATE INDEX IF NOT EXISTS idx_task_assigned ON "Task"("assignedTo");

-- Ticket table indexes
CREATE INDEX IF NOT EXISTS idx_ticket_company ON "Ticket"("companyId");
CREATE INDEX IF NOT EXISTS idx_ticket_customer ON "Ticket"("customerId");
CREATE INDEX IF NOT EXISTS idx_ticket_status ON "Ticket"("status");
CREATE INDEX IF NOT EXISTS idx_ticket_priority ON "Ticket"("priority");

-- Shipment table indexes
CREATE INDEX IF NOT EXISTS idx_shipment_company ON "Shipment"("companyId");
CREATE INDEX IF NOT EXISTS idx_shipment_invoice ON "Shipment"("invoiceId");
CREATE INDEX IF NOT EXISTS idx_shipment_status ON "Shipment"("status");

-- Finance table indexes
CREATE INDEX IF NOT EXISTS idx_finance_company ON "Finance"("companyId");
CREATE INDEX IF NOT EXISTS idx_finance_type ON "Finance"("type");
CREATE INDEX IF NOT EXISTS idx_finance_created ON "Finance"("createdAt" DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_customer_company_status ON "Customer"("companyId", "status");
CREATE INDEX IF NOT EXISTS idx_deal_company_stage ON "Deal"("companyId", "stage");
CREATE INDEX IF NOT EXISTS idx_quote_company_status ON "Quote"("companyId", "status");
CREATE INDEX IF NOT EXISTS idx_invoice_company_status ON "Invoice"("companyId", "status");
-- Note: Product table does NOT have a "status" column, so only companyId index
CREATE INDEX IF NOT EXISTS idx_product_company ON "Product"("companyId");

-- Full text search indexes (PostgreSQL)
CREATE INDEX IF NOT EXISTS idx_customer_name_search ON "Customer" USING gin(to_tsvector('turkish', "name"));
CREATE INDEX IF NOT EXISTS idx_vendor_name_search ON "Vendor" USING gin(to_tsvector('turkish', "name"));
CREATE INDEX IF NOT EXISTS idx_product_name_search ON "Product" USING gin(to_tsvector('turkish', "name"));
CREATE INDEX IF NOT EXISTS idx_deal_title_search ON "Deal" USING gin(to_tsvector('turkish', "title"));
CREATE INDEX IF NOT EXISTS idx_quote_title_search ON "Quote" USING gin(to_tsvector('turkish', "title"));
CREATE INDEX IF NOT EXISTS idx_invoice_title_search ON "Invoice" USING gin(to_tsvector('turkish', "title"));




