# 📦 Ürün Sistemi Geliştirme - Basit Açıklama

## 🎯 Bu Migration Ne Yapıyor?

Bu SQL dosyası, CRM sisteminizdeki **ürün yönetimi** sistemini geliştirir. Şu özellikleri ekler:

1. ✅ **Ürünlere yeni bilgiler ekler** (kategori, barkod, SKU, vb.)
2. ✅ **Fatura-Ürün bağlantısı** oluşturur (hangi ürün hangi faturada satıldı?)
3. ✅ **Stok hareket takibi** yapar (stok ne zaman arttı, ne zaman azaldı?)
4. ✅ **Otomatik stok güncelleme** yapar (fatura oluşturulunca stok otomatik düşer/artar)

---

## 📋 Adım Adım Ne Oluyor?

### 1️⃣ **InvoiceItem Tablosu Oluşturuluyor**

**Ne demek?**
- Bir faturada hangi ürünlerin satıldığını kaydetmek için yeni bir tablo oluşturuluyor.

**Örnek:**
```
Fatura: "ABC Şirketi Faturası"
├─ Ürün 1: Laptop (5 adet, 10.000 TL)
├─ Ürün 2: Mouse (10 adet, 500 TL)
└─ Ürün 3: Klavye (3 adet, 1.500 TL)
```

**Bu tablo şunları saklar:**
- Hangi faturada (`invoiceId`)
- Hangi ürün (`productId`)
- Kaç adet (`quantity`)
- Birim fiyat (`unitPrice`)
- Toplam fiyat (`total`)

---

### 2️⃣ **StockMovement Tablosu Oluşturuluyor**

**Ne demek?**
- Stok hareketlerini (giriş/çıkış) kaydetmek için yeni bir tablo oluşturuluyor.

**Örnek:**
```
Ürün: Laptop
├─ 01.01.2024: +10 adet (Tedarikçi alışı)
├─ 05.01.2024: -3 adet (Satış faturası)
├─ 10.01.2024: -2 adet (Satış faturası)
└─ 15.01.2024: +5 adet (Manuel giriş)
```

**Bu tablo şunları saklar:**
- Hangi ürün (`productId`)
- Hareket tipi (`type`): `IN` (giriş), `OUT` (çıkış), `ADJUSTMENT` (düzeltme), `RETURN` (iade)
- Miktar (`quantity`): Pozitif (giriş) veya negatif (çıkış)
- Önceki stok (`previousStock`): İşlem öncesi stok
- Yeni stok (`newStock`): İşlem sonrası stok
- Sebep (`reason`): `SATIS`, `TEDARIKCI`, `MANUEL`, `IADE`, vb.
- İlişkili kayıt (`relatedTo`, `relatedId`): Hangi fatura/sevkiyat ile ilgili?

---

### 3️⃣ **Product Tablosuna Yeni Kolonlar Ekleniyor**

**Ne demek?**
- Ürün tablosuna yeni bilgi alanları ekleniyor.

**Yeni alanlar:**

