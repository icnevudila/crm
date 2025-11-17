-- ============================================
-- CRM V3 - RECURRING MEETINGS
-- Migration: 116
-- Tarih: 2024
-- Amaç: Tekrar eden randevular (recurring meetings) özelliği
-- ============================================

-- Meeting tablosuna recurring kolonları ekle
DO $$ 
BEGIN
  -- Önce Meeting tablosunun var olup olmadığını kontrol et
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'Meeting'
  ) THEN
    -- isRecurring kolonu
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Meeting' AND column_name = 'isRecurring'
    ) THEN
      ALTER TABLE "Meeting"
      ADD COLUMN "isRecurring" BOOLEAN DEFAULT FALSE;
      COMMENT ON COLUMN "Meeting"."isRecurring" IS 'Tekrar eden randevu mu?';
    END IF;

    -- parentMeetingId kolonu (recurring serisinin parent meeting'i)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Meeting' AND column_name = 'parentMeetingId'
    ) THEN
      ALTER TABLE "Meeting"
      ADD COLUMN "parentMeetingId" UUID REFERENCES "Meeting"(id) ON DELETE CASCADE;
      COMMENT ON COLUMN "Meeting"."parentMeetingId" IS 'Recurring serisinin parent meeting ID''si (ilk meeting)';
    END IF;

    -- recurrenceType kolonu (DAILY, WEEKLY, MONTHLY, YEARLY)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Meeting' AND column_name = 'recurrenceType'
    ) THEN
      ALTER TABLE "Meeting"
      ADD COLUMN "recurrenceType" VARCHAR(20);
      COMMENT ON COLUMN "Meeting"."recurrenceType" IS 'Tekrar tipi: DAILY, WEEKLY, MONTHLY, YEARLY';
    END IF;

    -- recurrenceInterval kolonu (her kaç günde/haftada/ayda bir)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Meeting' AND column_name = 'recurrenceInterval'
    ) THEN
      ALTER TABLE "Meeting"
      ADD COLUMN "recurrenceInterval" INTEGER DEFAULT 1;
      COMMENT ON COLUMN "Meeting"."recurrenceInterval" IS 'Tekrar aralığı (örn: her 2 haftada bir için 2)';
    END IF;

    -- recurrenceEndDate kolonu (ne zaman bitiyor)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Meeting' AND column_name = 'recurrenceEndDate'
    ) THEN
      ALTER TABLE "Meeting"
      ADD COLUMN "recurrenceEndDate" DATE;
      COMMENT ON COLUMN "Meeting"."recurrenceEndDate" IS 'Tekrar eden randevuların bitiş tarihi';
    END IF;

    -- recurrenceCount kolonu (kaç kez tekrarlanacak - endDate yerine)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Meeting' AND column_name = 'recurrenceCount'
    ) THEN
      ALTER TABLE "Meeting"
      ADD COLUMN "recurrenceCount" INTEGER;
      COMMENT ON COLUMN "Meeting"."recurrenceCount" IS 'Kaç kez tekrarlanacak (recurrenceEndDate yerine kullanılabilir)';
    END IF;

    -- recurrenceDaysOfWeek kolonu (haftalık tekrar için hangi günler - JSON array)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Meeting' AND column_name = 'recurrenceDaysOfWeek'
    ) THEN
      ALTER TABLE "Meeting"
      ADD COLUMN "recurrenceDaysOfWeek" JSONB;
      COMMENT ON COLUMN "Meeting"."recurrenceDaysOfWeek" IS 'Haftalık tekrar için hangi günler (0=Pazar, 1=Pazartesi, ...) - JSON array';
    END IF;
  ELSE
    -- Meeting tablosu yoksa uyarı ver (hata verme)
    RAISE NOTICE 'Meeting tablosu bulunamadı. Migration 016_create_meetings_table.sql önce çalıştırılmalı.';
  END IF;
END $$;

