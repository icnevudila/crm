# 🔄 Backup Checklist - Mal Kabul Sistemi

## 📅 Backup Tarihi: $(date)

## ✅ Yapılan Değişiklikler

### 1. Database Migrations
- ✅ `009_purchase_reservation_system.sql` - PurchaseTransaction tablosu ve trigger'lar
- ✅ `run_purchase_transaction_migration.sql` - Tam migration scripti
- ✅ `check_purchase_transaction_table.sql` - Tablo kontrol scripti

### 2. API Endpoints
- ✅ `/api/purchase-shipments/route.ts` - Mal kabul listesi ve oluşturma
- ✅ `/api/purchase-shipments/[id]/route.ts` - Mal kabul detay, güncelleme, silme
- ✅ `/api/purchase-shipments/[id]/approve/route.ts` - Mal kabul onaylama
- ✅ `/api/invoices/route.ts` - Alış faturası oluşturulunca otomatik mal kabul kaydı

### 3. UI Components
- ✅ `src/components/purchase-shipments/PurchaseShipmentList.tsx` - Mal kabul listesi
- ✅ `src/app/[locale]/purchase-shipments/page.tsx` - Mal kabul sayfası

### 4. Database Tables
- ✅ `PurchaseTransaction` - Mal kabul kayıtları
- ✅ `Product.incomingQuantity` - Beklenen giriş miktarı
- ✅ `Invoice.purchaseShipmentId` - Fatura-mal kabul ilişkisi

### 5. Database Triggers
- ✅ `update_stock_on_purchase_approval()` - Mal kabul onaylandığında stok artışı
- ✅ `restore_incoming_on_invoice_item_delete()` - InvoiceItem silindiğinde incomingQuantity geri ekleme

## 🔄 Geri Dönüş Adımları

### Eğer Geri Dönmek İsterseniz:

1. **Supabase Dashboard > Database > Backups**'dan backup'ı geri yükleyin
2. Veya aşağıdaki SQL'i çalıştırarak tabloyu ve trigger'ları kaldırın:

```sql
-- PurchaseTransaction tablosunu kaldır
DROP TABLE IF EXISTS "PurchaseTransaction" CASCADE;

-- Product.incomingQuantity kolonunu kaldır
ALTER TABLE "Product" DROP COLUMN IF EXISTS "incomingQuantity";

-- Invoice.purchaseShipmentId kolonunu kaldır
ALTER TABLE "Invoice" DROP COLUMN IF EXISTS "purchaseShipmentId";

-- Trigger'ları kaldır
DROP TRIGGER IF EXISTS trigger_update_stock_on_purchase_approval ON "PurchaseTransaction";
DROP FUNCTION IF EXISTS update_stock_on_purchase_approval();
DROP TRIGGER IF EXISTS trigger_restore_incoming_on_invoice_item_delete ON "InvoiceItem";
DROP FUNCTION IF EXISTS restore_incoming_on_invoice_item_delete();
```

3. **Git'ten geri dön:**
```bash
git log --oneline  # Son commit'leri gör
git reset --hard <commit-hash>  # Belirli bir commit'e geri dön
```

## 📝 Önemli Notlar

- Mal kabul sistemi alış faturaları için çalışır
- Alış faturası oluşturulunca otomatik taslak mal kabul kaydı açılır
- Mal kabul onaylandığında stok artışı yapılır ve `incomingQuantity` azalır
- Fatura durumu `RECEIVED` olarak güncellenir

## 🗂️ İlgili Dosyalar

- `supabase/migrations/009_purchase_reservation_system.sql`
- `run_purchase_transaction_migration.sql`
- `check_purchase_transaction_table.sql`
- `src/app/api/purchase-shipments/`
- `src/components/purchase-shipments/`
- `src/app/[locale]/purchase-shipments/`

