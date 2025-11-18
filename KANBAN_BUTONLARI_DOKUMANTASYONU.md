# 📋 KANBAN BOARD BUTONLARI DOKÜMANTASYONU

## 🎯 GENEL BAKIŞ

Kanban board'larda her durum için özel butonlar gösterilir. Bu butonlar durum değişikliği yapar ve otomatik işlemler tetikler.

---

## 📄 QUOTE KANBAN (TEKLİF KANBAN)

### Durum: **DRAFT** (Taslak)
**Görünen Butonlar:**
- ✅ **Gönder** (Send)
  - **Ne Yapar:** Teklifi "SENT" (Gönderildi) durumuna taşır
  - **Otomatik İşlemler:** Yok
  - **Toast Mesajı:** "Teklif gönderildi" - "Teklif başarıyla gönderildi ve durumu güncellendi."
  - **Konum:** Kartın altında, tek buton

### Durum: **SENT** (Gönderildi)
**Görünen Butonlar:**
- ✅ **Kabul Et** (Accept)
  - **Ne Yapar:** Teklifi "ACCEPTED" (Kabul Edildi) durumuna taşır
  - **Otomatik İşlemler:**
    - Fatura oluşturulur
    - Sözleşme oluşturulur
  - **Toast Mesajı:** "Teklif kabul edildi" - "Teklif kabul edildi, otomatik olarak fatura ve sözleşme oluşturuldu."
  - **Konum:** Kartın üstünde (küçük buton) ve altında (büyük buton)
  
- ❌ **Reddet** (Reject)
  - **Ne Yapar:** Teklifi "REJECTED" (Reddedildi) durumuna taşır
  - **Otomatik İşlemler:**
    - Revizyon görevi oluşturulur
  - **Toast Mesajı:** "Teklif reddedildi" - "Teklif reddedildi, otomatik olarak revizyon görevi oluşturuldu."
  - **Konum:** Kartın üstünde (küçük buton) ve altında (büyük buton)

### Durum: **WAITING** (Beklemede)
**Görünen Butonlar:**
- ✅ **Kabul Et** (Accept)
  - **Ne Yapar:** Teklifi "ACCEPTED" durumuna taşır
  - **Otomatik İşlemler:**
    - Fatura oluşturulur
    - Sözleşme oluşturulur
  - **Toast Mesajı:** "Teklif kabul edildi" - "Teklif kabul edildi, otomatik olarak fatura ve sözleşme oluşturuldu."
  
- ❌ **Reddet** (Reject)
  - **Ne Yapar:** Teklifi "REJECTED" durumuna taşır
  - **Otomatik İşlemler:**
    - Revizyon görevi oluşturulur
  - **Toast Mesajı:** "Teklif reddedildi" - "Teklif reddedildi, otomatik olarak revizyon görevi oluşturuldu."

### Durum: **ACCEPTED** (Kabul Edildi)
**Görünen Butonlar:**
- ❌ Yok (Bu durumda buton yok, sadece görüntüleme)

### Durum: **REJECTED** (Reddedildi)
**Görünen Butonlar:**
- ❌ Yok (Bu durumda buton yok, sadece görüntüleme)

---

## 🧾 INVOICE KANBAN (FATURA KANBAN)

### Durum: **DRAFT** (Taslak)
**Görünen Butonlar:**
- ✅ **Gönder** (Send)
  - **Ne Yapar:** Faturayı "SENT" (Gönderildi) durumuna taşır
  - **Otomatik İşlemler:**
    - Satış faturaları için: Sevkiyat kaydı oluşturulur
    - Alış faturaları için: Satın alma kaydı oluşturulur
  - **Toast Mesajı:** "Fatura gönderildi" - "Fatura 'Gönderildi' durumuna taşındı."
  - **Tooltip:** "Faturayı müşteriye/tedarikçiye gönderir. Bu işlemden sonra fatura durumu 'Gönderildi' olur ve otomatik sevkiyat/satın alma kaydı oluşturulur."
  
- ⚠️ **İptal Et** (Cancel)
  - **Ne Yapar:** Faturayı "CANCELLED" (İptal Edildi) durumuna taşır
  - **Otomatik İşlemler:** Yok
  - **Onay:** Evet, onay dialog'u gösterilir
  - **Toast Mesajı:** "Fatura iptal edildi"
  - **Tooltip:** "Faturayı iptal eder. İptal edilen faturalar değiştirilemez."

