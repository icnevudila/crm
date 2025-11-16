/**
 * Entegrasyon Analytics API
 * ActivityLog'dan entegrasyon istatistikleri çıkarır
 */

import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30') // Varsayılan 30 gün
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const supabase = getSupabaseWithServiceRole()
    const companyId = session.user.companyId
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'

    // Tarih aralığı hesapla
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    const start = startDate ? new Date(startDate) : thirtyDaysAgo
    const end = endDate ? new Date(endDate) : now

    // ActivityLog'dan entegrasyon verilerini çek
    let query = supabase
      .from('ActivityLog')
      .select('*')
      .eq('entity', 'Integration')
      .gte('createdAt', start.toISOString())
      .lte('createdAt', end.toISOString())
      .order('createdAt', { ascending: false })

    if (!isSuperAdmin) {
      query = query.eq('companyId', companyId)
    }

    const { data: logs, error } = await query

    if (error) {
      console.error('Integration analytics error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // İstatistikleri hesapla
    const stats = {
      // Toplam gönderimler
      totalSent: 0,
      totalFailed: 0,
      
      // Entegrasyon bazlı istatistikler
      email: {
        sent: 0,
        failed: 0,
        total: 0,
      },
      sms: {
        sent: 0,
        failed: 0,
        total: 0,
      },
      whatsapp: {
        sent: 0,
        failed: 0,
        total: 0,
      },
      calendar: {
        added: 0,
        failed: 0,
        total: 0,
      },
      
      // Başarı oranları
      successRate: 0,
      emailSuccessRate: 0,
      smsSuccessRate: 0,
      whatsappSuccessRate: 0,
      calendarSuccessRate: 0,
      
      // Günlük gönderimler (son 30 gün)
      dailyStats: [] as Array<{
        date: string
        email: number
        sms: number
        whatsapp: number
        calendar: number
        total: number
        failed: number
      }>,
      
      // En çok mesaj gönderilen müşteriler (meta.to'dan)
      topRecipients: [] as Array<{
        recipient: string
        count: number
        type: 'email' | 'sms' | 'whatsapp'
      }>,
      
      // Hata trend analizi (günlük hata sayıları)
      errorTrend: [] as Array<{
        date: string
        count: number
        type: string
      }>,
    }

    // Log'ları işle
    const recipientMap = new Map<string, { count: number; type: 'email' | 'sms' | 'whatsapp' }>()
    const dailyMap = new Map<string, { email: number; sms: number; whatsapp: number; calendar: number; failed: number }>()
    const errorTrendMap = new Map<string, { count: number; type: string }>()

    logs?.forEach((log) => {
      const action = log.action || ''
      const meta = log.meta || {}
      const logDate = new Date(log.createdAt).toISOString().split('T')[0] // YYYY-MM-DD

      // Günlük istatistikler
      if (!dailyMap.has(logDate)) {
        dailyMap.set(logDate, { email: 0, sms: 0, whatsapp: 0, calendar: 0, failed: 0 })
      }
      const daily = dailyMap.get(logDate)!

      // Email istatistikleri
      if (action.includes('EMAIL')) {
        if (action === 'EMAIL_SENT') {
          stats.email.sent++
          stats.totalSent++
          daily.email++
        } else if (action === 'EMAIL_SEND_FAILED') {
          stats.email.failed++
          stats.totalFailed++
          daily.failed++
        }
        stats.email.total++

        // Alıcı istatistikleri
        if (meta.to) {
          const recipients = Array.isArray(meta.to) ? meta.to : [meta.to]
          recipients.forEach((recipient: string) => {
            if (recipient && typeof recipient === 'string') {
              const key = `email:${recipient}`
              recipientMap.set(key, {
                count: (recipientMap.get(key)?.count || 0) + 1,
                type: 'email',
              })
            }
          })
        }
      }

      // SMS istatistikleri
      if (action.includes('SMS')) {
        if (action === 'SMS_SENT') {
          stats.sms.sent++
          stats.totalSent++
          daily.sms++
        } else if (action === 'SMS_SEND_FAILED') {
          stats.sms.failed++
          stats.totalFailed++
          daily.failed++
        }
        stats.sms.total++

        // Alıcı istatistikleri
        if (meta.to) {
          const key = `sms:${meta.to}`
          recipientMap.set(key, {
            count: (recipientMap.get(key)?.count || 0) + 1,
            type: 'sms',
          })
        }
      }

      // WhatsApp istatistikleri
      if (action.includes('WHATSAPP')) {
        if (action === 'WHATSAPP_SENT') {
          stats.whatsapp.sent++
          stats.totalSent++
          daily.whatsapp++
        } else if (action === 'WHATSAPP_SEND_FAILED') {
          stats.whatsapp.failed++
          stats.totalFailed++
          daily.failed++
        }
        stats.whatsapp.total++

        // Alıcı istatistikleri
        if (meta.to) {
          const key = `whatsapp:${meta.to}`
          recipientMap.set(key, {
            count: (recipientMap.get(key)?.count || 0) + 1,
            type: 'whatsapp',
          })
        }
      }

      // Calendar istatistikleri
      if (action.includes('CALENDAR')) {
        if (action === 'CALENDAR_ADDED') {
          stats.calendar.added++
          stats.totalSent++
          daily.calendar++
        } else if (action === 'CALENDAR_ADD_FAILED') {
          stats.calendar.failed++
          stats.totalFailed++
          daily.failed++
        }
        stats.calendar.total++
      }

      // Hata trend analizi
      if (action.includes('FAILED') || action.includes('_FAILED')) {
        const errorKey = `${logDate}:${action}`
        errorTrendMap.set(errorKey, {
          count: (errorTrendMap.get(errorKey)?.count || 0) + 1,
          type: action,
        })
      }
    })

    // Başarı oranlarını hesapla
    const total = stats.totalSent + stats.totalFailed
    stats.successRate = total > 0 ? (stats.totalSent / total) * 100 : 0

    const emailTotal = stats.email.sent + stats.email.failed
    stats.emailSuccessRate = emailTotal > 0 ? (stats.email.sent / emailTotal) * 100 : 0

    const smsTotal = stats.sms.sent + stats.sms.failed
    stats.smsSuccessRate = smsTotal > 0 ? (stats.sms.sent / smsTotal) * 100 : 0

    const whatsappTotal = stats.whatsapp.sent + stats.whatsapp.failed
    stats.whatsappSuccessRate = whatsappTotal > 0 ? (stats.whatsapp.sent / whatsappTotal) * 100 : 0

    const calendarTotal = stats.calendar.added + stats.calendar.failed
    stats.calendarSuccessRate = calendarTotal > 0 ? (stats.calendar.added / calendarTotal) * 100 : 0

    // Günlük istatistikleri sırala ve formatla
    stats.dailyStats = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        ...data,
        total: data.email + data.sms + data.whatsapp + data.calendar,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // En çok mesaj gönderilen müşteriler (top 10)
    stats.topRecipients = Array.from(recipientMap.entries())
      .map(([key, data]) => ({
        recipient: key.split(':')[1], // email:xxx -> xxx
        count: data.count,
        type: data.type,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Hata trend analizi
    stats.errorTrend = Array.from(errorTrendMap.entries())
      .map(([key, data]) => {
        const [date, type] = key.split(':')
        return {
          date,
          count: data.count,
          type: type || 'UNKNOWN',
        }
      })
      .sort((a, b) => a.date.localeCompare(b.date))

    // Maliyet tahmini (basit hesaplama)
    // Resend: $0.10 per 1000 emails (free tier: 3000/month)
    // Twilio SMS: $0.0075 per SMS (free tier: $15.50 credit)
    // Twilio WhatsApp: $0.005 per message (free tier: $15.50 credit)
    const estimatedCost = {
      email: {
        count: stats.email.sent,
        costPerUnit: 0.0001, // $0.10 per 1000 = $0.0001 per email
        total: stats.email.sent * 0.0001,
        freeLimit: 3000,
      },
      sms: {
        count: stats.sms.sent,
        costPerUnit: 0.0075,
        total: stats.sms.sent * 0.0075,
        freeLimit: 0, // Twilio free credit kullanılır
      },
      whatsapp: {
        count: stats.whatsapp.sent,
        costPerUnit: 0.005,
        total: stats.whatsapp.sent * 0.005,
        freeLimit: 0,
      },
      total: 0,
    }
    estimatedCost.total = estimatedCost.email.total + estimatedCost.sms.total + estimatedCost.whatsapp.total

    return NextResponse.json(
      {
        ...stats,
        estimatedCost,
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
          days,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
        },
      }
    )
  } catch (error: any) {
    console.error('Integration analytics error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch integration analytics' },
      { status: 500 }
    )
  }
}

