# 🔍 Tüm Eksikler ve İlişkiler Raporu

**Tarih:** 2024  
**Durum:** ✅ SQL Hatası Düzeltildi - Eksikler Tespit Edildi

---

## 🐛 DÜZELTİLEN SQL HATASI

### Hata:
```
ERROR: 42703: column new.dueDate does not exist
LINE 49: WHEN (NEW."dueDate" IS NOT NULL AND NEW.status NOT IN ('PAID', 'CANCELLED'))
```

### Çözüm:
- `027_invoice_due_date_notifications.sql` migration dosyasına kolon kontrolü eklendi
- `dueDate` ve `invoiceNumber` kolonları migration başında kontrol edilip ekleniyor
- Index'ler de eklendi

---

## ✅ TAMAMLANAN OTOMASYONLAR

### 1. **Otomatik Numara Oluşturma** ✅
- ✅ Invoice Number: `INV-YYYY-MM-XXXX` formatında otomatik oluşturuluyor
- ✅ Quote Number: `QUO-YYYY-MM-XXXX` formatında otomatik oluşturuluyor (title'a ekleniyor)

### 2. **Fatura Vadesi Bildirimleri** ✅
- ✅ OVERDUE bildirimi: Vade geçtiğinde otomatik bildirim (database trigger + API kontrolü)
- ✅ Vade yaklaşıyor bildirimi: 3 gün öncesi uyarı, 1 gün öncesi kritik

### 3. **Task DONE → ActivityLog + Bildirim** ✅
- ✅ Görev tamamlandığında özel ActivityLog kaydı
- ✅ Admin ve SuperAdmin'e bildirim gönderiliyor

### 4. **Ticket RESOLVED/CLOSED → ActivityLog + Bildirim** ✅
- ✅ Destek talebi çözüldüğünde/kapatıldığında özel ActivityLog kaydı
- ✅ Admin ve SuperAdmin'e bildirim gönderiliyor

### 5. **Deal CLOSED → ActivityLog + Bildirim** ✅
- ✅ Fırsat kapatıldığında özel ActivityLog kaydı
- ✅ Admin, Sales ve SuperAdmin'e bildirim gönderiliyor

### 6. **Quote DECLINED → ActivityLog + Bildirim** ✅
- ✅ Teklif reddedildiğinde özel ActivityLog kaydı
- ✅ Admin, Sales ve SuperAdmin'e bildirim gönderiliyor

---

## ❌ EKSİK OTOMASYONLAR

### 1. **Scheduled Jobs (Zamanlanmış Görevler)** 🔴 **YÜKSEK ÖNCELİK**

#### Eksik:
- ❌ **Günlük OVERDUE Kontrolü**
  - Şu an: Sadece INSERT/UPDATE trigger'ları var
  - Olması gereken: Her gün çalışacak bir scheduled job ile tüm OVERDUE faturaları kontrol etmeli
  - Çözüm: Vercel Cron veya Supabase Edge Function ile günlük job

- ❌ **Günlük Vade Yaklaşıyor Kontrolü**
  - Şu an: Sadece INSERT/UPDATE trigger'ları var
  - Olması gereken: Her gün çalışacak bir scheduled job ile vade yaklaşan faturaları kontrol etmeli

#### Önerilen Çözüm:
```typescript
// src/app/api/cron/check-overdue-invoices/route.ts
export async function GET(request: Request) {
  // Vercel Cron veya Supabase Edge Function
  // Her gün 09:00'da çalışacak
  const supabase = getSupabaseWithServiceRole()
  
  // OVERDUE faturaları bul
  const { data: overdueInvoices } = await supabase
    .from('Invoice')
    .select('*')
    .lt('dueDate', new Date().toISOString().split('T')[0])
    .not('status', 'in', '(PAID,CANCELLED)')
  
  // Bildirim gönder
  // ...
}
```

---

### 2. **Invoice Status Otomasyonları** 🟡 **ORTA ÖNCELİK**

#### Eksik:
- ❌ **Invoice SENT → Otomatik OVERDUE Kontrolü**
  - Şu an: Sadece dueDate değiştiğinde kontrol ediliyor
  - Olması gereken: Invoice SENT durumuna geçtiğinde dueDate varsa OVERDUE kontrolü yapılmalı

- ❌ **Invoice PAID → Otomatik Status Güncelleme**
  - Şu an: Manuel olarak PAID yapılıyor
  - Olması gereken: paymentDate doldurulduğunda otomatik PAID yapılabilir (opsiyonel)

---

### 3. **Quote Status Otomasyonları** 🟡 **ORTA ÖNCELİK**

#### Eksik:
- ❌ **Quote EXPIRED → Otomatik Status Güncelleme**
  - Şu an: 30 gün sonra EXPIRED yapılıyor (trigger var)
  - ⚠️ **KONTROL EDİLMELİ:** Bu trigger çalışıyor mu?

- ❌ **Quote SENT → Otomatik Hatırlatma**
  - Şu an: validUntil 2 gün öncesi bildirim var
  - Olması gereken: SENT durumuna geçtiğinde müşteriye otomatik e-posta gönderilebilir (opsiyonel)

---

### 4. **Deal Status Otomasyonları** 🟡 **ORTA ÖNCELİK**

#### Eksik:
- ❌ **Deal WON → Otomatik Quote Oluştur (Opsiyonel)**
  - Şu an: Manuel olarak Quote oluşturuluyor
  - Olması gereken: Deal WON olduğunda kullanıcı tercihine bağlı otomatik Quote oluşturulabilir

- ❌ **Deal LOST → ActivityLog + Bildirim**
  - Şu an: Deal LOST olduğunda özel ActivityLog yok
  - Olması gereken: Deal LOST olduğunda özel ActivityLog ve bildirim

---

### 5. **Task Otomasyonları** 🟡 **ORTA ÖNCELİK**

#### Eksik:
- ❌ **Task Geç Kaldı → Bildirim**
  - Şu an: Task dueDate geçtiğinde bildirim yok
  - Olması gereken: Task dueDate geçtiğinde ve status DONE değilse bildirim gönderilmeli

- ❌ **Task Yaklaşıyor → Bildirim**
  - Şu an: Task dueDate yaklaştığında bildirim yok
  - Olması gereken: Task dueDate 1 gün öncesi bildirim gönderilmeli

---

### 6. **Ticket Otomasyonları** 🟡 **ORTA ÖNCELİK**

#### Eksik:
- ❌ **Ticket Geç Kaldı → Bildirim**
  - Şu an: Ticket uzun süredir açıksa bildirim yok
  - Olması gereken: Ticket 7 günden uzun süredir açıksa bildirim gönderilmeli

- ❌ **Ticket Atandı → Bildirim**
  - Şu an: Ticket atandığında bildirim var mı kontrol edilmeli
  - Olması gereken: Ticket assignedTo değiştiğinde atanan kullanıcıya bildirim

---

### 7. **Product Otomasyonları** 🟢 **DÜŞÜK ÖNCELİK**

#### Eksik:
- ❌ **Düşük Stok → Bildirim (Tekrar)**
  - Şu an: Düşük stok uyarısı trigger var
  - ⚠️ **KONTROL EDİLMELİ:** Bu trigger çalışıyor mu? Bildirim gönderiliyor mu?

- ❌ **Stok Sıfır → Bildirim**
  - Şu an: Stok sıfır olduğunda özel bildirim yok
  - Olması gereken: Stok 0 olduğunda kritik bildirim gönderilmeli

---

### 8. **Customer Otomasyonları** 🟢 **DÜŞÜK ÖNCELİK**

#### Eksik:
- ❌ **Customer Doğum Günü → Bildirim**
  - Şu an: Customer birthday alanı var ama bildirim yok
  - Olması gereken: Customer doğum günü yaklaştığında bildirim gönderilmeli

- ❌ **Customer Uzun Süre İletişim Yok → Bildirim**
  - Şu an: lastInteractionDate var ama bildirim yok
  - Olması gereken: Customer ile 30 günden uzun süredir iletişim yoksa bildirim gönderilmeli

---

## 🔗 EKSİK İLİŞKİLER

### 1. **Foreign Key İlişkileri** ⚠️ **KONTROL EDİLMELİ**

#### Eksik:
- ❌ **Invoice → CustomerCompany İlişkisi**
  - Şu an: `customerCompanyId` kolonu var ama foreign key constraint yok
  - Olması gereken: `ALTER TABLE "Invoice" ADD CONSTRAINT fk_invoice_customercompany FOREIGN KEY ("customerCompanyId") REFERENCES "CustomerCompany"(id) ON DELETE SET NULL;`

- ❌ **Quote → CustomerCompany İlişkisi**
  - Şu an: `customerCompanyId` kolonu var ama foreign key constraint yok
  - Olması gereken: `ALTER TABLE "Quote" ADD CONSTRAINT fk_quote_customercompany FOREIGN KEY ("customerCompanyId") REFERENCES "CustomerCompany"(id) ON DELETE SET NULL;`

- ❌ **Deal → CustomerCompany İlişkisi**
  - Şu an: `customerCompanyId` kolonu var ama foreign key constraint yok
  - Olması gereken: `ALTER TABLE "Deal" ADD CONSTRAINT fk_deal_customercompany FOREIGN KEY ("customerCompanyId") REFERENCES "CustomerCompany"(id) ON DELETE SET NULL;`

- ❌ **Invoice → Vendor İlişkisi**
  - Şu an: `vendorId` kolonu var ama foreign key constraint yok
  - Olması gereken: `ALTER TABLE "Invoice" ADD CONSTRAINT fk_invoice_vendor FOREIGN KEY ("vendorId") REFERENCES "Vendor"(id) ON DELETE SET NULL;`

---

### 2. **İlişkisel Bütünlük Kontrolleri** ⚠️ **KONTROL EDİLMELİ**

#### Eksik:
- ❌ **Orphaned Records Kontrolü**
  - Şu an: Silinen parent kayıtların child kayıtları kontrol edilmiyor
  - Olması gereken: Foreign key constraint'ler ile otomatik kontrol edilmeli

- ❌ **Cascade Delete Kontrolü**
  - Şu an: Company silindiğinde tüm kayıtlar siliniyor (CASCADE)
  - ⚠️ **KONTROL EDİLMELİ:** Bu doğru mu? Soft delete kullanılmalı mı?

---

### 3. **Index Eksikleri** 🟡 **ORTA ÖNCELİK**

#### Eksik:
- ❌ **Invoice → dueDate Index**
  - Şu an: Migration'da eklendi ama kontrol edilmeli
  - Olması gereken: `CREATE INDEX IF NOT EXISTS idx_invoice_due_date ON "Invoice"("dueDate") WHERE "dueDate" IS NOT NULL;`

- ❌ **Quote → validUntil Index**
  - Şu an: Quote validUntil için index yok
  - Olması gereken: `CREATE INDEX IF NOT EXISTS idx_quote_valid_until ON "Quote"("validUntil") WHERE "validUntil" IS NOT NULL;`

- ❌ **Task → dueDate Index**
  - Şu an: Task dueDate için index var mı kontrol edilmeli
  - Olması gereken: `CREATE INDEX IF NOT EXISTS idx_task_due_date ON "Task"("dueDate") WHERE "dueDate" IS NOT NULL;`

---

## 📊 ÖNCELİK MATRİSİ

### 🔴 **YÜKSEK ÖNCELİK (Kritik)**
1. ✅ **SQL Hatası Düzeltildi** (dueDate kolonu eklendi)
2. ❌ **Scheduled Jobs** (Günlük OVERDUE ve vade yaklaşıyor kontrolü)
3. ❌ **Foreign Key Constraints** (customerCompanyId, vendorId ilişkileri)

### 🟡 **ORTA ÖNCELİK**
4. ❌ **Invoice Status Otomasyonları** (SENT → OVERDUE kontrolü)
5. ❌ **Quote Status Otomasyonları** (EXPIRED kontrolü)
6. ❌ **Deal Status Otomasyonları** (LOST → ActivityLog)
7. ❌ **Task Otomasyonları** (Geç kaldı, yaklaşıyor bildirimleri)
8. ❌ **Ticket Otomasyonları** (Geç kaldı, atandı bildirimleri)
9. ❌ **Index Eksikleri** (dueDate, validUntil index'leri)

### 🟢 **DÜŞÜK ÖNCELİK (İyileştirme)**
10. ❌ **Product Otomasyonları** (Stok sıfır bildirimi)
11. ❌ **Customer Otomasyonları** (Doğum günü, uzun süre iletişim yok)

---

## 🎯 ÖNERİLEN UYGULAMA SIRASI

### Faz 1: Kritik Düzeltmeler (2-3 saat)
1. ✅ SQL hatası düzeltildi
2. Foreign key constraint'leri ekle
3. Scheduled job'ları oluştur (Vercel Cron)

### Faz 2: Orta Öncelikli Otomasyonlar (4-5 saat)
4. Invoice/Quote/Deal status otomasyonları
5. Task/Ticket otomasyonları
6. Index'leri ekle

### Faz 3: İyileştirmeler (2-3 saat)
7. Product/Customer otomasyonları
8. Soft delete kontrolü

---

## 📝 SONUÇ

**Toplam Eksik:**
- 🔴 **3 Yüksek Öncelikli** (1 düzeltildi, 2 kaldı)
- 🟡 **6 Orta Öncelikli**
- 🟢 **2 Düşük Öncelikli**

**Toplam:** 11 eksik otomasyon/ilişki

**Durum:** SQL hatası düzeltildi, eksikler tespit edildi ve önceliklendirildi.

---

**Son Güncelleme:** 2024  
**Durum:** ✅ SQL Hatası Düzeltildi - Eksikler Listelendi










