# 🧪 Kullanıcı Atama ve Bildirim Sistemi - Test Senaryoları

## 📋 Test Öncesi Hazırlık

### 1. Gerekli Veriler
- ✅ En az 5 kullanıcı hesabı olmalı (farklı kullanıcılar için test)
- ✅ En az 1 müşteri kaydı olmalı
- ✅ En az 1 fırsat (Deal) kaydı olmalı

### 2. Test Ortamı
- ✅ Tarayıcıda 2 farklı kullanıcı ile giriş yapın (farklı tarayıcılar veya gizli pencereler)
- ✅ Bir kullanıcı ile işlem yapın, diğer kullanıcı ile bildirimleri kontrol edin

---

## 🎯 TEST 1: Görüşme (Meeting) Modülü - Çoklu Kullanıcı Atama

### Senaryo: 5 Kullanıcıya Görüşme Daveti Gönderme

#### Adım 1: Görüşme Oluşturma
1. Sol menüden **"Görüşmeler"** sekmesine tıklayın
2. Sağ üstteki **"Yeni Görüşme"** butonuna tıklayın
3. Görüşme formunu doldurun:
   - **Başlık**: "Müşteri Toplantısı - Test"
   - **Tarih & Saat**: Bugünden sonraki bir tarih seçin
   - **Süre**: 60 dakika
   - **Konum**: "Ofis - Toplantı Odası"
   - **Müşteri**: Bir müşteri seçin (opsiyonel)
   - **Fırsat**: Bir fırsat seçin (opsiyonel)

#### Adım 2: Katılımcı Seçimi (5 Kullanıcı)
1. **"Katılımcılar"** bölümüne scroll edin
2. Checkbox listesinden **5 farklı kullanıcı** seçin:
   - ✅ Kullanıcı 1
   - ✅ Kullanıcı 2
   - ✅ Kullanıcı 3
   - ✅ Kullanıcı 4
   - ✅ Kullanıcı 5
3. Seçilen kullanıcı sayısının gösterildiğini kontrol edin: **"5 kullanıcı seçildi"**

#### Adım 3: Görüşmeyi Kaydetme
1. **"Kaydet"** butonuna tıklayın
2. Görüşmenin başarıyla oluşturulduğunu kontrol edin
3. Görüşme listesinde yeni görüşmenin göründüğünü kontrol edin

#### Adım 4: Bildirim Kontrolü (5 Kullanıcı)
1. **Her 5 kullanıcı hesabına** ayrı ayrı giriş yapın
2. Her kullanıcının **sağ üstteki bildirim ikonuna** bakın:
   - ✅ **Bell ikonu yanıp sönüyor mu?** (Yeni bildirim geldiğinde)
   - ✅ **Kırmızı badge'de "1" görünüyor mu?**
3. Bell ikonuna tıklayın
4. Dropdown'da bildirimi kontrol edin:
   - ✅ **Başlık**: "Yeni Görüşme Daveti"
   - ✅ **Mesaj**: "[Görüşme Başlığı] görüşmesine davet edildiniz. Detayları görmek ister misiniz?"
   - ✅ **Tip**: "info" (mavi badge)
   - ✅ **Zaman**: "Az önce" veya "X dakika önce"
5. **Bildirime tıklayın**
6. Görüşme detay sayfasına yönlendirildiğinizi kontrol edin
7. **Yanıp sönmenin durduğunu** kontrol edin (bell ikonu artık yanıp sönmemeli)

#### Adım 5: Görüşme Düzenleme - Katılımcı Değiştirme
1. Görüşme listesinde oluşturduğunuz görüşmeyi bulun
2. **"Düzenle"** butonuna tıklayın
3. **"Katılımcılar"** bölümünde:
   - 2 kullanıcının checkbox'ını kaldırın
   - 3 yeni kullanıcı ekleyin
4. **"Güncelle"** butonuna tıklayın
5. **Yeni eklenen 3 kullanıcıya** bildirim gittiğini kontrol edin
6. **Çıkarılan 2 kullanıcıya** bildirim gitmediğini kontrol edin

---

## 🎯 TEST 2: Bildirim Sistemi - Yanıp Sönme Animasyonu

### Senaryo: Yeni Bildirim Geldiğinde Yanıp Sönme

