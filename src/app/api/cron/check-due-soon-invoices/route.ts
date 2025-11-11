import { NextResponse } from 'next/server'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { createNotificationForRole } from '@/lib/notification-helper'

// Vercel Cron Job - Her gün 09:00'da çalışacak
// vercel.json'da tanımlanmalı:
// {
//   "crons": [{
//     "path": "/api/cron/check-due-soon-invoices",
//     "schedule": "0 9 * * *"
//   }]
// }

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

export async function GET(request: Request) {
  try {
    // Vercel Cron secret kontrolü (güvenlik için)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseWithServiceRole()
    const today = new Date()
    const threeDaysLater = new Date(today)
    threeDaysLater.setDate(threeDaysLater.getDate() + 3)
    const todayStr = today.toISOString().split('T')[0]
    const threeDaysLaterStr = threeDaysLater.toISOString().split('T')[0]

    // Vade yaklaşan faturaları bul (3 gün içinde vadesi gelecek ve ödenmemiş)
    const { data: dueSoonInvoices, error: findError } = await supabase
      .from('Invoice')
      .select('id, title, invoiceNumber, companyId, dueDate, status')
      .gte('dueDate', todayStr)
      .lte('dueDate', threeDaysLaterStr)
      .not('status', 'in', '(PAID,CANCELLED)')
      .not('dueDate', 'is', null)

    if (findError) {
      console.error('Check Due Soon Invoices - Find Error:', findError)
      return NextResponse.json(
        { error: 'Failed to find due soon invoices', details: findError.message },
        { status: 500 }
      )
    }

    if (!dueSoonInvoices || dueSoonInvoices.length === 0) {
      return NextResponse.json({
        message: 'No due soon invoices found',
        count: 0,
        date: todayStr,
      })
    }

    // Her fatura için bildirim gönder (eğer daha önce gönderilmemişse)
    let notificationCount = 0
    const companyIds = [...new Set(dueSoonInvoices.map((inv: any) => inv.companyId))]

    for (const companyId of companyIds) {
      const companyInvoices = dueSoonInvoices.filter((inv: any) => inv.companyId === companyId)

      for (const invoice of companyInvoices) {
        try {
          // Kaç gün kaldığını hesapla
          const dueDate = new Date(invoice.dueDate)
          const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))

          // Öncelik belirle: 1 gün öncesi kritik, 3 gün öncesi uyarı
          const priority = daysUntilDue <= 1 ? 'critical' : 'high'
          const title = daysUntilDue <= 1 
            ? 'Fatura Vadesi Yaklaşıyor (Kritik)' 
            : 'Fatura Vadesi Yaklaşıyor'
          const message = daysUntilDue <= 1
            ? `${invoice.invoiceNumber || invoice.title} faturasının vadesi ${daysUntilDue} gün sonra. Acil ödeme yapılması gerekiyor.`
            : `${invoice.invoiceNumber || invoice.title} faturasının vadesi ${daysUntilDue} gün sonra. Ödeme yapılması gerekiyor.`

          // Daha önce bildirim gönderilmiş mi kontrol et
          const { data: existingNotification } = await supabase
            .from('Notification')
            .select('id')
            .eq('relatedTo', 'Invoice')
            .eq('relatedId', invoice.id)
            .like('title', 'Fatura Vadesi Yaklaşıyor%')
            .eq('isRead', false)
            .maybeSingle()

          // Eğer bildirim yoksa gönder
          if (!existingNotification) {
            await createNotificationForRole({
              companyId: invoice.companyId,
              role: ['ADMIN', 'SALES', 'SUPER_ADMIN'],
              title,
              message,
              type: 'warning',
              priority,
              relatedTo: 'Invoice',
              relatedId: invoice.id,
            })
            notificationCount++
          }
        } catch (error: any) {
          console.error(`Error processing invoice ${invoice.id}:`, error)
          // Hata olsa bile diğer faturaları işlemeye devam et
        }
      }
    }

    return NextResponse.json({
      message: 'Due soon invoices checked',
      totalInvoices: dueSoonInvoices.length,
      notificationsSent: notificationCount,
      date: todayStr,
    })
  } catch (error: any) {
    console.error('Check Due Soon Invoices - Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to check due soon invoices' },
      { status: 500 }
    )
  }
}










