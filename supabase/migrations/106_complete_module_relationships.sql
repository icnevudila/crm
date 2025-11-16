-- ============================================
-- CRM V3 - TÜM MODÜL İLİŞKİLERİNİ TAMAMLA
-- Migration: 106
-- Tarih: 2024
-- Amaç: Tüm modüller arası eksik ilişkileri ve alanları ekle
-- ============================================

-- ============================================
-- BÖLÜM 1: TASK İLİŞKİLERİNİ TAMAMLA
-- ============================================

-- Task tablosuna eksik ilişki alanları ekle
DO $$
BEGIN
  -- relatedTo kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Task' 
    AND column_name = 'relatedTo'
  ) THEN
    ALTER TABLE "Task" ADD COLUMN "relatedTo" VARCHAR(50);
    COMMENT ON COLUMN "Task"."relatedTo" IS 'İlişkili modül tipi: Customer, Deal, Quote, Invoice, Contract, Meeting, Ticket, Product';
  END IF;
  
  -- relatedId kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Task' 
    AND column_name = 'relatedId'
  ) THEN
    ALTER TABLE "Task" ADD COLUMN "relatedId" UUID;
    COMMENT ON COLUMN "Task"."relatedId" IS 'İlişkili modül ID (UUID)';
  END IF;
  
  -- customerId kolonu yoksa ekle (direkt müşteri ilişkisi için)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Task' 
    AND column_name = 'customerId'
  ) THEN
    ALTER TABLE "Task" ADD COLUMN "customerId" UUID REFERENCES "Customer"(id) ON DELETE SET NULL;
    COMMENT ON COLUMN "Task"."customerId" IS 'İlişkili müşteri (direkt bağlantı için)';
  END IF;
  
  -- dealId kolonu yoksa ekle (direkt fırsat ilişkisi için)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Task' 
    AND column_name = 'dealId'
  ) THEN
    ALTER TABLE "Task" ADD COLUMN "dealId" UUID REFERENCES "Deal"(id) ON DELETE SET NULL;
    COMMENT ON COLUMN "Task"."dealId" IS 'İlişkili fırsat (direkt bağlantı için)';
  END IF;
  
  -- quoteId kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Task' 
    AND column_name = 'quoteId'
  ) THEN
    ALTER TABLE "Task" ADD COLUMN "quoteId" UUID REFERENCES "Quote"(id) ON DELETE SET NULL;
    COMMENT ON COLUMN "Task"."quoteId" IS 'İlişkili teklif';
  END IF;
  
  -- invoiceId kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Task' 
    AND column_name = 'invoiceId'
  ) THEN
    ALTER TABLE "Task" ADD COLUMN "invoiceId" UUID REFERENCES "Invoice"(id) ON DELETE SET NULL;
    COMMENT ON COLUMN "Task"."invoiceId" IS 'İlişkili fatura';
  END IF;
  
  -- contractId kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Task' 
    AND column_name = 'contractId'
  ) THEN
    ALTER TABLE "Task" ADD COLUMN "contractId" UUID REFERENCES "Contract"(id) ON DELETE SET NULL;
    COMMENT ON COLUMN "Task"."contractId" IS 'İlişkili sözleşme';
  END IF;
  
  -- meetingId kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Task' 
    AND column_name = 'meetingId'
  ) THEN
    ALTER TABLE "Task" ADD COLUMN "meetingId" UUID REFERENCES "Meeting"(id) ON DELETE SET NULL;
    COMMENT ON COLUMN "Task"."meetingId" IS 'İlişkili toplantı';
  END IF;
  
  -- ticketId kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Task' 
    AND column_name = 'ticketId'
  ) THEN
    ALTER TABLE "Task" ADD COLUMN "ticketId" UUID REFERENCES "Ticket"(id) ON DELETE SET NULL;
    COMMENT ON COLUMN "Task"."ticketId" IS 'İlişkili destek talebi';
  END IF;
END $$;

