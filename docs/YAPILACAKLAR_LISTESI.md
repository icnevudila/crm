# 📋 Yapılacaklar Listesi - CRM İyileştirmeleri

## ✅ TAMAMLANAN İŞLER

### 1. Database & Backend ✅
- ✅ Lead Scoring otomasyonu (trigger, fonksiyon)
- ✅ Lead Source tracking (kolon, index)
- ✅ Email Templates sistemi (tablo, API endpoint'leri)
- ✅ SuperAdmin'e otomatik yetki verildi
- ✅ Admin paneline yeni modüller eklendi

### 2. API Endpoints ✅
- ✅ Deal API'leri güncellendi (leadSource, priorityScore, isPriority)
- ✅ Email Templates API'leri eklendi (GET, POST, PUT, DELETE)

### 3. Form & UI (Kısmen) ✅
- ✅ Deal form'unda lead source dropdown eklendi
- ✅ DealList interface güncellendi (priorityScore, isPriority, leadSource)

---

## ⚠️ EKSİK KALAN İŞLER

### 1. UI Güncellemeleri (ÖNEMLİ!)

#### 1.1. Deal Listesinde Yeni Kolonlar
**Durum**: ❌ Eksik
**Ne Yapılacak**:
- Deal listesinde `priorityScore` kolonu ekle
- Deal listesinde `leadSource` kolonu ekle
- Deal listesinde `isPriority` badge'i ekle (öncelikli deal'lar için)
- Priority score'a göre sıralama yapılabilmeli

**Dosya**: `src/components/deals/DealList.tsx`
**Yapılacaklar**:
- TableHeader'a yeni kolonlar ekle
- TableCell'lerde priority score ve lead source göster
- Priority score'a göre sıralama butonu ekle

---

#### 1.2. Deal Detay Sayfasında Yeni Alanlar
**Durum**: ❌ Eksik
**Ne Yapılacak**:
- Deal detay sayfasında `priorityScore` göster
- Deal detay sayfasında `leadSource` göster
- Deal detay sayfasında `isPriority` badge'i göster

**Dosya**: `src/app/[locale]/deals/[id]/page.tsx`
**Yapılacaklar**:
- Priority score kartı ekle
- Lead source bilgisi ekle
- Priority badge ekle

---

#### 1.3. Lead Source Filtreleme (UI)
**Durum**: ❌ Eksik
**Ne Yapılacak**:
- Deal listesinde lead source bazlı filtreleme dropdown'ı ekle
- Lead source filtreleme çalışmalı

**Dosya**: `src/components/deals/DealList.tsx`
**Yapılacaklar**:
- Filtreler bölümüne lead source dropdown ekle
- API'ye leadSource parametresi gönder

---

#### 1.4. Email Templates Sayfası (UI)
**Durum**: ❌ Eksik
**Ne Yapılacak**:
- Email templates sayfası oluştur (`/email-templates`)
- Email template listesi göster
- Email template form component'i (oluşturma/düzenleme)
- Template editor (basit textarea + variable helper)

**Dosyalar**:
- `src/app/[locale]/email-templates/page.tsx` - Yeni
- `src/components/email-templates/EmailTemplateList.tsx` - Yeni
- `src/components/email-templates/EmailTemplateForm.tsx` - Yeni

**Yapılacaklar**:
- CustomerList pattern'i ile EmailTemplateList component'i
- EmailTemplateForm component'i (react-hook-form + Zod)
- Template değişkenleri helper ({{variableName}} formatı)

---

### 2. Test & Doğrulama

#### 2.1. Fonksiyonel Testler
**Durum**: ⚠️ Yapılmalı
**Ne Yapılacak**:
- Lead scoring otomasyonu testi
- Lead source tracking testi
- Email templates CRUD testi
- Admin panel yetki testi

---

#### 2.2. Performans Testleri
**Durum**: ⚠️ Yapılmalı
**Ne Yapılacak**:
- Priority score hesaplama performansı
- Trigger performansı (büyük tablolarda)
- Email templates API performansı

---

### 3. Dokümantasyon

#### 3.1. Kullanım Kılavuzu
**Durum**: ⚠️ Yapılmalı
**Ne Yapılacak**:
- Lead scoring nasıl kullanılır?
- Lead source nasıl kullanılır?
- Email templates nasıl kullanılır?

---

## 🎯 ÖNCELİK SIRASI

### Yüksek Öncelik (Hemen Yapılmalı)
1. ✅ **Deal listesinde priority score ve lead source kolonları** - Kullanıcı görmeli
2. ✅ **Deal detay sayfasında yeni alanlar** - Kullanıcı görmeli
3. ✅ **Lead source filtreleme (UI)** - Kullanıcı kullanabilmeli

### Orta Öncelik (Yakında Yapılmalı)
4. ⚠️ **Email templates sayfası** - Kullanıcı template oluşturabilmeli
5. ⚠️ **Fonksiyonel testler** - Sistem çalışıyor mu kontrol et

### Düşük Öncelik (Gelecekte)
6. ⚠️ **Performans testleri** - Optimizasyon için
7. ⚠️ **Dokümantasyon** - Kullanım kılavuzu

---

## 📊 ÖZET

### Tamamlanan: 60%
- ✅ Database & Backend: %100
- ✅ API Endpoints: %100
- ✅ Form & UI: %40 (form var, liste yok)

### Eksik: 40%
- ❌ Deal listesinde yeni kolonlar: %0
- ❌ Deal detay sayfasında yeni alanlar: %0
- ❌ Lead source filtreleme (UI): %0
- ❌ Email templates sayfası: %0

---

## 🚀 SONRAKI ADIMLAR

1. **Deal listesinde priority score ve lead source kolonları ekle**
2. **Deal detay sayfasında yeni alanlar ekle**
3. **Lead source filtreleme (UI) ekle**
4. **Email templates sayfası oluştur**

Hangi işten başlayalım? 🎯










