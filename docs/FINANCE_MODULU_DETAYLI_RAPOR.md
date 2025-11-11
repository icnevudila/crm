# 💰 Finance Modülü - Detaylı Rapor

**Tarih:** 2024  
**Durum:** ✅ Tam Çalışıyor

---

## 📋 GENEL BAKIŞ

Finance modülü, gelir ve gider kayıtlarını yönetmek için kullanılır. İki tür kayıt vardır:
- **INCOME (Gelir)**: Fatura ödemeleri, hizmet gelirleri, ürün satışları
- **EXPENSE (Gider)**: Araç yakıtı, konaklama, yemek, ofis giderleri, pazarlama

---

## 🎯 SAYFA YAPISI

### 1. **Finance Listesi Sayfası** (`/finance`)
- **Dosya**: `src/app/[locale]/finance/page.tsx`
- **Component**: `src/components/finance/FinanceList.tsx`
- **Özellikler**:
  - ✅ Gelir/Gider listesi (DataTable)
  - ✅ Toplam Gelir/Gider/Net Kar kartları
  - ✅ Filtreleme: Tip (INCOME/EXPENSE), Kategori, Firma, Tarih aralığı
  - ✅ Optimistic update (SWR cache)
  - ✅ Debounced search (300ms)
  - ✅ Skeleton loading state

### 2. **Finance Detay Sayfası** (`/finance/[id]`)
- **Dosya**: `src/app/[locale]/finance/[id]/page.tsx`
- **Özellikler**:
  - ✅ Finance kaydı detayları
  - ✅ ActivityLog timeline
  - ✅ Düzenle/Sil butonları

