# 📊 RAPORLAR MODÜLÜ GELİŞTİRME PLANI

**Tarih:** 2024  
**Durum:** Mevcut Durum Analizi Tamamlandı - Geliştirme Planı Hazır

---

## 📋 MEVCUT DURUM ANALİZİ

### ✅ Çalışan Özellikler

#### 1. **Rapor Kategorileri (10 Kategori)**
- ✅ Satış Raporları (Sales) - 3 grafik
- ✅ Müşteri Raporları (Customers) - 3 grafik
- ✅ Fırsat Raporları (Deals) - 2 grafik
- ✅ Teklif Raporları (Quotes) - 2 grafik
- ✅ Fatura Raporları (Invoices) - 2 grafik
- ✅ Ürün Raporları (Products) - 2 grafik
- ✅ Finansal Raporlar (Financial) - 2 grafik
- ⚠️ Performans Raporları (Performance) - **BOŞ**
- ⚠️ Zaman Bazlı Raporlar (Time) - **BOŞ**
- ⚠️ Sektör Raporları (Sector) - **BOŞ**

#### 2. **Grafik Component'leri (15 Grafik)**
- ✅ MonthlySalesBarChart - Aylık satış trendi
- ✅ SalesByStatusPieChart - Satış durum dağılımı
- ✅ CustomerGrowthLineChart - Müşteri büyüme trendi
- ✅ CustomerSectorRadarChart - Sektör dağılımı
- ✅ CustomerCityBarChart - Şehir bazlı dağılım
- ✅ DealStageAreaChart - Fırsat aşama dağılımı
- ✅ DealValueComposedChart - Fırsat değer trendi
- ✅ QuoteStatusPieChart - Teklif durum dağılımı
- ✅ QuoteTrendLineChart - Teklif trend analizi
- ✅ InvoicePaymentBarChart - Ödeme durumu dağılımı
- ✅ InvoiceMonthlyAreaChart - Aylık fatura trendi
- ✅ ProductTopSellersBarChart - En çok satan ürünler
- ✅ ProductSalesScatterChart - Fiyat-performans analizi
- ✅ FinancialIncomeExpenseComposedChart - Gelir-gider karşılaştırması
- ✅ FinancialCategoryPieChart - Finansal kategori dağılımı

#### 3. **API Endpoint'leri (14 Endpoint)**
- ✅ `/api/reports` - Genel rapor listesi (ActivityLog bazlı)
- ✅ `/api/reports/categories` - Rapor kategorileri
- ✅ `/api/reports/sales` - Satış raporları
- ✅ `/api/reports/customers` - Müşteri raporları
- ✅ `/api/reports/deals` - Fırsat raporları
- ✅ `/api/reports/quotes` - Teklif raporları
- ✅ `/api/reports/invoices` - Fatura raporları
- ✅ `/api/reports/products` - Ürün raporları
- ✅ `/api/reports/financial` - Finansal raporlar
- ⚠️ `/api/reports/performance` - **BOŞ** (sadece boş veri döndürüyor)
- ⚠️ `/api/reports/time` - **BOŞ** (sadece boş veri döndürüyor)
- ⚠️ `/api/reports/sector` - **BOŞ** (sadece boş veri döndürüyor)
- ✅ `/api/reports/export` - Excel/CSV export (PDF yok)

#### 4. **UI Özellikleri**
- ✅ Tab-based navigation (10 kategori)
- ✅ Lazy loading (dynamic import)
- ✅ Skeleton loading states
- ✅ Error handling
- ✅ Responsive design
- ✅ Grafik açıklamaları

---

## ❌ EKSİKLER VE GELİŞTİRME ALANLARI

### 1. **Boş Rapor Kategorileri** 🔴 **YÜKSEK ÖNCELİK**

#### 1.1. Performans Raporları
**Mevcut Durum:** Boş component, boş API endpoint

**Geliştirme:**
- ✅ Kullanıcı performans metrikleri (satış, hedef gerçekleşme)
- ✅ Ekip performans karşılaştırması
- ✅ Aylık hedef vs gerçekleşme grafikleri
- ✅ En iyi performans gösteren kullanıcılar
- ✅ Performans trend analizi

