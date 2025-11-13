-- Invoice tablosuna serviceDescription kolonu ekle
-- Hizmet faturaları için hizmet açıklaması alanı

ALTER TABLE "Invoice" 
ADD COLUMN IF NOT EXISTS "serviceDescription" TEXT;

-- Index ekle (performans için - hizmet faturaları sorguları için)
CREATE INDEX IF NOT EXISTS idx_invoice_service_description ON "Invoice"("serviceDescription") WHERE "serviceDescription" IS NOT NULL;

-- Comment ekle
COMMENT ON COLUMN "Invoice"."serviceDescription" IS 'Hizmet faturaları için hizmet açıklaması (SERVICE_SALES ve SERVICE_PURCHASE tipi faturalar için)';


