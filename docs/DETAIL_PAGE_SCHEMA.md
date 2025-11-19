# 📋 Detay Sayfası Şema Sistemi - QuickBooks Tarzı

**Tarih:** 2024  
**Durum:** ✅ Standart Şema Oluşturuldu  
**Amaç:** Tüm modül detay sayfalarında tutarlı, okunabilir, işlem yapması kolay yapı

---

## 🎯 AMAÇ

QuickBooks tarzı **tek bir şema** ile tüm modül detay sayfalarını standartlaştırmak:
- ✅ **Okunabilir**: Net bilgi hiyerarşisi
- ✅ **İşlem Kolay**: Hızlı erişim butonları
- ✅ **Takip Kolay**: Tab-based navigation
- ✅ **Tutarlı**: Tüm sayfalarda aynı yapı

---

## 📐 ŞEMA YAPISI

### 1. Hero Section (Üst Bölüm)
```
┌─────────────────────────────────────────┐
│ [←]  [Logo/Icon]  Başlık  [Badge]      │
│                    Alt Başlık           │
│                    [Düzenle] [Sil]      │
└─────────────────────────────────────────┘
```

**Özellikler:**
- Gradient arka plan (indigo → purple → pink)
- Logo/Icon gösterimi
- Başlık + alt başlık
- Badge (status, priority, vb.)
- Quick action butonları (Düzenle, Sil)

### 2. Overview Cards (Özet Kartlar)
```
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│ KPI1 │ │ KPI2 │ │ KPI3 │ │ KPI4 │
└──────┘ └──────┘ └──────┘ └──────┘
```

**Özellikler:**
- 4 sütun grid (responsive)
- KPI değerleri
- Trend göstergesi (↑↓)
- Hover animasyonu

### 3. Related Records (İlişkili Kayıtlar)
```
┌─────────────────────────────────────────┐
│ İlişkili Kayıtlar (6)  [+ Yeni] [Tümü]│
│ ┌────┐ ┌────┐ ┌────┐                  │
│ │Kart│ │Kart│ │Kart│                  │
│ └────┘ └────┘ └────┘                  │
└─────────────────────────────────────────┘
```

**Özellikler:**
- Mini kart görünümü (3 sütun)
- Hızlı erişim linkleri
- "Yeni Oluştur" butonu
- "Tümünü Gör" butonu

### 4. Tab Navigation (Sekme Navigasyonu)
```
┌─────────────────────────────────────────┐
│ [Genel] [İlişkili] [Aktivite] [Dosyalar]│
├─────────────────────────────────────────┤
│                                         │
│         Tab İçeriği                     │
│                                         │
└─────────────────────────────────────────┘
```

**Standart Tab'lar:**
- **Genel Bakış**: Temel bilgiler, form alanları
- **İlişkili Kayıtlar**: Deals, Quotes, Invoices, vb.
- **Aktivite**: ActivityTimeline
- **Dosyalar**: DocumentList, FileUpload

---

## 🛠️ KULLANIM

### Component: `DetailPageLayout`

```typescript
import DetailPageLayout from '@/components/layout/DetailPageLayout'
import OverviewCard from '@/components/layout/OverviewCard'
import RelatedRecordsSection from '@/components/layout/RelatedRecordsSection'
import { Building2, Users, DollarSign } from 'lucide-react'

export default function CustomerDetailPage() {
  const { data: customer } = useData(`/api/customers/${id}`)
  
  return (
    <DetailPageLayout
      // Hero Section
      title={customer.name}
      subtitle="Müşteri Detayları"
      icon={<Building2 className="h-10 w-10 text-white" />}
      imageUrl={customer.logoUrl}
      badge={<Badge>{customer.status}</Badge>}
      backUrl={`/${locale}/customers`}
      
      // Quick Actions
      onEdit={() => setFormOpen(true)}
      onDelete={handleDelete}
      
      // Overview Cards
      overviewCards={
        <>
          <OverviewCard
            title="Toplam Fırsat"
            value={customer.dealsCount}
            icon={Briefcase}
            trend={{ value: 12, isPositive: true }}
          />
          <OverviewCard
            title="Toplam Gelir"
            value={formatCurrency(customer.totalRevenue)}
            icon={DollarSign}
          />
          <OverviewCard
            title="Aktif Teklifler"
            value={customer.quotesCount}
            icon={FileText}
          />
          <OverviewCard
            title="Toplam Fatura"
            value={customer.invoicesCount}
            icon={Receipt}
          />
        </>
      }
      
      // Related Records
      relatedRecords={
        <RelatedRecordsSection
          title="Fırsatlar"
          icon={Briefcase}
          records={customer.deals.map(deal => ({
            id: deal.id,
            title: deal.title,
            status: deal.stage,
            amount: deal.value,
            href: `/deals/${deal.id}`
          }))}
          onCreateNew={() => setDealFormOpen(true)}
          viewAllUrl={`/${locale}/deals?customerId=${id}`}
        />
      }
      
      // Tabs
      tabs={[
        {
          id: 'overview',
          label: 'Genel Bakış',
          icon: <Info className="h-4 w-4" />,
          content: (
            <div className="space-y-4">
              {/* Form alanları */}
              <Card>...</Card>
            </div>
          )
        },
        {
          id: 'related',
          label: 'İlişkili Kayıtlar',
          icon: <Link className="h-4 w-4" />,
          content: (
            <div className="space-y-4">
              <RelatedRecordsSection ... />
            </div>
          )
        },
        {
          id: 'activity',
          label: 'Aktivite',
          icon: <Activity className="h-4 w-4" />,
          content: <ActivityTimeline entityType="customer" entityId={id} />
        },
        {
          id: 'documents',
          label: 'Dosyalar',
          icon: <FileText className="h-4 w-4" />,
          content: <DocumentList entityType="customer" entityId={id} />
        }
      ]}
    />
  )
}
```

