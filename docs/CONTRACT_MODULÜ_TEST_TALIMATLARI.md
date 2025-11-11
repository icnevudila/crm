# 🎉 CONTRACT MODÜLÜ TAMAMLANDI - TEST TALİMATLARI

**Tarih:** 9 Kasım 2025  
**Durum:** ✅ %100 Hazır

---

## ✅ TAMAMLANAN İŞLER

### 1. Database (Migration)
- ✅ 4 yeni tablo: Contract, ContractRenewal, ContractTerm, ContractMilestone
- ✅ 6 otomasyon: Auto-expire, renewal notifications, auto-renew, deal→contract, customer stats, MRR/ARR
- ✅ RLS politikaları
- ✅ Trigger'lar ve fonksiyonlar
- ✅ İndeksler

### 2. Backend API
- ✅ `/api/contracts` - GET (liste), POST (oluştur)
- ✅ `/api/contracts/[id]` - GET (detay), PUT (güncelle), DELETE (sil)
- ✅ Auth ve RLS kontrolleri
- ✅ ActivityLog entegrasyonu

### 3. Frontend UI
- ✅ `ContractList.tsx` - Sözleşme listesi (arama, filtre, CRUD)
- ✅ `ContractForm.tsx` - Form component (yeni/düzenle)
- ✅ `/[locale]/contracts/page.tsx` - Sayfa
- ✅ Sidebar'a "Sözleşmeler" menüsü eklendi

### 4. Test Verileri
- ✅ `seed_contracts_test.sql` - 5 örnek sözleşme hazır

---

## 🚀 TEST ADIMLARI

### ADIM 1: Test Verilerini Yükle (Supabase)

1. **Supabase Dashboard'u Aç**
   - https://supabase.com → Projenizi seçin
   - Sol menüden **SQL Editor** tıklayın

2. **Test Verilerini Çalıştır**
   - `supabase/seed_contracts_test.sql` dosyasını açın
   - Tüm SQL'i kopyalayın
   - SQL Editor'e yapıştırın
   - **RUN** butonuna basın

3. **Çıktıyı Kontrol Edin**
   ```
   ✅ Contract 1 oluşturuldu (ACTIVE)
   ✅ Contract 2 oluşturuldu (Yakında dolacak - 25 gün)
   ✅ Contract 3 oluşturuldu (DRAFT)
   ✅ Contract 4 oluşturuldu (EXPIRED)
   ✅ Contract 5 oluşturuldu (Auto-renew 5 gün içinde)
   🎉 TEST VERİLERİ BAŞARIYLA OLUŞTURULDU!
   ```

---

### ADIM 2: Uygulamayı Başlat

```bash
# Terminal'de proje klasörüne git
cd C:\Users\TP2\Documents\CRMV2

# Uygulamayı başlat
npm run dev
```

**Tarayıcıda aç:**
- http://localhost:3000

---

### ADIM 3: UI'ı Test Et

#### 3.1. Sözleşmeler Sayfasını Aç
1. Sol menüden **"Sözleşmeler"** tıklayın (📜 ikonu)
2. 5 sözleşme görmelisiniz

#### 3.2. Liste Özelliklerini Test Et
- ✅ **Arama:** "SOZL-2024" yazın → filtrelenmeli
- ✅ **Durum filtresi:** "Aktif" seçin → sadece aktif olanlar
- ✅ **Tip filtresi:** "Bakım" seçin → sadece bakım sözleşmeleri
- ✅ **Uyarı badge'i:** 25 gün kala dolacak sözleşmede "⚠️ 25 gün kaldı" görünmeli
- ✅ **Otomatik yenileme badge'i:** "🔄 Otomatik Yenileme" badge'i görmeli

#### 3.3. Yeni Sözleşme Oluştur
1. **"Yeni Sözleşme"** butonuna tıklayın
2. Formu doldurun:
   - **Başlık:** "Test Sözleşmesi"
   - **Müşteri:** Herhangi birini seçin
   - **Tip:** "Hizmet"
   - **Başlangıç:** Bugün
   - **Bitiş:** 1 yıl sonra
   - **Tutar:** 10000
   - **KDV:** 18
   - **Toplam:** 11800 TL (otomatik hesaplanmalı)
3. **"Oluştur"** butonuna tıklayın
4. ✅ Liste sayfasında yeni sözleşme görünmeli (en üstte)

#### 3.4. Sözleşme Düzenle
1. Herhangi bir sözleşmenin **"Düzenle"** (✏️) butonuna tıklayın
2. Başlığı değiştirin
3. **"Güncelle"** tıklayın
4. ✅ Liste sayfasında değişiklik görünmeli

