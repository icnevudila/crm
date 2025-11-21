# 🔑 Groq API Key Kurulum Rehberi

## 📋 Özet

Groq API key'i AI bot (784 AI) ve diğer AI özelliklerini kullanmak için gereklidir.

---

## 🚀 Hızlı Kurulum

### 1. Groq API Key Alın

1. **Groq Console'a gidin:** https://console.groq.com
2. **Sign Up / Login** yapın (ücretsiz)
3. **API Keys** sekmesine gidin
4. **Create API Key** butonuna tıklayın
5. Key'i kopyalayın (sadece bir kez gösterilir!)

---

## 💻 Local Development (.env.local)

Proje kök dizininde `.env.local` dosyası oluşturun (yoksa) ve ekleyin:

```bash
GROQ_API_KEY=gsk_your_api_key_here
```

**ÖNEMLİ:** `.env.local` dosyası git'e commit edilmez (güvenlik için).

---

## 🌐 Vercel Production

### Adım 1: Vercel Dashboard'a Gidin

1. https://vercel.com → Projeniz → **Settings** → **Environment Variables**

### Adım 2: Environment Variable Ekleyin

- **Name:** `GROQ_API_KEY`
- **Value:** Groq Console'dan aldığınız API key (örn: `gsk_...`)
- **Environment:** 
  - ✅ Production
  - ✅ Preview
  - ✅ Development

### Adım 3: Kaydedin ve Redeploy

1. **Save** butonuna tıklayın
2. **Deployments** sekmesine gidin
3. En son deployment'ın yanındaki **...** (üç nokta) menüsüne tıklayın
4. **Redeploy** seçeneğini seçin
5. **Use existing Build Cache** seçeneğini **KAPATIN**
6. **Redeploy** butonuna tıklayın

---

## ✅ Kontrol

Deploy tamamlandıktan sonra:

1. AI bot'u açın (sağ alt köşedeki "784 AI" butonu)
2. Bir mesaj gönderin
3. Eğer çalışıyorsa ✅ başarılı!

---

## 🐛 Sorun Giderme

### "GROQ_API_KEY environment variable is not set" Hatası

**Çözüm:**
1. Vercel Dashboard'da environment variable'ı kontrol edin
2. **Redeploy** yapın (cache'i kapatarak)
3. Browser console'da hata var mı kontrol edin

### AI Bot Çalışmıyor

**Kontrol Listesi:**
1. ✅ API key doğru mu? (gsk_ ile başlamalı)
2. ✅ Vercel'de environment variable eklendi mi?
3. ✅ Redeploy yapıldı mı?
4. ✅ Groq API limiti aşıldı mı? (14,400/gün ücretsiz)
5. ✅ Browser console'da hata var mı?

---

## 📊 Groq API Limitleri

- **Ücretsiz Tier:** 14,400 request/gün
- **Model:** llama-3.1-8b-instant (hızlı ve ücretsiz)
- **Hız:** < 1 saniye yanıt süresi

---

## 🔒 Güvenlik

- ✅ API key'i **asla** public repository'ye commit etmeyin
- ✅ Production'da mutlaka Vercel environment variable olarak kullanın
- ✅ `.env.local` dosyası `.gitignore`'da (otomatik)

---

## 📚 Kaynaklar

- [Groq Console](https://console.groq.com)
- [Groq API Dokümantasyonu](https://console.groq.com/docs)
- [AI Integration Docs](./docs/AI_INTEGRATION.md)

---

**Son Güncelleme:** 2024  
**Versiyon:** 1.0.0


