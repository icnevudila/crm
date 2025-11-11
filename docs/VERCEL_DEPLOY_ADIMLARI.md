# 🚀 Vercel Deploy - Adım Adım Rehber

## 📋 ÖN HAZIRLIK

### 1. Environment Variables Listesi

Deploy için şu environment variables'ları hazırlamanız gerekiyor:

```
NEXT_PUBLIC_SUPABASE_URL=https://serlpsputsdqkgtzclnn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcmxwc3B1dHNkcWtndHpjbG5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwOTUzNTgsImV4cCI6MjA3NzY3MTM1OH0.ozlEJkOCkFt8Yl40gdXP7UPqZEtmDawSTqMqhjiR4xQ
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcmxwc3B1dHNkcWtndHpjbG5uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjA5NTM1OCwiZXhwIjoyMDc3NjcxMzU4fQ.6UINwDcWZW1qklOKb8Ls8Z2veO0gbcT9RCNbleuOzuU
DATABASE_URL=postgresql://postgres:WnC0jpTEVNEbn56I@db.serlpsputsdqkgtzclnn.supabase.co:5432/postgres
NEXTAUTH_SECRET=[BURAYA_GÜÇLÜ_BİR_SECRET_KEY_YAZIN]
NEXTAUTH_URL=[DEPLOY_SONRASI_VERCEL_URL_BURAYA_GELECEK]
```

**ÖNEMLİ:**
- `NEXTAUTH_SECRET` için güçlü bir key oluşturun: `openssl rand -base64 32`
- `NEXTAUTH_URL` deploy sonrası Vercel'in verdiği URL olacak (örn: `https://crm-enterprise-v3.vercel.app`)

---

## 🚀 ADIM ADIM DEPLOY

### ADIM 1: Vercel CLI ile Deploy

Terminal'de şu komutları çalıştırın:

```bash
# 1. Projeyi deploy et (ilk kez)
vercel

# Sorulara cevap verin:
# - Set up and deploy? → Y (Yes)
# - Which scope? → [Kendi hesabınızı seçin]
# - Link to existing project? → N (No, yeni proje)
# - Project name? → crm-enterprise-v3 (veya istediğiniz isim)
# - Directory? → ./
# - Override settings? → N (No)

# 2. Environment Variables ekle (deploy sonrası)
# Vercel Dashboard'dan ekleyeceğiz (aşağıdaki adımlara bakın)
```

### ADIM 2: Environment Variables Ekleme

**Vercel Dashboard'dan:**

1. https://vercel.com/dashboard adresine gidin
2. Deploy ettiğiniz projeyi seçin
3. **Settings** → **Environment Variables** bölümüne gidin
4. Şu değişkenleri ekleyin (her birini Production, Preview, Development için ekleyin):

#### Değişken 1: NEXT_PUBLIC_SUPABASE_URL
- **Key:** `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** `https://serlpsputsdqkgtzclnn.supabase.co`
- **Environment:** Production, Preview, Development (hepsini seçin)

#### Değişken 2: NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Key:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcmxwc3B1dHNkcWtndHpjbG5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwOTUzNTgsImV4cCI6MjA3NzY3MTM1OH0.ozlEJkOCkFt8Yl40gdXP7UPqZEtmDawSTqMqhjiR4xQ`
- **Environment:** Production, Preview, Development

#### Değişken 3: SUPABASE_SERVICE_ROLE_KEY
- **Key:** `SUPABASE_SERVICE_ROLE_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcmxwc3B1dHNkcWtndHpjbG5uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjA5NTM1OCwiZXhwIjoyMDc3NjcxMzU4fQ.6UINwDcWZW1qklOKb8Ls8Z2veO0gbcT9RCNbleuOzuU`
- **Environment:** Production, Preview, Development

#### Değişken 4: DATABASE_URL
- **Key:** `DATABASE_URL`
- **Value:** `postgresql://postgres:WnC0jpTEVNEbn56I@db.serlpsputsdqkgtzclnn.supabase.co:5432/postgres`
- **Environment:** Production, Preview, Development

#### Değişken 5: NEXTAUTH_SECRET
- **Key:** `NEXTAUTH_SECRET`
- **Value:** [Güçlü bir secret key oluşturun - aşağıdaki komutu çalıştırın]
- **Environment:** Production, Preview, Development

**Secret Key Oluşturma:**
```bash
# Windows PowerShell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))

# Linux/Mac
openssl rand -base64 32
```

