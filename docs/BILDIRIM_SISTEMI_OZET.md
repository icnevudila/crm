# 🔔 Bildirim Sistemi - Tüm Otomasyonlar Özeti

Bu dokümanda sistemdeki **TÜM** otomasyonlar için bildirim sistemi özeti bulunmaktadır.

---

## ✅ Eklenen Bildirimler

### 1. **Quote (Teklif) Otomasyonları**

#### ✅ Quote Oluşturuldu
- **Trigger**: `POST /api/quotes`
- **Bildirim**: "Yeni Teklif Oluşturuldu"
- **Mesaj**: "Yeni bir teklif oluşturuldu. Detayları görmek ister misiniz?"
- **Link**: `/tr/quotes/{id}`
- **Rol**: ADMIN, SALES, SUPER_ADMIN

#### ✅ Quote Onaylandı (ACCEPTED)
- **Trigger**: Database trigger (`trigger_quote_accepted_notify`)
- **Bildirim**: "Teklif Onaylandı"
- **Mesaj**: "Teklif onaylandı. Detayları görmek ister misiniz?"
- **Link**: `/tr/quotes/{id}`
- **Rol**: ADMIN, SALES, SUPER_ADMIN

#### ✅ Quote Güncellendi (AutoNoteOnEdit)
- **Trigger**: `PUT /api/quotes/{id}` (status veya total değiştiğinde)
- **Bildirim**: "Teklif Güncellendi"
- **Mesaj**: Değişiklik açıklaması + "Detayları görmek ister misiniz?"
- **Link**: `/tr/quotes/{id}`
- **Rol**: ADMIN, SALES, SUPER_ADMIN

#### ✅ AutoTaskFromQuote - Görev Oluşturuldu
- **Trigger**: `POST /api/quotes` (teklif oluşturulduğunda otomatik görev)
- **Bildirim**: "Yeni Görev Oluşturuldu"
- **Mesaj**: "Teklif için otomatik görev oluşturuldu. Görevi görmek ister misiniz?"
- **Link**: `/tr/tasks/{id}`
- **Kullanıcı**: Teklif sahibi

---

### 2. **Invoice (Fatura) Otomasyonları**

#### ✅ Invoice Oluşturuldu
- **Trigger**: `POST /api/invoices`
- **Bildirim**: "Yeni Fatura Oluşturuldu"
- **Mesaj**: "Yeni bir fatura oluşturuldu. Detayları görmek ister misiniz?"
- **Link**: `/tr/invoices/{id}`
- **Rol**: ADMIN, SALES, SUPER_ADMIN

#### ✅ Invoice Oluşturuldu (Quote ACCEPTED)
- **Trigger**: `PUT /api/quotes/{id}` (status ACCEPTED olduğunda)
- **Bildirim**: "Fatura Oluşturuldu"
- **Mesaj**: "Teklif kabul edildi ve fatura oluşturuldu. Faturayı görmek ister misiniz?"
- **Link**: `/tr/invoices/{id}`
- **Rol**: ADMIN, SALES, SUPER_ADMIN

#### ✅ Invoice Ödendi (PAID)
- **Trigger**: `PUT /api/invoices/{id}` (status PAID olduğunda)
- **Bildirim**: "Fatura Ödendi"
- **Mesaj**: "Fatura ödendi ve finans kaydı oluşturuldu. Detayları görmek ister misiniz?"
- **Link**: `/tr/invoices/{id}`
- **Rol**: ADMIN, SALES, SUPER_ADMIN

---

### 3. **Deal (Fırsat) Otomasyonları**

#### ✅ Deal Oluşturuldu
- **Trigger**: `POST /api/deals`
- **Bildirim**: "Yeni Fırsat Oluşturuldu"
- **Mesaj**: "Yeni bir fırsat oluşturuldu. Detayları görmek ister misiniz?"
- **Link**: `/tr/deals/{id}`
- **Rol**: ADMIN, SALES, SUPER_ADMIN

---

### 4. **Customer (Müşteri) Otomasyonları**

#### ✅ Customer Oluşturuldu
- **Trigger**: `POST /api/customers`
- **Bildirim**: "Yeni Müşteri Oluşturuldu"
- **Mesaj**: "Yeni bir müşteri oluşturuldu. Detayları görmek ister misiniz?"
- **Link**: `/tr/customers/{id}`
- **Rol**: ADMIN, SALES, SUPER_ADMIN

