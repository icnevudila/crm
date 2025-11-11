-- CRM V3 - Kullanıcı Atama Sistemi
-- Tüm modüllere kullanıcı atama (assignedTo) kolonu ekleme
-- Çoklu kullanıcı atama için MeetingParticipant tablosu
-- Atanan kullanıcıya bildirim gönderme sistemi

-- ============================================
-- 1. MEETING PARTICIPANT TABLOSU - Çoklu kullanıcı atama
-- ============================================
CREATE TABLE IF NOT EXISTS "MeetingParticipant" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "meetingId" UUID NOT NULL REFERENCES "Meeting"(id) ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'PARTICIPANT', -- PARTICIPANT, ORGANIZER, ATTENDEE
  status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, ACCEPTED, DECLINED
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("meetingId", "userId") -- Aynı kullanıcı aynı görüşmeye birden fazla eklenemez
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_meeting_participant_meeting ON "MeetingParticipant"("meetingId");
CREATE INDEX IF NOT EXISTS idx_meeting_participant_user ON "MeetingParticipant"("userId");
CREATE INDEX IF NOT EXISTS idx_meeting_participant_company ON "MeetingParticipant"("companyId");

-- RLS Policy
ALTER TABLE "MeetingParticipant" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "meeting_participant_company_isolation" ON "MeetingParticipant";
CREATE POLICY "meeting_participant_company_isolation" ON "MeetingParticipant"
  FOR ALL
  USING (
    "companyId" IN (
      SELECT id FROM "Company" WHERE id = "companyId"
    )
    OR
    EXISTS (
      SELECT 1 FROM "User" 
      WHERE "User".id = auth.uid() 
      AND ("User".role = 'SUPER_ADMIN' OR "User"."companyId" = "MeetingParticipant"."companyId")
    )
  );

-- ============================================
-- 2. MEETING TABLOSU - assignedTo ekle (tek kullanıcı için - geriye dönük uyumluluk)
-- ============================================
ALTER TABLE "Meeting" 
ADD COLUMN IF NOT EXISTS "assignedTo" UUID REFERENCES "User"(id) ON DELETE SET NULL;

-- Index
CREATE INDEX IF NOT EXISTS idx_meeting_assigned_to ON "Meeting"("assignedTo");

-- ============================================
-- 3. TICKET TABLOSU - assignedTo ekle
-- ============================================
ALTER TABLE "Ticket" 
ADD COLUMN IF NOT EXISTS "assignedTo" UUID REFERENCES "User"(id) ON DELETE SET NULL;

-- Index
CREATE INDEX IF NOT EXISTS idx_ticket_assigned_to ON "Ticket"("assignedTo");

-- ============================================
-- 4. QUOTE TABLOSU - assignedTo ekle
-- ============================================
ALTER TABLE "Quote" 
ADD COLUMN IF NOT EXISTS "assignedTo" UUID REFERENCES "User"(id) ON DELETE SET NULL;

-- Index
CREATE INDEX IF NOT EXISTS idx_quote_assigned_to ON "Quote"("assignedTo");

-- ============================================
-- 5. INVOICE TABLOSU - assignedTo ekle
-- ============================================
ALTER TABLE "Invoice" 
ADD COLUMN IF NOT EXISTS "assignedTo" UUID REFERENCES "User"(id) ON DELETE SET NULL;

-- Index
CREATE INDEX IF NOT EXISTS idx_invoice_assigned_to ON "Invoice"("assignedTo");

-- ============================================
-- 6. DEAL TABLOSU - assignedTo ekle
-- ============================================
ALTER TABLE "Deal" 
ADD COLUMN IF NOT EXISTS "assignedTo" UUID REFERENCES "User"(id) ON DELETE SET NULL;

-- Index
CREATE INDEX IF NOT EXISTS idx_deal_assigned_to ON "Deal"("assignedTo");

