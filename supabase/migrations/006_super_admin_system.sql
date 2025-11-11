-- Super Admin System Migration
-- Module, Role, CompanyModulePermission, RolePermission tabloları
-- User tablosuna roleId FK ekleme

-- 1. Module tablosu - Sistem modülleri (dashboard, firmalar, tedarikçiler, vb.)
CREATE TABLE IF NOT EXISTS "Module" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL, -- dashboard, companies, vendors, customers, quotes, products, finance, reports, shipments, stock
  name VARCHAR(255) NOT NULL, -- "Dashboard", "Firmalar", "Tedarikçiler", vb.
  description TEXT,
  icon VARCHAR(50), -- lucide-react icon name
  "isActive" BOOLEAN DEFAULT true,
  "displayOrder" INTEGER DEFAULT 0, -- Sıralama için
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Role tablosu - Sistem rolleri (Admin, Sales, vb.)
CREATE TABLE IF NOT EXISTS "Role" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL, -- ADMIN, SALES, USER, SUPER_ADMIN
  name VARCHAR(255) NOT NULL, -- "Admin", "Satış Temsilcisi", "Kullanıcı", "Süper Admin"
  description TEXT,
  "isSystemRole" BOOLEAN DEFAULT false, -- Sistem rolü mü? (SUPER_ADMIN gibi)
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CompanyModulePermission tablosu - Kurum bazlı modül izinleri
CREATE TABLE IF NOT EXISTS "CompanyModulePermission" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "moduleId" UUID NOT NULL REFERENCES "Module"(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("companyId", "moduleId")
);

-- 4. RolePermission tablosu - Rol bazlı modül izinleri
CREATE TABLE IF NOT EXISTS "RolePermission" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "roleId" UUID NOT NULL REFERENCES "Role"(id) ON DELETE CASCADE,
  "moduleId" UUID NOT NULL REFERENCES "Module"(id) ON DELETE CASCADE,
  "canCreate" BOOLEAN DEFAULT false,
  "canRead" BOOLEAN DEFAULT false,
  "canUpdate" BOOLEAN DEFAULT false,
  "canDelete" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("roleId", "moduleId")
);

