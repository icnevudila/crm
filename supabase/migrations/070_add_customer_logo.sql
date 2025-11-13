-- ============================================
-- 070_add_customer_logo.sql
-- Customer tablosuna logoUrl kolonu ekle
-- ============================================
-- Bireysel müşteriler için logo yükleme özelliği
-- CustomerCompany'deki gibi logoUrl kolonu ekleniyor
-- ============================================

-- Logo URL kolonunu ekle (eğer yoksa)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'Customer'
    AND column_name = 'logoUrl'
  ) THEN
    ALTER TABLE "Customer"
    ADD COLUMN "logoUrl" TEXT;

    RAISE NOTICE 'Customer.logoUrl kolonu eklendi';
  ELSE
    RAISE NOTICE 'Customer.logoUrl kolonu zaten mevcut';
  END IF;
END $$;

-- Comment ekle
COMMENT ON COLUMN "Customer"."logoUrl" IS 'Müşteri logosu URL (base64 veya Supabase Storage URL)';

