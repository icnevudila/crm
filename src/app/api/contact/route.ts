import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, company, message } = body

    // Validation
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'İsim, email ve mesaj alanları zorunludur' },
        { status: 400 }
      )
    }

    // Resend API ile email gönder
    const RESEND_API_KEY = process.env.RESEND_API_KEY
    
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY environment variable is not set')
      return NextResponse.json(
        { error: 'Email servisi yapılandırılmamış' },
        { status: 500 }
      )
    }

    // Resend API'ye istek gönder
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'CRM Enterprise <noreply@yourdomain.com>',
        to: [process.env.CONTACT_EMAIL || 'info@yourdomain.com'],
        subject: `Yeni İletişim Formu: ${name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">
              Yeni İletişim Formu Mesajı
            </h2>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 20px;">
              <p><strong>İsim:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              ${phone ? `<p><strong>Telefon:</strong> ${phone}</p>` : ''}
              ${company ? `<p><strong>Şirket:</strong> ${company}</p>` : ''}
              <p><strong>Mesaj:</strong></p>
              <p style="background: white; padding: 15px; border-radius: 4px; border-left: 4px solid #6366f1;">
                ${message.replace(/\n/g, '<br>')}
              </p>
            </div>
            <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
              Bu mesaj CRM Enterprise V3 landing page'inden gönderilmiştir.
            </p>
          </div>
        `,
      }),
    })

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json().catch(() => ({}))
      console.error('Resend API error:', errorData)
      return NextResponse.json(
        { error: 'Email gönderilemedi', details: errorData },
        { status: 500 }
      )
    }

    const result = await resendResponse.json()

    return NextResponse.json(
      { 
        success: true, 
        message: 'Mesajınız başarıyla gönderildi. En kısa sürede size dönüş yapacağız.',
        id: result.id 
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Bir hata oluştu. Lütfen tekrar deneyin.' },
      { status: 500 }
    )
  }
}




