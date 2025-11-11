# 🔄 KANBAN İŞ AKIŞI ANALİZİ VE ÖNERİLER

**Tarih:** 2024  
**Durum:** 🎯 Analiz Tamamlandı - Uygulama Hazır

---

## 📋 MEVCUT DURUM

### **Şu Anki Sorunlar:**
- ❌ Kullanıcı kafasına göre stage değiştirebiliyor
- ❌ DRAFT'tan direkt PAID'e geçilebiliyor (mantıksız)
- ❌ WON deal silinebiliyor (veri kaybı riski)
- ❌ ACCEPTED quote düzenlenebiliyor (invoice zaten oluşmuş!)
- ❌ İş akışı kuralları yok

---

## 🎯 YENİ İŞ AKIŞI ŞEMASı

### **1️⃣ DEAL (FIRSAT) İŞ AKIŞI**

```
┌─────────────────────────────────────────────────────────────┐
│                    DEAL WORKFLOW                            │
└─────────────────────────────────────────────────────────────┘

LEAD → CONTACTED → PROPOSAL → NEGOTIATION → WON/LOST
  ↓        ↓           ↓            ↓          ↓
(Yeni)  (İlk   (Teklif      (Pazarlık)  (Kazanıldı/
        Temas)  Hazır)                    Kaybedildi)

🔒 KURALLAR:
1. ✅ LEAD → CONTACTED (İleri gidebilir)
2. ✅ CONTACTED → PROPOSAL (İleri gidebilir)
3. ✅ PROPOSAL → NEGOTIATION (İleri gidebilir)
4. ✅ NEGOTIATION → WON (İleri gidebilir)
5. ❌ WON → GERİ GİDEMEZ (İmmutable - değiştirilemez)
6. ❌ LOST → GERİ GİDEMEZ (İmmutable - değiştirilemez)
7. ❌ WON/LOST → SİLİNEMEZ (Veri kaybı önleme)
8. ⚠️ PROPOSAL'dan direkt WON'a atlama YOK (Pazarlık zorunlu)

🤖 OTOMASYONLAR:
1. Deal WON → Otomatik Contract DRAFT oluştur (✅ Mevcut)
2. Deal WON → Otomatik approval talebi (value > 100K) (✅ Mevcut)
3. Deal LOST → lostReason ZORUNLU (🆕 YENİ)
```

---

### **2️⃣ QUOTE (TEKLİF) İŞ AKIŞI**

```
┌─────────────────────────────────────────────────────────────┐
│                    QUOTE WORKFLOW                           │
└─────────────────────────────────────────────────────────────┘

DRAFT → SENT → ACCEPTED/REJECTED
  ↓       ↓          ↓
(Taslak) (Gönderildi) (Kabul/Red)

🔒 KURALLAR:
1. ✅ DRAFT → SENT (İleri gidebilir)
2. ✅ SENT → ACCEPTED (İleri gidebilir)
3. ✅ SENT → REJECTED (İleri gidebilir)
4. ❌ DRAFT → ACCEPTED (Atlama YOK - önce SENT olmalı)
5. ❌ ACCEPTED → GERİ GİDEMEZ (İmmutable - invoice oluşmuş)
6. ❌ ACCEPTED → DÜZENLENEMEZ (Revision oluştur)
7. ❌ ACCEPTED/REJECTED → SİLİNEMEZ (Veri kaybı önleme)
8. ⚠️ SENT > 30 gün → EXPIRED (Otomatik)

🤖 OTOMASYONLAR:
1. Quote SENT → customer email gönder (🆕 YENİ)
2. Quote ACCEPTED → Otomatik Invoice DRAFT oluştur (✅ Mevcut)
3. Quote ACCEPTED → Otomatik Contract DRAFT oluştur (✅ Mevcut)
4. Quote ACCEPTED → Otomatik approval talebi (total > 50K) (✅ Mevcut)
5. Quote > 30 gün → EXPIRED status (🆕 YENİ)
```

---

### **3️⃣ INVOICE (FATURA) İŞ AKIŞI**

