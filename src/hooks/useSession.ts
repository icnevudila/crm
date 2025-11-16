/**
 * Supabase Auth ile Session Hook
 * NextAuth useSession yerine kullan
 */

'use client'

import { useState, useEffect } from 'react'

export interface SessionUser {
  id: string
  email: string
  name: string
  role: string
  companyId: string | null
  companyName: string | null
}

export interface Session {
  user: SessionUser | null
}

export function useSession() {
  const [session, setSession] = useState<Session>({ user: null })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    
    // Session'ı al
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/auth/session', {
          credentials: 'include',
          cache: 'no-store', // Her zaman fresh session al
        })
        
        // Response kontrolü
        if (!res.ok) {
          // 401 Unauthorized normal (kullanıcı giriş yapmamış)
          if (res.status === 401) {
            if (!cancelled) {
              setSession({ user: null })
              setLoading(false)
            }
            return
          }
          
          // Diğer hatalar için error throw et
          throw new Error(`Session fetch failed: ${res.status} ${res.statusText}`)
        }
        
        // Content-Type kontrolü
        const contentType = res.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Invalid response type from session API')
        }
        
        const data = await res.json()
        
        if (!cancelled) {
          setSession({ user: data.user || null })
          setLoading(false)
        }
      } catch (err: any) {
        // Network hatası veya diğer hatalar
        if (!cancelled) {
          // Sadece development'ta log'la (production'da console.log kaldırılır)
          if (process.env.NODE_ENV === 'development') {
            console.error('Session fetch error:', err?.message || err)
          }
          setSession({ user: null })
          setLoading(false)
        }
      }
    }
    
    fetchSession()
    
    // Cleanup function
    return () => {
      cancelled = true
    }
  }, [])

  return {
    data: session,
    status: loading ? 'loading' : session.user ? 'authenticated' : 'unauthenticated',
  }
}


