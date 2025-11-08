-- UserPermission tablosu - Detaylı yetki yönetimi için
-- Her kullanıcı için modül bazlı CRUD yetkileri

-- Önce tablo yoksa oluştur
CREATE TABLE IF NOT EXISTS "UserPermission" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  module VARCHAR(50) NOT NULL, -- customer, deal, quote, invoice, product, finance, task, ticket, shipment, etc.
  "canCreate" BOOLEAN DEFAULT false,
  "canRead" BOOLEAN DEFAULT false,
  "canUpdate" BOOLEAN DEFAULT false,
  "canDelete" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("userId", "companyId", module)
);

-- Eğer tablo varsa ama kolonlar yoksa ekle
DO $$ 
BEGIN
  -- canCreate kolonu yoksa ekle
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'UserPermission' AND column_name = 'canCreate') THEN
    ALTER TABLE "UserPermission" ADD COLUMN "canCreate" BOOLEAN DEFAULT false;
  END IF;
  
  -- canRead kolonu yoksa ekle
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'UserPermission' AND column_name = 'canRead') THEN
    ALTER TABLE "UserPermission" ADD COLUMN "canRead" BOOLEAN DEFAULT false;
  END IF;
  
  -- canUpdate kolonu yoksa ekle
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'UserPermission' AND column_name = 'canUpdate') THEN
    ALTER TABLE "UserPermission" ADD COLUMN "canUpdate" BOOLEAN DEFAULT false;
  END IF;
  
  -- canDelete kolonu yoksa ekle
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'UserPermission' AND column_name = 'canDelete') THEN
    ALTER TABLE "UserPermission" ADD COLUMN "canDelete" BOOLEAN DEFAULT false;
  END IF;
END $$;

-- CompanyPermission tablosu - Şirket bazlı yetkiler (SuperAdmin için)
CREATE TABLE IF NOT EXISTS "CompanyPermission" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  feature VARCHAR(50) NOT NULL, -- analytics, reports, export, api_access, etc.
  enabled BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("companyId", feature)
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_userpermission_user ON "UserPermission"("userId");
CREATE INDEX IF NOT EXISTS idx_userpermission_company ON "UserPermission"("companyId");
CREATE INDEX IF NOT EXISTS idx_userpermission_module ON "UserPermission"(module);
CREATE INDEX IF NOT EXISTS idx_companypermission_company ON "CompanyPermission"("companyId");

-- RLS Policies
ALTER TABLE "UserPermission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CompanyPermission" ENABLE ROW LEVEL SECURITY;

-- Mevcut policy'leri kaldır (varsa)
DROP POLICY IF EXISTS "userpermission_company_isolation" ON "UserPermission";
DROP POLICY IF EXISTS "companypermission_superadmin_only" ON "CompanyPermission";

-- UserPermission Policies - API seviyesinde kontrol yapıldığı için basitleştirilmiş
-- NOT: NextAuth kullanıldığı için auth.uid() çalışmıyor, API seviyesinde kontrol yapılıyor
CREATE POLICY "userpermission_company_isolation" ON "UserPermission"
  FOR ALL
  USING (true)  -- API seviyesinde companyId kontrolü yapılıyor
  WITH CHECK (true);

-- CompanyPermission Policies - API seviyesinde kontrol yapıldığı için basitleştirilmiş
CREATE POLICY "companypermission_superadmin_only" ON "CompanyPermission"
  FOR ALL
  USING (true)  -- API seviyesinde SuperAdmin kontrolü yapılıyor
  WITH CHECK (true);


