# Sentry Error Tracking Kurulumu

Bu dokümantasyon, CRM Enterprise V3 sistemine Sentry error tracking entegrasyonunun nasıl yapılacağını açıklar.

## Adımlar

### 1. Sentry Hesabı Oluşturma

1. [Sentry.io](https://sentry.io) adresine gidin
2. Ücretsiz hesap oluşturun
3. Yeni bir proje oluşturun (Next.js seçin)
4. DSN (Data Source Name) değerini kopyalayın

### 2. Environment Variables Ekleme

`.env.local` dosyanıza ekleyin:

```env
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/your-project-id
SENTRY_AUTH_TOKEN=your-auth-token  # Source maps için (opsiyonel)
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
```

**Vercel için:**
Vercel Dashboard → Project Settings → Environment Variables bölümünden ekleyin.

### 3. Package Installation

```bash
npm install @sentry/nextjs
```

### 4. Sentry Configuration

Sentry yapılandırması zaten `src/lib/sentry.ts` dosyasında hazırlanmıştır. Sadece DSN değerini eklemeniz yeterlidir.

### 5. Next.js Configuration

`next.config.js` dosyasına Sentry plugin'i ekleyin (opsiyonel, source maps için):

```javascript
const { withSentryConfig } = require('@sentry/nextjs')

module.exports = withSentryConfig(
  {
    // Mevcut next.config.js içeriği
  },
  {
    // Sentry config
    silent: true,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
  }
)
```

### 6. Error Boundary Entegrasyonu

ErrorBoundary component'i zaten Sentry ile entegre edilmiştir. Kritik sayfalarda kullanın:

```tsx
import ErrorBoundary from '@/components/ErrorBoundaryWrapper'

export default function MyPage() {
  return (
    <ErrorBoundary>
      {/* Sayfa içeriği */}
    </ErrorBoundary>
  )
}
```

### 7. Manual Error Reporting

Kod içinde manuel olarak hata yakalama:

```tsx
import { captureException, captureMessage } from '@/lib/sentry'

try {
  // Kod
} catch (error) {
  captureException(error as Error, { context: 'additional info' })
}

// Mesaj gönderme
captureMessage('Something important happened', 'info')
```

## Özellikler

- ✅ Otomatik hata yakalama (ErrorBoundary ile)
- ✅ Hassas bilgi filtreleme (şifreler, tokenlar)
- ✅ Kullanıcı bilgileri ekleme
- ✅ Context ve tag ekleme (filtreleme için)
- ✅ Performance monitoring (%10 sample rate)
- ✅ Development modunda console'a yazdırma

## Güvenlik

- Şifreler ve tokenlar otomatik olarak filtrelenir
- Hassas URL parametreleri gizlenir
- Production'da sadece Sentry'ye gönderilir

## Monitoring

Sentry dashboard'da şunları görebilirsiniz:

- Hata sayısı ve trendleri
- Hata detayları (stack trace, context)
- Kullanıcı etkilenme oranları
- Performance metrikleri
- Release tracking

## Notlar

- Sentry sadece production'da aktif olur
- Development'da console'a yazdırılır
- DSN yoksa Sentry sessizce devre dışı kalır
- Hassas bilgiler otomatik filtrelenir

## İyileştirme Önerileri

1. **Release Tracking**: Her deploy'da release oluşturun
2. **Alert Rules**: Kritik hatalar için e-posta/Slack bildirimleri
3. **Performance Monitoring**: Yavaş API çağrılarını izleyin
4. **User Feedback**: Kullanıcılardan hata hakkında geri bildirim alın

---

**Son Güncelleme**: 2024


