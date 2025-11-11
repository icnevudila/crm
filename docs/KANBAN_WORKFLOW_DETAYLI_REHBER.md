# 🔄 KANBAN WORKFLOW DETAYLI REHBER
## Sidebar'dan Tek Tek - Her Modül İçin Örnekler

---

## 📊 1. DASHBOARD

### 🎯 Başlangıç
- **Sayfa**: `/dashboard`
- **Ne Görürsün**: 6 KPI kartı + 5 grafik (Line, Pie, Radar, Doughnut, Kanban)
- **Amaç**: Tüm sistemin genel durumunu görmek

### 📍 Ne Yapılır
- KPI'ları izle (Toplam Fırsat, Teklif, Fatura, Müşteri, Görev, Destek Talebi)
- Grafiklerden trend analizi yap
- Hızlı aksiyonlar al (yeni fırsat, teklif, fatura oluştur)

### 🏁 Bitiş
- Dashboard'da kalır veya başka modüle geçer
- **Workflow yok** - sadece görüntüleme

---

## 👥 2. MÜŞTERİ YÖNETİMİ

### 🏢 2.1. MÜŞTERİ FİRMALAR (Companies)

#### 🎯 Başlangıç
- **Sayfa**: `/companies`
- **Buton**: "Yeni Firma" (+ butonu)
- **Form**: CompanyForm açılır

#### 📍 Ne Yapılır
1. **Oluşturma**: Firma adı, vergi no, adres, telefon, email
2. **Kaydet**: Firma oluşturulur
3. **Detay Sayfası**: Firma bilgileri, ilişkili kayıtlar (Customers, Deals, Quotes, Invoices)

#### 🏁 Bitiş
- Firma oluşturulur → **Deal veya Customer oluşturulabilir**

---

### 👤 2.2. BİREYSEL MÜŞTERİLER (Customers)

#### 🎯 Başlangıç
- **Sayfa**: `/customers`
- **Buton**: "Yeni Müşteri" (+ butonu)
- **Form**: CustomerForm açılır

#### 📍 Ne Yapılır
1. **Oluşturma**: Ad, soyad, email, telefon, adres, firma (opsiyonel)
2. **Kaydet**: Müşteri oluşturulur
3. **Detay Sayfası**: Müşteri bilgileri, ilişkili kayıtlar (Deals, Quotes, Invoices)

#### 🏁 Bitiş
- Müşteri oluşturulur → **Deal oluşturulabilir**

---

### 🤝 2.3. FİRMA YETKİLİLERİ (Contacts)

#### 🎯 Başlangıç
- **Sayfa**: `/contacts`
- **Buton**: "Yeni Yetkili" (+ butonu)
- **Form**: ContactForm açılır

#### 📍 Ne Yapılır
1. **Oluşturma**: Ad, soyad, email, telefon, pozisyon, firma (zorunlu)
2. **Kaydet**: Yetkili oluşturulur
3. **Detay Sayfası**: Yetkili bilgileri, ilişkili kayıtlar (Meetings, Quotes)

#### 🏁 Bitiş
- Yetkili oluşturulur → **Meeting veya Quote oluşturulabilir**

---

### 🎯 2.4. MÜŞTERİ SEGMENTLERİ (Segments)

#### 🎯 Başlangıç
- **Sayfa**: `/segments`
- **Buton**: "Yeni Segment" (+ butonu)

#### 📍 Ne Yapılır
1. **Oluşturma**: Segment adı, kriterler (VIP, Aktif, Pasif, vb.)
2. **Kaydet**: Segment oluşturulur
3. **Otomatik Atama**: Kriterlere uyan müşteriler otomatik eklenir

#### 🏁 Bitiş
- Segment oluşturulur → **Müşteriler otomatik kategorize edilir**

---

## 💼 3. SATIŞ SÜRECİ (İŞ AKIŞI SIRASI)

### 💼 3.1. FIRSATLAR (Deals) - **KANBAN WORKFLOW**

#### 🎯 Başlangıç
- **Sayfa**: `/deals`
- **Buton**: "Yeni Fırsat" (+ butonu)
- **Form**: DealForm açılır
- **İlk Aşama**: `LEAD` (Potansiyel)

#### 📍 Workflow Aşamaları (Kanban'da Sürükle-Bırak)

