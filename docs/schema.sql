-- CRM Enterprise V3 - Database Schema
-- Supabase PostgreSQL Schema

-- Company table (multi-tenant root)
CREATE TABLE IF NOT EXISTS "Company" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  sector VARCHAR(100),
  city VARCHAR(100),
  status VARCHAR(20) DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User table (Company ilişkisi)
CREATE TABLE IF NOT EXISTS "User" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'USER',
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer table (Company ilişkisi)
CREATE TABLE IF NOT EXISTS "Customer" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  city VARCHAR(100),
  status VARCHAR(20) DEFAULT 'ACTIVE',
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deal table (Customer, Company ilişkileri)
CREATE TABLE IF NOT EXISTS "Deal" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  stage VARCHAR(50) DEFAULT 'LEAD',
  value DECIMAL(15, 2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'OPEN',
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "customerId" UUID REFERENCES "Customer"(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quote table (Deal, Company ilişkileri)
CREATE TABLE IF NOT EXISTS "Quote" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'DRAFT',
  total DECIMAL(15, 2) DEFAULT 0,
  "dealId" UUID REFERENCES "Deal"(id) ON DELETE SET NULL,
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoice table (Quote, Company ilişkileri)
CREATE TABLE IF NOT EXISTS "Invoice" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'DRAFT',
  total DECIMAL(15, 2) DEFAULT 0,
  "quoteId" UUID REFERENCES "Quote"(id) ON DELETE SET NULL,
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product table (Company ilişkisi)
CREATE TABLE IF NOT EXISTS "Product" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  price DECIMAL(15, 2) DEFAULT 0,
  stock INTEGER DEFAULT 0,
  description TEXT,
  imageUrl TEXT,
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Finance table (Company ilişkisi)
CREATE TABLE IF NOT EXISTS "Finance" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL, -- INCOME or EXPENSE
  amount DECIMAL(15, 2) NOT NULL,
  "relatedTo" VARCHAR(100),
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task table (Company, User ilişkileri)
CREATE TABLE IF NOT EXISTS "Task" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'TODO',
  "assignedTo" UUID REFERENCES "User"(id) ON DELETE SET NULL,
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ticket table (Customer, Company ilişkileri)
CREATE TABLE IF NOT EXISTS "Ticket" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'OPEN',
  priority VARCHAR(20) DEFAULT 'MEDIUM',
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "customerId" UUID REFERENCES "Customer"(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shipment table (Invoice, Company ilişkileri)
CREATE TABLE IF NOT EXISTS "Shipment" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking VARCHAR(100),
  status VARCHAR(20) DEFAULT 'PENDING',
  "invoiceId" UUID REFERENCES "Invoice"(id) ON DELETE SET NULL,
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ActivityLog table (User, Company ilişkileri, meta JSON)
CREATE TABLE IF NOT EXISTS "ActivityLog" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  meta JSONB,
  "userId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index'ler (Performans için)
CREATE INDEX IF NOT EXISTS idx_quote_status ON "Quote"("status");
CREATE INDEX IF NOT EXISTS idx_invoice_status ON "Invoice"("status");
CREATE INDEX IF NOT EXISTS idx_activitylog_company ON "ActivityLog"("companyId");
CREATE INDEX IF NOT EXISTS idx_customer_company ON "Customer"("companyId");
CREATE INDEX IF NOT EXISTS idx_deal_company ON "Deal"("companyId");
CREATE INDEX IF NOT EXISTS idx_user_company ON "User"("companyId");
CREATE INDEX IF NOT EXISTS idx_quote_company ON "Quote"("companyId");
CREATE INDEX IF NOT EXISTS idx_invoice_company ON "Invoice"("companyId");
CREATE INDEX IF NOT EXISTS idx_product_company ON "Product"("companyId");
CREATE INDEX IF NOT EXISTS idx_activitylog_created ON "ActivityLog"("createdAt" DESC);







