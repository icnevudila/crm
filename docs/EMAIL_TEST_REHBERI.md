# 🧪 Email Servisi Test Rehberi

Bu rehber, kurduğunuz email servisini test etmek için adım adım talimatlar içerir.

---

## 📋 HAZIRLIK

### 1. Paket Kurulumu

**Resend için:**
```bash
npm install resend
```

**SendGrid için:**
```bash
npm install @sendgrid/mail
```

**Brevo için:**
```bash
npm install @getbrevo/brevo
```

### 2. Environment Variables

`.env.local` dosyanıza ekleyin:

```env
# Resend için (ÖNERİLEN)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=onboarding@resend.dev

# VEYA SendGrid için
# SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# EMAIL_FROM=noreply@yourdomain.com

# VEYA Brevo için
# BREVO_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# EMAIL_FROM=noreply@yourdomain.com

# Uygulama URL'i
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Dev Server'ı Yeniden Başlatın

```bash
# Ctrl+C ile durdurun
# Sonra tekrar başlatın
npm run dev
```

---

## 🧪 TEST YÖNTEMLERİ

### Yöntem 1: Browser Console'dan Test (EN KOLAY)

1. Tarayıcıda CRM'e giriş yapın (Admin veya SuperAdmin olmalısınız)
2. **F12** tuşuna basın → **Console** sekmesine gidin
3. Şu kodu yapıştırın ve **Enter**'a basın:

```javascript
fetch('/api/test-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: 'your-email@example.com', // KENDİ EMAIL ADRESİNİZİ YAZIN
    subject: 'Test Email - CRM',
    html: '<h1>Merhaba!</h1><p>Bu bir test emailidir.</p><p>Email servisi çalışıyor! ✅</p>'
  })
})
.then(res => res.json())
.then(data => {
  console.log('✅ Sonuç:', data)
  if (data.success) {
    alert('Email gönderildi! ' + (data.service || 'mock') + ' servisi kullanıldı.')
  } else {
    alert('Hata: ' + data.error)
  }
})
.catch(err => {
  console.error('❌ Hata:', err)
  alert('Hata: ' + err.message)
})
```

4. **Beklenen:** 
   - Console'da `✅ Sonuç: { success: true, messageId: "...", service: "resend" }` görünmeli
   - Email adresinize email gelmeli (1-2 dakika içinde)
   - Spam klasörünü de kontrol edin!

---

### Yöntem 2: Postman/Thunder Client ile Test

1. **POST** request oluşturun
2. **URL:** `http://localhost:3000/api/test-email`
3. **Headers:**
   ```
   Content-Type: application/json
   ```
4. **Body (JSON):**
   ```json
   {
     "to": "your-email@example.com",
     "subject": "Test Email - CRM",
     "html": "<h1>Test</h1><p>Email servisi testi</p>"
   }
   ```
5. **Send** butonuna tıklayın
6. **Beklenen:** `200 OK` + `{ success: true, messageId: "..." }`

---

### Yöntem 3: Approval Email Testi

1. CRM'de bir **onay talebi** oluşturun
2. Onaylayıcı olarak **kendi email adresinizi** seçin
3. Onay talebi oluşturulduğunda:
   - **Beklenen:** Email adresinize "Yeni Onay Talebi" email'i gelmeli
   - Email içeriği: Onay talebi detayları ve link

**Test Adımları:**
1. `/tr/approvals` sayfasına gidin
2. **"Yeni Onay Talebi"** butonuna tıklayın
3. Form'u doldurun:
   - **Başlık:** "Test Onay Talebi"
   - **İlgili Modül:** Quote
   - **Kayıt ID:** Herhangi bir Quote ID
   - **Onaylayıcılar:** Kendi kullanıcınızı seçin (email adresiniz olmalı)
4. **"Onay Talebi Oluştur"** butonuna tıklayın
5. **Beklenen:** Email gelmeli

---

### Yöntem 4: Email Campaign Testi

1. CRM'de bir **email kampanyası** oluşturun
2. Kendi email adresinizi müşteri olarak ekleyin
3. Kampanyayı gönderin

**Test Adımları:**
1. `/tr/customers` sayfasına gidin
2. Kendi email adresinizle bir müşteri oluşturun (eğer yoksa)
3. `/tr/email-campaigns` sayfasına gidin
4. **"Yeni Kampanya"** butonuna tıklayın
5. Form'u doldurun:
   - **Kampanya Adı:** "Test Kampanyası"
   - **Email Konusu:** "Test Email"
   - **Email İçeriği:** `<h1>Test</h1><p>Bu bir test kampanyasıdır.</p>`
   - **Hedef Kitle:** "Tüm Müşteriler" (veya kendi müşterinizi içeren segment)
