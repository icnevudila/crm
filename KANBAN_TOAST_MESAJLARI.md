# 🔔 KANBAN BOARD TOAST MESAJLARI DOKÜMANTASYONU

## 🎯 GENEL BAKIŞ

Kanban board'lardaki her buton tıklandığında kullanıcıya bilgi vermek için toast mesajları gösterilir. Bu mesajlar başarı, hata veya bilgilendirme içerir.

---

## 📄 QUOTE KANBAN (TEKLİF KANBAN) - TOAST MESAJLARI

### 1. **Gönder** Butonu (DRAFT → SENT)

**Başarı Toast:**
- **Title:** "Teklif gönderildi"
- **Description:** "Teklif başarıyla gönderildi ve durumu güncellendi."
- **Tip:** Yeşil (success)
- **Süre:** 4 saniye

**Hata Toast:**
- **Title:** "Durum değiştirilemedi"
- **Description:** "Bir hata oluştu" veya hata mesajı
- **Tip:** Kırmızı (error)
- **Süre:** 5 saniye

---

### 2. **Kabul Et** Butonu (SENT/WAITING → ACCEPTED)

**Başarı Toast:**
- **Title:** "Teklif kabul edildi"
- **Description:** "Teklif kabul edildi, otomatik olarak fatura ve sözleşme oluşturuldu."
- **Tip:** Yeşil (success)
- **Süre:** 4 saniye

**Hata Toast:**
- **Title:** "Durum değiştirilemedi"
- **Description:** "Bir hata oluştu" veya hata mesajı
- **Tip:** Kırmızı (error)
- **Süre:** 5 saniye

---

### 3. **Reddet** Butonu (SENT/WAITING → REJECTED)

**Başarı Toast:**
- **Title:** "Teklif reddedildi"
- **Description:** "Teklif reddedildi, otomatik olarak revizyon görevi oluşturuldu."
- **Tip:** Yeşil (success)
- **Süre:** 4 saniye

**Hata Toast:**
- **Title:** "Durum değiştirilemedi"
- **Description:** "Bir hata oluştu" veya hata mesajı
- **Tip:** Kırmızı (error)
- **Süre:** 5 saniye

---

### 4. **Drag & Drop** (Farklı duruma taşıma)

**Geçersiz Geçiş Toast:**
- **Title:** "Geçersiz durum geçişi" (örn: "DRAFT → ACCEPTED geçişi yapılamıyor")
- **Description:** "Bu teklifi şu durumlara taşıyabilirsiniz: SENT, REJECTED" veya hata mesajı
- **Tip:** Kırmızı (error)
- **Süre:** 5 saniye

**Immutable Durum Toast:**
- **Title:** "Bu durum değiştirilemez"
- **Description:** "Kabul edilmiş veya reddedilmiş teklifler değiştirilemez."
- **Tip:** Kırmızı (error)
- **Süre:** 5 saniye

---

## 🧾 INVOICE KANBAN (FATURA KANBAN) - TOAST MESAJLARI

### 1. **Gönder** Butonu (DRAFT → SENT)

**Başarı Toast:**
- **Title:** "Fatura gönderildi: [Fatura Başlığı]"
- **Description:** "Fatura 'Gönderildi' durumuna taşındı."
  - **Satış faturaları için:** "Otomatik sevkiyat kaydı oluşturuldu."
  - **Alış faturaları için:** "Otomatik satın alma kaydı oluşturuldu."
- **Tip:** Yeşil (success)
- **Süre:** 4 saniye

**Hata Toast:**
- **Title:** "Fatura Güncellenemedi"
- **Description:** Hata mesajı (örn: "Geçersiz durum geçişi", "Fatura durumu güncellenemedi")
- **Tip:** Kırmızı (error)
- **Süre:** 5 saniye

---

### 2. **Sevkiyat Yapıldı** Butonu (SENT → SHIPPED) - Satış Faturaları

**Başarı Toast:**
- **Title:** "Fatura sevk edildi: [Fatura Başlığı]"
- **Description:** "Ürünler sevk edildi ve stoktan düşüldü."
- **Tip:** Yeşil (success)
- **Süre:** 4 saniye

**Hata Toast:**
- **Title:** "Durum değiştirilemedi"
- **Description:** "Bir hata oluştu" veya hata mesajı
- **Tip:** Kırmızı (error)
- **Süre:** 5 saniye

---

### 3. **Satın Alma Onaylandı** Butonu (SENT → RECEIVED) - Alış Faturaları

