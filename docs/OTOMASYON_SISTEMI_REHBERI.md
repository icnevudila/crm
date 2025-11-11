# 🤖 OTOMASYON SİSTEMİ REHBERİ

**Tarih:** 2024  
**Durum:** ✅ TAMAMLANDI!

---

## 📋 ÖZET

Kullanıcı bir aksiyon yaptığında otomatik olarak başka işlemler tetiklenir! Artık manuel işlem yapmaya gerek yok.

---

## 🎯 OTOMASYON LİSTESİ

### **1️⃣ Deal WON → Contract Oluştur** ✅

**Ne Zaman:** Deal stage'i WON olduğunda  
**Ne Olur:**
- ✅ Otomatik Contract DRAFT oluşturulur
- ✅ Contract number: `SOZL-2024-0001` formatında
- ✅ Contract başlangıç tarihi: Bugün
- ✅ Contract bitiş tarihi: 1 yıl sonra
- ✅ ActivityLog kaydı yapılır
- ✅ Notification gönderilir

**Örnek:**
```
Kullanıcı: Deal'i WON yaptı
Sistem: Otomatik Contract oluşturdu (SOZL-2024-0001)
Kullanıcı: Contract'ı görüp onaylayabilir
```

---

### **2️⃣ Quote SENT → Email Notification** ✅

**Ne Zaman:** Quote status'ü SENT olduğunda  
**Ne Olur:**
- ✅ Notification oluşturulur (Email gönderilecek)
- ✅ ActivityLog kaydı yapılır
- ✅ Müşteriye email gönderilir (gelecekte)

**Örnek:**
```
Kullanıcı: Quote'u SENT yaptı
Sistem: Notification oluşturdu
Sistem: ActivityLog kaydı yaptı
```

---

### **3️⃣ Quote ACCEPTED → Invoice + Contract** ✅

**Ne Zaman:** Quote status'ü ACCEPTED olduğunda  
**Ne Olur:**
- ✅ Otomatik Invoice DRAFT oluşturulur
- ✅ Invoice number: `INV-2024-0001` formatında
- ✅ Invoice vade tarihi: 30 gün sonra
- ✅ Otomatik Contract DRAFT oluşturulur (eğer yoksa)
- ✅ ActivityLog kaydı yapılır
- ✅ Notification gönderilir

**Örnek:**
```
Kullanıcı: Quote'u ACCEPTED yaptı
Sistem: Otomatik Invoice oluşturdu (INV-2024-0001)
Sistem: Otomatik Contract oluşturdu (SOZL-2024-0001)
Kullanıcı: Invoice ve Contract'ı görüp onaylayabilir
```

---

### **4️⃣ Invoice SENT → Email Notification** ✅

**Ne Zaman:** Invoice status'ü SENT olduğunda  
**Ne Olur:**
- ✅ Notification oluşturulur (Email gönderilecek)
- ✅ ActivityLog kaydı yapılır
- ✅ Müşteriye email gönderilir (gelecekte)

**Örnek:**
```
Kullanıcı: Invoice'u SENT yaptı
Sistem: Notification oluşturdu
Sistem: ActivityLog kaydı yaptı
```

---

### **5️⃣ Invoice PAID → Finance Kaydı + Notification** ✅

**Ne Zaman:** Invoice status'ü PAID olduğunda  
**Ne Olur:**
- ✅ Otomatik Finance kaydı oluşturulur
- ✅ Finance type: `INCOME`
- ✅ Finance category: `SALES`
- ✅ Finance amount: Invoice totalAmount
- ✅ ActivityLog kaydı yapılır
- ✅ Notification gönderilir

**Örnek:**
```
Kullanıcı: Invoice'u PAID yaptı
Sistem: Otomatik Finance kaydı oluşturdu (INCOME - SALES)
Sistem: Notification gönderdi
Kullanıcı: Finance kaydını görebilir
```

---

### **6️⃣ Contract ACTIVE → Invoice Oluştur** ✅

**Ne Zaman:** Contract status'ü ACTIVE olduğunda  
**Ne Olur:**
- ✅ Otomatik Invoice DRAFT oluşturulur (ONE_TIME sözleşmeler için)
- ✅ Invoice number: `INV-2024-0001` formatında
- ✅ Invoice vade tarihi: Contract paymentTerms'e göre
- ✅ ActivityLog kaydı yapılır
- ✅ Notification gönderilir

**Örnek:**
```
Kullanıcı: Contract'ı ACTIVE yaptı
Sistem: Otomatik Invoice oluşturdu (INV-2024-0001)
Kullanıcı: Invoice'u görüp onaylayabilir
```

---

### **7️⃣ Shipment DELIVERED → Notification** ✅

**Ne Zaman:** Shipment status'ü DELIVERED olduğunda  
**Ne Olur:**
- ✅ Notification oluşturulur
- ✅ ActivityLog kaydı yapılır
- ✅ Müşteriye bildirim gönderilir

**Örnek:**
```
Kullanıcı: Shipment'ı DELIVERED yaptı
Sistem: Notification oluşturdu
Sistem: ActivityLog kaydı yaptı
```

---

## 🔄 OTOMASYON AKIŞ ŞEMASI

