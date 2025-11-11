# 🔴 Kritik Eksik Otomasyonlar Listesi

**Tarih:** 2024  
**Durum:** ⚠️ Tespit Edildi - Uygulanacak

---

## 📋 ÖZET

Sistemdeki tüm kritik eksik otomasyonlar tespit edildi ve uygulanacak.

---

## 🔴 YÜKSEK ÖNCELİK (Kritik - Hemen Yapılmalı)

### 1. **Deal WON → Otomatik Quote Oluşturma** 🔴
- **Durum:** ❌ Eksik
- **Açıklama:** Deal WON olduğunda otomatik Quote oluşturulmalı
- **Dosya:** `src/app/api/deals/[id]/route.ts`
- **Satır:** 279-319 (Deal CLOSED kontrolünden sonra)

---

## 🟡 ORTA ÖNCELİK (Yakında Yapılmalı)

### 2. **Quote EXPIRED → Otomatik Status Güncelleme** 🟡
- **Durum:** ⚠️ Kontrol Edilmeli (trigger var ama scheduled job yok)
- **Açıklama:** Her gün validUntil geçmiş Quote'ları EXPIRED yapmalı
- **Dosya:** `src/app/api/cron/check-expired-quotes/route.ts` (YENİ)
- **Schedule:** Her gün 09:00

### 3. **Task Geç Kaldı/Yaklaşıyor Scheduled Job** 🟡
- **Durum:** ❌ Eksik
- **Açıklama:** Her gün dueDate geçmiş ve DONE olmayan Task'lar için bildirim
- **Dosya:** `src/app/api/cron/check-overdue-tasks/route.ts` (YENİ)
- **Schedule:** Her gün 09:00

### 4. **Ticket Geç Kaldı Scheduled Job** 🟡
- **Durum:** ❌ Eksik
- **Açıklama:** Her gün 7 günden uzun süredir açık Ticket'lar için bildirim
- **Dosya:** `src/app/api/cron/check-overdue-tickets/route.ts` (YENİ)
- **Schedule:** Her gün 09:00

### 5. **Düşük Stok Scheduled Job** 🟡
- **Durum:** ⚠️ Kontrol Edilmeli (trigger var ama scheduled job yok)
- **Açıklama:** Her gün minimum stok seviyesinin altındaki ürünler için bildirim
- **Dosya:** `src/app/api/cron/check-low-stock/route.ts` (YENİ)
- **Schedule:** Her gün 09:00

### 6. **Contract Yenileme Scheduled Job** 🟡
- **Durum:** ⚠️ Kontrol Edilmeli (trigger var ama scheduled job yok)
- **Açıklama:** Her gün yakında yenilenecek Contract'lar için bildirim
- **Dosya:** `src/app/api/cron/check-contract-renewals/route.ts` (YENİ)
- **Schedule:** Her gün 09:00

---

## 📊 ÖZET TABLO

| # | Otomasyon | Öncelik | Durum | Dosya |
|---|-----------|---------|-------|-------|
| 1 | Deal WON → Otomatik Quote | 🔴 Yüksek | ❌ Eksik | `deals/[id]/route.ts` |
| 2 | Quote EXPIRED Scheduled Job | 🟡 Orta | ⚠️ Kontrol | `cron/check-expired-quotes` |
| 3 | Task Geç Kaldı Scheduled Job | 🟡 Orta | ❌ Eksik | `cron/check-overdue-tasks` |
| 4 | Ticket Geç Kaldı Scheduled Job | 🟡 Orta | ❌ Eksik | `cron/check-overdue-tickets` |
| 5 | Düşük Stok Scheduled Job | 🟡 Orta | ⚠️ Kontrol | `cron/check-low-stock` |
| 6 | Contract Yenileme Scheduled Job | 🟡 Orta | ⚠️ Kontrol | `cron/check-contract-renewals` |

**Toplam:** 6 kritik eksik otomasyon

---

## ✅ UYGULAMA PLANI

1. **Deal WON → Otomatik Quote** (Yüksek Öncelik)
2. **Scheduled Jobs** (Orta Öncelik - 5 adet)

---

**Rapor Tarihi:** 2024  
**Durum:** ⚠️ Uygulanacak










