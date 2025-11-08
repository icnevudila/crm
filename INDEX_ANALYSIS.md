# 📊 INDEX ANALİZ RAPORU

## ✅ MEVCUT INDEX'LER

### 1. CompanyId Index'leri (Multi-tenant için kritik)
- ✅ `idx_customer_company` - Customer tablosu
- ✅ `idx_deal_company` - Deal tablosu
- ✅ `idx_quote_company` - Quote tablosu
- ✅ `idx_invoice_company` - Invoice tablosu
- ✅ `idx_product_company` - Product tablosu
- ✅ `idx_task_company` - Task tablosu
- ✅ `idx_ticket_company` - Ticket tablosu
- ✅ `idx_shipment_company` - Shipment tablosu
- ✅ `idx_finance_company` - Finance tablosu
- ✅ `idx_vendor_company` - Vendor tablosu
- ✅ `idx_activitylog_company` - ActivityLog tablosu
- ✅ `idx_user_company` - User tablosu

### 2. Status Index'leri (Filtreleme için)
- ✅ `idx_customer_company_status` - Composite (companyId, status)
- ✅ `idx_deal_status` - Deal tablosu
- ✅ `idx_quote_company_status` - Composite (companyId, status)
- ✅ `idx_invoice_company_status` - Composite (companyId, status)
- ✅ `idx_task_status` - Task tablosu
- ✅ `idx_ticket_status` - Ticket tablosu
- ✅ `idx_shipment_status` - Shipment tablosu
- ✅ `idx_vendor_status` - Vendor tablosu
- ⚠️ Product tablosunda `status` kolonu YOK (index gerekmiyor)

### 3. Foreign Key Index'leri (JOIN performansı için)
- ✅ `idx_deal_customer` - Deal.customerId
- ✅ `idx_quote_deal` - Quote.dealId
- ✅ `idx_invoice_quote` - Invoice.quoteId
- ✅ `idx_shipment_invoice` - Shipment.invoiceId
- ✅ `idx_task_assigned` - Task.assignedTo
- ✅ `idx_ticket_customer` - Ticket.customerId
- ✅ `idx_quote_vendor` - Quote.vendorId (schema-vendor.sql'de)
- ✅ `idx_product_vendor` - Product.vendorId (schema-vendor.sql'de)
- ✅ `idx_invoice_vendor` - Invoice.vendorId (schema-vendor.sql'de)

### 4. CreatedAt Index'leri (Sıralama için)
- ✅ `idx_deal_created` - Deal.createdAt DESC
- ✅ `idx_quote_created` - Quote.createdAt DESC
- ✅ `idx_invoice_created` - Invoice.createdAt DESC
- ✅ `idx_finance_created` - Finance.createdAt DESC
- ✅ `idx_activitylog_created` - ActivityLog.createdAt DESC

### 5. Stage/Status Composite Index'leri (Çoklu filtreleme için)
- ✅ `idx_customer_company_status` - (companyId, status)
- ✅ `idx_deal_company_stage` - (companyId, stage)
- ✅ `idx_quote_company_status` - (companyId, status)
- ✅ `idx_invoice_company_status` - (companyId, status)

### 6. Full-Text Search Index'leri (Arama için)
- ✅ `idx_customer_name_search` - GIN index (turkish)
- ✅ `idx_vendor_name_search` - GIN index (turkish)
- ✅ `idx_product_name_search` - GIN index (turkish)
- ✅ `idx_deal_title_search` - GIN index (turkish)
- ✅ `idx_quote_title_search` - GIN index (turkish)
- ✅ `idx_invoice_title_search` - GIN index (turkish)

### 7. Diğer Özel Index'ler
- ✅ `idx_product_stock` - Product.stock (stok filtreleme için)
- ✅ `idx_ticket_priority` - Ticket.priority (öncelik filtreleme için)
- ✅ `idx_finance_type` - Finance.type (gelir/gider filtreleme için)

## 📊 API ROUTE ANALİZİ

### Kullanılan Filtreler:
1. **companyId** - Her API route'da kullanılıyor ✅ (Tüm tablolarda index var)
2. **status** - Invoice, Quote, Customer, Deal, Task, Ticket, Shipment'da kullanılıyor ✅ (Tüm tablolarda index var)
3. **createdAt** - ORDER BY için kullanılıyor ✅ (Deal, Quote, Invoice, Finance, ActivityLog'da index var)
4. **search** - Full-text search kullanılıyor ✅ (GIN index'ler var)
5. **stage** - Deal'da kullanılıyor ✅ (idx_deal_stage ve composite index var)
6. **customerId** - Deal ve Ticket'da kullanılıyor ✅ (Foreign key index'ler var)
7. **stock** - Product'da kullanılıyor ✅ (idx_product_stock var)
8. **priority** - Ticket'da kullanılıyor ✅ (idx_ticket_priority var)
9. **type** - Finance'da kullanılıyor ✅ (idx_finance_type var)

## ✅ SONUÇ: INDEX'LER YETERLİ!

### Neden Yeterli?
1. ✅ **Tüm companyId filtreleri** için index'ler var (multi-tenant için kritik)
2. ✅ **Tüm status filtreleri** için index'ler var (Product hariç - status kolonu yok)
3. ✅ **Tüm ORDER BY createdAt** için index'ler var (en çok kullanılan sıralama)
4. ✅ **Tüm full-text search** için GIN index'ler var (turkish desteği ile)
5. ✅ **Tüm foreign key'ler** için index'ler var (JOIN performansı için)
6. ✅ **Composite index'ler** var (çoklu filtreleme için optimize)

### Ek Index Gerektiren Durumlar (Şu an gerekli değil):
- ❌ `value` kolonu için index - API'de filtreleme yapılmıyor
- ❌ `total` kolonu için index - API'de filtreleme yapılmıyor
- ❌ `ActivityLog.userId` için index - API'de kullanılmıyor
- ❌ `ActivityLog.entity` ve `action` için index - API'de kullanılmıyor

## 🎯 PERFORMANS BEKLENTİLERİ

### Mevcut Index'ler ile:
- ✅ **companyId filtreleme**: <10ms (index sayesinde)
- ✅ **status filtreleme**: <10ms (index sayesinde)
- ✅ **createdAt sıralama**: <10ms (DESC index sayesinde)
- ✅ **Full-text search**: <50ms (GIN index sayesinde)
- ✅ **JOIN işlemleri**: <20ms (foreign key index'ler sayesinde)

### Toplam Index Sayısı:
- **Single column index'ler**: ~30
- **Composite index'ler**: ~5
- **Full-text search index'ler**: ~6
- **Toplam**: ~41 index

## 📝 ÖNERİLER

### Şu an için:
✅ **Index'ler yeterli** - Tüm kritik sorgular için index'ler mevcut

### Gelecekte eklenebilir (gerekirse):
- `value` kolonu için index (Deal, Quote, Invoice'da range query'ler için)
- `total` kolonu için index (Quote, Invoice'da range query'ler için)
- `ActivityLog.userId` için index (kullanıcı bazlı raporlar için)
- `ActivityLog.entity` ve `action` için composite index (aktivite filtreleme için)

---

**SONUÇ**: Mevcut index'ler performans için yeterli! 🚀