**Grafikler:**
- UserPerformanceBarChart - Kullanıcı bazlı performans
- TeamPerformanceComparisonChart - Ekip karşılaştırması
- GoalAchievementLineChart - Hedef gerçekleşme trendi
- TopPerformersPieChart - En iyi performans gösterenler

#### 1.2. Zaman Bazlı Raporlar
**Mevcut Durum:** Boş component, boş API endpoint

**Geliştirme:**
- ✅ Günlük, haftalık, aylık, yıllık raporlar
- ✅ Tarih aralığı seçimi (date picker)
- ✅ Karşılaştırmalı raporlar (bu ay vs geçen ay)
- ✅ Trend analizi (büyüme/azalma yüzdeleri)
- ✅ Zaman bazlı KPI metrikleri

**Grafikler:**
- DailyTrendLineChart - Günlük trend
- WeeklyComparisonBarChart - Haftalık karşılaştırma
- MonthlyGrowthAreaChart - Aylık büyüme
- YearlySummaryComposedChart - Yıllık özet

#### 1.3. Sektör Raporları
**Mevcut Durum:** Boş component, boş API endpoint

**Geliştirme:**
- ✅ Sektör bazlı satış performansı
- ✅ Sektör karşılaştırması
- ✅ En karlı sektörler
- ✅ Sektör bazlı müşteri dağılımı
- ✅ Sektör trend analizi

**Grafikler:**
- SectorSalesRadarChart - Sektör satış karşılaştırması
- SectorProfitabilityBarChart - Sektör karlılık analizi
- SectorCustomerDistributionPieChart - Sektör müşteri dağılımı
- SectorTrendLineChart - Sektör trend analizi

---

### 2. **Filtreleme ve Arama** 🟡 **ORTA ÖNCELİK**

#### 2.1. Gelişmiş Filtreleme
**Mevcut Durum:** Sadece API'de tarih, kullanıcı, modül filtresi var, UI'da yok

**Geliştirme:**
- ✅ Tarih aralığı seçici (date range picker)
- ✅ Kullanıcı seçici (multi-select dropdown)
- ✅ Modül seçici (multi-select dropdown)
- ✅ Durum filtresi (status filter)
- ✅ Sektör filtresi (sector filter)
- ✅ Şehir filtresi (city filter)
- ✅ Filtre kaydetme (saved filters)

**UI Component:**
```typescript
<ReportFilters
  onFilterChange={(filters) => {...}}
  savedFilters={savedFilters}
/>
```

#### 2.2. Arama Özelliği
**Mevcut Durum:** Yok

**Geliştirme:**
- ✅ Rapor içinde arama (description, entity, action)
- ✅ Hızlı arama (quick search)
- ✅ Gelişmiş arama (advanced search)

---

### 3. **Export ve Paylaşım** 🟡 **ORTA ÖNCELİK**

#### 3.1. PDF Export
**Mevcut Durum:** Sadece Excel/CSV var, PDF yok

**Geliştirme:**
- ✅ PDF export (tüm raporlar için)
- ✅ PDF şablonları (customizable templates)
- ✅ PDF'de grafikler (chart to image conversion)
- ✅ PDF'de tablolar (data tables)
- ✅ PDF branding (logo, header, footer)

**Teknoloji:** `@react-pdf/renderer` veya `puppeteer`

#### 3.2. Rapor Paylaşımı
**Mevcut Durum:** Yok

**Geliştirme:**
- ✅ Email ile rapor gönderme
- ✅ Rapor linki oluşturma (shareable links)
- ✅ Rapor indirme linki (download links)
- ✅ Rapor zamanlama (scheduled reports)

---

### 4. **Rapor Yönetimi** 🟢 **DÜŞÜK ÖNCELİK**

#### 4.1. Özel Rapor Oluşturma
**Mevcut Durum:** Yok

**Geliştirme:**
- ✅ Özel rapor builder (drag & drop)
- ✅ Grafik seçimi (chart selection)
- ✅ Veri kaynağı seçimi (data source selection)
- ✅ Filtre tanımlama (filter definition)
- ✅ Rapor şablonları (report templates)

#### 4.2. Rapor Kaydetme
**Mevcut Durum:** Yok

**Geliştirme:**
- ✅ Rapor kaydetme (save reports)
- ✅ Rapor listesi (saved reports list)
- ✅ Rapor düzenleme (edit saved reports)
- ✅ Rapor silme (delete saved reports)
- ✅ Rapor kategorilendirme (report categorization)

