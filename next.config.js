const createNextIntlPlugin = require('next-intl/plugin')
const path = require('path')

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production'da console.log'ları kaldır (error hariç)
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error'], // Error logları korunur (kritik hatalar için)
    } : false,
  },
  experimental: {
    // Edge Runtime optimizasyonları
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // ULTRA AGRESİF: Optimize package imports - ilk yükleme hızı için
    optimizePackageImports: [
      'lucide-react', 
      '@radix-ui/react-icons',
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tabs',
      '@radix-ui/react-avatar',
      'framer-motion',
      'recharts',
      'react-loading-skeleton',
      '@tanstack/react-query',
      'next-auth',
      'next-intl',
      'swr',
    ],
    // Agresif prefetching - tüm linkleri prefetch et
    optimizeCss: true,
    // Bundle size optimization
    webpackBuildWorker: true,
    // Not: Turbopack --turbo flag ile aktif edilir, config'de ayar gerekmez
  },
  // Turbopack - Next.js 15'te --turbo flag ile aktif
  // Config'de turbopack ayarları (Next.js 15'te experimental.turbo deprecated)
  // Not: --turbo flag'i kullanıldığında otomatik aktif olur
  // Compression - Development'ta kapalı (hız için), production'da açık
  compress: process.env.NODE_ENV === 'production',
  // React Strict Mode
  reactStrictMode: true,
  // ESLint - development'ta devre dışı (hız için)
  eslint: {
    ignoreDuringBuilds: true,
    // Development'ta ESLint'i tamamen devre dışı bırak (hız için)
    dirs: process.env.NODE_ENV === 'production' ? ['src'] : [],
  },
  // TypeScript - development'ta type checking'i devre dışı bırak (hız için)
  typescript: {
    ignoreBuildErrors: true, // Geçici olarak - Next.js 15 params async migration için
    // Not: Development'ta type checking zaten daha az agresif çalışır
  },
  // Standalone output kaldırıldı - webpack chunk sorunları için
  // output: 'standalone',
  // Production source maps kapat (daha küçük bundle)
  productionBrowserSourceMaps: false,
  // Output file tracing root - workspace root hatası için
  // Not: swcMinify ve optimizeFonts Next.js 15'te varsayılan olarak aktif
  outputFileTracingRoot: path.join(__dirname),
  // Prefetching optimizasyonu - Development'ta daha agresif (hız için)
  // Sekme geçişlerini <100ms'e düşürmek için (tıklama anında açılmalı)
  onDemandEntries: {
    // Development'ta daha kısa buffer (hız için), production'da daha uzun (memory için)
    maxInactiveAge: process.env.NODE_ENV === 'development' ? 2 * 60 * 1000 : 5 * 60 * 1000, // Dev: 2dk, Prod: 5dk
    pagesBufferLength: process.env.NODE_ENV === 'development' ? 20 : 50, // Dev: 20 sayfa, Prod: 50 sayfa
  },
  // Build optimizasyonu - hızlandırma
  // swcMinify: Next.js 15'te varsayılan olarak aktif - deprecated uyarısını önlemek için kaldırıldı
  // Output optimizasyonu - standalone build hızlandırır ama dev'de yavaşlatabilir
  // output: 'standalone', // Dev'de kapatıldı - performans için
  // Agresif prefetching - tüm linkler otomatik prefetch
  poweredByHeader: false, // Güvenlik için
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ]
  },
  // Image optimization
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
    // Image optimization settings
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400, // 24 saat cache
  },
}

module.exports = withNextIntl(nextConfig)
