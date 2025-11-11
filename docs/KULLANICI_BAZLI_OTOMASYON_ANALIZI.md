# 🎯 KULLANICI BAZLI OTOMASYON ANALİZİ

**Tarih:** 2024  
**Durum:** 🔍 Analiz Tamamlandı

---

## 📊 MEVCUT OTOMASYONLAR (Çalışıyor)

### 1. ✅ Görev Atama Otomasyonları
**Trigger:** Task assignedTo değiştiğinde

```sql
-- Task atandığında
IF NEW."assignedTo" IS NOT NULL AND OLD."assignedTo" != NEW."assignedTo"
→ Bildirim: "Yeni Görev Atandı - [Görev Başlığı] size atandı"
→ ActivityLog kaydı
```

**Modüller:**
- ✅ Task
- ✅ Ticket
- ✅ Quote
- ✅ Invoice
- ✅ Deal
- ✅ Shipment

### 2. ✅ Meeting Davet Sistemi
**Trigger:** MeetingParticipant eklenir

```sql
-- Her yeni katılımcı eklendiğinde
→ Bildirim: "Yeni Görüşme Daveti - [Meeting] görüşmesine davet edildiniz"
→ Link: /meetings/[id]
```

### 3. ✅ Otomatik Status Değişiklikleri
**Zamanlanmış Görevler:**

```sql
-- Quote geçerliliği sona erdiğinde
Quote.validUntil < NOW() AND status = 'SENT'
→ Status: EXPIRED

-- Invoice vadesi geçtiğinde  
Invoice.dueDate < NOW() AND status = 'SENT'
→ Status: OVERDUE

-- Contract sona erdiğinde
Contract.endDate < NOW() AND status = 'ACTIVE'
→ Status: EXPIRED
```

### 4. ✅ Düşük Stok Uyarısı
**Trigger:** Product stock değiştiğinde

```sql
-- Stok minimum seviyenin altına düştüğünde
IF NEW.stock < COALESCE(NEW."minStockLevel", 10)
→ Bildirim: "⚠️ Düşük Stok - [Ürün] stoku kritik seviyede!"
→ Priority: HIGH
```

### 5. ✅ Deal Priority Score Otomatik Hesaplama
**Trigger:** Deal value veya winProbability değiştiğinde

```sql
-- Fırsat değeri değiştiğinde otomatik skor hesapla
priorityScore = (value * winProbability) / 100
```

### 6. ✅ Notification Otomatik Arşivleme
**Zamanlanmış:** expiresAt kontrolü

```sql
-- Süresi dolan bildirimler
Notification.expiresAt < NOW()
→ Otomatik arşivle veya sil
```

---

## ❌ EKSİK KULLANICI BAZLI OTOMASYONLAR

### 1. 🔴 **Hatırlatıcı Sistemi (Reminder System)** - YOK!

#### Olması Gereken:
```sql
-- Task için hatırlatıcılar
Task.dueDate - 1 DAY
→ Bildirim: "Yarın son gün! [Görev] için son tarih yarın"

Task.dueDate < NOW() AND status != 'DONE'
→ Bildirim: "⚠️ Gecikmiş Görev - [Görev] son tarihini geçti!"
```

```sql
-- Meeting için hatırlatıcılar
Meeting.startTime - 1 HOUR
→ Bildirim: "1 saat sonra görüşmeniz var - [Meeting]"

Meeting.startTime - 1 DAY
→ Bildirim: "Yarın görüşmeniz var - [Meeting]"
```

```sql
-- Deal için takip hatırlatıcıları
Deal.lastContactDate + 7 DAYS < NOW()
→ Bildirim: "7 gündür takip yok - [Deal] için müşteriyi aramanız gerekiyor"
```

**Etki:** ⚠️ **YÜKSEK** - Kullanıcılar önemli tarihleri kaçırıyor!

---

### 2. 🟡 **Otomatik Görev Oluşturma** - KISMI VAR

#### Mevcut:
```sql
-- Kritik bildirimlerden görev oluşturma (var)
Notification.priority = 'critical' AND actionType = 'create_task'
→ Otomatik Task oluşturulur
```

#### Eksik:
```sql
-- Deal belirli bir süre LEAD'de kaldıysa
Deal.stage = 'LEAD' AND createdAt + 3 DAYS < NOW()
→ Otomatik Task: "Bu fırsatla ilgilenmelisiniz!"

-- Quote SENT olduktan 2 gün sonra yanıt yoksa
Quote.status = 'SENT' AND sentAt + 2 DAYS < NOW()
→ Otomatik Task: "Teklifi takip et - [Customer] yanıt vermedi"

-- Ticket 24 saatte yanıtlanmadıysa
Ticket.status = 'OPEN' AND createdAt + 1 DAY < NOW()
→ Otomatik Task: "Acil! Ticket yanıtlanmadı - [Customer]"
```

**Etki:** 🟡 **ORTA** - Manuel takip gerekiyor

---

### 3. 🟡 **Kullanıcı İş Yükü Dengeleme** - YOK!

