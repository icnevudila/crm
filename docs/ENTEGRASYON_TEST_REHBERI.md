# 🧪 Entegrasyon Test Rehberi

Bu rehber, CRM sistemindeki tüm entegrasyonların nasıl test edileceğini adım adım açıklar.

---

## 📍 Test Sayfası

**Kullanıcı Entegrasyonları Sayfası:** `/tr/user-integrations`

Bu sayfadan tüm entegrasyonları yapılandırabilir ve test edebilirsiniz.

---

## 🔐 OAuth Entegrasyonları Testi

### 1. Google Calendar Entegrasyonu

#### Adım 1: Client ID ve Secret Ayarlama
1. `/tr/user-integrations` sayfasına gidin
2. **OAuth Entegrasyonları** bölümünde **Google Calendar** kartını bulun
3. **Google Client ID** alanına Google Cloud Console'dan aldığınız Client ID'yi girin
   - Örnek: `123456789-abcdefghijklmnop.apps.googleusercontent.com`
4. **Google Client Secret** alanına Client Secret'ı girin
   - Örnek: `GOCSPX-xxxxxxxxxxxxx`
5. **"Bilgileri Kaydet"** butonuna tıklayın
   - ✅ Başarılı mesajı görmelisiniz: "Google Calendar bilgileri kaydedildi!"

#### Adım 2: OAuth Bağlantısı
1. **"Google Calendar Bağla"** butonuna tıklayın
2. Google OAuth sayfasına yönlendirileceksiniz
3. Google hesabınızı seçin ve izinleri verin
4. Başarılı olursa CRM'e geri döneceksiniz

#### Adım 3: Test Etme
1. **"API'yi Test Et"** butonuna tıklayın
2. Sistem Google Calendar'ınıza test etkinlik ekleyecek
3. ✅ Başarılı mesajı görmelisiniz:
   ```
   ✅ Test Başarılı!
   
   ✅ Google Calendar entegrasyonu çalışıyor!
   
   Test etkinlik Google Calendar'ınıza başarıyla eklendi.
   
   Etkinlik: Test Etkinlik - CRM Entegrasyonu
   Tarih: [Yarın saat 14:00]
   ```
4. Google Calendar'ınızı açın ve test etkinliğin eklendiğini kontrol edin

---

### 2. Microsoft Teams & Outlook Entegrasyonu

#### Adım 1: Client ID ve Secret Ayarlama
1. **Microsoft Teams & Outlook** kartını bulun
2. **Microsoft Client ID** alanına Azure Portal'dan aldığınız Client ID'yi girin
   - Örnek: `12345678-1234-1234-1234-123456789abc`
3. **Microsoft Client Secret** alanına Client Secret'ı girin
4. **"Bilgileri Kaydet"** butonuna tıklayın

#### Adım 2: OAuth Bağlantısı
1. **"Outlook Calendar Bağla"** veya **"Outlook Email Bağla"** butonuna tıklayın
2. Microsoft OAuth sayfasına yönlendirileceksiniz
3. Microsoft hesabınızı seçin ve izinleri verin

---

## 📧 API Key Entegrasyonları Testi

### 1. SMS (Twilio) Testi

#### Önkoşul
- Twilio hesabınız olmalı
- Account SID, Auth Token ve Telefon Numarası hazır olmalı

#### Adım 1: Bilgileri Girme
1. **API Key Entegrasyonları** bölümünde **SMS (Twilio)** kartını bulun
2. Kartın üstündeki **Switch**'i açın (Aktif hale getirin)
3. Şu bilgileri girin:
   - **Account SID**: Twilio Dashboard'dan alın
   - **Auth Token**: Twilio Dashboard'dan alın (gizli alan)
   - **Telefon Numarası**: E.164 formatında (örn: `+905551234567`)
4. **"Kaydet"** butonuna tıklayın
   - ✅ Durum badge'i **"Aktif"** olmalı

#### Adım 2: Test Etme
1. **"Test SMS Gönder"** butonuna tıklayın
2. Sistem kendi telefon numaranıza test SMS gönderecek
   - ⚠️ **Not:** Profil sayfanızda telefon numaranız kayıtlı olmalı
3. ✅ Başarılı mesajı görmelisiniz:
   ```
   ✅ Test Başarılı!
   
   ✅ SMS entegrasyonu çalışıyor!
   
   Test SMS +905551234567 numarasına başarıyla gönderildi.
   
   Message ID: SMxxxxxxxxxxxxx
   ```
4. Telefonunuzu kontrol edin, SMS'i almalısınız

#### Hata Durumları
- ❌ **"Telefon numaranız kayıtlı değil"**: Profil sayfanızdan telefon numaranızı ekleyin
- ❌ **"SMS entegrasyonu yapılandırılmamış"**: Bilgileri doğru girdiğinizden emin olun
- ❌ **"Invalid credentials"**: Twilio Account SID veya Auth Token yanlış

---

### 2. WhatsApp (Twilio) Testi

#### Adım 1: Bilgileri Girme
1. **WhatsApp (Twilio)** kartını bulun
2. Switch'i açın
3. Şu bilgileri girin:
   - **Account SID**: SMS ile aynı olabilir
   - **Auth Token**: SMS ile aynı olabilir
   - **WhatsApp Numarası**: `whatsapp:+905551234567` formatında
4. **"Kaydet"** butonuna tıklayın

#### Adım 2: Test Etme
1. **"Test WhatsApp Gönder"** butonuna tıklayın
2. ✅ Başarılı mesajı görmelisiniz
3. WhatsApp'ınızı kontrol edin

