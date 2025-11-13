# 🔍 Login Sorun Giderme Kontrol Listesi

## ❌ HATA: "Failed to construct 'URL': Invalid URL"

Bu hata genellikle NextAuth'un API route'una erişememesi veya URL yapılandırması sorunundan kaynaklanır.

---

## ✅ KONTROL LİSTESİ

### 1. Environment Variables Kontrolü

`.env.local` dosyasında şunlar olmalı:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=XFe5xZj/opLrpGKhFNVL0hFnPtertrZMFU0iVEtxkhs=
NEXT_PUBLIC_SUPABASE_URL=https://serlpsputsdqkgtzclnn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Kontrol:**
```bash
# PowerShell'de kontrol et
Get-Content .env.local
```

---

### 2. NextAuth API Route Kontrolü

Browser'da şu URL'yi açın:
```
http://localhost:3000/api/auth/session
```

**Beklenen Sonuç:**
- ✅ `{"user":null}` veya `{}` dönmeli (hata yoksa)
- ❌ 404 Not Found hatası varsa → API route sorunu var

**Kontrol:**
- Browser DevTools → Network sekmesi
- `/api/auth/session` isteğini kontrol et
- Status code: 200 olmalı

---

### 3. Server Console Kontrolü

Terminal'de (npm run dev çalışırken) şu logları kontrol et:

**Login butonuna tıkladığınızda:**
```
🔐 authorize called with email: superadmin@crm.com
✅ User found: ...
✅ Password matched
✅ authorize returning user data: ...
```

**Eğer bu loglar görünmüyorsa:**
- NextAuth API route'una istek gitmiyor
- `/api/auth/[...nextauth]/route.ts` dosyasında sorun olabilir

---

### 4. Browser Console Kontrolü

Browser DevTools → Console sekmesinde:

**Kontrol Edilecekler:**
- ❌ `Failed to load resource: 404` → API route bulunamıyor
- ❌ `TypeError: Failed to construct 'URL'` → URL parse hatası
- ✅ `signIn result: {ok: true}` → Başarılı login

**Network Sekmesi:**
- `/api/auth/callback/credentials` isteği var mı?
- Status code: 200 mı?
- Response body'de ne var?

---

### 5. NextAuth Route Handler Kontrolü

`src/app/api/auth/[...nextauth]/route.ts` dosyası:
- ✅ Dosya mevcut mu?
- ✅ `export const runtime = 'nodejs'` var mı?
- ✅ GET ve POST handler'ları export edilmiş mi?

---

### 6. SessionProvider Kontrolü

`src/components/providers/SessionProvider.tsx`:
- ✅ `basePath="/api/auth"` doğru mu?
- ✅ Login layout'ta SessionProvider sarılmış mı?

---

## 🔧 HIZLI ÇÖZÜMLER

### Çözüm 1: Server'ı Yeniden Başlat

```bash
# Terminal'de Ctrl+C ile durdur
# Sonra tekrar başlat
npm run dev
```

### Çözüm 2: .env.local'i Yeniden Yükle

```bash
# PowerShell'de
$env:NEXTAUTH_URL="http://localhost:3000"
$env:NEXTAUTH_SECRET="XFe5xZj/opLrpGKhFNVL0hFnPtertrZMFU0iVEtxkhs="
```

Sonra server'ı yeniden başlat.

### Çözüm 3: Browser Cache Temizle

1. Browser DevTools açın (F12)
2. Network sekmesinde "Disable cache" işaretleyin
3. Sayfayı hard refresh yapın (Ctrl+Shift+R)

### Çözüm 4: NextAuth Route'u Test Et

Browser'da direkt test edin:
```
http://localhost:3000/api/auth/providers
```

Bu endpoint NextAuth provider'larını listeler. Eğer çalışıyorsa NextAuth route'u doğru çalışıyor demektir.

---

## 🐛 DEBUG MODU

NextAuth'u debug modda çalıştırmak için `.env.local`'e ekleyin:

```env
NEXTAUTH_DEBUG=true
```

Bu, NextAuth'un daha fazla log üretmesini sağlar.

---

## 📝 TEST ADIMLARI

1. **Server çalışıyor mu?**
   ```bash
   npm run dev
   ```

2. **Login sayfası açılıyor mu?**
   ```
   http://localhost:3000/tr/login
   ```

3. **API route çalışıyor mu?**
   ```
   http://localhost:3000/api/auth/session
   ```

4. **Login denemesi:**
   - Email: `superadmin@crm.com`
   - Şifre: `demo123` veya `superadmin123`
   - Console'da hata var mı?

---

## 🆘 HALA ÇALIŞMIYORSA

1. **Tüm logları toplayın:**
   - Browser Console logları
   - Server Terminal logları
   - Network sekmesi screenshot'ları

2. **Dosyaları kontrol edin:**
   - `src/app/api/auth/[...nextauth]/route.ts` mevcut mu?
   - `src/lib/authOptions.ts` doğru mu?
   - `src/components/providers/SessionProvider.tsx` doğru mu?

3. **Environment variables:**
   - `.env.local` dosyası proje root'unda mı?
   - Tüm değişkenler doğru mu?


