import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
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
export const runtime = 'edge'

// Ortak işlem fonksiyonu
async function checkExpiredQuotes() {
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
    throw new Error(`Failed to find expired quotes: ${findError.message}`)
  }

  if (!expiredQuotes || expiredQuotes.length === 0) {
    return {
      message: 'No expired quotes found',
      count: 0,
      date: today,
    }
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

  return {
    message: 'Expired quotes checked',
    totalQuotes: expiredQuotes.length,
    updatedCount,
    notificationsSent: notificationCount,
    date: today,
  }
}

// GET: Vercel Cron Job için (CRON_SECRET ile)
export async function GET(request: Request) {
  try {
    // Vercel Cron secret kontrolü (güvenlik için)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await checkExpiredQuotes()
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Check Expired Quotes - Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to check expired quotes' },
      { status: 500 }
    )
  }
}

// POST: Manuel tetikleme için (Admin/SuperAdmin session ile)
export async function POST(request: Request) {
  try {
    // Session kontrolü
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Sadece ADMIN ve SUPER_ADMIN erişebilir
    const userRole = (session.user as any).role
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const result = await checkExpiredQuotes()
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Check Expired Quotes - Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to check expired quotes' },
      { status: 500 }
    )
  }
}
