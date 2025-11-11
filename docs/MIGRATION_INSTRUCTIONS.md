# 🚀 Product System Enhancement Migration

## ⚠️ ÖNEMLİ: Migration'ı Çalıştırın!

`Product.category` kolonu eksik olduğu için hata alıyorsunuz. Migration'ı çalıştırmanız gerekiyor.

## 📋 Adımlar

1. **Supabase Dashboard'a gidin**: https://supabase.com/dashboard
2. **Projenizi seçin**
3. **SQL Editor'a gidin** (Sol menüden)
4. **Yeni bir query oluşturun**
5. **Aşağıdaki SQL'i kopyalayın ve yapıştırın**
6. **"Run" butonuna tıklayın**

## 📄 Migration SQL

Migration SQL'i `supabase/migrations/005_enhance_product_system.sql` dosyasında bulunuyor.

## ✅ Migration Sonrası

Migration çalıştırıldıktan sonra:
- ✅ `Product.category` kolonu eklenecek
- ✅ `Product.sku` kolonu eklenecek
- ✅ `Product.barcode` kolonu eklenecek
- ✅ `Product.status` kolonu eklenecek
- ✅ `Product.minStock`, `maxStock`, `unit` kolonları eklenecek
- ✅ `InvoiceItem` tablosu oluşturulacak
- ✅ `StockMovement` tablosu oluşturulacak
- ✅ Otomatik stok takip trigger'ları aktif olacak

## 🔄 Sayfayı Yenileyin

Migration çalıştırıldıktan sonra sayfayı yenileyin (F5). Hata düzelecek!
