# 🔄 Eksik Otomasyonlar Raporu

**Tarih:** 2024  
**Durum:** ⚠️ Eksik Otomasyonlar Tespit Edildi

---

## 📋 ÖZET

Sistemdeki mevcut otomasyonlar analiz edildi ve eksik olabilecek otomasyonlar belirlendi.

---

## ✅ MEVCUT OTOMASYONLAR

### 1. **Quote (Teklif) Otomasyonları**
- ✅ **Quote ACCEPTED → Invoice Oluştur** (API endpoint)
- ✅ **Quote ACCEPTED → ActivityLog** (API endpoint)
- ✅ **Quote ACCEPTED → Bildirim** (API endpoint)
- ✅ **Quote Oluşturuldu → Bildirim** (API endpoint)
- ✅ **Quote Güncellendi → Bildirim** (API endpoint - status/total değiştiğinde)
- ✅ **Quote Süresi Dolmak Üzere → Bildirim** (Database trigger - 2 gün öncesi)
- ✅ **Quote Oluşturuldu → Otomatik Görev** (API endpoint - AutoTaskFromQuote)

### 2. **Invoice (Fatura) Otomasyonları**
- ✅ **Invoice PAID → Finance Kaydı Oluştur** (API endpoint)
- ✅ **Invoice PAID → ActivityLog** (API endpoint)
- ✅ **Invoice PAID → Bildirim** (API endpoint)
- ✅ **Invoice Oluşturuldu → Bildirim** (API endpoint)
- ✅ **InvoiceItem INSERT → reservedQuantity Artar** (Database trigger - satış)
- ✅ **InvoiceItem INSERT → incomingQuantity Artar** (Database trigger - alış)
- ✅ **InvoiceItem DELETE → reservedQuantity Azalır** (Database trigger)
- ✅ **InvoiceItem DELETE → incomingQuantity Azalır** (Database trigger - alış)

### 3. **Shipment (Sevkiyat) Otomasyonları**
- ✅ **Shipment APPROVED → Stok Düş** (Database trigger)
- ✅ **Shipment APPROVED → reservedQuantity Azalt** (Database trigger)
- ✅ **Shipment APPROVED → StockMovement Oluştur** (Database trigger)
- ✅ **Shipment DELIVERED → ActivityLog** (API endpoint)
- ✅ **Shipment DELIVERED → Bildirim** (API endpoint)
- ✅ **Shipment Oluşturuldu → Bildirim** (API endpoint)

### 4. **Purchase Transaction (Alış İşlemi) Otomasyonları**
- ✅ **PurchaseTransaction APPROVED → Stok Artır** (Database trigger)
- ✅ **PurchaseTransaction APPROVED → incomingQuantity Azalt** (Database trigger)
- ✅ **PurchaseTransaction APPROVED → StockMovement Oluştur** (Database trigger)

### 5. **Product (Ürün) Otomasyonları**
- ✅ **Düşük Stok Uyarısı** (Database trigger - minimum stok seviyesinin altına düştüğünde)
- ✅ **Stok Hareketi Loglama** (Database trigger - StockMovement oluşturuluyor)

### 6. **Deal (Fırsat) Otomasyonları**
- ✅ **Deal Oluşturuldu → Bildirim** (API endpoint)
- ✅ **Deal Priority Score Otomatik Hesaplama** (Database trigger - auto_calculate_priority_score)
- ✅ **Deal Atandı → Bildirim** (Database trigger - assignedTo değiştiğinde)

### 7. **Task (Görev) Otomasyonları**
- ✅ **Task Oluşturuldu → Bildirim** (API endpoint - atanan kullanıcıya)
- ✅ **Task Atandı → Bildirim** (Database trigger - assignedTo değiştiğinde)

### 8. **Customer (Müşteri) Otomasyonları**
- ✅ **Customer Oluşturuldu → Bildirim** (API endpoint)

### 9. **Notification (Bildirim) Otomasyonları**
- ✅ **Kritik Bildirim → Otomatik Görev Oluştur** (Database trigger - priority='critical' ve actionType='create_task')
- ✅ **Süresi Dolan Bildirimler → Otomatik Arşivle** (Database function - expiresAt < NOW())

