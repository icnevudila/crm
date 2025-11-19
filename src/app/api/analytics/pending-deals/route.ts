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

    // Pazarlık aşamasındaki fırsatlar (NEGOTIATION stage)
    let query = supabase
      .from('Deal')
      .select('*', { count: 'exact', head: true })
      .eq('stage', 'NEGOTIATION')
      .eq('status', 'OPEN')

    // SuperAdmin değilse companyId filtresi uygula
    if (!isSuperAdmin && companyId) {
      query = query.eq('companyId', companyId)
    }
    // SuperAdmin ise tüm şirketlerin verilerini göster

    const { count, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ count: count || 0 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch pending deals' },
      { status: 500 }
    )
  }
}

