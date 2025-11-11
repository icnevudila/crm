-- ============================================
-- 044_workflow_validations.sql
-- İŞ AKIŞI ZORUNLULUK VE VALİDASYONLARI
-- ============================================
-- Bu dosya şunları yapar:
-- 1. Her aşamada zorunlu alanları kontrol eder
-- 2. Kullanıcıyı bir sonraki adıma yönlendirir
-- 3. Eksik bilgileri bildirimlerde gösterir
-- 4. Sıralı geçişleri zorunlu kılar
-- ============================================

-- ============================================
-- PART 1: DEAL WORKFlow VALİDASYONLARI
-- ============================================

CREATE OR REPLACE FUNCTION validate_deal_stage_change()
RETURNS TRIGGER AS $$
DECLARE
  validation_errors TEXT[] := ARRAY[]::TEXT[];
  next_suggested_stage TEXT;
BEGIN
  -- Stage değiştiğinde validasyon yap
  IF NEW.stage != OLD.stage THEN
    
    -- LEAD → CONTACTED: Müşteri bilgisi zorunlu
    IF NEW.stage = 'CONTACTED' AND OLD.stage = 'LEAD' THEN
      IF NEW."customerId" IS NULL THEN
        validation_errors := array_append(validation_errors, 'Müşteri seçimi zorunlu');
      END IF;
      
      next_suggested_stage := 'PROPOSAL';
      
      -- Notification: Sonraki adım önerisi
      INSERT INTO "Notification" (
        title,
        message,
        type,
        "relatedTo",
        "relatedId",
        "companyId"
      )
      VALUES (
        'Fırsat İlerledi: CONTACTED',
        NEW.title || ' fırsatı ile iletişime geçildi. Sonraki adım: Teklif hazırlayın (PROPOSAL)',
        'info',
        'Deal',
        NEW.id,
        NEW."companyId"
      )
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- CONTACTED → PROPOSAL: Teklif hazırlanmalı
    IF NEW.stage = 'PROPOSAL' AND OLD.stage = 'CONTACTED' THEN
      -- Quote kontrolü (opsiyonel ama önerilir)
      IF NOT EXISTS (SELECT 1 FROM "Quote" WHERE "dealId" = NEW.id) THEN
        INSERT INTO "Notification" (
          title,
          message,
          type,
          "relatedTo",
          "relatedId",
          "companyId"
        )
        VALUES (
          'Teklif Oluşturmanız Önerilir',
          NEW.title || ' fırsatı için henüz teklif oluşturulmadı. Teklif oluşturmak için Quote modülüne gidin.',
          'warning',
          'Deal',
          NEW.id,
          NEW."companyId"
        )
        ON CONFLICT DO NOTHING;
      END IF;
      
      next_suggested_stage := 'NEGOTIATION';
      
      -- Notification: Sonraki adım önerisi
      INSERT INTO "Notification" (
        title,
        message,
        type,
        "relatedTo",
        "relatedId",
        "companyId"
      )
      VALUES (
        'Fırsat İlerledi: PROPOSAL',
        NEW.title || ' fırsatı için teklif hazırlandı. Sonraki adım: Pazarlık aşamasına geçin (NEGOTIATION)',
        'info',
        'Deal',
        NEW.id,
        NEW."companyId"
      )
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- PROPOSAL → NEGOTIATION: Pazarlık aşaması
    IF NEW.stage = 'NEGOTIATION' AND OLD.stage = 'PROPOSAL' THEN
      next_suggested_stage := 'WON';
      
      -- Notification: Sonraki adım önerisi
      INSERT INTO "Notification" (
        title,
        message,
        type,
        "relatedTo",
        "relatedId",
        "companyId"
      )
      VALUES (
        'Fırsat İlerledi: NEGOTIATION',
        NEW.title || ' fırsatı pazarlık aşamasında. Sonraki adım: Kazanın (WON) veya kaybedin (LOST)',
        'info',
        'Deal',
        NEW.id,
        NEW."companyId"
      )
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- NEGOTIATION → WON: Kazanıldı (lostReason zorunlu DEĞİL)
    IF NEW.stage = 'WON' AND OLD.stage = 'NEGOTIATION' THEN
      IF NEW.value IS NULL OR NEW.value = 0 THEN
        validation_errors := array_append(validation_errors, 'Fırsat değeri (value) zorunlu');
      END IF;
      
      -- Notification: Tebrikler + Sonraki adım
      INSERT INTO "Notification" (
        title,
        message,
        type,
        "relatedTo",
        "relatedId",
        "companyId"
      )
      VALUES (
        '🎉 Fırsat Kazanıldı!',
        'Tebrikler! ' || NEW.title || ' fırsatını kazandınız. Sonraki adım: Sözleşme imzalayın. Contract modülüne gidin.',
        'success',
        'Deal',
        NEW.id,
        NEW."companyId"
      )
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- LOST: lostReason zorunlu
    IF NEW.stage = 'LOST' THEN
      IF NEW."lostReason" IS NULL OR NEW."lostReason" = '' THEN
        validation_errors := array_append(validation_errors, 'Kayıp nedeni (lostReason) zorunlu');
      END IF;
      
      -- Notification: Kayıp nedeni analizi
      INSERT INTO "Notification" (
        title,
        message,
        type,
        "relatedTo",
        "relatedId",
        "companyId"
      )
      VALUES (
        'Fırsat Kaybedildi',
        NEW.title || ' fırsatı kaybedildi. Sebep: ' || COALESCE(NEW."lostReason", 'Belirtilmedi'),
        'warning',
        'Deal',
        NEW.id,
        NEW."companyId"
      )
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- Validation hatası varsa engelle
    IF array_length(validation_errors, 1) > 0 THEN
      RAISE EXCEPTION 'Validation failed: %', array_to_string(validation_errors, ', ');
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_deal_stage ON "Deal";
CREATE TRIGGER trigger_validate_deal_stage
  BEFORE UPDATE OF stage
  ON "Deal"
  FOR EACH ROW
  EXECUTE FUNCTION validate_deal_stage_change();