#### Değişken 6: NEXTAUTH_URL
- **Key:** `NEXTAUTH_URL`
- **Value:** `https://[PROJENIZIN-VERCEL-URL].vercel.app` (deploy sonrası Vercel'in verdiği URL)
- **Environment:** Production, Preview, Development

**Örnek:** `https://crm-enterprise-v3.vercel.app`

### ADIM 3: Environment Variables Sonrası Redeploy

Environment variables ekledikten sonra projeyi yeniden deploy etmeniz gerekiyor:

**Yöntem 1: Vercel Dashboard'dan**
1. Proje sayfasında **Deployments** sekmesine gidin
2. En son deployment'ın yanındaki **...** (üç nokta) menüsüne tıklayın
3. **Redeploy** seçeneğini seçin
4. **Use existing Build Cache** seçeneğini kapatın (environment variables'ların yüklenmesi için)
5. **Redeploy** butonuna tıklayın

**Yöntem 2: Vercel CLI ile**
```bash
vercel --prod
```

### ADIM 4: Production Deploy

İlk deploy preview deployment oluşturur. Production'a deploy etmek için:

```bash
vercel --prod
```

---

## ✅ DEPLOY SONRASI KONTROLLER

### 1. Ana Sayfa Kontrolü

Tarayıcıda açın: `https://[PROJENIZIN-URL].vercel.app/tr`

### 2. Login Sayfası Kontrolü

`https://[PROJENIZIN-URL].vercel.app/tr/login`

### 3. API Endpoint Kontrolleri

```bash
# Health check
curl https://[PROJENIZIN-URL].vercel.app/api/health

# Dashboard KPI'ları
curl https://[PROJENIZIN-URL].vercel.app/api/analytics/kpis

# Customers listesi
curl https://[PROJENIZIN-URL].vercel.app/api/customers
```

### 4. Console Hataları Kontrolü

Tarayıcı Developer Tools (F12) → Console sekmesinde hata olmamalı.

---

## 🔧 SORUN GİDERME

### Problem: Environment Variables Yüklenmiyor

**Çözüm:**
1. Vercel Dashboard'da **Settings** → **Environment Variables** bölümünde tüm değişkenlerin eklendiğinden emin olun
2. **Production, Preview, Development** için ayrı ayrı eklendiğinden emin olun
3. Projeyi **Redeploy** edin (Build Cache olmadan)

### Problem: Build Hatası

**Çözüm:**
1. Vercel Dashboard'da **Settings** → **General** → **Build & Development Settings**
2. **Build Command:** `npm run build` (varsayılan - zaten doğru)
3. **Node.js Version:** 20.x (veya 18.x)

### Problem: NextAuth Hatası

**Çözüm:**
1. `NEXTAUTH_URL` environment variable'ının doğru olduğundan emin olun
2. Production URL'inizi içermeli: `https://[PROJENIZIN-URL].vercel.app`
3. `NEXTAUTH_SECRET` güçlü bir key olmalı (32+ karakter)

### Problem: Supabase Bağlantı Hatası

**Çözüm:**
1. `NEXT_PUBLIC_SUPABASE_URL` ve `NEXT_PUBLIC_SUPABASE_ANON_KEY` doğru olduğundan emin olun
2. Supabase Dashboard'da **Settings** → **API** bölümünden key'leri kontrol edin
3. Supabase Dashboard'da **Settings** → **Database** → **Connection Pooling** aktif olmalı

---

## 📊 VERCEL DASHBOARD AYARLARI

### Build Settings

**Settings** → **General** → **Build & Development Settings:**

- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next` (Next.js varsayılan)
- **Install Command:** `npm install`
- **Node.js Version:** 20.x (veya 18.x)

### Domain Ayarları (Opsiyonel)

**Settings** → **Domains:**

Kendi domain'inizi ekleyebilirsiniz (örn: `crm.yourcompany.com`)

---

## 🔄 OTOMATIK DEPLOY (Git Entegrasyonu)

### GitHub/GitLab/Bitbucket Bağlama

1. Vercel Dashboard'da projenize gidin
2. **Settings** → **Git**
3. Repository'nizi bağlayın
4. Artık her `git push` otomatik deploy olacak:
   - **main/master branch** → Production
   - **Diğer branch'ler** → Preview deployments

---

## 📝 ÖNEMLİ NOTLAR

1. **Environment Variables:** Tüm değişkenleri Production, Preview, Development için ayrı ayrı ekleyin
2. **NEXTAUTH_URL:** Deploy sonrası Vercel'in verdiği URL'i kullanın
3. **Build Timeout:** Vercel ücretsiz planda 45 saniye, Pro planda 300 saniye
4. **Cron Jobs:** Vercel Pro plan gerekir (ücretsiz planda çalışmaz)
5. **Function Timeout:** Vercel ücretsiz planda 10 saniye, Pro planda 60 saniye

---

## ✅ DEPLOY CHECKLIST

- [ ] Vercel CLI yüklü ve login yapıldı
- [ ] `vercel` komutu çalıştırıldı (ilk deploy)
- [ ] Environment variables hazırlandı
- [ ] Environment variables Vercel Dashboard'a eklendi (Production, Preview, Development)
- [ ] `NEXTAUTH_SECRET` güçlü bir key ile oluşturuldu
- [ ] `NEXTAUTH_URL` production URL ile güncellendi
- [ ] Proje redeploy edildi (environment variables için)
- [ ] `vercel --prod` ile production deploy yapıldı
- [ ] Ana sayfa test edildi
- [ ] Login sayfası test edildi
- [ ] API endpoint'leri test edildi
- [ ] Console hataları kontrol edildi

---

**Hazırsanız, şu komutu çalıştırın:**

```bash
vercel
```

Sorulara **Y** (Yes) diyerek devam edin. Deploy sonrası environment variables'ları ekleyin ve redeploy edin.


