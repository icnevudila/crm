# 🚀 Geliştirme Öncelik Listesi

**Tarih:** 2024  
**Durum:** 📋 Aktif Geliştirme

---

## 🔴 YÜKSEK ÖNCELİK (Hemen Yapılmalı)

### 1. Deal Listesi İyileştirmeleri
**Durum:** ❌ Eksik  
**Süre:** 2-3 saat

**Yapılacaklar:**
- ✅ Deal listesinde `priorityScore` kolonu ekle
- ✅ Deal listesinde `leadSource` kolonu ekle  
- ✅ Deal listesinde `isPriority` badge'i ekle (öncelikli deal'lar için)
- ✅ Priority score'a göre sıralama butonu ekle
- ✅ Lead source filtreleme dropdown'ı ekle

**Dosyalar:**
- `src/components/deals/DealList.tsx`
- `src/app/api/deals/route.ts` (leadSource parametresi ekle)

**Etki:** ⭐⭐⭐⭐⭐ Kullanıcılar deal'ları daha iyi analiz edebilir

---

### 2. Deal Detay Sayfası İyileştirmeleri
**Durum:** ❌ Eksik  
**Süre:** 1-2 saat

**Yapılacaklar:**
- ✅ Deal detay sayfasında `priorityScore` göster
- ✅ Deal detay sayfasında `leadSource` göster
- ✅ Deal detay sayfasında `isPriority` badge'i göster

**Dosyalar:**
- `src/app/[locale]/deals/[id]/page.tsx`
- `src/components/deals/DealDetailModal.tsx`

**Etki:** ⭐⭐⭐⭐ Kullanıcılar deal detaylarını daha iyi görebilir

---

### 3. Toast Notification Sistemi (Alert Yerine)
**Durum:** ⚠️ Kısmen (confirm() hala kullanılıyor)  
**Süre:** 2-3 saat

**Yapılacaklar:**
- ✅ `confirm()` kullanımlarını toast confirm dialog'a çevir
- ✅ Tüm `alert()` kullanımlarını toast'a çevir (varsa)
- ✅ Form başarı/hata mesajlarını toast'a çevir

**Dosyalar:**
- `src/components/deals/DealList.tsx` (confirm kullanımı var)
- `src/components/deals/DealDetailModal.tsx` (confirm kullanımı var)
- `src/components/shipments/ShipmentList.tsx` (confirm kullanımı var)
- `src/components/competitors/CompetitorList.tsx` (confirm kullanımı var)
- `src/components/meetings/MeetingList.tsx` (confirm kullanımı var)

**Etki:** ⭐⭐⭐⭐⭐ Daha modern ve kullanıcı dostu arayüz

---

