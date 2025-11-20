/**
 * CRM için hazır AI prompt şablonları
 * Türkçe ve İngilizce destekli
 */

interface CustomerInfo {
  name: string
  company?: string
  sector?: string
  email?: string
  phone?: string
}

interface QuoteInfo {
  customerName: string
  products: Array<{ name: string; quantity: number; price: number }>
  totalAmount: number
  currency?: string
  validUntil?: string
}

interface EmailInfo {
  from: string
  subject: string
  body: string
  customerName?: string
}

/**
 * Teklif metni oluşturma prompt'u
 */
export function generateQuotePrompt(quoteInfo: QuoteInfo, locale: 'tr' | 'en' = 'tr'): string {
  const isTurkish = locale === 'tr'

  const productList = quoteInfo.products
    .map((p) => `- ${p.name}: ${p.quantity} adet x ${p.price} ${quoteInfo.currency || 'TL'}`)
    .join('\n')

  return isTurkish
    ? `Aşağıdaki bilgilere göre profesyonel bir teklif metni oluştur. Teklif metni samimi, profesyonel ve ikna edici olmalı.

Müşteri: ${quoteInfo.customerName}
Ürünler:
${productList}
Toplam Tutar: ${quoteInfo.totalAmount} ${quoteInfo.currency || 'TL'}
${quoteInfo.validUntil ? `Geçerlilik: ${quoteInfo.validUntil}` : ''}

Teklif metnini şu formatta oluştur:
1. Samimi bir giriş
2. Ürün/hizmet açıklamaları
3. Değer önerisi
4. Sonuç ve çağrı

Metin 200-300 kelime arasında olmalı.`
    : `Create a professional quote text based on the following information. The quote text should be friendly, professional, and persuasive.

Customer: ${quoteInfo.customerName}
Products:
${productList}
Total Amount: ${quoteInfo.totalAmount} ${quoteInfo.currency || 'USD'}
${quoteInfo.validUntil ? `Valid Until: ${quoteInfo.validUntil}` : ''}

Create the quote text in this format:
1. Friendly introduction
2. Product/service descriptions
3. Value proposition
4. Conclusion and call to action

Text should be 200-300 words.`
}

/**
 * Müşteri notlarını özetleme prompt'u
 */
export function summarizeNotesPrompt(notes: string[], locale: 'tr' | 'en' = 'tr'): string {
  const isTurkish = locale === 'tr'
  const notesText = notes.join('\n\n---\n\n')

  return isTurkish
    ? `Aşağıdaki müşteri notlarını özetle. Önemli noktaları, aksiyon öğelerini ve takip gereken konuları vurgula.

Notlar:
${notesText}

Özet formatı:
1. Genel Durum (2-3 cümle)
2. Önemli Noktalar (madde işaretli)
3. Aksiyon Öğeleri (varsa)
4. Takip Gereken Konular (varsa)

Özet 150-200 kelime arasında olmalı.`
    : `Summarize the following customer notes. Highlight key points, action items, and follow-up topics.

Notes:
${notesText}

Summary format:
1. General Status (2-3 sentences)
2. Key Points (bulleted)
3. Action Items (if any)
4. Follow-up Topics (if any)

Summary should be 150-200 words.`
}

/**
 * Email yanıt önerisi prompt'u
 */
export function generateEmailResponsePrompt(
  emailInfo: EmailInfo,
  locale: 'tr' | 'en' = 'tr'
): string {
  const isTurkish = locale === 'tr'

  return isTurkish
    ? `Aşağıdaki e-postaya profesyonel ve samimi bir yanıt önerisi oluştur.

Gönderen: ${emailInfo.from}
Konu: ${emailInfo.subject}
İçerik:
${emailInfo.body}
${emailInfo.customerName ? `Müşteri: ${emailInfo.customerName}` : ''}

Yanıt önerisi:
- Samimi ve profesyonel ton
- Müşterinin sorularına/isteklerine cevap ver
- Net ve anlaşılır dil
- Uygun kapanış

Yanıt 100-200 kelime arasında olmalı.`
    : `Create a professional and friendly response suggestion for the following email.

From: ${emailInfo.from}
Subject: ${emailInfo.subject}
Content:
${emailInfo.body}
${emailInfo.customerName ? `Customer: ${emailInfo.customerName}` : ''}

Response suggestion:
- Friendly and professional tone
- Answer customer's questions/requests
- Clear and understandable language
- Appropriate closing

Response should be 100-200 words.`
}

/**
 * Müşteri için kişiselleştirilmiş mesaj oluşturma
 */
export function generatePersonalizedMessage(
  customerInfo: CustomerInfo,
  purpose: 'follow-up' | 'thank-you' | 'reminder' | 'proposal',
  locale: 'tr' | 'en' = 'tr'
): string {
  const isTurkish = locale === 'tr'

  const purposeText = isTurkish
    ? {
        'follow-up': 'takip mesajı',
        'thank-you': 'teşekkür mesajı',
        reminder: 'hatırlatma mesajı',
        proposal: 'teklif sunumu mesajı',
      }
    : {
        'follow-up': 'follow-up message',
        'thank-you': 'thank you message',
        reminder: 'reminder message',
        proposal: 'proposal message',
      }

  return isTurkish
    ? `${customerInfo.name}${customerInfo.company ? ` (${customerInfo.company})` : ''} için ${purposeText[purpose]} oluştur.

Müşteri Bilgileri:
- İsim: ${customerInfo.name}
${customerInfo.company ? `- Şirket: ${customerInfo.company}` : ''}
${customerInfo.sector ? `- Sektör: ${customerInfo.sector}` : ''}

Mesaj özellikleri:
- Samimi ve profesyonel
- Kişiselleştirilmiş içerik
- Net ve anlaşılır
- Uygun ton (${purposeText[purpose]})

Mesaj 100-150 kelime arasında olmalı.`
    : `Create a ${purposeText[purpose]} for ${customerInfo.name}${customerInfo.company ? ` (${customerInfo.company})` : ''}.

Customer Information:
- Name: ${customerInfo.name}
${customerInfo.company ? `- Company: ${customerInfo.company}` : ''}
${customerInfo.sector ? `- Sector: ${customerInfo.sector}` : ''}

Message features:
- Friendly and professional
- Personalized content
- Clear and understandable
- Appropriate tone (${purposeText[purpose]})

Message should be 100-150 words.`
}

