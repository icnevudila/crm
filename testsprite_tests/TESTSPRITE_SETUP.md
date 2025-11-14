# TestSprite Setup ve Login Bilgileri

## 🔐 TestSprite Login Bilgileri

TestSprite testlerinin kullanması gereken login bilgileri:

### Demo Kullanıcı:
```
Email: admin@tipplusmedikal.com
Password: demo123
```

### Login Sayfası:
- **URL:** `http://localhost:3000/tr/login`
- **Form Fields:**
  - Email input: `input[type="email"]` veya `name="email"`
  - Password input: `input[type="password"]` veya `name="password"`
  - Submit button: `button[type="submit"]` veya text "Giriş Yap"

### Login Endpoint:
- **URL:** `http://localhost:3000/api/auth/login`
- **Method:** POST
- **Body:** 
```json
{
  "email": "admin@tipplusmedikal.com",
  "password": "demo123"
}
```

### Başarılı Login Sonrası:
- **Yönlendirme:** `http://localhost:3000/tr/dashboard`
- **Cookie:** `crm_session` cookie'si set edilmeli

## ⚠️ Önemli Notlar

1. **Seed Data Gerekli:** 
   ```bash
   npm run seed
   ```
   Bu komut demo kullanıcıları oluşturur.

2. **Login Sayfası Route:**
   - TestSprite `http://localhost:3000/tr/login` veya `http://localhost:3000/login` adresine gitmeli
   - İki farklı login sayfası var ama `/tr/login` kullanılmalı

3. **Login Endpoint:**
   - Login sayfası `/api/auth/login` endpoint'ini kullanıyor
   - NextAuth değil, custom auth sistemi

4. **Session:**
   - Login başarılı olduğunda `crm_session` cookie'si oluşturuluyor
   - Bu cookie sonraki isteklerde gönderilmeli

## 🧪 Test Senaryosu

1. **Login Sayfasına Git:**
   ```
   Navigate to: http://localhost:3000/tr/login
   ```

2. **Email Gir:**
   ```
   Find: input[type="email"]
   Type: admin@tipplusmedikal.com
   ```

3. **Password Gir:**
   ```
   Find: input[type="password"]
   Type: demo123
   ```

4. **Submit:**
   ```
   Find: button[type="submit"]
   Click
   ```

5. **Beklenen Sonuç:**
   ```
   URL should be: http://localhost:3000/tr/dashboard
   Cookie should exist: crm_session
   ```

## 🔍 Sorun Giderme

### Login Başarısız Olursa:

1. **Seed Data Kontrolü:**
   ```bash
   npm run seed
   ```

2. **Kullanıcı Kontrolü:**
   - Supabase Dashboard'da `User` tablosunu kontrol et
   - `admin@tipplusmedikal.com` kullanıcısı var mı?

3. **Login Endpoint Kontrolü:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@tipplusmedikal.com","password":"demo123"}'
   ```

4. **Development Server:**
   ```bash
   npm run dev
   ```
   Port 3000'de çalışıyor mu kontrol et.

## 📝 TestSprite Test Plan Güncellemesi

TestSprite test planında login bilgileri şu şekilde kullanılmalı:

```json
{
  "login": {
    "url": "http://localhost:3000/tr/login",
    "email": "admin@tipplusmedikal.com",
    "password": "demo123",
    "expectedRedirect": "http://localhost:3000/tr/dashboard"
  }
}
```







