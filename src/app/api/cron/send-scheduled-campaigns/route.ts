import { NextResponse } from 'next/server'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Vercel Cron Job - Her saat başı çalışacak
// Zamanlanmış email kampanyalarını gönderir
// vercel.json'da tanımlanmalı (Vercel Cron slot boşaltıldıktan sonra):
// {
//   "crons": [{
//     "path": "/api/cron/send-scheduled-campaigns",
//     "schedule": "0 * * * *" // Her saat başı
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
    const now = new Date()

    // SCHEDULED durumunda ve scheduledAt zamanı geçmiş kampanyaları bul
    const { data: scheduledCampaigns, error: findError } = await supabase
      .from('EmailCampaign')
      .select('id, name, companyId, scheduledAt')
      .eq('status', 'SCHEDULED')
      .lte('scheduledAt', now.toISOString())
      .not('scheduledAt', 'is', null)

    if (findError) {
      console.error('Scheduled campaigns fetch error:', findError)
      return NextResponse.json(
        { error: 'Zamanlanmış kampanyalar alınamadı', details: findError.message },
        { status: 500 }
      )
    }

    if (!scheduledCampaigns || scheduledCampaigns.length === 0) {
      return NextResponse.json({
        success: true,
        sentCount: 0,
        message: 'Gönderilecek zamanlanmış kampanya yok',
      })
    }

    let sentCount = 0
    const errors: string[] = []

    // Her kampanya için gönderim işlemini başlat
    for (const campaign of scheduledCampaigns) {
      try {
        // Status'u SENDING olarak işaretle
        await supabase
          .from('EmailCampaign')
          .update({ status: 'SENDING' })
          .eq('id', campaign.id)

        // Kampanya gönderme endpoint'ini çağır (internal)
        const sendUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/email-campaigns/${campaign.id}/send`
        
        // Internal call için service role key kullan
        const response = await fetch(sendUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          },
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Kampanya gönderilemedi')
        }

        sentCount++
      } catch (error: any) {
        console.error(`Campaign ${campaign.id} send error:`, error)
        errors.push(`${campaign.name}: ${error.message}`)

        // Hata durumunda FAILED olarak işaretle
        await supabase
          .from('EmailCampaign')
          .update({ status: 'FAILED' })
          .eq('id', campaign.id)
      }
    }

    return NextResponse.json({
      success: true,
      sentCount,
      totalScheduled: scheduledCampaigns.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `${sentCount} kampanya gönderildi`,
    })
  } catch (error: any) {
    console.error('Scheduled campaigns cron error:', error)
    return NextResponse.json(
      { error: error.message || 'Zamanlanmış kampanyalar gönderilemedi' },
      { status: 500 }
    )
  }
}

