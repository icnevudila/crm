# 🧪 TEST ADIMLARI - Kurum İçi Firmalar Entegrasyonu (FINAL)

## ✅ ÖN HAZIRLIK

1. **Migration'ı çalıştır:**
   ```sql
   -- Supabase SQL Editor'de çalıştır:
   -- supabase/migrations/018_internal_firms_integration.sql
   ```

2. **Build kontrolü:**
   ```bash
   npm run build
   ```
   - Hata olmamalı ✅

---

## 📋 TEST SENARYOLARI

### 1️⃣ MIGRATION KONTROLÜ

**Test:** Foreign key kolonları eklendi mi?

**Adımlar:**
1. Supabase SQL Editor'de:
   ```sql
   -- Deal tablosunda customerCompanyId var mı?
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'Deal' AND column_name = 'customerCompanyId';
   
   -- Quote tablosunda customerCompanyId var mı?
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'Quote' AND column_name = 'customerCompanyId';
   
   -- Invoice tablosunda customerCompanyId var mı?
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'Invoice' AND column_name = 'customerCompanyId';
   
   -- Shipment tablosunda customerCompanyId var mı?
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'Shipment' AND column_name = 'customerCompanyId';
   
   -- Finance tablosunda customerCompanyId var mı?
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'Finance' AND column_name = 'customerCompanyId';
   
   -- Meeting tablosunda customerCompanyId var mı? (eğer tablo varsa)
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'Meeting' AND column_name = 'customerCompanyId';
   ```

**Beklenen Sonuç:**
- Tüm tablolarda `customerCompanyId` kolonu UUID tipinde olmalı ✅

---

### 2️⃣ FIRMA DETAY SAYFASI - SEKME TESTİ

**Test:** Firma detay sayfasında sekmeler çalışıyor mu?

**Adımlar:**
1. Bir firma sayfasına git: `/tr/companies/[id]`
2. Sekmeleri kontrol et:
   - ✅ Görüşmeler sekmesi görünüyor mu?
   - ✅ Fırsatlar sekmesi görünüyor mu?
   - ✅ Teklifler sekmesi görünüyor mu?
   - ✅ Faturalar sekmesi görünüyor mu?
   - ✅ Sevkiyatlar sekmesi görünüyor mu?
   - ✅ Giderler sekmesi görünüyor mu?
3. Her sekmede:
   - ✅ İlgili veriler görünüyor mu?
   - ✅ "Tüm [Modül]leri Gör" butonu çalışıyor mu?
   - ✅ Boş durumda "Ekle" butonu görünüyor mu?

**Beklenen Sonuç:**
- Tüm sekmeler çalışıyor ve doğru verileri gösteriyor ✅

---

### 3️⃣ FIRMA BAZLI VERİ OLUŞTURMA TESTİ

**Test:** Firma detay sayfasından yeni kayıt oluşturulduğunda `customerCompanyId` kaydediliyor mu?

**Adımlar:**

#### 3.1. Görüşme Ekleme
1. Firma detay sayfasına git
2. "Görüşme Ekle" butonuna tıkla
3. Görüşme bilgilerini doldur ve kaydet
4. Supabase'de kontrol et:
   ```sql
   SELECT id, title, "customerCompanyId" 
   FROM "Meeting" 
   WHERE "customerCompanyId" = '[firma_id]'
   ORDER BY "createdAt" DESC 
   LIMIT 1;
   ```
5. Firma detay sayfasındaki "Görüşmeler" sekmesinde yeni görüşme görünüyor mu?

**Beklenen Sonuç:**
- Görüşme kaydedildi ve `customerCompanyId` doğru ✅
- Firma detay sayfasında görünüyor ✅

#### 3.2. Fırsat Ekleme
1. Firma detay sayfasından "Fırsat Oluştur" (yoksa manuel ekle)
2. Fırsat bilgilerini doldur ve kaydet
3. Supabase'de kontrol et:
   ```sql
   SELECT id, title, "customerCompanyId" 
   FROM "Deal" 
   WHERE "customerCompanyId" = '[firma_id]'
   ORDER BY "createdAt" DESC 
   LIMIT 1;
   ```