**Database:**
```sql
CREATE TABLE "SavedReport" (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  filters JSONB,
  charts JSONB,
  "createdBy" UUID REFERENCES "User"(id),
  "companyId" UUID REFERENCES "Company"(id),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
```

#### 4.3. Rapor Şablonları
**Mevcut Durum:** Yok

**Geliştirme:**
- ✅ Hazır rapor şablonları (pre-built templates)
- ✅ Şablon kategorileri (template categories)
- ✅ Şablon özelleştirme (template customization)
- ✅ Şablon paylaşımı (template sharing)

---

### 5. **Gelişmiş Analizler** 🟡 **ORTA ÖNCELİK**

#### 5.1. Karşılaştırmalı Raporlar
**Mevcut Durum:** Yok

**Geliştirme:**
- ✅ Dönem karşılaştırması (bu ay vs geçen ay)
- ✅ Yıl karşılaştırması (bu yıl vs geçen yıl)
- ✅ Kullanıcı karşılaştırması (user comparison)
- ✅ Sektör karşılaştırması (sector comparison)
- ✅ Trend analizi (growth/decline percentages)

#### 5.2. KPI Metrikleri
**Mevcut Durum:** Sadece grafikler var, detaylı KPI yok

**Geliştirme:**
- ✅ KPI kartları (KPI cards)
- ✅ KPI hesaplama (KPI calculations)
- ✅ KPI trendleri (KPI trends)
- ✅ KPI hedefleri (KPI targets)
- ✅ KPI uyarıları (KPI alerts)

**KPI Metrikleri:**
- Toplam Satış (Total Sales)
- Ortalama Sipariş Değeri (Average Order Value)
- Müşteri Kazanma Oranı (Customer Acquisition Rate)
- Müşteri Kaybetme Oranı (Churn Rate)
- Fırsat Kazanma Oranı (Win Rate)
- Teklif Kabul Oranı (Quote Acceptance Rate)
- Ortalama Satış Döngüsü (Average Sales Cycle)
- Karlılık Oranı (Profit Margin)

#### 5.3. Tahminleme ve Projeksiyon
**Mevcut Durum:** Yok

**Geliştirme:**
- ✅ Satış tahmini (sales forecast)
- ✅ Trend projeksiyonu (trend projection)
- ✅ Büyüme tahmini (growth forecast)
- ✅ Risk analizi (risk analysis)

**Teknoloji:** Basit lineer regresyon veya ML modeli

---

### 6. **Performans Optimizasyonu** 🟡 **ORTA ÖNCELİK**

#### 6.1. Cache Stratejisi
**Mevcut Durum:** `no-store` cache, her seferinde fresh data

**Geliştirme:**
- ✅ SWR cache kullanımı (client-side)
- ✅ ISR (Incremental Static Regeneration)
- ✅ Cache invalidation (smart cache)
- ✅ Background data refresh

#### 6.2. Veri Optimizasyonu
**Mevcut Durum:** Limit 1000 kayıt, tüm veriler çekiliyor

**Geliştirme:**
- ✅ Pagination (sayfalama)
- ✅ Lazy loading (ihtiyaç duyuldukça yükleme)
- ✅ Veri ön işleme (data preprocessing)
- ✅ Aggregation queries (toplu sorgular)

#### 6.3. Grafik Optimizasyonu
**Mevcut Durum:** Tüm grafikler lazy load, ama hala yavaş olabilir

**Geliştirme:**
- ✅ Grafik veri önbellekleme (chart data caching)
- ✅ Grafik virtual scrolling (büyük veri setleri için)
- ✅ Grafik veri örnekleme (data sampling)

---

### 7. **Kullanıcı Deneyimi** 🟢 **DÜŞÜK ÖNCELİK**

#### 7.1. Rapor Özelleştirme
**Mevcut Durum:** Sabit grafikler, özelleştirme yok

**Geliştirme:**
- ✅ Grafik tipi seçimi (chart type selection)
- ✅ Renk özelleştirme (color customization)
- ✅ Grafik boyutu ayarlama (chart size adjustment)
- ✅ Grafik sıralama (chart reordering)

#### 7.2. Dashboard Entegrasyonu
**Mevcut Durum:** Raporlar ayrı sayfa, dashboard'da yok

