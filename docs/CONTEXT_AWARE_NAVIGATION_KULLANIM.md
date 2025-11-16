# 📱 Context-Aware Navigation & Workflow Breadcrumb Kullanım Kılavuzu

## 🎯 Özellikler

### 1. Context-Aware Navigation (Akıllı Menü)
- ✅ Rol bazlı menü önceliklendirme
- ✅ High priority modüller üstte gösterilir
- ✅ Badge desteği (bildirim sayısı)
- ✅ Multi-tenant güvenli

### 2. Workflow Breadcrumb
- ✅ İlişkili kayıtları gösterir
- ✅ Workflow adımlarını görselleştirir
- ✅ Tıklanabilir breadcrumb linkleri
- ✅ Durum göstergeleri (completed, active, pending)

---

## 📋 Kullanım Örnekleri

### 1. Workflow Breadcrumb Kullanımı

#### Customer Detay Sayfası

```typescript
// app/[locale]/customers/[id]/page.tsx
'use client'

import { useWorkflowBreadcrumb } from '@/hooks/useWorkflowBreadcrumb'
import WorkflowBreadcrumb from '@/components/layout/WorkflowBreadcrumb'

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const steps = useWorkflowBreadcrumb({
    customerId: params.id,
  })

  return (
    <div>
      {/* Workflow Breadcrumb */}
      <WorkflowBreadcrumb steps={steps} className="mb-6" />
      
      {/* Sayfa içeriği */}
      <div>...</div>
    </div>
  )
}
```

#### Deal Detay Sayfası

```typescript
// app/[locale]/deals/[id]/page.tsx
'use client'

import { useWorkflowBreadcrumb } from '@/hooks/useWorkflowBreadcrumb'
import WorkflowBreadcrumb from '@/components/layout/WorkflowBreadcrumb'

export default function DealDetailPage({ params }: { params: { id: string } }) {
  const steps = useWorkflowBreadcrumb({
    dealId: params.id,
  })

  return (
    <div>
      <WorkflowBreadcrumb steps={steps} className="mb-6" />
      {/* ... */}
    </div>
  )
}
```

#### Quote Detay Sayfası

```typescript
// app/[locale]/quotes/[id]/page.tsx
'use client'

import { useWorkflowBreadcrumb } from '@/hooks/useWorkflowBreadcrumb'
import WorkflowBreadcrumb from '@/components/layout/WorkflowBreadcrumb'

export default function QuoteDetailPage({ params }: { params: { id: string } }) {
  const steps = useWorkflowBreadcrumb({
    quoteId: params.id,
  })

  return (
    <div>
      <WorkflowBreadcrumb steps={steps} className="mb-6" />
      {/* ... */}
    </div>
  )
}
```

#### Invoice Detay Sayfası

```typescript
// app/[locale]/invoices/[id]/page.tsx
'use client'

import { useWorkflowBreadcrumb } from '@/hooks/useWorkflowBreadcrumb'
import WorkflowBreadcrumb from '@/components/layout/WorkflowBreadcrumb'

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const steps = useWorkflowBreadcrumb({
    invoiceId: params.id,
  })

  return (
    <div>
      <WorkflowBreadcrumb steps={steps} className="mb-6" />
      {/* ... */}
    </div>
  )
}
```

---

### 2. Manuel Workflow Oluşturma

Eğer otomatik tespit yeterli değilse, manuel olarak workflow oluşturabilirsiniz:

```typescript
import { getCustomerWorkflow, getDealWorkflow } from '@/lib/workflows'
import WorkflowBreadcrumb from '@/components/layout/WorkflowBreadcrumb'

// Customer workflow
const customerSteps = getCustomerWorkflow(
  customerId,
  customerName,
  dealId,      // opsiyonel
  quoteId,     // opsiyonel
  invoiceId    // opsiyonel
)

// Deal workflow
const dealSteps = getDealWorkflow(
  customerId,
  customerName,
  dealId,
  dealName,
  quoteId,     // opsiyonel
  invoiceId    // opsiyonel
)

// Component'te kullan
<WorkflowBreadcrumb steps={customerSteps} />
```

