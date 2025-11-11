import { createClient } from '@supabase/supabase-js'

// Singleton pattern - tek instance (connection pooling için)
let client: ReturnType<typeof createClient> | null = null
let serviceRoleClient: ReturnType<typeof createClient> | null = null

export const getSupabase = () => {
  if (!client) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Build-time'da environment variables yoksa, runtime'da tekrar deneyecek
    if (!supabaseUrl || !supabaseAnonKey) {
      // Build-time'da (Next.js build sırasında) hata verme
      // Runtime'da environment variables yüklenecek
      const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                         process.env.NEXT_PHASE === 'phase-export' ||
                         !process.env.VERCEL // Vercel'de değilse build-time olabilir
      
      if (isBuildTime) {
        // Build-time'da placeholder döndür (runtime'da düzgün yüklenecek)
        // Singleton pattern'i bypass et - her seferinde yeni placeholder döndür
        return createClient('https://placeholder.supabase.co', 'placeholder-key', {
          auth: { persistSession: false },
        })
      }
      // Runtime'da environment variables zorunlu
      throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set')
    }

    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false, // Server-side için
        autoRefreshToken: false, // Server-side'da token refresh yok
      },
      global: {
        headers: {
          'x-crm-cache': 'true',
          'Connection': 'keep-alive', // Connection reuse için
        },
      },
      // Connection pooling optimizasyonu
      realtime: {
        params: {
          eventsPerSecond: 10, // Rate limiting
        },
      },
      // ENTERPRISE: Query timeout ve connection pool optimizasyonu
      fetch: (url, options = {}) => {
        return fetch(url, {
          ...options,
          // Timeout: 15 saniye (enterprise seviye için artırıldı)
          signal: AbortSignal.timeout(15000),
          // Connection pooling için keep-alive
          keepalive: true,
        })
      },
      // Connection pool ayarları
      db: {
        schema: 'public',
      },
    })
  }

  return client
}

// Client-side için (browser'da kullanılacak)
export const createClientSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true, // Client-side için
    },
  })
}

/**
 * Service role key ile RLS bypass için Supabase client oluştur
 * Singleton pattern - connection pooling için
 */
export function getSupabaseWithServiceRole() {
  if (!serviceRoleClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // Build-time'da environment variables yoksa placeholder döndür
    if (!supabaseUrl) {
      const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                         process.env.NEXT_PHASE === 'phase-export' ||
                         !process.env.VERCEL
      
      if (isBuildTime) {
        return createClient('https://placeholder.supabase.co', 'placeholder-key', {
          auth: { persistSession: false },
        })
      }
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
    }

    // Service role key varsa onu kullan (RLS bypass) - singleton pattern
    if (supabaseServiceKey) {
      serviceRoleClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { 
          persistSession: false,
          autoRefreshToken: false, // Server-side'da token refresh yok
        },
        global: {
          headers: {
            'x-crm-cache': 'true',
            'Connection': 'keep-alive', // Connection reuse için
          },
        },
        // Connection pooling optimizasyonu
        realtime: {
          params: {
            eventsPerSecond: 10, // Rate limiting
          },
        },
        // ✅ %100 KESİN ÇÖZÜM: Cache'i tamamen kapat - her query'de fresh data
        // ÖNEMLİ: Supabase SDK'nın kendi cache'ini kapat - her zaman fresh data çek
        fetch: (url, options = {}) => {
          return fetch(url, {
            ...options,
            // ✅ ÇÖZÜM: Cache'i tamamen kapat - her query'de fresh data çek
            cache: 'no-store', // Next.js ve browser cache'ini kapat
            // Timeout: 15 saniye (enterprise seviye için artırıldı)
            signal: AbortSignal.timeout(15000),
            // Connection pooling için keep-alive
            keepalive: true,
            // ✅ ÇÖZÜM: Cache-Control header'ı ekle - proxy cache'ini de kapat
            headers: {
              ...(options.headers || {}),
              'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
              'Pragma': 'no-cache',
            },
          })
        },
        // Connection pool ayarları
        db: {
          schema: 'public',
        },
      })
      return serviceRoleClient
    }

    // Yoksa normal client kullan
    return getSupabase()
  }

  return serviceRoleClient
}