-- Index'ler ekle (sadece tablo varsa)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'Meeting'
  ) THEN
    -- isRecurring index
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_meeting_is_recurring'
    ) THEN
      CREATE INDEX idx_meeting_is_recurring 
        ON "Meeting"("isRecurring") 
        WHERE "isRecurring" = TRUE;
    END IF;

    -- parentMeetingId index
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_meeting_parent_meeting'
    ) THEN
      CREATE INDEX idx_meeting_parent_meeting 
        ON "Meeting"("parentMeetingId") 
        WHERE "parentMeetingId" IS NOT NULL;
    END IF;

    -- recurrenceEndDate index
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_meeting_recurrence_end_date'
    ) THEN
      CREATE INDEX idx_meeting_recurrence_end_date 
        ON "Meeting"("recurrenceEndDate") 
        WHERE "recurrenceEndDate" IS NOT NULL;
    END IF;
  END IF;
END $$;

-- ============================================
-- FUNCTION: Recurring meeting'leri oluştur
-- ============================================
CREATE OR REPLACE FUNCTION create_recurring_meetings()
RETURNS TRIGGER AS $$
DECLARE
  start_date DATE; -- current_date rezerve kelime, start_date kullanıyoruz
  end_date DATE;
  meeting_count INTEGER;
  interval_value INTEGER;
  recurrence_type VARCHAR(20);
  days_of_week JSONB;
  next_date TIMESTAMP WITH TIME ZONE;
  day_of_week INTEGER;
  i INTEGER;
BEGIN
  -- Sadece recurring meeting'ler için çalış
  IF NOT NEW."isRecurring" OR NEW."recurrenceType" IS NULL THEN
    RETURN NEW;
  END IF;

  -- Parent meeting ise (parentMeetingId NULL), recurring meeting'leri oluştur
  IF NEW."parentMeetingId" IS NULL THEN
    start_date := DATE(NEW."meetingDate"); -- current_date yerine start_date
    recurrence_type := NEW."recurrenceType";
    interval_value := COALESCE(NEW."recurrenceInterval", 1);
    days_of_week := NEW."recurrenceDaysOfWeek";
    
    -- End date veya count belirle
    IF NEW."recurrenceEndDate" IS NOT NULL THEN
      end_date := NEW."recurrenceEndDate";
    ELSIF NEW."recurrenceCount" IS NOT NULL THEN
      -- Count varsa, end date'i hesapla
      CASE recurrence_type
        WHEN 'DAILY' THEN
          end_date := start_date + (NEW."recurrenceCount" * interval_value || ' days')::INTERVAL;
        WHEN 'WEEKLY' THEN
          end_date := start_date + (NEW."recurrenceCount" * interval_value || ' weeks')::INTERVAL;
        WHEN 'MONTHLY' THEN
          end_date := start_date + (NEW."recurrenceCount" * interval_value || ' months')::INTERVAL;
        WHEN 'YEARLY' THEN
          end_date := start_date + (NEW."recurrenceCount" * interval_value || ' years')::INTERVAL;
      END CASE;
    ELSE
      -- End date veya count yoksa, 1 yıl sonrasına kadar oluştur
      end_date := start_date + INTERVAL '1 year';
    END IF;

    -- Recurring meeting'leri oluştur
    next_date := NEW."meetingDate";
    meeting_count := 0;
    
    WHILE DATE(next_date) <= end_date AND (NEW."recurrenceCount" IS NULL OR meeting_count < NEW."recurrenceCount") LOOP
      -- İlk meeting zaten oluşturuldu, sonrakileri oluştur
      IF meeting_count > 0 THEN
        INSERT INTO "Meeting" (
          title,
          description,
          "meetingDate",
          "meetingDuration",
          location,
          "meetingType",
          "meetingUrl",
          "meetingPassword",
          status,
          "companyId",
          "customerId",
          "dealId",
          "customerCompanyId",
          "contactId",
          "createdBy",
          "isRecurring",
          "parentMeetingId",
          "recurrenceType",
          "recurrenceInterval",
          "recurrenceEndDate",
          "recurrenceCount",
          "recurrenceDaysOfWeek",
          notes,
          outcomes,
          "actionItems",
          attendees
        )
        VALUES (
          NEW.title,
          NEW.description,
          next_date,
          NEW."meetingDuration",
          NEW.location,
          NEW."meetingType",
          NEW."meetingUrl",
          NEW."meetingPassword",
          'PLANNED', -- Recurring meeting'ler her zaman PLANNED olarak başlar
          NEW."companyId",
          NEW."customerId",
          NEW."dealId",
          NEW."customerCompanyId",
          NEW."contactId",
          NEW."createdBy",
          TRUE,
          NEW.id, -- Parent meeting ID
          NEW."recurrenceType",
          NEW."recurrenceInterval",
          NEW."recurrenceEndDate",
          NEW."recurrenceCount",
          NEW."recurrenceDaysOfWeek",
          NEW.notes,
          NEW.outcomes,
          NEW."actionItems",
          NEW.attendees
        );
      END IF;

      -- Sonraki tarihi hesapla
      CASE recurrence_type
        WHEN 'DAILY' THEN
          next_date := next_date + (interval_value || ' days')::INTERVAL;
        WHEN 'WEEKLY' THEN
          IF days_of_week IS NOT NULL AND jsonb_array_length(days_of_week) > 0 THEN
            -- Belirli günlerde tekrar et
            -- Basit implementasyon: Her hafta aynı gün
            next_date := next_date + INTERVAL '1 week';
          ELSE
            next_date := next_date + (interval_value || ' weeks')::INTERVAL;
          END IF;
        WHEN 'MONTHLY' THEN
          next_date := next_date + (interval_value || ' months')::INTERVAL;
        WHEN 'YEARLY' THEN
          next_date := next_date + (interval_value || ' years')::INTERVAL;
      END CASE;

      meeting_count := meeting_count + 1;
      
      -- Güvenlik: Sonsuz döngü önleme (max 1000 meeting)
      IF meeting_count >= 1000 THEN
        EXIT;
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Meeting oluşturulduğunda recurring meeting'leri oluştur (sadece tablo varsa)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'Meeting'
  ) THEN
    DROP TRIGGER IF EXISTS trigger_create_recurring_meetings ON "Meeting";
    CREATE TRIGGER trigger_create_recurring_meetings
      AFTER INSERT ON "Meeting"
      FOR EACH ROW
      WHEN (NEW."isRecurring" = TRUE AND NEW."parentMeetingId" IS NULL)
      EXECUTE FUNCTION create_recurring_meetings();
  END IF;