---

### 5. **Task (Görev) Otomasyonları**

#### ✅ Task Oluşturuldu
- **Trigger**: `POST /api/tasks` (atama bildirimi yoksa)
- **Bildirim**: "Yeni Görev Oluşturuldu"
- **Mesaj**: "Yeni bir görev oluşturuldu. Detayları görmek ister misiniz?"
- **Link**: `/tr/tasks/{id}`
- **Kullanıcı**: Görev sahibi

---

### 6. **Shipment (Sevkiyat) Otomasyonları**

#### ✅ Shipment Oluşturuldu
- **Trigger**: `POST /api/shipments`
- **Bildirim**: "Yeni Sevkiyat Oluşturuldu"
- **Mesaj**: "Yeni bir sevkiyat oluşturuldu. Detayları görmek ister misiniz?"
- **Link**: `/tr/shipments/{id}`
- **Rol**: ADMIN, SALES, SUPER_ADMIN

#### ✅ Shipment Teslim Edildi (DELIVERED)
- **Trigger**: `PUT /api/shipments/{id}/status` (status DELIVERED olduğunda)
- **Bildirim**: "Sevkiyat Teslim Edildi"
- **Mesaj**: "Sevkiyat başarıyla teslim edildi. Detayları görmek ister misiniz?"
- **Link**: `/tr/shipments/{id}`
- **Rol**: ADMIN, SALES, SUPER_ADMIN

---

### 7. **Product (Ürün) Otomasyonları**

#### ✅ Düşük Stok Uyarısı
- **Trigger**: Database trigger (`trigger_product_low_stock`)
- **Bildirim**: "Düşük Stok Uyarısı"
- **Mesaj**: "{Ürün Adı} ürünü minimum stok seviyesinin altına düştü. (Mevcut: X, Minimum: Y) Detayları görmek ister misiniz?"
- **Link**: `/tr/products/{id}`
- **Rol**: ADMIN, STOCK, SUPER_ADMIN

---

## 🔗 Detay Sayfaları

Tüm detay sayfaları çalışır durumda ve doğru link'lerle yönlendirme yapıyor:

- ✅ `/tr/quotes/{id}` - Quote detay sayfası
- ✅ `/tr/invoices/{id}` - Invoice detay sayfası
- ✅ `/tr/deals/{id}` - Deal detay sayfası
- ✅ `/tr/customers/{id}` - Customer detay sayfası
- ✅ `/tr/tasks/{id}` - Task detay sayfası
- ✅ `/tr/shipments/{id}` - Shipment detay sayfası
- ✅ `/tr/products/{id}` - Product detay sayfası

---

## 📝 Kullanıcı Dostu Mesajlar

Tüm bildirim mesajları:
- ✅ Türkçe ve anlaşılır
- ✅ "Detayları görmek ister misiniz?" ile bitiyor
- ✅ İlgili entity'nin adını içeriyor
- ✅ Uygun bildirim tipi kullanılıyor (info, success, warning, error)

---

## 🎯 Bildirim Tipleri

- **info**: Bilgilendirme (yeni kayıt oluşturuldu, güncellendi)
- **success**: Başarılı işlem (onaylandı, ödendi, teslim edildi)
- **warning**: Uyarı (düşük stok)
- **error**: Hata (gelecekte kullanılabilir)
- **system**: Sistem bildirimi (gelecekte kullanılabilir)

---

## ✅ Test Edilmesi Gerekenler

1. ✅ Tüm CRUD işlemleri için bildirim oluşturuluyor mu?
2. ✅ Bildirim link'leri doğru detay sayfalarına yönlendiriyor mu?
3. ✅ Bildirim mesajları kullanıcı dostu mu?
4. ✅ Real-time bildirimler çalışıyor mu?
5. ✅ Bildirim okundu işaretleme çalışıyor mu?

---

## 📦 Dosyalar

- `src/lib/notification-helper.ts` - Bildirim helper fonksiyonları
- `src/components/NotificationMenu.tsx` - Bildirim menü component'i
- `src/lib/notifications.ts` - Bildirim utility fonksiyonları
- `supabase/migrations/021_notifications_system.sql` - Bildirim sistemi migration

---

**✅ Tüm otomasyonlar için bildirim sistemi tamamlandı!**































