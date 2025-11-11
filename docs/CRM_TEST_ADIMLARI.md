# 🧪 CRM İyileştirmeleri Test Adımları

## ✅ SQL Migration Başarıyla Çalıştırıldı!

---

## 📋 TEST ADIMLARI

### 1. Lead Source Tracking Testi

#### Test 1.1: Deal Form'unda Lead Source Seçimi
1. **Adım**: `/deals` sayfasına git
2. **Adım**: "Yeni Fırsat" butonuna tıkla
3. **Adım**: Form'da "Potansiyel Müşteri Kaynağı" dropdown'ını kontrol et
4. **Beklenen Sonuç**: 
   - ✅ Dropdown görünmeli
   - ✅ Seçenekler: Web Sitesi, E-posta, Telefon, Referans, Sosyal Medya, Diğer
   - ✅ Bir seçenek seçip kaydet

#### Test 1.2: Deal Kaydetme ve Lead Source Kontrolü
1. **Adım**: Yeni bir deal oluştur (lead source seçerek)
2. **Adım**: Deal'ı kaydet
3. **Adım**: Deal listesinde veya detay sayfasında lead source'u kontrol et
4. **Beklenen Sonuç**: 
   - ✅ Deal başarıyla kaydedilmeli
   - ✅ Lead source kaydedilmeli
   - ✅ Deal güncellendiğinde lead source değiştirilebilmeli

#### Test 1.3: Lead Source Bazlı Filtreleme
1. **Adım**: Deal listesinde lead source bazlı filtreleme yap
2. **Adım**: API endpoint'ini test et: `/api/deals?leadSource=WEB`
3. **Beklenen Sonuç**: 
   - ✅ Sadece WEB kaynaklı deal'lar görünmeli
   - ✅ Filtreleme çalışmalı

---

### 2. Lead Scoring Otomasyonu Testi

#### Test 2.1: Yeni Deal Oluşturma ve Priority Score Hesaplama
1. **Adım**: Yeni bir deal oluştur:
   - Title: "Test Deal"
   - Value: 10000
   - Win Probability: 70
   - Status: OPEN
