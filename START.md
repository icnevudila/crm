# 🚀 CRM Enterprise V3 - Hızlı Başlangıç

## 📋 Projeyi Çalıştırma

### 1. Terminal'i Açın

**Windows'ta:**
- `Win + R` tuşlarına basın
- `cmd` yazın ve Enter'a basın
- VEYA PowerShell açın

### 2. Proje Klasörüne Gidin

```bash
cd C:\Users\TP2\Documents\CRMV2
```

### 3. Bağımlılıkları Yükleyin (İlk Kez Çalıştırıyorsanız)

```bash
npm install
```

### 4. Geliştirme Sunucusunu Başlatın

```bash
npm run dev
```

### 5. Tarayıcıda Açın

- **Login Sayfası:** http://localhost:3000/login
- **Dashboard:** http://localhost:3000/tr/dashboard (login sonrası)

---

## 🎯 Hızlı Komutlar

```bash
# Projeyi çalıştır
npm run dev

# Build (production için)
npm run build

# Production'da çalıştır
npm start

# Lint kontrolü
npm run lint

# Seed data yükle (demo veriler)
npm run seed
```

---

## 🔐 Demo Girişi

1. Login sayfasında bir şirket seçin
2. Seed'den oluşturulan kullanıcı email'ini girin
3. Şifre: **demo123**

---

## ✅ Kontrol Listesi

- [ ] `.env.local` dosyası oluşturuldu mu?
- [ ] Supabase schema.sql çalıştırıldı mı?
- [ ] Supabase rls.sql çalıştırıldı mı?
- [ ] Seed data yüklendi mi? (`npm run seed`)
- [ ] `npm run dev` çalıştırıldı mı?

---

## 🐛 Sorun Giderme

### Port 3000 kullanımda hatası:
```bash
# Farklı port'ta çalıştır
set PORT=3001 && npm run dev
```

### Bağımlılık hataları:
```bash
# Node modules'ı sil ve tekrar yükle
rm -rf node_modules
npm install
```

### Database bağlantı hatası:
- `.env.local` dosyasındaki `DATABASE_URL`'i kontrol edin
- Password'un doğru olduğundan emin olun







