import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { generateAIResponse, generateConversation } from '@/lib/ai/groq'
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
    const { prompt, messages, locale = 'tr' } = body

    if (!prompt && !messages) {
      return NextResponse.json({ error: 'Prompt or messages required' }, { status: 400 })
    }

    const systemPrompt = locale === 'tr' ? SYSTEM_PROMPT_TR : SYSTEM_PROMPT_EN

    let response: string

    if (messages && Array.isArray(messages)) {
      // Çoklu mesaj konuşması
      const conversationMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...messages,
      ]
      response = await generateConversation(conversationMessages, {
        max_tokens: 500, // Daha tutarlı cevaplar için artırıldı
        temperature: 0.5, // Daha tutarlı ve doğal cevaplar için düşürüldü (0.7'den 0.5'e)
      })
    } else {
      // Tek mesaj
      response = await generateAIResponse(prompt, systemPrompt, {
        max_tokens: 500, // Daha tutarlı cevaplar için artırıldı
        temperature: 0.5, // Daha tutarlı ve doğal cevaplar için düşürüldü (0.7'den 0.5'e)
      })
    }

    return NextResponse.json({ response })
  } catch (error: any) {
    console.error('[AI Chat Error]:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate AI response' },
      { status: 500 }
    )
  }
}

