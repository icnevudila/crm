-- ============================================
-- 060_quote_contract_customer_fallback.sql
-- Quote otomasyonunda müşteri bilgisi eksik olduğunda Deal'dan devral
-- ============================================

CREATE OR REPLACE FUNCTION handle_quote_accepted_automations()
RETURNS TRIGGER AS $$
DECLARE
  invoice_number VARCHAR;
  contract_number VARCHAR;
  invoice_id UUID;
  contract_id UUID;
  customer_name VARCHAR;
  error_message TEXT;
  effective_customer_id UUID;
  effective_customer_company_id UUID;
  has_notification_table BOOLEAN;
  formatted_total TEXT;
  currency_code TEXT;
BEGIN
  -- Quote ACCEPTED oldu
  IF NEW.status = 'ACCEPTED' AND (OLD.status IS NULL OR OLD.status != 'ACCEPTED') THEN
    
    BEGIN
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'Notification'
      ) INTO has_notification_table;
      
      -- Quote üzerinde müşteri yoksa Deal'dan devral
      effective_customer_id := NEW."customerId";
      effective_customer_company_id := NEW."customerCompanyId";
      
      IF effective_customer_id IS NULL AND NEW."dealId" IS NOT NULL THEN
        SELECT d."customerId", d."customerCompanyId"
        INTO effective_customer_id, effective_customer_company_id
        FROM "Deal" d
        WHERE d.id = NEW."dealId"
          AND d."companyId" = NEW."companyId";
      END IF;
      
      IF effective_customer_id IS NOT NULL THEN
        SELECT name INTO customer_name FROM "Customer" WHERE id = effective_customer_id;
      ELSE
        customer_name := NULL;
      END IF;
      currency_code := COALESCE(NEW.currency, 'TRY');
      formatted_total := TO_CHAR(COALESCE(NEW."totalAmount", 0), 'FM999G999G999G990D00');
      
      -- ============================================
      -- 1. INVOICE OLUŞTUR
      -- ============================================
      IF NOT EXISTS (
        SELECT 1 FROM "Invoice"
        WHERE "quoteId" = NEW.id
      ) THEN
        
        -- Invoice için müşteri kontrolü
        IF effective_customer_id IS NULL THEN
          error_message := 'Invoice oluşturulamadı: Teklif için müşteri seçilmemiş (Deal kaydında da bulunamadı)!';
          IF has_notification_table THEN
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
              error_message || ' Lütfen teklifi veya ilgili fırsatı düzenleyip müşteri ekleyin.',
              'error',
              'high',
              'Quote',
              NEW.id,
              NEW."createdBy",
              NEW."companyId"
            );
          END IF;
          
          RAISE NOTICE 'HATA: %', error_message;
          RETURN NEW;
        END IF;
        
        -- Invoice numarası oluştur
        invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(COALESCE((SELECT MAX(CAST(SUBSTRING("invoiceNumber" FROM '[0-9]+$') AS INTEGER)) FROM "Invoice" WHERE "invoiceNumber" LIKE 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-%'), 0) + 1, 4, '0');
        
        -- Invoice oluştur
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
          effective_customer_id,
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
        
        -- InvoiceItem tablosu varsa kalemleri ekle
        IF EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'InvoiceItem'
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
          
          -- Stok rezervasyonu güncelle
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
          'Quote onaylandı, otomatik fatura oluşturuldu: ' || invoice_number,
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
        IF has_notification_table THEN
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
            '📄 Fatura Oluşturuldu: #' || invoice_number,
            'Teklif #' || NEW."quoteNumber" || ' (' || COALESCE(customer_name, 'Müşteri belirtilmedi') || ') kabul edildi. Toplam tutar: ' || formatted_total || ' ' || currency_code || '. Fatura sayfasından detayları kontrol edin.',
            'success',
            'normal',
            '/invoices/' || invoice_id,
            'Invoice',
            invoice_id,
            NEW."createdBy",
            NEW."companyId"
          );
        END IF;
        
      END IF;
      
      -- ============================================
      -- 2. CONTRACT OLUŞTUR
      -- ============================================
      IF NOT EXISTS (
        SELECT 1 FROM "Contract"
        WHERE "quoteId" = NEW.id
      ) THEN
        
        -- Contract için müşteri kontrolü
        IF effective_customer_id IS NULL THEN
          error_message := 'Sözleşme oluşturulamadı: Teklif ve ilgili fırsatta müşteri bulunamadı!';
          IF has_notification_table THEN
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
              error_message || ' Lütfen teklifi veya fırsatı düzenleyip müşteri ekleyin.',
              'error',
              'high',
              'Quote',
              NEW.id,
              NEW."createdBy",
              NEW."companyId"
            );
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
          'Sözleşme - Quote #' || NEW."quoteNumber",
          effective_customer_id,
          effective_customer_company_id,
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
        
        -- Teklifle ilişkili ürün kalemlerini sözleşmeye taşı (varsa)
        IF EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' 
            AND table_name = 'QuoteItem'
        ) AND EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' 
            AND table_name = 'ContractTerm'
        ) THEN
          INSERT INTO "ContractTerm" (
            "contractId",
            title,
            content,
            "orderIndex",
            value,
            "companyId"
          )
          SELECT
            contract_id,
            COALESCE(qi.description, 'Sözleşme Kalemi'),
            CONCAT(
              'Ürün: ', COALESCE(p.name, 'Belirtilmedi'), '\n',
              'Miktar: ', qi.quantity, '\n',
              'Birim Fiyat: ', qi."unitPrice", ' ', COALESCE(NEW.currency, 'TRY')
            ),
            ROW_NUMBER() OVER (ORDER BY qi."createdAt"),
            qi."totalPrice",
            NEW."companyId"
          FROM "QuoteItem" qi
          LEFT JOIN "Product" p ON p.id = qi."productId"
          WHERE qi."quoteId" = NEW.id;
        END IF;
        
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
        IF has_notification_table THEN
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
            '📑 Sözleşme Oluşturuldu: #' || contract_number,
            'Teklif #' || NEW."quoteNumber" || ' (' || COALESCE(customer_name, 'Müşteri belirtilmedi') || ') için sözleşme oluşturuldu. Başlangıç: ' || TO_CHAR(CURRENT_DATE, 'DD.MM.YYYY') || ', Bitiş: ' || TO_CHAR(CURRENT_DATE + INTERVAL '1 year', 'DD.MM.YYYY') || '. Tutar: ' || formatted_total || ' ' || currency_code || '.',
            'success',
            'normal',
            '/contracts/' || contract_id,
            'Contract',
            contract_id,
            NEW."createdBy",
            NEW."companyId"
          );
        END IF;
        
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      -- Genel hata yakalama
      error_message := 'Quote otomasyonu hatası: ' || SQLERRM;
      
      IF has_notification_table THEN
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
      END IF;
      
      RAISE NOTICE 'Quote Automation Error: %', error_message;
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

