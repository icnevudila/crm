import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { generateAIResponse } from '@/lib/ai/groq'
import { parseCommandPrompt, generateCommandPreview } from '@/lib/ai/commands'
import { SYSTEM_PROMPT_TR, SYSTEM_PROMPT_EN } from '@/lib/ai/prompts'

export const runtime = 'edge'

/**
 * Komut preview endpoint - Ne yapacağını gösterir ama işlem yapmaz
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

    if (!command || typeof command !== 'string') {
      return NextResponse.json({ error: 'Command is required' }, { status: 400 })
    }

    // 1. Komutu parse et (AI ile)
    const parsePrompt = parseCommandPrompt(command, locale as 'tr' | 'en')
    const systemPrompt = locale === 'tr' ? SYSTEM_PROMPT_TR : SYSTEM_PROMPT_EN

    let parsedCommand: any
    try {
      const parseResponse = await generateAIResponse(parsePrompt, systemPrompt, {
        temperature: 0.1, // Çok kesin parse için
        max_tokens: 200, // Kısa JSON için
      })

      // JSON'u extract et
      const jsonMatch = parseResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedCommand = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Could not parse command')
      }
    } catch (error: any) {
      console.error('[AI Command Parse Error]:', error)
      return NextResponse.json(
        {
          success: false,
          message: locale === 'tr' ? 'Komut anlaşılamadı' : 'Command not understood',
          error: error.message,
        },
        { status: 400 }
      )
    }

    // 2. Preview oluştur (işlem yapmaz, sadece ne yapacağını gösterir)
    const preview = await generateCommandPreview(parsedCommand, locale as 'tr' | 'en')

    return NextResponse.json({
      success: true,
      preview,
      command: parsedCommand,
    })
  } catch (error: any) {
    console.error('[AI Command Preview Error]:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || (locale === 'tr' ? 'Preview oluşturulamadı' : 'Failed to generate preview'),
      },
      { status: 500 }
    )
  }
}