**Geliştirme:**
- ✅ Dashboard'a rapor widget'ları ekleme
- ✅ Hızlı rapor erişimi (quick report access)
- ✅ Rapor bildirimleri (report notifications)

#### 7.3. Mobil Uyumluluk
**Mevcut Durum:** Responsive ama mobilde grafikler küçük

**Geliştirme:**
- ✅ Mobil grafik optimizasyonu
- ✅ Touch gestures (dokunma hareketleri)
- ✅ Mobil rapor görünümü

---

## 🎯 GELİŞTİRME PLANI (ÖNCELİK SIRASI)

### **FAZE 1: Boş Raporları Doldur** 🔴 **YÜKSEK ÖNCELİK** (1-2 Hafta)

#### 1.1. Performans Raporları
- [ ] API endpoint geliştirme (`/api/reports/performance`)
- [ ] Kullanıcı performans metrikleri hesaplama
- [ ] Ekip performans karşılaştırması
- [ ] Grafik component'leri (4 grafik)
- [ ] UI component güncelleme

**Süre:** 3-4 gün

#### 1.2. Zaman Bazlı Raporlar
- [ ] API endpoint geliştirme (`/api/reports/time`)
- [ ] Günlük, haftalık, aylık, yıllık veri hesaplama
- [ ] Tarih aralığı filtreleme
- [ ] Grafik component'leri (4 grafik)
- [ ] UI component güncelleme

**Süre:** 3-4 gün

#### 1.3. Sektör Raporları
- [ ] API endpoint geliştirme (`/api/reports/sector`)
- [ ] Sektör bazlı analiz hesaplama
- [ ] Sektör karşılaştırması
- [ ] Grafik component'leri (4 grafik)
- [ ] UI component güncelleme

**Süre:** 3-4 gün

---

### **FAZE 2: Filtreleme ve Export** 🟡 **ORTA ÖNCELİK** (1 Hafta)

#### 2.1. Gelişmiş Filtreleme
- [ ] Filtre UI component'i oluşturma
- [ ] Tarih aralığı seçici (date range picker)
- [ ] Multi-select dropdown'lar
- [ ] Filtre kaydetme/yükleme
- [ ] API endpoint'lerine filtre entegrasyonu

**Süre:** 2-3 gün

#### 2.2. PDF Export
- [ ] PDF generator kurulumu (`@react-pdf/renderer`)
- [ ] PDF şablonları oluşturma
- [ ] Grafik to image conversion
- [ ] PDF export API endpoint
- [ ] UI'da PDF export butonu

**Süre:** 2-3 gün

---

### **FAZE 3: Rapor Yönetimi** 🟢 **DÜŞÜK ÖNCELİK** (2 Hafta)

#### 3.1. Rapor Kaydetme
- [ ] Database migration (SavedReport table)
- [ ] API endpoint'leri (CRUD)
- [ ] UI component'leri (save, load, delete)
- [ ] Rapor listesi sayfası

**Süre:** 3-4 gün

#### 3.2. Özel Rapor Oluşturma
- [ ] Rapor builder UI (drag & drop)
- [ ] Grafik seçimi ve konfigürasyonu
- [ ] Veri kaynağı seçimi
- [ ] Filtre tanımlama
- [ ] Rapor önizleme

**Süre:** 5-7 gün

---

### **FAZE 4: Gelişmiş Analizler** 🟡 **ORTA ÖNCELİK** (1-2 Hafta)

#### 4.1. Karşılaştırmalı Raporlar
- [ ] Dönem karşılaştırması API'leri
- [ ] Karşılaştırma grafikleri
- [ ] Trend analizi hesaplamaları
- [ ] UI component'leri

**Süre:** 3-4 gün

#### 4.2. KPI Metrikleri
- [ ] KPI hesaplama fonksiyonları
- [ ] KPI kartları component'leri
- [ ] KPI trend grafikleri
- [ ] KPI hedef takibi

**Süre:** 3-4 gün

---

### **FAZE 5: Performans ve UX** 🟢 **DÜŞÜK ÖNCELİK** (1 Hafta)

#### 5.1. Performans Optimizasyonu
- [ ] SWR cache entegrasyonu
- [ ] ISR implementasyonu
- [ ] Veri pagination
- [ ] Grafik optimizasyonu

