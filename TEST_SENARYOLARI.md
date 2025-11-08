# 🧪 Test Senaryoları - Mal Kabul ve Sevkiyatlar Modülü

## ✅ 1. SEVKIYATLAR SAYFASI TESTLERİ

### 1.1. Temel Fonksiyonlar
- [ ] **Sevkiyatlar sayfası açılıyor mu?**
  - Sidebar'dan "Sevkiyatlar" menüsüne tıkla
  - Sayfa yükleniyor mu kontrol et

- [ ] **KPI Kartları görünüyor mu?**
  - Üst panelde 6 kart görünüyor mu? (Toplam, Taslak, Yolda, Teslim, Onaylı, İptal)
  - Kartlara tıklayınca filtreleme yapıyor mu?

- [ ] **Filtreleme çalışıyor mu?**
  - Takip numarası araması yap
  - Durum filtresi seç (Taslak, Yolda, Teslim, vb.)
  - Tarih aralığı filtresi seç
  - Sonuçlar doğru filtreleniyor mu?

### 1.2. Durum Yönetimi
- [ ] **Inline durum dropdown çalışıyor mu?**
  - Bir sevkiyat satırında durum dropdown'ına tıkla
  - Durumu değiştir (örn: Taslak → Yolda)
  - Toast bildirimi gösteriliyor mu?
  - Durum güncelleniyor mu?

### 1.3. Fatura Hover Tooltip
- [ ] **Fatura linkine hover yap**
  - Fatura sütunundaki linke mouse ile gel
  - Tooltip açılıyor mu?
  - Fatura No, Müşteri, Toplam, Tarih bilgileri görünüyor mu?

### 1.4. Detay Modalı
- [ ] **Göz ikonuna tıkla**
  - Bir sevkiyat satırında göz ikonuna tıkla
  - Modal açılıyor mu?
  - Sevkiyat bilgileri görünüyor mu?
  - Ürün listesi görünüyor mu?
  - Stok hareketleri görünüyor mu?

### 1.5. Context Menü
- [ ] **3-dot menü çalışıyor mu?**
  - Bir sevkiyat satırında 3-dot menüye tıkla
  - Menü açılıyor mu?
  - "Düzenle", "Görüntüle", "Faturaya Git", "İptal Et", "Sil" seçenekleri var mı?
  - Her seçenek çalışıyor mu?

### 1.6. Raporlama
- [ ] **Raporlar butonu çalışıyor mu?**
  - Sağ üstte "Sevkiyat Raporları" butonuna tıkla
  - Modal açılıyor mu?
  - İstatistikler görünüyor mu?

---

## ✅ 2. MAL KABUL MODÜLÜ TESTLERİ

### 2.1. Otomatik Mal Kabul Oluşturma
- [ ] **Alış faturası oluştur**
  1. Faturalar sayfasına git
  2. "Yeni Fatura" butonuna tıkla
  3. Fatura tipini "Alış" (PURCHASE) seç
  4. Tedarikçi seç
  5. Ürün ekle (InvoiceItem)
  6. Faturayı kaydet
  7. **Kontrol:** Mesaj gösteriliyor mu? "Bu alış faturası için taslak mal kabul oluşturuldu (#id)"
  8. **Kontrol:** Mal Kabul sayfasına git, yeni kayıt var mı?

- [ ] **IncomingQuantity güncellendi mi?**
  1. Ürünler sayfasına git
  2. Eklediğin ürünü bul
  3. Detay sayfasına git
  4. **Kontrol:** "Beklenen Giriş" kartında miktar görünüyor mu?
  5. **Kontrol:** Yeşil badge ve "Mal kabul bekliyor" mesajı var mı?

### 2.2. Mal Kabul Listesi
- [ ] **Mal Kabul sayfası açılıyor mu?**
  - Sidebar'dan "Mal Kabul" menüsüne tıkla (Sevkiyatlar'ın altında)
  - Sayfa yükleniyor mu?

