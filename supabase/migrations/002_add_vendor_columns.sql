-- Vendor tablosuna eksik kolonları ekle
-- Eğer kolonlar zaten varsa hata vermez (IF NOT EXISTS)

-- Vendor tablosunu oluştur (eğer yoksa)
CREATE TABLE IF NOT EXISTS "Vendor" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Eksik kolonları ekle (eğer yoksa)
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS sector VARCHAR(100);
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "taxNumber" VARCHAR(50);
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "taxOffice" VARCHAR(100);
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS description TEXT;

-- Index'ler (eğer yoksa)
CREATE INDEX IF NOT EXISTS idx_vendor_company ON "Vendor"("companyId");
CREATE INDEX IF NOT EXISTS idx_vendor_status ON "Vendor"("status");

-- RLS Policy (eğer yoksa)
ALTER TABLE "Vendor" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'Vendor' 
    AND policyname = 'vendor_company_isolation'
  ) THEN
    CREATE POLICY "vendor_company_isolation" ON "Vendor"
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
  END IF;
END $$;







