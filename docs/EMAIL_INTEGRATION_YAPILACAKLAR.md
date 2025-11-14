# 📧 E-posta Entegrasyonu - Yapılacaklar Listesi

**Tarih:** 2024  
**Durum:** ✅ Kodlar Hazır - Yapılandırma Bekliyor

---

## ✅ TAMAMLANAN İŞLER

### 1. Database Migration ✅
- [x] `105_add_email_integrations.sql` oluşturuldu
- [x] CompanyIntegration tablosuna e-posta kolonları eklendi

### 2. Email Helper Fonksiyonları ✅
- [x] `gmail-smtp.ts` - Gmail SMTP helper
- [x] `gmail-oauth.ts` - Gmail OAuth helper
- [x] `outlook-oauth.ts` - Outlook OAuth helper
- [x] `index.ts` - Ana email gönderim fonksiyonu

### 3. API Endpoints ✅
- [x] `/api/integrations/email/send` - E-posta gönderim
- [x] `/api/integrations/email/send-smtp` - SMTP e-posta gönderim
- [x] `/api/integrations/email/check` - E-posta entegrasyonu kontrolü
- [x] `/api/integrations/oauth/gmail/authorize` - Gmail OAuth başlat
- [x] `/api/integrations/oauth/gmail/callback` - Gmail OAuth callback
- [x] `/api/integrations/oauth/outlook/authorize` - Outlook OAuth başlat
- [x] `/api/integrations/oauth/outlook/callback` - Outlook OAuth callback

### 4. Settings UI ✅
- [x] E-posta Entegrasyonları sekmesi eklendi
- [x] Gmail OAuth bağlantı butonu
- [x] Outlook OAuth bağlantı butonu
- [x] SMTP ayarları

### 5. SendEmailButton Component ✅
- [x] Ortak e-posta gönderme butonu oluşturuldu
- [x] E-posta entegrasyonu kontrolü
- [x] Toast mesajları (başarılı, hata, entegrasyon yok)

### 6. Detay Sayfalarına Eklendi ✅
- [x] Deal detail - Mail Gönder butonu
- [x] Quote detail - Mail Gönder butonu
- [x] Invoice detail - Mail Gönder butonu
- [x] Customer detail - Mail Gönder butonu

---

## 📋 YAPILACAKLAR (SIRAYLA)

### Adım 1: Migration Çalıştır (ZORUNLU) 🔴

**Ne Yapmalı:**
1. Supabase Dashboard'a git: https://supabase.com/dashboard
2. SQL Editor'ü aç
3. `supabase/migrations/105_add_email_integrations.sql` dosyasını aç
4. **TÜM İÇERİĞİ** kopyala (baştan sona - 205 satır)
5. SQL Editor'e yapıştır ve çalıştır

