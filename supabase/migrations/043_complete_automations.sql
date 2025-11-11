-- ============================================
-- 043_complete_automations.sql
-- TÜM MODÜLLER İÇİN TAM OTOMASYON SİSTEMİ
-- ============================================
-- Bu dosya şunları yapar:
-- 1. Her modül için otomasyonlar
-- 2. ActivityLog kayıtları
-- 3. Notification gönderimi
-- 4. İlişkili kayıtların otomatik oluşturulması
-- 5. Hata kontrolü ve duplicate önleme
-- ============================================

-- ============================================
-- PART 1: CUSTOMER OTOMASYONLARI
-- ============================================

CREATE OR REPLACE FUNCTION handle_customer_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Customer oluşturulduğunda
  BEGIN
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
      'Customer',
      'CREATE',
      'Yeni müşteri oluşturuldu: ' || COALESCE(NEW.name, 'Başlıksız'),
      jsonb_build_object(
        'customerId', NEW.id,
        'customerName', NEW.name,
        'email', NEW.email,
        'phone', NEW.phone
      ),
      NEW."companyId",
      COALESCE(NEW."createdBy", (SELECT id FROM "User" WHERE "companyId" = NEW."companyId" LIMIT 1))
    );
    
    -- Notification (ADMIN/SALES)
    INSERT INTO "Notification" (
      title,
      message,
      type,
      "relatedTo",
      "relatedId",
      "companyId"
    )
    SELECT
      'Yeni Müşteri',
      NEW.name || ' müşterisi eklendi.',
      'info',
      'Customer',
      NEW.id,
      NEW."companyId"
    WHERE EXISTS (
      SELECT 1 FROM "User" 
      WHERE "companyId" = NEW."companyId" 
        AND role IN ('ADMIN', 'SALES', 'SUPER_ADMIN')
    )
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Customer created: %', NEW.id;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not create activity log for customer: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_customer_created ON "Customer";
CREATE TRIGGER trigger_customer_created
  AFTER INSERT ON "Customer"
  FOR EACH ROW
  EXECUTE FUNCTION handle_customer_created();

-- ============================================
-- PART 2: DEAL OTOMASYONLARI (Eksikler)
-- ============================================

CREATE OR REPLACE FUNCTION handle_deal_lost()
RETURNS TRIGGER AS $$
BEGIN
  -- Deal LOST olduğunda
  IF NEW.stage = 'LOST' AND (OLD.stage IS NULL OR OLD.stage != 'LOST') THEN
    
    BEGIN
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
        'Deal',
        'UPDATE',
        'Fırsat kaybedildi: ' || COALESCE(NEW.title, 'Başlıksız'),
        jsonb_build_object(
          'dealId', NEW.id,
          'dealTitle', NEW.title,
          'stage', NEW.stage,
          'lostReason', NEW."lostReason"
        ),
        NEW."companyId",
        COALESCE(NEW."createdBy", (SELECT id FROM "User" WHERE "companyId" = NEW."companyId" LIMIT 1))
      );
      
      -- Notification
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
      
      RAISE NOTICE 'Deal lost: %', NEW.id;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not create activity log for deal lost: %', SQLERRM;
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_deal_lost ON "Deal";
CREATE TRIGGER trigger_deal_lost
  AFTER UPDATE OF stage
  ON "Deal"
  FOR EACH ROW
  EXECUTE FUNCTION handle_deal_lost();

-- ============================================
-- PART 3: PRODUCT OTOMASYONLARI
-- ============================================