-- 5. User tablosuna roleId FK ekle (mevcut role VARCHAR'ı koruyoruz, roleId de ekliyoruz)
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "roleId" UUID REFERENCES "Role"(id) ON DELETE SET NULL;

-- Index'ler (Performans için)
CREATE INDEX IF NOT EXISTS idx_module_code ON "Module"("code");
CREATE INDEX IF NOT EXISTS idx_module_active ON "Module"("isActive");
CREATE INDEX IF NOT EXISTS idx_role_code ON "Role"("code");
CREATE INDEX IF NOT EXISTS idx_role_active ON "Role"("isActive");
CREATE INDEX IF NOT EXISTS idx_companymodulepermission_company ON "CompanyModulePermission"("companyId");
CREATE INDEX IF NOT EXISTS idx_companymodulepermission_module ON "CompanyModulePermission"("moduleId");
CREATE INDEX IF NOT EXISTS idx_rolepermission_role ON "RolePermission"("roleId");
CREATE INDEX IF NOT EXISTS idx_rolepermission_module ON "RolePermission"("moduleId");
CREATE INDEX IF NOT EXISTS idx_user_roleid ON "User"("roleId");

-- RLS Policies
ALTER TABLE "Module" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Role" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CompanyModulePermission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RolePermission" ENABLE ROW LEVEL SECURITY;

-- Module Policies - Herkes okuyabilir (SuperAdmin kontrolü API seviyesinde)
DROP POLICY IF EXISTS "module_read_all" ON "Module";
CREATE POLICY "module_read_all" ON "Module"
  FOR SELECT
  USING (true);

-- Role Policies - Herkes okuyabilir (SuperAdmin kontrolü API seviyesinde)
DROP POLICY IF EXISTS "role_read_all" ON "Role";
CREATE POLICY "role_read_all" ON "Role"
  FOR SELECT
  USING (true);

-- CompanyModulePermission Policies - API seviyesinde kontrol
DROP POLICY IF EXISTS "companymodulepermission_all" ON "CompanyModulePermission";
CREATE POLICY "companymodulepermission_all" ON "CompanyModulePermission"
  FOR ALL
  USING (true) -- API seviyesinde SuperAdmin kontrolü yapılıyor
  WITH CHECK (true);

-- RolePermission Policies - API seviyesinde kontrol
DROP POLICY IF EXISTS "rolepermission_all" ON "RolePermission";
CREATE POLICY "rolepermission_all" ON "RolePermission"
  FOR ALL
  USING (true) -- API seviyesinde SuperAdmin kontrolü yapılıyor
  WITH CHECK (true);

-- Seed Data: Modüller
INSERT INTO "Module" (code, name, description, icon, "displayOrder") VALUES
  ('dashboard', 'Dashboard', 'Ana gösterge paneli', 'LayoutDashboard', 1),
  ('companies', 'Firmalar', 'Müşteri firmaları yönetimi', 'Building2', 2),
  ('vendors', 'Tedarikçiler', 'Tedarikçi yönetimi', 'Store', 3),
  ('customers', 'Müşteriler', 'Müşteri yönetimi', 'Users', 4),
  ('quotes', 'Teklifler', 'Teklif yönetimi', 'FileText', 5),
  ('products', 'Ürünler', 'Ürün yönetimi', 'Package', 6),
  ('finance', 'Finans', 'Finans yönetimi', 'ShoppingCart', 7),
  ('reports', 'Raporlar', 'Raporlar ve analitik', 'BarChart3', 8),
  ('shipments', 'Sevkiyatlar', 'Sevkiyat yönetimi', 'Truck', 9),
  ('stock', 'Stok', 'Stok yönetimi', 'Package', 10)
ON CONFLICT (code) DO NOTHING;

-- Seed Data: Roller
INSERT INTO "Role" (code, name, description, "isSystemRole", "isActive") VALUES
  ('SUPER_ADMIN', 'Süper Admin', 'Sistem yöneticisi - tüm yetkilere sahip', true, true),
  ('ADMIN', 'Admin', 'Şirket yöneticisi - şirket içi tüm yetkilere sahip', false, true),
  ('SALES', 'Satış Temsilcisi', 'Satış işlemleri yapabilir', false, true),
  ('USER', 'Kullanıcı', 'Temel kullanıcı - sınırlı yetkiler', false, true)
ON CONFLICT (code) DO NOTHING;

-- Seed Data: RolePermission - SUPER_ADMIN tüm modüllere tam yetki
INSERT INTO "RolePermission" ("roleId", "moduleId", "canCreate", "canRead", "canUpdate", "canDelete")
SELECT 
  r.id,
  m.id,
  true, -- canCreate
  true, -- canRead
  true, -- canUpdate
  true  -- canDelete
FROM "Role" r
CROSS JOIN "Module" m
WHERE r.code = 'SUPER_ADMIN'
ON CONFLICT ("roleId", "moduleId") DO NOTHING;

-- Seed Data: RolePermission - ADMIN tüm modüllere tam yetki (kendi şirketi için)
INSERT INTO "RolePermission" ("roleId", "moduleId", "canCreate", "canRead", "canUpdate", "canDelete")
SELECT 
  r.id,
  m.id,
  true, -- canCreate
  true, -- canRead
  true, -- canUpdate
  true  -- canDelete
FROM "Role" r
CROSS JOIN "Module" m
WHERE r.code = 'ADMIN'
ON CONFLICT ("roleId", "moduleId") DO NOTHING;

-- Seed Data: RolePermission - SALES sınırlı yetkiler (okuma + oluşturma)
INSERT INTO "RolePermission" ("roleId", "moduleId", "canCreate", "canRead", "canUpdate", "canDelete")
SELECT 
  r.id,
  m.id,
  CASE 
    WHEN m.code IN ('customers', 'quotes', 'deals') THEN true
    ELSE false
  END, -- canCreate
  true, -- canRead (tüm modülleri görebilir)
  CASE 
    WHEN m.code IN ('customers', 'quotes', 'deals') THEN true
    ELSE false
  END, -- canUpdate
  false -- canDelete (sadece okuma ve oluşturma)
FROM "Role" r
CROSS JOIN "Module" m
WHERE r.code = 'SALES'
ON CONFLICT ("roleId", "moduleId") DO NOTHING;

-- Seed Data: RolePermission - USER sadece okuma yetkisi
INSERT INTO "RolePermission" ("roleId", "moduleId", "canCreate", "canRead", "canUpdate", "canDelete")
SELECT 
  r.id,
  m.id,
  false, -- canCreate
  true,  -- canRead
  false, -- canUpdate
  false  -- canDelete
FROM "Role" r
CROSS JOIN "Module" m
WHERE r.code = 'USER'
ON CONFLICT ("roleId", "moduleId") DO NOTHING;












