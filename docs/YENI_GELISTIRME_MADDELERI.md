# 🚀 CRM Enterprise V3 - Yeni Geliştirme Maddeleri

**Tarih:** 2024  
**Durum:** Öneriler ve İyileştirmeler  
**Öncelik:** Öncelik sırasına göre listelenmiştir

---

## 📊 GENEL BAKIŞ

Bu dokümanda sistemin mevcut durumunu iyileştirmek ve yeni özellikler eklemek için öneriler bulunmaktadır.

---

## 🔴 YÜKSEK ÖNCELİK (İş Değeri Yüksek)

### 1. Kısmi Ödeme Sistemi
**Açıklama:** Invoice için kısmi ödeme yapabilme özelliği

**Özellikler:**
- Invoice'a birden fazla ödeme kaydı eklenebilir
- Her ödeme için ayrı tarih ve tutar
- Toplam ödenen tutar otomatik hesaplanır
- Kalan tutar gösterilir
- Tüm tutar ödendiğinde otomatik PAID durumuna geçer

**Teknik Detaylar:**
- Yeni tablo: `Payment` (invoiceId, amount, paymentDate, paymentMethod, notes)
- Invoice tablosuna `paidAmount` kolonu ekle
- `paidAmount >= totalAmount` kontrolü ile otomatik PAID durumu
- Finance kaydı her ödeme için ayrı oluşturulur

**Süre:** 8 saat  
**Etki:** Yüksek (müşteri memnuniyeti)

---

### 2. Stok Rezervasyonu Sistemi
**Açıklama:** Quote SENT olduğunda stok rezervasyonu yapılması

**Özellikler:**
- Quote SENT → Ürünler için rezervasyon oluşturulur
- Rezervasyon süresi: Quote validUntil tarihine kadar
- Rezervasyon iptal: Quote REJECTED/EXPIRED → Rezervasyon kaldırılır
- Rezervasyon onay: Quote ACCEPTED → Rezervasyon kalıcı stok düşümüne dönüşür

**Teknik Detaylar:**
- Product tablosuna `reservedQuantity` kolonu ekle
- Yeni tablo: `StockReservation` (quoteId, productId, quantity, expiresAt, status)
- Quote status trigger'ları ile otomatik rezervasyon yönetimi

**Süre:** 6 saat  
**Etki:** Yüksek (stok yönetimi)

---

### 3. Ödeme Planı (Taksitli Ödeme)
**Açıklama:** Invoice için taksitli ödeme planı oluşturma

**Özellikler:**
- Invoice oluşturulurken ödeme planı seçilebilir
- Taksit sayısı ve tutarları belirlenir
- Her taksit için vade tarihi otomatik hesaplanır
- Taksit ödemeleri takip edilir
- Geciken taksitler için uyarı

**Teknik Detaylar:**
- Yeni tablo: `PaymentPlan` (invoiceId, installmentCount, totalAmount, status)
- Yeni tablo: `PaymentInstallment` (paymentPlanId, installmentNumber, amount, dueDate, status, paidDate)
- Cron job: Geciken taksitler için günlük kontrol

**Süre:** 10 saat  
**Etki:** Yüksek (müşteri memnuniyeti, nakit akışı yönetimi)

---

### 4. Competitors Detay Sayfası
**Açıklama:** Rakip analizi için detaylı sayfa

**Özellikler:**
- Rakip bilgileri (güçlü yönler, zayıf yönler)
- Fiyat karşılaştırması
- Pazar payı analizi
- İlgili Deal'lar (bu rakip ile rekabet edilen fırsatlar)
- Zaman içindeki performans grafiği

**Teknik Detaylar:**
- `/competitors/[id]/page.tsx` oluştur
- Deal tablosunda `competitorId` kolonu ile ilişki
- Grafik component'i (Recharts)

**Süre:** 4 saat  
**Etki:** Orta (rakip analizi)

---

### 5. Contacts Detay Sayfası
**Açıklama:** İlgili kişiler için detaylı sayfa

**Özellikler:**
- Kişi bilgileri (iletişim, LinkedIn, notlar)
- İlgili firma bilgileri
- İletişim geçmişi (Meeting, Email, Call log)
- İlgili Deal'lar ve Quote'lar
- ActivityLog timeline

**Teknik Detaylar:**
- `/contacts/[id]/page.tsx` oluştur
- Meeting ve Email logları ile ilişki
- Timeline component'i

**Süre:** 4 saat  
**Etki:** Orta (müşteri ilişkileri yönetimi)

---

