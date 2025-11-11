# 📍 İŞ AKIŞI ŞEMASI NEREDE GÖZÜKÜYOR?

## 🎯 Şemanın Göründüğü Yerler

### ✅ 1. Deal Detay Sayfası
**URL:** `/deals/[id]` (örnek: `/deals/123`)

**Nerede:**
- Sayfa başlığından sonra
- KPI kartlarından önce
- Büyük, renkli bir card içinde

**Örnek:**
```
┌─────────────────────────────────────────┐
│ ← Geri  Proje A Fırsatı        [WON]   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│      📋 Fırsat İş Akışı                 │
├─────────────────────────────────────────┤
│                                         │
│  ✓ Potansiyel → ✓ İletişimde →        │
│  ✓ Teklif → 🔵 Pazarlık → Kazanıldı   │
│              [Mevcut Aşama]            │
│                                         │
│  ⚠️ Gereklilikler:                     │
│  • Fiyat görüşmelerini tamamlayın      │
│  • Şartları netleştirin                 │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Değer: 50,000 TRY    Win: 75%         │
└─────────────────────────────────────────┘
```

---

### ✅ 2. Quote Detay Sayfası
**URL:** `/quotes/[id]` (örnek: `/quotes/456`)

**Nerede:**
- Sayfa başlığından sonra
- EXPIRED uyarısından sonra (varsa)
- Info kartlarından önce

**Örnek:**
```
┌─────────────────────────────────────────┐
│ ← Geri  Teklif - Proje A      [SENT]   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│      📋 Teklif İş Akışı                 │
├─────────────────────────────────────────┤
│                                         │
│  ✓ Taslak → 🔵 Gönderildi → Onaylandı │
│         [Mevcut Aşama]                 │
│                                         │
│  ⚠️ Gereklilikler:                     │
│  • Müşteri onayını bekleyin            │
│  • Takip görüşmesi yapın               │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Toplam: 50,000 TRY                     │
└─────────────────────────────────────────┘
```

---

### ✅ 3. Invoice Detay Sayfası
**URL:** `/invoices/[id]` (örnek: `/invoices/789`)

**Nerede:**
- Sayfa başlığından sonra
- OVERDUE uyarısından sonra (varsa)
- Sevkiyat bilgisinden önce

**Örnek:**
```
┌─────────────────────────────────────────┐
│ ← Geri  Fatura #INV-2024-0001  [SENT] │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│      📋 Fatura İş Akışı                 │
├─────────────────────────────────────────┤
│                                         │
│  ✓ Taslak → 🔵 Gönderildi → Ödendi    │
│         [Mevcut Aşama]                 │
│                                         │
│  ⚠️ Gereklilikler:                     │
│  • Ödeme yapılmasını bekleyin          │
│  • Vade tarihini takip edin            │
│  • Gerekirse hatırlatma gönderin       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Toplam: 50,000 TRY                     │
└─────────────────────────────────────────┘
```

---

## 📱 Mobil Görünüm

Mobil'de şema **dikey** olarak gösteriliyor:

```
┌─────────────────────┐
│  📋 Fırsat İş Akışı │
├─────────────────────┤
│                     │
│  ✓ Potansiyel      │
│  │  Yeni fırsat    │
│  │                  │
│  ✓ İletişimde      │
│  │  Görüşüldü      │
│  │                  │
│  🔵 Teklif          │
│  │  Teklif hazır   │
│  │  [Mevcut Aşama] │
│  │                  │
│  │  ⚠️ Gerekli:    │
│  │  • Quote oluştur│
│  │  • Fiyat belirle│
│  │                  │
│  🔒 Pazarlık        │
│     Kilitli         │
└─────────────────────┘
```

---

## 🎨 Renk Kodları

### Adım Durumları:
- **✓ Yeşil:** Tamamlanmış adım
- **🔵 Mavi (yanıp sönen):** Mevcut aşama
- **⚪ Beyaz:** Gelecek adım
- **🔒 Gri:** Kilitli adım (geçilemez)

### Bildirim Renkleri:
- **⚠️ Sarı:** Gereklilikler/uyarılar
- **🎉 Yeşil:** Başarı mesajları
- **❌ Kırmızı:** Hata mesajları

---

## 🚀 Test Etmek İçin

### 1. Deal Detay Sayfası:
```
1. Deals sayfasına git: /deals
2. Herhangi bir fırsat kartına tıkla
3. Detay sayfasında şemayı gör
```

### 2. Quote Detay Sayfası:
```
1. Quotes sayfasına git: /quotes
2. Herhangi bir teklif satırına tıkla
3. Detay sayfasında şemayı gör
```

### 3. Invoice Detay Sayfası:
```
1. Invoices sayfasına git: /invoices
2. Herhangi bir fatura satırına tıkla
3. Detay sayfasında şemayı gör
```

---

## ❓ Şema Görünmüyorsa?

### Kontrol Et:
1. ✅ Frontend build edildi mi? (`npm run build`)
2. ✅ Tarayıcı cache'i temizlendi mi? (Ctrl+F5)
3. ✅ Console'da hata var mı? (F12 → Console)
4. ✅ Component import edildi mi? (`WorkflowStepper`)

### Dosyaları Kontrol Et:
```bash
# Component var mı?
src/components/ui/WorkflowStepper.tsx

# Workflow steps var mı?
src/lib/workflowSteps.ts

# Detay sayfaları güncel mi?
src/app/[locale]/deals/[id]/page.tsx
src/app/[locale]/quotes/[id]/page.tsx
src/app/[locale]/invoices/[id]/page.tsx
```

---

## 🔍 Görsel Örnek

### Deal Detay Sayfasında Şema:

**Şemanın Konumu:**
```
[Header]
  ← Geri | Proje A Fırsatı | [NEGOTIATION]

[Workflow Stepper Card] ← BURAYA BAKACAKSIN!
  📋 Fırsat İş Akışı
  ✓ Potansiyel → ✓ İletişimde → ✓ Teklif → 🔵 Pazarlık → Kazanıldı
  
  ⚠️ Gereklilikler:
  • Fiyat görüşmelerini tamamlayın
  • Şartları netleştirin

[Info Cards]
  Değer: 50,000 TRY | Win: 75% | ...

[Detaylar]
  ...
```

---

## 💡 İpucu

Şema **her zaman** sayfanın üst kısmında, info kartlarından **hemen önce** gösterilir!

Gradient arkaplan (indigo-purple) ve büyük bir card olarak göründüğü için **gözden kaçmaz**!

---

**Hemen test et ve şemayı gör! 🚀**

