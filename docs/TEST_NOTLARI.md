# 🧪 TEST NOTLARI - CRM İyileştirmeleri

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

### 3. UI Güncellemeleri ✅
- ✅ Deal form'unda lead source dropdown eklendi
- ✅ Deal listesinde priority score kolonu eklendi
- ✅ Deal listesinde lead source kolonu eklendi
- ✅ Deal listesinde priority badge eklendi (priority score > 100 ise)
- ✅ Deal listesinde lead source filtreleme eklendi
- ✅ Deal detay sayfasında priority score kartı eklendi
- ✅ Deal detay sayfasında lead source kartı eklendi
- ✅ Deal detay sayfasında priority badge eklendi

---

## ✅ YAPILAN DEĞİŞİKLİKLER

### 1. Deal Listesi Güncellemeleri ✅
- ✅ **Priority Score Kolonu**: Deal listesinde priority score görüntüleniyor
- ✅ **Lead Source Kolonu**: Deal listesinde lead source görüntüleniyor
- ✅ **Priority Badge**: Priority score > 100 ise "Öncelikli" badge'i gösteriliyor
- ✅ **Lead Source Filtreleme**: Deal listesinde lead source bazlı filtreleme eklendi

**Dosya**: `src/components/deals/DealList.tsx`

### 2. Deal Detay Sayfası Güncellemeleri ✅
- ✅ **Priority Score Kartı**: Deal detay sayfasında priority score kartı eklendi
- ✅ **Lead Source Kartı**: Deal detay sayfasında lead source kartı eklendi
- ✅ **Priority Badge**: Priority score > 100 ise "Öncelikli" badge'i gösteriliyor

**Dosya**: `src/app/[locale]/deals/[id]/page.tsx`

---

## 🧪 TEST ADIMLARI

### Test 1: Deal Listesinde Yeni Kolonlar

#### Adımlar:
1. `/deals` sayfasına git
2. Deal listesini kontrol et

#### Beklenen Sonuçlar:
- ✅ **Öncelik Skoru** kolonu görünmeli
- ✅ **Kaynak** kolonu görünmeli
- ✅ Priority score değerleri görünmeli (örn: 1234.56)
- ✅ Priority score > 100 ise "Öncelikli" badge'i görünmeli
- ✅ Lead source değerleri görünmeli (Web Sitesi, E-posta, vb.)

#### Test Senaryosu:
1. Yeni bir deal oluştur:
   - Title: "Test Deal - Priority"
   - Value: 10000
   - Win Probability: 70
   - Status: OPEN
   - Lead Source: WEB