| Alan | Açıklama | Örnek |
|------|----------|-------|
| `category` | Ürün kategorisi | "Elektronik", "Giyim", "Gıda" |
| `sku` | Stok kodu (SKU) | "LAPTOP-001", "MOUSE-002" |
| `barcode` | Barkod/QR kod | "1234567890123" |
| `status` | Durum | `ACTIVE` (Aktif), `INACTIVE` (Pasif), `DISCONTINUED` (Üretimden kaldırıldı) |
| `minStock` | Minimum stok seviyesi | 10 (stok 10'un altına düşerse uyarı ver) |
| `maxStock` | Maksimum stok seviyesi | 100 (stok 100'ü geçerse uyarı ver) |
| `unit` | Birim | `ADET`, `KG`, `LITRE`, `M2` |
| `weight` | Ağırlık | 2.5 (kg) |
| `dimensions` | Boyutlar | "30x20x10 cm" |

**Örnek Ürün:**
```
Ürün Adı: Laptop
Kategori: Elektronik
SKU: LAPTOP-001
Barkod: 1234567890123
Durum: Aktif
Min Stok: 10
Max Stok: 100
Birim: ADET
Ağırlık: 2.5 kg
Boyutlar: 30x20x10 cm
```

---

### 4️⃣ **Index'ler Oluşturuluyor (Performans İçin)**

**Ne demek?**
- Veritabanı sorgularını hızlandırmak için index'ler oluşturuluyor.

**Örnek:**
- `InvoiceItem` tablosunda `invoiceId` ile arama yaparken hızlı sonuç almak için index var.
- `StockMovement` tablosunda `productId` ile arama yaparken hızlı sonuç almak için index var.

**Kullanıcı için faydası:**
- Ürün listesi daha hızlı yüklenir.
- Stok geçmişi daha hızlı görüntülenir.

---

### 5️⃣ **RLS (Row Level Security) Politikaları**

**Ne demek?**
- Her şirket sadece kendi verilerini görebilir (güvenlik).

**Örnek:**
- Şirket A, Şirket B'nin ürünlerini göremez.
- Şirket A, sadece kendi ürünlerini görür.

---

### 6️⃣ **Otomatik Stok Güncelleme Trigger'ı**

**Ne demek?**
- Bir faturaya ürün eklendiğinde, stok **otomatik** güncellenir.

**Nasıl Çalışır?**

#### Senaryo 1: Satış Faturası (vendorId YOK)
```
1. Kullanıcı yeni bir fatura oluşturur (müşteriye satış)
2. Faturaya "Laptop" ürününden 5 adet ekler
3. Sistem otomatik olarak:
   ✅ Laptop stokunu 5 azaltır (100 → 95)
   ✅ StockMovement tablosuna kayıt ekler:
      - Tip: OUT (çıkış)
      - Miktar: -5
      - Sebep: SATIS
      - Önceki stok: 100
      - Yeni stok: 95
```

#### Senaryo 2: Tedarikçi Alış Faturası (vendorId VAR)
```
1. Kullanıcı yeni bir fatura oluşturur (tedarikçiden alış)
2. Faturaya tedarikçi seçer (vendorId doldurulur)
3. Faturaya "Laptop" ürününden 10 adet ekler
4. Sistem otomatik olarak:
   ✅ Laptop stokunu 10 artırır (95 → 105)
   ✅ StockMovement tablosuna kayıt ekler:
      - Tip: IN (giriş)
      - Miktar: +10
      - Sebep: TEDARIKCI
      - Önceki stok: 95
      - Yeni stok: 105
```

**Kullanıcı için faydası:**
- Manuel stok güncelleme yapmaya gerek yok.
- Her işlem otomatik kaydedilir.
- Stok geçmişi tam olarak tutulur.

---

### 7️⃣ **InvoiceItem Silme Trigger'ı**

**Ne demek?**
- Bir faturadan ürün silindiğinde, stok **otomatik** geri eklenir.

**Örnek:**
```
1. Kullanıcı bir faturadan "Laptop" ürününü siler (5 adet)
2. Sistem otomatik olarak:
   ✅ Laptop stokunu 5 artırır (95 → 100)
   ✅ StockMovement tablosuna kayıt ekler:
      - Tip: RETURN (iade)
      - Miktar: +5
      - Sebep: IADE
      - Önceki stok: 95
      - Yeni stok: 100
```

---

## 🎯 Kullanıcı İçin Ne Değişir?

### ✅ Öncesi (Eski Sistem)
- Ürünlerde sadece: Ad, Fiyat, Stok
- Stok hareketleri takip edilmiyor
- Fatura-ürün bağlantısı yok
- Manuel stok güncelleme gerekli

### ✅ Sonrası (Yeni Sistem)
- Ürünlerde: Ad, Fiyat, Stok, **Kategori, SKU, Barkod, Min/Max Stok, Birim, Ağırlık, Boyutlar**
- **Stok hareketleri otomatik takip ediliyor**
- **Fatura-ürün bağlantısı var** (hangi ürün hangi faturada?)
- **Otomatik stok güncelleme** (fatura oluşturulunca stok düşer/artar)

---

## 📊 Örnek Kullanım Senaryoları

### Senaryo 1: Yeni Ürün Ekleme
```
1. Ürünler sayfasına gidin
2. "Yeni Ürün" butonuna tıklayın
3. Formu doldurun:
   - Ad: Laptop
   - Kategori: Elektronik
   - SKU: LAPTOP-001
   - Barkod: 1234567890123
   - Min Stok: 10
   - Max Stok: 100
   - Birim: ADET
   - Ağırlık: 2.5
   - Boyutlar: 30x20x10 cm
4. Kaydedin
```

### Senaryo 2: Satış Faturası Oluşturma
```
1. Faturalar sayfasına gidin
2. "Yeni Fatura" butonuna tıklayın
3. Müşteri seçin (vendorId seçmeyin - bu satış faturası)
4. Faturaya ürün ekleyin:
   - Ürün: Laptop
   - Miktar: 5
5. Kaydedin
6. Sistem otomatik olarak:
   - Laptop stokunu 5 azaltır
   - StockMovement kaydı oluşturur
```

### Senaryo 3: Tedarikçi Alış Faturası Oluşturma
```
1. Faturalar sayfasına gidin
2. "Yeni Fatura" butonuna tıklayın
3. Tedarikçi seçin (vendorId seçin - bu alış faturası)
4. Faturaya ürün ekleyin:
   - Ürün: Laptop
   - Miktar: 10
5. Kaydedin
6. Sistem otomatik olarak:
   - Laptop stokunu 10 artırır
   - StockMovement kaydı oluşturur (TEDARIKCI sebebi ile)
```

### Senaryo 4: Stok Geçmişi Görüntüleme
```
1. Ürünler sayfasına gidin
2. Bir ürüne tıklayın (detay sayfası)
3. "Stok Geçmişi" sekmesine gidin
4. Son 10 stok hareketini görün:
   - 01.01.2024: +10 adet (TEDARIKCI)
   - 05.01.2024: -3 adet (SATIS)
   - 10.01.2024: -2 adet (SATIS)
   - 15.01.2024: +5 adet (MANUEL)
```

### Senaryo 5: Kritik Stok Uyarısı
```
1. Ürünler sayfasına gidin
2. Bir ürünün stok seviyesi "minStock" altına düşerse:
   - Ürün listesinde kırmızı uyarı ikonu görünür
   - Ürünün üzerine gelince "Kritik stok seviyesi" tooltip'i çıkar
```

---

## ⚠️ Önemli Notlar

### 1. Migration Sırası
- **Önce** `005_enhance_product_system.sql` çalıştırılmalı
- **Sonra** (opsiyonel) `006_update_invoice_item_trigger_for_vendor.sql` çalıştırılabilir
- **NOT:** `005` dosyası artık vendorId kontrolünü içeriyor, `006` dosyasına gerek yok!

### 2. Mevcut Veriler
- Mevcut ürünleriniz korunur
- Yeni kolonlar `NULL` veya varsayılan değerlerle doldurulur
- Eski stok bilgileri korunur

### 3. Geri Dönüş
- Migration'ı geri almak için manuel SQL yazmanız gerekir
- Önce test ortamında deneyin!

---

## 🧪 Test Etmek İçin

### 1. Migration'ı Çalıştırın
```
Supabase Dashboard → SQL Editor → 005_enhance_product_system.sql dosyasını çalıştırın
```

### 2. Kontrol Edin
```sql
-- Yeni kolonlar var mı?
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'Product' 
AND column_name IN ('category', 'sku', 'barcode', 'status', 'minStock', 'maxStock', 'unit');

-- Tablolar oluşturuldu mu?
SELECT COUNT(*) FROM "InvoiceItem";
SELECT COUNT(*) FROM "StockMovement";
```

### 3. Test Senaryosu
```
1. Yeni bir ürün ekleyin (kategori, SKU, barkod ile)
2. Yeni bir satış faturası oluşturun ve ürün ekleyin
3. Ürünün stokunun düştüğünü kontrol edin
4. Stok geçmişine bakın (StockMovement kaydı oluşmuş mu?)
```

---

## 📞 Sorular ve Cevaplar

**S: Bu migration mevcut verilerimi siler mi?**
C: Hayır, mevcut verileriniz korunur. Sadece yeni kolonlar eklenir.

**S: Eski faturalarım etkilenir mi?**
C: Hayır, eski faturalarınız etkilenmez. Sadece yeni faturalarda `InvoiceItem` kullanılır.

**S: Stok geçmişi otomatik mi oluşur?**
C: Evet, yeni faturalar oluşturulduğunda otomatik oluşur. Eski faturalar için geçmiş kayıt yoktur.

**S: Manuel stok girişi yapabilir miyim?**
C: Evet, ürün detay sayfasından "Yeni Giriş" veya "Yeni Çıkış" butonlarıyla manuel stok hareketi ekleyebilirsiniz.

**S: Tedarikçi alış faturası nasıl oluşturulur?**
C: Fatura oluştururken "Tedarikçi" alanını doldurun. Sistem otomatik olarak stok artışı yapar.

---

## ✅ Özet

Bu migration dosyası:
1. ✅ Ürünlere yeni bilgiler ekler (kategori, SKU, barkod, vb.)
2. ✅ Fatura-ürün bağlantısı oluşturur
3. ✅ Stok hareket takibi yapar
4. ✅ Otomatik stok güncelleme yapar (satış/alış farkına göre)

**Kullanıcı için faydası:**
- Daha detaylı ürün bilgileri
- Otomatik stok takibi
- Stok geçmişi görüntüleme
- Kritik stok uyarıları