```
┌─────────────────────────────────────────────────────────┐
│                    DEAL WON                             │
│                    ↓                                     │
│              Contract DRAFT                             │
│                    ↓                                     │
│              Contract ACTIVE                             │
│                    ↓                                     │
│              Invoice DRAFT                               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    QUOTE SENT                           │
│                    ↓                                     │
│              Email Notification                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                 QUOTE ACCEPTED                          │
│                    ↓                                     │
│         Invoice DRAFT + Contract DRAFT                  │
│                    ↓                                     │
│              Invoice SENT                                │
│                    ↓                                     │
│              Email Notification                         │
│                    ↓                                     │
│              Invoice PAID                                │
│                    ↓                                     │
│         Finance INCOME + Notification                   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              SHIPMENT DELIVERED                         │
│                    ↓                                     │
│              Notification                                │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 OTOMASYON TABLOSU

| Kullanıcı Aksiyonu | Otomatik İşlem | Sonuç |
|-------------------|----------------|-------|
| **Deal WON** | Contract DRAFT oluştur | ✅ Contract hazır |
| **Quote SENT** | Email Notification | ✅ Müşteri bilgilendirildi |
| **Quote ACCEPTED** | Invoice + Contract oluştur | ✅ Invoice ve Contract hazır |
| **Invoice SENT** | Email Notification | ✅ Müşteri bilgilendirildi |
| **Invoice PAID** | Finance INCOME kaydı | ✅ Finance kaydı oluşturuldu |
| **Contract ACTIVE** | Invoice DRAFT oluştur | ✅ Invoice hazır |
| **Shipment DELIVERED** | Notification | ✅ Teslimat bildirimi |

---

## 🚀 NASIL ÇALIŞIR?

### **1. SQL Trigger'lar:**
- Her status değişikliğinde trigger tetiklenir
- Trigger fonksiyonu otomatik işlemleri yapar
- ActivityLog ve Notification kayıtları oluşturulur

### **2. API Endpoint'ler:**
- Kullanıcı status değiştirdiğinde API çağrılır
- API backend'de validation yapar
- SQL trigger otomatik işlemleri yapar

### **3. Frontend:**
- Kullanıcı Kanban'da drag-drop yapar
- API'ye PUT isteği gönderilir
- Backend otomasyonları tetikler

---

## 🧪 TEST SENARYOLARI

### **Test 1: Deal WON → Contract**
```
1. Deal oluştur (LEAD)
2. Deal'i WON yap
3. ✅ Contract DRAFT oluşturuldu mu?
4. ✅ Notification geldi mi?
5. ✅ ActivityLog kaydı var mı?
```

### **Test 2: Quote ACCEPTED → Invoice + Contract**
```
1. Quote oluştur (DRAFT)
2. Quote'u SENT yap
3. Quote'u ACCEPTED yap
4. ✅ Invoice DRAFT oluşturuldu mu?
5. ✅ Contract DRAFT oluşturuldu mu?
6. ✅ Notification geldi mi?
```

### **Test 3: Invoice PAID → Finance**
```
1. Invoice oluştur (DRAFT)
2. Invoice'u SENT yap
3. Invoice'u PAID yap
4. ✅ Finance INCOME kaydı oluşturuldu mu?
5. ✅ Notification geldi mi?
```

---

## 💡 KULLANICI DENEYİMİ

### **ÖNCE (Eski Sistem):**
- ❌ Kullanıcı her işlemi manuel yapıyordu
- ❌ Quote ACCEPTED → Manuel Invoice oluştur
- ❌ Invoice PAID → Manuel Finance kaydı
- ❌ Deal WON → Manuel Contract oluştur

### **ŞIMDI (Yeni Sistem):**
- ✅ Kullanıcı sadece status değiştiriyor
- ✅ Sistem otomatik işlemleri yapıyor
- ✅ Notification ile bilgilendiriliyor
- ✅ ActivityLog ile takip ediliyor

---

## 📝 SQL MIGRATION

**Dosya:** `supabase/migrations/042_user_automations.sql`

**Çalıştırma:**
```sql
-- Supabase SQL Editor'de çalıştır
-- Veya Supabase CLI ile:
supabase db push
```

---

## ⚠️ ÖNEMLİ NOTLAR

1. **Duplicate Kontrolü:**
   - Her otomasyon duplicate kontrolü yapar
   - Aynı kayıt 2 kez oluşturulmaz

2. **Error Handling:**
   - Hata durumunda sistem çalışmaya devam eder
   - Hatalar `RAISE NOTICE` ile loglanır

3. **ActivityLog:**
   - Tüm otomasyonlar ActivityLog'a kaydedilir
   - Kullanıcı takip edebilir

4. **Notification:**
   - Tüm önemli işlemler için notification gönderilir
   - Kullanıcı bilgilendirilir

---

## 🎯 SONUÇ

**Artık kullanıcı:**
- ✅ Sadece status değiştiriyor
- ✅ Sistem otomatik işlemleri yapıyor
- ✅ Notification ile bilgilendiriliyor
- ✅ ActivityLog ile takip ediyor

**Manuel işlem yapmaya gerek yok!** 🎉

---

## 📞 DESTEK

Herhangi bir sorun olursa:
1. SQL trigger'ların çalıştığından emin ol
2. ActivityLog'u kontrol et
3. Notification'ları kontrol et

**Başarılar! 🚀**

