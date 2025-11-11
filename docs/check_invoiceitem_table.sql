-- InvoiceItem tablosunu ve unitPrice kolonunu kontrol et
-- Bu SQL'i Supabase SQL Editor'de çalıştırın

-- 1. InvoiceItem tablosu var mı kontrol et
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'InvoiceItem'
) AS table_exists;

-- 2. InvoiceItem tablosundaki kolonları listele
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'InvoiceItem'
ORDER BY ordinal_position;

-- 3. Eğer unitPrice kolonu yoksa ekle
ALTER TABLE "InvoiceItem" 
ADD COLUMN IF NOT EXISTS "unitPrice" DECIMAL(15, 2) NOT NULL DEFAULT 0;

-- 4. Tabloyu tekrar kontrol et
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'InvoiceItem'
ORDER BY ordinal_position;

