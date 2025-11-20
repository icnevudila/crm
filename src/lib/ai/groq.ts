/**
 * Groq AI API Wrapper
 * Ücretsiz tier: 14,400 request/gün
 * Edge Runtime uyumlu
 */

interface GroqMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface GroqOptions {
  model?: string
  temperature?: number
  max_tokens?: number
  stream?: boolean
}

const DEFAULT_OPTIONS: GroqOptions = {
  model: 'llama-3.1-8b-instant', // Ücretsiz, hızlı model
  temperature: 0.7,
  max_tokens: 1024,
  stream: false,
}

/**
 * Groq API'ye istek gönder
 */
export async function callGroqAPI(
  messages: GroqMessage[],
  options: GroqOptions = {}
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY

  if (!apiKey) {
    throw new Error('GROQ_API_KEY environment variable is not set')
  }

  const requestOptions = { ...DEFAULT_OPTIONS, ...options }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: requestOptions.model,
        messages,
        temperature: requestOptions.temperature,
        max_tokens: requestOptions.max_tokens,
        stream: requestOptions.stream,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.error?.message || `Groq API error: ${response.status} ${response.statusText}`
      )
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || ''
  } catch (error: any) {
    console.error('[Groq API Error]:', error)
    throw new Error(error.message || 'Failed to call Groq API')
  }
}

/**
 * Basit prompt gönder (tek mesaj)
 */
export async function generateAIResponse(
  prompt: string,
  systemPrompt?: string,
  options?: GroqOptions
): Promise<string> {
  const messages: GroqMessage[] = []

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt })
  }

  messages.push({ role: 'user', content: prompt })

  return callGroqAPI(messages, options)
}

/**
 * Çoklu mesaj konuşması
 */
export async function generateConversation(
  messages: GroqMessage[],
  options?: GroqOptions
): Promise<string> {
  return callGroqAPI(messages, options)
}

