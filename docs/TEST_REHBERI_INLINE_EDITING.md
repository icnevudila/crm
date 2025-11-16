# 🧪 Test Rehberi - Inline Editing Özellikleri

**Tarih:** 2024  
**Durum:** ✅ Test Edilmeye Hazır

---

## 📋 ÖZET

4 liste sayfasına **inline editing** özelliği eklendi. Artık kullanıcılar liste sayfalarında **status/stage değişikliklerini** sayfa yenilemeden, modal açmadan, direkt tablo içinde yapabilirler.

---

## ✅ EKLENEN ÖZELLİKLER

### 1. **Yeni Component'ler**
- ✅ `src/components/ui/InlineEditBadge.tsx` - Badge görünümü ile inline editing
- ✅ `src/components/ui/InlineEditSelect.tsx` - Dropdown görünümü ile inline editing

### 2. **Güncellenen Liste Sayfaları**
- ✅ `src/components/quotes/QuoteList.tsx` - Status inline editing
- ✅ `src/components/tasks/TaskList.tsx` - Status inline editing
- ✅ `src/components/deals/DealList.tsx` - Stage inline editing
- ✅ `src/components/invoices/InvoiceList.tsx` - Status inline editing

---

## 🧪 TEST ADIMLARI

### **1. Quote Listesi - Status Inline Editing**

#### Test Yeri:
- **Sayfa:** `/tr/quotes` veya `/en/quotes`
- **Görünüm:** Table view (liste görünümü)

#### Test Senaryoları:

**✅ Senaryo 1: Status Değiştirme**
1. Quote listesine git
2. Table view'da bir quote'un status badge'ine tıkla
3. Dropdown'dan farklı bir status seç (örn: DRAFT → SENT)
4. **Beklenen:** 
   - 2 saniye sonra otomatik kaydedilir
   - Loading spinner görünür
   - Toast başarı mesajı gösterilir
   - Status badge'i yeni duruma güncellenir
   - Liste otomatik yenilenir

**✅ Senaryo 2: ACCEPTED Status - Disabled**
1. Status'u `ACCEPTED` olan bir quote bul
2. Status badge'ine tıklamayı dene
3. **Beklenen:**
   - Badge disabled (gri görünür)
   - Dropdown açılmaz
   - Değişiklik yapılamaz

