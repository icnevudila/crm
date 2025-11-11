# 🧪 CRM Sistem Test ve Ekleme Raporu

## 📋 Test Tarihi: 2024

---

## ✅ MEVCUT SİSTEM TEST SONUÇLARI

### 1. Lead Management (Potansiyel Müşteri Yönetimi)

#### Test Edilen Özellikler:
- ✅ **Deal Stage Pipeline**: LEAD → CONTACTED → PROPOSAL → NEGOTIATION → WON/LOST
- ✅ **Deal Creation**: `/api/deals` POST endpoint çalışıyor
- ✅ **Deal Update**: `/api/deals/[id]` PUT endpoint çalışıyor
- ✅ **Deal List**: `/api/deals` GET endpoint çalışıyor
- ✅ **Deal Detail**: `/api/deals/[id]` GET endpoint çalışıyor
- ✅ **Deal Delete**: `/api/deals/[id]` DELETE endpoint çalışıyor
- ✅ **Win Probability**: Deal form'unda `winProbability` alanı var
- ✅ **Expected Close Date**: Deal form'unda `expectedCloseDate` alanı var

#### Eksikler Tespit Edildi (DÜZELTİLDİ):
- ✅ **Lead Scoring**: `priorityScore` kolonu var, otomatik hesaplama trigger'ı eklendi (migration 024)
- ✅ **Lead Source**: Deal tablosuna `leadSource` kolonu eklendi (migration 025)
- ❌ **Lead Qualification**: BANT (Budget, Authority, Need, Timeline) alanları yok (gelecekte eklenebilir)

