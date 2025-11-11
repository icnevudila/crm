-- Super Admin System Seed Data
-- Test için örnek veriler

-- Örnek kurumlar oluştur
INSERT INTO "Company" (id, name, sector, city, status) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Tipplus Medikal', 'Sağlık', 'Ankara', 'ACTIVE'),
  ('00000000-0000-0000-0000-000000000002', 'Global Un', 'Gıda', 'Konya', 'ACTIVE'),
  ('00000000-0000-0000-0000-000000000003', 'ZahirTech', 'Yazılım', 'İstanbul', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- Örnek kullanıcılar oluştur (SUPER_ADMIN, ADMIN, SALES, USER)
-- Şifre: demo123 (bcrypt hash)
INSERT INTO "User" (id, name, email, password, role, "companyId", "roleId") VALUES
  -- SUPER_ADMIN kullanıcı
  (
    '10000000-0000-0000-0000-000000000001',
    'Süper Admin',
    'superadmin@crm.com',
    '$2a$10$rOzJqJqJqJqJqJqJqJqJqOeJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq', -- demo123
    'SUPER_ADMIN',
    '00000000-0000-0000-0000-000000000001',
    (SELECT id FROM "Role" WHERE code = 'SUPER_ADMIN' LIMIT 1)
  ),
  -- ADMIN kullanıcı (Tipplus Medikal)
  (
    '10000000-0000-0000-0000-000000000002',
    'Tipplus Admin',
    'admin@tipplusmedikal.com',
    '$2a$10$rOzJqJqJqJqJqJqJqJqJqOeJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq', -- demo123
    'ADMIN',
    '00000000-0000-0000-0000-000000000001',
    (SELECT id FROM "Role" WHERE code = 'ADMIN' LIMIT 1)
  ),
  -- SALES kullanıcı (Tipplus Medikal)
  (
    '10000000-0000-0000-0000-000000000003',
    'Tipplus Sales',
    'sales@tipplusmedikal.com',
    '$2a$10$rOzJqJqJqJqJqJqJqJqJqOeJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq', -- demo123
    'SALES',
    '00000000-0000-0000-0000-000000000001',
    (SELECT id FROM "Role" WHERE code = 'SALES' LIMIT 1)
  ),
  -- ADMIN kullanıcı (Global Un)
  (
    '10000000-0000-0000-0000-000000000004',
    'Global Un Admin',
    'admin@globalun.com',
    '$2a$10$rOzJqJqJqJqJqJqJqJqJqOeJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq', -- demo123
    'ADMIN',
    '00000000-0000-0000-0000-000000000002',
    (SELECT id FROM "Role" WHERE code = 'ADMIN' LIMIT 1)
  )
ON CONFLICT (id) DO NOTHING;

-- Örnek kurum modül izinleri
-- Tipplus Medikal: Tüm modüller aktif
INSERT INTO "CompanyModulePermission" ("companyId", "moduleId", enabled)
SELECT 
  '00000000-0000-0000-0000-000000000001',
  m.id,
  true
FROM "Module" m
WHERE m."isActive" = true
ON CONFLICT ("companyId", "moduleId") DO NOTHING;

-- Global Un: Sadece bazı modüller aktif
INSERT INTO "CompanyModulePermission" ("companyId", "moduleId", enabled)
SELECT 
  '00000000-0000-0000-0000-000000000002',
  m.id,
  CASE 
    WHEN m.code IN ('dashboard', 'customers', 'quotes', 'products') THEN true
    ELSE false
  END
FROM "Module" m
WHERE m."isActive" = true
ON CONFLICT ("companyId", "moduleId") DO NOTHING;

-- ZahirTech: Tüm modüller aktif
INSERT INTO "CompanyModulePermission" ("companyId", "moduleId", enabled)
SELECT 
  '00000000-0000-0000-0000-000000000003',
  m.id,
  true
FROM "Module" m
WHERE m."isActive" = true
ON CONFLICT ("companyId", "moduleId") DO NOTHING;