```
┌─────────────────────────────────────────────────────────────┐
│                   INVOICE WORKFLOW                          │
└─────────────────────────────────────────────────────────────┘

DRAFT → SENT → PAID
  ↓       ↓       ↓
(Taslak) (Gönderildi) (Ödendi)
           ↓
        OVERDUE
        (Vadesi Geçti)

🔒 KURALLAR:
1. ✅ DRAFT → SENT (İleri gidebilir)
2. ✅ SENT → PAID (İleri gidebilir)
3. ❌ DRAFT → PAID (Atlama YOK - önce SENT olmalı)
4. ❌ PAID → GERİ GİDEMEZ (İmmutable - finance kaydı oluşmuş)
5. ❌ PAID → DÜZENLENEMEZ (Credit note oluştur)
6. ❌ PAID → SİLİNEMEZ (Mali kayıt - silinemez)
7. ⚠️ SENT > dueDate → OVERDUE (Otomatik)
8. ⚠️ quoteId varsa → DRAFT haricinde düzenlenemez

🤖 OTOMASYONLAR:
1. Invoice SENT → customer email gönder (🆕 YENİ)
2. Invoice PAID → Otomatik Finance kaydı oluştur (✅ Mevcut)
3. Invoice > dueDate → OVERDUE status (🆕 YENİ)
4. Invoice PAID → Shipment oluştur (🆕 YENİ - OPSIYONEL)
```

---

### **4️⃣ CONTRACT (SÖZLEŞME) İŞ AKIŞI**

```
┌─────────────────────────────────────────────────────────────┐
│                  CONTRACT WORKFLOW                          │
└─────────────────────────────────────────────────────────────┘

DRAFT → ACTIVE → EXPIRED/TERMINATED
  ↓        ↓            ↓
(Taslak) (Aktif)    (Süresi Doldu/İptal)

🔒 KURALLAR:
1. ✅ DRAFT → ACTIVE (İleri gidebilir)
2. ✅ ACTIVE → TERMINATED (İptal edilebilir)
3. ❌ ACTIVE → GERİ GİDEMEZ (İmmutable - invoice oluşmuş)
4. ❌ EXPIRED/TERMINATED → DÜZENLENEMEZ (Renewal oluştur)
5. ❌ ACTIVE → SİLİNEMEZ (Veri kaybı önleme)
6. ⚠️ ACTIVE > endDate → EXPIRED (Otomatik)

🤖 OTOMASYONLAR:
1. Contract ACTIVE → Otomatik Invoice oluştur (✅ Mevcut)
2. Contract > endDate → EXPIRED (✅ Mevcut)
3. Contract 30 gün kala → Renewal notification (✅ Mevcut)
4. Contract auto-renew → Yeni contract oluştur (✅ Mevcut)
```

---

## 🚫 YASAK GEÇİŞLER TABLOSU

### **DEAL:**
| Mevcut Stage | İzin Verilen | Yasak |
|--------------|-------------|-------|
| LEAD | CONTACTED | PROPOSAL, NEGOTIATION, WON |
| CONTACTED | PROPOSAL | NEGOTIATION, WON |
| PROPOSAL | NEGOTIATION | WON (direkt) |
| NEGOTIATION | WON, LOST | - |
| WON | - | HER ŞEY (immutable) |
| LOST | - | HER ŞEY (immutable) |

### **QUOTE:**
| Mevcut Status | İzin Verilen | Yasak |
|---------------|-------------|-------|
| DRAFT | SENT | ACCEPTED, REJECTED |
| SENT | ACCEPTED, REJECTED | GERİ (DRAFT) |
| ACCEPTED | - | HER ŞEY (immutable) |
| REJECTED | - | HER ŞEY (immutable) |

### **INVOICE:**
| Mevcut Status | İzin Verilen | Yasak |
|---------------|-------------|-------|
| DRAFT | SENT | PAID, OVERDUE |
| SENT | PAID, CANCELLED | GERİ (DRAFT) |
| PAID | - | HER ŞEY (immutable) |
| OVERDUE | PAID, CANCELLED | GERİ (DRAFT) |
| CANCELLED | - | HER ŞEY (immutable) |

---

## 🎨 KANBAN SÜRÜKLEMESİ KURALLARI

