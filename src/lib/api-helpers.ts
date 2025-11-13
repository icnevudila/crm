/**
 * API Helper Fonksiyonlar
 * Ortak error handling ve response formatting
 */

import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-supabase'

/**
 * Auth middleware - session kontrolü yapar (hata yakalama ile)
 */
export async function requireAuth() {
  let session
  try {
    session = await getServerSession()
  } catch (sessionError: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('requireAuth session error:', sessionError)
    }
    throw new Error(`Session error: ${sessionError?.message || 'Failed to get session'}`)
  }
  
  if (!session?.user?.companyId) {
    throw new Error('Unauthorized')
  }
  
  return session
}

/**
 * Standardize error response
 */
export function errorResponse(
  error: any,
  defaultMessage: string = 'An error occurred',
  status: number = 500
) {
  // Production'da console.error kaldırıldı
  if (process.env.NODE_ENV === 'development') {
    console.error('API Error:', error)
  }
  
  // Development'ta daha detaylı hata
  const isDev = process.env.NODE_ENV === 'development'
  
  return NextResponse.json(
    {
      error: error?.message || defaultMessage,
      ...(isDev && {
        stack: error?.stack,
        details: error?.details,
      }),
    },
    { status }
  )
}

/**
 * Success response with cache headers
 */
export function successResponse(
  data: any,
  options: {
    cacheTime?: number
    revalidate?: number
  } = {}
) {
  const { cacheTime = 300, revalidate = 60 } = options
  
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': `public, s-maxage=${cacheTime}, stale-while-revalidate=${revalidate * 2}, max-age=${revalidate}`,
    },
  })
}

/**
 * Safe Supabase query wrapper
 */
export async function safeQuery<T>(
  queryPromise: Promise<{ data: T | null; error: any }>
): Promise<T> {
  const { data, error } = await queryPromise
  
  if (error) {
    throw new Error(error.message || 'Database query failed')
  }
  
  if (!data) {
    throw new Error('No data returned')
  }
  
  return data
}