#### 3.5. Sözleşme Sil
1. **DRAFT** durumundaki bir sözleşme bulun
2. **"Sil"** (🗑️) butonuna tıklayın
3. Onay dialogunda **"Tamam"** tıklayın
4. ✅ Sözleşme listeden silinmeli

**NOT:** Aktif sözleşmeleri silemezsiniz (buton disabled olacak)

---

### ADIM 4: Otomasyonları Test Et (Supabase)

Supabase SQL Editor'de:

#### 4.1. Yenileme Bildirimi Testi
```sql
-- Yenileme bildirimi oluştur (30 gün içinde dolacak sözleşmeler için)
SELECT create_renewal_notifications();

-- Notification'ları kontrol et
SELECT * FROM "Notification" 
WHERE "relatedTo" = 'Contract' 
ORDER BY "createdAt" DESC 
LIMIT 5;
```

**Beklenen:** SOZL-2024-0002 için bildirim oluşmalı (25 gün kala)

#### 4.2. Otomatik Expire Testi
```sql
-- Süresi dolan sözleşmeleri expire et
SELECT auto_expire_contracts();

-- Kontrol et
SELECT "contractNumber", status, "endDate" 
FROM "Contract" 
WHERE status = 'EXPIRED';
```

**Beklenen:** SOZL-2023-0099 EXPIRED olmalı

#### 4.3. Auto-Renew Testi
```sql
-- Otomatik yenileme çalıştır (7 gün içinde dolacaklar)
SELECT auto_renew_contracts();

-- Yeni sözleşme kontrol et
SELECT "contractNumber", status, "startDate", "endDate" 
FROM "Contract" 
WHERE "contractNumber" LIKE 'SOZL-2024-0004%'
ORDER BY "createdAt" DESC;
```

**Beklenen:** SOZL-2024-0004-R2024 gibi yeni sözleşme oluşmalı

#### 4.4. Customer Stats Testi
```sql
-- Customer istatistikleri kontrol et
SELECT 
  name,
  "activeContractsCount",
  "totalContractValue",
  "lastContractDate"
FROM "Customer"
WHERE "activeContractsCount" > 0
LIMIT 5;
```

**Beklenen:** activeContractsCount ve totalContractValue otomatik güncellenmiş olmalı

#### 4.5. MRR/ARR Hesaplama Testi
```sql
-- Monthly Recurring Revenue
SELECT calculate_mrr() as "MRR";

-- Annual Recurring Revenue
SELECT calculate_arr() as "ARR";
```

**Beklenen:** SUBSCRIPTION tipindeki sözleşmelerden hesaplanan MRR/ARR değerleri

---

### ADIM 5: Deal → Contract Otomasyonu Test Et

1. **Deal Oluştur**
   - `/deals` sayfasına gidin
   - Yeni deal oluşturun
   - Stage: "WON" seçin

2. **Kontrol Et**
   ```sql
   SELECT * FROM "Contract" 
   WHERE "dealId" IS NOT NULL 
   ORDER BY "createdAt" DESC 
   LIMIT 1;
   ```

**Beklenen:** Otomatik DRAFT sözleşme oluşmalı

---

### ADIM 6: Milestone'ları Kontrol Et

```sql
-- Milestone'ları göster
SELECT 
  c."contractNumber",
  m.title as "milestoneName",
  m."dueDate",
  m.value,
  m.status
FROM "ContractMilestone" m
JOIN "Contract" c ON c.id = m."contractId"
ORDER BY m."dueDate";
```

**Beklenen:** SOZL-2024-0003 için 4 milestone görmeli

---

## 🎨 CONTACT MODÜLÜNÜ TEST ET

Contact modülü de daha önce eklenmişti. Şimdi test edelim:

### Contact Test Adımları

1. **Sayfayı Aç**
   - Sol menüden **"Contacts"** tıklayın

2. **Yeni Contact Ekle**
   - "Yeni Contact" butonuna tıklayın
   - Form doldurun:
     - **First Name:** "Ahmet"
     - **Last Name:** "Yılmaz"
     - **Email:** "ahmet@test.com"
     - **Phone:** "+90 555 123 4567"
     - **Role:** "Karar Verici"
     - **Primary Contact:** ✅ (işaretle)
   - "Oluştur" tıklayın

3. **Listeyi Kontrol Et**
   - ✅ Yeni contact listenin en üstünde görünmeli
   - ✅ "Primary" badge'i görünmeli

4. **Arama Testi**
   - Arama kutusuna "Ahmet" yazın
   - ✅ Filtrelenmiş sonuçlar görünmeli

5. **Düzenle ve Sil**
   - Edit icon'a tıklayın → değişiklik yapın → kaydedin
   - Delete icon'a tıklayın → onaylayın