CREATE OR REPLACE FUNCTION handle_product_low_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- Stok düşük olduğunda (stock < minimumStock)
  IF NEW."minimumStock" IS NOT NULL AND NEW.stock IS NOT NULL 
     AND NEW.stock <= NEW."minimumStock" 
     AND (OLD.stock IS NULL OR OLD.stock > OLD."minimumStock") THEN
    
    BEGIN
      -- Notification (ADMIN/SALES)
      INSERT INTO "Notification" (
        title,
        message,
        type,
        "relatedTo",
        "relatedId",
        "companyId"
      )
      SELECT
        'Düşük Stok Uyarısı',
        NEW.name || ' ürününde stok düşük! Mevcut: ' || NEW.stock || ', Minimum: ' || NEW."minimumStock",
        'warning',
        'Product',
        NEW.id,
        NEW."companyId"
      WHERE EXISTS (
        SELECT 1 FROM "User" 
        WHERE "companyId" = NEW."companyId" 
          AND role IN ('ADMIN', 'SALES', 'SUPER_ADMIN')
      )
      ON CONFLICT DO NOTHING;
      
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
        'Product',
        'UPDATE',
        'Düşük stok uyarısı: ' || NEW.name,
        jsonb_build_object(
          'productId', NEW.id,
          'productName', NEW.name,
          'stock', NEW.stock,
          'minimumStock', NEW."minimumStock"
        ),
        NEW."companyId",
        COALESCE(NEW."createdBy", (SELECT id FROM "User" WHERE "companyId" = NEW."companyId" LIMIT 1))
      );
      
      RAISE NOTICE 'Low stock alert for product: %', NEW.id;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not create low stock notification: %', SQLERRM;
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_product_low_stock ON "Product";
CREATE TRIGGER trigger_product_low_stock
  AFTER UPDATE OF stock
  ON "Product"
  FOR EACH ROW
  EXECUTE FUNCTION handle_product_low_stock();

-- ============================================
-- PART 4: TASK OTOMASYONLARI
-- ============================================

CREATE OR REPLACE FUNCTION handle_task_assigned()
RETURNS TRIGGER AS $$
BEGIN
  -- Task atandığında
  IF NEW."assignedTo" IS NOT NULL 
     AND (OLD."assignedTo" IS NULL OR OLD."assignedTo" != NEW."assignedTo") THEN
    
    BEGIN
      -- Notification (Atanan kullanıcıya)
      INSERT INTO "Notification" (
        title,
        message,
        type,
        "relatedTo",
        "relatedId",
        "companyId"
      )
      VALUES (
        'Yeni Görev Atandı',
        COALESCE(NEW.title, 'Başlıksız') || ' görevi size atandı.',
        'info',
        'Task',
        NEW.id,
        NEW."companyId"
      )
      ON CONFLICT DO NOTHING;
      
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
        'Task',
        'UPDATE',
        'Görev atandı: ' || COALESCE(NEW.title, 'Başlıksız'),
        jsonb_build_object(
          'taskId', NEW.id,
          'taskTitle', NEW.title,
          'assignedTo', NEW."assignedTo"
        ),
        NEW."companyId",
        COALESCE(NEW."createdBy", (SELECT id FROM "User" WHERE "companyId" = NEW."companyId" LIMIT 1))
      );
      
      RAISE NOTICE 'Task assigned: %', NEW.id;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not create task assignment notification: %', SQLERRM;
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_task_assigned ON "Task";
CREATE TRIGGER trigger_task_assigned
  AFTER UPDATE OF "assignedTo"
  ON "Task"
  FOR EACH ROW
  EXECUTE FUNCTION handle_task_assigned();

