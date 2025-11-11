# 🚀 Tüm Otomasyonlar - Detaylı Test Senaryoları

Bu dokümanda **TÜM** otomasyonların test senaryoları ve kullanım kılavuzu bulunmaktadır.

---

## 📋 İçindekiler

### ✅ Tamamlanan Otomasyonlar

1. [Smart Reminder - Günlük Bildirimler](#1-smart-reminder)
2. [QuickActions - Hızlı İşlem Butonları](#2-quickactions)
3. [SmartEmptyState - Boş Ekran Önerileri](#3-smartemptystate)
4. [AutoGoalTracker - Hedef Takibi](#4-autogoaltracker)
5. [AutoTaskFromQuote - Otomatik Görev Atama](#5-autotaskfromquote)
6. [AutoNoteOnEdit - Değişiklik Günlüğü](#6-autonoteonedit)
7. [AutoQuoteExpiry - Otomatik Süre Dolumu](#7-autoquoteexpiry)
8. [Deal-to-Quote Time Monitor](#8-deal-to-quote-time-monitor)
9. [Churn Prediction - Kayıp Müşteri Tahmini](#9-churn-prediction)
10. [Smart Re-Engagement Flow](#10-smart-re-engagement-flow)
11. [Auto-Priority Lead Sorting](#11-auto-priority-lead-sorting)

---

## 1️⃣ Smart Reminder - Günlük Bildirimler

### 📝 Açıklama
Kullanıcı dashboard'a giriş yaptığında otomatik olarak günlük özet gösterilir.

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

**API Test:**
```bash
GET /api/automations/smart-reminder
```

**Beklenen Response:**
```json
{
  "pendingQuotes": 1,
  "inactiveCustomers": 1,
  "inactiveCustomersList": [...],
  "pendingShipments": 1
}
```

---

## 2️⃣ QuickActions - Hızlı İşlem Butonları

### 📝 Açıklama
Duruma göre otomatik olarak hızlı işlem butonları gösterilir.

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

**Component Kullanımı:**
```tsx
<QuickActions 
  entityType="quote" 
  entityId={quote.id} 
  status={quote.status} 
/>
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

**Component Kullanımı:**
```tsx
{quotes.length === 0 && (
  <SmartEmptyState entityType="quotes" />
)}
```

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

**API Test:**
```bash
POST /api/automations/goal-tracker
Content-Type: application/json

{
  "monthlyGoal": 50000
}
```

**Beklenen Response:**
```json
{
  "monthlyGoal": 50000,
  "message": "Hedef güncellendi"
}
```

### ✅ Test Senaryosu 2: İlerleme Takibi

**Adımlar:**
1. Dashboard'da hedef belirle (örn: 50000₺)
2. Bir fatura oluştur ve durumunu "PAID" yap (örn: 20000₺)
3. Dashboard'u yenile

**Beklenen Sonuç:**
- ✅ İlerleme çubuğu %40'a kadar dolar (20000/50000)
- ✅ "İlerleme: 20.000₺" ve "Kalan: 30.000₺" bilgileri görünür
- ✅ İlerleme yüzdesi %40 olarak görünür

**API Test:**
```bash
GET /api/automations/goal-tracker
```

**Beklenen Response:**
```json
{
  "monthlyGoal": 50000,
  "currentProgress": 20000,
  "percentage": 40
}
```

---

## 5️⃣ AutoTaskFromQuote - Otomatik Görev Atama

### 📝 Açıklama
Teklif oluşturulduğunda otomatik olarak görev açılır ve teklif sahibine atanır.

### ✅ Test Senaryosu 1: Teklif Oluşturulduğunda Görev Açılması

**Adımlar:**
1. Yeni bir teklif oluştur
2. Teklif kaydedildikten sonra Görevler sayfasına git (`/tasks`)
3. Yeni oluşturulan görevi kontrol et

**Beklenen Sonuç:**
- ✅ Yeni bir görev oluşturulur
- ✅ Görev başlığı: "Bu teklif için 3 gün içinde müşteriyi ara: [Teklif Başlığı]"
- ✅ Görev teklif sahibine atanır
- ✅ Görev durumu "TODO" olarak görünür
- ✅ Görev dueDate'i 3 gün sonra olarak ayarlanır

**Test Verileri Hazırlama:**
```sql
-- Teklif oluştur (otomatik görev açılacak)
INSERT INTO "Quote" (title, status, total, "companyId", "userId") 
VALUES ('Yeni Teklif', 'DRAFT', 10000, 'your-company-id', 'your-user-id');
```

**API Test:**
```bash
POST /api/quotes
Content-Type: application/json

{
  "title": "Test Teklif",
  "status": "DRAFT",
  "total": 10000,
  "dealId": "deal-id"
}
```

**Beklenen Sonuç:**
- ✅ Teklif oluşturulur
- ✅ Görev otomatik oluşturulur
- ✅ Görev teklif sahibine atanır

---

## 6️⃣ AutoNoteOnEdit - Değişiklik Günlüğü

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
- ✅ Kayıt açıklaması: "Fiyat güncellendi (eski: ₺10.000,00 → yeni: ₺12.000,00)"
- ✅ Kayıt meta bilgilerinde eski ve yeni değerler bulunur

**API Test:**
```bash
PUT /api/quotes/[id]
Content-Type: application/json

{
  "total": 12000
}
```

**Beklenen Response:**
```json
{
  "id": "quote-id",
  "title": "Test Teklif",
  "total": 12000,
  ...
}
```

**ActivityLog Kontrolü:**
```sql
SELECT * FROM "ActivityLog" 
WHERE entity = 'Quote' 
  AND action = 'UPDATE' 
  AND meta->>'oldTotal' IS NOT NULL
ORDER BY "createdAt" DESC
LIMIT 1;
```

---

## 7️⃣ AutoQuoteExpiry - Otomatik Süre Dolumu

### 📝 Açıklama
30 günden uzun süredir "SENT" olan teklifler otomatik EXPIRED yapılır.

### ✅ Test Senaryosu 1: Eski Teklifleri Expired Yapma

**Adımlar:**
1. 35 gün önce oluşturulmuş bir SENT teklif oluştur
2. API endpoint'ini çağır: `POST /api/automations/auto-quote-expiry`
3. Teklif durumunu kontrol et

**Beklenen Sonuç:**
- ✅ Teklif durumu "EXPIRED" olarak güncellenir
- ✅ ActivityLog'a kayıt eklenir
- ✅ Kayıt açıklaması: "Teklif süresi doldu: [Teklif Başlığı] - 30 günden uzun süredir SENT durumunda"

**Test Verileri Hazırlama:**
```sql
-- 35 gün önce oluşturulmuş SENT teklif
INSERT INTO "Quote" (title, status, total, "companyId", "createdAt") 
VALUES ('Eski Teklif', 'SENT', 10000, 'your-company-id', NOW() - INTERVAL '35 days');
```

**API Test:**
```bash
POST /api/automations/auto-quote-expiry
```

**Beklenen Response:**
```json
{
  "message": "Expired quotes updated successfully",
  "count": 1,
  "quotes": [
    {
      "id": "quote-id",
      "title": "Eski Teklif"
    }
  ]
}
```

**Veritabanı Kontrolü:**
```sql
SELECT * FROM "Quote" 
WHERE status = 'EXPIRED' 
  AND "companyId" = 'your-company-id';
```

---

## 8️⃣ Deal-to-Quote Time Monitor

### 📝 Açıklama
Fırsat oluşturulduktan sonra 48 saat içinde teklif hazırlanmamışsa uyarı çıkar.

### ✅ Test Senaryosu 1: Teklif Oluşturulmamış Fırsatları Bulma

**Adımlar:**
1. 50 saat önce oluşturulmuş bir fırsat oluştur (teklif yok)
2. API endpoint'ini çağır: `GET /api/automations/deal-to-quote-monitor`
3. Uyarıları kontrol et

**Beklenen Sonuç:**
- ✅ Uyarı listesi döner
- ✅ Her uyarı için: dealId, dealTitle, createdAt, hoursSinceCreation bilgileri bulunur
- ✅ Uyarı sayısı > 0 ise bildirim gösterilir

**Test Verileri Hazırlama:**
```sql
-- 50 saat önce oluşturulmuş fırsat (teklif yok)
INSERT INTO "Deal" (title, stage, value, status, "companyId", "createdAt") 
VALUES ('Eski Fırsat', 'LEAD', 20000, 'OPEN', 'your-company-id', NOW() - INTERVAL '50 hours');
```

**API Test:**
```bash
GET /api/automations/deal-to-quote-monitor
```

**Beklenen Response:**
```json
{
  "message": "Deals without quotes found",
  "warnings": [
    {
      "dealId": "deal-id",
      "dealTitle": "Eski Fırsat",
      "createdAt": "2025-01-01T00:00:00Z",
      "hoursSinceCreation": 50
    }
  ],
  "count": 1
}
```

---

## 9️⃣ Churn Prediction - Kayıp Müşteri Tahmini

### 📝 Açıklama
Basit skorlama: (inaktif_günler * 0.5) + (reddedilen_teklifler * 1.5)
Skor > 10 ise müşteri "Riskli" olarak işaretlenir.

### ✅ Test Senaryosu 1: Riskli Müşterileri Bulma

**Adımlar:**
1. 30 gün önce güncellenmiş bir müşteri oluştur
2. Bu müşteriye 5 reddedilen teklif ekle
3. API endpoint'ini çağır: `GET /api/automations/churn-prediction`
4. Riskli müşterileri kontrol et

**Beklenen Sonuç:**
- ✅ Riskli müşteriler listesi döner
- ✅ Her müşteri için: customerId, customerName, churnScore, inactiveDays, rejectedQuotes, riskLevel bilgileri bulunur
- ✅ Churn skoru > 10 olan müşteriler "HIGH" risk seviyesinde

**Test Verileri Hazırlama:**
```sql
-- 30 gün önce güncellenmiş müşteri
INSERT INTO "Customer" (name, status, "companyId", "updatedAt", "lastInteractionDate") 
VALUES ('Riskli Müşteri', 'ACTIVE', 'your-company-id', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days');

-- 5 reddedilen teklif
INSERT INTO "Quote" (title, status, total, "companyId", "customerId") 
VALUES 
  ('Teklif 1', 'DECLINED', 10000, 'your-company-id', 'customer-id'),
  ('Teklif 2', 'DECLINED', 15000, 'your-company-id', 'customer-id'),
  ('Teklif 3', 'DECLINED', 20000, 'your-company-id', 'customer-id'),
  ('Teklif 4', 'DECLINED', 12000, 'your-company-id', 'customer-id'),
  ('Teklif 5', 'DECLINED', 18000, 'your-company-id', 'customer-id');
```

**API Test:**
```bash
GET /api/automations/churn-prediction
```

**Beklenen Response:**
```json
{
  "message": "Risky customers found",
  "riskyCustomers": [
    {
      "customerId": "customer-id",
      "customerName": "Riskli Müşteri",
      "churnScore": 30.0,
      "inactiveDays": 30,
      "rejectedQuotes": 5,
      "riskLevel": "HIGH"
    }
  ],
  "count": 1
}
```

**Churn Skoru Hesaplama:**
- İnaktif günler: 30
- Reddedilen teklifler: 5
- Churn skoru: (30 * 0.5) + (5 * 1.5) = 15 + 7.5 = 22.5
- Risk seviyesi: HIGH (> 10)

---

## 🔟 Smart Re-Engagement Flow

### 📝 Açıklama
Müşteri 60 gün boyunca etkileşimsizse (hiç görüşme, teklif, fatura yoksa) uyarı ver.

### ✅ Test Senaryosu 1: Etkileşimsiz Müşterileri Bulma

**Adımlar:**
1. 70 gün önce güncellenmiş bir müşteri oluştur
2. Bu müşteriye son 60 günde hiç teklif, fatura, görüşme ekleme
3. API endpoint'ini çağır: `GET /api/automations/smart-re-engagement`
4. Etkileşimsiz müşterileri kontrol et

**Beklenen Sonuç:**
- ✅ Etkileşimsiz müşteriler listesi döner
- ✅ Her müşteri için: customerId, customerName, lastInteraction, daysSinceInteraction bilgileri bulunur
- ✅ hasRecentQuote, hasRecentInvoice, hasRecentMeeting false olmalı

**Test Verileri Hazırlama:**
```sql
-- 70 gün önce güncellenmiş müşteri
INSERT INTO "Customer" (name, status, "companyId", "updatedAt", "lastInteractionDate") 
VALUES ('Etkileşimsiz Müşteri', 'ACTIVE', 'your-company-id', NOW() - INTERVAL '70 days', NOW() - INTERVAL '70 days');
```

**API Test:**
```bash
GET /api/automations/smart-re-engagement
```

**Beklenen Response:**
```json
{
  "message": "1 müşteri 60 günden uzun süredir etkileşimsiz",
  "inactiveCustomers": [
    {
      "customerId": "customer-id",
      "customerName": "Etkileşimsiz Müşteri",
      "lastInteraction": "2024-11-01T00:00:00Z",
      "daysSinceInteraction": 70,
      "hasRecentQuote": false,
      "hasRecentInvoice": false,
      "hasRecentMeeting": false
    }
  ],
  "count": 1
}
```

---

## 1️⃣1️⃣ Auto-Priority Lead Sorting

### 📝 Açıklama
Yeni girilen fırsatlar (deal) sistemce puanlanır:
Formül: (teklif_tutarı × müşteri_skoru × olasılık) / gün_sayısı
En yüksek puanlı fırsatlar "Öncelikli" etiketiyle listenin üstüne taşınır.

### ✅ Test Senaryosu 1: Fırsat Puanlama

**Adımlar:**
1. Yüksek değerli bir fırsat oluştur (örn: 100000₺)
2. Bu fırsat için müşteriye ödenmiş faturalar ekle (müşteri skoru artar)
3. Fırsatın winProbability'sini yüksek yap (örn: 80)
4. API endpoint'ini çağır: `GET /api/automations/priority-lead-sorting`
5. Puanlanmış fırsatları kontrol et

**Beklenen Sonuç:**
- ✅ Puanlanmış fırsatlar listesi döner
- ✅ Her fırsat için: dealId, dealTitle, priorityScore, value, customerScore, winProbability, daysSinceCreation, isPriority bilgileri bulunur
- ✅ PriorityScore > 1000 olan fırsatlar isPriority = true

**Test Verileri Hazırlama:**
```sql
-- Yüksek değerli fırsat
INSERT INTO "Deal" (title, stage, value, status, "companyId", "winProbability", "customerId") 
VALUES ('Yüksek Değerli Fırsat', 'PROPOSAL', 100000, 'OPEN', 'your-company-id', 80, 'customer-id');

-- Müşteriye ödenmiş faturalar (müşteri skoru artar)
INSERT INTO "Invoice" (title, status, total, "companyId", "customerId") 
VALUES 
  ('Fatura 1', 'PAID', 50000, 'your-company-id', 'customer-id'),
  ('Fatura 2', 'PAID', 30000, 'your-company-id', 'customer-id');
```

**API Test:**
```bash
GET /api/automations/priority-lead-sorting
```

**Beklenen Response:**
```json
{
  "message": "Deals prioritized successfully",
  "prioritizedDeals": [
    {
      "dealId": "deal-id",
      "dealTitle": "Yüksek Değerli Fırsat",
      "priorityScore": 3200.0,
      "value": 100000,
      "customerScore": 8.0,
      "winProbability": 80,
      "daysSinceCreation": 1,
      "isPriority": true
    }
  ],
  "count": 1,
  "priorityCount": 1
}
```

**Priority Skoru Hesaplama:**
- Teklif tutarı: 100000₺
- Müşteri skoru: (50000 + 30000) / 10000 = 8.0
- Olasılık: 80%
- Gün sayısı: 1
- Priority skoru: (100000 * 8.0 * 0.8) / 1 = 64000 / 1 = 64000
- isPriority: true (> 1000)

---

## 📊 Genel Test Kontrol Listesi

### ✅ Tüm Otomasyonlar İçin Ortak Kontroller

1. **Migration Kontrolü**
   ```bash
   # Migration dosyasını çalıştır
   supabase db push
   ```

2. **API Endpoint Kontrolü**
   - ✅ Tüm API endpoint'leri çalışıyor mu?
   - ✅ Hata durumlarında uygun mesajlar dönüyor mu?
   - ✅ RLS (Row-Level Security) kontrolü yapılıyor mu?

3. **UI/UX Kontrolü**
   - ✅ Tüm component'ler doğru render ediliyor mu?
   - ✅ Loading state'ler gösteriliyor mu?
   - ✅ Error state'ler gösteriliyor mu?
   - ✅ Responsive tasarım çalışıyor mu?

4. **Performans Kontrolü**
   - ✅ API response süreleri < 1000ms mi?
   - ✅ Component render süreleri < 300ms mi?
   - ✅ Cache stratejisi çalışıyor mu?

5. **Güvenlik Kontrolü**
   - ✅ Session kontrolü yapılıyor mu?
   - ✅ CompanyId filtresi uygulanıyor mu?
   - ✅ Input validation yapılıyor mu?

---

## 🐛 Hata Ayıklama İpuçları

### Sorun: Migration çalışmıyor
**Çözüm:**
1. Migration dosyasını kontrol et: `supabase/migrations/020_automations_complete.sql`
2. Supabase CLI ile migration çalıştır: `supabase db push`
3. Hata mesajlarını kontrol et

### Sorun: API endpoint'leri çalışmıyor
**Çözüm:**
1. Browser console'u kontrol et (F12)
2. Network tab'ında API isteklerini kontrol et
3. Session kontrolü yap
4. CompanyId'nin doğru olduğundan emin ol

### Sorun: Component'ler render edilmiyor
**Çözüm:**
1. Browser console'da hata var mı kontrol et
2. Component import'larını kontrol et
3. Dynamic import'lar doğru mu kontrol et

---

## 📝 Migration Dosyası

Migration dosyası: `supabase/migrations/020_automations_complete.sql`

**Çalıştırma:**
```bash
# Supabase CLI ile
supabase db push

# Veya SQL Editor'de
# Dosya içeriğini kopyala-yapıştır
```

**Migration İçeriği:**
- User tablosuna monthlyGoal, preferredCurrency, lastSearchHistory kolonları
- Quote tablosuna expiryDate, priorityScore kolonları
- Deal tablosuna priorityScore, isPriority, quoteCreatedAt kolonları
- Customer tablosuna churnScore, riskLevel, lastInteractionDate, birthday, satisfactionScore kolonları
- Invoice tablosuna invoiceNumber, autoGeneratedFileName kolonları
- Task tablosuna escalated, escalatedAt kolonları
- Trigger'lar ve Function'lar
- View'lar (RiskyCustomers, PriorityDeals)
- Index'ler (performans için)

---

## 🎯 Sonuç

Bu test senaryoları ile tüm otomasyonların çalıştığından emin olabilirsiniz. Her senaryo adım adım takip edilerek sistemin doğru çalıştığı doğrulanabilir.

**Test Sırası:**
1. Önce migration dosyasını çalıştır
2. Smart Reminder'ı test et
3. QuickActions'ı test et
4. SmartEmptyState'i test et
5. AutoGoalTracker'ı test et
6. Diğer otomasyonları sırayla test et

**Başarı Kriterleri:**
- ✅ Migration başarıyla çalıştı
- ✅ Tüm API endpoint'leri 200 status code dönüyor
- ✅ Tüm UI component'leri doğru render ediliyor
- ✅ Tüm otomasyonlar beklenen şekilde çalışıyor
- ✅ Hata durumlarında uygun mesajlar gösteriliyor

---

## 📞 Destek

Herhangi bir sorun yaşarsanız:
1. Browser console'u kontrol edin (F12)
2. Network tab'ında API isteklerini kontrol edin
3. Veritabanı loglarını kontrol edin
4. Migration dosyasını tekrar çalıştırın



Bu dokümanda **TÜM** otomasyonların test senaryoları ve kullanım kılavuzu bulunmaktadır.

---

## 📋 İçindekiler

### ✅ Tamamlanan Otomasyonlar

1. [Smart Reminder - Günlük Bildirimler](#1-smart-reminder)
2. [QuickActions - Hızlı İşlem Butonları](#2-quickactions)
3. [SmartEmptyState - Boş Ekran Önerileri](#3-smartemptystate)
4. [AutoGoalTracker - Hedef Takibi](#4-autogoaltracker)
5. [AutoTaskFromQuote - Otomatik Görev Atama](#5-autotaskfromquote)
6. [AutoNoteOnEdit - Değişiklik Günlüğü](#6-autonoteonedit)
7. [AutoQuoteExpiry - Otomatik Süre Dolumu](#7-autoquoteexpiry)
8. [Deal-to-Quote Time Monitor](#8-deal-to-quote-time-monitor)
9. [Churn Prediction - Kayıp Müşteri Tahmini](#9-churn-prediction)
10. [Smart Re-Engagement Flow](#10-smart-re-engagement-flow)
11. [Auto-Priority Lead Sorting](#11-auto-priority-lead-sorting)

---

## 1️⃣ Smart Reminder - Günlük Bildirimler

### 📝 Açıklama
Kullanıcı dashboard'a giriş yaptığında otomatik olarak günlük özet gösterilir.

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

**API Test:**
```bash
GET /api/automations/smart-reminder
```

**Beklenen Response:**
```json
{
  "pendingQuotes": 1,
  "inactiveCustomers": 1,
  "inactiveCustomersList": [...],
  "pendingShipments": 1
}
```

---

## 2️⃣ QuickActions - Hızlı İşlem Butonları

### 📝 Açıklama
Duruma göre otomatik olarak hızlı işlem butonları gösterilir.

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

**Component Kullanımı:**
```tsx
<QuickActions 
  entityType="quote" 
  entityId={quote.id} 
  status={quote.status} 
/>
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

**Component Kullanımı:**
```tsx
{quotes.length === 0 && (
  <SmartEmptyState entityType="quotes" />
)}
```

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

**API Test:**
```bash
POST /api/automations/goal-tracker
Content-Type: application/json

{
  "monthlyGoal": 50000
}
```

**Beklenen Response:**
```json
{
  "monthlyGoal": 50000,
  "message": "Hedef güncellendi"
}
```

### ✅ Test Senaryosu 2: İlerleme Takibi

**Adımlar:**
1. Dashboard'da hedef belirle (örn: 50000₺)
2. Bir fatura oluştur ve durumunu "PAID" yap (örn: 20000₺)
3. Dashboard'u yenile

**Beklenen Sonuç:**
- ✅ İlerleme çubuğu %40'a kadar dolar (20000/50000)
- ✅ "İlerleme: 20.000₺" ve "Kalan: 30.000₺" bilgileri görünür
- ✅ İlerleme yüzdesi %40 olarak görünür

**API Test:**
```bash
GET /api/automations/goal-tracker
```

**Beklenen Response:**
```json
{
  "monthlyGoal": 50000,
  "currentProgress": 20000,
  "percentage": 40
}
```

---

## 5️⃣ AutoTaskFromQuote - Otomatik Görev Atama

### 📝 Açıklama
Teklif oluşturulduğunda otomatik olarak görev açılır ve teklif sahibine atanır.

### ✅ Test Senaryosu 1: Teklif Oluşturulduğunda Görev Açılması

**Adımlar:**
1. Yeni bir teklif oluştur
2. Teklif kaydedildikten sonra Görevler sayfasına git (`/tasks`)
3. Yeni oluşturulan görevi kontrol et

**Beklenen Sonuç:**
- ✅ Yeni bir görev oluşturulur
- ✅ Görev başlığı: "Bu teklif için 3 gün içinde müşteriyi ara: [Teklif Başlığı]"
- ✅ Görev teklif sahibine atanır
- ✅ Görev durumu "TODO" olarak görünür
- ✅ Görev dueDate'i 3 gün sonra olarak ayarlanır

**Test Verileri Hazırlama:**
```sql
-- Teklif oluştur (otomatik görev açılacak)
INSERT INTO "Quote" (title, status, total, "companyId", "userId") 
VALUES ('Yeni Teklif', 'DRAFT', 10000, 'your-company-id', 'your-user-id');
```

**API Test:**
```bash
POST /api/quotes
Content-Type: application/json

{
  "title": "Test Teklif",
  "status": "DRAFT",
  "total": 10000,
  "dealId": "deal-id"
}
```

**Beklenen Sonuç:**
- ✅ Teklif oluşturulur
- ✅ Görev otomatik oluşturulur
- ✅ Görev teklif sahibine atanır

---

## 6️⃣ AutoNoteOnEdit - Değişiklik Günlüğü

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
- ✅ Kayıt açıklaması: "Fiyat güncellendi (eski: ₺10.000,00 → yeni: ₺12.000,00)"
- ✅ Kayıt meta bilgilerinde eski ve yeni değerler bulunur

**API Test:**
```bash
PUT /api/quotes/[id]
Content-Type: application/json

{
  "total": 12000
}
```

**Beklenen Response:**
```json
{
  "id": "quote-id",
  "title": "Test Teklif",
  "total": 12000,
  ...
}
```

**ActivityLog Kontrolü:**
```sql
SELECT * FROM "ActivityLog" 
WHERE entity = 'Quote' 
  AND action = 'UPDATE' 
  AND meta->>'oldTotal' IS NOT NULL
ORDER BY "createdAt" DESC
LIMIT 1;
```

---

## 7️⃣ AutoQuoteExpiry - Otomatik Süre Dolumu

### 📝 Açıklama
30 günden uzun süredir "SENT" olan teklifler otomatik EXPIRED yapılır.

### ✅ Test Senaryosu 1: Eski Teklifleri Expired Yapma

**Adımlar:**
1. 35 gün önce oluşturulmuş bir SENT teklif oluştur
2. API endpoint'ini çağır: `POST /api/automations/auto-quote-expiry`
3. Teklif durumunu kontrol et

**Beklenen Sonuç:**
- ✅ Teklif durumu "EXPIRED" olarak güncellenir
- ✅ ActivityLog'a kayıt eklenir
- ✅ Kayıt açıklaması: "Teklif süresi doldu: [Teklif Başlığı] - 30 günden uzun süredir SENT durumunda"

**Test Verileri Hazırlama:**
```sql
-- 35 gün önce oluşturulmuş SENT teklif
INSERT INTO "Quote" (title, status, total, "companyId", "createdAt") 
VALUES ('Eski Teklif', 'SENT', 10000, 'your-company-id', NOW() - INTERVAL '35 days');
```

**API Test:**
```bash
POST /api/automations/auto-quote-expiry
```

**Beklenen Response:**
```json
{
  "message": "Expired quotes updated successfully",
  "count": 1,
  "quotes": [
    {
      "id": "quote-id",
      "title": "Eski Teklif"
    }
  ]
}
```

**Veritabanı Kontrolü:**
```sql
SELECT * FROM "Quote" 
WHERE status = 'EXPIRED' 
  AND "companyId" = 'your-company-id';
```

---

## 8️⃣ Deal-to-Quote Time Monitor

### 📝 Açıklama
Fırsat oluşturulduktan sonra 48 saat içinde teklif hazırlanmamışsa uyarı çıkar.

### ✅ Test Senaryosu 1: Teklif Oluşturulmamış Fırsatları Bulma

**Adımlar:**
1. 50 saat önce oluşturulmuş bir fırsat oluştur (teklif yok)
2. API endpoint'ini çağır: `GET /api/automations/deal-to-quote-monitor`
3. Uyarıları kontrol et

**Beklenen Sonuç:**
- ✅ Uyarı listesi döner
- ✅ Her uyarı için: dealId, dealTitle, createdAt, hoursSinceCreation bilgileri bulunur
- ✅ Uyarı sayısı > 0 ise bildirim gösterilir

**Test Verileri Hazırlama:**
```sql
-- 50 saat önce oluşturulmuş fırsat (teklif yok)
INSERT INTO "Deal" (title, stage, value, status, "companyId", "createdAt") 
VALUES ('Eski Fırsat', 'LEAD', 20000, 'OPEN', 'your-company-id', NOW() - INTERVAL '50 hours');
```

**API Test:**
```bash
GET /api/automations/deal-to-quote-monitor
```

**Beklenen Response:**
```json
{
  "message": "Deals without quotes found",
  "warnings": [
    {
      "dealId": "deal-id",
      "dealTitle": "Eski Fırsat",
      "createdAt": "2025-01-01T00:00:00Z",
      "hoursSinceCreation": 50
    }
  ],
  "count": 1
}
```

---

## 9️⃣ Churn Prediction - Kayıp Müşteri Tahmini

### 📝 Açıklama
Basit skorlama: (inaktif_günler * 0.5) + (reddedilen_teklifler * 1.5)
Skor > 10 ise müşteri "Riskli" olarak işaretlenir.

### ✅ Test Senaryosu 1: Riskli Müşterileri Bulma

**Adımlar:**
1. 30 gün önce güncellenmiş bir müşteri oluştur
2. Bu müşteriye 5 reddedilen teklif ekle
3. API endpoint'ini çağır: `GET /api/automations/churn-prediction`
4. Riskli müşterileri kontrol et

**Beklenen Sonuç:**
- ✅ Riskli müşteriler listesi döner
- ✅ Her müşteri için: customerId, customerName, churnScore, inactiveDays, rejectedQuotes, riskLevel bilgileri bulunur
- ✅ Churn skoru > 10 olan müşteriler "HIGH" risk seviyesinde

**Test Verileri Hazırlama:**
```sql
-- 30 gün önce güncellenmiş müşteri
INSERT INTO "Customer" (name, status, "companyId", "updatedAt", "lastInteractionDate") 
VALUES ('Riskli Müşteri', 'ACTIVE', 'your-company-id', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days');

-- 5 reddedilen teklif
INSERT INTO "Quote" (title, status, total, "companyId", "customerId") 
VALUES 
  ('Teklif 1', 'DECLINED', 10000, 'your-company-id', 'customer-id'),
  ('Teklif 2', 'DECLINED', 15000, 'your-company-id', 'customer-id'),
  ('Teklif 3', 'DECLINED', 20000, 'your-company-id', 'customer-id'),
  ('Teklif 4', 'DECLINED', 12000, 'your-company-id', 'customer-id'),
  ('Teklif 5', 'DECLINED', 18000, 'your-company-id', 'customer-id');
```

**API Test:**
```bash
GET /api/automations/churn-prediction
```

**Beklenen Response:**
```json
{
  "message": "Risky customers found",
  "riskyCustomers": [
    {
      "customerId": "customer-id",
      "customerName": "Riskli Müşteri",
      "churnScore": 30.0,
      "inactiveDays": 30,
      "rejectedQuotes": 5,
      "riskLevel": "HIGH"
    }
  ],
  "count": 1
}
```

**Churn Skoru Hesaplama:**
- İnaktif günler: 30
- Reddedilen teklifler: 5
- Churn skoru: (30 * 0.5) + (5 * 1.5) = 15 + 7.5 = 22.5
- Risk seviyesi: HIGH (> 10)

---

## 🔟 Smart Re-Engagement Flow

### 📝 Açıklama
Müşteri 60 gün boyunca etkileşimsizse (hiç görüşme, teklif, fatura yoksa) uyarı ver.

### ✅ Test Senaryosu 1: Etkileşimsiz Müşterileri Bulma

**Adımlar:**
1. 70 gün önce güncellenmiş bir müşteri oluştur
2. Bu müşteriye son 60 günde hiç teklif, fatura, görüşme ekleme
3. API endpoint'ini çağır: `GET /api/automations/smart-re-engagement`
4. Etkileşimsiz müşterileri kontrol et

**Beklenen Sonuç:**
- ✅ Etkileşimsiz müşteriler listesi döner
- ✅ Her müşteri için: customerId, customerName, lastInteraction, daysSinceInteraction bilgileri bulunur
- ✅ hasRecentQuote, hasRecentInvoice, hasRecentMeeting false olmalı

**Test Verileri Hazırlama:**
```sql
-- 70 gün önce güncellenmiş müşteri
INSERT INTO "Customer" (name, status, "companyId", "updatedAt", "lastInteractionDate") 
VALUES ('Etkileşimsiz Müşteri', 'ACTIVE', 'your-company-id', NOW() - INTERVAL '70 days', NOW() - INTERVAL '70 days');
```

**API Test:**
```bash
GET /api/automations/smart-re-engagement
```

**Beklenen Response:**
```json
{
  "message": "1 müşteri 60 günden uzun süredir etkileşimsiz",
  "inactiveCustomers": [
    {
      "customerId": "customer-id",
      "customerName": "Etkileşimsiz Müşteri",
      "lastInteraction": "2024-11-01T00:00:00Z",
      "daysSinceInteraction": 70,
      "hasRecentQuote": false,
      "hasRecentInvoice": false,
      "hasRecentMeeting": false
    }
  ],
  "count": 1
}
```

---

## 1️⃣1️⃣ Auto-Priority Lead Sorting

### 📝 Açıklama
Yeni girilen fırsatlar (deal) sistemce puanlanır:
Formül: (teklif_tutarı × müşteri_skoru × olasılık) / gün_sayısı
En yüksek puanlı fırsatlar "Öncelikli" etiketiyle listenin üstüne taşınır.

### ✅ Test Senaryosu 1: Fırsat Puanlama

**Adımlar:**
1. Yüksek değerli bir fırsat oluştur (örn: 100000₺)
2. Bu fırsat için müşteriye ödenmiş faturalar ekle (müşteri skoru artar)
3. Fırsatın winProbability'sini yüksek yap (örn: 80)
4. API endpoint'ini çağır: `GET /api/automations/priority-lead-sorting`
5. Puanlanmış fırsatları kontrol et

**Beklenen Sonuç:**
- ✅ Puanlanmış fırsatlar listesi döner
- ✅ Her fırsat için: dealId, dealTitle, priorityScore, value, customerScore, winProbability, daysSinceCreation, isPriority bilgileri bulunur
- ✅ PriorityScore > 1000 olan fırsatlar isPriority = true

**Test Verileri Hazırlama:**
```sql
-- Yüksek değerli fırsat
INSERT INTO "Deal" (title, stage, value, status, "companyId", "winProbability", "customerId") 
VALUES ('Yüksek Değerli Fırsat', 'PROPOSAL', 100000, 'OPEN', 'your-company-id', 80, 'customer-id');

-- Müşteriye ödenmiş faturalar (müşteri skoru artar)
INSERT INTO "Invoice" (title, status, total, "companyId", "customerId") 
VALUES 
  ('Fatura 1', 'PAID', 50000, 'your-company-id', 'customer-id'),
  ('Fatura 2', 'PAID', 30000, 'your-company-id', 'customer-id');
```

**API Test:**
```bash
GET /api/automations/priority-lead-sorting
```

**Beklenen Response:**
```json
{
  "message": "Deals prioritized successfully",
  "prioritizedDeals": [
    {
      "dealId": "deal-id",
      "dealTitle": "Yüksek Değerli Fırsat",
      "priorityScore": 3200.0,
      "value": 100000,
      "customerScore": 8.0,
      "winProbability": 80,
      "daysSinceCreation": 1,
      "isPriority": true
    }
  ],
  "count": 1,
  "priorityCount": 1
}
```

**Priority Skoru Hesaplama:**
- Teklif tutarı: 100000₺
- Müşteri skoru: (50000 + 30000) / 10000 = 8.0
- Olasılık: 80%
- Gün sayısı: 1
- Priority skoru: (100000 * 8.0 * 0.8) / 1 = 64000 / 1 = 64000
- isPriority: true (> 1000)

---

## 📊 Genel Test Kontrol Listesi

### ✅ Tüm Otomasyonlar İçin Ortak Kontroller

1. **Migration Kontrolü**
   ```bash
   # Migration dosyasını çalıştır
   supabase db push
   ```

2. **API Endpoint Kontrolü**
   - ✅ Tüm API endpoint'leri çalışıyor mu?
   - ✅ Hata durumlarında uygun mesajlar dönüyor mu?
   - ✅ RLS (Row-Level Security) kontrolü yapılıyor mu?

3. **UI/UX Kontrolü**
   - ✅ Tüm component'ler doğru render ediliyor mu?
   - ✅ Loading state'ler gösteriliyor mu?
   - ✅ Error state'ler gösteriliyor mu?
   - ✅ Responsive tasarım çalışıyor mu?

4. **Performans Kontrolü**
   - ✅ API response süreleri < 1000ms mi?
   - ✅ Component render süreleri < 300ms mi?
   - ✅ Cache stratejisi çalışıyor mu?

5. **Güvenlik Kontrolü**
   - ✅ Session kontrolü yapılıyor mu?
   - ✅ CompanyId filtresi uygulanıyor mu?
   - ✅ Input validation yapılıyor mu?

---

## 🐛 Hata Ayıklama İpuçları

### Sorun: Migration çalışmıyor
**Çözüm:**
1. Migration dosyasını kontrol et: `supabase/migrations/020_automations_complete.sql`
2. Supabase CLI ile migration çalıştır: `supabase db push`
3. Hata mesajlarını kontrol et

### Sorun: API endpoint'leri çalışmıyor
**Çözüm:**
1. Browser console'u kontrol et (F12)
2. Network tab'ında API isteklerini kontrol et
3. Session kontrolü yap
4. CompanyId'nin doğru olduğundan emin ol

### Sorun: Component'ler render edilmiyor
**Çözüm:**
1. Browser console'da hata var mı kontrol et
2. Component import'larını kontrol et
3. Dynamic import'lar doğru mu kontrol et

---

## 📝 Migration Dosyası

Migration dosyası: `supabase/migrations/020_automations_complete.sql`

**Çalıştırma:**
```bash
# Supabase CLI ile
supabase db push

# Veya SQL Editor'de
# Dosya içeriğini kopyala-yapıştır
```

**Migration İçeriği:**
- User tablosuna monthlyGoal, preferredCurrency, lastSearchHistory kolonları
- Quote tablosuna expiryDate, priorityScore kolonları
- Deal tablosuna priorityScore, isPriority, quoteCreatedAt kolonları
- Customer tablosuna churnScore, riskLevel, lastInteractionDate, birthday, satisfactionScore kolonları
- Invoice tablosuna invoiceNumber, autoGeneratedFileName kolonları
- Task tablosuna escalated, escalatedAt kolonları
- Trigger'lar ve Function'lar
- View'lar (RiskyCustomers, PriorityDeals)
- Index'ler (performans için)

---

## 🎯 Sonuç

Bu test senaryoları ile tüm otomasyonların çalıştığından emin olabilirsiniz. Her senaryo adım adım takip edilerek sistemin doğru çalıştığı doğrulanabilir.

**Test Sırası:**
1. Önce migration dosyasını çalıştır
2. Smart Reminder'ı test et
3. QuickActions'ı test et
4. SmartEmptyState'i test et
5. AutoGoalTracker'ı test et
6. Diğer otomasyonları sırayla test et

**Başarı Kriterleri:**
- ✅ Migration başarıyla çalıştı
- ✅ Tüm API endpoint'leri 200 status code dönüyor
- ✅ Tüm UI component'leri doğru render ediliyor
- ✅ Tüm otomasyonlar beklenen şekilde çalışıyor
- ✅ Hata durumlarında uygun mesajlar gösteriliyor

---

## 📞 Destek

Herhangi bir sorun yaşarsanız:
1. Browser console'u kontrol edin (F12)
2. Network tab'ında API isteklerini kontrol edin
3. Veritabanı loglarını kontrol edin
4. Migration dosyasını tekrar çalıştırın


Bu dokümanda **TÜM** otomasyonların test senaryoları ve kullanım kılavuzu bulunmaktadır.

---

## 📋 İçindekiler

### ✅ Tamamlanan Otomasyonlar

1. [Smart Reminder - Günlük Bildirimler](#1-smart-reminder)
2. [QuickActions - Hızlı İşlem Butonları](#2-quickactions)
3. [SmartEmptyState - Boş Ekran Önerileri](#3-smartemptystate)
4. [AutoGoalTracker - Hedef Takibi](#4-autogoaltracker)
5. [AutoTaskFromQuote - Otomatik Görev Atama](#5-autotaskfromquote)
6. [AutoNoteOnEdit - Değişiklik Günlüğü](#6-autonoteonedit)
7. [AutoQuoteExpiry - Otomatik Süre Dolumu](#7-autoquoteexpiry)
8. [Deal-to-Quote Time Monitor](#8-deal-to-quote-time-monitor)
9. [Churn Prediction - Kayıp Müşteri Tahmini](#9-churn-prediction)
10. [Smart Re-Engagement Flow](#10-smart-re-engagement-flow)
11. [Auto-Priority Lead Sorting](#11-auto-priority-lead-sorting)

---

## 1️⃣ Smart Reminder - Günlük Bildirimler

### 📝 Açıklama
Kullanıcı dashboard'a giriş yaptığında otomatik olarak günlük özet gösterilir.

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

**API Test:**
```bash
GET /api/automations/smart-reminder
```

**Beklenen Response:**
```json
{
  "pendingQuotes": 1,
  "inactiveCustomers": 1,
  "inactiveCustomersList": [...],
  "pendingShipments": 1
}
```

---

## 2️⃣ QuickActions - Hızlı İşlem Butonları

### 📝 Açıklama
Duruma göre otomatik olarak hızlı işlem butonları gösterilir.

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

**Component Kullanımı:**
```tsx
<QuickActions 
  entityType="quote" 
  entityId={quote.id} 
  status={quote.status} 
/>
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

**Component Kullanımı:**
```tsx
{quotes.length === 0 && (
  <SmartEmptyState entityType="quotes" />
)}
```

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

**API Test:**
```bash
POST /api/automations/goal-tracker
Content-Type: application/json

{
  "monthlyGoal": 50000
}
```

**Beklenen Response:**
```json
{
  "monthlyGoal": 50000,
  "message": "Hedef güncellendi"
}
```

### ✅ Test Senaryosu 2: İlerleme Takibi

**Adımlar:**
1. Dashboard'da hedef belirle (örn: 50000₺)
2. Bir fatura oluştur ve durumunu "PAID" yap (örn: 20000₺)
3. Dashboard'u yenile

**Beklenen Sonuç:**
- ✅ İlerleme çubuğu %40'a kadar dolar (20000/50000)
- ✅ "İlerleme: 20.000₺" ve "Kalan: 30.000₺" bilgileri görünür
- ✅ İlerleme yüzdesi %40 olarak görünür

**API Test:**
```bash
GET /api/automations/goal-tracker
```

**Beklenen Response:**
```json
{
  "monthlyGoal": 50000,
  "currentProgress": 20000,
  "percentage": 40
}
```

---

## 5️⃣ AutoTaskFromQuote - Otomatik Görev Atama

### 📝 Açıklama
Teklif oluşturulduğunda otomatik olarak görev açılır ve teklif sahibine atanır.

### ✅ Test Senaryosu 1: Teklif Oluşturulduğunda Görev Açılması

**Adımlar:**
1. Yeni bir teklif oluştur
2. Teklif kaydedildikten sonra Görevler sayfasına git (`/tasks`)
3. Yeni oluşturulan görevi kontrol et

**Beklenen Sonuç:**
- ✅ Yeni bir görev oluşturulur
- ✅ Görev başlığı: "Bu teklif için 3 gün içinde müşteriyi ara: [Teklif Başlığı]"
- ✅ Görev teklif sahibine atanır
- ✅ Görev durumu "TODO" olarak görünür
- ✅ Görev dueDate'i 3 gün sonra olarak ayarlanır

**Test Verileri Hazırlama:**
```sql
-- Teklif oluştur (otomatik görev açılacak)
INSERT INTO "Quote" (title, status, total, "companyId", "userId") 
VALUES ('Yeni Teklif', 'DRAFT', 10000, 'your-company-id', 'your-user-id');
```

**API Test:**
```bash
POST /api/quotes
Content-Type: application/json

{
  "title": "Test Teklif",
  "status": "DRAFT",
  "total": 10000,
  "dealId": "deal-id"
}
```

**Beklenen Sonuç:**
- ✅ Teklif oluşturulur
- ✅ Görev otomatik oluşturulur
- ✅ Görev teklif sahibine atanır

---

## 6️⃣ AutoNoteOnEdit - Değişiklik Günlüğü

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
- ✅ Kayıt açıklaması: "Fiyat güncellendi (eski: ₺10.000,00 → yeni: ₺12.000,00)"
- ✅ Kayıt meta bilgilerinde eski ve yeni değerler bulunur

**API Test:**
```bash
PUT /api/quotes/[id]
Content-Type: application/json

{
  "total": 12000
}
```

**Beklenen Response:**
```json
{
  "id": "quote-id",
  "title": "Test Teklif",
  "total": 12000,
  ...
}
```

**ActivityLog Kontrolü:**
```sql
SELECT * FROM "ActivityLog" 
WHERE entity = 'Quote' 
  AND action = 'UPDATE' 
  AND meta->>'oldTotal' IS NOT NULL
ORDER BY "createdAt" DESC
LIMIT 1;
```

---

## 7️⃣ AutoQuoteExpiry - Otomatik Süre Dolumu

### 📝 Açıklama
30 günden uzun süredir "SENT" olan teklifler otomatik EXPIRED yapılır.

### ✅ Test Senaryosu 1: Eski Teklifleri Expired Yapma

**Adımlar:**
1. 35 gün önce oluşturulmuş bir SENT teklif oluştur
2. API endpoint'ini çağır: `POST /api/automations/auto-quote-expiry`
3. Teklif durumunu kontrol et

**Beklenen Sonuç:**
- ✅ Teklif durumu "EXPIRED" olarak güncellenir
- ✅ ActivityLog'a kayıt eklenir
- ✅ Kayıt açıklaması: "Teklif süresi doldu: [Teklif Başlığı] - 30 günden uzun süredir SENT durumunda"

**Test Verileri Hazırlama:**
```sql
-- 35 gün önce oluşturulmuş SENT teklif
INSERT INTO "Quote" (title, status, total, "companyId", "createdAt") 
VALUES ('Eski Teklif', 'SENT', 10000, 'your-company-id', NOW() - INTERVAL '35 days');
```

**API Test:**
```bash
POST /api/automations/auto-quote-expiry
```

**Beklenen Response:**
```json
{
  "message": "Expired quotes updated successfully",
  "count": 1,
  "quotes": [
    {
      "id": "quote-id",
      "title": "Eski Teklif"
    }
  ]
}
```

**Veritabanı Kontrolü:**
```sql
SELECT * FROM "Quote" 
WHERE status = 'EXPIRED' 
  AND "companyId" = 'your-company-id';
```

---

## 8️⃣ Deal-to-Quote Time Monitor

### 📝 Açıklama
Fırsat oluşturulduktan sonra 48 saat içinde teklif hazırlanmamışsa uyarı çıkar.

### ✅ Test Senaryosu 1: Teklif Oluşturulmamış Fırsatları Bulma

**Adımlar:**
1. 50 saat önce oluşturulmuş bir fırsat oluştur (teklif yok)
2. API endpoint'ini çağır: `GET /api/automations/deal-to-quote-monitor`
3. Uyarıları kontrol et

**Beklenen Sonuç:**
- ✅ Uyarı listesi döner
- ✅ Her uyarı için: dealId, dealTitle, createdAt, hoursSinceCreation bilgileri bulunur
- ✅ Uyarı sayısı > 0 ise bildirim gösterilir

**Test Verileri Hazırlama:**
```sql
-- 50 saat önce oluşturulmuş fırsat (teklif yok)
INSERT INTO "Deal" (title, stage, value, status, "companyId", "createdAt") 
VALUES ('Eski Fırsat', 'LEAD', 20000, 'OPEN', 'your-company-id', NOW() - INTERVAL '50 hours');
```

**API Test:**
```bash
GET /api/automations/deal-to-quote-monitor
```

**Beklenen Response:**
```json
{
  "message": "Deals without quotes found",
  "warnings": [
    {
      "dealId": "deal-id",
      "dealTitle": "Eski Fırsat",
      "createdAt": "2025-01-01T00:00:00Z",
      "hoursSinceCreation": 50
    }
  ],
  "count": 1
}
```

---

## 9️⃣ Churn Prediction - Kayıp Müşteri Tahmini

### 📝 Açıklama
Basit skorlama: (inaktif_günler * 0.5) + (reddedilen_teklifler * 1.5)
Skor > 10 ise müşteri "Riskli" olarak işaretlenir.

### ✅ Test Senaryosu 1: Riskli Müşterileri Bulma

**Adımlar:**
1. 30 gün önce güncellenmiş bir müşteri oluştur
2. Bu müşteriye 5 reddedilen teklif ekle
3. API endpoint'ini çağır: `GET /api/automations/churn-prediction`
4. Riskli müşterileri kontrol et

**Beklenen Sonuç:**
- ✅ Riskli müşteriler listesi döner
- ✅ Her müşteri için: customerId, customerName, churnScore, inactiveDays, rejectedQuotes, riskLevel bilgileri bulunur
- ✅ Churn skoru > 10 olan müşteriler "HIGH" risk seviyesinde

**Test Verileri Hazırlama:**
```sql
-- 30 gün önce güncellenmiş müşteri
INSERT INTO "Customer" (name, status, "companyId", "updatedAt", "lastInteractionDate") 
VALUES ('Riskli Müşteri', 'ACTIVE', 'your-company-id', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days');

-- 5 reddedilen teklif
INSERT INTO "Quote" (title, status, total, "companyId", "customerId") 
VALUES 
  ('Teklif 1', 'DECLINED', 10000, 'your-company-id', 'customer-id'),
  ('Teklif 2', 'DECLINED', 15000, 'your-company-id', 'customer-id'),
  ('Teklif 3', 'DECLINED', 20000, 'your-company-id', 'customer-id'),
  ('Teklif 4', 'DECLINED', 12000, 'your-company-id', 'customer-id'),
  ('Teklif 5', 'DECLINED', 18000, 'your-company-id', 'customer-id');
```

**API Test:**
```bash
GET /api/automations/churn-prediction
```

**Beklenen Response:**
```json
{
  "message": "Risky customers found",
  "riskyCustomers": [
    {
      "customerId": "customer-id",
      "customerName": "Riskli Müşteri",
      "churnScore": 30.0,
      "inactiveDays": 30,
      "rejectedQuotes": 5,
      "riskLevel": "HIGH"
    }
  ],
  "count": 1
}
```

**Churn Skoru Hesaplama:**
- İnaktif günler: 30
- Reddedilen teklifler: 5
- Churn skoru: (30 * 0.5) + (5 * 1.5) = 15 + 7.5 = 22.5
- Risk seviyesi: HIGH (> 10)

---

## 🔟 Smart Re-Engagement Flow

### 📝 Açıklama
Müşteri 60 gün boyunca etkileşimsizse (hiç görüşme, teklif, fatura yoksa) uyarı ver.

### ✅ Test Senaryosu 1: Etkileşimsiz Müşterileri Bulma

**Adımlar:**
1. 70 gün önce güncellenmiş bir müşteri oluştur
2. Bu müşteriye son 60 günde hiç teklif, fatura, görüşme ekleme
3. API endpoint'ini çağır: `GET /api/automations/smart-re-engagement`
4. Etkileşimsiz müşterileri kontrol et

**Beklenen Sonuç:**
- ✅ Etkileşimsiz müşteriler listesi döner
- ✅ Her müşteri için: customerId, customerName, lastInteraction, daysSinceInteraction bilgileri bulunur
- ✅ hasRecentQuote, hasRecentInvoice, hasRecentMeeting false olmalı

**Test Verileri Hazırlama:**
```sql
-- 70 gün önce güncellenmiş müşteri
INSERT INTO "Customer" (name, status, "companyId", "updatedAt", "lastInteractionDate") 
VALUES ('Etkileşimsiz Müşteri', 'ACTIVE', 'your-company-id', NOW() - INTERVAL '70 days', NOW() - INTERVAL '70 days');
```

**API Test:**
```bash
GET /api/automations/smart-re-engagement
```

**Beklenen Response:**
```json
{
  "message": "1 müşteri 60 günden uzun süredir etkileşimsiz",
  "inactiveCustomers": [
    {
      "customerId": "customer-id",
      "customerName": "Etkileşimsiz Müşteri",
      "lastInteraction": "2024-11-01T00:00:00Z",
      "daysSinceInteraction": 70,
      "hasRecentQuote": false,
      "hasRecentInvoice": false,
      "hasRecentMeeting": false
    }
  ],
  "count": 1
}
```

---

## 1️⃣1️⃣ Auto-Priority Lead Sorting

### 📝 Açıklama
Yeni girilen fırsatlar (deal) sistemce puanlanır:
Formül: (teklif_tutarı × müşteri_skoru × olasılık) / gün_sayısı
En yüksek puanlı fırsatlar "Öncelikli" etiketiyle listenin üstüne taşınır.

### ✅ Test Senaryosu 1: Fırsat Puanlama

**Adımlar:**
1. Yüksek değerli bir fırsat oluştur (örn: 100000₺)
2. Bu fırsat için müşteriye ödenmiş faturalar ekle (müşteri skoru artar)
3. Fırsatın winProbability'sini yüksek yap (örn: 80)
4. API endpoint'ini çağır: `GET /api/automations/priority-lead-sorting`
5. Puanlanmış fırsatları kontrol et

**Beklenen Sonuç:**
- ✅ Puanlanmış fırsatlar listesi döner
- ✅ Her fırsat için: dealId, dealTitle, priorityScore, value, customerScore, winProbability, daysSinceCreation, isPriority bilgileri bulunur
- ✅ PriorityScore > 1000 olan fırsatlar isPriority = true

**Test Verileri Hazırlama:**
```sql
-- Yüksek değerli fırsat
INSERT INTO "Deal" (title, stage, value, status, "companyId", "winProbability", "customerId") 
VALUES ('Yüksek Değerli Fırsat', 'PROPOSAL', 100000, 'OPEN', 'your-company-id', 80, 'customer-id');

-- Müşteriye ödenmiş faturalar (müşteri skoru artar)
INSERT INTO "Invoice" (title, status, total, "companyId", "customerId") 
VALUES 
  ('Fatura 1', 'PAID', 50000, 'your-company-id', 'customer-id'),
  ('Fatura 2', 'PAID', 30000, 'your-company-id', 'customer-id');
```

**API Test:**
```bash
GET /api/automations/priority-lead-sorting
```

**Beklenen Response:**
```json
{
  "message": "Deals prioritized successfully",
  "prioritizedDeals": [
    {
      "dealId": "deal-id",
      "dealTitle": "Yüksek Değerli Fırsat",
      "priorityScore": 3200.0,
      "value": 100000,
      "customerScore": 8.0,
      "winProbability": 80,
      "daysSinceCreation": 1,
      "isPriority": true
    }
  ],
  "count": 1,
  "priorityCount": 1
}
```

**Priority Skoru Hesaplama:**
- Teklif tutarı: 100000₺
- Müşteri skoru: (50000 + 30000) / 10000 = 8.0
- Olasılık: 80%
- Gün sayısı: 1
- Priority skoru: (100000 * 8.0 * 0.8) / 1 = 64000 / 1 = 64000
- isPriority: true (> 1000)

---

## 📊 Genel Test Kontrol Listesi

### ✅ Tüm Otomasyonlar İçin Ortak Kontroller

1. **Migration Kontrolü**
   ```bash
   # Migration dosyasını çalıştır
   supabase db push
   ```

2. **API Endpoint Kontrolü**
   - ✅ Tüm API endpoint'leri çalışıyor mu?
   - ✅ Hata durumlarında uygun mesajlar dönüyor mu?
   - ✅ RLS (Row-Level Security) kontrolü yapılıyor mu?

3. **UI/UX Kontrolü**
   - ✅ Tüm component'ler doğru render ediliyor mu?
   - ✅ Loading state'ler gösteriliyor mu?
   - ✅ Error state'ler gösteriliyor mu?
   - ✅ Responsive tasarım çalışıyor mu?

4. **Performans Kontrolü**
   - ✅ API response süreleri < 1000ms mi?
   - ✅ Component render süreleri < 300ms mi?
   - ✅ Cache stratejisi çalışıyor mu?

5. **Güvenlik Kontrolü**
   - ✅ Session kontrolü yapılıyor mu?
   - ✅ CompanyId filtresi uygulanıyor mu?
   - ✅ Input validation yapılıyor mu?

---

## 🐛 Hata Ayıklama İpuçları

### Sorun: Migration çalışmıyor
**Çözüm:**
1. Migration dosyasını kontrol et: `supabase/migrations/020_automations_complete.sql`
2. Supabase CLI ile migration çalıştır: `supabase db push`
3. Hata mesajlarını kontrol et

### Sorun: API endpoint'leri çalışmıyor
**Çözüm:**
1. Browser console'u kontrol et (F12)
2. Network tab'ında API isteklerini kontrol et
3. Session kontrolü yap
4. CompanyId'nin doğru olduğundan emin ol

### Sorun: Component'ler render edilmiyor
**Çözüm:**
1. Browser console'da hata var mı kontrol et
2. Component import'larını kontrol et
3. Dynamic import'lar doğru mu kontrol et

---

## 📝 Migration Dosyası

Migration dosyası: `supabase/migrations/020_automations_complete.sql`

**Çalıştırma:**
```bash
# Supabase CLI ile
supabase db push

# Veya SQL Editor'de
# Dosya içeriğini kopyala-yapıştır
```

**Migration İçeriği:**
- User tablosuna monthlyGoal, preferredCurrency, lastSearchHistory kolonları
- Quote tablosuna expiryDate, priorityScore kolonları
- Deal tablosuna priorityScore, isPriority, quoteCreatedAt kolonları
- Customer tablosuna churnScore, riskLevel, lastInteractionDate, birthday, satisfactionScore kolonları
- Invoice tablosuna invoiceNumber, autoGeneratedFileName kolonları
- Task tablosuna escalated, escalatedAt kolonları
- Trigger'lar ve Function'lar
- View'lar (RiskyCustomers, PriorityDeals)
- Index'ler (performans için)

---

## 🎯 Sonuç

Bu test senaryoları ile tüm otomasyonların çalıştığından emin olabilirsiniz. Her senaryo adım adım takip edilerek sistemin doğru çalıştığı doğrulanabilir.

**Test Sırası:**
1. Önce migration dosyasını çalıştır
2. Smart Reminder'ı test et
3. QuickActions'ı test et
4. SmartEmptyState'i test et
5. AutoGoalTracker'ı test et
6. Diğer otomasyonları sırayla test et

**Başarı Kriterleri:**
- ✅ Migration başarıyla çalıştı
- ✅ Tüm API endpoint'leri 200 status code dönüyor
- ✅ Tüm UI component'leri doğru render ediliyor
- ✅ Tüm otomasyonlar beklenen şekilde çalışıyor
- ✅ Hata durumlarında uygun mesajlar gösteriliyor

---

## 📞 Destek

Herhangi bir sorun yaşarsanız:
1. Browser console'u kontrol edin (F12)
2. Network tab'ında API isteklerini kontrol edin
3. Veritabanı loglarını kontrol edin
4. Migration dosyasını tekrar çalıştırın



Bu dokümanda **TÜM** otomasyonların test senaryoları ve kullanım kılavuzu bulunmaktadır.

---

## 📋 İçindekiler

### ✅ Tamamlanan Otomasyonlar

1. [Smart Reminder - Günlük Bildirimler](#1-smart-reminder)
2. [QuickActions - Hızlı İşlem Butonları](#2-quickactions)
3. [SmartEmptyState - Boş Ekran Önerileri](#3-smartemptystate)
4. [AutoGoalTracker - Hedef Takibi](#4-autogoaltracker)
5. [AutoTaskFromQuote - Otomatik Görev Atama](#5-autotaskfromquote)
6. [AutoNoteOnEdit - Değişiklik Günlüğü](#6-autonoteonedit)
7. [AutoQuoteExpiry - Otomatik Süre Dolumu](#7-autoquoteexpiry)
8. [Deal-to-Quote Time Monitor](#8-deal-to-quote-time-monitor)
9. [Churn Prediction - Kayıp Müşteri Tahmini](#9-churn-prediction)
10. [Smart Re-Engagement Flow](#10-smart-re-engagement-flow)
11. [Auto-Priority Lead Sorting](#11-auto-priority-lead-sorting)

---

## 1️⃣ Smart Reminder - Günlük Bildirimler

### 📝 Açıklama
Kullanıcı dashboard'a giriş yaptığında otomatik olarak günlük özet gösterilir.

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

**API Test:**
```bash
GET /api/automations/smart-reminder
```

**Beklenen Response:**
```json
{
  "pendingQuotes": 1,
  "inactiveCustomers": 1,
  "inactiveCustomersList": [...],
  "pendingShipments": 1
}
```

---

## 2️⃣ QuickActions - Hızlı İşlem Butonları

### 📝 Açıklama
Duruma göre otomatik olarak hızlı işlem butonları gösterilir.

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

**Component Kullanımı:**
```tsx
<QuickActions 
  entityType="quote" 
  entityId={quote.id} 
  status={quote.status} 
/>
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

**Component Kullanımı:**
```tsx
{quotes.length === 0 && (
  <SmartEmptyState entityType="quotes" />
)}
```

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

**API Test:**
```bash
POST /api/automations/goal-tracker
Content-Type: application/json

{
  "monthlyGoal": 50000
}
```

**Beklenen Response:**
```json
{
  "monthlyGoal": 50000,
  "message": "Hedef güncellendi"
}
```

### ✅ Test Senaryosu 2: İlerleme Takibi

**Adımlar:**
1. Dashboard'da hedef belirle (örn: 50000₺)
2. Bir fatura oluştur ve durumunu "PAID" yap (örn: 20000₺)
3. Dashboard'u yenile

**Beklenen Sonuç:**
- ✅ İlerleme çubuğu %40'a kadar dolar (20000/50000)
- ✅ "İlerleme: 20.000₺" ve "Kalan: 30.000₺" bilgileri görünür
- ✅ İlerleme yüzdesi %40 olarak görünür

**API Test:**
```bash
GET /api/automations/goal-tracker
```

**Beklenen Response:**
```json
{
  "monthlyGoal": 50000,
  "currentProgress": 20000,
  "percentage": 40
}
```

---

## 5️⃣ AutoTaskFromQuote - Otomatik Görev Atama

### 📝 Açıklama
Teklif oluşturulduğunda otomatik olarak görev açılır ve teklif sahibine atanır.

### ✅ Test Senaryosu 1: Teklif Oluşturulduğunda Görev Açılması

**Adımlar:**
1. Yeni bir teklif oluştur
2. Teklif kaydedildikten sonra Görevler sayfasına git (`/tasks`)
3. Yeni oluşturulan görevi kontrol et

**Beklenen Sonuç:**
- ✅ Yeni bir görev oluşturulur
- ✅ Görev başlığı: "Bu teklif için 3 gün içinde müşteriyi ara: [Teklif Başlığı]"
- ✅ Görev teklif sahibine atanır
- ✅ Görev durumu "TODO" olarak görünür
- ✅ Görev dueDate'i 3 gün sonra olarak ayarlanır

**Test Verileri Hazırlama:**
```sql
-- Teklif oluştur (otomatik görev açılacak)
INSERT INTO "Quote" (title, status, total, "companyId", "userId") 
VALUES ('Yeni Teklif', 'DRAFT', 10000, 'your-company-id', 'your-user-id');
```

**API Test:**
```bash
POST /api/quotes
Content-Type: application/json

{
  "title": "Test Teklif",
  "status": "DRAFT",
  "total": 10000,
  "dealId": "deal-id"
}
```

**Beklenen Sonuç:**
- ✅ Teklif oluşturulur
- ✅ Görev otomatik oluşturulur
- ✅ Görev teklif sahibine atanır

---

## 6️⃣ AutoNoteOnEdit - Değişiklik Günlüğü

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
- ✅ Kayıt açıklaması: "Fiyat güncellendi (eski: ₺10.000,00 → yeni: ₺12.000,00)"
- ✅ Kayıt meta bilgilerinde eski ve yeni değerler bulunur

**API Test:**
```bash
PUT /api/quotes/[id]
Content-Type: application/json

{
  "total": 12000
}
```

**Beklenen Response:**
```json
{
  "id": "quote-id",
  "title": "Test Teklif",
  "total": 12000,
  ...
}
```

**ActivityLog Kontrolü:**
```sql
SELECT * FROM "ActivityLog" 
WHERE entity = 'Quote' 
  AND action = 'UPDATE' 
  AND meta->>'oldTotal' IS NOT NULL
ORDER BY "createdAt" DESC
LIMIT 1;
```

---

## 7️⃣ AutoQuoteExpiry - Otomatik Süre Dolumu

### 📝 Açıklama
30 günden uzun süredir "SENT" olan teklifler otomatik EXPIRED yapılır.

### ✅ Test Senaryosu 1: Eski Teklifleri Expired Yapma

**Adımlar:**
1. 35 gün önce oluşturulmuş bir SENT teklif oluştur
2. API endpoint'ini çağır: `POST /api/automations/auto-quote-expiry`
3. Teklif durumunu kontrol et

**Beklenen Sonuç:**
- ✅ Teklif durumu "EXPIRED" olarak güncellenir
- ✅ ActivityLog'a kayıt eklenir
- ✅ Kayıt açıklaması: "Teklif süresi doldu: [Teklif Başlığı] - 30 günden uzun süredir SENT durumunda"

**Test Verileri Hazırlama:**
```sql
-- 35 gün önce oluşturulmuş SENT teklif
INSERT INTO "Quote" (title, status, total, "companyId", "createdAt") 
VALUES ('Eski Teklif', 'SENT', 10000, 'your-company-id', NOW() - INTERVAL '35 days');
```

**API Test:**
```bash
POST /api/automations/auto-quote-expiry
```

**Beklenen Response:**
```json
{
  "message": "Expired quotes updated successfully",
  "count": 1,
  "quotes": [
    {
      "id": "quote-id",
      "title": "Eski Teklif"
    }
  ]
}
```

**Veritabanı Kontrolü:**
```sql
SELECT * FROM "Quote" 
WHERE status = 'EXPIRED' 
  AND "companyId" = 'your-company-id';
```

---

## 8️⃣ Deal-to-Quote Time Monitor

### 📝 Açıklama
Fırsat oluşturulduktan sonra 48 saat içinde teklif hazırlanmamışsa uyarı çıkar.

### ✅ Test Senaryosu 1: Teklif Oluşturulmamış Fırsatları Bulma

**Adımlar:**
1. 50 saat önce oluşturulmuş bir fırsat oluştur (teklif yok)
2. API endpoint'ini çağır: `GET /api/automations/deal-to-quote-monitor`
3. Uyarıları kontrol et

**Beklenen Sonuç:**
- ✅ Uyarı listesi döner
- ✅ Her uyarı için: dealId, dealTitle, createdAt, hoursSinceCreation bilgileri bulunur
- ✅ Uyarı sayısı > 0 ise bildirim gösterilir

**Test Verileri Hazırlama:**
```sql
-- 50 saat önce oluşturulmuş fırsat (teklif yok)
INSERT INTO "Deal" (title, stage, value, status, "companyId", "createdAt") 
VALUES ('Eski Fırsat', 'LEAD', 20000, 'OPEN', 'your-company-id', NOW() - INTERVAL '50 hours');
```

**API Test:**
```bash
GET /api/automations/deal-to-quote-monitor
```

**Beklenen Response:**
```json
{
  "message": "Deals without quotes found",
  "warnings": [
    {
      "dealId": "deal-id",
      "dealTitle": "Eski Fırsat",
      "createdAt": "2025-01-01T00:00:00Z",
      "hoursSinceCreation": 50
    }
  ],
  "count": 1
}
```

---

## 9️⃣ Churn Prediction - Kayıp Müşteri Tahmini

### 📝 Açıklama
Basit skorlama: (inaktif_günler * 0.5) + (reddedilen_teklifler * 1.5)
Skor > 10 ise müşteri "Riskli" olarak işaretlenir.

### ✅ Test Senaryosu 1: Riskli Müşterileri Bulma

**Adımlar:**
1. 30 gün önce güncellenmiş bir müşteri oluştur
2. Bu müşteriye 5 reddedilen teklif ekle
3. API endpoint'ini çağır: `GET /api/automations/churn-prediction`
4. Riskli müşterileri kontrol et

**Beklenen Sonuç:**
- ✅ Riskli müşteriler listesi döner
- ✅ Her müşteri için: customerId, customerName, churnScore, inactiveDays, rejectedQuotes, riskLevel bilgileri bulunur
- ✅ Churn skoru > 10 olan müşteriler "HIGH" risk seviyesinde

**Test Verileri Hazırlama:**
```sql
-- 30 gün önce güncellenmiş müşteri
INSERT INTO "Customer" (name, status, "companyId", "updatedAt", "lastInteractionDate") 
VALUES ('Riskli Müşteri', 'ACTIVE', 'your-company-id', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days');

-- 5 reddedilen teklif
INSERT INTO "Quote" (title, status, total, "companyId", "customerId") 
VALUES 
  ('Teklif 1', 'DECLINED', 10000, 'your-company-id', 'customer-id'),
  ('Teklif 2', 'DECLINED', 15000, 'your-company-id', 'customer-id'),
  ('Teklif 3', 'DECLINED', 20000, 'your-company-id', 'customer-id'),
  ('Teklif 4', 'DECLINED', 12000, 'your-company-id', 'customer-id'),
  ('Teklif 5', 'DECLINED', 18000, 'your-company-id', 'customer-id');
```

**API Test:**
```bash
GET /api/automations/churn-prediction
```

**Beklenen Response:**
```json
{
  "message": "Risky customers found",
  "riskyCustomers": [
    {
      "customerId": "customer-id",
      "customerName": "Riskli Müşteri",
      "churnScore": 30.0,
      "inactiveDays": 30,
      "rejectedQuotes": 5,
      "riskLevel": "HIGH"
    }
  ],
  "count": 1
}
```

**Churn Skoru Hesaplama:**
- İnaktif günler: 30
- Reddedilen teklifler: 5
- Churn skoru: (30 * 0.5) + (5 * 1.5) = 15 + 7.5 = 22.5
- Risk seviyesi: HIGH (> 10)

---

## 🔟 Smart Re-Engagement Flow

### 📝 Açıklama
Müşteri 60 gün boyunca etkileşimsizse (hiç görüşme, teklif, fatura yoksa) uyarı ver.

### ✅ Test Senaryosu 1: Etkileşimsiz Müşterileri Bulma

**Adımlar:**
1. 70 gün önce güncellenmiş bir müşteri oluştur
2. Bu müşteriye son 60 günde hiç teklif, fatura, görüşme ekleme
3. API endpoint'ini çağır: `GET /api/automations/smart-re-engagement`
4. Etkileşimsiz müşterileri kontrol et

**Beklenen Sonuç:**
- ✅ Etkileşimsiz müşteriler listesi döner
- ✅ Her müşteri için: customerId, customerName, lastInteraction, daysSinceInteraction bilgileri bulunur
- ✅ hasRecentQuote, hasRecentInvoice, hasRecentMeeting false olmalı

**Test Verileri Hazırlama:**
```sql
-- 70 gün önce güncellenmiş müşteri
INSERT INTO "Customer" (name, status, "companyId", "updatedAt", "lastInteractionDate") 
VALUES ('Etkileşimsiz Müşteri', 'ACTIVE', 'your-company-id', NOW() - INTERVAL '70 days', NOW() - INTERVAL '70 days');
```

**API Test:**
```bash
GET /api/automations/smart-re-engagement
```

**Beklenen Response:**
```json
{
  "message": "1 müşteri 60 günden uzun süredir etkileşimsiz",
  "inactiveCustomers": [
    {
      "customerId": "customer-id",
      "customerName": "Etkileşimsiz Müşteri",
      "lastInteraction": "2024-11-01T00:00:00Z",
      "daysSinceInteraction": 70,
      "hasRecentQuote": false,
      "hasRecentInvoice": false,
      "hasRecentMeeting": false
    }
  ],
  "count": 1
}
```

---

## 1️⃣1️⃣ Auto-Priority Lead Sorting

### 📝 Açıklama
Yeni girilen fırsatlar (deal) sistemce puanlanır:
Formül: (teklif_tutarı × müşteri_skoru × olasılık) / gün_sayısı
En yüksek puanlı fırsatlar "Öncelikli" etiketiyle listenin üstüne taşınır.

### ✅ Test Senaryosu 1: Fırsat Puanlama

**Adımlar:**
1. Yüksek değerli bir fırsat oluştur (örn: 100000₺)
2. Bu fırsat için müşteriye ödenmiş faturalar ekle (müşteri skoru artar)
3. Fırsatın winProbability'sini yüksek yap (örn: 80)
4. API endpoint'ini çağır: `GET /api/automations/priority-lead-sorting`
5. Puanlanmış fırsatları kontrol et

**Beklenen Sonuç:**
- ✅ Puanlanmış fırsatlar listesi döner
- ✅ Her fırsat için: dealId, dealTitle, priorityScore, value, customerScore, winProbability, daysSinceCreation, isPriority bilgileri bulunur
- ✅ PriorityScore > 1000 olan fırsatlar isPriority = true

**Test Verileri Hazırlama:**
```sql
-- Yüksek değerli fırsat
INSERT INTO "Deal" (title, stage, value, status, "companyId", "winProbability", "customerId") 
VALUES ('Yüksek Değerli Fırsat', 'PROPOSAL', 100000, 'OPEN', 'your-company-id', 80, 'customer-id');

-- Müşteriye ödenmiş faturalar (müşteri skoru artar)
INSERT INTO "Invoice" (title, status, total, "companyId", "customerId") 
VALUES 
  ('Fatura 1', 'PAID', 50000, 'your-company-id', 'customer-id'),
  ('Fatura 2', 'PAID', 30000, 'your-company-id', 'customer-id');
```

**API Test:**
```bash
GET /api/automations/priority-lead-sorting
```

**Beklenen Response:**
```json
{
  "message": "Deals prioritized successfully",
  "prioritizedDeals": [
    {
      "dealId": "deal-id",
      "dealTitle": "Yüksek Değerli Fırsat",
      "priorityScore": 3200.0,
      "value": 100000,
      "customerScore": 8.0,
      "winProbability": 80,
      "daysSinceCreation": 1,
      "isPriority": true
    }
  ],
  "count": 1,
  "priorityCount": 1
}
```

**Priority Skoru Hesaplama:**
- Teklif tutarı: 100000₺
- Müşteri skoru: (50000 + 30000) / 10000 = 8.0
- Olasılık: 80%
- Gün sayısı: 1
- Priority skoru: (100000 * 8.0 * 0.8) / 1 = 64000 / 1 = 64000
- isPriority: true (> 1000)

---

## 📊 Genel Test Kontrol Listesi

### ✅ Tüm Otomasyonlar İçin Ortak Kontroller

1. **Migration Kontrolü**
   ```bash
   # Migration dosyasını çalıştır
   supabase db push
   ```

2. **API Endpoint Kontrolü**
   - ✅ Tüm API endpoint'leri çalışıyor mu?
   - ✅ Hata durumlarında uygun mesajlar dönüyor mu?
   - ✅ RLS (Row-Level Security) kontrolü yapılıyor mu?

3. **UI/UX Kontrolü**
   - ✅ Tüm component'ler doğru render ediliyor mu?
   - ✅ Loading state'ler gösteriliyor mu?
   - ✅ Error state'ler gösteriliyor mu?
   - ✅ Responsive tasarım çalışıyor mu?

4. **Performans Kontrolü**
   - ✅ API response süreleri < 1000ms mi?
   - ✅ Component render süreleri < 300ms mi?
   - ✅ Cache stratejisi çalışıyor mu?

5. **Güvenlik Kontrolü**
   - ✅ Session kontrolü yapılıyor mu?
   - ✅ CompanyId filtresi uygulanıyor mu?
   - ✅ Input validation yapılıyor mu?

---

## 🐛 Hata Ayıklama İpuçları

### Sorun: Migration çalışmıyor
**Çözüm:**
1. Migration dosyasını kontrol et: `supabase/migrations/020_automations_complete.sql`
2. Supabase CLI ile migration çalıştır: `supabase db push`
3. Hata mesajlarını kontrol et

### Sorun: API endpoint'leri çalışmıyor
**Çözüm:**
1. Browser console'u kontrol et (F12)
2. Network tab'ında API isteklerini kontrol et
3. Session kontrolü yap
4. CompanyId'nin doğru olduğundan emin ol

### Sorun: Component'ler render edilmiyor
**Çözüm:**
1. Browser console'da hata var mı kontrol et
2. Component import'larını kontrol et
3. Dynamic import'lar doğru mu kontrol et

---

## 📝 Migration Dosyası

Migration dosyası: `supabase/migrations/020_automations_complete.sql`

**Çalıştırma:**
```bash
# Supabase CLI ile
supabase db push

# Veya SQL Editor'de
# Dosya içeriğini kopyala-yapıştır
```

**Migration İçeriği:**
- User tablosuna monthlyGoal, preferredCurrency, lastSearchHistory kolonları
- Quote tablosuna expiryDate, priorityScore kolonları
- Deal tablosuna priorityScore, isPriority, quoteCreatedAt kolonları
- Customer tablosuna churnScore, riskLevel, lastInteractionDate, birthday, satisfactionScore kolonları
- Invoice tablosuna invoiceNumber, autoGeneratedFileName kolonları
- Task tablosuna escalated, escalatedAt kolonları
- Trigger'lar ve Function'lar
- View'lar (RiskyCustomers, PriorityDeals)
- Index'ler (performans için)

---

## 🎯 Sonuç

Bu test senaryoları ile tüm otomasyonların çalıştığından emin olabilirsiniz. Her senaryo adım adım takip edilerek sistemin doğru çalıştığı doğrulanabilir.

**Test Sırası:**
1. Önce migration dosyasını çalıştır
2. Smart Reminder'ı test et
3. QuickActions'ı test et
4. SmartEmptyState'i test et
5. AutoGoalTracker'ı test et
6. Diğer otomasyonları sırayla test et

**Başarı Kriterleri:**
- ✅ Migration başarıyla çalıştı
- ✅ Tüm API endpoint'leri 200 status code dönüyor
- ✅ Tüm UI component'leri doğru render ediliyor
- ✅ Tüm otomasyonlar beklenen şekilde çalışıyor
- ✅ Hata durumlarında uygun mesajlar gösteriliyor

---

## 📞 Destek

Herhangi bir sorun yaşarsanız:
1. Browser console'u kontrol edin (F12)
2. Network tab'ında API isteklerini kontrol edin
3. Veritabanı loglarını kontrol edin
4. Migration dosyasını tekrar çalıştırın


Bu dokümanda **TÜM** otomasyonların test senaryoları ve kullanım kılavuzu bulunmaktadır.

---

## 📋 İçindekiler

### ✅ Tamamlanan Otomasyonlar

1. [Smart Reminder - Günlük Bildirimler](#1-smart-reminder)
2. [QuickActions - Hızlı İşlem Butonları](#2-quickactions)
3. [SmartEmptyState - Boş Ekran Önerileri](#3-smartemptystate)
4. [AutoGoalTracker - Hedef Takibi](#4-autogoaltracker)
5. [AutoTaskFromQuote - Otomatik Görev Atama](#5-autotaskfromquote)
6. [AutoNoteOnEdit - Değişiklik Günlüğü](#6-autonoteonedit)
7. [AutoQuoteExpiry - Otomatik Süre Dolumu](#7-autoquoteexpiry)
8. [Deal-to-Quote Time Monitor](#8-deal-to-quote-time-monitor)
9. [Churn Prediction - Kayıp Müşteri Tahmini](#9-churn-prediction)
10. [Smart Re-Engagement Flow](#10-smart-re-engagement-flow)
11. [Auto-Priority Lead Sorting](#11-auto-priority-lead-sorting)

---

## 1️⃣ Smart Reminder - Günlük Bildirimler

### 📝 Açıklama
Kullanıcı dashboard'a giriş yaptığında otomatik olarak günlük özet gösterilir.

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

**API Test:**
```bash
GET /api/automations/smart-reminder
```

**Beklenen Response:**
```json
{
  "pendingQuotes": 1,
  "inactiveCustomers": 1,
  "inactiveCustomersList": [...],
  "pendingShipments": 1
}
```

---

## 2️⃣ QuickActions - Hızlı İşlem Butonları

### 📝 Açıklama
Duruma göre otomatik olarak hızlı işlem butonları gösterilir.

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

**Component Kullanımı:**
```tsx
<QuickActions 
  entityType="quote" 
  entityId={quote.id} 
  status={quote.status} 
/>
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

**Component Kullanımı:**
```tsx
{quotes.length === 0 && (
  <SmartEmptyState entityType="quotes" />
)}
```

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

**API Test:**
```bash
POST /api/automations/goal-tracker
Content-Type: application/json

{
  "monthlyGoal": 50000
}
```

**Beklenen Response:**
```json
{
  "monthlyGoal": 50000,
  "message": "Hedef güncellendi"
}
```

### ✅ Test Senaryosu 2: İlerleme Takibi

**Adımlar:**
1. Dashboard'da hedef belirle (örn: 50000₺)
2. Bir fatura oluştur ve durumunu "PAID" yap (örn: 20000₺)
3. Dashboard'u yenile

**Beklenen Sonuç:**
- ✅ İlerleme çubuğu %40'a kadar dolar (20000/50000)
- ✅ "İlerleme: 20.000₺" ve "Kalan: 30.000₺" bilgileri görünür
- ✅ İlerleme yüzdesi %40 olarak görünür

**API Test:**
```bash
GET /api/automations/goal-tracker
```

**Beklenen Response:**
```json
{
  "monthlyGoal": 50000,
  "currentProgress": 20000,
  "percentage": 40
}
```

---

## 5️⃣ AutoTaskFromQuote - Otomatik Görev Atama

### 📝 Açıklama
Teklif oluşturulduğunda otomatik olarak görev açılır ve teklif sahibine atanır.

### ✅ Test Senaryosu 1: Teklif Oluşturulduğunda Görev Açılması

**Adımlar:**
1. Yeni bir teklif oluştur
2. Teklif kaydedildikten sonra Görevler sayfasına git (`/tasks`)
3. Yeni oluşturulan görevi kontrol et

**Beklenen Sonuç:**
- ✅ Yeni bir görev oluşturulur
- ✅ Görev başlığı: "Bu teklif için 3 gün içinde müşteriyi ara: [Teklif Başlığı]"
- ✅ Görev teklif sahibine atanır
- ✅ Görev durumu "TODO" olarak görünür
- ✅ Görev dueDate'i 3 gün sonra olarak ayarlanır

**Test Verileri Hazırlama:**
```sql
-- Teklif oluştur (otomatik görev açılacak)
INSERT INTO "Quote" (title, status, total, "companyId", "userId") 
VALUES ('Yeni Teklif', 'DRAFT', 10000, 'your-company-id', 'your-user-id');
```

**API Test:**
```bash
POST /api/quotes
Content-Type: application/json

{
  "title": "Test Teklif",
  "status": "DRAFT",
  "total": 10000,
  "dealId": "deal-id"
}
```

**Beklenen Sonuç:**
- ✅ Teklif oluşturulur
- ✅ Görev otomatik oluşturulur
- ✅ Görev teklif sahibine atanır

---

## 6️⃣ AutoNoteOnEdit - Değişiklik Günlüğü

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
- ✅ Kayıt açıklaması: "Fiyat güncellendi (eski: ₺10.000,00 → yeni: ₺12.000,00)"
- ✅ Kayıt meta bilgilerinde eski ve yeni değerler bulunur

**API Test:**
```bash
PUT /api/quotes/[id]
Content-Type: application/json

{
  "total": 12000
}
```

**Beklenen Response:**
```json
{
  "id": "quote-id",
  "title": "Test Teklif",
  "total": 12000,
  ...
}
```

**ActivityLog Kontrolü:**
```sql
SELECT * FROM "ActivityLog" 
WHERE entity = 'Quote' 
  AND action = 'UPDATE' 
  AND meta->>'oldTotal' IS NOT NULL
ORDER BY "createdAt" DESC
LIMIT 1;
```

---

## 7️⃣ AutoQuoteExpiry - Otomatik Süre Dolumu

### 📝 Açıklama
30 günden uzun süredir "SENT" olan teklifler otomatik EXPIRED yapılır.

### ✅ Test Senaryosu 1: Eski Teklifleri Expired Yapma

**Adımlar:**
1. 35 gün önce oluşturulmuş bir SENT teklif oluştur
2. API endpoint'ini çağır: `POST /api/automations/auto-quote-expiry`
3. Teklif durumunu kontrol et

**Beklenen Sonuç:**
- ✅ Teklif durumu "EXPIRED" olarak güncellenir
- ✅ ActivityLog'a kayıt eklenir
- ✅ Kayıt açıklaması: "Teklif süresi doldu: [Teklif Başlığı] - 30 günden uzun süredir SENT durumunda"

**Test Verileri Hazırlama:**
```sql
-- 35 gün önce oluşturulmuş SENT teklif
INSERT INTO "Quote" (title, status, total, "companyId", "createdAt") 
VALUES ('Eski Teklif', 'SENT', 10000, 'your-company-id', NOW() - INTERVAL '35 days');
```

**API Test:**
```bash
POST /api/automations/auto-quote-expiry
```

**Beklenen Response:**
```json
{
  "message": "Expired quotes updated successfully",
  "count": 1,
  "quotes": [
    {
      "id": "quote-id",
      "title": "Eski Teklif"
    }
  ]
}
```

**Veritabanı Kontrolü:**
```sql
SELECT * FROM "Quote" 
WHERE status = 'EXPIRED' 
  AND "companyId" = 'your-company-id';
```

---

## 8️⃣ Deal-to-Quote Time Monitor

### 📝 Açıklama
Fırsat oluşturulduktan sonra 48 saat içinde teklif hazırlanmamışsa uyarı çıkar.

### ✅ Test Senaryosu 1: Teklif Oluşturulmamış Fırsatları Bulma

**Adımlar:**
1. 50 saat önce oluşturulmuş bir fırsat oluştur (teklif yok)
2. API endpoint'ini çağır: `GET /api/automations/deal-to-quote-monitor`
3. Uyarıları kontrol et

**Beklenen Sonuç:**
- ✅ Uyarı listesi döner
- ✅ Her uyarı için: dealId, dealTitle, createdAt, hoursSinceCreation bilgileri bulunur
- ✅ Uyarı sayısı > 0 ise bildirim gösterilir

**Test Verileri Hazırlama:**
```sql
-- 50 saat önce oluşturulmuş fırsat (teklif yok)
INSERT INTO "Deal" (title, stage, value, status, "companyId", "createdAt") 
VALUES ('Eski Fırsat', 'LEAD', 20000, 'OPEN', 'your-company-id', NOW() - INTERVAL '50 hours');
```

**API Test:**
```bash
GET /api/automations/deal-to-quote-monitor
```

**Beklenen Response:**
```json
{
  "message": "Deals without quotes found",
  "warnings": [
    {
      "dealId": "deal-id",
      "dealTitle": "Eski Fırsat",
      "createdAt": "2025-01-01T00:00:00Z",
      "hoursSinceCreation": 50
    }
  ],
  "count": 1
}
```

---

## 9️⃣ Churn Prediction - Kayıp Müşteri Tahmini

### 📝 Açıklama
Basit skorlama: (inaktif_günler * 0.5) + (reddedilen_teklifler * 1.5)
Skor > 10 ise müşteri "Riskli" olarak işaretlenir.

### ✅ Test Senaryosu 1: Riskli Müşterileri Bulma

**Adımlar:**
1. 30 gün önce güncellenmiş bir müşteri oluştur
2. Bu müşteriye 5 reddedilen teklif ekle
3. API endpoint'ini çağır: `GET /api/automations/churn-prediction`
4. Riskli müşterileri kontrol et

**Beklenen Sonuç:**
- ✅ Riskli müşteriler listesi döner
- ✅ Her müşteri için: customerId, customerName, churnScore, inactiveDays, rejectedQuotes, riskLevel bilgileri bulunur
- ✅ Churn skoru > 10 olan müşteriler "HIGH" risk seviyesinde

**Test Verileri Hazırlama:**
```sql
-- 30 gün önce güncellenmiş müşteri
INSERT INTO "Customer" (name, status, "companyId", "updatedAt", "lastInteractionDate") 
VALUES ('Riskli Müşteri', 'ACTIVE', 'your-company-id', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days');

-- 5 reddedilen teklif
INSERT INTO "Quote" (title, status, total, "companyId", "customerId") 
VALUES 
  ('Teklif 1', 'DECLINED', 10000, 'your-company-id', 'customer-id'),
  ('Teklif 2', 'DECLINED', 15000, 'your-company-id', 'customer-id'),
  ('Teklif 3', 'DECLINED', 20000, 'your-company-id', 'customer-id'),
  ('Teklif 4', 'DECLINED', 12000, 'your-company-id', 'customer-id'),
  ('Teklif 5', 'DECLINED', 18000, 'your-company-id', 'customer-id');
```

**API Test:**
```bash
GET /api/automations/churn-prediction
```

**Beklenen Response:**
```json
{
  "message": "Risky customers found",
  "riskyCustomers": [
    {
      "customerId": "customer-id",
      "customerName": "Riskli Müşteri",
      "churnScore": 30.0,
      "inactiveDays": 30,
      "rejectedQuotes": 5,
      "riskLevel": "HIGH"
    }
  ],
  "count": 1
}
```

**Churn Skoru Hesaplama:**
- İnaktif günler: 30
- Reddedilen teklifler: 5
- Churn skoru: (30 * 0.5) + (5 * 1.5) = 15 + 7.5 = 22.5
- Risk seviyesi: HIGH (> 10)

---

## 🔟 Smart Re-Engagement Flow

### 📝 Açıklama
Müşteri 60 gün boyunca etkileşimsizse (hiç görüşme, teklif, fatura yoksa) uyarı ver.

### ✅ Test Senaryosu 1: Etkileşimsiz Müşterileri Bulma

**Adımlar:**
1. 70 gün önce güncellenmiş bir müşteri oluştur
2. Bu müşteriye son 60 günde hiç teklif, fatura, görüşme ekleme
3. API endpoint'ini çağır: `GET /api/automations/smart-re-engagement`
4. Etkileşimsiz müşterileri kontrol et

**Beklenen Sonuç:**
- ✅ Etkileşimsiz müşteriler listesi döner
- ✅ Her müşteri için: customerId, customerName, lastInteraction, daysSinceInteraction bilgileri bulunur
- ✅ hasRecentQuote, hasRecentInvoice, hasRecentMeeting false olmalı

**Test Verileri Hazırlama:**
```sql
-- 70 gün önce güncellenmiş müşteri
INSERT INTO "Customer" (name, status, "companyId", "updatedAt", "lastInteractionDate") 
VALUES ('Etkileşimsiz Müşteri', 'ACTIVE', 'your-company-id', NOW() - INTERVAL '70 days', NOW() - INTERVAL '70 days');
```

**API Test:**
```bash
GET /api/automations/smart-re-engagement
```

**Beklenen Response:**
```json
{
  "message": "1 müşteri 60 günden uzun süredir etkileşimsiz",
  "inactiveCustomers": [
    {
      "customerId": "customer-id",
      "customerName": "Etkileşimsiz Müşteri",
      "lastInteraction": "2024-11-01T00:00:00Z",
      "daysSinceInteraction": 70,
      "hasRecentQuote": false,
      "hasRecentInvoice": false,
      "hasRecentMeeting": false
    }
  ],
  "count": 1
}
```

---

## 1️⃣1️⃣ Auto-Priority Lead Sorting

### 📝 Açıklama
Yeni girilen fırsatlar (deal) sistemce puanlanır:
Formül: (teklif_tutarı × müşteri_skoru × olasılık) / gün_sayısı
En yüksek puanlı fırsatlar "Öncelikli" etiketiyle listenin üstüne taşınır.

### ✅ Test Senaryosu 1: Fırsat Puanlama

**Adımlar:**
1. Yüksek değerli bir fırsat oluştur (örn: 100000₺)
2. Bu fırsat için müşteriye ödenmiş faturalar ekle (müşteri skoru artar)
3. Fırsatın winProbability'sini yüksek yap (örn: 80)
4. API endpoint'ini çağır: `GET /api/automations/priority-lead-sorting`
5. Puanlanmış fırsatları kontrol et

**Beklenen Sonuç:**
- ✅ Puanlanmış fırsatlar listesi döner
- ✅ Her fırsat için: dealId, dealTitle, priorityScore, value, customerScore, winProbability, daysSinceCreation, isPriority bilgileri bulunur
- ✅ PriorityScore > 1000 olan fırsatlar isPriority = true

**Test Verileri Hazırlama:**
```sql
-- Yüksek değerli fırsat
INSERT INTO "Deal" (title, stage, value, status, "companyId", "winProbability", "customerId") 
VALUES ('Yüksek Değerli Fırsat', 'PROPOSAL', 100000, 'OPEN', 'your-company-id', 80, 'customer-id');

-- Müşteriye ödenmiş faturalar (müşteri skoru artar)
INSERT INTO "Invoice" (title, status, total, "companyId", "customerId") 
VALUES 
  ('Fatura 1', 'PAID', 50000, 'your-company-id', 'customer-id'),
  ('Fatura 2', 'PAID', 30000, 'your-company-id', 'customer-id');
```

**API Test:**
```bash
GET /api/automations/priority-lead-sorting
```

**Beklenen Response:**
```json
{
  "message": "Deals prioritized successfully",
  "prioritizedDeals": [
    {
      "dealId": "deal-id",
      "dealTitle": "Yüksek Değerli Fırsat",
      "priorityScore": 3200.0,
      "value": 100000,
      "customerScore": 8.0,
      "winProbability": 80,
      "daysSinceCreation": 1,
      "isPriority": true
    }
  ],
  "count": 1,
  "priorityCount": 1
}
```

**Priority Skoru Hesaplama:**
- Teklif tutarı: 100000₺
- Müşteri skoru: (50000 + 30000) / 10000 = 8.0
- Olasılık: 80%
- Gün sayısı: 1
- Priority skoru: (100000 * 8.0 * 0.8) / 1 = 64000 / 1 = 64000
- isPriority: true (> 1000)

---

## 📊 Genel Test Kontrol Listesi

### ✅ Tüm Otomasyonlar İçin Ortak Kontroller

1. **Migration Kontrolü**
   ```bash
   # Migration dosyasını çalıştır
   supabase db push
   ```

2. **API Endpoint Kontrolü**
   - ✅ Tüm API endpoint'leri çalışıyor mu?
   - ✅ Hata durumlarında uygun mesajlar dönüyor mu?
   - ✅ RLS (Row-Level Security) kontrolü yapılıyor mu?

3. **UI/UX Kontrolü**
   - ✅ Tüm component'ler doğru render ediliyor mu?
   - ✅ Loading state'ler gösteriliyor mu?
   - ✅ Error state'ler gösteriliyor mu?
   - ✅ Responsive tasarım çalışıyor mu?

4. **Performans Kontrolü**
   - ✅ API response süreleri < 1000ms mi?
   - ✅ Component render süreleri < 300ms mi?
   - ✅ Cache stratejisi çalışıyor mu?

5. **Güvenlik Kontrolü**
   - ✅ Session kontrolü yapılıyor mu?
   - ✅ CompanyId filtresi uygulanıyor mu?
   - ✅ Input validation yapılıyor mu?

---

## 🐛 Hata Ayıklama İpuçları

### Sorun: Migration çalışmıyor
**Çözüm:**
1. Migration dosyasını kontrol et: `supabase/migrations/020_automations_complete.sql`
2. Supabase CLI ile migration çalıştır: `supabase db push`
3. Hata mesajlarını kontrol et

### Sorun: API endpoint'leri çalışmıyor
**Çözüm:**
1. Browser console'u kontrol et (F12)
2. Network tab'ında API isteklerini kontrol et
3. Session kontrolü yap
4. CompanyId'nin doğru olduğundan emin ol

### Sorun: Component'ler render edilmiyor
**Çözüm:**
1. Browser console'da hata var mı kontrol et
2. Component import'larını kontrol et
3. Dynamic import'lar doğru mu kontrol et

---

## 📝 Migration Dosyası

Migration dosyası: `supabase/migrations/020_automations_complete.sql`

**Çalıştırma:**
```bash
# Supabase CLI ile
supabase db push

# Veya SQL Editor'de
# Dosya içeriğini kopyala-yapıştır
```

**Migration İçeriği:**
- User tablosuna monthlyGoal, preferredCurrency, lastSearchHistory kolonları
- Quote tablosuna expiryDate, priorityScore kolonları
- Deal tablosuna priorityScore, isPriority, quoteCreatedAt kolonları
- Customer tablosuna churnScore, riskLevel, lastInteractionDate, birthday, satisfactionScore kolonları
- Invoice tablosuna invoiceNumber, autoGeneratedFileName kolonları
- Task tablosuna escalated, escalatedAt kolonları
- Trigger'lar ve Function'lar
- View'lar (RiskyCustomers, PriorityDeals)
- Index'ler (performans için)

---

## 🎯 Sonuç

Bu test senaryoları ile tüm otomasyonların çalıştığından emin olabilirsiniz. Her senaryo adım adım takip edilerek sistemin doğru çalıştığı doğrulanabilir.

**Test Sırası:**
1. Önce migration dosyasını çalıştır
2. Smart Reminder'ı test et
3. QuickActions'ı test et
4. SmartEmptyState'i test et
5. AutoGoalTracker'ı test et
6. Diğer otomasyonları sırayla test et

**Başarı Kriterleri:**
- ✅ Migration başarıyla çalıştı
- ✅ Tüm API endpoint'leri 200 status code dönüyor
- ✅ Tüm UI component'leri doğru render ediliyor
- ✅ Tüm otomasyonlar beklenen şekilde çalışıyor
- ✅ Hata durumlarında uygun mesajlar gösteriliyor

---

## 📞 Destek

Herhangi bir sorun yaşarsanız:
1. Browser console'u kontrol edin (F12)
2. Network tab'ında API isteklerini kontrol edin
3. Veritabanı loglarını kontrol edin
4. Migration dosyasını tekrar çalıştırın



Bu dokümanda **TÜM** otomasyonların test senaryoları ve kullanım kılavuzu bulunmaktadır.

---

## 📋 İçindekiler

### ✅ Tamamlanan Otomasyonlar

1. [Smart Reminder - Günlük Bildirimler](#1-smart-reminder)
2. [QuickActions - Hızlı İşlem Butonları](#2-quickactions)
3. [SmartEmptyState - Boş Ekran Önerileri](#3-smartemptystate)
4. [AutoGoalTracker - Hedef Takibi](#4-autogoaltracker)
5. [AutoTaskFromQuote - Otomatik Görev Atama](#5-autotaskfromquote)
6. [AutoNoteOnEdit - Değişiklik Günlüğü](#6-autonoteonedit)
7. [AutoQuoteExpiry - Otomatik Süre Dolumu](#7-autoquoteexpiry)
8. [Deal-to-Quote Time Monitor](#8-deal-to-quote-time-monitor)
9. [Churn Prediction - Kayıp Müşteri Tahmini](#9-churn-prediction)
10. [Smart Re-Engagement Flow](#10-smart-re-engagement-flow)
11. [Auto-Priority Lead Sorting](#11-auto-priority-lead-sorting)

---

## 1️⃣ Smart Reminder - Günlük Bildirimler

### 📝 Açıklama
Kullanıcı dashboard'a giriş yaptığında otomatik olarak günlük özet gösterilir.

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

**API Test:**
```bash
GET /api/automations/smart-reminder
```

**Beklenen Response:**
```json
{
  "pendingQuotes": 1,
  "inactiveCustomers": 1,
  "inactiveCustomersList": [...],
  "pendingShipments": 1
}
```

---

## 2️⃣ QuickActions - Hızlı İşlem Butonları

### 📝 Açıklama
Duruma göre otomatik olarak hızlı işlem butonları gösterilir.

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

**Component Kullanımı:**
```tsx
<QuickActions 
  entityType="quote" 
  entityId={quote.id} 
  status={quote.status} 
/>
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

**Component Kullanımı:**
```tsx
{quotes.length === 0 && (
  <SmartEmptyState entityType="quotes" />
)}
```

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

**API Test:**
```bash
POST /api/automations/goal-tracker
Content-Type: application/json

{
  "monthlyGoal": 50000
}
```

**Beklenen Response:**
```json
{
  "monthlyGoal": 50000,
  "message": "Hedef güncellendi"
}
```

### ✅ Test Senaryosu 2: İlerleme Takibi

**Adımlar:**
1. Dashboard'da hedef belirle (örn: 50000₺)
2. Bir fatura oluştur ve durumunu "PAID" yap (örn: 20000₺)
3. Dashboard'u yenile

**Beklenen Sonuç:**
- ✅ İlerleme çubuğu %40'a kadar dolar (20000/50000)
- ✅ "İlerleme: 20.000₺" ve "Kalan: 30.000₺" bilgileri görünür
- ✅ İlerleme yüzdesi %40 olarak görünür

**API Test:**
```bash
GET /api/automations/goal-tracker
```

**Beklenen Response:**
```json
{
  "monthlyGoal": 50000,
  "currentProgress": 20000,
  "percentage": 40
}
```

---

## 5️⃣ AutoTaskFromQuote - Otomatik Görev Atama

### 📝 Açıklama
Teklif oluşturulduğunda otomatik olarak görev açılır ve teklif sahibine atanır.

### ✅ Test Senaryosu 1: Teklif Oluşturulduğunda Görev Açılması

**Adımlar:**
1. Yeni bir teklif oluştur
2. Teklif kaydedildikten sonra Görevler sayfasına git (`/tasks`)
3. Yeni oluşturulan görevi kontrol et

**Beklenen Sonuç:**
- ✅ Yeni bir görev oluşturulur
- ✅ Görev başlığı: "Bu teklif için 3 gün içinde müşteriyi ara: [Teklif Başlığı]"
- ✅ Görev teklif sahibine atanır
- ✅ Görev durumu "TODO" olarak görünür
- ✅ Görev dueDate'i 3 gün sonra olarak ayarlanır

**Test Verileri Hazırlama:**
```sql
-- Teklif oluştur (otomatik görev açılacak)
INSERT INTO "Quote" (title, status, total, "companyId", "userId") 
VALUES ('Yeni Teklif', 'DRAFT', 10000, 'your-company-id', 'your-user-id');
```

**API Test:**
```bash
POST /api/quotes
Content-Type: application/json

{
  "title": "Test Teklif",
  "status": "DRAFT",
  "total": 10000,
  "dealId": "deal-id"
}
```

**Beklenen Sonuç:**
- ✅ Teklif oluşturulur
- ✅ Görev otomatik oluşturulur
- ✅ Görev teklif sahibine atanır

---

## 6️⃣ AutoNoteOnEdit - Değişiklik Günlüğü

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
- ✅ Kayıt açıklaması: "Fiyat güncellendi (eski: ₺10.000,00 → yeni: ₺12.000,00)"
- ✅ Kayıt meta bilgilerinde eski ve yeni değerler bulunur

**API Test:**
```bash
PUT /api/quotes/[id]
Content-Type: application/json

{
  "total": 12000
}
```

**Beklenen Response:**
```json
{
  "id": "quote-id",
  "title": "Test Teklif",
  "total": 12000,
  ...
}
```

**ActivityLog Kontrolü:**
```sql
SELECT * FROM "ActivityLog" 
WHERE entity = 'Quote' 
  AND action = 'UPDATE' 
  AND meta->>'oldTotal' IS NOT NULL
ORDER BY "createdAt" DESC
LIMIT 1;
```

---

## 7️⃣ AutoQuoteExpiry - Otomatik Süre Dolumu

### 📝 Açıklama
30 günden uzun süredir "SENT" olan teklifler otomatik EXPIRED yapılır.

### ✅ Test Senaryosu 1: Eski Teklifleri Expired Yapma

**Adımlar:**
1. 35 gün önce oluşturulmuş bir SENT teklif oluştur
2. API endpoint'ini çağır: `POST /api/automations/auto-quote-expiry`
3. Teklif durumunu kontrol et

**Beklenen Sonuç:**
- ✅ Teklif durumu "EXPIRED" olarak güncellenir
- ✅ ActivityLog'a kayıt eklenir
- ✅ Kayıt açıklaması: "Teklif süresi doldu: [Teklif Başlığı] - 30 günden uzun süredir SENT durumunda"

**Test Verileri Hazırlama:**
```sql
-- 35 gün önce oluşturulmuş SENT teklif
INSERT INTO "Quote" (title, status, total, "companyId", "createdAt") 
VALUES ('Eski Teklif', 'SENT', 10000, 'your-company-id', NOW() - INTERVAL '35 days');
```

**API Test:**
```bash
POST /api/automations/auto-quote-expiry
```

**Beklenen Response:**
```json
{
  "message": "Expired quotes updated successfully",
  "count": 1,
  "quotes": [
    {
      "id": "quote-id",
      "title": "Eski Teklif"
    }
  ]
}
```

**Veritabanı Kontrolü:**
```sql
SELECT * FROM "Quote" 
WHERE status = 'EXPIRED' 
  AND "companyId" = 'your-company-id';
```

---

## 8️⃣ Deal-to-Quote Time Monitor

### 📝 Açıklama
Fırsat oluşturulduktan sonra 48 saat içinde teklif hazırlanmamışsa uyarı çıkar.

### ✅ Test Senaryosu 1: Teklif Oluşturulmamış Fırsatları Bulma

**Adımlar:**
1. 50 saat önce oluşturulmuş bir fırsat oluştur (teklif yok)
2. API endpoint'ini çağır: `GET /api/automations/deal-to-quote-monitor`
3. Uyarıları kontrol et

**Beklenen Sonuç:**
- ✅ Uyarı listesi döner
- ✅ Her uyarı için: dealId, dealTitle, createdAt, hoursSinceCreation bilgileri bulunur
- ✅ Uyarı sayısı > 0 ise bildirim gösterilir

**Test Verileri Hazırlama:**
```sql
-- 50 saat önce oluşturulmuş fırsat (teklif yok)
INSERT INTO "Deal" (title, stage, value, status, "companyId", "createdAt") 
VALUES ('Eski Fırsat', 'LEAD', 20000, 'OPEN', 'your-company-id', NOW() - INTERVAL '50 hours');
```

**API Test:**
```bash
GET /api/automations/deal-to-quote-monitor
```

**Beklenen Response:**
```json
{
  "message": "Deals without quotes found",
  "warnings": [
    {
      "dealId": "deal-id",
      "dealTitle": "Eski Fırsat",
      "createdAt": "2025-01-01T00:00:00Z",
      "hoursSinceCreation": 50
    }
  ],
  "count": 1
}
```

---

## 9️⃣ Churn Prediction - Kayıp Müşteri Tahmini

### 📝 Açıklama
Basit skorlama: (inaktif_günler * 0.5) + (reddedilen_teklifler * 1.5)
Skor > 10 ise müşteri "Riskli" olarak işaretlenir.

### ✅ Test Senaryosu 1: Riskli Müşterileri Bulma

**Adımlar:**
1. 30 gün önce güncellenmiş bir müşteri oluştur
2. Bu müşteriye 5 reddedilen teklif ekle
3. API endpoint'ini çağır: `GET /api/automations/churn-prediction`
4. Riskli müşterileri kontrol et

**Beklenen Sonuç:**
- ✅ Riskli müşteriler listesi döner
- ✅ Her müşteri için: customerId, customerName, churnScore, inactiveDays, rejectedQuotes, riskLevel bilgileri bulunur
- ✅ Churn skoru > 10 olan müşteriler "HIGH" risk seviyesinde

**Test Verileri Hazırlama:**
```sql
-- 30 gün önce güncellenmiş müşteri
INSERT INTO "Customer" (name, status, "companyId", "updatedAt", "lastInteractionDate") 
VALUES ('Riskli Müşteri', 'ACTIVE', 'your-company-id', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days');

-- 5 reddedilen teklif
INSERT INTO "Quote" (title, status, total, "companyId", "customerId") 
VALUES 
  ('Teklif 1', 'DECLINED', 10000, 'your-company-id', 'customer-id'),
  ('Teklif 2', 'DECLINED', 15000, 'your-company-id', 'customer-id'),
  ('Teklif 3', 'DECLINED', 20000, 'your-company-id', 'customer-id'),
  ('Teklif 4', 'DECLINED', 12000, 'your-company-id', 'customer-id'),
  ('Teklif 5', 'DECLINED', 18000, 'your-company-id', 'customer-id');
```

**API Test:**
```bash
GET /api/automations/churn-prediction
```

**Beklenen Response:**
```json
{
  "message": "Risky customers found",
  "riskyCustomers": [
    {
      "customerId": "customer-id",
      "customerName": "Riskli Müşteri",
      "churnScore": 30.0,
      "inactiveDays": 30,
      "rejectedQuotes": 5,
      "riskLevel": "HIGH"
    }
  ],
  "count": 1
}
```

**Churn Skoru Hesaplama:**
- İnaktif günler: 30
- Reddedilen teklifler: 5
- Churn skoru: (30 * 0.5) + (5 * 1.5) = 15 + 7.5 = 22.5
- Risk seviyesi: HIGH (> 10)

---

## 🔟 Smart Re-Engagement Flow

### 📝 Açıklama
Müşteri 60 gün boyunca etkileşimsizse (hiç görüşme, teklif, fatura yoksa) uyarı ver.

### ✅ Test Senaryosu 1: Etkileşimsiz Müşterileri Bulma

**Adımlar:**
1. 70 gün önce güncellenmiş bir müşteri oluştur
2. Bu müşteriye son 60 günde hiç teklif, fatura, görüşme ekleme
3. API endpoint'ini çağır: `GET /api/automations/smart-re-engagement`
4. Etkileşimsiz müşterileri kontrol et

**Beklenen Sonuç:**
- ✅ Etkileşimsiz müşteriler listesi döner
- ✅ Her müşteri için: customerId, customerName, lastInteraction, daysSinceInteraction bilgileri bulunur
- ✅ hasRecentQuote, hasRecentInvoice, hasRecentMeeting false olmalı

**Test Verileri Hazırlama:**
```sql
-- 70 gün önce güncellenmiş müşteri
INSERT INTO "Customer" (name, status, "companyId", "updatedAt", "lastInteractionDate") 
VALUES ('Etkileşimsiz Müşteri', 'ACTIVE', 'your-company-id', NOW() - INTERVAL '70 days', NOW() - INTERVAL '70 days');
```

**API Test:**
```bash
GET /api/automations/smart-re-engagement
```

**Beklenen Response:**
```json
{
  "message": "1 müşteri 60 günden uzun süredir etkileşimsiz",
  "inactiveCustomers": [
    {
      "customerId": "customer-id",
      "customerName": "Etkileşimsiz Müşteri",
      "lastInteraction": "2024-11-01T00:00:00Z",
      "daysSinceInteraction": 70,
      "hasRecentQuote": false,
      "hasRecentInvoice": false,
      "hasRecentMeeting": false
    }
  ],
  "count": 1
}
```

---

## 1️⃣1️⃣ Auto-Priority Lead Sorting

### 📝 Açıklama
Yeni girilen fırsatlar (deal) sistemce puanlanır:
Formül: (teklif_tutarı × müşteri_skoru × olasılık) / gün_sayısı
En yüksek puanlı fırsatlar "Öncelikli" etiketiyle listenin üstüne taşınır.

### ✅ Test Senaryosu 1: Fırsat Puanlama

**Adımlar:**
1. Yüksek değerli bir fırsat oluştur (örn: 100000₺)
2. Bu fırsat için müşteriye ödenmiş faturalar ekle (müşteri skoru artar)
3. Fırsatın winProbability'sini yüksek yap (örn: 80)
4. API endpoint'ini çağır: `GET /api/automations/priority-lead-sorting`
5. Puanlanmış fırsatları kontrol et

**Beklenen Sonuç:**
- ✅ Puanlanmış fırsatlar listesi döner
- ✅ Her fırsat için: dealId, dealTitle, priorityScore, value, customerScore, winProbability, daysSinceCreation, isPriority bilgileri bulunur
- ✅ PriorityScore > 1000 olan fırsatlar isPriority = true

**Test Verileri Hazırlama:**
```sql
-- Yüksek değerli fırsat
INSERT INTO "Deal" (title, stage, value, status, "companyId", "winProbability", "customerId") 
VALUES ('Yüksek Değerli Fırsat', 'PROPOSAL', 100000, 'OPEN', 'your-company-id', 80, 'customer-id');

-- Müşteriye ödenmiş faturalar (müşteri skoru artar)
INSERT INTO "Invoice" (title, status, total, "companyId", "customerId") 
VALUES 
  ('Fatura 1', 'PAID', 50000, 'your-company-id', 'customer-id'),
  ('Fatura 2', 'PAID', 30000, 'your-company-id', 'customer-id');
```

**API Test:**
```bash
GET /api/automations/priority-lead-sorting
```

**Beklenen Response:**
```json
{
  "message": "Deals prioritized successfully",
  "prioritizedDeals": [
    {
      "dealId": "deal-id",
      "dealTitle": "Yüksek Değerli Fırsat",
      "priorityScore": 3200.0,
      "value": 100000,
      "customerScore": 8.0,
      "winProbability": 80,
      "daysSinceCreation": 1,
      "isPriority": true
    }
  ],
  "count": 1,
  "priorityCount": 1
}
```

**Priority Skoru Hesaplama:**
- Teklif tutarı: 100000₺
- Müşteri skoru: (50000 + 30000) / 10000 = 8.0
- Olasılık: 80%
- Gün sayısı: 1
- Priority skoru: (100000 * 8.0 * 0.8) / 1 = 64000 / 1 = 64000
- isPriority: true (> 1000)

---

## 📊 Genel Test Kontrol Listesi

### ✅ Tüm Otomasyonlar İçin Ortak Kontroller

1. **Migration Kontrolü**
   ```bash
   # Migration dosyasını çalıştır
   supabase db push
   ```

2. **API Endpoint Kontrolü**
   - ✅ Tüm API endpoint'leri çalışıyor mu?
   - ✅ Hata durumlarında uygun mesajlar dönüyor mu?
   - ✅ RLS (Row-Level Security) kontrolü yapılıyor mu?

3. **UI/UX Kontrolü**
   - ✅ Tüm component'ler doğru render ediliyor mu?
   - ✅ Loading state'ler gösteriliyor mu?
   - ✅ Error state'ler gösteriliyor mu?
   - ✅ Responsive tasarım çalışıyor mu?

4. **Performans Kontrolü**
   - ✅ API response süreleri < 1000ms mi?
   - ✅ Component render süreleri < 300ms mi?
   - ✅ Cache stratejisi çalışıyor mu?

5. **Güvenlik Kontrolü**
   - ✅ Session kontrolü yapılıyor mu?
   - ✅ CompanyId filtresi uygulanıyor mu?
   - ✅ Input validation yapılıyor mu?

---

## 🐛 Hata Ayıklama İpuçları

### Sorun: Migration çalışmıyor
**Çözüm:**
1. Migration dosyasını kontrol et: `supabase/migrations/020_automations_complete.sql`
2. Supabase CLI ile migration çalıştır: `supabase db push`
3. Hata mesajlarını kontrol et

### Sorun: API endpoint'leri çalışmıyor
**Çözüm:**
1. Browser console'u kontrol et (F12)
2. Network tab'ında API isteklerini kontrol et
3. Session kontrolü yap
4. CompanyId'nin doğru olduğundan emin ol

### Sorun: Component'ler render edilmiyor
**Çözüm:**
1. Browser console'da hata var mı kontrol et
2. Component import'larını kontrol et
3. Dynamic import'lar doğru mu kontrol et

---

## 📝 Migration Dosyası

Migration dosyası: `supabase/migrations/020_automations_complete.sql`

**Çalıştırma:**
```bash
# Supabase CLI ile
supabase db push

# Veya SQL Editor'de
# Dosya içeriğini kopyala-yapıştır
```

**Migration İçeriği:**
- User tablosuna monthlyGoal, preferredCurrency, lastSearchHistory kolonları
- Quote tablosuna expiryDate, priorityScore kolonları
- Deal tablosuna priorityScore, isPriority, quoteCreatedAt kolonları
- Customer tablosuna churnScore, riskLevel, lastInteractionDate, birthday, satisfactionScore kolonları
- Invoice tablosuna invoiceNumber, autoGeneratedFileName kolonları
- Task tablosuna escalated, escalatedAt kolonları
- Trigger'lar ve Function'lar
- View'lar (RiskyCustomers, PriorityDeals)
- Index'ler (performans için)

---

## 🎯 Sonuç

Bu test senaryoları ile tüm otomasyonların çalıştığından emin olabilirsiniz. Her senaryo adım adım takip edilerek sistemin doğru çalıştığı doğrulanabilir.

**Test Sırası:**
1. Önce migration dosyasını çalıştır
2. Smart Reminder'ı test et
3. QuickActions'ı test et
4. SmartEmptyState'i test et
5. AutoGoalTracker'ı test et
6. Diğer otomasyonları sırayla test et

**Başarı Kriterleri:**
- ✅ Migration başarıyla çalıştı
- ✅ Tüm API endpoint'leri 200 status code dönüyor
- ✅ Tüm UI component'leri doğru render ediliyor
- ✅ Tüm otomasyonlar beklenen şekilde çalışıyor
- ✅ Hata durumlarında uygun mesajlar gösteriliyor

---

## 📞 Destek

Herhangi bir sorun yaşarsanız:
1. Browser console'u kontrol edin (F12)
2. Network tab'ında API isteklerini kontrol edin
3. Veritabanı loglarını kontrol edin
4. Migration dosyasını tekrar çalıştırın


Bu dokümanda **TÜM** otomasyonların test senaryoları ve kullanım kılavuzu bulunmaktadır.

---

## 📋 İçindekiler

### ✅ Tamamlanan Otomasyonlar

1. [Smart Reminder - Günlük Bildirimler](#1-smart-reminder)
2. [QuickActions - Hızlı İşlem Butonları](#2-quickactions)
3. [SmartEmptyState - Boş Ekran Önerileri](#3-smartemptystate)
4. [AutoGoalTracker - Hedef Takibi](#4-autogoaltracker)
5. [AutoTaskFromQuote - Otomatik Görev Atama](#5-autotaskfromquote)
6. [AutoNoteOnEdit - Değişiklik Günlüğü](#6-autonoteonedit)
7. [AutoQuoteExpiry - Otomatik Süre Dolumu](#7-autoquoteexpiry)
8. [Deal-to-Quote Time Monitor](#8-deal-to-quote-time-monitor)
9. [Churn Prediction - Kayıp Müşteri Tahmini](#9-churn-prediction)
10. [Smart Re-Engagement Flow](#10-smart-re-engagement-flow)
11. [Auto-Priority Lead Sorting](#11-auto-priority-lead-sorting)

---

## 1️⃣ Smart Reminder - Günlük Bildirimler

### 📝 Açıklama
Kullanıcı dashboard'a giriş yaptığında otomatik olarak günlük özet gösterilir.

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

**API Test:**
```bash
GET /api/automations/smart-reminder
```

**Beklenen Response:**
```json
{
  "pendingQuotes": 1,
  "inactiveCustomers": 1,
  "inactiveCustomersList": [...],
  "pendingShipments": 1
}
```

---

## 2️⃣ QuickActions - Hızlı İşlem Butonları

### 📝 Açıklama
Duruma göre otomatik olarak hızlı işlem butonları gösterilir.

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

**Component Kullanımı:**
```tsx
<QuickActions 
  entityType="quote" 
  entityId={quote.id} 
  status={quote.status} 
/>
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

**Component Kullanımı:**
```tsx
{quotes.length === 0 && (
  <SmartEmptyState entityType="quotes" />
)}
```

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

**API Test:**
```bash
POST /api/automations/goal-tracker
Content-Type: application/json

{
  "monthlyGoal": 50000
}
```

**Beklenen Response:**
```json
{
  "monthlyGoal": 50000,
  "message": "Hedef güncellendi"
}
```

### ✅ Test Senaryosu 2: İlerleme Takibi

**Adımlar:**
1. Dashboard'da hedef belirle (örn: 50000₺)
2. Bir fatura oluştur ve durumunu "PAID" yap (örn: 20000₺)
3. Dashboard'u yenile

**Beklenen Sonuç:**
- ✅ İlerleme çubuğu %40'a kadar dolar (20000/50000)
- ✅ "İlerleme: 20.000₺" ve "Kalan: 30.000₺" bilgileri görünür
- ✅ İlerleme yüzdesi %40 olarak görünür

**API Test:**
```bash
GET /api/automations/goal-tracker
```

**Beklenen Response:**
```json
{
  "monthlyGoal": 50000,
  "currentProgress": 20000,
  "percentage": 40
}
```

---

## 5️⃣ AutoTaskFromQuote - Otomatik Görev Atama

### 📝 Açıklama
Teklif oluşturulduğunda otomatik olarak görev açılır ve teklif sahibine atanır.

### ✅ Test Senaryosu 1: Teklif Oluşturulduğunda Görev Açılması

**Adımlar:**
1. Yeni bir teklif oluştur
2. Teklif kaydedildikten sonra Görevler sayfasına git (`/tasks`)
3. Yeni oluşturulan görevi kontrol et

**Beklenen Sonuç:**
- ✅ Yeni bir görev oluşturulur
- ✅ Görev başlığı: "Bu teklif için 3 gün içinde müşteriyi ara: [Teklif Başlığı]"
- ✅ Görev teklif sahibine atanır
- ✅ Görev durumu "TODO" olarak görünür
- ✅ Görev dueDate'i 3 gün sonra olarak ayarlanır

**Test Verileri Hazırlama:**
```sql
-- Teklif oluştur (otomatik görev açılacak)
INSERT INTO "Quote" (title, status, total, "companyId", "userId") 
VALUES ('Yeni Teklif', 'DRAFT', 10000, 'your-company-id', 'your-user-id');
```

**API Test:**
```bash
POST /api/quotes
Content-Type: application/json

{
  "title": "Test Teklif",
  "status": "DRAFT",
  "total": 10000,
  "dealId": "deal-id"
}
```

**Beklenen Sonuç:**
- ✅ Teklif oluşturulur
- ✅ Görev otomatik oluşturulur
- ✅ Görev teklif sahibine atanır

---

## 6️⃣ AutoNoteOnEdit - Değişiklik Günlüğü

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
- ✅ Kayıt açıklaması: "Fiyat güncellendi (eski: ₺10.000,00 → yeni: ₺12.000,00)"
- ✅ Kayıt meta bilgilerinde eski ve yeni değerler bulunur

**API Test:**
```bash
PUT /api/quotes/[id]
Content-Type: application/json

{
  "total": 12000
}
```

**Beklenen Response:**
```json
{
  "id": "quote-id",
  "title": "Test Teklif",
  "total": 12000,
  ...
}
```

**ActivityLog Kontrolü:**
```sql
SELECT * FROM "ActivityLog" 
WHERE entity = 'Quote' 
  AND action = 'UPDATE' 
  AND meta->>'oldTotal' IS NOT NULL
ORDER BY "createdAt" DESC
LIMIT 1;
```

---

## 7️⃣ AutoQuoteExpiry - Otomatik Süre Dolumu

### 📝 Açıklama
30 günden uzun süredir "SENT" olan teklifler otomatik EXPIRED yapılır.

### ✅ Test Senaryosu 1: Eski Teklifleri Expired Yapma

**Adımlar:**
1. 35 gün önce oluşturulmuş bir SENT teklif oluştur
2. API endpoint'ini çağır: `POST /api/automations/auto-quote-expiry`
3. Teklif durumunu kontrol et

**Beklenen Sonuç:**
- ✅ Teklif durumu "EXPIRED" olarak güncellenir
- ✅ ActivityLog'a kayıt eklenir
- ✅ Kayıt açıklaması: "Teklif süresi doldu: [Teklif Başlığı] - 30 günden uzun süredir SENT durumunda"

**Test Verileri Hazırlama:**
```sql
-- 35 gün önce oluşturulmuş SENT teklif
INSERT INTO "Quote" (title, status, total, "companyId", "createdAt") 
VALUES ('Eski Teklif', 'SENT', 10000, 'your-company-id', NOW() - INTERVAL '35 days');
```

**API Test:**
```bash
POST /api/automations/auto-quote-expiry
```

**Beklenen Response:**
```json
{
  "message": "Expired quotes updated successfully",
  "count": 1,
  "quotes": [
    {
      "id": "quote-id",
      "title": "Eski Teklif"
    }
  ]
}
```

**Veritabanı Kontrolü:**
```sql
SELECT * FROM "Quote" 
WHERE status = 'EXPIRED' 
  AND "companyId" = 'your-company-id';
```

---

## 8️⃣ Deal-to-Quote Time Monitor

### 📝 Açıklama
Fırsat oluşturulduktan sonra 48 saat içinde teklif hazırlanmamışsa uyarı çıkar.

### ✅ Test Senaryosu 1: Teklif Oluşturulmamış Fırsatları Bulma

**Adımlar:**
1. 50 saat önce oluşturulmuş bir fırsat oluştur (teklif yok)
2. API endpoint'ini çağır: `GET /api/automations/deal-to-quote-monitor`
3. Uyarıları kontrol et

**Beklenen Sonuç:**
- ✅ Uyarı listesi döner
- ✅ Her uyarı için: dealId, dealTitle, createdAt, hoursSinceCreation bilgileri bulunur
- ✅ Uyarı sayısı > 0 ise bildirim gösterilir

**Test Verileri Hazırlama:**
```sql
-- 50 saat önce oluşturulmuş fırsat (teklif yok)
INSERT INTO "Deal" (title, stage, value, status, "companyId", "createdAt") 
VALUES ('Eski Fırsat', 'LEAD', 20000, 'OPEN', 'your-company-id', NOW() - INTERVAL '50 hours');
```

**API Test:**
```bash
GET /api/automations/deal-to-quote-monitor
```

**Beklenen Response:**
```json
{
  "message": "Deals without quotes found",
  "warnings": [
    {
      "dealId": "deal-id",
      "dealTitle": "Eski Fırsat",
      "createdAt": "2025-01-01T00:00:00Z",
      "hoursSinceCreation": 50
    }
  ],
  "count": 1
}
```

---

## 9️⃣ Churn Prediction - Kayıp Müşteri Tahmini

### 📝 Açıklama
Basit skorlama: (inaktif_günler * 0.5) + (reddedilen_teklifler * 1.5)
Skor > 10 ise müşteri "Riskli" olarak işaretlenir.

### ✅ Test Senaryosu 1: Riskli Müşterileri Bulma

**Adımlar:**
1. 30 gün önce güncellenmiş bir müşteri oluştur
2. Bu müşteriye 5 reddedilen teklif ekle
3. API endpoint'ini çağır: `GET /api/automations/churn-prediction`
4. Riskli müşterileri kontrol et

**Beklenen Sonuç:**
- ✅ Riskli müşteriler listesi döner
- ✅ Her müşteri için: customerId, customerName, churnScore, inactiveDays, rejectedQuotes, riskLevel bilgileri bulunur
- ✅ Churn skoru > 10 olan müşteriler "HIGH" risk seviyesinde

**Test Verileri Hazırlama:**
```sql
-- 30 gün önce güncellenmiş müşteri
INSERT INTO "Customer" (name, status, "companyId", "updatedAt", "lastInteractionDate") 
VALUES ('Riskli Müşteri', 'ACTIVE', 'your-company-id', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days');

-- 5 reddedilen teklif
INSERT INTO "Quote" (title, status, total, "companyId", "customerId") 
VALUES 
  ('Teklif 1', 'DECLINED', 10000, 'your-company-id', 'customer-id'),
  ('Teklif 2', 'DECLINED', 15000, 'your-company-id', 'customer-id'),
  ('Teklif 3', 'DECLINED', 20000, 'your-company-id', 'customer-id'),
  ('Teklif 4', 'DECLINED', 12000, 'your-company-id', 'customer-id'),
  ('Teklif 5', 'DECLINED', 18000, 'your-company-id', 'customer-id');
```

**API Test:**
```bash
GET /api/automations/churn-prediction
```

**Beklenen Response:**
```json
{
  "message": "Risky customers found",
  "riskyCustomers": [
    {
      "customerId": "customer-id",
      "customerName": "Riskli Müşteri",
      "churnScore": 30.0,
      "inactiveDays": 30,
      "rejectedQuotes": 5,
      "riskLevel": "HIGH"
    }
  ],
  "count": 1
}
```

**Churn Skoru Hesaplama:**
- İnaktif günler: 30
- Reddedilen teklifler: 5
- Churn skoru: (30 * 0.5) + (5 * 1.5) = 15 + 7.5 = 22.5
- Risk seviyesi: HIGH (> 10)

---

## 🔟 Smart Re-Engagement Flow

### 📝 Açıklama
Müşteri 60 gün boyunca etkileşimsizse (hiç görüşme, teklif, fatura yoksa) uyarı ver.

### ✅ Test Senaryosu 1: Etkileşimsiz Müşterileri Bulma

**Adımlar:**
1. 70 gün önce güncellenmiş bir müşteri oluştur
2. Bu müşteriye son 60 günde hiç teklif, fatura, görüşme ekleme
3. API endpoint'ini çağır: `GET /api/automations/smart-re-engagement`
4. Etkileşimsiz müşterileri kontrol et

**Beklenen Sonuç:**
- ✅ Etkileşimsiz müşteriler listesi döner
- ✅ Her müşteri için: customerId, customerName, lastInteraction, daysSinceInteraction bilgileri bulunur
- ✅ hasRecentQuote, hasRecentInvoice, hasRecentMeeting false olmalı

**Test Verileri Hazırlama:**
```sql
-- 70 gün önce güncellenmiş müşteri
INSERT INTO "Customer" (name, status, "companyId", "updatedAt", "lastInteractionDate") 
VALUES ('Etkileşimsiz Müşteri', 'ACTIVE', 'your-company-id', NOW() - INTERVAL '70 days', NOW() - INTERVAL '70 days');
```

**API Test:**
```bash
GET /api/automations/smart-re-engagement
```

**Beklenen Response:**
```json
{
  "message": "1 müşteri 60 günden uzun süredir etkileşimsiz",
  "inactiveCustomers": [
    {
      "customerId": "customer-id",
      "customerName": "Etkileşimsiz Müşteri",
      "lastInteraction": "2024-11-01T00:00:00Z",
      "daysSinceInteraction": 70,
      "hasRecentQuote": false,
      "hasRecentInvoice": false,
      "hasRecentMeeting": false
    }
  ],
  "count": 1
}
```

---

## 1️⃣1️⃣ Auto-Priority Lead Sorting

### 📝 Açıklama
Yeni girilen fırsatlar (deal) sistemce puanlanır:
Formül: (teklif_tutarı × müşteri_skoru × olasılık) / gün_sayısı
En yüksek puanlı fırsatlar "Öncelikli" etiketiyle listenin üstüne taşınır.

### ✅ Test Senaryosu 1: Fırsat Puanlama

**Adımlar:**
1. Yüksek değerli bir fırsat oluştur (örn: 100000₺)
2. Bu fırsat için müşteriye ödenmiş faturalar ekle (müşteri skoru artar)
3. Fırsatın winProbability'sini yüksek yap (örn: 80)
4. API endpoint'ini çağır: `GET /api/automations/priority-lead-sorting`
5. Puanlanmış fırsatları kontrol et

**Beklenen Sonuç:**
- ✅ Puanlanmış fırsatlar listesi döner
- ✅ Her fırsat için: dealId, dealTitle, priorityScore, value, customerScore, winProbability, daysSinceCreation, isPriority bilgileri bulunur
- ✅ PriorityScore > 1000 olan fırsatlar isPriority = true

**Test Verileri Hazırlama:**
```sql
-- Yüksek değerli fırsat
INSERT INTO "Deal" (title, stage, value, status, "companyId", "winProbability", "customerId") 
VALUES ('Yüksek Değerli Fırsat', 'PROPOSAL', 100000, 'OPEN', 'your-company-id', 80, 'customer-id');

-- Müşteriye ödenmiş faturalar (müşteri skoru artar)
INSERT INTO "Invoice" (title, status, total, "companyId", "customerId") 
VALUES 
  ('Fatura 1', 'PAID', 50000, 'your-company-id', 'customer-id'),
  ('Fatura 2', 'PAID', 30000, 'your-company-id', 'customer-id');
```

**API Test:**
```bash
GET /api/automations/priority-lead-sorting
```

**Beklenen Response:**
```json
{
  "message": "Deals prioritized successfully",
  "prioritizedDeals": [
    {
      "dealId": "deal-id",
      "dealTitle": "Yüksek Değerli Fırsat",
      "priorityScore": 3200.0,
      "value": 100000,
      "customerScore": 8.0,
      "winProbability": 80,
      "daysSinceCreation": 1,
      "isPriority": true
    }
  ],
  "count": 1,
  "priorityCount": 1
}
```

**Priority Skoru Hesaplama:**
- Teklif tutarı: 100000₺
- Müşteri skoru: (50000 + 30000) / 10000 = 8.0
- Olasılık: 80%
- Gün sayısı: 1
- Priority skoru: (100000 * 8.0 * 0.8) / 1 = 64000 / 1 = 64000
- isPriority: true (> 1000)

---

## 📊 Genel Test Kontrol Listesi

### ✅ Tüm Otomasyonlar İçin Ortak Kontroller

1. **Migration Kontrolü**
   ```bash
   # Migration dosyasını çalıştır
   supabase db push
   ```

2. **API Endpoint Kontrolü**
   - ✅ Tüm API endpoint'leri çalışıyor mu?
   - ✅ Hata durumlarında uygun mesajlar dönüyor mu?
   - ✅ RLS (Row-Level Security) kontrolü yapılıyor mu?

3. **UI/UX Kontrolü**
   - ✅ Tüm component'ler doğru render ediliyor mu?
   - ✅ Loading state'ler gösteriliyor mu?
   - ✅ Error state'ler gösteriliyor mu?
   - ✅ Responsive tasarım çalışıyor mu?

4. **Performans Kontrolü**
   - ✅ API response süreleri < 1000ms mi?
   - ✅ Component render süreleri < 300ms mi?
   - ✅ Cache stratejisi çalışıyor mu?

5. **Güvenlik Kontrolü**
   - ✅ Session kontrolü yapılıyor mu?
   - ✅ CompanyId filtresi uygulanıyor mu?
   - ✅ Input validation yapılıyor mu?

---

## 🐛 Hata Ayıklama İpuçları

### Sorun: Migration çalışmıyor
**Çözüm:**
1. Migration dosyasını kontrol et: `supabase/migrations/020_automations_complete.sql`
2. Supabase CLI ile migration çalıştır: `supabase db push`
3. Hata mesajlarını kontrol et

### Sorun: API endpoint'leri çalışmıyor
**Çözüm:**
1. Browser console'u kontrol et (F12)
2. Network tab'ında API isteklerini kontrol et
3. Session kontrolü yap
4. CompanyId'nin doğru olduğundan emin ol

### Sorun: Component'ler render edilmiyor
**Çözüm:**
1. Browser console'da hata var mı kontrol et
2. Component import'larını kontrol et
3. Dynamic import'lar doğru mu kontrol et

---

## 📝 Migration Dosyası

Migration dosyası: `supabase/migrations/020_automations_complete.sql`

**Çalıştırma:**
```bash
# Supabase CLI ile
supabase db push

# Veya SQL Editor'de
# Dosya içeriğini kopyala-yapıştır
```

**Migration İçeriği:**
- User tablosuna monthlyGoal, preferredCurrency, lastSearchHistory kolonları
- Quote tablosuna expiryDate, priorityScore kolonları
- Deal tablosuna priorityScore, isPriority, quoteCreatedAt kolonları
- Customer tablosuna churnScore, riskLevel, lastInteractionDate, birthday, satisfactionScore kolonları
- Invoice tablosuna invoiceNumber, autoGeneratedFileName kolonları
- Task tablosuna escalated, escalatedAt kolonları
- Trigger'lar ve Function'lar
- View'lar (RiskyCustomers, PriorityDeals)
- Index'ler (performans için)

---

## 🎯 Sonuç

Bu test senaryoları ile tüm otomasyonların çalıştığından emin olabilirsiniz. Her senaryo adım adım takip edilerek sistemin doğru çalıştığı doğrulanabilir.

**Test Sırası:**
1. Önce migration dosyasını çalıştır
2. Smart Reminder'ı test et
3. QuickActions'ı test et
4. SmartEmptyState'i test et
5. AutoGoalTracker'ı test et
6. Diğer otomasyonları sırayla test et

**Başarı Kriterleri:**
- ✅ Migration başarıyla çalıştı
- ✅ Tüm API endpoint'leri 200 status code dönüyor
- ✅ Tüm UI component'leri doğru render ediliyor
- ✅ Tüm otomasyonlar beklenen şekilde çalışıyor
- ✅ Hata durumlarında uygun mesajlar gösteriliyor

---

## 📞 Destek

Herhangi bir sorun yaşarsanız:
1. Browser console'u kontrol edin (F12)
2. Network tab'ında API isteklerini kontrol edin
3. Veritabanı loglarını kontrol edin
4. Migration dosyasını tekrar çalıştırın



Bu dokümanda **TÜM** otomasyonların test senaryoları ve kullanım kılavuzu bulunmaktadır.

---

## 📋 İçindekiler

### ✅ Tamamlanan Otomasyonlar

1. [Smart Reminder - Günlük Bildirimler](#1-smart-reminder)
2. [QuickActions - Hızlı İşlem Butonları](#2-quickactions)
3. [SmartEmptyState - Boş Ekran Önerileri](#3-smartemptystate)
4. [AutoGoalTracker - Hedef Takibi](#4-autogoaltracker)
5. [AutoTaskFromQuote - Otomatik Görev Atama](#5-autotaskfromquote)
6. [AutoNoteOnEdit - Değişiklik Günlüğü](#6-autonoteonedit)
7. [AutoQuoteExpiry - Otomatik Süre Dolumu](#7-autoquoteexpiry)
8. [Deal-to-Quote Time Monitor](#8-deal-to-quote-time-monitor)
9. [Churn Prediction - Kayıp Müşteri Tahmini](#9-churn-prediction)
10. [Smart Re-Engagement Flow](#10-smart-re-engagement-flow)
11. [Auto-Priority Lead Sorting](#11-auto-priority-lead-sorting)

---

## 1️⃣ Smart Reminder - Günlük Bildirimler

### 📝 Açıklama
Kullanıcı dashboard'a giriş yaptığında otomatik olarak günlük özet gösterilir.

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

**API Test:**
```bash
GET /api/automations/smart-reminder
```

**Beklenen Response:**
```json
{
  "pendingQuotes": 1,
  "inactiveCustomers": 1,
  "inactiveCustomersList": [...],
  "pendingShipments": 1
}
```

---

## 2️⃣ QuickActions - Hızlı İşlem Butonları

### 📝 Açıklama
Duruma göre otomatik olarak hızlı işlem butonları gösterilir.

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

**Component Kullanımı:**
```tsx
<QuickActions 
  entityType="quote" 
  entityId={quote.id} 
  status={quote.status} 
/>
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

**Component Kullanımı:**
```tsx
{quotes.length === 0 && (
  <SmartEmptyState entityType="quotes" />
)}
```

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

**API Test:**
```bash
POST /api/automations/goal-tracker
Content-Type: application/json

{
  "monthlyGoal": 50000
}
```

**Beklenen Response:**
```json
{
  "monthlyGoal": 50000,
  "message": "Hedef güncellendi"
}
```

### ✅ Test Senaryosu 2: İlerleme Takibi

**Adımlar:**
1. Dashboard'da hedef belirle (örn: 50000₺)
2. Bir fatura oluştur ve durumunu "PAID" yap (örn: 20000₺)
3. Dashboard'u yenile

**Beklenen Sonuç:**
- ✅ İlerleme çubuğu %40'a kadar dolar (20000/50000)
- ✅ "İlerleme: 20.000₺" ve "Kalan: 30.000₺" bilgileri görünür
- ✅ İlerleme yüzdesi %40 olarak görünür

**API Test:**
```bash
GET /api/automations/goal-tracker
```

**Beklenen Response:**
```json
{
  "monthlyGoal": 50000,
  "currentProgress": 20000,
  "percentage": 40
}
```

---

## 5️⃣ AutoTaskFromQuote - Otomatik Görev Atama

### 📝 Açıklama
Teklif oluşturulduğunda otomatik olarak görev açılır ve teklif sahibine atanır.

### ✅ Test Senaryosu 1: Teklif Oluşturulduğunda Görev Açılması

**Adımlar:**
1. Yeni bir teklif oluştur
2. Teklif kaydedildikten sonra Görevler sayfasına git (`/tasks`)
3. Yeni oluşturulan görevi kontrol et

**Beklenen Sonuç:**
- ✅ Yeni bir görev oluşturulur
- ✅ Görev başlığı: "Bu teklif için 3 gün içinde müşteriyi ara: [Teklif Başlığı]"
- ✅ Görev teklif sahibine atanır
- ✅ Görev durumu "TODO" olarak görünür
- ✅ Görev dueDate'i 3 gün sonra olarak ayarlanır

**Test Verileri Hazırlama:**
```sql
-- Teklif oluştur (otomatik görev açılacak)
INSERT INTO "Quote" (title, status, total, "companyId", "userId") 
VALUES ('Yeni Teklif', 'DRAFT', 10000, 'your-company-id', 'your-user-id');
```

**API Test:**
```bash
POST /api/quotes
Content-Type: application/json

{
  "title": "Test Teklif",
  "status": "DRAFT",
  "total": 10000,
  "dealId": "deal-id"
}
```

**Beklenen Sonuç:**
- ✅ Teklif oluşturulur
- ✅ Görev otomatik oluşturulur
- ✅ Görev teklif sahibine atanır

---

## 6️⃣ AutoNoteOnEdit - Değişiklik Günlüğü

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
- ✅ Kayıt açıklaması: "Fiyat güncellendi (eski: ₺10.000,00 → yeni: ₺12.000,00)"
- ✅ Kayıt meta bilgilerinde eski ve yeni değerler bulunur

**API Test:**
```bash
PUT /api/quotes/[id]
Content-Type: application/json

{
  "total": 12000
}
```

**Beklenen Response:**
```json
{
  "id": "quote-id",
  "title": "Test Teklif",
  "total": 12000,
  ...
}
```

**ActivityLog Kontrolü:**
```sql
SELECT * FROM "ActivityLog" 
WHERE entity = 'Quote' 
  AND action = 'UPDATE' 
  AND meta->>'oldTotal' IS NOT NULL
ORDER BY "createdAt" DESC
LIMIT 1;
```

---

## 7️⃣ AutoQuoteExpiry - Otomatik Süre Dolumu

### 📝 Açıklama
30 günden uzun süredir "SENT" olan teklifler otomatik EXPIRED yapılır.

### ✅ Test Senaryosu 1: Eski Teklifleri Expired Yapma

**Adımlar:**
1. 35 gün önce oluşturulmuş bir SENT teklif oluştur
2. API endpoint'ini çağır: `POST /api/automations/auto-quote-expiry`
3. Teklif durumunu kontrol et

**Beklenen Sonuç:**
- ✅ Teklif durumu "EXPIRED" olarak güncellenir
- ✅ ActivityLog'a kayıt eklenir
- ✅ Kayıt açıklaması: "Teklif süresi doldu: [Teklif Başlığı] - 30 günden uzun süredir SENT durumunda"

**Test Verileri Hazırlama:**
```sql
-- 35 gün önce oluşturulmuş SENT teklif
INSERT INTO "Quote" (title, status, total, "companyId", "createdAt") 
VALUES ('Eski Teklif', 'SENT', 10000, 'your-company-id', NOW() - INTERVAL '35 days');
```

**API Test:**
```bash
POST /api/automations/auto-quote-expiry
```

**Beklenen Response:**
```json
{
  "message": "Expired quotes updated successfully",
  "count": 1,
  "quotes": [
    {
      "id": "quote-id",
      "title": "Eski Teklif"
    }
  ]
}
```

**Veritabanı Kontrolü:**
```sql
SELECT * FROM "Quote" 
WHERE status = 'EXPIRED' 
  AND "companyId" = 'your-company-id';
```

---

## 8️⃣ Deal-to-Quote Time Monitor

### 📝 Açıklama
Fırsat oluşturulduktan sonra 48 saat içinde teklif hazırlanmamışsa uyarı çıkar.

### ✅ Test Senaryosu 1: Teklif Oluşturulmamış Fırsatları Bulma

**Adımlar:**
1. 50 saat önce oluşturulmuş bir fırsat oluştur (teklif yok)
2. API endpoint'ini çağır: `GET /api/automations/deal-to-quote-monitor`
3. Uyarıları kontrol et

**Beklenen Sonuç:**
- ✅ Uyarı listesi döner
- ✅ Her uyarı için: dealId, dealTitle, createdAt, hoursSinceCreation bilgileri bulunur
- ✅ Uyarı sayısı > 0 ise bildirim gösterilir

**Test Verileri Hazırlama:**
```sql
-- 50 saat önce oluşturulmuş fırsat (teklif yok)
INSERT INTO "Deal" (title, stage, value, status, "companyId", "createdAt") 
VALUES ('Eski Fırsat', 'LEAD', 20000, 'OPEN', 'your-company-id', NOW() - INTERVAL '50 hours');
```

**API Test:**
```bash
GET /api/automations/deal-to-quote-monitor
```

**Beklenen Response:**
```json
{
  "message": "Deals without quotes found",
  "warnings": [
    {
      "dealId": "deal-id",
      "dealTitle": "Eski Fırsat",
      "createdAt": "2025-01-01T00:00:00Z",
      "hoursSinceCreation": 50
    }
  ],
  "count": 1
}
```

---

## 9️⃣ Churn Prediction - Kayıp Müşteri Tahmini

### 📝 Açıklama
Basit skorlama: (inaktif_günler * 0.5) + (reddedilen_teklifler * 1.5)
Skor > 10 ise müşteri "Riskli" olarak işaretlenir.

### ✅ Test Senaryosu 1: Riskli Müşterileri Bulma

**Adımlar:**
1. 30 gün önce güncellenmiş bir müşteri oluştur
2. Bu müşteriye 5 reddedilen teklif ekle
3. API endpoint'ini çağır: `GET /api/automations/churn-prediction`
4. Riskli müşterileri kontrol et

**Beklenen Sonuç:**
- ✅ Riskli müşteriler listesi döner
- ✅ Her müşteri için: customerId, customerName, churnScore, inactiveDays, rejectedQuotes, riskLevel bilgileri bulunur
- ✅ Churn skoru > 10 olan müşteriler "HIGH" risk seviyesinde

**Test Verileri Hazırlama:**
```sql
-- 30 gün önce güncellenmiş müşteri
INSERT INTO "Customer" (name, status, "companyId", "updatedAt", "lastInteractionDate") 
VALUES ('Riskli Müşteri', 'ACTIVE', 'your-company-id', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days');

-- 5 reddedilen teklif
INSERT INTO "Quote" (title, status, total, "companyId", "customerId") 
VALUES 
  ('Teklif 1', 'DECLINED', 10000, 'your-company-id', 'customer-id'),
  ('Teklif 2', 'DECLINED', 15000, 'your-company-id', 'customer-id'),
  ('Teklif 3', 'DECLINED', 20000, 'your-company-id', 'customer-id'),
  ('Teklif 4', 'DECLINED', 12000, 'your-company-id', 'customer-id'),
  ('Teklif 5', 'DECLINED', 18000, 'your-company-id', 'customer-id');
```

**API Test:**
```bash
GET /api/automations/churn-prediction
```

**Beklenen Response:**
```json
{
  "message": "Risky customers found",
  "riskyCustomers": [
    {
      "customerId": "customer-id",
      "customerName": "Riskli Müşteri",
      "churnScore": 30.0,
      "inactiveDays": 30,
      "rejectedQuotes": 5,
      "riskLevel": "HIGH"
    }
  ],
  "count": 1
}
```

**Churn Skoru Hesaplama:**
- İnaktif günler: 30
- Reddedilen teklifler: 5
- Churn skoru: (30 * 0.5) + (5 * 1.5) = 15 + 7.5 = 22.5
- Risk seviyesi: HIGH (> 10)

---

## 🔟 Smart Re-Engagement Flow

### 📝 Açıklama
Müşteri 60 gün boyunca etkileşimsizse (hiç görüşme, teklif, fatura yoksa) uyarı ver.

### ✅ Test Senaryosu 1: Etkileşimsiz Müşterileri Bulma

**Adımlar:**
1. 70 gün önce güncellenmiş bir müşteri oluştur
2. Bu müşteriye son 60 günde hiç teklif, fatura, görüşme ekleme
3. API endpoint'ini çağır: `GET /api/automations/smart-re-engagement`
4. Etkileşimsiz müşterileri kontrol et

**Beklenen Sonuç:**
- ✅ Etkileşimsiz müşteriler listesi döner
- ✅ Her müşteri için: customerId, customerName, lastInteraction, daysSinceInteraction bilgileri bulunur
- ✅ hasRecentQuote, hasRecentInvoice, hasRecentMeeting false olmalı

**Test Verileri Hazırlama:**
```sql
-- 70 gün önce güncellenmiş müşteri
INSERT INTO "Customer" (name, status, "companyId", "updatedAt", "lastInteractionDate") 
VALUES ('Etkileşimsiz Müşteri', 'ACTIVE', 'your-company-id', NOW() - INTERVAL '70 days', NOW() - INTERVAL '70 days');
```

**API Test:**
```bash
GET /api/automations/smart-re-engagement
```

**Beklenen Response:**
```json
{
  "message": "1 müşteri 60 günden uzun süredir etkileşimsiz",
  "inactiveCustomers": [
    {
      "customerId": "customer-id",
      "customerName": "Etkileşimsiz Müşteri",
      "lastInteraction": "2024-11-01T00:00:00Z",
      "daysSinceInteraction": 70,
      "hasRecentQuote": false,
      "hasRecentInvoice": false,
      "hasRecentMeeting": false
    }
  ],
  "count": 1
}
```

---

## 1️⃣1️⃣ Auto-Priority Lead Sorting

### 📝 Açıklama
Yeni girilen fırsatlar (deal) sistemce puanlanır:
Formül: (teklif_tutarı × müşteri_skoru × olasılık) / gün_sayısı
En yüksek puanlı fırsatlar "Öncelikli" etiketiyle listenin üstüne taşınır.

### ✅ Test Senaryosu 1: Fırsat Puanlama

**Adımlar:**
1. Yüksek değerli bir fırsat oluştur (örn: 100000₺)
2. Bu fırsat için müşteriye ödenmiş faturalar ekle (müşteri skoru artar)
3. Fırsatın winProbability'sini yüksek yap (örn: 80)
4. API endpoint'ini çağır: `GET /api/automations/priority-lead-sorting`
5. Puanlanmış fırsatları kontrol et

**Beklenen Sonuç:**
- ✅ Puanlanmış fırsatlar listesi döner
- ✅ Her fırsat için: dealId, dealTitle, priorityScore, value, customerScore, winProbability, daysSinceCreation, isPriority bilgileri bulunur
- ✅ PriorityScore > 1000 olan fırsatlar isPriority = true

**Test Verileri Hazırlama:**
```sql
-- Yüksek değerli fırsat
INSERT INTO "Deal" (title, stage, value, status, "companyId", "winProbability", "customerId") 
VALUES ('Yüksek Değerli Fırsat', 'PROPOSAL', 100000, 'OPEN', 'your-company-id', 80, 'customer-id');

-- Müşteriye ödenmiş faturalar (müşteri skoru artar)
INSERT INTO "Invoice" (title, status, total, "companyId", "customerId") 
VALUES 
  ('Fatura 1', 'PAID', 50000, 'your-company-id', 'customer-id'),
  ('Fatura 2', 'PAID', 30000, 'your-company-id', 'customer-id');
```

**API Test:**
```bash
GET /api/automations/priority-lead-sorting
```

**Beklenen Response:**
```json
{
  "message": "Deals prioritized successfully",
  "prioritizedDeals": [
    {
      "dealId": "deal-id",
      "dealTitle": "Yüksek Değerli Fırsat",
      "priorityScore": 3200.0,
      "value": 100000,
      "customerScore": 8.0,
      "winProbability": 80,
      "daysSinceCreation": 1,
      "isPriority": true
    }
  ],
  "count": 1,
  "priorityCount": 1
}
```

**Priority Skoru Hesaplama:**
- Teklif tutarı: 100000₺
- Müşteri skoru: (50000 + 30000) / 10000 = 8.0
- Olasılık: 80%
- Gün sayısı: 1
- Priority skoru: (100000 * 8.0 * 0.8) / 1 = 64000 / 1 = 64000
- isPriority: true (> 1000)

---

## 📊 Genel Test Kontrol Listesi

### ✅ Tüm Otomasyonlar İçin Ortak Kontroller

1. **Migration Kontrolü**
   ```bash
   # Migration dosyasını çalıştır
   supabase db push
   ```

2. **API Endpoint Kontrolü**
   - ✅ Tüm API endpoint'leri çalışıyor mu?
   - ✅ Hata durumlarında uygun mesajlar dönüyor mu?
   - ✅ RLS (Row-Level Security) kontrolü yapılıyor mu?

3. **UI/UX Kontrolü**
   - ✅ Tüm component'ler doğru render ediliyor mu?
   - ✅ Loading state'ler gösteriliyor mu?
   - ✅ Error state'ler gösteriliyor mu?
   - ✅ Responsive tasarım çalışıyor mu?

4. **Performans Kontrolü**
   - ✅ API response süreleri < 1000ms mi?
   - ✅ Component render süreleri < 300ms mi?
   - ✅ Cache stratejisi çalışıyor mu?

5. **Güvenlik Kontrolü**
   - ✅ Session kontrolü yapılıyor mu?
   - ✅ CompanyId filtresi uygulanıyor mu?
   - ✅ Input validation yapılıyor mu?

---

## 🐛 Hata Ayıklama İpuçları

### Sorun: Migration çalışmıyor
**Çözüm:**
1. Migration dosyasını kontrol et: `supabase/migrations/020_automations_complete.sql`
2. Supabase CLI ile migration çalıştır: `supabase db push`
3. Hata mesajlarını kontrol et

### Sorun: API endpoint'leri çalışmıyor
**Çözüm:**
1. Browser console'u kontrol et (F12)
2. Network tab'ında API isteklerini kontrol et
3. Session kontrolü yap
4. CompanyId'nin doğru olduğundan emin ol

### Sorun: Component'ler render edilmiyor
**Çözüm:**
1. Browser console'da hata var mı kontrol et
2. Component import'larını kontrol et
3. Dynamic import'lar doğru mu kontrol et

---

## 📝 Migration Dosyası

Migration dosyası: `supabase/migrations/020_automations_complete.sql`

**Çalıştırma:**
```bash
# Supabase CLI ile
supabase db push

# Veya SQL Editor'de
# Dosya içeriğini kopyala-yapıştır
```

**Migration İçeriği:**
- User tablosuna monthlyGoal, preferredCurrency, lastSearchHistory kolonları
- Quote tablosuna expiryDate, priorityScore kolonları
- Deal tablosuna priorityScore, isPriority, quoteCreatedAt kolonları
- Customer tablosuna churnScore, riskLevel, lastInteractionDate, birthday, satisfactionScore kolonları
- Invoice tablosuna invoiceNumber, autoGeneratedFileName kolonları
- Task tablosuna escalated, escalatedAt kolonları
- Trigger'lar ve Function'lar
- View'lar (RiskyCustomers, PriorityDeals)
- Index'ler (performans için)

---

## 🎯 Sonuç

Bu test senaryoları ile tüm otomasyonların çalıştığından emin olabilirsiniz. Her senaryo adım adım takip edilerek sistemin doğru çalıştığı doğrulanabilir.

**Test Sırası:**
1. Önce migration dosyasını çalıştır
2. Smart Reminder'ı test et
3. QuickActions'ı test et
4. SmartEmptyState'i test et
5. AutoGoalTracker'ı test et
6. Diğer otomasyonları sırayla test et

**Başarı Kriterleri:**
- ✅ Migration başarıyla çalıştı
- ✅ Tüm API endpoint'leri 200 status code dönüyor
- ✅ Tüm UI component'leri doğru render ediliyor
- ✅ Tüm otomasyonlar beklenen şekilde çalışıyor
- ✅ Hata durumlarında uygun mesajlar gösteriliyor

---

## 📞 Destek

Herhangi bir sorun yaşarsanız:
1. Browser console'u kontrol edin (F12)
2. Network tab'ında API isteklerini kontrol edin
3. Veritabanı loglarını kontrol edin
4. Migration dosyasını tekrar çalıştırın









































