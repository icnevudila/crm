-- ============================================
-- 049_fix_minimumstock_column.sql
-- minimumStock Kolon Adı Düzeltmesi
-- ============================================
-- Problem: Trigger'lar "minimumStock" kullanıyor ama kolon "minStock" olarak tanımlanmış
-- Çözüm: "minStock" kolonunu "minimumStock" olarak yeniden adlandır
-- ============================================

-- 1. Kolon adını düzelt: minStock → minimumStock (GÜVENLİ YÖNTEM)
DO $$
BEGIN
  -- Eğer minStock kolonu varsa, minimumStock'a çevir
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'Product' 
      AND column_name = 'minStock'
  ) THEN
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
-- AÇIKLAMA:
-- Bu migration şu hatayı düzeltir:
-- "record 'new' has no field 'minimumStock'"
-- 
-- Trigger'lar Product tablosunda minimumStock kolonunu kullanıyor
-- ancak tablo tanımında minStock olarak oluşturulmuş.
-- Bu migration kolon adını trigger'larla uyumlu hale getirir.
-- ============================================