## 🟠 ORTA ÖNCELİK (İş Değeri Orta)

### 6. İade İşlemi (Invoice Refund)
**Açıklama:** Invoice için iade işlemi yapabilme

**Özellikler:**
- Invoice iade edilebilir (kısmi veya tam)
- İade nedeni zorunlu
- İade tutarı Finance'a EXPENSE olarak kaydedilir
- Stok geri alınır (ürünler varsa)
- İade onay süreci (büyük tutarlar için)

**Teknik Detaylar:**
- Invoice tablosuna `refundAmount`, `refundReason`, `refundDate` kolonları
- Stok hareketi: İade → Stok artışı
- Finance kaydı: EXPENSE tipinde

**Süre:** 6 saat  
**Etki:** Orta (müşteri memnuniyeti)

---

### 7. Notification İyileştirmeleri
**Açıklama:** Eksik notification'ları ekleme

**Eklenecek Notification'lar:**
- Quote REJECTED → Müşteri reddetti bildirimi
- Invoice OVERDUE → Vadesi geçti bildirimi (cron job ile)
- Task Reminder → Vadesi yaklaşıyor bildirimi
- Meeting Reminder → Görüşme yaklaşıyor bildirimi (1 gün önce, 1 saat önce)

**Teknik Detaylar:**
- Cron job'ları güncelle
- Notification helper fonksiyonları ekle
- Email entegrasyonu (opsiyonel)

**Süre:** 4 saat  
**Etki:** Orta (kullanıcı bilgilendirme)

---

### 8. Error Handling İyileştirmeleri
**Açıklama:** Daha detaylı ve kullanıcı dostu hata mesajları

**İyileştirmeler:**
- Database constraint error'ları user-friendly mesajlara çevir
- Validation error'ları detaylı göster (hangi alan, ne hatası)
- Network error'ları için retry mekanizması
- Error logging sistemi (Sentry veya benzeri)

**Teknik Detaylar:**
- Error handler utility fonksiyonu
- Error code mapping
- User-friendly mesajlar (TR/EN)

**Süre:** 6 saat  
**Etki:** Orta (kullanıcı deneyimi)

---

### 9. Product Stok Validasyonu
**Açıklama:** Stok negatif olamaz kontrolü

**Özellikler:**
- Stok düşümünde negatif kontrolü
- Yetersiz stok uyarısı
- Stok hareketi geçmişi görüntüleme

**Teknik Detaylar:**
- Product API'de validasyon
- StockMovement API'de kontrol
- UI'da uyarı mesajları

**Süre:** 2 saat  
**Etki:** Düşük (veri bütünlüğü)

---

### 10. Finance Tutar Validasyonu
**Açıklama:** Finance kayıtlarında tutar validasyonu

**Özellikler:**
- Negatif tutar kontrolü (EXPENSE için negatif olabilir ama INCOME için olamaz)
- Tutar formatı kontrolü
- Currency validasyonu

**Teknik Detaylar:**
- Finance API'de validasyon
- Zod schema güncellemesi

**Süre:** 2 saat  
**Etki:** Düşük (veri bütünlüğü)

---

## 🟡 DÜŞÜK ÖNCELİK (Nice-to-Have)

### 11. Müşteri Takip Cron Job'ları
**Açıklama:** Müşteri takip için otomatik görev oluşturma

**Özellikler:**
- 30 gün iletişim yoksa → Takip görevi oluştur
- VIP müşteri + 7 gün iletişim yoksa → Acil görev oluştur
- Deal 7 gün LEAD'de kalırsa → Takip görevi oluştur

**Teknik Detaylar:**
- Yeni cron job: `check-customer-followup`
- Task otomatik oluşturma
- Notification gönderimi

**Süre:** 4 saat  
**Etki:** Düşük (otomasyon)

---

### 12. Dosya Versiyonlama Sistemi
**Açıklama:** Document modülünde dosya versiyonlama

**Özellikler:**
- Aynı dosya tekrar yüklenirse yeni versiyon oluşturulur
- Versiyon geçmişi görüntüleme
- Eski versiyonları geri yükleme

**Teknik Detaylar:**
- Document tablosuna `version`, `parentDocumentId` kolonları
- Versiyon yönetimi UI'ı

**Süre:** 8 saat  
**Etki:** Düşük (döküman yönetimi)

---

### 13. Advanced Search (Gelişmiş Arama)
**Açıklama:** Tüm modüllerde gelişmiş arama özelliği

