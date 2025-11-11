import { NextResponse } from 'next/server'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { createNotificationForRole } from '@/lib/notification-helper'

// Vercel Cron Job - Her gün 09:00'da çalışacak
// vercel.json'da tanımlanmalı:
// {
//   "crons": [{
//     "path": "/api/cron/check-overdue-invoices",
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
    const today = new Date().toISOString().split('T')[0]

    // OVERDUE faturaları bul (vade geçmiş ve ödenmemiş)
    const { data: overdueInvoices, error: findError } = await supabase
      .from('Invoice')
      .select('id, title, invoiceNumber, companyId, dueDate, status')
      .lt('dueDate', today)
      .not('status', 'in', '(PAID,CANCELLED)')
      .not('dueDate', 'is', null)

    if (findError) {
      console.error('Check Overdue Invoices - Find Error:', findError)
      return NextResponse.json(
        { error: 'Failed to find overdue invoices', details: findError.message },
        { status: 500 }
      )
    }

    if (!overdueInvoices || overdueInvoices.length === 0) {
      return NextResponse.json({
        message: 'No overdue invoices found',
        count: 0,
        date: today,
      })
    }

    // Her fatura için bildirim gönder (eğer daha önce gönderilmemişse)
    let notificationCount = 0
    const companyIds = [...new Set(overdueInvoices.map((inv: any) => inv.companyId))]

    for (const companyId of companyIds) {
      const companyInvoices = overdueInvoices.filter((inv: any) => inv.companyId === companyId)

      for (const invoice of companyInvoices) {
        try {
          // Daha önce bildirim gönderilmiş mi kontrol et
          const { data: existingNotification } = await supabase
            .from('Notification')
            .select('id')
            .eq('relatedTo', 'Invoice')
            .eq('relatedId', invoice.id)
            .eq('title', 'Fatura Vadesi Geçti')
            .eq('isRead', false)
            .maybeSingle()

          // Eğer bildirim yoksa gönder
          if (!existingNotification) {
            await createNotificationForRole({
              companyId: invoice.companyId,
              role: ['ADMIN', 'SALES', 'SUPER_ADMIN'],
              title: 'Fatura Vadesi Geçti',
              message: `${invoice.invoiceNumber || invoice.title} faturasının vadesi geçti. Ödeme yapılması gerekiyor.`,
              type: 'error',
              priority: 'high',
              relatedTo: 'Invoice',
              relatedId: invoice.id,
            })
            notificationCount++
          }

          // Status'u OVERDUE yap (eğer değilse)
          if (invoice.status !== 'OVERDUE') {
            await supabase
              .from('Invoice')
              .update({ status: 'OVERDUE', updatedAt: new Date().toISOString() })
              .eq('id', invoice.id)
              .eq('companyId', invoice.companyId)
          }
        } catch (error: any) {
          console.error(`Error processing invoice ${invoice.id}:`, error)
          // Hata olsa bile diğer faturaları işlemeye devam et
        }
      }
    }

    return NextResponse.json({
      message: 'Overdue invoices checked',
      totalInvoices: overdueInvoices.length,
      notificationsSent: notificationCount,
      date: today,
    })
  } catch (error: any) {
    console.error('Check Overdue Invoices - Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to check overdue invoices' },
      { status: 500 }
    )
  }
}










