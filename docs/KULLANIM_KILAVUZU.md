# 🚀 Yeni Özellikler Kullanım Kılavuzu

## 📋 İçindekiler
1. [SQL Migration Kurulumu](#1-sql-migration-kurulumu)
2. [Satış Rozetleri Sistemi](#2-satış-rozetleri-sistemi)
3. [Satış Streak Takibi](#3-satış-streak-takibi)
4. [Klavye Kısayolları](#4-klavye-kısayolları)
5. [Takım Sohbeti](#5-takım-sohbeti)
6. [WhatsApp Entegrasyonu](#6-whatsapp-entegrasyonu)

---

## 1. SQL Migration Kurulumu

### Adım 1: Supabase Dashboard'a Giriş
1. [Supabase Dashboard](https://app.supabase.com) → Projenizi seçin
2. Sol menüden **SQL Editor** → **New Query** tıklayın

### Adım 2: Migration Dosyasını Çalıştırma
1. `supabase/migrations/114_complete_new_features.sql` dosyasını açın
2. **Tüm içeriği kopyalayın** (Ctrl+A → Ctrl+C)
3. Supabase SQL Editor'e yapıştırın (Ctrl+V)
4. **RUN** butonuna tıklayın veya `Ctrl+Enter` basın

### Adım 3: Başarı Kontrolü
```sql
-- Tabloların oluşturulduğunu kontrol edin
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('UserBadge', 'UserStreak', 'ChatChannel', 'ChatMessage');
```

**Beklenen Sonuç:** 4 tablo görünmeli:
- `UserBadge`
- `UserStreak`
- `ChatChannel`
- `ChatMessage`

---

## 2. Satış Rozetleri Sistemi

### Nasıl Çalışır?
- Deal **WON** olduğunda otomatik rozet kazanırsınız
- Quote **ACCEPTED** olduğunda rozet kazanabilirsiniz

### Rozet Türleri
| Rozet | Kazanma Şartı | Açıklama |
|-------|---------------|----------|
| `FIRST_SALE` | İlk deal'i kazandığınızda | 🎯 İlk Satış |
| `TEN_SALES` | 10 deal kazandığınızda | 🔥 10 Satış |
| `FIFTY_SALES` | 50 deal kazandığınızda | ⭐ 50 Satış |
| `HUNDRED_SALES` | 100 deal kazandığınızda | 💎 100 Satış |
| `QUOTE_MASTER_10` | 10 quote kabul edildiğinde | 📝 Teklif Ustası |

### Nerede Görünür?
- **Dashboard** sayfasında (`/[locale]/dashboard`)
- Sağ üstte **Rozetler** kartı olarak görünür
- Her rozet için ikon ve açıklama gösterilir

### Test Etme
1. Dashboard'a gidin
2. Bir **Deal** oluşturun ve **stage**'i **WON** yapın
3. Dashboard'da rozet kartını kontrol edin
4. İlk satış rozeti (`FIRST_SALE`) görünmeli

### API Kullanımı
```typescript
// Rozetleri çekme
const { data: badges } = await fetch('/api/badges')
```

---

## 3. Satış Streak Takibi

### Nasıl Çalışır?
- Her gün aktivite yaptığınızda streak artar
- Deal kazandığınızda, müşteri oluşturduğunuzda, görev tamamladığınızda streak güncellenir

### Streak Türleri
- **Günlük Streak**: Ardışık günlerde aktivite
- **Haftalık Streak**: Ardışık haftalarda aktivite
- **Aylık Streak**: Ardışık aylarda aktivite

### Nerede Görünür?
- **Dashboard** sayfasında (`/[locale]/dashboard`)
- Sağ üstte **Streak** kartı olarak görünür
- Günlük/haftalık/aylık streak sayıları gösterilir

### Test Etme
1. Dashboard'a gidin
2. Bir **Customer** oluşturun
3. Dashboard'da streak kartını kontrol edin
4. Günlük streak 1 olmalı
5. Ertesi gün tekrar aktivite yapın → Streak 2 olmalı

### Leaderboard
```typescript
// Streak leaderboard'u çekme
const { data: leaderboard } = await fetch('/api/streaks/leaderboard')
```

---

## 4. Klavye Kısayolları

### Kısayollar Listesi

| Kısayol | Açıklama |
|---------|----------|
| `?` | Tüm kısayolları göster (Modal açılır) |
| `G + D` | Dashboard'a git |
| `G + C` | Customers'a git |
| `G + Q` | Quotes'a git |
| `G + I` | Invoices'a git |
| `G + T` | Tasks'a git |

### Nasıl Kullanılır?
1. Herhangi bir sayfada `?` tuşuna basın
2. Kısayollar modal'ı açılır
3. İstediğiniz kısayolu kullanın:
   - `G` tuşuna basın ve basılı tutun
   - Sonra `D`, `C`, `Q`, `I` veya `T` tuşuna basın

### Test Etme
1. Herhangi bir sayfada `?` tuşuna basın
2. Modal açılmalı ve tüm kısayollar listelenmeli
3. `G + D` ile Dashboard'a gidin
4. `G + C` ile Customers'a gidin

---

## 5. Takım Sohbeti

### Nasıl Çalışır?
- Her müşteri için otomatik bir sohbet kanalı oluşturulur
- Takım üyeleri müşteri hakkında sohbet edebilir
- Mesajlar gerçek zamanlı görünür (SWR cache ile)

### Nerede Görünür?
- **Customer Detail Modal** içinde
- Müşteri detay sayfasında **Sohbet** sekmesi olarak görünür

### Nasıl Kullanılır?
1. **Customers** listesinden bir müşteriye tıklayın
2. Customer Detail Modal açılır
3. **Sohbet** sekmesine tıklayın
4. Mesaj yazın ve **Gönder** butonuna tıklayın
5. Mesajlar anında görünür

### Özellikler
- ✅ Mesaj gönderme
- ✅ Mesaj silme (kendi mesajlarınızı)
- ✅ Mesaj düzenleme (kendi mesajlarınızı)
- ✅ Yanıt verme (reply)
- ✅ Dosya ekleme (gelecekte)

### Test Etme
1. Customers listesinden bir müşteriye tıklayın
2. Customer Detail Modal açılır
3. **Sohbet** sekmesine tıklayın
4. Bir mesaj yazın ve gönderin
5. Mesaj listede görünmeli

---

## 6. WhatsApp Entegrasyonu

### Nasıl Çalışır?
- Müşteri telefon numarasından WhatsApp mesajı gönderebilirsiniz
- Şimdilik **mock** response döndürür (gerçek WhatsApp API entegrasyonu için Twilio veya WhatsApp Business API gerekir)

### Nerede Görünür?
- **Customer Detail Modal** içinde
- İletişim Bilgileri bölümünde telefon numarası yanında **WhatsApp** butonu

### Nasıl Kullanılır?
1. **Customers** listesinden bir müşteriye tıklayın
2. Customer Detail Modal açılır
3. İletişim Bilgileri bölümünde telefon numarası yanında **WhatsApp** butonuna tıklayın
4. WhatsApp mesaj modal'ı açılır
5. Telefon numarasını kontrol edin (otomatik doldurulur)
6. Mesajınızı yazın
7. **Gönder** butonuna tıklayın

### Telefon Numarası Formatı
- Ülke kodu ile birlikte girin
- Örnek: `905551234567` (Türkiye için)
- Sadece rakamlar kabul edilir

### Test Etme
1. Customers listesinden telefon numarası olan bir müşteriye tıklayın
2. Customer Detail Modal açılır
3. Telefon numarası yanında **WhatsApp** butonuna tıklayın
4. Modal açılmalı ve telefon numarası otomatik doldurulmalı
5. Bir mesaj yazın ve gönderin
6. Başarı mesajı görünmeli

### Gerçek WhatsApp Entegrasyonu İçin
```typescript
// src/app/api/integrations/whatsapp/send/route.ts
// Şu satırı değiştirin:
// Mock response yerine gerçek WhatsApp API çağrısı yapın
// Örnek: Twilio WhatsApp API veya WhatsApp Business API
```

---

## 🧪 Genel Test Senaryosu

### 1. Migration Testi
```sql
-- Tabloları kontrol edin
SELECT COUNT(*) FROM "UserBadge";
SELECT COUNT(*) FROM "UserStreak";
SELECT COUNT(*) FROM "ChatChannel";
SELECT COUNT(*) FROM "ChatMessage";
```

### 2. Rozet Testi
1. Dashboard'a gidin
2. Bir Deal oluşturun ve **WON** yapın
3. Dashboard'da rozet kartını kontrol edin
4. `FIRST_SALE` rozeti görünmeli

### 3. Streak Testi
1. Dashboard'a gidin
2. Bir Customer oluşturun
3. Dashboard'da streak kartını kontrol edin
4. Günlük streak 1 olmalı

### 4. Sohbet Testi
1. Customers listesinden bir müşteriye tıklayın
2. Customer Detail Modal açılır
3. **Sohbet** sekmesine tıklayın
4. Bir mesaj yazın ve gönderin
5. Mesaj listede görünmeli

### 5. WhatsApp Testi
1. Customers listesinden telefon numarası olan bir müşteriye tıklayın
2. Customer Detail Modal açılır
3. Telefon numarası yanında **WhatsApp** butonuna tıklayın
4. Modal açılmalı

### 6. Klavye Kısayolları Testi
1. Herhangi bir sayfada `?` tuşuna basın
2. Modal açılmalı
3. `G + D` ile Dashboard'a gidin
4. `G + C` ile Customers'a gidin

---

## 🔧 Sorun Giderme

### Migration Hatası
**Sorun:** `relation "User" does not exist`
**Çözüm:** Migration dosyası otomatik olarak `User` ve `Company` tablolarını oluşturur. Eğer hala hata alıyorsanız, önce bu tabloları oluşturun.

### Rozet Görünmüyor
**Sorun:** Deal WON yaptım ama rozet görünmüyor
**Çözüm:** 
1. Dashboard'ı yenileyin (F5)
2. API endpoint'ini kontrol edin: `/api/badges`
3. Browser console'da hata var mı kontrol edin

### Streak Güncellenmiyor
**Sorun:** Aktivite yaptım ama streak artmıyor
**Çözüm:**
1. Dashboard'ı yenileyin (F5)
2. API endpoint'ini kontrol edin: `/api/streaks`
3. `lastActivityDate` kontrol edin (bugünün tarihi olmalı)

### Sohbet Mesajları Görünmüyor
**Sorun:** Mesaj gönderdim ama görünmüyor
**Çözüm:**
1. Sayfayı yenileyin (F5)
2. API endpoint'ini kontrol edin: `/api/chat/messages`
3. Browser console'da hata var mı kontrol edin

---

## 📞 Destek

Sorun yaşıyorsanız:
1. Browser console'u açın (F12)
2. Hataları kontrol edin
3. Network tab'ında API isteklerini kontrol edin
4. Supabase Dashboard'da RLS policies'i kontrol edin

---

## ✅ Checklist

Migration sonrası kontrol listesi:
- [ ] `UserBadge` tablosu oluşturuldu mu?
- [ ] `UserStreak` tablosu oluşturuldu mu?
- [ ] `ChatChannel` tablosu oluşturuldu mu?
- [ ] `ChatMessage` tablosu oluşturuldu mu?
- [ ] Dashboard'da rozet kartı görünüyor mu?
- [ ] Dashboard'da streak kartı görünüyor mu?
- [ ] Customer Detail Modal'da sohbet sekmesi görünüyor mu?
- [ ] Customer Detail Modal'da WhatsApp butonu görünüyor mu?
- [ ] Klavye kısayolları çalışıyor mu?

---

**Son Güncelleme:** 2024
**Versiyon:** 1.0.0