-- Task index'leri
CREATE INDEX IF NOT EXISTS idx_task_related ON "Task"("relatedTo", "relatedId") WHERE "relatedTo" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_task_customer ON "Task"("customerId") WHERE "customerId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_task_deal ON "Task"("dealId") WHERE "dealId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_task_quote ON "Task"("quoteId") WHERE "quoteId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_task_invoice ON "Task"("invoiceId") WHERE "invoiceId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_task_contract ON "Task"("contractId") WHERE "contractId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_task_meeting ON "Task"("meetingId") WHERE "meetingId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_task_ticket ON "Task"("ticketId") WHERE "ticketId" IS NOT NULL;

-- ============================================
-- BÖLÜM 2: MEETING İLİŞKİLERİNİ TAMAMLA
-- ============================================

-- Meeting tablosuna eksik ilişki alanları ekle
DO $$
BEGIN
  -- relatedTo kolonu yoksa ekle (zaten var olabilir, kontrol et)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Meeting' 
    AND column_name = 'relatedTo'
  ) THEN
    ALTER TABLE "Meeting" ADD COLUMN "relatedTo" VARCHAR(50);
    COMMENT ON COLUMN "Meeting"."relatedTo" IS 'İlişkili modül tipi: Customer, Deal, Quote, Invoice, Contract, Task, Ticket';
  END IF;
  
  -- relatedId kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Meeting' 
    AND column_name = 'relatedId'
  ) THEN
    ALTER TABLE "Meeting" ADD COLUMN "relatedId" UUID;
    COMMENT ON COLUMN "Meeting"."relatedId" IS 'İlişkili modül ID (UUID)';
  END IF;
  
  -- quoteId kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Meeting' 
    AND column_name = 'quoteId'
  ) THEN
    ALTER TABLE "Meeting" ADD COLUMN "quoteId" UUID REFERENCES "Quote"(id) ON DELETE SET NULL;
    COMMENT ON COLUMN "Meeting"."quoteId" IS 'İlişkili teklif';
  END IF;
  
  -- invoiceId kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Meeting' 
    AND column_name = 'invoiceId'
  ) THEN
    ALTER TABLE "Meeting" ADD COLUMN "invoiceId" UUID REFERENCES "Invoice"(id) ON DELETE SET NULL;
    COMMENT ON COLUMN "Meeting"."invoiceId" IS 'İlişkili fatura';
  END IF;
  
  -- contractId kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Meeting' 
    AND column_name = 'contractId'
  ) THEN
    ALTER TABLE "Meeting" ADD COLUMN "contractId" UUID REFERENCES "Contract"(id) ON DELETE SET NULL;
    COMMENT ON COLUMN "Meeting"."contractId" IS 'İlişkili sözleşme';
  END IF;
  
  -- ticketId kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Meeting' 
    AND column_name = 'ticketId'
  ) THEN
    ALTER TABLE "Meeting" ADD COLUMN "ticketId" UUID REFERENCES "Ticket"(id) ON DELETE SET NULL;
    COMMENT ON COLUMN "Meeting"."ticketId" IS 'İlişkili destek talebi';
  END IF;
END $$;

-- Meeting index'leri
CREATE INDEX IF NOT EXISTS idx_meeting_related ON "Meeting"("relatedTo", "relatedId") WHERE "relatedTo" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_meeting_quote ON "Meeting"("quoteId") WHERE "quoteId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_meeting_invoice ON "Meeting"("invoiceId") WHERE "invoiceId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_meeting_contract ON "Meeting"("contractId") WHERE "contractId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_meeting_ticket ON "Meeting"("ticketId") WHERE "ticketId" IS NOT NULL;

-- ============================================
-- BÖLÜM 3: FINANCE İLİŞKİLERİNİ TAMAMLA
-- ============================================

