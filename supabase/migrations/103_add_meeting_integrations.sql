-- ============================================
-- CRM V3 - Meeting Integrations
-- Migration: 103
-- Tarih: 2024
-- Amaç: Meeting tablosuna Zoom/Meet linkleri ve Google Calendar entegrasyonu ekleme
-- ============================================

-- ============================================
-- 1. MEETING TABLOSUNA YENİ KOLONLAR
-- ============================================

-- Meeting URL (Zoom, Meet, Teams, Other)
ALTER TABLE "Meeting"
ADD COLUMN IF NOT EXISTS "meetingUrl" TEXT;

-- Meeting Type (IN_PERSON, ZOOM, GOOGLE_MEET, TEAMS, OTHER)
ALTER TABLE "Meeting"
ADD COLUMN IF NOT EXISTS "meetingType" VARCHAR(20) DEFAULT 'IN_PERSON';

-- Google Calendar Event ID (senkronizasyon için)
ALTER TABLE "Meeting"
ADD COLUMN IF NOT EXISTS "googleCalendarEventId" TEXT;

-- Google Calendar Sync Status (SYNCED, PENDING, FAILED)
ALTER TABLE "Meeting"
ADD COLUMN IF NOT EXISTS "googleCalendarSyncStatus" VARCHAR(20);

-- Meeting Password (Zoom/Meet şifreleri için)
ALTER TABLE "Meeting"
ADD COLUMN IF NOT EXISTS "meetingPassword" VARCHAR(100);

-- ============================================
-- 2. CHECK CONSTRAINT (MEETING TYPE)
-- ============================================

ALTER TABLE "Meeting"
DROP CONSTRAINT IF EXISTS check_meeting_type;

ALTER TABLE "Meeting"
ADD CONSTRAINT check_meeting_type
CHECK ("meetingType" IN ('IN_PERSON', 'ZOOM', 'GOOGLE_MEET', 'TEAMS', 'OTHER'));

-- ============================================
-- 3. CHECK CONSTRAINT (GOOGLE CALENDAR SYNC STATUS)
-- ============================================

ALTER TABLE "Meeting"
DROP CONSTRAINT IF EXISTS check_google_calendar_sync_status;

ALTER TABLE "Meeting"
ADD CONSTRAINT check_google_calendar_sync_status
CHECK ("googleCalendarSyncStatus" IN ('SYNCED', 'PENDING', 'FAILED') OR "googleCalendarSyncStatus" IS NULL);

-- ============================================
-- 4. INDEX'LER (PERFORMANS İÇİN)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_meeting_meeting_type ON "Meeting"("meetingType");
CREATE INDEX IF NOT EXISTS idx_meeting_google_calendar_event_id ON "Meeting"("googleCalendarEventId");
CREATE INDEX IF NOT EXISTS idx_meeting_google_calendar_sync_status ON "Meeting"("googleCalendarSyncStatus");

-- ============================================
-- 5. COMMENT'LER
-- ============================================

COMMENT ON COLUMN "Meeting"."meetingUrl" IS 'Toplantı URL''si (Zoom, Meet, Teams, vb.)';
COMMENT ON COLUMN "Meeting"."meetingType" IS 'Toplantı tipi (IN_PERSON, ZOOM, GOOGLE_MEET, TEAMS, OTHER)';
COMMENT ON COLUMN "Meeting"."googleCalendarEventId" IS 'Google Calendar event ID (senkronizasyon için)';
COMMENT ON COLUMN "Meeting"."googleCalendarSyncStatus" IS 'Google Calendar senkronizasyon durumu (SYNCED, PENDING, FAILED)';
COMMENT ON COLUMN "Meeting"."meetingPassword" IS 'Toplantı şifresi (Zoom/Meet için)';

-- ============================================
-- MIGRATION TAMAMLANDI
-- ============================================



