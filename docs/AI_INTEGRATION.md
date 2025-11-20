# 🤖 Groq AI Entegrasyonu

## 📋 Özet

CRM sistemine **ücretsiz** Groq AI entegrasyonu eklendi. AI ile teklif metinleri, e-posta yanıtları ve not özetleri oluşturabilirsiniz.

---

## 🔑 Kurulum

### 1. Environment Variable Ekleme

Proje kök dizininde `.env.local` dosyası oluşturun (yoksa) ve şu satırı ekleyin:

```bash
GROQ_API_KEY=your_groq_api_key_here
```

**ÖNEMLİ:** `.env.local` dosyası git'e commit edilmez (`.gitignore`'da). Production'da (Vercel) environment variable olarak eklemeniz gerekir.

### 2. Vercel'de Environment Variable Ekleme

1. Vercel Dashboard → Projeniz → **Settings** → **Environment Variables**
2. Yeni variable ekleyin:
   - **Name:** `GROQ_API_KEY`
   - **Value:** `your_groq_api_key_here` (Groq Console'dan alın: https://console.groq.com)
   - **Environment:** Production, Preview, Development (hepsini seçin)
3. **Save** butonuna tıklayın
4. **Redeploy** yapın (Deployments → ... → Redeploy)

---

## 🚀 Kullanım

### 1. Teklif Metni Oluşturma (Quote Form)

**Nerede:** Quote form'unda Description alanının yanında **"AI ile Oluştur"** butonu

**Nasıl Kullanılır:**
1. Quote formunu açın
2. Bir **Fırsat (Deal)** seçin
3. Description alanının yanındaki **"AI ile Oluştur"** butonuna tıklayın
4. AI otomatik olarak profesyonel bir teklif metni oluşturur
5. Metin Description alanına otomatik doldurulur

**Özellikler:**
- Müşteri bilgilerini kullanır
- Fırsat başlığını ve tutarını içerir
- Profesyonel ve samimi ton
- Türkçe/İngilizce destek

---

### 2. AI Chat Widget

**Component:** `AIChat`

**Kullanım:**
```typescript
import AIChat from '@/components/ai/AIChat'

function MyComponent() {
  const [chatOpen, setChatOpen] = useState(false)
  
  return (
    <>
      <Button onClick={() => setChatOpen(true)}>AI Asistan</Button>
      <AIChat open={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  )
}
```

**Özellikler:**
- Konuşma geçmişi
- Çoklu mesaj desteği
- Türkçe/İngilizce destek
- Edge Runtime uyumlu

---

### 3. API Endpoints

#### `/api/ai/chat` - Genel AI Chat

```typescript
POST /api/ai/chat
Body: {
  prompt: string,
  messages?: Array<{ role: 'user' | 'assistant', content: string }>,
  locale?: 'tr' | 'en'
}

Response: {
  response: string
}
```

#### `/api/ai/generate-quote` - Teklif Metni

```typescript
POST /api/ai/generate-quote
Body: {
  quoteInfo: {
    customerName: string,
    products: Array<{ name: string, quantity: number, price: number }>,
    totalAmount: number,
    currency?: string,
    validUntil?: string
  },
  locale?: 'tr' | 'en'
}

Response: {
  quoteText: string
}
```

#### `/api/ai/summarize-notes` - Not Özetleme

```typescript
POST /api/ai/summarize-notes
Body: {
  notes: string[],
  locale?: 'tr' | 'en'
}

Response: {
  summary: string
}
```

#### `/api/ai/email-response` - Email Yanıt Önerisi

```typescript
POST /api/ai/email-response
Body: {
  emailInfo: {
    from: string,
    subject: string,
    body: string,
    customerName?: string
  },
  locale?: 'tr' | 'en'
}

Response: {
  emailResponse: string
}
```

---

## 📦 Dosya Yapısı

```
src/
├── lib/
│   └── ai/
│       ├── groq.ts          # Groq API wrapper
│       └── prompts.ts       # Prompt şablonları
├── app/
│   └── api/
│       └── ai/
│           ├── chat/
│           │   └── route.ts
│           ├── generate-quote/
│           │   └── route.ts
│           ├── summarize-notes/
│           │   └── route.ts
│           └── email-response/
│               └── route.ts
└── components/
    └── ai/
        ├── AIChat.tsx
        └── AIGenerateButton.tsx
```

---

## ⚙️ Teknik Detaylar

### Groq API Özellikleri

- **Model:** `llama-3.1-8b-instant` (ücretsiz, hızlı)
- **Ücretsiz Tier:** 14,400 request/gün
- **Edge Runtime:** ✅ Uyumlu
- **Hız:** < 1 saniye yanıt süresi

### Performans

- **Cache:** SWR ile cache desteği (gelecekte eklenebilir)
- **Error Handling:** Kapsamlı hata yönetimi
- **Type Safety:** TypeScript ile tam tip güvenliği

---

## 🔒 Güvenlik

- ✅ **Session kontrolü:** Tüm endpoint'lerde auth kontrolü
- ✅ **RLS uyumlu:** Company isolation korunuyor
- ✅ **API Key:** Environment variable'da saklanıyor
- ✅ **Edge Runtime:** Güvenli, izole çalışma ortamı

---

## 🎯 Gelecek Özellikler

- [ ] Customer detay sayfasına not özetleme
- [ ] Email template'lere AI yanıt önerileri
- [ ] Lead scoring AI ile
- [ ] Otomatik müşteri segmentasyonu
- [ ] Chatbot entegrasyonu

---

## 📝 Notlar

- Groq API key'inizi **asla** public repository'ye commit etmeyin
- Production'da mutlaka Vercel environment variable olarak ekleyin
- Ücretsiz tier limiti: 14,400 request/gün (yeterli)
- Model: `llama-3.1-8b-instant` (hızlı ve ücretsiz)

---

## 🐛 Sorun Giderme

### "GROQ_API_KEY environment variable is not set" Hatası

**Çözüm:**
1. `.env.local` dosyasını kontrol edin
2. Vercel'de environment variable eklediyseniz **Redeploy** yapın
3. Development'ta `.env.local` dosyasının proje kök dizininde olduğundan emin olun

### AI Yanıt Almıyorum

**Kontrol Listesi:**
1. API key doğru mu?
2. Internet bağlantısı var mı?
3. Groq API limiti aşıldı mı? (14,400/gün)
4. Browser console'da hata var mı?

---

## 📚 Kaynaklar

- [Groq API Dokümantasyonu](https://console.groq.com/docs)
- [Llama 3.1 Model](https://llama.meta.com/llama3-1/)
- [Next.js Edge Runtime](https://nextjs.org/docs/app/api-reference/edge)

---

**Son Güncelleme:** 2024  
**Versiyon:** 1.0.0

