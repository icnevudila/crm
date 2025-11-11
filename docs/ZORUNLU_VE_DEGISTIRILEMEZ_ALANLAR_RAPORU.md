# 🔒 Zorunlu ve Değiştirilemez Alanlar Raporu

**Tarih:** 2024  
**Durum:** ⚠️ Tespit Edildi - Düzeltmeler Gerekli

---

## 📋 ÖZET

Sistemde zorunlu ve değiştirilemez olması gereken alanlar tespit edildi. Bu alanların form componentlerinde ve API endpoint'lerinde korunması gerekiyor.

---

## 🔐 ZORUNLU VE DEĞİŞTİRİLEMEZ ALANLAR

### 1. **id** (Primary Key)
- ✅ **Durum:** Genellikle korunuyor
- ⚠️ **Sorun:** Form componentlerinde `id` alanı gönderilmemeli (sadece URL'de olmalı)
- 📍 **Kullanım:** PUT/DELETE işlemlerinde URL parametresi olarak kullanılıyor

### 2. **companyId** (Multi-Tenant)
- ❌ **Durum:** Bazı endpoint'lerde korunmuyor
- ⚠️ **Sorun:** PUT işlemlerinde `body.companyId` gönderilmemeli, sadece `session.user.companyId` kullanılmalı
- 📍 **Kullanım:** Session'dan alınmalı, body'den değil

### 3. **createdAt** (Oluşturulma Tarihi)
- ❌ **Durum:** Form componentlerinde ve API endpoint'lerinde korunmuyor
- ⚠️ **Sorun:** PUT işlemlerinde `body.createdAt` gönderilmemeli
- 📍 **Kullanım:** Sadece CREATE işlemlerinde otomatik oluşturulmalı

### 4. **updatedAt** (Güncelleme Tarihi)
- ✅ **Durum:** Genellikle otomatik güncelleniyor
- ⚠️ **Sorun:** Bazı endpoint'lerde `body.updatedAt` gönderiliyor, bu yanlış
- 📍 **Kullanım:** PUT işlemlerinde otomatik olarak `new Date().toISOString()` ile güncellenmeli

---

## 📊 MODÜL BAZLI DURUM RAPORU

### ✅ İYİ DURUMDA OLAN MODÜLLER

#### 1. **Customer** (`/api/customers/[id]/route.ts`)
- ✅ `companyId` korunuyor (session'dan alınıyor)
- ✅ `updatedAt` otomatik güncelleniyor
- ⚠️ `createdAt` kontrolü yok (body'den gönderilirse kabul edilir)

#### 2. **Deal** (`/api/deals/[id]/route.ts`)
- ✅ `companyId` korunuyor (session'dan alınıyor)
- ✅ `updatedAt` otomatik güncelleniyor
- ⚠️ `createdAt` kontrolü yok

#### 3. **Quote** (`/api/quotes/[id]/route.ts`)
- ✅ `companyId` korunuyor (session'dan alınıyor)
- ✅ `updatedAt` otomatik güncelleniyor
- ⚠️ `createdAt` kontrolü yok

#### 4. **Invoice** (`/api/invoices/[id]/route.ts`)
- ✅ `companyId` korunuyor (session'dan alınıyor)
- ✅ `updatedAt` otomatik güncelleniyor
- ⚠️ `createdAt` kontrolü yok
- ✅ Özel koruma: `quoteId` varsa değiştirilemez
- ✅ Özel koruma: `SHIPPED` ve `RECEIVED` durumunda değiştirilemez

#### 5. **Product** (`/api/products/[id]/route.ts`)
- ✅ `companyId` korunuyor (session'dan alınıyor)
- ✅ `updatedAt` otomatik güncelleniyor
- ⚠️ `createdAt` kontrolü yok

---

### ❌ SORUNLU MODÜLLER

#### 1. **User** (`/api/users/route.ts`)
- ❌ **Sorun:** `body.companyId` kabul ediliyor (SuperAdmin için)
- ⚠️ **Risk:** Normal kullanıcılar kendi `companyId`'lerini değiştirebilir
- 📍 **Düzeltme:** SuperAdmin dışında `companyId` body'den alınmamalı

#### 2. **Company/CustomerCompany** (`/api/customer-companies/[id]/route.ts`)
- ⚠️ **Kontrol:** Detaylı inceleme gerekli
- 📍 **Not:** Bu modül özel bir yapıya sahip (multi-tenant root)

---

## 🔧 DÜZELTME ÖNERİLERİ

### 1. **API Endpoint'lerinde Filtreleme**

Tüm PUT endpoint'lerinde şu alanlar filtrelenmeli:

```typescript
// ❌ YANLIŞ
const updateData = {
  ...body, // Tüm body'yi gönder - companyId, createdAt, id dahil!
  updatedAt: new Date().toISOString(),
}

// ✅ DOĞRU
const updateData: any = {
  updatedAt: new Date().toISOString(),
}

// Sadece izin verilen alanları ekle
if (body.title !== undefined) updateData.title = body.title
if (body.status !== undefined) updateData.status = body.status
// ... diğer izin verilen alanlar

// companyId, createdAt, id ASLA eklenmemeli!
```

### 2. **Form Componentlerinde Kontrol**

Form componentlerinde şu alanlar gönderilmemeli:

```typescript
// ❌ YANLIŞ
const onSubmit = async (data: FormData) => {
  await fetch(`/api/module/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      ...data,
      id, // ❌ Gönderilmemeli
      companyId, // ❌ Gönderilmemeli
      createdAt, // ❌ Gönderilmemeli
      updatedAt, // ❌ Gönderilmemeli (API'de otomatik)
    }),
  })
}

// ✅ DOĞRU
const onSubmit = async (data: FormData) => {
  // id, companyId, createdAt, updatedAt'ı temizle
  const { id, companyId, createdAt, updatedAt, ...cleanData } = data
  
  await fetch(`/api/module/${id}`, {
    method: 'PUT',
    body: JSON.stringify(cleanData), // Sadece değiştirilebilir alanlar
  })
}
```

### 3. **API Endpoint'lerinde Koruma**

Tüm PUT endpoint'lerinde şu kontrol yapılmalı:

```typescript
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const body = await request.json()
  
  // Değiştirilemez alanları filtrele
  const { id, companyId, createdAt, updatedAt, ...cleanBody } = body
  
  // companyId session'dan al
  const companyId = session.user.companyId
  
  // updatedAt otomatik ekle
  const updateData = {
    ...cleanBody,
    updatedAt: new Date().toISOString(),
  }
  
  // Update işlemi
  await supabase
    .from('Table')
    .update(updateData)
    .eq('id', id)
    .eq('companyId', companyId) // companyId kontrolü
}
```

---

## 📝 DETAYLI MODÜL LİSTESİ

### ✅ Kontrol Edilmesi Gereken Modüller

1. **Customer** - ✅ İyi durumda
2. **Deal** - ✅ İyi durumda
3. **Quote** - ✅ İyi durumda
4. **Invoice** - ✅ İyi durumda (özel korumalar var)
5. **Product** - ✅ İyi durumda
6. **Company/CustomerCompany** - ⚠️ Kontrol gerekli
7. **User** - ❌ Düzeltme gerekli
8. **Vendor** - ⚠️ Kontrol gerekli
9. **Task** - ⚠️ Kontrol gerekli
10. **Ticket** - ⚠️ Kontrol gerekli
11. **Shipment** - ⚠️ Kontrol gerekli
12. **Finance** - ⚠️ Kontrol gerekli
13. **Meeting** - ⚠️ Kontrol gerekli
14. **EmailTemplate** - ⚠️ Kontrol gerekli

---

## 🎯 ÖNCELİKLİ DÜZELTMELER

### 1. **Yüksek Öncelik**
- ❌ **User** modülünde `companyId` koruması
- ❌ Tüm modüllerde `createdAt` filtresi
- ❌ Tüm modüllerde `id` filtresi (body'den)

### 2. **Orta Öncelik**
- ⚠️ Tüm modüllerde `updatedAt` kontrolü (body'den gönderilmemeli)
- ⚠️ Form componentlerinde değiştirilemez alanların temizlenmesi

### 3. **Düşük Öncelik**
- 📝 Dokümantasyon güncellemesi
- 📝 Test senaryoları eklenmesi

---

## 🔍 TESPİT EDİLEN SORUNLAR

### 1. **User Modülü** (`/api/users/route.ts`)
```typescript
// ❌ SORUN: body.companyId kabul ediliyor
const targetCompanyId = isSuperAdmin && body.companyId ? body.companyId : session.user.companyId
```

**Düzeltme:**
```typescript
// ✅ DOĞRU: SuperAdmin dışında companyId body'den alınmamalı
const targetCompanyId = session.user.companyId
// SuperAdmin için özel kontrol gerekirse ayrı endpoint kullanılmalı
```

### 2. **Tüm Modüllerde `createdAt` Kontrolü Yok**
- ⚠️ PUT işlemlerinde `body.createdAt` gönderilirse kabul edilir
- 📍 **Risk:** Kullanıcı oluşturulma tarihini değiştirebilir

**Düzeltme:**
```typescript
// Tüm PUT endpoint'lerinde
const { id, companyId, createdAt, updatedAt, ...cleanBody } = body
```

### 3. **Form Componentlerinde Temizlik Yok**
- ⚠️ Form componentlerinde `id`, `companyId`, `createdAt`, `updatedAt` gönderiliyor
- 📍 **Risk:** Kullanıcı bu alanları değiştirebilir

**Düzeltme:**
```typescript
// Tüm form componentlerinde
const onSubmit = async (data: FormData) => {
  const { id, companyId, createdAt, updatedAt, ...cleanData } = data
  // cleanData'yı gönder
}
```

---

## ✅ SONUÇ

Sistemde zorunlu ve değiştirilemez alanların korunması için düzeltmeler gerekiyor. Özellikle:

1. **User** modülünde `companyId` koruması acil
2. Tüm modüllerde `createdAt` filtresi eklenmeli
3. Form componentlerinde değiştirilemez alanlar temizlenmeli

Bu düzeltmeler yapıldıktan sonra sistem güvenliği artacak ve veri bütünlüğü korunacaktır.

---

**Not:** Bu rapor otomatik olarak oluşturulmuştur. Tüm modüllerin detaylı kontrolü yapılmalıdır.










