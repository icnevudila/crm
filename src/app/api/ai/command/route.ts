import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { generateAIResponse } from '@/lib/ai/groq'
import { parseCommandPrompt, executeAICommand, COMMAND_EXAMPLES } from '@/lib/ai/commands'
import { SYSTEM_PROMPT_TR, SYSTEM_PROMPT_EN } from '@/lib/ai/prompts'

export const runtime = 'edge'

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

    // 2. Komutu çalıştır (server-side'da)
    const result = await executeAICommand(parsedCommand, session, locale as 'tr' | 'en', request)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[AI Command Error]:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || (locale === 'tr' ? 'Komut çalıştırılamadı' : 'Command failed'),
      },
      { status: 500 }
    )
  }
}

// Komut örneklerini döndür
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const locale = (searchParams.get('locale') || 'tr') as 'tr' | 'en'

    return NextResponse.json({
      examples: COMMAND_EXAMPLES[locale],
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

