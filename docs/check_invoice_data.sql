-- ============================================
-- Invoice ve Quote tablolarındaki verileri kontrol et
-- Migration 050 sonrası totalAmount kolonunda veri var mı?
-- TEK SORGU - TÜM BİLGİLERİ GÖSTER
-- ============================================

WITH invoice_stats AS (
  -- PAID Invoice istatistikleri (NET SATIŞ için)
  SELECT 
    'PAID' as status,
    COUNT(*) as count,
    SUM("totalAmount") as total_amount_sum,
    AVG("totalAmount") as avg_total_amount,
    MIN("totalAmount") as min_total_amount,
    MAX("totalAmount") as max_total_amount,
    COUNT(CASE WHEN "totalAmount" IS NULL OR "totalAmount" = 0 THEN 1 END) as null_or_zero_count
  FROM "Invoice"
  WHERE status = 'PAID'
  
  UNION ALL
  
  -- SENT Invoice istatistikleri (BEKLEYEN için)
  SELECT 
    'SENT' as status,
    COUNT(*) as count,
    SUM("totalAmount") as total_amount_sum,
    AVG("totalAmount") as avg_total_amount,
    MIN("totalAmount") as min_total_amount,
    MAX("totalAmount") as max_total_amount,
    COUNT(CASE WHEN "totalAmount" IS NULL OR "totalAmount" = 0 THEN 1 END) as null_or_zero_count
  FROM "Invoice"
  WHERE status = 'SENT'
),
quote_stats AS (
  -- Quote istatistikleri
  SELECT 
    status,
    COUNT(*) as count,
    SUM("totalAmount") as total_amount_sum,
    AVG("totalAmount") as avg_total_amount,
    MIN("totalAmount") as min_total_amount,
    MAX("totalAmount") as max_total_amount,
    COUNT(CASE WHEN "totalAmount" IS NULL OR "totalAmount" = 0 THEN 1 END) as null_or_zero_count
  FROM "Quote"
  GROUP BY status
),
column_check AS (
  -- Kolon varlığını kontrol et
  SELECT 
    'Invoice' as table_name,
    column_name,
    data_type,
    is_nullable
  FROM information_schema.columns
  WHERE table_name = 'Invoice' 
    AND column_name IN ('total', 'totalAmount')
  
  UNION ALL
  
  SELECT 
    'Quote' as table_name,
    column_name,
    data_type,
    is_nullable
  FROM information_schema.columns
  WHERE table_name = 'Quote' 
    AND column_name IN ('total', 'totalAmount')
),
sample_invoices AS (
  -- Örnek PAID invoice'lar (ilk 5)
  SELECT 
    id,
    title,
    status,
    "totalAmount",
    "createdAt"
  FROM "Invoice"
  WHERE status = 'PAID'
  ORDER BY "createdAt" DESC
  LIMIT 5
)
SELECT 
  'INVOICE_STATS' as result_type,
  json_build_object(
    'status', status,
    'count', count,
    'total_amount_sum', total_amount_sum,
    'avg_total_amount', avg_total_amount,
    'min_total_amount', min_total_amount,
    'max_total_amount', max_total_amount,
    'null_or_zero_count', null_or_zero_count
  ) as data
FROM invoice_stats

UNION ALL

SELECT 
  'QUOTE_STATS' as result_type,
  json_build_object(
    'status', status,
    'count', count,
    'total_amount_sum', total_amount_sum,
    'avg_total_amount', avg_total_amount,
    'min_total_amount', min_total_amount,
    'max_total_amount', max_total_amount,
    'null_or_zero_count', null_or_zero_count
  ) as data
FROM quote_stats

UNION ALL

SELECT 
  'COLUMN_CHECK' as result_type,
  json_build_object(
    'table_name', table_name,
    'column_name', column_name,
    'data_type', data_type,
    'is_nullable', is_nullable
  ) as data
FROM column_check

UNION ALL

SELECT 
  'SAMPLE_INVOICES' as result_type,
  json_build_object(
    'id', id,
    'title', title,
    'status', status,
    'totalAmount', "totalAmount",
    'createdAt', "createdAt"
  ) as data
FROM sample_invoices

ORDER BY result_type;