**1. LEAD (Potansiyel)**
- **Ne Yapılır**: Müşteri bilgileri, fırsat değeri, beklenen kapanış tarihi
- **Bilgi Notu**: "Müşteri ile iletişime geçin. Kart içindeki 'İletişime Geç' butonunu kullanın."
- **Hızlı Aksiyon**: "📞 İletişime Geç" butonu
- **Geçiş**: `LEAD` → `CONTACTED` veya `LOST`

**2. CONTACTED (İletişimde)**
- **Ne Yapılır**: İlk temas kuruldu, müşteri ilgili
- **Bilgi Notu**: "Teklif oluşturun. Kart içindeki 'Teklif Oluştur' butonunu kullanın."
- **Hızlı Aksiyon**: "📝 Teklif Oluştur" butonu
- **Otomasyon**: Demo planlama görevi oluşturulur
- **Geçiş**: `CONTACTED` → `PROPOSAL` veya `LOST`

**3. PROPOSAL (Teklif)**
- **Ne Yapılır**: Teklif hazırlandı, müşteriye sunuldu
- **Bilgi Notu**: "Görüşme planlayın. Kart içindeki 'Görüşme Planla' butonunu kullanın."
- **Hızlı Aksiyon**: "📅 Görüşme Planla" butonu
- **Geçiş**: `PROPOSAL` → `NEGOTIATION` veya `LOST`

**4. NEGOTIATION (Pazarlık)**
- **Ne Yapılır**: Fiyat, şartlar, detaylar pazarlık ediliyor
- **Bilgi Notu**: "Pazarlık yapın. Kart içindeki 'Kazanıldı' veya 'Kaybedildi' butonlarını kullanın."
- **Hızlı Aksiyon**: "✅ Kazanıldı" veya "❌ Kaybedildi" butonları
- **Geçiş**: `NEGOTIATION` → `WON` veya `LOST`

**5. WON (Kazanıldı)** 🔒 **İMMUTABLE**
- **Ne Yapılır**: Fırsat kazanıldı!
- **Bilgi Notu**: "Fırsat kazanıldı! Otomatik olarak sözleşme oluşturuldu."
- **Otomasyon**: 
  - ✅ **Contract DRAFT** otomatik oluşturulur
  - ✅ **Notification** gönderilir
  - ✅ **ActivityLog** kaydı yapılır
- **Geçiş**: ❌ **YOK** - Değiştirilemez, silinemez

**6. LOST (Kaybedildi)** 🔒 **İMMUTABLE**
- **Ne Yapılır**: Fırsat kaybedildi, kayıp nedeni kaydedildi
- **Bilgi Notu**: "Fırsat kaybedildi. Yeni bir fırsat oluşturmak için 'Yeni Fırsat' butonunu kullanın."
- **Otomasyon**: 
  - ✅ **Analiz görevi** otomatik oluşturulur (lostReason varsa)
  - ✅ **ActivityLog** kaydı yapılır
- **Geçiş**: ❌ **YOK** - Değiştirilemez, silinemez

#### 🏁 Bitiş
- **WON** → **Contract** oluşturulur → **Quote/Invoice** oluşturulabilir
- **LOST** → **Analiz görevi** oluşturulur → Yeni fırsat oluşturulabilir

---

### 📅 3.2. GÖRÜŞMELER (Meetings)

