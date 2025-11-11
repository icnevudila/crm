-- Stok Düşüşünü Kontrol Et
-- Bu SQL'i Supabase SQL Editor'de çalıştırın

-- 1. Son oluşturulan InvoiceItem'ları ve stok hareketlerini kontrol et
SELECT 
  ii.id AS invoice_item_id,
  ii."invoiceId",
  ii."productId",
  p.name AS product_name,
  ii.quantity,
  ii."unitPrice",
  ii.total,
  ii."createdAt" AS invoice_item_created,
  -- Stok hareketi var mı?
  sm.id AS stock_movement_id,
  sm.type AS movement_type,
  sm.quantity AS movement_quantity,
  sm."previousStock",
  sm."newStock",
  sm.reason,
  sm."createdAt" AS movement_created,
  -- Ürünün mevcut stoku
  p.stock AS current_stock
FROM "InvoiceItem" ii
LEFT JOIN "Product" p ON p.id = ii."productId"
LEFT JOIN "StockMovement" sm ON sm."relatedId" = ii."invoiceId" 
  AND sm."productId" = ii."productId"
  AND sm."relatedTo" = 'Invoice'
ORDER BY ii."createdAt" DESC
LIMIT 20;

-- 2. Son 10 stok hareketini kontrol et
SELECT 
  sm.id,
  sm."productId",
  p.name AS product_name,
  sm.type,
  sm.quantity,
  sm."previousStock",
  sm."newStock",
  sm.reason,
  sm."relatedTo",
  sm."relatedId",
  sm."createdAt"
FROM "StockMovement" sm
LEFT JOIN "Product" p ON p.id = sm."productId"
ORDER BY sm."createdAt" DESC
LIMIT 10;

-- 3. Trigger'ın çalışıp çalışmadığını kontrol et
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'InvoiceItem'
AND trigger_name = 'trigger_update_stock_on_invoice_item';

