import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { generateAIResponse } from '@/lib/ai/groq'
import { generateEmailResponsePrompt, SYSTEM_PROMPT_TR, SYSTEM_PROMPT_EN } from '@/lib/ai/prompts'

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
    const { emailInfo, locale = 'tr' } = body

    if (!emailInfo || !emailInfo.from || !emailInfo.subject || !emailInfo.body) {
      return NextResponse.json(
        { error: 'emailInfo with from, subject, and body is required' },
        { status: 400 }
      )
    }

    const systemPrompt = locale === 'tr' ? SYSTEM_PROMPT_TR : SYSTEM_PROMPT_EN
    const prompt = generateEmailResponsePrompt(emailInfo, locale as 'tr' | 'en')

    const response = await generateAIResponse(prompt, systemPrompt, {
      temperature: 0.7,
      max_tokens: 1000,
    })

    return NextResponse.json({ emailResponse: response })
  } catch (error: any) {
    console.error('[AI Email Response Error]:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate email response' },
      { status: 500 }
    )
  }
}

