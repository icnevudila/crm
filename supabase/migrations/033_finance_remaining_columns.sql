-- Finance Modülü Kalan Eksik Kolonları Ekle
-- relatedEntityId, paymentMethod, paymentDate, isRecurring

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

-- Index'ler ekle (performans için) - sadece kolonlar varsa
DO $$ 
BEGIN
  -- relatedEntityId index'i (kolon varsa)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Finance' AND column_name = 'relatedEntityId'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_finance_related_entity 
      ON "Finance"("relatedEntityType", "relatedEntityId") 
      WHERE "relatedEntityType" IS NOT NULL;
  END IF;

  -- paymentDate index'i (kolon varsa)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Finance' AND column_name = 'paymentDate'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_finance_payment_date 
      ON "Finance"("paymentDate") 
      WHERE "paymentDate" IS NOT NULL;
  END IF;

  -- isRecurring index'i (kolon varsa)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Finance' AND column_name = 'isRecurring'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_finance_is_recurring 
      ON "Finance"("isRecurring") 
      WHERE "isRecurring" = TRUE;
  END IF;
END $$;