END $$;

-- ============================================
-- FUNCTION: Recurring meeting'i güncelle (tüm seriyi güncelle)
-- ============================================
CREATE OR REPLACE FUNCTION update_recurring_meeting_series()
RETURNS TRIGGER AS $$
BEGIN
  -- Parent meeting güncellendiğinde, tüm child meeting'leri güncelle
  IF NEW."parentMeetingId" IS NULL AND OLD."isRecurring" = TRUE THEN
    UPDATE "Meeting"
    SET
      title = NEW.title,
      description = NEW.description,
      "meetingDuration" = NEW."meetingDuration",
      location = NEW.location,
      "meetingType" = NEW."meetingType",
      "meetingUrl" = NEW."meetingUrl",
      "meetingPassword" = NEW."meetingPassword",
      "customerId" = NEW."customerId",
      "dealId" = NEW."dealId",
      "customerCompanyId" = NEW."customerCompanyId",
      "contactId" = NEW."contactId",
      notes = NEW.notes,
      outcomes = NEW.outcomes,
      "actionItems" = NEW."actionItems",
      attendees = NEW.attendees
    WHERE "parentMeetingId" = NEW.id
      AND status = 'PLANNED'; -- Sadece planlanmış meeting'leri güncelle
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Parent meeting güncellendiğinde child meeting'leri güncelle (sadece tablo varsa)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'Meeting'
  ) THEN
    DROP TRIGGER IF EXISTS trigger_update_recurring_meeting_series ON "Meeting";
    CREATE TRIGGER trigger_update_recurring_meeting_series
      AFTER UPDATE ON "Meeting"
      FOR EACH ROW
      WHEN (NEW."parentMeetingId" IS NULL AND OLD."isRecurring" = TRUE)
      EXECUTE FUNCTION update_recurring_meeting_series();
  END IF;
