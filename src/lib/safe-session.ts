/**
 * Safe Session Helper with Cache
 * getServerSession çağrılarını try-catch ile sarmalar ve cache'ler
 * ULTRA AGRESİF performans için - 30 dakika cache
 */

import { getServerSession } from '@/lib/auth-supabase'
import { NextResponse } from 'next/server'

// Session cache - ULTRA AGRESİF performans için
const sessionCache = new Map<string, { session: any; expires: number }>()
const SESSION_CACHE_TTL = 30 * 60 * 1000 // 30 DAKİKA cache (instant navigation için)

// Cache key oluştur (request headers'dan)
function getCacheKey(request?: Request): string {
  if (!request) return 'default'
  
  // Cookie'lerden session token'ı al (Supabase Auth - crm_session)
  const cookies = request.headers.get('cookie') || ''
  const sessionToken = cookies.match(/crm_session=([^;]+)/)?.[1] || ''
  
  return sessionToken || 'default'
}

// Cache'i temizle (expired entries)
function cleanCache() {
  const now = Date.now()
  for (const [key, value] of sessionCache.entries()) {
    if (value.expires < now) {
      sessionCache.delete(key)
    }
  }
}

export interface SafeSessionResult {
  session: any
  error?: NextResponse
}

/**
 * Güvenli session al - hata yakalama ve cache ile
 * ULTRA AGRESİF performans için - 30 dakika cache
 */
export async function getSafeSession(request?: Request): Promise<SafeSessionResult> {
  // Cache'i temizle (expired entries)
  cleanCache()
  
  // Cache key oluştur
  const cacheKey = getCacheKey(request)
  
  // Cache'den kontrol et
  const cached = sessionCache.get(cacheKey)
  if (cached && cached.expires > Date.now()) {
    // Cache hit - anında dön
    const cachedSession = cached.session
    const role = cachedSession?.user?.role
    const hasCompanyAccess = Boolean(cachedSession?.user?.companyId)

    if (!cachedSession?.user) {
      return {
        session: null,
        error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      }
    }

    if (!hasCompanyAccess && role !== 'SUPER_ADMIN') {
      return {
        session: null,
        error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      }
    }

    return { session: cachedSession }
  }
  
  // Cache miss - getServerSession çağır (request parametresi ile)
  try {
    const session = await getServerSession(request || undefined)
    
    // Session null ise (unauthorized)
    if (!session) {
      return {
        session: null,
        error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      }
    }

    // Cache'e kaydet (30 dakika) - sadece geçerli session'ları cache'le
    sessionCache.set(cacheKey, {
      session,
      expires: Date.now() + SESSION_CACHE_TTL,
    })
    
    const role = session?.user?.role
    const hasCompanyAccess = Boolean(session?.user?.companyId)

    if (!session?.user) {
      return {
        session: null,
        error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      }
    }

    if (!hasCompanyAccess && role !== 'SUPER_ADMIN') {
      return {
        session: null,
        error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      }
    }

    return { session }
  } catch (sessionError: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Session error:', sessionError)
    }
    
    return {
      session: null,
      error: NextResponse.json(
        {
          error: 'Session error',
          message: sessionError?.message || 'Failed to get session',
          ...(process.env.NODE_ENV === 'development' && { stack: sessionError?.stack }),
        },
        { status: 500 }
      ),
    }
  }
}
