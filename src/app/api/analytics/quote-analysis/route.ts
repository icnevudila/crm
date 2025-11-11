import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// ENTERPRISE: Teklif analizi - gerçekleşen/bekleyen, başarı oranı, red nedeni
export async function GET() {
  try {
    const { session, error: sessionError } = await getSafeSession()
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId
    const supabase = getSupabaseWithServiceRole()

    // Teklif durumlarına göre sayıları çek
    // DÜZELTME: totalAmount kullan (050 migration ile total → totalAmount) - total kolonu artık yok!
    // ÖNEMLİ: rejectedReason kolonu olmayabilir, bu yüzden dinamik select yapıyoruz
    let baseQuery = supabase.from('Quote').select('id, status, totalAmount, createdAt')
    
    // Normal kullanıcı: kendi companyId'sine göre filtrele
    // SuperAdmin: tüm firmaları göster
    if (!isSuperAdmin) {
      baseQuery = baseQuery.eq('companyId', companyId)
    }

    const { data: quotes, error } = await baseQuery

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Quote analysis query error:', error)
      }
      // Hata durumunda default değerler dön (UI bozulmasın)
      return NextResponse.json({
        total: 0,
        accepted: 0,
        pending: 0,
        rejected: 0,
        successRate: 0,
        rejectionReasons: [],
        acceptedTotal: 0,
        pendingTotal: 0,
        rejectedTotal: 0,
      }, { status: 200 }) // 200 dön - UI bozulmasın
    }

    // Durumlara göre grupla
    const accepted = quotes?.filter((q: any) => q.status === 'ACCEPTED') || []
    const pending = quotes?.filter((q: any) => q.status === 'SENT' || q.status === 'DRAFT') || []
    const rejected = quotes?.filter((q: any) => q.status === 'REJECTED') || []

    // Başarı oranı
    const totalQuotes = quotes?.length || 0
    const successRate = totalQuotes > 0 ? Math.round((accepted.length / totalQuotes) * 100) : 0

    // Red nedenleri analizi
    // ÖNEMLİ: rejectedReason kolonu olmayabilir, bu yüzden try-catch kullanıyoruz
    const rejectionReasons: Record<string, number> = {}
    rejected.forEach((quote: any) => {
      try {
        // rejectedReason kolonu olmayabilir, bu yüzden optional chaining kullanıyoruz
        const reason = (quote as any).rejectedReason || 'Belirtilmemiş'
        rejectionReasons[reason] = (rejectionReasons[reason] || 0) + 1
      } catch (e) {
        // Hata durumunda varsayılan neden kullan
        rejectionReasons['Belirtilmemiş'] = (rejectionReasons['Belirtilmemiş'] || 0) + 1
      }
    })

    // Red nedenleri listesi (en çok red nedeni önce)
    const rejectionReasonsList = Object.entries(rejectionReasons)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)

    // Toplam tutarlar - DÜZELTME: totalAmount öncelikli (050 migration ile total → totalAmount) - total kolonu artık yok!
    const acceptedTotal = Array.isArray(accepted) ? accepted.reduce((sum: number, q: any) => {
      const total = q.totalAmount || (typeof q.totalAmount === 'string' ? parseFloat(q.totalAmount) || 0 : 0)
      return sum + total
    }, 0) : 0
    
    const pendingTotal = Array.isArray(pending) ? pending.reduce((sum: number, q: any) => {
      const total = q.totalAmount || (typeof q.totalAmount === 'string' ? parseFloat(q.totalAmount) || 0 : 0)
      return sum + total
    }, 0) : 0
    
    const rejectedTotal = Array.isArray(rejected) ? rejected.reduce((sum: number, q: any) => {
      const total = q.totalAmount || (typeof q.totalAmount === 'string' ? parseFloat(q.totalAmount) || 0 : 0)
      return sum + total
    }, 0) : 0

    return NextResponse.json({
      total: totalQuotes,
      accepted: accepted.length,
      pending: pending.length,
      rejected: rejected.length,
      successRate,
      rejectionReasons: rejectionReasonsList,
      // Toplam tutarlar
      acceptedTotal,
      pendingTotal,
      rejectedTotal,
    })
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Quote analysis API error:', error)
      console.error('Error stack:', error?.stack)
    }
    // Hata durumunda default değerler dön (UI bozulmasın)
    return NextResponse.json({
      total: 0,
      accepted: 0,
      pending: 0,
      rejected: 0,
      successRate: 0,
      rejectionReasons: [],
      acceptedTotal: 0,
      pendingTotal: 0,
      rejectedTotal: 0,
      error: process.env.NODE_ENV === 'development' ? error?.message : undefined,
    }, { status: 200 }) // 200 dön - UI bozulmasın
  }
}