END $$;

-- ============================================
-- FUNCTION: Recurring meeting'i sil (tüm seriyi sil)
-- ============================================
CREATE OR REPLACE FUNCTION delete_recurring_meeting_series()
RETURNS TRIGGER AS $$
BEGIN
  -- Parent meeting silindiğinde, tüm child meeting'ler CASCADE ile silinir
  -- Bu fonksiyon sadece loglama için
  IF OLD."parentMeetingId" IS NULL AND OLD."isRecurring" = TRUE THEN
    -- Child meeting'ler CASCADE ile otomatik silinir
    RAISE NOTICE 'Recurring meeting series deleted: %', OLD.id;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Parent meeting silindiğinde loglama (sadece tablo varsa)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'Meeting'
  ) THEN
    DROP TRIGGER IF EXISTS trigger_delete_recurring_meeting_series ON "Meeting";
    CREATE TRIGGER trigger_delete_recurring_meeting_series
      BEFORE DELETE ON "Meeting"
      FOR EACH ROW
      WHEN (OLD."parentMeetingId" IS NULL AND OLD."isRecurring" = TRUE)
      EXECUTE FUNCTION delete_recurring_meeting_series();
  END IF;
END $$;

-- Yorumlar
COMMENT ON FUNCTION create_recurring_meetings IS 'Recurring meeting oluşturulduğunda tüm seriyi oluşturur';
COMMENT ON FUNCTION update_recurring_meeting_series IS 'Parent meeting güncellendiğinde tüm child meeting''leri günceller';
COMMENT ON FUNCTION delete_recurring_meeting_series IS 'Parent meeting silindiğinde loglama yapar (CASCADE ile child meeting''ler otomatik silinir)';


-- Migration: 116
-- Tarih: 2024
-- Amaç: Tekrar eden randevular (recurring meetings) özelliği
-- ============================================

