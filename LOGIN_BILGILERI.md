# 🔐 Giriş Bilgileri - Demo Hesaplar

## 📋 Örnek Giriş Bilgileri

### 1. Tipplus Medikal (Ankara - Sağlık)

**Admin Hesabı:**
- **Şirket:** Tipplus Medikal (Ankara)
- **Email:** `admin@tipplusmedikal.com`
- **Şifre:** `demo123`
- **Rol:** ADMIN

**Sales Hesabı:**
- **Şirket:** Tipplus Medikal (Ankara)
- **Email:** `sales@tipplusmedikal.com`
- **Şifre:** `demo123`
- **Rol:** SALES

---

### 2. Global Un (Konya - Gıda)

**Admin Hesabı:**
- **Şirket:** Global Un (Konya)
- **Email:** `admin@globalun.com`
- **Şifre:** `demo123`
- **Rol:** ADMIN

**Sales Hesabı:**
- **Şirket:** Global Un (Konya)
- **Email:** `sales@globalun.com`
- **Şifre:** `demo123`
- **Rol:** SALES

---

### 3. ZahirTech (İstanbul - Yazılım)

**Admin Hesabı:**
- **Şirket:** ZahirTech (İstanbul)
- **Email:** `admin@zahirtech.com`
- **Şifre:** `demo123`
- **Rol:** ADMIN

**Sales Hesabı:**
- **Şirket:** ZahirTech (İstanbul)
- **Email:** `sales@zahirtech.com`
- **Şifre:** `demo123`
- **Rol:** SALES

---

## 🎯 Hızlı Test İçin

### En Kolay Giriş (Tipplus Medikal Admin):

```
Şirket:    Tipplus Medikal (Ankara)
Email:          
Şifre:      demo123
```

---

## 📝 Email Formatları

Seed script email'leri şu formatta oluşturuyor:

- **Company Name:** `Tipplus Medikal`
  - **Format:** `admin@tipplusmedikal.com` (boşluklar kaldırılıyor)
  
- **Company Name:** `Global Un`
  - **Format:** `admin@globalun.com`
  
- **Company Name:** `ZahirTech`
  - **Format:** `admin@zahirtech.com`

**Not:** Email formatı: `admin@[company-name].com` (küçük harf, boşluklar kaldırılmış)

---

## ✅ Tüm Şifreler

**Tüm demo hesaplar için şifre:** `demo123`

---

## 🔧 Şirket İkişer Tane Geliyorsa

Bu sorun seed script'inin birden fazla kez çalıştırılmasından kaynaklanıyor. 

**Çözüm:**
1. Supabase Dashboard'da `Company` tablosunu aç
2. Duplicate şirketleri manuel olarak sil
3. Veya seed script'ini yeniden çalıştırmadan önce mevcut verileri temizle

**SQL ile Temizleme (Supabase SQL Editor):**
```sql
-- Tüm şirketleri sil (DİKKAT: Tüm veriler silinir!)
TRUNCATE TABLE "Company" CASCADE;

-- Sonra seed script'ini tekrar çalıştır
```







