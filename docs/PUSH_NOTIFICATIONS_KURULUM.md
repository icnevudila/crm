# 🔔 Browser Push Notifications Kurulum Rehberi

## 🎯 Genel Bakış

CRM sistemi artık Web Push API ile browser push notifications desteklemektedir. Kullanıcılar tarayıcıda kapalı olsa bile bildirim alabilirler.

---

## ✅ 1. VAPID Keys Oluşturma

### 1.1. VAPID Keys Oluştur
```bash
node scripts/generate-vapid-keys.js
```

Bu komut size şu çıktıyı verecek:
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:admin@yourdomain.com
```

### 1.2. Environment Variables
`.env.local` dosyasına ekleyin:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_SUBJECT=mailto:admin@yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

**ÖNEMLİ:** `VAPID_PRIVATE_KEY`'i asla public repository'ye commit etmeyin!

---

## ✅ 2. Database Migration

```bash
# Supabase migration'ı çalıştır
supabase db push
```

veya migration dosyasını manuel olarak Supabase dashboard'dan çalıştırın:
- `supabase/migrations/117_push_subscriptions.sql`

---

## ✅ 3. Kullanım

### 3.1. Client-Side Hook
```typescript
import { usePushNotifications } from '@/hooks/usePushNotifications'

function MyComponent() {
  const { enable, disable, isSubscribed, isSupported } = usePushNotifications()

  return (
    <button onClick={enable} disabled={!isSupported || isSubscribed}>
      Push Bildirimlerini Aktif Et
    </button>
  )
}
```

### 3.2. Otomatik Push Gönderimi
Sistem otomatik olarak `createNotification` ve `createNotificationForRole` fonksiyonları çağrıldığında push notification gönderir.

---

## 🧪 Test

1. Push notification'ı aktif edin (kullanıcı izni gerekir)
2. Test push gönderin:
```typescript
const { test } = usePushNotifications()
await test()
```

---

## ⚠️ Önemli Notlar

1. **HTTPS Gereklidir:** Production'da HTTPS zorunludur (localhost hariç)
2. **Browser Desteği:** Chrome, Firefox, Edge destekler. Safari desteklemez.
3. **İzin:** Kullanıcı notification izni vermelidir.

---

**Son Güncelleme:** 2024



## 🎯 Genel Bakış

CRM sistemi artık Web Push API ile browser push notifications desteklemektedir. Kullanıcılar tarayıcıda kapalı olsa bile bildirim alabilirler.

---

## ✅ 1. VAPID Keys Oluşturma

### 1.1. VAPID Keys Oluştur
```bash
node scripts/generate-vapid-keys.js
```

Bu komut size şu çıktıyı verecek:
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:admin@yourdomain.com
```

### 1.2. Environment Variables
`.env.local` dosyasına ekleyin:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_SUBJECT=mailto:admin@yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

**ÖNEMLİ:** `VAPID_PRIVATE_KEY`'i asla public repository'ye commit etmeyin!

---

## ✅ 2. Database Migration

```bash
# Supabase migration'ı çalıştır
supabase db push
```

veya migration dosyasını manuel olarak Supabase dashboard'dan çalıştırın:
- `supabase/migrations/117_push_subscriptions.sql`

---

## ✅ 3. Kullanım

### 3.1. Client-Side Hook
```typescript
import { usePushNotifications } from '@/hooks/usePushNotifications'

function MyComponent() {
  const { enable, disable, isSubscribed, isSupported } = usePushNotifications()

  return (
    <button onClick={enable} disabled={!isSupported || isSubscribed}>
      Push Bildirimlerini Aktif Et
    </button>
  )
}
```

### 3.2. Otomatik Push Gönderimi
Sistem otomatik olarak `createNotification` ve `createNotificationForRole` fonksiyonları çağrıldığında push notification gönderir.

---

## 🧪 Test

1. Push notification'ı aktif edin (kullanıcı izni gerekir)
2. Test push gönderin:
```typescript
const { test } = usePushNotifications()
await test()
```

---

## ⚠️ Önemli Notlar

1. **HTTPS Gereklidir:** Production'da HTTPS zorunludur (localhost hariç)
2. **Browser Desteği:** Chrome, Firefox, Edge destekler. Safari desteklemez.
3. **İzin:** Kullanıcı notification izni vermelidir.

---

**Son Güncelleme:** 2024

