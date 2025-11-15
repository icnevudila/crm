/**
 * Test Email Gönderim API
 * Kullanıcının kendi email adresine test email gönderir
 */

import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { sendEmail } from '@/lib/integrations/email'
import { checkEmailIntegration } from '@/lib/integrations/check-integration'

export async function POST(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Email entegrasyonu kontrolü
    const integrationStatus = await checkEmailIntegration(session.user.companyId)
    
    // Debug: Entegrasyon durumunu logla
    console.log('Email Integration Status:', {
      hasIntegration: integrationStatus.hasIntegration,
      isActive: integrationStatus.isActive,
      status: integrationStatus.status,
      message: integrationStatus.message,
      companyId: session.user.companyId,
    })
    
    if (!integrationStatus.hasIntegration || !integrationStatus.isActive) {
      return NextResponse.json(
        { 
          error: integrationStatus.message,
          debug: {
            hasIntegration: integrationStatus.hasIntegration,
            isActive: integrationStatus.isActive,
            status: integrationStatus.status,
          }
        },
        { status: 400 }
      )
    }

    // Test email gönder
    // Resend test kısıtlaması: Sadece API key'inizin sahibi olan email adresine gönderebilirsiniz
    // İlk denemede session.user.email kullan, eğer hata alırsak Resend'in izin verdiği adresi kullan
    let recipientEmail = session.user.email
    let result = await sendEmail(session.user.companyId, {
      to: recipientEmail,
      subject: 'Test Email - CRM Entegrasyonu',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6366f1;">Test Email</h2>
          <p>Bu bir test email'idir. Email entegrasyonunuz başarıyla çalışıyor! 🎉</p>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            Bu email CRM sisteminizden otomatik olarak gönderilmiştir.
          </p>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            <strong>Not:</strong> Resend test modunda sadece API key'inizin sahibi olan email adresine gönderebilirsiniz. 
            Production için domain doğrulaması gereklidir.
          </p>
        </div>
      `,
      from: 'onboarding@resend.dev', // Resend test için özel adres
      fromName: 'CRM Enterprise',
    })

    // Eğer Resend test kısıtlaması hatası alırsak, hata mesajından izin verilen email adresini çıkar ve tekrar dene
    if (!result.success && result.error && result.error.includes('Resend test kısıtlaması')) {
      const allowedEmailMatch = result.error.match(/sadece ([^\s]+) adresine/)
      if (allowedEmailMatch && allowedEmailMatch[1]) {
        const allowedEmail = allowedEmailMatch[1]
        console.log('Resend test kısıtlaması: İzin verilen email adresi:', allowedEmail)
        console.log('Session email:', session.user.email, '-> İzin verilen email:', allowedEmail)
        
        // İzin verilen email adresine tekrar dene
        recipientEmail = allowedEmail
        result = await sendEmail(session.user.companyId, {
          to: recipientEmail,
          subject: 'Test Email - CRM Entegrasyonu',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #6366f1;">Test Email</h2>
              <p>Bu bir test email'idir. Email entegrasyonunuz başarıyla çalışıyor! 🎉</p>
              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                Bu email CRM sisteminizden otomatik olarak gönderilmiştir.
              </p>
              <p style="color: #666; font-size: 12px; margin-top: 20px;">
                <strong>Not:</strong> Resend test modunda sadece API key'inizin sahibi olan email adresine gönderebilirsiniz. 
                Production için domain doğrulaması gereklidir.
              </p>
            </div>
          `,
          from: 'onboarding@resend.dev',
          fromName: 'CRM Enterprise',
        })
      }
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Test email gönderilemedi' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `✅ Email entegrasyonu çalışıyor!\n\nTest email ${session.user.email} adresine başarıyla gönderildi.\n\nMessage ID: ${result.messageId}\n\nLütfen gelen kutunuzu kontrol edin.`,
      messageId: result.messageId,
    })
  } catch (error: any) {
    console.error('Test Email API error:', error)
    return NextResponse.json(
      { error: 'Test email gönderilemedi', message: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

