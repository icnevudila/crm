# 🎥 Video Toplantı Entegrasyonları Test Rehberi

## 📋 Genel Bakış

Bu rehber, CRM sistemine eklenen video toplantı entegrasyonlarının (Zoom, Google Meet, Microsoft Teams) nasıl test edileceğini açıklar.

## ✅ Eklenen Özellikler

1. **SuperAdmin Entegrasyon Yönetimi**
   - Zoom, Google Meet, Microsoft Teams credentials yapılandırması
   - Şirket bazlı entegrasyon ayarları

2. **Otomatik Toplantı Oluşturma**
   - Meeting form'da Zoom/Google Meet/Teams toplantısı otomatik oluşturma
   - Toplantı linki ve şifre otomatik kaydedilme

3. **Toplantı Linki Gönderme**
   - E-posta veya WhatsApp üzerinden toplantı linki gönderme
   - Özelleştirilebilir mesaj desteği

4. **Otomatik Takvim Entegrasyonu**
   - Toplantı oluşturulduğunda otomatik Google Calendar'a ekleme
   - Toplantı linki ve şifre takvim etkinliğine eklenir

---

## 🚀 Test Adımları

### 1. SuperAdmin Entegrasyon Ayarları

#### 1.1. Zoom Entegrasyonu

1. **SuperAdmin olarak giriş yap**
   - URL: `/tr/superadmin/integrations`

2. **Bir şirket seç**
   - Dropdown'dan test edilecek şirketi seç

3. **"Video Toplantılar" sekmesine git**

4. **Zoom entegrasyonunu aktifleştir**
   - "Zoom Entegrasyonu" switch'ini aç
   - Zoom Account ID, Client ID ve Client Secret bilgilerini gir
   - **Kaydet** butonuna tıkla

5. **Doğrulama**
   - Sayfayı yenile ve credentials'ların kaydedildiğini kontrol et
   - Secret alanların `***` ile maskelendiğini kontrol et

#### 1.2. Google Meet Entegrasyonu

1. **"Video Toplantılar" sekmesinde**
2. **"Google Meet Entegrasyonu" switch'ini aç**
3. **Not:** Google Meet için kullanıcıların kendi Google hesaplarını bağlaması gerektiğini kontrol et
4. **Kaydet**

#### 1.3. Microsoft Teams Entegrasyonu

1. **"Video Toplantılar" sekmesinde**
2. **"Microsoft Teams Entegrasyonu" switch'ini aç**
3. **Not:** Microsoft Teams için kullanıcıların kendi Microsoft hesaplarını bağlaması gerektiğini kontrol et
4. **Kaydet**

---

### 2. Toplantı Oluşturma ve Otomatik Link Oluşturma

#### 2.1. Zoom Toplantısı Oluşturma

1. **Yeni toplantı oluştur**
   - URL: `/tr/meetings/new`
   - Veya herhangi bir sayfadan "Yeni Toplantı" butonuna tıkla

2. **Toplantı bilgilerini doldur**
   - Başlık: "Test Zoom Toplantısı"
   - Tarih: Gelecek bir tarih seç
   - Süre: 60 dakika

3. **Toplantı tipini seç**
   - "Toplantı Tipi" dropdown'ından **"Zoom"** seç

4. **Otomatik link oluştur**
   - "Otomatik Oluştur" butonuna tıkla
   - Zoom API credentials'ları doğruysa link otomatik oluşturulur
   - Link ve şifre (varsa) form'a otomatik doldurulur

5. **Doğrulama**
   - Link'in `https://zoom.us/j/...` formatında olduğunu kontrol et
   - Şifre varsa doğru şekilde kaydedildiğini kontrol et

6. **Toplantıyı kaydet**
   - "Kaydet" butonuna tıkla
   - Toplantı başarıyla oluşturuldu mesajını gör

#### 2.2. Google Meet Toplantısı Oluşturma

1. **Yeni toplantı oluştur**
2. **Toplantı tipini "Google Meet" seç**
3. **Otomatik link oluştur**
   - Google Calendar entegrasyonu aktifse ve kullanıcı Google hesabını bağladıysa link oluşturulur
   - Link `https://meet.google.com/...` formatında olmalı

#### 2.3. Microsoft Teams Toplantısı Oluşturma

1. **Yeni toplantı oluştur**
2. **Toplantı tipini "Teams" seç**
3. **Otomatik link oluştur**
   - Microsoft Teams entegrasyonu aktifse ve kullanıcı Microsoft hesabını bağladıysa link oluşturulur
   - Link `https://teams.microsoft.com/...` formatında olmalı

---

### 3. Toplantı Linki Gönderme

#### 3.1. E-posta ile Gönderme

1. **Toplantı detay sayfasına git**
   - Oluşturulan toplantının detay sayfasına git
   - URL: `/tr/meetings/[id]`

2. **"Toplantı Linki Gönder" butonuna tıkla**
   - Buton sadece `meetingUrl` varsa görünür

3. **Gönderme yöntemini seç**
   - "E-posta" seçeneğini seç
   - Müşterinin e-posta adresi varsa aktif olmalı

4. **Mesajı özelleştir (opsiyonel)**
   - Özel mesaj alanına istediğin mesajı yaz
   - Boş bırakırsan varsayılan mesaj kullanılır

5. **Gönder**
   - "Gönder" butonuna tıkla
   - E-posta başarıyla gönderildi mesajını gör

6. **Doğrulama**
   - Müşterinin e-posta kutusunu kontrol et
   - Toplantı linki, tarih, süre ve şifre (varsa) doğru şekilde gönderilmiş olmalı

