import { NextResponse } from 'next/server'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { createNotificationForRole } from '@/lib/notification-helper'

// Vercel Cron Job - Her gün 09:00'da çalışacak
// vercel.json'da tanımlanmalı:
// {
//   "crons": [{
//     "path": "/api/cron/check-contract-renewals",
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
    const thirtyDaysLater = new Date(today)
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)
    const todayStr = today.toISOString().split('T')[0]
    const thirtyDaysLaterStr = thirtyDaysLater.toISOString().split('T')[0]

    // Yakında yenilenecek Contract'ları bul (endDate 30 gün içinde ve ACTIVE)
    const { data: renewingContracts, error: findError } = await supabase
      .from('Contract')
      .select('id, title, companyId, endDate, status, customerCompanyId')
      .gte('endDate', todayStr)
      .lte('endDate', thirtyDaysLaterStr)
      .eq('status', 'ACTIVE')
      .not('endDate', 'is', null)

    if (findError) {
      console.error('Check Contract Renewals - Find Error:', findError)
      return NextResponse.json(
        { error: 'Yenilenme aşamasındaki sözleşmeler alınamadı', details: findError.message },
        { status: 500 }
      )
    }

    if (!renewingContracts || renewingContracts.length === 0) {
      return NextResponse.json({
        message: 'Yakında yenilenecek sözleşme bulunamadı',
        count: 0,
        date: todayStr,
      })
    }

    // Her Contract için bildirim gönder (eğer daha önce gönderilmemişse)
    let notificationCount = 0
    const companyIds = [...new Set(renewingContracts.map((contract: any) => contract.companyId))]

    for (const companyId of companyIds) {
      const companyContracts = renewingContracts.filter((contract: any) => contract.companyId === companyId)

      for (const contract of companyContracts) {
        try {
          // Kaç gün kaldığını hesapla
          const endDate = new Date(contract.endDate)
          const daysUntilRenewal = Math.ceil((endDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))

          // Öncelik belirle: 7 gün öncesi kritik, 30 gün öncesi uyarı
          const priority = daysUntilRenewal <= 7 ? 'critical' : 'high'
          const title = daysUntilRenewal <= 7 
            ? 'Sözleşme Yenileme Tarihi Yaklaşıyor (Kritik)' 
            : 'Sözleşme Yenileme Tarihi Yaklaşıyor'
          const message = daysUntilRenewal <= 7
            ? `${contract.title} sözleşmesinin yenileme tarihi ${daysUntilRenewal} gün sonra. Acil işlem yapılması gerekiyor.`
            : `${contract.title} sözleşmesinin yenileme tarihi ${daysUntilRenewal} gün sonra.`

          // Daha önce bildirim gönderilmiş mi kontrol et
          const { data: existingNotification } = await supabase
            .from('Notification')
            .select('id')
            .eq('relatedTo', 'Contract')
            .eq('relatedId', contract.id)
            .like('title', 'Sözleşme Yenileme Tarihi Yaklaşıyor%')
            .eq('isRead', false)
            .maybeSingle()

          // Eğer bildirim yoksa gönder
          if (!existingNotification) {
            await createNotificationForRole({
              companyId: contract.companyId,
              role: ['ADMIN', 'SUPER_ADMIN'],
              title,
              message,
              type: 'warning',
              priority,
              relatedTo: 'Contract',
              relatedId: contract.id,
            })
            notificationCount++
          }
        } catch (error: any) {
          console.error(`Error processing contract ${contract.id}:`, error)
          // Hata olsa bile diğer Contract'ları işlemeye devam et
        }
      }
    }

    return NextResponse.json({
      message: 'Sözleşme yenilemeleri kontrol edildi',
      totalContracts: renewingContracts.length,
      notificationsSent: notificationCount,
      date: todayStr,
    })
  } catch (error: any) {
    console.error('Check Contract Renewals - Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Sözleşme yenilemeleri kontrol edilemedi' },
      { status: 500 }
    )
  }
}