-- Meeting tablosuna recurring kolonları ekle
DO $$ 
BEGIN
  -- Önce Meeting tablosunun var olup olmadığını kontrol et
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'Meeting'
  ) THEN
    -- isRecurring kolonu
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Meeting' AND column_name = 'isRecurring'
    ) THEN
      ALTER TABLE "Meeting"
      ADD COLUMN "isRecurring" BOOLEAN DEFAULT FALSE;
      COMMENT ON COLUMN "Meeting"."isRecurring" IS 'Tekrar eden randevu mu?';
    END IF;

    -- parentMeetingId kolonu (recurring serisinin parent meeting'i)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Meeting' AND column_name = 'parentMeetingId'
    ) THEN
      ALTER TABLE "Meeting"
      ADD COLUMN "parentMeetingId" UUID REFERENCES "Meeting"(id) ON DELETE CASCADE;
      COMMENT ON COLUMN "Meeting"."parentMeetingId" IS 'Recurring serisinin parent meeting ID''si (ilk meeting)';
    END IF;

    -- recurrenceType kolonu (DAILY, WEEKLY, MONTHLY, YEARLY)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Meeting' AND column_name = 'recurrenceType'
    ) THEN
      ALTER TABLE "Meeting"
      ADD COLUMN "recurrenceType" VARCHAR(20);
      COMMENT ON COLUMN "Meeting"."recurrenceType" IS 'Tekrar tipi: DAILY, WEEKLY, MONTHLY, YEARLY';
    END IF;

    -- recurrenceInterval kolonu (her kaç günde/haftada/ayda bir)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Meeting' AND column_name = 'recurrenceInterval'
    ) THEN
      ALTER TABLE "Meeting"
      ADD COLUMN "recurrenceInterval" INTEGER DEFAULT 1;
      COMMENT ON COLUMN "Meeting"."recurrenceInterval" IS 'Tekrar aralığı (örn: her 2 haftada bir için 2)';
    END IF;

    -- recurrenceEndDate kolonu (ne zaman bitiyor)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Meeting' AND column_name = 'recurrenceEndDate'
    ) THEN
      ALTER TABLE "Meeting"
      ADD COLUMN "recurrenceEndDate" DATE;
      COMMENT ON COLUMN "Meeting"."recurrenceEndDate" IS 'Tekrar eden randevuların bitiş tarihi';
    END IF;

    -- recurrenceCount kolonu (kaç kez tekrarlanacak - endDate yerine)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Meeting' AND column_name = 'recurrenceCount'
    ) THEN
      ALTER TABLE "Meeting"
      ADD COLUMN "recurrenceCount" INTEGER;
      COMMENT ON COLUMN "Meeting"."recurrenceCount" IS 'Kaç kez tekrarlanacak (recurrenceEndDate yerine kullanılabilir)';
    END IF;

    -- recurrenceDaysOfWeek kolonu (haftalık tekrar için hangi günler - JSON array)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Meeting' AND column_name = 'recurrenceDaysOfWeek'
    ) THEN
      ALTER TABLE "Meeting"
      ADD COLUMN "recurrenceDaysOfWeek" JSONB;
      COMMENT ON COLUMN "Meeting"."recurrenceDaysOfWeek" IS 'Haftalık tekrar için hangi günler (0=Pazar, 1=Pazartesi, ...) - JSON array';
    END IF;
  ELSE
    -- Meeting tablosu yoksa uyarı ver (hata verme)
    RAISE NOTICE 'Meeting tablosu bulunamadı. Migration 016_create_meetings_table.sql önce çalıştırılmalı.';
  END IF;
END $$;

-- Index'ler ekle (sadece tablo varsa)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'Meeting'
  ) THEN
    -- isRecurring index
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_meeting_is_recurring'
    ) THEN
      CREATE INDEX idx_meeting_is_recurring 
        ON "Meeting"("isRecurring") 
        WHERE "isRecurring" = TRUE;
    END IF;

    -- parentMeetingId index
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_meeting_parent_meeting'
    ) THEN
      CREATE INDEX idx_meeting_parent_meeting 
        ON "Meeting"("parentMeetingId") 
        WHERE "parentMeetingId" IS NOT NULL;
    END IF;

    -- recurrenceEndDate index
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_meeting_recurrence_end_date'
    ) THEN
      CREATE INDEX idx_meeting_recurrence_end_date 
        ON "Meeting"("recurrenceEndDate") 
        WHERE "recurrenceEndDate" IS NOT NULL;
    END IF;
  END IF;
END $$;

-- ============================================
-- FUNCTION: Recurring meeting'leri oluştur
-- ============================================
CREATE OR REPLACE FUNCTION create_recurring_meetings()
RETURNS TRIGGER AS $$
DECLARE
  start_date DATE; -- current_date rezerve kelime, start_date kullanıyoruz
  end_date DATE;
  meeting_count INTEGER;
  interval_value INTEGER;
  recurrence_type VARCHAR(20);
  days_of_week JSONB;
  next_date TIMESTAMP WITH TIME ZONE;
  day_of_week INTEGER;
  i INTEGER;
