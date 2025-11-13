# Multi-Tenant Debug Raporu

## Sorun
`test@test.com` kullanıcısı ile giriş yapıldığında hala tüm veriler görülebiliyor. Normal kullanıcı sadece kendi firmasının verilerini görmeli.

## Kontrol Edilmesi Gerekenler

### 1. Kullanıcının Rolü ve CompanyId'si
Terminal'de development modunda çalışıyorsanız, API çağrılarında şu logları göreceksiniz:

```
[Customers API] 🔍 Session Check: {
  userId: 'xxx',
  email: 'test@test.com',
  role: 'USER' veya 'ADMIN' veya 'SUPER_ADMIN',  // ⚠️ Bu çok önemli!
  companyId: 'yyy',
  companyName: 'Test Company',
  isSuperAdmin: true/false
}
```

**Eğer `role: 'SUPER_ADMIN'` görüyorsanız**, o zaman kullanıcı SuperAdmin olarak kaydedilmiş demektir ve bu yüzden tüm verileri görebilir.

### 2. API Filtresi Kontrolü
Normal kullanıcı için şu log görünmeli:
```
[Customers API] 🔒 Customer query filtered by companyId: yyy
```

SuperAdmin için şu log görünmeli:
```
[Customers API] 👑 SuperAdmin - showing all companies
```

### 3. Veritabanında Kullanıcı Kontrolü
Supabase'de `User` tablosunda `test@test.com` kullanıcısının:
- `role` kolonu: `'USER'`, `'ADMIN'` veya `'SUPER_ADMIN'` olmalı
- `companyId` kolonu: Kullanıcının ait olduğu firma ID'si olmalı

### 4. Session Kontrolü
Browser console'da (F12) şunu çalıştırın:
```javascript
fetch('/api/auth/session', { credentials: 'include' })
  .then(res => res.json())
  .then(data => console.log('Session:', data))
```

Bu, session'da kullanıcının rolünü ve companyId'sini gösterecektir.

## Olası Çözümler

### Çözüm 1: Kullanıcının Rolünü Düzelt
Eğer kullanıcı `SUPER_ADMIN` rolünde kayıtlıysa:
1. Supabase'de `User` tablosunu açın
2. `test@test.com` kullanıcısını bulun
3. `role` kolonunu `'USER'` veya `'ADMIN'` yapın
4. Logout yapıp tekrar login yapın

### Çözüm 2: Session'ı Temizle
Bazen eski session cookie'si sorun yaratabilir:
1. Browser'da cookie'leri temizleyin (F12 > Application > Cookies)
2. `crm_session` cookie'sini silin
3. Tekrar login yapın

### Çözüm 3: API Endpoint'lerinde Filtre Kontrolü
Tüm API endpoint'lerinde `if (!isSuperAdmin)` kontrolü olmalı ve `companyId` filtresi uygulanmalı. Bu kontrol yapıldı ve doğru görünüyor.

## Kontrol Listesi

- [ ] Terminal loglarını kontrol et (role ve isSuperAdmin değerleri)
- [ ] Browser console'da session'ı kontrol et (`/api/auth/session`)
- [ ] Supabase'de User tablosunda `test@test.com` kullanıcısının rolünü kontrol et
- [ ] `companyId` filtresinin uygulandığını doğrula (log mesajlarında)
- [ ] Logout yapıp tekrar login yap

## Test Senaryosu

1. `test@test.com` ile giriş yap
2. Terminal'de logları kontrol et
3. Browser console'da session'ı kontrol et
4. Eğer `role: 'SUPER_ADMIN'` görüyorsan, Supabase'de rolü değiştir
5. Logout yapıp tekrar login yap
6. Tekrar test et - sadece kendi firmasının verilerini görmeli


