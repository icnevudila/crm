-- ============================================
-- 061_kanban_performance_indexes.sql
-- Kanban performans optimizasyonu için index'ler
-- ============================================

-- Deal tablosu için updatedAt index'i (Kanban sıralama için kritik)
CREATE INDEX IF NOT EXISTS idx_deal_updated_at ON "Deal"("updatedAt" DESC) WHERE "updatedAt" IS NOT NULL;

-- Composite index: companyId + stage + updatedAt (Kanban query'leri için optimize)
CREATE INDEX IF NOT EXISTS idx_deal_company_stage_updated ON "Deal"("companyId", "stage", "updatedAt" DESC) WHERE "updatedAt" IS NOT NULL;

-- Quote tablosu için updatedAt index'i
CREATE INDEX IF NOT EXISTS idx_quote_updated_at ON "Quote"("updatedAt" DESC) WHERE "updatedAt" IS NOT NULL;

-- Composite index: companyId + status + updatedAt (Quote Kanban için)
CREATE INDEX IF NOT EXISTS idx_quote_company_status_updated ON "Quote"("companyId", "status", "updatedAt" DESC) WHERE "updatedAt" IS NOT NULL;

-- Invoice tablosu için updatedAt index'i
CREATE INDEX IF NOT EXISTS idx_invoice_updated_at ON "Invoice"("updatedAt" DESC) WHERE "updatedAt" IS NOT NULL;

-- Composite index: companyId + status + updatedAt (Invoice Kanban için)
CREATE INDEX IF NOT EXISTS idx_invoice_company_status_updated ON "Invoice"("companyId", "status", "updatedAt" DESC) WHERE "updatedAt" IS NOT NULL;

-- Comment'ler
COMMENT ON INDEX idx_deal_updated_at IS 'Deal updatedAt index - Kanban sıralama performansı için';
COMMENT ON INDEX idx_deal_company_stage_updated IS 'Deal composite index - Kanban query performansı için (companyId + stage + updatedAt)';
COMMENT ON INDEX idx_quote_updated_at IS 'Quote updatedAt index - Kanban sıralama performansı için';
COMMENT ON INDEX idx_quote_company_status_updated IS 'Quote composite index - Kanban query performansı için';
COMMENT ON INDEX idx_invoice_updated_at IS 'Invoice updatedAt index - Kanban sıralama performansı için';
COMMENT ON INDEX idx_invoice_company_status_updated IS 'Invoice composite index - Kanban query performansı için';










