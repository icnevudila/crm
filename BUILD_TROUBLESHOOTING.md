# 🔧 Build-Time Supabase Hataları - Troubleshooting Rehberi

## ✅ Kontrol Listesi (Aynı Hata Devam Ederse)

### 1. Environment Variables Kontrolü
Vercel Dashboard → Settings → Environment Variables

**Zorunlu Variables:**
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `DATABASE_URL`
- ✅ `NEXTAUTH_SECRET`
- ✅ `NEXTAUTH_URL`

**Kontrol:**
- Tüm environment'lar için ekli mi? (Production, Preview, Development)
- Değerler doğru mu? (boşluk, yanlış karakter yok mu?)

### 2. Build Log Kontrolü
Vercel Dashboard → Deployments → [Failed Deployment] → Build Logs

**Aranacak Hatalar:**
```
Error: supabaseUrl is required.
Error: Missing Supabase environment variables
Failed to collect page data for /api/[route]
```

**Hangi route hata veriyor?**
- Log'da hangi route hatası var?
- Örnek: `/api/competitors/[id]` → Bu route'u kontrol et

### 3. API Route Kontrolleri

#### 3.1. `dynamic = 'force-dynamic'` Kontrolü
Her API route dosyasında (`src/app/api/**/route.ts`) şu satırlar olmalı:

```typescript
// Dynamic route - build-time'da çalışmasın
export const dynamic = 'force-dynamic'
export const revalidate = 0
```

**Kontrol Komutu:**
```bash
# Eksik olan route'ları bul
grep -r "export async function" src/app/api --include="*.ts" | grep -v "export const dynamic"
```

#### 3.2. `createClient` Kullanımı Kontrolü
**YANLIŞ:**
```typescript
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

**DOĞRU:**
```typescript
import { getSupabaseWithServiceRole } from '@/lib/supabase'

export async function GET() {
  const supabase = getSupabaseWithServiceRole() // Fonksiyon içinde
  // ...
}
```

**Kontrol Komutu:**
```bash
# createClient kullanan route'ları bul
grep -r "createClient(" src/app/api --include="*.ts"
```

#### 3.3. Module-Level Supabase Client Kontrolü
**YANLIŞ:**
```typescript
// Route dosyasının en üstünde (module-level)
const supabase = createClient(...)
```

**DOĞRU:**
```typescript
// Fonksiyon içinde (runtime'da)
export async function GET() {
  const supabase = getSupabaseWithServiceRole()
}
```

### 4. Supabase Client Build-Time Detection

`src/lib/supabase.ts` dosyasında build-time detection olmalı:

```typescript
const isBuildTime = 
  process.env.NEXT_PHASE === 'phase-production-build' ||
  process.env.NEXT_PHASE === 'phase-export' ||
  process.env.NEXT_PHASE === 'phase-development' ||
  (typeof window === 'undefined' && process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV) ||
  process.env.__NEXT_PRIVATE_PREBUNDLED_REACT

if (isBuildTime) {
  return createClient('https://placeholder.supabase.co', 'placeholder-key', {
    auth: { persistSession: false },
  })
}
```

### 5. Next.js Config Kontrolü

`next.config.js` dosyasında:

```javascript
eslint: {
  ignoreDuringBuilds: true,
},
typescript: {
  ignoreBuildErrors: true, // Geçici olarak
},
```

### 6. Hata Veren Route'u Düzeltme

Eğer belirli bir route hata veriyorsa:

1. **Route dosyasını aç:**
   - Örnek: `src/app/api/competitors/[id]/route.ts`

2. **Kontrol et:**
   - ✅ `export const dynamic = 'force-dynamic'` var mı?
   - ✅ `createClient` yerine `getSupabaseWithServiceRole()` kullanılıyor mu?
   - ✅ Supabase client fonksiyon içinde mi oluşturuluyor?

3. **Düzelt:**
   ```typescript
   // En üste ekle
   export const dynamic = 'force-dynamic'
   export const revalidate = 0
   
   // createClient'ı kaldır, fonksiyon içinde getSupabaseWithServiceRole() kullan
   ```

### 7. Commit ve Push

Düzeltmelerden sonra:
```bash
git add .
git commit -m "Fix: [Route adı] build-time hatası düzeltildi"
git push
```

### 8. Vercel Build Log'larını İzle

Vercel Dashboard → Deployments → [Latest] → Build Logs

**Başarılı Build Göstergeleri:**
- ✅ `✓ Compiled successfully`
- ✅ `Collecting page data ...` (hata yok)
- ✅ `Generating static pages`
- ✅ `Build completed`

**Hata Göstergeleri:**
- ❌ `Error: supabaseUrl is required`
- ❌ `Failed to collect page data for /api/[route]`
- ❌ `Build error occurred`

## 🚨 Acil Durum Çözümleri

### Çözüm 1: Tüm API Route'larına `dynamic = 'force-dynamic'` Ekle

```bash
# Tüm route dosyalarını bul
find src/app/api -name "route.ts" -type f

# Her birine manuel olarak ekle:
# export const dynamic = 'force-dynamic'
# export const revalidate = 0
```

### Çözüm 2: Environment Variables'ı Tekrar Kontrol Et

Vercel Dashboard → Settings → Environment Variables

**Tüm değerleri sil ve tekrar ekle:**
1. Her variable'ı sil
2. Tek tek tekrar ekle
3. Production, Preview, Development için ayrı ayrı ekle

### Çözüm 3: Build Cache Temizle

Vercel Dashboard → Settings → General → Clear Build Cache

## 📝 Notlar

- Build-time'da environment variables yüklenmeyebilir
- Bu yüzden `dynamic = 'force-dynamic'` zorunlu
- `createClient` module-level'da kullanılmamalı
- Tüm Supabase client'lar fonksiyon içinde oluşturulmalı

