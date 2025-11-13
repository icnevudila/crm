-- 064_customer_company_unique_tax_index.sql
-- CustomerCompany için vergi dairesi + vergi numarası bazlı tekillik

-- Çakışan kayıtları temizle (aynı companyId + taxOffice + taxNumber kombinasyonundan birden fazla varsa en eski kayıt tutulur)
WITH duplicates AS (
  SELECT
    id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY "companyId", "taxOffice", "taxNumber"
        ORDER BY "createdAt" NULLS LAST, "id"
      ) AS rn
    FROM "CustomerCompany"
    WHERE "taxOffice" IS NOT NULL
      AND "taxNumber" IS NOT NULL
  ) t
  WHERE t.rn > 1
)
DELETE FROM "CustomerCompany"
WHERE id IN (SELECT id FROM duplicates);

-- Unique index (yalnızca vergi dairesi + vergi no mevcutsa)
CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_company_tax_unique
  ON "CustomerCompany" ("companyId", "taxOffice", "taxNumber")
  WHERE "taxOffice" IS NOT NULL
    AND "taxNumber" IS NOT NULL;




