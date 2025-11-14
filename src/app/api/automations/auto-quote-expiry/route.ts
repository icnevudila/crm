import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'

import { getSupabaseWithServiceRole } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * AutoQuoteExpiry - Otomatik süre dolumu
 * 30 günden uzun süredir "SENT" olan teklifler otomatik EXPIRED yapılır
 * Cron job veya scheduled task ile çalıştırılabilir
 */
export async function POST(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseWithServiceRole()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // 30 günden uzun süredir SENT olan teklifleri bul
    const { data: expiredQuotes, error: findError } = await supabase
      .from('Quote')
      .select('id, title, status, "createdAt"')
      .eq('status', 'SENT')
      .lt('createdAt', thirtyDaysAgo.toISOString())
      .eq('companyId', session.user.companyId)

    if (findError) {
      console.error('AutoQuoteExpiry find error:', findError)
      return NextResponse.json(
        { error: 'Süresi dolan teklifler alınamadı' },
        { status: 500 }
      )
    }

    if (!expiredQuotes || expiredQuotes.length === 0) {
      return NextResponse.json({
        message: 'Süresi dolan teklif bulunamadı',
        count: 0,
      })
    }

    // Teklifleri EXPIRED yap
    const quoteIds = (expiredQuotes || []).map((q: any) => q.id)
    const { error: updateError } = await supabase
      .from('Quote')
      // @ts-ignore - Supabase type inference issue
      .update({ status: 'EXPIRED', updatedAt: new Date().toISOString() })
      .in('id', quoteIds)
      .eq('companyId', session.user.companyId)

    if (updateError) {
      console.error('AutoQuoteExpiry update error:', updateError)
      return NextResponse.json(
        { error: 'Süresi dolan teklifler güncellenemedi' },
        { status: 500 }
      )
    }

    // ActivityLog kayıtları
    const activityLogs = expiredQuotes.map((quote: any) => ({
      entity: 'Quote',
      action: 'UPDATE',
      description: `Teklif süresi doldu: ${quote.title} - 30 günden uzun süredir SENT durumunda`,
      meta: {
        entity: 'Quote',
        action: 'auto_expire',
        id: quote.id,
        oldStatus: 'SENT',
        newStatus: 'EXPIRED',
      },
      userId: session.user.id,
      companyId: session.user.companyId,
    }))

    // @ts-ignore - Supabase database type tanımları eksik
    await supabase.from('ActivityLog').insert(activityLogs)

    return NextResponse.json({
      message: 'Süresi dolan teklifler güncellendi',
      count: expiredQuotes.length,
      quotes: expiredQuotes.map((q: any) => ({ id: q.id, title: q.title })),
    })
  } catch (error: any) {
    console.error('AutoQuoteExpiry error:', error)
    return NextResponse.json(
      { error: error?.message || 'Süresi dolan teklifler işlenemedi' },
      { status: 500 }
    )
  }
}























