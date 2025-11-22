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
  // Öncelik sırası: 1) llama-3.1-8b-instant (en güvenilir), 2) mixtral-8x7b-32768 (daha güçlü)
  model: 'llama-3.1-8b-instant', // ✅ Ücretsiz tier'da kesinlikle çalışan model (en güvenilir seçenek)
  // Alternatif: 'mixtral-8x7b-32768' (daha güçlü ama biraz daha yavaş, 32K context)
  temperature: 0.8, // Daha doğal ve yaratıcı cevaplar için
  max_tokens: 2000, // Daha uzun ve detaylı cevaplar için
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

  if (!apiKey || apiKey.trim() === '') {
    throw new Error(
      'GROQ_API_KEY bulunamadı. Lütfen Vercel ortam değişkenlerinde veya .env.local dosyasında GROQ_API_KEY değerini ayarlayın. ' +
      'API anahtarını https://console.groq.com/keys adresinden alabilirsiniz.'
    )
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
      
      // Özel hata mesajları
      if (response.status === 401) {
        throw new Error(
          'GROQ API anahtarı geçersiz. Lütfen Vercel ortam değişkenlerinde veya .env.local dosyasında doğru GROQ_API_KEY değerini ayarlayın.'
        )
      } else if (response.status === 429) {
        throw new Error(
          'GROQ API rate limit aşıldı. Lütfen birkaç saniye sonra tekrar deneyin. Ücretsiz tier: 14,400 request/gün.'
        )
      } else if (errorData.error?.message) {
        throw new Error(`GROQ API hatası: ${errorData.error.message}`)
      } else {
        throw new Error(`GROQ API hatası: ${response.status} ${response.statusText}`)
      }
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || ''
  } catch (error: any) {
    console.error('[Groq API Error]:', error)
    
    // Eğer zaten user-friendly bir mesaj varsa onu kullan
    if (error.message && (
      error.message.includes('GROQ_API_KEY') ||
      error.message.includes('rate limit') ||
      error.message.includes('geçersiz')
    )) {
      throw error
    }
    
    throw new Error(error.message || 'GROQ API çağrısı başarısız oldu. Lütfen daha sonra tekrar deneyin.')
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