---

## 📋 STANDART TAB İÇERİKLERİ

### 1. Overview Tab (Genel Bakış)
- Form alanları (read-only veya editable)
- Temel bilgiler
- İstatistikler
- Notlar/Yorumlar

### 2. Related Records Tab (İlişkili Kayıtlar)
- RelatedRecordsSection component'leri
- Her modül için ilgili kayıtlar
- Hızlı erişim linkleri

### 3. Activity Tab (Aktivite)
- ActivityTimeline component
- Filtreleme seçenekleri
- Detaylı log görünümü

### 4. Documents Tab (Dosyalar)
- DocumentList component
- FileUpload component
- Dosya yönetimi

---

## ✅ UYGULAMA ADIMLARI

### 1. Mevcut Sayfaları Güncelle
Tüm detay sayfalarını `DetailPageLayout` kullanacak şekilde güncelle:

- [ ] `src/app/[locale]/customers/[id]/page.tsx`
- [ ] `src/app/[locale]/deals/[id]/page.tsx`
- [ ] `src/app/[locale]/quotes/[id]/page.tsx`
- [ ] `src/app/[locale]/invoices/[id]/page.tsx`
- [ ] `src/app/[locale]/products/[id]/page.tsx`
- [ ] `src/app/[locale]/shipments/[id]/page.tsx`
- [ ] `src/app/[locale]/tickets/[id]/page.tsx`
- [ ] `src/app/[locale]/tasks/[id]/page.tsx`

### 2. Overview Cards Ekle
Her modül için uygun KPI kartları ekle:
- Toplam sayılar
- Trend göstergeleri
- Önemli metrikler

### 3. Related Records Ekle
Her modül için ilişkili kayıtlar bölümü ekle:
- Customer → Deals, Quotes, Invoices
- Deal → Quotes, Contracts, Meetings
- Invoice → Shipments, Finance

### 4. Tab Yapısını Standartlaştır
Tüm sayfalarda aynı tab yapısını kullan:
- Overview
- Related Records
- Activity
- Documents

---

## 🎨 TASARIM ÖZELLİKLERİ

### Renkler
- **Primary**: Indigo-600 (#6366f1)
- **Secondary**: Purple-600 (#8b5cf6)
- **Accent**: Pink-600 (#ec4899)
- **Background**: Gradient (indigo → purple → pink)

### Animasyonlar
- Hero section: Fade in + slide down
- Overview cards: Hover scale + lift
- Related records: Staggered fade in
- Tab transitions: Smooth fade

### Spacing
- Section gap: `space-y-6`
- Card padding: `p-4` veya `p-6`
- Grid gap: `gap-4`

---

## 📊 ÖRNEK SAYFA YAPISI

```
DetailPageLayout
├── Hero Section
│   ├── Back Button
│   ├── Logo/Icon
│   ├── Title + Badge
│   ├── Subtitle
│   └── Quick Actions (Edit, Delete)
│
├── Overview Cards (4 sütun)
│   ├── KPI Card 1
│   ├── KPI Card 2
│   ├── KPI Card 3
│   └── KPI Card 4
│
├── Related Records Section
│   └── Mini Cards (3 sütun, max 6)
│
└── Tabs
    ├── Overview Tab
    ├── Related Records Tab
    ├── Activity Tab
    └── Documents Tab
```

---

## ✅ AVANTAJLAR

1. **Tutarlılık**: Tüm sayfalarda aynı yapı
2. **Okunabilirlik**: Net bilgi hiyerarşisi
3. **Kullanılabilirlik**: Hızlı erişim butonları
4. **Bakım Kolaylığı**: Tek component, tüm sayfalar
5. **Performans**: Lazy loading, optimized rendering
6. **Responsive**: Mobile-first yaklaşım

---

## 🚀 SONRAKI ADIMLAR

1. ✅ DetailPageLayout component oluşturuldu
2. ✅ OverviewCard component oluşturuldu
3. ✅ RelatedRecordsSection component oluşturuldu
4. ⏳ Customer detail sayfasını güncelle
5. ⏳ Deal detail sayfasını güncelle
6. ⏳ Diğer modül sayfalarını güncelle
7. ⏳ Dokümantasyon güncelle

---

**ÖNEMLİ**: Tüm yeni detay sayfaları bu şemayı kullanmalı! 🎯