2. **Adım**: Deal'ı kaydet
3. **Adım**: Deal detay sayfasına git veya API'den çek: `/api/deals/[id]`
4. **Beklenen Sonuç**: 
   - ✅ Deal başarıyla kaydedilmeli
   - ✅ `priorityScore` otomatik hesaplanmalı (0'dan büyük olmalı)
   - ✅ `isPriority` değeri set edilmeli (priorityScore > 100 ise true)

#### Test 2.2: Deal Güncelleme ve Priority Score Yeniden Hesaplama
1. **Adım**: Mevcut bir deal'ı düzenle
2. **Adım**: Value veya Win Probability değerini değiştir
3. **Adım**: Deal'ı kaydet
4. **Adım**: Priority score'u kontrol et
5. **Beklenen Sonuç**: 
   - ✅ Deal güncellenmeli
   - ✅ Priority score yeniden hesaplanmalı
   - ✅ Yeni değerler yansımalı

#### Test 2.3: Deal Status Değişikliği (OPEN → CLOSED)
1. **Adım**: Mevcut bir OPEN deal'ı seç
2. **Adım**: Status'u CLOSED yap
3. **Adım**: Deal'ı kaydet
4. **Adım**: Priority score'u kontrol et
5. **Beklenen Sonuç**: 
   - ✅ Deal status CLOSED olmalı
   - ✅ Priority score 0 olmalı
   - ✅ isPriority false olmalı

#### Test 2.4: Priority Score Formülü Kontrolü
1. **Adım**: Bilinen değerlerle bir deal oluştur:
   - Value: 10000
   - Win Probability: 50
   - Customer Score: 1 (varsayılan)
   - Days Since Creation: 1
2. **Adım**: Priority score'u hesapla
3. **Beklenen Sonuç**: 
   - ✅ Formül: (10000 × 1 × 0.5) / 1 = 5000
   - ✅ Priority score yaklaşık 5000 olmalı
   - ✅ isPriority true olmalı (5000 > 100)

---

### 3. Email Templates Sistemi Testi

#### Test 3.1: Email Template Oluşturma (API)
1. **Adım**: API endpoint'ini test et: `POST /api/email-templates`
2. **Adım**: Request body:
```json
{
  "name": "Test Template",
  "subject": "Test Konu {{customerName}}",
  "body": "Merhaba {{customerName}}, {{dealTitle}} için teşekkürler!",
  "variables": ["customerName", "dealTitle"],
  "category": "DEAL",
  "isActive": true
}
```
3. **Beklenen Sonuç**: 
   - ✅ Template başarıyla oluşturulmalı
   - ✅ ID dönmeli
   - ✅ ActivityLog'a kaydedilmeli

#### Test 3.2: Email Template Listeleme (API)
1. **Adım**: API endpoint'ini test et: `GET /api/email-templates`
2. **Beklenen Sonuç**: 
   - ✅ Template listesi dönmeli
   - ✅ Sadece kendi şirketinin template'leri görünmeli
   - ✅ SuperAdmin tüm template'leri görebilmeli

#### Test 3.3: Email Template Güncelleme (API)
1. **Adım**: Mevcut bir template'i güncelle: `PUT /api/email-templates/[id]`
2. **Adım**: Request body:
```json
{
  "name": "Güncellenmiş Template",
  "subject": "Yeni Konu",
  "body": "Yeni içerik"
}
```
3. **Beklenen Sonuç**: 
   - ✅ Template güncellenmeli
   - ✅ ActivityLog'a kaydedilmeli

#### Test 3.4: Email Template Silme (API)
1. **Adım**: Bir template'i sil: `DELETE /api/email-templates/[id]`
2. **Beklenen Sonuç**: 
   - ✅ Template silinmeli
   - ✅ ActivityLog'a kaydedilmeli

#### Test 3.5: Email Template Kategori Filtreleme
1. **Adım**: API endpoint'ini test et: `GET /api/email-templates?category=DEAL`
2. **Beklenen Sonuç**: 
   - ✅ Sadece DEAL kategorisindeki template'ler dönmeli

---

### 4. Admin Panel Yetki Testi

#### Test 4.1: Lead Scoring Modülü Yetkisi
1. **Adım**: Admin panel'e git: `/admin`
2. **Adım**: "Yetki Yönetimi" sekmesine git
3. **Adım**: Bir kullanıcı seç
4. **Adım**: "Lead Scoring" modülünü kontrol et
5. **Beklenen Sonuç**: 
   - ✅ "Lead Scoring" modülü listede görünmeli
   - ✅ Yetki verilebilmeli (Görüntüle, Oluştur, Düzenle, Sil)
   - ✅ Yetki kaydedilebilmeli

#### Test 4.2: Email Templates Modülü Yetkisi
1. **Adım**: Admin panel'de "E-posta Şablonları" modülünü kontrol et
2. **Beklenen Sonuç**: 
   - ✅ "E-posta Şablonları" modülü listede görünmeli
   - ✅ Yetki verilebilmeli
   - ✅ Yetki kaydedilebilmeli

---

## 🔍 VERİTABANI KONTROLLERİ

### 1. Deal Tablosu Kontrolü
```sql
-- Lead source kolonu var mı?
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Deal' AND column_name = 'leadSource';

-- Priority score kolonu var mı?
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Deal' AND column_name = 'priorityScore';

-- isPriority kolonu var mı?
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Deal' AND column_name = 'isPriority';
```

### 2. EmailTemplate Tablosu Kontrolü
```sql
-- EmailTemplate tablosu var mı?
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'EmailTemplate';

-- Kolonlar doğru mu?
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'EmailTemplate';
```

### 3. Trigger Kontrolü
```sql
-- Trigger var mı?
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trigger_auto_calculate_priority_score';
```

### 4. Fonksiyon Kontrolü
```sql
-- Fonksiyonlar var mı?
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name IN ('calculate_priority_score', 'auto_calculate_priority_score');
```

---

## ✅ BAŞARILI TEST SONUÇLARI

### Lead Source Tracking
- ✅ Deal form'unda lead source dropdown görünüyor
- ✅ Deal kaydedildiğinde lead source kaydediliyor
- ✅ Lead source bazlı filtreleme çalışıyor

### Lead Scoring
- ✅ Yeni deal oluşturulduğunda priority score otomatik hesaplanıyor
- ✅ Deal güncellendiğinde priority score yeniden hesaplanıyor
- ✅ Deal status CLOSED olduğunda priority score 0 oluyor
- ✅ Priority score formülü doğru çalışıyor

### Email Templates
- ✅ EmailTemplate tablosu oluşturuldu
- ✅ API endpoint'leri çalışıyor (GET, POST, PUT, DELETE)
- ✅ Template oluşturma, güncelleme, silme çalışıyor
- ✅ Kategori filtreleme çalışıyor

### Admin Panel
- ✅ Lead Scoring modülü listede görünüyor
- ✅ Email Templates modülü listede görünüyor
- ✅ Yetki yönetimi çalışıyor

---

## ⚠️ HATA DURUMLARI

### Eğer Priority Score Hesaplanmıyorsa:
1. Trigger'ın çalıştığını kontrol et
2. `calculate_priority_score` fonksiyonunun var olduğunu kontrol et
3. Deal'ın status'unun OPEN olduğunu kontrol et
4. Console'da hata var mı kontrol et

### Eğer Lead Source Kaydedilmiyorsa:
1. Deal form'unda lead source dropdown'ının göründüğünü kontrol et
2. API endpoint'ine leadSource gönderildiğini kontrol et
3. Database'de kolonun var olduğunu kontrol et

### Eğer Email Templates Çalışmıyorsa:
1. EmailTemplate tablosunun oluşturulduğunu kontrol et
2. API endpoint'lerinin çalıştığını kontrol et
3. RLS politikalarının doğru olduğunu kontrol et

---

## 📝 TEST RAPORU

Test sonuçlarını buraya yaz:

### Test Tarihi: ___________

#### Lead Source Tracking
- [ ] Test 1.1: Deal form'unda lead source seçimi
- [ ] Test 1.2: Deal kaydetme ve lead source kontrolü
- [ ] Test 1.3: Lead source bazlı filtreleme

#### Lead Scoring
- [ ] Test 2.1: Yeni deal oluşturma ve priority score hesaplama
- [ ] Test 2.2: Deal güncelleme ve priority score yeniden hesaplama
- [ ] Test 2.3: Deal status değişikliği (OPEN → CLOSED)
- [ ] Test 2.4: Priority score formülü kontrolü

#### Email Templates
- [ ] Test 3.1: Email template oluşturma (API)
- [ ] Test 3.2: Email template listeleme (API)
- [ ] Test 3.3: Email template güncelleme (API)
- [ ] Test 3.4: Email template silme (API)
- [ ] Test 3.5: Email template kategori filtreleme

#### Admin Panel
- [ ] Test 4.1: Lead Scoring modülü yetkisi
- [ ] Test 4.2: Email Templates modülü yetkisi

---

**Not**: Tüm testler başarılı olursa, sistem hazır demektir! 🎉










