import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// ENTERPRISE: Teklif analizi - gerçekleşen/bekleyen, başarı oranı, red nedeni
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId
    const supabase = getSupabaseWithServiceRole()

    // Teklif durumlarına göre sayıları çek
    let baseQuery = supabase.from('Quote').select('id, status, total, createdAt, rejectedReason')
    if (!isSuperAdmin) {
      baseQuery = baseQuery.eq('companyId', companyId)
    }

    const { data: quotes, error } = await baseQuery

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Durumlara göre grupla
    const accepted = quotes?.filter((q: any) => q.status === 'ACCEPTED') || []
    const pending = quotes?.filter((q: any) => q.status === 'SENT' || q.status === 'DRAFT') || []
    const rejected = quotes?.filter((q: any) => q.status === 'REJECTED') || []

    // Başarı oranı
    const totalQuotes = quotes?.length || 0
    const successRate = totalQuotes > 0 ? Math.round((accepted.length / totalQuotes) * 100) : 0

    // Red nedenleri analizi
    const rejectionReasons: Record<string, number> = {}
    rejected.forEach((quote: any) => {
      const reason = quote.rejectedReason || 'Belirtilmemiş'
      rejectionReasons[reason] = (rejectionReasons[reason] || 0) + 1
    })

    // Red nedenleri listesi (en çok red nedeni önce)
    const rejectionReasonsList = Object.entries(rejectionReasons)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)

    return NextResponse.json({
      total: totalQuotes,
      accepted: accepted.length,
      pending: pending.length,
      rejected: rejected.length,
      successRate,
      rejectionReasons: rejectionReasonsList,
      // Toplam tutarlar
      acceptedTotal: accepted.reduce((sum: number, q: any) => sum + (parseFloat(q.total) || 0), 0),
      pendingTotal: pending.reduce((sum: number, q: any) => sum + (parseFloat(q.total) || 0), 0),
      rejectedTotal: rejected.reduce((sum: number, q: any) => sum + (parseFloat(q.total) || 0), 0),
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch quote analysis' },
      { status: 500 }
    )
  }
}

