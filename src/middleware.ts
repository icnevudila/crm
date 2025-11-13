import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
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

  // Locale'li path'ler için auth kontrolü - cookie kontrolü ile
  // Login sayfası için auth kontrolünü bypass et
  if ((pathname.startsWith('/tr/') || pathname.startsWith('/en/')) && 
      !pathname.startsWith('/tr/login') && !pathname.startsWith('/en/login')) {
    try {
      // Cookie'den session kontrolü - Supabase Auth ile
      const cookies = request.cookies.get('crm_session')
      
      // Session cookie yoksa login'e yönlendir
      if (!cookies) {
        const loginUrl = new URL('/tr/login', request.url)
        return NextResponse.redirect(loginUrl)
      }
      
      // Cookie varsa içeriğini kontrol et (expired olabilir)
      try {
        const sessionData = JSON.parse(cookies.value)
        if (new Date(sessionData.expires) < new Date()) {
          // Session expired - login'e yönlendir
          const loginUrl = new URL('/tr/login', request.url)
          return NextResponse.redirect(loginUrl)
        }
      } catch {
        // Cookie formatı hatalı - login'e yönlendir
        const loginUrl = new URL('/tr/login', request.url)
        return NextResponse.redirect(loginUrl)
      }
    } catch (error) {
      // Hata durumunda - intl middleware'i uygula (auth kontrolü atlanır)
      if (process.env.NODE_ENV === 'development') {
        console.warn('Middleware session check error:', error)
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
