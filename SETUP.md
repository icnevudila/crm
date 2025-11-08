# 🚀 CRM Enterprise V3 - Kurulum Rehberi

## 📋 Adım 1: Supabase Database Setup

### 1.1. Schema Oluşturma

1. Supabase Dashboard'a gidin: https://supabase.com/dashboard
2. Projenizi seçin: `serlpsputsdqkgtzclnn`
3. SQL Editor'a gidin
4. `supabase/schema.sql` dosyasının içeriğini kopyalayın
5. SQL Editor'a yapıştırın ve çalıştırın

### 1.2. RLS Policies

1. SQL Editor'da `supabase/rls.sql` dosyasının içeriğini kopyalayın
2. Yapıştırın ve çalıştırın
3. Tüm tablolarda RLS aktif olacak

### 1.3. Index'ler

Index'ler schema.sql dosyasında zaten tanımlı, otomatik oluşturulacak.

## 📋 Adım 2: Environment Variables

`.env.local` dosyası oluşturuldu. Database password'unuzu ekleyin:

1. `.env.local` dosyasını açın
2. `DATABASE_URL` satırındaki `[YOUR_PASSWORD]` kısmını gerçek database password'unuzla değiştirin
3. `NEXTAUTH_SECRET` için güçlü bir secret key oluşturun:
   ```bash
   openssl rand -base64 32
   ```

## 📋 Adım 3: Seed Data (Opsiyonel)

Demo verileri yüklemek için:

```bash
npm run seed
```

Bu komut şunları oluşturacak:
- 3 Company (Tipplus Medikal, Global Un, ZahirTech)
- 6 User (her şirketten admin + sales)
- 30 Customer
- 12 Deal
- 18 Quote
- 15 Invoice
- 30 Product
- 12 Finance
- 24 ActivityLog

## 📋 Adım 4: Projeyi Çalıştırma

```bash
npm run dev
```

Tarayıcıda açın: http://localhost:3000/tr

## ✅ Kontrol Listesi

- [ ] Supabase schema.sql çalıştırıldı
- [ ] Supabase rls.sql çalıştırıldı
- [ ] .env.local dosyası düzenlendi (DATABASE_URL password eklendi)
- [ ] NEXTAUTH_SECRET değiştirildi
- [ ] npm run seed çalıştırıldı (opsiyonel)
- [ ] npm run dev çalıştırıldı

## 🔧 Sorun Giderme

### Database bağlantı hatası

1. `.env.local` dosyasındaki `DATABASE_URL`'i kontrol edin
2. Password'un doğru olduğundan emin olun
3. Supabase Dashboard'da connection string'i tekrar kontrol edin

### RLS hatası

1. `supabase/rls.sql` dosyasının çalıştırıldığından emin olun
2. SuperAdmin kullanıcısı oluşturuldu mu kontrol edin

### Seed data hatası

1. Önce schema ve rls'nin çalıştırıldığından emin olun
2. `.env.local` dosyasındaki connection string'i kontrol edin