4. Firma detay sayfasındaki "Fırsatlar" sekmesinde yeni fırsat görünüyor mu?

**Beklenen Sonuç:**
- Fırsat kaydedildi ve `customerCompanyId` doğru ✅
- Firma detay sayfasında görünüyor ✅

#### 3.3. Teklif Oluşturma
1. Firma detay sayfasından "Teklif Oluştur" butonuna tıkla
2. Teklif bilgilerini doldur ve kaydet
3. Supabase'de kontrol et:
   ```sql
   SELECT id, title, "customerCompanyId" 
   FROM "Quote" 
   WHERE "customerCompanyId" = '[firma_id]'
   ORDER BY "createdAt" DESC 
   LIMIT 1;
   ```
4. Firma detay sayfasındaki "Teklifler" sekmesinde yeni teklif görünüyor mu?

**Beklenen Sonuç:**
- Teklif kaydedildi ve `customerCompanyId` doğru ✅
- Firma detay sayfasında görünüyor ✅

#### 3.4. Fatura Oluşturma
1. Firma detay sayfasından "Fatura Oluştur" (yoksa manuel ekle)
2. Fatura bilgilerini doldur ve kaydet
3. Supabase'de kontrol et:
   ```sql
   SELECT id, title, "customerCompanyId" 
   FROM "Invoice" 
   WHERE "customerCompanyId" = '[firma_id]'
   ORDER BY "createdAt" DESC 
   LIMIT 1;
   ```
4. Firma detay sayfasındaki "Faturalar" sekmesinde yeni fatura görünüyor mu?

**Beklenen Sonuç:**
- Fatura kaydedildi ve `customerCompanyId` doğru ✅
- Firma detay sayfasında görünüyor ✅

#### 3.5. Gider Girme
1. Firma detay sayfasından "Gider Gir" butonuna tıkla
2. Gider bilgilerini doldur ve kaydet
3. Supabase'de kontrol et:
   ```sql
   SELECT id, type, amount, "customerCompanyId" 
   FROM "Finance" 
   WHERE "customerCompanyId" = '[firma_id]'
   ORDER BY "createdAt" DESC 
   LIMIT 1;
   ```
4. Firma detay sayfasındaki "Giderler" sekmesinde yeni gider görünüyor mu?

**Beklenen Sonuç:**
- Gider kaydedildi ve `customerCompanyId` doğru ✅
- Firma detay sayfasında görünüyor ✅

---

### 4️⃣ API ENDPOINT FİLTRELEME TESTİ

**Test:** API endpoint'leri `customerCompanyId` ile filtreleme yapıyor mu?

**Adımlar:**
1. Bir firma ID'si al: `[firma_id]`
2. API endpoint'lerini test et:

```bash
# Görüşmeler
curl "http://localhost:3000/api/meetings?customerCompanyId=[firma_id]"

# Fırsatlar
curl "http://localhost:3000/api/deals?customerCompanyId=[firma_id]"

# Teklifler
curl "http://localhost:3000/api/quotes?customerCompanyId=[firma_id]"

# Faturalar
curl "http://localhost:3000/api/invoices?customerCompanyId=[firma_id]"

# Sevkiyatlar
curl "http://localhost:3000/api/shipments?customerCompanyId=[firma_id]"

# Giderler
curl "http://localhost:3000/api/finance?customerCompanyId=[firma_id]"
```

**Beklenen Sonuç:**
- Her endpoint sadece ilgili firmanın verilerini döndürüyor ✅
- Filtreleme çalışıyor ✅

---

### 5️⃣ FIRMA DETAY SAYFASI API TESTİ

**Test:** Firma detay sayfası API'si ilişkili verileri çekiyor mu?

**Adımlar:**
1. Bir firma ID'si al: `[firma_id]`
2. API'yi test et:
   ```bash
   curl "http://localhost:3000/api/customer-companies/[firma_id]"
   ```
3. Response'u kontrol et:
   - ✅ `Deal` array'i var mı?
   - ✅ `Quote` array'i var mı?
   - ✅ `Invoice` array'i var mı?
   - ✅ `Shipment` array'i var mı?
   - ✅ `Finance` array'i var mı?
   - ✅ `Meeting` array'i var mı?
   - ✅ `Customer` array'i var mı?

