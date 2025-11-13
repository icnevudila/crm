# TestSprite Login Bilgileri

## 🔐 SuperAdmin Giriş Bilgileri

TestSprite testlerinin kullanması gereken login bilgileri:

```
Email: superadmin@crm.com
Password: superadmin123
Rol: SUPER_ADMIN
```

## 📍 Login Sayfası

- **URL:** `http://localhost:3000/tr/login`
- **Form Fields:**
  - Email: `input[type="email"]`
  - Password: `input[type="password"]`
  - Submit: `button[type="submit"]` veya text içinde "Giriş Yap"

## 🎯 Alternatif Demo Kullanıcılar

Eğer SuperAdmin çalışmazsa, şu demo kullanıcıları deneyin:

### Tipplus Medikal Admin:
```
Email: admin@tipplusmedikal.com
Password: demo123
```

### Global Un Admin:
```
Email: admin@globalun.com
Password: demo123
```

### ZahirTech Admin:
```
Email: admin@zahirtech.com
Password: demo123
```

## ⚠️ Önemli Notlar

1. Login endpoint: `/api/auth/login` (POST)
2. Başarılı login sonrası: `http://localhost:3000/tr/dashboard` yönlendirilir
3. Session cookie: `crm_session` oluşturulur


