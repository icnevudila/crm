import { NextResponse } from 'next/server'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { createNotificationForRole } from '@/lib/notification-helper'

// Vercel Cron Job - Her gün 09:00'da çalışacak
// vercel.json'da tanımlanmalı:
// {
//   "crons": [{
//     "path": "/api/cron/check-overdue-tickets",
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
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

    // Geç kalmış Ticket'ları bul (7 günden uzun süredir açık ve RESOLVED/CLOSED değil)
    const { data: overdueTickets, error: findError } = await supabase
      .from('Ticket')
      .select('id, subject, companyId, createdAt, status, assignedTo')
      .lt('createdAt', sevenDaysAgoStr)
      .not('status', 'in', '(RESOLVED,CLOSED)')

    if (findError) {
      console.error('Check Overdue Tickets - Find Error:', findError)
      return NextResponse.json(
        { error: 'Geciken destek talepleri alınamadı', details: findError.message },
        { status: 500 }
      )
    }

    if (!overdueTickets || overdueTickets.length === 0) {
      return NextResponse.json({
        message: 'Geciken destek talebi bulunamadı',
        count: 0,
        date: today.toISOString().split('T')[0],
      })
    }

    // Her Ticket için bildirim gönder (eğer daha önce gönderilmemişse)
    let notificationCount = 0
    const companyIds = [...new Set(overdueTickets.map((ticket: any) => ticket.companyId))]

    for (const companyId of companyIds) {
      const companyTickets = overdueTickets.filter((ticket: any) => ticket.companyId === companyId)

      for (const ticket of companyTickets) {
        try {
          // Kaç gün geçtiğini hesapla
          const createdAt = new Date(ticket.createdAt)
          const daysOverdue = Math.floor((today.getTime() - createdAt.getTime()) / (24 * 60 * 60 * 1000))

          // Daha önce bildirim gönderilmiş mi kontrol et
          const { data: existingNotification } = await supabase
            .from('Notification')
            .select('id')
            .eq('relatedTo', 'Ticket')
            .eq('relatedId', ticket.id)
            .eq('title', 'Destek Talebi Geç Kaldı')
            .eq('isRead', false)
            .maybeSingle()

          // Eğer bildirim yoksa gönder
          if (!existingNotification) {
            // Atanan kullanıcıya bildirim gönder
            if (ticket.assignedTo) {
              await supabase.from('Notification').insert([
                {
                  userId: ticket.assignedTo,
                  companyId: ticket.companyId,
                  title: 'Destek Talebi Geç Kaldı',
                  message: `${ticket.subject} destek talebi ${daysOverdue} gündür açık. Lütfen talebi çözün veya kapatın.`,
                  type: 'error',
                  priority: 'high',
                  relatedTo: 'Ticket',
                  relatedId: ticket.id,
                  isRead: false,
                },
              ])
              notificationCount++
            }

            // Admin'lere de bildirim gönder
            await createNotificationForRole({
              companyId: ticket.companyId,
              role: ['ADMIN', 'SUPER_ADMIN'],
              title: 'Destek Talebi Geç Kaldı',
              message: `${ticket.subject} destek talebi ${daysOverdue} gündür açık.`,
              type: 'error',
              priority: 'high',
              relatedTo: 'Ticket',
              relatedId: ticket.id,
            })
            notificationCount++
          }
        } catch (error: any) {
          console.error(`Error processing ticket ${ticket.id}:`, error)
          // Hata olsa bile diğer Ticket'ları işlemeye devam et
        }
      }
    }

    return NextResponse.json({
      message: 'Geciken destek talepleri kontrol edildi',
      totalTickets: overdueTickets.length,
      notificationsSent: notificationCount,
      date: today.toISOString().split('T')[0],
    })
  } catch (error: any) {
    console.error('Check Overdue Tickets - Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Geciken destek talepleri kontrol edilemedi' },
      { status: 500 }
    )
  }
}




