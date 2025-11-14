/**
 * SMTP E-posta Gönderim API
 * Node.js runtime kullanıyor (nodemailer için gerekli)
 */

import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'

export const runtime = 'nodejs' // Edge Runtime değil, Node.js runtime (nodemailer için gerekli)

interface SmtpConfig {
  host: string
  port: number
  user: string
  password: string
  secure: boolean // true = SSL (port 465), false = STARTTLS (port 587)
}

interface EmailData {
  to: string[]
  subject: string
  html: string
  text?: string
  from: string
  fromName: string
}

export async function POST(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: { config: SmtpConfig; email: EmailData }
    try {
      body = await request.json()
    } catch (jsonError: any) {
      return NextResponse.json(
        { error: 'Geçersiz JSON', message: jsonError?.message || 'İstek gövdesi çözümlenemedi' },
        { status: 400 }
      )
    }

    const { config, email } = body

    // Validation
    if (!config.host || !config.port || !config.user || !config.password) {
      return NextResponse.json({ error: 'SMTP konfigürasyonu eksik' }, { status: 400 })
    }
    if (!email.to || !Array.isArray(email.to) || email.to.length === 0) {
      return NextResponse.json({ error: 'Alıcı e-posta adresi gereklidir' }, { status: 400 })
    }
    if (!email.subject || !email.html || !email.from) {
      return NextResponse.json({ error: 'E-posta içeriği eksik' }, { status: 400 })
    }

    // Nodemailer kullanarak SMTP ile e-posta gönder
    // NOT: nodemailer package.json'da yok, dinamik import kullanıyoruz
    let nodemailer: any
    try {
      nodemailer = await import('nodemailer')
    } catch (importError) {
      // Nodemailer yoksa, direkt fetch ile SMTP sunucusuna bağlanmayı dene
      // Veya basit bir SMTP client kullan
      return NextResponse.json(
        { 
          error: 'Nodemailer kurulu değil',
          message: 'SMTP e-posta göndermek için nodemailer paketini yükleyin: npm install nodemailer'
        },
        { status: 500 }
      )
    }

    // Transporter oluştur
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure, // true = SSL, false = STARTTLS
      auth: {
        user: config.user,
        pass: config.password,
      },
    })

    // E-posta gönder
    const info = await transporter.sendMail({
      from: email.fromName ? `"${email.fromName}" <${email.from}>` : email.from,
      to: email.to.join(', '),
      subject: email.subject,
      text: email.text || email.html.replace(/<[^>]*>/g, ''),
      html: email.html,
    })

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
    })
  } catch (error: any) {
    console.error('SMTP email send error:', error)
    return NextResponse.json(
      { error: 'SMTP e-posta gönderilemedi', message: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}