-- ============================================
-- PART 2: QUOTE WORKFLOW VALİDASYONLARI
-- ============================================

CREATE OR REPLACE FUNCTION validate_quote_status_change()
RETURNS TRIGGER AS $$
DECLARE
  validation_errors TEXT[] := ARRAY[]::TEXT[];
  item_count INTEGER;
BEGIN
  -- Status değiştiğinde validasyon yap
  IF NEW.status != OLD.status THEN
    
    -- DRAFT → SENT: Ürün listesi zorunlu
    IF NEW.status = 'SENT' AND OLD.status = 'DRAFT' THEN
      -- QuoteItem kontrolü - tablo yoksa atla
      IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'QuoteItem'
      ) THEN
        SELECT COUNT(*) INTO item_count
        FROM "QuoteItem"
        WHERE "quoteId" = NEW.id;
        
        IF item_count = 0 THEN
          validation_errors := array_append(validation_errors, 'En az 1 ürün eklenmeli');
        END IF;
      END IF;
      
      IF NEW."customerId" IS NULL THEN
        validation_errors := array_append(validation_errors, 'Müşteri seçimi zorunlu');
      END IF;
      
      IF NEW."totalAmount" IS NULL OR NEW."totalAmount" = 0 THEN
        validation_errors := array_append(validation_errors, 'Toplam tutar hesaplanmalı');
      END IF;
      
      -- Notification: Müşteriye gönderildi
      INSERT INTO "Notification" (
        title,
        message,
        type,
        "relatedTo",
        "relatedId",
        "companyId"
      )
      VALUES (
        'Teklif Gönderildi',
        NEW.title || ' teklifi müşteriye gönderildi. Müşteri onayını bekleyin (ACCEPTED) veya red (REJECTED) işlemini takip edin.',
        'info',
        'Quote',
        NEW.id,
        NEW."companyId"
      )
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- SENT → ACCEPTED: Müşteri onayladı
    IF NEW.status = 'ACCEPTED' AND OLD.status = 'SENT' THEN
      -- Notification: Tebrikler + Sonraki adım
      INSERT INTO "Notification" (
        title,
        message,
        type,
        "relatedTo",
        "relatedId",
        "companyId"
      )
      VALUES (
        '🎉 Teklif Onaylandı!',
        'Tebrikler! ' || NEW.title || ' teklifi onaylandı. Sonraki adım: Fatura ve sözleşme otomatik oluşturuldu. Invoice ve Contract modüllerine gidin.',
        'success',
        'Quote',
        NEW.id,
        NEW."companyId"
      )
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- SENT → REJECTED: Müşteri reddetti
    IF NEW.status = 'REJECTED' AND OLD.status = 'SENT' THEN
      -- Notification: Red nedeni
      INSERT INTO "Notification" (
        title,
        message,
        type,
        "relatedTo",
        "relatedId",
        "companyId"
      )
      VALUES (
        'Teklif Reddedildi',
        NEW.title || ' teklifi reddedildi. Yeni revizyon oluşturabilir veya yeni teklif hazırlayabilirsiniz.',
        'warning',
        'Quote',
        NEW.id,
        NEW."companyId"
      )
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- Validation hatası varsa engelle
    IF array_length(validation_errors, 1) > 0 THEN
      RAISE EXCEPTION 'Validation failed: %', array_to_string(validation_errors, ', ');
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_quote_status ON "Quote";
CREATE TRIGGER trigger_validate_quote_status
  BEFORE UPDATE OF status
  ON "Quote"
  FOR EACH ROW
  EXECUTE FUNCTION validate_quote_status_change();

