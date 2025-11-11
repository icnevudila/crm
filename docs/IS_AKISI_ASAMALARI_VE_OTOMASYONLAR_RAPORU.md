# 🔄 İş Akışı Aşamaları ve Otomasyonlar Raporu

**Tarih:** 2024  
**Durum:** ⚠️ Tespit Edildi - Eksikler Var

---

## 📋 ÖZET

Sistemdeki tüm modüllerdeki iş akışı aşamaları, hangi durumlarda değiştirilemez/silinemez olması gerektiği ve mevcut otomasyonlar tespit edildi.

---

## 🔄 İŞ AKIŞI AŞAMALARI

### 1. **DEAL (Fırsat) İş Akışı**

#### Durumlar:
- `LEAD` → Potansiyel müşteri
- `CONTACTED` → İletişimde
- `PROPOSAL` → Teklif aşaması
- `NEGOTIATION` → Pazarlık
- `WON` → Kazanıldı ✅
- `LOST` → Kaybedildi ❌

#### Status:
- `OPEN` → Açık
- `CLOSED` → Kapalı

#### ✅ Mevcut Durum:
- ✅ Deal oluşturulabilir
- ✅ Deal güncellenebilir
- ✅ Deal silinebilir (her durumda)
- ⚠️ **EKSİK:** Deal WON olduğunda silinemez olmalı
- ⚠️ **EKSİK:** Deal CLOSED olduğunda değiştirilemez olmalı
- ⚠️ **EKSİK:** Deal WON olduğunda otomatik Quote oluşturulmalı mı?

#### ❌ Eksik Otomasyonlar:
1. **Deal WON → Quote Oluştur** (Opsiyonel - şu an manuel)
2. **Deal WON → Silinemez** (Kritik - şu an silinebiliyor)
3. **Deal CLOSED → Değiştirilemez** (Kritik - şu an değiştirilebiliyor)

---

### 2. **QUOTE (Teklif) İş Akışı**

#### Durumlar:
- `DRAFT` → Taslak
- `SENT` → Gönderildi
- `ACCEPTED` → Kabul Edildi ✅
- `DECLINED` → Reddedildi ❌
- `WAITING` → Beklemede

#### ✅ Mevcut Durum:
- ✅ Quote oluşturulabilir
- ✅ Quote güncellenebilir (her durumda)
- ✅ Quote silinebilir (her durumda)
- ✅ **Quote ACCEPTED → Invoice oluşturuluyor** ✅
- ⚠️ **EKSİK:** Quote ACCEPTED olduğunda silinemez olmalı
- ⚠️ **EKSİK:** Quote ACCEPTED olduğunda değiştirilemez olmalı (Invoice oluşturulduğu için)

#### ✅ Mevcut Otomasyonlar:
1. **Quote ACCEPTED → Invoice Oluştur** ✅
   - Trigger: `PUT /api/quotes/{id}` (status ACCEPTED)
   - Otomatik Invoice oluşturuluyor
   - ActivityLog kaydı yapılıyor
   - Bildirim gönderiliyor

#### ❌ Eksik Otomasyonlar:
1. **Quote ACCEPTED → Silinemez** (Kritik - şu an silinebiliyor)
2. **Quote ACCEPTED → Değiştirilemez** (Kritik - şu an değiştirilebiliyor)
3. **Quote ACCEPTED → Stok Rezervasyonu** (Opsiyonel - InvoiceItem oluşturulduğunda rezerve edilmeli)

---

### 3. **INVOICE (Fatura) İş Akışı**

#### Durumlar:
- `DRAFT` → Taslak
- `SENT` → Gönderildi
- `SHIPPED` → Sevkiyatı Yapıldı ✅
- `RECEIVED` → Mal Kabul Edildi ✅
- `PAID` → Ödendi ✅
- `OVERDUE` → Vadesi Geçmiş
- `CANCELLED` → İptal Edildi

#### ✅ Mevcut Durum:
- ✅ Invoice oluşturulabilir
- ✅ **Invoice quoteId varsa → Değiştirilemez** ✅
- ✅ **Invoice SHIPPED → Değiştirilemez** ✅
- ✅ **Invoice RECEIVED → Değiştirilemez** ✅
- ✅ **Invoice PAID → Finance kaydı oluşturuluyor** ✅
- ⚠️ **EKSİK:** Invoice PAID olduğunda silinemez olmalı
- ⚠️ **EKSİK:** Invoice SHIPPED/RECEIVED olduğunda silinemez olmalı
- ⚠️ **EKSİK:** Invoice PAID olduğunda değiştirilemez olmalı

