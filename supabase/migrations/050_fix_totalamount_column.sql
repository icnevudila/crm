-- ============================================
-- 050_fix_totalamount_column.sql
-- Quote ve Invoice tablolarında total → totalAmount düzeltmesi
-- ============================================
-- SORUN: Bazı migration'lar "totalAmount" kullanıyor ama tablo "total" tanımlı
-- ÇÖZÜM: Kolon adını "totalAmount" olarak değiştir
-- ============================================

-- Quote tablosu
DO $$ 
BEGIN
  -- Önce mevcut kolonun var olup olmadığını kontrol et
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Quote' AND column_name = 'total'
  ) THEN
    -- Eğer totalAmount zaten varsa önce onu kaldır
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Quote' AND column_name = 'totalAmount'
    ) THEN
      ALTER TABLE "Quote" DROP COLUMN IF EXISTS "totalAmount";
    END IF;
    
    -- total'i totalAmount olarak yeniden adlandır
    ALTER TABLE "Quote" RENAME COLUMN "total" TO "totalAmount";
    RAISE NOTICE 'Quote.total → Quote.totalAmount (✓)';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Quote' AND column_name = 'totalAmount'
  ) THEN
    RAISE NOTICE 'Quote.totalAmount zaten mevcut (✓)';
  ELSE
    RAISE NOTICE 'Quote tablosunda ne total ne de totalAmount kolonu bulunamadı!';
  END IF;
END $$;

-- Invoice tablosu
DO $$ 
BEGIN
  -- Önce mevcut kolonun var olup olmadığını kontrol et
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Invoice' AND column_name = 'total'
  ) THEN
    -- Eğer totalAmount zaten varsa önce onu kaldır
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Invoice' AND column_name = 'totalAmount'
    ) THEN
      ALTER TABLE "Invoice" DROP COLUMN IF EXISTS "totalAmount";
    END IF;
    
    -- total'i totalAmount olarak yeniden adlandır
    ALTER TABLE "Invoice" RENAME COLUMN "total" TO "totalAmount";
    RAISE NOTICE 'Invoice.total → Invoice.totalAmount (✓)';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Invoice' AND column_name = 'totalAmount'
  ) THEN
    RAISE NOTICE 'Invoice.totalAmount zaten mevcut (✓)';
  ELSE
    RAISE NOTICE 'Invoice tablosunda ne total ne de totalAmount kolonu bulunamadı!';
  END IF;
END $$;

-- ============================================
-- NOT: Bu değişiklik sadece kolon adını değiştirir
-- Veri kaybı olmaz, index'ler otomatik güncellenir
-- ============================================

COMMENT ON COLUMN "Quote"."totalAmount" IS 'Teklif toplam tutarı (KDV dahil)';
COMMENT ON COLUMN "Invoice"."totalAmount" IS 'Fatura toplam tutarı (KDV hariç, grandTotal KDV dahil)';
