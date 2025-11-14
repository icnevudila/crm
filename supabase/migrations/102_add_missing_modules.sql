-- ============================================
-- CRM V3 - Add Missing Modules
-- Migration: 102
-- Tarih: 2024
-- Amaç: Eksik modülleri (contact, deal, invoice, task, ticket, vb.) Module tablosuna ekleme
-- ============================================

-- ============================================
-- 0. MODULE TABLOSU YOKSA OLUŞTUR (006_super_admin_system.sql bağımlılığı)
-- ============================================

-- Module tablosunu oluştur (eğer yoksa)
CREATE TABLE IF NOT EXISTS "Module" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  "isActive" BOOLEAN DEFAULT true,
  "displayOrder" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Role tablosunu oluştur (eğer yoksa) - RolePermission için gerekli
CREATE TABLE IF NOT EXISTS "Role" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  "isSystemRole" BOOLEAN DEFAULT false,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CompanyModulePermission tablosunu oluştur (eğer yoksa)
CREATE TABLE IF NOT EXISTS "CompanyModulePermission" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "moduleId" UUID NOT NULL REFERENCES "Module"(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("companyId", "moduleId")
);

-- RolePermission tablosunu oluştur (eğer yoksa)
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

-- Index'leri oluştur (performans için)
CREATE INDEX IF NOT EXISTS idx_module_code ON "Module"("code");
CREATE INDEX IF NOT EXISTS idx_module_active ON "Module"("isActive");
CREATE INDEX IF NOT EXISTS idx_role_code ON "Role"("code");
CREATE INDEX IF NOT EXISTS idx_role_active ON "Role"("isActive");
CREATE INDEX IF NOT EXISTS idx_companymodulepermission_company ON "CompanyModulePermission"("companyId");
CREATE INDEX IF NOT EXISTS idx_companymodulepermission_module ON "CompanyModulePermission"("moduleId");
CREATE INDEX IF NOT EXISTS idx_rolepermission_role ON "RolePermission"("roleId");
CREATE INDEX IF NOT EXISTS idx_rolepermission_module ON "RolePermission"("moduleId");

-- Temel rolleri ekle (eğer yoksa)
INSERT INTO "Role" (code, name, description, "isSystemRole", "isActive") VALUES
  ('SUPER_ADMIN', 'Süper Admin', 'Sistem yöneticisi - tüm yetkilere sahip', true, true),
  ('ADMIN', 'Admin', 'Şirket yöneticisi - şirket içi tüm yetkilere sahip', false, true),
  ('SALES', 'Satış Temsilcisi', 'Satış işlemleri yapabilir', false, true),
  ('USER', 'Kullanıcı', 'Temel kullanıcı - sınırlı yetkiler', false, true)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 1. EKSİK MODÜLLERİ EKLE
-- ============================================

