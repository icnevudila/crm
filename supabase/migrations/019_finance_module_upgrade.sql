-- Finance Module Upgrade Migration
-- Finance modülünü daha anlamlı hale getirmek için kategori ve açıklama alanları ekle
-- Next.js 15 + Supabase + Prisma uyumlu

BEGIN;

-- 1. Finance tablosuna category ve description kolonları ekle
ALTER TABLE "Finance" 
ADD COLUMN IF NOT EXISTS category VARCHAR(50), -- Gider kategorisi: FUEL, ACCOMMODATION, FOOD, OTHER, INVOICE_INCOME, vb.
ADD COLUMN IF NOT EXISTS description TEXT; -- Detaylı açıklama

-- 2. Index'ler (performans için)
CREATE INDEX IF NOT EXISTS idx_finance_category ON "Finance"("category");
CREATE INDEX IF NOT EXISTS idx_finance_type ON "Finance"("type");
CREATE INDEX IF NOT EXISTS idx_finance_date ON "Finance"("createdAt");

-- 3. RLS Policy'ler (zaten var, sadece kontrol)
-- Finance tablosu zaten companyId bazlı RLS'e sahip

COMMIT;



























