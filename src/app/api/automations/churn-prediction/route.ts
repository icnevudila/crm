import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * Churn Prediction - Kayıp Müşteri Tahmini
 * Basit skorlama: (inaktif_günler * 0.5) + (reddedilen_teklifler * 1.5)
 * Skor > 10 ise müşteri "Riskli" olarak işaretlenir
 */
export async function GET(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseWithServiceRole()

    // Tüm aktif müşterileri al
    const { data: customers, error: customersError } = await supabase
      .from('Customer')
      .select('id, name, email, "updatedAt", status')
      .eq('companyId', session.user.companyId)
      .eq('status', 'ACTIVE')

    if (customersError) {
      console.error('Churn Prediction error:', customersError)
      return NextResponse.json(
        { error: 'Müşteri listesi getirilemedi' },
        { status: 500 }
      )
    }

    if (!customers || customers.length === 0) {
      return NextResponse.json({
        message: 'Aktif müşteri bulunamadı',
        riskyCustomers: [],
      })
    }

    const riskyCustomers: Array<{
      customerId: string
      customerName: string
      churnScore: number
      inactiveDays: number
      rejectedQuotes: number
      riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
    }> = []

    for (const customer of customers || []) {
      // İnaktif gün sayısını hesapla
      const customerData = customer as any
      const lastUpdate = new Date(customerData.updatedAt || new Date())
      const now = new Date()
      const inactiveDays = Math.floor(
        (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)
      )

      // Reddedilen teklif sayısını bul (Deal üzerinden Customer'a bağlı)
      const { data: rejectedQuotes, error: quotesError } = await supabase
        .from('Quote')
        .select(`
          id,
          Deal!inner(
            id,
            customerId
          )
        `)
        .eq('companyId', session.user.companyId)
        .eq('status', 'REJECTED')
        .eq('Deal.customerId', customerData.id)

      const rejectedCount = rejectedQuotes?.length || 0

      // Churn skoru hesapla
      const churnScore = inactiveDays * 0.5 + rejectedCount * 1.5

      // Risk seviyesi belirle
      let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW'
      if (churnScore > 10) {
        riskLevel = 'HIGH'
      } else if (churnScore > 5) {
        riskLevel = 'MEDIUM'
      }

      if (churnScore > 10) {
        riskyCustomers.push({
          customerId: customerData.id,
          customerName: customerData.name || 'İsimsiz Müşteri',
          churnScore: Math.round(churnScore * 100) / 100,
          inactiveDays,
          rejectedQuotes: rejectedCount,
          riskLevel,
        })
      }
    }

    // Risk seviyesine göre sırala (HIGH önce)
    riskyCustomers.sort((a, b) => {
      if (a.riskLevel === 'HIGH' && b.riskLevel !== 'HIGH') return -1
      if (a.riskLevel !== 'HIGH' && b.riskLevel === 'HIGH') return 1
      return b.churnScore - a.churnScore
    })

    return NextResponse.json({
      message: riskyCustomers.length > 0 ? 'Riskli müşteriler bulundu' : 'Riskli müşteri yok',
      riskyCustomers,
      count: riskyCustomers.length,
    })
  } catch (error: any) {
    console.error('Churn Prediction error:', error)
    return NextResponse.json(
      { error: error?.message || 'Churn analizi yapılamadı' },
      { status: 500 }
    )
  }
}




















