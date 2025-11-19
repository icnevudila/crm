# 🔍 TÜM SAYFALAR KONTROL RAPORU

**Tarih:** 2024  
**Kontrol:** Tüm sayfalarda açma, kaydetme, silme, görüntüleme işlemleri

---

## 📋 KONTROL EDİLECEK SAYFALAR

### 1. Müşteriler (Customers)
- [ ] CustomerList.tsx - Liste, silme, toast
- [ ] CustomerForm.tsx - Kaydetme, toast
- [ ] CustomerDetailModal.tsx - Görüntüleme, silme, toast
- [ ] customers/page.tsx - Sayfa açılma
- [ ] customers/[id]/page.tsx - Detay sayfası

### 2. Fırsatlar (Deals)
- [ ] DealList.tsx - Liste, silme, toast
- [ ] DealForm.tsx - Kaydetme, toast
- [ ] DealDetailModal.tsx - Görüntüleme, silme, toast
- [ ] deals/page.tsx - Sayfa açılma
- [ ] deals/[id]/page.tsx - Detay sayfası

### 3. Teklifler (Quotes)
- [ ] QuoteList.tsx - Liste, silme, toast
- [ ] QuoteForm.tsx - Kaydetme, toast
- [ ] QuoteDetailModal.tsx - Görüntüleme, silme, toast
- [ ] quotes/page.tsx - Sayfa açılma
- [ ] quotes/[id]/page.tsx - Detay sayfası

### 4. Faturalar (Invoices)
- [ ] InvoiceList.tsx - Liste, silme, toast
- [ ] InvoiceForm.tsx - Kaydetme, toast
- [ ] InvoiceDetailModal.tsx - Görüntüleme, silme, toast
- [ ] invoices/page.tsx - Sayfa açılma
- [ ] invoices/[id]/page.tsx - Detay sayfası

### 5. Sevkiyatlar (Shipments)
- [ ] ShipmentList.tsx - Liste, silme, toast
- [ ] ShipmentForm.tsx - Kaydetme, toast
- [ ] shipments/page.tsx - Sayfa açılma
- [ ] shipments/[id]/page.tsx - Detay sayfası

### 6. Görevler (Tasks)
- [ ] TaskList.tsx - Liste, silme, toast
- [ ] TaskForm.tsx - Kaydetme, toast
- [ ] TaskDetailModal.tsx - Görüntüleme, silme, toast
- [ ] tasks/page.tsx - Sayfa açılma
- [ ] tasks/[id]/page.tsx - Detay sayfası

### 7. Talepler (Tickets)
- [ ] TicketList.tsx - Liste, silme, toast
- [ ] TicketForm.tsx - Kaydetme, toast
- [ ] TicketDetailModal.tsx - Görüntüleme, silme, toast
- [ ] tickets/page.tsx - Sayfa açılma
- [ ] tickets/[id]/page.tsx - Detay sayfası

### 8. Görüşmeler (Meetings)
- [ ] MeetingList.tsx - Liste, silme, toast
- [ ] MeetingForm.tsx - Kaydetme, toast
- [ ] MeetingDetailModal.tsx - Görüntüleme, silme, toast
- [ ] meetings/page.tsx - Sayfa açılma
- [ ] meetings/[id]/page.tsx - Detay sayfası

### 9. Finans (Finance)
- [ ] FinanceList.tsx - Liste, silme, toast
- [ ] FinanceForm.tsx - Kaydetme, toast
- [ ] FinanceDetailModal.tsx - Görüntüleme, silme, toast
- [ ] finance/page.tsx - Sayfa açılma
- [ ] finance/[id]/page.tsx - Detay sayfası

### 10. Ürünler (Products)
- [ ] ProductList.tsx - Liste, silme, toast
- [ ] ProductForm.tsx - Kaydetme, toast
- [ ] ProductDetailModal.tsx - Görüntüleme, silme, toast
- [ ] products/page.tsx - Sayfa açılma
- [ ] products/[id]/page.tsx - Detay sayfası

### 11. Firmalar (Companies)
- [ ] CompanyList.tsx - Liste, silme, toast
- [ ] CompanyForm.tsx - Kaydetme, toast
- [ ] CompanyDetailModal.tsx - Görüntüleme, silme, toast
- [ ] companies/page.tsx - Sayfa açılma
- [ ] companies/[id]/page.tsx - Detay sayfası

### 12. Firma Yetkilileri (Contacts)
- [ ] ContactList.tsx - Liste, silme, toast
- [ ] ContactForm.tsx - Kaydetme, toast
- [ ] ContactDetailModal.tsx - Görüntüleme, silme, toast
- [ ] contacts/page.tsx - Sayfa açılma
- [ ] contacts/[id]/page.tsx - Detay sayfası

### 13. Tedarikçiler (Vendors)
- [ ] VendorList.tsx - Liste, silme, toast
- [ ] VendorForm.tsx - Kaydetme, toast
- [ ] VendorDetailModal.tsx - Görüntüleme, silme, toast
- [ ] vendors/page.tsx - Sayfa açılma
- [ ] vendors/[id]/page.tsx - Detay sayfası

### 14. Sözleşmeler (Contracts)
- [ ] ContractList.tsx - Liste, silme, toast
- [ ] ContractForm.tsx - Kaydetme, toast
- [ ] ContractDetailModal.tsx - Görüntüleme, silme, toast
- [ ] contracts/page.tsx - Sayfa açılma
- [ ] contracts/[id]/page.tsx - Detay sayfası

### 15. Segmentler (Segments)
- [ ] SegmentList.tsx - Liste, silme, toast
- [ ] SegmentForm.tsx - Kaydetme, toast
- [ ] SegmentDetailModal.tsx - Görüntüleme, silme, toast
- [ ] segments/page.tsx - Sayfa açılma
- [ ] segments/[id]/page.tsx - Detay sayfası

---

## ✅ KONTROL KRİTERLERİ

Her sayfa için kontrol edilecekler:

1. **Açılma (Loading)**
   - [ ] Sayfa açılıyor mu?
   - [ ] Skeleton gösteriliyor mu?
   - [ ] Hata durumunda mesaj gösteriliyor mu?

2. **Kaydetme (Create/Update)**
   - [ ] Form açılıyor mu?
   - [ ] Kaydetme başarılı toast'u var mı?
   - [ ] Kaydetme hatası toast'u var mı?
   - [ ] Form validation çalışıyor mu?

3. **Silme (Delete)**
   - [ ] Silme onayı var mı?
   - [ ] Silme başarılı toast'u var mı?
   - [ ] Silme hatası toast'u var mı?

4. **Görüntüleme (View)**
   - [ ] Detay sayfası açılıyor mu?
   - [ ] Veriler gösteriliyor mu?
   - [ ] Hata durumunda mesaj var mı?

5. **Toast Mesajları**
   - [ ] Format doğru mu? `toast.success('Başlık', { description: 'Açıklama' })`
   - [ ] Tüm işlemlerde toast var mı?
   - [ ] Hata mesajları açıklayıcı mı?

---

**Başlangıç:** Kontrol başlatılıyor...

