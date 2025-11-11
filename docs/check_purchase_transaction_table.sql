-- PurchaseTransaction Tablosu Kontrol Scripti
-- Bu script'i Supabase Dashboard > SQL Editor'de çalıştırın

-- 1. Tablo var mı kontrol et
SELECT 
  'PurchaseTransaction tablosu var mı?' as kontrol,
  COUNT(*) as tablo_sayisi
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'PurchaseTransaction';

-- 2. Tablo yapısını göster
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'PurchaseTransaction'
ORDER BY ordinal_position;

-- 3. Index'leri göster
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'PurchaseTransaction';

-- 4. Trigger'ları göster
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'PurchaseTransaction';

-- 5. RLS Policy'leri göster
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'PurchaseTransaction';

-- 6. Eğer tablo yoksa, oluştur
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'PurchaseTransaction'
  ) THEN
    CREATE TABLE "PurchaseTransaction" (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "invoiceId" UUID NOT NULL REFERENCES "Invoice"(id) ON DELETE CASCADE,
      status VARCHAR(20) DEFAULT 'DRAFT',
      "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE("invoiceId")
    );
    
    RAISE NOTICE 'PurchaseTransaction tablosu oluşturuldu';
  ELSE
    RAISE NOTICE 'PurchaseTransaction tablosu zaten var';
  END IF;
END $$;

-- 7. incomingQuantity kolonu var mı kontrol et
SELECT 
  'Product.incomingQuantity kolonu var mı?' as kontrol,
  COUNT(*) as kolon_sayisi
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'Product'
  AND column_name = 'incomingQuantity';

-- 8. Eğer incomingQuantity yoksa, ekle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Product'
    AND column_name = 'incomingQuantity'
  ) THEN
    ALTER TABLE "Product" 
    ADD COLUMN "incomingQuantity" DECIMAL(10, 2) DEFAULT 0;
    
    CREATE INDEX IF NOT EXISTS idx_product_incoming ON "Product"("incomingQuantity");
    
    RAISE NOTICE 'incomingQuantity kolonu eklendi';
  ELSE
    RAISE NOTICE 'incomingQuantity kolonu zaten var';
  END IF;
END $$;

