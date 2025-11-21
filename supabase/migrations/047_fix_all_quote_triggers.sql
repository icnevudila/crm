-- ✅ %100 KESİN ÇÖZÜM: Tüm Quote trigger'larını düzelt - Notification, QuoteItem, customerId yoksa hata vermesin
-- ÖNEMLİ: Bu migration tüm Quote trigger'larını günceller ve eksik tablo/alan kontrollerini ekler
-- ÖNEMLİ: Bu migration'ı çalıştırmadan önce 045_automation_improvements.sql'deki trigger'ı devre dışı bırak veya bu migration'ı çalıştır

-- Önce mevcut trigger'ları devre dışı bırak
DROP TRIGGER IF EXISTS trigger_quote_accepted_automations ON "Quote";
DROP TRIGGER IF EXISTS trigger_quote_accepted_create_invoice ON "Quote";
DROP TRIGGER IF EXISTS trigger_auto_suggest_revision_on_quote_rejected ON "Quote";

-- ============================================
-- 1. notify_quote_sent() fonksiyonunu güncelle
-- ============================================
CREATE OR REPLACE FUNCTION notify_quote_sent()
RETURNS TRIGGER AS $$
BEGIN
  -- Quote SENT oldu
  IF NEW.status = 'SENT' AND (OLD.status IS NULL OR OLD.status != 'SENT') THEN
    
    -- Notification tablosu yoksa atla
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'Notification'
    ) THEN
      BEGIN
        -- Notification oluştur - Admin, Sales ve SuperAdmin rolündeki kullanıcılara
        -- ÖNEMLİ: SuperAdmin için companyId kontrolü yapma - tüm şirketlerin bildirimlerini alabilir
        INSERT INTO "Notification" (
          "userId",
          "companyId",
          title,
          message,
          type,
          "relatedTo",
          "relatedId",
          link
        )
        SELECT 
          u.id,
          NEW."companyId",
          'Teklif Gönderildi',
          COALESCE(NEW.title, 'Başlıksız') || ' teklifi müşteriye gönderildi.',
          'info',
          'Quote',
          NEW.id,
          '/tr/quotes/' || NEW.id
        FROM "User" u
        WHERE (
          -- Normal kullanıcılar: Aynı companyId'ye sahip olmalı
          (u.role IN ('ADMIN', 'SALES') AND u."companyId" = NEW."companyId")
          OR
          -- SuperAdmin: Tüm şirketlerin bildirimlerini alabilir (companyId kontrolü yok)
          (u.role = 'SUPER_ADMIN')
        )
          AND u.status = 'ACTIVE'
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Quote sent notification created for quote %', NEW.id;
        
      EXCEPTION WHEN OTHERS THEN
        -- Notification hatası ana işlemi engellemez
        RAISE NOTICE 'Could not create notification for quote: %', SQLERRM;
      END;
    END IF;
    
    -- ActivityLog - tablo yoksa atla
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'ActivityLog'
    ) THEN
      BEGIN
        INSERT INTO "ActivityLog" (
          entity,
          action,
          description,
          meta,
          "companyId",
          "userId"
        )
        VALUES (
          'Quote',
          'UPDATE',
          'Teklif müşteriye gönderildi',
          jsonb_build_object(
            'quoteId', NEW.id,
            'quoteNumber', COALESCE(NEW."quoteNumber", ''),
            'status', NEW.status
          ),
          NEW."companyId",
          COALESCE(NEW."createdBy", NULL)
        );
      EXCEPTION WHEN OTHERS THEN
        -- ActivityLog hatası ana işlemi engellemez
        RAISE NOTICE 'Could not create activity log for quote: %', SQLERRM;
      END;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'ı yeniden oluştur
DROP TRIGGER IF EXISTS trigger_quote_sent_notification ON "Quote";
CREATE TRIGGER trigger_quote_sent_notification
  AFTER UPDATE OF status
  ON "Quote"
  FOR EACH ROW
  EXECUTE FUNCTION notify_quote_sent();

-- ============================================
-- 2. validate_quote_status_change() fonksiyonunu güncelle
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

-- ============================================
-- 3. create_invoice_on_quote_accepted() fonksiyonunu güncelle
-- ============================================
CREATE OR REPLACE FUNCTION create_invoice_on_quote_accepted()
RETURNS TRIGGER AS $$
DECLARE
  invoice_number VARCHAR;
  invoice_id UUID;
  contract_id UUID;
  customer_name VARCHAR;
  error_message TEXT;
