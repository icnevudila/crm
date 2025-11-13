# E2E Test Suite - Playwright

Bu klasör, CRM Enterprise V3 sisteminin end-to-end (E2E) testlerini içerir.

## Kurulum

```bash
# Playwright bağımlılıkları zaten package.json'da mevcut
npm install

# Playwright browser'ları yükle
npx playwright install
```

## Test Çalıştırma

### Tüm Testleri Çalıştır
```bash
npm run test:e2e
```

### UI Modunda Çalıştır (İnteraktif)
```bash
npm run test:e2e:ui
```

### Belirli Bir Test Dosyasını Çalıştır
```bash
npx playwright test e2e/critical-path.spec.ts
```

### Belirli Bir Testi Çalıştır
```bash
npx playwright test e2e/critical-path.spec.ts -g "Login ve Dashboard"
```

## Test Dosyaları

### `critical-path.spec.ts`
Kritik iş akışlarını test eder:
- Login → Dashboard erişimi
- Deal oluşturma → Quote → Invoice akışı
- Multi-tenant izolasyon
- Admin/SuperAdmin yetki kontrolleri
- Form validation
- Navigation
- Responsive design
- Error handling

## Test Verileri

Testler için aşağıdaki test kullanıcıları gereklidir:

- **Normal Kullanıcı**: `test@test.crm` / `test123`
- **Admin Kullanıcı**: `admin@test.crm` / `admin123` (opsiyonel)
- **SuperAdmin Kullanıcı**: `superadmin@test.crm` / `superadmin123` (opsiyonel)

## Notlar

- Testler `http://localhost:3000` üzerinde çalışır
- Development server otomatik olarak başlatılır (`webServer` config)
- Testler CI/CD pipeline'da da çalışabilir
- Screenshot'lar sadece hata durumunda alınır
- Trace dosyaları ilk retry'da kaydedilir

## Test Coverage Hedefleri

- ✅ Critical path testleri
- ⚠️ Multi-tenant izolasyon testleri (geliştirilmeli)
- ⚠️ Admin/SuperAdmin yetki testleri (test kullanıcıları gerekiyor)
- ⚠️ Form validation testleri (geliştirilmeli)
- ⚠️ API error handling testleri (geliştirilmeli)

## İyileştirme Önerileri

1. **Test Kullanıcıları**: Seed script'inde test kullanıcıları oluşturulmalı
2. **Test Verileri**: Her test için izole test verileri oluşturulmalı
3. **API Mocking**: API çağrıları için mock servisler eklenebilir
4. **Visual Regression**: Screenshot karşılaştırması için Percy veya benzeri
5. **Performance Testing**: Lighthouse CI entegrasyonu