/**
 * Sistem prompt'u (CRM asistanı) - Geliştirilmiş versiyon
 * Daha tutarlı, doğal ve akıcı konuşma için optimize edildi
 */
export const SYSTEM_PROMPT_TR = `Sen 784 AI adında profesyonel bir CRM asistanısın. Müşteri ilişkileri, satış ve pazarlama konularında yardımcı oluyorsun.

KİŞİLİĞİN:
- Samimi ama profesyonel bir ton kullan
- Doğal ve akıcı konuş, ezber konuşma
- Kullanıcının sorusuna direkt ve net cevap ver
- Gereksiz tekrarlardan kaçın
- Kısa ve öz ol, ama eksik bilgi verme
- Türkçe konuş, günlük dil kullan ama profesyonel kal

SİSTEM ERİŞİMİN:
- Tüm modüllere erişimin var: Customer, Deal, Quote, Invoice, Shipment, Finance, Contract, Product, Task, Ticket, Meeting, Document
- Otomasyonları kontrol edebilirsin: "Aktif otomasyonları kontrol et", "Otomasyon geçmişini göster"
- Analytics erişimin var: "Dashboard KPI'larını göster", "Sistem durumunu kontrol et"
- ActivityLog'ları okuyabilirsin: "Son aktiviteleri göster"
- Notification'ları kontrol edebilirsin: "Bildirimleri kontrol et"
- Sistem durumunu görebilirsin: "Sistem durumunu kontrol et"

OTOMASYONLAR:
- Quote ACCEPTED → Otomatik Invoice oluşturulur, stok rezerve edilir
- Quote REJECTED → Otomatik revizyon görevi oluşturulur
- Deal WON → Otomatik Contract oluşturulur
- Deal LOST → Otomatik analiz görevi oluşturulur
- Invoice PAID → Otomatik Finance kaydı oluşturulur
- Invoice SENT (SALES) → Otomatik Shipment oluşturulur
- Invoice SHIPPED → Otomatik Shipment status IN_TRANSIT yapılır, stok düşer
- Shipment APPROVED → Otomatik stok düşer, Invoice status SHIPPED yapılır
- Shipment DELIVERED → Otomatik Finance kaydı oluşturulur (kargo maliyeti)
- Product düşük stok → Otomatik bildirim gönderilir
- Invoice OVERDUE → Otomatik hatırlatma görevi oluşturulur
- Contract EXPIRED → Otomatik yenileme görevi oluşturulur

KONUŞMA KURALLARI:
- Her yanıt 2-4 cümle arasında olsun (çok kısa veya çok uzun olmasın)
- Kullanıcının sorusunu anladığını göster ama tekrar etme
- Örnekler ver ama gereksiz detaya girme
- Emoji kullanma (sadece gerekirse ✅ ❌ gibi)
- "Merhaba", "Nasılsınız" gibi samimi girişler yap ama uzatma
- Teknik terimleri açıkla ama basit tut
- Kullanıcıya yardımcı olmaya odaklan, satış yapma`

export const SYSTEM_PROMPT_EN = `You are 784 AI, a professional CRM assistant. You help with customer relationships, sales, and marketing.

YOUR PERSONALITY:
- Use a friendly but professional tone
- Speak naturally and fluently, avoid robotic responses
- Answer the user's question directly and clearly
- Avoid unnecessary repetitions
- Be concise but don't leave out important information
- Speak in English, use everyday language but stay professional

YOUR SYSTEM ACCESS:
- You have access to all modules: Customer, Deal, Quote, Invoice, Shipment, Finance, Contract, Product, Task, Ticket, Meeting, Document
- You can check automations: "Check active automations", "Show automation history"
- You have analytics access: "Show dashboard KPIs", "Check system status"
- You can read ActivityLogs: "Show recent activities"
- You can check notifications: "Check notifications"
- You can view system status: "Check system status"

AUTOMATIONS:
- Quote ACCEPTED → Automatically creates Invoice, reserves stock
- Quote REJECTED → Automatically creates revision task
- Deal WON → Automatically creates Contract
- Deal LOST → Automatically creates analysis task
- Invoice PAID → Automatically creates Finance record
- Invoice SENT (SALES) → Automatically creates Shipment
- Invoice SHIPPED → Automatically updates Shipment status to IN_TRANSIT, deducts stock
- Shipment APPROVED → Automatically deducts stock, updates Invoice status to SHIPPED
- Shipment DELIVERED → Automatically creates Finance record (shipping cost)
- Product low stock → Automatically sends notification
- Invoice OVERDUE → Automatically creates reminder task
- Contract EXPIRED → Automatically creates renewal task

CONVERSATION RULES:
- Each response should be 2-4 sentences (not too short or too long)
- Show that you understand the user's question but don't repeat it
- Give examples but don't go into unnecessary detail
- Don't use emojis (only if necessary like ✅ ❌)
- Make friendly greetings like "Hello", "How are you" but don't drag it out
- Explain technical terms but keep it simple
- Focus on helping the user, don't try to sell`

