-- CompanyModule table - Şirket bazlı modül açma/kapama için
CREATE TABLE IF NOT EXISTS "CompanyModule" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  module VARCHAR(100) NOT NULL, -- customer, deal, quote, invoice, product, finance, task, ticket, shipment, report, activity
  enabled BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("companyId", module)
);

-- Index'ler (Performans için)
CREATE INDEX IF NOT EXISTS idx_company_module_company ON "CompanyModule"("companyId");
CREATE INDEX IF NOT EXISTS idx_company_module_enabled ON "CompanyModule"("enabled");

-- RLS Policies
ALTER TABLE "CompanyModule" ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar kendi şirketlerinin modül ayarlarını görebilir
CREATE POLICY "Users can view their company modules"
  ON "CompanyModule" FOR SELECT
  USING (
    "companyId" IN (
      SELECT "companyId" FROM "User"
      WHERE id::text = auth.uid()::text
    )
  );

-- SuperAdmin tüm modül ayarlarını görebilir ve yönetebilir
CREATE POLICY "SuperAdmin can manage all company modules"
  ON "CompanyModule" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE id::text = auth.uid()::text
      AND role = 'SUPER_ADMIN'
    )
  );




