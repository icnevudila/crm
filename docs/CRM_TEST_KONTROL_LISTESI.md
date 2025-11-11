# ✅ CRM İyileştirmeleri Test Kontrol Listesi

## 📋 SQL Migration Durumu: ✅ ÇALIŞTIRILDI

---

## 🔍 HIZLI KONTROL (5 Dakika)

### 1. Veritabanı Kontrolü (SQL Editor'de)

```sql
-- ✅ Yeni modüller var mı?
SELECT code, name, "isActive" 
FROM "Module" 
WHERE code IN ('lead-scoring', 'email-templates');

-- ✅ SuperAdmin yetkileri var mı?
SELECT r.code as role, m.code as module, rp."canCreate", rp."canRead", rp."canUpdate", rp."canDelete"
FROM "RolePermission" rp
INNER JOIN "Role" r ON rp."roleId" = r.id
INNER JOIN "Module" m ON rp."moduleId" = m.id
WHERE r.code = 'SUPER_ADMIN' 
  AND m.code IN ('lead-scoring', 'email-templates');

-- ✅ Deal tablosunda yeni kolonlar var mı?
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Deal' 
AND column_name IN ('leadSource', 'priorityScore', 'isPriority');

-- ✅ EmailTemplate tablosu var mı?
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'EmailTemplate';

-- ✅ Trigger var mı?
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trigger_auto_calculate_priority_score';
```

**Beklenen Sonuçlar:**
- ✅ 2 modül görünmeli (lead-scoring, email-templates)
- ✅ SuperAdmin her iki modül için tam yetkiye sahip olmalı (tümü true)
- ✅ Deal tablosunda 3 yeni kolon görünmeli
- ✅ EmailTemplate tablosu görünmeli
- ✅ Trigger görünmeli

---

### 2. Admin Panel Kontrolü (2 Dakika)

1. **Adım**: `/admin` sayfasına git
2. **Adım**: "Yetki Yönetimi" sekmesine git
3. **Adım**: Bir kullanıcı seç
4. **Kontrol**: 
   - ✅ "Lead Scoring" modülü listede görünmeli
   - ✅ "E-posta Şablonları" modülü listede görünmeli
5. **Beklenen Sonuç**: Her iki modül de listede görünmeli

---

### 3. Deal Form Kontrolü (1 Dakika)

1. **Adım**: `/deals` sayfasına git
2. **Adım**: "Yeni Fırsat" butonuna tıkla
3. **Kontrol**: 
   - ✅ Form'da "Potansiyel Müşteri Kaynağı" dropdown'ı görünmeli
   - ✅ Seçenekler: Web Sitesi, E-posta, Telefon, Referans, Sosyal Medya, Diğer
4. **Beklenen Sonuç**: Lead source dropdown görünmeli ve çalışmalı

---

### 4. Lead Scoring Testi (3 Dakika)

1. **Adım**: Yeni bir deal oluştur:
   - Title: "Test Deal - Priority Score"
   - Value: 10000
   - Win Probability: 70
   - Status: OPEN
   - Lead Source: WEB
2. **Adım**: Deal'ı kaydet
3. **Adım**: Deal detay sayfasına git veya API'den çek: `/api/deals/[id]`
4. **Kontrol**: 
   - ✅ `priorityScore` otomatik hesaplanmış olmalı (0'dan büyük)
   - ✅ `isPriority` değeri set edilmiş olmalı (priorityScore > 100 ise true)
   - ✅ `leadSource` kaydedilmiş olmalı (WEB)
5. **Beklenen Sonuç**: 
   - Priority score otomatik hesaplanmalı
   - Lead source kaydedilmeli

---

### 5. Email Templates API Testi (2 Dakika)

1. **Adım**: API endpoint'ini test et: `POST /api/email-templates`
2. **Adım**: Request body:
```json
{
  "name": "Test Template",
  "subject": "Test Konu {{customerName}}",
  "body": "Merhaba {{customerName}}, {{dealTitle}} için teşekkürler!",
  "variables": ["customerName", "dealTitle"],
  "category": "DEAL",
  "isActive": true
}
```
3. **Kontrol**: 
   - ✅ Template başarıyla oluşturulmalı
   - ✅ ID dönmeli
   - ✅ ActivityLog'a kaydedilmeli
4. **Beklenen Sonuç**: Template oluşturulmalı

---

## ✅ BAŞARILI TEST SONUÇLARI

### Veritabanı
- [ ] Yeni modüller eklendi (lead-scoring, email-templates)
- [ ] SuperAdmin yetkileri eklendi
- [ ] Deal tablosunda yeni kolonlar var
- [ ] EmailTemplate tablosu oluşturuldu
- [ ] Trigger çalışıyor

### Admin Panel
- [ ] Lead Scoring modülü listede görünüyor
- [ ] E-posta Şablonları modülü listede görünüyor
- [ ] Yetki yönetimi çalışıyor

### Deal Form
- [ ] Lead source dropdown görünüyor
- [ ] Lead source seçimi çalışıyor
- [ ] Lead source kaydediliyor

### Lead Scoring
- [ ] Yeni deal oluşturulduğunda priority score otomatik hesaplanıyor
- [ ] Deal güncellendiğinde priority score yeniden hesaplanıyor
- [ ] Priority score değeri doğru hesaplanıyor

### Email Templates
- [ ] Template oluşturma çalışıyor
- [ ] Template listeleme çalışıyor
- [ ] Template güncelleme çalışıyor
- [ ] Template silme çalışıyor

---

## ⚠️ SORUN GİDERME

### Eğer Priority Score Hesaplanmıyorsa:
1. Trigger'ın çalıştığını kontrol et (SQL yukarıda)
2. `calculate_priority_score` fonksiyonunun var olduğunu kontrol et
3. Deal'ın status'unun OPEN olduğunu kontrol et
4. Console'da hata var mı kontrol et

### Eğer Lead Source Kaydedilmiyorsa:
1. Deal form'unda dropdown'ın göründüğünü kontrol et
2. API endpoint'ine leadSource gönderildiğini kontrol et (Network tab)
3. Database'de kolonun var olduğunu kontrol et

### Eğer Email Templates Çalışmıyorsa:
1. EmailTemplate tablosunun oluşturulduğunu kontrol et
2. API endpoint'lerinin çalıştığını kontrol et
3. RLS politikalarının doğru olduğunu kontrol et

### Eğer Admin Panel'de Modüller Görünmüyorsa:
1. Module tablosunda modüllerin var olduğunu kontrol et
2. Admin panel sayfasını yenile (hard refresh: Ctrl+F5)
3. Browser console'da hata var mı kontrol et

---

## 📊 TEST SONUÇLARI

### Test Tarihi: ___________

#### Veritabanı Kontrolü
- [ ] Yeni modüller eklendi
- [ ] SuperAdmin yetkileri eklendi
- [ ] Deal tablosunda yeni kolonlar var
- [ ] EmailTemplate tablosu oluşturuldu
- [ ] Trigger çalışıyor

#### Admin Panel
- [ ] Lead Scoring modülü görünüyor
- [ ] E-posta Şablonları modülü görünüyor

#### Deal Form
- [ ] Lead source dropdown görünüyor
- [ ] Lead source kaydediliyor

#### Lead Scoring
- [ ] Priority score otomatik hesaplanıyor
- [ ] Priority score değeri doğru

#### Email Templates
- [ ] Template oluşturma çalışıyor
- [ ] Template listeleme çalışıyor

---

**Not**: Tüm testler başarılı olursa, sistem hazır demektir! 🎉