#### 🎯 Başlangıç
- **Sayfa**: `/meetings`
- **Buton**: "Yeni Görüşme" (+ butonu)
- **Form**: MeetingForm açılır
- **Parametreler**: `dealId`, `quoteId`, `customerId` (URL'den otomatik doldurulur)

#### 📍 Ne Yapılır
1. **Oluşturma**: Başlık, tarih, süre, katılımcılar, notlar
2. **Kaydet**: Görüşme oluşturulur
3. **Detay Sayfası**: Görüşme bilgileri, katılımcılar, notlar

#### 🤖 Otomasyon
- **Meeting bitince** (meetingDate + duration geçtiyse):
  - ✅ **Follow-up görevi** otomatik oluşturulur (her katılımcı için)
  - ✅ **Notification** gönderilir

#### 🏁 Bitiş
- Görüşme oluşturulur → **Deal/Quote** ile ilişkilendirilir
- Görüşme bitince → **Follow-up görevi** oluşturulur

---

### 📄 3.3. TEKLİFLER (Quotes) - **KANBAN WORKFLOW**

#### 🎯 Başlangıç
- **Sayfa**: `/quotes`
- **Buton**: "Yeni Teklif" (+ butonu)
- **Form**: QuoteForm açılır
- **Parametreler**: `dealId` (URL'den otomatik doldurulur)
- **İlk Aşama**: `DRAFT` (Taslak)

#### 📍 Workflow Aşamaları (Kanban'da Sürükle-Bırak)

**1. DRAFT (Taslak)**
- **Ne Yapılır**: Teklif hazırlanıyor, ürünler ekleniyor, fiyatlar belirleniyor
- **Bilgi Notu**: "Teklifi gönderin. Kart içindeki 'Gönder' butonunu kullanın."
- **Hızlı Aksiyon**: "📤 Gönder" butonu
- **Geçiş**: `DRAFT` → `SENT`

**2. SENT (Gönderildi)**
- **Ne Yapılır**: Teklif müşteriye gönderildi, onay bekleniyor
- **Bilgi Notu**: "Müşteri onayı bekleniyor. Kart içindeki 'Kabul Et' veya 'Reddet' butonlarını kullanın."
- **Hızlı Aksiyon**: "✅ Kabul Et" veya "❌ Reddet" butonları
- **Otomasyon**: 
  - ✅ **Notification** gönderilir (Email gönderilecek)
  - ✅ **ActivityLog** kaydı yapılır
- **Geçiş**: `SENT` → `ACCEPTED`, `REJECTED`, veya `EXPIRED`

**3. ACCEPTED (Kabul Edildi)** 🔒 **İMMUTABLE**
- **Ne Yapılır**: Teklif kabul edildi!
- **Bilgi Notu**: "Teklif kabul edildi! Otomatik olarak fatura oluşturuldu."
- **Otomasyon**: 
  - ✅ **Invoice DRAFT** otomatik oluşturulur (QuoteItem → InvoiceItem kopyalanır)
  - ✅ **Contract DRAFT** otomatik oluşturulur
  - ✅ **Stok rezervasyonu** yapılır (Product.reservedQuantity artırılır)
  - ✅ **Notification** gönderilir
  - ✅ **ActivityLog** kaydı yapılır
- **Geçiş**: ❌ **YOK** - Değiştirilemez, silinemez

**4. REJECTED (Reddedildi)** 🔒 **İMMUTABLE**
- **Ne Yapılır**: Teklif reddedildi
- **Bilgi Notu**: "Teklif reddedildi. Revizyon görevi otomatik olarak oluşturuldu."
- **Otomasyon**: 
  - ✅ **Revizyon görevi** otomatik oluşturulur
  - ✅ **Notification** gönderilir
  - ✅ **ActivityLog** kaydı yapılır
- **Geçiş**: ❌ **YOK** - Değiştirilemez, silinemez

#### 🏁 Bitiş
- **ACCEPTED** → **Invoice** oluşturulur → **Invoice workflow** başlar
- **REJECTED** → **Revizyon görevi** oluşturulur → Yeni teklif oluşturulabilir

---

### 📜 3.4. SÖZLEŞMELER (Contracts)

#### 🎯 Başlangıç
- **Sayfa**: `/contracts`
- **Buton**: "Yeni Sözleşme" (+ butonu)
- **Form**: ContractForm açılır
- **Otomatik Oluşturma**: 
  - **Deal WON** → Contract DRAFT otomatik oluşturulur
  - **Quote ACCEPTED** → Contract DRAFT otomatik oluşturulur

#### 📍 Ne Yapılır
1. **Oluşturma**: Sözleşme numarası, başlık, müşteri, başlangıç/bitiş tarihi, değer
2. **Kaydet**: Sözleşme oluşturulur
3. **Aktif Et**: Status `DRAFT` → `ACTIVE`

#### 🤖 Otomasyon
- **Contract ACTIVE** olduğunda:
  - ✅ **Invoice DRAFT** otomatik oluşturulur (ONE_TIME için)
  - ✅ **Periyodik Invoice** oluşturulur (MONTHLY/QUARTERLY/YEARLY için)
  - ✅ **ActivityLog** kaydı yapılır

#### 🏁 Bitiş
- Contract ACTIVE → **Invoice** oluşturulur → **Invoice workflow** başlar

---

### ✅ 3.5. ONAYLAR (Approvals)

#### 🎯 Başlangıç
- **Sayfa**: `/approvals`
- **Otomatik Oluşturma**: 
  - **Deal WON** (value > 100K) → ApprovalRequest oluşturulur
  - **Quote ACCEPTED** (total > 50K) → ApprovalRequest oluşturulur

#### 📍 Ne Yapılır
1. **Onay Bekleyenler**: Deal, Quote, Contract onayları
2. **Onayla**: Status `PENDING` → `APPROVED`
3. **Reddet**: Status `PENDING` → `REJECTED`

#### 🤖 Otomasyon
- **Approval APPROVED** olduğunda:
  - ✅ **Deal** → Stage `NEGOTIATION` olur
  - ✅ **Quote** → Status `ACCEPTED` olur
  - ✅ **Contract** → Status `ACTIVE` olur

#### 🏁 Bitiş
- Approval APPROVED → **İlgili entity** güncellenir → **Workflow devam eder**

---

## 📦 4. OPERASYONLAR

### 🧾 4.1. FATURALAR (Invoices) - **KANBAN WORKFLOW**

#### 🎯 Başlangıç
- **Sayfa**: `/invoices`
- **Buton**: "Yeni Fatura" (+ butonu)
- **Form**: InvoiceForm açılır
- **Otomatik Oluşturma**: 
  - **Quote ACCEPTED** → Invoice DRAFT otomatik oluşturulur
  - **Contract ACTIVE** → Invoice DRAFT otomatik oluşturulur
- **Parametreler**: `quoteId` (URL'den otomatik doldurulur)
- **İlk Aşama**: `DRAFT` (Taslak)

#### 📍 Workflow Aşamaları (Kanban'da Sürükle-Bırak)

**1. DRAFT (Taslak)**
- **Ne Yapılır**: Fatura hazırlanıyor, ürünler ekleniyor, fiyatlar belirleniyor
- **Bilgi Notu**: "Faturayı gönderin. Kart içindeki 'Gönder' butonunu kullanın."
- **Hızlı Aksiyon**: "📤 Gönder" butonu
- **Geçiş**: `DRAFT` → `SENT` veya `CANCELLED`

**2. SENT (Gönderildi)**
- **Ne Yapılır**: Fatura müşteriye gönderildi, ödeme bekleniyor
- **Bilgi Notu**: "Ödeme bekleniyor. Kart içindeki 'Ödendi' butonunu kullanın."
- **Hızlı Aksiyon**: "💰 Ödendi" veya "🚚 Sevkiyat" butonları
- **Otomasyon**: 
  - ✅ **Shipment PENDING** otomatik oluşturulur
  - ✅ **Notification** gönderilir
  - ✅ **ActivityLog** kaydı yapılır
- **Geçiş**: `SENT` → `PAID`, `OVERDUE`, veya `CANCELLED`

**3. PAID (Ödendi)** 🔒 **İMMUTABLE**
- **Ne Yapılır**: Fatura ödendi!
- **Bilgi Notu**: "Fatura ödendi! Ödeme kaydedildi ve finans kaydı oluşturuldu."
- **Otomasyon**: 
  - ✅ **Finance INCOME** kaydı otomatik oluşturulur
  - ✅ **Notification** gönderilir
  - ✅ **ActivityLog** kaydı yapılır
- **Geçiş**: ❌ **YOK** - Değiştirilemez, silinemez

**4. OVERDUE (Vadesi Geçmiş)**
- **Ne Yapılır**: Fatura vadesi geçti, ödeme yapılmadı
- **Bilgi Notu**: "Fatura vadesi geçti! Müşteri ile iletişime geçin."
- **Otomasyon**: 
  - ✅ **Hatırlatma görevi** otomatik oluşturulur
  - ✅ **Notification** gönderilir
- **Geçiş**: `OVERDUE` → `PAID` veya `CANCELLED`

**5. CANCELLED (İptal Edildi)** 🔒 **İMMUTABLE**
- **Ne Yapılır**: Fatura iptal edildi
- **Bilgi Notu**: "Fatura iptal edildi. Yeni bir fatura oluşturmak için 'Yeni Fatura' butonunu kullanın."
- **Geçiş**: ❌ **YOK** - Değiştirilemez, silinemez

#### 🏁 Bitiş
- **PAID** → **Finance** kaydı oluşturulur → **Finance workflow** başlar
- **SENT** → **Shipment** oluşturulur → **Shipment workflow** başlar

---

### 📦 4.2. ÜRÜNLER (Products)

#### 🎯 Başlangıç
- **Sayfa**: `/products`
- **Buton**: "Yeni Ürün" (+ butonu)
- **Form**: ProductForm açılır

#### 📍 Ne Yapılır
1. **Oluşturma**: Ürün adı, SKU, fiyat, stok, minimum stok, kategori
2. **Kaydet**: Ürün oluşturulur
3. **Detay Sayfası**: Ürün bilgileri, stok hareketleri, ilişkili kayıtlar

#### 🤖 Otomasyon
- **Stok düşük** olduğunda (stock <= minimumStock):
  - ✅ **Satın alma görevi** otomatik oluşturulur (ADMIN'lere)
  - ✅ **Notification** gönderilir

#### 🏁 Bitiş
- Ürün oluşturulur → **Quote/Invoice** içinde kullanılabilir

---

### 🚚 4.3. SEVKİYATLAR (Shipments)

#### 🎯 Başlangıç
- **Sayfa**: `/shipments`
- **Buton**: "Yeni Sevkiyat" (+ butonu)
- **Form**: ShipmentForm açılır
- **Otomatik Oluşturma**: 
  - **Invoice SENT** → Shipment PENDING otomatik oluşturulur
- **Parametreler**: `invoiceId` (URL'den otomatik doldurulur)

#### 📍 Ne Yapılır
1. **Oluşturma**: Takip numarası, sevkiyat adresi, sevkiyat yöntemi, tahmini teslimat tarihi
2. **Kaydet**: Sevkiyat oluşturulur
3. **Onayla**: Status `PENDING` → `APPROVED`

#### 🤖 Otomasyon
- **Shipment APPROVED** olduğunda:
  - ✅ **Stok düşer** (Product.stock azalır)
  - ✅ **Rezerve miktar azalır** (Product.reservedQuantity azalır)
  - ✅ **StockMovement** kaydı oluşturulur
  - ✅ **ActivityLog** kaydı yapılır

- **Shipment DELIVERED** olduğunda:
  - ✅ **Notification** gönderilir
  - ✅ **ActivityLog** kaydı yapılır

#### 🏁 Bitiş
- Shipment APPROVED → **Stok düşer** → **Ürün stokları güncellenir**
- Shipment DELIVERED → **Teslimat tamamlanır**

---

### 📥 4.4. MAL KABUL (Purchase Shipments)

#### 🎯 Başlangıç
- **Sayfa**: `/purchase-shipments`
- **Buton**: "Yeni Mal Kabul" (+ butonu)

#### 📍 Ne Yapılır
1. **Oluşturma**: Tedarikçi, ürünler, miktarlar, teslimat tarihi
2. **Kaydet**: Mal kabul oluşturulur
3. **Onayla**: Status `PENDING` → `APPROVED`

#### 🤖 Otomasyon
- **Purchase Shipment APPROVED** olduğunda:
  - ✅ **Stok artar** (Product.stock artar)
  - ✅ **Gelen miktar azalır** (Product.incomingQuantity azalır)
  - ✅ **StockMovement** kaydı oluşturulur
  - ✅ **ActivityLog** kaydı yapılır

#### 🏁 Bitiş
- Purchase Shipment APPROVED → **Stok artar** → **Ürün stokları güncellenir**

---

## 💰 5. FİNANS & DESTEK

### 💰 5.1. FİNANS (Finance)

#### 🎯 Başlangıç
- **Sayfa**: `/finance`
- **Buton**: "Yeni Finans Kaydı" (+ butonu)
- **Otomatik Oluşturma**: 
  - **Invoice PAID** → Finance INCOME kaydı otomatik oluşturulur

#### 📍 Ne Yapılır
1. **Oluşturma**: Tip (INCOME/EXPENSE), kategori, tutar, tarih, açıklama
2. **Kaydet**: Finans kaydı oluşturulur
3. **Detay Sayfası**: Finans kaydı bilgileri, ilişkili kayıtlar

#### 🏁 Bitiş
- Finance kaydı oluşturulur → **Raporlarda görünür**

---

### 🎫 5.2. DESTEK TALEPLERİ (Tickets)

#### 🎯 Başlangıç
- **Sayfa**: `/tickets`
- **Buton**: "Yeni Destek Talebi" (+ butonu)
- **Form**: TicketForm açılır

#### 📍 Ne Yapılır
1. **Oluşturma**: Konu, açıklama, öncelik, atanan kişi
2. **Kaydet**: Destek talebi oluşturulur
3. **Çöz**: Status `OPEN` → `RESOLVED`

#### 🤖 Otomasyon
- **Ticket RESOLVED** olduğunda:
  - ✅ **Memnuniyet anketi görevi** otomatik oluşturulur
  - ✅ **Notification** gönderilir

#### 🏁 Bitiş
- Ticket RESOLVED → **Memnuniyet anketi görevi** oluşturulur

---

### ✅ 5.3. GÖREVLER (Tasks)

#### 🎯 Başlangıç
- **Sayfa**: `/tasks`
- **Buton**: "Yeni Görev" (+ butonu)
- **Otomatik Oluşturma**: 
  - **Quote REJECTED** → Revizyon görevi
  - **Deal LOST** → Analiz görevi
  - **Invoice OVERDUE** → Hatırlatma görevi
  - **Product low stock** → Satın alma görevi
  - **Meeting end** → Follow-up görevi
  - **Ticket RESOLVED** → Memnuniyet anketi görevi

#### 📍 Ne Yapılır
1. **Oluşturma**: Başlık, açıklama, öncelik, vade tarihi, atanan kişi
2. **Kaydet**: Görev oluşturulur
3. **Tamamla**: Status `TODO` → `COMPLETED`

#### 🏁 Bitiş
- Görev tamamlanır → **İlgili süreç devam eder**

---

## 📢 6. PAZARLAMA & ANALİZ

### 📧 6.1. EMAIL KAMPANYALARI (Email Campaigns)

#### 🎯 Başlangıç
- **Sayfa**: `/email-campaigns`
- **Buton**: "Yeni Kampanya" (+ butonu)

#### 📍 Ne Yapılır
1. **Oluşturma**: Kampanya adı, hedef kitle, email şablonu, gönderim tarihi
2. **Kaydet**: Kampanya oluşturulur
3. **Gönder**: Kampanya gönderilir

#### 🏁 Bitiş
- Kampanya gönderilir → **Email gönderilir** → **Sonuçlar takip edilir**

---

### 🎯 6.2. RAKİP ANALİZİ (Competitors)

#### 🎯 Başlangıç
- **Sayfa**: `/competitors`
- **Buton**: "Yeni Rakipler" (+ butonu)

#### 📍 Ne Yapılır
1. **Oluşturma**: Rakip adı, güçlü yönler, zayıf yönler, fiyat bilgileri
2. **Kaydet**: Rakip kaydı oluşturulur
3. **Detay Sayfası**: Rakip bilgileri, ilişkili kayıtlar (Deals)

#### 🏁 Bitiş
- Rakip kaydı oluşturulur → **Deal analizlerinde kullanılır**

---

## 🏢 7. YÖNETİM

### 📁 7.1. DÖKÜMANLAR (Documents)

#### 🎯 Başlangıç
- **Sayfa**: `/documents`
- **Buton**: "Yeni Döküman" (+ butonu)

#### 📍 Ne Yapılır
1. **Yükleme**: Dosya seç, kategorize et, ilişkilendir (Deal, Quote, Invoice, vb.)
2. **Kaydet**: Döküman yüklenir
3. **Detay Sayfası**: Döküman bilgileri, indirme, silme

#### 🏁 Bitiş
- Döküman yüklenir → **İlgili kayıtlarda görünür**

---

### 🏪 7.2. TEDARİKÇİLER (Vendors)

#### 🎯 Başlangıç
- **Sayfa**: `/vendors`
- **Buton**: "Yeni Tedarikçi" (+ butonu)

#### 📍 Ne Yapılır
1. **Oluşturma**: Tedarikçi adı, iletişim bilgileri, ürünler, fiyatlar
2. **Kaydet**: Tedarikçi oluşturulur
3. **Detay Sayfası**: Tedarikçi bilgileri, ilişkili kayıtlar (Products, Purchase Shipments)

#### 🏁 Bitiş
- Tedarikçi oluşturulur → **Purchase Shipment** oluşturulabilir

---

### 📊 7.3. RAPORLAR (Reports)

#### 🎯 Başlangıç
- **Sayfa**: `/reports`
- **Ne Görürsün**: Satış raporları, fatura raporları, müşteri raporları, zaman bazlı raporlar

#### 📍 Ne Yapılır
1. **Filtrele**: Tarih aralığı, müşteri, ürün, kategori
2. **Görüntüle**: Grafikler, tablolar, özetler
3. **Export**: Excel, PDF, CSV

#### 🏁 Bitiş
- Rapor görüntülenir → **Export edilebilir**

---

### 📧 7.4. E-POSTA ŞABLONLARI (Email Templates)

#### 🎯 Başlangıç
- **Sayfa**: `/email-templates`
- **Buton**: "Yeni Şablon" (+ butonu)

#### 📍 Ne Yapılır
1. **Oluşturma**: Şablon adı, kategori, konu, içerik, değişkenler
2. **Kaydet**: Şablon oluşturulur
3. **Kullan**: Email kampanyalarında veya otomatik email'lerde kullanılır

#### 🏁 Bitiş
- Şablon oluşturulur → **Email kampanyalarında kullanılır**

---

## 🔄 TAM İŞ AKIŞI ÖRNEĞİ

### 📋 Senaryo: Yeni Müşteriden Satışa Kadar

**1. Müşteri Oluştur** (`/customers`)
- Müşteri bilgileri girilir
- ✅ Müşteri oluşturulur

**2. Fırsat Oluştur** (`/deals`)
- DealForm → `LEAD` aşaması
- Müşteri seçilir, değer girilir
- ✅ Deal oluşturulur

**3. Fırsat İlerlet** (Kanban'da sürükle-bırak)
- `LEAD` → `CONTACTED` (İletişim kuruldu)
- `CONTACTED` → `PROPOSAL` (Teklif hazırlandı)
- `PROPOSAL` → `NEGOTIATION` (Pazarlık yapıldı)
- `NEGOTIATION` → `WON` (Kazanıldı!)
- ✅ **Contract DRAFT** otomatik oluşturulur

**4. Teklif Oluştur** (`/quotes`)
- QuoteForm → `DRAFT` aşaması
- Deal seçilir, ürünler eklenir
- ✅ Quote oluşturulur

**5. Teklif Gönder** (Kanban'da sürükle-bırak)
- `DRAFT` → `SENT` (Gönderildi)
- ✅ **Notification** gönderilir

**6. Teklif Kabul Et** (Kanban'da sürükle-bırak)
- `SENT` → `ACCEPTED` (Kabul edildi!)
- ✅ **Invoice DRAFT** otomatik oluşturulur
- ✅ **Contract DRAFT** otomatik oluşturulur
- ✅ **Stok rezervasyonu** yapılır

**7. Fatura Gönder** (`/invoices`)
- InvoiceForm → `DRAFT` aşaması
- Quote seçilir, detaylar kontrol edilir
- Kanban'da `DRAFT` → `SENT` (Gönderildi)
- ✅ **Shipment PENDING** otomatik oluşturulur

**8. Sevkiyat Onayla** (`/shipments`)
- ShipmentForm → `PENDING` aşaması
- Invoice seçilir, sevkiyat bilgileri girilir
- Status `PENDING` → `APPROVED` (Onaylandı)
- ✅ **Stok düşer** (Product.stock azalır)
- ✅ **Rezerve miktar azalır** (Product.reservedQuantity azalır)

**9. Fatura Ödendi** (`/invoices`)
- Kanban'da `SENT` → `PAID` (Ödendi)
- ✅ **Finance INCOME** kaydı otomatik oluşturulur
- ✅ **Notification** gönderilir

**10. Sevkiyat Teslim Edildi** (`/shipments`)
- Status `APPROVED` → `DELIVERED` (Teslim edildi)
- ✅ **Notification** gönderilir

---

## 🎯 ÖZET

### ✅ Kanban Workflow'ları
1. **Deals**: LEAD → CONTACTED → PROPOSAL → NEGOTIATION → WON/LOST
2. **Quotes**: DRAFT → SENT → ACCEPTED/REJECTED
3. **Invoices**: DRAFT → SENT → PAID/OVERDUE/CANCELLED

### 🤖 Otomasyonlar
- **Deal WON** → Contract oluştur
- **Quote ACCEPTED** → Invoice + Contract oluştur + Stok rezervasyonu
- **Invoice PAID** → Finance kaydı oluştur
- **Invoice SENT** → Shipment oluştur
- **Shipment APPROVED** → Stok düşer
- **Contract ACTIVE** → Invoice oluştur

### 🔒 Koruma Mekanizmaları
- **WON/LOST** → Değiştirilemez, silinemez
- **ACCEPTED** → Değiştirilemez, silinemez
- **PAID** → Değiştirilemez, silinemez

---

**Tüm workflow'lar sidebar'dan başlar, Kanban'da ilerler, otomasyonlarla devam eder ve sonlanır!** 🚀

