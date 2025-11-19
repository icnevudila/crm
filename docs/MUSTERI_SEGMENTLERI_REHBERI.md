# 📊 MÜŞTERİ SEGMENTLERİ REHBERİ

**CRM Enterprise V3 - Segment Sistemi Kullanım Kılavuzu**  
**Tarih:** 2024  
**Versiyon:** 1.0.0

---

## 🎯 SEGMENT SİSTEMİ NEDİR?

**Müşteri Segmentleri**, müşterilerinizi kriterlere göre **otomatik gruplandırmanızı** sağlar. Bu sayede:
- ✅ Müşterilerinizi kategorilere ayırabilirsiniz (VIP, Risk, Standart vb.)
- ✅ Segment bazlı **kampanya** ve **fiyatlandırma** yapabilirsiniz
- ✅ Müşterilerinizi **kolayca filtreleyip** bulabilirsiniz
- ✅ **Otomatik segment ataması** ile müşteriler kriterlere göre segmentlere eklenir

---

## 📋 NASIL ÇALIŞIR?

### 1. Segment Oluşturma

**Adımlar:**
1. "Müşteri Segmentleri" sayfasına gidin
2. "+ Yeni Segment" butonuna tıklayın
3. Segment bilgilerini girin:
   - **Segment Adı**: "VIP Müşteriler", "Risk Grubu" vb.
   - **Açıklama**: Segment'in amacını açıklayın
   - **Renk**: Segment'i görsel olarak ayırt etmek için renk seçin
   - **Otomatik Atama**: Açık ise, kriterlere uyan müşteriler otomatik eklenir

### 2. Segment Kriterleri

**Örnek Kriterler:**
- `totalRevenue >= 100000` → Toplam geliri 100K+ olan müşteriler → "VIP Müşteriler"
- `totalRevenue < 10000` → Toplam geliri 10K altı müşteriler → "Risk Grubu"
- `lastOrderDate < '2024-01-01'` → Son siparişi 1 yıl önce olan müşteriler → "İnaktif Müşteriler"

**Not**: Segment kriterleri şu anda **otomatik atama** için kullanılır. Manuel segment ekleme özelliği gelecekte eklenecek.

### 3. Segment Kullanım Alanları

#### ✅ Müşteri Filtreleme
- Segment bazlı müşteri listesi görüntüleme
- Belirli segmentteki müşterileri kolayca bulma

#### ✅ Kampanya Hedefleme
- Segment bazlı e-posta kampanyaları (gelecekte)
- Segment bazlı özel teklifler (gelecekte)

#### ✅ Fiyatlandırma
- Segment bazlı özel fiyat listeleri (gelecekte)
- Segment bazlı indirimler (gelecekte)

#### ✅ Raporlama
- Segment bazlı gelir analizi
- Segment bazlı müşteri dağılımı grafikleri

---

## 🚀 ÖRNEK KULLANIM SENARYOLARI

### Senaryo 1: VIP Müşteriler Segmenti

**Amaç**: Yüksek gelir getiren müşterileri ayırt etmek

**Segment Ayarları:**
- **Ad**: "VIP Müşteriler"
- **Açıklama**: "Toplam geliri 100K+ olan müşteriler"
- **Renk**: Altın (Gold)
- **Otomatik Atama**: ✅ Açık
- **Kriter**: `totalRevenue >= 100000`

**Sonuç:**
- Toplam geliri 100K+ olan müşteriler otomatik olarak "VIP Müşteriler" segmentine eklenir
- Bu müşterilere özel teklifler ve kampanyalar hazırlayabilirsiniz

---

### Senaryo 2: Risk Grubu Segmenti

**Amaç**: Kayıp riski taşıyan müşterileri tespit etmek

**Segment Ayarları:**
- **Ad**: "Risk Grubu"
- **Açıklama**: "Son 60 günde sipariş vermeyen müşteriler"
- **Renk**: Kırmızı (Red)
- **Otomatik Atama**: ✅ Açık
- **Kriter**: `lastOrderDate < '2024-01-01'` (60 gün öncesi)