---

### 3. Email (Resend) Testi

#### Adım 1: API Key Alma
1. [Resend.com](https://resend.com) sitesine gidin
2. Ücretsiz hesap oluşturun (kredi kartı gerekmez)
3. Dashboard'dan **API Keys** bölümüne gidin
4. Yeni API Key oluşturun
5. API Key'i kopyalayın (örn: `re_xxxxxxxxxxxxx`)

#### Adım 2: Bilgileri Girme
1. **Email (Resend)** kartını bulun
2. Switch'i açın
3. **Resend API Key** alanına API Key'inizi girin
4. **"Kaydet"** butonuna tıklayın

#### Adım 3: Test Etme
1. **"Test Email Gönder"** butonuna tıklayın
2. Sistem kendi email adresinize test email gönderecek
3. ✅ Başarılı mesajı görmelisiniz:
   ```
   ✅ Test Başarılı!
   
   ✅ Email entegrasyonu çalışıyor!
   
   Test email your@email.com adresine başarıyla gönderildi.
   
   Message ID: re_xxxxxxxxxxxxx
   
   Lütfen gelen kutunuzu kontrol edin.
   ```
4. Email'inizi kontrol edin (Spam klasörüne de bakın)

---

## 🎯 Test Senaryoları

### Senaryo 1: Tüm Entegrasyonları Test Etme

1. **OAuth Entegrasyonları:**
   - ✅ Google Calendar Client ID/Secret kaydet
   - ✅ Google Calendar OAuth bağla
   - ✅ Test etkinlik ekle
   - ✅ Microsoft Client ID/Secret kaydet
   - ✅ Outlook OAuth bağla

2. **API Key Entegrasyonları:**
   - ✅ SMS bilgilerini gir ve test et
   - ✅ WhatsApp bilgilerini gir ve test et
   - ✅ Email API Key'i gir ve test et

### Senaryo 2: Hata Durumlarını Test Etme

1. **Yanlış Client ID:**
   - Google Client ID'yi yanlış girin
   - OAuth bağlantısını deneyin
   - ❌ Hata mesajı görmelisiniz

2. **Yanlış API Key:**
   - Resend API Key'ini yanlış girin
   - Test email göndermeyi deneyin
   - ❌ Hata mesajı görmelisiniz

3. **Eksik Bilgiler:**
   - Client ID olmadan OAuth bağlantısını deneyin
   - ❌ "Client ID yapılandırılmamış" mesajı görmelisiniz

---

## ✅ Test Checklist

### OAuth Entegrasyonları
- [ ] Google Calendar Client ID/Secret kaydedildi
- [ ] Google Calendar OAuth bağlantısı yapıldı
- [ ] Google Calendar test etkinliği eklendi
- [ ] Microsoft Client ID/Secret kaydedildi
- [ ] Outlook OAuth bağlantısı yapıldı

### API Key Entegrasyonları
- [ ] SMS bilgileri girildi ve kaydedildi
- [ ] SMS test mesajı gönderildi ve alındı
- [ ] WhatsApp bilgileri girildi ve kaydedildi
- [ ] WhatsApp test mesajı gönderildi ve alındı
- [ ] Email API Key girildi ve kaydedildi
- [ ] Email test mesajı gönderildi ve alındı

---

## 🐛 Sorun Giderme

### Problem: "Client ID yapılandırılmamış" Hatası

**Çözüm:**
1. User Integrations sayfasında Client ID'yi girin
2. "Bilgileri Kaydet" butonuna tıklayın
3. Sayfayı yenileyin
4. Tekrar test edin

### Problem: OAuth Bağlantısı Çalışmıyor

**Kontrol Listesi:**
- ✅ Client ID doğru mu?
- ✅ Client Secret doğru mu?
- ✅ Redirect URI doğru mu? (Google Cloud Console'da ayarlanmalı)
- ✅ OAuth consent screen yapılandırıldı mı?

### Problem: Test SMS/WhatsApp Gelmiyor

**Kontrol Listesi:**
- ✅ Telefon numaranız profil sayfanızda kayıtlı mı?
- ✅ Telefon numarası E.164 formatında mı? (`+90` ile başlamalı)
- ✅ Twilio hesabınız aktif mi?
- ✅ Twilio'da yeterli kredi var mı?

### Problem: Test Email Gelmiyor

**Kontrol Listesi:**
- ✅ Resend API Key doğru mu?
- ✅ Resend hesabınız aktif mi?
- ✅ Email adresiniz doğru mu?
- ✅ Spam klasörünü kontrol ettiniz mi?

---

## 📞 Destek

Sorun yaşarsanız:
1. Browser console'u açın (F12)
2. Hata mesajlarını kontrol edin
3. Network sekmesinde API isteklerini kontrol edin
4. Hata mesajını not edin ve destek ekibine bildirin

---

## 🎉 Başarılı Test Sonrası

Tüm entegrasyonlar başarıyla test edildikten sonra:
- ✅ Müşteri detay sayfalarından SMS/WhatsApp gönderebilirsiniz
- ✅ Email gönderebilirsiniz
- ✅ Toplantıları Google Calendar'a ekleyebilirsiniz
- ✅ Video toplantı linkleri oluşturabilirsiniz

**Not:** Test butonları sadece entegrasyonların çalışıp çalışmadığını kontrol eder. Gerçek kullanım için müşteri, deal, quote veya invoice sayfalarındaki butonları kullanın.

