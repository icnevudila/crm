-- ============================================
-- 115_fix_duplicate_stock_zero_notifications.sql
-- Stok Sıfır Bildirimlerinde Çift Gönderim Sorunu Düzeltmesi
-- ============================================
-- Sorun: Stok sıfır olduğunda aynı kullanıcıya 2 bildirim gönderiliyor
-- Çözüm: NOT EXISTS kontrolünü her kullanıcı için ayrı ayrı yap ve ON CONFLICT ekle
-- ============================================

CREATE OR REPLACE FUNCTION auto_notify_product_stock_zero()
RETURNS TRIGGER AS $$
BEGIN
  -- Stok 0 olduğunda ve daha önce 0 değildi kritik bildirim gönder
  IF NEW.stock = 0 
     AND (OLD.stock IS NULL OR OLD.stock > 0) THEN
    -- Her kullanıcı için ayrı ayrı kontrol et ve bildirim oluştur
    INSERT INTO "Notification" ("userId", "companyId", title, message, type, priority, "relatedTo", "relatedId", link)
    SELECT 
      u.id,
      NEW."companyId",
      'Stok Sıfır - Kritik',
      NEW.name || ' ürününün stoku sıfır. Acil stok girişi yapılması gerekiyor. Detayları görmek ister misiniz?',
      'error',
      'critical',
      'Product',
      NEW.id,
      '/tr/products/' || NEW.id
    FROM "User" u
    WHERE u."companyId" = NEW."companyId"
      AND u.role IN ('ADMIN', 'SUPER_ADMIN')
      -- ÖNEMLİ: Her kullanıcı için ayrı ayrı kontrol et - bu kullanıcıya daha önce bildirim gönderilmiş mi?
      AND NOT EXISTS (
        SELECT 1 FROM "Notification" n
        WHERE n."userId" = u.id  -- Bu kullanıcıya özel kontrol
          AND n."relatedTo" = 'Product'
          AND n."relatedId" = NEW.id
          AND n.title = 'Stok Sıfır - Kritik'
          AND n."isRead" = false
          -- Son 1 saat içinde gönderilmiş bildirim varsa tekrar gönderme (çift gönderimi önlemek için)
          AND n."createdAt" > NOW() - INTERVAL '1 hour'
      )
    -- Çift gönderimi önlemek için ON CONFLICT ekle (eğer Notification tablosunda unique constraint varsa)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_notify_product_stock_zero() IS 'Ürün stoku sıfır olduğunda kritik bildirim gönderir. Her kullanıcı için ayrı kontrol yapar ve çift gönderimi önler.';

-- Trigger'ı yeniden oluştur (zaten varsa güncellenir)
DROP TRIGGER IF EXISTS trg_product_stock_zero ON "Product";
CREATE TRIGGER trg_product_stock_zero
  AFTER INSERT OR UPDATE ON "Product"
  FOR EACH ROW
  WHEN (NEW.stock = 0 AND (OLD.stock IS NULL OR OLD.stock > 0))
  EXECUTE FUNCTION auto_notify_product_stock_zero();