#### Adım 1: Bildirim Bekleme
1. Bir kullanıcı hesabına giriş yapın
2. Sağ üstteki **bell ikonunu** gözlemleyin
3. İkonun **normal durumda** olduğunu kontrol edin (yanıp sönmüyor)

#### Adım 2: Yeni Bildirim Oluşturma
1. **Başka bir kullanıcı hesabından** (veya admin hesabından):
   - Yeni bir görüşme oluşturun
   - Veya bir teklif oluşturun
   - Veya bir görev oluşturun
   - Ve bu kaydı **test kullanıcısına atayın**

#### Adım 3: Yanıp Sönme Kontrolü
1. **Test kullanıcısının** tarayıcısına dönün
2. **Bell ikonunu** gözlemleyin:
   - ✅ **İkon yanıp sönüyor mu?** (Scale ve opacity animasyonu)
   - ✅ **Animasyon sürekli tekrar ediyor mu?** (Infinity repeat)
   - ✅ **Kırmızı badge görünüyor mu?**

#### Adım 4: Dropdown Açma - Yanıp Sönme Durması
1. **Bell ikonuna tıklayın** (dropdown açılır)
2. **Yanıp sönmenin durduğunu** kontrol edin
3. Dropdown'da bildirimleri görüntüleyin
4. Dropdown'u kapatın (dışarı tıklayın)
5. **Yanıp sönmenin tekrar başlamadığını** kontrol edin (çünkü bildirim görüldü)

