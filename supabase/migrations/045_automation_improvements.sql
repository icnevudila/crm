-- ============================================
-- 045_automation_improvements.sql
-- Otomasyonları İyileştir + Hata Mesajları Ekle
-- ============================================

-- ============================================
-- PART 1: Quote ACCEPTED → Invoice + Contract
-- ============================================
-- Önceki versiyonu güncelle - daha detaylı hata yönetimi

CREATE OR REPLACE FUNCTION handle_quote_accepted_automations()
RETURNS TRIGGER AS $$
DECLARE
  invoice_number VARCHAR;
  contract_number VARCHAR;
  invoice_id UUID;
  contract_id UUID;
  customer_name VARCHAR;
  error_message TEXT;
BEGIN
  -- Quote ACCEPTED oldu
  IF NEW.status = 'ACCEPTED' AND (OLD.status IS NULL OR OLD.status != 'ACCEPTED') THEN
    
    BEGIN
      -- Müşteri bilgisini al
      SELECT name INTO customer_name FROM "Customer" WHERE id = NEW."customerId";
      
      -- ============================================
      -- 1. INVOICE OLUŞTUR
      -- ============================================
      -- Zaten invoice var mı kontrol et
      IF NOT EXISTS (
        SELECT 1 FROM "Invoice"
        WHERE "quoteId" = NEW.id
      ) THEN
        
        -- Invoice için müşteri kontrolü
        IF NEW."customerId" IS NULL THEN
          error_message := 'Invoice oluşturulamadı: Teklif için müşteri seçilmemiş!';
          
          -- Notification ekle - HATA
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
            NEW."createdBy",
            NEW."companyId"
          );
          
          RAISE NOTICE 'HATA: %', error_message;
          RETURN NEW; -- Hata olsa da Quote'u güncellemeye devam et
        END IF;
        
        -- Invoice numarası oluştur
        invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(COALESCE((SELECT MAX(CAST(SUBSTRING("invoiceNumber" FROM '[0-9]+$') AS INTEGER)) FROM "Invoice" WHERE "invoiceNumber" LIKE 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-%'), 0) + 1, 4, '0');
        
        -- Invoice oluştur
        -- ÖNEMLİ: customerCompanyId kolonu Quote tablosunda olmayabilir, kontrol et
        INSERT INTO "Invoice" (
          "invoiceNumber",
          "quoteId",
          "customerId",
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
          NEW."customerId",
          CURRENT_DATE,
          CURRENT_DATE + INTERVAL '30 days', -- 30 gün vade
          NEW."subtotal",
          NEW."taxAmount",
          NEW."totalAmount",
          COALESCE(NEW.currency, 'TRY'),
          'DRAFT',
          'Quote #' || NEW."quoteNumber" || ' onaylandı, otomatik oluşturuldu',
          NEW."companyId",
          NEW."createdBy"
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
        
        -- ActivityLog - Invoice
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
            'quoteNumber', NEW."quoteNumber",
            'invoiceId', invoice_id,
            'invoiceNumber', invoice_number,
            'customerName', customer_name
          ),
          NEW."companyId",
          NEW."createdBy"
        );
        
        -- Notification - BAŞARILI
        INSERT INTO "Notification" (
          title,
          message,
          type,
          priority,
          link,
          "relatedTo",
          "relatedId",
          "userId",
          "companyId"
        )
        VALUES (
          '✅ Fatura Oluşturuldu!',
          'Teklif #' || NEW."quoteNumber" || ' onaylandı. Fatura #' || invoice_number || ' otomatik oluşturuldu.',
          'success',
          'normal',
          '/invoices/' || invoice_id,
          'Invoice',
          invoice_id,
          NEW."createdBy",
          NEW."companyId"
        );
        
      END IF;
      
      -- ============================================
      -- 2. CONTRACT OLUŞTUR
      -- ============================================
      IF NOT EXISTS (
        SELECT 1 FROM "Contract"
        WHERE "quoteId" = NEW.id
      ) THEN
        
        -- Contract için müşteri kontrolü
        IF NEW."customerId" IS NULL THEN
          error_message := 'Sözleşme oluşturulamadı: Teklif için müşteri seçilmemiş!';
          
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
            NEW."createdBy",
            NEW."companyId"
          );
          
          RAISE NOTICE 'HATA: %', error_message;
          RETURN NEW;
        END IF;
        
        -- Contract numarası oluştur
        contract_number := 'SOZL-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(COALESCE((SELECT MAX(CAST(SUBSTRING("contractNumber" FROM '[0-9]+$') AS INTEGER)) FROM "Contract" WHERE "contractNumber" LIKE 'SOZL-' || TO_CHAR(NOW(), 'YYYY') || '-%'), 0) + 1, 4, '0');
        
        -- Contract oluştur
        -- ÖNEMLİ: customerCompanyId kolonu Quote tablosunda olmayabilir, kontrol et
        INSERT INTO "Contract" (
          "contractNumber",
          title,
          "customerId",
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
          'Sözleşme - Quote #' || NEW."quoteNumber",
          NEW."customerId",
          NEW.id,
          'SERVICE',
          CURRENT_DATE,
          CURRENT_DATE + INTERVAL '1 year',
          NEW."subtotal",
          COALESCE(NEW.currency, 'TRY'),
          18.00,
          NEW."totalAmount",
          'DRAFT',
          'Quote #' || NEW."quoteNumber" || ' onaylandı, otomatik oluşturuldu',
          NEW."companyId",
          NEW."createdBy"
        )
        RETURNING id INTO contract_id;
        
        -- ActivityLog - Contract
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
            'quoteNumber', NEW."quoteNumber",
            'contractId', contract_id,
            'contractNumber', contract_number,
            'customerName', customer_name
          ),
          NEW."companyId",
          NEW."createdBy"
        );
        
        -- Notification - BAŞARILI
        INSERT INTO "Notification" (
          title,
          message,
          type,
          priority,
          link,
          "relatedTo",
          "relatedId",
          "userId",
          "companyId"
        )
        VALUES (
          '✅ Sözleşme Oluşturuldu!',
          'Teklif #' || NEW."quoteNumber" || ' onaylandı. Sözleşme #' || contract_number || ' otomatik oluşturuldu.',
          'success',
          'normal',
          '/contracts/' || contract_id,
          'Contract',
          contract_id,
          NEW."createdBy",
          NEW."companyId"
        );
        
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      -- Genel hata yakalama
      error_message := 'Quote otomasyonu hatası: ' || SQLERRM;
      
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
        'Teklif #' || NEW."quoteNumber" || ' için otomatik işlemler başarısız. Detay: ' || SQLERRM,
        'error',
        'critical',
        'Quote',
        NEW.id,
        NEW."createdBy",
        NEW."companyId"
      );
      
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
-- PART 2: Deal WON → Contract İyileştirme
-- ============================================

