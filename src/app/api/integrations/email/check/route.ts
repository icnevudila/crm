/**
 * E-posta Entegrasyonu Kontrol API
 * Company'nin aktif e-posta entegrasyonu var mı kontrol eder
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

    const supabase = getSupabaseWithServiceRole()
    const { data: integration } = await supabase
      .from('CompanyIntegration')
      .select('gmailEnabled, outlookEnabled, smtpEnabled, emailStatus')
      .eq('companyId', session.user.companyId)
      .maybeSingle()

    if (!integration) {
      return NextResponse.json({
        hasEmailIntegration: false,
        status: 'NO_INTEGRATION',
        message: 'E-posta entegrasyonu bulunamadı. Lütfen Ayarlar > E-posta Entegrasyonları bölümünden yapılandırın.',
      })
    }

    const hasIntegration = integration.gmailEnabled || integration.outlookEnabled || integration.smtpEnabled
    const isActive = integration.emailStatus === 'ACTIVE'
    const hasError = integration.emailStatus === 'ERROR'

    return NextResponse.json({
      hasEmailIntegration: hasIntegration,
      isActive,
      hasError,
      status: integration.emailStatus || 'INACTIVE',
      message: !hasIntegration
        ? 'E-posta entegrasyonu aktif değil. Lütfen Ayarlar > E-posta Entegrasyonları bölümünden aktifleştirin.'
        : hasError
        ? 'E-posta entegrasyonunda hata var. Lütfen Ayarlar > E-posta Entegrasyonları bölümünden kontrol edin.'
        : !isActive
        ? 'E-posta entegrasyonu pasif durumda.'
        : 'E-posta entegrasyonu aktif ve hazır.',
    })
  } catch (error: any) {
    console.error('Email check error:', error)
    return NextResponse.json(
      { error: 'E-posta durumu kontrol edilemedi', message: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}







