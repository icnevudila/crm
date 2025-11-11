# 🚀 TAM OTOMASYON VE İŞ AKIŞI SİSTEMİ

**Tarih:** 2024  
**Durum:** ✅ TAMAMLANDI!

---

## 📋 ÖZET

Kullanıcılar artık her adımda:
- ✅ Nerede olduklarını görüyor
- ✅ Ne yapmaları gerektiğini biliyor
- ✅ Sonraki adımları öğreniyor
- ✅ Otomatik yönlendiriliyor
- ✅ Zorunlu alanları kontrol ediliyor

---

## 🎯 EKLENEN SİSTEMLER

### **1. Görsel İş Akışı Şeması** ✅
**Dosya:** `src/components/ui/WorkflowStepper.tsx`

**Özellikler:**
- Her detay sayfasında görsel şema
- Mevcut adım vurgulanmış
- Tamamlanan adımlar yeşil ✓
- Kilitli adımlar kilitle 🔒
- Gereklilikler uyarı ile gösterilir
- Mobil uyumlu (dikey/yatay)

**Örnek Görünüm:**
```
┌──────────────────────────────────────────────┐
│         Fırsat İş Akışı                      │
├──────────────────────────────────────────────┤
│                                              │
│  ✓ Potansiyel → ✓ İletişimde → 🔵 Teklif   │
│                                    ↓         │
│                         [Mevcut Aşama]      │
│                                              │
│  ⚠️ Gereklilikler:                          │
│  • Quote modülünden teklif oluşturun        │
│  • Fiyat ve ürünleri belirleyin             │
└──────────────────────────────────────────────┘
```

---

### **2. Backend Validasyonlar** ✅
**Dosya:** `supabase/migrations/044_workflow_validations.sql`

**Her aşamada kontrol ediliyor:**

#### **Deal (Fırsat):**
- LEAD → CONTACTED: Müşteri seçimi zorunlu
- CONTACTED → PROPOSAL: Quote önerilir
- PROPOSAL → NEGOTIATION: Pazarlık notları
- NEGOTIATION → WON: Fırsat değeri zorunlu
- LOST: lostReason zorunlu

#### **Quote (Teklif):**
- DRAFT → SENT: En az 1 ürün, müşteri, toplam tutar zorunlu
- SENT → ACCEPTED: Otomatik Invoice + Contract oluşturulur
- SENT → REJECTED: Revizyon önerilir

#### **Invoice (Fatura):**
- DRAFT → SENT: En az 1 ürün, müşteri, fatura numarası zorunlu
- SENT → PAID: Ödeme tarihi otomatik, Finance kaydı oluşturulur
- PAID → İmmutable (değiştirilemez)

#### **Contract (Sözleşme):**
- DRAFT → ACTIVE: Müşteri, tarihler, değer, sözleşme numarası zorunlu
- ACTIVE: Otomatik Invoice oluşturulur
- ACTIVE → İmmutable (değiştirilemez)

#### **Task (Görev):**
- TODO → IN_PROGRESS: Atama zorunlu
- IN_PROGRESS → DONE: Tamamlanma notları önerilir

#### **Ticket (Destek):**
- OPEN → IN_PROGRESS: Atama zorunlu
- IN_PROGRESS → RESOLVED: Çözüm notları önerilir

---

### **3. Otomatik Bildirimler** ✅
**Dosyalar:** 
- `supabase/migrations/042_user_automations.sql`
- `supabase/migrations/043_complete_automations.sql`

**Her aşama değişiminde bildirim:**
- ✅ Sonraki adım önerisi
- ✅ Tebrikler mesajı (başarı durumunda)
- ✅ Uyarı mesajı (eksik durumda)
- ✅ Yönlendirme linki

---

## 🎨 DETAY SAYFALARI

### **1. Deal Detay Sayfası** ✅
**Dosya:** `src/app/[locale]/deals/[id]/page.tsx`

**Eklenen:**
- İş akışı şeması (5 adım)
- Mevcut adım vurgulu
- Gereklilikler gösteriliyor

### **2. Quote Detay Sayfası** ✅
**Dosya:** `src/app/[locale]/quotes/[id]/page.tsx`