BEGIN
  -- Sadece recurring meeting'ler için çalış
  IF NOT NEW."isRecurring" OR NEW."recurrenceType" IS NULL THEN
    RETURN NEW;
  END IF;

  -- Parent meeting ise (parentMeetingId NULL), recurring meeting'leri oluştur
  IF NEW."parentMeetingId" IS NULL THEN
    start_date := DATE(NEW."meetingDate"); -- current_date yerine start_date
    recurrence_type := NEW."recurrenceType";
    interval_value := COALESCE(NEW."recurrenceInterval", 1);
    days_of_week := NEW."recurrenceDaysOfWeek";
    
    -- End date veya count belirle
    IF NEW."recurrenceEndDate" IS NOT NULL THEN
      end_date := NEW."recurrenceEndDate";
    ELSIF NEW."recurrenceCount" IS NOT NULL THEN
      -- Count varsa, end date'i hesapla
      CASE recurrence_type
        WHEN 'DAILY' THEN
          end_date := start_date + (NEW."recurrenceCount" * interval_value || ' days')::INTERVAL;
        WHEN 'WEEKLY' THEN
          end_date := start_date + (NEW."recurrenceCount" * interval_value || ' weeks')::INTERVAL;
        WHEN 'MONTHLY' THEN
          end_date := start_date + (NEW."recurrenceCount" * interval_value || ' months')::INTERVAL;
        WHEN 'YEARLY' THEN
          end_date := start_date + (NEW."recurrenceCount" * interval_value || ' years')::INTERVAL;
      END CASE;
    ELSE
      -- End date veya count yoksa, 1 yıl sonrasına kadar oluştur
      end_date := start_date + INTERVAL '1 year';
    END IF;

    -- Recurring meeting'leri oluştur
    next_date := NEW."meetingDate";
    meeting_count := 0;
    
    WHILE DATE(next_date) <= end_date AND (NEW."recurrenceCount" IS NULL OR meeting_count < NEW."recurrenceCount") LOOP
      -- İlk meeting zaten oluşturuldu, sonrakileri oluştur
      IF meeting_count > 0 THEN
        INSERT INTO "Meeting" (
          title,
          description,
          "meetingDate",
          "meetingDuration",
          location,
          "meetingType",
          "meetingUrl",
          "meetingPassword",
          status,
          "companyId",
          "customerId",
          "dealId",
          "customerCompanyId",
          "contactId",
          "createdBy",
          "isRecurring",
          "parentMeetingId",
          "recurrenceType",
          "recurrenceInterval",
          "recurrenceEndDate",
          "recurrenceCount",
          "recurrenceDaysOfWeek",
          notes,
          outcomes,
          "actionItems",
          attendees
        )
        VALUES (
          NEW.title,
          NEW.description,
          next_date,
          NEW."meetingDuration",
          NEW.location,
          NEW."meetingType",
          NEW."meetingUrl",
          NEW."meetingPassword",
          'PLANNED', -- Recurring meeting'ler her zaman PLANNED olarak başlar
          NEW."companyId",
          NEW."customerId",
          NEW."dealId",
          NEW."customerCompanyId",
          NEW."contactId",
          NEW."createdBy",
          TRUE,
          NEW.id, -- Parent meeting ID
          NEW."recurrenceType",
          NEW."recurrenceInterval",
          NEW."recurrenceEndDate",
          NEW."recurrenceCount",
          NEW."recurrenceDaysOfWeek",
          NEW.notes,
          NEW.outcomes,
          NEW."actionItems",
          NEW.attendees
        );
      END IF;

      -- Sonraki tarihi hesapla
      CASE recurrence_type
        WHEN 'DAILY' THEN
          next_date := next_date + (interval_value || ' days')::INTERVAL;
        WHEN 'WEEKLY' THEN
          IF days_of_week IS NOT NULL AND jsonb_array_length(days_of_week) > 0 THEN
            -- Belirli günlerde tekrar et
            -- Basit implementasyon: Her hafta aynı gün
            next_date := next_date + INTERVAL '1 week';
          ELSE
            next_date := next_date + (interval_value || ' weeks')::INTERVAL;
          END IF;
        WHEN 'MONTHLY' THEN
          next_date := next_date + (interval_value || ' months')::INTERVAL;
        WHEN 'YEARLY' THEN
          next_date := next_date + (interval_value || ' years')::INTERVAL;
      END CASE;

      meeting_count := meeting_count + 1;
      
      -- Güvenlik: Sonsuz döngü önleme (max 1000 meeting)
      IF meeting_count >= 1000 THEN
        EXIT;
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Meeting oluşturulduğunda recurring meeting'leri oluştur (sadece tablo varsa)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'Meeting'
  ) THEN
    DROP TRIGGER IF EXISTS trigger_create_recurring_meetings ON "Meeting";
    CREATE TRIGGER trigger_create_recurring_meetings
      AFTER INSERT ON "Meeting"
      FOR EACH ROW
      WHEN (NEW."isRecurring" = TRUE AND NEW."parentMeetingId" IS NULL)
      EXECUTE FUNCTION create_recurring_meetings();
  END IF;