6. **"Oluştur"** butonuna tıklayın
7. Kampanya detay sayfasında **"Gönder"** butonuna tıklayın
8. **Beklenen:** Email gelmeli

---

## ✅ BAŞARILI TEST KRİTERLERİ

### Test 1: Basit Email Gönderimi ✅
- [ ] `/api/test-email` endpoint'i çalışıyor
- [ ] Email gönderildi mesajı görünüyor
- [ ] Email adresine email geldi
- [ ] Email içeriği doğru görünüyor

### Test 2: Approval Email ✅
- [ ] Onay talebi oluşturulduğunda email geldi
- [ ] Email'de onay talebi linki var
- [ ] Email HTML formatında görünüyor

### Test 3: Email Campaign ✅
- [ ] Kampanya gönderildiğinde email geldi
- [ ] Email'de kampanya içeriği doğru görünüyor
- [ ] EmailLog tablosunda kayıt oluştu

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
1. `.env.local` dosyasında `RESEND_API_KEY` (veya diğer servis key'i) olduğundan emin olun
2. Dev server'ı durdurup yeniden başlatın (`npm run dev`)
3. API Key'in doğru olduğundan emin olun (başında `re_` olmalı Resend için)

---

### Sorun 2: "Invalid API Key" Hatası

**Hata:**
```json
{
  "error": "Email gönderilemedi: Invalid API Key"
}
```

**Çözüm:**
1. Email servisi dashboard'unda API Key'i kontrol edin
2. `.env.local` dosyasındaki key'i kontrol edin (kopyala-yapıştır hatası olabilir)
3. Dev server'ı yeniden başlatın

---

### Sorun 3: Email Gelmiyor

**Kontrol Listesi:**
- [ ] Spam klasörünü kontrol edin
- [ ] Email servisi dashboard'unda gönderim loglarını kontrol edin
- [ ] Console'da hata var mı kontrol edin (F12)
- [ ] Email adresini doğru yazdığınızdan emin olun
- [ ] Rate limit aşılmadı mı kontrol edin (ücretsiz plan limiti)

---

### Sorun 4: "Domain not verified" Hatası

**Hata:**
```
Resend: Domain not verified
```

**Çözüm:**
1. **Resend için:** `EMAIL_FROM=onboarding@resend.dev` kullanın (domain doğrulamadan çalışır)
2. Veya kendi domain'inizi Resend'de doğrulayın:
   - Resend Dashboard → Domains → Add Domain
   - DNS kayıtlarını ekleyin
   - Doğrulama tamamlanana kadar bekleyin

---

### Sorun 5: "Rate limit exceeded" Hatası

**Hata:**
```
Rate limit exceeded. Please try again later.
```

**Çözüm:**
- Ücretsiz plan limitini aştınız
- Resend: 100 email/gün
- SendGrid: 100 email/gün
- Brevo: 300 email/gün
- Ertesi gün bekleyin veya ücretli plana geçin

---

## 📊 EMAIL SERVİSİ DURUM KONTROLÜ

### Console'dan Kontrol

```javascript
// Email servisi durumunu kontrol et
fetch('/api/test-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: 'test@example.com',
    subject: 'Status Check',
    html: '<p>Test</p>'
  })
})
.then(res => res.json())
.then(data => {
  console.log('Email Servisi:', data.service || 'Yapılandırılmamış')
  console.log('Durum:', data.success ? '✅ Çalışıyor' : '❌ Hata')
  if (data.warning) {
    console.warn('⚠️ Uyarı:', data.warning)
  }
})
```

---

## 🎯 HIZLI TEST KOMUTU

Terminal'den test etmek için:

```bash
# Windows PowerShell
curl -X POST http://localhost:3000/api/test-email `
  -H "Content-Type: application/json" `
  -d '{\"to\":\"your-email@example.com\",\"subject\":\"Test\",\"html\":\"<p>Test</p>\"}'

# Linux/Mac
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to":"your-email@example.com","subject":"Test","html":"<p>Test</p>"}'
```

---

## 📝 TEST SONUÇLARI

Test tarihi: _______________
Test eden: _______________
Email servisi: _______________ (Resend/SendGrid/Brevo)

### Test 1: Basit Email
- [ ] Başarılı
- [ ] Başarısız (Notlar: _______________)

### Test 2: Approval Email
- [ ] Başarılı
- [ ] Başarısız (Notlar: _______________)

### Test 3: Email Campaign
- [ ] Başarılı
- [ ] Başarısız (Notlar: _______________)

---

**Not:** Email servisi kurulumu için `docs/EMAIL_SERVISI_KURULUM_REHBERI.md` dosyasına bakın.

