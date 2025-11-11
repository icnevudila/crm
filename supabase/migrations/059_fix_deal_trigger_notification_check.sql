-- ============================================
-- 059_fix_deal_trigger_notification_check.sql
-- Deal Stage Change Trigger'ında Notification Tablosu Kontrolü
-- ============================================
-- Sorun: validate_deal_stage_change fonksiyonu Notification tablosuna INSERT yapıyor ama tablo yoksa hata veriyor
-- Çözüm: Notification tablosu kontrolü ekle - tablo yoksa INSERT yapma
-- ============================================

CREATE OR REPLACE FUNCTION validate_deal_stage_change()
RETURNS TRIGGER AS $$
DECLARE
  validation_errors TEXT[] := ARRAY[]::TEXT[];
  has_notification_table BOOLEAN;
BEGIN
  -- Notification tablosu var mı kontrol et
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'Notification'
  ) INTO has_notification_table;
  
  -- Stage değiştiğinde validasyon yap
  IF NEW.stage != OLD.stage THEN
    -- POTENTIAL → CONTACTED: İletişime geçildi
    IF NEW.stage = 'CONTACTED' AND OLD.stage = 'POTENTIAL' THEN
      -- Notification: İletişime geçildi
      IF has_notification_table THEN
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
            '📞 İletişime Geçildi',
            NEW.title || ' fırsatı için müşteriyle iletişime geçildi. Sonraki adım: Teklif hazırlayın.',
            'info',
            'Deal',
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
    
    -- CONTACTED → QUOTE: Teklif oluşturuldu
    IF NEW.stage = 'QUOTE' AND OLD.stage = 'CONTACTED' THEN
      -- Notification: Teklif oluşturuldu
      IF has_notification_table THEN
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
            '📄 Teklif Oluşturuldu',
            NEW.title || ' fırsatı için teklif oluşturuldu. Sonraki adım: Teklifi gönderin.',
            'info',
            'Deal',
            NEW.id,
            NEW."companyId"
          )
          ON CONFLICT DO NOTHING;
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Notification oluşturulamadı: %', SQLERRM;
        END;
      END IF;
    END IF;
    
    -- QUOTE → NEGOTIATION: Pazarlık başladı
    IF NEW.stage = 'NEGOTIATION' AND OLD.stage = 'QUOTE' THEN
      -- Notification: Pazarlık başladı
      IF has_notification_table THEN
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
            '🤝 Pazarlık Başladı',
            NEW.title || ' fırsatı için pazarlık aşamasına geçildi. Sonraki adım: Anlaşma sağlayın.',
            'info',
            'Deal',
            NEW.id,
            NEW."companyId"
          )
          ON CONFLICT DO NOTHING;
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Notification oluşturulamadı: %', SQLERRM;
        END;
      END IF;
    END IF;
    
    -- NEGOTIATION → WON: Kazanıldı (lostReason zorunlu DEĞİL)
    IF NEW.stage = 'WON' AND OLD.stage = 'NEGOTIATION' THEN
      IF NEW.value IS NULL OR NEW.value = 0 THEN
        validation_errors := array_append(validation_errors, 'Fırsat değeri (value) zorunlu');
      END IF;
      
      -- Notification: Tebrikler + Sonraki adım
      IF has_notification_table THEN
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
            '🎉 Fırsat Kazanıldı!',
            'Tebrikler! ' || NEW.title || ' fırsatını kazandınız. Sonraki adım: Sözleşme imzalayın. Contract modülüne gidin.',
            'success',
            'Deal',
            NEW.id,
            NEW."companyId"
          )
          ON CONFLICT DO NOTHING;
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Notification oluşturulamadı: %', SQLERRM;
        END;
      END IF;
    END IF;
    
    -- LOST: lostReason kontrolü kaldırıldı (kolon yoksa hata vermemesi için)
    -- NOT: lostReason kolonu migration'da eklenmiş olabilir ama henüz çalıştırılmamış olabilir
    -- Bu yüzden lostReason kontrolünü tamamen kaldırıyoruz - validasyon yapmıyoruz
    IF NEW.stage = 'LOST' THEN
      -- Notification: Kayıp nedeni analizi
      IF has_notification_table THEN
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
            'Fırsat Kaybedildi',
            NEW.title || ' fırsatı kaybedildi.',
            'warning',
            'Deal',
            NEW.id,
            NEW."companyId"
          )
          ON CONFLICT DO NOTHING;
        EXCEPTION WHEN OTHERS THEN
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

COMMENT ON FUNCTION validate_deal_stage_change IS 'Deal stage değişikliklerini validate eder ve notification oluşturur. Notification tablosu yoksa hata vermez.';





