-- ============================================
-- 🚀 ACİL DÜZELTME - HEMEN ÇALIŞTIR!
-- ============================================
-- Bu SQL komutlarını Supabase Dashboard'dan çalıştırın
-- Dashboard URL: https://supabase.com/dashboard/project/[PROJECT_ID]/sql
-- ============================================

-- ============================================
-- ADIM 1: minimumStock Hatası Düzeltme
-- ============================================
-- Problem: Product.minStock → Product.minimumStock yapmalıyız

DO $$
BEGIN
  -- Eğer minStock kolonu varsa, minimumStock'a çevir
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'Product' 
      AND column_name = 'minStock'
  ) THEN
    -- minStock var, değiştir
    ALTER TABLE "Product" 
    RENAME COLUMN "minStock" TO "minimumStock";
    
    RAISE NOTICE '✅ SUCCESS: Product.minStock → Product.minimumStock değiştirildi!';
    
  -- Eğer minimumStock zaten varsa
  ELSIF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'Product' 
      AND column_name = 'minimumStock'
  ) THEN
    RAISE NOTICE '✅ INFO: Product.minimumStock zaten mevcut, değişiklik gerekmez';
    
  -- İkisi de yoksa yeni kolon ekle
  ELSE
    ALTER TABLE "Product" 
    ADD COLUMN IF NOT EXISTS "minimumStock" DECIMAL(10, 2) DEFAULT 0;
    
    RAISE NOTICE '✅ SUCCESS: Product.minimumStock yeni kolon olarak eklendi!';
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️ WARNING: Product.minimumStock düzeltmesi atlandı - Hata: %', SQLERRM;
END $$;

-- ============================================
-- ADIM 2: totalAmount Hatası Düzeltme (Quote)
-- ============================================
-- Problem: Quote.total → Quote.totalAmount yapmalıyız

DO $$
BEGIN
  -- Eğer total kolonu varsa, totalAmount'a çevir
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'Quote' 
      AND column_name = 'total'
  ) THEN
    -- total var, değiştir
    ALTER TABLE "Quote" 
    RENAME COLUMN "total" TO "totalAmount";
    
    RAISE NOTICE '✅ SUCCESS: Quote.total → Quote.totalAmount değiştirildi!';
    
  -- Eğer totalAmount zaten varsa
  ELSIF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'Quote' 
      AND column_name = 'totalAmount'
  ) THEN
    RAISE NOTICE '✅ INFO: Quote.totalAmount zaten mevcut, değişiklik gerekmez';
    
  -- İkisi de yoksa yeni kolon ekle
  ELSE
    ALTER TABLE "Quote" 
    ADD COLUMN IF NOT EXISTS "totalAmount" DECIMAL(15, 2) DEFAULT 0;
    
    RAISE NOTICE '✅ SUCCESS: Quote.totalAmount yeni kolon olarak eklendi!';
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️ WARNING: Quote.totalAmount düzeltmesi atlandı - Hata: %', SQLERRM;
END $$;

-- ============================================
-- ADIM 3: totalAmount Hatası Düzeltme (Invoice)
-- ============================================
-- Problem: Invoice.total → Invoice.totalAmount yapmalıyız

DO $$
BEGIN
  -- Eğer total kolonu varsa, totalAmount'a çevir
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'Invoice' 
      AND column_name = 'total'
  ) THEN
    -- total var, değiştir
    ALTER TABLE "Invoice" 
    RENAME COLUMN "total" TO "totalAmount";
    
    RAISE NOTICE '✅ SUCCESS: Invoice.total → Invoice.totalAmount değiştirildi!';
    
  -- Eğer totalAmount zaten varsa
  ELSIF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'Invoice' 
      AND column_name = 'totalAmount'
  ) THEN
    RAISE NOTICE '✅ INFO: Invoice.totalAmount zaten mevcut, değişiklik gerekmez';
    
  -- İkisi de yoksa yeni kolon ekle
  ELSE
    ALTER TABLE "Invoice" 
    ADD COLUMN IF NOT EXISTS "totalAmount" DECIMAL(15, 2) DEFAULT 0;
    
    RAISE NOTICE '✅ SUCCESS: Invoice.totalAmount yeni kolon olarak eklendi!';
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️ WARNING: Invoice.totalAmount düzeltmesi atlandı - Hata: %', SQLERRM;
END $$;

-- ============================================
-- ADIM 4: DOĞRULAMA
-- ============================================

DO $$
DECLARE
  product_ok BOOLEAN;
  quote_ok BOOLEAN;
  invoice_ok BOOLEAN;
BEGIN
  -- Product.minimumStock var mı?
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Product' AND column_name = 'minimumStock'
  ) INTO product_ok;
  
  -- Quote.totalAmount var mı?
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Quote' AND column_name = 'totalAmount'
  ) INTO quote_ok;
  
  -- Invoice.totalAmount var mı?
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Invoice' AND column_name = 'totalAmount'
  ) INTO invoice_ok;
  
  -- Sonuçları göster
  IF product_ok AND quote_ok AND invoice_ok THEN
    RAISE NOTICE '🎉 TÜM DÜZELTMELER BAŞARILI!';
    RAISE NOTICE '✅ Product.minimumStock: Mevcut';
    RAISE NOTICE '✅ Quote.totalAmount: Mevcut';
    RAISE NOTICE '✅ Invoice.totalAmount: Mevcut';
  ELSE
    RAISE WARNING '⚠️ BAZI DÜZELTMELER BAŞARISIZ:';
    IF NOT product_ok THEN
      RAISE WARNING '❌ Product.minimumStock: Bulunamadı';
    END IF;
    IF NOT quote_ok THEN
      RAISE WARNING '❌ Quote.totalAmount: Bulunamadı';
    END IF;
    IF NOT invoice_ok THEN
      RAISE WARNING '❌ Invoice.totalAmount: Bulunamadı';
    END IF;
  END IF;
END $$;

-- ============================================
-- SON ADIM: CACHE TEMİZLEME (Opsiyonel)
-- ============================================
-- Bu komutları çalıştırdıktan sonra:
-- 1. Tarayıcınızı yenileyin (Ctrl+F5)
-- 2. Uygulamanızı yeniden başlatın (npm run dev)
-- ============================================

-- TAMAMLANDI! 
-- Artık tüm trigger'lar ve validation'lar düzgün çalışacak! 🚀

