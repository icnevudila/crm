# 🎫 Destek Talepleri İş Akışı ve Mevcut Durum Raporu

**Tarih:** 2024  
**Durum:** ⚠️ Eksikler Tespit Edildi - Müşteri Bildirimleri Yok

---

## 📋 ÖZET

Destek talepleri modülünde **yorum/cevap sistemi mevcut** ancak **ticket detay sayfasında kullanılmıyor**. Ayrıca **müşteriye bildirim gönderilmiyor** - sadece destek ekibine bildirim gidiyor.

---

## 🔄 MEVCUT İŞ AKIŞI

### 1. Kullanıcı Talep Açıyor

**Akış:**
1. Kullanıcı `/tickets` sayfasına gidiyor
2. "Yeni Talep" butonuna tıklıyor
3. `TicketForm` açılıyor
4. Form dolduruluyor: `subject`, `status`, `priority`, `customerId`, `description`
5. "Kaydet" butonuna tıklanıyor
6. `POST /api/tickets` endpoint'i çağrılıyor
7. Ticket oluşturuluyor
8. ActivityLog kaydı oluşturuluyor

**Mevcut Durum:**
- ✅ Ticket oluşturuluyor
- ✅ ActivityLog kaydı oluşturuluyor
- ❌ **Müşteriye bildirim GİTMİYOR!**
- ❌ **Destek ekibine bildirim GİTMİYOR!** (sadece Admin/SuperAdmin'e gidiyor)

---

### 2. Destek Ekibi Talep Detay Sayfasına Gidiyor

**Akış:**
1. Destek ekibi `/tickets` sayfasına gidiyor
2. Bir talebe tıklıyor
3. `/tickets/[id]` detay sayfasına gidiyor
4. Talep bilgilerini görüntülüyor

**Mevcut Durum:**
- ✅ Talep bilgileri görüntüleniyor
- ✅ Status, Priority, Customer bilgileri gösteriliyor
- ✅ Activity Timeline gösteriliyor
- ❌ **Yorum/Cevap bölümü YOK!** (`CommentsSection` kullanılmıyor)
- ❌ **Düzenle butonu YOK!**
- ❌ **Sil butonu YOK!**

---

### 3. Destek Ekibi Cevap Vermeye Çalışıyor

**Akış:**
1. Destek ekibi talep detay sayfasında
2. Cevap vermek istiyor
3. **AMA:** Yorum ekleme bölümü yok!

**Mevcut Durum:**
- ❌ **Yorum/Cevap sistemi mevcut ama kullanılmıyor!**
  - `CommentsSection` component'i var (`src/components/ui/CommentsSection.tsx`)
  - `/api/comments` endpoint'i var (`src/app/api/comments/route.ts`)
  - ActivityLog'da `action = 'COMMENT'` olarak saklanıyor
  - **AMA:** Ticket detay sayfasında kullanılmıyor!

---

### 4. Destek Ekibi Status Değiştiriyor

**Akış:**
1. Destek ekibi talep detay sayfasında
2. Status değiştirmek istiyor
3. **AMA:** Düzenle butonu yok!
4. Manuel olarak API'ye istek atması gerekiyor

**Mevcut Durum:**
- ✅ Status değiştirilebiliyor (API'de)
- ✅ Status RESOLVED/CLOSED olduğunda → Admin/SuperAdmin'e bildirim
- ❌ **Müşteriye bildirim GİTMİYOR!**
- ❌ **Frontend'de düzenle butonu YOK!**

---

## 🔍 MEVCUT ÖZELLİKLER

### ✅ Var Olan Özellikler

1. **Yorum/Cevap Sistemi (Ama Kullanılmıyor!)**
   - `CommentsSection` component'i mevcut
   - `/api/comments` endpoint'i mevcut
   - ActivityLog'da `action = 'COMMENT'` olarak saklanıyor
   - Her entity için kullanılabiliyor (Ticket dahil)

2. **Bildirim Sistemi (Sadece Destek Ekibine)**
   - Ticket RESOLVED/CLOSED → Admin/SuperAdmin'e bildirim ✅
   - Ticket atandı → Atanan kullanıcıya bildirim ✅ (ama `assignedTo` alanı yok!)
   - Ticket geç kaldı → Admin/SuperAdmin'e bildirim ✅

3. **ActivityLog Sistemi**
   - Tüm işlemler loglanıyor ✅
   - Activity Timeline gösteriliyor ✅

---

## ❌ EKSİK ÖZELLİKLER

### 🔴 KRİTİK EKSİKLER

1. **Müşteriye Bildirim GİTMİYOR!**
   - **Sorun:** Ticket oluşturulduğunda, status değiştiğinde, yorum eklendiğinde müşteriye bildirim gitmiyor
   - **Olması Gereken:**
     - Ticket oluşturulduğunda → Müşteriye bildirim
     - Status değiştiğinde → Müşteriye bildirim (örn: "Talebiniz çözüldü")
     - Yorum eklendiğinde → Müşteriye bildirim (örn: "Talebinize yeni bir yanıt eklendi")
   - **Çözüm:** Customer'a bildirim gönderme mekanizması eklenmeli (e-posta veya sistem bildirimi)

2. **Ticket Detay Sayfasında Yorum Bölümü YOK!**
   - **Sorun:** `CommentsSection` component'i mevcut ama ticket detay sayfasında kullanılmıyor
   - **Olması Gereken:** Ticket detay sayfasında yorum ekleme ve görüntüleme bölümü olmalı
   - **Çözüm:** `src/app/[locale]/tickets/[id]/page.tsx` dosyasına `CommentsSection` eklenmeli

3. **Ticket Detay Sayfasında Düzenle/Sil Butonları YOK!**
   - **Sorun:** Ticket detay sayfasında sadece görüntüleme var, düzenleme/silme yok
   - **Olması Gereken:** Düzenle ve Sil butonları olmalı (modal ile)
   - **Çözüm:** `TicketForm` modal'ı ve silme işlemi eklenmeli

4. **`assignedTo` Alanı YOK!**
   - **Sorun:** Ticket'a kullanıcı atama özelliği yok (database'de, form'da, API'de)
   - **Olması Gereken:** Ticket'a destek ekibinden bir kullanıcı atanabilmeli
   - **Çözüm:** 
     - Database'e `assignedTo UUID REFERENCES "User"(id) ON DELETE SET NULL` kolonu eklenmeli
     - Form'a `assignedTo` seçimi eklenmeli
     - API'de `assignedTo` gönderilmeli ve işlenmeli

5. **Yorum Eklendiğinde Bildirim GİTMİYOR!**
   - **Sorun:** Yorum eklendiğinde müşteriye ve destek ekibine bildirim gitmiyor
   - **Olması Gereken:**
     - Yorum eklendiğinde → Müşteriye bildirim (eğer destek ekibi yorum eklediyse)
     - Yorum eklendiğinde → Destek ekibine bildirim (eğer müşteri yorum eklediyse)
   - **Çözüm:** `/api/comments` POST endpoint'ine bildirim gönderme mekanizması eklenmeli

---

### 🟡 ORTA ÖNCELİK EKSİKLER

6. **Ticket Oluşturulduğunda Destek Ekibine Bildirim GİTMİYOR!**
   - **Sorun:** Yeni ticket oluşturulduğunda destek ekibine bildirim gitmiyor
   - **Olması Gereken:** Yeni ticket oluşturulduğunda Admin/Sales/SuperAdmin rollere bildirim
   - **Çözüm:** `POST /api/tickets` endpoint'ine bildirim gönderme mekanizması eklenmeli

7. **Ticket Status Değiştiğinde Müşteriye Bildirim GİTMİYOR!**
   - **Sorun:** Status değiştiğinde sadece destek ekibine bildirim gidiyor
   - **Olması Gereken:** Status değiştiğinde müşteriye de bildirim gitmeli
   - **Çözüm:** `PUT /api/tickets/[id]` endpoint'ine müşteriye bildirim gönderme mekanizması eklenmeli

8. **Ticket Priority Değiştiğinde Bildirim GİTMİYOR!**
   - **Sorun:** Priority değiştiğinde bildirim gitmiyor
   - **Olması Gereken:** Priority HIGH/URGENT olduğunda destek ekibine bildirim
   - **Çözüm:** Priority değişikliği kontrolü ve bildirim eklenmeli

---

## 📊 İDEAL İŞ AKIŞI (Nasıl Olmalı?)

### Senaryo 1: Müşteri Talep Açıyor

1. **Müşteri talep açıyor:**
   - Müşteri `/tickets` sayfasına gidiyor
   - "Yeni Talep" butonuna tıklıyor
   - Form dolduruluyor: `subject`, `description`, `priority`, `customerId`
   - "Kaydet" butonuna tıklanıyor
   - Ticket oluşturuluyor

2. **Bildirimler:**
   - ✅ Müşteriye bildirim: "Talebiniz başarıyla oluşturuldu. Talep ID: #12345"
   - ✅ Destek ekibine bildirim: "Yeni destek talebi: [Konu] - Müşteri: [Müşteri Adı]"
   - ✅ ActivityLog kaydı oluşturuluyor

3. **Destek ekibi talep görüyor:**
   - Destek ekibi `/tickets` sayfasında yeni talebi görüyor
   - Talep detay sayfasına gidiyor
   - Talep bilgilerini görüntülüyor
   - **Yorum ekleyebiliyor** (CommentsSection ile)
   - Status değiştirebiliyor (OPEN → IN_PROGRESS)

---

### Senaryo 2: Destek Ekibi Cevap Veriyor

1. **Destek ekibi yorum ekliyor:**
   - Destek ekibi talep detay sayfasında
   - Yorum bölümünde yorum yazıyor
   - "Gönder" butonuna tıklıyor
   - Yorum ekleniyor (ActivityLog'da `action = 'COMMENT'`)

2. **Bildirimler:**
   - ✅ Müşteriye bildirim: "Talebinize yeni bir yanıt eklendi: [Yorum özeti]"
   - ✅ ActivityLog kaydı oluşturuluyor

3. **Müşteri yorumu görüyor:**
   - Müşteri talep detay sayfasına gidiyor
   - Yorumları görüntülüyor
   - Destek ekibinin yorumunu görüyor

---

### Senaryo 3: Müşteri Cevap Veriyor

1. **Müşteri yorum ekliyor:**
   - Müşteri talep detay sayfasında
   - Yorum bölümünde yorum yazıyor
   - "Gönder" butonuna tıklıyor
   - Yorum ekleniyor

2. **Bildirimler:**
   - ✅ Destek ekibine bildirim: "Müşteri talebinize yanıt verdi: [Yorum özeti]"
   - ✅ ActivityLog kaydı oluşturuluyor

3. **Destek ekibi yorumu görüyor:**
   - Destek ekibi talep detay sayfasına gidiyor
   - Müşterinin yorumunu görüyor
   - Gerekirse tekrar yorum ekliyor

---

### Senaryo 4: Talep Çözüldü

1. **Destek ekibi status değiştiriyor:**
   - Destek ekibi talep detay sayfasında
   - Status'u RESOLVED veya CLOSED yapıyor
   - "Kaydet" butonuna tıklıyor

2. **Bildirimler:**
   - ✅ Müşteriye bildirim: "Talebiniz çözüldü/kapatıldı. Teşekkür ederiz!"
   - ✅ Destek ekibine bildirim: "Talep çözüldü/kapatıldı: [Konu]"
   - ✅ ActivityLog kaydı oluşturuluyor

3. **Müşteri durumu görüyor:**
   - Müşteri talep detay sayfasına gidiyor
   - Status'un RESOLVED/CLOSED olduğunu görüyor
   - Bildirim mesajını görüyor

---

## 🎯 ÖNCELİKLİ DÜZELTME LİSTESİ

### 🔴 YÜKSEK ÖNCELİK (Kritik)

1. **Ticket Detay Sayfasına Yorum Bölümü Ekle**
   - `src/app/[locale]/tickets/[id]/page.tsx` dosyasına `CommentsSection` ekle
   - `entityType="Ticket"` ve `entityId={ticket.id}` ile

2. **Yorum Eklendiğinde Müşteriye Bildirim Gönder**
   - `/api/comments` POST endpoint'ine bildirim gönderme mekanizması ekle
   - Eğer destek ekibi yorum eklediyse → Müşteriye bildirim
   - Eğer müşteri yorum eklediyse → Destek ekibine bildirim

3. **Ticket Status Değiştiğinde Müşteriye Bildirim Gönder**
   - `PUT /api/tickets/[id]` endpoint'ine müşteriye bildirim gönderme mekanizması ekle
   - Status RESOLVED/CLOSED olduğunda → Müşteriye bildirim

4. **Ticket Oluşturulduğunda Destek Ekibine Bildirim Gönder**
   - `POST /api/tickets` endpoint'ine bildirim gönderme mekanizması ekle
   - Admin/Sales/SuperAdmin rollere bildirim

5. **Ticket Detay Sayfasına Düzenle/Sil Butonları Ekle**
   - Düzenle butonu → `TicketForm` modal'ını aç
   - Sil butonu → Confirm dialog ile silme işlemi

### 🟡 ORTA ÖNCELİK

6. **`assignedTo` Alanını Ekle**
   - Database migration: `assignedTo UUID REFERENCES "User"(id) ON DELETE SET NULL`
   - Form'a `assignedTo` seçimi ekle
   - API'de `assignedTo` gönder ve işle
   - Liste'de `assignedTo` göster

7. **Ticket Priority Değiştiğinde Bildirim Gönder**
   - Priority HIGH/URGENT olduğunda destek ekibine bildirim

8. **Müşteriye E-posta Bildirimi Ekle (Opsiyonel)**
   - Sistem bildirimine ek olarak e-posta bildirimi
   - SMTP entegrasyonu

---

## 📝 TEKNİK DETAYLAR

### Mevcut Yorum Sistemi

**Component:** `src/components/ui/CommentsSection.tsx`
```typescript
<CommentsSection
  entityType="Ticket"
  entityId={ticket.id}
/>
```

**API Endpoint:** `/api/comments`
- GET: `?entityType=Ticket&entityId={ticketId}` - Yorumları getir
- POST: `{ entityType: 'Ticket', entityId: 'uuid', comment: 'Yorum metni' }` - Yorum ekle

**Storage:** ActivityLog tablosunda
```json
{
  "entity": "Ticket",
  "action": "COMMENT",
  "description": "Yorum metni",
  "meta": {
    "entity": "Ticket",
    "action": "comment",
    "entityId": "uuid",
    "comment": "Yorum metni"
  }
}
```

### Bildirim Gönderme Mekanizması

**Müşteriye Bildirim:**
- Customer tablosunda `email` alanı var
- E-posta gönderme veya sistem bildirimi (Customer için User tablosunda kayıt varsa)

**Destek Ekibine Bildirim:**
- `createNotificationForRole` fonksiyonu ile Admin/Sales/SuperAdmin rollere bildirim
- `createNotification` fonksiyonu ile belirli kullanıcıya bildirim

---

## ✅ SONUÇ

Destek talepleri modülünde **yorum/cevap sistemi mevcut** ancak **kullanılmıyor**. Ayrıca **müşteriye bildirim gönderilmiyor** - sadece destek ekibine bildirim gidiyor.

**Öncelikli Düzeltmeler:**
1. Ticket detay sayfasına yorum bölümü ekle
2. Yorum eklendiğinde müşteriye bildirim gönder
3. Status değiştiğinde müşteriye bildirim gönder
4. Ticket oluşturulduğunda destek ekibine bildirim gönder
5. Ticket detay sayfasına düzenle/sil butonları ekle

---

**Rapor Tarihi:** 2024  
**Hazırlayan:** AI Assistant  
**Durum:** ⚠️ Eksikler Tespit Edildi - Düzeltme Gerekli



