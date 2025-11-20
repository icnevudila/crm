import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { generateAIResponse } from '@/lib/ai/groq'
import { generateQuotePrompt, SYSTEM_PROMPT_TR, SYSTEM_PROMPT_EN } from '@/lib/ai/prompts'

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
    const { quoteInfo, locale = 'tr' } = body

    if (!quoteInfo || !quoteInfo.customerName || !quoteInfo.products) {
      return NextResponse.json(
        { error: 'quoteInfo with customerName and products is required' },
        { status: 400 }
      )
    }

    const systemPrompt = locale === 'tr' ? SYSTEM_PROMPT_TR : SYSTEM_PROMPT_EN
    const prompt = generateQuotePrompt(quoteInfo, locale as 'tr' | 'en')

    const response = await generateAIResponse(prompt, systemPrompt, {
      temperature: 0.8, // Daha yaratıcı metin için
      max_tokens: 1500,
    })

    return NextResponse.json({ quoteText: response })
  } catch (error: any) {
    console.error('[AI Generate Quote Error]:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate quote text' },
      { status: 500 }
    )
  }
}