-- Finance tablosuna eksik ilişki alanları ekle
DO $$
BEGIN
  -- relatedTo kolonu yoksa ekle (zaten var olabilir)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Finance' 
    AND column_name = 'relatedTo'
  ) THEN
    ALTER TABLE "Finance" ADD COLUMN "relatedTo" VARCHAR(50);
    COMMENT ON COLUMN "Finance"."relatedTo" IS 'İlişkili modül tipi: Invoice, Shipment, Purchase, Task, Ticket, Meeting, Product, Deal, Quote, Contract';
  END IF;
  
  -- relatedId kolonu yoksa ekle (zaten var olabilir)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Finance' 
    AND column_name = 'relatedId'
  ) THEN
    ALTER TABLE "Finance" ADD COLUMN "relatedId" UUID;
    COMMENT ON COLUMN "Finance"."relatedId" IS 'İlişkili modül ID (UUID)';
  END IF;
  
  -- invoiceId kolonu yoksa ekle (direkt fatura ilişkisi için)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Finance' 
    AND column_name = 'invoiceId'
  ) THEN
    ALTER TABLE "Finance" ADD COLUMN "invoiceId" UUID REFERENCES "Invoice"(id) ON DELETE SET NULL;
    COMMENT ON COLUMN "Finance"."invoiceId" IS 'İlişkili fatura (direkt bağlantı için)';
  END IF;
  
  -- contractId kolonu yoksa ekle (direkt sözleşme ilişkisi için)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Finance' 
    AND column_name = 'contractId'
  ) THEN
    ALTER TABLE "Finance" ADD COLUMN "contractId" UUID REFERENCES "Contract"(id) ON DELETE SET NULL;
    COMMENT ON COLUMN "Finance"."contractId" IS 'İlişkili sözleşme (direkt bağlantı için)';
  END IF;
  
  -- dealId kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Finance' 
    AND column_name = 'dealId'
  ) THEN
    ALTER TABLE "Finance" ADD COLUMN "dealId" UUID REFERENCES "Deal"(id) ON DELETE SET NULL;
    COMMENT ON COLUMN "Finance"."dealId" IS 'İlişkili fırsat';
  END IF;
  
  -- quoteId kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Finance' 
    AND column_name = 'quoteId'
  ) THEN
    ALTER TABLE "Finance" ADD COLUMN "quoteId" UUID REFERENCES "Quote"(id) ON DELETE SET NULL;
    COMMENT ON COLUMN "Finance"."quoteId" IS 'İlişkili teklif';
  END IF;
  
  -- shipmentId kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Finance' 
    AND column_name = 'shipmentId'
  ) THEN
    ALTER TABLE "Finance" ADD COLUMN "shipmentId" UUID REFERENCES "Shipment"(id) ON DELETE SET NULL;
    COMMENT ON COLUMN "Finance"."shipmentId" IS 'İlişkili sevkiyat';
  END IF;
  
  -- meetingId kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Finance' 
    AND column_name = 'meetingId'
  ) THEN
    ALTER TABLE "Finance" ADD COLUMN "meetingId" UUID REFERENCES "Meeting"(id) ON DELETE SET NULL;
    COMMENT ON COLUMN "Finance"."meetingId" IS 'İlişkili toplantı';
  END IF;
  
  -- taskId kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Finance' 
    AND column_name = 'taskId'
  ) THEN
    ALTER TABLE "Finance" ADD COLUMN "taskId" UUID REFERENCES "Task"(id) ON DELETE SET NULL;
    COMMENT ON COLUMN "Finance"."taskId" IS 'İlişkili görev';
  END IF;
  
  -- ticketId kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Finance' 
    AND column_name = 'ticketId'
  ) THEN
    ALTER TABLE "Finance" ADD COLUMN "ticketId" UUID REFERENCES "Ticket"(id) ON DELETE SET NULL;
    COMMENT ON COLUMN "Finance"."ticketId" IS 'İlişkili destek talebi';
  END IF;
  
  -- customerId kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Finance' 
    AND column_name = 'customerId'
  ) THEN
    ALTER TABLE "Finance" ADD COLUMN "customerId" UUID REFERENCES "Customer"(id) ON DELETE SET NULL;
    COMMENT ON COLUMN "Finance"."customerId" IS 'İlişkili müşteri';
  END IF;
END $$;