CREATE OR REPLACE FUNCTION create_contract_on_deal_won()
RETURNS TRIGGER AS $$
DECLARE
  contract_number VARCHAR;
  contract_id UUID;
  customer_name VARCHAR;
  error_message TEXT;
  has_notification_table BOOLEAN;
BEGIN
  -- Notification tablosu var mı kontrol et
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'Notification'
  ) INTO has_notification_table;
  
  -- Deal WON oldu
  IF NEW.stage = 'WON' AND (OLD.stage IS NULL OR OLD.stage != 'WON') THEN
    
    BEGIN
      -- Müşteri kontrolü
      IF NEW."customerId" IS NULL THEN
        error_message := 'Sözleşme oluşturulamadı: Fırsat için müşteri seçilmemiş!';
        
        -- Notification: Sadece tablo varsa ekle
        IF has_notification_table THEN
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
              error_message || ' Lütfen fırsatı düzenleyin ve müşteri ekleyin.',
              'error',
              'high',
              'Deal',
              NEW.id,
              NEW."createdBy",
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
      
      -- Müşteri adını al
      SELECT name INTO customer_name FROM "Customer" WHERE id = NEW."customerId";
      
      -- Zaten contract var mı kontrol et
      IF NOT EXISTS (
        SELECT 1 FROM "Contract"
        WHERE "dealId" = NEW.id
      ) THEN
        -- Contract number oluştur
        contract_number := 'SOZL-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(COALESCE((SELECT MAX(CAST(SUBSTRING("contractNumber" FROM '[0-9]+$') AS INTEGER)) FROM "Contract" WHERE "contractNumber" LIKE 'SOZL-' || TO_CHAR(NOW(), 'YYYY') || '-%'), 0) + 1, 4, '0');
        
        -- Contract oluştur
        -- ÖNEMLİ: customerCompanyId kolonu Contract tablosunda var, Deal'dan al
        INSERT INTO "Contract" (
          "contractNumber",
          title,
          "customerId",
          "customerCompanyId",
          "dealId",
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
          'Sözleşme - ' || COALESCE(NEW.title, 'Başlıksız'),
          NEW."customerId",
          NEW."customerCompanyId", -- Deal'dan al, NULL olabilir
          NEW.id,
          'SERVICE',
          CURRENT_DATE,
          CURRENT_DATE + INTERVAL '1 year',
          NEW.value,
          COALESCE(NEW.currency, 'TRY'),
          18.00,
          NEW.value * 1.18,
          'DRAFT',
          'Deal ' || COALESCE(NEW.title, 'Başlıksız') || ' kazanıldı, otomatik oluşturuldu',
          NEW."companyId",
          NEW."createdBy"
        )
        RETURNING id INTO contract_id;
        
        -- ActivityLog
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
          'Deal kazanıldı, taslak sözleşme oluşturuldu: ' || contract_number,
          jsonb_build_object(
            'dealId', NEW.id,
            'dealTitle', NEW.title,
            'contractId', contract_id,
            'contractNumber', contract_number,
            'customerName', customer_name
          ),
          NEW."companyId",
          NEW."createdBy"
        );
        
        -- Notification - BAŞARILI (sadece tablo varsa)
        IF has_notification_table THEN
          BEGIN
            INSERT INTO "Notification" (
              title,
              message,
              type,
              priority,
              link,
              "relatedTo",
              "relatedId",
              "userId",
              "companyId"
            )
            VALUES (
              '🎉 Tebrikler! Sözleşme Oluşturuldu',
              'Fırsat "' || COALESCE(NEW.title, 'Başlıksız') || '" kazanıldı! Sözleşme #' || contract_number || ' otomatik oluşturuldu. Şimdi sözleşmeyi tamamlayıp aktif edebilirsiniz.',
              'success',
              'high',
              '/contracts/' || contract_id,
              'Contract',
              contract_id,
              NEW."createdBy",
              NEW."companyId"
            );
          EXCEPTION WHEN OTHERS THEN
            -- Notification hatası ana işlemi engellemez
            RAISE NOTICE 'Notification oluşturulamadı: %', SQLERRM;
          END;
        END IF;
      END IF; -- IF NOT EXISTS (Contract kontrolü) bloğunu kapat
      
    EXCEPTION WHEN OTHERS THEN
      error_message := 'Deal WON otomasyonu hatası: ' || SQLERRM;
      
      -- Notification: Sadece tablo varsa ekle
      IF has_notification_table THEN
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
            'Fırsat "' || COALESCE(NEW.title, 'Başlıksız') || '" için sözleşme oluşturulamadı. Detay: ' || SQLERRM,
            'error',
            'critical',
            'Deal',
            NEW.id,
            NEW."createdBy",
            NEW."companyId"
          );
        EXCEPTION WHEN OTHERS THEN
          -- Notification hatası ana işlemi engellemez
          RAISE NOTICE 'Notification oluşturulamadı: %', SQLERRM;
        END;
      END IF;
      
      RAISE WARNING 'Deal WON otomasyonu hatası: %', error_message;
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger güncelle
DROP TRIGGER IF EXISTS trigger_deal_won_create_contract ON "Deal";
CREATE TRIGGER trigger_deal_won_create_contract
  AFTER UPDATE ON "Deal"
  FOR EACH ROW
  EXECUTE FUNCTION create_contract_on_deal_won();