#### ✅ Mevcut Otomasyonlar:
1. **Invoice PAID → Finance Kaydı Oluştur** ✅
   - Trigger: `PUT /api/invoices/{id}` (status PAID)
   - Otomatik Finance kaydı oluşturuluyor
   - ActivityLog kaydı yapılıyor
   - Bildirim gönderiliyor

2. **Invoice SHIPPED → Stok Düşüyor** ✅
   - Trigger: Shipment APPROVED olduğunda
   - Product.stock düşüyor
   - Product.reservedQuantity azalıyor
   - StockMovement oluşturuluyor

3. **Invoice RECEIVED → Stok Artıyor** ✅
   - Trigger: PurchaseTransaction APPROVED olduğunda
   - Product.stock artıyor
   - Product.incomingQuantity azalıyor
   - StockMovement oluşturuluyor

#### ❌ Eksik Otomasyonlar:
1. **Invoice PAID → Silinemez** (Kritik - şu an silinebiliyor)
2. **Invoice SHIPPED → Silinemez** (Kritik - şu an silinebiliyor)
3. **Invoice RECEIVED → Silinemez** (Kritik - şu an silinebiliyor)
4. **Invoice PAID → Değiştirilemez** (Kritik - şu an değiştirilebiliyor)
5. **Invoice ACCEPTED → İptal Edilemez** ✅ (Mevcut - ACCEPTED olan faturalar iptal edilemez)

---

### 4. **SHIPMENT (Sevkiyat) İş Akışı**

#### Durumlar:
- `DRAFT` → Taslak
- `PENDING` → Beklemede
- `APPROVED` → Onaylandı ✅
- `IN_TRANSIT` → Yolda
- `DELIVERED` → Teslim Edildi ✅
- `CANCELLED` → İptal Edildi

#### ✅ Mevcut Durum:
- ✅ Shipment oluşturulabilir
- ✅ **Shipment APPROVED → Silinemez** ✅
- ✅ **Shipment APPROVED → Stok Düşüyor** ✅
- ✅ **Shipment APPROVED → Sadece IN_TRANSIT/DELIVERED'a geçilebilir** ✅
- ⚠️ **EKSİK:** Shipment DELIVERED olduğunda değiştirilemez olmalı
- ⚠️ **EKSİK:** Shipment DELIVERED olduğunda silinemez olmalı

#### ✅ Mevcut Otomasyonlar:
1. **Shipment APPROVED → Stok Düşüyor** ✅
   - Trigger: Database trigger (`update_stock_on_shipment_approval`)
   - Product.stock düşüyor
   - Product.reservedQuantity azalıyor
   - StockMovement oluşturuluyor

2. **Shipment DELIVERED → ActivityLog** ✅
   - Trigger: `PUT /api/shipments/{id}/status` (status DELIVERED)
   - ActivityLog kaydı yapılıyor

