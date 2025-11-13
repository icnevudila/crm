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
    // Session'ı al
    fetch('/api/auth/session', {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        setSession({ user: data.user || null })
        setLoading(false)
      })
      .catch((err) => {
        console.error('Session error:', err)
        setSession({ user: null })
        setLoading(false)
      })
  }, [])

  return {
    data: session,
    status: loading ? 'loading' : session.user ? 'authenticated' : 'unauthenticated',
  }
}


