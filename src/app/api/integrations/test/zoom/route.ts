/**
 * Test Zoom Meeting API
 * Zoom entegrasyonunu test eder - test meeting oluşturur
 */

import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { createZoomMeeting } from '@/lib/meeting-apis'

export async function POST(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Company integration bilgilerini çek
    const supabase = getSupabaseWithServiceRole()
    const { data: integration, error: integrationError } = await supabase
      .from('CompanyIntegration')
      .select('zoomAccountId, zoomClientId, zoomClientSecret, zoomEnabled')
      .eq('companyId', session.user.companyId)
      .single()

    if (integrationError || !integration) {
      return NextResponse.json(
        { error: 'Zoom entegrasyonu bulunamadı. Lütfen Zoom bilgilerini kaydedin.' },
        { status: 400 }
      )
    }

    if (!integration.zoomEnabled || !integration.zoomAccountId || !integration.zoomClientId || !integration.zoomClientSecret) {
      return NextResponse.json(
        { error: 'Zoom entegrasyonu yapılandırılmamış. Lütfen Zoom Account ID, Client ID ve Client Secret bilgilerini girin ve kaydedin.' },
        { status: 400 }
      )
    }

    // Test meeting oluştur (yarın saat 14:00)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(14, 0, 0, 0)

    const result = await createZoomMeeting({
      title: 'Test Toplantı - CRM Entegrasyonu',
      startTime: tomorrow.toISOString(),
      duration: 30, // 30 dakika
      timezone: 'Europe/Istanbul',
      password: '123456',
      accountId: integration.zoomAccountId,
      clientId: integration.zoomClientId,
      clientSecret: integration.zoomClientSecret,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Zoom test meeting oluşturulamadı' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `✅ Zoom entegrasyonu çalışıyor!\n\nTest toplantı başarıyla oluşturuldu.\n\nToplantı: Test Toplantı - CRM Entegrasyonu\nTarih: ${new Date(tomorrow).toLocaleString('tr-TR')}\nSüre: 30 dakika\n\nToplantı URL: ${result.meetingUrl}\nŞifre: ${result.password || '123456'}`,
      meetingUrl: result.meetingUrl,
      meetingId: result.meetingId,
      password: result.password,
    })
  } catch (error: any) {
    console.error('Test Zoom API error:', error)
    return NextResponse.json(
      { error: 'Zoom test meeting oluşturulamadı', message: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