**NOT:** Bu migration:
- `CompanyIntegration` tablosu yoksa oluşturur (104'ten bağımsız çalışır)
- E-posta kolonlarını ekler
- RLS policy'leri ve trigger'ları ekler

**Kontrol:**
- Hata var mı kontrol et
- CompanyIntegration tablosunda e-posta kolonları eklendi mi?
- "Success" mesajı göründü mü?

---

### Adım 2: Nodemailer Kur (SMTP için) 🔴

**Ne Yapmalı:**
```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

**Kontrol:**
- `package.json`'da `nodemailer` var mı?

---

### Adım 3: OAuth Credentials Al (Gmail için) 🟡

**Ne Yapmalı:**

1. **Google Cloud Console'a git:**
   - https://console.cloud.google.com/

2. **Project oluştur veya mevcut projeyi seç**

3. **Gmail API'yi etkinleştir:**
   - API Library'den "Gmail API" ara
   - "Enable" butonuna tıkla

4. **OAuth Consent Screen yapılandır:**
   - OAuth consent screen → User Type seç (External)
   - App bilgilerini doldur
   - Scopes: `https://www.googleapis.com/auth/gmail.send`
   - Test users ekle (geliştirme için)

5. **OAuth 2.0 Client ID oluştur:**
   - Credentials → Create Credentials → OAuth client ID
   - Application type: Web application
   - Authorized redirect URIs:
     - `http://localhost:3000/api/integrations/oauth/gmail/callback` (development)
     - `https://yourdomain.com/api/integrations/oauth/gmail/callback` (production)

6. **Client ID ve Secret'ı kopyala:**
   - Client ID
   - Client Secret

7. **`.env.local` dosyasına ekle:**
   ```bash
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   ```

**Kontrol:**
- `.env.local`'de credentials var mı?
- Redirect URI doğru mu?

---

### Adım 4: OAuth Credentials Al (Outlook için) 🟡

**Ne Yapmalı:**

1. **Azure Portal'a git:**
   - https://portal.azure.com/

2. **App Registration oluştur:**
   - Azure Active Directory → App registrations → New registration
   - Name: CRM Email Integration
   - Supported account types: Accounts in any organizational directory and personal Microsoft accounts
   - Redirect URI: Platform: Web
     - `http://localhost:3000/api/integrations/oauth/outlook/callback` (development)

3. **Microsoft Graph API permissions ekle:**
   - API permissions → Add a permission → Microsoft Graph
   - Application permissions (NOT Delegated):
     - `Mail.Send`
   - Grant admin consent (Test için gerekli)

4. **Client Secret oluştur:**
   - Certificates & secrets → New client secret
   - Description: Email Integration Secret
   - Expires: 24 months (veya istediğin süre)
   - Secret'ı kopyala (sadece 1 kez gösterilir!)

5. **Application (client) ID'yi kopyala**

6. **`.env.local` dosyasına ekle:**
   ```bash
   MICROSOFT_CLIENT_ID=your_client_id_here
   MICROSOFT_CLIENT_SECRET=your_client_secret_here
   ```

**Kontrol:**
- `.env.local`'de credentials var mı?
- Redirect URI doğru mu?

---

### Adım 5: Test Et (Gmail OAuth) 🟢

**Ne Yapmalı:**

1. **Development server'ı başlat:**
   ```bash
   npm run dev
   ```

2. **Admin olarak giriş yap**

3. **Settings > E-posta Entegrasyonları sekmesine git**

4. **Gmail OAuth ile bağlan:**
   - "Gmail ile Bağlan" butonuna tıkla
   - Google hesabını seç
   - İzinleri onayla
   - Başarılı mesajını gör

5. **Deal/Quote/Invoice detay sayfasına git**

6. **Mail Gönder butonuna tıkla:**
   - Toast mesajı: "E-posta başarıyla gönderildi"
   - Gmail'de gönderilen e-postayı kontrol et

**Kontrol:**
- OAuth bağlantısı başarılı mı?
- E-posta gönderilebiliyor mu?
- Toast mesajları çalışıyor mu?

---

### Adım 6: Test Et (Outlook OAuth) 🟢

**Ne Yapmalı:**

1. **Settings > E-posta Entegrasyonları sekmesine git**

2. **Outlook OAuth ile bağlan:**
   - "Outlook ile Bağlan" butonuna tıkla
   - Microsoft hesabını seç
   - İzinleri onayla
   - Başarılı mesajını gör

3. **Deal/Quote/Invoice detay sayfasına git**

4. **Mail Gönder butonuna tıkla:**
   - Toast mesajı: "E-posta başarıyla gönderildi"
   - Outlook'ta gönderilen e-postayı kontrol et

**Kontrol:**
- OAuth bağlantısı başarılı mı?
- E-posta gönderilebiliyor mu?

---

### Adım 7: Test Et (SMTP - Gmail App Password) 🟢

**Ne Yapmalı:**

1. **Gmail App Password oluştur:**
   - Gmail → Hesap → Güvenlik
   - 2 Adımlı Doğrulama'yı etkinleştir (gerekirse)
   - Uygulama şifreleri → Uygulama seç: Mail
   - Cihaz seç: Windows Bilgisayar
   - "Oluştur" butonuna tıkla
   - 16 haneli şifreyi kopyala (örn: `abcd efgh ijkl mnop`)

2. **Settings > E-posta Entegrasyonları sekmesine git**

3. **SMTP ayarlarını gir:**
   - SMTP'yi açık yap
   - SMTP Host: `smtp.gmail.com`
   - SMTP Port: `587`
   - SMTP Kullanıcı Adı: Gmail adresin (örn: `youremail@gmail.com`)
   - SMTP Şifresi: App Password (16 haneli şifre)
   - Gönderen E-posta: Gmail adresin
   - Gönderen İsmi: İstediğin isim (örn: `CRM Enterprise`)
   - "E-posta Entegrasyonlarını Kaydet" butonuna tıkla

4. **Deal/Quote/Invoice detay sayfasına git**

5. **Mail Gönder butonuna tıkla:**
   - Toast mesajı: "E-posta başarıyla gönderildi"
   - Gmail'de gönderilen e-postayı kontrol et

**Kontrol:**
- SMTP ayarları kaydedildi mi?
- E-posta gönderilebiliyor mu?

---

## 🎯 ÖNCELİK SIRASI

1. **🔴 Yüksek Öncelik:**
   - Migration çalıştır
   - Nodemailer kur
   - Gmail OAuth credentials al
   - Gmail OAuth ile bağlan ve test et

2. **🟡 Orta Öncelik:**
   - Outlook OAuth credentials al
   - Outlook OAuth ile bağlan ve test et

3. **🟢 Düşük Öncelik:**
   - SMTP (Gmail App Password) yapılandır
   - SMTP ile test et

---

## ❓ SORUN GİDERME

### Hata: "E-posta entegrasyonu bulunamadı"
**Çözüm:** Migration'ı çalıştırdın mı? `105_add_email_integrations.sql`

### Hata: "Nodemailer kurulu değil"
**Çözüm:** `npm install nodemailer` çalıştır

### Hata: "OAuth yetkilendirme başlatılamadı"
**Çözüm:** `.env.local`'de `GOOGLE_CLIENT_ID` ve `GOOGLE_CLIENT_SECRET` var mı?

### Hata: "Token exchange failed"
**Çözüm:** Redirect URI doğru mu? `.env.local`'de `NEXT_PUBLIC_APP_URL` var mı?

### Hata: "E-posta gönderilemedi"
**Çözüm:** 
- Settings > E-posta Entegrasyonları'nda entegrasyon aktif mi?
- Email Status: ACTIVE mi?
- Email Last Error var mı? (hatayı kontrol et)

---

## ✅ TEST CHECKLIST

- [ ] Migration çalıştırıldı mı?
- [ ] Nodemailer kuruldu mu?
- [ ] Gmail OAuth credentials alındı mı?
- [ ] Outlook OAuth credentials alındı mı?
- [ ] `.env.local` dosyası yapılandırıldı mı?
- [ ] Gmail OAuth bağlantısı test edildi mi?
- [ ] Outlook OAuth bağlantısı test edildi mi?
- [ ] SMTP ayarları test edildi mi?
- [ ] Deal detail'den e-posta gönderilebildi mi?
- [ ] Quote detail'den e-posta gönderilebildi mi?
- [ ] Invoice detail'den e-posta gönderilebildi mi?
- [ ] Customer detail'den e-posta gönderilebildi mi?
- [ ] Toast mesajları çalışıyor mu?
- [ ] Entegrasyon yoksa uyarı mesajı gösteriliyor mu?

---

**🎉 Tüm adımları tamamladıktan sonra e-posta entegrasyonu hazır olacak!**

