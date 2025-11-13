-- Finance Modülü Eksik Kolonları Ekle
-- description, relatedEntityType, relatedEntityId, paymentMethod, paymentDate, isRecurring, customerCompanyId

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

-- relatedEntityType kolonu ekle (eğer yoksa)
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

-- relatedEntityId kolonu ekle (eğer yoksa)
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

-- paymentMethod kolonu ekle (eğer yoksa)
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

-- paymentDate kolonu ekle (eğer yoksa)
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

-- isRecurring kolonu ekle (eğer yoksa)
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

CREATE INDEX IF NOT EXISTS idx_finance_customer_company 
  ON "Finance"("customerCompanyId") 
  WHERE "customerCompanyId" IS NOT NULL;

