#### 3.2. WhatsApp ile Gönderme

1. **Toplantı detay sayfasında**
2. **"Toplantı Linki Gönder" butonuna tıkla**
3. **"WhatsApp" seçeneğini seç**
   - Müşterinin telefon numarası varsa aktif olmalı

4. **Mesajı özelleştir (opsiyonel)**
5. **Gönder**
6. **Doğrulama**
   - WhatsApp entegrasyonu aktifse mesaj gönderilir
   - Müşterinin WhatsApp'ını kontrol et

---

### 4. Otomatik Takvim Entegrasyonu

#### 4.1. Google Calendar'a Otomatik Ekleme

1. **Google Calendar entegrasyonunu aktifleştir**
   - SuperAdmin > Entegrasyonlar > Google Calendar sekmesi
   - Client ID, Client Secret ve Redirect URI gir
   - Kaydet

2. **Kullanıcı Google hesabını bağla**
   - Kullanıcı > Entegrasyonlar > Google Calendar
   - "Google Calendar Bağla" butonuna tıkla
   - Google OAuth akışını tamamla

3. **Toplantı oluştur**
   - Toplantı tipi: Zoom, Google Meet veya Teams
   - Toplantı linki otomatik oluşturulur
   - Toplantıyı kaydet

4. **Doğrulama**
   - Google Calendar'ı aç
   - Toplantının otomatik olarak eklendiğini kontrol et
   - Toplantı linki ve şifre (varsa) açıklamada olmalı
   - Müşteri e-posta adresi varsa davet edilmiş olmalı

---

## 🔍 Kontrol Listesi

### SuperAdmin Entegrasyon Ayarları
- [ ] Zoom credentials kaydediliyor mu?
- [ ] Google Meet entegrasyonu aktif edilebiliyor mu?
- [ ] Microsoft Teams entegrasyonu aktif edilebiliyor mu?
- [ ] Secret alanlar maskeleniyor mu (`***`)?

### Toplantı Oluşturma
- [ ] Zoom toplantısı otomatik oluşturuluyor mu?
- [ ] Google Meet toplantısı otomatik oluşturuluyor mu?
- [ ] Microsoft Teams toplantısı otomatik oluşturuluyor mu?
- [ ] Toplantı linki ve şifre doğru kaydediliyor mu?

### Toplantı Linki Gönderme
- [ ] E-posta ile gönderme çalışıyor mu?
- [ ] WhatsApp ile gönderme çalışıyor mu?
- [ ] Özel mesaj desteği çalışıyor mu?
- [ ] Varsayılan mesaj doğru mu?

### Otomatik Takvim Entegrasyonu
- [ ] Toplantı oluşturulduğunda Google Calendar'a ekleniyor mu?
- [ ] Toplantı linki takvim etkinliğine ekleniyor mu?
- [ ] Şifre takvim etkinliğine ekleniyor mu?
- [ ] Müşteri davet ediliyor mu?

---

## ⚠️ Bilinen Sınırlamalar

1. **Google Meet ve Microsoft Teams**
   - Kullanıcı bazlı OAuth gerektirir
   - Her kullanıcının kendi Google/Microsoft hesabını bağlaması gerekir

2. **Zoom**
   - Şirket bazlı Server-to-Server OAuth kullanır
   - SuperAdmin tarafından yapılandırılır

3. **Otomatik Takvim Ekleme**
   - Sadece `meetingUrl` varsa çalışır
   - Google Calendar entegrasyonu aktif olmalı
   - Kullanıcının Google hesabı bağlı olmalı

---

## 🐛 Sorun Giderme

### Zoom Toplantısı Oluşturulamıyor

1. **Credentials kontrolü**
   - SuperAdmin > Entegrasyonlar > Video Toplantılar
   - Zoom Account ID, Client ID ve Client Secret doğru mu?

2. **API hatası kontrolü**
   - Browser console'u aç (F12)
   - Network sekmesinde `/api/meetings/create-video-meeting` isteğini kontrol et
   - Hata mesajını oku

### Google Calendar'a Eklenmiyor

1. **Entegrasyon kontrolü**
   - Google Calendar entegrasyonu aktif mi?
   - Kullanıcının Google hesabı bağlı mı?

2. **Toplantı linki kontrolü**
   - Toplantıda `meetingUrl` var mı?

3. **Console log kontrolü**
   - Server console'da "Auto-add to calendar error" mesajı var mı?

### Toplantı Linki Gönderilemiyor

1. **Müşteri bilgileri kontrolü**
   - Müşterinin e-posta adresi veya telefon numarası var mı?

2. **Entegrasyon kontrolü**
   - E-posta entegrasyonu aktif mi?
   - WhatsApp entegrasyonu aktif mi?

---

## 📝 Notlar

- Tüm entegrasyonlar şirket bazlıdır (multi-tenant)
- SuperAdmin tüm şirketlerin entegrasyonlarını yönetebilir
- Kullanıcılar sadece kendi şirketlerinin entegrasyonlarını kullanabilir
- Toplantı linki gönderme butonu sadece `meetingUrl` varsa görünür
- Otomatik takvim ekleme sadece Google Calendar entegrasyonu aktifse çalışır

---

## ✅ Test Sonucu

Tüm testleri tamamladıktan sonra bu bölümü doldurun:

- **Test Tarihi:** _______________
- **Test Eden:** _______________
- **Sonuç:** ✅ Başarılı / ❌ Başarısız
- **Notlar:** _______________

---

**Son Güncelleme:** 2024


