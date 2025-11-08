import { createClient } from '@supabase/supabase-js'

// Singleton pattern - tek instance (connection pooling için)
let client: ReturnType<typeof createClient> | null = null
let serviceRoleClient: ReturnType<typeof createClient> | null = null

export const getSupabase = () => {
  if (!client) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables')
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
      // OPTİMİZE: Query timeout'u artır (ilk yüklemede daha fazla zaman ver)
      fetch: (url, options = {}) => {
        return fetch(url, {
          ...options,
          // Timeout: 10 saniye (ilk yüklemede daha fazla zaman ver, sonra optimize edilecek)
          signal: AbortSignal.timeout(10000),
        })
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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl) {
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
        // OPTİMİZE: Query timeout'u artır (ilk yüklemede daha fazla zaman ver)
        fetch: (url, options = {}) => {
          return fetch(url, {
            ...options,
            // Timeout: 10 saniye (ilk yüklemede daha fazla zaman ver, sonra optimize edilecek)
            signal: AbortSignal.timeout(10000),
          })
        },
      })
      return serviceRoleClient
    }

    // Yoksa normal client kullan
    return getSupabase()
  }

  return serviceRoleClient
}


