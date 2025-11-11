-- ✅ ÇÖZÜM: Quote trigger'larını düzelt - QuoteItem ve Notification tabloları yoksa hata vermesin
-- ÖNEMLİ: Bu migration'ı çalıştırmadan önce 044_workflow_validations.sql ve 045_automation_improvements.sql çalıştırılmış olmalı

-- ============================================
-- 1. validate_quote_status_change() fonksiyonunu güncelle
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
      
      -- customerId kontrolü - alan yoksa atla
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'Quote' 
        AND column_name = 'customerId'
      ) THEN
        IF NEW."customerId" IS NULL THEN
          validation_errors := array_append(validation_errors, 'Müşteri seçimi zorunlu');
        END IF;
      END IF;
      
      IF NEW."totalAmount" IS NULL OR NEW."totalAmount" = 0 THEN
        validation_errors := array_append(validation_errors, 'Toplam tutar hesaplanmalı');
      END IF;
      
      -- Notification: Müşteriye gönderildi - tablo yoksa atla
      IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Notification'
      ) THEN
        BEGIN
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
            COALESCE(NEW.title, 'Başlıksız') || ' teklifi müşteriye gönderildi. Müşteri onayını bekleyin (ACCEPTED) veya red (REJECTED) işlemini takip edin.',
            'info',
            'Quote',
            NEW.id,
            NEW."companyId"
          )
          ON CONFLICT DO NOTHING;
        EXCEPTION WHEN OTHERS THEN
          -- Notification hatası ana işlemi engellemez
          RAISE NOTICE 'Notification oluşturulamadı: %', SQLERRM;
        END;
      END IF;
    END IF;
    
    -- SENT → ACCEPTED: Müşteri onayladı
    IF NEW.status = 'ACCEPTED' AND (OLD.status IS NULL OR OLD.status != 'ACCEPTED') THEN
      -- Notification: Tebrikler + Sonraki adım - tablo yoksa atla
      IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Notification'
      ) THEN
        BEGIN
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
            'Tebrikler! ' || COALESCE(NEW.title, 'Başlıksız') || ' teklifi onaylandı. Sonraki adım: Fatura ve sözleşme otomatik oluşturuldu. Invoice ve Contract modüllerine gidin.',
            'success',
            'Quote',
            NEW.id,
            NEW."companyId"
          )
          ON CONFLICT DO NOTHING;
        EXCEPTION WHEN OTHERS THEN
          -- Notification hatası ana işlemi engellemez
          RAISE NOTICE 'Notification oluşturulamadı: %', SQLERRM;
        END;
      END IF;
    END IF;
    
    -- SENT → REJECTED: Müşteri reddetti
    IF NEW.status = 'REJECTED' AND (OLD.status IS NULL OR OLD.status != 'REJECTED') THEN
      -- Notification: Red nedeni - tablo yoksa atla
      IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Notification'
      ) THEN
        BEGIN
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
            COALESCE(NEW.title, 'Başlıksız') || ' teklifi reddedildi. Yeni revizyon oluşturabilir veya yeni teklif hazırlayabilirsiniz.',
            'warning',
            'Quote',
            NEW.id,
            NEW."companyId"
          )
          ON CONFLICT DO NOTHING;
        EXCEPTION WHEN OTHERS THEN
          -- Notification hatası ana işlemi engellemez
          RAISE NOTICE 'Notification oluşturulamadı: %', SQLERRM;
        END;
      END IF;
    END IF;
    
    -- Validation hatası varsa engelle
    IF array_length(validation_errors, 1) > 0 THEN
      RAISE EXCEPTION 'Validation failed: %', array_to_string(validation_errors, ', ');
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'ı yeniden oluştur
DROP TRIGGER IF EXISTS trigger_validate_quote_status ON "Quote";
CREATE TRIGGER trigger_validate_quote_status
  BEFORE UPDATE OF status
  ON "Quote"
  FOR EACH ROW
  EXECUTE FUNCTION validate_quote_status_change();

COMMENT ON FUNCTION validate_quote_status_change IS 'Quote status değişikliklerini validate eder. QuoteItem ve Notification tabloları yoksa hata vermez.';