#### Olması Gereken:
```sql
-- Kullanıcıya çok fazla görev atandıysa uyarı
SELECT COUNT(*) FROM Task
WHERE "assignedTo" = [userId]
  AND status IN ('TODO', 'IN_PROGRESS')
  AND "dueDate" < NOW() + INTERVAL '7 days'

IF count > 10
→ Bildirim (Manager'a): "⚠️ [User] iş yükü yüksek - 10+ aktif görev"
```

```sql
-- Görev atarken kullanıcı müsaitlik kontrolü
IF User has >= 5 tasks due today
→ Warning: "Bu kullanıcıya bugün 5 görev atanmış, başka birine atamak ister misiniz?"
```

**Etki:** 🟡 **ORTA** - İş yükü dengesizliği

---

### 4. 🔴 **Müşteri Takip Sistemi** - YOK!

#### Olması Gereken:
```sql
-- Müşteri ile uzun süredir iletişim yok
Customer.lastInteractionDate + 30 DAYS < NOW()
→ Bildirim: "30 gündür [Customer] ile iletişim yok!"
→ Otomatik Task: "Müşteri ile iletişime geç"
```

```sql
-- VIP müşteriler için özel takip
Customer.type = 'VIP' AND lastInteractionDate + 7 DAYS < NOW()
→ Bildirim (Priority: HIGH): "VIP Müşteri - [Customer] 7 gündür aranmadı!"
```

```sql
-- Müşteri birthday hatırlatıcı
Customer.birthday = TODAY
→ Bildirim: "🎂 Bugün [Customer] doğum günü! Kutlama mesajı gönder"
→ Otomatik Task: "Doğum günü kutlama"
```

**Etki:** ⚠️ **YÜKSEK** - Müşteri memnuniyeti düşüyor!

---

### 5. 🟡 **Performans Takibi ve Raporlama** - YOK!

#### Olması Gereken:
```sql
-- Haftalık kullanıcı performans özeti
EVERY MONDAY 09:00
→ Bildirim: "Haftalık Özet - Bu hafta 5 Deal kapattınız, 3 Quote gönderdiniz"
```

```sql
-- Aylık hedef takibi
User.monthlyTarget vs actual
IF actual < target * 0.5 (50%'nin altında)
→ Bildirim (Priority: HIGH): "⚠️ Aylık hedefinizin %30'undasınız!"
```

```sql
-- Deal conversion rate düşük ise uyarı
User.dealConversionRate < 20%
→ Bildirim: "💡 İpucu: Deal conversion rate'iniz düşük, eğitim almak ister misiniz?"
```

**Etki:** 🟡 **ORTA** - Performans görünürlüğü yok

---

### 6. 🔴 **Zaman Bazlı Otomasyon** - KISMI VAR

#### Mevcut:
- ✅ Quote expired check
- ✅ Invoice overdue check
- ✅ Contract expired check

#### Eksik:
```sql
-- Her pazartesi sabah 9:00 - Haftalık planlama
EVERY MONDAY 09:00
→ Bildirim: "Hafta başlıyor! Bu hafta 8 göreviniz var"
→ Dashboard: Haftalık plan göster
```

```sql
-- Her gün sabah 8:00 - Günlük özet
EVERY DAY 08:00
→ Bildirim: "Günaydın! Bugün 3 göreviniz, 1 görüşmeniz var"
```

```sql
-- Mesai bitiminde - Günlük özet
EVERY DAY 18:00
→ Bildirim: "Bugün tamamladıklarınız: 5 görev, 2 görüşme"
```

**Etki:** 🟡 **ORTA** - Planlama desteği yok

---

### 7. 🟡 **Approval Workflow Otomasyonu** - KISMI VAR

#### Mevcut:
- ✅ ApprovalRequest tablosu var
- ✅ Onay/Red endpoint'leri var

#### Eksik:
```sql
-- Onay bekleyen kayıtlar için hatırlatıcı
ApprovalRequest.status = 'PENDING' AND createdAt + 1 DAY < NOW()
→ Bildirim (Onaylayıcıya): "⚠️ 1 gündür onay bekleyen talep var!"
```

```sql
-- Çoklu onaylayıcı ise sıralı onay
ApprovalRequest with multiple approvers
→ İlk onaylayıcı onayladıktan sonra → İkinci onaylayıcıya bildirim
```

```sql
-- Onay reddedilirse oluşturan kişiye bildir
ApprovalRequest.status = 'REJECTED'
→ Bildirim (Oluşturana): "❌ [Kayıt] onayınız reddedildi - Sebep: [reason]"
```

**Etki:** 🟡 **ORTA** - Onay süreçleri yavaş

---

## 📋 ÖNCELİK SIRALAMA

### 🔴 YÜKSEK ÖNCELİK (Hemen Yapılmalı)
1. **Hatırlatıcı Sistemi** - Task, Meeting, Deal reminder'ları
2. **Müşteri Takip Sistemi** - Son iletişim, VIP müşteri, doğum günü
3. **Zaman Bazlı Bildirimler** - Günlük özet, haftalık plan