-- ============================================
-- PART 3: Invoice PAID → Finance Entry
-- ============================================

CREATE OR REPLACE FUNCTION handle_invoice_paid_finance_entry()
RETURNS TRIGGER AS $$
DECLARE
  finance_id UUID;
  customer_name VARCHAR;
  error_message TEXT;
  has_notification_table BOOLEAN;
BEGIN
  -- Notification tablosu var mı kontrol et
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'Notification'
  ) INTO has_notification_table;
  -- Invoice PAID oldu
  IF NEW.status = 'PAID' AND (OLD.status IS NULL OR OLD.status != 'PAID') THEN
    
    BEGIN
      -- Müşteri kontrolü
      IF NEW."customerId" IS NULL THEN
        error_message := 'Finans kaydı oluşturulamadı: Fatura için müşteri bilgisi eksik!';
        
        -- Notification: Sadece tablo varsa ekle
        IF has_notification_table THEN
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
              '⚠️ Finans Kaydı Oluşturulamadı',
              error_message,
              'warning',
              'high',
              'Invoice',
              NEW.id,
              NEW."createdBy",
              NEW."companyId"
            );
          EXCEPTION WHEN OTHERS THEN
            -- Notification hatası ana işlemi engellemez
            RAISE NOTICE 'Notification oluşturulamadı: %', SQLERRM;
          END;
        END IF;
        
        RAISE NOTICE 'UYARI: %', error_message;
        RETURN NEW;
      END IF;
      
      -- Müşteri adını al
      SELECT name INTO customer_name FROM "Customer" WHERE id = NEW."customerId";
      
      -- Zaten Finance kaydı var mı (hem eski hem yeni kolon adlarını kontrol et)
      IF NOT EXISTS (
        SELECT 1 FROM "Finance"
        WHERE (
          ("relatedEntityType" = 'Invoice' AND "relatedEntityId" = NEW.id)
          OR ("relatedTo" = 'Invoice' AND "relatedId" = NEW.id)
        )
      ) THEN
        
        -- Finance kaydı oluştur (INCOME) - En güncel kolon adlarını kullan
        INSERT INTO "Finance" (
          type,
          category,
          amount,
          currency,
          description,
          "transactionDate",
          "paymentMethod",
          status,
          "relatedEntityType",
          "relatedEntityId",
          "companyId",
          "createdBy"
        )
        VALUES (
          'INCOME',
          'SALES',
          NEW."totalAmount",
          COALESCE(NEW.currency, 'TRY'),
          'Fatura #' || NEW."invoiceNumber" || ' tahsil edildi' || CASE WHEN customer_name IS NOT NULL THEN ' - ' || customer_name ELSE '' END,
          COALESCE(NEW."paidDate", CURRENT_DATE),
          'BANK_TRANSFER',
          'COMPLETED',
          'Invoice',
          NEW.id,
          NEW."companyId",
          NEW."createdBy"
        )
        RETURNING id INTO finance_id;
        
        -- ActivityLog
        INSERT INTO "ActivityLog" (
          entity,
          action,
          description,
          meta,
          "companyId",
          "userId"
        )
        VALUES (
          'Finance',
          'CREATE',
          'Fatura ödendi, finans kaydı oluşturuldu',
          jsonb_build_object(
            'invoiceId', NEW.id,
            'invoiceNumber', NEW."invoiceNumber",
            'financeId', finance_id,
            'amount', NEW."totalAmount",
            'currency', NEW.currency,
            'customerName', customer_name
          ),
          NEW."companyId",
          NEW."createdBy"
        );
        
        -- Notification - BAŞARILI (sadece tablo varsa)
        IF has_notification_table THEN
          BEGIN
            INSERT INTO "Notification" (
              title,
              message,
              type,
              priority,
              link,
              "relatedTo",
              "relatedId",
              "userId",
              "companyId"
            )
            VALUES (
              '💰 Ödeme Alındı!',
              'Fatura #' || NEW."invoiceNumber" || ' ödendi. ' || NEW."totalAmount" || ' ' || COALESCE(NEW.currency, 'TRY') || ' tutarında gelir kaydı oluşturuldu.',
              'success',
              'high',
              '/finance/' || finance_id,
              'Finance',
              finance_id,
              NEW."createdBy",
              NEW."companyId"
            );
          EXCEPTION WHEN OTHERS THEN
            -- Notification hatası ana işlemi engellemez
            RAISE NOTICE 'Notification oluşturulamadı: %', SQLERRM;
          END;
        END IF;
        
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      error_message := 'Invoice PAID otomasyonu hatası: ' || SQLERRM;
      
      -- Notification: Sadece tablo varsa ekle
      IF has_notification_table THEN
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
            '❌ Finans Kaydı Hatası',
            'Fatura #' || NEW."invoiceNumber" || ' için finans kaydı oluşturulamadı. Detay: ' || SQLERRM,
            'error',
            'critical',
            'Invoice',
            NEW.id,
            NEW."createdBy",
            NEW."companyId"
          );
        EXCEPTION WHEN OTHERS THEN
          -- Notification hatası ana işlemi engellemez
          RAISE NOTICE 'Notification oluşturulamadı: %', SQLERRM;
        END;
      END IF;
      
      RAISE NOTICE 'Invoice PAID Automation Error: %', error_message;
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger güncelle
DROP TRIGGER IF EXISTS trigger_invoice_paid_finance_entry ON "Invoice";
CREATE TRIGGER trigger_invoice_paid_finance_entry
  AFTER UPDATE ON "Invoice"
  FOR EACH ROW
  EXECUTE FUNCTION handle_invoice_paid_finance_entry();

