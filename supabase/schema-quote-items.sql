-- QuoteItem table - Quote ile Product arasındaki ilişki tablosu
-- Her Quote'da birden fazla Product olabilir (miktar, fiyat, toplam ile)

CREATE TABLE IF NOT EXISTS "QuoteItem" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "quoteId" UUID NOT NULL REFERENCES "Quote"(id) ON DELETE CASCADE,
  "productId" UUID NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
  unitPrice DECIMAL(15, 2) NOT NULL DEFAULT 0,
  total DECIMAL(15, 2) NOT NULL DEFAULT 0,
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("quoteId", "productId") -- Aynı ürün aynı teklifte birden fazla eklenemez
);

-- Index'ler (Performans için)
CREATE INDEX IF NOT EXISTS idx_quoteitem_quote ON "QuoteItem"("quoteId");
CREATE INDEX IF NOT EXISTS idx_quoteitem_product ON "QuoteItem"("productId");
CREATE INDEX IF NOT EXISTS idx_quoteitem_company ON "QuoteItem"("companyId");