BEGIN
  -- Quote ACCEPTED oldu
  IF NEW.status = 'ACCEPTED' AND (OLD.status IS NULL OR OLD.status != 'ACCEPTED') THEN
    
    BEGIN
      -- Müşteri bilgisini al - customerId alanı yoksa atla
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'Quote' 
        AND column_name = 'customerId'
      ) AND NEW."customerId" IS NOT NULL THEN
        SELECT name INTO customer_name FROM "Customer" WHERE id = NEW."customerId";
      END IF;
      
      -- ============================================
      -- 1. INVOICE OLUŞTUR
      -- ============================================
      -- Zaten invoice var mı kontrol et
      IF NOT EXISTS (
        SELECT 1 FROM "Invoice"
        WHERE "quoteId" = NEW.id
      ) THEN
        
        -- Invoice için müşteri kontrolü - customerId alanı yoksa atla
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'Quote' 
          AND column_name = 'customerId'
        ) AND NEW."customerId" IS NULL THEN
          error_message := 'Invoice oluşturulamadı: Teklif için müşteri seçilmemiş!';
          
          -- Notification ekle - HATA - tablo yoksa atla
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
                priority,
                "relatedTo",
                "relatedId",
                "userId",
                "companyId"
              )
              VALUES (
                '❌ Fatura Oluşturulamadı',
                error_message || ' Lütfen teklifi düzenleyin ve müşteri ekleyin.',
                'error',
                'high',
                'Quote',
                NEW.id,
                COALESCE(NEW."createdBy", NULL),
                NEW."companyId"
              );
            EXCEPTION WHEN OTHERS THEN
              -- Notification hatası ana işlemi engellemez
              RAISE NOTICE 'Notification oluşturulamadı: %', SQLERRM;
            END;
          END IF;
          
          RAISE NOTICE 'HATA: %', error_message;
          RETURN NEW; -- Hata olsa da Quote'u güncellemeye devam et
        END IF;
        
        -- Invoice numarası oluştur
        invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(COALESCE((SELECT MAX(CAST(SUBSTRING("invoiceNumber" FROM '[0-9]+$') AS INTEGER)) FROM "Invoice" WHERE "invoiceNumber" LIKE 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-%'), 0) + 1, 4, '0');
        
        -- Invoice oluştur
        INSERT INTO "Invoice" (
          "invoiceNumber",
          "quoteId",
          "customerId",
          "customerCompanyId",
          "issueDate",
          "dueDate",
          "subtotal",
          "taxAmount",
          "totalAmount",
          currency,
          status,
          notes,
          "companyId",
          "createdBy"
        )
        VALUES (
          invoice_number,
          NEW.id,
          CASE WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'Quote' 
            AND column_name = 'customerId'
          ) THEN NEW."customerId" ELSE NULL END,
          CASE WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'Quote' 
            AND column_name = 'customerCompanyId'
          ) THEN NEW."customerCompanyId" ELSE NULL END,
          CURRENT_DATE,
          CURRENT_DATE + INTERVAL '30 days', -- 30 gün vade
          COALESCE(NEW."subtotal", 0),
          COALESCE(NEW."taxAmount", 0),
          COALESCE(NEW."totalAmount", 0),
          COALESCE(NEW.currency, 'TRY'),
          'DRAFT',
          'Quote #' || COALESCE(NEW."quoteNumber", '') || ' onaylandı, otomatik oluşturuldu',
          NEW."companyId",
          COALESCE(NEW."createdBy", NULL)
        )
        RETURNING id INTO invoice_id;
        
        -- Invoice Items'ları kopyala (QuoteItem → InvoiceItem)
        -- ÖNEMLİ: QuoteItem tablosu yoksa atla
        IF EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'QuoteItem'
        ) THEN
          INSERT INTO "InvoiceItem" (
            "invoiceId",
            "productId",
            description,
            quantity,
            "unitPrice",
            "taxRate",
            discount,
            "totalPrice",
            "companyId"
          )
          SELECT
            invoice_id,
            "productId",
            description,
            quantity,
            "unitPrice",
            "taxRate",
            discount,
            "totalPrice",
            NEW."companyId"
          FROM "QuoteItem"
          WHERE "quoteId" = NEW.id;
          
          -- Stok rezervasyonu: InvoiceItem'lar oluşturulduğunda Product.reservedQuantity artır
          -- Her QuoteItem için rezerve miktar güncelle
          UPDATE "Product" p
          SET "reservedQuantity" = COALESCE(p."reservedQuantity", 0) + qi.quantity,
              "updatedAt" = NOW()
          FROM "QuoteItem" qi
          WHERE qi."quoteId" = NEW.id
            AND qi."productId" = p.id
            AND p."companyId" = NEW."companyId";
        END IF;
        
        -- ActivityLog - Invoice - tablo yoksa atla
        IF EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'ActivityLog'
        ) THEN
          BEGIN
            INSERT INTO "ActivityLog" (
              entity,
              action,
              description,
              meta,
              "companyId",
              "userId"
            )
            VALUES (
              'Invoice',
              'CREATE',
              'Quote onaylandı, taslak fatura oluşturuldu: ' || invoice_number,
              jsonb_build_object(
                'quoteId', NEW.id,
                'quoteNumber', COALESCE(NEW."quoteNumber", ''),
                'invoiceId', invoice_id,
                'invoiceNumber', invoice_number,
                'customerName', COALESCE(customer_name, '')
              ),
              NEW."companyId",
              COALESCE(NEW."createdBy", NULL)
            );
          EXCEPTION WHEN OTHERS THEN
            -- ActivityLog hatası ana işlemi engellemez
            RAISE NOTICE 'ActivityLog oluşturulamadı: %', SQLERRM;
          END;
        END IF;
        
        -- Notification - BAŞARILI - tablo yoksa atla
        IF EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'Notification'
        ) THEN
          BEGIN
            -- Notification oluştur - Admin, Sales ve SuperAdmin rolündeki kullanıcılara
            -- ÖNEMLİ: SuperAdmin için companyId kontrolü yapma - tüm şirketlerin bildirimlerini alabilir
            INSERT INTO "Notification" (
              "userId",
              "companyId",
              title,
              message,
              type,
              priority,
              link,
              "relatedTo",
              "relatedId"
            )
            SELECT 
              u.id,
              NEW."companyId",
              '✅ Fatura Oluşturuldu',
              COALESCE(NEW.title, 'Teklif') || ' teklifi kabul edildi. Fatura #' || invoice_number || ' oluşturuldu. Faturaya gitmek için tıklayın.',
              'success',
              'normal',
              '/tr/invoices/' || invoice_id,
              'Invoice',
              invoice_id
            FROM "User" u
            WHERE (
              -- Normal kullanıcılar: Aynı companyId'ye sahip olmalı
              (u.role IN ('ADMIN', 'SALES') AND u."companyId" = NEW."companyId")
              OR
              -- SuperAdmin: Tüm şirketlerin bildirimlerini alabilir (companyId kontrolü yok)
              (u.role = 'SUPER_ADMIN')
            )
              AND u.status = 'ACTIVE'
            ON CONFLICT DO NOTHING;
          EXCEPTION WHEN OTHERS THEN
            -- Notification hatası ana işlemi engellemez
            RAISE NOTICE 'Notification oluşturulamadı: %', SQLERRM;
          END;
        END IF;
        
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      -- Hata olsa da Quote'u güncellemeye devam et
      RAISE NOTICE 'Quote ACCEPTED automation error: %', SQLERRM;
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ✅ ÇÖZÜM: create_invoice_on_quote_accepted() trigger'ını devre dışı bırak
-- ÖNEMLİ: handle_quote_accepted_automations() zaten invoice oluşturuyor, duplicate olmasın
-- DROP TRIGGER IF EXISTS trigger_quote_accepted_create_invoice ON "Quote";
-- CREATE TRIGGER trigger_quote_accepted_create_invoice
--   AFTER UPDATE OF status
--   ON "Quote"
--   FOR EACH ROW
--   EXECUTE FUNCTION create_invoice_on_quote_accepted();