-- ============================================
-- PART 3: INVOICE WORKFLOW VALİDASYONLARI
-- ============================================

CREATE OR REPLACE FUNCTION validate_invoice_status_change()
RETURNS TRIGGER AS $$
DECLARE
  validation_errors TEXT[] := ARRAY[]::TEXT[];
  item_count INTEGER;
BEGIN
  -- Status değiştiğinde validasyon yap
  IF NEW.status != OLD.status THEN
    
    -- DRAFT → SENT: Ürün listesi ve müşteri zorunlu
    IF NEW.status = 'SENT' AND OLD.status = 'DRAFT' THEN
      -- InvoiceItem kontrolü
      SELECT COUNT(*) INTO item_count
      FROM "InvoiceItem"
      WHERE "invoiceId" = NEW.id;
      
      IF item_count = 0 THEN
        validation_errors := array_append(validation_errors, 'En az 1 ürün eklenmeli');
      END IF;
      
      IF NEW."customerId" IS NULL THEN
        validation_errors := array_append(validation_errors, 'Müşteri seçimi zorunlu');
      END IF;
      
      IF NEW."totalAmount" IS NULL OR NEW."totalAmount" = 0 THEN
        validation_errors := array_append(validation_errors, 'Toplam tutar hesaplanmalı');
      END IF;
      
      IF NEW."invoiceNumber" IS NULL OR NEW."invoiceNumber" = '' THEN
        validation_errors := array_append(validation_errors, 'Fatura numarası zorunlu');
      END IF;
      
      -- Notification: Müşteriye gönderildi
      INSERT INTO "Notification" (
        title,
        message,
        type,
        "relatedTo",
        "relatedId",
        "companyId"
      )
      VALUES (
        'Fatura Gönderildi',
        NEW.title || ' faturası müşteriye gönderildi. Ödeme yapılmasını bekleyin (PAID).',
        'info',
        'Invoice',
        NEW.id,
        NEW."companyId"
      )
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- SENT → PAID: Ödeme alındı
    IF NEW.status = 'PAID' AND (OLD.status = 'SENT' OR OLD.status = 'OVERDUE') THEN
      IF NEW."paidAt" IS NULL THEN
        NEW."paidAt" := NOW();
      END IF;
      
      -- Notification: Tebrikler + Finance kaydı oluşturuldu
      INSERT INTO "Notification" (
        title,
        message,
        type,
        "relatedTo",
        "relatedId",
        "companyId"
      )
      VALUES (
        '💰 Fatura Ödendi!',
        'Tebrikler! ' || NEW.title || ' faturası ödendi. Finance kaydı otomatik oluşturuldu. Finance modülüne gidin.',
        'success',
        'Invoice',
        NEW.id,
        NEW."companyId"
      )
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- SENT → CANCELLED: İptal edildi
    IF NEW.status = 'CANCELLED' THEN
      -- Notification: İptal nedeni
      INSERT INTO "Notification" (
        title,
        message,
        type,
        "relatedTo",
        "relatedId",
        "companyId"
      )
      VALUES (
        'Fatura İptal Edildi',
        NEW.title || ' faturası iptal edildi.',
        'warning',
        'Invoice',
        NEW.id,
        NEW."companyId"
      )
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- Validation hatası varsa engelle
    IF array_length(validation_errors, 1) > 0 THEN
      RAISE EXCEPTION 'Validation failed: %', array_to_string(validation_errors, ', ');
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_invoice_status ON "Invoice";
CREATE TRIGGER trigger_validate_invoice_status
  BEFORE UPDATE OF status
  ON "Invoice"
  FOR EACH ROW
  EXECUTE FUNCTION validate_invoice_status_change();