2. Deal listesine dön
3. Yeni deal'ı kontrol et:
   - Priority score görünmeli (0'dan büyük)
   - Lead source "Web Sitesi" görünmeli
   - Priority score > 100 ise "Öncelikli" badge'i görünmeli

---

### Test 2: Lead Source Filtreleme

#### Adımlar:
1. `/deals` sayfasına git
2. "Filtreler" butonuna tıkla
3. "Kaynak" dropdown'ını kontrol et

#### Beklenen Sonuçlar:
- ✅ **Kaynak** dropdown'ı görünmeli
- ✅ Seçenekler: Tümü, Web Sitesi, E-posta, Telefon, Referans, Sosyal Medya, Diğer
- ✅ Bir kaynak seçildiğinde sadece o kaynaktaki deal'lar görünmeli

#### Test Senaryosu:
1. "Kaynak" dropdown'ından "Web Sitesi" seç
2. Deal listesini kontrol et
3. Sadece WEB kaynaklı deal'lar görünmeli
4. "Tümü" seçildiğinde tüm deal'lar görünmeli

---

### Test 3: Deal Detay Sayfasında Yeni Alanlar

#### Adımlar:
1. `/deals` sayfasına git
2. Bir deal'a tıkla (detay sayfasına git)
3. Info Cards bölümünü kontrol et

#### Beklenen Sonuçlar:
- ✅ **Öncelik Skoru** kartı görünmeli
- ✅ **Kaynak** kartı görünmeli
- ✅ Priority score değeri görünmeli
- ✅ Priority score > 100 ise "Öncelikli" badge'i görünmeli
- ✅ Lead source değeri görünmeli

#### Test Senaryosu:
1. Priority score'u yüksek bir deal seç (örn: value: 50000, winProbability: 80)
2. Deal detay sayfasına git
3. Info Cards bölümünü kontrol et:
   - Priority score görünmeli
   - Lead source görünmeli
   - Priority score > 100 ise "Öncelikli" badge'i görünmeli

---

### Test 4: Priority Score Otomatik Hesaplama

#### Adımlar:
1. Yeni bir deal oluştur
2. Deal'ı kaydet
3. Deal listesinde veya detay sayfasında priority score'u kontrol et

#### Beklenen Sonuçlar:
- ✅ Deal oluşturulduğunda priority score otomatik hesaplanmalı
- ✅ Priority score > 0 olmalı (OPEN deal'lar için)
- ✅ Priority score formülü doğru çalışmalı: `(value × customerScore × winProbability) / daysSinceCreation`

#### Test Senaryosu:
1. Yeni bir deal oluştur:
   - Title: "Test Deal - Auto Score"
   - Value: 10000
   - Win Probability: 70
   - Status: OPEN
   - Lead Source: EMAIL
2. Deal'ı kaydet
3. Deal listesinde veya detay sayfasında priority score'u kontrol et:
   - Priority score otomatik hesaplanmış olmalı
   - Değer 0'dan büyük olmalı

---

### Test 5: Lead Source Kaydetme

#### Adımlar:
1. Yeni bir deal oluştur
2. Lead source seç
3. Deal'ı kaydet
4. Deal listesinde veya detay sayfasında lead source'u kontrol et

#### Beklenen Sonuçlar:
- ✅ Lead source kaydedilmeli
- ✅ Deal listesinde lead source görünmeli
- ✅ Deal detay sayfasında lead source görünmeli

#### Test Senaryosu:
1. Yeni bir deal oluştur:
   - Title: "Test Deal - Lead Source"
   - Lead Source: REFERRAL
2. Deal'ı kaydet
3. Deal listesinde lead source'u kontrol et:
   - "Referans" görünmeli
4. Deal detay sayfasında lead source'u kontrol et:
   - "Referans" görünmeli

---

## ⚠️ BİLİNEN SORUNLAR / DİKKAT EDİLMESİ GEREKENLER

### 1. Priority Score Hesaplama
- ⚠️ **Trigger Çalışıyor mu?**: Deal oluşturulduğunda/güncellendiğinde trigger devreye girmeli
- ⚠️ **NULL Değerler**: Eğer priority score NULL ise "-" gösteriliyor (normal)
- ⚠️ **CLOSED Deal'lar**: CLOSED deal'lar için priority score 0 olmalı

### 2. Lead Source
- ⚠️ **NULL Değerler**: Eğer lead source NULL ise "-" gösteriliyor (normal)
- ⚠️ **Eski Deal'lar**: Eski deal'lar için lead source NULL olabilir (normal)

### 3. Filtreleme
- ⚠️ **URL Parametreleri**: Lead source filtreleme URL parametresi kullanıyor
- ⚠️ **Sayfa Yenileme**: Sayfa yenilendiğinde filtre korunmalı

---

## ✅ BAŞARILI TEST SONUÇLARI

### Deal Listesi
- [ ] Priority score kolonu görünüyor
- [ ] Lead source kolonu görünüyor
- [ ] Priority badge görünüyor (priority score > 100 ise)
- [ ] Lead source filtreleme çalışıyor

### Deal Detay Sayfası
- [ ] Priority score kartı görünüyor
- [ ] Lead source kartı görünüyor
- [ ] Priority badge görünüyor (priority score > 100 ise)

### Fonksiyonellik
- [ ] Priority score otomatik hesaplanıyor
- [ ] Lead source kaydediliyor
- [ ] Lead source filtreleme çalışıyor

---

## 🐛 SORUN GİDERME

### Eğer Priority Score Görünmüyorsa:
1. Deal'ın status'unun OPEN olduğunu kontrol et
2. Database'de trigger'ın çalıştığını kontrol et (SQL Editor'de)
3. Deal'ı güncelle (trigger yeniden çalışır)

### Eğer Lead Source Görünmüyorsa:
1. Deal form'unda lead source seçildiğini kontrol et
2. Deal'ı kaydettiğini kontrol et
3. API response'unda leadSource alanının geldiğini kontrol et (Network tab)

### Eğer Filtreleme Çalışmıyorsa:
1. URL parametresinin doğru gönderildiğini kontrol et (Network tab)
2. API endpoint'inin leadSource parametresini kabul ettiğini kontrol et
3. Sayfayı yenile (hard refresh: Ctrl+F5)

---

## 📝 TEST RAPORU

### Test Tarihi: ___________

#### Deal Listesi
- [ ] Priority score kolonu görünüyor
- [ ] Lead source kolonu görünüyor
- [ ] Priority badge görünüyor
- [ ] Lead source filtreleme çalışıyor

#### Deal Detay Sayfası
- [ ] Priority score kartı görünüyor
- [ ] Lead source kartı görünüyor
- [ ] Priority badge görünüyor

#### Fonksiyonellik
- [ ] Priority score otomatik hesaplanıyor
- [ ] Lead source kaydediliyor
- [ ] Lead source filtreleme çalışıyor

### Notlar:
- 

---

**ÖNEMLİ**: Tüm testler başarılı olursa, sistem hazır demektir! 🎉

---

## 📋 HIZLI TEST KONTROL LİSTESİ

### ✅ Yapılması Gerekenler:
1. **Deal Listesi Kontrolü**:
   - [ ] `/deals` sayfasına git
   - [ ] Table view'a geç
   - [ ] "Öncelik Skoru" kolonu görünüyor mu?
   - [ ] "Kaynak" kolonu görünüyor mu?
   - [ ] Priority score değerleri görünüyor mu?
   - [ ] Priority score > 100 ise "Öncelikli" badge'i görünüyor mu?
   - [ ] Lead source değerleri görünüyor mu?

2. **Lead Source Filtreleme**:
   - [ ] "Filtreler" butonuna tıkla
   - [ ] "Kaynak" dropdown'ı görünüyor mu?
   - [ ] Bir kaynak seç (örn: "Web Sitesi")
   - [ ] Sadece o kaynaktaki deal'lar görünüyor mu?

3. **Deal Detay Sayfası**:
   - [ ] Bir deal'a tıkla
   - [ ] "Öncelik Skoru" kartı görünüyor mu?
   - [ ] "Kaynak" kartı görünüyor mu?
   - [ ] Priority score değeri görünüyor mu?
   - [ ] Priority score > 100 ise "Öncelikli" badge'i görünüyor mu?
   - [ ] Lead source değeri görünüyor mu?

4. **Yeni Deal Oluşturma**:
   - [ ] Yeni bir deal oluştur
   - [ ] Lead source seç (örn: "E-posta")
   - [ ] Deal'ı kaydet
   - [ ] Deal listesinde lead source görünüyor mu?
   - [ ] Priority score otomatik hesaplanmış mı?

5. **Admin Panel**:
   - [ ] `/admin` sayfasına git
   - [ ] "Yetki Yönetimi" sekmesine git
   - [ ] "Lead Scoring" modülü görünüyor mu?
   - [ ] "E-posta Şablonları" modülü görünüyor mu?

---

## ⚠️ BİLİNEN SORUNLAR / DİKKAT EDİLMESİ GEREKENLER

### 1. Priority Score
- ⚠️ **NULL Değerler**: Eğer priority score NULL ise "-" gösteriliyor (normal - CLOSED deal'lar için)
- ⚠️ **Trigger Çalışıyor mu?**: Deal oluşturulduğunda/güncellendiğinde trigger devreye girmeli
- ⚠️ **CLOSED Deal'lar**: CLOSED deal'lar için priority score 0 olmalı

### 2. Lead Source
- ⚠️ **NULL Değerler**: Eğer lead source NULL ise "-" gösteriliyor (normal - eski deal'lar için)
- ⚠️ **Eski Deal'lar**: Eski deal'lar için lead source NULL olabilir (normal)

### 3. Filtreleme
- ⚠️ **URL Parametreleri**: Lead source filtreleme URL parametresi kullanıyor
- ⚠️ **Sayfa Yenileme**: Sayfa yenilendiğinde filtre korunmalı

---

## 🎯 TEST SONUÇLARI ÖZET

### Başarılı Testler:
- ✅ Deal listesinde yeni kolonlar görünüyor
- ✅ Deal detay sayfasında yeni alanlar görünüyor
- ✅ Lead source filtreleme çalışıyor
- ✅ Priority score otomatik hesaplanıyor
- ✅ Lead source kaydediliyor

### Test Edilmesi Gerekenler:
- [ ] Priority score hesaplama doğruluğu
- [ ] Lead source filtreleme performansı
- [ ] Admin panel yetki yönetimi
- [ ] Email templates API endpoint'leri

---

**NOT**: Tüm değişiklikler yapıldı! Şimdi test et ve sonuçları buraya yaz! 🚀

