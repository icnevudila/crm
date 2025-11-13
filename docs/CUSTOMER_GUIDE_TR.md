# 📘 CRM Enterprise V3 - Müşteri Kılavuzu

## Hoş Geldiniz!

CRM Enterprise V3'e hoş geldiniz! Bu kılavuz, sistemin temel özelliklerini ve kullanımını anlamanıza yardımcı olmak için hazırlanmıştır.

---

## 📋 İçindekiler

1. [İlk Giriş ve Hesap Oluşturma](#ilk-giriş)
2. [Dashboard Kullanımı](#dashboard)
3. [Müşteri Yönetimi](#müşteri-yönetimi)
4. [Satış Süreci](#satış-süreci)
5. [Fatura ve Finans](#fatura-finans)
6. [Görevler ve Takvim](#görevler-takvim)
7. [Raporlar](#raporlar)
8. [Ayarlar ve Yetkilendirme](#ayarlar)
9. [Sık Sorulan Sorular](#sss)

---

## 🚀 İlk Giriş ve Hesap Oluşturma {#ilk-giriş}

### Giriş Yapma

1. Sistem yöneticinizden aldığınız e-posta adresi ve şifre ile giriş yapın.
2. İlk girişte şifrenizi değiştirmeniz önerilir.
3. Dil seçiminizi (Türkçe/İngilizce) yapabilirsiniz.

### İlk Kurulum

- **Şirket Bilgileri**: Admin panelinden şirket bilgilerinizi güncelleyin.
- **Kullanıcı Ekleme**: Admin veya SuperAdmin yetkisiyle yeni kullanıcılar ekleyebilirsiniz.
- **Modül Yetkileri**: Her kullanıcı için modül bazlı yetkilendirme yapabilirsiniz.

---

## 📊 Dashboard Kullanımı {#dashboard}

Dashboard, işinizin genel durumunu tek bakışta görmenizi sağlar.

### Ana Metrikler

- **Aktif Fırsatlar**: Pipeline'daki toplam fırsat sayısı
- **Sıcak Fırsatlar**: Öncelikli fırsatlarınız
- **Bugünkü Ajanda**: Planlanan görüşmeler ve görevler
- **Gelir Metrikleri**: Aylık/haftalık gelir özeti

### Pipeline Görünümü

- Fırsatlarınızı aşamalara göre görüntüleyin
- Her aşamadaki fırsat sayısını ve detaylarını inceleyin
- Tıklayarak detaylı bilgilere ulaşın

### Grafikler

- **Satış Trendi**: Zaman içindeki satış performansı
- **Durum Dağılımı**: Fırsat ve tekliflerin durum analizi
- **Müşteri Segmentasyonu**: Müşteri dağılımı ve analizi

---

## 👥 Müşteri Yönetimi {#müşteri-yönetimi}

### Müşteri Firmalar

1. **Yeni Müşteri Ekleme**:
   - Sol menüden "Müşteri Firmalar" → "Yeni Ekle"
   - Firma bilgilerini doldurun (isim, sektör, adres, vb.)
   - Kaydedin

2. **Müşteri Listesi**:
   - Tüm müşterilerinizi görüntüleyin
   - Arama ve filtreleme yapın
   - Durum bazlı filtreleme (Aktif/Pasif)

3. **Müşteri Detayları**:
   - Müşteri kartına tıklayarak detay sayfasına gidin
   - İlgili fırsatlar, teklifler, faturalar görüntülenir
   - İletişim geçmişi ve notlar ekleyebilirsiniz

### Bireysel Müşteriler

- Bireysel müşteriler için ayrı bir modül mevcuttur
- Firma müşterilerinden bağımsız yönetilir

### Firma Yetkilileri (Contacts)

- Her müşteri firmasına yetkili kişiler ekleyebilirsiniz
- İletişim bilgileri ve görevleri takip edin

---

## 💼 Satış Süreci {#satış-süreci}

### Fırsatlar (Deals)

1. **Yeni Fırsat Oluşturma**:
   - "Fırsatlar" → "Yeni Ekle"
   - Müşteri, tutar, aşama bilgilerini girin
   - Atanan kişiyi seçin

2. **Pipeline Yönetimi**:
   - Kanban görünümünde fırsatları sürükleyip bırakın
   - Aşama değişikliklerini takip edin
   - Otomatik bildirimler alın

3. **Fırsat Detayları**:
   - İlgili teklifler ve faturalar görüntülenir
   - Aktivite geçmişi ve notlar eklenebilir

### Teklifler (Quotes)

1. **Teklif Oluşturma**:
   - Fırsattan teklif oluşturun veya doğrudan ekleyin
   - Ürün/hizmet ekleyin, fiyatlandırın
   - PDF olarak indirin veya e-posta ile gönderin

2. **Teklif Durumları**:
   - **DRAFT**: Taslak
   - **SENT**: Gönderildi
   - **ACCEPTED**: Kabul edildi (otomatik fatura oluşturulur)
   - **REJECTED**: Reddedildi

3. **Teklif Gönderme**:
   - "Gönder" butonuna tıklayın
   - Müşteriye otomatik bildirim gönderilir
   - Durum "SENT" olarak güncellenir

### Sözleşmeler (Contracts)

- Kabul edilen tekliflerden sözleşme oluşturun
- Sözleşme detaylarını yönetin
- PDF olarak indirin

---

## 💰 Fatura ve Finans {#fatura-finans}

### Faturalar

1. **Fatura Oluşturma**:
   - Kabul edilen tekliften otomatik oluşturulur
   - Veya manuel olarak "Faturalar" → "Yeni Ekle"
   - Ürün/hizmet ekleyin, KDV hesaplaması otomatiktir

2. **Fatura Durumları**:
   - **DRAFT**: Taslak
   - **SENT**: Gönderildi
   - **PAID**: Ödendi (otomatik finans kaydı oluşturulur)
   - **OVERDUE**: Vadesi geçmiş

3. **PDF İndirme**:
   - Fatura detay sayfasından PDF indirin
   - Müşteriye e-posta ile gönderebilirsiniz

### Finans Modülü

- Gelir ve gider kayıtlarını yönetin
- Kategori bazlı analiz yapın
- Finansal raporlar görüntüleyin

---

## ✅ Görevler ve Takvim {#görevler-takvim}

### Görevler

1. **Görev Oluşturma**:
   - "Görevler" → "Yeni Ekle"
   - Başlık, açıklama, atanan kişi, son tarih belirleyin
   - Öncelik seviyesi seçin

2. **Görev Durumları**:
   - **TODO**: Yapılacak
   - **IN_PROGRESS**: Devam ediyor
   - **DONE**: Tamamlandı

3. **Görev Atama**:
   - Görevleri ekip üyelerine atayın
   - Otomatik bildirimler gönderilir

### Görüşmeler (Meetings)

- Müşterilerle planlanan görüşmeleri kaydedin
- Takvim görünümünde görüntüleyin
- Hatırlatıcılar ayarlayın

---

## 📈 Raporlar {#raporlar}

### Rapor Türleri

1. **Satış Raporları**:
   - Fırsat bazlı analiz
   - Aşama bazlı performans
   - Zaman bazlı trendler

2. **Müşteri Raporları**:
   - Müşteri segmentasyonu
   - Sektör bazlı analiz
   - Şehir bazlı dağılım

3. **Finansal Raporlar**:
   - Gelir/gider analizi
   - Kategori bazlı raporlar
   - Zaman bazlı finansal trendler

4. **Ürün Raporları**:
   - En çok satan ürünler
   - Ürün bazlı gelir analizi

### Rapor Filtreleme

- Tarih aralığı seçin
- Kullanıcı bazlı filtreleme
- Şirket/modül bazlı filtreleme

### Rapor Dışa Aktarma

- Excel formatında indirin
- PDF olarak kaydedin
- CSV formatında dışa aktarın

---

## ⚙️ Ayarlar ve Yetkilendirme {#ayarlar}

### Kullanıcı Yönetimi

**Admin Yetkisi**:
- Kendi şirketinizdeki kullanıcıları görüntüleyin
- Kullanıcı yetkilerini düzenleyin
- Modül bazlı izinler verin

**SuperAdmin Yetkisi**:
- Tüm şirketleri görüntüleyin
- Yeni kullanıcılar oluşturun
- Şirket bazlı yönetim yapın

### Modül Yetkileri

Her modül için şu yetkiler tanımlanabilir:
- **READ**: Görüntüleme
- **CREATE**: Oluşturma
- **UPDATE**: Güncelleme
- **DELETE**: Silme

### Şirket Ayarları

- Şirket bilgilerini güncelleyin
- Logo yükleyin
- İletişim bilgilerini düzenleyin

---

## ❓ Sık Sorulan Sorular {#sss}

### Genel Sorular

**S: Şifremi unuttum, ne yapmalıyım?**
C: Sistem yöneticinizle iletişime geçin. Şifre sıfırlama işlemi yönetici tarafından yapılır.

**S: Birden fazla şirketi yönetebilir miyim?**
C: SuperAdmin yetkisiyle tüm şirketleri görüntüleyebilirsiniz. Normal kullanıcılar sadece kendi şirketlerini görür.

**S: Verilerim güvende mi?**
C: Evet. Sistem Row-Level Security (RLS) ile çoklu şirket verilerini birbirinden izole eder. Her kullanıcı sadece kendi şirketinin verilerini görür.

### Teknik Sorular

**S: Mobil cihazlardan kullanabilir miyim?**
C: Evet, sistem responsive tasarıma sahiptir. Mobil tarayıcılardan rahatlıkla kullanabilirsiniz.

**S: Offline çalışır mı?**
C: Hayır, sistem internet bağlantısı gerektirir. Veriler Supabase bulut veritabanında saklanır.

**S: Verilerimi dışa aktarabilir miyim?**
C: Evet, raporlar modülünden Excel, PDF veya CSV formatında dışa aktarabilirsiniz.

### İş Akışı Soruları

**S: Teklif kabul edildiğinde ne olur?**
C: Teklif "ACCEPTED" durumuna geçtiğinde otomatik olarak fatura oluşturulur ve stok düşülür (ürün ise).

**S: Fatura ödendiğinde ne olur?**
C: Fatura "PAID" durumuna geçtiğinde otomatik olarak finans modülüne gelir kaydı eklenir.

**S: Görev atandığında bildirim gelir mi?**
C: Evet, görev atanan kullanıcıya otomatik bildirim gönderilir.

---

## 📞 Destek

### Yardım ve Destek

- **E-posta**: support@yourdomain.com
- **Yardım Merkezi**: Sistem içinden "Yardım" menüsüne erişebilirsiniz
- **Kullanım Kılavuzu**: Sistem içinden "Kullanım Kılavuzu" bölümünü inceleyebilirsiniz

### Hata Bildirimi

Bir hata ile karşılaştığınızda:
1. Hata mesajını not edin
2. Ekran görüntüsü alın
3. Destek ekibine bildirin

---

## 🔄 Güncellemeler

Sistem düzenli olarak güncellenmektedir. Yeni özellikler ve iyileştirmeler için:
- Dashboard'da bildirimleri kontrol edin
- Yardım merkezindeki güncelleme notlarını okuyun

---

**Son Güncelleme**: 2024

**Versiyon**: 1.0.0