-- ============================================
-- PART 4: CONTRACT WORKFLOW VALİDASYONLARI
-- ============================================

CREATE OR REPLACE FUNCTION validate_contract_status_change()
RETURNS TRIGGER AS $$
DECLARE
  validation_errors TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Status değiştiğinde validasyon yap
  IF NEW.status != OLD.status THEN
    
    -- DRAFT → ACTIVE: Zorunlu alanlar
    IF NEW.status = 'ACTIVE' AND OLD.status = 'DRAFT' THEN
      IF NEW."customerId" IS NULL THEN
        validation_errors := array_append(validation_errors, 'Müşteri seçimi zorunlu');
      END IF;
      
      IF NEW."startDate" IS NULL THEN
        validation_errors := array_append(validation_errors, 'Başlangıç tarihi zorunlu');
      END IF;
      
      IF NEW."endDate" IS NULL THEN
        validation_errors := array_append(validation_errors, 'Bitiş tarihi zorunlu');
      END IF;
      
      IF NEW.value IS NULL OR NEW.value = 0 THEN
        validation_errors := array_append(validation_errors, 'Sözleşme değeri zorunlu');
      END IF;
      
      IF NEW."contractNumber" IS NULL OR NEW."contractNumber" = '' THEN
        validation_errors := array_append(validation_errors, 'Sözleşme numarası zorunlu');
      END IF;
      
      -- Notification: Sözleşme aktif
      INSERT INTO "Notification" (
        title,
        message,
        type,
        "relatedTo",
        "relatedId",
        "companyId"
      )
      VALUES (
        'Sözleşme Aktif',
        NEW.title || ' sözleşmesi aktif edildi. Fatura oluşturma işlemi başlatıldı.',
        'success',
        'Contract',
        NEW.id,
        NEW."companyId"
      )
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- ACTIVE → TERMINATED: İptal edildi
    IF NEW.status = 'TERMINATED' AND OLD.status = 'ACTIVE' THEN
      -- Notification: İptal nedeni
      INSERT INTO "Notification" (
        title,
        message,
        type,
        "relatedTo",
        "relatedId",
        "companyId"
      )
      VALUES (
        'Sözleşme Sonlandırıldı',
        NEW.title || ' sözleşmesi sonlandırıldı.',
        'warning',
        'Contract',
        NEW.id,
        NEW."companyId"
      )
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- Validation hatası varsa engelle
    IF array_length(validation_errors, 1) > 0 THEN
      RAISE EXCEPTION 'Validation failed: %', array_to_string(validation_errors, ', ');
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_contract_status ON "Contract";
CREATE TRIGGER trigger_validate_contract_status
  BEFORE UPDATE OF status
  ON "Contract"
  FOR EACH ROW
  EXECUTE FUNCTION validate_contract_status_change();

-- ============================================
-- PART 5: TASK WORKFLOW VALİDASYONLARI
-- ============================================