**Özellikler:**
- Çoklu alan araması
- Tarih aralığı filtreleme
- Boolean operatörler (AND, OR, NOT)
- Kaydedilmiş aramalar

**Teknik Detaylar:**
- Search API endpoint'i
- Query builder component'i
- Saved searches tablosu

**Süre:** 12 saat  
**Etki:** Düşük (kullanıcı deneyimi)

---

### 14. Bulk Operations (Toplu İşlemler)
**Açıklama:** Birden fazla kayıt için toplu işlemler

**Özellikler:**
- Toplu silme
- Toplu durum değiştirme
- Toplu atama
- Toplu export

**Teknik Detaylar:**
- Bulk API endpoint'leri
- UI'da checkbox selection
- Confirmation dialog

**Süre:** 10 saat  
**Etki:** Düşük (verimlilik)

---

### 15. Advanced Reporting (Gelişmiş Raporlama)
**Açıklama:** Daha detaylı ve özelleştirilebilir raporlar

**Özellikler:**
- Özel rapor şablonları
- Grafik türleri (Bar, Line, Pie, Radar, Doughnut)
- Filtreleme seçenekleri
- Scheduled reports (zamanlanmış raporlar)

**Teknik Detaylar:**
- Report template sistemi
- Chart library entegrasyonu
- Email ile rapor gönderimi

**Süre:** 16 saat  
**Etki:** Düşük (analitik)

---

## 📋 ÖNCELİKLENDİRME MATRİSİ

| Özellik | İş Değeri | Teknik Zorluk | Süre | Öncelik |
|---------|-----------|---------------|------|---------|
| Kısmi Ödeme | Yüksek | Orta | 8s | 🔴 1 |
| Stok Rezervasyonu | Yüksek | Orta | 6s | 🔴 2 |
| Ödeme Planı | Yüksek | Yüksek | 10s | 🔴 3 |
| Competitors Detay | Orta | Düşük | 4s | 🔴 4 |
| Contacts Detay | Orta | Düşük | 4s | 🔴 5 |
| İade İşlemi | Orta | Orta | 6s | 🟠 6 |
| Notification İyileştirme | Orta | Düşük | 4s | 🟠 7 |
| Error Handling | Orta | Orta | 6s | 🟠 8 |
| Stok Validasyonu | Düşük | Düşük | 2s | 🟠 9 |
| Finance Validasyonu | Düşük | Düşük | 2s | 🟠 10 |
| Müşteri Takip Cron | Düşük | Düşük | 4s | 🟡 11 |
| Dosya Versiyonlama | Düşük | Orta | 8s | 🟡 12 |
| Advanced Search | Düşük | Yüksek | 12s | 🟡 13 |
| Bulk Operations | Düşük | Orta | 10s | 🟡 14 |
| Advanced Reporting | Düşük | Yüksek | 16s | 🟡 15 |

---

## 🎯 ÖNERİLEN UYGULAMA SIRASI

### Faz 1: Kritik Özellikler (32 saat - 4 iş günü)
1. Kısmi Ödeme Sistemi
2. Stok Rezervasyonu
3. Competitors Detay Sayfası
4. Contacts Detay Sayfası

### Faz 2: İyileştirmeler (18 saat - 2.5 iş günü)
5. Notification İyileştirmeleri
6. Error Handling İyileştirmeleri
7. Stok Validasyonu
8. Finance Validasyonu

### Faz 3: Gelişmiş Özellikler (24 saat - 3 iş günü)
9. Ödeme Planı
10. İade İşlemi
11. Müşteri Takip Cron Job'ları

### Faz 4: Nice-to-Have (46 saat - 6 iş günü)
12. Dosya Versiyonlama
13. Advanced Search
14. Bulk Operations
15. Advanced Reporting

---

## 📊 TOPLAM SÜRE TAHMİNİ

- **Faz 1:** 32 saat (4 iş günü)
- **Faz 2:** 18 saat (2.5 iş günü)
- **Faz 3:** 24 saat (3 iş günü)
- **Faz 4:** 46 saat (6 iş günü)
- **TOPLAM:** 120 saat (15 iş günü)

---

## 🎉 SONUÇ

Bu geliştirme maddeleri sistemin işlevselliğini artıracak ve kullanıcı deneyimini iyileştirecektir. Öncelik sırasına göre uygulanması önerilir.

**Önerilen Başlangıç:** Faz 1 (Kritik Özellikler) ile başlanması önerilir.

---

**Doküman Hazırlayan:** AI Assistant  
**Tarih:** 2024  
**Versiyon:** 1.0.0

