#### Adım 5: Bildirime Tıklama - Yanıp Sönme Durması
1. Yeni bir bildirim oluşturun (başka kullanıcıdan)
2. Test kullanıcısının bell ikonunun **yanıp söndüğünü** kontrol edin
3. Bell ikonuna tıklayın
4. **Bildirime tıklayın** (link'e tıklayın)
5. İlgili sayfaya yönlendirildiğinizi kontrol edin
6. Geri dönün ve bell ikonunu kontrol edin:
   - ✅ **Yanıp sönme durdu mu?**
   - ✅ **Badge sayısı azaldı mı?**

---

## 🎯 TEST 3: Diğer Modüller - Tek Kullanıcı Atama

### Senaryo 3.1: Teklif (Quote) Modülü

#### Adım 1: Teklif Oluşturma ve Atama
1. Sol menüden **"Teklifler"** sekmesine tıklayın
2. **"Yeni Teklif"** butonuna tıklayın
3. Teklif formunu doldurun:
   - **Başlık**: "Test Teklifi"
   - **Müşteri**: Bir müşteri seçin
   - **Fırsat**: Bir fırsat seçin
   - **Ürünler**: En az 1 ürün ekleyin
4. **"Atanan Kişi"** dropdown'ından bir kullanıcı seçin
5. **"Kaydet"** butonuna tıklayın

#### Adım 2: Bildirim Kontrolü
1. **Atanan kullanıcı hesabına** giriş yapın
2. Bell ikonunun **yanıp söndüğünü** kontrol edin
3. Bell ikonuna tıklayın
4. Bildirimi kontrol edin:
   - ✅ **Başlık**: "Yeni Teklif Atandı"
   - ✅ **Mesaj**: "[Teklif Başlığı] teklifi size atandı. Detayları görmek ister misiniz?"
5. Bildirime tıklayın
6. Teklif detay sayfasına yönlendirildiğinizi kontrol edin

### Senaryo 3.2: Fatura (Invoice) Modülü

#### Adım 1: Fatura Oluşturma ve Atama
1. Sol menüden **"Faturalar"** sekmesine tıklayın
2. **"Yeni Fatura"** butonuna tıklayın
3. Fatura formunu doldurun
4. **"Atanan Kişi"** dropdown'ından bir kullanıcı seçin
5. **"Kaydet"** butonuna tıklayın

#### Adım 2: Bildirim Kontrolü
1. **Atanan kullanıcı hesabına** giriş yapın
2. Bell ikonunun **yanıp söndüğünü** kontrol edin
3. Bildirimi kontrol edin:
   - ✅ **Başlık**: "Yeni Fatura Atandı"
   - ✅ **Mesaj**: "[Fatura Başlığı] faturası size atandı. Detayları görmek ister misiniz?"
4. Bildirime tıklayın
5. Fatura detay sayfasına yönlendirildiğinizi kontrol edin

### Senaryo 3.3: Fırsat (Deal) Modülü

#### Adım 1: Fırsat Oluşturma ve Atama
1. Sol menüden **"Fırsatlar"** sekmesine tıklayın
2. **"Yeni Fırsat"** butonuna tıklayın
3. Fırsat formunu doldurun
4. **"Atanan Kişi"** dropdown'ından bir kullanıcı seçin
5. **"Kaydet"** butonuna tıklayın

#### Adım 2: Bildirim Kontrolü
1. **Atanan kullanıcı hesabına** giriş yapın
2. Bell ikonunun **yanıp söndüğünü** kontrol edin
3. Bildirimi kontrol edin:
   - ✅ **Başlık**: "Yeni Fırsat Atandı"
   - ✅ **Mesaj**: "[Fırsat Başlığı] fırsatı size atandı. Detayları görmek ister misiniz?"
4. Bildirime tıklayın
5. Fırsat detay sayfasına yönlendirildiğinizi kontrol edin

### Senaryo 3.4: Destek Talebi (Ticket) Modülü

#### Adım 1: Destek Talebi Oluşturma ve Atama
1. Sol menüden **"Destek"** sekmesine tıklayın
2. **"Yeni Destek Talebi"** butonuna tıklayın
3. Destek talebi formunu doldurun:
   - **Konu**: "Test Destek Talebi"
   - **Müşteri**: Bir müşteri seçin
4. **"Atanan Kişi"** dropdown'ından bir kullanıcı seçin
5. **"Kaydet"** butonuna tıklayın

#### Adım 2: Bildirim Kontrolü
1. **Atanan kullanıcı hesabına** giriş yapın
2. Bell ikonunun **yanıp söndüğünü** kontrol edin
3. Bildirimi kontrol edin:
   - ✅ **Başlık**: "Yeni Destek Talebi Atandı"
   - ✅ **Mesaj**: "[Destek Talebi Konusu] destek talebi size atandı. Detayları görmek ister misiniz?"
4. Bildirime tıklayın
5. Destek talebi detay sayfasına yönlendirildiğinizi kontrol edin

### Senaryo 3.5: Sevkiyat (Shipment) Modülü

#### Adım 1: Sevkiyat Oluşturma ve Atama
1. Sol menüden **"Sevkiyatlar"** sekmesine tıklayın
2. **"Yeni Sevkiyat"** butonuna tıklayın
3. Sevkiyat formunu doldurun
4. **"Atanan Kişi"** dropdown'ından bir kullanıcı seçin
5. **"Kaydet"** butonuna tıklayın

#### Adım 2: Bildirim Kontrolü
1. **Atanan kullanıcı hesabına** giriş yapın
2. Bell ikonunun **yanıp söndüğünü** kontrol edin
3. Bildirimi kontrol edin:
   - ✅ **Başlık**: "Yeni Sevkiyat Atandı"
   - ✅ **Mesaj**: "Sevkiyat size atandı. Detayları görmek ister misiniz?"
4. Bildirime tıklayın
5. Sevkiyat detay sayfasına yönlendirildiğinizi kontrol edin

---

## 🎯 TEST 4: Bildirim Dropdown - Görüntüleme ve İşlevsellik

### Senaryo: Bildirim Listesi ve İşlemler

#### Adım 1: Birden Fazla Bildirim Oluşturma
1. **5 farklı modülden** (Görüşme, Teklif, Fatura, Fırsat, Destek Talebi) kayıt oluşturun
2. Her birini **farklı kullanıcılara atayın** (veya aynı kullanıcıya)
3. **Test kullanıcısına** en az 5 bildirim gönderin

#### Adım 2: Bildirim Dropdown Kontrolü
1. **Test kullanıcısı hesabına** giriş yapın
2. Bell ikonuna tıklayın
3. Dropdown'u kontrol edin:
   - ✅ **Başlık**: "Bildirimler" görünüyor mu?
   - ✅ **Tüm bildirimler** listeleniyor mu?
   - ✅ **Okunmamış bildirimler** mavi arka planla vurgulanıyor mu?
   - ✅ **Okunmuş bildirimler** normal arka planla görünüyor mu?
   - ✅ Her bildirimde **tip badge'i** (info, success, warning, error) görünüyor mu?
   - ✅ Her bildirimde **zaman bilgisi** ("Az önce", "5 dakika önce", vb.) görünüyor mu?

#### Adım 3: Bildirim Sıralaması
1. Dropdown'da bildirimlerin **en yeni en üstte** olduğunu kontrol edin
2. En eski bildirimin **en altta** olduğunu kontrol edin

#### Adım 4: Bildirim Tıklama
1. Dropdown'dan bir bildirime tıklayın
2. İlgili detay sayfasına yönlendirildiğinizi kontrol edin
3. Geri dönün
4. Bell ikonuna tekrar tıklayın
5. Tıkladığınız bildirimin **"okundu"** olarak işaretlendiğini kontrol edin (mavi arka plan yok)

#### Adım 5: Badge Sayısı Güncelleme
1. Dropdown'da **okunmamış bildirim sayısını** sayın
2. Bell ikonundaki **kırmızı badge sayısının** aynı olduğunu kontrol edin
3. Bir bildirime tıklayın (okundu olarak işaretlenir)
4. Bell ikonundaki **badge sayısının 1 azaldığını** kontrol edin

---

## 🎯 TEST 5: Otomasyon Bildirimleri

### Senaryo: Otomatik Bildirimler

#### Adım 1: Teklif Kabul Edildiğinde Bildirim
1. Bir teklif oluşturun
2. Teklif durumunu **"ACCEPTED"** (Kabul Edildi) olarak değiştirin
3. **ADMIN, SALES, SUPER_ADMIN** rolündeki kullanıcıların bildirim aldığını kontrol edin:
   - ✅ **Başlık**: "Teklif Onaylandı"
   - ✅ **Mesaj**: "Teklif onaylandı. Detayları görmek ister misiniz?"
   - ✅ **Link**: Teklif detay sayfasına yönlendiriyor mu?

#### Adım 2: Fatura Ödendiğinde Bildirim
1. Bir fatura oluşturun
2. Fatura durumunu **"PAID"** (Ödendi) olarak değiştirin
3. **ADMIN, SALES, SUPER_ADMIN** rolündeki kullanıcıların bildirim aldığını kontrol edin:
   - ✅ **Başlık**: "Fatura Ödendi"
   - ✅ **Mesaj**: "Fatura ödendi ve finans kaydı oluşturuldu. Detayları görmek ister misiniz?"

#### Adım 3: Sevkiyat Teslim Edildiğinde Bildirim
1. Bir sevkiyat oluşturun
2. Sevkiyat durumunu **"DELIVERED"** (Teslim Edildi) olarak değiştirin
3. **ADMIN, SALES, SUPER_ADMIN** rolündeki kullanıcıların bildirim aldığını kontrol edin:
   - ✅ **Başlık**: "Sevkiyat Teslim Edildi"
   - ✅ **Mesaj**: "Sevkiyat başarıyla teslim edildi. Detayları görmek ister misiniz?"

#### Adım 4: Düşük Stok Uyarısı
1. Bir ürün oluşturun veya mevcut ürünü düzenleyin
2. Ürün stokunu **minimum stok seviyesinin altına** düşürün
3. **ADMIN, STOCK, SUPER_ADMIN** rolündeki kullanıcıların bildirim aldığını kontrol edin:
   - ✅ **Başlık**: "Düşük Stok Uyarısı"
   - ✅ **Mesaj**: "[Ürün Adı] ürünü minimum stok seviyesinin altına düştü. (Mevcut: X, Minimum: Y)"
   - ✅ **Link**: Ürün detay sayfasına yönlendiriyor mu?

---

## 🎯 TEST 6: Edge Cases (Sınır Durumlar)

### Senaryo 6.1: Çoklu Bildirim Aynı Anda
1. **10 farklı kayıt** oluşturun ve aynı kullanıcıya atayın
2. Kullanıcının **bell ikonunun yanıp söndüğünü** kontrol edin
3. Badge'de **"10"** veya **"9+"** göründüğünü kontrol edin
4. Dropdown'da **tüm 10 bildirimin** göründüğünü kontrol edin

### Senaryo 6.2: Bildirim Olmadan Dropdown Açma
1. **Hiç bildirimi olmayan** bir kullanıcı hesabına giriş yapın
2. Bell ikonuna tıklayın
3. Dropdown'da **"Yeni bildiriminiz yok"** mesajının göründüğünü kontrol edin
4. Badge'in görünmediğini kontrol edin

### Senaryo 6.3: Bildirim Tıklama - Link Yok
1. **Link'i olmayan** bir bildirim oluşturun (manuel test için)
2. Bildirime tıklayın
3. Sayfa yönlendirmesi olmadığını kontrol edin
4. Bildirimin **"okundu"** olarak işaretlendiğini kontrol edin

### Senaryo 6.4: Görüşme - Aynı Kullanıcıyı 2 Kez Ekleme
1. Bir görüşme oluşturun
2. **Aynı kullanıcıyı 2 kez** katılımcı olarak eklemeye çalışın
3. Sistemin **sadece 1 kez** eklediğini kontrol edin (UNIQUE constraint)

---

## ✅ Test Sonuçları Kontrol Listesi

### Görüşme Modülü
- [ ] 5 kullanıcı seçilebiliyor mu?
- [ ] Her 5 kullanıcıya bildirim gidiyor mu?
- [ ] Bildirim mesajı doğru mu?
- [ ] Bildirim linki çalışıyor mu?
- [ ] Görüşme düzenleme ile katılımcı değiştirilebiliyor mu?

### Yanıp Sönme Animasyonu
- [ ] Yeni bildirim geldiğinde bell ikonu yanıp sönüyor mu?
- [ ] Dropdown açıldığında yanıp sönme duruyor mu?
- [ ] Bildirime tıklandığında yanıp sönme duruyor mu?
- [ ] Animasyon smooth ve göze hoş mu?

### Diğer Modüller
- [ ] Teklif modülünde kullanıcı atama çalışıyor mu?
- [ ] Fatura modülünde kullanıcı atama çalışıyor mu?
- [ ] Fırsat modülünde kullanıcı atama çalışıyor mu?
- [ ] Destek Talebi modülünde kullanıcı atama çalışıyor mu?
- [ ] Sevkiyat modülünde kullanıcı atama çalışıyor mu?
- [ ] Her modülde bildirim doğru gidiyor mu?
- [ ] Her modülde link çalışıyor mu?

### Bildirim Dropdown
- [ ] Tüm bildirimler görünüyor mu?
- [ ] Okunmamış bildirimler vurgulanıyor mu?
- [ ] Bildirim sıralaması doğru mu (en yeni en üstte)?
- [ ] Badge sayısı doğru güncelleniyor mu?
- [ ] Bildirim tıklama çalışıyor mu?

### Otomasyon Bildirimleri
- [ ] Teklif kabul edildiğinde bildirim gidiyor mu?
- [ ] Fatura ödendiğinde bildirim gidiyor mu?
- [ ] Sevkiyat teslim edildiğinde bildirim gidiyor mu?
- [ ] Düşük stok uyarısı çalışıyor mu?

---

## 🐛 Olası Hatalar ve Çözümler

### Hata 1: Bell İkonu Yanıp Sönmüyor
**Kontrol:**
- Framer Motion kurulu mu? (`npm install framer-motion`)
- Browser console'da hata var mı?
- Bildirim gerçekten oluşturuldu mu? (Database kontrolü)

### Hata 2: Bildirim Gitmiyor
**Kontrol:**
- Migration dosyası çalıştırıldı mı? (`022_user_assignment_system.sql`)
- Trigger'lar aktif mi? (Supabase Dashboard > Database > Functions)
- RLS policies doğru mu?

### Hata 3: Link Çalışmıyor
**Kontrol:**
- Link formatı doğru mu? (`/tr/meetings/[id]`)
- Detay sayfası var mı?
- Next.js routing çalışıyor mu?

### Hata 4: Çoklu Kullanıcı Seçimi Çalışmıyor
**Kontrol:**
- `MeetingParticipant` tablosu oluşturuldu mu?
- Checkbox'lar çalışıyor mu?
- API endpoint'e `participantIds` gönderiliyor mu?

---

## 📝 Test Notları

### Test Sırasında Not Alınacaklar:
1. **Hangi test senaryosu** çalıştırıldı?
2. **Beklenen sonuç** neydi?
3. **Gerçek sonuç** ne oldu?
4. **Hata varsa** hata mesajı ne?
5. **Ekran görüntüsü** alındı mı?

### Test Sonrası:
- ✅ Tüm test senaryoları tamamlandı mı?
- ✅ Hatalar düzeltildi mi?
- ✅ Production'a deploy edilebilir mi?

---

**İyi testler! 🚀**































