import { NextResponse } from 'next/server'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { createNotificationForRole } from '@/lib/notification-helper'

// Vercel Cron Job - Her gün 09:00'da çalışacak
// Bu endpoint hem overdue hem de due-soon invoice kontrolünü yapar
// vercel.json'da tanımlanmalı:
// {
//   "crons": [{
//     "path": "/api/cron/check-invoices",
//     "schedule": "0 9 * * *"
//   }]
// }

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

export async function GET(request: Request) {
  try {
    // Vercel Cron token kontrolü (opsiyonel - güvenlik için)
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseWithServiceRole()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // 1. Overdue invoices (vadesi geçmiş)
    const { data: overdueInvoices } = await supabase
      .from('Invoice')
      .select('id, invoiceNumber, totalAmount, dueDate, companyId, Customer(name)')
      .lt('dueDate', today.toISOString())
      .eq('status', 'SENT')
      .not('dueDate', 'is', null)

    if (overdueInvoices && overdueInvoices.length > 0) {
      // Şirket bazında grupla
      const invoicesByCompany = overdueInvoices.reduce((acc: any, invoice: any) => {
        if (!acc[invoice.companyId]) {
          acc[invoice.companyId] = []
        }
        acc[invoice.companyId].push(invoice)
        return acc
      }, {})

      // Her şirket için bildirim gönder
      for (const [companyId, invoices] of Object.entries(invoicesByCompany)) {
        const invoiceList = (invoices as any[]).map((inv: any) => 
          `${inv.invoiceNumber || inv.id.slice(0, 8)} (${inv.Customer?.name || 'Müşteri'})`
        ).join(', ')

        await createNotificationForRole({
          companyId,
          role: ['ADMIN', 'SUPER_ADMIN'],
          title: '⚠️ Vadesi Geçmiş Faturalar',
          message: `${(invoices as any[]).length} adet fatura vadesi geçti: ${invoiceList}`,
          type: 'warning',
          relatedTo: 'Invoice',
          priority: 'high',
        })
      }
    }

    // 2. Due soon invoices (vadesi yaklaşan - 3 gün içinde)
    const threeDaysLater = new Date(today)
    threeDaysLater.setDate(threeDaysLater.getDate() + 3)

    const { data: dueSoonInvoices } = await supabase
      .from('Invoice')
      .select('id, invoiceNumber, totalAmount, dueDate, companyId, Customer(name)')
      .gte('dueDate', today.toISOString())
      .lte('dueDate', threeDaysLater.toISOString())
      .eq('status', 'SENT')
      .not('dueDate', 'is', null)

    if (dueSoonInvoices && dueSoonInvoices.length > 0) {
      // Şirket bazında grupla
      const invoicesByCompany = dueSoonInvoices.reduce((acc: any, invoice: any) => {
        if (!acc[invoice.companyId]) {
          acc[invoice.companyId] = []
        }
        acc[invoice.companyId].push(invoice)
        return acc
      }, {})

      // Her şirket için bildirim gönder
      for (const [companyId, invoices] of Object.entries(invoicesByCompany)) {
        const invoiceList = (invoices as any[]).map((inv: any) => 
          `${inv.invoiceNumber || inv.id.slice(0, 8)} (${inv.Customer?.name || 'Müşteri'})`
        ).join(', ')

        await createNotificationForRole({
          companyId,
          role: ['ADMIN', 'SUPER_ADMIN'],
          title: '📅 Vadesi Yaklaşan Faturalar',
          message: `${(invoices as any[]).length} adet fatura vadesi yaklaşıyor (3 gün içinde): ${invoiceList}`,
          type: 'info',
          relatedTo: 'Invoice',
          priority: 'normal',
        })
      }
    }

    return NextResponse.json({
      success: true,
      overdueCount: overdueInvoices?.length || 0,
      dueSoonCount: dueSoonInvoices?.length || 0,
      message: `Checked invoices: ${overdueInvoices?.length || 0} overdue, ${dueSoonInvoices?.length || 0} due soon`,
    })
  } catch (error: any) {
    console.error('Invoice check cron error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check invoices' },
      { status: 500 }
    )
  }
}

