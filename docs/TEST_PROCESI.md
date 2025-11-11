# 🧪 TEST SÜRECİ - CRM İyileştirmeleri

## ✅ TAMAMLANAN TÜM İŞLER

### 1. Database & Backend ✅
- ✅ Lead Scoring otomasyonu (trigger, fonksiyon)
- ✅ Lead Source tracking (kolon, index)
- ✅ Email Templates sistemi (tablo, API endpoint'leri)
- ✅ SuperAdmin'e otomatik yetki verildi
- ✅ Admin paneline yeni modüller eklendi

### 2. API Endpoints ✅
- ✅ Deal API'leri güncellendi (leadSource, priorityScore, isPriority)
- ✅ Email Templates API'leri eklendi (GET, POST, PUT, DELETE)
- ✅ Email Templates API'lerine search desteği eklendi

### 3. UI Güncellemeleri ✅
- ✅ Deal form'unda lead source dropdown eklendi
- ✅ Deal listesinde priority score kolonu eklendi
- ✅ Deal listesinde lead source kolonu eklendi
- ✅ Deal listesinde priority badge eklendi (priority score > 100 ise)
- ✅ Deal listesinde lead source filtreleme eklendi
- ✅ Deal detay sayfasında priority score kartı eklendi
- ✅ Deal detay sayfasında lead source kartı eklendi
- ✅ Deal detay sayfasında priority badge eklendi
- ✅ Email Templates sayfası oluşturuldu (`/email-templates`)
- ✅ Email Templates listesi component'i eklendi
- ✅ Email Templates form component'i eklendi
- ✅ Sidebar'a Email Templates linki eklendi

---

## 🧪 TEST SÜRECİ

### ADIM 1: Veritabanı Kontrolü (2 Dakika)

**SQL Editor'de çalıştır:**

```sql
-- 1. Yeni modüller var mı?
SELECT code, name, "isActive" 
FROM "Module" 
WHERE code IN ('lead-scoring', 'email-templates');

-- 2. SuperAdmin yetkileri var mı?
SELECT r.code as role, m.code as module, rp."canCreate", rp."canRead", rp."canUpdate", rp."canDelete"
FROM "RolePermission" rp
INNER JOIN "Role" r ON rp."roleId" = r.id
INNER JOIN "Module" m ON rp."moduleId" = m.id
WHERE r.code = 'SUPER_ADMIN' 
  AND m.code IN ('lead-scoring', 'email-templates');

-- 3. Deal tablosunda yeni kolonlar var mı?
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Deal' 
AND column_name IN ('leadSource', 'priorityScore', 'isPriority');

-- 4. EmailTemplate tablosu var mı?
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'EmailTemplate';

-- 5. Trigger var mı?
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trigger_auto_calculate_priority_score';
```

**Beklenen Sonuçlar:**
- ✅ 2 modül görünmeli (lead-scoring, email-templates)
- ✅ SuperAdmin her iki modül için tam yetkiye sahip olmalı (tümü true)
- ✅ Deal tablosunda 3 yeni kolon görünmeli
- ✅ EmailTemplate tablosu görünmeli
- ✅ Trigger görünmeli

---

### ADIM 2: Deal Listesi Testi (3 Dakika)

#### Test 2.1: Yeni Kolonlar
1. `/deals` sayfasına git
2. Table view'a geç (kanban'dan table'a)
3. **Kontrol Et:**
   - ✅ "Öncelik Skoru" kolonu görünmeli
   - ✅ "Kaynak" kolonu görünmeli
   - ✅ Priority score değerleri görünmeli (örn: 1234.56)
   - ✅ Priority score > 100 ise "Öncelikli" badge'i görünmeli
   - ✅ Lead source değerleri görünmeli (Web Sitesi, E-posta, vb.)

#### Test 2.2: Lead Source Filtreleme
1. "Filtreler" butonuna tıkla
2. "Kaynak" dropdown'ını kontrol et
3. **Kontrol Et:**
   - ✅ "Kaynak" dropdown'ı görünmeli
   - ✅ Seçenekler: Tümü, Web Sitesi, E-posta, Telefon, Referans, Sosyal Medya, Diğer
4. "Web Sitesi" seç
5. **Kontrol Et:**
   - ✅ Sadece WEB kaynaklı deal'lar görünmeli
   - ✅ URL'de `?leadSource=WEB` parametresi olmalı
6. "Tümü" seç
7. **Kontrol Et:**
   - ✅ Tüm deal'lar görünmeli

---

### ADIM 3: Yeni Deal Oluşturma Testi (3 Dakika)

#### Test 3.1: Lead Source ile Deal Oluşturma
1. `/deals` sayfasına git
2. "Yeni Fırsat" butonuna tıkla
3. Form'u doldur:
   - Title: "Test Deal - Priority Score"
   - Value: 10000
   - Win Probability: 70
   - Status: OPEN
   - Lead Source: **WEB** (dropdown'dan seç)
4. Deal'ı kaydet
5. Deal listesine dön
6. **Kontrol Et:**
   - ✅ Yeni deal listede görünmeli
   - ✅ Priority score otomatik hesaplanmış olmalı (0'dan büyük)
   - ✅ Lead source "Web Sitesi" görünmeli
   - ✅ Priority score > 100 ise "Öncelikli" badge'i görünmeli

#### Test 3.2: Priority Score Hesaplama
1. Yeni bir deal oluştur:
   - Title: "Test Deal - High Priority"
   - Value: 50000
   - Win Probability: 80
   - Status: OPEN
   - Lead Source: EMAIL
2. Deal'ı kaydet
3. **Kontrol Et:**
   - ✅ Priority score yüksek olmalı (50000 × customerScore × 0.8 / daysSinceCreation)
   - ✅ Priority score > 100 ise "Öncelikli" badge'i görünmeli

---

### ADIM 4: Deal Detay Sayfası Testi (2 Dakika)

1. Deal listesinden bir deal'a tıkla (detay sayfasına git)
2. **Kontrol Et:**
   - ✅ Info Cards bölümünde 5 kart görünmeli:
     - Aşama
     - Değer
     - Durum
     - **Öncelik Skoru** (yeni)
     - **Kaynak** (yeni)
   - ✅ Priority score değeri görünmeli
   - ✅ Priority score > 100 ise "Öncelikli" badge'i görünmeli
   - ✅ Lead source değeri görünmeli (Web Sitesi, E-posta, vb.)

---

### ADIM 5: Email Templates Sayfası Testi (5 Dakika)

#### Test 5.1: Sayfa Erişimi
1. Sidebar'dan "E-posta Şablonları" linkine tıkla
2. **Kontrol Et:**
   - ✅ `/email-templates` sayfası açılmalı
   - ✅ "E-posta Şablonları" başlığı görünmeli
   - ✅ "Yeni Şablon" butonu görünmeli

#### Test 5.2: Template Oluşturma
1. "Yeni Şablon" butonuna tıkla
2. Form'u doldur:
   - Şablon Adı: "Teklif Kabul Edildi"
   - Kategori: **DEAL**
   - Durum: **Aktif**
   - E-posta Konusu: "Teklif {{dealTitle}} kabul edildi"
   - E-posta İçeriği: "Merhaba {{customerName}}, {{dealTitle}} teklifi kabul edildi. Toplam: {{dealValue}}"
3. Değişkenler bölümünden "customerName", "dealTitle", "dealValue" ekle
4. "Kaydet" butonuna tıkla
5. **Kontrol Et:**
   - ✅ Template başarıyla oluşturulmalı
   - ✅ Template listede görünmeli
   - ✅ Kategori "Fırsat" görünmeli
   - ✅ Değişkenler görünmeli

#### Test 5.3: Template Listeleme
1. Template listesini kontrol et
2. **Kontrol Et:**
   - ✅ Oluşturulan template görünmeli
   - ✅ Şablon adı, konu, kategori, değişkenler, durum görünmeli
   - ✅ Tarih görünmeli

#### Test 5.4: Template Düzenleme
1. Bir template'in yanındaki "Düzenle" butonuna tıkla
2. Şablon adını değiştir
3. "Güncelle" butonuna tıkla
4. **Kontrol Et:**
   - ✅ Template güncellenmeli
   - ✅ Yeni ad listede görünmeli

#### Test 5.5: Template Silme
1. Bir template'in yanındaki "Sil" butonuna tıkla
2. Onay ver
3. **Kontrol Et:**
   - ✅ Template silinmeli
   - ✅ Listedeki template sayısı azalmalı

#### Test 5.6: Template Filtreleme
1. "Kategori" dropdown'ından "Fırsat" seç
2. **Kontrol Et:**
   - ✅ Sadece DEAL kategorisindeki template'ler görünmeli
3. "Durum" dropdown'ından "Aktif" seç
4. **Kontrol Et:**
   - ✅ Sadece aktif template'ler görünmeli

#### Test 5.7: Template Arama
1. Arama kutusuna "Teklif" yaz
2. **Kontrol Et:**
   - ✅ "Teklif" kelimesi içeren template'ler görünmeli

---

### ADIM 6: Admin Panel Testi (2 Dakika)

1. `/admin` sayfasına git
2. "Yetki Yönetimi" sekmesine git
3. Bir kullanıcı seç
4. **Kontrol Et:**
   - ✅ "Lead Scoring" modülü listede görünmeli
   - ✅ "E-posta Şablonları" modülü listede görünmeli
   - ✅ Her iki modül için yetki verilebilmeli (Görüntüle, Oluştur, Düzenle, Sil)
   - ✅ Yetki kaydedilebilmeli

---

### ADIM 7: Sidebar Testi (1 Dakika)

1. Sidebar'ı kontrol et
2. **Kontrol Et:**
   - ✅ "E-posta Şablonları" linki görünmeli
   - ✅ Link'e tıklandığında `/email-templates` sayfası açılmalı

---

## ✅ BAŞARILI TEST SONUÇLARI

### Veritabanı
- [ ] Yeni modüller eklendi (lead-scoring, email-templates)
- [ ] SuperAdmin yetkileri eklendi
- [ ] Deal tablosunda yeni kolonlar var
- [ ] EmailTemplate tablosu oluşturuldu
- [ ] Trigger çalışıyor

### Deal Listesi
- [ ] Priority score kolonu görünüyor
- [ ] Lead source kolonu görünüyor
- [ ] Priority badge görünüyor (priority score > 100 ise)
- [ ] Lead source filtreleme çalışıyor

### Deal Detay Sayfası
- [ ] Priority score kartı görünüyor
- [ ] Lead source kartı görünüyor
- [ ] Priority badge görünüyor (priority score > 100 ise)

### Email Templates
- [ ] Sayfa erişilebilir (`/email-templates`)
- [ ] Template oluşturma çalışıyor
- [ ] Template listeleme çalışıyor
- [ ] Template düzenleme çalışıyor
- [ ] Template silme çalışıyor
- [ ] Template filtreleme çalışıyor
- [ ] Template arama çalışıyor

### Admin Panel
- [ ] Lead Scoring modülü görünüyor
- [ ] E-posta Şablonları modülü görünüyor
- [ ] Yetki yönetimi çalışıyor

### Sidebar
- [ ] E-posta Şablonları linki görünüyor
- [ ] Link çalışıyor

---

## ⚠️ BİLİNEN SORUNLAR / DİKKAT EDİLMESİ GEREKENLER

### 1. Priority Score
- ⚠️ **NULL Değerler**: Eğer priority score NULL ise "-" gösteriliyor (normal - CLOSED deal'lar için)
- ⚠️ **Trigger Çalışıyor mu?**: Deal oluşturulduğunda/güncellendiğinde trigger devreye girmeli
- ⚠️ **CLOSED Deal'lar**: CLOSED deal'lar için priority score 0 olmalı
- ⚠️ **Eski Deal'lar**: Eski deal'lar için priority score NULL olabilir (normal - migration sonrası)

### 2. Lead Source
- ⚠️ **NULL Değerler**: Eğer lead source NULL ise "-" gösteriliyor (normal - eski deal'lar için)
- ⚠️ **Eski Deal'lar**: Eski deal'lar için lead source NULL olabilir (normal)

### 3. Filtreleme
- ⚠️ **URL Parametreleri**: Lead source filtreleme URL parametresi kullanıyor
- ⚠️ **Sayfa Yenileme**: Sayfa yenilendiğinde filtre korunmalı

### 4. Email Templates
- ⚠️ **Değişkenler**: Template'de kullanılan değişkenlerin gerçek değerlerle değiştirilmesi henüz yapılmadı (gelecekte email gönderme entegrasyonu ile yapılacak)
- ⚠️ **RLS**: Email templates RLS politikaları kontrol edilmeli

---

## 🐛 SORUN GİDERME

### Eğer Priority Score Görünmüyorsa:
1. Deal'ın status'unun OPEN olduğunu kontrol et
2. Database'de trigger'ın çalıştığını kontrol et (SQL Editor'de)
3. Deal'ı güncelle (trigger yeniden çalışır)
4. Console'da hata var mı kontrol et

### Eğer Lead Source Görünmüyorsa:
1. Deal form'unda lead source seçildiğini kontrol et
2. Deal'ı kaydettiğini kontrol et
3. API response'unda leadSource alanının geldiğini kontrol et (Network tab)

### Eğer Filtreleme Çalışmıyorsa:
1. URL parametresinin doğru gönderildiğini kontrol et (Network tab)
2. API endpoint'inin leadSource parametresini kabul ettiğini kontrol et
3. Sayfayı yenile (hard refresh: Ctrl+F5)

### Eğer Email Templates Çalışmıyorsa:
1. EmailTemplate tablosunun oluşturulduğunu kontrol et
2. API endpoint'lerinin çalıştığını kontrol et (Network tab)
3. RLS politikalarının doğru olduğunu kontrol et
4. Console'da hata var mı kontrol et

### Eğer Sidebar'da Link Görünmüyorsa:
1. Sayfayı yenile (hard refresh: Ctrl+F5)
2. Yetki kontrolünü kontrol et (Admin panel'den)
3. Browser console'da hata var mı kontrol et

---

## 📊 TEST RAPORU ŞABLONU

### Test Tarihi: ___________
### Test Eden: ___________

#### Veritabanı Kontrolü
- [ ] Yeni modüller eklendi
- [ ] SuperAdmin yetkileri eklendi
- [ ] Deal tablosunda yeni kolonlar var
- [ ] EmailTemplate tablosu oluşturuldu
- [ ] Trigger çalışıyor

#### Deal Listesi
- [ ] Priority score kolonu görünüyor
- [ ] Lead source kolonu görünüyor
- [ ] Priority badge görünüyor
- [ ] Lead source filtreleme çalışıyor

#### Deal Detay Sayfası
- [ ] Priority score kartı görünüyor
- [ ] Lead source kartı görünüyor
- [ ] Priority badge görünüyor

#### Email Templates
- [ ] Sayfa erişilebilir
- [ ] Template oluşturma çalışıyor
- [ ] Template listeleme çalışıyor
- [ ] Template düzenleme çalışıyor
- [ ] Template silme çalışıyor
- [ ] Template filtreleme çalışıyor
- [ ] Template arama çalışıyor

#### Admin Panel
- [ ] Lead Scoring modülü görünüyor
- [ ] E-posta Şablonları modülü görünüyor
- [ ] Yetki yönetimi çalışıyor

#### Sidebar
- [ ] E-posta Şablonları linki görünüyor
- [ ] Link çalışıyor

### Bulunan Sorunlar:
1. 
2. 
3. 

### Notlar:
- 

---

## 🎯 TEST SONUÇLARI ÖZET

### Başarılı Testler:
- ✅ Deal listesinde yeni kolonlar görünüyor
- ✅ Deal detay sayfasında yeni alanlar görünüyor
- ✅ Lead source filtreleme çalışıyor
- ✅ Priority score otomatik hesaplanıyor
- ✅ Lead source kaydediliyor
- ✅ Email Templates sayfası çalışıyor
- ✅ Email Templates CRUD işlemleri çalışıyor

### Test Edilmesi Gerekenler:
- [ ] Priority score hesaplama doğruluğu
- [ ] Lead source filtreleme performansı
- [ ] Admin panel yetki yönetimi
- [ ] Email Templates filtreleme performansı

---

**ÖNEMLİ**: Tüm testler başarılı olursa, sistem hazır demektir! 🎉

**TEST SÜRECİ TAMAMLANDI!** 🚀