- [ ] **KPI Kartları görünüyor mu?**
  - Üst panelde 3 kart görünüyor mu? (Toplam, Taslak, Onaylı)
  - Kartlara tıklayınca filtreleme yapıyor mu?

- [ ] **Filtreleme çalışıyor mu?**
  - Fatura numarası araması yap
  - Durum filtresi seç (Taslak, Onaylı, İptal)
  - Tarih aralığı filtresi seç
  - Sonuçlar doğru filtreleniyor mu?

### 2.3. Mal Kabul Onaylama
- [ ] **Taslak mal kabulü onayla**
  1. Mal Kabul sayfasında bir "Taslak" kaydı bul
  2. Onayla butonuna tıkla (yeşil checkmark ikonu)
  3. **Kontrol:** Onaylama başarılı mesajı gösteriliyor mu?
  4. **Kontrol:** Durum "Onaylı" olarak güncellendi mi?
  5. **Kontrol:** Ürünler sayfasına git, ürün stoku arttı mı?
  6. **Kontrol:** Ürün detay sayfasında "Beklenen Giriş" azaldı mı?
  7. **Kontrol:** Stok hareketleri tablosunda "Giriş" kaydı oluştu mu?

### 2.4. Detay Modalı
- [ ] **Göz ikonuna tıkla**
  - Bir mal kabul satırında göz ikonuna tıkla
  - Modal açılıyor mu?
  - Mal kabul bilgileri görünüyor mu?
  - Fatura bilgisi görünüyor mu?
  - Ürün listesi görünüyor mu?
  - Stok hareketleri görünüyor mu?