**Süre:** 2-3 gün

#### 5.2. Kullanıcı Deneyimi
- [ ] Rapor özelleştirme UI
- [ ] Dashboard entegrasyonu
- [ ] Mobil optimizasyon

**Süre:** 2-3 gün

---

## 📊 DETAYLI GELİŞTİRME ADIMLARI

### **FAZE 1.1: Performans Raporları**

#### API Endpoint: `/api/reports/performance/route.ts`

**Veri Kaynakları:**
- `User` tablosu (monthlyGoal, performance metrics)
- `Deal` tablosu (kullanıcı bazlı satış)
- `Invoice` tablosu (kullanıcı bazlı gelir)
- `ActivityLog` tablosu (kullanıcı aktiviteleri)

**Hesaplanacak Metrikler:**
1. **Kullanıcı Performansı:**
   - Toplam satış (total sales)
   - Hedef gerçekleşme oranı (goal achievement rate)
   - Ortalama sipariş değeri (average order value)
   - Fırsat kazanma oranı (win rate)

2. **Ekip Performansı:**
   - Ekip toplam satışı
   - Ekip hedef gerçekleşme oranı
   - Kullanıcı bazlı karşılaştırma

3. **Trend Analizi:**
   - Aylık performans trendi
   - Büyüme/azalma yüzdeleri

**Grafikler:**
1. `UserPerformanceBarChart` - Kullanıcı bazlı performans karşılaştırması
2. `TeamPerformanceComparisonChart` - Ekip performans karşılaştırması
3. `GoalAchievementLineChart` - Hedef gerçekleşme trendi
4. `TopPerformersPieChart` - En iyi performans gösteren kullanıcılar

---

### **FAZE 1.2: Zaman Bazlı Raporlar**

#### API Endpoint: `/api/reports/time/route.ts`

**Veri Kaynakları:**
- Tüm modüller (Deal, Invoice, Quote, Customer, vb.)
- Tarih bazlı gruplama

**Hesaplanacak Metrikler:**
1. **Günlük Raporlar:**
   - Günlük satış trendi
   - Günlük müşteri ekleme
   - Günlük fırsat oluşturma

2. **Haftalık Raporlar:**
   - Haftalık satış karşılaştırması
   - Haftalık trend analizi

3. **Aylık Raporlar:**
   - Aylık büyüme yüzdeleri
   - Aylık karşılaştırmalar

4. **Yıllık Raporlar:**
   - Yıllık özet
   - Yıl bazlı karşılaştırma

**Grafikler:**
1. `DailyTrendLineChart` - Günlük trend
2. `WeeklyComparisonBarChart` - Haftalık karşılaştırma
3. `MonthlyGrowthAreaChart` - Aylık büyüme
4. `YearlySummaryComposedChart` - Yıllık özet

---

### **FAZE 1.3: Sektör Raporları**

#### API Endpoint: `/api/reports/sector/route.ts`

**Veri Kaynakları:**
- `Customer` tablosu (sector field)
- `Deal` tablosu (customer üzerinden sektör)
- `Invoice` tablosu (customer üzerinden sektör)

**Hesaplanacak Metrikler:**
1. **Sektör Bazlı Satış:**
   - Sektör bazlı toplam satış
   - Sektör bazlı ortalama sipariş değeri
   - Sektör bazlı müşteri sayısı

2. **Sektör Karşılaştırması:**
   - Sektörler arası satış karşılaştırması
   - Sektörler arası karlılık karşılaştırması

3. **Sektör Trend Analizi:**
   - Sektör bazlı büyüme trendi
   - Sektör bazlı müşteri kazanma trendi

**Grafikler:**
1. `SectorSalesRadarChart` - Sektör satış karşılaştırması
2. `SectorProfitabilityBarChart` - Sektör karlılık analizi
3. `SectorCustomerDistributionPieChart` - Sektör müşteri dağılımı
4. `SectorTrendLineChart` - Sektör trend analizi

---

## 🛠️ TEKNİK DETAYLAR

### **Yeni Component'ler**

#### 1. ReportFilters Component
```typescript
interface ReportFiltersProps {
  onFilterChange: (filters: ReportFilters) => void
  savedFilters?: SavedFilter[]
}

interface ReportFilters {
  dateRange: { start: string; end: string }
  users: string[]
  modules: string[]
  status?: string
  sector?: string
  city?: string
}
```

