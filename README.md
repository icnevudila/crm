# 🚀 CRM Enterprise V3

Premium, hızlı ve optimize CRM sistemi.

## 🎯 Özellikler

- ⚡ **Maksimum Performans**: Sekmeler arası geçiş <300ms
- 🎨 **Premium Tema**: Modern ve tutarlı tasarım
- 🗄️ **Supabase**: Direkt Supabase entegrasyonu
- 🌐 **Çoklu Dil**: TR/EN desteği
- 📊 **Dashboard**: Gerçek zamanlı KPI'lar ve grafikler
- 🔐 **Güvenlik**: RLS (Row-Level Security) ile multi-tenant yapı

## 🏗️ Teknoloji Stack

- **Frontend**: Next.js 15 (App Router), React 18, TypeScript
- **Styling**: TailwindCSS (Premium tema) + shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **State Management**: SWR (cache layer), Zustand
- **Auth**: NextAuth.js
- **Charts**: Recharts
- **Animations**: Framer Motion
- **PDF**: @react-pdf/renderer
- **Locale**: next-intl

## 📋 Kurulum

1. **Bağımlılıkları yükle:**
   ```bash
   npm install
   ```

2. **Environment variables oluştur:**
   ```bash
   cp .env.local.example .env.local
   ```
   
   `.env.local` dosyasına Supabase bilgilerinizi ekleyin:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
   NEXTAUTH_SECRET=your-secret-key
   NEXTAUTH_URL=http://localhost:3000
   ```

3. **Supabase Database Setup:**
   - Supabase dashboard'a gidin
   - SQL Editor'da `supabase/schema.sql` dosyasını çalıştırın
   - `supabase/rls.sql` dosyasını çalıştırın (RLS policies)

4. **Seed Data (Opsiyonel):**
   ```bash
   npm run seed
   ```

5. **Geliştirme sunucusunu başlat:**
   ```bash
   npm run dev
   ```

6. Tarayıcıda açın: [http://localhost:3000/tr](http://localhost:3000/tr)

## 📚 Dokümantasyon

- [PRD.md](./PRD.md) - Performance Requirements Document
- [TODO.md](./TODO.md) - Yapılacaklar listesi
- [.cursorrules](./.cursorrules) - Cursor AI Development Rules

## 🎨 Premium Tema Renkleri

- **Primary**: Indigo (#6366f1)
- **Secondary**: Purple (#8b5cf6)
- **Accent**: Pink (#ec4899)

## ⚡ Performans Hedefleri

- Sekme geçişi: <300ms
- Dashboard ilk render: <500ms
- API response (cache hit): <200ms
- API response (cache miss): <1000ms

## 📝 Geliştirme

Proje yapısı:
```
src/
├── app/          # Next.js App Router sayfaları
├── components/   # React componentleri
│   ├── ui/       # shadcn/ui components
│   ├── layout/   # Layout components
│   └── skeletons/# Loading skeletons
├── lib/          # Utility fonksiyonları (API, Supabase, utils)
├── hooks/        # Custom React hooks
└── locales/      # Çeviri dosyaları (TR/EN)
```

## 🔒 Güvenlik

- Row-Level Security (RLS) ile multi-tenant veri izolasyonu
- NextAuth.js ile kimlik doğrulama
- API endpoint'lerinde auth kontrolü

## 📄 Lisans

Private - CRM Enterprise V3
