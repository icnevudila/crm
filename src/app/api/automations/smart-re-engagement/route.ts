import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'

import { getSupabaseWithServiceRole } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * Smart Re-Engagement Flow
 * Müşteri 60 gün boyunca etkileşimsizse (hiç görüşme, teklif, fatura yoksa) uyarı ver
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
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

    // 60 günden eski müşterileri bul
    const { data: customers, error: customersError } = await supabase
      .from('Customer')
      .select('id, name, email, "updatedAt", status')
      .eq('companyId', session.user.companyId)
      .eq('status', 'ACTIVE')
      .lt('updatedAt', sixtyDaysAgo.toISOString())

    if (customersError) {
      console.error('Smart Re-Engagement error:', customersError)
      return NextResponse.json(
        { error: 'Müşteri listesi getirilemedi' },
        { status: 500 }
      )
    }

    if (!customers || customers.length === 0) {
      return NextResponse.json({
        message: 'İnaktif müşteri bulunamadı',
        inactiveCustomers: [],
      })
    }

    // Her müşteri için son 60 günde etkileşim var mı kontrol et
    const inactiveCustomers: Array<{
      customerId: string
      customerName: string
      lastInteraction: string
      daysSinceInteraction: number
      hasRecentQuote: boolean
      hasRecentInvoice: boolean
      hasRecentMeeting: boolean
    }> = []

    for (const customer of customers || []) {
      const customerData = customer as any
      const lastUpdate = new Date(customerData.updatedAt || new Date())
      const daysSinceInteraction = Math.floor(
        (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)
      )

      // Son 60 günde teklif var mı?
      const { data: recentQuotes } = await supabase
        .from('Quote')
        .select('id')
        .eq('companyId', session.user.companyId)
        .eq('customerId', customerData.id)
        .gte('createdAt', sixtyDaysAgo.toISOString())
        .limit(1)

      // Son 60 günde fatura var mı?
      const { data: recentInvoices } = await supabase
        .from('Invoice')
        .select('id')
        .eq('companyId', session.user.companyId)
        .eq('customerId', customerData.id)
        .gte('createdAt', sixtyDaysAgo.toISOString())
        .limit(1)

      // Son 60 günde görüşme var mı?
      const { data: recentMeetings } = await supabase
        .from('Meeting')
        .select('id')
        .eq('companyId', session.user.companyId)
        .eq('customerId', customerData.id)
        .gte('meetingDate', sixtyDaysAgo.toISOString())
        .limit(1)

      const hasRecentQuote = (recentQuotes?.length || 0) > 0
      const hasRecentInvoice = (recentInvoices?.length || 0) > 0
      const hasRecentMeeting = (recentMeetings?.length || 0) > 0

      // Hiç etkileşim yoksa listeye ekle
      if (!hasRecentQuote && !hasRecentInvoice && !hasRecentMeeting) {
        inactiveCustomers.push({
          customerId: customerData.id,
          customerName: customerData.name || 'İsimsiz Müşteri',
          lastInteraction: customerData.updatedAt || new Date().toISOString(),
          daysSinceInteraction,
          hasRecentQuote,
          hasRecentInvoice,
          hasRecentMeeting,
        })
      }
    }

    // Gün sayısına göre sırala (en eski önce)
    inactiveCustomers.sort((a, b) => b.daysSinceInteraction - a.daysSinceInteraction)

    return NextResponse.json({
      message: inactiveCustomers.length > 0 
        ? `${inactiveCustomers.length} müşteri 60 günden uzun süredir etkileşimsiz`
        : 'Tüm müşteriler aktif',
      inactiveCustomers,
      count: inactiveCustomers.length,
    })
  } catch (error: any) {
    console.error('Smart Re-Engagement error:', error)
    return NextResponse.json(
      { error: error?.message || 'Etkileşim analizi gerçekleştirilemedi' },
      { status: 500 }
    )
  }
}
