-- Eksik modülleri Module tablosuna ekle
-- NOT: 'shipments' modülü 006_super_admin_system.sql'de zaten var, burada 'shipment' olarak ekleniyor (API'de tekil kullanılıyor)
-- Ayrıca 'invoice', 'product', 'customer', 'quote' modülleri de 006'da var, burada yok (sadece eksik olanlar eklendi)
INSERT INTO "Module" (code, name, description, icon, "displayOrder", "isActive") VALUES
  ('contact', 'Firma Yetkilileri', 'Firma yetkilileri yönetimi', 'UserCircle', 11, true),
  ('deal', 'Fırsatlar', 'Fırsat (Deal) yönetimi', 'TrendingUp', 12, true),
  ('task', 'Görevler', 'Görev yönetimi', 'CheckSquare', 14, true),
  ('ticket', 'Destek Talepleri', 'Destek talebi yönetimi', 'Ticket', 15, true),
  ('competitor', 'Rakip Analizi', 'Rakip analizi yönetimi', 'Target', 16, true),
  ('contract', 'Sözleşmeler', 'Sözleşme yönetimi', 'FileCheck', 17, true),
  ('email-template', 'E-posta Şablonları', 'E-posta şablonları yönetimi', 'Mail', 18, true),
  ('activity', 'Aktiviteler', 'Toplantı ve aktivite yönetimi', 'Calendar', 19, true),
  ('shipment', 'Sevkiyatlar', 'Sevkiyat yönetimi', 'Truck', 20, true),
  ('segment', 'Segmentler', 'Müşteri segment yönetimi', 'Users', 21, true),
  ('email-campaign', 'E-posta Kampanyaları', 'E-posta kampanya yönetimi', 'Send', 22, true),
  ('documents', 'Dökümanlar', 'Döküman yönetimi', 'Folder', 23, true),
  ('approvals', 'Onaylar', 'Onay süreci yönetimi', 'CheckCircle', 24, true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  "displayOrder" = EXCLUDED."displayOrder",
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = NOW();

-- 006'da 'shipments' (çoğul) var, API'de 'shipment' (tekil) kullanılıyor
-- Bu yüzden 'shipments' modülünü 'shipment' olarak güncelle (API ile uyumlu olsun)
-- ÖNEMLİ: Önce mevcut 'shipments' modülünün ID'sini al, sonra güncelle
DO $$
DECLARE
  shipments_module_id UUID;
  shipment_module_id UUID;
BEGIN
  -- 'shipments' modülünün ID'sini al (eğer varsa)
  SELECT id INTO shipments_module_id FROM "Module" WHERE code = 'shipments' LIMIT 1;
  
  IF shipments_module_id IS NOT NULL THEN
    -- 'shipment' modülü zaten var mı kontrol et
    SELECT id INTO shipment_module_id FROM "Module" WHERE code = 'shipment' LIMIT 1;
    
    IF shipment_module_id IS NULL THEN
      -- 'shipment' modülü yoksa, 'shipments' modülünü 'shipment' olarak güncelle
      UPDATE "Module" 
      SET code = 'shipment', name = 'Sevkiyatlar', description = 'Sevkiyat yönetimi', icon = 'Truck', "displayOrder" = 20, "updatedAt" = NOW()
      WHERE id = shipments_module_id;
      
      -- RolePermission ve CompanyModulePermission kayıtlarını güncelle (moduleId aynı kalacak, sadece kod değişti)
      -- Bu işlem gerekli değil çünkü moduleId değişmiyor, sadece code değişiyor
    ELSE
      -- 'shipment' modülü zaten varsa, 'shipments' modülündeki yetkileri 'shipment' modülüne taşı
      -- RolePermission kayıtlarını güncelle
      UPDATE "RolePermission" 
      SET "moduleId" = shipment_module_id, "updatedAt" = NOW()
      WHERE "moduleId" = shipments_module_id;
      
      -- CompanyModulePermission kayıtlarını güncelle
      UPDATE "CompanyModulePermission" 
      SET "moduleId" = shipment_module_id, "updatedAt" = NOW()
      WHERE "moduleId" = shipments_module_id;
      
      -- Eski 'shipments' modülünü sil
      DELETE FROM "Module" WHERE id = shipments_module_id;
    END IF;
  END IF;
END $$;

-- 006'da 'invoice' modülü yok, API'de kullanılıyor, ekle
INSERT INTO "Module" (code, name, description, icon, "displayOrder", "isActive") VALUES
  ('invoice', 'Faturalar', 'Fatura yönetimi', 'FileText', 13, true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  "displayOrder" = EXCLUDED."displayOrder",
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = NOW();

-- ============================================
-- 2. SUPER_ADMIN'E YENİ MODÜLLER İÇİN OTOMATİK YETKİ VER
-- ============================================

-- SUPER_ADMIN rolüne yeni modüller için otomatik tam yetki ver
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
  AND m.code IN (
    'contact', 
    'deal', 
    'invoice', 
    'task', 
    'ticket', 
    'competitor', 
    'contract', 
    'email-template', 
    'activity', 
    'shipment', 
    'segment', 
    'email-campaign', 
    'documents', 
    'approvals'
  )
ON CONFLICT ("roleId", "moduleId") DO UPDATE SET
  "canCreate" = true,
  "canRead" = true,
  "canUpdate" = true,
  "canDelete" = true,
  "updatedAt" = NOW();

-- ============================================
-- 3. ADMIN ROLÜNE YENİ MODÜLLER İÇİN OTOMATİK YETKİ VER
-- ============================================

-- ADMIN rolüne yeni modüller için otomatik tam yetki ver (kendi şirketi için)
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
  AND m.code IN (
    'contact', 
    'deal', 
    'invoice', 
    'task', 
    'ticket', 
    'competitor', 
    'contract', 
    'email-template', 
    'activity', 
    'shipment', 
    'segment', 
    'email-campaign', 
    'documents', 
    'approvals'
  )
ON CONFLICT ("roleId", "moduleId") DO UPDATE SET
  "canCreate" = true,
  "canRead" = true,
  "canUpdate" = true,
  "canDelete" = true,
  "updatedAt" = NOW();

-- ============================================
-- 4. SALES ROLÜNE YENİ MODÜLLER İÇİN SINIRLI YETKİ VER
-- ============================================

-- SALES rolüne yeni modüller için sınırlı yetki ver (create + read + update, delete yok)
INSERT INTO "RolePermission" ("roleId", "moduleId", "canCreate", "canRead", "canUpdate", "canDelete")
SELECT 
  r.id,
  m.id,
  CASE 
    WHEN m.code IN ('contact', 'deal', 'quote', 'task', 'activity', 'ticket') THEN true
    ELSE false
  END, -- canCreate (sadece ilgili modüller için)
  true, -- canRead (tüm modülleri görebilir)
  CASE 
    WHEN m.code IN ('contact', 'deal', 'quote', 'task', 'activity', 'ticket') THEN true
    ELSE false
  END, -- canUpdate (sadece ilgili modüller için)
  false -- canDelete (hiçbir modülde silme yetkisi yok)
FROM "Role" r
CROSS JOIN "Module" m
WHERE r.code = 'SALES'
  AND m.code IN (
    'contact', 
    'deal', 
    'invoice', 
    'task', 
    'ticket', 
    'competitor', 
    'contract', 
    'email-template', 
    'activity', 
    'shipment', 
    'segment', 
    'email-campaign', 
    'documents', 
    'approvals'
  )
ON CONFLICT ("roleId", "moduleId") DO UPDATE SET
  "canCreate" = EXCLUDED."canCreate",
  "canRead" = true,
  "canUpdate" = EXCLUDED."canUpdate",
  "canDelete" = false,
  "updatedAt" = NOW();

-- ============================================
-- 5. USER ROLÜNE YENİ MODÜLLER İÇİN SADECE OKUMA YETKİSİ VER
-- ============================================

-- USER rolüne yeni modüller için sadece okuma yetkisi ver
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
  AND m.code IN (
    'contact', 
    'deal', 
    'invoice', 
    'task', 
    'ticket', 
    'competitor', 
    'contract', 
    'email-template', 
    'activity', 
    'shipment', 
    'segment', 
    'email-campaign', 
    'documents', 
    'approvals'
  )
ON CONFLICT ("roleId", "moduleId") DO UPDATE SET
  "canCreate" = false,
  "canRead" = true,
  "canUpdate" = false,
  "canDelete" = false,
  "updatedAt" = NOW();

-- ============================================
-- 6. TÜM ŞİRKETLERE YENİ MODÜLLER İÇİN OTOMATİK İZİN VER
-- ============================================

-- Tüm aktif şirketlere yeni modüller için otomatik izin ver
INSERT INTO "CompanyModulePermission" ("companyId", "moduleId", enabled)
SELECT 
  c.id,
  m.id,
  true
FROM "Company" c
CROSS JOIN "Module" m
WHERE m.code IN (
    'contact', 
    'deal', 
    'invoice', 
    'task', 
    'ticket', 
    'competitor', 
    'contract', 
    'email-template', 
    'activity', 
    'shipment', 
    'segment', 
    'email-campaign', 
    'documents', 
    'approvals'
  )
  AND m."isActive" = true
  AND c.status = 'ACTIVE'
ON CONFLICT ("companyId", "moduleId") DO UPDATE SET
  enabled = true,
  "updatedAt" = NOW();

-- ============================================
-- MIGRATION TAMAMLANDI
-- ============================================

-- ✅ Eksik modüller eklendi:
-- ✅ contact, deal, invoice, task, ticket, competitor, contract, email-template, activity, shipment, segment, email-campaign, documents, approvals
-- ✅ SUPER_ADMIN'e yeni modüller için otomatik tam yetki verildi
-- ✅ ADMIN rolüne yeni modüller için otomatik tam yetki verildi
-- ✅ SALES rolüne yeni modüller için sınırlı yetki verildi (create + read + update, delete yok)
-- ✅ USER rolüne yeni modüller için sadece okuma yetkisi verildi
-- ✅ Tüm aktif şirketlere yeni modüller için otomatik izin verildi

