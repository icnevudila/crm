-- Company Limitasyonları ve SuperAdmin Yönetim Sistemi
-- SuperAdmin'in kurum bazlı limitasyonları yönetebilmesi için

-- Company tablosuna limitasyon alanları ekle
ALTER TABLE "Company" 
ADD COLUMN IF NOT EXISTS "maxUsers" INTEGER DEFAULT NULL, -- NULL = sınırsız
ADD COLUMN IF NOT EXISTS "maxModules" INTEGER DEFAULT NULL, -- NULL = sınırsız
ADD COLUMN IF NOT EXISTS "adminUserLimit" INTEGER DEFAULT NULL; -- Admin kaç kullanıcı ekleyebilir (NULL = sınırsız)

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_company_max_users ON "Company"("maxUsers") WHERE "maxUsers" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_company_max_modules ON "Company"("maxModules") WHERE "maxModules" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_company_admin_user_limit ON "Company"("adminUserLimit") WHERE "adminUserLimit" IS NOT NULL;

-- Comment'ler
COMMENT ON COLUMN "Company"."maxUsers" IS 'Kurumun maksimum kullanıcı sayısı (NULL = sınırsız)';
COMMENT ON COLUMN "Company"."maxModules" IS 'Kurumun maksimum modül sayısı (NULL = sınırsız)';
COMMENT ON COLUMN "Company"."adminUserLimit" IS 'Admin rolündeki kullanıcıların ekleyebileceği maksimum kullanıcı sayısı (NULL = sınırsız)';









