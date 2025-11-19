# 🧪 CRM Entegrasyonları ve Özellikler Test Rehberi

**Tarih:** 2024  
**Durum:** ✅ Tüm Özellikler Tamamlandı - Test Edilmeye Hazır

---

## 📋 TEST ÖNCESİ HAZIRLIK

### 1. Ortam Kontrolü
- [ ] Supabase bağlantısı aktif
- [ ] Environment variables doğru yapılandırılmış
- [ ] Migration'lar çalıştırılmış (`supabase db push`)
- [ ] Test kullanıcısı oluşturulmuş (SuperAdmin ve normal kullanıcı)

### 2. Entegrasyon API Key'leri
- [ ] Resend API Key (Email)
- [ ] Twilio Account SID ve Auth Token (SMS/WhatsApp)
- [ ] Google Client ID ve Secret (Calendar, Meet)
- [ ] Microsoft Client ID ve Secret (Teams)
- [ ] Zoom Account ID, Client ID ve Secret

---

## ✅ TAMAMLANAN ÖZELLİKLER TEST LİSTESİ

### 1. 📧 EMAIL ENTEGRASYONU

#### Test Senaryoları:
1. **Email Gönderimi**
   - [ ] Müşteri detay sayfasından email gönder
   - [ ] Deal detay sayfasından email gönder
   - [ ] Quote detay sayfasından email gönder
   - [ ] Invoice detay sayfasından email gönder
   - [ ] Meeting detay sayfasından email gönder
   - [ ] Email şablonu seçimi çalışıyor mu?
   - [ ] Template değişkenleri doğru render ediliyor mu?
   - [ ] Önizleme dialog'u çalışıyor mu?

2. **Email Template Sistemi**
   - [ ] Email template oluşturma (`/email-templates`)
   - [ ] Template kategorileri (QUOTE, INVOICE, DEAL, CUSTOMER, GENERAL)
   - [ ] Template değişkenleri ({{customerName}}, {{companyName}}, vb.)
   - [ ] Template seçimi dropdown'u çalışıyor mu?
   - [ ] Template önizleme çalışıyor mu?

3. **Toplu Email Gönderimi**
   - [ ] CustomerList'te müşterileri seç
   - [ ] "Toplu Mesaj Gönder" butonu görünüyor mu?
   - [ ] BulkSendDialog açılıyor mu?
   - [ ] Email tipi seçimi çalışıyor mu?
   - [ ] Template seçimi çalışıyor mu?
   - [ ] Mesaj içeriği yazılabiliyor mu?
   - [ ] Önizleme gösteriliyor mu?
   - [ ] Gönderim başarılı mı?
   - [ ] İlerleme bar'ı çalışıyor mu?
   - [ ] Başarı/hata sayıları doğru mu?

---

### 2. 📱 SMS ENTEGRASYONU

#### Test Senaryoları:
1. **SMS Gönderimi**
   - [ ] Müşteri detay sayfasından SMS gönder
   - [ ] Deal detay sayfasından SMS gönder
   - [ ] Quote detay sayfasından SMS gönder
   - [ ] Invoice detay sayfasından SMS gönder
   - [ ] Meeting detay sayfasından SMS gönder
   - [ ] Telefon numarası formatı doğru mu? (E.164)
   - [ ] Hata durumunda retry butonu çalışıyor mu?

2. **Toplu SMS Gönderimi**
   - [ ] CustomerList'te müşterileri seç
   - [ ] BulkSendDialog'da SMS tipi seç
   - [ ] Geçerli telefon numarası olan müşteriler filtreleniyor mu?
   - [ ] Gönderim başarılı mı?
   - [ ] ActivityLog'a kaydediliyor mu?

---

### 3. 💬 WHATSAPP ENTEGRASYONU

#### Test Senaryoları:
1. **WhatsApp Gönderimi**
   - [ ] Müşteri detay sayfasından WhatsApp gönder
   - [ ] Deal detay sayfasından WhatsApp gönder
   - [ ] Quote detay sayfasından WhatsApp gönder
   - [ ] Invoice detay sayfasından WhatsApp gönder
   - [ ] Meeting detay sayfasından WhatsApp gönder
   - [ ] Telefon numarası formatı doğru mu?
   - [ ] Hata durumunda retry butonu çalışıyor mu?

