# 📤 "Teklif Gönderildi" İşlem Akışı

## ✅ Ne Olur?

"Teklif gönderildi" butonuna tıklandığında:

### 1. **Frontend (Kullanıcı Arayüzü)**
- ✅ Toast mesajı gösterilir: "Teklif gönderildi"
- ✅ Kanban kartı "Taslak" kolonundan "Gönderildi" kolonuna taşınır
- ✅ Sayfa yenilenir (güncel veriler için)

### 2. **Backend (API)**
- ✅ Quote status'u `DRAFT` → `SENT` olarak güncellenir
- ✅ `PUT /api/quotes/{id}` endpoint'i çağrılır
- ✅ Status transition validation yapılır
- ✅ Quote veritabanında güncellenir

### 3. **Database Trigger (Otomatik)**
Quote status'u `SENT` olduğunda otomatik olarak:

#### 3.1. **Notification Oluşturulur** ✅
- **Kimlere:** Admin, Sales, SuperAdmin rolündeki aktif kullanıcılar
- **Başlık:** "Teklif Gönderildi"
- **Mesaj:** "{Teklif Başlığı} teklifi müşteriye gönderildi."
- **Tip:** info
- **Link:** `/tr/quotes/{quoteId}`
- **Durum:** Header'daki bildirim menüsünde görünür

#### 3.2. **ActivityLog Kaydı Yapılır** ✅
- **Entity:** Quote
- **Action:** UPDATE
- **Açıklama:** "Teklif müşteriye gönderildi"
- **Meta:** 
  ```json
  {
    "quoteId": "...",
    "quoteNumber": "...",
    "status": "SENT"
  }
  ```
- **Kullanıcı:** Quote'u oluşturan kullanıcı
- **Durum:** Detay sayfasında "Aktivite Geçmişi" bölümünde görünür

### 4. **Sonuç**
- ✅ Teklif "Gönderildi" durumuna geçer
- ✅ Kullanıcılar bildirim alır
- ✅ Aktivite geçmişine kaydedilir
- ✅ Kanban board'da görsel olarak güncellenir

---

## ⚠️ Hata Durumları

### Notification Hatası
Eğer Notification oluşturulurken hata olursa:
- ❌ Console'da "Notification creation error" görünür
- ✅ Ana işlem (Quote güncelleme) başarılı olur
- ✅ ActivityLog kaydı yapılır
- ⚠️ Sadece bildirim gönderilmez (kritik değil)

**Çözüm:** Notification tablosu ve trigger'ları kontrol edin.

---

## 🔄 Sonraki Adımlar

Teklif "Gönderildi" durumuna geçtikten sonra:

1. **Müşteri Onayı Beklenir**
   - Müşteri teklifi görüntüler
   - "Kabul Et" veya "Reddet" butonuna tıklar

2. **Kabul Edilirse:**
   - ✅ Otomatik Invoice oluşturulur
   - ✅ Otomatik Contract oluşturulur (eğer yoksa)
   - ✅ Stok rezervasyonu yapılır
   - ✅ Notification gönderilir

3. **Reddedilirse:**
   - ✅ Revizyon görevi oluşturulur
   - ✅ Notification gönderilir

---

## 📊 Özet

| Adım | Durum | Açıklama |
|------|-------|----------|
| 1. Butona Tıklama | ✅ | Kullanıcı "Gönder" butonuna tıklar |
| 2. API Çağrısı | ✅ | `PUT /api/quotes/{id}` çağrılır |
| 3. Status Güncelleme | ✅ | Quote status `SENT` olur |
| 4. Database Trigger | ✅ | `notify_quote_sent()` çalışır |
| 5. Notification | ✅ | Admin/Sales'e bildirim gönderilir |
| 6. ActivityLog | ✅ | Aktivite kaydı yapılır |
| 7. UI Güncelleme | ✅ | Kanban board güncellenir |

---

## 🐛 Bilinen Sorunlar

### Notification Hatası
**Sorun:** `Could not find the table 'public.Notification' in the schema cache`

**Neden:** 
- Notification tablosu `public` schema'da değil
- Ya da migration çalışmamış
- Ya da schema cache sorunu

**Çözüm:**
1. Migration'ları kontrol edin: `supabase/migrations/021_notifications_system.sql`
2. Supabase dashboard'da Notification tablosunu kontrol edin
3. Schema cache'i yenileyin

---

## ✅ Düzeltme

Notification hatası düzeltildi:
- ✅ Trigger'da `userId` eklendi
- ✅ Admin/Sales rolündeki kullanıcılara bildirim gönderiliyor
- ✅ Link otomatik oluşturuluyor