CREATE OR REPLACE FUNCTION handle_task_completed()
RETURNS TRIGGER AS $$
BEGIN
  -- Task tamamlandığında
  IF NEW.status = 'DONE' AND (OLD.status IS NULL OR OLD.status != 'DONE') THEN
    
    BEGIN
      -- Notification (Görevi oluşturan ve atanan kişiye)
      INSERT INTO "Notification" (
        title,
        message,
        type,
        "relatedTo",
        "relatedId",
        "companyId"
      )
      VALUES (
        'Görev Tamamlandı',
        COALESCE(NEW.title, 'Başlıksız') || ' görevi tamamlandı.',
        'success',
        'Task',
        NEW.id,
        NEW."companyId"
      )
      ON CONFLICT DO NOTHING;
      
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
        'Task',
        'UPDATE',
        'Görev tamamlandı: ' || COALESCE(NEW.title, 'Başlıksız'),
        jsonb_build_object(
          'taskId', NEW.id,
          'taskTitle', NEW.title,
          'status', NEW.status
        ),
        NEW."companyId",
        COALESCE(NEW."assignedTo", NEW."createdBy", (SELECT id FROM "User" WHERE "companyId" = NEW."companyId" LIMIT 1))
      );
      
      RAISE NOTICE 'Task completed: %', NEW.id;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not create task completion notification: %', SQLERRM;
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_task_completed ON "Task";
CREATE TRIGGER trigger_task_completed
  AFTER UPDATE OF status
  ON "Task"
  FOR EACH ROW
  EXECUTE FUNCTION handle_task_completed();

-- ============================================
-- PART 5: TICKET OTOMASYONLARI
-- ============================================

CREATE OR REPLACE FUNCTION handle_ticket_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Ticket oluşturulduğunda
  BEGIN
    -- Notification (ADMIN/SALES - destek ekibi)
    INSERT INTO "Notification" (
      title,
      message,
      type,
      "relatedTo",
      "relatedId",
      "companyId"
    )
    SELECT
      'Yeni Destek Talebi',
      COALESCE(NEW.title, 'Başlıksız') || ' destek talebi oluşturuldu.',
      'info',
      'Ticket',
      NEW.id,
      NEW."companyId"
    WHERE EXISTS (
      SELECT 1 FROM "User" 
      WHERE "companyId" = NEW."companyId" 
        AND role IN ('ADMIN', 'SALES', 'SUPER_ADMIN')
    )
    ON CONFLICT DO NOTHING;
    
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
      'Ticket',
      'CREATE',
      'Yeni destek talebi oluşturuldu: ' || COALESCE(NEW.title, 'Başlıksız'),
      jsonb_build_object(
        'ticketId', NEW.id,
        'ticketTitle', NEW.title,
        'priority', NEW.priority,
        'customerId', NEW."customerId"
      ),
      NEW."companyId",
      COALESCE(NEW."createdBy", (SELECT id FROM "User" WHERE "companyId" = NEW."companyId" LIMIT 1))
    );
    
    RAISE NOTICE 'Ticket created: %', NEW.id;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not create activity log for ticket: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ticket_created ON "Ticket";
CREATE TRIGGER trigger_ticket_created
  AFTER INSERT ON "Ticket"
  FOR EACH ROW
  EXECUTE FUNCTION handle_ticket_created();

CREATE OR REPLACE FUNCTION handle_ticket_resolved()
RETURNS TRIGGER AS $$
BEGIN
  -- Ticket çözüldüğünde
  IF NEW.status = 'RESOLVED' AND (OLD.status IS NULL OR OLD.status != 'RESOLVED') THEN
    
    BEGIN
      -- Notification (Müşteriye)
      INSERT INTO "Notification" (
        title,
        message,
        type,
        "relatedTo",
        "relatedId",
        "companyId"
      )
      VALUES (
        'Destek Talebi Çözüldü',
        COALESCE(NEW.title, 'Başlıksız') || ' destek talebi çözüldü.',
        'success',
        'Ticket',
        NEW.id,
        NEW."companyId"
      )
      ON CONFLICT DO NOTHING;
      
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
        'Ticket',
        'UPDATE',
        'Destek talebi çözüldü: ' || COALESCE(NEW.title, 'Başlıksız'),
        jsonb_build_object(
          'ticketId', NEW.id,
          'ticketTitle', NEW.title,
          'status', NEW.status
        ),
        NEW."companyId",
        COALESCE(NEW."assignedTo", NEW."createdBy", (SELECT id FROM "User" WHERE "companyId" = NEW."companyId" LIMIT 1))
      );
      
      RAISE NOTICE 'Ticket resolved: %', NEW.id;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not create ticket resolution notification: %', SQLERRM;
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ticket_resolved ON "Ticket";
CREATE TRIGGER trigger_ticket_resolved
  AFTER UPDATE OF status
  ON "Ticket"
  FOR EACH ROW
  EXECUTE FUNCTION handle_ticket_resolved();

