import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { generateAIResponse, generateConversation } from '@/lib/ai/groq'
import { SYSTEM_PROMPT_TR, SYSTEM_PROMPT_EN } from '@/lib/ai/prompts'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

export const runtime = 'edge'

/**
 * Şirket verilerini context olarak çek (RAG - Retrieval Augmented Generation)
 */
async function getCompanyContext(companyId: string) {
  try {
    const supabase = getSupabaseWithServiceRole()
    
    // Önemli verileri çek
    const [customersResult, dealsResult, quotesResult, invoicesResult, productsResult] = await Promise.all([
      supabase.from('Customer').select('id, name, status').eq('companyId', companyId).limit(10),
      supabase.from('Deal').select('id, title, stage, status, value').eq('companyId', companyId).limit(10),
      supabase.from('Quote').select('id, title, status, total').eq('companyId', companyId).limit(10),
      supabase.from('Invoice').select('id, title, status, total').eq('companyId', companyId).limit(10),
      supabase.from('Product').select('id, name, stock, status').eq('companyId', companyId).limit(10),
    ])

    return {
      customers: customersResult.data || [],
      deals: dealsResult.data || [],
      quotes: quotesResult.data || [],
      invoices: invoicesResult.data || [],
      products: productsResult.data || [],
    }
  } catch (error) {
    console.error('[Company Context Error]:', error)
    return {
      customers: [],
      deals: [],
      quotes: [],
      invoices: [],
      products: [],
    }
  }
}

/**
 * System prompt'u kullanıcının verileriyle zenginleştir
 * Verileri doğal bir şekilde context olarak ekle, liste halinde değil
 */
function enhanceSystemPromptWithContext(
  basePrompt: string,
  contextData: any,
  locale: 'tr' | 'en'
): string {
  const isTurkish = locale === 'tr'
  
  // Verileri özetle, detaylı liste verme
  let contextSummary = ''
  
  const activeCustomers = contextData.customers.filter((c: any) => c.status === 'ACTIVE').length
  const activeDeals = contextData.deals.filter((d: any) => d.status === 'OPEN').length
  const totalDealValue = contextData.deals
    .filter((d: any) => d.status === 'OPEN')
    .reduce((sum: number, d: any) => sum + (d.value || 0), 0)
  const pendingQuotes = contextData.quotes.filter((q: any) => q.status === 'SENT' || q.status === 'WAITING').length
  const lowStockProducts = contextData.products.filter((p: any) => (p.stock || 0) < 10).length
  
  // Sadece önemli özet bilgileri ekle, liste verme
  contextSummary = isTurkish
    ? `\n\nKULLANICININ ŞİRKET VERİLERİ (gerçek zamanlı):\n` +
      `- Aktif müşteri sayısı: ${activeCustomers}\n` +
      `- Aktif fırsat sayısı: ${activeDeals}${totalDealValue > 0 ? ` (Toplam değer: ${totalDealValue.toLocaleString('tr-TR')} TL)` : ''}\n` +
      `${pendingQuotes > 0 ? `- Bekleyen teklif sayısı: ${pendingQuotes}\n` : ''}` +
      `${lowStockProducts > 0 ? `- Düşük stok ürün sayısı: ${lowStockProducts}\n` : ''}` +
      `\nBu verileri kullanarak kullanıcıya doğal ve akıcı bir şekilde cevap ver. ASLA liste halinde verme, konuşma içinde doğal bir şekilde kullan.`
    : `\n\nUSER'S COMPANY DATA (real-time):\n` +
      `- Active customers: ${activeCustomers}\n` +
      `- Active deals: ${activeDeals}${totalDealValue > 0 ? ` (Total value: ${totalDealValue.toLocaleString('en-US')} USD)` : ''}\n` +
      `${pendingQuotes > 0 ? `- Pending quotes: ${pendingQuotes}\n` : ''}` +
      `${lowStockProducts > 0 ? `- Low stock products: ${lowStockProducts}\n` : ''}` +
      `\nUse this data to answer the user naturally and fluently. NEVER give lists, use the data naturally in conversation.`
  
  return basePrompt + contextSummary
}

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

    // Kullanıcının şirket verilerini context olarak ekle (RAG - Retrieval Augmented Generation)
    const contextData = await getCompanyContext(session.user.companyId)
    const enhancedSystemPrompt = enhanceSystemPromptWithContext(systemPrompt, contextData, locale)

    if (messages && Array.isArray(messages)) {
      // Çoklu mesaj konuşması
      const conversationMessages = [
        { role: 'system' as const, content: enhancedSystemPrompt },
        ...messages,
      ]
      response = await generateConversation(conversationMessages, {
        max_tokens: 2000, // Daha uzun ve detaylı cevaplar için artırıldı
        temperature: 0.8, // Daha doğal ve yaratıcı cevaplar için artırıldı (0.5'ten 0.8'e)
      })
    } else {
      // Tek mesaj
      response = await generateAIResponse(prompt, enhancedSystemPrompt, {
        max_tokens: 2000, // Daha uzun ve detaylı cevaplar için artırıldı
        temperature: 0.8, // Daha doğal ve yaratıcı cevaplar için artırıldı (0.5'ten 0.8'e)
      })
    }

    return NextResponse.json({ response })
  } catch (error: any) {
    console.error('[AI Chat Error]:', error)
    
    // GROQ API key hatası için özel mesaj
    const errorMessage = error.message || 'AI yanıtı oluşturulamadı'
    const isApiKeyError = errorMessage.includes('GROQ_API_KEY')
    
    return NextResponse.json(
      { 
        error: errorMessage,
        ...(isApiKeyError && {
          hint: 'GROQ_API_KEY ortam değişkenini kontrol edin. Vercel\'de Settings > Environment Variables bölümünden ekleyebilirsiniz.'
        })
      },
      { status: 500 }
    )
  }
}

