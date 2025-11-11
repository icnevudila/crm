-- Görüşmeler (Meetings) Tablosu Migration
-- Enterprise Release: Görüşme modülü için veritabanı yapısı

-- 1. Meeting tablosu oluştur
CREATE TABLE IF NOT EXISTS "Meeting" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  "meetingDate" TIMESTAMP WITH TIME ZONE NOT NULL,
  "meetingDuration" INTEGER DEFAULT 60, -- Dakika cinsinden
  location VARCHAR(255),
  status VARCHAR(20) DEFAULT 'PLANNED', -- PLANNED, DONE, CANCELLED
  "expenseWarning" BOOLEAN DEFAULT FALSE,
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "customerId" UUID REFERENCES "Customer"(id) ON DELETE SET NULL,
  "dealId" UUID REFERENCES "Deal"(id) ON DELETE SET NULL,
  "createdBy" UUID REFERENCES "User"(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. MeetingExpense tablosu oluştur
CREATE TABLE IF NOT EXISTS "MeetingExpense" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "meetingId" UUID NOT NULL REFERENCES "Meeting"(id) ON DELETE CASCADE,
  "expenseType" VARCHAR(20) NOT NULL, -- FUEL, ACCOMMODATION, FOOD, OTHER
  amount DECIMAL(15, 2) NOT NULL,
  description TEXT,
  "expenseDate" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdBy" UUID REFERENCES "User"(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Finance tablosuna Meeting ilişkisi için relatedTo ve relatedId kolonları ekle (eğer yoksa)
-- NOT: Finance tablosu zaten var, sadece Meeting ilişkisi için kolonları kontrol et
DO $$
BEGIN
  -- relatedTo kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Finance' AND column_name = 'relatedTo'
  ) THEN
    ALTER TABLE "Finance" ADD COLUMN "relatedTo" VARCHAR(100);
  END IF;
  
  -- relatedId kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Finance' AND column_name = 'relatedId'
  ) THEN
    ALTER TABLE "Finance" ADD COLUMN "relatedId" UUID;
  END IF;
END $$;

-- 3. Index'ler (performans için)
-- Meeting tablosu için index'ler
CREATE INDEX IF NOT EXISTS idx_meeting_company ON "Meeting"("companyId");
CREATE INDEX IF NOT EXISTS idx_meeting_customer ON "Meeting"("customerId");
CREATE INDEX IF NOT EXISTS idx_meeting_deal ON "Meeting"("dealId");
CREATE INDEX IF NOT EXISTS idx_meeting_date ON "Meeting"("meetingDate");
CREATE INDEX IF NOT EXISTS idx_meeting_status ON "Meeting"("status");
CREATE INDEX IF NOT EXISTS idx_meeting_created_by ON "Meeting"("createdBy");

-- MeetingExpense tablosu için index'ler (tablo oluşturulduktan sonra)
CREATE INDEX IF NOT EXISTS idx_meeting_expense_meeting ON "MeetingExpense"("meetingId");
CREATE INDEX IF NOT EXISTS idx_meeting_expense_company ON "MeetingExpense"("companyId");
CREATE INDEX IF NOT EXISTS idx_meeting_expense_type ON "MeetingExpense"("expenseType");

-- 4. RLS Policies
-- Meeting tablosu için RLS
DROP POLICY IF EXISTS "meeting_company_isolation" ON "Meeting";
CREATE POLICY "meeting_company_isolation" ON "Meeting"
  FOR ALL
  USING (
    "companyId" IN (
      SELECT id FROM "Company" WHERE id = "companyId"
    )
    OR
    EXISTS (
      SELECT 1 FROM "User" 
      WHERE "User".id = auth.uid() 
      AND ("User".role = 'SUPER_ADMIN' OR "User"."companyId" = "Meeting"."companyId")
    )
  );

-- MeetingExpense tablosu için RLS
DROP POLICY IF EXISTS "meeting_expense_company_isolation" ON "MeetingExpense";
CREATE POLICY "meeting_expense_company_isolation" ON "MeetingExpense"
  FOR ALL
  USING (
    "companyId" IN (
      SELECT id FROM "Company" WHERE id = "companyId"
    )
    OR
    EXISTS (
      SELECT 1 FROM "User" 
      WHERE "User".id = auth.uid() 
      AND ("User".role = 'SUPER_ADMIN' OR "User"."companyId" = "MeetingExpense"."companyId")
    )
  );

-- 5. Trigger: Görüşme sonrası gider kontrolü
CREATE OR REPLACE FUNCTION check_meeting_expense()
RETURNS TRIGGER AS $$
BEGIN
  -- Görüşme oluşturulduğunda veya güncellendiğinde gider kontrolü yap
  IF NOT EXISTS (
    SELECT 1 FROM "Finance" 
    WHERE "relatedTo" = 'Meeting' 
      AND "relatedId" = NEW.id
      AND "type" = 'EXPENSE'
  ) THEN
    NEW."expenseWarning" := TRUE;
  ELSE
    NEW."expenseWarning" := FALSE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_meeting_expense ON "Meeting";
CREATE TRIGGER trg_check_meeting_expense
  BEFORE INSERT OR UPDATE ON "Meeting"
  FOR EACH ROW
  EXECUTE FUNCTION check_meeting_expense();

-- 6. Trigger: updatedAt otomatik güncelleme
CREATE OR REPLACE FUNCTION update_meeting_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_meeting_updated_at ON "Meeting";
CREATE TRIGGER trigger_update_meeting_updated_at
  BEFORE UPDATE ON "Meeting"
  FOR EACH ROW
  EXECUTE FUNCTION update_meeting_updated_at();

CREATE OR REPLACE FUNCTION update_meeting_expense_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_meeting_expense_updated_at ON "MeetingExpense";
CREATE TRIGGER trigger_update_meeting_expense_updated_at
  BEFORE UPDATE ON "MeetingExpense"
  FOR EACH ROW
  EXECUTE FUNCTION update_meeting_expense_updated_at();

