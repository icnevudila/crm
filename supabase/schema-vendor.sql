-- Vendor (Tedarikçi) table - Kurumların alım yaptığı firmalar
-- Company: Multi-tenant (login sayfası)
-- Vendor: Tedarikçi firmalar (Quote, Product, Invoice için)

CREATE TABLE IF NOT EXISTS "Vendor" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  sector VARCHAR(100),
  city VARCHAR(100),
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  website VARCHAR(255),
  taxNumber VARCHAR(50),
  taxOffice VARCHAR(100),
  description TEXT,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quote'a vendorId ekle
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "vendorId" UUID REFERENCES "Vendor"(id) ON DELETE SET NULL;

-- Product'a vendorId ekle
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "vendorId" UUID REFERENCES "Vendor"(id) ON DELETE SET NULL;

-- Invoice'a vendorId ekle (satın alma faturaları için)
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "vendorId" UUID REFERENCES "Vendor"(id) ON DELETE SET NULL;

-- Index'ler (Performans için)
CREATE INDEX IF NOT EXISTS idx_vendor_company ON "Vendor"("companyId");
CREATE INDEX IF NOT EXISTS idx_vendor_status ON "Vendor"("status");
CREATE INDEX IF NOT EXISTS idx_quote_vendor ON "Quote"("vendorId");
CREATE INDEX IF NOT EXISTS idx_product_vendor ON "Product"("vendorId");
CREATE INDEX IF NOT EXISTS idx_invoice_vendor ON "Invoice"("vendorId");