-- ============================================
-- 7. SHIPMENT TABLOSU - assignedTo ekle
-- ============================================
ALTER TABLE "Shipment" 
ADD COLUMN IF NOT EXISTS "assignedTo" UUID REFERENCES "User"(id) ON DELETE SET NULL;

-- Index
CREATE INDEX IF NOT EXISTS idx_shipment_assigned_to ON "Shipment"("assignedTo");

-- ============================================
-- 7. TRIGGER: MeetingParticipant eklendiğinde kullanıcıya bildirim
-- ============================================
CREATE OR REPLACE FUNCTION notify_meeting_participant()
RETURNS TRIGGER AS $$
DECLARE
  meeting_title TEXT;
  meeting_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Görüşme bilgilerini al
  SELECT title, "meetingDate" INTO meeting_title, meeting_date
  FROM "Meeting"
  WHERE id = NEW."meetingId";
  
  -- Meeting bulunamazsa veya title NULL ise varsayılan mesaj kullan
  IF meeting_title IS NULL THEN
    meeting_title := 'Görüşme';
  END IF;
  
  -- Participant'a bildirim gönder
  INSERT INTO "Notification" ("userId", "companyId", title, message, type, "relatedTo", "relatedId", link)
  VALUES (
    NEW."userId",
    NEW."companyId",
    'Yeni Görüşme Daveti',
    meeting_title || ' görüşmesine davet edildiniz. Detayları görmek ister misiniz?',
    'info',
    'Meeting',
    NEW."meetingId",
    '/tr/meetings/' || NEW."meetingId"
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_meeting_participant_notify ON "MeetingParticipant";
CREATE TRIGGER trigger_meeting_participant_notify
  AFTER INSERT ON "MeetingParticipant"
  FOR EACH ROW
  EXECUTE FUNCTION notify_meeting_participant();

-- ============================================
-- 8. TRIGGER: Meeting oluşturulduğunda atanan kullanıcıya bildirim (tek kullanıcı için - geriye dönük uyumluluk)
-- ============================================
CREATE OR REPLACE FUNCTION notify_meeting_assigned()
RETURNS TRIGGER AS $$
BEGIN
  -- Görüşme oluşturulduğunda veya assignedTo değiştiğinde atanan kullanıcıya bildirim gönder
  IF NEW."assignedTo" IS NOT NULL AND (OLD."assignedTo" IS NULL OR OLD."assignedTo" != NEW."assignedTo") THEN
    INSERT INTO "Notification" ("userId", "companyId", title, message, type, "relatedTo", "relatedId", link)
    VALUES (
      NEW."assignedTo",
      NEW."companyId",
      'Yeni Görüşme Atandı',
      NEW.title || ' görüşmesi size atandı. Detayları görmek ister misiniz?',
      'info',
      'Meeting',
      NEW.id,
      '/tr/meetings/' || NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_meeting_assigned_notify ON "Meeting";
CREATE TRIGGER trigger_meeting_assigned_notify
  AFTER INSERT OR UPDATE ON "Meeting"
  FOR EACH ROW
  WHEN (NEW."assignedTo" IS NOT NULL AND (OLD."assignedTo" IS NULL OR OLD."assignedTo" != NEW."assignedTo"))
  EXECUTE FUNCTION notify_meeting_assigned();

-- ============================================
-- 9. TRIGGER: Ticket oluşturulduğunda atanan kullanıcıya bildirim
-- ============================================
CREATE OR REPLACE FUNCTION notify_ticket_assigned()
RETURNS TRIGGER AS $$
BEGIN
  -- Destek talebi oluşturulduğunda veya assignedTo değiştiğinde atanan kullanıcıya bildirim gönder
  IF NEW."assignedTo" IS NOT NULL AND (OLD."assignedTo" IS NULL OR OLD."assignedTo" != NEW."assignedTo") THEN
    INSERT INTO "Notification" ("userId", "companyId", title, message, type, "relatedTo", "relatedId", link)
    VALUES (
      NEW."assignedTo",
      NEW."companyId",
      'Yeni Destek Talebi Atandı',
      NEW.subject || ' destek talebi size atandı. Detayları görmek ister misiniz?',
      'info',
      'Ticket',
      NEW.id,
      '/tr/tickets/' || NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ticket_assigned_notify ON "Ticket";
CREATE TRIGGER trigger_ticket_assigned_notify
  AFTER INSERT OR UPDATE ON "Ticket"
  FOR EACH ROW
  WHEN (NEW."assignedTo" IS NOT NULL AND (OLD."assignedTo" IS NULL OR OLD."assignedTo" != NEW."assignedTo"))
  EXECUTE FUNCTION notify_ticket_assigned();

-- ============================================
-- 10. TRIGGER: Quote oluşturulduğunda atanan kullanıcıya bildirim
-- ============================================
CREATE OR REPLACE FUNCTION notify_quote_assigned()
RETURNS TRIGGER AS $$
BEGIN
  -- Teklif oluşturulduğunda veya assignedTo değiştiğinde atanan kullanıcıya bildirim gönder
  IF NEW."assignedTo" IS NOT NULL AND (OLD."assignedTo" IS NULL OR OLD."assignedTo" != NEW."assignedTo") THEN
    INSERT INTO "Notification" ("userId", "companyId", title, message, type, "relatedTo", "relatedId", link)
    VALUES (
      NEW."assignedTo",
      NEW."companyId",
      'Yeni Teklif Atandı',
      NEW.title || ' teklifi size atandı. Detayları görmek ister misiniz?',
      'info',
      'Quote',
      NEW.id,
      '/tr/quotes/' || NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_quote_assigned_notify ON "Quote";
CREATE TRIGGER trigger_quote_assigned_notify
  AFTER INSERT OR UPDATE ON "Quote"
  FOR EACH ROW
  WHEN (NEW."assignedTo" IS NOT NULL AND (OLD."assignedTo" IS NULL OR OLD."assignedTo" != NEW."assignedTo"))
  EXECUTE FUNCTION notify_quote_assigned();

-- ============================================
-- 11. TRIGGER: Invoice oluşturulduğunda atanan kullanıcıya bildirim
-- ============================================
CREATE OR REPLACE FUNCTION notify_invoice_assigned()
RETURNS TRIGGER AS $$
BEGIN
  -- Fatura oluşturulduğunda veya assignedTo değiştiğinde atanan kullanıcıya bildirim gönder
  IF NEW."assignedTo" IS NOT NULL AND (OLD."assignedTo" IS NULL OR OLD."assignedTo" != NEW."assignedTo") THEN
    INSERT INTO "Notification" ("userId", "companyId", title, message, type, "relatedTo", "relatedId", link)
    VALUES (
      NEW."assignedTo",
      NEW."companyId",
      'Yeni Fatura Atandı',
      NEW.title || ' faturası size atandı. Detayları görmek ister misiniz?',
      'info',
      'Invoice',
      NEW.id,
      '/tr/invoices/' || NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_invoice_assigned_notify ON "Invoice";
CREATE TRIGGER trigger_invoice_assigned_notify
  AFTER INSERT OR UPDATE ON "Invoice"
  FOR EACH ROW
  WHEN (NEW."assignedTo" IS NOT NULL AND (OLD."assignedTo" IS NULL OR OLD."assignedTo" != NEW."assignedTo"))
  EXECUTE FUNCTION notify_invoice_assigned();

-- ============================================
-- 12. TRIGGER: Deal oluşturulduğunda atanan kullanıcıya bildirim
-- ============================================
CREATE OR REPLACE FUNCTION notify_deal_assigned()
RETURNS TRIGGER AS $$
BEGIN
  -- Fırsat oluşturulduğunda veya assignedTo değiştiğinde atanan kullanıcıya bildirim gönder
  IF NEW."assignedTo" IS NOT NULL AND (OLD."assignedTo" IS NULL OR OLD."assignedTo" != NEW."assignedTo") THEN
    INSERT INTO "Notification" ("userId", "companyId", title, message, type, "relatedTo", "relatedId", link)
    VALUES (
      NEW."assignedTo",
      NEW."companyId",
      'Yeni Fırsat Atandı',
      NEW.title || ' fırsatı size atandı. Detayları görmek ister misiniz?',
      'info',
      'Deal',
      NEW.id,
      '/tr/deals/' || NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_deal_assigned_notify ON "Deal";
CREATE TRIGGER trigger_deal_assigned_notify
  AFTER INSERT OR UPDATE ON "Deal"
  FOR EACH ROW
  WHEN (NEW."assignedTo" IS NOT NULL AND (OLD."assignedTo" IS NULL OR OLD."assignedTo" != NEW."assignedTo"))
  EXECUTE FUNCTION notify_deal_assigned();

-- ============================================
-- 13. TRIGGER: Shipment oluşturulduğunda atanan kullanıcıya bildirim
-- ============================================
CREATE OR REPLACE FUNCTION notify_shipment_assigned()
RETURNS TRIGGER AS $$
BEGIN
  -- Sevkiyat oluşturulduğunda veya assignedTo değiştiğinde atanan kullanıcıya bildirim gönder
  IF NEW."assignedTo" IS NOT NULL AND (OLD."assignedTo" IS NULL OR OLD."assignedTo" != NEW."assignedTo") THEN
    INSERT INTO "Notification" ("userId", "companyId", title, message, type, "relatedTo", "relatedId", link)
    VALUES (
      NEW."assignedTo",
      NEW."companyId",
      'Yeni Sevkiyat Atandı',
      'Sevkiyat size atandı. Detayları görmek ister misiniz?',
      'info',
      'Shipment',
      NEW.id,
      '/tr/shipments/' || NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_shipment_assigned_notify ON "Shipment";
CREATE TRIGGER trigger_shipment_assigned_notify
  AFTER INSERT OR UPDATE ON "Shipment"
  FOR EACH ROW
  WHEN (NEW."assignedTo" IS NOT NULL AND (OLD."assignedTo" IS NULL OR OLD."assignedTo" != NEW."assignedTo"))
  EXECUTE FUNCTION notify_shipment_assigned();

-- ============================================
-- 14. COMMENT'LER
-- ============================================
COMMENT ON TABLE "MeetingParticipant" IS 'Görüşme katılımcıları - çoklu kullanıcı atama sistemi';
COMMENT ON COLUMN "MeetingParticipant"."meetingId" IS 'Görüşme ID';
COMMENT ON COLUMN "MeetingParticipant"."userId" IS 'Katılımcı kullanıcı ID';
COMMENT ON COLUMN "MeetingParticipant".role IS 'Katılımcı rolü: PARTICIPANT, ORGANIZER, ATTENDEE';
COMMENT ON COLUMN "MeetingParticipant".status IS 'Davet durumu: PENDING, ACCEPTED, DECLINED';
COMMENT ON COLUMN "Meeting"."assignedTo" IS 'Görüşmeyi yapacak kullanıcı (tek kullanıcı - geriye dönük uyumluluk)';
COMMENT ON COLUMN "Ticket"."assignedTo" IS 'Destek talebini çözecek kullanıcı';
COMMENT ON COLUMN "Quote"."assignedTo" IS 'Teklifi takip edecek kullanıcı';
COMMENT ON COLUMN "Invoice"."assignedTo" IS 'Faturayı takip edecek kullanıcı';
COMMENT ON COLUMN "Deal"."assignedTo" IS 'Fırsatı takip edecek kullanıcı';
COMMENT ON COLUMN "Shipment"."assignedTo" IS 'Sevkiyatı takip edecek kullanıcı';

-- ============================================
-- MIGRATION TAMAMLANDI
-- ============================================

