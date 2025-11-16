/**
 * SuperAdmin Companies API
 * SuperAdmin için tüm şirketleri getirir
 */

import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }

    // Sadece SuperAdmin erişebilir
    if (session?.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = getSupabaseWithServiceRole()
    const { data: companies, error } = await supabase
      .from('Company')
      .select('id, name, sector, city, status')
      .order('name', { ascending: true })

    if (error) {
      console.error('Companies GET error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(companies || [])
  } catch (error: any) {
    console.error('Companies GET exception:', error)
    return NextResponse.json(
      { error: 'Şirketler yüklenemedi', message: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