---

### 3. Context-Aware Navigation (Otomatik)

Sidebar otomatik olarak rol bazlı önceliklendirme yapar:

#### SALES Rolü İçin:
- **High Priority:** Customers, Deals, Quotes, Meetings
- **Medium Priority:** Invoices, Products, Tasks
- **Low Priority:** Shipments

#### ADMIN Rolü İçin:
- **High Priority:** Dashboard, Customers, Deals, Quotes, Invoices, Finance, Reports, Users
- **Medium Priority:** Settings

#### USER Rolü İçin:
- **High Priority:** Dashboard, Tasks, Tickets
- **Medium Priority:** Customers, Deals, Quotes, Invoices

---

### 4. Badge Ekleme (Bildirim Sayısı)

Sidebar'a badge eklemek için `SidebarItem` interface'ine `badge` property'si ekleyin:

```typescript
// components/layout/Sidebar.tsx
const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    key: 'sales',
    title: 'Satış',
    items: [
      {
        href: '/deals',
        label: 'Fırsatlar',
        icon: Briefcase,
        module: 'deal',
        badge: 5, // Bildirim sayısı
        priority: 'high',
      },
    ],
  },
]
```

---

## 🎨 Görsel Özellikler

### Workflow Breadcrumb Durumları

1. **Completed (Tamamlandı):**
   - ✅ Yeşil renk
   - CheckCircle ikonu
   - Tıklanabilir link

2. **Active (Aktif):**
   - 🔵 Mavi renk (indigo-500)
   - Loader ikonu (animasyonlu)
   - Tıklanabilir link

3. **Pending (Beklemede):**
   - ⚪ Gri renk
   - Circle ikonu
   - Link yok

---

## 🔧 Özelleştirme

### Workflow Fonksiyonlarını Özelleştirme

`src/lib/workflows.ts` dosyasında workflow fonksiyonlarını özelleştirebilirsiniz:

```typescript
// Yeni workflow ekleme
export function getCustomWorkflow(...): WorkflowStep[] {
  return [
    {
      module: 'custom',
      label: 'Özel Adım',
      href: '/custom',
      status: 'active',
    },
  ]
}
```

### Rol Bazlı Önceliklendirme Özelleştirme

`getMenuPriorityByRole` fonksiyonunu özelleştirin:

```typescript
export function getMenuPriorityByRole(role: string) {
  if (role === 'CUSTOM_ROLE') {
    return {
      customModule: 'high',
      // ...
    }
  }
  // ...
}
```

---

## 📊 Performans

- ✅ SWR cache kullanılıyor (60 saniye)
- ✅ Debounced API çağrıları
- ✅ Multi-tenant güvenli (companyId kontrolü)
- ✅ Optimistic updates

---

## ✅ Checklist

### Workflow Breadcrumb Eklemek İçin:
- [ ] `useWorkflowBreadcrumb` hook'unu import et
- [ ] İlgili ID'leri parametre olarak geç
- [ ] `WorkflowBreadcrumb` component'ini render et
- [ ] Stil ekle (className ile)

### Context-Aware Navigation İçin:
- [ ] Sidebar otomatik çalışıyor (değişiklik gerekmez)
- [ ] Rol bazlı önceliklendirme aktif
- [ ] Badge eklemek istersen `badge` property'si ekle

---

## 🐛 Sorun Giderme

### Workflow Breadcrumb Görünmüyor
- ✅ `useWorkflowBreadcrumb` hook'una doğru ID'leri geçtiğinizden emin olun
- ✅ API endpoint'lerinin çalıştığını kontrol edin
- ✅ Multi-tenant kontrolü: `companyId` doğru mu?

### Menü Önceliklendirme Çalışmıyor
- ✅ Kullanıcı rolü doğru mu? (`session.user.role`)
- ✅ `getMenuPriorityByRole` fonksiyonu doğru rolü döndürüyor mu?
- ✅ Sidebar'da `menuPriorities` hesaplanıyor mu?

---

**Son Güncelleme:** 2024  
**Durum:** ✅ Aktif ve Çalışıyor





