import { NextResponse } from 'next/server'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { getServerSession } from '@/lib/auth-supabase'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId

    // SuperAdmin değilse companyId zorunlu
    if (!isSuperAdmin && !companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseWithServiceRole()

    // 30 günden fazla iletişim kurulmayan müşteriler
    // lastInteractionDate kolonu yoksa veya null ise, updatedAt'a göre kontrol et
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    let query = supabase
      .from('Customer')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ACTIVE') // Sadece aktif müşteriler

    // SuperAdmin değilse companyId filtresi uygula
    if (!isSuperAdmin && companyId) {
      query = query.eq('companyId', companyId)
    }
    // SuperAdmin ise tüm şirketlerin verilerini göster

    // lastInteractionDate kolonu varsa ona göre filtrele, yoksa updatedAt'a göre filtrele
    // Önce lastInteractionDate kontrolü yap, yoksa updatedAt kullan
    try {
      query = query.or(`lastInteractionDate.is.null,lastInteractionDate.lt.${thirtyDaysAgo.toISOString()}`)
    } catch {
      // lastInteractionDate kolonu yoksa updatedAt'a göre filtrele
      query = query.or(`updatedAt.is.null,updatedAt.lt.${thirtyDaysAgo.toISOString()}`)
    }

    const { count, error } = await query

    if (error) {
      // lastInteractionDate kolonu yoksa updatedAt'a göre tekrar dene
      let fallbackQuery = supabase
        .from('Customer')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ACTIVE')
        .or(`updatedAt.is.null,updatedAt.lt.${thirtyDaysAgo.toISOString()}`)

      if (!isSuperAdmin && companyId) {
        fallbackQuery = fallbackQuery.eq('companyId', companyId)
      }

      const { count: fallbackCount, error: fallbackError } = await fallbackQuery

      if (fallbackError) {
        return NextResponse.json({ error: fallbackError.message }, { status: 500 })
      }

      return NextResponse.json({ count: fallbackCount || 0 })
    }

    return NextResponse.json({ count: count || 0 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch customers to follow' },
      { status: 500 }
    )
  }
}