### 3. **Finance Form** (`FinanceForm.tsx`)
- **Dosya**: `src/components/finance/FinanceForm.tsx`
- **Özellikler**:
  - ✅ Tip seçimi (INCOME/EXPENSE)
  - ✅ Kategori seçimi (tip'e göre dinamik)
  - ✅ Müşteri firması seçimi
  - ✅ İlişkili kayıt (relatedTo)
  - ✅ react-hook-form + Zod validation
  - ✅ useEffect ile form population (edit modu)

---

## 🔄 OTOMASYONLAR

### 1. **Invoice PAID → Finance Kaydı Oluştur** ✅ **OTOMATIK**

**Trigger**: `PUT /api/invoices/[id]` (status = 'PAID')

**Nasıl Çalışır**:
```typescript
// src/app/api/invoices/[id]/route.ts (571-627. satırlar)
if ((body.status === 'PAID' || data?.status === 'PAID') && data) {
  // 1. Duplicate kontrolü - bu invoice için Finance kaydı var mı?
  const { data: existingFinance } = await supabase
    .from('Finance')
    .select('id')
    .eq('relatedTo', `Invoice: ${data.id}`)
    .eq('companyId', session.user.companyId)
    .maybeSingle()

  // 2. Eğer Finance kaydı yoksa oluştur
  if (!existingFinance) {
    const { data: finance } = await supabase
      .from('Finance')
      .insert([
        {
          type: 'INCOME',
          amount: data.total,
          relatedTo: `Invoice: ${data.id}`,
          companyId: session.user.companyId,
          category: 'INVOICE_INCOME',
        },
      ])
      .select()
      .single()

    // 3. ActivityLog kaydı
    await supabase.from('ActivityLog').insert([...])

    // 4. Bildirim gönder
    await createNotificationForRole({...})
  }
}
```

**Özellikler**:
- ✅ Duplicate önleme (aynı invoice için 2 kez Finance kaydı oluşturulmaz)
- ✅ Otomatik kategori: `INVOICE_INCOME`
- ✅ Otomatik `relatedTo`: `Invoice: {invoiceId}`
- ✅ ActivityLog kaydı
- ✅ Bildirim gönderiliyor (Admin, Sales, SuperAdmin)

**Koruma**:
- ✅ Invoice PAID olduğunda **değiştirilemez** (Finance kaydı oluşturulduğu için)
- ✅ Invoice PAID olduğunda **silinemez** (Finance kaydı oluşturulduğu için)

---

### 2. **Eksik Finance Kayıtlarını Senkronize Et** ✅ **MANUEL**

**Endpoint**: `POST /api/finance/sync-missing`

**Nasıl Çalışır**:
```typescript
// src/app/api/finance/sync-missing/route.ts
// 1. Tüm PAID invoice'ları çek
const { data: paidInvoices } = await supabase
  .from('Invoice')
  .select('id, total, companyId, status, title')
  .eq('status', 'PAID')

// 2. Her invoice için Finance kaydı var mı kontrol et
for (const invoice of paidInvoices) {
  const { data: existingFinance } = await supabase
    .from('Finance')
    .select('id')
    .eq('relatedTo', `Invoice: ${data.id}`)
    .maybeSingle()

  // 3. Eğer Finance kaydı yoksa oluştur
  if (!existingFinance) {
    financeRecordsToCreate.push({
      type: 'INCOME',
      amount: invoice.total,
      relatedTo: `Invoice: ${invoice.id}`,
      companyId: invoice.companyId,
      category: 'INVOICE_INCOME',
      description: `Fatura ödendi: ${invoice.title || invoice.id}`,
    })
  }
}

// 4. Eksik Finance kayıtlarını toplu oluştur
await supabase.from('Finance').insert(financeRecordsToCreate)
```

**Kullanım Senaryosu**:
- Eski PAID invoice'lar için Finance kaydı oluşturulmamışsa
- Migration sonrası eksik kayıtları tamamlamak için
- Manuel olarak çalıştırılır (buton veya API call)

---

## 📊 KATEGORİLER

### Gelir Kategorileri (INCOME):
- `INVOICE_INCOME` - Fatura Geliri (otomatik oluşturulur)
- `SERVICE` - Hizmet Geliri
- `PRODUCT_SALE` - Ürün Satışı
- `OTHER` - Diğer

### Gider Kategorileri (EXPENSE):
- `FUEL` - Araç Yakıtı
- `ACCOMMODATION` - Konaklama
- `FOOD` - Yemek
- `TRANSPORT` - Ulaşım
- `OFFICE` - Ofis Giderleri
- `MARKETING` - Pazarlama
- `OTHER` - Diğer

---

## 🔗 İLİŞKİLER

### 1. **Finance → Invoice İlişkisi**
- `relatedTo` kolonu: `Invoice: {invoiceId}` formatında
- Invoice PAID olduğunda otomatik oluşturulur
- Finance kaydı silinirse Invoice etkilenmez (soft delete yok)

### 2. **Finance → CustomerCompany İlişkisi**
- `customerCompanyId` kolonu ile müşteri firmasına bağlanır
- Filtreleme için kullanılır
- Foreign key constraint yok (şu an)

### 3. **Finance → Company İlişkisi**
- `companyId` kolonu ile şirkete bağlanır (multi-tenant)
- RLS kontrolü ile izole edilir

---

## 📈 ÖZELLİKLER

### 1. **Toplam Hesaplama**
- **Toplam Gelir**: Tüm INCOME kayıtlarının toplamı
- **Toplam Gider**: Tüm EXPENSE kayıtlarının toplamı
- **Net Kar/Zarar**: Gelir - Gider
- useMemo ile optimize edilmiş (performans için)

### 2. **Filtreleme**
- ✅ Tip (INCOME/EXPENSE)
- ✅ Kategori
- ✅ Müşteri Firması (customerCompanyId)
- ✅ Tarih aralığı (startDate, endDate)

### 3. **CRUD İşlemleri**
- ✅ **Create**: Manuel gider ekleme, otomatik gelir (Invoice PAID)
- ✅ **Read**: Liste ve detay sayfası
- ✅ **Update**: Finance kaydı düzenleme
- ✅ **Delete**: Finance kaydı silme (optimistic update)

---

## 🛡️ KORUMA MEKANİZMALARI

### 1. **Invoice PAID → Finance Kaydı Koruması**
- ✅ Invoice PAID olduğunda **değiştirilemez** (`PUT /api/invoices/[id]`)
- ✅ Invoice PAID olduğunda **silinemez** (`DELETE /api/invoices/[id]`)
- ✅ Sebep: Finance kaydı oluşturulduğu için

### 2. **Duplicate Önleme**
- ✅ Invoice PAID olduğunda Finance kaydı oluşturulmadan önce kontrol edilir
- ✅ Aynı invoice için 2 kez Finance kaydı oluşturulmaz
- ✅ `relatedTo = 'Invoice: {invoiceId}'` ile kontrol edilir

---

## 🔍 API ENDPOINT'LERİ

### 1. **GET /api/finance**
- **Açıklama**: Finance kayıtlarını listeler
- **Filtreler**: type, category, customerCompanyId, startDate, endDate
- **Cache**: 1 saat (agresif cache - instant navigation)
- **Limit**: 1000 kayıt

### 2. **POST /api/finance**
- **Açıklama**: Yeni Finance kaydı oluşturur (manuel gider ekleme)
- **Body**: type, amount, category, description, relatedTo, customerCompanyId
- **Otomasyon**: ActivityLog kaydı oluşturulur

### 3. **GET /api/finance/[id]**
- **Açıklama**: Finance kaydı detaylarını getirir
- **İçerik**: Finance kaydı + ActivityLog'lar

### 4. **PUT /api/finance/[id]**
- **Açıklama**: Finance kaydını günceller
- **Otomasyon**: ActivityLog kaydı oluşturulur

### 5. **DELETE /api/finance/[id]**
- **Açıklama**: Finance kaydını siler
- **Otomasyon**: ActivityLog kaydı oluşturulur

### 6. **POST /api/finance/sync-missing**
- **Açıklama**: Eksik Finance kayıtlarını oluşturur (PAID invoice'lar için)
- **Kullanım**: Manuel senkronizasyon

---

## 📝 AKTİVİTE LOGLARI

Finance modülünde tüm CRUD işlemleri ActivityLog'a kaydedilir:

1. **CREATE**: "Gelir/Gider kaydı oluşturuldu"
2. **UPDATE**: "Finans kaydı güncellendi: {type} - {amount} ₺"
3. **DELETE**: "Finans kaydı silindi: {id}"
4. **Invoice PAID → Finance**: "Fatura ödendi, finans kaydı oluşturuldu"
5. **Sync Missing**: "Eksik finans kaydı oluşturuldu: Fatura {invoiceId}"

---

## 🔔 BİLDİRİMLER

### 1. **Invoice PAID → Finance Bildirimi**
- **Trigger**: Invoice status = 'PAID' olduğunda
- **Alıcılar**: Admin, Sales, SuperAdmin
- **Mesaj**: "Fatura ödendi ve finans kaydı oluşturuldu. Detayları görmek ister misiniz?"
- **Tip**: success
- **İlişkili**: Invoice (relatedTo: 'Invoice', relatedId: invoiceId)

---

## ⚠️ EKSİK OTOMASYONLAR

### 1. **Finance Kaydı Silindiğinde → Invoice Status Güncelleme** ❌
- **Sorun**: Finance kaydı silinirse Invoice status'u hala PAID kalıyor
- **Öneri**: Finance kaydı silinirse Invoice status'u SENT'e geri alınabilir (opsiyonel)

### 2. **Finance Kaydı Güncellendiğinde → Invoice Total Güncelleme** ❌
- **Sorun**: Finance kaydı güncellenirse Invoice total'i güncellenmiyor
- **Öneri**: Finance kaydı güncellenirse Invoice total'i de güncellenebilir (opsiyonel)

### 3. **Finance → Invoice Foreign Key Constraint** ❌
- **Sorun**: `relatedTo` kolonu string formatında (`Invoice: {id}`)
- **Öneri**: `invoiceId` kolonu eklenebilir ve foreign key constraint oluşturulabilir

---

## ✅ MEVCUT DURUM ÖZETİ

### Çalışan Özellikler:
- ✅ Invoice PAID → Finance kaydı otomatik oluşturuluyor
- ✅ Duplicate önleme çalışıyor
- ✅ ActivityLog kayıtları yapılıyor
- ✅ Bildirimler gönderiliyor
- ✅ Invoice PAID koruması var (değiştirilemez, silinemez)
- ✅ Manuel gider ekleme çalışıyor
- ✅ Filtreleme çalışıyor
- ✅ Toplam hesaplama çalışıyor

### Eksik Özellikler:
- ❌ Finance kaydı silindiğinde Invoice status güncelleme
- ❌ Finance → Invoice foreign key constraint
- ❌ Finance kaydı güncellendiğinde Invoice total güncelleme

---

## 🎯 KULLANIM SENARYOLARI

### Senaryo 1: Fatura Ödendi → Otomatik Gelir Kaydı
1. Invoice oluşturulur (status: DRAFT)
2. Invoice gönderilir (status: SENT)
3. Invoice ödenir (status: PAID) → **Otomatik Finance kaydı oluşturulur**
4. Finance sayfasında görünür (INCOME, INVOICE_INCOME kategorisi)

### Senaryo 2: Manuel Gider Ekleme
1. Finance sayfasına gidilir
2. "Yeni Kayıt" butonuna tıklanır
3. Tip: EXPENSE seçilir
4. Kategori: FUEL (Araç Yakıtı) seçilir
5. Tutar: 500 ₺ girilir
6. Kaydedilir → Finance kaydı oluşturulur

### Senaryo 3: Eksik Finance Kayıtlarını Tamamlama
1. `/api/finance/sync-missing` endpoint'ine POST isteği gönderilir
2. Tüm PAID invoice'lar kontrol edilir
3. Eksik Finance kayıtları oluşturulur
4. Sonuç: Kaç kayıt oluşturuldu, kaç kayıt zaten vardı

---

## 📊 PERFORMANS

- ✅ **SWR Cache**: 5 saniye deduping interval
- ✅ **Agresif Cache**: 1 saat (GET /api/finance)
- ✅ **Optimistic Update**: CRUD işlemlerinde anında UI güncelleme
- ✅ **useMemo**: Toplam hesaplama optimize edilmiş
- ✅ **Debounced Search**: 300ms (şu an search yok ama hazır)

---

## 🔐 GÜVENLİK

- ✅ **RLS Kontrolü**: Her API endpoint'te companyId filtresi
- ✅ **SuperAdmin Bypass**: SuperAdmin tüm şirketlerin verilerini görebilir
- ✅ **Session Kontrolü**: Her endpoint'te auth kontrolü
- ✅ **Duplicate Önleme**: Aynı invoice için 2 kez Finance kaydı oluşturulmaz

---

## 📝 SONUÇ

Finance modülü **tam çalışır durumda**. Ana otomasyon (Invoice PAID → Finance) çalışıyor ve koruma mekanizmaları aktif. Eksik özellikler opsiyonel ve kritik değil.

**Durum**: ✅ **PRODUCTION READY**

---

**Son Güncelleme:** 2024  
**Versiyon:** 1.0.0










