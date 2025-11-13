import { NextResponse } from 'next/server'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { createNotification } from '@/lib/notification-helper'

// Vercel Cron Job - Her gün 09:00'da çalışacak
// 1 günden fazla PENDING durumundaki onay talepleri için hatırlatıcı gönderir
// vercel.json'da tanımlanmalı:
// {
//   "crons": [{
//     "path": "/api/cron/check-approval-reminders",
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
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)

    // 1 günden fazla PENDING durumundaki onay taleplerini bul
    const { data: pendingApprovals } = await supabase
      .from('ApprovalRequest')
      .select('id, title, relatedTo, relatedId, approverIds, createdAt, companyId, requestedBy:User!ApprovalRequest_requestedBy_fkey(id, name)')
      .eq('status', 'PENDING')
      .lt('createdAt', oneDayAgo.toISOString())

    if (!pendingApprovals || pendingApprovals.length === 0) {
      return NextResponse.json({
        success: true,
        reminderCount: 0,
        message: 'No pending approvals to remind',
      })
    }

    let reminderCount = 0

    // Her onay talebi için onaylayıcılara hatırlatıcı gönder
    for (const approval of pendingApprovals) {
      if (approval.approverIds && Array.isArray(approval.approverIds)) {
        for (const approverId of approval.approverIds) {
          try {
            await createNotification({
              userId: approverId,
              companyId: approval.companyId,
              title: '⏰ Onay Hatırlatıcısı',
              message: `${approval.title} için onayınız 1 günden fazla bekliyor.`,
              type: 'warning',
              relatedTo: 'ApprovalRequest',
              relatedId: approval.id,
              link: `/tr/approvals/${approval.id}`,
              priority: 'high',
            })
            reminderCount++
          } catch (error) {
            console.error(`Failed to send reminder to ${approverId}:`, error)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      reminderCount,
      pendingCount: pendingApprovals.length,
      message: `Sent ${reminderCount} reminders for ${pendingApprovals.length} pending approvals`,
    })
  } catch (error: any) {
    console.error('Approval reminder cron error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check approval reminders' },
      { status: 500 }
    )
  }
}

