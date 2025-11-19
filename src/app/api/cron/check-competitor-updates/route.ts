import { NextResponse } from 'next/server'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { createNotification } from '@/lib/notification-helper'

// Vercel Cron Job - Her hafta pazartesi 09:00'da çalışacak
// 30 günden fazla güncellenmemiş rakip kayıtları için hatırlatıcı gönderir
// vercel.json'da tanımlanmalı:
// {
//   "crons": [{
//     "path": "/api/cron/check-competitor-updates",
//     "schedule": "0 9 * * 1"
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
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // 30 günden fazla güncellenmemiş rakip kayıtlarını bul
    const { data: outdatedCompetitors } = await supabase
      .from('Competitor')
      .select('id, name, updatedAt, companyId')
      .or(`updatedAt.is.null,updatedAt.lt.${thirtyDaysAgo.toISOString()}`)
      .order('updatedAt', { ascending: true })

    if (!outdatedCompetitors || outdatedCompetitors.length === 0) {
      return NextResponse.json({
        success: true,
        reminderCount: 0,
        message: 'No outdated competitors to remind',
      })
    }

    let reminderCount = 0

    // Her rakip için company'nin admin kullanıcılarına hatırlatıcı gönder
    for (const competitor of outdatedCompetitors) {
      // Company'nin admin kullanıcılarını bul
      const { data: admins } = await supabase
        .from('User')
        .select('id')
        .eq('companyId', competitor.companyId)
        .in('role', ['ADMIN', 'SUPER_ADMIN'])
        .limit(5)

      if (admins && admins.length > 0) {
        for (const admin of admins) {
          try {
            await createNotification({
              userId: admin.id,
              companyId: competitor.companyId,
              title: '🔄 Rakip Güncelleme Hatırlatıcısı',
              message: `${competitor.name} rakip kaydı 30 günden fazla güncellenmemiş. Lütfen bilgileri kontrol edin.`,
              type: 'info',
              relatedTo: 'Competitor',
              relatedId: competitor.id,
              link: `/tr/competitors/${competitor.id}`,
              priority: 'normal',
            })
            reminderCount++
          } catch (error) {
            console.error(`Failed to send reminder to admin ${admin.id}:`, error)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      reminderCount,
      outdatedCount: outdatedCompetitors.length,
      message: `Sent ${reminderCount} reminders for ${outdatedCompetitors.length} outdated competitors`,
    })
  } catch (error: any) {
    console.error('Competitor update reminder cron error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check competitor updates' },
      { status: 500 }
    )
  }
}

