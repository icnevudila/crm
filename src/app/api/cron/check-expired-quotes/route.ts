import { NextResponse } from 'next/server'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { createNotificationForRole } from '@/lib/notification-helper'

// Vercel Cron Job - Her gün 09:00'da çalışacak
// vercel.json'da tanımlanmalı:
// {
//   "crons": [{
//     "path": "/api/cron/check-expired-quotes",
//     "schedule": "0 9 * * *"
//   }]
// }

export const dynamic = 'force-dynamic'
// Edge Runtime kaldırıldı - NextAuth Edge Runtime'da çalışmıyor (crypto modülü yok)

export async function GET(request: Request) {
  try {
    // Vercel Cron secret kontrolü (güvenlik için)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseWithServiceRole()
    const today = new Date().toISOString().split('T')[0]

    // EXPIRED Quote'ları bul (validUntil geçmiş ve ACCEPTED/DECLINED değil)
    const { data: expiredQuotes, error: findError } = await supabase
      .from('Quote')
      .select('id, title, companyId, validUntil, status')
      .lt('validUntil', today)
      .not('status', 'in', '(ACCEPTED,DECLINED)')
      .not('validUntil', 'is', null)

    if (findError) {
      console.error('Check Expired Quotes - Find Error:', findError)
      return NextResponse.json(
        { error: 'Failed to find expired quotes', details: findError.message },
        { status: 500 }
      )
    }

    if (!expiredQuotes || expiredQuotes.length === 0) {
      return NextResponse.json({
        message: 'No expired quotes found',
        count: 0,
        date: today,
      })
    }

    // Her Quote için status'u EXPIRED yap ve bildirim gönder
    let updatedCount = 0
    let notificationCount = 0
    const companyIds = [...new Set(expiredQuotes.map((quote: any) => quote.companyId))]

    for (const companyId of companyIds) {
      const companyQuotes = expiredQuotes.filter((quote: any) => quote.companyId === companyId)

      for (const quote of companyQuotes) {
        try {
          // Status'u EXPIRED yap (eğer değilse)
          if (quote.status !== 'EXPIRED') {
            const { error: updateError } = await supabase
              .from('Quote')
              .update({ status: 'EXPIRED', updatedAt: new Date().toISOString() })
              .eq('id', quote.id)
              .eq('companyId', quote.companyId)

            if (!updateError) {
              updatedCount++

              // Daha önce bildirim gönderilmiş mi kontrol et
              const { data: existingNotification } = await supabase
                .from('Notification')
                .select('id')
                .eq('relatedTo', 'Quote')
                .eq('relatedId', quote.id)
                .eq('title', 'Teklif Süresi Doldu')
                .eq('isRead', false)
                .maybeSingle()

              // Eğer bildirim yoksa gönder
              if (!existingNotification) {
                await createNotificationForRole({
                  companyId: quote.companyId,
                  role: ['ADMIN', 'SALES', 'SUPER_ADMIN'],
                  title: 'Teklif Süresi Doldu',
                  message: `${quote.title} teklifinin geçerlilik süresi doldu.`,
                  type: 'warning',
                  priority: 'medium',
                  relatedTo: 'Quote',
                  relatedId: quote.id,
                })
                notificationCount++
              }
            }
          }
        } catch (error: any) {
          console.error(`Error processing quote ${quote.id}:`, error)
          // Hata olsa bile diğer Quote'ları işlemeye devam et
        }
      }
    }

    return NextResponse.json({
      message: 'Expired quotes checked',
      totalQuotes: expiredQuotes.length,
      updatedCount,
      notificationsSent: notificationCount,
      date: today,
    })
  } catch (error: any) {
    console.error('Check Expired Quotes - Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to check expired quotes' },
      { status: 500 }
    )
  }
}