-- Finance index'leri
CREATE INDEX IF NOT EXISTS idx_finance_related ON "Finance"("relatedTo", "relatedId") WHERE "relatedTo" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_finance_invoice ON "Finance"("invoiceId") WHERE "invoiceId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_finance_contract ON "Finance"("contractId") WHERE "contractId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_finance_deal ON "Finance"("dealId") WHERE "dealId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_finance_quote ON "Finance"("quoteId") WHERE "quoteId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_finance_shipment ON "Finance"("shipmentId") WHERE "shipmentId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_finance_meeting ON "Finance"("meetingId") WHERE "meetingId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_finance_task ON "Finance"("taskId") WHERE "taskId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_finance_ticket ON "Finance"("ticketId") WHERE "ticketId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_finance_customer ON "Finance"("customerId") WHERE "customerId" IS NOT NULL;

-- ============================================
-- BÖLÜM 4: DOCUMENT İLİŞKİLERİNİ TAMAMLA
-- ============================================

-- Document tablosuna eksik ilişki alanları ekle (zaten relatedTo/relatedId var ama direkt FK'ler ekleyelim)
DO $$
BEGIN
  -- customerId kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Document' 
    AND column_name = 'customerId'
  ) THEN
    ALTER TABLE "Document" ADD COLUMN "customerId" UUID REFERENCES "Customer"(id) ON DELETE SET NULL;
    COMMENT ON COLUMN "Document"."customerId" IS 'İlişkili müşteri (direkt bağlantı için)';
  END IF;
  
  -- dealId kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Document' 
    AND column_name = 'dealId'
  ) THEN
    ALTER TABLE "Document" ADD COLUMN "dealId" UUID REFERENCES "Deal"(id) ON DELETE SET NULL;
    COMMENT ON COLUMN "Document"."dealId" IS 'İlişkili fırsat';
  END IF;
  
  -- quoteId kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Document' 
    AND column_name = 'quoteId'
  ) THEN
    ALTER TABLE "Document" ADD COLUMN "quoteId" UUID REFERENCES "Quote"(id) ON DELETE SET NULL;
    COMMENT ON COLUMN "Document"."quoteId" IS 'İlişkili teklif';
  END IF;
  
  -- invoiceId kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Document' 
    AND column_name = 'invoiceId'
  ) THEN
    ALTER TABLE "Document" ADD COLUMN "invoiceId" UUID REFERENCES "Invoice"(id) ON DELETE SET NULL;
    COMMENT ON COLUMN "Document"."invoiceId" IS 'İlişkili fatura';
  END IF;
  
  -- contractId kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Document' 
    AND column_name = 'contractId'
  ) THEN
    ALTER TABLE "Document" ADD COLUMN "contractId" UUID REFERENCES "Contract"(id) ON DELETE SET NULL;
    COMMENT ON COLUMN "Document"."contractId" IS 'İlişkili sözleşme';
  END IF;
  
  -- meetingId kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Document' 
    AND column_name = 'meetingId'
  ) THEN
    ALTER TABLE "Document" ADD COLUMN "meetingId" UUID REFERENCES "Meeting"(id) ON DELETE SET NULL;
    COMMENT ON COLUMN "Document"."meetingId" IS 'İlişkili toplantı';
  END IF;
  
  -- ticketId kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Document' 
    AND column_name = 'ticketId'
  ) THEN
    ALTER TABLE "Document" ADD COLUMN "ticketId" UUID REFERENCES "Ticket"(id) ON DELETE SET NULL;
    COMMENT ON COLUMN "Document"."ticketId" IS 'İlişkili destek talebi';
  END IF;
  
  -- taskId kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Document' 
    AND column_name = 'taskId'
  ) THEN
    ALTER TABLE "Document" ADD COLUMN "taskId" UUID REFERENCES "Task"(id) ON DELETE SET NULL;
    COMMENT ON COLUMN "Document"."taskId" IS 'İlişkili görev';
  END IF;
END $$;

