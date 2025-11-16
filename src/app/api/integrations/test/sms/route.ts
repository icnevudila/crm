/**
 * Test SMS Gönderim API
 * Kullanıcının kendi telefon numarasına test SMS gönderir
 */

import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { sendSms } from '@/lib/integrations/sms'
import { checkSmsIntegration } from '@/lib/integrations/check-integration'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // SMS entegrasyonu kontrolü
    const integrationStatus = await checkSmsIntegration(session.user.companyId)
    if (!integrationStatus.hasIntegration || !integrationStatus.isActive) {
      return NextResponse.json(
        { error: integrationStatus.message },
        { status: 400 }
      )
    }

    // Kullanıcının telefon numarasını al
    const supabase = getSupabaseWithServiceRole()
    const { data: user } = await supabase
      .from('User')
      .select('phone')
      .eq('id', session.user.id)
      .maybeSingle()

    if (!user?.phone) {
      return NextResponse.json(
        { error: 'Telefon numaranız kayıtlı değil. Lütfen profil sayfanızdan telefon numaranızı ekleyin.' },
        { status: 400 }
      )
    }

    // Telefon numarası formatı kontrolü
    let phoneNumber = user.phone
    if (!phoneNumber.startsWith('+')) {
      // Türkiye için varsayılan +90 ekle
      if (phoneNumber.startsWith('0')) {
        phoneNumber = '+90' + phoneNumber.substring(1)
      } else {
        phoneNumber = '+90' + phoneNumber
      }
    }

    // Test SMS gönder
    const result = await sendSms({
      to: phoneNumber,
      message: 'Bu bir test mesajıdır. SMS entegrasyonunuz başarıyla çalışıyor! 🎉',
      companyId: session.user.companyId,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Test SMS gönderilemedi' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `✅ SMS entegrasyonu çalışıyor!\n\nTest SMS ${phoneNumber} numarasına başarıyla gönderildi.\n\nMessage ID: ${result.messageId}`,
      messageId: result.messageId,
    })
  } catch (error: any) {
    console.error('Test SMS API error:', error)
    return NextResponse.json(
      { error: 'Test SMS gönderilemedi', message: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

