/**
 * Sentry Client-Side Initialization
 * 
 * Bu dosya client-side'da Sentry'yi başlatır.
 * next.config.js'de Sentry plugin'i ile entegre edilir.
 */

import { initSentry } from './sentry'

// Client-side'da Sentry'yi başlat
if (typeof window !== 'undefined') {
  initSentry()
}