**Beklenen Sonuç:**
- Tüm ilişkili veriler response'da var ✅
- Her array doğru firma ID'sine ait verileri içeriyor ✅

---

### 6️⃣ LİSTE SAYFALARINDA FİLTRELEME TESTİ

**Test:** Liste sayfalarında `customerCompanyId` filtresi çalışıyor mu?

**Adımlar:**
1. Bir firma ID'si al: `[firma_id]`
2. Liste sayfalarına git ve URL'de `customerCompanyId` parametresi ekle:
   - `/tr/meetings?customerCompanyId=[firma_id]`
   - `/tr/deals?customerCompanyId=[firma_id]`
   - `/tr/quotes?customerCompanyId=[firma_id]`
   - `/tr/invoices?customerCompanyId=[firma_id]`
   - `/tr/shipments?customerCompanyId=[firma_id]`
   - `/tr/finance?customerCompanyId=[firma_id]`
3. Her sayfada:
   - ✅ Sadece ilgili firmanın verileri görünüyor mu?
   - ✅ Filtreleme çalışıyor mu?

**Beklenen Sonuç:**
- Tüm liste sayfalarında filtreleme çalışıyor ✅
- Sadece ilgili firmanın verileri görünüyor ✅

---

### 7️⃣ SEVKIYAT OTOMATİK BAĞLANTI TESTİ

**Test:** Fatura oluşturulduğunda sevkiyat otomatik olarak `customerCompanyId` ile bağlanıyor mu?

**Adımlar:**
1. Bir firma için fatura oluştur (satış faturası, malzeme ile)
2. Otomatik oluşturulan sevkiyatı kontrol et:
   ```sql
   SELECT id, "invoiceId", "customerCompanyId" 
   FROM "Shipment" 
   WHERE "invoiceId" = '[fatura_id]'
   ORDER BY "createdAt" DESC 
   LIMIT 1;
   ```
3. Sevkiyatın `customerCompanyId`'si faturadaki firma ID'si ile eşleşiyor mu?

**Beklenen Sonuç:**
- Sevkiyat otomatik oluşturuldu ✅
- `customerCompanyId` doğru bağlandı ✅

---

### 8️⃣ MAL KABUL OTOMATİK BAĞLANTI TESTİ

**Test:** Alış faturası oluşturulduğunda mal kabul otomatik olarak `customerCompanyId` ile bağlanıyor mu?

**Adımlar:**
1. Bir firma için alış faturası oluştur (malzeme ile)
2. Otomatik oluşturulan mal kabul kaydını kontrol et:
   ```sql
   SELECT id, "invoiceId", "customerCompanyId" 
   FROM "PurchaseTransaction" 
   WHERE "invoiceId" = '[fatura_id]'
   ORDER BY "createdAt" DESC 
   LIMIT 1;
   ```
3. Mal kabulün `customerCompanyId`'si faturadaki firma ID'si ile eşleşiyor mu?

**Beklenen Sonuç:**
- Mal kabul otomatik oluşturuldu ✅
- `customerCompanyId` doğru bağlandı ✅

---

## ✅ BAŞARI KRİTERLERİ

- [ ] Migration başarıyla çalıştı
- [ ] Tüm foreign key kolonları eklendi
- [ ] Firma detay sayfasında sekmeler çalışıyor
- [ ] Firma bazlı veri oluşturma çalışıyor (Görüşme, Fırsat, Teklif, Fatura, Gider)
- [ ] API endpoint'leri `customerCompanyId` ile filtreleme yapıyor
- [ ] Firma detay sayfası API'si ilişkili verileri çekiyor
- [ ] Liste sayfalarında filtreleme çalışıyor
- [ ] Sevkiyat otomatik bağlantı çalışıyor
- [ ] Mal kabul otomatik bağlantı çalışıyor

---

## 🐛 BİLİNEN SORUNLAR

- Yok (şimdilik)

---

## 📝 NOTLAR

- Tüm testler başarıyla geçtiğinde entegrasyon tamamlanmış sayılır ✅
- Herhangi bir sorun bulunursa lütfen bildirin