**Sonuç:**
- Son 60 günde sipariş vermeyen müşteriler otomatik olarak "Risk Grubu" segmentine eklenir
- Bu müşterilere özel takip ve yeniden etkileşim kampanyaları hazırlayabilirsiniz

---

### Senaryo 3: Standart Müşteriler Segmenti

**Amaç**: Normal seviyedeki müşterileri gruplamak

**Segment Ayarları:**
- **Ad**: "Standart Müşteriler"
- **Açıklama**: "Normal seviyedeki müşteriler"
- **Renk**: Mavi (Blue)
- **Otomatik Atama**: ❌ Kapalı (Manuel ekleme)

**Sonuç:**
- Bu segmenti manuel olarak müşteri ekleyerek kullanabilirsiniz
- Segment bazlı filtreleme ve raporlama yapabilirsiniz

---

## 💡 İPUÇLARI

### ✅ En İyi Uygulamalar

1. **Segment İsimleri Açıklayıcı Olsun**
   - ❌ "Segment 1"
   - ✅ "VIP Müşteriler - 100K+ Gelir"

2. **Renk Kodlaması Tutarlı Olsun**
   - VIP → Altın (Gold)
   - Risk → Kırmızı (Red)
   - Standart → Mavi (Blue)

3. **Otomatik Atama Kriterleri Net Olsun**
   - Kriterleri net ve ölçülebilir tutun
   - Test edin ve gerekirse güncelleyin

### ⚠️ Dikkat Edilmesi Gerekenler

1. **Çok Fazla Segment Oluşturmayın**
   - 5-10 segment genellikle yeterlidir
   - Fazla segment yönetimi zorlaştırır

2. **Segment Kriterlerini Düzenli Kontrol Edin**
   - Kriterlerin doğru çalıştığından emin olun
   - Gerektiğinde kriterleri güncelleyin

3. **Otomatik Atama İşaretlemesini Dikkatli Kullanın**
   - Her segment için otomatik atama gerekli değildir
   - Manuel segmentler de kullanışlı olabilir

---

## 🔄 GELECEKTE EKLENECEKLER

- [ ] **Manuel Segment Ataması**: Müşterileri manuel olarak segmentlere ekleme
- [ ] **Segment Bazlı Kampanyalar**: Segment bazlı e-posta kampanyaları
- [ ] **Segment Bazlı Fiyatlandırma**: Segment bazlı özel fiyat listeleri
- [ ] **Segment Bazlı Raporlar**: Segment bazlı detaylı raporlar
- [ ] **Segment Analitiği**: Segment performans analizi

---

## ❓ SIKÇA SORULAN SORULAR

### S: Segment oluşturdum ama müşteriler otomatik eklenmedi?

**C**: Segment'in "Otomatik Atama" özelliğinin açık olduğundan ve kriterlerin doğru olduğundan emin olun. Müşteri bilgilerinin (totalRevenue, lastOrderDate vb.) güncel olduğunu kontrol edin.

### S: Bir müşteri birden fazla segmentte olabilir mi?

**C**: Evet, bir müşteri birden fazla segmentte olabilir. Örneğin bir müşteri hem "VIP Müşteriler" hem de "İnaktif Müşteriler" segmentinde olabilir.

### S: Segment kriterlerini nasıl değiştirebilirim?

**C**: Şu anda segment kriterleri veritabanında JSON olarak saklanıyor. Gelecekte UI'dan kriterleri düzenleyebileceksiniz.

### S: Segmentleri nasıl silebilirim?

**C**: Segment listesinde segment yanındaki "Sil" butonuna tıklayarak segmenti silebilirsiniz. Segment silindiğinde, segment üyeleri otomatik olarak kaldırılır.

---

**Son Güncelleme:** 2024  
**İletişim**: Destek ekibiyle iletişime geçin









