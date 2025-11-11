-- CRM V3 - Schema Extensions
-- Modül bazlı özel alanlar için genişletme

-- Customer tablosuna özel alanlar ekle
ALTER TABLE "Customer" 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS sector VARCHAR(100),
ADD COLUMN IF NOT EXISTS website VARCHAR(255),
ADD COLUMN IF NOT EXISTS "taxNumber" VARCHAR(50),
ADD COLUMN IF NOT EXISTS fax VARCHAR(50),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Quote tablosuna özel alanlar ekle
ALTER TABLE "Quote" 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS "validUntil" DATE,
ADD COLUMN IF NOT EXISTS discount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "taxRate" DECIMAL(5, 2) DEFAULT 18;

-- Deal tablosuna özel alanlar ekle
ALTER TABLE "Deal" 
ADD COLUMN IF NOT EXISTS "winProbability" INTEGER DEFAULT 50 CHECK ("winProbability" >= 0 AND "winProbability" <= 100),
ADD COLUMN IF NOT EXISTS "expectedCloseDate" DATE,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Invoice tablosuna özel alanlar ekle
ALTER TABLE "Invoice" 
ADD COLUMN IF NOT EXISTS "invoiceNumber" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "dueDate" DATE,
ADD COLUMN IF NOT EXISTS "paymentDate" DATE,
ADD COLUMN IF NOT EXISTS "taxRate" DECIMAL(5, 2) DEFAULT 18;

-- Product tablosuna özel alanlar ekle (zaten var ama kontrol)
ALTER TABLE "Product" 
ADD COLUMN IF NOT EXISTS category VARCHAR(100),
ADD COLUMN IF NOT EXISTS sku VARCHAR(100),
ADD COLUMN IF NOT EXISTS weight DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS dimensions VARCHAR(100);

-- Task tablosuna özel alanlar ekle
ALTER TABLE "Task" 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS "dueDate" DATE,
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'MEDIUM';

-- Ticket tablosuna özel alanlar ekle
ALTER TABLE "Ticket" 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Shipment tablosuna özel alanlar ekle
ALTER TABLE "Shipment" 
ADD COLUMN IF NOT EXISTS "shippingCompany" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "estimatedDelivery" DATE,
ADD COLUMN IF NOT EXISTS "deliveryAddress" TEXT;






