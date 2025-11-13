-- ============================================
-- 062_add_kanban_display_order.sql
-- Kanban sıralama için displayOrder kolonu ekleme
-- ============================================

-- Deal tablosu için displayOrder kolonu
ALTER TABLE "Deal" 
ADD COLUMN IF NOT EXISTS "displayOrder" INTEGER DEFAULT 0;

-- Quote tablosu için displayOrder kolonu
ALTER TABLE "Quote" 
ADD COLUMN IF NOT EXISTS "displayOrder" INTEGER DEFAULT 0;

-- Invoice tablosu için displayOrder kolonu
ALTER TABLE "Invoice" 
ADD COLUMN IF NOT EXISTS "displayOrder" INTEGER DEFAULT 0;

-- Index'ler - Kanban query performansı için
CREATE INDEX IF NOT EXISTS idx_deal_stage_display_order ON "Deal"("stage", "displayOrder" ASC) WHERE "displayOrder" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quote_status_display_order ON "Quote"("status", "displayOrder" ASC) WHERE "displayOrder" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoice_status_display_order ON "Invoice"("status", "displayOrder" ASC) WHERE "displayOrder" IS NOT NULL;

-- Composite index'ler - companyId + stage/status + displayOrder (Kanban query'leri için optimize)
CREATE INDEX IF NOT EXISTS idx_deal_company_stage_order ON "Deal"("companyId", "stage", "displayOrder" ASC) WHERE "displayOrder" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quote_company_status_order ON "Quote"("companyId", "status", "displayOrder" ASC) WHERE "displayOrder" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoice_company_status_order ON "Invoice"("companyId", "status", "displayOrder" ASC) WHERE "displayOrder" IS NOT NULL;

-- Mevcut kayıtlar için displayOrder değerlerini createdAt'e göre set et
-- Deal: Her stage için createdAt'e göre sıralama
UPDATE "Deal" d1
SET "displayOrder" = (
  SELECT COUNT(*) + 1
  FROM "Deal" d2
  WHERE d2."stage" = d1."stage"
    AND d2."companyId" = d1."companyId"
    AND (
      d2."createdAt" < d1."createdAt"
      OR (d2."createdAt" = d1."createdAt" AND d2."id" < d1."id")
    )
)
WHERE "displayOrder" = 0 OR "displayOrder" IS NULL;

-- Quote: Her status için createdAt'e göre sıralama
UPDATE "Quote" q1
SET "displayOrder" = (
  SELECT COUNT(*) + 1
  FROM "Quote" q2
  WHERE q2."status" = q1."status"
    AND q2."companyId" = q1."companyId"
    AND (
      q2."createdAt" < q1."createdAt"
      OR (q2."createdAt" = q1."createdAt" AND q2."id" < q1."id")
    )
)
WHERE "displayOrder" = 0 OR "displayOrder" IS NULL;

-- Invoice: Her status için createdAt'e göre sıralama
UPDATE "Invoice" i1
SET "displayOrder" = (
  SELECT COUNT(*) + 1
  FROM "Invoice" i2
  WHERE i2."status" = i1."status"
    AND i2."companyId" = i1."companyId"
    AND (
      i2."createdAt" < i1."createdAt"
      OR (i2."createdAt" = i1."createdAt" AND i2."id" < i1."id")
    )
)
WHERE "displayOrder" = 0 OR "displayOrder" IS NULL;

-- Comment'ler
COMMENT ON COLUMN "Deal"."displayOrder" IS 'Kanban sıralama için display order (aynı stage içinde sıralama)';
COMMENT ON COLUMN "Quote"."displayOrder" IS 'Kanban sıralama için display order (aynı status içinde sıralama)';
COMMENT ON COLUMN "Invoice"."displayOrder" IS 'Kanban sıralama için display order (aynı status içinde sıralama)';

COMMENT ON INDEX idx_deal_stage_display_order IS 'Deal stage + displayOrder index - Kanban sıralama performansı için';
COMMENT ON INDEX idx_quote_status_display_order IS 'Quote status + displayOrder index - Kanban sıralama performansı için';
COMMENT ON INDEX idx_invoice_status_display_order IS 'Invoice status + displayOrder index - Kanban sıralama performansı için';