**Başarı Toast:**
- **Title:** "Fatura alındı: [Fatura Başlığı]"
- **Description:** "Satın alma onaylandı ve stoğa giriş yapıldı."
- **Tip:** Yeşil (success)
- **Süre:** 4 saniye

**Hata Toast:**
- **Title:** "Durum değiştirilemedi"
- **Description:** "Bir hata oluştu" veya hata mesajı
- **Tip:** Kırmızı (error)
- **Süre:** 5 saniye

---

### 4. **Ödendi** Butonu (SENT/SHIPPED/RECEIVED/OVERDUE → PAID)

**Başarı Toast:**
- **Title:** "Fatura ödendi: [Fatura Başlığı]"
- **Description:** 
  - **SHIPPED'tan:** "Ödeme alındı ve finans kaydı oluşturuldu."
  - **RECEIVED'tan:** "Ödeme yapıldı ve finans kaydı oluşturuldu."
  - **OVERDUE'dan:** "Geciken ödeme alındı ve finans kaydı oluşturuldu."
- **Tip:** Yeşil (success)
- **Süre:** 4 saniye

**Hata Toast:**
- **Title:** "Fatura Güncellenemedi"
- **Description:** Hata mesajı
- **Tip:** Kırmızı (error)
- **Süre:** 5 saniye

---

### 5. **İptal Et** Butonu (Herhangi bir durum → CANCELLED)

**Onay Dialog:**
- **Mesaj:** "[Fatura Başlığı] faturasını iptal etmek istediğinize emin misiniz?"
- **Uyarı:** "Bu işlem geri alınamaz ve ilgili sevkiyat/stok işlemleri geri alınacaktır."

**Başarı Toast:**
- **Title:** "Fatura iptal edildi: [Fatura Başlığı]"
- **Description:** 
  - **SHIPPED'tan:** "Fatura iptal edildi. Rezerve edilen stok geri alındı."
  - **RECEIVED'tan:** "Fatura iptal edildi. Stoğa giriş yapılan ürünler geri alındı."
  - **Diğer durumlardan:** "Fatura iptal edildi."
- **Tip:** Yeşil (success)
- **Süre:** 4 saniye

**Hata Toast:**
- **Title:** "Fatura Güncellenemedi"
- **Description:** Hata mesajı
- **Tip:** Kırmızı (error)
- **Süre:** 5 saniye

---

### 6. **Drag & Drop** (Farklı duruma taşıma)

**Geçersiz Geçiş Toast:**
- **Title:** "Geçersiz durum geçişi" (örn: "DRAFT → PAID geçişi yapılamıyor")
- **Description:** "Bu faturayı şu durumlara taşıyabilirsiniz: SENT, CANCELLED" veya hata mesajı
- **Tip:** Kırmızı (error)
- **Süre:** 5 saniye

**Immutable Durum Toast:**
- **Title:** "Bu durum değiştirilemez"
- **Description:** "Ödenmiş veya iptal edilmiş faturalar değiştirilemez."
- **Tip:** Kırmızı (error)
- **Süre:** 5 saniye

---

## 💼 DEAL KANBAN (FIRSAT KANBAN) - TOAST MESAJLARI

### 1. **Drag & Drop** (Aşama değişikliği)

**Başarı Toast:**
- **Title:** "Aşama değiştirildi"
- **Description:** "Fırsat '[Eski Aşama]' → '[Yeni Aşama]' aşamasına taşındı."
- **Tip:** Yeşil (success)
- **Süre:** 4 saniye

**Hata Toast:**
- **Title:** "Fırsat aşaması değiştirilemedi"
- **Description:** "Bir hata oluştu" veya hata mesajı
- **Tip:** Kırmızı (error)
- **Süre:** 5 saniye

---

### 2. **Geçersiz Geçiş** (Drag & Drop)

**Geçersiz Geçiş Toast:**
- **Title:** "[Eski Aşama] → [Yeni Aşama] geçişi yapılamıyor"
- **Description:** "Bu fırsatı şu aşamalara taşıyabilirsiniz: [İzin Verilen Aşamalar]" veya hata mesajı
- **Tip:** Kırmızı (error)
- **Süre:** 5 saniye

**Immutable Durum Toast:**
- **Title:** "Bu aşama değiştirilemez"
- **Description:** "Kazanılmış veya kaybedilmiş fırsatlar değiştirilemez."
- **Tip:** Kırmızı (error)
- **Süre:** 5 saniye

---

### 3. **LOST'a Geçiş** (Özel Durum)

**Dialog:**
- **Mesaj:** "Fırsatı 'Kaybedildi' olarak işaretlemek istediğinize emin misiniz?"
- **Sebep:** Sebep sorulur (zorunlu)