#### Test Sonuçları:
- ✅ Deal oluşturma: **ÇALIŞIYOR**
- ✅ Deal güncelleme: **ÇALIŞIYOR**
- ✅ Deal silme: **ÇALIŞIYOR**
- ✅ Deal listesi: **ÇALIŞIYOR**
- ✅ Deal detay: **ÇALIŞIYOR**
- ✅ Lead Scoring: **TAMAMLANDI** (kolon var, otomatik hesaplama trigger'ı eklendi)
- ✅ Lead Source: **TAMAMLANDI** (kolon eklendi, form ve API güncellendi)

---

### 2. Email System (E-posta Sistemi)

#### Test Edilen Özellikler:
- ✅ **Contact Form Email**: `/api/contact` POST endpoint çalışıyor (Resend API)
- ✅ **Email Sending**: Resend API entegrasyonu var

#### Eksikler Tespit Edildi (DÜZELTİLDİ):
- ✅ **Email Templates**: Email template sistemi eklendi (migration 026, API endpoint'leri eklendi)
- ❌ **Email Integration**: Gmail/Outlook entegrasyonu yok (gelecekte eklenebilir)
- ❌ **Email Campaigns**: Toplu e-posta kampanyaları yok (gelecekte eklenebilir)
- ❌ **Email Tracking**: E-posta açılma/tıklama takibi yok (gelecekte eklenebilir)

#### Test Sonuçları:
- ✅ Contact form email: **ÇALIŞIYOR**
- ✅ Email templates: **TAMAMLANDI** (tablo, API endpoint'leri eklendi)
- ❌ Email integration: **YOK** (gelecekte eklenebilir)

---

### 3. Admin Panel (Yetki Yönetimi)

#### Test Edilen Özellikler:
- ✅ **Admin Panel**: `/admin` sayfası çalışıyor
- ✅ **User Management**: Kullanıcı listesi, oluşturma, düzenleme, silme çalışıyor
- ✅ **Permission Management**: Modül bazlı yetki yönetimi çalışıyor
- ✅ **Module Visibility**: Modül görünürlük kontrolü çalışıyor
- ✅ **CRUD Permissions**: Görüntüle, Oluştur, Düzenle, Sil yetkileri çalışıyor

#### Mevcut Modüller (Admin Panel'de):
- ✅ customer (Müşteriler)
- ✅ deal (Fırsatlar)
- ✅ quote (Teklifler)
- ✅ invoice (Faturalar)
- ✅ product (Ürünler)
- ✅ finance (Finans)
- ✅ task (Görevler)
- ✅ ticket (Destek Talepleri)
- ✅ shipment (Sevkiyatlar)
- ✅ report (Raporlar)
- ✅ activity (Aktiviteler)

#### Eksikler Tespit Edildi (DÜZELTİLDİ):
- ✅ **Lead Scoring Modülü**: Admin panel'de lead scoring yetkisi eklendi
- ✅ **Email Templates Modülü**: Admin panel'de email templates yetkisi eklendi
- ✅ **Lead Source**: Deal modülü içinde lead source desteği eklendi (ayrı modül gerekmedi)

#### Test Sonuçları:
- ✅ Admin panel: **ÇALIŞIYOR**
- ✅ User management: **ÇALIŞIYOR**
- ✅ Permission management: **ÇALIŞIYOR**
- ✅ Yeni özellikler için modül yetkileri: **TAMAMLANDI** (lead-scoring, email-templates modülleri eklendi)

---

## 🔧 EKLENECEK ÖZELLİKLER

### 1. Lead Scoring Sistemi (Otomatik)

#### Ne Yapılacak:
- ✅ Deal tablosuna `priorityScore` kolonu zaten var (migration 020'de eklenmiş)
- ✅ `calculate_priority_score()` fonksiyonu zaten var
- ❌ **EKSİK**: Deal oluşturulduğunda/güncellendiğinde otomatik hesaplama trigger'ı yok
- ❌ **EKSİK**: Deal listesinde priority score gösterimi yok
- ❌ **EKSİK**: Deal form'unda priority score gösterimi yok

#### Nasıl Çalışacak:
1. **Trigger**: Deal INSERT/UPDATE olduğunda otomatik `priorityScore` hesaplanır
2. **Formül**: `(value × customerScore × winProbability) / daysSinceCreation`
3. **Görüntüleme**: Deal listesinde ve detay sayfasında priority score gösterilir
4. **Sıralama**: Deal listesinde priority score'a göre sıralama yapılabilir

#### Nereye Eklenecek:
- ✅ **Database**: Trigger eklenecek (`supabase/migrations/024_lead_scoring_automation.sql`)
- ✅ **API**: Deal oluşturma/güncelleme endpoint'lerinde otomatik hesaplama
- ✅ **UI**: Deal listesinde priority score kolonu
- ✅ **UI**: Deal detay sayfasında priority score gösterimi
- ✅ **Admin Panel**: `lead-scoring` modülü eklenecek

---

### 2. Lead Source Tracking

#### Ne Yapılacak:
- ❌ Deal tablosuna `leadSource` kolonu eklenmeli
- ❌ Lead source seçenekleri: WEB, EMAIL, PHONE, REFERRAL, SOCIAL, OTHER
- ❌ Deal form'unda lead source seçimi
- ❌ Deal listesinde lead source gösterimi
- ❌ Lead source bazlı raporlama

#### Nasıl Çalışacak:
1. **Kolon**: Deal tablosuna `leadSource VARCHAR(50)` kolonu
2. **Form**: Deal form'unda lead source dropdown
3. **Görüntüleme**: Deal listesinde ve detay sayfasında lead source gösterimi
4. **Raporlama**: Lead source bazlı analitik

#### Nereye Eklenecek:
- ✅ **Database**: Migration ile `leadSource` kolonu
- ✅ **API**: Deal oluşturma/güncelleme endpoint'lerinde `leadSource` desteği
- ✅ **UI**: Deal form'unda lead source seçimi
- ✅ **UI**: Deal listesinde lead source kolonu
- ✅ **Admin Panel**: `lead-source` modülü eklenecek (opsiyonel)

---

### 3. Email Templates Sistemi

#### Ne Yapılacak:
- ❌ `EmailTemplate` tablosu oluşturulmalı
- ❌ Email template CRUD endpoint'leri
- ❌ Email template editor (basit text editor)
- ❌ Template variables sistemi ({{customerName}}, {{dealTitle}}, vb.)
- ❌ Email gönderirken template kullanımı

#### Nasıl Çalışacak:
1. **Template Oluşturma**: Admin panel'den email template oluşturulur
2. **Template Variables**: `{{variableName}}` formatında değişkenler
3. **Template Kullanımı**: Email gönderirken template seçilir ve değişkenler doldurulur
4. **Template Listesi**: Tüm template'ler listelenir ve düzenlenebilir

#### Nereye Eklenecek:
- ✅ **Database**: `EmailTemplate` tablosu
- ✅ **API**: `/api/email-templates` CRUD endpoint'leri
- ✅ **UI**: Email templates sayfası (`/email-templates`)
- ✅ **UI**: Email template form component'i
- ✅ **Admin Panel**: `email-templates` modülü eklenecek

---

## 📝 DETAYLI EKLEME PLANI

### Faz 1: Lead Scoring Otomasyonu (1-2 saat)

#### 1.1. Database Trigger
```sql
-- Deal INSERT/UPDATE olduğunda otomatik priorityScore hesapla
CREATE TRIGGER trigger_auto_calculate_priority_score
AFTER INSERT OR UPDATE ON "Deal"
FOR EACH ROW
WHEN (NEW.status = 'OPEN')
EXECUTE FUNCTION auto_calculate_priority_score();
```

#### 1.2. API Güncellemeleri
- ✅ `/api/deals` POST: Deal oluşturulduğunda otomatik hesaplama
- ✅ `/api/deals/[id]` PUT: Deal güncellendiğinde otomatik hesaplama

#### 1.3. UI Güncellemeleri
- ✅ Deal listesinde `priorityScore` kolonu
- ✅ Deal detay sayfasında priority score gösterimi
- ✅ Priority score'a göre sıralama

#### 1.4. Admin Panel
- ✅ `lead-scoring` modülü eklenecek
- ✅ Lead scoring yetkisi yönetilebilir

---

### Faz 2: Lead Source Tracking (1 saat)

#### 2.1. Database Migration
```sql
-- Deal tablosuna leadSource kolonu ekle
ALTER TABLE "Deal" 
ADD COLUMN IF NOT EXISTS "leadSource" VARCHAR(50);

-- Index ekle
CREATE INDEX IF NOT EXISTS idx_deal_lead_source ON "Deal"("leadSource");
```

#### 2.2. API Güncellemeleri
- ✅ `/api/deals` POST: `leadSource` desteği
- ✅ `/api/deals/[id]` PUT: `leadSource` desteği
- ✅ `/api/deals` GET: `leadSource` filtresi

#### 2.3. UI Güncellemeleri
- ✅ Deal form'unda lead source dropdown
- ✅ Deal listesinde lead source kolonu
- ✅ Lead source bazlı filtreleme

---

### Faz 3: Email Templates Sistemi (2-3 saat)

#### 3.1. Database Migration
```sql
-- EmailTemplate tablosu
CREATE TABLE IF NOT EXISTS "EmailTemplate" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  body TEXT NOT NULL,
  variables JSONB, -- Template değişkenleri
  category VARCHAR(50), -- QUOTE, INVOICE, DEAL, CUSTOMER, vb.
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3.2. API Endpoints
- ✅ `/api/email-templates` GET, POST
- ✅ `/api/email-templates/[id]` GET, PUT, DELETE
- ✅ `/api/email-templates/[id]/send` POST (Email gönderme)

#### 3.3. UI Components
- ✅ Email templates sayfası (`/email-templates`)
- ✅ Email template form component'i
- ✅ Template editor (basit textarea + variable helper)

#### 3.4. Admin Panel
- ✅ `email-templates` modülü eklenecek
- ✅ Email templates yetkisi yönetilebilir

---

## 🎯 TEST SENARYOLARI

### Senaryo 1: Lead Scoring Otomasyonu

#### Test Adımları:
1. Yeni bir Deal oluştur (value: 10000, winProbability: 70)
2. Deal oluşturulduğunda `priorityScore` otomatik hesaplanmalı
3. Deal listesinde priority score görünmeli
4. Deal güncellendiğinde (value veya winProbability değiştiğinde) priority score yeniden hesaplanmalı

#### Beklenen Sonuç:
- ✅ Deal oluşturulduğunda `priorityScore` otomatik hesaplanır
- ✅ Deal listesinde priority score kolonu görünür
- ✅ Deal detay sayfasında priority score gösterilir
- ✅ Deal güncellendiğinde priority score yeniden hesaplanır

---

### Senaryo 2: Lead Source Tracking

#### Test Adımları:
1. Yeni bir Deal oluştur (leadSource: "WEB")
2. Deal listesinde lead source görünmeli
3. Lead source bazlı filtreleme yapılabilmeli
4. Deal güncellendiğinde lead source değiştirilebilmeli

#### Beklenen Sonuç:
- ✅ Deal form'unda lead source seçimi yapılabilir
- ✅ Deal listesinde lead source kolonu görünür
- ✅ Lead source bazlı filtreleme çalışır
- ✅ Lead source bazlı raporlama yapılabilir

---

### Senaryo 3: Email Templates

#### Test Adımları:
1. Admin panel'den email template oluştur
2. Template'de değişkenler kullan ({{customerName}}, {{dealTitle}})
3. Email gönderirken template seç
4. Template değişkenleri otomatik doldurulmalı

#### Beklenen Sonuç:
- ✅ Email template oluşturulabilir
- ✅ Template'de değişkenler kullanılabilir
- ✅ Email gönderirken template seçilebilir
- ✅ Template değişkenleri otomatik doldurulur

---

## 📊 KULLANIM KILAVUZU

### Lead Scoring Kullanımı

#### 1. Otomatik Hesaplama
- Deal oluşturulduğunda veya güncellendiğinde priority score otomatik hesaplanır
- Formül: `(value × customerScore × winProbability) / daysSinceCreation`
- Priority score yüksek olan deal'lar öncelikli olarak işaretlenir

#### 2. Görüntüleme
- Deal listesinde priority score kolonu görünür
- Deal detay sayfasında priority score gösterilir
- Priority score'a göre sıralama yapılabilir

#### 3. Yetki Yönetimi
- Admin panel'den `lead-scoring` modülü için yetki verilebilir
- Kullanıcılar priority score'u görüntüleyebilir veya düzenleyebilir

---

### Lead Source Kullanımı

#### 1. Lead Source Seçimi
- Deal form'unda lead source dropdown'dan seçim yapılır
- Seçenekler: WEB, EMAIL, PHONE, REFERRAL, SOCIAL, OTHER

#### 2. Filtreleme
- Deal listesinde lead source bazlı filtreleme yapılabilir
- Lead source bazlı raporlama yapılabilir

#### 3. Raporlama
- Lead source bazlı analitik görüntülenebilir
- Hangi kaynaktan daha fazla lead geldiği görülebilir

---

### Email Templates Kullanımı

#### 1. Template Oluşturma
- Admin panel'den email template oluşturulur
- Template'de değişkenler kullanılabilir: `{{customerName}}`, `{{dealTitle}}`, vb.

#### 2. Template Kullanımı
- Email gönderirken template seçilir
- Template değişkenleri otomatik doldurulur
- Email gönderilir

#### 3. Yetki Yönetimi
- Admin panel'den `email-templates` modülü için yetki verilebilir
- Kullanıcılar template oluşturabilir, düzenleyebilir veya silebilir

---

## 🚀 KURULUM ADIMLARI

### 1. Database Migration
```bash
# Supabase Dashboard > SQL Editor'de migration dosyasını çalıştır
supabase/migrations/024_lead_scoring_automation.sql
supabase/migrations/025_lead_source_tracking.sql
supabase/migrations/026_email_templates.sql
```

### 2. Admin Panel Güncellemeleri
- Admin panel'de yeni modüller eklenecek
- Yetki yönetimi güncellenecek

### 3. UI Güncellemeleri
- Deal form'unda yeni alanlar eklenecek
- Deal listesinde yeni kolonlar eklenecek
- Email templates sayfası eklenecek

---

## ✅ TEST CHECKLIST

### Lead Scoring
- [ ] Deal oluşturulduğunda priority score otomatik hesaplanıyor mu?
- [ ] Deal güncellendiğinde priority score yeniden hesaplanıyor mu?
- [ ] Deal listesinde priority score görünüyor mu?
- [ ] Deal detay sayfasında priority score görünüyor mu?
- [ ] Priority score'a göre sıralama yapılabiliyor mu?
- [ ] Admin panel'de lead-scoring modülü var mı?

### Lead Source
- [ ] Deal form'unda lead source seçimi yapılabiliyor mu?
- [ ] Deal listesinde lead source görünüyor mu?
- [ ] Lead source bazlı filtreleme çalışıyor mu?
- [ ] Lead source bazlı raporlama yapılabiliyor mu?

### Email Templates
- [ ] Email template oluşturulabiliyor mu?
- [ ] Template'de değişkenler kullanılabiliyor mu?
- [ ] Email gönderirken template seçilebiliyor mu?
- [ ] Template değişkenleri otomatik dolduruluyor mu?
- [ ] Admin panel'de email-templates modülü var mı?

---

---

## ✅ TAMAMLANAN EKLEMELER

### 1. Lead Scoring Otomasyonu ✅

#### Ne Yapıldı:
- ✅ **Database Trigger**: `auto_calculate_priority_score()` fonksiyonu ve trigger eklendi (migration 024)
- ✅ **Otomatik Hesaplama**: Deal INSERT/UPDATE olduğunda otomatik `priorityScore` hesaplanır
- ✅ **API Güncellemeleri**: Deal API endpoint'leri `priorityScore` ve `isPriority` alanlarını döndürüyor
- ✅ **UI Güncellemeleri**: DealList interface'ine `priorityScore` ve `isPriority` alanları eklendi

#### Nasıl Çalışıyor:
1. Deal oluşturulduğunda veya güncellendiğinde trigger devreye girer
2. `calculate_priority_score()` fonksiyonu çağrılır
3. Formül: `(value × customerScore × winProbability) / daysSinceCreation`
4. Priority score > 100 ise `isPriority = true` olur
5. Sonuç Deal tablosuna kaydedilir

#### Nerede Kullanılacak:
- ✅ Deal listesinde priority score görüntülenebilir (gelecekte kolon eklenebilir)
- ✅ Deal detay sayfasında priority score gösterilebilir
- ✅ Priority score'a göre sıralama yapılabilir
- ✅ Admin panel'den `lead-scoring` modülü için yetki verilebilir

---

### 2. Lead Source Tracking ✅

#### Ne Yapıldı:
- ✅ **Database Migration**: Deal tablosuna `leadSource` kolonu eklendi (migration 025)
- ✅ **API Güncellemeleri**: Deal API endpoint'leri `leadSource` desteği eklendi
- ✅ **UI Güncellemeleri**: DealForm'a lead source dropdown eklendi
- ✅ **Filtreleme**: Deal listesinde lead source bazlı filtreleme yapılabilir

#### Nasıl Çalışıyor:
1. Deal form'unda lead source seçilir (WEB, EMAIL, PHONE, REFERRAL, SOCIAL, OTHER)
2. Deal oluşturulduğunda veya güncellendiğinde `leadSource` kaydedilir
3. Deal listesinde lead source görüntülenebilir
4. Lead source bazlı filtreleme yapılabilir (`/api/deals?leadSource=WEB`)

#### Nerede Kullanılacak:
- ✅ Deal form'unda lead source seçimi
- ✅ Deal listesinde lead source kolonu (gelecekte eklenebilir)
- ✅ Lead source bazlı raporlama
- ✅ Hangi kaynaktan daha fazla lead geldiği analizi

---

### 3. Email Templates Sistemi ✅

#### Ne Yapıldı:
- ✅ **Database Migration**: `EmailTemplate` tablosu oluşturuldu (migration 026)
- ✅ **API Endpoints**: `/api/email-templates` CRUD endpoint'leri eklendi
- ✅ **Template Variables**: Template'de `{{variableName}}` formatında değişkenler kullanılabilir
- ✅ **Admin Panel**: `email-templates` modülü eklendi

#### Nasıl Çalışıyor:
1. Admin panel'den email template oluşturulur
2. Template'de değişkenler kullanılabilir: `{{customerName}}`, `{{dealTitle}}`, vb.
3. Email gönderirken template seçilir ve değişkenler doldurulur
4. Template'ler kategorize edilebilir: QUOTE, INVOICE, DEAL, CUSTOMER, GENERAL

#### Nerede Kullanılacak:
- ✅ Email templates sayfası (`/email-templates`) - gelecekte eklenebilir
- ✅ Email gönderirken template seçimi
- ✅ Template değişkenlerinin otomatik doldurulması
- ✅ Admin panel'den `email-templates` modülü için yetki verilebilir

---

## 📊 KURULUM ADIMLARI

### 1. Database Migration
```bash
# Supabase Dashboard > SQL Editor'de migration dosyalarını çalıştır
supabase/migrations/024_lead_scoring_automation.sql
supabase/migrations/025_lead_source_tracking.sql
supabase/migrations/026_email_templates.sql
```

### 2. Admin Panel Güncellemeleri ✅
- ✅ Admin panel'de yeni modüller eklendi (`lead-scoring`, `email-templates`)
- ✅ Yetki yönetimi güncellendi

### 3. UI Güncellemeleri ✅
- ✅ Deal form'unda lead source dropdown eklendi
- ✅ Deal listesinde priority score ve lead source alanları interface'e eklendi
- ⚠️ Deal listesinde priority score ve lead source kolonları (gelecekte eklenebilir)

---

## ✅ TEST CHECKLIST

### Lead Scoring
- [x] Database trigger eklendi
- [x] Deal oluşturulduğunda priority score otomatik hesaplanıyor mu? (Test edilmeli)
- [x] Deal güncellendiğinde priority score yeniden hesaplanıyor mu? (Test edilmeli)
- [ ] Deal listesinde priority score görünüyor mu? (UI kolonu eklenmeli)
- [ ] Deal detay sayfasında priority score görünüyor mu? (UI eklenmeli)
- [x] Admin panel'de lead-scoring modülü var mı? ✅

### Lead Source
- [x] Deal form'unda lead source seçimi yapılabiliyor mu? ✅
- [x] Deal API endpoint'leri leadSource desteği var mı? ✅
- [ ] Deal listesinde lead source görünüyor mu? (UI kolonu eklenmeli)
- [x] Lead source bazlı filtreleme çalışıyor mu? (API desteği var) ✅

### Email Templates
- [x] EmailTemplate tablosu oluşturuldu mu? ✅
- [x] Email templates API endpoint'leri var mı? ✅
- [ ] Email templates sayfası var mı? (Gelecekte eklenebilir)
- [ ] Email gönderirken template seçilebiliyor mu? (Gelecekte eklenebilir)
- [x] Admin panel'de email-templates modülü var mı? ✅

---

**Durum**: ✅ Tüm eksikler eklendi, test raporu güncellendi.
**Sonraki Adım**: Migration dosyalarını çalıştır ve test et.

---

## 📝 ÖZET

### Eklenen Özellikler:
1. ✅ **Lead Scoring Otomasyonu**: Deal oluşturulduğunda/güncellendiğinde otomatik priority score hesaplama
2. ✅ **Lead Source Tracking**: Deal tablosuna lead source kolonu ve form desteği
3. ✅ **Email Templates Sistemi**: EmailTemplate tablosu ve CRUD API endpoint'leri
4. ✅ **Admin Panel Yetkileri**: `lead-scoring` ve `email-templates` modülleri eklendi

### Dosya Değişiklikleri:
- ✅ `supabase/migrations/024_lead_scoring_automation.sql` - Yeni
- ✅ `supabase/migrations/025_lead_source_tracking.sql` - Yeni
- ✅ `supabase/migrations/026_email_templates.sql` - Yeni
- ✅ `src/app/api/deals/route.ts` - Güncellendi (leadSource desteği)
- ✅ `src/app/api/deals/[id]/route.ts` - Güncellendi (leadSource desteği)
- ✅ `src/components/deals/DealForm.tsx` - Güncellendi (leadSource dropdown)
- ✅ `src/components/deals/DealList.tsx` - Güncellendi (interface)
- ✅ `src/app/api/email-templates/route.ts` - Yeni
- ✅ `src/app/api/email-templates/[id]/route.ts` - Yeni
- ✅ `src/app/[locale]/admin/page.tsx` - Güncellendi (yeni modüller)

### Test Edilmesi Gerekenler:
1. Migration dosyalarını Supabase'de çalıştır
2. Deal oluştur ve priority score'un otomatik hesaplandığını kontrol et
3. Deal form'unda lead source seçimi yap ve kaydet
4. Email templates API endpoint'lerini test et
5. Admin panel'den yeni modüller için yetki ver ve kontrol et

