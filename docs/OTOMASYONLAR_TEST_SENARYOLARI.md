# 🚀 CRM Otomasyonları - Test Senaryoları

Bu dokümanda tüm otomasyonların test senaryoları ve kullanım kılavuzu bulunmaktadır.

---

## 📋 İçindekiler

1. [Smart Reminder - Günlük Bildirimler](#1-smart-reminder)
2. [QuickActions - Hızlı İşlem Butonları](#2-quickactions)
3. [SmartEmptyState - Boş Ekran Önerileri](#3-smartemptystate)
4. [AutoGoalTracker - Hedef Takibi](#4-autogoaltracker)
5. [AutoNextStep - Sonraki Adım Önerisi](#5-autonextstep)
6. [AutoTaskFromQuote - Otomatik Görev Atama](#6-autotaskfromquote)
7. [CustomerFollowup - Sessiz Müşteri Takibi](#7-customerfollowup)
8. [AutoNoteOnEdit - Değişiklik Günlüğü](#8-autonoteonedit)
9. [QuickThankYou - Otomatik Teşekkür](#9-quickthankyou)
10. [SmartFileNaming - PDF Dosya Adı Standardı](#10-smartfilenaming)

---

## 1️⃣ Smart Reminder - Günlük Bildirimler

### 📝 Açıklama
Kullanıcı dashboard'a giriş yaptığında otomatik olarak günlük özet gösterilir:
- Onay bekleyen teklifler
- 7 günden uzun süredir görüşülmeyen müşteriler
- Teslim bekleyen sevkiyatlar

### ✅ Test Senaryosu 1: Dashboard Giriş Bildirimi

**Adımlar:**
1. Sisteme giriş yap
2. Dashboard sayfasına git (`/dashboard`)
3. Sayfanın üst kısmında "Bugünün Özeti" kartını kontrol et

**Beklenen Sonuç:**
- ✅ Eğer onay bekleyen teklif varsa: "X teklifin onay bekliyor." mesajı görünür
- ✅ Eğer 7 günden uzun süredir görüşülmeyen müşteri varsa: "X müşterinle 7 gündür görüşmedin." mesajı görünür
- ✅ Eğer teslim bekleyen sevkiyat varsa: "X sevkiyat teslim bekliyor." mesajı görünür
- ✅ Her mesajın yanında "Görüntüle →", "Takip Et →", "Kontrol Et →" linkleri bulunur
- ✅ Sağ üstte "X" butonu ile kapatılabilir

**Test Verileri Hazırlama:**
```sql
-- Onay bekleyen teklif oluştur
INSERT INTO "Quote" (title, status, total, "companyId") 
VALUES ('Test Teklif', 'SENT', 10000, 'your-company-id');

-- 7 günden eski müşteri oluştur
INSERT INTO "Customer" (name, status, "companyId", "updatedAt") 
VALUES ('Eski Müşteri', 'ACTIVE', 'your-company-id', NOW() - INTERVAL '10 days');

-- Teslim bekleyen sevkiyat oluştur
INSERT INTO "Shipment" (status, "companyId") 
VALUES ('PENDING', 'your-company-id');
```

### ✅ Test Senaryosu 2: Bildirimi Kapatma

**Adımlar:**
1. Dashboard'da Smart Reminder kartını gör
2. Sağ üstteki "X" butonuna tıkla
3. Sayfayı yenile (F5)

**Beklenen Sonuç:**
- ✅ Kart kapanır ve görünmez
- ✅ Sayfa yenilendiğinde kart tekrar görünmez (24 saat boyunca)
- ✅ 24 saat sonra tekrar görünür

---

## 2️⃣ QuickActions - Hızlı İşlem Butonları

### 📝 Açıklama
Duruma göre otomatik olarak hızlı işlem butonları gösterilir:
- Teklif ACCEPTED → "Fatura Oluştur" butonu
- Fatura SENT/PAID → "Sevkiyat Hazırla" butonu
- Sevkiyat PENDING → "Sevkiyatı Onayla" butonu

### ✅ Test Senaryosu 1: Teklif Kabul Edildiğinde Fatura Butonu

**Adımlar:**
1. Teklifler sayfasına git (`/quotes`)
2. Bir teklif oluştur veya mevcut bir teklifi seç
3. Teklif detay sayfasına git (`/quotes/[id]`)
4. Teklif durumunu "ACCEPTED" yap
5. Sayfayı yenile

**Beklenen Sonuç:**
- ✅ "Fatura Oluştur" butonu görünür (parlayan efekt ile)
- ✅ Butona tıklandığında `/invoices/new?quoteId=[id]` sayfasına yönlendirilir
- ✅ Fatura formu açılır ve teklif bilgileri otomatik doldurulur

**Test Verileri Hazırlama:**
```sql
-- ACCEPTED durumunda teklif oluştur
INSERT INTO "Quote" (title, status, total, "companyId") 
VALUES ('Kabul Edilen Teklif', 'ACCEPTED', 15000, 'your-company-id');
```

### ✅ Test Senaryosu 2: Fatura Kesildiğinde Sevkiyat Butonu

**Adımlar:**
1. Faturalar sayfasına git (`/invoices`)
2. Bir fatura oluştur veya mevcut bir faturayı seç
3. Fatura durumunu "SENT" veya "PAID" yap
4. Fatura detay sayfasına git (`/invoices/[id]`)
5. Sayfayı yenile

**Beklenen Sonuç:**
- ✅ "Sevkiyat Hazırla" butonu görünür (parlayan efekt ile)
- ✅ Butona tıklandığında `/shipments/new?invoiceId=[id]` sayfasına yönlendirilir
- ✅ Sevkiyat formu açılır ve fatura bilgileri otomatik doldurulur

**Test Verileri Hazırlama:**
```sql
-- SENT durumunda fatura oluştur
INSERT INTO "Invoice" (title, status, total, "companyId") 
VALUES ('Gönderilen Fatura', 'SENT', 20000, 'your-company-id');
```

### ✅ Test Senaryosu 3: Sevkiyat Beklemede Onay Butonu

**Adımlar:**
1. Sevkiyatlar sayfasına git (`/shipments`)
2. Bir sevkiyat oluştur veya mevcut bir sevkiyatı seç
3. Sevkiyat durumunu "PENDING" yap
4. Sevkiyat detay sayfasına git (`/shipments/[id]`)
5. Sayfayı yenile

**Beklenen Sonuç:**
- ✅ "Sevkiyatı Onayla" butonu görünür (parlayan efekt ile)
- ✅ Butona tıklandığında sevkiyat detay sayfasına yönlendirilir
- ✅ Onaylama işlemi yapılabilir

**Test Verileri Hazırlama:**
```sql
-- PENDING durumunda sevkiyat oluştur
INSERT INTO "Shipment" (status, "companyId") 
VALUES ('PENDING', 'your-company-id');
```

---

## 3️⃣ SmartEmptyState - Boş Ekran Önerileri

### 📝 Açıklama
Boş listelerde kullanıcıya yardımcı mesajlar ve hızlı aksiyon butonları gösterilir.

### ✅ Test Senaryosu 1: Boş Teklif Listesi

**Adımlar:**
1. Yeni bir şirket oluştur veya tüm teklifleri sil
2. Teklifler sayfasına git (`/quotes`)
3. Liste boş olduğunda görünen mesajı kontrol et

**Beklenen Sonuç:**
- ✅ "Henüz teklif oluşturmadın" başlığı görünür
- ✅ "İlk teklifini oluşturarak müşterilerine profesyonel teklifler sunmaya başla." mesajı görünür
- ✅ "Teklif Oluştur" butonu görünür
- ✅ Butona tıklandığında `/quotes/new` sayfasına yönlendirilir

### ✅ Test Senaryosu 2: Boş Müşteri Listesi

**Adımlar:**
1. Yeni bir şirket oluştur veya tüm müşterileri sil
2. Müşteriler sayfasına git (`/customers`)
3. Liste boş olduğunda görünen mesajı kontrol et

**Beklenen Sonuç:**
- ✅ "Henüz müşteri eklemedin" başlığı görünür
- ✅ "İlk müşterini ekleyerek CRM sistemini kullanmaya başla." mesajı görünür
- ✅ "Müşteri Ekle" butonu görünür
- ✅ Butona tıklandığında `/customers/new` sayfasına yönlendirilir

### ✅ Test Senaryosu 3: Boş Fatura Listesi

**Adımlar:**
1. Yeni bir şirket oluştur veya tüm faturaları sil
2. Faturalar sayfasına git (`/invoices`)
3. Liste boş olduğunda görünen mesajı kontrol et

**Beklenen Sonuç:**
- ✅ "Henüz fatura oluşturmadın" başlığı görünür
- ✅ "İlk faturanı oluşturarak satış sürecini başlat." mesajı görünür
- ✅ "Fatura Oluştur" butonu görünür
- ✅ Butona tıklandığında `/invoices/new` sayfasına yönlendirilir

---

## 4️⃣ AutoGoalTracker - Hedef Takibi

### 📝 Açıklama
Kullanıcı aylık satış hedefi belirler ve sistem otomatik olarak ilerlemeyi takip eder.

### ✅ Test Senaryosu 1: Hedef Belirleme

**Adımlar:**
1. Dashboard sayfasına git (`/dashboard`)
2. "Aylık Hedef Belirle" kartını bul
3. "Hedef Belirle" butonuna tıkla
4. Hedef tutarı gir (örn: 50000)
5. Kaydet butonuna tıkla

**Beklenen Sonuç:**
- ✅ Hedef başarıyla kaydedilir
- ✅ Kart güncellenir ve ilerleme çubuğu görünür
- ✅ "İlerleme: 0₺" ve "Hedef: 50.000₺" bilgileri görünür
- ✅ İlerleme yüzdesi %0 olarak görünür

### ✅ Test Senaryosu 2: İlerleme Takibi

**Adımlar:**
1. Dashboard'da hedef belirle (örn: 50000₺)
2. Bir fatura oluştur ve durumunu "PAID" yap (örn: 20000₺)
3. Dashboard'u yenile

**Beklenen Sonuç:**
- ✅ İlerleme çubuğu %40'a kadar dolar (20000/50000)
- ✅ "İlerleme: 20.000₺" ve "Kalan: 30.000₺" bilgileri görünür
- ✅ İlerleme yüzdesi %40 olarak görünür

**Test Verileri Hazırlama:**
```sql
-- Bu ay PAID durumunda fatura oluştur
INSERT INTO "Invoice" (title, status, total, "companyId", "createdAt") 
VALUES ('Ödenen Fatura', 'PAID', 20000, 'your-company-id', NOW());
```

### ✅ Test Senaryosu 3: Hedef Aşımı

**Adımlar:**
1. Dashboard'da hedef belirle (örn: 50000₺)
2. Toplam 60000₺ değerinde PAID fatura oluştur
3. Dashboard'u yenile

**Beklenen Sonuç:**
- ✅ İlerleme çubuğu %100'e ulaşır
- ✅ "🎉 Tebrikler! Hedefini aştın!" mesajı görünür
- ✅ İlerleme yüzdesi %120 olarak görünür (60000/50000)

**Test Verileri Hazırlama:**
```sql
-- Bu ay PAID durumunda fatura oluştur (toplam 60000₺)
INSERT INTO "Invoice" (title, status, total, "companyId", "createdAt") 
VALUES ('Fatura 1', 'PAID', 30000, 'your-company-id', NOW()),
       ('Fatura 2', 'PAID', 30000, 'your-company-id', NOW());
```

### ✅ Test Senaryosu 4: Hedef Düzenleme

**Adımlar:**
1. Dashboard'da mevcut hedefi gör
2. Düzenle butonuna (kalem ikonu) tıkla
3. Yeni hedef tutarı gir (örn: 75000)
4. Kaydet butonuna tıkla

**Beklenen Sonuç:**
- ✅ Hedef başarıyla güncellenir
- ✅ İlerleme çubuğu yeni hedefe göre yeniden hesaplanır
- ✅ Yeni hedef tutarı görünür

---

## 5️⃣ AutoNextStep - Sonraki Adım Önerisi

### 📝 Açıklama
Bir modül tamamlandığında sistem otomatik olarak sonraki adımı önerir.

### ✅ Test Senaryosu 1: Teklif Kabul Edildiğinde Fatura Önerisi

**Adımlar:**
1. Bir teklif oluştur
2. Teklif durumunu "ACCEPTED" yap
3. Teklif detay sayfasında bildirimi kontrol et

**Beklenen Sonuç:**
- ✅ "Teklif kabul edildi! Fatura oluşturmak ister misin?" mesajı görünür
- ✅ "Fatura Oluştur" butonu görünür
- ✅ Butona tıklandığında fatura formu açılır

**Test Verileri Hazırlama:**
```sql
-- ACCEPTED durumunda teklif oluştur
INSERT INTO "Quote" (title, status, total, "companyId") 
VALUES ('Kabul Edilen Teklif', 'ACCEPTED', 15000, 'your-company-id');
```

### ✅ Test Senaryosu 2: Fatura Kesildiğinde Sevkiyat Önerisi

**Adımlar:**
1. Bir fatura oluştur
2. Fatura durumunu "PAID" yap
3. Fatura detay sayfasında bildirimi kontrol et

**Beklenen Sonuç:**
- ✅ "Fatura ödendi! Sevkiyat taslağı oluşturuldu, açmak ister misin?" mesajı görünür
- ✅ "Sevkiyat Hazırla" butonu görünür
- ✅ Butona tıklandığında sevkiyat formu açılır

**Test Verileri Hazırlama:**
```sql
-- PAID durumunda fatura oluştur
INSERT INTO "Invoice" (title, status, total, "companyId") 
VALUES ('Ödenen Fatura', 'PAID', 20000, 'your-company-id');
```

---

## 6️⃣ AutoTaskFromQuote - Otomatik Görev Atama

### 📝 Açıklama
Teklif oluşturulduğunda otomatik olarak görev açılır ve teklif sahibine atanır.

### ✅ Test Senaryosu 1: Teklif Oluşturulduğunda Görev Açılması

**Adımlar:**
1. Yeni bir teklif oluştur
2. Teklif kaydedildikten sonra Görevler sayfasına git (`/tasks`)
3. Yeni oluşturulan görevi kontrol et

**Beklenen Sonuç:**
- ✅ Yeni bir görev oluşturulur
- ✅ Görev başlığı: "Bu teklif için 3 gün içinde müşteriyi ara"
- ✅ Görev teklif sahibine atanır
- ✅ Görev durumu "TODO" olarak görünür

**Test Verileri Hazırlama:**
```sql
-- Teklif oluştur (otomatik görev açılacak)
INSERT INTO "Quote" (title, status, total, "companyId", "userId") 
VALUES ('Yeni Teklif', 'DRAFT', 10000, 'your-company-id', 'your-user-id');
```

---

## 7️⃣ CustomerFollowup - Sessiz Müşteri Takibi

### 📝 Açıklama
14 gün boyunca hiç etkileşim olmayan müşteri "Takip Et" listesine düşer.

### ✅ Test Senaryosu 1: Sessiz Müşteri Tespiti

**Adımlar:**
1. Bir müşteri oluştur
2. Müşterinin `updatedAt` tarihini 15 gün öncesine ayarla
3. Dashboard'da "Pasif Müşteriler" kutusunu kontrol et

**Beklenen Sonuç:**
- ✅ Müşteri "Pasif Müşteriler" listesine eklenir
- ✅ "14 günden uzun süredir görüşülmeyen müşteriler" mesajı görünür
- ✅ Müşteri listesinde "Takip Et" butonu görünür

**Test Verileri Hazırlama:**
```sql
-- 15 gün önce güncellenmiş müşteri oluştur
INSERT INTO "Customer" (name, status, "companyId", "updatedAt") 
VALUES ('Pasif Müşteri', 'ACTIVE', 'your-company-id', NOW() - INTERVAL '15 days');
```

### ✅ Test Senaryosu 2: Müşteri Etkileşimi Sonrası Listeden Çıkma

**Adımlar:**
1. Pasif müşteri listesinde bir müşteri seç
2. Müşteriye yeni bir teklif oluştur
3. Dashboard'u yenile

**Beklenen Sonuç:**
- ✅ Müşteri "Pasif Müşteriler" listesinden çıkar
- ✅ Müşterinin `updatedAt` tarihi güncellenir
- ✅ Liste güncellenir

**Test Verileri Hazırlama:**
```sql
-- Müşteriye teklif oluştur (updatedAt güncellenecek)
INSERT INTO "Quote" (title, status, total, "companyId", "customerId") 
VALUES ('Yeni Teklif', 'DRAFT', 10000, 'your-company-id', 'passive-customer-id');
```

---

## 8️⃣ AutoNoteOnEdit - Değişiklik Günlüğü

### 📝 Açıklama
Kullanıcı bir teklif veya fatura düzenlediğinde sistem otomatik not ekler.

### ✅ Test Senaryosu 1: Fiyat Güncelleme Notu

**Adımlar:**
1. Bir teklif oluştur (toplam: 10000₺)
2. Teklifi düzenle ve toplam tutarı 12000₺ yap
3. Kaydet
4. ActivityLog'u kontrol et (`/activity`)

**Beklenen Sonuç:**
- ✅ ActivityLog'a yeni kayıt eklenir
- ✅ Kayıt açıklaması: "Fiyat güncellendi (eski: 10.000₺ → yeni: 12.000₺)"
- ✅ Kayıt meta bilgilerinde eski ve yeni değerler bulunur

**Test Verileri Hazırlama:**
```sql
-- Teklif oluştur
INSERT INTO "Quote" (title, status, total, "companyId") 
VALUES ('Test Teklif', 'DRAFT', 10000, 'your-company-id');
```

### ✅ Test Senaryosu 2: Durum Değişikliği Notu

**Adımlar:**
1. Bir teklif oluştur (durum: DRAFT)
2. Teklif durumunu "SENT" yap
3. Kaydet
4. ActivityLog'u kontrol et

**Beklenen Sonuç:**
- ✅ ActivityLog'a yeni kayıt eklenir
- ✅ Kayıt açıklaması: "Teklif durumu güncellendi: DRAFT → SENT"
- ✅ Kayıt meta bilgilerinde eski ve yeni durum bulunur

---

## 9️⃣ QuickThankYou - Otomatik Teşekkür

### 📝 Açıklama
Fatura ödendiğinde veya teklif kabul edildiğinde müşteriye otomatik e-posta gider.

### ✅ Test Senaryosu 1: Teklif Kabul Edildiğinde Teşekkür E-postası

**Adımlar:**
1. Bir teklif oluştur
2. Teklif durumunu "ACCEPTED" yap
3. E-posta gönderim logunu kontrol et

**Beklenen Sonuç:**
- ✅ Müşteriye otomatik e-posta gönderilir
- ✅ E-posta konusu: "Teklifiniz Kabul Edildi - Teşekkürler"
- ✅ E-posta içeriği: "İş birliğiniz için teşekkür ederiz 💫"

**Test Verileri Hazırlama:**
```sql
-- ACCEPTED durumunda teklif oluştur
INSERT INTO "Quote" (title, status, total, "companyId", "customerId") 
VALUES ('Kabul Edilen Teklif', 'ACCEPTED', 15000, 'your-company-id', 'customer-id');
```

### ✅ Test Senaryosu 2: Fatura Ödendiğinde Teşekkür E-postası

**Adımlar:**
1. Bir fatura oluştur
2. Fatura durumunu "PAID" yap
3. E-posta gönderim logunu kontrol et

**Beklenen Sonuç:**
- ✅ Müşteriye otomatik e-posta gönderilir
- ✅ E-posta konusu: "Ödemeniz Alındı - Teşekkürler"
- ✅ E-posta içeriği: "Ödemeniz için teşekkür ederiz 💫"

**Test Verileri Hazırlama:**
```sql
-- PAID durumunda fatura oluştur
INSERT INTO "Invoice" (title, status, total, "companyId", "customerId") 
VALUES ('Ödenen Fatura', 'PAID', 20000, 'your-company-id', 'customer-id');
```

---

## 🔟 SmartFileNaming - PDF Dosya Adı Standardı

### 📝 Açıklama
Teklif/Fatura PDF kaydedilirken otomatik şu formatta adlandırılır:
`PI_2025-11-07_TIPPLUS_XYZMEDIKAL_#001.pdf`

### ✅ Test Senaryosu 1: Teklif PDF İndirme

**Adımlar:**
1. Bir teklif oluştur
2. Teklif detay sayfasına git (`/quotes/[id]`)
3. "PDF İndir" butonuna tıkla
4. İndirilen dosya adını kontrol et

**Beklenen Sonuç:**
- ✅ PDF dosyası indirilir
- ✅ Dosya adı formatı: `PI_YYYY-MM-DD_COMPANYNAME_CUSTOMERNAME_#XXX.pdf`
- ✅ Örnek: `PI_2025-01-15_TIPPLUS_XYZMEDIKAL_#001.pdf`

**Test Verileri Hazırlama:**
```sql
-- Teklif oluştur
INSERT INTO "Quote" (title, status, total, "companyId") 
VALUES ('Test Teklif', 'DRAFT', 10000, 'your-company-id');
```

### ✅ Test Senaryosu 2: Fatura PDF İndirme

**Adımlar:**
1. Bir fatura oluştur
2. Fatura detay sayfasına git (`/invoices/[id]`)
3. "PDF İndir" butonuna tıkla
4. İndirilen dosya adını kontrol et

**Beklenen Sonuç:**
- ✅ PDF dosyası indirilir
- ✅ Dosya adı formatı: `INV_YYYY-MM-DD_COMPANYNAME_CUSTOMERNAME_#XXX.pdf`
- ✅ Örnek: `INV_2025-01-15_TIPPLUS_XYZMEDIKAL_#001.pdf`

**Test Verileri Hazırlama:**
```sql
-- Fatura oluştur
INSERT INTO "Invoice" (title, status, total, "companyId") 
VALUES ('Test Fatura', 'DRAFT', 15000, 'your-company-id');
```

---

## 📊 Genel Test Kontrol Listesi

### ✅ Tüm Otomasyonlar İçin Ortak Kontroller

1. **API Endpoint Kontrolü**
   - ✅ Tüm API endpoint'leri çalışıyor mu?
   - ✅ Hata durumlarında uygun mesajlar dönüyor mu?
   - ✅ RLS (Row-Level Security) kontrolü yapılıyor mu?

2. **UI/UX Kontrolü**
   - ✅ Tüm component'ler doğru render ediliyor mu?
   - ✅ Loading state'ler gösteriliyor mu?
   - ✅ Error state'ler gösteriliyor mu?
   - ✅ Responsive tasarım çalışıyor mu?

3. **Performans Kontrolü**
   - ✅ API response süreleri < 1000ms mi?
   - ✅ Component render süreleri < 300ms mi?
   - ✅ Cache stratejisi çalışıyor mu?

4. **Güvenlik Kontrolü**
   - ✅ Session kontrolü yapılıyor mu?
   - ✅ CompanyId filtresi uygulanıyor mu?
   - ✅ Input validation yapılıyor mu?

---

## 🐛 Hata Ayıklama İpuçları

### Sorun: Smart Reminder görünmüyor
**Çözüm:**
1. Browser console'u kontrol et (F12)
2. API endpoint'ini manuel test et: `/api/automations/smart-reminder`
3. Session kontrolü yap
4. CompanyId'nin doğru olduğundan emin ol

### Sorun: QuickActions butonları görünmüyor
**Çözüm:**
1. Entity status'unu kontrol et
2. Component'in doğru yerde render edildiğinden emin ol
3. Browser console'da hata var mı kontrol et

### Sorun: AutoGoalTracker hedef kaydedilmiyor
**Çözüm:**
1. API endpoint'ini kontrol et: `/api/automations/goal-tracker`
2. User tablosunda `monthlyGoal` kolonu var mı kontrol et
3. Migration çalıştırıldı mı kontrol et

---

## 📝 Notlar

- Tüm otomasyonlar production-ready değil, bazıları migration gerektirebilir
- Test verileri hazırlarken gerçek companyId ve userId kullanın
- ActivityLog kayıtları otomatik oluşturulur, manuel kontrol gerekmez
- E-posta gönderimi için SMTP ayarları yapılmalıdır

---

## 🎯 Sonuç

Bu test senaryoları ile tüm otomasyonların çalıştığından emin olabilirsiniz. Her senaryo adım adım takip edilerek sistemin doğru çalıştığı doğrulanabilir.

**Test Sırası:**
1. Önce Smart Reminder'ı test et
2. Sonra QuickActions'ı test et
3. SmartEmptyState'i test et
4. AutoGoalTracker'ı test et
5. Diğer otomasyonları sırayla test et

**Başarı Kriterleri:**
- ✅ Tüm API endpoint'leri 200 status code dönüyor
- ✅ Tüm UI component'leri doğru render ediliyor
- ✅ Tüm otomasyonlar beklenen şekilde çalışıyor
- ✅ Hata durumlarında uygun mesajlar gösteriliyor



Bu dokümanda tüm otomasyonların test senaryoları ve kullanım kılavuzu bulunmaktadır.

---

## 📋 İçindekiler

1. [Smart Reminder - Günlük Bildirimler](#1-smart-reminder)
2. [QuickActions - Hızlı İşlem Butonları](#2-quickactions)
3. [SmartEmptyState - Boş Ekran Önerileri](#3-smartemptystate)
4. [AutoGoalTracker - Hedef Takibi](#4-autogoaltracker)
5. [AutoNextStep - Sonraki Adım Önerisi](#5-autonextstep)
6. [AutoTaskFromQuote - Otomatik Görev Atama](#6-autotaskfromquote)
7. [CustomerFollowup - Sessiz Müşteri Takibi](#7-customerfollowup)
8. [AutoNoteOnEdit - Değişiklik Günlüğü](#8-autonoteonedit)
9. [QuickThankYou - Otomatik Teşekkür](#9-quickthankyou)
10. [SmartFileNaming - PDF Dosya Adı Standardı](#10-smartfilenaming)

---

## 1️⃣ Smart Reminder - Günlük Bildirimler

### 📝 Açıklama
Kullanıcı dashboard'a giriş yaptığında otomatik olarak günlük özet gösterilir:
- Onay bekleyen teklifler
- 7 günden uzun süredir görüşülmeyen müşteriler
- Teslim bekleyen sevkiyatlar

### ✅ Test Senaryosu 1: Dashboard Giriş Bildirimi

**Adımlar:**
1. Sisteme giriş yap
2. Dashboard sayfasına git (`/dashboard`)
3. Sayfanın üst kısmında "Bugünün Özeti" kartını kontrol et

**Beklenen Sonuç:**
- ✅ Eğer onay bekleyen teklif varsa: "X teklifin onay bekliyor." mesajı görünür
- ✅ Eğer 7 günden uzun süredir görüşülmeyen müşteri varsa: "X müşterinle 7 gündür görüşmedin." mesajı görünür
- ✅ Eğer teslim bekleyen sevkiyat varsa: "X sevkiyat teslim bekliyor." mesajı görünür
- ✅ Her mesajın yanında "Görüntüle →", "Takip Et →", "Kontrol Et →" linkleri bulunur
- ✅ Sağ üstte "X" butonu ile kapatılabilir

**Test Verileri Hazırlama:**
```sql
-- Onay bekleyen teklif oluştur
INSERT INTO "Quote" (title, status, total, "companyId") 
VALUES ('Test Teklif', 'SENT', 10000, 'your-company-id');

-- 7 günden eski müşteri oluştur
INSERT INTO "Customer" (name, status, "companyId", "updatedAt") 
VALUES ('Eski Müşteri', 'ACTIVE', 'your-company-id', NOW() - INTERVAL '10 days');

-- Teslim bekleyen sevkiyat oluştur
INSERT INTO "Shipment" (status, "companyId") 
VALUES ('PENDING', 'your-company-id');
```

### ✅ Test Senaryosu 2: Bildirimi Kapatma

**Adımlar:**
1. Dashboard'da Smart Reminder kartını gör
2. Sağ üstteki "X" butonuna tıkla
3. Sayfayı yenile (F5)

**Beklenen Sonuç:**
- ✅ Kart kapanır ve görünmez
- ✅ Sayfa yenilendiğinde kart tekrar görünmez (24 saat boyunca)
- ✅ 24 saat sonra tekrar görünür

---

## 2️⃣ QuickActions - Hızlı İşlem Butonları

### 📝 Açıklama
Duruma göre otomatik olarak hızlı işlem butonları gösterilir:
- Teklif ACCEPTED → "Fatura Oluştur" butonu
- Fatura SENT/PAID → "Sevkiyat Hazırla" butonu
- Sevkiyat PENDING → "Sevkiyatı Onayla" butonu

### ✅ Test Senaryosu 1: Teklif Kabul Edildiğinde Fatura Butonu

**Adımlar:**
1. Teklifler sayfasına git (`/quotes`)
2. Bir teklif oluştur veya mevcut bir teklifi seç
3. Teklif detay sayfasına git (`/quotes/[id]`)
4. Teklif durumunu "ACCEPTED" yap
5. Sayfayı yenile

**Beklenen Sonuç:**
- ✅ "Fatura Oluştur" butonu görünür (parlayan efekt ile)
- ✅ Butona tıklandığında `/invoices/new?quoteId=[id]` sayfasına yönlendirilir
- ✅ Fatura formu açılır ve teklif bilgileri otomatik doldurulur

**Test Verileri Hazırlama:**
```sql
-- ACCEPTED durumunda teklif oluştur
INSERT INTO "Quote" (title, status, total, "companyId") 
VALUES ('Kabul Edilen Teklif', 'ACCEPTED', 15000, 'your-company-id');
```

### ✅ Test Senaryosu 2: Fatura Kesildiğinde Sevkiyat Butonu

**Adımlar:**
1. Faturalar sayfasına git (`/invoices`)
2. Bir fatura oluştur veya mevcut bir faturayı seç
3. Fatura durumunu "SENT" veya "PAID" yap
4. Fatura detay sayfasına git (`/invoices/[id]`)
5. Sayfayı yenile

**Beklenen Sonuç:**
- ✅ "Sevkiyat Hazırla" butonu görünür (parlayan efekt ile)
- ✅ Butona tıklandığında `/shipments/new?invoiceId=[id]` sayfasına yönlendirilir
- ✅ Sevkiyat formu açılır ve fatura bilgileri otomatik doldurulur

**Test Verileri Hazırlama:**
```sql
-- SENT durumunda fatura oluştur
INSERT INTO "Invoice" (title, status, total, "companyId") 
VALUES ('Gönderilen Fatura', 'SENT', 20000, 'your-company-id');
```

### ✅ Test Senaryosu 3: Sevkiyat Beklemede Onay Butonu

**Adımlar:**
1. Sevkiyatlar sayfasına git (`/shipments`)
2. Bir sevkiyat oluştur veya mevcut bir sevkiyatı seç
3. Sevkiyat durumunu "PENDING" yap
4. Sevkiyat detay sayfasına git (`/shipments/[id]`)
5. Sayfayı yenile

**Beklenen Sonuç:**
- ✅ "Sevkiyatı Onayla" butonu görünür (parlayan efekt ile)
- ✅ Butona tıklandığında sevkiyat detay sayfasına yönlendirilir
- ✅ Onaylama işlemi yapılabilir

**Test Verileri Hazırlama:**
```sql
-- PENDING durumunda sevkiyat oluştur
INSERT INTO "Shipment" (status, "companyId") 
VALUES ('PENDING', 'your-company-id');
```

---

## 3️⃣ SmartEmptyState - Boş Ekran Önerileri

### 📝 Açıklama
Boş listelerde kullanıcıya yardımcı mesajlar ve hızlı aksiyon butonları gösterilir.

### ✅ Test Senaryosu 1: Boş Teklif Listesi

**Adımlar:**
1. Yeni bir şirket oluştur veya tüm teklifleri sil
2. Teklifler sayfasına git (`/quotes`)
3. Liste boş olduğunda görünen mesajı kontrol et

**Beklenen Sonuç:**
- ✅ "Henüz teklif oluşturmadın" başlığı görünür
- ✅ "İlk teklifini oluşturarak müşterilerine profesyonel teklifler sunmaya başla." mesajı görünür
- ✅ "Teklif Oluştur" butonu görünür
- ✅ Butona tıklandığında `/quotes/new` sayfasına yönlendirilir

### ✅ Test Senaryosu 2: Boş Müşteri Listesi

**Adımlar:**
1. Yeni bir şirket oluştur veya tüm müşterileri sil
2. Müşteriler sayfasına git (`/customers`)
3. Liste boş olduğunda görünen mesajı kontrol et

**Beklenen Sonuç:**
- ✅ "Henüz müşteri eklemedin" başlığı görünür
- ✅ "İlk müşterini ekleyerek CRM sistemini kullanmaya başla." mesajı görünür
- ✅ "Müşteri Ekle" butonu görünür
- ✅ Butona tıklandığında `/customers/new` sayfasına yönlendirilir

### ✅ Test Senaryosu 3: Boş Fatura Listesi

**Adımlar:**
1. Yeni bir şirket oluştur veya tüm faturaları sil
2. Faturalar sayfasına git (`/invoices`)
3. Liste boş olduğunda görünen mesajı kontrol et

**Beklenen Sonuç:**
- ✅ "Henüz fatura oluşturmadın" başlığı görünür
- ✅ "İlk faturanı oluşturarak satış sürecini başlat." mesajı görünür
- ✅ "Fatura Oluştur" butonu görünür
- ✅ Butona tıklandığında `/invoices/new` sayfasına yönlendirilir

---

## 4️⃣ AutoGoalTracker - Hedef Takibi

### 📝 Açıklama
Kullanıcı aylık satış hedefi belirler ve sistem otomatik olarak ilerlemeyi takip eder.

### ✅ Test Senaryosu 1: Hedef Belirleme

**Adımlar:**
1. Dashboard sayfasına git (`/dashboard`)
2. "Aylık Hedef Belirle" kartını bul
3. "Hedef Belirle" butonuna tıkla
4. Hedef tutarı gir (örn: 50000)
5. Kaydet butonuna tıkla

**Beklenen Sonuç:**
- ✅ Hedef başarıyla kaydedilir
- ✅ Kart güncellenir ve ilerleme çubuğu görünür
- ✅ "İlerleme: 0₺" ve "Hedef: 50.000₺" bilgileri görünür
- ✅ İlerleme yüzdesi %0 olarak görünür

### ✅ Test Senaryosu 2: İlerleme Takibi

**Adımlar:**
1. Dashboard'da hedef belirle (örn: 50000₺)
2. Bir fatura oluştur ve durumunu "PAID" yap (örn: 20000₺)
3. Dashboard'u yenile

**Beklenen Sonuç:**
- ✅ İlerleme çubuğu %40'a kadar dolar (20000/50000)
- ✅ "İlerleme: 20.000₺" ve "Kalan: 30.000₺" bilgileri görünür
- ✅ İlerleme yüzdesi %40 olarak görünür

**Test Verileri Hazırlama:**
```sql
-- Bu ay PAID durumunda fatura oluştur
INSERT INTO "Invoice" (title, status, total, "companyId", "createdAt") 
VALUES ('Ödenen Fatura', 'PAID', 20000, 'your-company-id', NOW());
```

### ✅ Test Senaryosu 3: Hedef Aşımı

**Adımlar:**
1. Dashboard'da hedef belirle (örn: 50000₺)
2. Toplam 60000₺ değerinde PAID fatura oluştur
3. Dashboard'u yenile

**Beklenen Sonuç:**
- ✅ İlerleme çubuğu %100'e ulaşır
- ✅ "🎉 Tebrikler! Hedefini aştın!" mesajı görünür
- ✅ İlerleme yüzdesi %120 olarak görünür (60000/50000)

**Test Verileri Hazırlama:**
```sql
-- Bu ay PAID durumunda fatura oluştur (toplam 60000₺)
INSERT INTO "Invoice" (title, status, total, "companyId", "createdAt") 
VALUES ('Fatura 1', 'PAID', 30000, 'your-company-id', NOW()),
       ('Fatura 2', 'PAID', 30000, 'your-company-id', NOW());
```

### ✅ Test Senaryosu 4: Hedef Düzenleme

**Adımlar:**
1. Dashboard'da mevcut hedefi gör
2. Düzenle butonuna (kalem ikonu) tıkla
3. Yeni hedef tutarı gir (örn: 75000)
4. Kaydet butonuna tıkla

**Beklenen Sonuç:**
- ✅ Hedef başarıyla güncellenir
- ✅ İlerleme çubuğu yeni hedefe göre yeniden hesaplanır
- ✅ Yeni hedef tutarı görünür

---

## 5️⃣ AutoNextStep - Sonraki Adım Önerisi

### 📝 Açıklama
Bir modül tamamlandığında sistem otomatik olarak sonraki adımı önerir.

### ✅ Test Senaryosu 1: Teklif Kabul Edildiğinde Fatura Önerisi

**Adımlar:**
1. Bir teklif oluştur
2. Teklif durumunu "ACCEPTED" yap
3. Teklif detay sayfasında bildirimi kontrol et

**Beklenen Sonuç:**
- ✅ "Teklif kabul edildi! Fatura oluşturmak ister misin?" mesajı görünür
- ✅ "Fatura Oluştur" butonu görünür
- ✅ Butona tıklandığında fatura formu açılır

**Test Verileri Hazırlama:**
```sql
-- ACCEPTED durumunda teklif oluştur
INSERT INTO "Quote" (title, status, total, "companyId") 
VALUES ('Kabul Edilen Teklif', 'ACCEPTED', 15000, 'your-company-id');
```

### ✅ Test Senaryosu 2: Fatura Kesildiğinde Sevkiyat Önerisi

**Adımlar:**
1. Bir fatura oluştur
2. Fatura durumunu "PAID" yap
3. Fatura detay sayfasında bildirimi kontrol et

**Beklenen Sonuç:**
- ✅ "Fatura ödendi! Sevkiyat taslağı oluşturuldu, açmak ister misin?" mesajı görünür
- ✅ "Sevkiyat Hazırla" butonu görünür
- ✅ Butona tıklandığında sevkiyat formu açılır

**Test Verileri Hazırlama:**
```sql
-- PAID durumunda fatura oluştur
INSERT INTO "Invoice" (title, status, total, "companyId") 
VALUES ('Ödenen Fatura', 'PAID', 20000, 'your-company-id');
```

---

## 6️⃣ AutoTaskFromQuote - Otomatik Görev Atama

### 📝 Açıklama
Teklif oluşturulduğunda otomatik olarak görev açılır ve teklif sahibine atanır.

### ✅ Test Senaryosu 1: Teklif Oluşturulduğunda Görev Açılması

**Adımlar:**
1. Yeni bir teklif oluştur
2. Teklif kaydedildikten sonra Görevler sayfasına git (`/tasks`)
3. Yeni oluşturulan görevi kontrol et

**Beklenen Sonuç:**
- ✅ Yeni bir görev oluşturulur
- ✅ Görev başlığı: "Bu teklif için 3 gün içinde müşteriyi ara"
- ✅ Görev teklif sahibine atanır
- ✅ Görev durumu "TODO" olarak görünür

**Test Verileri Hazırlama:**
```sql
-- Teklif oluştur (otomatik görev açılacak)
INSERT INTO "Quote" (title, status, total, "companyId", "userId") 
VALUES ('Yeni Teklif', 'DRAFT', 10000, 'your-company-id', 'your-user-id');
```

---

## 7️⃣ CustomerFollowup - Sessiz Müşteri Takibi

### 📝 Açıklama
14 gün boyunca hiç etkileşim olmayan müşteri "Takip Et" listesine düşer.

### ✅ Test Senaryosu 1: Sessiz Müşteri Tespiti

**Adımlar:**
1. Bir müşteri oluştur
2. Müşterinin `updatedAt` tarihini 15 gün öncesine ayarla
3. Dashboard'da "Pasif Müşteriler" kutusunu kontrol et

**Beklenen Sonuç:**
- ✅ Müşteri "Pasif Müşteriler" listesine eklenir
- ✅ "14 günden uzun süredir görüşülmeyen müşteriler" mesajı görünür
- ✅ Müşteri listesinde "Takip Et" butonu görünür

**Test Verileri Hazırlama:**
```sql
-- 15 gün önce güncellenmiş müşteri oluştur
INSERT INTO "Customer" (name, status, "companyId", "updatedAt") 
VALUES ('Pasif Müşteri', 'ACTIVE', 'your-company-id', NOW() - INTERVAL '15 days');
```

### ✅ Test Senaryosu 2: Müşteri Etkileşimi Sonrası Listeden Çıkma

**Adımlar:**
1. Pasif müşteri listesinde bir müşteri seç
2. Müşteriye yeni bir teklif oluştur
3. Dashboard'u yenile

**Beklenen Sonuç:**
- ✅ Müşteri "Pasif Müşteriler" listesinden çıkar
- ✅ Müşterinin `updatedAt` tarihi güncellenir
- ✅ Liste güncellenir

**Test Verileri Hazırlama:**
```sql
-- Müşteriye teklif oluştur (updatedAt güncellenecek)
INSERT INTO "Quote" (title, status, total, "companyId", "customerId") 
VALUES ('Yeni Teklif', 'DRAFT', 10000, 'your-company-id', 'passive-customer-id');
```

---

## 8️⃣ AutoNoteOnEdit - Değişiklik Günlüğü

### 📝 Açıklama
Kullanıcı bir teklif veya fatura düzenlediğinde sistem otomatik not ekler.

### ✅ Test Senaryosu 1: Fiyat Güncelleme Notu

**Adımlar:**
1. Bir teklif oluştur (toplam: 10000₺)
2. Teklifi düzenle ve toplam tutarı 12000₺ yap
3. Kaydet
4. ActivityLog'u kontrol et (`/activity`)

**Beklenen Sonuç:**
- ✅ ActivityLog'a yeni kayıt eklenir
- ✅ Kayıt açıklaması: "Fiyat güncellendi (eski: 10.000₺ → yeni: 12.000₺)"
- ✅ Kayıt meta bilgilerinde eski ve yeni değerler bulunur

**Test Verileri Hazırlama:**
```sql
-- Teklif oluştur
INSERT INTO "Quote" (title, status, total, "companyId") 
VALUES ('Test Teklif', 'DRAFT', 10000, 'your-company-id');
```

### ✅ Test Senaryosu 2: Durum Değişikliği Notu

**Adımlar:**
1. Bir teklif oluştur (durum: DRAFT)
2. Teklif durumunu "SENT" yap
3. Kaydet
4. ActivityLog'u kontrol et

**Beklenen Sonuç:**
- ✅ ActivityLog'a yeni kayıt eklenir
- ✅ Kayıt açıklaması: "Teklif durumu güncellendi: DRAFT → SENT"
- ✅ Kayıt meta bilgilerinde eski ve yeni durum bulunur

---

## 9️⃣ QuickThankYou - Otomatik Teşekkür

### 📝 Açıklama
Fatura ödendiğinde veya teklif kabul edildiğinde müşteriye otomatik e-posta gider.

### ✅ Test Senaryosu 1: Teklif Kabul Edildiğinde Teşekkür E-postası

**Adımlar:**
1. Bir teklif oluştur
2. Teklif durumunu "ACCEPTED" yap
3. E-posta gönderim logunu kontrol et

**Beklenen Sonuç:**
- ✅ Müşteriye otomatik e-posta gönderilir
- ✅ E-posta konusu: "Teklifiniz Kabul Edildi - Teşekkürler"
- ✅ E-posta içeriği: "İş birliğiniz için teşekkür ederiz 💫"

**Test Verileri Hazırlama:**
```sql
-- ACCEPTED durumunda teklif oluştur
INSERT INTO "Quote" (title, status, total, "companyId", "customerId") 
VALUES ('Kabul Edilen Teklif', 'ACCEPTED', 15000, 'your-company-id', 'customer-id');
```

### ✅ Test Senaryosu 2: Fatura Ödendiğinde Teşekkür E-postası

**Adımlar:**
1. Bir fatura oluştur
2. Fatura durumunu "PAID" yap
3. E-posta gönderim logunu kontrol et

**Beklenen Sonuç:**
- ✅ Müşteriye otomatik e-posta gönderilir
- ✅ E-posta konusu: "Ödemeniz Alındı - Teşekkürler"
- ✅ E-posta içeriği: "Ödemeniz için teşekkür ederiz 💫"

**Test Verileri Hazırlama:**
```sql
-- PAID durumunda fatura oluştur
INSERT INTO "Invoice" (title, status, total, "companyId", "customerId") 
VALUES ('Ödenen Fatura', 'PAID', 20000, 'your-company-id', 'customer-id');
```

---

## 🔟 SmartFileNaming - PDF Dosya Adı Standardı

### 📝 Açıklama
Teklif/Fatura PDF kaydedilirken otomatik şu formatta adlandırılır:
`PI_2025-11-07_TIPPLUS_XYZMEDIKAL_#001.pdf`

### ✅ Test Senaryosu 1: Teklif PDF İndirme

**Adımlar:**
1. Bir teklif oluştur
2. Teklif detay sayfasına git (`/quotes/[id]`)
3. "PDF İndir" butonuna tıkla
4. İndirilen dosya adını kontrol et

**Beklenen Sonuç:**
- ✅ PDF dosyası indirilir
- ✅ Dosya adı formatı: `PI_YYYY-MM-DD_COMPANYNAME_CUSTOMERNAME_#XXX.pdf`
- ✅ Örnek: `PI_2025-01-15_TIPPLUS_XYZMEDIKAL_#001.pdf`

**Test Verileri Hazırlama:**
```sql
-- Teklif oluştur
INSERT INTO "Quote" (title, status, total, "companyId") 
VALUES ('Test Teklif', 'DRAFT', 10000, 'your-company-id');
```

### ✅ Test Senaryosu 2: Fatura PDF İndirme

**Adımlar:**
1. Bir fatura oluştur
2. Fatura detay sayfasına git (`/invoices/[id]`)
3. "PDF İndir" butonuna tıkla
4. İndirilen dosya adını kontrol et

**Beklenen Sonuç:**
- ✅ PDF dosyası indirilir
- ✅ Dosya adı formatı: `INV_YYYY-MM-DD_COMPANYNAME_CUSTOMERNAME_#XXX.pdf`
- ✅ Örnek: `INV_2025-01-15_TIPPLUS_XYZMEDIKAL_#001.pdf`

**Test Verileri Hazırlama:**
```sql
-- Fatura oluştur
INSERT INTO "Invoice" (title, status, total, "companyId") 
VALUES ('Test Fatura', 'DRAFT', 15000, 'your-company-id');
```

---

## 📊 Genel Test Kontrol Listesi

### ✅ Tüm Otomasyonlar İçin Ortak Kontroller

1. **API Endpoint Kontrolü**
   - ✅ Tüm API endpoint'leri çalışıyor mu?
   - ✅ Hata durumlarında uygun mesajlar dönüyor mu?
   - ✅ RLS (Row-Level Security) kontrolü yapılıyor mu?

2. **UI/UX Kontrolü**
   - ✅ Tüm component'ler doğru render ediliyor mu?
   - ✅ Loading state'ler gösteriliyor mu?
   - ✅ Error state'ler gösteriliyor mu?
   - ✅ Responsive tasarım çalışıyor mu?

3. **Performans Kontrolü**
   - ✅ API response süreleri < 1000ms mi?
   - ✅ Component render süreleri < 300ms mi?
   - ✅ Cache stratejisi çalışıyor mu?

4. **Güvenlik Kontrolü**
   - ✅ Session kontrolü yapılıyor mu?
   - ✅ CompanyId filtresi uygulanıyor mu?
   - ✅ Input validation yapılıyor mu?

---

## 🐛 Hata Ayıklama İpuçları

### Sorun: Smart Reminder görünmüyor
**Çözüm:**
1. Browser console'u kontrol et (F12)
2. API endpoint'ini manuel test et: `/api/automations/smart-reminder`
3. Session kontrolü yap
4. CompanyId'nin doğru olduğundan emin ol

### Sorun: QuickActions butonları görünmüyor
**Çözüm:**
1. Entity status'unu kontrol et
2. Component'in doğru yerde render edildiğinden emin ol
3. Browser console'da hata var mı kontrol et

### Sorun: AutoGoalTracker hedef kaydedilmiyor
**Çözüm:**
1. API endpoint'ini kontrol et: `/api/automations/goal-tracker`
2. User tablosunda `monthlyGoal` kolonu var mı kontrol et
3. Migration çalıştırıldı mı kontrol et

---

## 📝 Notlar

- Tüm otomasyonlar production-ready değil, bazıları migration gerektirebilir
- Test verileri hazırlarken gerçek companyId ve userId kullanın
- ActivityLog kayıtları otomatik oluşturulur, manuel kontrol gerekmez
- E-posta gönderimi için SMTP ayarları yapılmalıdır

---

## 🎯 Sonuç

Bu test senaryoları ile tüm otomasyonların çalıştığından emin olabilirsiniz. Her senaryo adım adım takip edilerek sistemin doğru çalıştığı doğrulanabilir.

**Test Sırası:**
1. Önce Smart Reminder'ı test et
2. Sonra QuickActions'ı test et
3. SmartEmptyState'i test et
4. AutoGoalTracker'ı test et
5. Diğer otomasyonları sırayla test et

**Başarı Kriterleri:**
- ✅ Tüm API endpoint'leri 200 status code dönüyor
- ✅ Tüm UI component'leri doğru render ediliyor
- ✅ Tüm otomasyonlar beklenen şekilde çalışıyor
- ✅ Hata durumlarında uygun mesajlar gösteriliyor


Bu dokümanda tüm otomasyonların test senaryoları ve kullanım kılavuzu bulunmaktadır.

---

## 📋 İçindekiler

1. [Smart Reminder - Günlük Bildirimler](#1-smart-reminder)
2. [QuickActions - Hızlı İşlem Butonları](#2-quickactions)
3. [SmartEmptyState - Boş Ekran Önerileri](#3-smartemptystate)
4. [AutoGoalTracker - Hedef Takibi](#4-autogoaltracker)
5. [AutoNextStep - Sonraki Adım Önerisi](#5-autonextstep)
6. [AutoTaskFromQuote - Otomatik Görev Atama](#6-autotaskfromquote)
7. [CustomerFollowup - Sessiz Müşteri Takibi](#7-customerfollowup)
8. [AutoNoteOnEdit - Değişiklik Günlüğü](#8-autonoteonedit)
9. [QuickThankYou - Otomatik Teşekkür](#9-quickthankyou)
10. [SmartFileNaming - PDF Dosya Adı Standardı](#10-smartfilenaming)

---

## 1️⃣ Smart Reminder - Günlük Bildirimler

### 📝 Açıklama
Kullanıcı dashboard'a giriş yaptığında otomatik olarak günlük özet gösterilir:
- Onay bekleyen teklifler
- 7 günden uzun süredir görüşülmeyen müşteriler
- Teslim bekleyen sevkiyatlar

### ✅ Test Senaryosu 1: Dashboard Giriş Bildirimi

**Adımlar:**
1. Sisteme giriş yap
2. Dashboard sayfasına git (`/dashboard`)
3. Sayfanın üst kısmında "Bugünün Özeti" kartını kontrol et

**Beklenen Sonuç:**
- ✅ Eğer onay bekleyen teklif varsa: "X teklifin onay bekliyor." mesajı görünür
- ✅ Eğer 7 günden uzun süredir görüşülmeyen müşteri varsa: "X müşterinle 7 gündür görüşmedin." mesajı görünür
- ✅ Eğer teslim bekleyen sevkiyat varsa: "X sevkiyat teslim bekliyor." mesajı görünür
- ✅ Her mesajın yanında "Görüntüle →", "Takip Et →", "Kontrol Et →" linkleri bulunur
- ✅ Sağ üstte "X" butonu ile kapatılabilir

**Test Verileri Hazırlama:**
```sql
-- Onay bekleyen teklif oluştur
INSERT INTO "Quote" (title, status, total, "companyId") 
VALUES ('Test Teklif', 'SENT', 10000, 'your-company-id');

-- 7 günden eski müşteri oluştur
INSERT INTO "Customer" (name, status, "companyId", "updatedAt") 
VALUES ('Eski Müşteri', 'ACTIVE', 'your-company-id', NOW() - INTERVAL '10 days');

-- Teslim bekleyen sevkiyat oluştur
INSERT INTO "Shipment" (status, "companyId") 
VALUES ('PENDING', 'your-company-id');
```

### ✅ Test Senaryosu 2: Bildirimi Kapatma

**Adımlar:**
1. Dashboard'da Smart Reminder kartını gör
2. Sağ üstteki "X" butonuna tıkla
3. Sayfayı yenile (F5)

**Beklenen Sonuç:**
- ✅ Kart kapanır ve görünmez
- ✅ Sayfa yenilendiğinde kart tekrar görünmez (24 saat boyunca)
- ✅ 24 saat sonra tekrar görünür

---

## 2️⃣ QuickActions - Hızlı İşlem Butonları

### 📝 Açıklama
Duruma göre otomatik olarak hızlı işlem butonları gösterilir:
- Teklif ACCEPTED → "Fatura Oluştur" butonu
- Fatura SENT/PAID → "Sevkiyat Hazırla" butonu
- Sevkiyat PENDING → "Sevkiyatı Onayla" butonu

### ✅ Test Senaryosu 1: Teklif Kabul Edildiğinde Fatura Butonu

**Adımlar:**
1. Teklifler sayfasına git (`/quotes`)
2. Bir teklif oluştur veya mevcut bir teklifi seç
3. Teklif detay sayfasına git (`/quotes/[id]`)
4. Teklif durumunu "ACCEPTED" yap
5. Sayfayı yenile

**Beklenen Sonuç:**
- ✅ "Fatura Oluştur" butonu görünür (parlayan efekt ile)
- ✅ Butona tıklandığında `/invoices/new?quoteId=[id]` sayfasına yönlendirilir
- ✅ Fatura formu açılır ve teklif bilgileri otomatik doldurulur

**Test Verileri Hazırlama:**
```sql
-- ACCEPTED durumunda teklif oluştur
INSERT INTO "Quote" (title, status, total, "companyId") 
VALUES ('Kabul Edilen Teklif', 'ACCEPTED', 15000, 'your-company-id');
```

### ✅ Test Senaryosu 2: Fatura Kesildiğinde Sevkiyat Butonu

**Adımlar:**
1. Faturalar sayfasına git (`/invoices`)
2. Bir fatura oluştur veya mevcut bir faturayı seç
3. Fatura durumunu "SENT" veya "PAID" yap
4. Fatura detay sayfasına git (`/invoices/[id]`)
5. Sayfayı yenile

**Beklenen Sonuç:**
- ✅ "Sevkiyat Hazırla" butonu görünür (parlayan efekt ile)
- ✅ Butona tıklandığında `/shipments/new?invoiceId=[id]` sayfasına yönlendirilir
- ✅ Sevkiyat formu açılır ve fatura bilgileri otomatik doldurulur

**Test Verileri Hazırlama:**
```sql
-- SENT durumunda fatura oluştur
INSERT INTO "Invoice" (title, status, total, "companyId") 
VALUES ('Gönderilen Fatura', 'SENT', 20000, 'your-company-id');
```

### ✅ Test Senaryosu 3: Sevkiyat Beklemede Onay Butonu

**Adımlar:**
1. Sevkiyatlar sayfasına git (`/shipments`)
2. Bir sevkiyat oluştur veya mevcut bir sevkiyatı seç
3. Sevkiyat durumunu "PENDING" yap
4. Sevkiyat detay sayfasına git (`/shipments/[id]`)
5. Sayfayı yenile

**Beklenen Sonuç:**
- ✅ "Sevkiyatı Onayla" butonu görünür (parlayan efekt ile)
- ✅ Butona tıklandığında sevkiyat detay sayfasına yönlendirilir
- ✅ Onaylama işlemi yapılabilir

**Test Verileri Hazırlama:**
```sql
-- PENDING durumunda sevkiyat oluştur
INSERT INTO "Shipment" (status, "companyId") 
VALUES ('PENDING', 'your-company-id');
```

---

## 3️⃣ SmartEmptyState - Boş Ekran Önerileri

### 📝 Açıklama
Boş listelerde kullanıcıya yardımcı mesajlar ve hızlı aksiyon butonları gösterilir.

### ✅ Test Senaryosu 1: Boş Teklif Listesi

**Adımlar:**
1. Yeni bir şirket oluştur veya tüm teklifleri sil
2. Teklifler sayfasına git (`/quotes`)
3. Liste boş olduğunda görünen mesajı kontrol et

**Beklenen Sonuç:**
- ✅ "Henüz teklif oluşturmadın" başlığı görünür
- ✅ "İlk teklifini oluşturarak müşterilerine profesyonel teklifler sunmaya başla." mesajı görünür
- ✅ "Teklif Oluştur" butonu görünür
- ✅ Butona tıklandığında `/quotes/new` sayfasına yönlendirilir

### ✅ Test Senaryosu 2: Boş Müşteri Listesi

**Adımlar:**
1. Yeni bir şirket oluştur veya tüm müşterileri sil
2. Müşteriler sayfasına git (`/customers`)
3. Liste boş olduğunda görünen mesajı kontrol et

**Beklenen Sonuç:**
- ✅ "Henüz müşteri eklemedin" başlığı görünür
- ✅ "İlk müşterini ekleyerek CRM sistemini kullanmaya başla." mesajı görünür
- ✅ "Müşteri Ekle" butonu görünür
- ✅ Butona tıklandığında `/customers/new` sayfasına yönlendirilir

### ✅ Test Senaryosu 3: Boş Fatura Listesi

**Adımlar:**
1. Yeni bir şirket oluştur veya tüm faturaları sil
2. Faturalar sayfasına git (`/invoices`)
3. Liste boş olduğunda görünen mesajı kontrol et

**Beklenen Sonuç:**
- ✅ "Henüz fatura oluşturmadın" başlığı görünür
- ✅ "İlk faturanı oluşturarak satış sürecini başlat." mesajı görünür
- ✅ "Fatura Oluştur" butonu görünür
- ✅ Butona tıklandığında `/invoices/new` sayfasına yönlendirilir

---

## 4️⃣ AutoGoalTracker - Hedef Takibi

### 📝 Açıklama
Kullanıcı aylık satış hedefi belirler ve sistem otomatik olarak ilerlemeyi takip eder.

### ✅ Test Senaryosu 1: Hedef Belirleme

**Adımlar:**
1. Dashboard sayfasına git (`/dashboard`)
2. "Aylık Hedef Belirle" kartını bul
3. "Hedef Belirle" butonuna tıkla
4. Hedef tutarı gir (örn: 50000)
5. Kaydet butonuna tıkla

**Beklenen Sonuç:**
- ✅ Hedef başarıyla kaydedilir
- ✅ Kart güncellenir ve ilerleme çubuğu görünür
- ✅ "İlerleme: 0₺" ve "Hedef: 50.000₺" bilgileri görünür
- ✅ İlerleme yüzdesi %0 olarak görünür

### ✅ Test Senaryosu 2: İlerleme Takibi

**Adımlar:**
1. Dashboard'da hedef belirle (örn: 50000₺)
2. Bir fatura oluştur ve durumunu "PAID" yap (örn: 20000₺)
3. Dashboard'u yenile

**Beklenen Sonuç:**
- ✅ İlerleme çubuğu %40'a kadar dolar (20000/50000)
- ✅ "İlerleme: 20.000₺" ve "Kalan: 30.000₺" bilgileri görünür
- ✅ İlerleme yüzdesi %40 olarak görünür

**Test Verileri Hazırlama:**
```sql
-- Bu ay PAID durumunda fatura oluştur
INSERT INTO "Invoice" (title, status, total, "companyId", "createdAt") 
VALUES ('Ödenen Fatura', 'PAID', 20000, 'your-company-id', NOW());
```

### ✅ Test Senaryosu 3: Hedef Aşımı

**Adımlar:**
1. Dashboard'da hedef belirle (örn: 50000₺)
2. Toplam 60000₺ değerinde PAID fatura oluştur
3. Dashboard'u yenile

**Beklenen Sonuç:**
- ✅ İlerleme çubuğu %100'e ulaşır
- ✅ "🎉 Tebrikler! Hedefini aştın!" mesajı görünür
- ✅ İlerleme yüzdesi %120 olarak görünür (60000/50000)

**Test Verileri Hazırlama:**
```sql
-- Bu ay PAID durumunda fatura oluştur (toplam 60000₺)
INSERT INTO "Invoice" (title, status, total, "companyId", "createdAt") 
VALUES ('Fatura 1', 'PAID', 30000, 'your-company-id', NOW()),
       ('Fatura 2', 'PAID', 30000, 'your-company-id', NOW());
```

### ✅ Test Senaryosu 4: Hedef Düzenleme

**Adımlar:**
1. Dashboard'da mevcut hedefi gör
2. Düzenle butonuna (kalem ikonu) tıkla
3. Yeni hedef tutarı gir (örn: 75000)
4. Kaydet butonuna tıkla

**Beklenen Sonuç:**
- ✅ Hedef başarıyla güncellenir
- ✅ İlerleme çubuğu yeni hedefe göre yeniden hesaplanır
- ✅ Yeni hedef tutarı görünür

---

## 5️⃣ AutoNextStep - Sonraki Adım Önerisi

### 📝 Açıklama
Bir modül tamamlandığında sistem otomatik olarak sonraki adımı önerir.

### ✅ Test Senaryosu 1: Teklif Kabul Edildiğinde Fatura Önerisi

**Adımlar:**
1. Bir teklif oluştur
2. Teklif durumunu "ACCEPTED" yap
3. Teklif detay sayfasında bildirimi kontrol et

**Beklenen Sonuç:**
- ✅ "Teklif kabul edildi! Fatura oluşturmak ister misin?" mesajı görünür
- ✅ "Fatura Oluştur" butonu görünür
- ✅ Butona tıklandığında fatura formu açılır

**Test Verileri Hazırlama:**
```sql
-- ACCEPTED durumunda teklif oluştur
INSERT INTO "Quote" (title, status, total, "companyId") 
VALUES ('Kabul Edilen Teklif', 'ACCEPTED', 15000, 'your-company-id');
```

### ✅ Test Senaryosu 2: Fatura Kesildiğinde Sevkiyat Önerisi

**Adımlar:**
1. Bir fatura oluştur
2. Fatura durumunu "PAID" yap
3. Fatura detay sayfasında bildirimi kontrol et

**Beklenen Sonuç:**
- ✅ "Fatura ödendi! Sevkiyat taslağı oluşturuldu, açmak ister misin?" mesajı görünür
- ✅ "Sevkiyat Hazırla" butonu görünür
- ✅ Butona tıklandığında sevkiyat formu açılır

**Test Verileri Hazırlama:**
```sql
-- PAID durumunda fatura oluştur
INSERT INTO "Invoice" (title, status, total, "companyId") 
VALUES ('Ödenen Fatura', 'PAID', 20000, 'your-company-id');
```

---

## 6️⃣ AutoTaskFromQuote - Otomatik Görev Atama

### 📝 Açıklama
Teklif oluşturulduğunda otomatik olarak görev açılır ve teklif sahibine atanır.

### ✅ Test Senaryosu 1: Teklif Oluşturulduğunda Görev Açılması

**Adımlar:**
1. Yeni bir teklif oluştur
2. Teklif kaydedildikten sonra Görevler sayfasına git (`/tasks`)
3. Yeni oluşturulan görevi kontrol et

**Beklenen Sonuç:**
- ✅ Yeni bir görev oluşturulur
- ✅ Görev başlığı: "Bu teklif için 3 gün içinde müşteriyi ara"
- ✅ Görev teklif sahibine atanır
- ✅ Görev durumu "TODO" olarak görünür

**Test Verileri Hazırlama:**
```sql
-- Teklif oluştur (otomatik görev açılacak)
INSERT INTO "Quote" (title, status, total, "companyId", "userId") 
VALUES ('Yeni Teklif', 'DRAFT', 10000, 'your-company-id', 'your-user-id');
```

---

## 7️⃣ CustomerFollowup - Sessiz Müşteri Takibi

### 📝 Açıklama
14 gün boyunca hiç etkileşim olmayan müşteri "Takip Et" listesine düşer.

### ✅ Test Senaryosu 1: Sessiz Müşteri Tespiti

**Adımlar:**
1. Bir müşteri oluştur
2. Müşterinin `updatedAt` tarihini 15 gün öncesine ayarla
3. Dashboard'da "Pasif Müşteriler" kutusunu kontrol et

**Beklenen Sonuç:**
- ✅ Müşteri "Pasif Müşteriler" listesine eklenir
- ✅ "14 günden uzun süredir görüşülmeyen müşteriler" mesajı görünür
- ✅ Müşteri listesinde "Takip Et" butonu görünür

**Test Verileri Hazırlama:**
```sql
-- 15 gün önce güncellenmiş müşteri oluştur
INSERT INTO "Customer" (name, status, "companyId", "updatedAt") 
VALUES ('Pasif Müşteri', 'ACTIVE', 'your-company-id', NOW() - INTERVAL '15 days');
```

### ✅ Test Senaryosu 2: Müşteri Etkileşimi Sonrası Listeden Çıkma

**Adımlar:**
1. Pasif müşteri listesinde bir müşteri seç
2. Müşteriye yeni bir teklif oluştur
3. Dashboard'u yenile

**Beklenen Sonuç:**
- ✅ Müşteri "Pasif Müşteriler" listesinden çıkar
- ✅ Müşterinin `updatedAt` tarihi güncellenir
- ✅ Liste güncellenir

**Test Verileri Hazırlama:**
```sql
-- Müşteriye teklif oluştur (updatedAt güncellenecek)
INSERT INTO "Quote" (title, status, total, "companyId", "customerId") 
VALUES ('Yeni Teklif', 'DRAFT', 10000, 'your-company-id', 'passive-customer-id');
```

---

## 8️⃣ AutoNoteOnEdit - Değişiklik Günlüğü

### 📝 Açıklama
Kullanıcı bir teklif veya fatura düzenlediğinde sistem otomatik not ekler.

### ✅ Test Senaryosu 1: Fiyat Güncelleme Notu

**Adımlar:**
1. Bir teklif oluştur (toplam: 10000₺)
2. Teklifi düzenle ve toplam tutarı 12000₺ yap
3. Kaydet
4. ActivityLog'u kontrol et (`/activity`)

**Beklenen Sonuç:**
- ✅ ActivityLog'a yeni kayıt eklenir
- ✅ Kayıt açıklaması: "Fiyat güncellendi (eski: 10.000₺ → yeni: 12.000₺)"
- ✅ Kayıt meta bilgilerinde eski ve yeni değerler bulunur

**Test Verileri Hazırlama:**
```sql
-- Teklif oluştur
INSERT INTO "Quote" (title, status, total, "companyId") 
VALUES ('Test Teklif', 'DRAFT', 10000, 'your-company-id');
```

### ✅ Test Senaryosu 2: Durum Değişikliği Notu

**Adımlar:**
1. Bir teklif oluştur (durum: DRAFT)
2. Teklif durumunu "SENT" yap
3. Kaydet
4. ActivityLog'u kontrol et

**Beklenen Sonuç:**
- ✅ ActivityLog'a yeni kayıt eklenir
- ✅ Kayıt açıklaması: "Teklif durumu güncellendi: DRAFT → SENT"
- ✅ Kayıt meta bilgilerinde eski ve yeni durum bulunur

---

## 9️⃣ QuickThankYou - Otomatik Teşekkür

### 📝 Açıklama
Fatura ödendiğinde veya teklif kabul edildiğinde müşteriye otomatik e-posta gider.

### ✅ Test Senaryosu 1: Teklif Kabul Edildiğinde Teşekkür E-postası

**Adımlar:**
1. Bir teklif oluştur
2. Teklif durumunu "ACCEPTED" yap
3. E-posta gönderim logunu kontrol et

**Beklenen Sonuç:**
- ✅ Müşteriye otomatik e-posta gönderilir
- ✅ E-posta konusu: "Teklifiniz Kabul Edildi - Teşekkürler"
- ✅ E-posta içeriği: "İş birliğiniz için teşekkür ederiz 💫"

**Test Verileri Hazırlama:**
```sql
-- ACCEPTED durumunda teklif oluştur
INSERT INTO "Quote" (title, status, total, "companyId", "customerId") 
VALUES ('Kabul Edilen Teklif', 'ACCEPTED', 15000, 'your-company-id', 'customer-id');
```

### ✅ Test Senaryosu 2: Fatura Ödendiğinde Teşekkür E-postası

**Adımlar:**
1. Bir fatura oluştur
2. Fatura durumunu "PAID" yap
3. E-posta gönderim logunu kontrol et

**Beklenen Sonuç:**
- ✅ Müşteriye otomatik e-posta gönderilir
- ✅ E-posta konusu: "Ödemeniz Alındı - Teşekkürler"
- ✅ E-posta içeriği: "Ödemeniz için teşekkür ederiz 💫"

**Test Verileri Hazırlama:**
```sql
-- PAID durumunda fatura oluştur
INSERT INTO "Invoice" (title, status, total, "companyId", "customerId") 
VALUES ('Ödenen Fatura', 'PAID', 20000, 'your-company-id', 'customer-id');
```

---

## 🔟 SmartFileNaming - PDF Dosya Adı Standardı

### 📝 Açıklama
Teklif/Fatura PDF kaydedilirken otomatik şu formatta adlandırılır:
`PI_2025-11-07_TIPPLUS_XYZMEDIKAL_#001.pdf`

### ✅ Test Senaryosu 1: Teklif PDF İndirme

**Adımlar:**
1. Bir teklif oluştur
2. Teklif detay sayfasına git (`/quotes/[id]`)
3. "PDF İndir" butonuna tıkla
4. İndirilen dosya adını kontrol et

**Beklenen Sonuç:**
- ✅ PDF dosyası indirilir
- ✅ Dosya adı formatı: `PI_YYYY-MM-DD_COMPANYNAME_CUSTOMERNAME_#XXX.pdf`
- ✅ Örnek: `PI_2025-01-15_TIPPLUS_XYZMEDIKAL_#001.pdf`

**Test Verileri Hazırlama:**
```sql
-- Teklif oluştur
INSERT INTO "Quote" (title, status, total, "companyId") 
VALUES ('Test Teklif', 'DRAFT', 10000, 'your-company-id');
```

### ✅ Test Senaryosu 2: Fatura PDF İndirme

**Adımlar:**
1. Bir fatura oluştur
2. Fatura detay sayfasına git (`/invoices/[id]`)
3. "PDF İndir" butonuna tıkla
4. İndirilen dosya adını kontrol et

**Beklenen Sonuç:**
- ✅ PDF dosyası indirilir
- ✅ Dosya adı formatı: `INV_YYYY-MM-DD_COMPANYNAME_CUSTOMERNAME_#XXX.pdf`
- ✅ Örnek: `INV_2025-01-15_TIPPLUS_XYZMEDIKAL_#001.pdf`

**Test Verileri Hazırlama:**
```sql
-- Fatura oluştur
INSERT INTO "Invoice" (title, status, total, "companyId") 
VALUES ('Test Fatura', 'DRAFT', 15000, 'your-company-id');
```

---

## 📊 Genel Test Kontrol Listesi

### ✅ Tüm Otomasyonlar İçin Ortak Kontroller

1. **API Endpoint Kontrolü**
   - ✅ Tüm API endpoint'leri çalışıyor mu?
   - ✅ Hata durumlarında uygun mesajlar dönüyor mu?
   - ✅ RLS (Row-Level Security) kontrolü yapılıyor mu?

2. **UI/UX Kontrolü**
   - ✅ Tüm component'ler doğru render ediliyor mu?
   - ✅ Loading state'ler gösteriliyor mu?
   - ✅ Error state'ler gösteriliyor mu?
   - ✅ Responsive tasarım çalışıyor mu?

3. **Performans Kontrolü**
   - ✅ API response süreleri < 1000ms mi?
   - ✅ Component render süreleri < 300ms mi?
   - ✅ Cache stratejisi çalışıyor mu?

4. **Güvenlik Kontrolü**
   - ✅ Session kontrolü yapılıyor mu?
   - ✅ CompanyId filtresi uygulanıyor mu?
   - ✅ Input validation yapılıyor mu?

---

## 🐛 Hata Ayıklama İpuçları

### Sorun: Smart Reminder görünmüyor
**Çözüm:**
1. Browser console'u kontrol et (F12)
2. API endpoint'ini manuel test et: `/api/automations/smart-reminder`
3. Session kontrolü yap
4. CompanyId'nin doğru olduğundan emin ol

### Sorun: QuickActions butonları görünmüyor
**Çözüm:**
1. Entity status'unu kontrol et
2. Component'in doğru yerde render edildiğinden emin ol
3. Browser console'da hata var mı kontrol et

### Sorun: AutoGoalTracker hedef kaydedilmiyor
**Çözüm:**
1. API endpoint'ini kontrol et: `/api/automations/goal-tracker`
2. User tablosunda `monthlyGoal` kolonu var mı kontrol et
3. Migration çalıştırıldı mı kontrol et

---

## 📝 Notlar

- Tüm otomasyonlar production-ready değil, bazıları migration gerektirebilir
- Test verileri hazırlarken gerçek companyId ve userId kullanın
- ActivityLog kayıtları otomatik oluşturulur, manuel kontrol gerekmez
- E-posta gönderimi için SMTP ayarları yapılmalıdır

---

## 🎯 Sonuç

Bu test senaryoları ile tüm otomasyonların çalıştığından emin olabilirsiniz. Her senaryo adım adım takip edilerek sistemin doğru çalıştığı doğrulanabilir.

**Test Sırası:**
1. Önce Smart Reminder'ı test et
2. Sonra QuickActions'ı test et
3. SmartEmptyState'i test et
4. AutoGoalTracker'ı test et
5. Diğer otomasyonları sırayla test et

**Başarı Kriterleri:**
- ✅ Tüm API endpoint'leri 200 status code dönüyor
- ✅ Tüm UI component'leri doğru render ediliyor
- ✅ Tüm otomasyonlar beklenen şekilde çalışıyor
- ✅ Hata durumlarında uygun mesajlar gösteriliyor



Bu dokümanda tüm otomasyonların test senaryoları ve kullanım kılavuzu bulunmaktadır.

---

## 📋 İçindekiler

1. [Smart Reminder - Günlük Bildirimler](#1-smart-reminder)
2. [QuickActions - Hızlı İşlem Butonları](#2-quickactions)
3. [SmartEmptyState - Boş Ekran Önerileri](#3-smartemptystate)
4. [AutoGoalTracker - Hedef Takibi](#4-autogoaltracker)
5. [AutoNextStep - Sonraki Adım Önerisi](#5-autonextstep)
6. [AutoTaskFromQuote - Otomatik Görev Atama](#6-autotaskfromquote)
7. [CustomerFollowup - Sessiz Müşteri Takibi](#7-customerfollowup)
8. [AutoNoteOnEdit - Değişiklik Günlüğü](#8-autonoteonedit)
9. [QuickThankYou - Otomatik Teşekkür](#9-quickthankyou)
10. [SmartFileNaming - PDF Dosya Adı Standardı](#10-smartfilenaming)

---

## 1️⃣ Smart Reminder - Günlük Bildirimler

### 📝 Açıklama
Kullanıcı dashboard'a giriş yaptığında otomatik olarak günlük özet gösterilir:
- Onay bekleyen teklifler
- 7 günden uzun süredir görüşülmeyen müşteriler
- Teslim bekleyen sevkiyatlar

### ✅ Test Senaryosu 1: Dashboard Giriş Bildirimi

**Adımlar:**
1. Sisteme giriş yap
2. Dashboard sayfasına git (`/dashboard`)
3. Sayfanın üst kısmında "Bugünün Özeti" kartını kontrol et

**Beklenen Sonuç:**
- ✅ Eğer onay bekleyen teklif varsa: "X teklifin onay bekliyor." mesajı görünür
- ✅ Eğer 7 günden uzun süredir görüşülmeyen müşteri varsa: "X müşterinle 7 gündür görüşmedin." mesajı görünür
- ✅ Eğer teslim bekleyen sevkiyat varsa: "X sevkiyat teslim bekliyor." mesajı görünür
- ✅ Her mesajın yanında "Görüntüle →", "Takip Et →", "Kontrol Et →" linkleri bulunur
- ✅ Sağ üstte "X" butonu ile kapatılabilir

**Test Verileri Hazırlama:**
```sql
-- Onay bekleyen teklif oluştur
INSERT INTO "Quote" (title, status, total, "companyId") 
VALUES ('Test Teklif', 'SENT', 10000, 'your-company-id');

-- 7 günden eski müşteri oluştur
INSERT INTO "Customer" (name, status, "companyId", "updatedAt") 
VALUES ('Eski Müşteri', 'ACTIVE', 'your-company-id', NOW() - INTERVAL '10 days');

-- Teslim bekleyen sevkiyat oluştur
INSERT INTO "Shipment" (status, "companyId") 
VALUES ('PENDING', 'your-company-id');
```

### ✅ Test Senaryosu 2: Bildirimi Kapatma

**Adımlar:**
1. Dashboard'da Smart Reminder kartını gör
2. Sağ üstteki "X" butonuna tıkla
3. Sayfayı yenile (F5)

**Beklenen Sonuç:**
- ✅ Kart kapanır ve görünmez
- ✅ Sayfa yenilendiğinde kart tekrar görünmez (24 saat boyunca)
- ✅ 24 saat sonra tekrar görünür

---

## 2️⃣ QuickActions - Hızlı İşlem Butonları

### 📝 Açıklama
Duruma göre otomatik olarak hızlı işlem butonları gösterilir:
- Teklif ACCEPTED → "Fatura Oluştur" butonu
- Fatura SENT/PAID → "Sevkiyat Hazırla" butonu
- Sevkiyat PENDING → "Sevkiyatı Onayla" butonu

### ✅ Test Senaryosu 1: Teklif Kabul Edildiğinde Fatura Butonu

**Adımlar:**
1. Teklifler sayfasına git (`/quotes`)
2. Bir teklif oluştur veya mevcut bir teklifi seç
3. Teklif detay sayfasına git (`/quotes/[id]`)
4. Teklif durumunu "ACCEPTED" yap
5. Sayfayı yenile

**Beklenen Sonuç:**
- ✅ "Fatura Oluştur" butonu görünür (parlayan efekt ile)
- ✅ Butona tıklandığında `/invoices/new?quoteId=[id]` sayfasına yönlendirilir
- ✅ Fatura formu açılır ve teklif bilgileri otomatik doldurulur

**Test Verileri Hazırlama:**
```sql
-- ACCEPTED durumunda teklif oluştur
INSERT INTO "Quote" (title, status, total, "companyId") 
VALUES ('Kabul Edilen Teklif', 'ACCEPTED', 15000, 'your-company-id');
```

### ✅ Test Senaryosu 2: Fatura Kesildiğinde Sevkiyat Butonu

**Adımlar:**
1. Faturalar sayfasına git (`/invoices`)
2. Bir fatura oluştur veya mevcut bir faturayı seç
3. Fatura durumunu "SENT" veya "PAID" yap
4. Fatura detay sayfasına git (`/invoices/[id]`)
5. Sayfayı yenile

**Beklenen Sonuç:**
- ✅ "Sevkiyat Hazırla" butonu görünür (parlayan efekt ile)
- ✅ Butona tıklandığında `/shipments/new?invoiceId=[id]` sayfasına yönlendirilir
- ✅ Sevkiyat formu açılır ve fatura bilgileri otomatik doldurulur

**Test Verileri Hazırlama:**
```sql
-- SENT durumunda fatura oluştur
INSERT INTO "Invoice" (title, status, total, "companyId") 
VALUES ('Gönderilen Fatura', 'SENT', 20000, 'your-company-id');
```

### ✅ Test Senaryosu 3: Sevkiyat Beklemede Onay Butonu

**Adımlar:**
1. Sevkiyatlar sayfasına git (`/shipments`)
2. Bir sevkiyat oluştur veya mevcut bir sevkiyatı seç
3. Sevkiyat durumunu "PENDING" yap
4. Sevkiyat detay sayfasına git (`/shipments/[id]`)
5. Sayfayı yenile

**Beklenen Sonuç:**
- ✅ "Sevkiyatı Onayla" butonu görünür (parlayan efekt ile)
- ✅ Butona tıklandığında sevkiyat detay sayfasına yönlendirilir
- ✅ Onaylama işlemi yapılabilir

**Test Verileri Hazırlama:**
```sql
-- PENDING durumunda sevkiyat oluştur
INSERT INTO "Shipment" (status, "companyId") 
VALUES ('PENDING', 'your-company-id');
```

---

## 3️⃣ SmartEmptyState - Boş Ekran Önerileri

### 📝 Açıklama
Boş listelerde kullanıcıya yardımcı mesajlar ve hızlı aksiyon butonları gösterilir.

### ✅ Test Senaryosu 1: Boş Teklif Listesi

**Adımlar:**
1. Yeni bir şirket oluştur veya tüm teklifleri sil
2. Teklifler sayfasına git (`/quotes`)
3. Liste boş olduğunda görünen mesajı kontrol et

**Beklenen Sonuç:**
- ✅ "Henüz teklif oluşturmadın" başlığı görünür
- ✅ "İlk teklifini oluşturarak müşterilerine profesyonel teklifler sunmaya başla." mesajı görünür
- ✅ "Teklif Oluştur" butonu görünür
- ✅ Butona tıklandığında `/quotes/new` sayfasına yönlendirilir

### ✅ Test Senaryosu 2: Boş Müşteri Listesi

**Adımlar:**
1. Yeni bir şirket oluştur veya tüm müşterileri sil
2. Müşteriler sayfasına git (`/customers`)
3. Liste boş olduğunda görünen mesajı kontrol et

**Beklenen Sonuç:**
- ✅ "Henüz müşteri eklemedin" başlığı görünür
- ✅ "İlk müşterini ekleyerek CRM sistemini kullanmaya başla." mesajı görünür
- ✅ "Müşteri Ekle" butonu görünür
- ✅ Butona tıklandığında `/customers/new` sayfasına yönlendirilir

### ✅ Test Senaryosu 3: Boş Fatura Listesi

**Adımlar:**
1. Yeni bir şirket oluştur veya tüm faturaları sil
2. Faturalar sayfasına git (`/invoices`)
3. Liste boş olduğunda görünen mesajı kontrol et

**Beklenen Sonuç:**
- ✅ "Henüz fatura oluşturmadın" başlığı görünür
- ✅ "İlk faturanı oluşturarak satış sürecini başlat." mesajı görünür
- ✅ "Fatura Oluştur" butonu görünür
- ✅ Butona tıklandığında `/invoices/new` sayfasına yönlendirilir

---

## 4️⃣ AutoGoalTracker - Hedef Takibi

### 📝 Açıklama
Kullanıcı aylık satış hedefi belirler ve sistem otomatik olarak ilerlemeyi takip eder.

### ✅ Test Senaryosu 1: Hedef Belirleme

**Adımlar:**
1. Dashboard sayfasına git (`/dashboard`)
2. "Aylık Hedef Belirle" kartını bul
3. "Hedef Belirle" butonuna tıkla
4. Hedef tutarı gir (örn: 50000)
5. Kaydet butonuna tıkla

**Beklenen Sonuç:**
- ✅ Hedef başarıyla kaydedilir
- ✅ Kart güncellenir ve ilerleme çubuğu görünür
- ✅ "İlerleme: 0₺" ve "Hedef: 50.000₺" bilgileri görünür
- ✅ İlerleme yüzdesi %0 olarak görünür

### ✅ Test Senaryosu 2: İlerleme Takibi

**Adımlar:**
1. Dashboard'da hedef belirle (örn: 50000₺)
2. Bir fatura oluştur ve durumunu "PAID" yap (örn: 20000₺)
3. Dashboard'u yenile

**Beklenen Sonuç:**
- ✅ İlerleme çubuğu %40'a kadar dolar (20000/50000)
- ✅ "İlerleme: 20.000₺" ve "Kalan: 30.000₺" bilgileri görünür
- ✅ İlerleme yüzdesi %40 olarak görünür

**Test Verileri Hazırlama:**
```sql
-- Bu ay PAID durumunda fatura oluştur
INSERT INTO "Invoice" (title, status, total, "companyId", "createdAt") 
VALUES ('Ödenen Fatura', 'PAID', 20000, 'your-company-id', NOW());
```

### ✅ Test Senaryosu 3: Hedef Aşımı

**Adımlar:**
1. Dashboard'da hedef belirle (örn: 50000₺)
2. Toplam 60000₺ değerinde PAID fatura oluştur
3. Dashboard'u yenile

**Beklenen Sonuç:**
- ✅ İlerleme çubuğu %100'e ulaşır
- ✅ "🎉 Tebrikler! Hedefini aştın!" mesajı görünür
- ✅ İlerleme yüzdesi %120 olarak görünür (60000/50000)

**Test Verileri Hazırlama:**
```sql
-- Bu ay PAID durumunda fatura oluştur (toplam 60000₺)
INSERT INTO "Invoice" (title, status, total, "companyId", "createdAt") 
VALUES ('Fatura 1', 'PAID', 30000, 'your-company-id', NOW()),
       ('Fatura 2', 'PAID', 30000, 'your-company-id', NOW());
```

### ✅ Test Senaryosu 4: Hedef Düzenleme

**Adımlar:**
1. Dashboard'da mevcut hedefi gör
2. Düzenle butonuna (kalem ikonu) tıkla
3. Yeni hedef tutarı gir (örn: 75000)
4. Kaydet butonuna tıkla

**Beklenen Sonuç:**
- ✅ Hedef başarıyla güncellenir
- ✅ İlerleme çubuğu yeni hedefe göre yeniden hesaplanır
- ✅ Yeni hedef tutarı görünür

---

## 5️⃣ AutoNextStep - Sonraki Adım Önerisi

### 📝 Açıklama
Bir modül tamamlandığında sistem otomatik olarak sonraki adımı önerir.

### ✅ Test Senaryosu 1: Teklif Kabul Edildiğinde Fatura Önerisi

**Adımlar:**
1. Bir teklif oluştur
2. Teklif durumunu "ACCEPTED" yap
3. Teklif detay sayfasında bildirimi kontrol et

**Beklenen Sonuç:**
- ✅ "Teklif kabul edildi! Fatura oluşturmak ister misin?" mesajı görünür
- ✅ "Fatura Oluştur" butonu görünür
- ✅ Butona tıklandığında fatura formu açılır

**Test Verileri Hazırlama:**
```sql
-- ACCEPTED durumunda teklif oluştur
INSERT INTO "Quote" (title, status, total, "companyId") 
VALUES ('Kabul Edilen Teklif', 'ACCEPTED', 15000, 'your-company-id');
```

### ✅ Test Senaryosu 2: Fatura Kesildiğinde Sevkiyat Önerisi

**Adımlar:**
1. Bir fatura oluştur
2. Fatura durumunu "PAID" yap
3. Fatura detay sayfasında bildirimi kontrol et

**Beklenen Sonuç:**
- ✅ "Fatura ödendi! Sevkiyat taslağı oluşturuldu, açmak ister misin?" mesajı görünür
- ✅ "Sevkiyat Hazırla" butonu görünür
- ✅ Butona tıklandığında sevkiyat formu açılır

**Test Verileri Hazırlama:**
```sql
-- PAID durumunda fatura oluştur
INSERT INTO "Invoice" (title, status, total, "companyId") 
VALUES ('Ödenen Fatura', 'PAID', 20000, 'your-company-id');
```

---

## 6️⃣ AutoTaskFromQuote - Otomatik Görev Atama

### 📝 Açıklama
Teklif oluşturulduğunda otomatik olarak görev açılır ve teklif sahibine atanır.

### ✅ Test Senaryosu 1: Teklif Oluşturulduğunda Görev Açılması

**Adımlar:**
1. Yeni bir teklif oluştur
2. Teklif kaydedildikten sonra Görevler sayfasına git (`/tasks`)
3. Yeni oluşturulan görevi kontrol et

**Beklenen Sonuç:**
- ✅ Yeni bir görev oluşturulur
- ✅ Görev başlığı: "Bu teklif için 3 gün içinde müşteriyi ara"
- ✅ Görev teklif sahibine atanır
- ✅ Görev durumu "TODO" olarak görünür

**Test Verileri Hazırlama:**
```sql
-- Teklif oluştur (otomatik görev açılacak)
INSERT INTO "Quote" (title, status, total, "companyId", "userId") 
VALUES ('Yeni Teklif', 'DRAFT', 10000, 'your-company-id', 'your-user-id');
```

---

## 7️⃣ CustomerFollowup - Sessiz Müşteri Takibi

### 📝 Açıklama
14 gün boyunca hiç etkileşim olmayan müşteri "Takip Et" listesine düşer.

### ✅ Test Senaryosu 1: Sessiz Müşteri Tespiti

**Adımlar:**
1. Bir müşteri oluştur
2. Müşterinin `updatedAt` tarihini 15 gün öncesine ayarla
3. Dashboard'da "Pasif Müşteriler" kutusunu kontrol et

**Beklenen Sonuç:**
- ✅ Müşteri "Pasif Müşteriler" listesine eklenir
- ✅ "14 günden uzun süredir görüşülmeyen müşteriler" mesajı görünür
- ✅ Müşteri listesinde "Takip Et" butonu görünür

**Test Verileri Hazırlama:**
```sql
-- 15 gün önce güncellenmiş müşteri oluştur
INSERT INTO "Customer" (name, status, "companyId", "updatedAt") 
VALUES ('Pasif Müşteri', 'ACTIVE', 'your-company-id', NOW() - INTERVAL '15 days');
```

### ✅ Test Senaryosu 2: Müşteri Etkileşimi Sonrası Listeden Çıkma

**Adımlar:**
1. Pasif müşteri listesinde bir müşteri seç
2. Müşteriye yeni bir teklif oluştur
3. Dashboard'u yenile

**Beklenen Sonuç:**
- ✅ Müşteri "Pasif Müşteriler" listesinden çıkar
- ✅ Müşterinin `updatedAt` tarihi güncellenir
- ✅ Liste güncellenir

**Test Verileri Hazırlama:**
```sql
-- Müşteriye teklif oluştur (updatedAt güncellenecek)
INSERT INTO "Quote" (title, status, total, "companyId", "customerId") 
VALUES ('Yeni Teklif', 'DRAFT', 10000, 'your-company-id', 'passive-customer-id');
```

---

## 8️⃣ AutoNoteOnEdit - Değişiklik Günlüğü

### 📝 Açıklama
Kullanıcı bir teklif veya fatura düzenlediğinde sistem otomatik not ekler.

### ✅ Test Senaryosu 1: Fiyat Güncelleme Notu

**Adımlar:**
1. Bir teklif oluştur (toplam: 10000₺)
2. Teklifi düzenle ve toplam tutarı 12000₺ yap
3. Kaydet
4. ActivityLog'u kontrol et (`/activity`)

**Beklenen Sonuç:**
- ✅ ActivityLog'a yeni kayıt eklenir
- ✅ Kayıt açıklaması: "Fiyat güncellendi (eski: 10.000₺ → yeni: 12.000₺)"
- ✅ Kayıt meta bilgilerinde eski ve yeni değerler bulunur

**Test Verileri Hazırlama:**
```sql
-- Teklif oluştur
INSERT INTO "Quote" (title, status, total, "companyId") 
VALUES ('Test Teklif', 'DRAFT', 10000, 'your-company-id');
```

### ✅ Test Senaryosu 2: Durum Değişikliği Notu

**Adımlar:**
1. Bir teklif oluştur (durum: DRAFT)
2. Teklif durumunu "SENT" yap
3. Kaydet
4. ActivityLog'u kontrol et

**Beklenen Sonuç:**
- ✅ ActivityLog'a yeni kayıt eklenir
- ✅ Kayıt açıklaması: "Teklif durumu güncellendi: DRAFT → SENT"
- ✅ Kayıt meta bilgilerinde eski ve yeni durum bulunur

---

## 9️⃣ QuickThankYou - Otomatik Teşekkür

### 📝 Açıklama
Fatura ödendiğinde veya teklif kabul edildiğinde müşteriye otomatik e-posta gider.

### ✅ Test Senaryosu 1: Teklif Kabul Edildiğinde Teşekkür E-postası

**Adımlar:**
1. Bir teklif oluştur
2. Teklif durumunu "ACCEPTED" yap
3. E-posta gönderim logunu kontrol et

**Beklenen Sonuç:**
- ✅ Müşteriye otomatik e-posta gönderilir
- ✅ E-posta konusu: "Teklifiniz Kabul Edildi - Teşekkürler"
- ✅ E-posta içeriği: "İş birliğiniz için teşekkür ederiz 💫"

**Test Verileri Hazırlama:**
```sql
-- ACCEPTED durumunda teklif oluştur
INSERT INTO "Quote" (title, status, total, "companyId", "customerId") 
VALUES ('Kabul Edilen Teklif', 'ACCEPTED', 15000, 'your-company-id', 'customer-id');
```

### ✅ Test Senaryosu 2: Fatura Ödendiğinde Teşekkür E-postası

**Adımlar:**
1. Bir fatura oluştur
2. Fatura durumunu "PAID" yap
3. E-posta gönderim logunu kontrol et

**Beklenen Sonuç:**
- ✅ Müşteriye otomatik e-posta gönderilir
- ✅ E-posta konusu: "Ödemeniz Alındı - Teşekkürler"
- ✅ E-posta içeriği: "Ödemeniz için teşekkür ederiz 💫"

**Test Verileri Hazırlama:**
```sql
-- PAID durumunda fatura oluştur
INSERT INTO "Invoice" (title, status, total, "companyId", "customerId") 
VALUES ('Ödenen Fatura', 'PAID', 20000, 'your-company-id', 'customer-id');
```

---

## 🔟 SmartFileNaming - PDF Dosya Adı Standardı

### 📝 Açıklama
Teklif/Fatura PDF kaydedilirken otomatik şu formatta adlandırılır:
`PI_2025-11-07_TIPPLUS_XYZMEDIKAL_#001.pdf`

### ✅ Test Senaryosu 1: Teklif PDF İndirme

**Adımlar:**
1. Bir teklif oluştur
2. Teklif detay sayfasına git (`/quotes/[id]`)
3. "PDF İndir" butonuna tıkla
4. İndirilen dosya adını kontrol et

**Beklenen Sonuç:**
- ✅ PDF dosyası indirilir
- ✅ Dosya adı formatı: `PI_YYYY-MM-DD_COMPANYNAME_CUSTOMERNAME_#XXX.pdf`
- ✅ Örnek: `PI_2025-01-15_TIPPLUS_XYZMEDIKAL_#001.pdf`

**Test Verileri Hazırlama:**
```sql
-- Teklif oluştur
INSERT INTO "Quote" (title, status, total, "companyId") 
VALUES ('Test Teklif', 'DRAFT', 10000, 'your-company-id');
```

### ✅ Test Senaryosu 2: Fatura PDF İndirme

**Adımlar:**
1. Bir fatura oluştur
2. Fatura detay sayfasına git (`/invoices/[id]`)
3. "PDF İndir" butonuna tıkla
4. İndirilen dosya adını kontrol et

**Beklenen Sonuç:**
- ✅ PDF dosyası indirilir
- ✅ Dosya adı formatı: `INV_YYYY-MM-DD_COMPANYNAME_CUSTOMERNAME_#XXX.pdf`
- ✅ Örnek: `INV_2025-01-15_TIPPLUS_XYZMEDIKAL_#001.pdf`

**Test Verileri Hazırlama:**
```sql
-- Fatura oluştur
INSERT INTO "Invoice" (title, status, total, "companyId") 
VALUES ('Test Fatura', 'DRAFT', 15000, 'your-company-id');
```

---

## 📊 Genel Test Kontrol Listesi

### ✅ Tüm Otomasyonlar İçin Ortak Kontroller

1. **API Endpoint Kontrolü**
   - ✅ Tüm API endpoint'leri çalışıyor mu?
   - ✅ Hata durumlarında uygun mesajlar dönüyor mu?
   - ✅ RLS (Row-Level Security) kontrolü yapılıyor mu?

2. **UI/UX Kontrolü**
   - ✅ Tüm component'ler doğru render ediliyor mu?
   - ✅ Loading state'ler gösteriliyor mu?
   - ✅ Error state'ler gösteriliyor mu?
   - ✅ Responsive tasarım çalışıyor mu?

3. **Performans Kontrolü**
   - ✅ API response süreleri < 1000ms mi?
   - ✅ Component render süreleri < 300ms mi?
   - ✅ Cache stratejisi çalışıyor mu?

4. **Güvenlik Kontrolü**
   - ✅ Session kontrolü yapılıyor mu?
   - ✅ CompanyId filtresi uygulanıyor mu?
   - ✅ Input validation yapılıyor mu?

---

## 🐛 Hata Ayıklama İpuçları

### Sorun: Smart Reminder görünmüyor
**Çözüm:**
1. Browser console'u kontrol et (F12)
2. API endpoint'ini manuel test et: `/api/automations/smart-reminder`
3. Session kontrolü yap
4. CompanyId'nin doğru olduğundan emin ol

### Sorun: QuickActions butonları görünmüyor
**Çözüm:**
1. Entity status'unu kontrol et
2. Component'in doğru yerde render edildiğinden emin ol
3. Browser console'da hata var mı kontrol et

### Sorun: AutoGoalTracker hedef kaydedilmiyor
**Çözüm:**
1. API endpoint'ini kontrol et: `/api/automations/goal-tracker`
2. User tablosunda `monthlyGoal` kolonu var mı kontrol et
3. Migration çalıştırıldı mı kontrol et

---

## 📝 Notlar

- Tüm otomasyonlar production-ready değil, bazıları migration gerektirebilir
- Test verileri hazırlarken gerçek companyId ve userId kullanın
- ActivityLog kayıtları otomatik oluşturulur, manuel kontrol gerekmez
- E-posta gönderimi için SMTP ayarları yapılmalıdır

---

## 🎯 Sonuç

Bu test senaryoları ile tüm otomasyonların çalıştığından emin olabilirsiniz. Her senaryo adım adım takip edilerek sistemin doğru çalıştığı doğrulanabilir.

**Test Sırası:**
1. Önce Smart Reminder'ı test et
2. Sonra QuickActions'ı test et
3. SmartEmptyState'i test et
4. AutoGoalTracker'ı test et
5. Diğer otomasyonları sırayla test et

**Başarı Kriterleri:**
- ✅ Tüm API endpoint'leri 200 status code dönüyor
- ✅ Tüm UI component'leri doğru render ediliyor
- ✅ Tüm otomasyonlar beklenen şekilde çalışıyor
- ✅ Hata durumlarında uygun mesajlar gösteriliyor


Bu dokümanda tüm otomasyonların test senaryoları ve kullanım kılavuzu bulunmaktadır.

---

## 📋 İçindekiler

1. [Smart Reminder - Günlük Bildirimler](#1-smart-reminder)
2. [QuickActions - Hızlı İşlem Butonları](#2-quickactions)
3. [SmartEmptyState - Boş Ekran Önerileri](#3-smartemptystate)
4. [AutoGoalTracker - Hedef Takibi](#4-autogoaltracker)
5. [AutoNextStep - Sonraki Adım Önerisi](#5-autonextstep)
6. [AutoTaskFromQuote - Otomatik Görev Atama](#6-autotaskfromquote)
7. [CustomerFollowup - Sessiz Müşteri Takibi](#7-customerfollowup)
8. [AutoNoteOnEdit - Değişiklik Günlüğü](#8-autonoteonedit)
9. [QuickThankYou - Otomatik Teşekkür](#9-quickthankyou)
10. [SmartFileNaming - PDF Dosya Adı Standardı](#10-smartfilenaming)

---

## 1️⃣ Smart Reminder - Günlük Bildirimler

### 📝 Açıklama
Kullanıcı dashboard'a giriş yaptığında otomatik olarak günlük özet gösterilir:
- Onay bekleyen teklifler
- 7 günden uzun süredir görüşülmeyen müşteriler
- Teslim bekleyen sevkiyatlar

### ✅ Test Senaryosu 1: Dashboard Giriş Bildirimi

**Adımlar:**
1. Sisteme giriş yap
2. Dashboard sayfasına git (`/dashboard`)
3. Sayfanın üst kısmında "Bugünün Özeti" kartını kontrol et

**Beklenen Sonuç:**
- ✅ Eğer onay bekleyen teklif varsa: "X teklifin onay bekliyor." mesajı görünür
- ✅ Eğer 7 günden uzun süredir görüşülmeyen müşteri varsa: "X müşterinle 7 gündür görüşmedin." mesajı görünür
- ✅ Eğer teslim bekleyen sevkiyat varsa: "X sevkiyat teslim bekliyor." mesajı görünür
- ✅ Her mesajın yanında "Görüntüle →", "Takip Et →", "Kontrol Et →" linkleri bulunur
- ✅ Sağ üstte "X" butonu ile kapatılabilir

**Test Verileri Hazırlama:**
```sql
-- Onay bekleyen teklif oluştur
INSERT INTO "Quote" (title, status, total, "companyId") 
VALUES ('Test Teklif', 'SENT', 10000, 'your-company-id');

-- 7 günden eski müşteri oluştur
INSERT INTO "Customer" (name, status, "companyId", "updatedAt") 
VALUES ('Eski Müşteri', 'ACTIVE', 'your-company-id', NOW() - INTERVAL '10 days');

-- Teslim bekleyen sevkiyat oluştur
INSERT INTO "Shipment" (status, "companyId") 
VALUES ('PENDING', 'your-company-id');
```

### ✅ Test Senaryosu 2: Bildirimi Kapatma

**Adımlar:**
1. Dashboard'da Smart Reminder kartını gör
2. Sağ üstteki "X" butonuna tıkla
3. Sayfayı yenile (F5)

**Beklenen Sonuç:**
- ✅ Kart kapanır ve görünmez
- ✅ Sayfa yenilendiğinde kart tekrar görünmez (24 saat boyunca)
- ✅ 24 saat sonra tekrar görünür

---

## 2️⃣ QuickActions - Hızlı İşlem Butonları

### 📝 Açıklama
Duruma göre otomatik olarak hızlı işlem butonları gösterilir:
- Teklif ACCEPTED → "Fatura Oluştur" butonu
- Fatura SENT/PAID → "Sevkiyat Hazırla" butonu
- Sevkiyat PENDING → "Sevkiyatı Onayla" butonu

### ✅ Test Senaryosu 1: Teklif Kabul Edildiğinde Fatura Butonu

**Adımlar:**
1. Teklifler sayfasına git (`/quotes`)
2. Bir teklif oluştur veya mevcut bir teklifi seç
3. Teklif detay sayfasına git (`/quotes/[id]`)
4. Teklif durumunu "ACCEPTED" yap
5. Sayfayı yenile

**Beklenen Sonuç:**
- ✅ "Fatura Oluştur" butonu görünür (parlayan efekt ile)
- ✅ Butona tıklandığında `/invoices/new?quoteId=[id]` sayfasına yönlendirilir
- ✅ Fatura formu açılır ve teklif bilgileri otomatik doldurulur

**Test Verileri Hazırlama:**
```sql
-- ACCEPTED durumunda teklif oluştur
INSERT INTO "Quote" (title, status, total, "companyId") 
VALUES ('Kabul Edilen Teklif', 'ACCEPTED', 15000, 'your-company-id');
```

### ✅ Test Senaryosu 2: Fatura Kesildiğinde Sevkiyat Butonu

**Adımlar:**
1. Faturalar sayfasına git (`/invoices`)
2. Bir fatura oluştur veya mevcut bir faturayı seç
3. Fatura durumunu "SENT" veya "PAID" yap
4. Fatura detay sayfasına git (`/invoices/[id]`)
5. Sayfayı yenile

**Beklenen Sonuç:**
- ✅ "Sevkiyat Hazırla" butonu görünür (parlayan efekt ile)
- ✅ Butona tıklandığında `/shipments/new?invoiceId=[id]` sayfasına yönlendirilir
- ✅ Sevkiyat formu açılır ve fatura bilgileri otomatik doldurulur

**Test Verileri Hazırlama:**
```sql
-- SENT durumunda fatura oluştur
INSERT INTO "Invoice" (title, status, total, "companyId") 
VALUES ('Gönderilen Fatura', 'SENT', 20000, 'your-company-id');
```

### ✅ Test Senaryosu 3: Sevkiyat Beklemede Onay Butonu

**Adımlar:**
1. Sevkiyatlar sayfasına git (`/shipments`)
2. Bir sevkiyat oluştur veya mevcut bir sevkiyatı seç
3. Sevkiyat durumunu "PENDING" yap
4. Sevkiyat detay sayfasına git (`/shipments/[id]`)
5. Sayfayı yenile

**Beklenen Sonuç:**
- ✅ "Sevkiyatı Onayla" butonu görünür (parlayan efekt ile)
- ✅ Butona tıklandığında sevkiyat detay sayfasına yönlendirilir
- ✅ Onaylama işlemi yapılabilir

**Test Verileri Hazırlama:**
```sql
-- PENDING durumunda sevkiyat oluştur
INSERT INTO "Shipment" (status, "companyId") 
VALUES ('PENDING', 'your-company-id');
```

---

## 3️⃣ SmartEmptyState - Boş Ekran Önerileri

### 📝 Açıklama
Boş listelerde kullanıcıya yardımcı mesajlar ve hızlı aksiyon butonları gösterilir.

### ✅ Test Senaryosu 1: Boş Teklif Listesi

**Adımlar:**
1. Yeni bir şirket oluştur veya tüm teklifleri sil
2. Teklifler sayfasına git (`/quotes`)
3. Liste boş olduğunda görünen mesajı kontrol et

**Beklenen Sonuç:**
- ✅ "Henüz teklif oluşturmadın" başlığı görünür
- ✅ "İlk teklifini oluşturarak müşterilerine profesyonel teklifler sunmaya başla." mesajı görünür
- ✅ "Teklif Oluştur" butonu görünür
- ✅ Butona tıklandığında `/quotes/new` sayfasına yönlendirilir

### ✅ Test Senaryosu 2: Boş Müşteri Listesi

**Adımlar:**
1. Yeni bir şirket oluştur veya tüm müşterileri sil
2. Müşteriler sayfasına git (`/customers`)
3. Liste boş olduğunda görünen mesajı kontrol et

**Beklenen Sonuç:**
- ✅ "Henüz müşteri eklemedin" başlığı görünür
- ✅ "İlk müşterini ekleyerek CRM sistemini kullanmaya başla." mesajı görünür
- ✅ "Müşteri Ekle" butonu görünür
- ✅ Butona tıklandığında `/customers/new` sayfasına yönlendirilir

### ✅ Test Senaryosu 3: Boş Fatura Listesi

**Adımlar:**
1. Yeni bir şirket oluştur veya tüm faturaları sil
2. Faturalar sayfasına git (`/invoices`)
3. Liste boş olduğunda görünen mesajı kontrol et

**Beklenen Sonuç:**
- ✅ "Henüz fatura oluşturmadın" başlığı görünür
- ✅ "İlk faturanı oluşturarak satış sürecini başlat." mesajı görünür
- ✅ "Fatura Oluştur" butonu görünür
- ✅ Butona tıklandığında `/invoices/new` sayfasına yönlendirilir

---

## 4️⃣ AutoGoalTracker - Hedef Takibi

### 📝 Açıklama
Kullanıcı aylık satış hedefi belirler ve sistem otomatik olarak ilerlemeyi takip eder.

### ✅ Test Senaryosu 1: Hedef Belirleme

**Adımlar:**
1. Dashboard sayfasına git (`/dashboard`)
2. "Aylık Hedef Belirle" kartını bul
3. "Hedef Belirle" butonuna tıkla
4. Hedef tutarı gir (örn: 50000)
5. Kaydet butonuna tıkla

**Beklenen Sonuç:**
- ✅ Hedef başarıyla kaydedilir
- ✅ Kart güncellenir ve ilerleme çubuğu görünür
- ✅ "İlerleme: 0₺" ve "Hedef: 50.000₺" bilgileri görünür
- ✅ İlerleme yüzdesi %0 olarak görünür

### ✅ Test Senaryosu 2: İlerleme Takibi

**Adımlar:**
1. Dashboard'da hedef belirle (örn: 50000₺)
2. Bir fatura oluştur ve durumunu "PAID" yap (örn: 20000₺)
3. Dashboard'u yenile

**Beklenen Sonuç:**
- ✅ İlerleme çubuğu %40'a kadar dolar (20000/50000)
- ✅ "İlerleme: 20.000₺" ve "Kalan: 30.000₺" bilgileri görünür
- ✅ İlerleme yüzdesi %40 olarak görünür

**Test Verileri Hazırlama:**
```sql
-- Bu ay PAID durumunda fatura oluştur
INSERT INTO "Invoice" (title, status, total, "companyId", "createdAt") 
VALUES ('Ödenen Fatura', 'PAID', 20000, 'your-company-id', NOW());
```

### ✅ Test Senaryosu 3: Hedef Aşımı

**Adımlar:**
1. Dashboard'da hedef belirle (örn: 50000₺)
2. Toplam 60000₺ değerinde PAID fatura oluştur
3. Dashboard'u yenile

**Beklenen Sonuç:**
- ✅ İlerleme çubuğu %100'e ulaşır
- ✅ "🎉 Tebrikler! Hedefini aştın!" mesajı görünür
- ✅ İlerleme yüzdesi %120 olarak görünür (60000/50000)

**Test Verileri Hazırlama:**
```sql
-- Bu ay PAID durumunda fatura oluştur (toplam 60000₺)
INSERT INTO "Invoice" (title, status, total, "companyId", "createdAt") 
VALUES ('Fatura 1', 'PAID', 30000, 'your-company-id', NOW()),
       ('Fatura 2', 'PAID', 30000, 'your-company-id', NOW());
```

### ✅ Test Senaryosu 4: Hedef Düzenleme

**Adımlar:**
1. Dashboard'da mevcut hedefi gör
2. Düzenle butonuna (kalem ikonu) tıkla
3. Yeni hedef tutarı gir (örn: 75000)
4. Kaydet butonuna tıkla

**Beklenen Sonuç:**
- ✅ Hedef başarıyla güncellenir
- ✅ İlerleme çubuğu yeni hedefe göre yeniden hesaplanır
- ✅ Yeni hedef tutarı görünür

---

## 5️⃣ AutoNextStep - Sonraki Adım Önerisi

### 📝 Açıklama
Bir modül tamamlandığında sistem otomatik olarak sonraki adımı önerir.

### ✅ Test Senaryosu 1: Teklif Kabul Edildiğinde Fatura Önerisi

**Adımlar:**
1. Bir teklif oluştur
2. Teklif durumunu "ACCEPTED" yap
3. Teklif detay sayfasında bildirimi kontrol et

**Beklenen Sonuç:**
- ✅ "Teklif kabul edildi! Fatura oluşturmak ister misin?" mesajı görünür
- ✅ "Fatura Oluştur" butonu görünür
- ✅ Butona tıklandığında fatura formu açılır

**Test Verileri Hazırlama:**
```sql
-- ACCEPTED durumunda teklif oluştur
INSERT INTO "Quote" (title, status, total, "companyId") 
VALUES ('Kabul Edilen Teklif', 'ACCEPTED', 15000, 'your-company-id');
```

### ✅ Test Senaryosu 2: Fatura Kesildiğinde Sevkiyat Önerisi

**Adımlar:**
1. Bir fatura oluştur
2. Fatura durumunu "PAID" yap
3. Fatura detay sayfasında bildirimi kontrol et

**Beklenen Sonuç:**
- ✅ "Fatura ödendi! Sevkiyat taslağı oluşturuldu, açmak ister misin?" mesajı görünür
- ✅ "Sevkiyat Hazırla" butonu görünür
- ✅ Butona tıklandığında sevkiyat formu açılır

**Test Verileri Hazırlama:**
```sql
-- PAID durumunda fatura oluştur
INSERT INTO "Invoice" (title, status, total, "companyId") 
VALUES ('Ödenen Fatura', 'PAID', 20000, 'your-company-id');
```

---

## 6️⃣ AutoTaskFromQuote - Otomatik Görev Atama

### 📝 Açıklama
Teklif oluşturulduğunda otomatik olarak görev açılır ve teklif sahibine atanır.

### ✅ Test Senaryosu 1: Teklif Oluşturulduğunda Görev Açılması

**Adımlar:**
1. Yeni bir teklif oluştur
2. Teklif kaydedildikten sonra Görevler sayfasına git (`/tasks`)
3. Yeni oluşturulan görevi kontrol et

**Beklenen Sonuç:**
- ✅ Yeni bir görev oluşturulur
- ✅ Görev başlığı: "Bu teklif için 3 gün içinde müşteriyi ara"
- ✅ Görev teklif sahibine atanır
- ✅ Görev durumu "TODO" olarak görünür

**Test Verileri Hazırlama:**
```sql
-- Teklif oluştur (otomatik görev açılacak)
INSERT INTO "Quote" (title, status, total, "companyId", "userId") 
VALUES ('Yeni Teklif', 'DRAFT', 10000, 'your-company-id', 'your-user-id');
```

---

## 7️⃣ CustomerFollowup - Sessiz Müşteri Takibi

### 📝 Açıklama
14 gün boyunca hiç etkileşim olmayan müşteri "Takip Et" listesine düşer.

### ✅ Test Senaryosu 1: Sessiz Müşteri Tespiti

**Adımlar:**
1. Bir müşteri oluştur
2. Müşterinin `updatedAt` tarihini 15 gün öncesine ayarla
3. Dashboard'da "Pasif Müşteriler" kutusunu kontrol et

**Beklenen Sonuç:**
- ✅ Müşteri "Pasif Müşteriler" listesine eklenir
- ✅ "14 günden uzun süredir görüşülmeyen müşteriler" mesajı görünür
- ✅ Müşteri listesinde "Takip Et" butonu görünür

**Test Verileri Hazırlama:**
```sql
-- 15 gün önce güncellenmiş müşteri oluştur
INSERT INTO "Customer" (name, status, "companyId", "updatedAt") 
VALUES ('Pasif Müşteri', 'ACTIVE', 'your-company-id', NOW() - INTERVAL '15 days');
```

### ✅ Test Senaryosu 2: Müşteri Etkileşimi Sonrası Listeden Çıkma

**Adımlar:**
1. Pasif müşteri listesinde bir müşteri seç
2. Müşteriye yeni bir teklif oluştur
3. Dashboard'u yenile

**Beklenen Sonuç:**
- ✅ Müşteri "Pasif Müşteriler" listesinden çıkar
- ✅ Müşterinin `updatedAt` tarihi güncellenir
- ✅ Liste güncellenir

**Test Verileri Hazırlama:**
```sql
-- Müşteriye teklif oluştur (updatedAt güncellenecek)
INSERT INTO "Quote" (title, status, total, "companyId", "customerId") 
VALUES ('Yeni Teklif', 'DRAFT', 10000, 'your-company-id', 'passive-customer-id');
```

---

## 8️⃣ AutoNoteOnEdit - Değişiklik Günlüğü

### 📝 Açıklama
Kullanıcı bir teklif veya fatura düzenlediğinde sistem otomatik not ekler.

### ✅ Test Senaryosu 1: Fiyat Güncelleme Notu

**Adımlar:**
1. Bir teklif oluştur (toplam: 10000₺)
2. Teklifi düzenle ve toplam tutarı 12000₺ yap
3. Kaydet
4. ActivityLog'u kontrol et (`/activity`)

**Beklenen Sonuç:**
- ✅ ActivityLog'a yeni kayıt eklenir
- ✅ Kayıt açıklaması: "Fiyat güncellendi (eski: 10.000₺ → yeni: 12.000₺)"
- ✅ Kayıt meta bilgilerinde eski ve yeni değerler bulunur

**Test Verileri Hazırlama:**
```sql
-- Teklif oluştur
INSERT INTO "Quote" (title, status, total, "companyId") 
VALUES ('Test Teklif', 'DRAFT', 10000, 'your-company-id');
```

### ✅ Test Senaryosu 2: Durum Değişikliği Notu

**Adımlar:**
1. Bir teklif oluştur (durum: DRAFT)
2. Teklif durumunu "SENT" yap
3. Kaydet
4. ActivityLog'u kontrol et

**Beklenen Sonuç:**
- ✅ ActivityLog'a yeni kayıt eklenir
- ✅ Kayıt açıklaması: "Teklif durumu güncellendi: DRAFT → SENT"
- ✅ Kayıt meta bilgilerinde eski ve yeni durum bulunur

---

## 9️⃣ QuickThankYou - Otomatik Teşekkür

### 📝 Açıklama
Fatura ödendiğinde veya teklif kabul edildiğinde müşteriye otomatik e-posta gider.

### ✅ Test Senaryosu 1: Teklif Kabul Edildiğinde Teşekkür E-postası

**Adımlar:**
1. Bir teklif oluştur
2. Teklif durumunu "ACCEPTED" yap
3. E-posta gönderim logunu kontrol et

**Beklenen Sonuç:**
- ✅ Müşteriye otomatik e-posta gönderilir
- ✅ E-posta konusu: "Teklifiniz Kabul Edildi - Teşekkürler"
- ✅ E-posta içeriği: "İş birliğiniz için teşekkür ederiz 💫"

**Test Verileri Hazırlama:**
```sql
-- ACCEPTED durumunda teklif oluştur
INSERT INTO "Quote" (title, status, total, "companyId", "customerId") 
VALUES ('Kabul Edilen Teklif', 'ACCEPTED', 15000, 'your-company-id', 'customer-id');
```

### ✅ Test Senaryosu 2: Fatura Ödendiğinde Teşekkür E-postası

**Adımlar:**
1. Bir fatura oluştur
2. Fatura durumunu "PAID" yap
3. E-posta gönderim logunu kontrol et

**Beklenen Sonuç:**
- ✅ Müşteriye otomatik e-posta gönderilir
- ✅ E-posta konusu: "Ödemeniz Alındı - Teşekkürler"
- ✅ E-posta içeriği: "Ödemeniz için teşekkür ederiz 💫"

**Test Verileri Hazırlama:**
```sql
-- PAID durumunda fatura oluştur
INSERT INTO "Invoice" (title, status, total, "companyId", "customerId") 
VALUES ('Ödenen Fatura', 'PAID', 20000, 'your-company-id', 'customer-id');
```

---

## 🔟 SmartFileNaming - PDF Dosya Adı Standardı

### 📝 Açıklama
Teklif/Fatura PDF kaydedilirken otomatik şu formatta adlandırılır:
`PI_2025-11-07_TIPPLUS_XYZMEDIKAL_#001.pdf`

### ✅ Test Senaryosu 1: Teklif PDF İndirme

**Adımlar:**
1. Bir teklif oluştur
2. Teklif detay sayfasına git (`/quotes/[id]`)
3. "PDF İndir" butonuna tıkla
4. İndirilen dosya adını kontrol et

**Beklenen Sonuç:**
- ✅ PDF dosyası indirilir
- ✅ Dosya adı formatı: `PI_YYYY-MM-DD_COMPANYNAME_CUSTOMERNAME_#XXX.pdf`
- ✅ Örnek: `PI_2025-01-15_TIPPLUS_XYZMEDIKAL_#001.pdf`

**Test Verileri Hazırlama:**
```sql
-- Teklif oluştur
INSERT INTO "Quote" (title, status, total, "companyId") 
VALUES ('Test Teklif', 'DRAFT', 10000, 'your-company-id');
```

### ✅ Test Senaryosu 2: Fatura PDF İndirme

**Adımlar:**
1. Bir fatura oluştur
2. Fatura detay sayfasına git (`/invoices/[id]`)
3. "PDF İndir" butonuna tıkla
4. İndirilen dosya adını kontrol et

**Beklenen Sonuç:**
- ✅ PDF dosyası indirilir
- ✅ Dosya adı formatı: `INV_YYYY-MM-DD_COMPANYNAME_CUSTOMERNAME_#XXX.pdf`
- ✅ Örnek: `INV_2025-01-15_TIPPLUS_XYZMEDIKAL_#001.pdf`

**Test Verileri Hazırlama:**
```sql
-- Fatura oluştur
INSERT INTO "Invoice" (title, status, total, "companyId") 
VALUES ('Test Fatura', 'DRAFT', 15000, 'your-company-id');
```

---

## 📊 Genel Test Kontrol Listesi

### ✅ Tüm Otomasyonlar İçin Ortak Kontroller

1. **API Endpoint Kontrolü**
   - ✅ Tüm API endpoint'leri çalışıyor mu?
   - ✅ Hata durumlarında uygun mesajlar dönüyor mu?
   - ✅ RLS (Row-Level Security) kontrolü yapılıyor mu?

2. **UI/UX Kontrolü**
   - ✅ Tüm component'ler doğru render ediliyor mu?
   - ✅ Loading state'ler gösteriliyor mu?
   - ✅ Error state'ler gösteriliyor mu?
   - ✅ Responsive tasarım çalışıyor mu?

3. **Performans Kontrolü**
   - ✅ API response süreleri < 1000ms mi?
   - ✅ Component render süreleri < 300ms mi?
   - ✅ Cache stratejisi çalışıyor mu?

4. **Güvenlik Kontrolü**
   - ✅ Session kontrolü yapılıyor mu?
   - ✅ CompanyId filtresi uygulanıyor mu?
   - ✅ Input validation yapılıyor mu?

---

## 🐛 Hata Ayıklama İpuçları

### Sorun: Smart Reminder görünmüyor
**Çözüm:**
1. Browser console'u kontrol et (F12)
2. API endpoint'ini manuel test et: `/api/automations/smart-reminder`
3. Session kontrolü yap
4. CompanyId'nin doğru olduğundan emin ol

### Sorun: QuickActions butonları görünmüyor
**Çözüm:**
1. Entity status'unu kontrol et
2. Component'in doğru yerde render edildiğinden emin ol
3. Browser console'da hata var mı kontrol et

### Sorun: AutoGoalTracker hedef kaydedilmiyor
**Çözüm:**
1. API endpoint'ini kontrol et: `/api/automations/goal-tracker`
2. User tablosunda `monthlyGoal` kolonu var mı kontrol et
3. Migration çalıştırıldı mı kontrol et

---

## 📝 Notlar

- Tüm otomasyonlar production-ready değil, bazıları migration gerektirebilir
- Test verileri hazırlarken gerçek companyId ve userId kullanın
- ActivityLog kayıtları otomatik oluşturulur, manuel kontrol gerekmez
- E-posta gönderimi için SMTP ayarları yapılmalıdır

---

## 🎯 Sonuç

Bu test senaryoları ile tüm otomasyonların çalıştığından emin olabilirsiniz. Her senaryo adım adım takip edilerek sistemin doğru çalıştığı doğrulanabilir.

**Test Sırası:**
1. Önce Smart Reminder'ı test et
2. Sonra QuickActions'ı test et
3. SmartEmptyState'i test et
4. AutoGoalTracker'ı test et
5. Diğer otomasyonları sırayla test et

**Başarı Kriterleri:**
- ✅ Tüm API endpoint'leri 200 status code dönüyor
- ✅ Tüm UI component'leri doğru render ediliyor
- ✅ Tüm otomasyonlar beklenen şekilde çalışıyor
- ✅ Hata durumlarında uygun mesajlar gösteriliyor



Bu dokümanda tüm otomasyonların test senaryoları ve kullanım kılavuzu bulunmaktadır.

---

## 📋 İçindekiler

1. [Smart Reminder - Günlük Bildirimler](#1-smart-reminder)
2. [QuickActions - Hızlı İşlem Butonları](#2-quickactions)
3. [SmartEmptyState - Boş Ekran Önerileri](#3-smartemptystate)
4. [AutoGoalTracker - Hedef Takibi](#4-autogoaltracker)
5. [AutoNextStep - Sonraki Adım Önerisi](#5-autonextstep)
6. [AutoTaskFromQuote - Otomatik Görev Atama](#6-autotaskfromquote)
7. [CustomerFollowup - Sessiz Müşteri Takibi](#7-customerfollowup)
8. [AutoNoteOnEdit - Değişiklik Günlüğü](#8-autonoteonedit)
9. [QuickThankYou - Otomatik Teşekkür](#9-quickthankyou)
10. [SmartFileNaming - PDF Dosya Adı Standardı](#10-smartfilenaming)

---

## 1️⃣ Smart Reminder - Günlük Bildirimler

### 📝 Açıklama
Kullanıcı dashboard'a giriş yaptığında otomatik olarak günlük özet gösterilir:
- Onay bekleyen teklifler
- 7 günden uzun süredir görüşülmeyen müşteriler
- Teslim bekleyen sevkiyatlar

### ✅ Test Senaryosu 1: Dashboard Giriş Bildirimi

**Adımlar:**
1. Sisteme giriş yap
2. Dashboard sayfasına git (`/dashboard`)
3. Sayfanın üst kısmında "Bugünün Özeti" kartını kontrol et

**Beklenen Sonuç:**
- ✅ Eğer onay bekleyen teklif varsa: "X teklifin onay bekliyor." mesajı görünür
- ✅ Eğer 7 günden uzun süredir görüşülmeyen müşteri varsa: "X müşterinle 7 gündür görüşmedin." mesajı görünür
- ✅ Eğer teslim bekleyen sevkiyat varsa: "X sevkiyat teslim bekliyor." mesajı görünür
- ✅ Her mesajın yanında "Görüntüle →", "Takip Et →", "Kontrol Et →" linkleri bulunur
- ✅ Sağ üstte "X" butonu ile kapatılabilir

**Test Verileri Hazırlama:**
```sql
-- Onay bekleyen teklif oluştur
INSERT INTO "Quote" (title, status, total, "companyId") 
VALUES ('Test Teklif', 'SENT', 10000, 'your-company-id');

-- 7 günden eski müşteri oluştur
INSERT INTO "Customer" (name, status, "companyId", "updatedAt") 
VALUES ('Eski Müşteri', 'ACTIVE', 'your-company-id', NOW() - INTERVAL '10 days');

-- Teslim bekleyen sevkiyat oluştur
INSERT INTO "Shipment" (status, "companyId") 
VALUES ('PENDING', 'your-company-id');
```

### ✅ Test Senaryosu 2: Bildirimi Kapatma

**Adımlar:**
1. Dashboard'da Smart Reminder kartını gör
2. Sağ üstteki "X" butonuna tıkla
3. Sayfayı yenile (F5)

**Beklenen Sonuç:**
- ✅ Kart kapanır ve görünmez
- ✅ Sayfa yenilendiğinde kart tekrar görünmez (24 saat boyunca)
- ✅ 24 saat sonra tekrar görünür

---

## 2️⃣ QuickActions - Hızlı İşlem Butonları

### 📝 Açıklama
Duruma göre otomatik olarak hızlı işlem butonları gösterilir:
- Teklif ACCEPTED → "Fatura Oluştur" butonu
- Fatura SENT/PAID → "Sevkiyat Hazırla" butonu
- Sevkiyat PENDING → "Sevkiyatı Onayla" butonu

### ✅ Test Senaryosu 1: Teklif Kabul Edildiğinde Fatura Butonu

**Adımlar:**
1. Teklifler sayfasına git (`/quotes`)
2. Bir teklif oluştur veya mevcut bir teklifi seç
3. Teklif detay sayfasına git (`/quotes/[id]`)
4. Teklif durumunu "ACCEPTED" yap
5. Sayfayı yenile

**Beklenen Sonuç:**
- ✅ "Fatura Oluştur" butonu görünür (parlayan efekt ile)
- ✅ Butona tıklandığında `/invoices/new?quoteId=[id]` sayfasına yönlendirilir
- ✅ Fatura formu açılır ve teklif bilgileri otomatik doldurulur

**Test Verileri Hazırlama:**
```sql
-- ACCEPTED durumunda teklif oluştur
INSERT INTO "Quote" (title, status, total, "companyId") 
VALUES ('Kabul Edilen Teklif', 'ACCEPTED', 15000, 'your-company-id');
```

### ✅ Test Senaryosu 2: Fatura Kesildiğinde Sevkiyat Butonu

**Adımlar:**
1. Faturalar sayfasına git (`/invoices`)
2. Bir fatura oluştur veya mevcut bir faturayı seç
3. Fatura durumunu "SENT" veya "PAID" yap
4. Fatura detay sayfasına git (`/invoices/[id]`)
5. Sayfayı yenile

**Beklenen Sonuç:**
- ✅ "Sevkiyat Hazırla" butonu görünür (parlayan efekt ile)
- ✅ Butona tıklandığında `/shipments/new?invoiceId=[id]` sayfasına yönlendirilir
- ✅ Sevkiyat formu açılır ve fatura bilgileri otomatik doldurulur

**Test Verileri Hazırlama:**
```sql
-- SENT durumunda fatura oluştur
INSERT INTO "Invoice" (title, status, total, "companyId") 
VALUES ('Gönderilen Fatura', 'SENT', 20000, 'your-company-id');
```

### ✅ Test Senaryosu 3: Sevkiyat Beklemede Onay Butonu

**Adımlar:**
1. Sevkiyatlar sayfasına git (`/shipments`)
2. Bir sevkiyat oluştur veya mevcut bir sevkiyatı seç
3. Sevkiyat durumunu "PENDING" yap
4. Sevkiyat detay sayfasına git (`/shipments/[id]`)
5. Sayfayı yenile

**Beklenen Sonuç:**
- ✅ "Sevkiyatı Onayla" butonu görünür (parlayan efekt ile)
- ✅ Butona tıklandığında sevkiyat detay sayfasına yönlendirilir
- ✅ Onaylama işlemi yapılabilir

**Test Verileri Hazırlama:**
```sql
-- PENDING durumunda sevkiyat oluştur
INSERT INTO "Shipment" (status, "companyId") 
VALUES ('PENDING', 'your-company-id');
```

---

## 3️⃣ SmartEmptyState - Boş Ekran Önerileri

### 📝 Açıklama
Boş listelerde kullanıcıya yardımcı mesajlar ve hızlı aksiyon butonları gösterilir.

### ✅ Test Senaryosu 1: Boş Teklif Listesi

**Adımlar:**
1. Yeni bir şirket oluştur veya tüm teklifleri sil
2. Teklifler sayfasına git (`/quotes`)
3. Liste boş olduğunda görünen mesajı kontrol et

**Beklenen Sonuç:**
- ✅ "Henüz teklif oluşturmadın" başlığı görünür
- ✅ "İlk teklifini oluşturarak müşterilerine profesyonel teklifler sunmaya başla." mesajı görünür
- ✅ "Teklif Oluştur" butonu görünür
- ✅ Butona tıklandığında `/quotes/new` sayfasına yönlendirilir

### ✅ Test Senaryosu 2: Boş Müşteri Listesi

**Adımlar:**
1. Yeni bir şirket oluştur veya tüm müşterileri sil
2. Müşteriler sayfasına git (`/customers`)
3. Liste boş olduğunda görünen mesajı kontrol et

**Beklenen Sonuç:**
- ✅ "Henüz müşteri eklemedin" başlığı görünür
- ✅ "İlk müşterini ekleyerek CRM sistemini kullanmaya başla." mesajı görünür
- ✅ "Müşteri Ekle" butonu görünür
- ✅ Butona tıklandığında `/customers/new` sayfasına yönlendirilir

### ✅ Test Senaryosu 3: Boş Fatura Listesi

**Adımlar:**
1. Yeni bir şirket oluştur veya tüm faturaları sil
2. Faturalar sayfasına git (`/invoices`)
3. Liste boş olduğunda görünen mesajı kontrol et

**Beklenen Sonuç:**
- ✅ "Henüz fatura oluşturmadın" başlığı görünür
- ✅ "İlk faturanı oluşturarak satış sürecini başlat." mesajı görünür
- ✅ "Fatura Oluştur" butonu görünür
- ✅ Butona tıklandığında `/invoices/new` sayfasına yönlendirilir

---

## 4️⃣ AutoGoalTracker - Hedef Takibi

### 📝 Açıklama
Kullanıcı aylık satış hedefi belirler ve sistem otomatik olarak ilerlemeyi takip eder.

### ✅ Test Senaryosu 1: Hedef Belirleme

**Adımlar:**
1. Dashboard sayfasına git (`/dashboard`)
2. "Aylık Hedef Belirle" kartını bul
3. "Hedef Belirle" butonuna tıkla
4. Hedef tutarı gir (örn: 50000)
5. Kaydet butonuna tıkla

**Beklenen Sonuç:**
- ✅ Hedef başarıyla kaydedilir
- ✅ Kart güncellenir ve ilerleme çubuğu görünür
- ✅ "İlerleme: 0₺" ve "Hedef: 50.000₺" bilgileri görünür
- ✅ İlerleme yüzdesi %0 olarak görünür

### ✅ Test Senaryosu 2: İlerleme Takibi

**Adımlar:**
1. Dashboard'da hedef belirle (örn: 50000₺)
2. Bir fatura oluştur ve durumunu "PAID" yap (örn: 20000₺)
3. Dashboard'u yenile

**Beklenen Sonuç:**
- ✅ İlerleme çubuğu %40'a kadar dolar (20000/50000)
- ✅ "İlerleme: 20.000₺" ve "Kalan: 30.000₺" bilgileri görünür
- ✅ İlerleme yüzdesi %40 olarak görünür

**Test Verileri Hazırlama:**
```sql
-- Bu ay PAID durumunda fatura oluştur
INSERT INTO "Invoice" (title, status, total, "companyId", "createdAt") 
VALUES ('Ödenen Fatura', 'PAID', 20000, 'your-company-id', NOW());
```

### ✅ Test Senaryosu 3: Hedef Aşımı

**Adımlar:**
1. Dashboard'da hedef belirle (örn: 50000₺)
2. Toplam 60000₺ değerinde PAID fatura oluştur
3. Dashboard'u yenile

**Beklenen Sonuç:**
- ✅ İlerleme çubuğu %100'e ulaşır
- ✅ "🎉 Tebrikler! Hedefini aştın!" mesajı görünür
- ✅ İlerleme yüzdesi %120 olarak görünür (60000/50000)

**Test Verileri Hazırlama:**
```sql
-- Bu ay PAID durumunda fatura oluştur (toplam 60000₺)
INSERT INTO "Invoice" (title, status, total, "companyId", "createdAt") 
VALUES ('Fatura 1', 'PAID', 30000, 'your-company-id', NOW()),
       ('Fatura 2', 'PAID', 30000, 'your-company-id', NOW());
```

### ✅ Test Senaryosu 4: Hedef Düzenleme

**Adımlar:**
1. Dashboard'da mevcut hedefi gör
2. Düzenle butonuna (kalem ikonu) tıkla
3. Yeni hedef tutarı gir (örn: 75000)
4. Kaydet butonuna tıkla

**Beklenen Sonuç:**
- ✅ Hedef başarıyla güncellenir
- ✅ İlerleme çubuğu yeni hedefe göre yeniden hesaplanır
- ✅ Yeni hedef tutarı görünür

---

## 5️⃣ AutoNextStep - Sonraki Adım Önerisi

### 📝 Açıklama
Bir modül tamamlandığında sistem otomatik olarak sonraki adımı önerir.

### ✅ Test Senaryosu 1: Teklif Kabul Edildiğinde Fatura Önerisi

**Adımlar:**
1. Bir teklif oluştur
2. Teklif durumunu "ACCEPTED" yap
3. Teklif detay sayfasında bildirimi kontrol et

**Beklenen Sonuç:**
- ✅ "Teklif kabul edildi! Fatura oluşturmak ister misin?" mesajı görünür
- ✅ "Fatura Oluştur" butonu görünür
- ✅ Butona tıklandığında fatura formu açılır

**Test Verileri Hazırlama:**
```sql
-- ACCEPTED durumunda teklif oluştur
INSERT INTO "Quote" (title, status, total, "companyId") 
VALUES ('Kabul Edilen Teklif', 'ACCEPTED', 15000, 'your-company-id');
```

### ✅ Test Senaryosu 2: Fatura Kesildiğinde Sevkiyat Önerisi

**Adımlar:**
1. Bir fatura oluştur
2. Fatura durumunu "PAID" yap
3. Fatura detay sayfasında bildirimi kontrol et

**Beklenen Sonuç:**
- ✅ "Fatura ödendi! Sevkiyat taslağı oluşturuldu, açmak ister misin?" mesajı görünür
- ✅ "Sevkiyat Hazırla" butonu görünür
- ✅ Butona tıklandığında sevkiyat formu açılır

**Test Verileri Hazırlama:**
```sql
-- PAID durumunda fatura oluştur
INSERT INTO "Invoice" (title, status, total, "companyId") 
VALUES ('Ödenen Fatura', 'PAID', 20000, 'your-company-id');
```

---

## 6️⃣ AutoTaskFromQuote - Otomatik Görev Atama

### 📝 Açıklama
Teklif oluşturulduğunda otomatik olarak görev açılır ve teklif sahibine atanır.

### ✅ Test Senaryosu 1: Teklif Oluşturulduğunda Görev Açılması

**Adımlar:**
1. Yeni bir teklif oluştur
2. Teklif kaydedildikten sonra Görevler sayfasına git (`/tasks`)
3. Yeni oluşturulan görevi kontrol et

**Beklenen Sonuç:**
- ✅ Yeni bir görev oluşturulur
- ✅ Görev başlığı: "Bu teklif için 3 gün içinde müşteriyi ara"
- ✅ Görev teklif sahibine atanır
- ✅ Görev durumu "TODO" olarak görünür

**Test Verileri Hazırlama:**
```sql
-- Teklif oluştur (otomatik görev açılacak)
INSERT INTO "Quote" (title, status, total, "companyId", "userId") 
VALUES ('Yeni Teklif', 'DRAFT', 10000, 'your-company-id', 'your-user-id');
```

---

## 7️⃣ CustomerFollowup - Sessiz Müşteri Takibi

### 📝 Açıklama
14 gün boyunca hiç etkileşim olmayan müşteri "Takip Et" listesine düşer.

### ✅ Test Senaryosu 1: Sessiz Müşteri Tespiti

**Adımlar:**
1. Bir müşteri oluştur
2. Müşterinin `updatedAt` tarihini 15 gün öncesine ayarla
3. Dashboard'da "Pasif Müşteriler" kutusunu kontrol et

**Beklenen Sonuç:**
- ✅ Müşteri "Pasif Müşteriler" listesine eklenir
- ✅ "14 günden uzun süredir görüşülmeyen müşteriler" mesajı görünür
- ✅ Müşteri listesinde "Takip Et" butonu görünür

**Test Verileri Hazırlama:**
```sql
-- 15 gün önce güncellenmiş müşteri oluştur
INSERT INTO "Customer" (name, status, "companyId", "updatedAt") 
VALUES ('Pasif Müşteri', 'ACTIVE', 'your-company-id', NOW() - INTERVAL '15 days');
```

### ✅ Test Senaryosu 2: Müşteri Etkileşimi Sonrası Listeden Çıkma

**Adımlar:**
1. Pasif müşteri listesinde bir müşteri seç
2. Müşteriye yeni bir teklif oluştur
3. Dashboard'u yenile

**Beklenen Sonuç:**
- ✅ Müşteri "Pasif Müşteriler" listesinden çıkar
- ✅ Müşterinin `updatedAt` tarihi güncellenir
- ✅ Liste güncellenir

**Test Verileri Hazırlama:**
```sql
-- Müşteriye teklif oluştur (updatedAt güncellenecek)
INSERT INTO "Quote" (title, status, total, "companyId", "customerId") 
VALUES ('Yeni Teklif', 'DRAFT', 10000, 'your-company-id', 'passive-customer-id');
```

---

## 8️⃣ AutoNoteOnEdit - Değişiklik Günlüğü

### 📝 Açıklama
Kullanıcı bir teklif veya fatura düzenlediğinde sistem otomatik not ekler.

### ✅ Test Senaryosu 1: Fiyat Güncelleme Notu

**Adımlar:**
1. Bir teklif oluştur (toplam: 10000₺)
2. Teklifi düzenle ve toplam tutarı 12000₺ yap
3. Kaydet
4. ActivityLog'u kontrol et (`/activity`)

**Beklenen Sonuç:**
- ✅ ActivityLog'a yeni kayıt eklenir
- ✅ Kayıt açıklaması: "Fiyat güncellendi (eski: 10.000₺ → yeni: 12.000₺)"
- ✅ Kayıt meta bilgilerinde eski ve yeni değerler bulunur

**Test Verileri Hazırlama:**
```sql
-- Teklif oluştur
INSERT INTO "Quote" (title, status, total, "companyId") 
VALUES ('Test Teklif', 'DRAFT', 10000, 'your-company-id');
```

### ✅ Test Senaryosu 2: Durum Değişikliği Notu

**Adımlar:**
1. Bir teklif oluştur (durum: DRAFT)
2. Teklif durumunu "SENT" yap
3. Kaydet
4. ActivityLog'u kontrol et

**Beklenen Sonuç:**
- ✅ ActivityLog'a yeni kayıt eklenir
- ✅ Kayıt açıklaması: "Teklif durumu güncellendi: DRAFT → SENT"
- ✅ Kayıt meta bilgilerinde eski ve yeni durum bulunur

---

## 9️⃣ QuickThankYou - Otomatik Teşekkür

### 📝 Açıklama
Fatura ödendiğinde veya teklif kabul edildiğinde müşteriye otomatik e-posta gider.

### ✅ Test Senaryosu 1: Teklif Kabul Edildiğinde Teşekkür E-postası

**Adımlar:**
1. Bir teklif oluştur
2. Teklif durumunu "ACCEPTED" yap
3. E-posta gönderim logunu kontrol et

**Beklenen Sonuç:**
- ✅ Müşteriye otomatik e-posta gönderilir
- ✅ E-posta konusu: "Teklifiniz Kabul Edildi - Teşekkürler"
- ✅ E-posta içeriği: "İş birliğiniz için teşekkür ederiz 💫"

**Test Verileri Hazırlama:**
```sql
-- ACCEPTED durumunda teklif oluştur
INSERT INTO "Quote" (title, status, total, "companyId", "customerId") 
VALUES ('Kabul Edilen Teklif', 'ACCEPTED', 15000, 'your-company-id', 'customer-id');
```

### ✅ Test Senaryosu 2: Fatura Ödendiğinde Teşekkür E-postası

**Adımlar:**
1. Bir fatura oluştur
2. Fatura durumunu "PAID" yap
3. E-posta gönderim logunu kontrol et

**Beklenen Sonuç:**
- ✅ Müşteriye otomatik e-posta gönderilir
- ✅ E-posta konusu: "Ödemeniz Alındı - Teşekkürler"
- ✅ E-posta içeriği: "Ödemeniz için teşekkür ederiz 💫"

**Test Verileri Hazırlama:**
```sql
-- PAID durumunda fatura oluştur
INSERT INTO "Invoice" (title, status, total, "companyId", "customerId") 
VALUES ('Ödenen Fatura', 'PAID', 20000, 'your-company-id', 'customer-id');
```

---

## 🔟 SmartFileNaming - PDF Dosya Adı Standardı

### 📝 Açıklama
Teklif/Fatura PDF kaydedilirken otomatik şu formatta adlandırılır:
`PI_2025-11-07_TIPPLUS_XYZMEDIKAL_#001.pdf`

### ✅ Test Senaryosu 1: Teklif PDF İndirme

**Adımlar:**
1. Bir teklif oluştur
2. Teklif detay sayfasına git (`/quotes/[id]`)
3. "PDF İndir" butonuna tıkla
4. İndirilen dosya adını kontrol et

**Beklenen Sonuç:**
- ✅ PDF dosyası indirilir
- ✅ Dosya adı formatı: `PI_YYYY-MM-DD_COMPANYNAME_CUSTOMERNAME_#XXX.pdf`
- ✅ Örnek: `PI_2025-01-15_TIPPLUS_XYZMEDIKAL_#001.pdf`

**Test Verileri Hazırlama:**
```sql
-- Teklif oluştur
INSERT INTO "Quote" (title, status, total, "companyId") 
VALUES ('Test Teklif', 'DRAFT', 10000, 'your-company-id');
```

### ✅ Test Senaryosu 2: Fatura PDF İndirme

**Adımlar:**
1. Bir fatura oluştur
2. Fatura detay sayfasına git (`/invoices/[id]`)
3. "PDF İndir" butonuna tıkla
4. İndirilen dosya adını kontrol et

**Beklenen Sonuç:**
- ✅ PDF dosyası indirilir
- ✅ Dosya adı formatı: `INV_YYYY-MM-DD_COMPANYNAME_CUSTOMERNAME_#XXX.pdf`
- ✅ Örnek: `INV_2025-01-15_TIPPLUS_XYZMEDIKAL_#001.pdf`

**Test Verileri Hazırlama:**
```sql
-- Fatura oluştur
INSERT INTO "Invoice" (title, status, total, "companyId") 
VALUES ('Test Fatura', 'DRAFT', 15000, 'your-company-id');
```

---

## 📊 Genel Test Kontrol Listesi

### ✅ Tüm Otomasyonlar İçin Ortak Kontroller

1. **API Endpoint Kontrolü**
   - ✅ Tüm API endpoint'leri çalışıyor mu?
   - ✅ Hata durumlarında uygun mesajlar dönüyor mu?
   - ✅ RLS (Row-Level Security) kontrolü yapılıyor mu?

2. **UI/UX Kontrolü**
   - ✅ Tüm component'ler doğru render ediliyor mu?
   - ✅ Loading state'ler gösteriliyor mu?
   - ✅ Error state'ler gösteriliyor mu?
   - ✅ Responsive tasarım çalışıyor mu?

3. **Performans Kontrolü**
   - ✅ API response süreleri < 1000ms mi?
   - ✅ Component render süreleri < 300ms mi?
   - ✅ Cache stratejisi çalışıyor mu?

4. **Güvenlik Kontrolü**
   - ✅ Session kontrolü yapılıyor mu?
   - ✅ CompanyId filtresi uygulanıyor mu?
   - ✅ Input validation yapılıyor mu?

---

## 🐛 Hata Ayıklama İpuçları

### Sorun: Smart Reminder görünmüyor
**Çözüm:**
1. Browser console'u kontrol et (F12)
2. API endpoint'ini manuel test et: `/api/automations/smart-reminder`
3. Session kontrolü yap
4. CompanyId'nin doğru olduğundan emin ol

### Sorun: QuickActions butonları görünmüyor
**Çözüm:**
1. Entity status'unu kontrol et
2. Component'in doğru yerde render edildiğinden emin ol
3. Browser console'da hata var mı kontrol et

### Sorun: AutoGoalTracker hedef kaydedilmiyor
**Çözüm:**
1. API endpoint'ini kontrol et: `/api/automations/goal-tracker`
2. User tablosunda `monthlyGoal` kolonu var mı kontrol et
3. Migration çalıştırıldı mı kontrol et

---

## 📝 Notlar

- Tüm otomasyonlar production-ready değil, bazıları migration gerektirebilir
- Test verileri hazırlarken gerçek companyId ve userId kullanın
- ActivityLog kayıtları otomatik oluşturulur, manuel kontrol gerekmez
- E-posta gönderimi için SMTP ayarları yapılmalıdır

---

## 🎯 Sonuç

Bu test senaryoları ile tüm otomasyonların çalıştığından emin olabilirsiniz. Her senaryo adım adım takip edilerek sistemin doğru çalıştığı doğrulanabilir.

**Test Sırası:**
1. Önce Smart Reminder'ı test et
2. Sonra QuickActions'ı test et
3. SmartEmptyState'i test et
4. AutoGoalTracker'ı test et
5. Diğer otomasyonları sırayla test et

**Başarı Kriterleri:**
- ✅ Tüm API endpoint'leri 200 status code dönüyor
- ✅ Tüm UI component'leri doğru render ediliyor
- ✅ Tüm otomasyonlar beklenen şekilde çalışıyor
- ✅ Hata durumlarında uygun mesajlar gösteriliyor


Bu dokümanda tüm otomasyonların test senaryoları ve kullanım kılavuzu bulunmaktadır.

---

## 📋 İçindekiler

1. [Smart Reminder - Günlük Bildirimler](#1-smart-reminder)
2. [QuickActions - Hızlı İşlem Butonları](#2-quickactions)
3. [SmartEmptyState - Boş Ekran Önerileri](#3-smartemptystate)
4. [AutoGoalTracker - Hedef Takibi](#4-autogoaltracker)
5. [AutoNextStep - Sonraki Adım Önerisi](#5-autonextstep)
6. [AutoTaskFromQuote - Otomatik Görev Atama](#6-autotaskfromquote)
7. [CustomerFollowup - Sessiz Müşteri Takibi](#7-customerfollowup)
8. [AutoNoteOnEdit - Değişiklik Günlüğü](#8-autonoteonedit)
9. [QuickThankYou - Otomatik Teşekkür](#9-quickthankyou)
10. [SmartFileNaming - PDF Dosya Adı Standardı](#10-smartfilenaming)

---

## 1️⃣ Smart Reminder - Günlük Bildirimler

### 📝 Açıklama
Kullanıcı dashboard'a giriş yaptığında otomatik olarak günlük özet gösterilir:
- Onay bekleyen teklifler
- 7 günden uzun süredir görüşülmeyen müşteriler
- Teslim bekleyen sevkiyatlar

### ✅ Test Senaryosu 1: Dashboard Giriş Bildirimi

**Adımlar:**
1. Sisteme giriş yap
2. Dashboard sayfasına git (`/dashboard`)
3. Sayfanın üst kısmında "Bugünün Özeti" kartını kontrol et

**Beklenen Sonuç:**
- ✅ Eğer onay bekleyen teklif varsa: "X teklifin onay bekliyor." mesajı görünür
- ✅ Eğer 7 günden uzun süredir görüşülmeyen müşteri varsa: "X müşterinle 7 gündür görüşmedin." mesajı görünür
- ✅ Eğer teslim bekleyen sevkiyat varsa: "X sevkiyat teslim bekliyor." mesajı görünür
- ✅ Her mesajın yanında "Görüntüle →", "Takip Et →", "Kontrol Et →" linkleri bulunur
- ✅ Sağ üstte "X" butonu ile kapatılabilir

**Test Verileri Hazırlama:**
```sql
-- Onay bekleyen teklif oluştur
INSERT INTO "Quote" (title, status, total, "companyId") 
VALUES ('Test Teklif', 'SENT', 10000, 'your-company-id');

-- 7 günden eski müşteri oluştur
INSERT INTO "Customer" (name, status, "companyId", "updatedAt") 
VALUES ('Eski Müşteri', 'ACTIVE', 'your-company-id', NOW() - INTERVAL '10 days');

-- Teslim bekleyen sevkiyat oluştur
INSERT INTO "Shipment" (status, "companyId") 
VALUES ('PENDING', 'your-company-id');
```

### ✅ Test Senaryosu 2: Bildirimi Kapatma

**Adımlar:**
1. Dashboard'da Smart Reminder kartını gör
2. Sağ üstteki "X" butonuna tıkla
3. Sayfayı yenile (F5)

**Beklenen Sonuç:**
- ✅ Kart kapanır ve görünmez
- ✅ Sayfa yenilendiğinde kart tekrar görünmez (24 saat boyunca)
- ✅ 24 saat sonra tekrar görünür

---

## 2️⃣ QuickActions - Hızlı İşlem Butonları

### 📝 Açıklama
Duruma göre otomatik olarak hızlı işlem butonları gösterilir:
- Teklif ACCEPTED → "Fatura Oluştur" butonu
- Fatura SENT/PAID → "Sevkiyat Hazırla" butonu
- Sevkiyat PENDING → "Sevkiyatı Onayla" butonu

### ✅ Test Senaryosu 1: Teklif Kabul Edildiğinde Fatura Butonu

**Adımlar:**
1. Teklifler sayfasına git (`/quotes`)
2. Bir teklif oluştur veya mevcut bir teklifi seç
3. Teklif detay sayfasına git (`/quotes/[id]`)
4. Teklif durumunu "ACCEPTED" yap
5. Sayfayı yenile

**Beklenen Sonuç:**
- ✅ "Fatura Oluştur" butonu görünür (parlayan efekt ile)
- ✅ Butona tıklandığında `/invoices/new?quoteId=[id]` sayfasına yönlendirilir
- ✅ Fatura formu açılır ve teklif bilgileri otomatik doldurulur

**Test Verileri Hazırlama:**
```sql
-- ACCEPTED durumunda teklif oluştur
INSERT INTO "Quote" (title, status, total, "companyId") 
VALUES ('Kabul Edilen Teklif', 'ACCEPTED', 15000, 'your-company-id');
```

### ✅ Test Senaryosu 2: Fatura Kesildiğinde Sevkiyat Butonu

**Adımlar:**
1. Faturalar sayfasına git (`/invoices`)
2. Bir fatura oluştur veya mevcut bir faturayı seç
3. Fatura durumunu "SENT" veya "PAID" yap
4. Fatura detay sayfasına git (`/invoices/[id]`)
5. Sayfayı yenile

**Beklenen Sonuç:**
- ✅ "Sevkiyat Hazırla" butonu görünür (parlayan efekt ile)
- ✅ Butona tıklandığında `/shipments/new?invoiceId=[id]` sayfasına yönlendirilir
- ✅ Sevkiyat formu açılır ve fatura bilgileri otomatik doldurulur

**Test Verileri Hazırlama:**
```sql
-- SENT durumunda fatura oluştur
INSERT INTO "Invoice" (title, status, total, "companyId") 
VALUES ('Gönderilen Fatura', 'SENT', 20000, 'your-company-id');
```

### ✅ Test Senaryosu 3: Sevkiyat Beklemede Onay Butonu

**Adımlar:**
1. Sevkiyatlar sayfasına git (`/shipments`)
2. Bir sevkiyat oluştur veya mevcut bir sevkiyatı seç
3. Sevkiyat durumunu "PENDING" yap
4. Sevkiyat detay sayfasına git (`/shipments/[id]`)
5. Sayfayı yenile

**Beklenen Sonuç:**
- ✅ "Sevkiyatı Onayla" butonu görünür (parlayan efekt ile)
- ✅ Butona tıklandığında sevkiyat detay sayfasına yönlendirilir
- ✅ Onaylama işlemi yapılabilir

**Test Verileri Hazırlama:**
```sql
-- PENDING durumunda sevkiyat oluştur
INSERT INTO "Shipment" (status, "companyId") 
VALUES ('PENDING', 'your-company-id');
```

---

## 3️⃣ SmartEmptyState - Boş Ekran Önerileri

### 📝 Açıklama
Boş listelerde kullanıcıya yardımcı mesajlar ve hızlı aksiyon butonları gösterilir.

### ✅ Test Senaryosu 1: Boş Teklif Listesi

**Adımlar:**
1. Yeni bir şirket oluştur veya tüm teklifleri sil
2. Teklifler sayfasına git (`/quotes`)
3. Liste boş olduğunda görünen mesajı kontrol et

**Beklenen Sonuç:**
- ✅ "Henüz teklif oluşturmadın" başlığı görünür
- ✅ "İlk teklifini oluşturarak müşterilerine profesyonel teklifler sunmaya başla." mesajı görünür
- ✅ "Teklif Oluştur" butonu görünür
- ✅ Butona tıklandığında `/quotes/new` sayfasına yönlendirilir

### ✅ Test Senaryosu 2: Boş Müşteri Listesi

**Adımlar:**
1. Yeni bir şirket oluştur veya tüm müşterileri sil
2. Müşteriler sayfasına git (`/customers`)
3. Liste boş olduğunda görünen mesajı kontrol et

**Beklenen Sonuç:**
- ✅ "Henüz müşteri eklemedin" başlığı görünür
- ✅ "İlk müşterini ekleyerek CRM sistemini kullanmaya başla." mesajı görünür
- ✅ "Müşteri Ekle" butonu görünür
- ✅ Butona tıklandığında `/customers/new` sayfasına yönlendirilir

### ✅ Test Senaryosu 3: Boş Fatura Listesi

**Adımlar:**
1. Yeni bir şirket oluştur veya tüm faturaları sil
2. Faturalar sayfasına git (`/invoices`)
3. Liste boş olduğunda görünen mesajı kontrol et

**Beklenen Sonuç:**
- ✅ "Henüz fatura oluşturmadın" başlığı görünür
- ✅ "İlk faturanı oluşturarak satış sürecini başlat." mesajı görünür
- ✅ "Fatura Oluştur" butonu görünür
- ✅ Butona tıklandığında `/invoices/new` sayfasına yönlendirilir

---

## 4️⃣ AutoGoalTracker - Hedef Takibi

### 📝 Açıklama
Kullanıcı aylık satış hedefi belirler ve sistem otomatik olarak ilerlemeyi takip eder.

### ✅ Test Senaryosu 1: Hedef Belirleme

**Adımlar:**
1. Dashboard sayfasına git (`/dashboard`)
2. "Aylık Hedef Belirle" kartını bul
3. "Hedef Belirle" butonuna tıkla
4. Hedef tutarı gir (örn: 50000)
5. Kaydet butonuna tıkla

**Beklenen Sonuç:**
- ✅ Hedef başarıyla kaydedilir
- ✅ Kart güncellenir ve ilerleme çubuğu görünür
- ✅ "İlerleme: 0₺" ve "Hedef: 50.000₺" bilgileri görünür
- ✅ İlerleme yüzdesi %0 olarak görünür

### ✅ Test Senaryosu 2: İlerleme Takibi

**Adımlar:**
1. Dashboard'da hedef belirle (örn: 50000₺)
2. Bir fatura oluştur ve durumunu "PAID" yap (örn: 20000₺)
3. Dashboard'u yenile

**Beklenen Sonuç:**
- ✅ İlerleme çubuğu %40'a kadar dolar (20000/50000)
- ✅ "İlerleme: 20.000₺" ve "Kalan: 30.000₺" bilgileri görünür
- ✅ İlerleme yüzdesi %40 olarak görünür

**Test Verileri Hazırlama:**
```sql
-- Bu ay PAID durumunda fatura oluştur
INSERT INTO "Invoice" (title, status, total, "companyId", "createdAt") 
VALUES ('Ödenen Fatura', 'PAID', 20000, 'your-company-id', NOW());
```

### ✅ Test Senaryosu 3: Hedef Aşımı

**Adımlar:**
1. Dashboard'da hedef belirle (örn: 50000₺)
2. Toplam 60000₺ değerinde PAID fatura oluştur
3. Dashboard'u yenile

**Beklenen Sonuç:**
- ✅ İlerleme çubuğu %100'e ulaşır
- ✅ "🎉 Tebrikler! Hedefini aştın!" mesajı görünür
- ✅ İlerleme yüzdesi %120 olarak görünür (60000/50000)

**Test Verileri Hazırlama:**
```sql
-- Bu ay PAID durumunda fatura oluştur (toplam 60000₺)
INSERT INTO "Invoice" (title, status, total, "companyId", "createdAt") 
VALUES ('Fatura 1', 'PAID', 30000, 'your-company-id', NOW()),
       ('Fatura 2', 'PAID', 30000, 'your-company-id', NOW());
```

### ✅ Test Senaryosu 4: Hedef Düzenleme

**Adımlar:**
1. Dashboard'da mevcut hedefi gör
2. Düzenle butonuna (kalem ikonu) tıkla
3. Yeni hedef tutarı gir (örn: 75000)
4. Kaydet butonuna tıkla

**Beklenen Sonuç:**
- ✅ Hedef başarıyla güncellenir
- ✅ İlerleme çubuğu yeni hedefe göre yeniden hesaplanır
- ✅ Yeni hedef tutarı görünür

---

## 5️⃣ AutoNextStep - Sonraki Adım Önerisi

### 📝 Açıklama
Bir modül tamamlandığında sistem otomatik olarak sonraki adımı önerir.

### ✅ Test Senaryosu 1: Teklif Kabul Edildiğinde Fatura Önerisi

**Adımlar:**
1. Bir teklif oluştur
2. Teklif durumunu "ACCEPTED" yap
3. Teklif detay sayfasında bildirimi kontrol et

**Beklenen Sonuç:**
- ✅ "Teklif kabul edildi! Fatura oluşturmak ister misin?" mesajı görünür
- ✅ "Fatura Oluştur" butonu görünür
- ✅ Butona tıklandığında fatura formu açılır

**Test Verileri Hazırlama:**
```sql
-- ACCEPTED durumunda teklif oluştur
INSERT INTO "Quote" (title, status, total, "companyId") 
VALUES ('Kabul Edilen Teklif', 'ACCEPTED', 15000, 'your-company-id');
```

### ✅ Test Senaryosu 2: Fatura Kesildiğinde Sevkiyat Önerisi

**Adımlar:**
1. Bir fatura oluştur
2. Fatura durumunu "PAID" yap
3. Fatura detay sayfasında bildirimi kontrol et

**Beklenen Sonuç:**
- ✅ "Fatura ödendi! Sevkiyat taslağı oluşturuldu, açmak ister misin?" mesajı görünür
- ✅ "Sevkiyat Hazırla" butonu görünür
- ✅ Butona tıklandığında sevkiyat formu açılır

**Test Verileri Hazırlama:**
```sql
-- PAID durumunda fatura oluştur
INSERT INTO "Invoice" (title, status, total, "companyId") 
VALUES ('Ödenen Fatura', 'PAID', 20000, 'your-company-id');
```

---

## 6️⃣ AutoTaskFromQuote - Otomatik Görev Atama

### 📝 Açıklama
Teklif oluşturulduğunda otomatik olarak görev açılır ve teklif sahibine atanır.

### ✅ Test Senaryosu 1: Teklif Oluşturulduğunda Görev Açılması

**Adımlar:**
1. Yeni bir teklif oluştur
2. Teklif kaydedildikten sonra Görevler sayfasına git (`/tasks`)
3. Yeni oluşturulan görevi kontrol et

**Beklenen Sonuç:**
- ✅ Yeni bir görev oluşturulur
- ✅ Görev başlığı: "Bu teklif için 3 gün içinde müşteriyi ara"
- ✅ Görev teklif sahibine atanır
- ✅ Görev durumu "TODO" olarak görünür

**Test Verileri Hazırlama:**
```sql
-- Teklif oluştur (otomatik görev açılacak)
INSERT INTO "Quote" (title, status, total, "companyId", "userId") 
VALUES ('Yeni Teklif', 'DRAFT', 10000, 'your-company-id', 'your-user-id');
```

---

## 7️⃣ CustomerFollowup - Sessiz Müşteri Takibi

### 📝 Açıklama
14 gün boyunca hiç etkileşim olmayan müşteri "Takip Et" listesine düşer.

### ✅ Test Senaryosu 1: Sessiz Müşteri Tespiti

**Adımlar:**
1. Bir müşteri oluştur
2. Müşterinin `updatedAt` tarihini 15 gün öncesine ayarla
3. Dashboard'da "Pasif Müşteriler" kutusunu kontrol et

**Beklenen Sonuç:**
- ✅ Müşteri "Pasif Müşteriler" listesine eklenir
- ✅ "14 günden uzun süredir görüşülmeyen müşteriler" mesajı görünür
- ✅ Müşteri listesinde "Takip Et" butonu görünür

**Test Verileri Hazırlama:**
```sql
-- 15 gün önce güncellenmiş müşteri oluştur
INSERT INTO "Customer" (name, status, "companyId", "updatedAt") 
VALUES ('Pasif Müşteri', 'ACTIVE', 'your-company-id', NOW() - INTERVAL '15 days');
```

### ✅ Test Senaryosu 2: Müşteri Etkileşimi Sonrası Listeden Çıkma

**Adımlar:**
1. Pasif müşteri listesinde bir müşteri seç
2. Müşteriye yeni bir teklif oluştur
3. Dashboard'u yenile

**Beklenen Sonuç:**
- ✅ Müşteri "Pasif Müşteriler" listesinden çıkar
- ✅ Müşterinin `updatedAt` tarihi güncellenir
- ✅ Liste güncellenir

**Test Verileri Hazırlama:**
```sql
-- Müşteriye teklif oluştur (updatedAt güncellenecek)
INSERT INTO "Quote" (title, status, total, "companyId", "customerId") 
VALUES ('Yeni Teklif', 'DRAFT', 10000, 'your-company-id', 'passive-customer-id');
```

---

## 8️⃣ AutoNoteOnEdit - Değişiklik Günlüğü

### 📝 Açıklama
Kullanıcı bir teklif veya fatura düzenlediğinde sistem otomatik not ekler.

### ✅ Test Senaryosu 1: Fiyat Güncelleme Notu

**Adımlar:**
1. Bir teklif oluştur (toplam: 10000₺)
2. Teklifi düzenle ve toplam tutarı 12000₺ yap
3. Kaydet
4. ActivityLog'u kontrol et (`/activity`)

**Beklenen Sonuç:**
- ✅ ActivityLog'a yeni kayıt eklenir
- ✅ Kayıt açıklaması: "Fiyat güncellendi (eski: 10.000₺ → yeni: 12.000₺)"
- ✅ Kayıt meta bilgilerinde eski ve yeni değerler bulunur

**Test Verileri Hazırlama:**
```sql
-- Teklif oluştur
INSERT INTO "Quote" (title, status, total, "companyId") 
VALUES ('Test Teklif', 'DRAFT', 10000, 'your-company-id');
```

### ✅ Test Senaryosu 2: Durum Değişikliği Notu

**Adımlar:**
1. Bir teklif oluştur (durum: DRAFT)
2. Teklif durumunu "SENT" yap
3. Kaydet
4. ActivityLog'u kontrol et

**Beklenen Sonuç:**
- ✅ ActivityLog'a yeni kayıt eklenir
- ✅ Kayıt açıklaması: "Teklif durumu güncellendi: DRAFT → SENT"
- ✅ Kayıt meta bilgilerinde eski ve yeni durum bulunur

---

## 9️⃣ QuickThankYou - Otomatik Teşekkür

### 📝 Açıklama
Fatura ödendiğinde veya teklif kabul edildiğinde müşteriye otomatik e-posta gider.

### ✅ Test Senaryosu 1: Teklif Kabul Edildiğinde Teşekkür E-postası

**Adımlar:**
1. Bir teklif oluştur
2. Teklif durumunu "ACCEPTED" yap
3. E-posta gönderim logunu kontrol et

**Beklenen Sonuç:**
- ✅ Müşteriye otomatik e-posta gönderilir
- ✅ E-posta konusu: "Teklifiniz Kabul Edildi - Teşekkürler"
- ✅ E-posta içeriği: "İş birliğiniz için teşekkür ederiz 💫"

**Test Verileri Hazırlama:**
```sql
-- ACCEPTED durumunda teklif oluştur
INSERT INTO "Quote" (title, status, total, "companyId", "customerId") 
VALUES ('Kabul Edilen Teklif', 'ACCEPTED', 15000, 'your-company-id', 'customer-id');
```

### ✅ Test Senaryosu 2: Fatura Ödendiğinde Teşekkür E-postası

**Adımlar:**
1. Bir fatura oluştur
2. Fatura durumunu "PAID" yap
3. E-posta gönderim logunu kontrol et

**Beklenen Sonuç:**
- ✅ Müşteriye otomatik e-posta gönderilir
- ✅ E-posta konusu: "Ödemeniz Alındı - Teşekkürler"
- ✅ E-posta içeriği: "Ödemeniz için teşekkür ederiz 💫"

**Test Verileri Hazırlama:**
```sql
-- PAID durumunda fatura oluştur
INSERT INTO "Invoice" (title, status, total, "companyId", "customerId") 
VALUES ('Ödenen Fatura', 'PAID', 20000, 'your-company-id', 'customer-id');
```

---

## 🔟 SmartFileNaming - PDF Dosya Adı Standardı

### 📝 Açıklama
Teklif/Fatura PDF kaydedilirken otomatik şu formatta adlandırılır:
`PI_2025-11-07_TIPPLUS_XYZMEDIKAL_#001.pdf`

### ✅ Test Senaryosu 1: Teklif PDF İndirme

**Adımlar:**
1. Bir teklif oluştur
2. Teklif detay sayfasına git (`/quotes/[id]`)
3. "PDF İndir" butonuna tıkla
4. İndirilen dosya adını kontrol et

**Beklenen Sonuç:**
- ✅ PDF dosyası indirilir
- ✅ Dosya adı formatı: `PI_YYYY-MM-DD_COMPANYNAME_CUSTOMERNAME_#XXX.pdf`
- ✅ Örnek: `PI_2025-01-15_TIPPLUS_XYZMEDIKAL_#001.pdf`

**Test Verileri Hazırlama:**
```sql
-- Teklif oluştur
INSERT INTO "Quote" (title, status, total, "companyId") 
VALUES ('Test Teklif', 'DRAFT', 10000, 'your-company-id');
```

### ✅ Test Senaryosu 2: Fatura PDF İndirme

**Adımlar:**
1. Bir fatura oluştur
2. Fatura detay sayfasına git (`/invoices/[id]`)
3. "PDF İndir" butonuna tıkla
4. İndirilen dosya adını kontrol et

**Beklenen Sonuç:**
- ✅ PDF dosyası indirilir
- ✅ Dosya adı formatı: `INV_YYYY-MM-DD_COMPANYNAME_CUSTOMERNAME_#XXX.pdf`
- ✅ Örnek: `INV_2025-01-15_TIPPLUS_XYZMEDIKAL_#001.pdf`

**Test Verileri Hazırlama:**
```sql
-- Fatura oluştur
INSERT INTO "Invoice" (title, status, total, "companyId") 
VALUES ('Test Fatura', 'DRAFT', 15000, 'your-company-id');
```

---

## 📊 Genel Test Kontrol Listesi

### ✅ Tüm Otomasyonlar İçin Ortak Kontroller

1. **API Endpoint Kontrolü**
   - ✅ Tüm API endpoint'leri çalışıyor mu?
   - ✅ Hata durumlarında uygun mesajlar dönüyor mu?
   - ✅ RLS (Row-Level Security) kontrolü yapılıyor mu?

2. **UI/UX Kontrolü**
   - ✅ Tüm component'ler doğru render ediliyor mu?
   - ✅ Loading state'ler gösteriliyor mu?
   - ✅ Error state'ler gösteriliyor mu?
   - ✅ Responsive tasarım çalışıyor mu?

3. **Performans Kontrolü**
   - ✅ API response süreleri < 1000ms mi?
   - ✅ Component render süreleri < 300ms mi?
   - ✅ Cache stratejisi çalışıyor mu?

4. **Güvenlik Kontrolü**
   - ✅ Session kontrolü yapılıyor mu?
   - ✅ CompanyId filtresi uygulanıyor mu?
   - ✅ Input validation yapılıyor mu?

---

## 🐛 Hata Ayıklama İpuçları

### Sorun: Smart Reminder görünmüyor
**Çözüm:**
1. Browser console'u kontrol et (F12)
2. API endpoint'ini manuel test et: `/api/automations/smart-reminder`
3. Session kontrolü yap
4. CompanyId'nin doğru olduğundan emin ol

### Sorun: QuickActions butonları görünmüyor
**Çözüm:**
1. Entity status'unu kontrol et
2. Component'in doğru yerde render edildiğinden emin ol
3. Browser console'da hata var mı kontrol et

### Sorun: AutoGoalTracker hedef kaydedilmiyor
**Çözüm:**
1. API endpoint'ini kontrol et: `/api/automations/goal-tracker`
2. User tablosunda `monthlyGoal` kolonu var mı kontrol et
3. Migration çalıştırıldı mı kontrol et

---

## 📝 Notlar

- Tüm otomasyonlar production-ready değil, bazıları migration gerektirebilir
- Test verileri hazırlarken gerçek companyId ve userId kullanın
- ActivityLog kayıtları otomatik oluşturulur, manuel kontrol gerekmez
- E-posta gönderimi için SMTP ayarları yapılmalıdır

---

## 🎯 Sonuç

Bu test senaryoları ile tüm otomasyonların çalıştığından emin olabilirsiniz. Her senaryo adım adım takip edilerek sistemin doğru çalıştığı doğrulanabilir.

**Test Sırası:**
1. Önce Smart Reminder'ı test et
2. Sonra QuickActions'ı test et
3. SmartEmptyState'i test et
4. AutoGoalTracker'ı test et
5. Diğer otomasyonları sırayla test et

**Başarı Kriterleri:**
- ✅ Tüm API endpoint'leri 200 status code dönüyor
- ✅ Tüm UI component'leri doğru render ediliyor
- ✅ Tüm otomasyonlar beklenen şekilde çalışıyor
- ✅ Hata durumlarında uygun mesajlar gösteriliyor



Bu dokümanda tüm otomasyonların test senaryoları ve kullanım kılavuzu bulunmaktadır.

---

## 📋 İçindekiler

1. [Smart Reminder - Günlük Bildirimler](#1-smart-reminder)
2. [QuickActions - Hızlı İşlem Butonları](#2-quickactions)
3. [SmartEmptyState - Boş Ekran Önerileri](#3-smartemptystate)
4. [AutoGoalTracker - Hedef Takibi](#4-autogoaltracker)
5. [AutoNextStep - Sonraki Adım Önerisi](#5-autonextstep)
6. [AutoTaskFromQuote - Otomatik Görev Atama](#6-autotaskfromquote)
7. [CustomerFollowup - Sessiz Müşteri Takibi](#7-customerfollowup)
8. [AutoNoteOnEdit - Değişiklik Günlüğü](#8-autonoteonedit)
9. [QuickThankYou - Otomatik Teşekkür](#9-quickthankyou)
10. [SmartFileNaming - PDF Dosya Adı Standardı](#10-smartfilenaming)

---

## 1️⃣ Smart Reminder - Günlük Bildirimler

### 📝 Açıklama
Kullanıcı dashboard'a giriş yaptığında otomatik olarak günlük özet gösterilir:
- Onay bekleyen teklifler
- 7 günden uzun süredir görüşülmeyen müşteriler
- Teslim bekleyen sevkiyatlar

### ✅ Test Senaryosu 1: Dashboard Giriş Bildirimi

**Adımlar:**
1. Sisteme giriş yap
2. Dashboard sayfasına git (`/dashboard`)
3. Sayfanın üst kısmında "Bugünün Özeti" kartını kontrol et

**Beklenen Sonuç:**
- ✅ Eğer onay bekleyen teklif varsa: "X teklifin onay bekliyor." mesajı görünür
- ✅ Eğer 7 günden uzun süredir görüşülmeyen müşteri varsa: "X müşterinle 7 gündür görüşmedin." mesajı görünür
- ✅ Eğer teslim bekleyen sevkiyat varsa: "X sevkiyat teslim bekliyor." mesajı görünür
- ✅ Her mesajın yanında "Görüntüle →", "Takip Et →", "Kontrol Et →" linkleri bulunur
- ✅ Sağ üstte "X" butonu ile kapatılabilir

**Test Verileri Hazırlama:**
```sql
-- Onay bekleyen teklif oluştur
INSERT INTO "Quote" (title, status, total, "companyId") 
VALUES ('Test Teklif', 'SENT', 10000, 'your-company-id');

-- 7 günden eski müşteri oluştur
INSERT INTO "Customer" (name, status, "companyId", "updatedAt") 
VALUES ('Eski Müşteri', 'ACTIVE', 'your-company-id', NOW() - INTERVAL '10 days');

-- Teslim bekleyen sevkiyat oluştur
INSERT INTO "Shipment" (status, "companyId") 
VALUES ('PENDING', 'your-company-id');
```

### ✅ Test Senaryosu 2: Bildirimi Kapatma

**Adımlar:**
1. Dashboard'da Smart Reminder kartını gör
2. Sağ üstteki "X" butonuna tıkla
3. Sayfayı yenile (F5)

**Beklenen Sonuç:**
- ✅ Kart kapanır ve görünmez
- ✅ Sayfa yenilendiğinde kart tekrar görünmez (24 saat boyunca)
- ✅ 24 saat sonra tekrar görünür

---

## 2️⃣ QuickActions - Hızlı İşlem Butonları

### 📝 Açıklama
Duruma göre otomatik olarak hızlı işlem butonları gösterilir:
- Teklif ACCEPTED → "Fatura Oluştur" butonu
- Fatura SENT/PAID → "Sevkiyat Hazırla" butonu
- Sevkiyat PENDING → "Sevkiyatı Onayla" butonu

### ✅ Test Senaryosu 1: Teklif Kabul Edildiğinde Fatura Butonu

**Adımlar:**
1. Teklifler sayfasına git (`/quotes`)
2. Bir teklif oluştur veya mevcut bir teklifi seç
3. Teklif detay sayfasına git (`/quotes/[id]`)
4. Teklif durumunu "ACCEPTED" yap
5. Sayfayı yenile

**Beklenen Sonuç:**
- ✅ "Fatura Oluştur" butonu görünür (parlayan efekt ile)
- ✅ Butona tıklandığında `/invoices/new?quoteId=[id]` sayfasına yönlendirilir
- ✅ Fatura formu açılır ve teklif bilgileri otomatik doldurulur

**Test Verileri Hazırlama:**
```sql
-- ACCEPTED durumunda teklif oluştur
INSERT INTO "Quote" (title, status, total, "companyId") 
VALUES ('Kabul Edilen Teklif', 'ACCEPTED', 15000, 'your-company-id');
```

### ✅ Test Senaryosu 2: Fatura Kesildiğinde Sevkiyat Butonu

**Adımlar:**
1. Faturalar sayfasına git (`/invoices`)
2. Bir fatura oluştur veya mevcut bir faturayı seç
3. Fatura durumunu "SENT" veya "PAID" yap
4. Fatura detay sayfasına git (`/invoices/[id]`)
5. Sayfayı yenile

**Beklenen Sonuç:**
- ✅ "Sevkiyat Hazırla" butonu görünür (parlayan efekt ile)
- ✅ Butona tıklandığında `/shipments/new?invoiceId=[id]` sayfasına yönlendirilir
- ✅ Sevkiyat formu açılır ve fatura bilgileri otomatik doldurulur

**Test Verileri Hazırlama:**
```sql
-- SENT durumunda fatura oluştur
INSERT INTO "Invoice" (title, status, total, "companyId") 
VALUES ('Gönderilen Fatura', 'SENT', 20000, 'your-company-id');
```

### ✅ Test Senaryosu 3: Sevkiyat Beklemede Onay Butonu

**Adımlar:**
1. Sevkiyatlar sayfasına git (`/shipments`)
2. Bir sevkiyat oluştur veya mevcut bir sevkiyatı seç
3. Sevkiyat durumunu "PENDING" yap
4. Sevkiyat detay sayfasına git (`/shipments/[id]`)
5. Sayfayı yenile

**Beklenen Sonuç:**
- ✅ "Sevkiyatı Onayla" butonu görünür (parlayan efekt ile)
- ✅ Butona tıklandığında sevkiyat detay sayfasına yönlendirilir
- ✅ Onaylama işlemi yapılabilir

**Test Verileri Hazırlama:**
```sql
-- PENDING durumunda sevkiyat oluştur
INSERT INTO "Shipment" (status, "companyId") 
VALUES ('PENDING', 'your-company-id');
```

---

## 3️⃣ SmartEmptyState - Boş Ekran Önerileri

### 📝 Açıklama
Boş listelerde kullanıcıya yardımcı mesajlar ve hızlı aksiyon butonları gösterilir.

### ✅ Test Senaryosu 1: Boş Teklif Listesi

**Adımlar:**
1. Yeni bir şirket oluştur veya tüm teklifleri sil
2. Teklifler sayfasına git (`/quotes`)
3. Liste boş olduğunda görünen mesajı kontrol et

**Beklenen Sonuç:**
- ✅ "Henüz teklif oluşturmadın" başlığı görünür
- ✅ "İlk teklifini oluşturarak müşterilerine profesyonel teklifler sunmaya başla." mesajı görünür
- ✅ "Teklif Oluştur" butonu görünür
- ✅ Butona tıklandığında `/quotes/new` sayfasına yönlendirilir

### ✅ Test Senaryosu 2: Boş Müşteri Listesi

**Adımlar:**
1. Yeni bir şirket oluştur veya tüm müşterileri sil
2. Müşteriler sayfasına git (`/customers`)
3. Liste boş olduğunda görünen mesajı kontrol et

**Beklenen Sonuç:**
- ✅ "Henüz müşteri eklemedin" başlığı görünür
- ✅ "İlk müşterini ekleyerek CRM sistemini kullanmaya başla." mesajı görünür
- ✅ "Müşteri Ekle" butonu görünür
- ✅ Butona tıklandığında `/customers/new` sayfasına yönlendirilir

### ✅ Test Senaryosu 3: Boş Fatura Listesi

**Adımlar:**
1. Yeni bir şirket oluştur veya tüm faturaları sil
2. Faturalar sayfasına git (`/invoices`)
3. Liste boş olduğunda görünen mesajı kontrol et

**Beklenen Sonuç:**
- ✅ "Henüz fatura oluşturmadın" başlığı görünür
- ✅ "İlk faturanı oluşturarak satış sürecini başlat." mesajı görünür
- ✅ "Fatura Oluştur" butonu görünür
- ✅ Butona tıklandığında `/invoices/new` sayfasına yönlendirilir

---

## 4️⃣ AutoGoalTracker - Hedef Takibi

### 📝 Açıklama
Kullanıcı aylık satış hedefi belirler ve sistem otomatik olarak ilerlemeyi takip eder.

### ✅ Test Senaryosu 1: Hedef Belirleme

**Adımlar:**
1. Dashboard sayfasına git (`/dashboard`)
2. "Aylık Hedef Belirle" kartını bul
3. "Hedef Belirle" butonuna tıkla
4. Hedef tutarı gir (örn: 50000)
5. Kaydet butonuna tıkla

**Beklenen Sonuç:**
- ✅ Hedef başarıyla kaydedilir
- ✅ Kart güncellenir ve ilerleme çubuğu görünür
- ✅ "İlerleme: 0₺" ve "Hedef: 50.000₺" bilgileri görünür
- ✅ İlerleme yüzdesi %0 olarak görünür

### ✅ Test Senaryosu 2: İlerleme Takibi

**Adımlar:**
1. Dashboard'da hedef belirle (örn: 50000₺)
2. Bir fatura oluştur ve durumunu "PAID" yap (örn: 20000₺)
3. Dashboard'u yenile

**Beklenen Sonuç:**
- ✅ İlerleme çubuğu %40'a kadar dolar (20000/50000)
- ✅ "İlerleme: 20.000₺" ve "Kalan: 30.000₺" bilgileri görünür
- ✅ İlerleme yüzdesi %40 olarak görünür

**Test Verileri Hazırlama:**
```sql
-- Bu ay PAID durumunda fatura oluştur
INSERT INTO "Invoice" (title, status, total, "companyId", "createdAt") 
VALUES ('Ödenen Fatura', 'PAID', 20000, 'your-company-id', NOW());
```

### ✅ Test Senaryosu 3: Hedef Aşımı

**Adımlar:**
1. Dashboard'da hedef belirle (örn: 50000₺)
2. Toplam 60000₺ değerinde PAID fatura oluştur
3. Dashboard'u yenile

**Beklenen Sonuç:**
- ✅ İlerleme çubuğu %100'e ulaşır
- ✅ "🎉 Tebrikler! Hedefini aştın!" mesajı görünür
- ✅ İlerleme yüzdesi %120 olarak görünür (60000/50000)

**Test Verileri Hazırlama:**
```sql
-- Bu ay PAID durumunda fatura oluştur (toplam 60000₺)
INSERT INTO "Invoice" (title, status, total, "companyId", "createdAt") 
VALUES ('Fatura 1', 'PAID', 30000, 'your-company-id', NOW()),
       ('Fatura 2', 'PAID', 30000, 'your-company-id', NOW());
```

### ✅ Test Senaryosu 4: Hedef Düzenleme

**Adımlar:**
1. Dashboard'da mevcut hedefi gör
2. Düzenle butonuna (kalem ikonu) tıkla
3. Yeni hedef tutarı gir (örn: 75000)
4. Kaydet butonuna tıkla

**Beklenen Sonuç:**
- ✅ Hedef başarıyla güncellenir
- ✅ İlerleme çubuğu yeni hedefe göre yeniden hesaplanır
- ✅ Yeni hedef tutarı görünür

---

## 5️⃣ AutoNextStep - Sonraki Adım Önerisi

### 📝 Açıklama
Bir modül tamamlandığında sistem otomatik olarak sonraki adımı önerir.

### ✅ Test Senaryosu 1: Teklif Kabul Edildiğinde Fatura Önerisi

**Adımlar:**
1. Bir teklif oluştur
2. Teklif durumunu "ACCEPTED" yap
3. Teklif detay sayfasında bildirimi kontrol et

**Beklenen Sonuç:**
- ✅ "Teklif kabul edildi! Fatura oluşturmak ister misin?" mesajı görünür
- ✅ "Fatura Oluştur" butonu görünür
- ✅ Butona tıklandığında fatura formu açılır

**Test Verileri Hazırlama:**
```sql
-- ACCEPTED durumunda teklif oluştur
INSERT INTO "Quote" (title, status, total, "companyId") 
VALUES ('Kabul Edilen Teklif', 'ACCEPTED', 15000, 'your-company-id');
```

### ✅ Test Senaryosu 2: Fatura Kesildiğinde Sevkiyat Önerisi

**Adımlar:**
1. Bir fatura oluştur
2. Fatura durumunu "PAID" yap
3. Fatura detay sayfasında bildirimi kontrol et

**Beklenen Sonuç:**
- ✅ "Fatura ödendi! Sevkiyat taslağı oluşturuldu, açmak ister misin?" mesajı görünür
- ✅ "Sevkiyat Hazırla" butonu görünür
- ✅ Butona tıklandığında sevkiyat formu açılır

**Test Verileri Hazırlama:**
```sql
-- PAID durumunda fatura oluştur
INSERT INTO "Invoice" (title, status, total, "companyId") 
VALUES ('Ödenen Fatura', 'PAID', 20000, 'your-company-id');
```

---

## 6️⃣ AutoTaskFromQuote - Otomatik Görev Atama

### 📝 Açıklama
Teklif oluşturulduğunda otomatik olarak görev açılır ve teklif sahibine atanır.

### ✅ Test Senaryosu 1: Teklif Oluşturulduğunda Görev Açılması

**Adımlar:**
1. Yeni bir teklif oluştur
2. Teklif kaydedildikten sonra Görevler sayfasına git (`/tasks`)
3. Yeni oluşturulan görevi kontrol et

**Beklenen Sonuç:**
- ✅ Yeni bir görev oluşturulur
- ✅ Görev başlığı: "Bu teklif için 3 gün içinde müşteriyi ara"
- ✅ Görev teklif sahibine atanır
- ✅ Görev durumu "TODO" olarak görünür

**Test Verileri Hazırlama:**
```sql
-- Teklif oluştur (otomatik görev açılacak)
INSERT INTO "Quote" (title, status, total, "companyId", "userId") 
VALUES ('Yeni Teklif', 'DRAFT', 10000, 'your-company-id', 'your-user-id');
```

---

## 7️⃣ CustomerFollowup - Sessiz Müşteri Takibi

### 📝 Açıklama
14 gün boyunca hiç etkileşim olmayan müşteri "Takip Et" listesine düşer.

### ✅ Test Senaryosu 1: Sessiz Müşteri Tespiti

**Adımlar:**
1. Bir müşteri oluştur
2. Müşterinin `updatedAt` tarihini 15 gün öncesine ayarla
3. Dashboard'da "Pasif Müşteriler" kutusunu kontrol et

**Beklenen Sonuç:**
- ✅ Müşteri "Pasif Müşteriler" listesine eklenir
- ✅ "14 günden uzun süredir görüşülmeyen müşteriler" mesajı görünür
- ✅ Müşteri listesinde "Takip Et" butonu görünür

**Test Verileri Hazırlama:**
```sql
-- 15 gün önce güncellenmiş müşteri oluştur
INSERT INTO "Customer" (name, status, "companyId", "updatedAt") 
VALUES ('Pasif Müşteri', 'ACTIVE', 'your-company-id', NOW() - INTERVAL '15 days');
```

### ✅ Test Senaryosu 2: Müşteri Etkileşimi Sonrası Listeden Çıkma

**Adımlar:**
1. Pasif müşteri listesinde bir müşteri seç
2. Müşteriye yeni bir teklif oluştur
3. Dashboard'u yenile

**Beklenen Sonuç:**
- ✅ Müşteri "Pasif Müşteriler" listesinden çıkar
- ✅ Müşterinin `updatedAt` tarihi güncellenir
- ✅ Liste güncellenir

**Test Verileri Hazırlama:**
```sql
-- Müşteriye teklif oluştur (updatedAt güncellenecek)
INSERT INTO "Quote" (title, status, total, "companyId", "customerId") 
VALUES ('Yeni Teklif', 'DRAFT', 10000, 'your-company-id', 'passive-customer-id');
```

---

## 8️⃣ AutoNoteOnEdit - Değişiklik Günlüğü

### 📝 Açıklama
Kullanıcı bir teklif veya fatura düzenlediğinde sistem otomatik not ekler.

### ✅ Test Senaryosu 1: Fiyat Güncelleme Notu

**Adımlar:**
1. Bir teklif oluştur (toplam: 10000₺)
2. Teklifi düzenle ve toplam tutarı 12000₺ yap
3. Kaydet
4. ActivityLog'u kontrol et (`/activity`)

**Beklenen Sonuç:**
- ✅ ActivityLog'a yeni kayıt eklenir
- ✅ Kayıt açıklaması: "Fiyat güncellendi (eski: 10.000₺ → yeni: 12.000₺)"
- ✅ Kayıt meta bilgilerinde eski ve yeni değerler bulunur

**Test Verileri Hazırlama:**
```sql
-- Teklif oluştur
INSERT INTO "Quote" (title, status, total, "companyId") 
VALUES ('Test Teklif', 'DRAFT', 10000, 'your-company-id');
```

### ✅ Test Senaryosu 2: Durum Değişikliği Notu

**Adımlar:**
1. Bir teklif oluştur (durum: DRAFT)
2. Teklif durumunu "SENT" yap
3. Kaydet
4. ActivityLog'u kontrol et

**Beklenen Sonuç:**
- ✅ ActivityLog'a yeni kayıt eklenir
- ✅ Kayıt açıklaması: "Teklif durumu güncellendi: DRAFT → SENT"
- ✅ Kayıt meta bilgilerinde eski ve yeni durum bulunur

---

## 9️⃣ QuickThankYou - Otomatik Teşekkür

### 📝 Açıklama
Fatura ödendiğinde veya teklif kabul edildiğinde müşteriye otomatik e-posta gider.

### ✅ Test Senaryosu 1: Teklif Kabul Edildiğinde Teşekkür E-postası

**Adımlar:**
1. Bir teklif oluştur
2. Teklif durumunu "ACCEPTED" yap
3. E-posta gönderim logunu kontrol et

**Beklenen Sonuç:**
- ✅ Müşteriye otomatik e-posta gönderilir
- ✅ E-posta konusu: "Teklifiniz Kabul Edildi - Teşekkürler"
- ✅ E-posta içeriği: "İş birliğiniz için teşekkür ederiz 💫"

**Test Verileri Hazırlama:**
```sql
-- ACCEPTED durumunda teklif oluştur
INSERT INTO "Quote" (title, status, total, "companyId", "customerId") 
VALUES ('Kabul Edilen Teklif', 'ACCEPTED', 15000, 'your-company-id', 'customer-id');
```

### ✅ Test Senaryosu 2: Fatura Ödendiğinde Teşekkür E-postası

**Adımlar:**
1. Bir fatura oluştur
2. Fatura durumunu "PAID" yap
3. E-posta gönderim logunu kontrol et

**Beklenen Sonuç:**
- ✅ Müşteriye otomatik e-posta gönderilir
- ✅ E-posta konusu: "Ödemeniz Alındı - Teşekkürler"
- ✅ E-posta içeriği: "Ödemeniz için teşekkür ederiz 💫"

**Test Verileri Hazırlama:**
```sql
-- PAID durumunda fatura oluştur
INSERT INTO "Invoice" (title, status, total, "companyId", "customerId") 
VALUES ('Ödenen Fatura', 'PAID', 20000, 'your-company-id', 'customer-id');
```

---

## 🔟 SmartFileNaming - PDF Dosya Adı Standardı

### 📝 Açıklama
Teklif/Fatura PDF kaydedilirken otomatik şu formatta adlandırılır:
`PI_2025-11-07_TIPPLUS_XYZMEDIKAL_#001.pdf`

### ✅ Test Senaryosu 1: Teklif PDF İndirme

**Adımlar:**
1. Bir teklif oluştur
2. Teklif detay sayfasına git (`/quotes/[id]`)
3. "PDF İndir" butonuna tıkla
4. İndirilen dosya adını kontrol et

**Beklenen Sonuç:**
- ✅ PDF dosyası indirilir
- ✅ Dosya adı formatı: `PI_YYYY-MM-DD_COMPANYNAME_CUSTOMERNAME_#XXX.pdf`
- ✅ Örnek: `PI_2025-01-15_TIPPLUS_XYZMEDIKAL_#001.pdf`

**Test Verileri Hazırlama:**
```sql
-- Teklif oluştur
INSERT INTO "Quote" (title, status, total, "companyId") 
VALUES ('Test Teklif', 'DRAFT', 10000, 'your-company-id');
```

### ✅ Test Senaryosu 2: Fatura PDF İndirme

**Adımlar:**
1. Bir fatura oluştur
2. Fatura detay sayfasına git (`/invoices/[id]`)
3. "PDF İndir" butonuna tıkla
4. İndirilen dosya adını kontrol et

**Beklenen Sonuç:**
- ✅ PDF dosyası indirilir
- ✅ Dosya adı formatı: `INV_YYYY-MM-DD_COMPANYNAME_CUSTOMERNAME_#XXX.pdf`
- ✅ Örnek: `INV_2025-01-15_TIPPLUS_XYZMEDIKAL_#001.pdf`

**Test Verileri Hazırlama:**
```sql
-- Fatura oluştur
INSERT INTO "Invoice" (title, status, total, "companyId") 
VALUES ('Test Fatura', 'DRAFT', 15000, 'your-company-id');
```

---

## 📊 Genel Test Kontrol Listesi

### ✅ Tüm Otomasyonlar İçin Ortak Kontroller

1. **API Endpoint Kontrolü**
   - ✅ Tüm API endpoint'leri çalışıyor mu?
   - ✅ Hata durumlarında uygun mesajlar dönüyor mu?
   - ✅ RLS (Row-Level Security) kontrolü yapılıyor mu?

2. **UI/UX Kontrolü**
   - ✅ Tüm component'ler doğru render ediliyor mu?
   - ✅ Loading state'ler gösteriliyor mu?
   - ✅ Error state'ler gösteriliyor mu?
   - ✅ Responsive tasarım çalışıyor mu?

3. **Performans Kontrolü**
   - ✅ API response süreleri < 1000ms mi?
   - ✅ Component render süreleri < 300ms mi?
   - ✅ Cache stratejisi çalışıyor mu?

4. **Güvenlik Kontrolü**
   - ✅ Session kontrolü yapılıyor mu?
   - ✅ CompanyId filtresi uygulanıyor mu?
   - ✅ Input validation yapılıyor mu?

---

## 🐛 Hata Ayıklama İpuçları

### Sorun: Smart Reminder görünmüyor
**Çözüm:**
1. Browser console'u kontrol et (F12)
2. API endpoint'ini manuel test et: `/api/automations/smart-reminder`
3. Session kontrolü yap
4. CompanyId'nin doğru olduğundan emin ol

### Sorun: QuickActions butonları görünmüyor
**Çözüm:**
1. Entity status'unu kontrol et
2. Component'in doğru yerde render edildiğinden emin ol
3. Browser console'da hata var mı kontrol et

### Sorun: AutoGoalTracker hedef kaydedilmiyor
**Çözüm:**
1. API endpoint'ini kontrol et: `/api/automations/goal-tracker`
2. User tablosunda `monthlyGoal` kolonu var mı kontrol et
3. Migration çalıştırıldı mı kontrol et

---

## 📝 Notlar

- Tüm otomasyonlar production-ready değil, bazıları migration gerektirebilir
- Test verileri hazırlarken gerçek companyId ve userId kullanın
- ActivityLog kayıtları otomatik oluşturulur, manuel kontrol gerekmez
- E-posta gönderimi için SMTP ayarları yapılmalıdır

---

## 🎯 Sonuç

Bu test senaryoları ile tüm otomasyonların çalıştığından emin olabilirsiniz. Her senaryo adım adım takip edilerek sistemin doğru çalıştığı doğrulanabilir.

**Test Sırası:**
1. Önce Smart Reminder'ı test et
2. Sonra QuickActions'ı test et
3. SmartEmptyState'i test et
4. AutoGoalTracker'ı test et
5. Diğer otomasyonları sırayla test et

**Başarı Kriterleri:**
- ✅ Tüm API endpoint'leri 200 status code dönüyor
- ✅ Tüm UI component'leri doğru render ediliyor
- ✅ Tüm otomasyonlar beklenen şekilde çalışıyor
- ✅ Hata durumlarında uygun mesajlar gösteriliyor









































