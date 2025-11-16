/**
 * Sentry Client-Side Initialization
 * 
 * Bu dosya client-side'da Sentry'yi başlatır.
 * next.config.js'de Sentry plugin'i ile entegre edilir.
 */

// Sentry opsiyonel - build sırasında hata vermemesi için
// Runtime'da dynamic import ile yüklenecek
// import { initSentry } from './sentry'

// Client-side'da Sentry'yi başlat (opsiyonel)
if (typeof window !== 'undefined') {
  // Runtime'da dynamic import - build sırasında hata vermez
  import('./sentry')
    .then((module) => module.initSentry())
    .catch(() => {
      // Sentry yoksa sessizce devam et
    })
}


