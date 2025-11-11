# 🧪 TEST ADIMLARI - Kurum İçi Firmalar Entegrasyonu

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
   
   -- Meeting tablosunda customerCompanyId var mı?
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'Meeting' AND column_name = 'customerCompanyId';
   ```

**Beklenen Sonuç:**
- Tüm tablolarda `customerCompanyId` kolonu UUID tipinde olmalı ✅

---

### 2️⃣ FIRMA OLUŞTURMA VE BAĞLANTI

**Test:** Yeni firma oluşturulduğunda customerCompanyId kaydediliyor mu?

**Adımlar:**
1. `/companies` sayfasına git
2. "Yeni Firma Ekle" butonuna tıkla
3. Formu doldur:
   - Firma Adı: `Test Firma A`
   - Kontak Kişi: `Ahmet Yılmaz`
   - Telefon: `5551234567`
   - Vergi Dairesi: `Kadıköy`
   - Vergi No: `1234567890`
   - Durum: `Potansiyel`
4. "Kaydet" butonuna tıkla
5. Firma detay sayfasına yönlendirilmeli ✅

**Beklenen Sonuç:**
- Firma başarıyla oluşturulmalı
- Firma detay sayfası açılmalı
- Firma bilgileri doğru görünmeli ✅

---

### 3️⃣ GÖRÜŞME OLUŞTURMA (Firma ile bağlantılı)

**Test:** Görüşme oluşturulurken customerCompanyId kaydediliyor mu?

**Adımlar:**
1. Firma detay sayfasında "Görüşme Ekle" butonuna tıkla
2. Formu doldur:
   - Başlık: `Test Görüşmesi`
   - Tarih: Bugünün tarihi
   - Müşteri: (opsiyonel)
   - Fırsat: (opsiyonel)
3. "Kaydet" butonuna tıkla
4. Görüşme detay sayfasına yönlendirilmeli ✅

**Kontrol:**
1. Supabase SQL Editor'de:
   ```sql
   SELECT id, title, "customerCompanyId", "meetingDate"
   FROM "Meeting"
   WHERE title = 'Test Görüşmesi'
   ORDER BY "createdAt" DESC
   LIMIT 1;
   ```

**Beklenen Sonuç:**
- `customerCompanyId` kolonu firma ID'si ile dolu olmalı ✅
- Firma detay sayfasında "Görüşmeler" sekmesinde görünmeli ✅

---

### 4️⃣ FIRSAT OLUŞTURMA (Firma ile bağlantılı)

**Test:** Fırsat oluşturulurken customerCompanyId kaydediliyor mu?

**Adımlar:**
1. Firma detay sayfasında "Fırsat Oluştur" butonuna tıkla (veya `/deals/new?customerCompanyId=...`)
2. Formu doldur:
   - Başlık: `Test Fırsatı`
   - Değer: `10000`
   - Aşama: `LEAD`
3. "Kaydet" butonuna tıkla

**Kontrol:**
1. Supabase SQL Editor'de:
   ```sql
   SELECT id, title, "customerCompanyId", value
   FROM "Deal"
   WHERE title = 'Test Fırsatı'
   ORDER BY "createdAt" DESC
   LIMIT 1;
   ```

**Beklenen Sonuç:**
- `customerCompanyId` kolonu firma ID'si ile dolu olmalı ✅
- Firma detay sayfasında "Fırsatlar" sekmesinde görünmeli ✅

---

### 5️⃣ TEKLİF OLUŞTURMA (Firma ile bağlantılı)

**Test:** Teklif oluşturulurken customerCompanyId kaydediliyor mu?

**Adımlar:**
1. Firma detay sayfasında "Teklif Oluştur" butonuna tıkla (veya `/quotes/new?customerCompanyId=...`)
2. Formu doldur:
   - Başlık: `Test Teklifi`
   - Toplam: `5000`
   - Durum: `DRAFT`
3. "Kaydet" butonuna tıkla

**Kontrol:**
1. Supabase SQL Editor'de:
   ```sql
   SELECT id, title, "customerCompanyId", total
   FROM "Quote"
   WHERE title = 'Test Teklifi'
   ORDER BY "createdAt" DESC
   LIMIT 1;
   ```

**Beklenen Sonuç:**
- `customerCompanyId` kolonu firma ID'si ile dolu olmalı ✅
- Firma detay sayfasında "Teklifler" sekmesinde görünmeli ✅

---

### 6️⃣ FATURA OLUŞTURMA (Firma ile bağlantılı)

**Test:** Fatura oluşturulurken customerCompanyId kaydediliyor mu?

**Adımlar:**
1. Firma detay sayfasında "Fatura Oluştur" butonuna tıkla (veya `/invoices/new?customerCompanyId=...`)
2. Formu doldur:
   - Başlık: `Test Faturası`
   - Toplam: `5000`
   - Durum: `DRAFT`
   - Tip: `SALES`
3. "Kaydet" butonuna tıkla

**Kontrol:**
1. Supabase SQL Editor'de:
   ```sql
   SELECT id, title, "customerCompanyId", total
   FROM "Invoice"
   WHERE title = 'Test Faturası'
   ORDER BY "createdAt" DESC
   LIMIT 1;
   ```

**Beklenen Sonuç:**
- `customerCompanyId` kolonu firma ID'si ile dolu olmalı ✅
- Firma detay sayfasında "Faturalar" sekmesinde görünmeli ✅

---

### 7️⃣ SEVKİYAT OLUŞTURMA (Fatura ile bağlantılı)

**Test:** Sevkiyat oluşturulurken customerCompanyId otomatik kaydediliyor mu?

**Adımlar:**
1. Fatura detay sayfasından sevkiyat oluştur
2. Sevkiyat oluşturulduğunda faturadan customerCompanyId otomatik alınmalı

**Kontrol:**
1. Supabase SQL Editor'de:
   ```sql
   SELECT s.id, s."invoiceId", s."customerCompanyId", i."customerCompanyId" as invoice_customer_company_id
   FROM "Shipment" s
   JOIN "Invoice" i ON s."invoiceId" = i.id
   ORDER BY s."createdAt" DESC
   LIMIT 1;
   ```

**Beklenen Sonuç:**
- `customerCompanyId` kolonu faturadan otomatik alınmalı ✅
- Firma detay sayfasında "Sevkiyatlar" sekmesinde görünmeli ✅

---

### 8️⃣ GİDER OLUŞTURMA (Firma ile bağlantılı)

**Test:** Gider oluşturulurken customerCompanyId kaydediliyor mu?

**Adımlar:**
1. Firma detay sayfasında "Gider Gir" butonuna tıkla (veya `/finance/new?customerCompanyId=...`)
2. Formu doldur:
   - Tip: `EXPENSE`
   - Tutar: `500`
   - Açıklama: `Test Gideri`
3. "Kaydet" butonuna tıkla

**Kontrol:**
1. Supabase SQL Editor'de:
   ```sql
   SELECT id, type, amount, "customerCompanyId", description
   FROM "Finance"
   WHERE description LIKE '%Test Gideri%'
   ORDER BY "createdAt" DESC
   LIMIT 1;
   ```

**Beklenen Sonuç:**
- `customerCompanyId` kolonu firma ID'si ile dolu olmalı ✅
- Firma detay sayfasında "Giderler" sekmesinde görünmeli ✅

---

### 9️⃣ FIRMA DETAY SAYFASI - SEKMELER

**Test:** Firma detay sayfasında sekmeler çalışıyor mu?

**Adımlar:**
1. Bir firma detay sayfasına git (`/companies/[id]`)
2. Sekmeleri kontrol et:
   - **Görüşmeler** sekmesi
   - **Fırsatlar** sekmesi
   - **Teklifler** sekmesi
   - **Faturalar** sekmesi
   - **Sevkiyatlar** sekmesi
   - **Giderler** sekmesi
3. Her sekmede ilgili veriler görünmeli ✅

**Beklenen Sonuç:**
- Tüm sekmeler çalışmalı
- Her sekmede sadece o firmaya ait veriler görünmeli ✅

---

### 🔟 API FİLTRELEME KONTROLÜ

**Test:** API endpoint'leri customerCompanyId ile filtreleme yapıyor mu?

**Adımlar:**
1. Bir firma ID'si al (örnek: `abc123`)
2. API endpoint'lerini test et:

```bash
# Görüşmeler
curl "http://localhost:3000/api/meetings?customerCompanyId=abc123"