-- ============================================
-- PART 6: DOCUMENT OTOMASYONLARI
-- ============================================

CREATE OR REPLACE FUNCTION handle_document_uploaded()
RETURNS TRIGGER AS $$
BEGIN
  -- Document yüklendiğinde
  BEGIN
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
      'Document',
      'CREATE',
      'Dosya yüklendi: ' || COALESCE(NEW.title, NEW."fileName", 'Başlıksız'),
      jsonb_build_object(
        'documentId', NEW.id,
        'documentTitle', NEW.title,
        'fileName', NEW."fileName",
        'fileType', NEW."fileType",
        'relatedTo', NEW."relatedTo",
        'relatedId', NEW."relatedId"
      ),
      NEW."companyId",
      COALESCE(NEW."uploadedBy", (SELECT id FROM "User" WHERE "companyId" = NEW."companyId" LIMIT 1))
    );
    
    -- Notification (İlgili kayıt sahibine)
    IF NEW."relatedTo" IS NOT NULL AND NEW."relatedId" IS NOT NULL THEN
      INSERT INTO "Notification" (
        title,
        message,
        type,
        "relatedTo",
        "relatedId",
        "companyId"
      )
      VALUES (
        'Yeni Dosya Yüklendi',
        COALESCE(NEW.title, NEW."fileName", 'Başlıksız') || ' dosyası yüklendi.',
        'info',
        NEW."relatedTo",
        NEW."relatedId",
        NEW."companyId"
      )
      ON CONFLICT DO NOTHING;
    END IF;
    
    RAISE NOTICE 'Document uploaded: %', NEW.id;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not create activity log for document: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_document_uploaded ON "Document";
CREATE TRIGGER trigger_document_uploaded
  AFTER INSERT ON "Document"
  FOR EACH ROW
  EXECUTE FUNCTION handle_document_uploaded();

-- ============================================
-- PART 7: APPROVAL REQUEST OTOMASYONLARI
-- ============================================

CREATE OR REPLACE FUNCTION handle_approval_approved()
RETURNS TRIGGER AS $$
BEGIN
  -- Approval onaylandığında
  IF NEW.status = 'APPROVED' AND (OLD.status IS NULL OR OLD.status != 'APPROVED') THEN
    
    BEGIN
      -- Notification (İstek sahibine)
      INSERT INTO "Notification" (
        title,
        message,
        type,
        "relatedTo",
        "relatedId",
        "companyId"
      )
      VALUES (
        'Onay Talebi Onaylandı',
        COALESCE(NEW.title, 'Başlıksız') || ' onay talebi onaylandı.',
        'success',
        'ApprovalRequest',
        NEW.id,
        NEW."companyId"
      )
      ON CONFLICT DO NOTHING;
      
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
        'ApprovalRequest',
        'UPDATE',
        'Onay talebi onaylandı: ' || COALESCE(NEW.title, 'Başlıksız'),
        jsonb_build_object(
          'approvalId', NEW.id,
          'approvalTitle', NEW.title,
          'relatedTo', NEW."relatedTo",
          'relatedId', NEW."relatedId",
          'approvedBy', NEW."approvedBy"
        ),
        NEW."companyId",
        COALESCE(NEW."approvedBy", NEW."requestedBy")
      );
      
      RAISE NOTICE 'Approval approved: %', NEW.id;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not create approval notification: %', SQLERRM;
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_approval_approved ON "ApprovalRequest";
CREATE TRIGGER trigger_approval_approved
  AFTER UPDATE OF status
  ON "ApprovalRequest"
  FOR EACH ROW
  EXECUTE FUNCTION handle_approval_approved();

