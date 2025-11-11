# ⚠️ Eksik Context ve Korumalar Raporu

**Tarih:** 2024  
**Durum:** ⚠️ Tespit Edildi - Eksikler Var

---

## 📋 ÖZET

Sistemdeki tüm context'ler, ilişkiler ve zorunlu korumalar kontrol edildi. Bazı eksikler tespit edildi.

---

## ✅ MEVCUT KORUMALAR

### 1. **Durum Bazlı Korumalar** ✅

| Modül | Durum | Değiştirilemez | Silinemez | Dosya |
|-------|-------|----------------|-----------|-------|
| **Quote** | `ACCEPTED` | ✅ | ✅ | `quotes/[id]/route.ts` |
| **Invoice** | `PAID` | ✅ | ✅ | `invoices/[id]/route.ts` |
| **Invoice** | `SHIPPED` | ✅ | ✅ | `invoices/[id]/route.ts` |
| **Invoice** | `RECEIVED` | ✅ | ✅ | `invoices/[id]/route.ts` |
| **Invoice** | `quoteId` varsa | ✅ | ✅ | `invoices/[id]/route.ts` |
| **Shipment** | `DELIVERED` | ✅ | ✅ | `shipments/[id]/route.ts` |
| **Shipment** | `APPROVED` | ✅ | ✅ | `shipments/[id]/route.ts` |
| **Deal** | `WON` | ✅ | ✅ | `deals/[id]/route.ts` |
| **Deal** | `CLOSED` | ✅ | ✅ | `deals/[id]/route.ts` |
| **Contract** | `ACTIVE` | ❌ | ✅ | `contracts/[id]/route.ts` |

---

## ❌ EKSİK KORUMALAR

### 1. **Product Silme Kontrolü** ❌ **YÜKSEK ÖNCELİK**

**Sorun:**
- Product silinirken ilişkili InvoiceItem/QuoteItem kontrolü yok
- Product silindiğinde orphaned InvoiceItem/QuoteItem kayıtları oluşabilir

**Çözüm:**
```typescript
// src/app/api/products/[id]/route.ts - DELETE
export async function DELETE(...) {
  // İlişkili InvoiceItem kontrolü
  const { data: invoiceItems } = await supabase
    .from('InvoiceItem')
    .select('id')
    .eq('productId', id)
    .limit(1)
  
  if (invoiceItems && invoiceItems.length > 0) {
    return NextResponse.json(
      { 
        error: 'Ürün silinemez',
        message: 'Bu ürün faturalarda kullanılıyor. Ürünü silmek için önce ilgili fatura kalemlerini silmeniz gerekir.',
        reason: 'PRODUCT_HAS_INVOICE_ITEMS',
        relatedItems: {
          invoiceItems: invoiceItems.length
        }
      },
      { status: 403 }
    )
  }
  
  // İlişkili QuoteItem kontrolü
  const { data: quoteItems } = await supabase
    .from('QuoteItem')
    .select('id')
    .eq('productId', id)
    .limit(1)
  
  if (quoteItems && quoteItems.length > 0) {
    return NextResponse.json(
      { 
        error: 'Ürün silinemez',
        message: 'Bu ürün tekliflerde kullanılıyor. Ürünü silmek için önce ilgili teklif kalemlerini silmeniz gerekir.',
        reason: 'PRODUCT_HAS_QUOTE_ITEMS',
        relatedItems: {
          quoteItems: quoteItems.length
        }
      },
      { status: 403 }
    )
  }
  
  // Product silinebilir
  // ...
}
```

---

### 2. **Customer Silme Kontrolü** ❌ **YÜKSEK ÖNCELİK**

**Sorun:**
- Customer silinirken ilişkili Deal/Quote/Invoice kontrolü yok
- Customer silindiğinde orphaned kayıtlar oluşabilir

**Çözüm:**
```typescript
// src/app/api/customers/[id]/route.ts - DELETE
export async function DELETE(...) {
  // İlişkili Deal kontrolü
  const { data: deals } = await supabase
    .from('Deal')
    .select('id, title')
    .eq('customerId', id)
    .limit(1)
  
  if (deals && deals.length > 0) {
    return NextResponse.json(
      { 
        error: 'Müşteri silinemez',
        message: 'Bu müşteriye ait fırsatlar var. Müşteriyi silmek için önce ilgili fırsatları silmeniz gerekir.',
        reason: 'CUSTOMER_HAS_DEALS',
        relatedItems: {
          deals: deals.length
        }
      },
      { status: 403 }
    )
  }
  
  // İlişkili Quote kontrolü
  const { data: quotes } = await supabase
    .from('Quote')
    .select('id, title')
    .eq('customerId', id)
    .limit(1)
  
  if (quotes && quotes.length > 0) {
    return NextResponse.json(
      { 
        error: 'Müşteri silinemez',
        message: 'Bu müşteriye ait teklifler var. Müşteriyi silmek için önce ilgili teklifleri silmeniz gerekir.',
        reason: 'CUSTOMER_HAS_QUOTES',
        relatedItems: {
          quotes: quotes.length
        }
      },
      { status: 403 }
    )
  }
  
  // İlişkili Invoice kontrolü
  const { data: invoices } = await supabase
    .from('Invoice')
    .select('id, title')
    .eq('customerId', id)
    .limit(1)
  
  if (invoices && invoices.length > 0) {
    return NextResponse.json(
      { 
        error: 'Müşteri silinemez',
        message: 'Bu müşteriye ait faturalar var. Müşteriyi silmek için önce ilgili faturaları silmeniz gerekir.',
        reason: 'CUSTOMER_HAS_INVOICES',
        relatedItems: {
          invoices: invoices.length
        }
      },
      { status: 403 }
    )
  }
  
  // Customer silinebilir
  // ...
}
```