#### 2. SavedReportList Component
```typescript
interface SavedReport {
  id: string
  name: string
  description?: string
  category: string
  filters: ReportFilters
  charts: string[]
  createdAt: string
  updatedAt: string
}
```

#### 3. ReportBuilder Component
```typescript
interface ReportBuilderProps {
  onSave: (report: SavedReport) => void
  initialReport?: SavedReport
}
```

---

### **Yeni API Endpoint'leri**

#### 1. `/api/reports/saved` - Saved Reports CRUD
- GET: Tüm kayıtlı raporları listele
- POST: Yeni rapor kaydet
- PUT: Rapor güncelle
- DELETE: Rapor sil

#### 2. `/api/reports/saved/[id]` - Tekil Saved Report
- GET: Rapor detayı
- PUT: Rapor güncelle
- DELETE: Rapor sil

#### 3. `/api/reports/export/pdf` - PDF Export
- POST: PDF oluştur ve döndür

#### 4. `/api/reports/share` - Rapor Paylaşımı
- POST: Paylaşılabilir link oluştur
- GET: Paylaşılan raporu görüntüle

---

### **Database Migration**

#### SavedReport Table
```sql
CREATE TABLE "SavedReport" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  filters JSONB NOT NULL,
  charts JSONB NOT NULL,
  "createdBy" UUID REFERENCES "User"(id) ON DELETE CASCADE,
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_savedreport_company ON "SavedReport"("companyId");
CREATE INDEX idx_savedreport_createdby ON "SavedReport"("createdBy");
CREATE INDEX idx_savedreport_category ON "SavedReport"("category");
```

#### SavedFilter Table (Opsiyonel)
```sql
CREATE TABLE "SavedFilter" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  filters JSONB NOT NULL,
  "createdBy" UUID REFERENCES "User"(id) ON DELETE CASCADE,
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_savedfilter_company ON "SavedFilter"("companyId");
CREATE INDEX idx_savedfilter_createdby ON "SavedFilter"("createdBy");
```

---

## 📈 BAŞARI KRİTERLERİ

### **Performans Hedefleri**
- ✅ Rapor sayfası yükleme: <500ms
- ✅ Grafik render: <300ms
- ✅ API response: <200ms (cache hit), <1000ms (cache miss)
- ✅ PDF export: <5 saniye

### **Kullanılabilirlik Hedefleri**
- ✅ Tüm rapor kategorileri dolu
- ✅ Filtreleme çalışıyor
- ✅ Export çalışıyor (Excel, CSV, PDF)
- ✅ Mobil uyumlu

### **Özellik Hedefleri**
- ✅ 10 rapor kategorisi tam çalışır
- ✅ 20+ grafik component
- ✅ Rapor kaydetme/yükleme
- ✅ PDF export
- ✅ Gelişmiş filtreleme

---

## 🚀 UYGULAMA SIRASI

### **Öncelik 1: Boş Raporları Doldur** (1-2 Hafta)
1. Performans Raporları
2. Zaman Bazlı Raporlar
3. Sektör Raporları

### **Öncelik 2: Filtreleme ve Export** (1 Hafta)
1. Gelişmiş Filtreleme UI
2. PDF Export

### **Öncelik 3: Rapor Yönetimi** (2 Hafta)
1. Rapor Kaydetme
2. Özel Rapor Oluşturma

### **Öncelik 4: Gelişmiş Analizler** (1-2 Hafta)
1. Karşılaştırmalı Raporlar
2. KPI Metrikleri

### **Öncelik 5: Performans ve UX** (1 Hafta)
1. Performans Optimizasyonu
2. Kullanıcı Deneyimi İyileştirmeleri

---

## 📝 NOTLAR

- Tüm geliştirmeler repo kurallarına uygun olmalı (SWR cache, optimistic updates, vb.)
- Tüm grafikler Recharts kullanmalı
- Tüm component'ler lazy load olmalı
- Tüm API endpoint'leri RLS kontrolü yapmalı
- Tüm metinler locale desteği olmalı (TR/EN)

---

**Toplam Süre Tahmini:** 6-8 Hafta  
**Toplam Geliştirici Günü:** 30-40 Gün