### Durum: **SENT** (Gönderildi)
**Satış Faturaları (SALES) için:**
- 🚚 **Sevkiyat Yapıldı** (Mark as Shipped)
  - **Ne Yapar:** Faturayı "SHIPPED" (Sevk Edildi) durumuna taşır
  - **Otomatik İşlemler:**
    - Stoktan otomatik olarak düşülür
  - **Toast Mesajı:** "Fatura sevk edildi" - "Ürünler sevk edildi ve stoktan düşüldü."
  - **Tooltip:** "Ürünlerin sevk edildiğini işaretler. Stoktan otomatik olarak düşülür. Sadece satış faturaları için kullanılır."

**Alış Faturaları (PURCHASE) için:**
- 📦 **Satın Alma Onaylandı** (Mark as Received)
  - **Ne Yapar:** Faturayı "RECEIVED" (Alındı) durumuna taşır
  - **Otomatik İşlemler:**
    - Stoğa otomatik olarak giriş yapılır
  - **Toast Mesajı:** "Fatura alındı" - "Satın alma onaylandı ve stoğa giriş yapıldı."
  - **Tooltip:** "Satın alma onaylandığını işaretler. Stoğa otomatik olarak giriş yapılır. Sadece alış faturaları için kullanılır."

**Hizmet Faturaları (SERVICE_SALES, SERVICE_PURCHASE) için:**
- ✅ **Ödendi** (Mark as Paid)
  - **Ne Yapar:** Faturayı "PAID" (Ödendi) durumuna taşır
  - **Otomatik İşlemler:**
    - Finans kaydı oluşturulur
  - **Toast Mesajı:** "Fatura ödendi" - "Ödeme alındı ve finans kaydı oluşturuldu."
  - **Tooltip:** "Ödemenin alındığını işaretler. Otomatik olarak finans kaydı oluşturulur. Hizmet faturaları için kullanılır."

**Tüm Fatura Tipleri için:**
- ⚠️ **İptal Et** (Cancel)
  - **Ne Yapar:** Faturayı "CANCELLED" durumuna taşır
  - **Otomatik İşlemler:** Yok
  - **Onay:** Evet, onay dialog'u gösterilir
  - **Toast Mesajı:** "Fatura iptal edildi"
  - **Tooltip:** "Faturayı iptal eder. İptal edilen faturalar değiştirilemez."

### Durum: **SHIPPED** (Sevk Edildi)
**Görünen Butonlar:**
- ✅ **Ödendi** (Mark as Paid)
  - **Ne Yapar:** Faturayı "PAID" (Ödendi) durumuna taşır
  - **Otomatik İşlemler:**
    - Finans kaydı oluşturulur
  - **Toast Mesajı:** "Fatura ödendi" - "Ödeme alındı ve finans kaydı oluşturuldu."
  - **Tooltip:** "Ödemenin alındığını işaretler. Otomatik olarak finans kaydı oluşturulur."
  
- ⚠️ **İptal Et** (Cancel)
  - **Ne Yapar:** Faturayı "CANCELLED" durumuna taşır
  - **Otomatik İşlemler:**
    - Rezerve edilen stok geri alınır
  - **Onay:** Evet, onay dialog'u gösterilir
  - **Toast Mesajı:** "Fatura iptal edildi"
  - **Tooltip:** "Faturayı iptal eder. Rezerve edilen stok geri alınır."

### Durum: **RECEIVED** (Alındı)
**Görünen Butonlar:**
- ✅ **Ödendi** (Mark as Paid)
  - **Ne Yapar:** Faturayı "PAID" durumuna taşır
  - **Otomatik İşlemler:**
    - Finans kaydı oluşturulur
  - **Toast Mesajı:** "Fatura ödendi" - "Ödeme yapıldı ve finans kaydı oluşturuldu."
  - **Tooltip:** "Ödemenin yapıldığını işaretler. Otomatik olarak finans kaydı oluşturulur."
  