---

## 📊 VERİTABANI SORGU ÖRNEKLERİ

### En Değerli 10 Sözleşme
```sql
SELECT 
  "contractNumber",
  title,
  value,
  currency,
  status
FROM "Contract"
ORDER BY value DESC
LIMIT 10;
```

### Yenileme Gerektirenler (30 Gün İçinde)
```sql
SELECT 
  "contractNumber",
  title,
  "endDate",
  "endDate" - CURRENT_DATE as "kalanGun"
FROM "Contract"
WHERE 
  status = 'ACTIVE'
  AND "endDate" BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
ORDER BY "endDate";
```

### Müşteri Bazlı Sözleşme Özeti
```sql
SELECT 
  c.name as "musteriAdi",
  COUNT(con.id) as "sozlesmeSayisi",
  SUM(CASE WHEN con.status = 'ACTIVE' THEN 1 ELSE 0 END) as "aktif",
  SUM(con.value) as "toplamDeger"
FROM "Customer" c
LEFT JOIN "Contract" con ON c.id = con."customerId"
GROUP BY c.id, c.name
HAVING COUNT(con.id) > 0
ORDER BY "toplamDeger" DESC;
```

### Sözleşme Tiplerine Göre Dağılım
```sql
SELECT 
  type,
  COUNT(*) as "sayi",
  SUM(value) as "toplamDeger",
  AVG(value) as "ortalama"
FROM "Contract"
WHERE status = 'ACTIVE'
GROUP BY type
ORDER BY "toplamDeger" DESC;
```

---

## ⚠️ BİLİNEN SORUNLAR ve ÇÖZÜMLER

### Sorun 1: "Contract not found" hatası
**Çözüm:** Session ve companyId kontrolü yapın. Doğru company'ye ait sözleşmeleri mi çekiyorsunuz?

### Sorun 2: Aktif sözleşme silinemedi
**Çözüm:** Bu beklenen davranış. Aktif sözleşmeleri silmek için önce statüsünü değiştirin.

### Sorun 3: Otomatik yenileme çalışmadı
**Çözüm:** Kontrol listesi:
- `autoRenewEnabled = true` mi?
- `renewalType = 'AUTO'` mu?
- `endDate` 7 gün içinde mi?
- `status = 'ACTIVE'` mi?

### Sorun 4: Customer stats güncellenmiyor
**Çözüm:** Trigger kontrolü:
```sql
-- Trigger'ı manuel tetikle
SELECT calculate_customer_contract_stats('customer-id-buraya');
```

---

## 🎯 PERFORMANS BEKLENTİLERİ

### Hedefler
| Metrik | Hedef | Test |
|--------|-------|------|
| Liste yükleme | <500ms | ✅ Test edin |
| Sözleşme oluşturma | <300ms | ✅ Test edin |
| Arama (debounced) | <200ms | ✅ Test edin |
| Form açılma | <100ms | ✅ Test edin |

### Test Komutu
```bash
# Chrome DevTools → Network tab
# Liste sayfasına git ve süreyi ölç
```

---

## 📱 MOBİLE TEST

### Test Adımları
1. Chrome DevTools → Toggle device toolbar (Ctrl+Shift+M)
2. iPhone 12 Pro seçin
3. Sözleşmeler sayfasını test edin
4. ✅ Tablo scroll edilebilir olmalı
5. ✅ Butonlar tıklanabilir olmalı
6. ✅ Form responsive olmalı

---

## 🎉 TAMAMLANDI!

### Ne Eklendi?
- 📄 **Contract Management System** (tam özellikli)
- 🤖 **6 Otomasyon** (expire, renewal, auto-renew, deal→contract, stats, MRR/ARR)
- 🎨 **UI Components** (liste, form, sayfa)
- 🧪 **Test Verileri** (5 örnek sözleşme)
- 📊 **Raporlar** (MRR, ARR, customer stats)

### Sonraki Adımlar (Opsiyonel)
1. 📧 Email bildirimleri ekle (yenileme için)
2. 📄 PDF export (sözleşme detayı)
3. 📊 Dashboard'a MRR/ARR kartları ekle
4. 🔔 Push notifications
5. 📱 Mobile app entegrasyonu

---

## 📞 İLETİŞİM

Herhangi bir sorun yaşarsanız:
1. Terminal'de hata loglarını kontrol edin
2. Supabase Dashboard → Logs'a bakın
3. Browser Console'u açın (F12)

---

**HER ŞEY HAZIR! TEST EDİN VE KEYFİNİ ÇIKARIN! 🚀**

*Son güncelleme: 9 Kasım 2025*



