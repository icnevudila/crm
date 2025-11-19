/**
 * Test Microsoft Teams Meeting API
 * Microsoft Teams entegrasyonunu test eder - test meeting oluşturur
 */

import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { createTeamsMeeting } from '@/lib/meeting-apis'

export async function POST(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Company integration bilgilerini çek
    const supabase = getSupabaseWithServiceRole()
    const { data: integration, error: integrationError } = await supabase
      .from('CompanyIntegration')
      .select('microsoftClientId, microsoftClientSecret, microsoftEnabled')
      .eq('companyId', session.user.companyId)
      .single()

    if (integrationError || !integration) {
      return NextResponse.json(
        { error: 'Microsoft Teams entegrasyonu bulunamadı. Lütfen Microsoft Client ID ve Secret bilgilerini kaydedin.' },
        { status: 400 }
      )
    }

    if (!integration.microsoftEnabled || !integration.microsoftClientId || !integration.microsoftClientSecret) {
      return NextResponse.json(
        { error: 'Microsoft Teams entegrasyonu yapılandırılmamış. Lütfen Microsoft Client ID ve Secret bilgilerini girin ve OAuth bağlantısı yapın.' },
        { status: 400 }
      )
    }

    // User integration'dan access token'ı çek
    const { data: userIntegration, error: userIntegrationError } = await supabase
      .from('UserIntegration')
      .select('microsoftAccessToken, microsoftRefreshToken, microsoftTokenExpiresAt')
      .eq('userId', session.user.id)
      .eq('integrationType', 'MICROSOFT_CALENDAR')
      .single()

    if (userIntegrationError || !userIntegration?.microsoftAccessToken) {
      return NextResponse.json(
        { error: 'Microsoft OAuth bağlantısı yapılmamış. Lütfen önce Microsoft OAuth bağlantısı yapın.' },
        { status: 400 }
      )
    }

    // Test meeting oluştur (yarın saat 14:00)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(14, 0, 0, 0)

    const result = await createTeamsMeeting({
      title: 'Test Toplantı - CRM Entegrasyonu (Microsoft Teams)',
      startTime: tomorrow.toISOString(),
      duration: 30, // 30 dakika
      description: 'Bu bir test toplantısıdır. Microsoft Teams entegrasyonunuz başarıyla çalışıyor! 🎉',
      attendees: [session.user.email],
      accessToken: userIntegration.microsoftAccessToken,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Microsoft Teams test meeting oluşturulamadı' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `✅ Microsoft Teams entegrasyonu çalışıyor!\n\nTest toplantı başarıyla oluşturuldu.\n\nToplantı: Test Toplantı - CRM Entegrasyonu (Microsoft Teams)\nTarih: ${new Date(tomorrow).toLocaleString('tr-TR')}\nSüre: 30 dakika\n\nToplantı URL: ${result.meetingUrl || result.joinUrl}\nMeeting ID: ${result.meetingId}`,
      meetingUrl: result.meetingUrl || result.joinUrl,
      meetingId: result.meetingId,
    })
  } catch (error: any) {
    console.error('Test Microsoft Teams API error:', error)
    return NextResponse.json(
      { error: 'Microsoft Teams test meeting oluşturulamadı', message: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

