# 🧪 CRM Modülleri Test Rehberi

Bu dosya, Documents, Approvals ve Email Campaigns modüllerinin test edilmesi için adım adım rehber içerir.

---

## 📋 GENEL HAZIRLIK

### 1. Migration Dosyasını Çalıştırın
```bash
# Supabase CLI ile migration çalıştırın
supabase db push

# VEYA Supabase Dashboard'dan SQL Editor'de çalıştırın:
# supabase/migrations/067_create_documents_storage_bucket.sql
```

### 2. Storage Bucket Oluşturun
Supabase Dashboard → Storage → Create Bucket:
- **Bucket Name**: `documents`
- **Public**: `false` (Private)
- **File Size Limit**: `10MB`
- **Allowed MIME Types**: `image/*`, `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `text/plain`, `text/csv`

### 3. Environment Variables Kontrolü
`.env.local` dosyanızda şunların olduğundan emin olun:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## 📄 DOCUMENTS MODÜLÜ TESTİ

### Test 1: Documents Listesi Görüntüleme
1. Tarayıcıda `/tr/documents` sayfasına gidin
2. **Beklenen**: Boş liste veya mevcut dokümanlar görünmeli
3. **Kontrol**: Skeleton loading gösterilmemeli (hızlı yüklenmeli)

### Test 2: Yeni Doküman Yükleme
1. **"Dosya Yükle"** butonuna tıklayın
2. Form'da:
   - **Başlık**: "Test Dokümanı" yazın
   - **Dosya Seç**: Herhangi bir PDF, Word veya resim dosyası seçin (max 10MB)
   - **Klasör**: "Genel" seçin
   - **İlişkili Modül**: Opsiyonel - "Customer" seçin
   - **İlişkili Kayıt**: Bir müşteri seçin (eğer Customer seçtiyseniz)
3. **"Yükle"** butonuna tıklayın
4. **Beklenen**: 
   - Dosya yüklenmeli
   - Toast bildirimi görünmeli: "Dosya başarıyla yüklenmiş"
   - Liste otomatik güncellenmeli
   - Yeni doküman listede görünmeli

### Test 3: Doküman Görüntüleme
1. Listede bir dokümanın yanındaki **Göz ikonu**na tıklayın
2. **Beklenen**: Detay sayfası açılmalı
3. **Kontrol**: Dosya bilgileri, yükleyen kişi, tarih görünmeli

### Test 4: Doküman İndirme
1. Listede bir dokümanın yanındaki **İndir ikonu**na tıklayın
2. **Beklenen**: Dosya yeni sekmede açılmalı veya indirilmeli

### Test 5: Pagination Testi
1. 20'den fazla doküman oluşturun (test için)
2. **Beklenen**: Sayfa altında pagination görünmeli
3. **Kontrol**: 
   - Sayfa numaraları çalışmalı
   - "Sayfa başına" dropdown çalışmalı (10, 20, 50, 100)

### Test 6: Arama Testi
1. Arama kutusuna doküman başlığının bir kısmını yazın
2. **Beklenen**: İlgili dokümanlar filtrelenmeli
3. **Kontrol**: Debounce çalışmalı (300ms sonra arama yapılmalı)

### Test 7: Permission Testi
1. Farklı bir kullanıcı ile giriş yapın (farklı şirket)
2. **Beklenen**: Sadece kendi şirketinin dokümanlarını görmeli
3. **Kontrol**: Başka şirketin dokümanları görünmemeli

---

## ✅ APPROVALS MODÜLÜ TESTİ

### Test 1: Onay Listesi Görüntüleme
1. Tarayıcıda `/tr/approvals` sayfasına gidin
2. **Beklenen**: 
   - Tüm onaylar listesi görünmeli
   - "Tüm Onaylar" ve "Benim Onaylarım" sekmeleri olmalı

### Test 2: Yeni Onay Talebi Oluşturma
1. **"Yeni Onay Talebi"** butonuna tıklayın
2. Form'da:
   - **Başlık**: "Test Onay Talebi" yazın
   - **Açıklama**: "Bu bir test onay talebidir" yazın
   - **İlgili Modül**: "Quote" seçin
   - **Kayıt ID**: Bir Quote ID seçin (dropdown'dan)
   - **Öncelik**: "Normal" seçin
   - **Onaylayıcılar**: En az bir kullanıcı seçin (checkbox)
3. **"Onay Talebi Oluştur"** butonuna tıklayın
4. **Beklenen**: 
   - Onay talebi oluşturulmalı
   - Liste otomatik güncellenmeli
   - Yeni onay talebi listede görünmeli

### Test 3: Onay Detay Sayfası
1. Listede bir onay talebinin başlığına tıklayın
2. **Beklenen**: Detay sayfası açılmalı
3. **Kontrol**: 
   - Onay bilgileri görünmeli
   - Onaylayıcılar listesi görünmeli
   - İlişkili kayıt linki çalışmalı

### Test 4: Onaylama İşlemi
1. Detay sayfasında veya listede **"Onayla"** butonuna tıklayın
2. Onay mesajını onaylayın
3. **Beklenen**: 
   - Onay talebi "Onaylandı" durumuna geçmeli
   - Toast bildirimi görünmeli: "Onaylandı"
   - Liste otomatik güncellenmeli

### Test 5: Reddetme İşlemi
1. Bir onay talebinde **"Reddet"** butonuna tıklayın
2. Red nedeni girin (örn: "Test reddi")
3. Onay mesajını onaylayın
4. **Beklenen**: 
   - Onay talebi "Reddedildi" durumuna geçmeli
   - Red nedeni görünmeli
   - Toast bildirimi görünmeli: "Reddedildi"

### Test 6: "Benim Onaylarım" Filtresi
1. **"Benim Onaylarım"** sekmesine tıklayın
2. **Beklenen**: Sadece sizin onaylayıcı olarak seçildiğiniz bekleyen onaylar görünmeli

### Test 7: Arama Testi
1. Arama kutusuna onay başlığının bir kısmını yazın
2. **Beklenen**: İlgili onaylar filtrelenmeli

---

## 📧 EMAIL CAMPAIGNS MODÜLÜ TESTİ

### Test 1: Email Kampanyaları Listesi
1. Tarayıcıda `/tr/email-campaigns` sayfasına gidin
2. **Beklenen**: 
   - Boş liste veya mevcut kampanyalar görünmeli
   - İstatistik kartları görünmeli (Toplam Kampanya, Gönderilen, Açılan, Tıklanan)

### Test 2: Yeni Email Kampanyası Oluşturma
1. **"Yeni Kampanya"** butonuna tıklayın
2. Form'da:
   - **Kampanya Adı**: "Test Kampanyası" yazın
   - **Email Konusu**: "Test Email Konusu" yazın
   - **Email İçeriği**: 
     ```
     <h1>Merhaba!</h1>
     <p>Bu bir test email kampanyasıdır.</p>
     <a href="https://example.com">Tıklayın</a>
     ```
     yazın (HTML kullanabilirsiniz)
   - **Hedef Kitle**: "Tüm Müşteriler" seçin (veya bir segment)
   - **Zamanla**: Boş bırakın (hemen gönderilecek)
3. **"Önizle"** butonuna tıklayın
4. **Beklenen**: Email önizleme modalı açılmalı, HTML render edilmiş görünmeli
5. Önizlemeyi kapatın ve **"Oluştur"** butonuna tıklayın
6. **Beklenen**: 
   - Kampanya oluşturulmalı
   - Liste otomatik güncellenmeli
   - Yeni kampanya listede "Taslak" durumunda görünmeli

### Test 3: Email Kampanyası Düzenleme
1. Listede bir kampanyanın yanındaki **Düzenle ikonu**na tıklayın
2. Form'da değişiklik yapın (örn: konu değiştirin)
3. **"Güncelle"** butonuna tıklayın
4. **Beklenen**: Kampanya güncellenmeli, liste otomatik güncellenmeli

### Test 4: Email Kampanyası Detay Sayfası
1. Listede bir kampanyanın yanındaki **Göz ikonu**na tıklayın
2. **Beklenen**: Detay sayfası açılmalı
3. **Kontrol**: 
   - Email önizlemesi görünmeli
   - Durum bilgileri görünmeli
   - İstatistikler görünmeli (eğer gönderildiyse)

### Test 5: Email Kampanyası Gönderme
1. Detay sayfasında **"Gönder"** butonuna tıklayın (DRAFT durumundaysa)
2. Onay mesajını onaylayın
3. **Beklenen**: 
   - Kampanya gönderilmeli
   - Durum "Gönderildi" olmalı
   - Toast bildirimi görünmeli: "Gönderildi"
   - İstatistikler güncellenmeli

### Test 6: Email Kampanyası Silme
1. Listede bir kampanyanın yanındaki **Sil ikonu**na tıklayın
2. Onay mesajını onaylayın
3. **Beklenen**: 
   - Kampanya silinmeli
   - Liste otomatik güncellenmeli
   - Toast bildirimi görünmeli: "Silindi"

### Test 7: HTML Editor Testi
1. Yeni kampanya formunda **"HTML"** sekmesine tıklayın
2. **Beklenen**: Ham HTML kodu görünmeli
3. **"Düzenle"** sekmesine geri dönün
4. **Beklenen**: Textarea'da HTML düzenlenebilir olmalı

### Test 8: Preview Testi
1. Form'da içerik yazın
2. **"Önizle"** butonuna tıklayın
3. **Beklenen**: 
   - Modal açılmalı
   - HTML render edilmiş görünmeli
   - Konu görünmeli

---

## 🔍 GENEL TESTLER

### Test 1: Permission Kontrolü
1. Farklı rollerle giriş yapın (Admin, Sales, SuperAdmin)
2. **Beklenen**: 
   - Her rol kendi yetkilerine göre işlem yapabilmeli
   - Yetkisiz işlemlerde "Forbidden" hatası görünmeli

### Test 2: Optimistic Updates
1. Herhangi bir modülde yeni kayıt oluşturun
2. **Beklenen**: 
   - Kayıt hemen listede görünmeli (beklemeden)
   - Form kapanmadan önce liste güncellenmeli

### Test 3: Error Handling
1. Network'ü devre dışı bırakın (Chrome DevTools → Network → Offline)
2. Bir işlem yapmayı deneyin
3. **Beklenen**: 
   - Kullanıcı dostu hata mesajı görünmeli
   - Sayfa çökmemeli

### Test 4: Loading States
1. Yavaş bir network bağlantısı simüle edin (Chrome DevTools → Network → Slow 3G)
2. Sayfaları yükleyin
3. **Beklenen**: 
   - Skeleton loading gösterilmeli
   - "Yükleniyor..." mesajı görünmemeli

### Test 5: Pagination Performance
1. 100+ kayıt oluşturun
2. Liste sayfasını açın
3. **Beklenen**: 
   - Sadece ilk sayfa yüklenmeli (20 kayıt)
   - Sayfa geçişleri hızlı olmalı (<300ms)

---

## ✅ BAŞARILI TEST KRİTERLERİ

### Documents Modülü ✅
- [ ] Dosya yükleme çalışıyor
- [ ] Dosya listesi görüntüleniyor
- [ ] Pagination çalışıyor
- [ ] Arama çalışıyor
- [ ] Detay sayfası açılıyor
- [ ] Permission kontrolü çalışıyor

### Approvals Modülü ✅
- [ ] Onay talebi oluşturuluyor
- [ ] Onaylama işlemi çalışıyor
- [ ] Reddetme işlemi çalışıyor
- [ ] Detay sayfası açılıyor
- [ ] Filtreleme çalışıyor

### Email Campaigns Modülü ✅
- [ ] Kampanya oluşturuluyor
- [ ] HTML editor çalışıyor
- [ ] Preview çalışıyor
- [ ] Kampanya gönderiliyor
- [ ] Detay sayfası açılıyor
- [ ] İstatistikler görüntüleniyor

---

## 🐛 BİLİNEN SORUNLAR VE ÇÖZÜMLER

### Sorun 1: Storage Bucket Bulunamadı
**Hata**: `Bucket 'documents' not found`
**Çözüm**: Supabase Dashboard'dan Storage bucket'ı oluşturun (yukarıdaki hazırlık adımlarına bakın)

### Sorun 2: Permission Denied
**Hata**: `403 Forbidden`
**Çözüm**: Kullanıcının ilgili modül için yetkisi olduğundan emin olun (CompanyModulePermission tablosunu kontrol edin)

### Sorun 3: Email Gönderilemiyor
**Hata**: `Email service not configured`
**Çözüm**: SendGrid veya AWS SES entegrasyonu henüz yapılmadı. Bu özellik şu an mock olarak çalışıyor.

---

## 📝 TEST SONUÇLARI

Test tarihi: _______________
Test eden: _______________

### Documents Modülü
- [ ] Başarılı
- [ ] Başarısız (Notlar: _______________)

### Approvals Modülü
- [ ] Başarılı
- [ ] Başarısız (Notlar: _______________)

### Email Campaigns Modülü
- [ ] Başarılı
- [ ] Başarısız (Notlar: _______________)

---

**Not**: Bu test rehberi, modüllerin temel işlevselliğini test etmek için hazırlanmıştır. Daha detaylı testler için unit test ve E2E test dosyalarına bakın.