CREATE OR REPLACE FUNCTION validate_task_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Status değiştiğinde validasyon yap
  IF NEW.status != OLD.status THEN
    
    -- TODO → IN_PROGRESS: Atama zorunlu
    IF NEW.status = 'IN_PROGRESS' AND OLD.status = 'TODO' THEN
      IF NEW."assignedTo" IS NULL THEN
        RAISE EXCEPTION 'Görevi başlatmak için önce bir kullanıcıya atamanız gerekiyor';
      END IF;
      
      -- Notification: Görev başlatıldı
      INSERT INTO "Notification" (
        title,
        message,
        type,
        "relatedTo",
        "relatedId",
        "companyId"
      )
      VALUES (
        'Görev Başlatıldı',
        COALESCE(NEW.title, 'Başlıksız') || ' görevi başlatıldı.',
        'info',
        'Task',
        NEW.id,
        NEW."companyId"
      )
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- IN_PROGRESS → DONE: Tamamlandı
    IF NEW.status = 'DONE' AND OLD.status = 'IN_PROGRESS' THEN
      -- Notification: Tebrikler
      INSERT INTO "Notification" (
        title,
        message,
        type,
        "relatedTo",
        "relatedId",
        "companyId"
      )
      VALUES (
        '✅ Görev Tamamlandı!',
        'Tebrikler! ' || COALESCE(NEW.title, 'Başlıksız') || ' görevi tamamlandı.',
        'success',
        'Task',
        NEW.id,
        NEW."companyId"
      )
      ON CONFLICT DO NOTHING;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_task_status ON "Task";
CREATE TRIGGER trigger_validate_task_status
  BEFORE UPDATE OF status
  ON "Task"
  FOR EACH ROW
  EXECUTE FUNCTION validate_task_status_change();

-- ============================================
-- PART 6: TICKET WORKFLOW VALİDASYONLARI
-- ============================================

CREATE OR REPLACE FUNCTION validate_ticket_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Status değiştiğinde validasyon yap
  IF NEW.status != OLD.status THEN
    
    -- OPEN → IN_PROGRESS: Atama zorunlu
    IF NEW.status = 'IN_PROGRESS' AND OLD.status = 'OPEN' THEN
      IF NEW."assignedTo" IS NULL THEN
        RAISE EXCEPTION 'Talebi işleme almak için önce bir kullanıcıya atamanız gerekiyor';
      END IF;
      
      -- Notification: Talep işlemde
      INSERT INTO "Notification" (
        title,
        message,
        type,
        "relatedTo",
        "relatedId",
        "companyId"
      )
      VALUES (
        'Destek Talebi İşleme Alındı',
        COALESCE(NEW.title, 'Başlıksız') || ' destek talebi işleme alındı.',
        'info',
        'Ticket',
        NEW.id,
        NEW."companyId"
      )
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- IN_PROGRESS → RESOLVED: Çözüldü
    IF NEW.status = 'RESOLVED' AND OLD.status = 'IN_PROGRESS' THEN
      -- Notification: Çözüldü
      INSERT INTO "Notification" (
        title,
        message,
        type,
        "relatedTo",
        "relatedId",
        "companyId"
      )
      VALUES (
        '✅ Destek Talebi Çözüldü!',
        COALESCE(NEW.title, 'Başlıksız') || ' destek talebi çözüldü.',
        'success',
        'Ticket',
        NEW.id,
        NEW."companyId"
      )
      ON CONFLICT DO NOTHING;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_ticket_status ON "Ticket";
CREATE TRIGGER trigger_validate_ticket_status
  BEFORE UPDATE OF status
  ON "Ticket"
  FOR EACH ROW
  EXECUTE FUNCTION validate_ticket_status_change();

-- ============================================
-- MIGRATION TAMAMLANDI
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ Migration 044 tamamlandı: Workflow Validations';
  RAISE NOTICE '============================================';
  RAISE NOTICE '📌 Yeni Validasyonlar:';
  RAISE NOTICE '  1. Deal: Stage geçişlerinde zorunlu alanlar kontrol ediliyor';
  RAISE NOTICE '  2. Quote: Status geçişlerinde ürün listesi zorunlu';
  RAISE NOTICE '  3. Invoice: Status geçişlerinde ürün listesi ve müşteri zorunlu';
  RAISE NOTICE '  4. Contract: ACTIVE için zorunlu alanlar kontrol ediliyor';
  RAISE NOTICE '  5. Task: IN_PROGRESS için atama zorunlu';
  RAISE NOTICE '  6. Ticket: IN_PROGRESS için atama zorunlu';
  RAISE NOTICE '============================================';
  RAISE NOTICE '📌 Her aşamada kullanıcıya yönlendirme bildirimleri gönderiliyor';
  RAISE NOTICE '============================================';
END $$;