2. **Toplu WhatsApp Gönderimi**
   - [ ] CustomerList'te müşterileri seç
   - [ ] BulkSendDialog'da WhatsApp tipi seç
   - [ ] Geçerli telefon numarası olan müşteriler filtreleniyor mu?
   - [ ] Gönderim başarılı mı?

---

### 4. 📅 GOOGLE CALENDAR ENTEGRASYONU

#### Test Senaryoları:
1. **OAuth Bağlantısı**
   - [ ] `/user-integrations` sayfasına git
   - [ ] Google Calendar için "Bağlan" butonuna tıkla
   - [ ] OAuth akışı çalışıyor mu?
   - [ ] Token kaydediliyor mu?

2. **Etkinlik Ekleme**
   - [ ] Deal detay sayfasından "Takvime Ekle" butonuna tıkla
   - [ ] Quote detay sayfasından "Takvime Ekle" butonuna tıkla
   - [ ] Invoice detay sayfasından "Takvime Ekle" butonuna tıkla
   - [ ] Meeting oluşturulduğunda otomatik ekleniyor mu?
   - [ ] ActivityLog'a kaydediliyor mu?

---

### 5. 🎥 VIDEO MEETING ENTEGRASYONLARI

#### Test Senaryoları:
1. **Zoom Entegrasyonu**
   - [ ] `/user-integrations` sayfasında Zoom bilgilerini gir
   - [ ] "Test Et" butonuna tıkla
   - [ ] Test başarılı mı?
   - [ ] MeetingForm'da "Zoom Toplantı Oluştur" butonu görünüyor mu?
   - [ ] Toplantı oluşturulduğunda Zoom link'i oluşuyor mu?
   - [ ] Meeting detay sayfasında Zoom link'i görünüyor mu?

2. **Google Meet Entegrasyonu**
   - [ ] `/user-integrations` sayfasında Google Client ID/Secret gir
   - [ ] "Test Et" butonuna tıkla
   - [ ] Test başarılı mı?
   - [ ] MeetingForm'da "Google Meet Toplantı Oluştur" butonu görünüyor mu?
   - [ ] Toplantı oluşturulduğunda Meet link'i oluşuyor mu?

3. **Microsoft Teams Entegrasyonu**
   - [ ] `/user-integrations` sayfasında Microsoft Client ID/Secret gir
   - [ ] "Test Et" butonuna tıkla
   - [ ] Test başarılı mı?
   - [ ] MeetingForm'da "Teams Toplantı Oluştur" butonu görünüyor mu?
   - [ ] Toplantı oluşturulduğunda Teams link'i oluşuyor mu?

4. **Toplantı Linki Gönderimi**
   - [ ] Meeting detay sayfasında "Toplantı Linki Gönder" butonuna tıkla
   - [ ] Email veya WhatsApp seçimi çalışıyor mu?
   - [ ] Link gönderimi başarılı mı?

---

### 6. 📊 ENTEGRASYON ANALYTICS DASHBOARD

#### Test Senaryoları:
1. **Dashboard Erişimi**
   - [ ] `/integrations/analytics` sayfasına git
   - [ ] Sayfa yükleniyor mu?
   - [ ] KPI kartları görünüyor mu?
   - [ ] Grafikler render ediliyor mu?

2. **Veri Görüntüleme**
   - [ ] Toplam gönderim sayısı doğru mu?
   - [ ] Başarı oranı doğru mu?
   - [ ] En çok kullanılan entegrasyon gösteriliyor mu?
   - [ ] Tahmini maliyet hesaplanıyor mu?
   - [ ] Günlük trend grafiği çalışıyor mu?
   - [ ] Entegrasyon dağılımı pie chart çalışıyor mu?
   - [ ] Hata trend grafiği çalışıyor mu?
   - [ ] En çok mesaj gönderilen müşteriler listesi görünüyor mu?

3. **Tarih Aralığı Filtreleme**
   - [ ] 7 gün seçimi çalışıyor mu?
   - [ ] 30 gün seçimi çalışıyor mu?
   - [ ] 90 gün seçimi çalışıyor mu?
   - [ ] Veriler filtreleniyor mu?