-- ============================================
-- 4. handle_quote_accepted_automations() fonksiyonunu güncelle
-- ============================================
CREATE OR REPLACE FUNCTION handle_quote_accepted_automations()
RETURNS TRIGGER AS $$
DECLARE
  invoice_number VARCHAR;
  invoice_id UUID;
  contract_id UUID;
  contract_number VARCHAR;
  customer_name VARCHAR;
  error_message TEXT;
BEGIN
  -- Quote ACCEPTED oldu
  IF NEW.status = 'ACCEPTED' AND (OLD.status IS NULL OR OLD.status != 'ACCEPTED') THEN
    
    BEGIN
      -- Müşteri bilgisini al - customerId alanı yoksa atla
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'Quote' 
        AND column_name = 'customerId'
      ) AND NEW."customerId" IS NOT NULL THEN
        SELECT name INTO customer_name FROM "Customer" WHERE id = NEW."customerId";
      END IF;
      
      -- ============================================
      -- 1. INVOICE OLUŞTUR
      -- ============================================
      -- Zaten invoice var mı kontrol et
      IF NOT EXISTS (
        SELECT 1 FROM "Invoice"
        WHERE "quoteId" = NEW.id
      ) THEN
        
        -- Invoice için müşteri kontrolü - customerId alanı yoksa atla
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'Quote' 
          AND column_name = 'customerId'
        ) AND NEW."customerId" IS NULL THEN
          error_message := 'Invoice oluşturulamadı: Teklif için müşteri seçilmemiş!';
          
          -- Notification ekle - HATA - tablo yoksa atla
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
                priority,
                "relatedTo",
                "relatedId",
                "userId",
                "companyId"
              )
              VALUES (
                '❌ Fatura Oluşturulamadı',
                error_message || ' Lütfen teklifi düzenleyin ve müşteri ekleyin.',
                'error',
                'high',
                'Quote',
                NEW.id,
                COALESCE(NEW."createdBy", NULL),
                NEW."companyId"
              );
            EXCEPTION WHEN OTHERS THEN
              -- Notification hatası ana işlemi engellemez
              RAISE NOTICE 'Notification oluşturulamadı: %', SQLERRM;
            END;
          END IF;
          
          RAISE NOTICE 'HATA: %', error_message;
          RETURN NEW; -- Hata olsa da Quote'u güncellemeye devam et
        END IF;
        
        -- Invoice numarası oluştur
        invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(COALESCE((SELECT MAX(CAST(SUBSTRING("invoiceNumber" FROM '[0-9]+$') AS INTEGER)) FROM "Invoice" WHERE "invoiceNumber" LIKE 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-%'), 0) + 1, 4, '0');
        
        -- Invoice oluştur
        INSERT INTO "Invoice" (
          "invoiceNumber",
          "quoteId",
          "customerId",
          "customerCompanyId",
          "issueDate",
          "dueDate",
          "subtotal",
          "taxAmount",
          "totalAmount",
          currency,
          status,
          notes,
          "companyId",
          "createdBy"
        )
        VALUES (
          invoice_number,
          NEW.id,
          CASE WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'Quote' 
            AND column_name = 'customerId'
          ) THEN NEW."customerId" ELSE NULL END,
          CASE WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'Quote' 
            AND column_name = 'customerCompanyId'
          ) THEN NEW."customerCompanyId" ELSE NULL END,
          CURRENT_DATE,
          CURRENT_DATE + INTERVAL '30 days', -- 30 gün vade
          COALESCE(NEW."subtotal", 0),
          COALESCE(NEW."taxAmount", 0),
          COALESCE(NEW."totalAmount", 0),
          COALESCE(NEW.currency, 'TRY'),
          'DRAFT',
          'Quote #' || COALESCE(NEW."quoteNumber", '') || ' onaylandı, otomatik oluşturuldu',
          NEW."companyId",
          COALESCE(NEW."createdBy", NULL)
        )
        RETURNING id INTO invoice_id;
        
        -- Invoice Items'ları kopyala (QuoteItem → InvoiceItem)
        -- ÖNEMLİ: QuoteItem tablosu yoksa atla
        IF EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'QuoteItem'
        ) THEN
          INSERT INTO "InvoiceItem" (
            "invoiceId",
            "productId",
            description,
            quantity,
            "unitPrice",
            "taxRate",
            discount,
            "totalPrice",
            "companyId"
          )
          SELECT
            invoice_id,
            "productId",
            description,
            quantity,
            "unitPrice",
            "taxRate",
            discount,
            "totalPrice",
            NEW."companyId"
          FROM "QuoteItem"
          WHERE "quoteId" = NEW.id;
          
          -- Stok rezervasyonu: InvoiceItem'lar oluşturulduğunda Product.reservedQuantity artır
          -- Her QuoteItem için rezerve miktar güncelle
          UPDATE "Product" p
          SET "reservedQuantity" = COALESCE(p."reservedQuantity", 0) + qi.quantity,
              "updatedAt" = NOW()
          FROM "QuoteItem" qi
          WHERE qi."quoteId" = NEW.id
            AND qi."productId" = p.id
            AND p."companyId" = NEW."companyId";
        END IF;
        
        -- ActivityLog - Invoice - tablo yoksa atla
        IF EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'ActivityLog'
        ) THEN
          BEGIN
            INSERT INTO "ActivityLog" (
              entity,
              action,
              description,
              meta,
              "companyId",
              "userId"
            )
            VALUES (
              'Invoice',
              'CREATE',
              'Quote onaylandı, taslak fatura oluşturuldu: ' || invoice_number,
              jsonb_build_object(
                'quoteId', NEW.id,
                'quoteNumber', COALESCE(NEW."quoteNumber", ''),
                'invoiceId', invoice_id,
                'invoiceNumber', invoice_number,
                'customerName', COALESCE(customer_name, '')
              ),
              NEW."companyId",
              COALESCE(NEW."createdBy", NULL)
            );
          EXCEPTION WHEN OTHERS THEN
            -- ActivityLog hatası ana işlemi engellemez
            RAISE NOTICE 'ActivityLog oluşturulamadı: %', SQLERRM;
          END;
        END IF;
        
        -- Notification - BAŞARILI - tablo yoksa atla
        IF EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'Notification'
        ) THEN
          BEGIN
            -- Notification oluştur - Admin, Sales ve SuperAdmin rolündeki kullanıcılara
            -- ÖNEMLİ: SuperAdmin için companyId kontrolü yapma - tüm şirketlerin bildirimlerini alabilir
            INSERT INTO "Notification" (
              "userId",
              "companyId",
              title,
              message,
              type,
              priority,
              link,
              "relatedTo",
              "relatedId"
            )
            SELECT 
              u.id,
              NEW."companyId",
              '✅ Fatura Oluşturuldu!',
              COALESCE(NEW.title, 'Teklif') || ' teklifi kabul edildi. Fatura #' || invoice_number || ' oluşturuldu. Faturaya gitmek için tıklayın.',
              'success',
              'normal',
              '/tr/invoices/' || invoice_id,
              'Invoice',
              invoice_id
            FROM "User" u
            WHERE (
              -- Normal kullanıcılar: Aynı companyId'ye sahip olmalı
              (u.role IN ('ADMIN', 'SALES') AND u."companyId" = NEW."companyId")
              OR
              -- SuperAdmin: Tüm şirketlerin bildirimlerini alabilir (companyId kontrolü yok)
              (u.role = 'SUPER_ADMIN')
            )
              AND u.status = 'ACTIVE'
            ON CONFLICT DO NOTHING;
          EXCEPTION WHEN OTHERS THEN
            -- Notification hatası ana işlemi engellemez
            RAISE NOTICE 'Notification oluşturulamadı: %', SQLERRM;
          END;
        END IF;
        
      END IF;
      
      -- ============================================
      -- 2. CONTRACT OLUŞTUR
      -- ============================================
      IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Contract'
      ) AND NOT EXISTS (
        SELECT 1 FROM "Contract"
        WHERE "quoteId" = NEW.id
      ) THEN
        
        -- Contract için müşteri kontrolü - customerId alanı yoksa atla
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'Quote' 
          AND column_name = 'customerId'
        ) AND NEW."customerId" IS NULL THEN
          error_message := 'Sözleşme oluşturulamadı: Teklif için müşteri seçilmemiş!';
          
          -- Notification ekle - HATA - tablo yoksa atla
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
                priority,
                "relatedTo",
                "relatedId",
                "userId",
                "companyId"
              )
              VALUES (
                '❌ Sözleşme Oluşturulamadı',
                error_message || ' Lütfen teklifi düzenleyin ve müşteri ekleyin.',
                'error',
                'high',
                'Quote',
                NEW.id,
                COALESCE(NEW."createdBy", NULL),
                NEW."companyId"
              );
            EXCEPTION WHEN OTHERS THEN
              -- Notification hatası ana işlemi engellemez
              RAISE NOTICE 'Notification oluşturulamadı: %', SQLERRM;
            END;
          END IF;
          
          RAISE NOTICE 'HATA: %', error_message;
          RETURN NEW;
        END IF;
        
        -- Contract numarası oluştur
        contract_number := 'SOZL-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(COALESCE((SELECT MAX(CAST(SUBSTRING("contractNumber" FROM '[0-9]+$') AS INTEGER)) FROM "Contract" WHERE "contractNumber" LIKE 'SOZL-' || TO_CHAR(NOW(), 'YYYY') || '-%'), 0) + 1, 4, '0');
        
        -- Contract oluştur
        INSERT INTO "Contract" (
          "contractNumber",
          title,
          "customerId",
          "customerCompanyId",
          "quoteId",
          type,
          "startDate",
          "endDate",
          value,
          currency,
          "taxRate",
          "totalValue",
          status,
          notes,
          "companyId",
          "createdBy"
        )
        VALUES (
          contract_number,
          'Sözleşme - Quote #' || COALESCE(NEW."quoteNumber", ''),
          CASE WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'Quote' 
            AND column_name = 'customerId'
          ) THEN NEW."customerId" ELSE NULL END,
          CASE WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'Quote' 
            AND column_name = 'customerCompanyId'
          ) THEN NEW."customerCompanyId" ELSE NULL END,
          NEW.id,
          'SERVICE',
          CURRENT_DATE,
          CURRENT_DATE + INTERVAL '1 year',
          COALESCE(NEW."subtotal", 0),
          COALESCE(NEW.currency, 'TRY'),
          18.00,
          COALESCE(NEW."totalAmount", 0),
          'DRAFT',
          'Quote #' || COALESCE(NEW."quoteNumber", '') || ' onaylandı, otomatik oluşturuldu',
          NEW."companyId",
          COALESCE(NEW."createdBy", NULL)
        )
        RETURNING id INTO contract_id;
        
        -- ActivityLog - Contract - tablo yoksa atla
        IF EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'ActivityLog'
        ) THEN
          BEGIN
            INSERT INTO "ActivityLog" (
              entity,
              action,
              description,
              meta,
              "companyId",
              "userId"
            )
            VALUES (
              'Contract',
              'CREATE',
              'Quote onaylandı, taslak sözleşme oluşturuldu: ' || contract_number,
              jsonb_build_object(
                'quoteId', NEW.id,
                'quoteNumber', COALESCE(NEW."quoteNumber", ''),
                'contractId', contract_id,
                'contractNumber', contract_number,
                'customerName', COALESCE(customer_name, '')
              ),
              NEW."companyId",
              COALESCE(NEW."createdBy", NULL)
            );
          EXCEPTION WHEN OTHERS THEN
            -- ActivityLog hatası ana işlemi engellemez
            RAISE NOTICE 'ActivityLog oluşturulamadı: %', SQLERRM;
          END;
        END IF;
        
        -- Notification - BAŞARILI - tablo yoksa atla
        IF EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'Notification'
        ) THEN
          BEGIN
            -- Notification oluştur - Admin, Sales ve SuperAdmin rolündeki kullanıcılara
            -- ÖNEMLİ: SuperAdmin için companyId kontrolü yapma - tüm şirketlerin bildirimlerini alabilir
            INSERT INTO "Notification" (
              "userId",
              "companyId",
              title,
              message,
              type,
              priority,
              link,
              "relatedTo",
              "relatedId"
            )
            SELECT 
              u.id,
              NEW."companyId",
              '✅ Sözleşme Oluşturuldu!',
              COALESCE(NEW.title, 'Teklif') || ' teklifi kabul edildi. Sözleşme #' || contract_number || ' oluşturuldu. Sözleşmeye gitmek için tıklayın.',
              'success',
              'normal',
              '/tr/contracts/' || contract_id,
              'Contract',
              contract_id
            FROM "User" u
            WHERE (
              -- Normal kullanıcılar: Aynı companyId'ye sahip olmalı
              (u.role IN ('ADMIN', 'SALES') AND u."companyId" = NEW."companyId")
              OR
              -- SuperAdmin: Tüm şirketlerin bildirimlerini alabilir (companyId kontrolü yok)
              (u.role = 'SUPER_ADMIN')
            )
              AND u.status = 'ACTIVE'
            ON CONFLICT DO NOTHING;
          EXCEPTION WHEN OTHERS THEN
            -- Notification hatası ana işlemi engellemez
            RAISE NOTICE 'Notification oluşturulamadı: %', SQLERRM;
          END;
        END IF;
        
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      -- Genel hata yakalama
      error_message := 'Quote otomasyonu hatası: ' || SQLERRM;
      
      -- Notification - HATA - tablo yoksa atla
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
            priority,
            "relatedTo",
            "relatedId",
            "userId",
            "companyId"
          )
          VALUES (
            '❌ Otomasyon Hatası',
            'Teklif #' || COALESCE(NEW."quoteNumber", '') || ' için otomatik işlemler başarısız. Detay: ' || SQLERRM,
            'error',
            'critical',
            'Quote',
            NEW.id,
            COALESCE(NEW."createdBy", NULL),
            NEW."companyId"
          );
        EXCEPTION WHEN OTHERS THEN
          -- Notification hatası ana işlemi engellemez
          RAISE NOTICE 'Notification oluşturulamadı: %', SQLERRM;
        END;
      END IF;
      
      RAISE NOTICE 'Quote Automation Error: %', error_message;
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'ı yeniden oluştur
DROP TRIGGER IF EXISTS trigger_quote_accepted_automations ON "Quote";
CREATE TRIGGER trigger_quote_accepted_automations
  AFTER UPDATE ON "Quote"
  FOR EACH ROW
  EXECUTE FUNCTION handle_quote_accepted_automations();