**Eklenen:**
- İş akışı şeması (3 adım)
- EXPIRED uyarısı ve revizyon önerisi
- Sonraki adım yönlendirmesi

### **3. Invoice Detay Sayfası** ✅
**Dosya:** `src/app/[locale]/invoices/[id]/page.tsx`

**Eklenen:**
- İş akışı şeması (3 adım)
- OVERDUE uyarısı ve ödeme hatırlatma
- Müşteriyi ara/e-posta gönder butonları

---

## 🔄 İŞ AKIŞI ÖRNEKLERİ

### **Örnek 1: Yeni Fırsat → Kazanıldı**

```
1. LEAD (Potansiyel)
   👤 Kullanıcı: Yeni fırsat oluşturdu
   💡 Sistem: "Müşteri bilgilerini ekleyin" bildirimi
   
2. CONTACTED (İletişimde)
   👤 Kullanıcı: Müşteri ile görüştü, CONTACTED yaptı
   💡 Sistem: "Sonraki adım: Teklif hazırlayın" bildirimi
   
3. PROPOSAL (Teklif)
   👤 Kullanıcı: Quote modülünden teklif oluşturdu
   💡 Sistem: "Sonraki adım: Pazarlık aşamasına geçin" bildirimi
   
4. NEGOTIATION (Pazarlık)
   👤 Kullanıcı: Fiyat görüşmeleri yaptı
   💡 Sistem: "Sonraki adım: Kazanın veya kaybedin" bildirimi
   
5. WON (Kazanıldı)
   👤 Kullanıcı: Fırsatı WON yaptı
   🤖 Sistem: Otomatik Contract DRAFT oluşturdu
   💡 Sistem: "Tebrikler! Sözleşme imzalatın" bildirimi
```

### **Örnek 2: Teklif → Fatura**

```
1. DRAFT (Taslak)
   👤 Kullanıcı: Teklif oluşturdu, ürünler ekledi
   ⚠️ Sistem: "En az 1 ürün ekleyin" kontrolü
   
2. SENT (Gönderildi)
   👤 Kullanıcı: Teklifi SENT yaptı
   💡 Sistem: "Müşteri onayını bekleyin" bildirimi
   
3. ACCEPTED (Onaylandı)
   👤 Kullanıcı: Teklifi ACCEPTED yaptı
   🤖 Sistem: Otomatik Invoice DRAFT oluşturdu
   🤖 Sistem: Otomatik Contract DRAFT oluşturdu
   💡 Sistem: "Tebrikler! Invoice ve Contract oluşturuldu" bildirimi
```

### **Örnek 3: Fatura → Ödeme**

```
1. DRAFT (Taslak)
   👤 Kullanıcı: Fatura oluşturdu, ürünler ekledi
   ⚠️ Sistem: "Fatura numarası zorunlu" kontrolü
   
2. SENT (Gönderildi)
   👤 Kullanıcı: Faturayı SENT yaptı
   💡 Sistem: "Ödeme yapılmasını bekleyin" bildirimi
   
3. PAID (Ödendi)
   👤 Kullanıcı: Faturayı PAID yaptı
   🤖 Sistem: Otomatik Finance INCOME kaydı oluşturdu
   💡 Sistem: "Tebrikler! Finance kaydı oluşturuldu" bildirimi
```

---

## 📊 VALIDATION KURALLARI

### **Zorunlu Alanlar Tablosu:**

| Modül | Aşama | Zorunlu Alanlar |
|-------|-------|-----------------|
| **Deal** | CONTACTED | Müşteri seçimi |
| **Deal** | WON | Fırsat değeri (value) |
| **Deal** | LOST | lostReason |
| **Quote** | SENT | En az 1 ürün, müşteri, toplam tutar |
| **Invoice** | SENT | En az 1 ürün, müşteri, fatura numarası |
| **Contract** | ACTIVE | Müşteri, tarihler, değer, sözleşme numarası |
| **Task** | IN_PROGRESS | Atama (assignedTo) |
| **Ticket** | IN_PROGRESS | Atama (assignedTo) |

---

## 🎯 KULLANICI DENEYİMİ

### **ÖNCE (Eski Sistem):**
- ❌ Kullanıcı nerede olduğunu bilmiyordu
- ❌ Sonraki adımı bilmiyordu
- ❌ Kafasına göre aşama atlayabiliyordu
- ❌ Eksik bilgilerle ilerleyebiliyordu
- ❌ Manuel her şeyi yapıyordu