### 10. **ActivityLog Otomasyonları**
- ✅ **Tüm CRUD İşlemleri → ActivityLog** (API endpoint'lerde)

---

## ❌ EKSİK OTOMASYONLAR

### 1. **Otomatik Numara Oluşturma** 🔴 **YÜKSEK ÖNCELİK**

#### Eksik:
- ❌ **Invoice Number Otomatik Oluşturma**
  - Şu an: `invoiceNumber` alanı var ama otomatik oluşturulmuyor
  - Olması gereken: Yeni fatura oluşturulduğunda otomatik numara oluşturulmalı
  - Format önerisi: `INV-YYYY-MM-XXXX` (örn: `INV-2024-01-0001`)

- ❌ **Quote Number Otomatik Oluşturma**
  - Şu an: Quote için numara sistemi yok
  - Olması gereken: Yeni teklif oluşturulduğunda otomatik numara oluşturulmalı
  - Format önerisi: `QUO-YYYY-MM-XXXX` (örn: `QUO-2024-01-0001`)

#### Önerilen Çözüm:
```typescript
// src/app/api/invoices/route.ts - POST
export async function POST(request: Request) {
  // ... mevcut kod ...
  
  // Otomatik fatura numarası oluştur
  const year = new Date().getFullYear()
  const month = String(new Date().getMonth() + 1).padStart(2, '0')
  
  // Bu ay oluşturulan fatura sayısını al
  const { count } = await supabase
    .from('Invoice')
    .select('*', { count: 'exact', head: true })
    .eq('companyId', session.user.companyId)
    .gte('createdAt', `${year}-${month}-01`)
    .lt('createdAt', `${year}-${String(parseInt(month) + 1).padStart(2, '0')}-01`)
  
  const invoiceNumber = `INV-${year}-${month}-${String((count || 0) + 1).padStart(4, '0')}`
  
  invoiceData.invoiceNumber = invoiceNumber
  // ... devam ...
}
```

---

### 2. **Fatura Vadesi Bildirimleri** 🔴 **YÜKSEK ÖNCELİK**

#### Eksik:
- ❌ **Invoice OVERDUE → Bildirim**
  - Şu an: OVERDUE durumundaki faturalar için bildirim yok
  - Olması gereken: Fatura vadesi geçtiğinde otomatik bildirim gönderilmeli
  - Trigger: `dueDate < NOW()` ve `status != 'PAID'` ve `status != 'CANCELLED'`

- ❌ **Fatura Vadesi Yaklaşıyor → Bildirim**
  - Şu an: Vade yaklaşan faturalar için bildirim yok
  - Olması gereken: 
    - 3 gün öncesi: Uyarı bildirimi
    - 1 gün öncesi: Kritik bildirimi
  - Trigger: `dueDate BETWEEN NOW() AND NOW() + INTERVAL '3 days'`

#### Önerilen Çözüm:
```sql
-- Database trigger veya scheduled job
CREATE OR REPLACE FUNCTION auto_notify_invoice_overdue()
RETURNS TRIGGER AS $$
BEGIN
  -- Fatura vadesi geçtiğinde bildirim gönder
  IF NEW."dueDate" < NOW() 
     AND NEW.status NOT IN ('PAID', 'CANCELLED')
     AND (OLD."dueDate" IS NULL OR OLD."dueDate" >= NOW() OR OLD.status IN ('PAID', 'CANCELLED')) THEN
    -- Bildirim gönder
    INSERT INTO "Notification" (...)
    VALUES (...)
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Scheduled job için (pg_cron veya Supabase Edge Function)
-- Her gün çalışacak bir job oluştur
```

---

### 3. **Task Tamamlandığında → ActivityLog** 🟡 **ORTA ÖNCELİK**

#### Eksik:
- ❌ **Task DONE → ActivityLog**
  - Şu an: Task durumu değiştiğinde ActivityLog var mı kontrol edilmeli
  - Olması gereken: Task `DONE` durumuna geçtiğinde özel ActivityLog kaydı oluşturulmalı

#### Önerilen Çözüm:
```typescript
// src/app/api/tasks/[id]/route.ts - PUT
export async function PUT(...) {
  // ... mevcut kod ...
  
  if (body.status === 'DONE' && currentTask?.status !== 'DONE') {
    // ActivityLog kaydı
    await supabase.from('ActivityLog').insert([{
      entity: 'Task',
      action: 'UPDATE',
      description: `Görev tamamlandı: ${currentTask.title}`,
      meta: { entity: 'Task', action: 'completed', id, taskId: id },
      userId: session.user.id,
      companyId: session.user.companyId,
    }])
    
    // Bildirim: Görev tamamlandı
    await createNotificationForRole({
      companyId: session.user.companyId,
      role: ['ADMIN', 'SUPER_ADMIN'],
      title: 'Görev Tamamlandı',
      message: `${currentTask.title} görevi tamamlandı.`,
      type: 'success',
      relatedTo: 'Task',
      relatedId: id,
    })
  }
}
```

---

### 4. **Ticket Çözüldüğünde → ActivityLog** 🟡 **ORTA ÖNCELİK**

#### Eksik:
- ❌ **Ticket RESOLVED → ActivityLog**
  - Şu an: Ticket durumu değiştiğinde ActivityLog var mı kontrol edilmeli
  - Olması gereken: Ticket `RESOLVED` veya `CLOSED` durumuna geçtiğinde özel ActivityLog kaydı oluşturulmalı

#### Önerilen Çözüm:
```typescript
// src/app/api/tickets/[id]/route.ts - PUT
export async function PUT(...) {
  // ... mevcut kod ...
  
  if ((body.status === 'RESOLVED' || body.status === 'CLOSED') 
      && currentTicket?.status !== 'RESOLVED' && currentTicket?.status !== 'CLOSED') {
    // ActivityLog kaydı
    await supabase.from('ActivityLog').insert([{
      entity: 'Ticket',
      action: 'UPDATE',
      description: `Destek talebi ${body.status === 'RESOLVED' ? 'çözüldü' : 'kapatıldı'}: ${currentTicket.subject}`,
      meta: { entity: 'Ticket', action: body.status.toLowerCase(), id, ticketId: id },
      userId: session.user.id,
      companyId: session.user.companyId,
    }])
    
    // Bildirim: Destek talebi çözüldü
    await createNotificationForRole({
      companyId: session.user.companyId,
      role: ['ADMIN', 'SUPER_ADMIN'],
      title: `Destek Talebi ${body.status === 'RESOLVED' ? 'Çözüldü' : 'Kapatıldı'}`,
      message: `${currentTicket.subject} destek talebi ${body.status === 'RESOLVED' ? 'çözüldü' : 'kapatıldı'}.`,
      type: 'success',
      relatedTo: 'Ticket',
      relatedId: id,
    })
  }
}
```

---

### 5. **Deal WON → Otomatik Quote Oluştur** 🟢 **DÜŞÜK ÖNCELİK (OPSİYONEL)**

#### Eksik:
- ❌ **Deal WON → Otomatik Quote Oluştur**
  - Şu an: Deal WON olduğunda manuel olarak Quote oluşturuluyor
  - Olması gereken: Deal WON olduğunda otomatik olarak Quote oluşturulabilir (opsiyonel - kullanıcı tercihine bağlı)

#### Önerilen Çözüm:
```typescript
// src/app/api/deals/[id]/route.ts - PUT
export async function PUT(...) {
  // ... mevcut kod ...
  
  if (body.stage === 'WON' && existingDeal?.stage !== 'WON') {
    // Kullanıcı tercihine bağlı - checkbox ile kontrol edilebilir
    if (body.autoCreateQuote === true) {
      // Otomatik Quote oluştur
      const quoteData = {
        title: `Teklif - ${existingDeal.title}`,
        status: 'DRAFT',
        total: existingDeal.value || 0,
        dealId: id,
        companyId: session.user.companyId,
      }
      
      const { data: newQuote } = await supabase
        .from('Quote')
        .insert([quoteData])
        .select()
        .single()
      
      if (newQuote) {
        // ActivityLog kaydı
        await supabase.from('ActivityLog').insert([{
          entity: 'Quote',
          action: 'CREATE',
          description: `Fırsat kazanıldı, otomatik teklif oluşturuldu: ${newQuote.title}`,
          meta: { entity: 'Quote', action: 'create', id: newQuote.id, fromDeal: id },
          userId: session.user.id,
          companyId: session.user.companyId,
        }])
      }
    }
  }
}
```

---

### 6. **Deal CLOSED → ActivityLog** 🟡 **ORTA ÖNCELİK**

#### Eksik:
- ❌ **Deal CLOSED → ActivityLog**
  - Şu an: Deal durumu değiştiğinde ActivityLog var mı kontrol edilmeli
  - Olması gereken: Deal `CLOSED` durumuna geçtiğinde özel ActivityLog kaydı oluşturulmalı

#### Önerilen Çözüm:
```typescript
// src/app/api/deals/[id]/route.ts - PUT
export async function PUT(...) {
  // ... mevcut kod ...
  
  if (body.status === 'CLOSED' && existingDeal?.status !== 'CLOSED') {
    // ActivityLog kaydı
    await supabase.from('ActivityLog').insert([{
      entity: 'Deal',
      action: 'UPDATE',
      description: `Fırsat kapatıldı: ${existingDeal.title}`,
      meta: { entity: 'Deal', action: 'closed', id, dealId: id },
      userId: session.user.id,
      companyId: session.user.companyId,
    }])
  }
}
```

---

### 7. **Quote DECLINED → ActivityLog** 🟡 **ORTA ÖNCELİK**

#### Eksik:
- ❌ **Quote DECLINED → ActivityLog**
  - Şu an: Quote durumu değiştiğinde ActivityLog var mı kontrol edilmeli
  - Olması gereken: Quote `DECLINED` durumuna geçtiğinde özel ActivityLog kaydı oluşturulmalı

#### Önerilen Çözüm:
```typescript
// src/app/api/quotes/[id]/route.ts - PUT
export async function PUT(...) {
  // ... mevcut kod ...
  
  if (body.status === 'DECLINED' && currentQuote?.status !== 'DECLINED') {
    // ActivityLog kaydı
    await supabase.from('ActivityLog').insert([{
      entity: 'Quote',
      action: 'UPDATE',
      description: `Teklif reddedildi: ${currentQuote.title}`,
      meta: { entity: 'Quote', action: 'declined', id, quoteId: id },
      userId: session.user.id,
      companyId: session.user.companyId,
    }])
    
    // Bildirim: Teklif reddedildi
    await createNotificationForRole({
      companyId: session.user.companyId,
      role: ['ADMIN', 'SALES', 'SUPER_ADMIN'],
      title: 'Teklif Reddedildi',
      message: `${currentQuote.title} teklifi reddedildi.`,
      type: 'warning',
      relatedTo: 'Quote',
      relatedId: id,
    })
  }
}
```

---

### 8. **Invoice RECEIVED → Stok Artır** ⚠️ **KONTROL EDİLMELİ**

#### Durum:
- ✅ **PurchaseTransaction APPROVED → Stok Artır** (Mevcut - Database trigger)
- ❓ **Invoice RECEIVED → Stok Artır** (Kontrol edilmeli)
  - Şu an: Invoice RECEIVED durumuna geçtiğinde stok artırılıyor mu?
  - Not: PurchaseTransaction APPROVED olduğunda stok artıyor, bu doğru yaklaşım olabilir
  - Invoice RECEIVED sadece durum göstergesi olabilir, stok işlemi PurchaseTransaction'da yapılıyor olabilir

#### Önerilen Kontrol:
```sql
-- Invoice RECEIVED durumuna geçtiğinde stok artırılıyor mu kontrol et
-- Eğer PurchaseTransaction APPROVED'da stok artırılıyorsa, Invoice RECEIVED'da tekrar artırmaya gerek yok
```

---

## 📊 ÖNCELİK MATRİSİ

### 🔴 **YÜKSEK ÖNCELİK (Kritik)**
1. ✅ **Otomatik Numara Oluşturma** (Invoice Number, Quote Number)
2. ✅ **Fatura Vadesi Bildirimleri** (OVERDUE, vade yaklaşıyor)

### 🟡 **ORTA ÖNCELİK**
3. ✅ **Task DONE → ActivityLog + Bildirim**
4. ✅ **Ticket RESOLVED/CLOSED → ActivityLog + Bildirim**
5. ✅ **Deal CLOSED → ActivityLog**
6. ✅ **Quote DECLINED → ActivityLog + Bildirim**

### 🟢 **DÜŞÜK ÖNCELİK (Opsiyonel)**
7. ✅ **Deal WON → Otomatik Quote Oluştur** (Kullanıcı tercihine bağlı)

### ⚠️ **KONTROL EDİLMELİ**
8. ✅ **Invoice RECEIVED → Stok Artır** (PurchaseTransaction APPROVED'da zaten yapılıyor olabilir)

---

## 🎯 ÖNERİLEN UYGULAMA SIRASI

1. **Otomatik Numara Oluşturma** (Invoice Number, Quote Number)
   - Kullanıcı deneyimi için önemli
   - Kolay uygulanabilir
   - Hemen eklenebilir

2. **Fatura Vadesi Bildirimleri**
   - İş sürekliliği için kritik
   - Database trigger veya scheduled job ile yapılabilir
   - Öncelikli olarak eklenmeli

3. **Task/Ticket Durum Değişiklikleri → ActivityLog**
   - Veri takibi için önemli
   - API endpoint'lerde kolayca eklenebilir
   - Orta öncelikli

4. **Deal/Quote Durum Değişiklikleri → ActivityLog**
   - Veri takibi için önemli
   - API endpoint'lerde kolayca eklenebilir
   - Orta öncelikli

5. **Deal WON → Otomatik Quote Oluştur**
   - Kullanıcı tercihine bağlı
   - Opsiyonel özellik
   - Düşük öncelikli

---

## 📝 SONUÇ

Sistemde **8 eksik otomasyon** tespit edildi:

- 🔴 **2 Yüksek Öncelikli** (Otomatik numara, vade bildirimleri)
- 🟡 **4 Orta Öncelikli** (Task/Ticket/Deal/Quote durum değişiklikleri)
- 🟢 **1 Düşük Öncelikli** (Deal WON → Quote)
- ⚠️ **1 Kontrol Edilmeli** (Invoice RECEIVED → Stok)

Bu otomasyonlar eklendiğinde sistem daha kapsamlı ve kullanıcı dostu olacaktır.

---

**Not:** Bu rapor otomatik olarak oluşturulmuştur. Tüm otomasyonların detaylı kontrolü yapılmalıdır.