### **Frontend Validasyon (Anında):**
```typescript
// Örnek: Deal stage değiştirme
function canDragDeal(currentStage: string, targetStage: string): boolean {
  const rules = {
    LEAD: ['CONTACTED'],
    CONTACTED: ['PROPOSAL'],
    PROPOSAL: ['NEGOTIATION'],
    NEGOTIATION: ['WON', 'LOST'],
    WON: [], // İmmutable
    LOST: [], // İmmutable
  }
  
  return rules[currentStage]?.includes(targetStage) || false
}

// Kullanıcı yasak geçiş yapmaya çalışırsa:
// ❌ "Bu aşamaya doğrudan geçiş yapılamaz. Önce [ÖNCEKI AŞAMA] olmalı."
```

### **Backend Validasyon (API):**
```typescript
// PUT /api/deals/:id
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  // ... auth checks
  
  const oldDeal = await fetchDeal(params.id)
  const newData = await request.json()
  
  // Stage değişim kontrolü
  if (oldDeal.stage !== newData.stage) {
    if (!isValidStageTransition(oldDeal.stage, newData.stage)) {
      return NextResponse.json(
        { error: `${oldDeal.stage} -> ${newData.stage} geçişi yapılamaz` },
        { status: 400 }
      )
    }
  }
  
  // Immutable kontrol
  if (isImmutable(oldDeal.stage)) {
    return NextResponse.json(
      { error: 'Bu fırsat artık değiştirilemez (WON/LOST)' },
      { status: 403 }
    )
  }
  
  // ... update logic
}
```

---

## 🔐 IMMUTABİLİTY KURALLARI

### **Değiştirilemez Durumlar:**
| Modül | Immutable Stages | Sebep |
|-------|-----------------|-------|
| **Deal** | WON, LOST | Sözleşme oluşmuş, veri bütünlüğü |
| **Quote** | ACCEPTED, REJECTED | Invoice oluşmuş, revizyon gerekir |
| **Invoice** | PAID, CANCELLED | Finance kaydı var, credit note gerekir |
| **Contract** | EXPIRED, TERMINATED | Yasal kayıt, renewal gerekir |

### **Silme Kuralları:**
| Modül | Silinebilir | Silinemez | Sebep |
|-------|------------|----------|-------|
| **Deal** | LEAD, CONTACTED, PROPOSAL | WON, LOST | Sözleşme/mali kayıt var |
| **Quote** | DRAFT | SENT, ACCEPTED, REJECTED | Invoice oluşmuş |
| **Invoice** | DRAFT | SENT, PAID, OVERDUE, CANCELLED | Mali kayıt, yasal zorunluluk |
| **Contract** | DRAFT | ACTIVE, EXPIRED, TERMINATED | Invoice oluşmuş, yasal kayıt |

---

## 🚀 UYGULAMA PLANI

### **Faz 1: Backend Validasyon (Kritik)**
```
1. ✅ Stage transition kuralları (API middleware)
2. ✅ Immutability kontrolleri (API middleware)
3. ✅ Delete korumaları (API endpoint)
4. ✅ Error messages (kullanıcı dostu)
```

### **Faz 2: Frontend Validasyon (UX)**
```
1. ✅ Kanban drag-drop kuralları
2. ✅ Disabled stages (gri, tıklanamaz)
3. ✅ Tooltip uyarıları ("Önce X olmalı")
4. ✅ Confirm dialoglar ("Bu değişiklik geri alınamaz")
```

### **Faz 3: Otomasyonlar (Bonus)**
```
1. ✅ Email notifications (SENT statuslarda)
2. ✅ Auto-expire (Quote > 30 gün)
3. ✅ Auto-overdue (Invoice > dueDate)
4. ✅ Auto-shipment (Invoice PAID)
```

---

## 📊 ÖNCELİKLENDİRME

### **PHASE 1 - KRİTİK (Bugün):**
1. 🔴 **Backend Stage Validation** (API middleware)
2. 🔴 **Immutability Kontrolleri** (WON/LOST/ACCEPTED/PAID)
3. 🔴 **Delete Korumaları** (Silinmemesi gereken kayıtlar)

