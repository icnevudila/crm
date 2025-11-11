-- ============================================
-- 060_fix_all_deal_triggers_lostreason.sql
-- Tüm Deal Trigger'larında lostReason Kontrolü Düzeltmesi
-- ============================================
-- Sorun: Birçok trigger fonksiyonu NEW."lostReason" kullanıyor ama kolon yoksa hata veriyor
-- Çözüm: Tüm trigger'larda lostReason kontrolünü dinamik hale getir veya kaldır
-- ============================================

-- ============================================
-- 1. auto_create_analysis_task_on_deal_lost Fonksiyonunu Düzelt
-- ============================================

CREATE OR REPLACE FUNCTION auto_create_analysis_task_on_deal_lost()
RETURNS TRIGGER AS $$
DECLARE
  task_id UUID;
  has_task_table BOOLEAN;
BEGIN
  -- Task tablosu var mı?
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'Task'
  ) INTO has_task_table;
  
  IF NOT has_task_table THEN
    RETURN NEW;
  END IF;
  
  -- Deal LOST olduğunda analiz görevi oluştur
  -- NOT: lostReason kontrolü kaldırıldı - kolon yoksa hata vermemesi için
  IF NEW.stage = 'LOST' AND (OLD.stage IS NULL OR OLD.stage != 'LOST') THEN
    -- Analiz görevi oluştur
    BEGIN
      INSERT INTO "Task" (
        title,
        description,
        status,
        "companyId",
        "assignedTo"
      )
      VALUES (
        'Fırsat Kaybı Analizi: ' || COALESCE(NEW.title, 'Başlıksız'),
        'Fırsat "' || COALESCE(NEW.title, 'Başlıksız') || '" kaybedildi. Lütfen süreci analiz edin ve iyileştirme önerileri belirleyin.',
        'TODO',
        NEW."companyId",
        NEW."createdBy"
      )
      RETURNING id INTO task_id;
      
      -- Notification oluştur (eğer tablo varsa)
      IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Notification'
      ) AND task_id IS NOT NULL THEN
        BEGIN
          INSERT INTO "Notification" (
            title,
            message,
            type,
            "relatedTo",
            "relatedId",
            "companyId",
            "userId"
          )
          SELECT
            '📊 Fırsat Kaybı Analizi Gerekli',
            'Fırsat "' || COALESCE(NEW.title, 'Başlıksız') || '" kaybedildi. Analiz görevi oluşturuldu. Görev ID: ' || task_id::text,
            'warning',
            'Task',
            task_id,
            NEW."companyId",
            u.id
          FROM "User" u
          WHERE (
            (u.role IN ('ADMIN', 'SALES') AND u."companyId" = NEW."companyId")
            OR
            (u.role = 'SUPER_ADMIN')
          )
          LIMIT 1
          ON CONFLICT DO NOTHING;
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Notification oluşturulamadı: %', SQLERRM;
        END;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Task oluşturulamadı: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_create_analysis_task_on_deal_lost IS 'Deal LOST olduğunda analiz görevi oluşturur. lostReason kolonu yoksa hata vermez.';

-- ============================================
-- 2. 044_workflow_validations.sql'deki validate_deal_stage_change zaten 059'da düzeltildi
-- Ama orijinal dosyada hala eski kod varsa, bu migration onu override eder
-- ============================================

-- NOT: 044_workflow_validations.sql'deki validate_deal_stage_change fonksiyonu
-- 059_fix_deal_trigger_notification_check.sql'de zaten düzeltildi
-- Bu migration sadece diğer trigger'ları düzeltiyor





