# 📊 TEST VERİSİ EKLEME TALİMATI

## 🎯 Amaç
Yeni eklenen 5 modülü gerçekçi verilerle doldurmak ve test etmek.

---

## 🚀 HIZLI KURULUM (2 Adım)

### 1️⃣ Supabase Studio'ya Git
https://supabase.com/dashboard → Projen → **SQL Editor**

### 2️⃣ Bu Dosyayı Çalıştır

📁 `supabase/seed_advanced_modules.sql` dosyasının **tamamını** kopyala → SQL Editor'a yapıştır → **RUN**

---

## ✅ Ne Eklenecek?

### 📊 Müşteri Segmentleri (5 adet)
- ✅ **VIP Müşteriler** (Altın renkli, otomatik)
- ✅ **Yeni Müşteriler** (Yeşil, otomatik)
- ✅ **Riskli Müşteriler** (Kırmızı, otomatik)
- ✅ **Orta Segment** (Mavi, manuel)
- ✅ **Potansiyel Büyüme** (Mor, manuel)

### 🏆 Rakip Analizi (5 adet)
- ✅ **TechCorp Solutions** (25.5% pazar payı)
- ✅ **Global Dynamics** (18.3% pazar payı)
- ✅ **LocalPro Ltd** (12.7% pazar payı)
- ✅ **Innovation Inc** (8.2% pazar payı)
- ✅ **Enterprise Systems** (15.9% pazar payı)

Her rakip için:
- Website bilgisi
- Güçlü/zayıf yönler
- Pazar payı
- Fiyatlandırma stratejisi

### 📁 Dökümanlar (5 adet)
- ✅ **Şirket Sunumu 2024** (PDF, 2.4MB)
- ✅ **Fiyat Listesi** (Excel, 512KB)
- ✅ **Sözleşme Şablonu** (Word, 100KB)
- ✅ **Ürün Kataloğu** (PDF, 5MB)
- ✅ **Teklif Eki** (Quote'a bağlı, PDF)

### ✅ Onay Talepleri (4 adet)
- ✅ **Yüksek Değerli Teklif Onayı** (Beklemede, Yüksek öncelik)
- ✅ **Özel İndirim Onayı** (Onaylandı)
- ✅ **Ödeme Planı Onayı** (Reddedildi)
- ✅ **Bütçe Artırımı** (Beklemede, Acil)

### 📧 Email Kampanyaları (5 adet)
- ✅ **Yaz Kampanyası 2024** (Gönderildi)
  - 1,250 alıcı
  - 456 açılma (%36.5)
  - 89 tıklama (%7.1)
  
- ✅ **Ürün Lansmanı** (Gönderildi)
  - 3,420 alıcı
  - 1,205 açılma (%35.2)
  - 234 tıklama (%6.8)
  
- ✅ **Müşteri Memnuniyeti Anketi** (Zamanlandı)
  - 3 gün sonra gönderilecek
  
- ✅ **Black Friday Özel** (Taslak)
  - Hazırlanıyor
  
- ✅ **Yıl Sonu Teşekkür** (Başarısız)
  - Gönderim hatası

### 📨 Email Log Kayıtları (40 adet)
- Gerçekçi open/click oranları
- Farklı durumlar (sent, opened, clicked)

---

## 📈 SONUÇ: BOŞ SAYFALAR DOLACAK!

### Önce (Şimdi):
```
Müşteri Segmentleri: 0 adet
Rakip Analizi: 0 adet
Dökümanlar: 0 adet
Onaylar: 0 adet
Email Kampanyaları: 0 adet
```

### Sonra (Seed sonrası):
```
✅ Müşteri Segmentleri: 5 adet (renkli badge'ler ile!)
✅ Rakip Analizi: 5 adet (pazar payı grafikleri ile!)
✅ Dökümanlar: 5 adet (dosya tipleri icon'ları ile!)
✅ Onaylar: 4 adet (durum badge'leri ile!)
✅ Email Kampanyaları: 5 adet (açılma/tıklama oranları ile!)
```

---

## 🎨 Görsel Sonuçlar

### Email Kampanyaları Dashboard:
```
📧 Toplam Kampanya: 5
📨 Toplam Gönderim: 4,670
👁️  Toplam Açılma: 1,661 (35.6%)
🖱️  Toplam Tıklama: 323 (6.9%)
```

### Rakip Analizi:
- Pazar payı grafikleri dolu
- Güçlü/zayıf yönler görünür
- Website linkleri aktif

### Müşteri Segmentleri:
- Renkli badge'ler
- Otomatik/Manuel durumları
- Üye sayıları

---

## ⚠️ ÖNEMLİ NOT

Bu script:
- ✅ Mevcut company ve user'ınızı kullanır
- ✅ Otomatik olarak ID'leri bulur
- ✅ Hiçbir mevcut veriyi silmez
- ✅ Sadece yeni kayıtlar ekler
- ✅ Birden fazla çalıştırılabilir (duplicate olmaz)

---

## 🧪 Test Adımları (Seed Sonrası)

1. **Müşteri Segmentleri** → http://localhost:3000/tr/segments
   - 5 segment görmeli
   - Renkli badge'ler olmalı
   - Üye sayıları görünmeli

2. **Rakip Analizi** → http://localhost:3000/tr/competitors
   - 5 rakip görmeli
   - Pazar payı grafikleri dolu olmalı
   - Güçlü/zayıf yönler görünmeli

3. **Dökümanlar** → http://localhost:3000/tr/documents
   - 5 döküman görmeli
   - Dosya icon'ları doğru olmalı
   - Klasör ve ilişki badge'leri görünmeli

4. **Onaylar** → http://localhost:3000/tr/approvals
   - 4 onay talebi görmeli
   - Farklı durumlar (beklemede, onaylandı, reddedildi)
   - Onay/Red butonları çalışmalı

5. **Email Kampanyaları** → http://localhost:3000/tr/email-campaigns
   - 5 kampanya görmeli
   - İstatistikler dolu olmalı
   - Açılma/tıklama oranları hesaplanmış olmalı

---

## 🎉 BAŞARI!

Seed çalışırsa şu mesajı göreceksin:

```
✅ TEST VERİLERİ BAŞARIYLA EKLENDİ!
========================================
📊 Oluşturulan:
  - 5 Müşteri Segmenti
  - 5 Rakip Kaydı
  - 5 Döküman
  - 4 Onay Talebi
  - 5 Email Kampanyası
  - 40 Email Log Kaydı
========================================
🚀 Şimdi sayfaları test edebilirsiniz!
```

---

## 🔧 Sorun Giderme

### Hata: "Company veya User bulunamadı"
**Çözüm:** Önce login olun, sonra tekrar deneyin.

### Hata: "Foreign key violation"
**Çözüm:** Önce `039_fix_missing_columns.sql` migration'ını çalıştırın.

### Hata: "Duplicate key"
**Çözüm:** Normal, zaten veri var demek. Seed başarılı!

---

## 📞 Yardım

Herhangi bir sorun olursa:
1. Console'daki hata mesajını kopyala
2. Hangi satırda hata verdiğini belirt
3. Ben düzeltirim! 🚀


