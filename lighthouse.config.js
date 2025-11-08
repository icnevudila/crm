/**
 * Lighthouse CI Configuration
 * Performance baseline testleri için
 */

module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000/dashboard', 'http://localhost:3000/customers'],
      numberOfRuns: 3, // Her URL için 3 kez test et
      startServerCommand: 'npm run start',
      startServerReadyPattern: 'Ready on',
      startServerReadyTimeout: 30000,
    },
    assert: {
      assertions: {
        // Performance hedefleri
        'categories:performance': ['error', { minScore: 0.95 }], // %95+ performance score
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],

        // Özel metrikler
        'first-contentful-paint': ['error', { maxNumericValue: 1000 }], // < 1s
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }], // < 2.5s
        'total-blocking-time': ['error', { maxNumericValue: 200 }], // < 200ms
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }], // < 0.1
        'speed-index': ['error', { maxNumericValue: 3000 }], // < 3s

        // Route transition hedefi (custom metric)
        'interactive': ['error', { maxNumericValue: 3000 }], // < 3s
      },
    },
    upload: {
      target: 'temporary-public-storage', // Test sonuçlarını geçici olarak sakla
    },
  },
}