**Süre:** 2-3 saat  
**Dosyalar:**
- `src/middleware/stageValidation.ts` (YENİ)
- `src/app/api/deals/[id]/route.ts` (GÜNCELLE)
- `src/app/api/quotes/[id]/route.ts` (GÜNCELLE)
- `src/app/api/invoices/[id]/route.ts` (GÜNCELLE)

---

### **PHASE 2 - YÜKSEK (Yarın):**
1. 🟠 **Frontend Kanban Kuralları** (Drag-drop validasyon)
2. 🟠 **UI Feedback** (Tooltips, disabled states)
3. 🟠 **Confirm Dialogs** (Geri alınamaz işlemler)

**Süre:** 2-3 saat  
**Dosyalar:**
- `src/components/deals/DealList.tsx` (GÜNCELLE)
- `src/components/quotes/QuoteList.tsx` (GÜNCELLE)
- `src/components/invoices/InvoiceList.tsx` (GÜNCELLE)
- `src/hooks/useStageValidation.ts` (YENİ)

---

### **PHASE 3 - ORTA (Gelecek):**
1. 🟡 **Email Notifications** (SENT statuslarda)
2. 🟡 **Auto-Expire/Overdue** (Cron job)
3. 🟡 **Activity Logs** (Stage değişim geçmişi)

**Süre:** 3-4 saat  

---

## 💡 KULLANICI DENEYİMİ SENARYOLARI

### **Senaryo 1: Yasak Geçiş (Frontend)**
```
Kullanıcı: Deal'i LEAD'den WON'a sürükledi
Sistem: ❌ "Bu aşamaya doğrudan geçiş yapılamaz. 
         Önce CONTACTED → PROPOSAL → NEGOTIATION aşamalarından geçmelisiniz."
Kanban: Kart geri döner (animasyonlu)
```

### **Senaryo 2: Yasak Geçiş (Backend)**
```
Kullanıcı: API ile DRAFT → PAID değiştirmeye çalıştı
Backend: ❌ 400 Bad Request
Response: { 
  error: "DRAFT -> PAID geçişi yapılamaz. Önce SENT olmalı.",
  allowedTransitions: ["SENT"]
}
```

### **Senaryo 3: Immutable Değişiklik**
```
Kullanıcı: WON deal'i düzenlemeye çalıştı
Backend: ❌ 403 Forbidden
Response: { 
  error: "Bu fırsat artık değiştirilemez (WON). Sözleşme oluşturulmuştur.",
  suggestion: "Yeni bir revizyon oluşturmak ister misiniz?"
}
UI: "Bu kayıt artık değiştirilemez" modal + "Yeni Kayıt Oluştur" butonu
```

### **Senaryo 4: Yasak Silme**
```
Kullanıcı: PAID invoice'i silmeye çalıştı
Backend: ❌ 403 Forbidden
Response: { 
  error: "Ödenmiş faturalar silinemez. Mali kayıt oluşturulmuştur.",
  suggestion: "İptal etmek için Credit Note oluşturabilirsiniz."
}
UI: "Bu kayıt silinemez" modal + "İptal Notu Oluştur" butonu
```

---

## 🎯 BAŞARILI SONUÇ:

### **Önce (Şu An):**
- ❌ Kullanıcı kafasına göre değiştiriyor
- ❌ Mantıksız geçişler yapılabiliyor
- ❌ Kritik kayıtlar silinebiliyor
- ❌ İş akışı kontrolsüz

### **Sonra (Uygulama Sonrası):**
- ✅ İş akışı kuralları var
- ✅ Sadece mantıklı geçişler yapılabiliyor
- ✅ Kritik kayıtlar korunuyor
- ✅ Kullanıcı yönlendiriliyor (tooltips)
- ✅ Veri bütünlüğü korunuyor
- ✅ Mali kayıtlar güvende

---

## 💬 ONAY:

**Şimdi ne yapayım?**

1. **PHASE 1'i uygulayalım mı?** (Backend validation - 2-3 saat)
   - Stage transition kuralları
   - Immutability kontrolleri
   - Delete korumaları

2. **HEPSİNİ uygulayalım mı?** (3 phase - 7-10 saat)
   - Backend + Frontend + Otomasyonlar

3. **Raporu incele, sonra karar ver mi?**

**Seninki karar! 🚀**