- ⚠️ **İptal Et** (Cancel)
  - **Ne Yapar:** Faturayı "CANCELLED" durumuna taşır
  - **Otomatik İşlemler:**
    - Stoğa giriş yapılan ürünler geri alınır
  - **Onay:** Evet, onay dialog'u gösterilir
  - **Toast Mesajı:** "Fatura iptal edildi"
  - **Tooltip:** "Faturayı iptal eder. Stoğa giriş yapılan ürünler geri alınır."

### Durum: **PAID** (Ödendi)
**Görünen Butonlar:**
- ❌ Yok (Bu durumda buton yok, sadece görüntüleme)

### Durum: **OVERDUE** (Vadesi Geçmiş)
**Görünen Butonlar:**
- ✅ **Ödendi** (Mark as Paid)
  - **Ne Yapar:** Faturayı "PAID" durumuna taşır
  - **Otomatik İşlemler:**
    - Finans kaydı oluşturulur
  - **Toast Mesajı:** "Fatura ödendi" - "Ödeme alındı ve finans kaydı oluşturuldu."
  - **Tooltip:** "Ödemenin alındığını işaretler. Otomatik olarak finans kaydı oluşturulur."

### Durum: **CANCELLED** (İptal Edildi)
**Görünen Butonlar:**
- ❌ Yok (Bu durumda buton yok, sadece görüntüleme)

---

## 💼 DEAL KANBAN (FIRSAT KANBAN)

### Drag & Drop İşlemi
**Ne Yapar:**
- Fırsatı bir aşamadan diğerine taşır
- Aşama değişikliği yapar

**Otomatik İşlemler:**
- Aşama geçişi validasyonu yapılır
- Geçersiz geçişler engellenir
- Toast mesajı gösterilir

**Özel Durumlar:**
- **WON** (Kazanıldı): Değiştirilemez (immutable)
- **LOST** (Kaybedildi): Değiştirilemez (immutable)
- **LOST'a geçiş:** Sebep sorulur (dialog açılır)

### Aşamalar:
1. **LEAD** (Potansiyel)
2. **CONTACTED** (İletişim Kuruldu)
3. **PROPOSAL** (Teklif)
4. **NEGOTIATION** (Pazarlık)
5. **WON** (Kazanıldı) - 🔒 Değiştirilemez
6. **LOST** (Kaybedildi) - 🔒 Değiştirilemez

**Butonlar:**
- ❌ Quick action butonları yok
- ✅ Sadece drag & drop ile aşama değişikliği
- ✅ Context menu ile görüntüle, düzenle, sil işlemleri

---

## 📊 BUTON GÖRÜNÜRLÜK KURALLARI

### Quote Kanban
- **DRAFT:** Gönder butonu
- **SENT:** Kabul Et + Reddet butonları
- **WAITING:** Kabul Et + Reddet butonları
- **ACCEPTED:** Buton yok
- **REJECTED:** Buton yok

### Invoice Kanban
- **DRAFT:** Gönder + İptal Et butonları
- **SENT:** 
  - Satış: Sevkiyat Yapıldı + Ödendi + İptal Et
  - Alış: Satın Alma Onaylandı + Ödendi + İptal Et
  - Hizmet: Ödendi + İptal Et
- **SHIPPED:** Ödendi + İptal Et
- **RECEIVED:** Ödendi + İptal Et
- **PAID:** Buton yok
- **OVERDUE:** Ödendi
- **CANCELLED:** Buton yok

### Deal Kanban
- Tüm aşamalar: Drag & drop ile aşama değişikliği
- WON/LOST: Değiştirilemez (kilitli)

---

## ⚠️ ÖNEMLİ NOTLAR

1. **Onay Dialog'ları:**
   - İptal Et butonlarında onay dialog'u gösterilir
   - "Bu işlem geri alınamaz" uyarısı verilir

2. **Otomatik İşlemler:**
   - Tüm otomatik işlemler backend'de yapılır
   - ActivityLog'a kaydedilir
   - Hata durumunda rollback yapılır

3. **Hata Yönetimi:**
   - Tüm butonlarda try-catch var
   - Hata durumunda toast mesajı gösterilir
   - Optimistic update rollback yapılır

4. **Toast Mesajları:**
   - Başarı: Yeşil toast
   - Hata: Kırmızı toast
   - Tüm mesajlar description ile

---

**Tarih**: 2024
**Versiyon**: 1.0.0