CREATE OR REPLACE FUNCTION handle_approval_rejected()
RETURNS TRIGGER AS $$
BEGIN
  -- Approval reddedildiğinde
  IF NEW.status = 'REJECTED' AND (OLD.status IS NULL OR OLD.status != 'REJECTED') THEN
    
    BEGIN
      -- Notification (İstek sahibine)
      INSERT INTO "Notification" (
        title,
        message,
        type,
        "relatedTo",
        "relatedId",
        "companyId"
      )
      VALUES (
        'Onay Talebi Reddedildi',
        COALESCE(NEW.title, 'Başlıksız') || ' onay talebi reddedildi. Sebep: ' || COALESCE(NEW."rejectionReason", 'Belirtilmedi'),
        'warning',
        'ApprovalRequest',
        NEW.id,
        NEW."companyId"
      )
      ON CONFLICT DO NOTHING;
      
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
        'ApprovalRequest',
        'UPDATE',
        'Onay talebi reddedildi: ' || COALESCE(NEW.title, 'Başlıksız'),
        jsonb_build_object(
          'approvalId', NEW.id,
          'approvalTitle', NEW.title,
          'relatedTo', NEW."relatedTo",
          'relatedId', NEW."relatedId",
          'rejectedBy', NEW."rejectedBy",
          'rejectionReason', NEW."rejectionReason"
        ),
        NEW."companyId",
        COALESCE(NEW."rejectedBy", NEW."requestedBy")
      );
      
      RAISE NOTICE 'Approval rejected: %', NEW.id;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not create approval rejection notification: %', SQLERRM;
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_approval_rejected ON "ApprovalRequest";
CREATE TRIGGER trigger_approval_rejected
  AFTER UPDATE OF status
  ON "ApprovalRequest"
  FOR EACH ROW
  EXECUTE FUNCTION handle_approval_rejected();

-- ============================================
-- PART 8: EMAIL CAMPAIGN OTOMASYONLARI
-- ============================================

CREATE OR REPLACE FUNCTION handle_email_campaign_sent()
RETURNS TRIGGER AS $$
BEGIN
  -- Email campaign gönderildiğinde
  IF NEW.status = 'SENT' AND (OLD.status IS NULL OR OLD.status != 'SENT') THEN
    
    BEGIN
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
        'EmailCampaign',
        'UPDATE',
        'Email kampanyası gönderildi: ' || COALESCE(NEW.name, 'Başlıksız'),
        jsonb_build_object(
          'campaignId', NEW.id,
          'campaignName', NEW.name,
          'status', NEW.status,
          'sentCount', NEW."sentCount"
        ),
        NEW."companyId",
        COALESCE(NEW."createdBy", (SELECT id FROM "User" WHERE "companyId" = NEW."companyId" LIMIT 1))
      );
      
      RAISE NOTICE 'Email campaign sent: %', NEW.id;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not create activity log for email campaign: %', SQLERRM;
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_email_campaign_sent ON "EmailCampaign";
CREATE TRIGGER trigger_email_campaign_sent
  AFTER UPDATE OF status
  ON "EmailCampaign"
  FOR EACH ROW
  EXECUTE FUNCTION handle_email_campaign_sent();

-- ============================================
-- PART 9: SEGMENT OTOMASYONLARI
-- ============================================

