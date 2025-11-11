-- Meeting Tablosu Kontrolü ve Oluşturma Scripti
-- Bu script'i Supabase Dashboard > SQL Editor'de çalıştırın

-- 1. Meeting tablosu var mı kontrol et
SELECT 
  'Meeting tablosu var mı?' as kontrol,
  COUNT(*) as tablo_sayisi
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'Meeting';

-- 2. Eğer Meeting tablosu yoksa, oluştur
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'Meeting'
  ) THEN
    CREATE TABLE "Meeting" (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      description TEXT,
      "meetingDate" TIMESTAMP WITH TIME ZONE NOT NULL,
      "meetingDuration" INTEGER DEFAULT 60,
      location VARCHAR(255),
      status VARCHAR(20) DEFAULT 'PLANNED',
      "expenseWarning" BOOLEAN DEFAULT FALSE,
      "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
      "customerId" UUID REFERENCES "Customer"(id) ON DELETE SET NULL,
      "dealId" UUID REFERENCES "Deal"(id) ON DELETE SET NULL,
      "createdBy" UUID REFERENCES "User"(id) ON DELETE SET NULL,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    RAISE NOTICE 'Meeting tablosu oluşturuldu';
  ELSE
    RAISE NOTICE 'Meeting tablosu zaten var';
  END IF;
END $$;

-- 3. MeetingExpense tablosu var mı kontrol et
SELECT 
  'MeetingExpense tablosu var mı?' as kontrol,
  COUNT(*) as tablo_sayisi
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'MeetingExpense';

-- 4. Eğer MeetingExpense tablosu yoksa, oluştur
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'MeetingExpense'
  ) THEN
    CREATE TABLE "MeetingExpense" (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "meetingId" UUID NOT NULL REFERENCES "Meeting"(id) ON DELETE CASCADE,
      "expenseType" VARCHAR(20) NOT NULL,
      amount DECIMAL(15, 2) NOT NULL,
      description TEXT,
      "expenseDate" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
      "createdBy" UUID REFERENCES "User"(id) ON DELETE SET NULL,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    RAISE NOTICE 'MeetingExpense tablosu oluşturuldu';
  ELSE
    RAISE NOTICE 'MeetingExpense tablosu zaten var';
  END IF;
END $$;

-- 5. Index'leri oluştur (eğer yoksa)
CREATE INDEX IF NOT EXISTS idx_meeting_company ON "Meeting"("companyId");
CREATE INDEX IF NOT EXISTS idx_meeting_customer ON "Meeting"("customerId");
CREATE INDEX IF NOT EXISTS idx_meeting_deal ON "Meeting"("dealId");
CREATE INDEX IF NOT EXISTS idx_meeting_date ON "Meeting"("meetingDate");
CREATE INDEX IF NOT EXISTS idx_meeting_status ON "Meeting"("status");
CREATE INDEX IF NOT EXISTS idx_meeting_created_by ON "Meeting"("createdBy");
CREATE INDEX IF NOT EXISTS idx_meeting_expense_meeting ON "MeetingExpense"("meetingId");
CREATE INDEX IF NOT EXISTS idx_meeting_expense_company ON "MeetingExpense"("companyId");
CREATE INDEX IF NOT EXISTS idx_meeting_expense_type ON "MeetingExpense"("expenseType");

-- 6. RLS Policies oluştur
DROP POLICY IF EXISTS "meeting_company_isolation" ON "Meeting";
CREATE POLICY "meeting_company_isolation" ON "Meeting"
  FOR ALL
  USING (true); -- API seviyesinde companyId kontrolü yapılıyor

DROP POLICY IF EXISTS "meeting_expense_company_isolation" ON "MeetingExpense";
CREATE POLICY "meeting_expense_company_isolation" ON "MeetingExpense"
  FOR ALL
  USING (true); -- API seviyesinde companyId kontrolü yapılıyor

-- 7. Trigger'ları oluştur
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

-- 8. Son kontrol - tablolar oluşturuldu mu?
SELECT 
  table_name,
  'Tablolar oluşturuldu' as durum
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('Meeting', 'MeetingExpense');