---

### 7. ⌨️ COMMAND PALETTE VE KEYBOARD SHORTCUTS

#### Test Senaryoları:
1. **Command Palette Açma**
   - [ ] `Cmd+K` (Mac) veya `Ctrl+K` (Windows) ile açılıyor mu?
   - [ ] Header'daki "Komutlar" butonuna tıklayınca açılıyor mu?
   - [ ] Dialog açılıyor mu?

2. **Command Palette Özellikleri**
   - [ ] Sayfa navigasyonu çalışıyor mu?
   - [ ] Hızlı işlemler çalışıyor mu?
   - [ ] Müşteri arama çalışıyor mu? (3+ karakter)
   - [ ] Deal arama çalışıyor mu? (3+ karakter)
   - [ ] Son görüntülenenler gösteriliyor mu?
   - [ ] Filtreleme çalışıyor mu?
   - [ ] Enter ile seçim çalışıyor mu?
   - [ ] Esc ile kapatma çalışıyor mu?

3. **Keyboard Shortcuts**
   - [ ] `Ctrl+Z` - Geri al çalışıyor mu?
   - [ ] `Ctrl+Shift+Z` / `Ctrl+Y` - İleri al çalışıyor mu?
   - [ ] `Ctrl+S` - Kaydet çalışıyor mu? (form sayfalarında)
   - [ ] `N` - Yeni kayıt çalışıyor mu? (liste sayfalarında)
   - [ ] `?` - Kısayollar listesi gösteriliyor mu?

---

### 8. 📦 TOPLU GÖNDERİM UI

#### Test Senaryoları:
1. **Müşteri Seçimi**
   - [ ] CustomerList'te checkbox ile müşteri seçimi çalışıyor mu?
   - [ ] "Tümünü Seç" çalışıyor mu?
   - [ ] Seçim sayısı gösteriliyor mu?

2. **BulkSendDialog**
   - [ ] "Toplu Mesaj Gönder" butonu görünüyor mu?
   - [ ] Dialog açılıyor mu?
   - [ ] Seçili müşteriler yükleniyor mu?
   - [ ] Gönderim tipi seçimi çalışıyor mu? (Email, SMS, WhatsApp)
   - [ ] Geçerli müşteri sayısı doğru mu?
   - [ ] Template seçimi çalışıyor mu? (Email için)
   - [ ] Mesaj içeriği yazılabiliyor mu?
   - [ ] Önizleme gösteriliyor mu? (ilk 3 müşteri)
   - [ ] Template değişkenleri render ediliyor mu?

3. **Gönderim İşlemi**
   - [ ] "Gönder" butonu çalışıyor mu?
   - [ ] İlerleme bar'ı görünüyor mu?
   - [ ] Başarı/hata sayıları gösteriliyor mu?
   - [ ] Gönderim sonrası toast mesajı gösteriliyor mu?
   - [ ] Seçim temizleniyor mu?
   - [ ] ActivityLog'a kaydediliyor mu?

---

### 9. 🔄 QUICK ACTIONS

#### Test Senaryoları:
1. **Müşteri Detay Sayfası**
   - [ ] "Hızlı İşlemler" kartı görünüyor mu?
   - [ ] Email gönder butonu çalışıyor mu?
   - [ ] SMS gönder butonu çalışıyor mu?
   - [ ] WhatsApp gönder butonu çalışıyor mu?
   - [ ] Görüşme oluştur butonu çalışıyor mu?
   - [ ] Fırsat oluştur butonu çalışıyor mu?
   - [ ] Teklif oluştur butonu çalışıyor mu?
   - [ ] Toast ile "Detay sayfasına gitmek ister misiniz?" mesajı gösteriliyor mu?

2. **Deal Detay Sayfası**
   - [ ] "Hızlı İşlemler" kartı görünüyor mu?
   - [ ] Email gönder butonu çalışıyor mu?
   - [ ] SMS gönder butonu çalışıyor mu?
   - [ ] WhatsApp gönder butonu çalışıyor mu?
   - [ ] Takvime ekle butonu çalışıyor mu?
   - [ ] Teklif oluştur butonu çalışıyor mu?
   - [ ] Görüşme oluştur butonu çalışıyor mu?

