# TestSprite Login Bilgileri

## 🔐 Demo Kullanıcı Bilgileri

TestSprite testlerinin kullanması gereken login bilgileri:

### Önerilen Test Kullanıcısı:
```
Email: admin@tipplusmedikal.com
Password: demo123
```

### Alternatif Kullanıcılar:
```
Email: admin@globalun.com
Password: demo123

Email: admin@zahirtech.com
Password: demo123
```

## 📍 Login Sayfası URL'i

TestSprite'ın kullanması gereken login sayfası:
- **URL:** `http://localhost:3000/tr/login` veya `http://localhost:3000/login`
- **Endpoint:** `/api/auth/login` (POST)

## ⚠️ Önemli Notlar

1. **Seed Data Gerekli:** Demo kullanıcıların veritabanında olması için `npm run seed` komutunu çalıştırın.

2. **Login Endpoint:** Login sayfası `/api/auth/login` endpoint'ini kullanıyor (NextAuth değil, custom auth).

3. **Session:** Login başarılı olduğunda cookie'ye `crm_session` kaydediliyor.

4. **Yönlendirme:** Başarılı login sonrası `/{locale}/dashboard` sayfasına yönlendiriliyor.

## 🧪 Test Senaryosu

1. Login sayfasına git: `http://localhost:3000/tr/login`
2. Email gir: `admin@tipplusmedikal.com`
3. Password gir: `demo123`
4. Submit butonuna tıkla
5. Dashboard'a yönlendirilmeli: `http://localhost:3000/tr/dashboard`

## 🔍 Sorun Giderme

Eğer login başarısız olursa:
1. Seed data yüklü mü kontrol et: `npm run seed`
2. Veritabanında kullanıcı var mı kontrol et
3. Login endpoint çalışıyor mu kontrol et: `curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@tipplusmedikal.com","password":"demo123"}'`



