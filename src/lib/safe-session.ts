/**
 * Safe Session Helper with Cache
 * getServerSession çağrılarını try-catch ile sarmalar ve cache'ler
 * ULTRA AGRESİF performans için - 30 dakika cache
 */

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { NextResponse } from 'next/server'

// Session cache - ULTRA AGRESİF performans için
const sessionCache = new Map<string, { session: any; expires: number }>()
const SESSION_CACHE_TTL = 30 * 60 * 1000 // 30 DAKİKA cache (instant navigation için)

// Cache key oluştur (request headers'dan)
function getCacheKey(request?: Request): string {
  if (!request) return 'default'
  
  // Cookie'lerden session token'ı al
  const cookies = request.headers.get('cookie') || ''
  const sessionToken = cookies.match(/next-auth\.session-token=([^;]+)/)?.[1] || ''
  
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
    if (!cached.session?.user?.companyId) {
      return {
        session: null,
        error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      }
    }
    return { session: cached.session }
  }
  
  // Cache miss - getServerSession çağır
  try {
    const session = await getServerSession(authOptions)
    
    // Cache'e kaydet (30 dakika)
    sessionCache.set(cacheKey, {
      session,
      expires: Date.now() + SESSION_CACHE_TTL,
    })
    
    if (!session?.user?.companyId) {
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
