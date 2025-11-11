-- Test Firma ve Kullanıcı Oluşturma
-- İçinde hiç data olmayan temiz test ortamı

-- Önce mevcut test firmasını sil (varsa)
DELETE FROM "User" WHERE email = 'test@test.com';
DELETE FROM "Company" WHERE name = 'Test Firma';

-- Test Firma Oluştur
INSERT INTO "Company" (id, name, sector, city, status) 
VALUES (
  gen_random_uuid(),
  'Test Firma',
  'Test',
  'İstanbul',
  'ACTIVE'
)
RETURNING id, name;

-- Test Kullanıcı Oluştur (yukarıdaki firma için)
-- Şifre: demo123 (AuthOptions'ta geçerli)
INSERT INTO "User" (id, name, email, password, role, "companyId")
SELECT 
  gen_random_uuid(),
  'Test Admin',
  'test@test.com',
  'demo123', -- AuthOptions demo123'ü kabul ediyor
  'ADMIN',
  c.id
FROM "Company" c
WHERE c.name = 'Test Firma'
LIMIT 1
ON CONFLICT (email) DO NOTHING
RETURNING id, name, email, role, "companyId";

-- Tüm modül izinlerini aktif et (test için)
INSERT INTO "CompanyModulePermission" ("companyId", "moduleId", enabled)
SELECT 
  c.id,
  m.id,
  true
FROM "Company" c
CROSS JOIN "Module" m
WHERE c.name = 'Test Firma'
  AND m."isActive" = true
ON CONFLICT ("companyId", "moduleId") DO UPDATE SET enabled = true;

-- Sonuçları göster
SELECT 
  '✅ Test Firma Oluşturuldu' as mesaj,
  c.id as company_id,
  c.name as company_name,
  u.id as user_id,
  u.name as user_name,
  u.email as user_email,
  u.role as user_role
FROM "Company" c
LEFT JOIN "User" u ON u."companyId" = c.id
WHERE c.name = 'Test Firma';

