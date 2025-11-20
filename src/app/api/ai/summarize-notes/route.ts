import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { generateAIResponse } from '@/lib/ai/groq'
import { summarizeNotesPrompt, SYSTEM_PROMPT_TR, SYSTEM_PROMPT_EN } from '@/lib/ai/prompts'

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
    const { notes, locale = 'tr' } = body

    if (!notes || !Array.isArray(notes) || notes.length === 0) {
      return NextResponse.json({ error: 'Notes array is required' }, { status: 400 })
    }

    const systemPrompt = locale === 'tr' ? SYSTEM_PROMPT_TR : SYSTEM_PROMPT_EN
    const prompt = summarizeNotesPrompt(notes, locale as 'tr' | 'en')

    const response = await generateAIResponse(prompt, systemPrompt, {
      temperature: 0.5, // Daha objektif özet için
      max_tokens: 800,
    })

    return NextResponse.json({ summary: response })
  } catch (error: any) {
    console.error('[AI Summarize Notes Error]:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to summarize notes' },
      { status: 500 }
    )
  }
}