### 4. Activity Feed Widget (Dashboard)
**Durum:** ❌ Eksik (ActivityList var ama dashboard'da yok)  
**Süre:** 2-3 saat

**Yapılacaklar:**
- ✅ Dashboard'a Activity Feed widget'ı ekle
- ✅ Son 24 saatteki aktiviteleri göster
- ✅ Kategori bazlı (Deals, Quotes, Tasks)
- ✅ Filtreleme (Bugün, Bu hafta, Tümü)
- ✅ Direkt ilgili kayda git

**Dosyalar:**
- `src/app/[locale]/dashboard/page.tsx`
- `src/components/activity/ActivityFeedWidget.tsx` (yeni)
- `src/app/api/analytics/recent-activities/route.ts` (zaten var)

**Etki:** ⭐⭐⭐⭐ Kullanıcılar ne olduğunu tek bakışta görebilir

---

## 🟡 ORTA ÖNCELİK (Yakında Yapılmalı)

### 5. Email Templates Sayfası (UI)
**Durum:** ❌ Eksik (Backend hazır, UI yok)  
**Süre:** 3-4 saat

**Yapılacaklar:**
- ✅ Email templates sayfası oluştur (`/email-templates`)
- ✅ Email template listesi göster
- ✅ Email template form component'i (oluşturma/düzenleme)
- ✅ Template editor (basit textarea + variable helper)

**Dosyalar:**
- `src/app/[locale]/email-templates/page.tsx` (yeni)
- `src/components/email-templates/EmailTemplateList.tsx` (yeni)
- `src/components/email-templates/EmailTemplateForm.tsx` (yeni)

**Etki:** ⭐⭐⭐⭐ Kullanıcılar email template'leri yönetebilir

---

### 6. Smart Suggestions Widget (Dashboard)
**Durum:** ❌ Eksik  
**Süre:** 4-5 saat

**Yapılacaklar:**
- ✅ Dashboard'a Smart Suggestions widget'ı ekle
- ✅ "Bugün yapılacaklar" listesi
- ✅ Öncelik bazlı sıralama
- ✅ Tek tıkla işlem yap

**Örnek Öneriler:**
- 🔥 3 teklifin onay bekliyor → Görüntüle
- 💡 5 müşteri ile 7 gündür görüşmedin → Takip Et
- ⚠️ Yarın son gün: "Proje Planlama" görevi → Görüntüle

**Dosyalar:**
- `src/app/[locale]/dashboard/page.tsx`
- `src/components/dashboard/SmartSuggestionsWidget.tsx` (yeni)
- `src/app/api/analytics/smart-suggestions/route.ts` (yeni)

**Etki:** ⭐⭐⭐⭐⭐ Üretkenlik artışı

---

### 7. Real-time Notifications
**Durum:** ❌ Eksik  
**Süre:** 3-4 saat

**Yapılacaklar:**
- ✅ Supabase Realtime subscriptions ekle
- ✅ Yeni bildirim geldiğinde anında göster (toast)
- ✅ Bildirim sayısı badge'i güncelle
- ✅ Notification Center dropdown güncelle

**Dosyalar:**
- `src/components/layout/Header.tsx` (realtime subscription)
- `src/components/notifications/NotificationMenu.tsx` (realtime update)
- `src/hooks/useRealtimeNotifications.ts` (yeni)

**Etki:** ⭐⭐⭐⭐⭐ Kullanıcılar hiçbir şeyi kaçırmaz

---

### 8. Keyboard Shortcuts (Genişletilmiş)
**Durum:** ⚠️ Kısmen (Global Search var, diğerleri yok)  
**Süre:** 2-3 saat

**Yapılacaklar:**
- ✅ `Ctrl+K` → Global Search (zaten var, feature flag aktif et)
- ✅ `Ctrl+N` → Yeni kayıt oluştur (hangi modüldeysen)
- ✅ `Ctrl+F` → Filtreleme modu
- ✅ `Esc` → Modaldan çık / Aramayı temizle
- ✅ `Ctrl+/` → Yardım (tüm kısayolları göster)

**Dosyalar:**
- `src/components/layout/Header.tsx` (Global Search feature flag)
- `src/components/keyboard/KeyboardShortcuts.tsx` (yeni)
- `src/app/[locale]/layout.tsx` (keyboard handler)

**Etki:** ⭐⭐⭐⭐ Hız artışı

---

## 🟢 DÜŞÜK ÖNCELİK (Gelecekte)

### 9. Bulk Actions (Toplu İşlemler)
**Durum:** ⚠️ Component var ama kullanılmıyor  
**Süre:** 3-4 saat

**Yapılacaklar:**
- ✅ Checkbox selection (liste component'lerinde)
- ✅ Bulk delete
- ✅ Bulk status update
- ✅ Bulk export
- ✅ Selection counter

**Etki:** ⭐⭐⭐⭐ Zaman tasarrufu

---

### 10. Advanced Search Modal
**Durum:** ❌ Eksik  
**Süre:** 4-5 saat

**Yapılacaklar:**
- ✅ Gelişmiş arama modal'ı
- ✅ Çoklu filtre kombinasyonları
- ✅ Arama geçmişi
- ✅ Kayıtlı aramalar

**Etki:** ⭐⭐⭐ Güçlü arama özelliği

---

## 📊 ÖNCELİK MATRİSİ

| Özellik | Öncelik | Süre | Etki | Durum |
|---------|---------|------|------|-------|
| Deal Listesi İyileştirmeleri | 🔴 Yüksek | 2-3 saat | ⭐⭐⭐⭐⭐ | ❌ Eksik |
| Deal Detay Sayfası İyileştirmeleri | 🔴 Yüksek | 1-2 saat | ⭐⭐⭐⭐ | ❌ Eksik |
| Toast Notification Sistemi | 🔴 Yüksek | 2-3 saat | ⭐⭐⭐⭐⭐ | ⚠️ Kısmen |
| Activity Feed Widget | 🔴 Yüksek | 2-3 saat | ⭐⭐⭐⭐ | ❌ Eksik |
| Email Templates Sayfası | 🟡 Orta | 3-4 saat | ⭐⭐⭐⭐ | ❌ Eksik |
| Smart Suggestions Widget | 🟡 Orta | 4-5 saat | ⭐⭐⭐⭐⭐ | ❌ Eksik |
| Real-time Notifications | 🟡 Orta | 3-4 saat | ⭐⭐⭐⭐⭐ | ❌ Eksik |
| Keyboard Shortcuts | 🟡 Orta | 2-3 saat | ⭐⭐⭐⭐ | ⚠️ Kısmen |
| Bulk Actions | 🟢 Düşük | 3-4 saat | ⭐⭐⭐⭐ | ⚠️ Hazır ama kullanılmıyor |
| Advanced Search | 🟢 Düşük | 4-5 saat | ⭐⭐⭐ | ❌ Eksik |

---

## 🎯 ÖNERİLEN BAŞLANGIÇ PLANI

### Faz 1: Hızlı Kazanımlar (1 Gün)
1. ✅ **Deal Listesi İyileştirmeleri** - Priority score, lead source kolonları
2. ✅ **Deal Detay Sayfası İyileştirmeleri** - Yeni alanlar
3. ✅ **Toast Notification Sistemi** - Confirm dialog'ları toast'a çevir

**Toplam Süre:** ~6 saat  
**Etki:** Kullanıcılar deal'ları daha iyi analiz edebilir + Modern UI

---

### Faz 2: Dashboard İyileştirmeleri (1 Gün)
4. ✅ **Activity Feed Widget** - Dashboard'a aktivite akışı
5. ✅ **Smart Suggestions Widget** - Akıllı öneriler
6. ✅ **Keyboard Shortcuts** - Global Search aktif et + diğer kısayollar

**Toplam Süre:** ~8 saat  
**Etki:** Kullanıcılar ne yapması gerektiğini bilir + Hız artışı

---

### Faz 3: Real-time & Email (1 Gün)
7. ✅ **Real-time Notifications** - Anında bildirimler
8. ✅ **Email Templates Sayfası** - Template yönetimi

**Toplam Süre:** ~7 saat  
**Etki:** Kullanıcılar hiçbir şeyi kaçırmaz + Email yönetimi

---

## 💡 HANGİSİNDEN BAŞLAYALIM?

Öneri: **Faz 1'den başla** - Hızlı kazanımlar, kullanıcılar hemen fark eder!

1. **Deal Listesi İyileştirmeleri** - Kullanıcılar deal'ları daha iyi görebilir
2. **Deal Detay Sayfası İyileştirmeleri** - Detayları tam görebilir
3. **Toast Notification Sistemi** - Modern UI, kullanıcı memnuniyeti

Hangi özellikten başlamak istersiniz? 🚀



