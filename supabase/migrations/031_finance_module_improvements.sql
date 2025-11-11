-- Finance Modülü Geliştirmeleri
-- Yeni kolonlar: relatedEntityType, relatedEntityId, paymentMethod, paymentDate, isRecurring
-- Eksik kolonlar: category, description, customerCompanyId

-- category kolonu ekle (eğer yoksa)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Finance' AND column_name = 'category'
  ) THEN
    ALTER TABLE "Finance" ADD COLUMN "category" VARCHAR(50);
    COMMENT ON COLUMN "Finance"."category" IS 'Kategori: FUEL, ACCOMMODATION, FOOD, TRANSPORT, OFFICE, MARKETING, SHIPPING, PURCHASE, TRAVEL, UTILITIES, RENT, SALARY, TAX, INSURANCE, MAINTENANCE, TRAINING, SOFTWARE, INVOICE_INCOME, SERVICE, PRODUCT_SALE, CONSULTING, LICENSE, INVESTMENT, OTHER';
  END IF;
END $$;

-- description kolonu ekle (eğer yoksa)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Finance' AND column_name = 'description'
  ) THEN
    ALTER TABLE "Finance" ADD COLUMN "description" TEXT;
    COMMENT ON COLUMN "Finance"."description" IS 'Finans kaydı açıklaması';
  END IF;
END $$;

-- customerCompanyId kolonu ekle (eğer yoksa)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Finance' AND column_name = 'customerCompanyId'
  ) THEN
    ALTER TABLE "Finance" ADD COLUMN "customerCompanyId" UUID REFERENCES "CustomerCompany"(id) ON DELETE SET NULL;
    COMMENT ON COLUMN "Finance"."customerCompanyId" IS 'İlişkili müşteri firması';
  END IF;
END $$;

-- relatedEntityType kolonu ekle (Invoice, Shipment, Purchase, Task, Ticket, Meeting, Product, Deal, Quote)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Finance' AND column_name = 'relatedEntityType'
  ) THEN
    ALTER TABLE "Finance" ADD COLUMN "relatedEntityType" VARCHAR(50);
    COMMENT ON COLUMN "Finance"."relatedEntityType" IS 'İlişkili entity tipi: Invoice, Shipment, Purchase, Task, Ticket, Meeting, Product, Deal, Quote';
  END IF;
END $$;

-- relatedEntityId kolonu ekle (UUID)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Finance' AND column_name = 'relatedEntityId'
  ) THEN
    ALTER TABLE "Finance" ADD COLUMN "relatedEntityId" UUID;
    COMMENT ON COLUMN "Finance"."relatedEntityId" IS 'İlişkili entity ID (UUID)';
  END IF;
END $$;

-- paymentMethod kolonu ekle (Ödeme yöntemi)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Finance' AND column_name = 'paymentMethod'
  ) THEN
    ALTER TABLE "Finance" ADD COLUMN "paymentMethod" VARCHAR(20);
    COMMENT ON COLUMN "Finance"."paymentMethod" IS 'Ödeme yöntemi: CASH, BANK, CREDIT_CARD, DEBIT_CARD, CHECK, OTHER';
  END IF;
END $$;

-- paymentDate kolonu ekle (Ödeme tarihi)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Finance' AND column_name = 'paymentDate'
  ) THEN
    ALTER TABLE "Finance" ADD COLUMN "paymentDate" DATE;
    COMMENT ON COLUMN "Finance"."paymentDate" IS 'Ödeme tarihi (oluşturma tarihinden farklı olabilir)';
  END IF;
END $$;

-- isRecurring kolonu ekle (Tekrarlayan gider)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Finance' AND column_name = 'isRecurring'
  ) THEN
    ALTER TABLE "Finance" ADD COLUMN "isRecurring" BOOLEAN DEFAULT FALSE;
    COMMENT ON COLUMN "Finance"."isRecurring" IS 'Tekrarlayan gider işareti (aylık otomatik oluşturma için)';
  END IF;
END $$;

-- Index'ler ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_finance_related_entity 
  ON "Finance"("relatedEntityType", "relatedEntityId") 
  WHERE "relatedEntityType" IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_finance_payment_date 
  ON "Finance"("paymentDate") 
  WHERE "paymentDate" IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_finance_is_recurring 
  ON "Finance"("isRecurring") 
  WHERE "isRecurring" = TRUE;

-- type_category index'i (category kolonu varsa)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Finance' AND column_name = 'category'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_finance_type_category 
      ON "Finance"("type", "category") 
      WHERE "category" IS NOT NULL;
  END IF;
END $$;

-- Yorumlar ekle
DO $$ 
BEGIN
  -- relatedEntityType index yorumu
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_finance_related_entity'
  ) THEN
    COMMENT ON INDEX idx_finance_related_entity IS 'İlişkili entity aramaları için performans indexi';
  END IF;

  -- paymentDate index yorumu
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_finance_payment_date'
  ) THEN
    COMMENT ON INDEX idx_finance_payment_date IS 'Ödeme tarihi bazlı filtreleme ve raporlama için performans indexi';
  END IF;

  -- isRecurring index yorumu
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_finance_is_recurring'
  ) THEN
    COMMENT ON INDEX idx_finance_is_recurring IS 'Tekrarlayan giderler için performans indexi';
  END IF;

  -- type_category index yorumu
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_finance_type_category'
  ) THEN
    COMMENT ON INDEX idx_finance_type_category IS 'Tip ve kategori bazlı filtreleme için performans indexi';
  END IF;
END $$;

-- Eski relatedTo formatından yeni format'a geçiş (opsiyonel - mevcut veriler için)
-- NOT: Bu migration mevcut verileri değiştirmez, sadece yeni kolonları ekler
-- Eğer eski verileri yeni formata çevirmek isterseniz, ayrı bir migration dosyası oluşturun