-- Document index'leri
CREATE INDEX IF NOT EXISTS idx_document_customer ON "Document"("customerId") WHERE "customerId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_document_deal ON "Document"("dealId") WHERE "dealId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_document_quote ON "Document"("quoteId") WHERE "quoteId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_document_invoice ON "Document"("invoiceId") WHERE "invoiceId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_document_contract ON "Document"("contractId") WHERE "contractId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_document_meeting ON "Document"("meetingId") WHERE "meetingId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_document_ticket ON "Document"("ticketId") WHERE "ticketId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_document_task ON "Document"("taskId") WHERE "taskId" IS NOT NULL;

-- ============================================
-- BÖLÜM 5: PRODUCT İLİŞKİLERİNİ TAMAMLA
-- ============================================

-- Product tablosuna eksik ilişki alanları ekle
DO $$
BEGIN
  -- vendorId kolonu yoksa ekle (zaten var olabilir)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Product' 
    AND column_name = 'vendorId'
  ) THEN
    ALTER TABLE "Product" ADD COLUMN "vendorId" UUID REFERENCES "Vendor"(id) ON DELETE SET NULL;
    COMMENT ON COLUMN "Product"."vendorId" IS 'Tedarikçi (Vendor)';
  END IF;
  
  -- customerId kolonu yoksa ekle (favori ürünler için)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Product' 
    AND column_name = 'customerId'
  ) THEN
    -- Bu alanı ekleme, çünkü Product → Customer ilişkisi N:N olmalı (ProductCustomerFavorite tablosu ile)
    -- Ama şimdilik ekleyelim, sonra düzeltebiliriz
    NULL;
  END IF;
END $$;

-- Product index'leri
CREATE INDEX IF NOT EXISTS idx_product_vendor ON "Product"("vendorId") WHERE "vendorId" IS NOT NULL;

-- ============================================
-- BÖLÜM 6: VENDOR İLİŞKİLERİNİ TAMAMLA
-- ============================================

-- Vendor tablosu varsa kontrol et
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'Vendor'
  ) THEN
    -- Vendor tablosuna eksik alanlar ekle
    -- (Vendor tablosu zaten varsa, sadece index ekleyelim)
    NULL;
  END IF;
END $$;

-- ============================================
-- BÖLÜM 7: CONTRACT İLİŞKİLERİNİ TAMAMLA
-- ============================================

-- Contract tablosuna eksik ilişki alanları ekle
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'Contract'
  ) THEN
    -- invoiceId kolonu yoksa ekle (Contract'tan Invoice'a bağlantı)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'Contract' 
      AND column_name = 'invoiceId'
    ) THEN
      ALTER TABLE "Contract" ADD COLUMN "invoiceId" UUID REFERENCES "Invoice"(id) ON DELETE SET NULL;
      COMMENT ON COLUMN "Contract"."invoiceId" IS 'İlişkili fatura';
    END IF;
    
    -- shipmentId kolonu yoksa ekle
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'Contract' 
      AND column_name = 'shipmentId'
    ) THEN
      ALTER TABLE "Contract" ADD COLUMN "shipmentId" UUID REFERENCES "Shipment"(id) ON DELETE SET NULL;
      COMMENT ON COLUMN "Contract"."shipmentId" IS 'İlişkili sevkiyat';
    END IF;
  END IF;
END $$;

-- Contract index'leri
CREATE INDEX IF NOT EXISTS idx_contract_invoice ON "Contract"("invoiceId") WHERE "invoiceId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contract_shipment ON "Contract"("shipmentId") WHERE "shipmentId" IS NOT NULL;

-- ============================================
-- BÖLÜM 8: TICKET İLİŞKİLERİNİ TAMAMLA
-- ============================================