END $$;

-- ============================================
-- FUNCTION: Recurring meeting'i güncelle (tüm seriyi güncelle)
-- ============================================
CREATE OR REPLACE FUNCTION update_recurring_meeting_series()
RETURNS TRIGGER AS $$
BEGIN
  -- Parent meeting güncellendiğinde, tüm child meeting'leri güncelle
  IF NEW."parentMeetingId" IS NULL AND OLD."isRecurring" = TRUE THEN
    UPDATE "Meeting"
    SET
      title = NEW.title,
      description = NEW.description,
      "meetingDuration" = NEW."meetingDuration",
      location = NEW.location,
      "meetingType" = NEW."meetingType",
      "meetingUrl" = NEW."meetingUrl",
      "meetingPassword" = NEW."meetingPassword",
      "customerId" = NEW."customerId",
      "dealId" = NEW."dealId",
      "customerCompanyId" = NEW."customerCompanyId",
      "contactId" = NEW."contactId",
      notes = NEW.notes,
      outcomes = NEW.outcomes,
      "actionItems" = NEW."actionItems",
      attendees = NEW.attendees
    WHERE "parentMeetingId" = NEW.id
      AND status = 'PLANNED'; -- Sadece planlanmış meeting'leri güncelle
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Parent meeting güncellendiğinde child meeting'leri güncelle (sadece tablo varsa)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'Meeting'
  ) THEN
    DROP TRIGGER IF EXISTS trigger_update_recurring_meeting_series ON "Meeting";
    CREATE TRIGGER trigger_update_recurring_meeting_series
      AFTER UPDATE ON "Meeting"
      FOR EACH ROW
      WHEN (NEW."parentMeetingId" IS NULL AND OLD."isRecurring" = TRUE)
      EXECUTE FUNCTION update_recurring_meeting_series();
  END IF;
END $$;

-- ============================================
-- FUNCTION: Recurring meeting'i sil (tüm seriyi sil)
-- ============================================
CREATE OR REPLACE FUNCTION delete_recurring_meeting_series()
RETURNS TRIGGER AS $$
BEGIN
  -- Parent meeting silindiğinde, tüm child meeting'ler CASCADE ile silinir
  -- Bu fonksiyon sadece loglama için
  IF OLD."parentMeetingId" IS NULL AND OLD."isRecurring" = TRUE THEN
    -- Child meeting'ler CASCADE ile otomatik silinir
    RAISE NOTICE 'Recurring meeting series deleted: %', OLD.id;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Parent meeting silindiğinde loglama (sadece tablo varsa)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'Meeting'
  ) THEN
    DROP TRIGGER IF EXISTS trigger_delete_recurring_meeting_series ON "Meeting";
    CREATE TRIGGER trigger_delete_recurring_meeting_series
      BEFORE DELETE ON "Meeting"
      FOR EACH ROW
      WHEN (OLD."parentMeetingId" IS NULL AND OLD."isRecurring" = TRUE)
      EXECUTE FUNCTION delete_recurring_meeting_series();
  END IF;
END $$;

-- Yorumlar
COMMENT ON FUNCTION create_recurring_meetings IS 'Recurring meeting oluşturulduğunda tüm seriyi oluşturur';
COMMENT ON FUNCTION update_recurring_meeting_series IS 'Parent meeting güncellendiğinde tüm child meeting''leri günceller';
COMMENT ON FUNCTION delete_recurring_meeting_series IS 'Parent meeting silindiğinde loglama yapar (CASCADE ile child meeting''ler otomatik silinir)';

