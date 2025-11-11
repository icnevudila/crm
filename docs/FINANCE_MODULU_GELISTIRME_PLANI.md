# 💰 Finance Modülü Geliştirme Planı

## 🎯 Mevcut Durum Analizi

### ✅ Mevcut Özellikler
- Gelir/Gider kayıtları (INCOME/EXPENSE)
- Kategori bazlı sınıflandırma
- Müşteri firması ilişkisi (customerCompanyId)
- İlişkili entity (relatedTo - string formatında)
- Tarih filtreleme
- Toplam hesaplama (gelir, gider, net kar)

### ❌ Eksikler ve Geliştirme Alanları

#### 1. İlişki Yönetimi
- **Gelir:** Invoice'a bağlı ✅
- **Gider:** Hiçbir yere bağlı değil ❌
  - Shipment (sevkiyat giderleri)
  - Purchase (alış giderleri)
  - Task (görev giderleri - seyahat, yemek, vb.)
  - Ticket (destek giderleri)
  - Meeting (toplantı giderleri)
  - Product (ürün alış giderleri)

#### 2. Form Geliştirmeleri
- İlişkili entity seçimi (dropdown)
- İlişkili entity ID seçimi (dinamik)
- Ödeme yöntemi (CASH, BANK, CREDIT_CARD, OTHER)
- Ödeme tarihi (paymentDate)
- Fatura ekleri (receiptUrl - gelecekte)
- Tekrarlayan gider işaretleme (isRecurring)

#### 3. Kategori Geliştirmeleri
- Daha fazla gider kategorisi
- Alt kategoriler (subCategory)
- Kategori bazlı bütçe limitleri

#### 4. Raporlama ve Analiz
- Aylık/yıllık özet raporlar
- Kategori bazlı grafikler
- Trend analizi
- Bütçe vs gerçekleşen karşılaştırması
- Entity bazlı gider analizi

#### 5. Otomasyonlar
- Tekrarlayan giderler (aylık otomatik oluşturma)
- Bütçe aşımı uyarıları
- Kategori bazlı bütçe takibi
- Entity bazlı otomatik gider oluşturma (Shipment, Purchase, vb.)

---

## 🚀 Geliştirme Adımları

### Adım 1: İlişki Yönetimi Geliştirmesi
- `relatedEntityType` kolonu ekle (Invoice, Shipment, Purchase, Task, Ticket, Meeting, Product)
- `relatedEntityId` kolonu ekle (UUID)
- Form'da entity seçimi dropdown
- Entity seçildiğinde ID seçimi (dinamik liste)

### Adım 2: Form Geliştirmeleri
- Ödeme yöntemi seçimi
- Ödeme tarihi picker
- Tekrarlayan gider checkbox
- Daha fazla kategori

### Adım 3: Raporlama
- Aylık özet endpoint
- Kategori bazlı grafikler
- Trend analizi
- Bütçe takibi

### Adım 4: Otomasyonlar
- Tekrarlayan giderler (cron job)
- Bütçe aşımı uyarıları
- Entity bazlı otomatik gider oluşturma

---

## 📊 Öncelik Sırası

1. **Yüksek Öncelik:**
   - İlişki yönetimi (relatedEntityType, relatedEntityId)
   - Form geliştirmeleri (ödeme yöntemi, ödeme tarihi)
   - Daha fazla kategori

2. **Orta Öncelik:**
   - Aylık özet raporlar
   - Kategori bazlı grafikler
   - Bütçe takibi

3. **Düşük Öncelik:**
   - Tekrarlayan giderler
   - Fatura ekleri
   - Alt kategoriler










