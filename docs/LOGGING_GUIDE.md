# 📝 Logging Rehberi

Bu dokümantasyon, CRM Enterprise V3 sisteminde logging stratejisini açıklar.

---

## 🎯 Logging Stratejisi

### Development vs Production

- **Development**: Tüm loglar console'a yazdırılır
- **Production**: Sadece kritik hatalar console'a yazdırılır, diğerleri sessizce devre dışı

### Log Seviyeleri

1. **Error**: Kritik hatalar (her zaman loglanır)
2. **Warn**: Uyarılar (development'da görünür)
3. **Info**: Bilgilendirme (development'da görünür)
4. **Debug**: Debug bilgileri (development'da görünür)
5. **Log**: Genel loglar (development'da görünür)

---

## 📚 Kullanım

### Temel Kullanım

```typescript
import { log, logError, logWarn, logInfo } from '@/lib/logger-production'

// Info log
log('User logged in', { userId: '123' })

// Error log
logError('Failed to fetch data', { error: new Error('Network error') })

// Warning log
logWarn('Deprecated API used', { endpoint: '/api/old' })

// Info log
logInfo('Data fetched successfully', { count: 10 })
```

### Structured Logging

```typescript
import { logStructured } from '@/lib/logger-production'

logStructured('info', 'User action', {
  userId: '123',
  action: 'create_deal',
  dealId: '456',
})
```

### Performance Logging

```typescript
import { logPerformance } from '@/lib/logger-production'

const startTime = Date.now()
// ... operation ...
const duration = Date.now() - startTime
logPerformance('API call', duration, { endpoint: '/api/deals' })
```

---

## 🔄 Migration: console.log → logger-production

### Eski Kullanım (console.log)

```typescript
console.log('User logged in', user)
console.error('Error:', error)
console.warn('Warning:', warning)
```

### Yeni Kullanım (logger-production)

```typescript
import { log, logError, logWarn } from '@/lib/logger-production'

log('User logged in', { context: { user } })
logError('Error occurred', { error })
logWarn('Warning message', { context: { warning } })
```

---

## 🚫 Yapılmaması Gerekenler

### ❌ Production'da console.log kullanma

```typescript
// YANLIŞ
console.log('Debug info') // Production'da görünür

// DOĞRU
import { logDebug } from '@/lib/logger-production'
logDebug('Debug info') // Production'da sessizce devre dışı
```

### ❌ Hassas bilgileri loglama

```typescript
// YANLIŞ
log('User password', { password: userPassword }) // Güvenlik riski!

// DOĞRU
log('User logged in', { userId: user.id }) // Sadece güvenli bilgiler
```

---

## 🔒 Güvenlik

### Filtrelenmesi Gerekenler

- Şifreler
- Tokenlar (JWT, API keys)
- Kredi kartı bilgileri
- Kişisel bilgiler (GDPR/KVKK)

### Örnek

```typescript
// Hassas bilgileri filtrele
const safeData = {
  ...data,
  password: '[Filtered]',
  token: '[Filtered]',
  creditCard: '[Filtered]',
}

log('User data', { context: safeData })
```

---

## 📊 Logging ve Monitoring

### Sentry Entegrasyonu

Error logları otomatik olarak Sentry'ye gönderilir:

```typescript
import { logError } from '@/lib/logger-production'
import { captureException } from '@/lib/sentry'

try {
  // ...
} catch (error) {
  logError('Operation failed', { error })
  captureException(error as Error) // Sentry'ye gönder
}
```

### Performance Monitoring

```typescript
import { logPerformance } from '@/lib/logger-production'

// API çağrısı süresini ölç
const startTime = Date.now()
const response = await fetch('/api/data')
const duration = Date.now() - startTime

logPerformance('API call', duration, {
  endpoint: '/api/data',
  status: response.status,
})
```

---

## 🧹 Mevcut console.log Temizliği

### Otomatik Temizleme (Önerilen)

Production build'de console.log'ları otomatik kaldırmak için `next.config.js`:

```javascript
module.exports = {
  // ...
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error'], // Error logları korunur
    } : false,
  },
}
```

### Manuel Temizleme

Mevcut `console.log` kullanımlarını `logger-production` ile değiştirin:

1. `console.log` → `log` veya `logInfo`
2. `console.error` → `logError`
3. `console.warn` → `logWarn`

---

## 📝 Best Practices

1. **Context Ekleyin**: Log mesajlarına ek bilgi ekleyin
2. **Structured Logging**: JSON formatında loglayın (analiz için)
3. **Performance Logging**: Yavaş operasyonları loglayın
4. **Error Logging**: Tüm hataları loglayın (Sentry ile)
5. **Güvenlik**: Hassas bilgileri filtreleyin

---

## 🔍 Log Analizi

### Development

- Browser console'da görüntülenir
- Renkli ve formatlanmış çıktı

### Production

- Sadece error logları console'a yazdırılır
- Structured loglar monitoring servisine gönderilebilir
- Sentry error tracking aktif

---

**Son Güncelleme**: 2024


