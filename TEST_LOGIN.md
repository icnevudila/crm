# ✅ Login Test Adımları

## 1. API Route Çalışıyor ✅
`/api/auth/session` endpoint'i `{}` döndü - bu doğru!

## 2. Login Sayfasında Test Edin

### Adımlar:
1. **Login sayfasına gidin:**
   ```
   http://localhost:3000/tr/login
   ```

2. **Browser DevTools'u açın:**
   - F12 tuşuna basın
   - Console ve Network sekmelerini açık tutun

3. **Login bilgilerini girin:**
   - **Email:** `superadmin@crm.com`
   - **Şifre:** `demo123` veya `superadmin123`

4. **"Giriş Yap" butonuna tıklayın**

5. **Console'da kontrol edin:**
   - ✅ `🔐 Calling signIn with:` logu görünüyor mu?
   - ✅ `📦 signIn result:` logu görünüyor mu?
   - ❌ Hata var mı? (kırmızı mesajlar)

6. **Network sekmesinde kontrol edin:**
   - `/api/auth/callback/credentials` isteği var mı?
   - Status code: 200 mı?
   - Response body'de ne var?

## 3. Beklenen Sonuçlar

### ✅ Başarılı Login:
- Console'da: `✅ Login successful, redirecting...`
- Network'te: `/api/auth/callback/credentials` → Status 200
- Sayfa: `/tr/dashboard` sayfasına yönlendirilir

### ❌ Hata Durumları:

#### Hata 1: "Failed to construct 'URL': Invalid URL"
**Çözüm:**
- Server'ı yeniden başlatın (Ctrl+C, sonra `npm run dev`)
- Browser cache temizleyin (Ctrl+Shift+R)

#### Hata 2: "CredentialsSignin"
**Anlamı:** Email veya şifre yanlış
**Çözüm:**
- Supabase'deki User tablosunda kullanıcı var mı kontrol edin
- Şifre: `demo123` veya `superadmin123` olmalı

#### Hata 3: "User not found"
**Anlamı:** Supabase'de kullanıcı bulunamadı
**Çözüm:**
- Supabase Dashboard → Table Editor → User tablosunu kontrol edin
- Email: `superadmin@crm.com` var mı?

#### Hata 4: 404 Not Found
**Anlamı:** API route bulunamıyor
**Çözüm:**
- `src/app/api/auth/[...nextauth]/route.ts` dosyası mevcut mu?
- Server'ı yeniden başlatın

## 4. Debug Modu

Eğer hala sorun varsa, debug modunu açın:

`.env.local` dosyasına ekleyin:
```env
NEXTAUTH_DEBUG=true
```

Sonra server'ı yeniden başlatın. Bu, NextAuth'un daha fazla log üretmesini sağlar.

## 5. Server Terminal Logları

Login butonuna tıkladığınızda, server terminal'inde şu loglar görünmeli:

```
🔐 authorize called with email: superadmin@crm.com
✅ User found: superadmin@crm.com Role: SUPER_ADMIN
✅ Password matched
✅ authorize returning user data: { id: '...', email: '...', role: '...' }
```

Eğer bu loglar görünmüyorsa:
- NextAuth API route'una istek gitmiyor
- `/api/auth/[...nextauth]/route.ts` dosyasında sorun olabilir

## 6. Supabase Kontrolü

Supabase'de kullanıcı var mı kontrol edin:

1. Supabase Dashboard'a gidin
2. Table Editor → User tablosunu açın
3. Şu kullanıcı var mı?
   - Email: `superadmin@crm.com`
   - Password: `demo123` veya hash'lenmiş
   - Role: `SUPER_ADMIN`

Eğer yoksa, seed script'i çalıştırın veya manuel olarak ekleyin.