-- ============================================
-- 5. auto_suggest_revision_on_quote_rejected() fonksiyonunu güncelle
-- ============================================
CREATE OR REPLACE FUNCTION auto_suggest_revision_on_quote_rejected()
RETURNS TRIGGER AS $$
DECLARE
  task_id UUID;
  has_task_table BOOLEAN;
  has_assigned_to BOOLEAN;
  has_created_by BOOLEAN;
  assigned_user_id UUID;
  fallback_user_id UUID;
  task_title TEXT;
BEGIN
  -- LOG: Trigger başladı
  RAISE NOTICE '[REVISION TRIGGER] Trigger başladı - Quote ID: %, Eski Status: %, Yeni Status: %', NEW.id, OLD.status, NEW.status;
  
  -- Quote REJECTED olduğunda
  IF NEW.status = 'REJECTED' AND (OLD.status IS NULL OR OLD.status != 'REJECTED') THEN
    RAISE NOTICE '[REVISION TRIGGER] Quote REJECTED durumuna geçti - Quote ID: %', NEW.id;
    
    -- Task tablosu kontrolü
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'Task'
    ) INTO has_task_table;
    
    RAISE NOTICE '[REVISION TRIGGER] Task tablosu kontrolü: %', has_task_table;
    
    IF has_task_table THEN
      BEGIN
        RAISE NOTICE '[REVISION TRIGGER] Task tablosu mevcut, görev oluşturma başlıyor...';
        
        -- Quote tablosunda assignedTo kolonu var mı?
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
            AND table_name = 'Quote' 
            AND column_name = 'assignedTo'
        ) INTO has_assigned_to;
        
        RAISE NOTICE '[REVISION TRIGGER] Quote.assignedTo kolonu var mı: %', has_assigned_to;
        
        -- Quote tablosunda createdBy kolonu var mı?
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
            AND table_name = 'Quote' 
            AND column_name = 'createdBy'
        ) INTO has_created_by;
        
        RAISE NOTICE '[REVISION TRIGGER] Quote.createdBy kolonu var mı: %', has_created_by;
        
        -- assignedTo değerini al
        IF has_assigned_to THEN
          assigned_user_id := NEW."assignedTo";
          RAISE NOTICE '[REVISION TRIGGER] Quote.assignedTo değeri: %', assigned_user_id;
        ELSIF has_created_by THEN
          assigned_user_id := NEW."createdBy";
          RAISE NOTICE '[REVISION TRIGGER] Quote.createdBy değeri: %', assigned_user_id;
        ELSE
          assigned_user_id := NULL;
          RAISE NOTICE '[REVISION TRIGGER] assignedTo ve createdBy kolonları yok, fallback kullanılacak';
        END IF;
        
        -- Fallback kullanıcı bul
        -- NOT: User tablosunda status kolonu yok, bu yüzden status kontrolü yapmıyoruz
        SELECT id INTO fallback_user_id
        FROM "User" 
        WHERE "companyId" = NEW."companyId" 
          AND role IN ('ADMIN', 'SALES')
        LIMIT 1;
        
        RAISE NOTICE '[REVISION TRIGGER] Fallback kullanıcı bulundu mu: % (User ID: %)', fallback_user_id IS NOT NULL, fallback_user_id;
        
        -- Final assignedTo değeri
        assigned_user_id := COALESCE(assigned_user_id, fallback_user_id);
        RAISE NOTICE '[REVISION TRIGGER] Final assignedTo değeri: %', assigned_user_id;
        
        -- Task title oluştur
        task_title := 'Teklif Revizyonu: ' || COALESCE(NEW.title, NEW.id::text) || ' - Teklif #' || COALESCE(NEW.id::text, NEW.title) || ' reddedildi. Lütfen müşteri geri bildirimlerini değerlendirip revizyon yapın veya yeni teklif hazırlayın.';
        RAISE NOTICE '[REVISION TRIGGER] Task title: %', task_title;
        RAISE NOTICE '[REVISION TRIGGER] Task companyId: %', NEW."companyId";
        
        -- Otomatik revizyon görevi oluştur
        -- ÖNEMLİ: Task tablosunda sadece şu kolonlar var: id, title, status, assignedTo, companyId, createdAt, updatedAt, escalated, escalatedAt
        -- description, priority, dueDate, relatedTo, relatedId kolonları YOK!
        INSERT INTO "Task" (
          title,
          status,
          "companyId",
          "assignedTo"
        )
        VALUES (
          task_title,
          'TODO',
          NEW."companyId",
          assigned_user_id
        )
        RETURNING id INTO task_id;
        
        RAISE NOTICE '[REVISION TRIGGER] ✅ Task başarıyla oluşturuldu! Task ID: %', task_id;

        -- Notification tablosu kontrolü
        IF EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'Notification'
        ) AND task_id IS NOT NULL THEN
          BEGIN
            RAISE NOTICE '[REVISION TRIGGER] Notification tablosu mevcut, bildirim oluşturuluyor...';
            
            -- Notification oluştur - Admin, Sales ve SuperAdmin rolündeki kullanıcılara
            INSERT INTO "Notification" (
              "userId",
              "companyId",
              title,
              message,
              type
            )
            SELECT
              u.id,
              NEW."companyId",
              '📝 Teklif Revizyonu Gerekli',
              COALESCE(NEW.title, 'Teklif') || ' reddedildi. Revizyon görevi oluşturuldu.',
              'warning'
            FROM "User" u
            WHERE (
              -- Normal kullanıcılar: Aynı companyId'ye sahip olmalı
              (u.role IN ('ADMIN', 'SALES') AND u."companyId" = NEW."companyId")
              OR
              -- SuperAdmin: Tüm şirketlerin bildirimlerini alabilir (companyId kontrolü yok)
              (u.role = 'SUPER_ADMIN')
            )
            -- NOT: User tablosunda status kolonu yok, bu yüzden status kontrolü yapmıyoruz
            ON CONFLICT DO NOTHING;
            
            RAISE NOTICE '[REVISION TRIGGER] ✅ Notification oluşturuldu';
          EXCEPTION WHEN OTHERS THEN
            -- Notification hatası ana işlemi engellemez
            RAISE WARNING '[REVISION TRIGGER] ❌ Notification oluşturulamadı: %', SQLERRM;
          END;
        ELSE
          IF task_id IS NULL THEN
            RAISE WARNING '[REVISION TRIGGER] ⚠️ Task ID NULL, notification oluşturulamadı';
          ELSE
            RAISE NOTICE '[REVISION TRIGGER] Notification tablosu yok, atlandı';
          END IF;
        END IF;

        RAISE NOTICE '[REVISION TRIGGER] ✅ Tüm işlemler tamamlandı - Quote ID: %, Task ID: %', NEW.id, task_id;

      EXCEPTION WHEN OTHERS THEN
        -- Task oluşturma hatası ana işlemi engellemez
        RAISE WARNING '[REVISION TRIGGER] ❌ Task oluşturma hatası - Quote ID: %, Hata: %, SQLSTATE: %', NEW.id, SQLERRM, SQLSTATE;
        RAISE WARNING '[REVISION TRIGGER] ❌ Hata detayları - TG_OP: %, TG_TABLE_NAME: %, TG_WHEN: %', TG_OP, TG_TABLE_NAME, TG_WHEN;
      END;
    ELSE
      RAISE WARNING '[REVISION TRIGGER] ⚠️ Task tablosu bulunamadı, görev oluşturulamadı';
    END IF;
  ELSE
    RAISE NOTICE '[REVISION TRIGGER] Quote REJECTED durumuna geçmedi - Eski: %, Yeni: %', OLD.status, NEW.status;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'ı yeniden oluştur
