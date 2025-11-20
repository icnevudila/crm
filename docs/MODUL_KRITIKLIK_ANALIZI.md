# 📊 MODÜL KRİTİKLİK ANALİZİ

## 🎯 MEVCUT KRİTİK MODÜLLER (Zorunlu - İş Akışı İçin)

### ✅ ÇEKİRDEK MODÜLLER (Core - %100 Gerekli)
1. **Customer** → Müşteri yönetimi (Deal, Quote, Invoice bağlantılı)
2. **Deal** → Fırsat yönetimi (Quote, Contract bağlantılı)
3. **Quote** → Teklif yönetimi (Invoice bağlantılı)
4. **Invoice** → Fatura yönetimi (Shipment, Finance bağlantılı)
5. **Product** → Ürün yönetimi (InvoiceItem, StockMovement bağlantılı)
6. **Finance** → Finans kayıtları (Invoice PAID → Finance otomasyonu)
7. **Shipment** → Sevkiyat yönetimi (Invoice → Shipment otomasyonu)

**Bağlantılar:**
```
Customer → Deal → Quote → Invoice → Shipment
                ↓
            Contract
                ↓
            Finance (Invoice PAID)
```

---

## 🔴 YENİ MODÜLLER - KRİTİKLİK ANALİZİ

### 1. ✅ **Sales Quotas** (Satış Kotası) - KRİTİK ⭐⭐⭐
**Durum:** ✅ Tamamlandı

**Bağlantılar:**
- `User` → SalesQuota (userId)
- `Deal WON` → SalesQuota performans güncelleme (otomasyon)
- `UserPerformanceMetrics` → Otomatik hesaplama

**Neden Kritik:**
- Satış performans takibi zorunlu
- Deal WON olduğunda otomatik güncelleme yapıyor
- Dashboard'da performans göstergesi

**İş Akışı:**
```
Deal WON → SalesQuota.revenueActual++ → achievementPercent hesapla
```

---

### 2. ⚠️ **Product Bundles** (Ürün Paketi) - ORTA ÖNCELİK ⭐⭐
**Durum:** ❌ Sadece DB var, API/UI yok

**Bağlantılar:**
- `Product` → ProductBundleItem (productId)
- `Quote/Invoice` → Bundle seçimi (opsiyonel)

**Neden Orta Öncelik:**
- Ürün paketleme özelliği (bazı şirketler için gerekli)
- Quote/Invoice'da bundle seçimi yapılabilir
- **AMA:** Tek tek ürün eklemek de mümkün

**Öneri:** 
- ✅ Ekle (çünkü DB zaten var)
- ⚠️ Ama zorunlu değil - Quote/Invoice'da tek ürün ekleme yeterli

---

### 3. ✅ **Return Orders** (İade Siparişi) - KRİTİK ⭐⭐⭐
**Durum:** ❌ Sadece DB var, API/UI yok

**Bağlantılar:**
- `Invoice` → ReturnOrder (invoiceId) - **ZORUNLU BAĞLANTI**
- `Product` → ReturnOrderItem (productId)
- `ReturnOrder APPROVED` → Product.stock++ (otomasyon)
- `ReturnOrder` → CreditNote (returnOrderId)

