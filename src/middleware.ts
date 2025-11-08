import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import createIntlMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from './lib/i18n'

// Intl middleware - locale prefix'i her zaman kullan (as-needed yerine always)
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always', // as-needed yerine always kullan
})

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // API routes ve static files için middleware'i atla
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.includes('.')) {
    return NextResponse.next()
  }

  // Login ve landing sayfaları - locale prefix kullanmadan direkt erişim
  if (pathname === '/login' || pathname.startsWith('/login/') || pathname === '/landing' || pathname.startsWith('/landing/')) {
    return NextResponse.next()
  }

  // Locale olmayan root path'ler için locale ekle
  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = `/tr`
    return NextResponse.redirect(url)
  }

  // /dashboard gibi locale olmayan path'leri /tr/dashboard'a yönlendir
  const protectedPaths = [
    '/dashboard', '/customers', '/quotes', '/invoices', '/deals', '/products',
    '/companies', '/shipments', '/finance', '/tasks', '/tickets', '/reports', '/settings'
  ]
  
  const needsRedirect = protectedPaths.some(path => pathname.startsWith(path))
  if (needsRedirect) {
    // Zaten locale prefix varsa atla
    if (!pathname.startsWith('/tr/') && !pathname.startsWith('/en/')) {
      const url = request.nextUrl.clone()
      url.pathname = `/tr${pathname}`
      return NextResponse.redirect(url)
    }
  }

  // Locale'li path'ler için auth kontrolü - timeout ile
  if (pathname.startsWith('/tr/') || pathname.startsWith('/en/')) {
    try {
      // Timeout ile token kontrolü - çok yavaş olursa atla
      // İlk yükleme hızı için timeout'u 2 saniyeye düşür
      const token = await Promise.race([
        getToken({
          req: request,
          secret: process.env.NEXTAUTH_SECRET,
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Token check timeout')), 2000) // 5 saniye → 2 saniye (daha hızlı)
        ),
      ]) as any

      // Token yoksa login'e yönlendir
      if (!token) {
        const loginUrl = new URL('/login', request.url)
        return NextResponse.redirect(loginUrl)
      }
    } catch (error) {
      // Timeout veya hata durumunda - intl middleware'i uygula (auth kontrolü atlanır)
      if (process.env.NODE_ENV === 'development') {
        console.warn('Middleware token check timeout or error:', error)
      }
    }
  }

  // Intl middleware'i uygula
  return intlMiddleware(request)
}

export const config = {
  matcher: [
    '/((?!api/auth|_next|_vercel|.*\\..*).*)',
    '/(tr|en)/:path*',
  ],
}