**Başarı Toast:**
- **Title:** "Fırsat kaybedildi olarak işaretlendi"
- **Description:** "Fırsat '[Sebep]' nedeniyle kaybedildi olarak işaretlendi."
- **Tip:** Yeşil (success)
- **Süre:** 4 saniye

---

## 📊 TOAST MESAJ TİPLERİ

### ✅ Success (Başarılı)
- **Renk:** Yeşil
- **Süre:** 4 saniye
- **Kullanım:** Başarılı işlemler için

### ❌ Error (Hata)
- **Renk:** Kırmızı
- **Süre:** 5 saniye
- **Kullanım:** Hata durumları için

### ⚠️ Warning (Uyarı)
- **Renk:** Sarı/Turuncu
- **Süre:** 4 saniye
- **Kullanım:** Uyarı mesajları için

### ℹ️ Info (Bilgi)
- **Renk:** Mavi
- **Süre:** 4 saniye
- **Kullanım:** Bilgilendirme mesajları için

---

## 🔄 TOAST MESAJ FORMATI

### Standart Format
```typescript
toast.success('Başlık', { description: 'Açıklama' })
toast.error('Başlık', { description: 'Açıklama' })
toast.warning('Başlık', { description: 'Açıklama' })
toast.info('Başlık', { description: 'Açıklama' })
```

### Özel Format (toastError, toastSuccess)
```typescript
toastError('Başlık', 'Açıklama')
toastSuccess('Başlık', 'Açıklama')
```

---

## 📋 TÜM TOAST MESAJLARI LİSTESİ

### Quote Kanban
1. ✅ "Teklif gönderildi" - "Teklif başarıyla gönderildi ve durumu güncellendi."
2. ✅ "Teklif kabul edildi" - "Teklif kabul edildi, otomatik olarak fatura ve sözleşme oluşturuldu."
3. ✅ "Teklif reddedildi" - "Teklif reddedildi, otomatik olarak revizyon görevi oluşturuldu."
4. ❌ "Durum değiştirilemedi" - "Bir hata oluştu" veya hata mesajı
5. ❌ "Geçersiz durum geçişi" - "Bu teklifi şu durumlara taşıyabilirsiniz: ..."
6. ❌ "Bu durum değiştirilemez" - "Kabul edilmiş veya reddedilmiş teklifler değiştirilemez."

### Invoice Kanban
1. ✅ "Fatura gönderildi: [Başlık]" - "Fatura 'Gönderildi' durumuna taşındı."
2. ✅ "Fatura sevk edildi: [Başlık]" - "Ürünler sevk edildi ve stoktan düşüldü."
3. ✅ "Fatura alındı: [Başlık]" - "Satın alma onaylandı ve stoğa giriş yapıldı."
4. ✅ "Fatura ödendi: [Başlık]" - "Ödeme alındı/yapıldı ve finans kaydı oluşturuldu."
5. ✅ "Fatura iptal edildi: [Başlık]" - "Fatura iptal edildi. [Stok işlemleri geri alındı.]"
6. ❌ "Fatura Güncellenemedi" - Hata mesajı
7. ❌ "Durum değiştirilemedi" - "Bir hata oluştu" veya hata mesajı
8. ❌ "Geçersiz durum geçişi" - "Bu faturayı şu durumlara taşıyabilirsiniz: ..."
9. ❌ "Bu durum değiştirilemez" - "Ödenmiş veya iptal edilmiş faturalar değiştirilemez."

### Deal Kanban
1. ✅ "Aşama değiştirildi" - "Fırsat '[Eski]' → '[Yeni]' aşamasına taşındı."
2. ✅ "Fırsat kaybedildi olarak işaretlendi" - "Fırsat '[Sebep]' nedeniyle kaybedildi olarak işaretlendi."
3. ❌ "Fırsat aşaması değiştirilemedi" - "Bir hata oluştu" veya hata mesajı
4. ❌ "[Eski] → [Yeni] geçişi yapılamıyor" - "Bu fırsatı şu aşamalara taşıyabilirsiniz: ..."
5. ❌ "Bu aşama değiştirilemez" - "Kazanılmış veya kaybedilmiş fırsatlar değiştirilemez."

---

## ⚠️ ÖNEMLİ NOTLAR

1. **Tüm toast mesajları description ile gösterilir**
2. **Hata mesajları kullanıcı dostu olmalı**
3. **Başarı mesajları otomatik işlemleri açıklar**
4. **Onay dialog'ları kritik işlemler için kullanılır**
5. **Toast süreleri: Success 4s, Error 5s**

---

**Tarih**: 2024
**Versiyon**: 1.0.0