### **ŞIMDI (Yeni Sistem):**
- ✅ Kullanıcı görsel şemada nerede olduğunu görüyor
- ✅ Sonraki adımı ve gerekli bilgileri biliyor
- ✅ Sıralı geçiş zorunlu (atlama yok)
- ✅ Eksik bilgiler engelleniyor
- ✅ Otomatik işlemler yapılıyor
- ✅ Bildirimlerle yönlendiriliyor

---

## 🚀 KURULUM

### **1. SQL Migration'ları Çalıştır:**
```sql
-- Supabase SQL Editor'de sırayla çalıştır:
1. supabase/migrations/042_user_automations.sql
2. supabase/migrations/043_complete_automations.sql
3. supabase/migrations/044_workflow_validations.sql
```

### **2. Frontend Build:**
```bash
npm run build
```

### **3. Test Et:**
1. Deal oluştur (LEAD)
2. CONTACTED yap → Uyarı gör
3. PROPOSAL yap → İş akışı şemasını gör
4. WON yap → Contract oluşturulduğunu gör

---

## 🧪 TEST SENARYOLARI

### **Test 1: Deal İş Akışı**
```
1. Deal oluştur (LEAD)
2. ✅ İş akışı şeması görünüyor mu?
3. CONTACTED yap
4. ✅ Bildirim geldi mi? "Sonraki adım: Teklif hazırlayın"
5. PROPOSAL yap
6. ✅ Quote önerisi geldi mi?
7. WON yap
8. ✅ Contract otomatik oluşturuldu mu?
```

### **Test 2: Quote İş Akışı**
```
1. Quote oluştur (DRAFT)
2. ✅ İş akışı şeması görünüyor mu?
3. Ürün eklemeden SENT yap
4. ✅ "En az 1 ürün eklenmeli" hatası geldi mi?
5. Ürün ekle, SENT yap
6. ✅ Bildirim geldi mi? "Müşteri onayını bekleyin"
7. ACCEPTED yap
8. ✅ Invoice + Contract oluşturuldu mu?
```

### **Test 3: Invoice İş Akışı**
```
1. Invoice oluştur (DRAFT)
2. ✅ İş akışı şeması görünüyor mu?
3. SENT yap
4. ✅ Bildirim geldi mi? "Ödeme yapılmasını bekleyin"
5. PAID yap
6. ✅ Finance kaydı oluşturuldu mu?
7. ✅ "Tebrikler!" bildirimi geldi mi?
```

---

## 💡 ÖZEL DURUMLAR

### **Atlama Yasağı:**
- LEAD → WON yapılamaz (önce CONTACTED → PROPOSAL → NEGOTIATION gerekli)
- DRAFT → ACCEPTED yapılamaz (önce SENT gerekli)

### **Immutable (Değiştirilemez):**
- Deal WON/LOST → Değiştirilemez
- Quote ACCEPTED/REJECTED → Değiştirilemez
- Invoice PAID → Değiştirilemez
- Contract ACTIVE → Geri dönemez

### **Silme Koruması:**
- Deal WON → Silinemez
- Quote ACCEPTED → Silinemez
- Invoice PAID → Silinemez
- Contract ACTIVE → Silinemez

---

## 🎯 SONUÇ

**Artık sistem:**
- ✅ Kullanıcıyı yönlendiriyor
- ✅ Eksikleri gösteriyor
- ✅ Otomatik işlemler yapıyor
- ✅ Bildirimlerde yönlendiriyor
- ✅ Görsel şema ile durumu gösteriyor

**Kullanıcı:**
- ✅ Nerede olduğunu biliyor
- ✅ Ne yapması gerektiğini görüyor
- ✅ Kafasına göre hareket edemiyor
- ✅ Otomatik yardım alıyor

**Sistem tamamen otomatik ve kullanıcı dostu! 🎉**

---

## 📞 DESTEK

Herhangi bir sorun olursa:
1. Browser Console'u kontrol et (F12)
2. Supabase SQL Editor'de migration'ları kontrol et
3. Notification tablosunu kontrol et

**Başarılar! 🚀**

