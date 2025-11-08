# 🚚 Sevkiyat Onaylandığında Yapılan İşlemler

Bir sevkiyat **APPROVED** durumuna alındığında sistemde otomatik olarak şu işlemler yapılır:

## 📋 1. Shipment Tablosu
- ✅ **status** → `APPROVED` olarak güncellenir
- ✅ **updatedAt** → Güncel tarih/saat olarak güncellenir
- ✅ **estimatedDelivery** → 2 gün sonraki tarih hesaplanır (kolon varsa)

## 📦 2. Product Tablosu (Trigger ile - Otomatik)
Her fatura kalemi (InvoiceItem) için:
- ✅ **stock** → Düşer (miktar kadar azalır)
- ✅ **reservedQuantity** → Düşer (miktar kadar azalır)
- ✅ **updatedAt** → Güncel tarih/saat olarak güncellenir

**Örnek:**
- Ürün A: stock = 100, reservedQuantity = 10
- Faturada: 5 adet
- Onaylandıktan sonra: stock = 95, reservedQuantity = 5

## 📊 3. StockMovement Tablosu (Trigger ile - Otomatik)
Her fatura kalemi için yeni kayıt oluşturulur:
- ✅ **type** → `OUT` (çıkış)
- ✅ **quantity** → Negatif değer (-miktar)
- ✅ **reason** → `SEVKIYAT`
- ✅ **relatedTo** → `Shipment`
- ✅ **relatedId** → Sevkiyat ID'si
- ✅ **previousStock** → Önceki stok miktarı
- ✅ **newStock** → Yeni stok miktarı (stock - quantity)

**Örnek:**
- Ürün A: 5 adet sevkiyat
- StockMovement: type='OUT', quantity=-5, reason='SEVKIYAT', previousStock=100, newStock=95

## 📝 4. ActivityLog Tablosu (API ile)
### 4.1. Shipment için ActivityLog
- ✅ **entity** → `Shipment`
- ✅ **action** → `UPDATE`
- ✅ **description** → "Sevkiyat durumu değiştirildi: [Eski Durum] → APPROVED"
- ✅ **meta** → JSON (entity, action, id, oldStatus, newStatus)

### 4.2. Invoice için ActivityLog
- ✅ **entity** → `Invoice`
- ✅ **action** → `UPDATE`
- ✅ **description** → "Sevkiyat onaylandı: [Takip No] - [Fatura Başlığı] faturasına ait sevkiyat onaylandı ve stok düşümü yapıldı."
- ✅ **meta** → JSON (entity, action, invoiceId, shipmentId, shipmentTracking, status)

## 🔄 İşlem Akışı

```
1. Kullanıcı "Onayla" butonuna tıklar
   ↓
2. API: /api/shipments/[id]/status (PUT)
   ↓
3. Shipment.status = 'APPROVED' olarak güncellenir
   ↓
4. Database Trigger: update_stock_on_shipment_approval() çalışır
   ↓
5. Her InvoiceItem için:
   - StockMovement kaydı oluşturulur (OUT)
   - Product.stock düşer
   - Product.reservedQuantity düşer
   ↓
6. ActivityLog kayıtları oluşturulur:
   - Shipment için ActivityLog
   - Invoice için ActivityLog
   ↓
7. estimatedDelivery hesaplanır (2 gün sonra)
   ↓
8. API response döner (güncellenmiş Shipment verisi)
   ↓
9. Frontend: Optimistic update (hemen UI'da görünür)
   ↓
10. Cache invalidate edilir (sayfa yenilendiğinde fresh data)
```

## ⚠️ ÖNEMLİ NOTLAR

1. **Trigger Otomatik Çalışır**: StockMovement ve Product güncellemeleri database trigger'ı ile otomatik yapılır. API'den ayrı bir işlem gerekmez.

2. **ReservedQuantity Sistemi**: 
   - Fatura oluşturulduğunda → `reservedQuantity` artar (stok düşmez)
   - Sevkiyat onaylandığında → `reservedQuantity` düşer, `stock` düşer

3. **StockMovement Log**: Her sevkiyat onayı için stok hareketi kaydı oluşturulur. Bu kayıtlar ürün detay sayfasında "Stok Geçmişi" sekmesinde görüntülenir.

4. **ActivityLog**: Hem Shipment hem de Invoice için ActivityLog kaydı oluşturulur. Bu kayıtlar ilgili sayfalarda görüntülenir.

5. **estimatedDelivery**: Sadece kolon varsa hesaplanır (migration çalıştırılmamış olabilir).

## 🧪 Test Senaryosu

1. Bir satış faturası oluştur (5 adet Ürün A)
   - Ürün A: stock = 100, reservedQuantity = 0
   - Fatura oluşturulduktan sonra: stock = 100, reservedQuantity = 5

2. Fatura için sevkiyat oluştur
   - Sevkiyat: status = 'DRAFT'
   - Ürün A: stock = 100, reservedQuantity = 5 (değişmedi)

3. Sevkiyatı onayla
   - Sevkiyat: status = 'APPROVED'
   - Ürün A: stock = 95, reservedQuantity = 0
   - StockMovement: type='OUT', quantity=-5, reason='SEVKIYAT'
   - ActivityLog: Shipment ve Invoice için kayıtlar oluşturuldu

