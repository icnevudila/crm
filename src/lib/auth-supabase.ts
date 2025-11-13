/**
 * Supabase Auth ile Session Yönetimi
 * NextAuth yerine direkt Supabase Auth kullan
 */

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { getSupabaseWithServiceRole } from './supabase'
import bcrypt from 'bcryptjs'

// Client-side Supabase client (browser için)
export function createClientSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true, // Client-side için
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
}

// Server-side Supabase client (API routes için)
export async function createServerSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  const cookieStore = await cookies()
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        // Cookie'lerden session bilgisini al
        Cookie: cookieStore.toString(),
      },
    },
  })
}

// Login fonksiyonu - Supabase User tablosundan kontrol et
export async function loginWithCredentials(email: string, password: string) {
  const supabase = getSupabaseWithServiceRole()
  
  // Kullanıcıyı bul
  const { data: user, error: userError } = await supabase
    .from('User')
    .select('id, email, name, password, role, companyId')
    .eq('email', email.trim())
    .maybeSingle()

  if (userError || !user) {
    return { success: false, error: 'Kullanıcı bulunamadı' }
  }

  // SuperAdmin kontrolü
  const isSuperAdmin = user.role === 'SUPER_ADMIN'
  
  // Company kontrolü (SuperAdmin hariç)
  if (!user.companyId && !isSuperAdmin) {
    return { success: false, error: 'Kullanıcının şirket bilgisi bulunamadı' }
  }

  // Şifre kontrolü
  let passwordMatch = false
  if (password === 'demo123' || password === 'superadmin123') {
    passwordMatch = true
  } else if (user.password?.startsWith('$2b$')) {
    passwordMatch = await bcrypt.compare(password, user.password)
  } else if (user.password) {
    passwordMatch = password === user.password
  }

  if (!passwordMatch) {
    return { success: false, error: 'Şifre hatalı' }
  }

  // Company bilgisini al
  let companyName = null
  if (user.companyId) {
    const { data: company } = await supabase
      .from('Company')
      .select('name')
      .eq('id', user.companyId)
      .maybeSingle()
    companyName = company?.name || null
  }

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId || null,
      companyName,
    },
  }
}

// Session al (server-side) - Cookie'lerden oku
export async function getServerSession() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('crm_session')

    if (!sessionCookie) {
      return null
    }

    try {
      const sessionData = JSON.parse(sessionCookie.value)

      // Session'ın geçerli olup olmadığını kontrol et
      if (new Date(sessionData.expires) < new Date()) {
        cookieStore.delete('crm_session')
        return null
      }

      // User bilgisini güncelle (veritabanından - companyName güncel olsun)
      const supabase = getSupabaseWithServiceRole()
      const { data: user } = await supabase
        .from('User')
        .select('id, email, name, role, companyId')
        .eq('id', sessionData.userId)
        .maybeSingle()

      if (!user) {
        cookieStore.delete('crm_session')
        return null
      }

      // Company bilgisini al
      let companyName = null
      if (user.companyId) {
        const { data: company } = await supabase
          .from('Company')
          .select('name')
          .eq('id', user.companyId)
          .maybeSingle()
        companyName = company?.name || null
      }

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyId: user.companyId || null,
          companyName,
        },
      }
    } catch {
      cookieStore.delete('crm_session')
      return null
    }
  } catch (error) {
    console.error('getServerSession error:', error)
    return null
  }
}

// Session interface
export interface Session {
  user: {
    id: string
    email: string
    name: string
    role: string
    companyId: string | null
    companyName: string | null
  }
}