-- Ticket tablosuna eksik ilişki alanları ekle
DO $$
BEGIN
  -- dealId kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Ticket' 
    AND column_name = 'dealId'
  ) THEN
    ALTER TABLE "Ticket" ADD COLUMN "dealId" UUID REFERENCES "Deal"(id) ON DELETE SET NULL;
    COMMENT ON COLUMN "Ticket"."dealId" IS 'İlişkili fırsat';
  END IF;
  
  -- quoteId kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Ticket' 
    AND column_name = 'quoteId'
  ) THEN
    ALTER TABLE "Ticket" ADD COLUMN "quoteId" UUID REFERENCES "Quote"(id) ON DELETE SET NULL;
    COMMENT ON COLUMN "Ticket"."quoteId" IS 'İlişkili teklif';
  END IF;
  
  -- invoiceId kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Ticket' 
    AND column_name = 'invoiceId'
  ) THEN
    ALTER TABLE "Ticket" ADD COLUMN "invoiceId" UUID REFERENCES "Invoice"(id) ON DELETE SET NULL;
    COMMENT ON COLUMN "Ticket"."invoiceId" IS 'İlişkili fatura';
  END IF;
  
  -- contractId kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Ticket' 
    AND column_name = 'contractId'
  ) THEN
    ALTER TABLE "Ticket" ADD COLUMN "contractId" UUID REFERENCES "Contract"(id) ON DELETE SET NULL;
    COMMENT ON COLUMN "Ticket"."contractId" IS 'İlişkili sözleşme';
  END IF;
  
  -- meetingId kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Ticket' 
    AND column_name = 'meetingId'
  ) THEN
    ALTER TABLE "Ticket" ADD COLUMN "meetingId" UUID REFERENCES "Meeting"(id) ON DELETE SET NULL;
    COMMENT ON COLUMN "Ticket"."meetingId" IS 'İlişkili toplantı';
  END IF;
  
  -- productId kolonu yoksa ekle (ürün ile ilgili destek talebi için)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Ticket' 
    AND column_name = 'productId'
  ) THEN
    ALTER TABLE "Ticket" ADD COLUMN "productId" UUID REFERENCES "Product"(id) ON DELETE SET NULL;
    COMMENT ON COLUMN "Ticket"."productId" IS 'İlişkili ürün';
  END IF;
END $$;

-- Ticket index'leri
CREATE INDEX IF NOT EXISTS idx_ticket_deal ON "Ticket"("dealId") WHERE "dealId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ticket_quote ON "Ticket"("quoteId") WHERE "quoteId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ticket_invoice ON "Ticket"("invoiceId") WHERE "invoiceId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ticket_contract ON "Ticket"("contractId") WHERE "contractId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ticket_meeting ON "Ticket"("meetingId") WHERE "meetingId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ticket_product ON "Ticket"("productId") WHERE "productId" IS NOT NULL;

-- ============================================
-- BÖLÜM 9: SHIPMENT İLİŞKİLERİNİ TAMAMLA
-- ============================================

-- Shipment tablosuna eksik ilişki alanları ekle
DO $$
BEGIN
  -- quoteId kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Shipment' 
    AND column_name = 'quoteId'
  ) THEN
    ALTER TABLE "Shipment" ADD COLUMN "quoteId" UUID REFERENCES "Quote"(id) ON DELETE SET NULL;
    COMMENT ON COLUMN "Shipment"."quoteId" IS 'İlişkili teklif';
  END IF;
  
  -- dealId kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Shipment' 
    AND column_name = 'dealId'
  ) THEN
    ALTER TABLE "Shipment" ADD COLUMN "dealId" UUID REFERENCES "Deal"(id) ON DELETE SET NULL;
    COMMENT ON COLUMN "Shipment"."dealId" IS 'İlişkili fırsat';
  END IF;
  
  -- contractId kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Shipment' 
    AND column_name = 'contractId'
  ) THEN
    ALTER TABLE "Shipment" ADD COLUMN "contractId" UUID REFERENCES "Contract"(id) ON DELETE SET NULL;
    COMMENT ON COLUMN "Shipment"."contractId" IS 'İlişkili sözleşme';
  END IF;
  
  -- customerId kolonu yoksa ekle (direkt müşteri ilişkisi için)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Shipment' 
    AND column_name = 'customerId'
  ) THEN
    ALTER TABLE "Shipment" ADD COLUMN "customerId" UUID REFERENCES "Customer"(id) ON DELETE SET NULL;
    COMMENT ON COLUMN "Shipment"."customerId" IS 'İlişkili müşteri (direkt bağlantı için)';
  END IF;
