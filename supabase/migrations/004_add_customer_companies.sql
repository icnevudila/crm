-- CustomerCompany tablosu - Müşteri firmaları için
-- ADMIN'in satış yaptığı firmalar burada tanımlanır
-- Örnek: A müşterisi B firmasında çalışıyor → B firması burada tanımlı

CREATE TABLE IF NOT EXISTS "CustomerCompany" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  sector VARCHAR(100),
  city VARCHAR(100),
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  website VARCHAR(255),
  "taxNumber" VARCHAR(50),
  "taxOffice" VARCHAR(100),
  description TEXT,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE, -- Multi-tenant: Hangi CRM şirketine ait
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer tablosuna customerCompanyId kolonu ekle (müşteri hangi firmada çalışıyor)
ALTER TABLE "Customer" 
ADD COLUMN IF NOT EXISTS "customerCompanyId" UUID REFERENCES "CustomerCompany"(id) ON DELETE SET NULL;

-- Index'ler (Performans için)
CREATE INDEX IF NOT EXISTS idx_customercompany_company ON "CustomerCompany"("companyId");
CREATE INDEX IF NOT EXISTS idx_customercompany_status ON "CustomerCompany"("status");
CREATE INDEX IF NOT EXISTS idx_customer_customercompany ON "Customer"("customerCompanyId");

-- RLS Policies
ALTER TABLE "CustomerCompany" ENABLE ROW LEVEL SECURITY;

-- Mevcut policy'yi kaldır (varsa)
DROP POLICY IF EXISTS "customercompany_company_isolation" ON "CustomerCompany";

-- Kullanıcılar kendi şirketlerinin müşteri firmalarını görebilir
-- NOT: rls-infinite-recursion-fix.sql dosyası bu policy'yi zaten oluşturuyor
-- Bu migration sadece tabloyu oluşturur, policy'yi rls-infinite-recursion-fix.sql yönetir
-- Policy oluşturma kaldırıldı - rls-infinite-recursion-fix.sql'de zaten var