CREATE OR REPLACE FUNCTION handle_segment_member_added()
RETURNS TRIGGER AS $$
BEGIN
  -- Segment'e üye eklendiğinde
  BEGIN
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
      'Segment',
      'UPDATE',
      'Segment üyesi eklendi',
      jsonb_build_object(
        'segmentId', NEW."segmentId",
        'customerId', NEW."customerId"
      ),
      (SELECT "companyId" FROM "CustomerSegment" WHERE id = NEW."segmentId"),
      (SELECT "createdBy" FROM "CustomerSegment" WHERE id = NEW."segmentId")
    );
    
    RAISE NOTICE 'Segment member added: %', NEW.id;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not create activity log for segment member: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- SegmentMember tablosu varsa trigger oluştur
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'SegmentMember') THEN
    DROP TRIGGER IF EXISTS trigger_segment_member_added ON "SegmentMember";
    CREATE TRIGGER trigger_segment_member_added
      AFTER INSERT ON "SegmentMember"
      FOR EACH ROW
      EXECUTE FUNCTION handle_segment_member_added();
  END IF;
END $$;

-- ============================================
-- PART 10: SALES QUOTA OTOMASYONLARI
-- ============================================

CREATE OR REPLACE FUNCTION handle_sales_quota_exceeded()
RETURNS TRIGGER AS $$
DECLARE
  quota_record RECORD;
  current_sales DECIMAL(15,2);
BEGIN
  -- Sales Quota aşıldığında kontrol et
  FOR quota_record IN 
    SELECT * FROM "SalesQuota" 
    WHERE "companyId" = NEW."companyId" 
      AND "period" = TO_CHAR(NOW(), 'YYYY-MM')
      AND "status" = 'ACTIVE'
  LOOP
    -- Mevcut satışları hesapla (Deal WON + Invoice PAID)
    SELECT COALESCE(SUM(value), 0) INTO current_sales
    FROM "Deal"
    WHERE "companyId" = NEW."companyId"
      AND stage = 'WON'
      AND TO_CHAR("createdAt", 'YYYY-MM') = quota_record."period";
    
    -- Quota aşıldıysa notification gönder
    IF current_sales >= quota_record."targetAmount" THEN
      INSERT INTO "Notification" (
        title,
        message,
        type,
        "relatedTo",
        "relatedId",
        "companyId"
      )
      VALUES (
        'Satış Hedefi Aşıldı',
        quota_record."period" || ' dönemi için satış hedefi aşıldı! Mevcut: ' || current_sales || ', Hedef: ' || quota_record."targetAmount",
        'success',
        'SalesQuota',
        quota_record.id,
        NEW."companyId"
      )
      ON CONFLICT DO NOTHING;
      
      RAISE NOTICE 'Sales quota exceeded: %', quota_record.id;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Deal WON olduğunda quota kontrolü
DROP TRIGGER IF EXISTS trigger_deal_won_quota_check ON "Deal";
CREATE TRIGGER trigger_deal_won_quota_check
  AFTER UPDATE OF stage
  ON "Deal"
  FOR EACH ROW
  WHEN (NEW.stage = 'WON')
  EXECUTE FUNCTION handle_sales_quota_exceeded();

-- ============================================
-- MIGRATION TAMAMLANDI
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ Migration 043 tamamlandı: Complete Automations';
  RAISE NOTICE '============================================';
  RAISE NOTICE '📌 Yeni Otomasyonlar:';
  RAISE NOTICE '  1. Customer → ActivityLog + Notification';
  RAISE NOTICE '  2. Deal LOST → ActivityLog + Notification';
  RAISE NOTICE '  3. Product Low Stock → Notification';
  RAISE NOTICE '  4. Task Assigned → Notification';
  RAISE NOTICE '  5. Task Completed → Notification';
  RAISE NOTICE '  6. Ticket Created → Notification';
  RAISE NOTICE '  7. Ticket Resolved → Notification';
  RAISE NOTICE '  8. Document Uploaded → ActivityLog + Notification';
  RAISE NOTICE '  9. Approval Approved → Notification';
  RAISE NOTICE '  10. Approval Rejected → Notification';
  RAISE NOTICE '  11. Email Campaign Sent → ActivityLog';
  RAISE NOTICE '  12. Segment Member Added → ActivityLog';
  RAISE NOTICE '  13. Sales Quota Exceeded → Notification';
  RAISE NOTICE '============================================';
END $$;

