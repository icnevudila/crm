/**
 * Auth Utilities
 * NextAuth.js + Supabase Auth integration
 */

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabase } from './supabase'

export interface SessionUser {
  id: string
  email: string
  name: string
  role: string
  companyId: string
}

/**
 * Get current session user
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null

  return session.user as SessionUser
}

/**
 * Get current user's company ID
 */
export async function getCurrentCompanyId(): Promise<string | null> {
  const user = await getCurrentUser()
  return user?.companyId || null
}

/**
 * Check if user has role
 */
export async function hasRole(role: string): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false
  return user.role === role
}

/**
 * Check if user is SuperAdmin
 */
export async function isSuperAdmin(): Promise<boolean> {
  return hasRole('SUPER_ADMIN')
}