**Neden Kritik:**
- İade işlemi gerçek hayatta çok sık kullanılıyor
- Stok geri ekleme otomasyonu var (migration'da trigger var)
- Invoice'dan iade oluşturma mantıklı

**İş Akışı:**
```
Invoice → ReturnOrder → APPROVED → Product.stock++ → CreditNote
```

**Öneri:** ✅ **MUTLAKA EKLE** - İade olmadan CRM eksik kalır

---

### 4. ✅ **Credit Notes** (Alacak Dekontu) - KRİTİK ⭐⭐⭐
**Durum:** ❌ Sadece DB var, API/UI yok

**Bağlantılar:**
- `ReturnOrder` → CreditNote (returnOrderId) - **ZORUNLU BAĞLANTI**
- `Invoice` → CreditNote (invoiceId)
- `CreditNote ISSUED` → Finance kaydı (otomasyon - migration'da var)

**Neden Kritik:**
- Return Order ile birlikte çalışıyor
- Finans entegrasyonu var (otomasyon)
- İade sonrası alacak dekontu zorunlu

**İş Akışı:**
```
ReturnOrder APPROVED → CreditNote ISSUED → Finance (EXPENSE)
```

**Öneri:** ✅ **MUTLAKA EKLE** - Return Order ile birlikte

---

### 5. ⚠️ **Payment Plans** (Ödeme Planı) - ORTA ÖNCELİK ⭐⭐
**Durum:** ❌ Sadece DB var, API/UI yok

**Bağlantılar:**
- `Invoice` → PaymentPlan (invoiceId)
- `PaymentInstallment` → Taksitler

**Neden Orta Öncelik:**
- Taksitli ödeme özelliği (bazı şirketler için gerekli)
- **AMA:** Tek seferlik ödeme de mümkün (Invoice PAID)
- Büyük faturalar için kullanışlı

**Öneri:**
- ⚠️ İsteğe bağlı - Büyük faturalar için gerekli
- ✅ Ekle (çünkü DB zaten var)

---

### 6. ❌ **Surveys** (Anket) - DÜŞÜK ÖNCELİK ⭐
**Durum:** ❌ Sadece DB var, API/UI yok

**Bağlantılar:**
- `Customer` → SurveyResponse (customerId)
- `CustomerSegment` → Survey targetSegment

**Neden Düşük Öncelik:**
- Müşteri memnuniyeti için kullanışlı
- **AMA:** Zorunlu değil - Email Campaign ile de yapılabilir
- Anket builder gerektirir (karmaşık)

**Öneri:**
- ❌ **SONRAYA BIRAK** - Email Campaign yeterli
- ⚠️ İleride eklenebilir

---

### 7. ❌ **Territory** (Bölge) - DÜŞÜK ÖNCELİK ⭐
**Durum:** ❌ Sadece DB var, API/UI yok

**Bağlantılar:**
- `User` → Territory (territoryId)
- `SalesQuota` → Territory bazlı hedef (opsiyonel)

**Neden Düşük Öncelik:**
- Bölge bazlı satış yönetimi (büyük şirketler için)
- **AMA:** User bazlı SalesQuota yeterli
- Harita entegrasyonu gerektirir (karmaşık)

**Öneri:**
- ❌ **SONRAYA BIRAK** - User bazlı SalesQuota yeterli
- ⚠️ İleride eklenebilir

---

### 8. ❌ **Partners** (Partner) - DÜŞÜK ÖNCELİK ⭐
**Durum:** ❌ Sadece DB var, API/UI yok

**Bağlantılar:**
- `Deal` → Partner (partnerId - opsiyonel)
- `Customer` → Partner (opsiyonel)

**Neden Düşük Öncelik:**
- Partner network yönetimi (bazı şirketler için)
- **AMA:** Customer olarak da yönetilebilir
- Partner portal gerektirir (karmaşık)

**Öneri:**
- ❌ **SONRAYA BIRAK** - Customer olarak yönetilebilir
- ⚠️ İleride eklenebilir

---

### 9. ⚠️ **Tax Rates** (Vergi Oranı) - ORTA ÖNCELİK ⭐⭐
**Durum:** ❌ Sadece DB var, API/UI yok

**Bağlantılar:**
- `Invoice` → TaxRate (taxRateId - opsiyonel)
- `Quote` → TaxRate (taxRateId - opsiyonel)
- `Product` → TaxRate (taxRateId - opsiyonel)

**Neden Orta Öncelik:**
- Multi-country vergi yönetimi (uluslararası şirketler için)
- **AMA:** Şu an Invoice/Quote'da manuel taxRate var (18% default)
- Türkiye için tek vergi oranı yeterli

**Öneri:**
- ⚠️ **İSTEĞE BAĞLI** - Multi-country için gerekli
- ✅ Türkiye için şu an gerekli değil

---

### 10. ❌ **Marketing Campaigns** (Pazarlama Kampanyası) - DÜŞÜK ÖNCELİK ⭐
**Durum:** ❌ Sadece DB var, API/UI yok

**Bağlantılar:**
- `Deal` → MarketingCampaign (campaignId - opsiyonel)
- `LeadSource` → MarketingCampaign (opsiyonel)

**Neden Düşük Öncelik:**
- ROI tracking için kullanışlı
- **AMA:** Email Campaign zaten var
- Lead Source tracking yeterli

**Öneri:**
- ❌ **SONRAYA BIRAK** - Email Campaign yeterli
- ⚠️ İleride eklenebilir

---

## 📋 ÖNERİ: ÖNCELİK SIRASI

### ✅ **KRİTİK - MUTLAKA EKLE** (3 modül)
1. ✅ **Sales Quotas** - ✅ TAMAMLANDI
2. ✅ **Return Orders** - İade işlemi zorunlu
3. ✅ **Credit Notes** - Return Order ile birlikte

### ⚠️ **ORTA ÖNCELİK - EKLE** (3 modül)
4. ⚠️ **Product Bundles** - Ürün paketleme (DB zaten var)
5. ⚠️ **Payment Plans** - Taksitli ödeme (büyük faturalar için)
6. ⚠️ **Tax Rates** - Multi-country için (Türkiye için şu an gerekli değil)

### ❌ **DÜŞÜK ÖNCELİK - SONRAYA BIRAK** (4 modül)
7. ❌ **Surveys** - Email Campaign yeterli
8. ❌ **Territory** - User bazlı SalesQuota yeterli
9. ❌ **Partners** - Customer olarak yönetilebilir
10. ❌ **Marketing Campaigns** - Email Campaign yeterli

---

## 🔗 BAĞLANTI ÖZETİ

### Kritik Bağlantılar (Zorunlu):
```
Invoice → ReturnOrder → CreditNote → Finance
Invoice → PaymentPlan (opsiyonel)
Product → ProductBundle (opsiyonel)
```

### Opsiyonel Bağlantılar:
```
Deal → MarketingCampaign (opsiyonel)
Customer → Survey (opsiyonel)
User → Territory (opsiyonel)
```

---

## 💡 SONUÇ

**Toplam 10 yeni modül:**
- ✅ **3 Kritik** (Return Orders, Credit Notes, Sales Quotas ✅)
- ⚠️ **3 Orta** (Product Bundles, Payment Plans, Tax Rates)
- ❌ **4 Düşük** (Surveys, Territory, Partners, Marketing Campaigns)

**Öneri:**
1. ✅ **Önce 3 kritik modülü ekle** (Return Orders, Credit Notes - Sales Quotas ✅ tamamlandı)
2. ⚠️ **Sonra 3 orta öncelikli modülü ekle** (Product Bundles, Payment Plans, Tax Rates)
3. ❌ **Düşük öncelikli modülleri sonraya bırak** (Surveys, Territory, Partners, Marketing Campaigns)

**Toplam Sidebar Modül Sayısı:**
- Mevcut: 18 modül
- Kritik + Orta: +6 modül = **24 modül** (makul)
- Tümü: +10 modül = **28 modül** (çok fazla)

**Çözüm:** Alt menüler ile gruplama yapılabilir.


