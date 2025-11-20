import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { executeAICommand } from '@/lib/ai/commands'

export const runtime = 'edge'

/**
 * Komut execute endpoint - Onay sonrası gerçek işlemi yapar
 */
export async function POST(request: Request) {
  try {
    // Session kontrolü
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { command, locale = 'tr' } = body

    if (!command || !command.type || !command.entity) {
      return NextResponse.json({ error: 'Command object is required' }, { status: 400 })
    }

    // Komutu çalıştır (server-side'da)
    const result = await executeAICommand(command, session, locale as 'tr' | 'en', request)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[AI Command Execute Error]:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || (locale === 'tr' ? 'Komut çalıştırılamadı' : 'Command failed'),
      },
      { status: 500 }
    )
  }
}

