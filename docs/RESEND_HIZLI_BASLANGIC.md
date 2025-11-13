# 🚀 Resend Hızlı Başlangıç Rehberi

Bu rehber, Resend email servisini 5 dakikada kurmanızı sağlar.

---

## ✅ ADIM 1: Resend Hesabı Oluştur

1. **https://resend.com** adresine gidin
2. **"Sign Up"** butonuna tıklayın
3. Email ve şifre ile kayıt olun
4. Email doğrulaması yapın (email'inize gelen linke tıklayın)

**⏱️ Süre:** 2 dakika

---

## 🔑 ADIM 2: API Key Oluştur

1. Resend Dashboard'a giriş yapın
2. Sol menüden **"API Keys"** sekmesine tıklayın
3. **"Create API Key"** butonuna tıklayın
4. Form'u doldurun:
   - **Name:** `CRM Production` (veya istediğiniz isim)
   - **Permission:** `Full Access` seçin
5. **"Create"** butonuna tıklayın
6. **⚠️ ÖNEMLİ:** API Key'i hemen kopyalayın (sadece bir kez gösterilir!)
   - Format: `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**⏱️ Süre:** 1 dakika

---

## ⚙️ ADIM 3: Environment Variable Ekle

1. Proje kök dizininde `.env.local` dosyasını açın (yoksa oluşturun)
2. Şu satırları ekleyin:

```env
# Resend API Key (ADIM 2'de kopyaladığınız key'i buraya yapıştırın)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Email gönderen adres (Resend'in test domain'i - domain doğrulamadan çalışır)
EMAIL_FROM=onboarding@resend.dev

# Uygulama URL'i (email linkleri için)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Örnek:**
```env
RESEND_API_KEY=re_abc123xyz789def456ghi012jkl345mno678pqr901stu234vwx567
EMAIL_FROM=onboarding@resend.dev
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**⏱️ Süre:** 1 dakika

---

## 🔄 ADIM 4: Dev Server'ı Yeniden Başlat

1. Terminal'de çalışan dev server'ı durdurun (`Ctrl+C`)
2. Tekrar başlatın:

```bash
npm run dev
```

**Neden?** Environment variable'lar sadece server başlatılırken yüklenir.

**⏱️ Süre:** 30 saniye

---

## 🧪 ADIM 5: Test Et

### Yöntem 1: Browser Console (EN KOLAY)

1. Tarayıcıda CRM'e giriş yapın (Admin veya SuperAdmin olmalısınız)
2. **F12** tuşuna basın → **Console** sekmesine gidin
3. Şu kodu yapıştırın ve **Enter**'a basın:

```javascript
fetch('/api/test-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: 'your-email@example.com', // ⚠️ KENDİ EMAIL ADRESİNİZİ YAZIN
    subject: 'Test Email - CRM',
    html: '<h1>Merhaba!</h1><p>Bu bir test emailidir.</p><p>Email servisi çalışıyor! ✅</p>'
  })
})
.then(res => res.json())
.then(data => {
  console.log('✅ Sonuç:', data)
  if (data.success) {
    alert('✅ Email gönderildi! Servis: ' + (data.service || 'mock'))
  } else {
    alert('❌ Hata: ' + data.error)
  }
})
.catch(err => {
  console.error('❌ Hata:', err)
  alert('❌ Hata: ' + err.message)
})
```

4. **Beklenen:**
   - Console'da: `✅ Sonuç: { success: true, messageId: "...", service: "resend" }`
   - Alert: `✅ Email gönderildi! Servis: resend`
   - Email adresinize email gelmeli (1-2 dakika içinde)
   - **Spam klasörünü de kontrol edin!**

**⏱️ Süre:** 2 dakika

---

## ✅ BAŞARILI KURULUM KONTROLÜ

Test sonrası şunları kontrol edin:

- [ ] Console'da `service: "resend"` görünüyor mu?
- [ ] Email adresinize email geldi mi?
- [ ] Email içeriği doğru görünüyor mu?
- [ ] Spam klasöründe değil mi?

**Hepsi ✅ ise:** Kurulum başarılı! 🎉

---

## 🐛 SORUN GİDERME

### Sorun 1: "Email servisi yapılandırılmamış" Uyarısı

**Hata:**
```json
{
  "success": true,
  "warning": "Email servisi yapılandırılmamış. Gerçek email gönderilmedi."
}
```

**Çözüm:**
1. `.env.local` dosyasında `RESEND_API_KEY` olduğundan emin olun
2. Dev server'ı durdurup yeniden başlatın (`npm run dev`)
3. API Key'in başında `re_` olduğundan emin olun

---

### Sorun 2: "Invalid API Key" Hatası

**Hata:**
```json
{
  "error": "Email gönderilemedi: Invalid API Key"
}
```

**Çözüm:**
1. Resend Dashboard → API Keys'den yeni bir key oluşturun
2. `.env.local` dosyasındaki key'i güncelleyin
3. Dev server'ı yeniden başlatın

---

### Sorun 3: Email Gelmiyor

**Kontrol Listesi:**
- [ ] Spam klasörünü kontrol edin
- [ ] Email adresini doğru yazdığınızdan emin olun
- [ ] Resend Dashboard → Emails'den gönderim loglarını kontrol edin
- [ ] Console'da hata var mı kontrol edin (F12)

---

### Sorun 4: "Unauthorized" Hatası

**Hata:**
```json
{
  "error": "Unauthorized"
}
```

**Çözüm:**
- Admin veya SuperAdmin rolüyle giriş yapın
- Test endpoint'i sadece Admin/SuperAdmin kullanabilir

---

## 📊 Resend Dashboard'da Kontrol

1. **Resend Dashboard** → **Emails** sekmesine gidin
2. Gönderilen email'leri görebilirsiniz:
   - ✅ **Delivered:** Email başarıyla gönderildi
   - ❌ **Bounced:** Email gönderilemedi
   - 📊 **Opens:** Email açılma sayısı
   - 🔗 **Clicks:** Link tıklama sayısı

---

## 🎯 SONRAKI ADIMLAR

Kurulum başarılı olduktan sonra:

1. **Approval Email'lerini Test Et:**
   - Bir onay talebi oluşturun
   - Onaylayıcı olarak kendi email adresinizi seçin
   - Email gelmeli

2. **Email Campaign'i Test Et:**
   - Yeni bir email kampanyası oluşturun
   - Kendi email adresinizi müşteri olarak ekleyin
   - Kampanyayı gönderin
   - Email gelmeli

---

## 📝 ÖZET

✅ **Kurulum Süresi:** ~5 dakika
✅ **Gereksinimler:** Resend hesabı, API Key
✅ **Test Süresi:** ~2 dakika
✅ **Ücretsiz Limit:** 100 email/gün

---

**Sorun mu var?** `docs/EMAIL_TEST_REHBERI.md` dosyasına bakın veya Resend Dashboard'daki logları kontrol edin.

**Başarılar! 🚀**