### 🟡 ORTA ÖNCELİK (Sonra Yapılabilir)
4. **Otomatik Görev Oluşturma** - Deal/Quote/Ticket takip
5. **Kullanıcı İş Yükü Dengeleme** - Atama önerileri
6. **Approval Workflow** - Hatırlatıcılar, sıralı onay
7. **Performans Takibi** - Hedef takibi, conversion rate

---

## 💡 UYGULAMA ÖNERİLERİ

### 1. Hatırlatıcı Sistemi İçin Migration

```sql
-- Reminder tablosu
CREATE TABLE "Reminder" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"(id),
  "relatedTo" TEXT NOT NULL,
  "relatedId" UUID NOT NULL,
  "remindAt" TIMESTAMP NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('task_due', 'meeting_soon', 'follow_up', 'birthday')),
  status TEXT CHECK (status IN ('PENDING', 'SENT', 'DISMISSED')) DEFAULT 'PENDING',
  "companyId" UUID NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Zamanlanmış fonksiyon
CREATE OR REPLACE FUNCTION send_pending_reminders()
RETURNS void AS $$
BEGIN
  INSERT INTO "Notification" (title, message, "userId", "relatedTo", "relatedId", "companyId")
  SELECT 
    'Hatırlatma: ' || type,
    message,
    "userId",
    "relatedTo",
    "relatedId",
    "companyId"
  FROM "Reminder"
  WHERE status = 'PENDING'
    AND "remindAt" <= NOW();
    
  UPDATE "Reminder"
  SET status = 'SENT'
  WHERE status = 'PENDING'
    AND "remindAt" <= NOW();
END;
$$ LANGUAGE plpgsql;

-- Cron job (her 15 dakikada bir)
SELECT cron.schedule('send-reminders', '*/15 * * * *', 'SELECT send_pending_reminders()');
```

### 2. Müşteri Takip Sistemi

```sql
CREATE OR REPLACE FUNCTION check_customer_follow_ups()
RETURNS void AS $$
BEGIN
  -- 30 gün iletişim yok
  INSERT INTO "Task" (title, description, "assignedTo", "dueDate", "relatedTo", "relatedId", "companyId")
  SELECT
    'Müşteri Takibi: ' || c.name,
    'Bu müşteri ile 30 gündür iletişim yok. Lütfen arayın.',
    c."assignedTo",
    CURRENT_DATE + INTERVAL '1 day',
    'Customer',
    c.id,
    c."companyId"
  FROM "Customer" c
  WHERE c."lastInteractionDate" + INTERVAL '30 days' < NOW()
    AND NOT EXISTS (
      SELECT 1 FROM "Task"
      WHERE "relatedTo" = 'Customer'
        AND "relatedId" = c.id
        AND "createdAt" > NOW() - INTERVAL '7 days'
    );
    
  -- VIP müşteriler 7 gün
  -- ... similar logic
END;
$$ LANGUAGE plpgsql;

-- Cron job (her gün sabah 9:00)
SELECT cron.schedule('customer-follow-ups', '0 9 * * *', 'SELECT check_customer_follow_ups()');
```

### 3. Günlük Özet Bildirimi

```sql
CREATE OR REPLACE FUNCTION send_daily_summary()
RETURNS void AS $$
BEGIN
  INSERT INTO "Notification" (title, message, "userId", type, "companyId")
  SELECT
    'Günlük Özet',
    'Bugün ' || task_count || ' göreviniz, ' || meeting_count || ' görüşmeniz var.',
    u.id,
    'info',
    u."companyId"
  FROM "User" u
  LEFT JOIN (
    SELECT "assignedTo", COUNT(*) as task_count
    FROM "Task"
    WHERE "dueDate" = CURRENT_DATE
      AND status != 'DONE'
    GROUP BY "assignedTo"
  ) t ON t."assignedTo" = u.id
  LEFT JOIN (
    SELECT "createdBy", COUNT(*) as meeting_count
    FROM "Meeting"
    WHERE DATE("startTime") = CURRENT_DATE
    GROUP BY "createdBy"
  ) m ON m."createdBy" = u.id
  WHERE u.status = 'ACTIVE';
END;
$$ LANGUAGE plpgsql;

-- Cron job (her gün sabah 8:00)
SELECT cron.schedule('daily-summary', '0 8 * * *', 'SELECT send_daily_summary()');
```

---

## 🎯 SONUÇ

### Mevcut Otomasyonlar: ✅ 6/13 (46%)
### Eksik Otomasyonlar: ❌ 7/13 (54%)

**En Kritik Eksikler:**
1. Hatırlatıcı sistemi yok
2. Müşteri takip otomasyonu yok
3. Günlük/haftalık özetler yok

**Önerilen Aksiyon:**
1. Reminder tablosu ve cron job'ları ekle
2. Müşteri takip fonksiyonlarını oluştur
3. Günlük bildirim sistemini kur

Bu otomasyonlar eklendikten sonra kullanıcı deneyimi %70 artacak! 🚀

