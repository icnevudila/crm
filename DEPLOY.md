# 🚀 CRM Enterprise V3 - Deploy Rehberi

Bu rehber, projeyi Vercel'e deploy etmek için gerekli adımları içerir.

## 📋 Ön Hazırlık

### 1. Build Test (Yerel)

Deploy öncesi yerel build testi yapın:

```bash
# Cross-platform (Windows, Linux, Mac)
npm run build
```

**Not:** `package.json`'da build script'i `cross-env` ile yapılandırılmıştır, bu yüzden tüm platformlarda aynı komut çalışır.

Build başarılı olmalı. Hata varsa düzeltin.

### 2. Environment Variables Hazırlığı

Deploy için gerekli environment variables'ları hazırlayın:

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase proje URL'iniz
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (opsiyonel, admin işlemleri için)
- `DATABASE_URL` - PostgreSQL connection string (opsiyonel)
- `NEXTAUTH_SECRET` - NextAuth secret key (güçlü bir key oluşturun)
- `NEXTAUTH_URL` - Production URL (örn: https://your-app.vercel.app)

## 🚀 Vercel Deploy Adımları

### Yöntem 1: Vercel CLI ile Deploy

1. **Vercel CLI'yi yükleyin:**
   ```bash
   npm i -g vercel
   ```

2. **Vercel'e giriş yapın:**
   ```bash
   vercel login
   ```

3. **Projeyi deploy edin:**
   ```bash
   vercel
   ```

4. **Production'a deploy edin:**
   ```bash
   vercel --prod
   ```

### Yöntem 2: Vercel Dashboard ile Deploy

1. **Vercel Dashboard'a gidin:** https://vercel.com/dashboard

2. **"Add New Project"** butonuna tıklayın

3. **GitHub/GitLab/Bitbucket repository'nizi bağlayın**

4. **Project Settings:**
   - **Framework Preset:** Next.js
   - **Root Directory:** `./` (root)
   - **Build Command:** `npm run build` (memory limit otomatik ayarlanmış)
   - **Output Directory:** `.next` (Next.js varsayılan)
   - **Install Command:** `npm install`

5. **Environment Variables ekleyin:**
   
   Vercel Dashboard'da **Settings > Environment Variables** bölümüne gidin ve şunları ekleyin:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
   NEXTAUTH_SECRET=your-secret-key
   NEXTAUTH_URL=https://your-app.vercel.app
   ```

   **ÖNEMLİ:** 
   - `NEXTAUTH_URL` production URL'inizi içermeli
   - Tüm environment variables'ları **Production**, **Preview**, ve **Development** için ekleyin

6. **Deploy butonuna tıklayın**

## 🔧 Vercel Build Ayarları

Vercel otomatik olarak Next.js'i algılar, ancak özel ayarlar için `vercel.json` dosyası zaten mevcut:

```json
{
  "crons": [
    {
      "path": "/api/cron/check-overdue-invoices",
      "schedule": "0 9 * * *"
    }
    // ... diğer cron job'lar
  ]
}
```

## 📝 Post-Deploy Kontrolleri

### 1. Health Check

Deploy sonrası health check endpoint'ini test edin:

```bash
curl https://your-app.vercel.app/api/health
```

### 2. Ana Sayfa Testi

Tarayıcıda açın: `https://your-app.vercel.app/tr`

### 3. Login Testi

Login sayfasını test edin: `https://your-app.vercel.app/tr/login`

### 4. API Endpoint Testleri

```bash
# Dashboard KPI'ları
curl https://your-app.vercel.app/api/analytics/kpis

# Customers listesi
curl https://your-app.vercel.app/api/customers
```

## 🔐 Güvenlik Kontrolleri

### 1. Environment Variables Kontrolü

Vercel Dashboard'da tüm environment variables'ların doğru eklendiğinden emin olun.

### 2. Supabase RLS Kontrolü

Supabase Dashboard'da RLS policies'lerin aktif olduğundan emin olun.

### 3. NextAuth Secret

`NEXTAUTH_SECRET` güçlü bir key olmalı. Yeni key oluşturmak için:

```bash
openssl rand -base64 32
```

## 🐛 Sorun Giderme

### Build Hatası: "JavaScript heap out of memory"

**Çözüm:** 
- `package.json`'da build script'i zaten memory limit ile yapılandırılmış
- Vercel Dashboard'da **Settings > General > Build & Development Settings** bölümünde:
  - **Build Command:** `npm run build` (varsayılan - memory limit otomatik)
  - Veya manuel: `NODE_OPTIONS=--max-old-space-size=4096 npm run build`

### Environment Variables Hatası

**Çözüm:** 
- Tüm environment variables'ların eklendiğinden emin olun
- `NEXT_PUBLIC_*` prefix'li değişkenlerin doğru olduğundan emin olun
- Production, Preview, Development için ayrı ayrı eklenmiş olmalı

### Supabase Bağlantı Hatası

**Çözüm:**
- Supabase Dashboard'da IP whitelist kontrolü yapın
- Vercel'in IP adreslerini Supabase'e ekleyin (gerekirse)
- Connection string'i kontrol edin

### NextAuth Hatası

**Çözüm:**
- `NEXTAUTH_URL` production URL'inizi içermeli
- `NEXTAUTH_SECRET` güçlü bir key olmalı
- Vercel Dashboard'da environment variables'ları kontrol edin

## 📊 Monitoring

### Vercel Analytics

Vercel Dashboard'da **Analytics** bölümünden performans metriklerini takip edin.

### Supabase Monitoring

Supabase Dashboard'da **Database > Logs** bölümünden query performansını takip edin.

## 🔄 Continuous Deployment

Vercel otomatik olarak Git push'larınızı deploy eder:

- **Main branch** → Production
- **Diğer branch'ler** → Preview deployments

## 📚 Ek Kaynaklar

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-to-prod)

## ✅ Deploy Checklist

- [ ] Build test başarılı (yerel)
- [ ] Environment variables hazır
- [ ] Vercel projesi oluşturuldu
- [ ] Environment variables Vercel'e eklendi
- [ ] İlk deploy tamamlandı
- [ ] Health check başarılı
- [ ] Login testi başarılı
- [ ] API endpoint'leri çalışıyor
- [ ] Cron job'lar aktif (Vercel Pro plan gerekli)
- [ ] Monitoring kuruldu

---

**Not:** Vercel'in ücretsiz planında cron job'lar çalışmaz. Cron job'lar için Vercel Pro plan gerekir veya alternatif olarak external cron service kullanabilirsiniz (örn: cron-job.org).

