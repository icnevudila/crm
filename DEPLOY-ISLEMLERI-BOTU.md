## Deploy İşlemleri Botu Notları

### 1. Sorun Tespiti ve Supabase Ayarları
- **Problem:** Production ortamında API çağrıları `placeholder.supabase.co` alan adına gidiyordu; veriler Supabase’den gelmiyordu.
- **Çözüm:** `src/lib/supabase.ts` dosyasında build-time tespitini daraltıp sadece `NEXT_PHASE === 'phase-production-build'` kontrolü bırakıldı. Böylece runtime’da gerçekte `https://serlpsputsdqkgztclnn.supabase.co` URL’si kullanılıyor.
- Supabase client’ta özel `fetch` override’ı kaldırıldı. Runtime ayarları tekrar yapılandırıldı; connection pooling ve keep-alive aktif.
- Bu düzeltme `8630a6b – fix: ensure supabase client uses runtime options` commit’iyle `main` branch’ine pushlandı.
- **Sonuç:** Yeni deploy sonrası Vercel loglarında gerçek Supabase host’u görüldü, API’ler veri döndürmeye başladı.

### 2. Session Hataları ve Fixler
- Bazı modüllerde “Session error” uyarısı alındı. Temel sebep: Route’lar hâlâ `getServerSession`’ı doğrudan kullanıyor; Supabase post çağrılarında session alınırken hata fırlatılınca form kaydetme işlemleri başarısız oluyor.
- `src/lib/safe-session.ts` dosyasındaki `getSafeSession` helper’ı 30 dakikalık cache’le güvenli session döndürüyor.
- **Fix örneği:** `src/app/api/customer-companies/route.ts` POST endpoint’i `getSafeSession` ile güncellendi (`c0a679f` commit’i).
- Ancak hâlâ klasik pattern kullanan endpoint’ler mevcut. `Session error` string’ini taşıyan başlıca dosyalar:
  - `src/app/api/analytics/deal-kanban/route.ts`
  - `src/app/api/analytics/distribution/route.ts`
  - `src/app/api/analytics/invoice-kanban/route.ts`
  - `src/app/api/analytics/kpis/route.ts`
  - `src/app/api/analytics/quote-analysis/route.ts`
  - `src/app/api/analytics/quote-kanban/route.ts`
  - `src/app/api/analytics/recent-activities/route.ts`
  - `src/app/api/analytics/trends/route.ts`
  - `src/app/api/analytics/user-performance/route.ts`
  - `src/app/api/companies/route.ts` (POST)
  - `src/app/api/company-permissions/[id]/route.ts`
  - `src/app/api/company-permissions/route.ts`
  - `src/app/api/contacts/[id]/route.ts`
  - `src/app/api/contacts/route.ts`
  - `src/app/api/customers/[id]/route.ts`
  - `src/app/api/customers/route.ts`
  - `src/app/api/deals/[id]/route.ts`
  - `src/app/api/deals/route.ts`
  - `src/app/api/invoices/[id]/route.ts`
  - `src/app/api/invoices/route.ts`
  - `src/app/api/offers/[id]/route.ts`
  - `src/app/api/offers/route.ts`
  - `src/app/api/payments/[id]/route.ts`
  - `src/app/api/payments/route.ts`
  - `src/app/api/products/[id]/route.ts`
  - `src/app/api/products/route.ts`
  - `src/app/api/projects/[id]/route.ts`
  - `src/app/api/projects/route.ts`
  - `src/app/api/sales-forecast/route.ts`
  - `src/app/api/tasks/[id]/route.ts`
  - `src/app/api/tasks/route.ts`
  - `src/app/api/team-members/[id]/route.ts`
  - `src/app/api/team-members/route.ts`

Bu dosyalar ileride `getSafeSession`’a taşınmalı.

### 3. Build Süresi ve Vercel Ayarları
- Build yaklaşık 5 dakika sürüyor; Next.js 15 + büyük paket sayısı için normal kabul edildi.
- `package.json` build script’i `cross-env NODE_OPTIONS=--max-old-space-size=8192 next build`.
- `next.config.js`:
  - `output: 'standalone'`, `compress: true`, `webpackBuildWorker` vb. optimizasyonlar mevcut.
  - `staticPageGenerationTimeout` girişi Next.js 15’de geçersiz uyarısı veriyor; kaldırılması değerlendirilebilir.
- Vercel’de cache’siz redeploy (Redeploy → Do not use previous cache) ile yeni Supabase ayarları etkin oldu.

### 4. Veri Doğrulamaları
- Çalıştırılan Supabase URL ve key’lerin doğruluğu Vercel Production Environment’ında teyit edildi:
  - `NEXT_PUBLIC_SUPABASE_URL = https://serlpsputsdqkgztclnn.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` production anahtarları.
- PostgreSQL bağlantı dizesi: `postgresql://postgres:<şifre>@db.serlpsputsdqkgztclnn.supabase.co:5432/postgres`.
- Kullanıcı verileri production’da görünmeye başladı; API loglarında placeholder host görünmüyor.

### 5. Session Sorunu Yaşanan Modüller
- “Session error” toast’ı ile karşılaşılan sayfalar (örnek: Firmalar → yeni kayıt, bazı analitik/kart sayfaları) `getSafeSession` kullanmadığı için hataya açık.
- Buna karşın bireysel müşteri (Customer) formu gibi bazı sayfalar hatasız; çünkü `getSafeSession` veya farklı kontrol mantıklarıyla session doğrulaması yapılmış.

### 6. Push ve Deployment Stratejisi
- Kullanıcı isteği: Her değişiklik otomatik push’lanmasın; doğrulama sonrası toplu push yapılacak.
- Yine de yedek amaçlı GitHub’a push yapmak uygun.
- Vercel’de deployment hakkı sınırlı olduğu için kritik değişiklikler test edilip toplu deployment yapılacak.

### 7. Açık Notlar / Pending İşler
- Tüm API endpoint’lerini `getSafeSession`’a geçirmek.
- `next.config.js`’te geçersiz `staticPageGenerationTimeout` uyarısını temizlemek.
- Session hatası verdiği bildirilen sayfalar: Firmalar (`/companies`), bazı analitik panelleri. Bireysel müşteri modülü sorunsuz; fark `getSafeSession` kullanımı.






