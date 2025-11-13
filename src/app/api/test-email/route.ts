import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { sendEmail } from '@/lib/email-helper'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Test email gönderme endpoint'i
 * 
 * Kullanım:
 * POST /api/test-email
 * {
 *   "to": "test@example.com",
 *   "subject": "Test Email",
 *   "html": "<h1>Test</h1>"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Sadece Admin ve SuperAdmin test email gönderebilir
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Bu işlem için yetkiniz yok' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { to, subject, html, body: textBody } = body

    if (!to || !subject) {
      return NextResponse.json(
        { error: 'to ve subject gereklidir' },
        { status: 400 }
      )
    }

    const result = await sendEmail({
      to,
      subject,
      html: html || textBody || '<p>Bu bir test emailidir.</p>',
    })

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      service: result.service,
      warning: result.warning,
      message: result.warning || 'Email başarıyla gönderildi',
    })
  } catch (error: any) {
    console.error('Test email error:', error)
    return NextResponse.json(
      { error: error.message || 'Email gönderilemedi' },
      { status: 500 }
    )
  }
}

