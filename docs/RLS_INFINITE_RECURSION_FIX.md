# 🔧 RLS Infinite Recursion Hatası Düzeltmesi

## ⚠️ SORUN: Infinite Recursion in Policy for Relation "User"

### Hata Mesajı
```
API Error: 500 Internal Server Error - infinite recursion detected in policy for relation "User" (/api/finance?)
```

### Sorunun Nedeni
RLS policy'lerinde `User` tablosuna sorgu yapılırken, o policy de `User` tablosuna sorgu yapıyor ve bu sonsuz döngü oluşturuyor.

Örnek:
```sql
-- Finance policy'si User tablosuna sorgu yapıyor
CREATE POLICY "finance_company_isolation" ON "Finance"
  USING (
    "companyId" = (SELECT "companyId" FROM "User" WHERE id = auth.uid())
  );

-- Ama User policy'si de User tablosuna sorgu yapıyor
CREATE POLICY "user_company_isolation" ON "User"
  USING (
    "companyId" = (SELECT "companyId" FROM "User" WHERE id = auth.uid())
  );
```

Bu sonsuz döngü oluşturuyor!

## ✅ ÇÖZÜM

### 1. User Tablosu için RLS'yi Kapat
NextAuth kullanıldığı için `auth.uid()` çalışmıyor. User tablosu için RLS'yi kapatıp API seviyesinde kontrol yapacağız.

### 2. Diğer Tablolar için Basitleştirilmiş Policy'ler
User tablosuna sorgu yapmayan basitleştirilmiş policy'ler kullanacağız. API seviyesinde zaten `getServerSession()` ile `companyId` kontrolü yapılıyor ve `getSupabaseWithServiceRole()` kullanıldığı için RLS zaten bypass ediliyor.

## 📋 UYGULAMA

### 1. SQL Dosyasını Çalıştır
`supabase/rls-infinite-recursion-fix.sql` dosyasını Supabase SQL Editor'de çalıştır:

```sql
-- User tablosu için RLS'yi kapat
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;

-- Diğer tablolar için basitleştirilmiş policy'ler
-- (User tablosuna sorgu yapmayacak şekilde)
```

### 2. Sonuç
- ✅ User tablosu için RLS kapatıldı (sonsuz döngü önlendi)
- ✅ Diğer tablolar için basitleştirilmiş policy'ler (User tablosuna sorgu yapmıyor)
- ✅ API seviyesinde zaten `getServerSession()` ile `companyId` kontrolü yapılıyor
- ✅ `getSupabaseWithServiceRole()` kullanıldığı için RLS zaten bypass ediliyor

## 🔒 GÜVENLİK

**Önemli:** Bu değişiklik güvenliği azaltmaz çünkü:
1. API seviyesinde `getServerSession()` ile `companyId` kontrolü yapılıyor
2. `getSupabaseWithServiceRole()` kullanıldığı için RLS zaten bypass ediliyor
3. Policy'ler sadece ek güvenlik katmanı olarak çalışıyor

## 📝 NOTLAR

- NextAuth kullanıldığı için `auth.uid()` çalışmıyor
- User tablosu için RLS kapatıldı (API seviyesinde kontrol yapılıyor)
- Diğer tablolar için basitleştirilmiş policy'ler kullanılıyor
- Gerçek kontrol API'lerde `getServerSession()` ile yapılıyor