3. **Quote Detay Sayfası**
   - [ ] "Hızlı İşlemler" kartı görünüyor mu?
   - [ ] Email gönder butonu çalışıyor mu?
   - [ ] SMS gönder butonu çalışıyor mu?
   - [ ] WhatsApp gönder butonu çalışıyor mu?
   - [ ] Takvime ekle butonu çalışıyor mu?
   - [ ] Fatura oluştur butonu çalışıyor mu?
   - [ ] Görüşme oluştur butonu çalışıyor mu?

4. **Invoice Detay Sayfası**
   - [ ] "Hızlı İşlemler" kartı görünüyor mu?
   - [ ] Email gönder butonu çalışıyor mu?
   - [ ] SMS gönder butonu çalışıyor mu?
   - [ ] WhatsApp gönder butonu çalışıyor mu?
   - [ ] Takvime ekle butonu çalışıyor mu?
   - [ ] PDF İndir butonu çalışıyor mu?
   - [ ] Teklifi Görüntüle butonu çalışıyor mu?

5. **Meeting Detay Sayfası**
   - [ ] "Hızlı İşlemler" kartı görünüyor mu?
   - [ ] Email gönder butonu çalışıyor mu?
   - [ ] SMS gönder butonu çalışıyor mu?
   - [ ] WhatsApp gönder butonu çalışıyor mu?
   - [ ] Takvime ekle butonu çalışıyor mu?
   - [ ] Toplantı Linki Gönder butonu çalışıyor mu?
   - [ ] Fırsatı Görüntüle butonu çalışıyor mu?

---

### 10. 🔐 GÜVENLİK VE YETKİLENDİRME

#### Test Senaryoları:
1. **RLS (Row-Level Security)**
   - [ ] Kullanıcı sadece kendi şirketinin verilerini görüyor mu?
   - [ ] SuperAdmin tüm şirketleri görebiliyor mu?
   - [ ] API endpoint'lerinde companyId kontrolü yapılıyor mu?

2. **Entegrasyon Yönetimi**
   - [ ] `/user-integrations` sayfasına erişim var mı?
   - [ ] Entegrasyon bilgileri kaydediliyor mu?
   - [ ] API key'ler maskeleniyor mu?
   - [ ] Test butonları çalışıyor mu?

---

## 🐛 BİLİNEN SORUNLAR VE ÇÖZÜMLERİ

### 1. Migration Sorunları
**Sorun:** Migration çalıştırılmamışsa bazı özellikler çalışmayabilir.  
**Çözüm:** `supabase db push` komutunu çalıştırın.

### 2. OAuth Token Sorunları
**Sorun:** Google Calendar OAuth token'ı yoksa "Takvime Ekle" çalışmaz.  
**Çözüm:** `/user-integrations` sayfasından Google Calendar'a bağlanın.

### 3. API Key Sorunları
**Sorun:** Entegrasyon API key'leri yoksa gönderim başarısız olur.  
**Çözüm:** `/user-integrations` sayfasından API key'leri girin ve test edin.

---

## 📝 TEST SONRASI KONTROL LİSTESİ

- [ ] Tüm entegrasyonlar çalışıyor mu?
- [ ] Tüm butonlar çalışıyor mu?
- [ ] Toast mesajları gösteriliyor mu?
- [ ] ActivityLog'a kayıtlar yazılıyor mu?
- [ ] Hata durumlarında retry çalışıyor mu?
- [ ] Command Palette çalışıyor mu?
- [ ] Keyboard shortcuts çalışıyor mu?
- [ ] Toplu gönderim çalışıyor mu?
- [ ] Analytics dashboard çalışıyor mu?
- [ ] Quick actions çalışıyor mu?

---

## ✅ TEST TAMAMLANDI

Tüm testler başarıyla tamamlandıysa:
- [ ] Production'a deploy edilebilir
- [ ] Kullanıcılara bildirim gönderilebilir
- [ ] Dokümantasyon güncellenebilir

---

**Son Güncelleme:** 2024  
**Test Durumu:** ✅ Hazır - Tüm Özellikler Tamamlandı