### 2.5. Context Menü
- [ ] **3-dot menü çalışıyor mu?**
  - Bir mal kabul satırında 3-dot menüye tıkla
  - Menü açılıyor mu?
  - "Görüntüle", "Faturaya Git", "Onayla" (sadece Taslak'ta), "Sil" seçenekleri var mı?
  - Her seçenek çalışıyor mu?

---

## ✅ 3. FATURA DETAY SAYFASI TESTLERİ

### 3.1. Satış Faturası
- [ ] **Satış faturası oluştur**
  1. Faturalar sayfasına git
  2. "Yeni Fatura" butonuna tıkla
  3. Fatura tipini "Satış" (SALES) seç
  4. Müşteri seç
  5. Ürün ekle (InvoiceItem)
  6. Faturayı kaydet
  7. **Kontrol:** Mesaj gösteriliyor mu? "Bu fatura için taslak sevkiyat oluşturuldu (#id)"

- [ ] **Fatura detay sayfasında sevkiyat bilgisi**
  1. Oluşturduğun satış faturasının detay sayfasına git
  2. **Kontrol:** "İlgili Sevkiyat" kartı görünüyor mu?
  3. **Kontrol:** Sevkiyat linki çalışıyor mu?
  4. **Kontrol:** Durum badge'i görünüyor mu? (Taslak/Onaylı)
  5. **Kontrol:** "Onaylandığında stok düşecek" mesajı var mı?

### 3.2. Alış Faturası
- [ ] **Alış faturası oluştur**
  1. Faturalar sayfasına git
  2. "Yeni Fatura" butonuna tıkla
  3. Fatura tipini "Alış" (PURCHASE) seç
  4. Tedarikçi seç
  5. Ürün ekle (InvoiceItem)
  6. Faturayı kaydet
  7. **Kontrol:** Mesaj gösteriliyor mu? "Bu alış faturası için taslak mal kabul oluşturuldu (#id)"

- [ ] **Fatura detay sayfasında mal kabul bilgisi**
  1. Oluşturduğun alış faturasının detay sayfasına git
  2. **Kontrol:** "İlgili Mal Kabul" kartı görünüyor mu? (Eğer eklediysen)
  3. **Kontrol:** Mal kabul linki çalışıyor mu?

---

## ✅ 4. ÜRÜN DETAY SAYFASI TESTLERİ

### 4.1. Rezerve Miktar
- [ ] **Rezerve miktar görünüyor mu?**
  1. Ürünler sayfasına git
  2. Bir ürünün detay sayfasına git
  3. **Kontrol:** "Rezerve Miktar" kartı görünüyor mu?
  4. **Kontrol:** Rezerve miktar > 0 ise turuncu badge ve "Sevkiyat bekliyor" mesajı var mı?

### 4.2. Beklenen Giriş
- [ ] **Beklenen giriş görünüyor mu?**
  1. Ürünler sayfasına git
  2. Bir ürünün detay sayfasına git
  3. **Kontrol:** "Beklenen Giriş" kartı görünüyor mu?
  4. **Kontrol:** IncomingQuantity > 0 ise yeşil badge ve "Mal kabul bekliyor" mesajı var mı?

---

## ✅ 5. STOK YÖNETİMİ TESTLERİ

### 5.1. Satış Faturası → Sevkiyat → Stok Düşümü
- [ ] **Tam akış testi**
  1. Satış faturası oluştur (ürünler ekle)
  2. **Kontrol:** Ürünlerin `reservedQuantity` arttı mı?
  3. Sevkiyatlar sayfasına git
  4. Oluşturulan sevkiyatı bul
  5. Durumu "Onaylı" (APPROVED) yap
  6. **Kontrol:** Ürünlerin `stock` düştü mü?
  7. **Kontrol:** Ürünlerin `reservedQuantity` azaldı mı?
  8. **Kontrol:** Stok hareketleri tablosunda "Çıkış" kaydı oluştu mu?

### 5.2. Alış Faturası → Mal Kabul → Stok Girişi
- [ ] **Tam akış testi**
  1. Alış faturası oluştur (ürünler ekle)
  2. **Kontrol:** Ürünlerin `incomingQuantity` arttı mı?
  3. Mal Kabul sayfasına git
  4. Oluşturulan mal kabulü bul
  5. "Onayla" butonuna tıkla
  6. **Kontrol:** Ürünlerin `stock` arttı mı?
  7. **Kontrol:** Ürünlerin `incomingQuantity` azaldı mı?
  8. **Kontrol:** Stok hareketleri tablosunda "Giriş" kaydı oluştu mu?

---

## ✅ 6. HATA KONTROLLERİ

### 6.1. API Hataları
- [ ] **Sevkiyat detay modalı açılıyor mu?**
  - Bir sevkiyat satırında göz ikonuna tıkla
  - Hata mesajı gösteriliyor mu? (Eğer API hatası varsa)

- [ ] **Mal kabul detay modalı açılıyor mu?**
  - Bir mal kabul satırında göz ikonuna tıkla
  - Hata mesajı gösteriliyor mu? (Eğer API hatası varsa)

### 6.2. UI Hataları
- [ ] **Boş durumlar**
  - Hiç sevkiyat yoksa "Sevkiyat bulunamadı" mesajı görünüyor mu?
  - Hiç mal kabul yoksa "Mal kabul kaydı bulunamadı" mesajı görünüyor mu?

---

## 🎯 ÖNCELİKLİ TESTLER (Önce Bunları Yap!)

1. ✅ **Sevkiyatlar sayfası açılıyor mu?**
2. ✅ **Mal Kabul sayfası açılıyor mu?** (Sidebar'dan)
3. ✅ **Alış faturası oluştur → Mal kabul otomatik oluşuyor mu?**
4. ✅ **Mal kabulü onayla → Stok artıyor mu?**
5. ✅ **Satış faturası oluştur → Sevkiyat otomatik oluşuyor mu?**
6. ✅ **Sevkiyatı onayla → Stok düşüyor mu?**

---

## 📝 Test Sonuçları

Test ederken karşılaştığın hataları buraya not al:

- [ ] Hata 1: ...
- [ ] Hata 2: ...
- [ ] Hata 3: ...

---

## 💡 İpuçları

- **Console'u açık tut:** Tarayıcı console'unda hata mesajlarını kontrol et
- **Network tab'ı kontrol et:** API isteklerinin başarılı olup olmadığını kontrol et
- **Veritabanını kontrol et:** Supabase Dashboard'dan tabloları kontrol et