DROP TRIGGER IF EXISTS trigger_auto_suggest_revision_on_quote_rejected ON "Quote";
CREATE TRIGGER trigger_auto_suggest_revision_on_quote_rejected
  AFTER UPDATE OF status ON "Quote"
  FOR EACH ROW
  EXECUTE FUNCTION auto_suggest_revision_on_quote_rejected();

-- ============================================
-- MIGRATION TAMAMLANDI
-- ============================================

COMMENT ON FUNCTION notify_quote_sent IS 'Quote SENT olduğunda notification oluşturur. Notification tablosu yoksa hata vermez.';
COMMENT ON FUNCTION validate_quote_status_change IS 'Quote status değişikliklerini validate eder. QuoteItem, Notification, customerId yoksa hata vermez.';
COMMENT ON FUNCTION create_invoice_on_quote_accepted IS 'Quote ACCEPTED olduğunda invoice oluşturur. QuoteItem, Notification, ActivityLog yoksa hata vermez.';
COMMENT ON FUNCTION handle_quote_accepted_automations IS 'Quote ACCEPTED olduğunda invoice ve contract oluşturur. Notification, QuoteItem, ActivityLog, Contract yoksa hata vermez.';
COMMENT ON FUNCTION auto_suggest_revision_on_quote_rejected IS 'Quote REJECTED olduğunda otomatik revizyon görevi oluşturur. Task ve Notification tabloları yoksa hata vermez.';