**✅ Senaryo 3: Hata Durumu**
1. Internet bağlantısını kes (veya API'yi durdur)
2. Status değiştirmeyi dene
3. **Beklenen:**
   - Toast hata mesajı gösterilir
   - Status eski haline döner
   - Hata mesajı kullanıcı dostu

---

### **2. Task Listesi - Status Inline Editing**

#### Test Yeri:
- **Sayfa:** `/tr/tasks` veya `/en/tasks`
- **Görünüm:** Table view (liste görünümü)

#### Test Senaryoları:

**✅ Senaryo 1: Status Değiştirme**
1. Task listesine git
2. Table view'da bir task'ın status badge'ine tıkla
3. Dropdown'dan farklı bir status seç (örn: TODO → IN_PROGRESS)
4. **Beklenen:**
   - 2 saniye sonra otomatik kaydedilir
   - Loading spinner görünür
   - Toast başarı mesajı gösterilir
   - Status badge'i yeni duruma güncellenir
   - Liste otomatik yenilenir

**✅ Senaryo 2: Tüm Status'lar Değiştirilebilir**
1. Herhangi bir task'ın status'unu değiştir
2. **Beklenen:**
   - Tüm status'lar değiştirilebilir (disabled durum yok)
   - Her değişiklik başarıyla kaydedilir

---

### **3. Deal Listesi - Stage Inline Editing**

#### Test Yeri:
- **Sayfa:** `/tr/deals` veya `/en/deals`
- **Görünüm:** Table view (liste görünümü)

#### Test Senaryoları:

**✅ Senaryo 1: Stage Değiştirme**
1. Deal listesine git
2. Table view'da bir deal'in stage badge'ine tıkla
3. Dropdown'dan farklı bir stage seç (örn: LEAD → CONTACTED)
4. **Beklenen:**
   - 2 saniye sonra otomatik kaydedilir
   - Loading spinner görünür
   - Toast başarı mesajı gösterilir
   - Stage badge'i yeni duruma güncellenir
   - Liste otomatik yenilenir

**✅ Senaryo 2: WON/LOST Stage - Disabled**
1. Stage'u `WON` veya `LOST` olan bir deal bul
2. Stage badge'ine tıklamayı dene
3. **Beklenen:**
   - Badge disabled (gri görünür)
   - Dropdown açılmaz
   - Değişiklik yapılamaz

**✅ Senaryo 3: Stage Geçişleri**
1. Bir deal'in stage'ini sırayla değiştir:
   - LEAD → CONTACTED → PROPOSAL → NEGOTIATION
2. **Beklenen:**
   - Her geçiş başarıyla kaydedilir
   - Toast mesajları doğru gösterilir
   - Cache güncellenir

---

### **4. Invoice Listesi - Status Inline Editing**

#### Test Yeri:
- **Sayfa:** `/tr/invoices` veya `/en/invoices`
- **Görünüm:** Table view (liste görünümü)

#### Test Senaryoları:

**✅ Senaryo 1: Status Değiştirme**
1. Invoice listesine git
2. Table view'da bir invoice'un status badge'ine tıkla
3. Dropdown'dan farklı bir status seç (örn: DRAFT → SENT)
4. **Beklenen:**
   - 2 saniye sonra otomatik kaydedilir
   - Loading spinner görünür
   - Toast başarı mesajı gösterilir
   - Status badge'i yeni duruma güncellenir
   - Liste otomatik yenilenir

**✅ Senaryo 2: PAID/SHIPPED/RECEIVED Status - Disabled**
1. Status'u `PAID`, `SHIPPED` veya `RECEIVED` olan bir invoice bul
2. Status badge'ine tıklamayı dene
3. **Beklenen:**
   - Badge disabled (gri görünür)
   - Dropdown açılmaz
   - Değişiklik yapılamaz

**✅ Senaryo 3: QuoteId Varsa Disabled**
1. `quoteId` olan bir invoice bul
2. Status badge'ine tıklamayı dene
3. **Beklenen:**
   - Badge disabled (gri görünür)
   - Dropdown açılmaz
   - Değişiklik yapılamaz (çünkü quote'tan oluşturulmuş)

---

## 🔍 DETAYLI KONTROL LİSTESİ

### **Genel Özellikler**

- [ ] **Auto-Save Mekanizması**
  - [ ] Status değiştirdikten 2 saniye sonra otomatik kaydediliyor mu?
  - [ ] Loading spinner görünüyor mu?
  - [ ] Hızlı değişikliklerde gereksiz API çağrısı yapılmıyor mu?

- [ ] **Toast Notifications**
  - [ ] Başarılı değişikliklerde toast mesajı gösteriliyor mu?
  - [ ] Hata durumunda toast error mesajı gösteriliyor mu?
  - [ ] Mesajlar kullanıcı dostu mu?

- [ ] **Cache Güncelleme**
  - [ ] Status değiştikten sonra liste otomatik yenileniyor mu?
  - [ ] Diğer sayfalardaki cache'ler güncelleniyor mu?
  - [ ] Kanban view'da değişiklik görünüyor mu?

- [ ] **Error Handling**
  - [ ] Hata durumunda eski değere geri dönüyor mu?
  - [ ] Kullanıcıya anlamlı hata mesajı gösteriliyor mu?
  - [ ] Sistem çöküyor mu?

### **Disabled Durumlar**

- [ ] **QuoteList**
  - [ ] ACCEPTED status'lu quote'lar disabled mı?

- [ ] **DealList**
  - [ ] WON stage'li deal'ler disabled mı?
  - [ ] LOST stage'li deal'ler disabled mı?

- [ ] **InvoiceList**
  - [ ] PAID status'lu invoice'lar disabled mı?
  - [ ] SHIPPED status'lu invoice'lar disabled mı?
  - [ ] RECEIVED status'lu invoice'lar disabled mı?
  - [ ] quoteId olan invoice'lar disabled mı?

### **UI/UX**

- [ ] **Badge Görünümü**
  - [ ] Badge'ler merkezi renk sistemine uygun mu?
  - [ ] Hover durumunda görsel geri bildirim var mı?
  - [ ] Loading spinner doğru konumda mı?

- [ ] **Dropdown**
  - [ ] Dropdown açılıyor mu?
  - [ ] Tüm seçenekler görünüyor mu?
  - [ ] Seçim yapılabiliyor mu?

- [ ] **Responsive**
  - [ ] Mobile'da çalışıyor mu?
  - [ ] Tablet'te çalışıyor mu?
  - [ ] Desktop'ta çalışıyor mu?

---

## 🎯 HIZLI TEST SENARYOLARI

### **5 Dakikalık Hızlı Test**

1. **Quote Listesi**
   - `/tr/quotes` sayfasına git
   - Table view'da bir quote'un status'unu değiştir
   - ACCEPTED olan bir quote'un disabled olduğunu kontrol et

2. **Task Listesi**
   - `/tr/tasks` sayfasına git
   - Table view'da bir task'ın status'unu değiştir

3. **Deal Listesi**
   - `/tr/deals` sayfasına git
   - Table view'da bir deal'in stage'ini değiştir
   - WON veya LOST olan bir deal'in disabled olduğunu kontrol et

4. **Invoice Listesi**
   - `/tr/invoices` sayfasına git
   - Table view'da bir invoice'un status'unu değiştir
   - PAID olan bir invoice'un disabled olduğunu kontrol et

---

## 🐛 BİLİNEN SORUNLAR

**Şu anda bilinen sorun yok!** ✅

---

## 📊 TEST SONUÇLARI

Test sonuçlarını buraya kaydedin:

### QuoteList
- [ ] Status değiştirme çalışıyor
- [ ] ACCEPTED disabled çalışıyor
- [ ] Auto-save çalışıyor
- [ ] Toast mesajları gösteriliyor

### TaskList
- [ ] Status değiştirme çalışıyor
- [ ] Auto-save çalışıyor
- [ ] Toast mesajları gösteriliyor

### DealList
- [ ] Stage değiştirme çalışıyor
- [ ] WON/LOST disabled çalışıyor
- [ ] Auto-save çalışıyor
- [ ] Toast mesajları gösteriliyor

### InvoiceList
- [ ] Status değiştirme çalışıyor
- [ ] PAID/SHIPPED/RECEIVED disabled çalışıyor
- [ ] quoteId disabled çalışıyor
- [ ] Auto-save çalışıyor
- [ ] Toast mesajları gösteriliyor

---

## ✅ SONUÇ

Tüm testler başarılı ise, sistem production'a hazır demektir!

**Test Tarihi:** ___________  
**Test Eden:** ___________  
**Sonuç:** ___________  

---

**Not:** Herhangi bir sorun bulursanız, lütfen detaylı bir şekilde rapor edin.