---

### 3. **Finance Silme Kontrolü** ❌ **ORTA ÖNCELİK**

**Sorun:**
- Finance silinirken ilişkili Invoice kontrolü yok
- Finance silindiğinde Invoice PAID durumu ile uyumsuzluk oluşabilir

**Çözüm:**
```typescript
// src/app/api/finance/[id]/route.ts - DELETE
export async function DELETE(...) {
  // İlişkili Invoice kontrolü
  const { data: finance } = await supabase
    .from('Finance')
    .select('invoiceId')
    .eq('id', id)
    .single()
  
  if (finance?.invoiceId) {
    // Invoice PAID durumunda Finance silinemez
    const { data: invoice } = await supabase
      .from('Invoice')
      .select('id, title, status')
      .eq('id', finance.invoiceId)
      .single()
    
    if (invoice && invoice.status === 'PAID') {
      return NextResponse.json(
        { 
          error: 'Finans kaydı silinemez',
          message: 'Bu finans kaydı ödenmiş bir faturaya bağlı. Finans kaydını silmek için önce faturanın durumunu değiştirmeniz gerekir.',
          reason: 'FINANCE_HAS_PAID_INVOICE',
          relatedInvoice: {
            id: invoice.id,
            title: invoice.title
          }
        },
        { status: 403 }
      )
    }
  }
  
  // Finance silinebilir
  // ...
}
```

---

### 4. **Task/Ticket Silme Kontrolü** 🟡 **DÜŞÜK ÖNCELİK (Opsiyonel)**

**Sorun:**
- Task DONE veya Ticket RESOLVED/CLOSED durumunda silinebiliyor
- Bu kayıtların silinmesi veri bütünlüğünü etkileyebilir

**Çözüm (Opsiyonel):**
```typescript
// src/app/api/tasks/[id]/route.ts - DELETE
export async function DELETE(...) {
  const { data: task } = await supabase
    .from('Task')
    .select('status')
    .eq('id', id)
    .single()
  
  // Task DONE durumunda silinemez (opsiyonel)
  if (task?.status === 'DONE') {
    return NextResponse.json(
      { 
        error: 'Tamamlanmış görevler silinemez',
        message: 'Bu görev tamamlandı. Tamamlanmış görevleri silmek mümkün değildir.',
        reason: 'DONE_TASK_CANNOT_BE_DELETED'
      },
      { status: 403 }
    )
  }
  
  // Task silinebilir
  // ...
}

// src/app/api/tickets/[id]/route.ts - DELETE
export async function DELETE(...) {
  const { data: ticket } = await supabase
    .from('Ticket')
    .select('status')
    .eq('id', id)
    .single()
  
  // Ticket RESOLVED/CLOSED durumunda silinemez (opsiyonel)
  if (ticket?.status === 'RESOLVED' || ticket?.status === 'CLOSED') {
    return NextResponse.json(
      { 
        error: 'Çözülmüş/Kapatılmış destek talepleri silinemez',
        message: 'Bu destek talebi çözüldü veya kapatıldı. Çözülmüş/kapatılmış destek taleplerini silmek mümkün değildir.',
        reason: 'RESOLVED_TICKET_CANNOT_BE_DELETED'
      },
      { status: 403 }
    )
  }
  
  // Ticket silinebilir
  // ...
}
```

---

## 📊 ÖZET TABLO

| # | Koruma | Öncelik | Durum | Dosya |
|---|--------|---------|-------|-------|
| 1 | Product → InvoiceItem/QuoteItem kontrolü | 🔴 Yüksek | ❌ Eksik | `products/[id]/route.ts` |
| 2 | Customer → Deal/Quote/Invoice kontrolü | 🔴 Yüksek | ❌ Eksik | `customers/[id]/route.ts` |
| 3 | Finance → Invoice PAID kontrolü | 🟡 Orta | ❌ Eksik | `finance/[id]/route.ts` |
| 4 | Task DONE → Silinemez | 🟢 Düşük | ❌ Eksik | `tasks/[id]/route.ts` |
| 5 | Ticket RESOLVED/CLOSED → Silinemez | 🟢 Düşük | ❌ Eksik | `tickets/[id]/route.ts` |

**Toplam:** 5 eksik koruma

---

## 🎯 ÖNCELİK SIRASI

### 🔴 **YÜKSEK ÖNCELİK (Kritik)**
1. **Product Silme Kontrolü** - InvoiceItem/QuoteItem ilişkisi
2. **Customer Silme Kontrolü** - Deal/Quote/Invoice ilişkisi

### 🟡 **ORTA ÖNCELİK**
3. **Finance Silme Kontrolü** - Invoice PAID ilişkisi

### 🟢 **DÜŞÜK ÖNCELİK (Opsiyonel)**
4. **Task DONE → Silinemez** - Veri bütünlüğü için
5. **Ticket RESOLVED/CLOSED → Silinemez** - Veri bütünlüğü için

---

## ✅ SONUÇ

Sistemde **5 eksik koruma** tespit edildi:

1. **Product silme kontrolü** - İlişkili InvoiceItem/QuoteItem kontrolü yok
2. **Customer silme kontrolü** - İlişkili Deal/Quote/Invoice kontrolü yok
3. **Finance silme kontrolü** - İlişkili Invoice PAID kontrolü yok
4. **Task DONE silme kontrolü** - Opsiyonel koruma
5. **Ticket RESOLVED/CLOSED silme kontrolü** - Opsiyonel koruma

Bu korumalar eklendikten sonra sistem güvenliği ve veri bütünlüğü artacaktır.

---

**Rapor Tarihi:** 2024  
**Kontrol Eden:** AI Assistant  
**Durum:** ⚠️ Eksikler Tespit Edildi



