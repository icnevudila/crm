import { NextResponse } from 'next/server'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { createNotificationForRole } from '@/lib/notification-helper'

// Vercel Cron Job - Her gün 09:00'da çalışacak
// vercel.json'da tanımlanmalı:
// {
//   "crons": [{
//     "path": "/api/cron/check-overdue-tasks",
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

    // Geç kalmış Task'ları bul (dueDate geçmiş ve DONE değil)
    const { data: overdueTasks, error: findError } = await supabase
      .from('Task')
      .select('id, title, companyId, dueDate, status, assignedTo')
      .lt('dueDate', today)
      .not('status', 'eq', 'DONE')
      .not('dueDate', 'is', null)

    if (findError) {
      console.error('Check Overdue Tasks - Find Error:', findError)
      return NextResponse.json(
        { error: 'Failed to find overdue tasks', details: findError.message },
        { status: 500 }
      )
    }

    if (!overdueTasks || overdueTasks.length === 0) {
      return NextResponse.json({
        message: 'No overdue tasks found',
        count: 0,
        date: today,
      })
    }

    // Her Task için bildirim gönder (eğer daha önce gönderilmemişse)
    let notificationCount = 0
    const companyIds = [...new Set(overdueTasks.map((task: any) => task.companyId))]

    for (const companyId of companyIds) {
      const companyTasks = overdueTasks.filter((task: any) => task.companyId === companyId)

      for (const task of companyTasks) {
        try {
          // Daha önce bildirim gönderilmiş mi kontrol et
          const { data: existingNotification } = await supabase
            .from('Notification')
            .select('id')
            .eq('relatedTo', 'Task')
            .eq('relatedId', task.id)
            .eq('title', 'Görev Geç Kaldı')
            .eq('isRead', false)
            .maybeSingle()

          // Eğer bildirim yoksa gönder
          if (!existingNotification) {
            // Atanan kullanıcıya bildirim gönder
            if (task.assignedTo) {
              await supabase.from('Notification').insert([
                {
                  userId: task.assignedTo,
                  companyId: task.companyId,
                  title: 'Görev Geç Kaldı',
                  message: `${task.title} görevinin süresi doldu. Lütfen görevi tamamlayın veya süresini güncelleyin.`,
                  type: 'error',
                  priority: 'high',
                  relatedTo: 'Task',
                  relatedId: task.id,
                  isRead: false,
                },
              ])
              notificationCount++
            }

            // Admin'lere de bildirim gönder
            await createNotificationForRole({
              companyId: task.companyId,
              role: ['ADMIN', 'SUPER_ADMIN'],
              title: 'Görev Geç Kaldı',
              message: `${task.title} görevinin süresi doldu.`,
              type: 'error',
              priority: 'high',
              relatedTo: 'Task',
              relatedId: task.id,
            })
            notificationCount++
          }
        } catch (error: any) {
          console.error(`Error processing task ${task.id}:`, error)
          // Hata olsa bile diğer Task'ları işlemeye devam et
        }
      }
    }

    return NextResponse.json({
      message: 'Overdue tasks checked',
      totalTasks: overdueTasks.length,
      notificationsSent: notificationCount,
      date: today,
    })
  } catch (error: any) {
    console.error('Check Overdue Tasks - Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to check overdue tasks' },
      { status: 500 }
    )
  }
}