#### ❌ Eksik Otomasyonlar:
1. **Shipment DELIVERED → Değiştirilemez** (Kritik - şu an değiştirilebiliyor)
2. **Shipment DELIVERED → Silinemez** (Kritik - şu an silinebiliyor)
3. **Shipment DELIVERED → Invoice Status Güncelle** (Opsiyonel - Invoice status'u DELIVERED yapılabilir)

---

### 5. **DEAL (Fırsat) İş Akışı - Detay**

#### ✅ Mevcut Durum:
- ✅ Deal oluşturulabilir
- ✅ Deal güncellenebilir (her durumda)
- ✅ Deal silinebilir (her durumda)
- ⚠️ **EKSİK:** Deal WON olduğunda silinemez olmalı
- ⚠️ **EKSİK:** Deal CLOSED olduğunda değiştirilemez olmalı
- ⚠️ **EKSİK:** Deal WON olduğunda otomatik Quote oluşturulmalı mı?

#### ❌ Eksik Otomasyonlar:
1. **Deal WON → Silinemez** (Kritik - şu an silinebiliyor)
2. **Deal CLOSED → Değiştirilemez** (Kritik - şu an değiştirilebiliyor)
3. **Deal WON → Otomatik Quote Oluştur** (Opsiyonel - şu an manuel)

---

## 📊 DURUM BAZLI KORUMA MATRİSİ

### ✅ MEVCUT KORUMALAR

| Modül | Durum | Değiştirilemez | Silinemez | Otomasyon |
|-------|-------|----------------|-----------|-----------|
| **Invoice** | `quoteId` varsa | ✅ | ❌ | - |
| **Invoice** | `SHIPPED` | ✅ | ❌ | Stok düşüyor ✅ |
| **Invoice** | `RECEIVED` | ✅ | ❌ | Stok artıyor ✅ |
| **Invoice** | `ACCEPTED` | ❌ | ❌ | İptal edilemez ✅ |
| **Invoice** | `PAID` | ❌ | ❌ | Finance kaydı ✅ |
| **Shipment** | `APPROVED` | ✅ (sadece status) | ✅ | Stok düşüyor ✅ |
| **Quote** | `ACCEPTED` | ❌ | ❌ | Invoice oluşturuluyor ✅ |

### ❌ EKSİK KORUMALAR

| Modül | Durum | Değiştirilemez | Silinemez | Otomasyon |
|-------|-------|-------------------|-----------|---------|
| **Quote** | `ACCEPTED` | ❌ **EKSİK** | ❌ **EKSİK** | - |
| **Invoice** | `PAID` | ❌ **EKSİK** | ❌ **EKSİK** | - |
| **Invoice** | `SHIPPED` | ✅ | ❌ **EKSİK** | - |
| **Invoice** | `RECEIVED` | ✅ | ❌ **EKSİK** | - |
| **Shipment** | `DELIVERED` | ❌ **EKSİK** | ❌ **EKSİK** | - |
| **Deal** | `WON` | ❌ **EKSİK** | ❌ **EKSİK** | - |
| **Deal** | `CLOSED` | ❌ **EKSİK** | ❌ **EKSİK** | - |

---

## 🔧 DÜZELTME ÖNERİLERİ

### 1. **Quote ACCEPTED → Koruma**

```typescript
// src/app/api/quotes/[id]/route.ts - PUT
export async function PUT(...) {
  // Quote ACCEPTED olduğunda değiştirilemez
  if (currentQuote?.status === 'ACCEPTED') {
    return NextResponse.json(
      { error: 'Kabul edilmiş teklifler değiştirilemez. Fatura oluşturuldu.' },
      { status: 403 }
    )
  }
}

// src/app/api/quotes/[id]/route.ts - DELETE
export async function DELETE(...) {
  // Quote ACCEPTED olduğunda silinemez
  if (quote?.status === 'ACCEPTED') {
    return NextResponse.json(
      { error: 'Kabul edilmiş teklifler silinemez. Fatura oluşturuldu.' },
      { status: 403 }
    )
  }
}
```

### 2. **Invoice PAID → Koruma**

```typescript
// src/app/api/invoices/[id]/route.ts - PUT
export async function PUT(...) {
  // Invoice PAID olduğunda değiştirilemez
  if (currentInvoice?.status === 'PAID') {
    return NextResponse.json(
      { error: 'Ödenmiş faturalar değiştirilemez. Finans kaydı oluşturuldu.' },
      { status: 403 }
    )
  }
}

// src/app/api/invoices/[id]/route.ts - DELETE
export async function DELETE(...) {
  // Invoice PAID olduğunda silinemez
  if (invoice?.status === 'PAID') {
    return NextResponse.json(
      { error: 'Ödenmiş faturalar silinemez. Finans kaydı oluşturuldu.' },
      { status: 403 }
    )
  }
  
  // Invoice SHIPPED/RECEIVED olduğunda silinemez
  if (invoice?.status === 'SHIPPED' || invoice?.status === 'RECEIVED') {
    return NextResponse.json(
      { error: 'Sevkiyatı yapılmış/mal kabul edilmiş faturalar silinemez. Stok işlemi yapıldı.' },
      { status: 403 }
    )
  }
}
```

### 3. **Shipment DELIVERED → Koruma**

```typescript
// src/app/api/shipments/[id]/route.ts - PUT
export async function PUT(...) {
  // Shipment DELIVERED olduğunda değiştirilemez
  if (currentShipment?.status === 'DELIVERED') {
    return NextResponse.json(
      { error: 'Teslim edilmiş sevkiyatlar değiştirilemez.' },
      { status: 403 }
    )
  }
}

// src/app/api/shipments/[id]/route.ts - DELETE
export async function DELETE(...) {
  // Shipment DELIVERED olduğunda silinemez
  if (currentShipment?.status === 'DELIVERED') {
    return NextResponse.json(
      { error: 'Teslim edilmiş sevkiyatlar silinemez.' },
      { status: 403 }
    )
  }
}
```

### 4. **Deal WON/CLOSED → Koruma**

```typescript
// src/app/api/deals/[id]/route.ts - PUT
export async function PUT(...) {
  // Deal CLOSED olduğunda değiştirilemez
  if (existingDeal?.status === 'CLOSED') {
    return NextResponse.json(
      { error: 'Kapatılmış fırsatlar değiştirilemez.' },
      { status: 403 }
    )
  }
  
  // Deal WON olduğunda sadece belirli alanlar değiştirilebilir
  if (existingDeal?.stage === 'WON') {
    // Sadece description, notes gibi alanlar değiştirilebilir
    // title, value, stage, status değiştirilemez
    if (body.title !== undefined || body.value !== undefined || 
        body.stage !== undefined || body.status !== undefined) {
      return NextResponse.json(
        { error: 'Kazanılmış fırsatların temel bilgileri değiştirilemez.' },
        { status: 403 }
      )
    }
  }
}

// src/app/api/deals/[id]/route.ts - DELETE
export async function DELETE(...) {
  // Deal WON olduğunda silinemez
  if (deal?.stage === 'WON') {
    return NextResponse.json(
      { error: 'Kazanılmış fırsatlar silinemez.' },
      { status: 403 }
    )
  }
  
  // Deal CLOSED olduğunda silinemez
  if (deal?.status === 'CLOSED') {
    return NextResponse.json(
      { error: 'Kapatılmış fırsatlar silinemez.' },
      { status: 403 }
    )
  }
}
```

---

## 🎯 ÖNCELİKLİ DÜZELTMELER

### 1. **Yüksek Öncelik (Kritik)**
- ❌ **Quote ACCEPTED → Silinemez** (Invoice oluşturulduğu için)
- ❌ **Quote ACCEPTED → Değiştirilemez** (Invoice oluşturulduğu için)
- ❌ **Invoice PAID → Silinemez** (Finance kaydı oluşturulduğu için)
- ❌ **Invoice PAID → Değiştirilemez** (Finance kaydı oluşturulduğu için)
- ❌ **Invoice SHIPPED → Silinemez** (Stok düşüldüğü için)
- ❌ **Invoice RECEIVED → Silinemez** (Stok artırıldığı için)
- ❌ **Shipment DELIVERED → Silinemez** (Teslim edildiği için)
- ❌ **Shipment DELIVERED → Değiştirilemez** (Teslim edildiği için)

### 2. **Orta Öncelik**
- ⚠️ **Deal WON → Silinemez** (Kazanılmış fırsat)
- ⚠️ **Deal CLOSED → Değiştirilemez** (Kapatılmış fırsat)
- ⚠️ **Deal WON → Değiştirilemez** (Sadece belirli alanlar)

### 3. **Düşük Öncelik (Opsiyonel)**
- 📝 **Deal WON → Otomatik Quote Oluştur** (Şu an manuel)
- 📝 **Quote ACCEPTED → Stok Rezervasyonu** (InvoiceItem oluşturulduğunda)
- 📝 **Shipment DELIVERED → Invoice Status Güncelle** (Invoice status'u DELIVERED yapılabilir)

---

## 📝 DETAYLI İŞ AKIŞI ŞEMASI

### Satış Akışı:
```
Deal (LEAD) 
  → Deal (PROPOSAL) 
    → Quote (DRAFT) 
      → Quote (SENT) 
        → Quote (ACCEPTED) ✅ [KORUMA: Değiştirilemez, Silinemez]
          → Invoice (DRAFT) ✅ [Otomatik oluşturuluyor]
            → Invoice (SENT)
              → Shipment (PENDING)
                → Shipment (APPROVED) ✅ [KORUMA: Silinemez, Stok düşüyor]
                  → Invoice (SHIPPED) ✅ [KORUMA: Değiştirilemez, Silinemez]
                    → Shipment (DELIVERED) ✅ [KORUMA: Değiştirilemez, Silinemez]
                      → Invoice (PAID) ✅ [KORUMA: Değiştirilemez, Silinemez, Finance kaydı]
```

### Alış Akışı:
```
Purchase Invoice (DRAFT)
  → Purchase Invoice (SENT)
    → Purchase Shipment (PENDING)
      → Purchase Shipment (APPROVED) ✅ [KORUMA: Silinemez, Stok artıyor]
        → Invoice (RECEIVED) ✅ [KORUMA: Değiştirilemez, Silinemez]
```

---

## ✅ SONUÇ

Sistemde bazı kritik korumalar eksik. Özellikle:

1. **Quote ACCEPTED** → Değiştirilemez/Silinemez (Invoice oluşturulduğu için)
2. **Invoice PAID** → Değiştirilemez/Silinemez (Finance kaydı oluşturulduğu için)
3. **Invoice SHIPPED/RECEIVED** → Silinemez (Stok işlemi yapıldığı için)
4. **Shipment DELIVERED** → Değiştirilemez/Silinemez (Teslim edildiği için)
5. **Deal WON/CLOSED** → Değiştirilemez/Silinemez (Kazanılmış/kapatılmış fırsat)

Bu düzeltmeler yapıldıktan sonra sistem güvenliği ve veri bütünlüğü artacaktır.

---

**Not:** Bu rapor otomatik olarak oluşturulmuştur. Tüm modüllerin detaylı kontrolü yapılmalıdır.










