# 🔄 Migration Kılavuzu - UserPermission & CompanyPermission

## 📋 Migration SQL Dosyası

Aşağıdaki SQL'i Supabase Dashboard'da çalıştırın:

```sql
-- UserPermission tablosu - Detaylı yetki yönetimi için
-- Her kullanıcı için modül bazlı CRUD yetkileri

CREATE TABLE IF NOT EXISTS "UserPermission" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  module VARCHAR(50) NOT NULL, -- customer, deal, quote, invoice, product, finance, task, ticket, shipment, etc.
  canCreate BOOLEAN DEFAULT false,
  canRead BOOLEAN DEFAULT false,
  canUpdate BOOLEAN DEFAULT false,
  canDelete BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("userId", "companyId", module)
);

-- CompanyPermission tablosu - Şirket bazlı yetkiler (SuperAdmin için)
CREATE TABLE IF NOT EXISTS "CompanyPermission" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  feature VARCHAR(50) NOT NULL, -- analytics, reports, export, api_access, etc.
  enabled BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("companyId", feature)
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_userpermission_user ON "UserPermission"("userId");
CREATE INDEX IF NOT EXISTS idx_userpermission_company ON "UserPermission"("companyId");
CREATE INDEX IF NOT EXISTS idx_userpermission_module ON "UserPermission"(module);
CREATE INDEX IF NOT EXISTS idx_companypermission_company ON "CompanyPermission"("companyId");

-- RLS Policies
ALTER TABLE "UserPermission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CompanyPermission" ENABLE ROW LEVEL SECURITY;

-- UserPermission Policies
CREATE POLICY "userpermission_company_isolation" ON "UserPermission"
  FOR ALL
  USING (
    "companyId" = (
      SELECT "companyId" FROM "User" WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    )
  );

-- CompanyPermission Policies
CREATE POLICY "companypermission_superadmin_only" ON "CompanyPermission"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    )
  );
```

## 🚀 Adımlar

1. **Supabase Dashboard'a gidin**: https://supabase.com/dashboard
2. **Projenizi seçin**
3. **SQL Editor** sekmesine gidin
4. **Yukarıdaki SQL'i kopyalayın** ve SQL Editor'a yapıştırın
5. **"Run"** butonuna tıklayın

## ✅ Kontrol

Migration başarıyla tamamlandıktan sonra:

- ✅ `UserPermission` tablosu oluşturuldu
- ✅ `CompanyPermission` tablosu oluşturuldu
- ✅ Index'ler oluşturuldu
- ✅ RLS Policies aktif edildi

## 📝 Notlar

- `IF NOT EXISTS` kullanıldığı için tablolar zaten varsa hata vermez
- RLS policies multi-tenant yapısını korur
- SuperAdmin tüm şirketlerin yetkilerini görebilir