-- ============================================
-- PART 4: Kullanıcılara Genel Bilgi Notification
-- ============================================

-- Sistem başlangıcında kullanıcılara bilgilendirme (tek seferlik)
DO $$
BEGIN
  -- Notification tablosu yoksa atla
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'Notification'
  ) THEN
    -- ADMIN ve SUPER_ADMIN kullanıcılarına otomasyonlar hakkında bilgi ver
    INSERT INTO "Notification" (
      title,
      message,
      type,
      priority,
      "userId",
      "companyId"
    )
    SELECT
      '🚀 Otomatik İş Akışları Aktif!',
      'CRM sisteminizde otomatik işlemler çalışıyor:\n' ||
      '• Fırsat kazanılınca → Otomatik sözleşme\n' ||
      '• Teklif onaylanınca → Otomatik fatura + sözleşme\n' ||
      '• Fatura ödenince → Otomatik finans kaydı\n' ||
      'Herhangi bir sorun olursa bildirim alacaksınız!',
      'info',
      'normal',
      u.id,
      u."companyId"
    FROM "User" u
    WHERE u.role IN ('ADMIN', 'SUPER_ADMIN')
      AND NOT EXISTS (
        SELECT 1 FROM "Notification"
        WHERE "userId" = u.id
          AND title = '🚀 Otomatik İş Akışları Aktif!'
      );
  END IF;
END $$;