# Fırsatlar
curl "http://localhost:3000/api/deals?customerCompanyId=abc123"

# Teklifler
curl "http://localhost:3000/api/quotes?customerCompanyId=abc123"

# Faturalar
curl "http://localhost:3000/api/invoices?customerCompanyId=abc123"

# Sevkiyatlar
curl "http://localhost:3000/api/shipments?customerCompanyId=abc123"

# Giderler
curl "http://localhost:3000/api/finance?customerCompanyId=abc123"
```

**Beklenen Sonuç:**
- Her endpoint sadece o firmaya ait verileri döndürmeli ✅
- Filtreleme doğru çalışmalı ✅

---

## ✅ BAŞARI KRİTERLERİ

- [x] Migration başarıyla çalıştı
- [ ] Tüm foreign key kolonları eklendi
- [ ] Firma oluşturma çalışıyor
- [ ] Görüşme oluşturma customerCompanyId kaydediyor
- [ ] Fırsat oluşturma customerCompanyId kaydediyor
- [ ] Teklif oluşturma customerCompanyId kaydediyor
- [ ] Fatura oluşturma customerCompanyId kaydediyor
- [ ] Sevkiyat oluşturma customerCompanyId otomatik alıyor
- [ ] Gider oluşturma customerCompanyId kaydediyor
- [ ] Firma detay sayfası sekmeleri çalışıyor
- [ ] API filtreleme doğru çalışıyor

---

## 🐛 BİLİNEN SORUNLAR

- Henüz bilinen sorun yok ✅

---

## 📝 NOTLAR

- Migration çalıştırılmadan önce backup alınmalı
- Tüm testler başarıyla geçmeli
- Production'a deploy etmeden önce tüm testleri tekrar çalıştır