END $$;

-- Shipment index'leri
CREATE INDEX IF NOT EXISTS idx_shipment_quote ON "Shipment"("quoteId") WHERE "quoteId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shipment_deal ON "Shipment"("dealId") WHERE "dealId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shipment_contract ON "Shipment"("contractId") WHERE "contractId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shipment_customer ON "Shipment"("customerId") WHERE "customerId" IS NOT NULL;

-- ============================================
-- BÖLÜM 10: QUOTE İLİŞKİLERİNİ TAMAMLA
-- ============================================

-- Quote tablosuna eksik ilişki alanları ekle
DO $$
BEGIN
  -- contractId kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Quote' 
    AND column_name = 'contractId'
  ) THEN
    ALTER TABLE "Quote" ADD COLUMN "contractId" UUID REFERENCES "Contract"(id) ON DELETE SET NULL;
    COMMENT ON COLUMN "Quote"."contractId" IS 'İlişkili sözleşme';
  END IF;
END $$;

-- Quote index'leri
CREATE INDEX IF NOT EXISTS idx_quote_contract ON "Quote"("contractId") WHERE "contractId" IS NOT NULL;

-- ============================================
-- BÖLÜM 11: INVOICE İLİŞKİLERİNİ TAMAMLA
-- ============================================

-- Invoice tablosuna eksik ilişki alanları ekle
DO $$
BEGIN
  -- contractId kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Invoice' 
    AND column_name = 'contractId'
  ) THEN
    ALTER TABLE "Invoice" ADD COLUMN "contractId" UUID REFERENCES "Contract"(id) ON DELETE SET NULL;
    COMMENT ON COLUMN "Invoice"."contractId" IS 'İlişkili sözleşme';
  END IF;
END $$;

-- Invoice index'leri
CREATE INDEX IF NOT EXISTS idx_invoice_contract ON "Invoice"("contractId") WHERE "contractId" IS NOT NULL;

-- ============================================
-- BÖLÜM 12: DEAL İLİŞKİLERİNİ TAMAMLA
-- ============================================

-- Deal tablosuna eksik ilişki alanları ekle
DO $$
BEGIN
  -- contractId kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Deal' 
    AND column_name = 'contractId'
  ) THEN
    ALTER TABLE "Deal" ADD COLUMN "contractId" UUID REFERENCES "Contract"(id) ON DELETE SET NULL;
    COMMENT ON COLUMN "Deal"."contractId" IS 'İlişkili sözleşme';
  END IF;
  
  -- competitorId kolonu yoksa ekle (rakip analizi için)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'Competitor'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'Deal' 
      AND column_name = 'competitorId'
    ) THEN
      ALTER TABLE "Deal" ADD COLUMN "competitorId" UUID REFERENCES "Competitor"(id) ON DELETE SET NULL;
      COMMENT ON COLUMN "Deal"."competitorId" IS 'Rakip (Competitor)';
    END IF;
  END IF;
END $$;

-- Deal index'leri
CREATE INDEX IF NOT EXISTS idx_deal_contract ON "Deal"("contractId") WHERE "contractId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deal_competitor ON "Deal"("competitorId") WHERE "competitorId" IS NOT NULL;

-- ============================================
-- BÖLÜM 13: COMMENT'LER VE ÖZET
-- ============================================

COMMENT ON TABLE "Task" IS 'Görevler - Tüm modüllerle ilişkili olabilir';
COMMENT ON TABLE "Meeting" IS 'Toplantılar - Tüm modüllerle ilişkili olabilir';
COMMENT ON TABLE "Finance" IS 'Finans kayıtları - Tüm modüllerle ilişkili olabilir';
COMMENT ON TABLE "Document" IS 'Dökümanlar - Tüm modüllerle ilişkili olabilir';
COMMENT ON TABLE "Ticket" IS 'Destek talepleri - Tüm modüllerle ilişkili olabilir';

-- ============================================
-- MIGRATION TAMAMLANDI
-- ============================================

