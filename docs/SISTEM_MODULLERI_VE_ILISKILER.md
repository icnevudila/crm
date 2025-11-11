# 📊 CRM Enterprise V3 - Modüller ve İlişkiler Özeti

## 🏗️ Sistem Mimarisi

### Multi-Tenant Yapı
- **Ana Tablo**: `Company` (Multi-tenant root)
- **Tüm tablolar**: `companyId` kolonu ile bir şirkete bağlı
- **RLS (Row-Level Security)**: Kullanıcılar sadece kendi şirketinin verisini görür
- **SUPER_ADMIN**: Tüm şirketleri görebilir ve yönetebilir

---

## 📋 MODÜLLER (Module Tablosu)

Sistemde **10 modül** tanımlı:

| Modül Kodu | Modül Adı | Açıklama | İkon |
|------------|-----------|----------|------|
| `dashboard` | Dashboard | Ana gösterge paneli | LayoutDashboard |
| `companies` | Firmalar | Müşteri firmaları yönetimi | Building2 |
| `vendors` | Tedarikçiler | Tedarikçi yönetimi | Store |
| `customers` | Müşteriler | Müşteri yönetimi | Users |
| `quotes` | Teklifler | Teklif yönetimi | FileText |
| `products` | Ürünler | Ürün yönetimi | Package |
| `finance` | Finans | Finans yönetimi | ShoppingCart |
| `reports` | Raporlar | Raporlar ve analitik | BarChart3 |
| `shipments` | Sevkiyatlar | Sevkiyat yönetimi | Truck |
| `stock` | Stok | Stok yönetimi | Package |

---

## 🔐 YETKİ YÖNETİMİ SİSTEMİ

### 1. Roller (Role Tablosu)

| Rol Kodu | Rol Adı | Açıklama | Sistem Rolü |
|----------|---------|----------|-------------|
| `SUPER_ADMIN` | Süper Admin | Sistem yöneticisi - tüm yetkilere sahip | ✅ Evet |
| `ADMIN` | Admin | Şirket yöneticisi - şirket içi tüm yetkilere sahip | ❌ Hayır |
| `SALES` | Satış Temsilcisi | Satış işlemleri yapabilir | ❌ Hayır |
| `USER` | Kullanıcı | Temel kullanıcı - sınırlı yetkiler | ❌ Hayır |

### 2. Yetki Kontrolü (2 Seviyeli)

**Seviye 1: Kurum Modül İzni (CompanyModulePermission)**
- Her kurumun hangi modülleri kullanabileceği belirlenir
- `Company` ↔ `Module` ilişkisi
- `enabled: true/false` ile kontrol edilir

**Seviye 2: Rol Modül İzni (RolePermission)**
- Her rolün modül bazlı CRUD yetkileri
- `Role` ↔ `Module` ilişkisi
- `canCreate`, `canRead`, `canUpdate`, `canDelete` ile kontrol edilir

**Yetki Kontrol Akışı:**
```
1. Kullanıcı bir modüle erişmek istediğinde:
   → Önce CompanyModulePermission kontrol edilir (kurum modül izni var mı?)
   → Sonra RolePermission kontrol edilir (rol modül izni var mı?)
   
2. SUPER_ADMIN: Her zaman tüm yetkilere sahip (bypass)
3. ADMIN: Kendi şirketi için tüm yetkilere sahip
```

---

## 🗄️ VERİTABANI TABLOLARI VE İLİŞKİLER

### Ana Tablolar

#### 1. **Company** (Multi-tenant root)
```
Company
├── id (UUID, PK)
├── name (VARCHAR)
├── sector (VARCHAR)
├── city (VARCHAR)
├── status (VARCHAR) → 'ACTIVE' | 'INACTIVE'
├── createdAt
└── updatedAt

İlişkiler:
├── → User (1:N) - ON DELETE CASCADE
├── → Customer (1:N) - ON DELETE CASCADE
├── → Deal (1:N) - ON DELETE CASCADE
├── → Quote (1:N) - ON DELETE CASCADE
├── → Invoice (1:N) - ON DELETE CASCADE
├── → Product (1:N) - ON DELETE CASCADE
├── → Finance (1:N) - ON DELETE CASCADE
├── → Task (1:N) - ON DELETE CASCADE
├── → Ticket (1:N) - ON DELETE CASCADE
├── → Shipment (1:N) - ON DELETE CASCADE
├── → ActivityLog (1:N) - ON DELETE CASCADE
├── → CustomerCompany (1:N) - ON DELETE CASCADE
├── → Vendor (1:N) - ON DELETE CASCADE
└── → CompanyModulePermission (1:N) - ON DELETE CASCADE
```

#### 2. **User** (Kullanıcılar)
```
User
├── id (UUID, PK)
├── name (VARCHAR)
├── email (VARCHAR, UNIQUE)
├── password (VARCHAR)
├── role (VARCHAR) → 'SUPER_ADMIN' | 'ADMIN' | 'SALES' | 'USER'
├── companyId (UUID, FK → Company.id) - ON DELETE CASCADE
├── roleId (UUID, FK → Role.id) - ON DELETE SET NULL
├── createdAt
└── updatedAt

İlişkiler:
├── ← Company (N:1)
├── ← Role (N:1)
├── → Task (1:N) - assignedTo, ON DELETE SET NULL
├── → ActivityLog (1:N) - userId, ON DELETE SET NULL
└── → UserPermission (1:N) - userId, ON DELETE CASCADE
```

#### 3. **Customer** (Müşteriler)
```
Customer
├── id (UUID, PK)
├── name (VARCHAR)
├── email (VARCHAR)
├── phone (VARCHAR)
├── city (VARCHAR)
├── status (VARCHAR) → 'ACTIVE' | 'INACTIVE'
├── companyId (UUID, FK → Company.id) - ON DELETE CASCADE
├── customerCompanyId (UUID, FK → CustomerCompany.id) - ON DELETE SET NULL
├── createdAt
└── updatedAt

İlişkiler:
├── ← Company (N:1)
├── ← CustomerCompany (N:1)
├── → Deal (1:N) - customerId, ON DELETE SET NULL
└── → Ticket (1:N) - customerId, ON DELETE SET NULL
```

#### 4. **CustomerCompany** (Müşteri Firmaları)
```
CustomerCompany
├── id (UUID, PK)
├── name (VARCHAR)
├── sector (VARCHAR)
├── city (VARCHAR)
├── address (TEXT)
├── phone (VARCHAR)
├── email (VARCHAR)
├── website (VARCHAR)
├── taxNumber (VARCHAR)
├── taxOffice (VARCHAR)
├── description (TEXT)
├── status (VARCHAR) → 'ACTIVE' | 'INACTIVE'
├── companyId (UUID, FK → Company.id) - ON DELETE CASCADE
├── createdAt
└── updatedAt

İlişkiler:
├── ← Company (N:1)
└── → Customer (1:N) - customerCompanyId, ON DELETE SET NULL
```

#### 5. **Vendor** (Tedarikçiler)
```
Vendor
├── id (UUID, PK)
├── name (VARCHAR)
├── email (VARCHAR)
├── phone (VARCHAR)
├── address (TEXT)
├── sector (VARCHAR)
├── city (VARCHAR)
├── website (VARCHAR)
├── taxNumber (VARCHAR)
├── taxOffice (VARCHAR)
├── description (TEXT)
├── status (VARCHAR) → 'ACTIVE' | 'INACTIVE'
├── companyId (UUID, FK → Company.id) - ON DELETE CASCADE
├── createdAt
└── updatedAt

İlişkiler:
├── ← Company (N:1)
└── → Invoice (1:N) - PURCHASE tipi faturalar, vendorId ile ilişkili
```

#### 6. **Deal** (Fırsatlar)
```
Deal
├── id (UUID, PK)
├── title (VARCHAR)
├── stage (VARCHAR) → 'LEAD' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST'
├── value (DECIMAL)
├── status (VARCHAR) → 'OPEN' | 'CLOSED'
├── companyId (UUID, FK → Company.id) - ON DELETE CASCADE
├── customerId (UUID, FK → Customer.id) - ON DELETE SET NULL
├── createdAt
└── updatedAt

İlişkiler:
├── ← Company (N:1)
├── ← Customer (N:1)
└── → Quote (1:N) - dealId, ON DELETE SET NULL
```

#### 7. **Quote** (Teklifler)
```
Quote
├── id (UUID, PK)
├── title (VARCHAR)
├── status (VARCHAR) → 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED'
├── total (DECIMAL)
├── dealId (UUID, FK → Deal.id) - ON DELETE SET NULL
├── companyId (UUID, FK → Company.id) - ON DELETE CASCADE
├── createdAt
└── updatedAt

İlişkiler:
├── ← Company (N:1)
├── ← Deal (N:1)
└── → Invoice (1:N) - quoteId, ON DELETE SET NULL
```

#### 8. **Invoice** (Faturalar)
```
Invoice
├── id (UUID, PK)
├── title (VARCHAR)
├── status (VARCHAR) → 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED'
├── type (VARCHAR) → 'SALE' | 'PURCHASE'
├── total (DECIMAL)
├── quoteId (UUID, FK → Quote.id) - ON DELETE SET NULL
├── shipmentId (UUID, FK → Shipment.id) - ON DELETE SET NULL
├── purchaseShipmentId (UUID, FK → PurchaseTransaction.id) - ON DELETE SET NULL
├── companyId (UUID, FK → Company.id) - ON DELETE CASCADE
├── createdAt
└── updatedAt

İlişkiler:
├── ← Company (N:1)
├── ← Quote (N:1)
├── ← Shipment (N:1)
├── ← PurchaseTransaction (N:1)
├── → InvoiceItem (1:N) - invoiceId, ON DELETE CASCADE
├── → Shipment (1:N) - invoiceId, ON DELETE SET NULL
└── → Finance (1:N) - relatedTo='Invoice', relatedId
```

#### 8.1. **PurchaseTransaction** (Alış İşlemleri)
```
PurchaseTransaction
├── id (UUID, PK)
├── invoiceId (UUID, FK → Invoice.id) - ON DELETE CASCADE, UNIQUE
├── status (VARCHAR) → 'DRAFT' | 'APPROVED' | 'CANCELLED'
├── companyId (UUID, FK → Company.id) - ON DELETE CASCADE
├── createdAt
└── updatedAt

İlişkiler:
├── ← Company (N:1)
└── ← Invoice (1:1) - UNIQUE(invoiceId)

Özel: Alış faturası onaylandığında stok artışı yapılır (trigger)
```

#### 9. **InvoiceItem** (Fatura Kalemleri)
```
InvoiceItem
├── id (UUID, PK)
├── invoiceId (UUID, FK → Invoice.id) - ON DELETE CASCADE
├── productId (UUID, FK → Product.id) - ON DELETE CASCADE
├── quantity (DECIMAL)
├── unitPrice (DECIMAL)
├── total (DECIMAL)
├── companyId (UUID, FK → Company.id) - ON DELETE CASCADE
├── createdAt
└── updatedAt

İlişkiler:
├── ← Invoice (N:1)
├── ← Product (N:1)
└── ← Company (N:1)

Özel: UNIQUE(invoiceId, productId) - Aynı ürün aynı faturada birden fazla eklenemez
```

#### 10. **Product** (Ürünler)
```
Product
├── id (UUID, PK)
├── name (VARCHAR)
├── price (DECIMAL)
├── stock (DECIMAL) → Mevcut stok miktarı
├── reservedQuantity (DECIMAL) → Rezerve miktar (satış için)
├── incomingQuantity (DECIMAL) → Beklenen giriş miktarı (alış için)
├── description (TEXT)
├── imageUrl (TEXT)
├── category (VARCHAR)
├── sku (VARCHAR)
├── barcode (VARCHAR)
├── status (VARCHAR) → 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED'
├── minStock (DECIMAL)
├── maxStock (DECIMAL)
├── unit (VARCHAR) → 'ADET' | 'KG' | 'LITRE' | vb.
├── weight (DECIMAL)
├── dimensions (VARCHAR)
├── companyId (UUID, FK → Company.id) - ON DELETE CASCADE
├── createdAt
└── updatedAt

İlişkiler:
├── ← Company (N:1)
├── → InvoiceItem (1:N) - productId, ON DELETE CASCADE
├── → StockMovement (1:N) - productId, ON DELETE CASCADE
└── → ReservedStock (1:N) - productId, ON DELETE CASCADE

Özel Stok Hesaplama:
- Available Stock = stock - reservedQuantity (Kullanılabilir stok)
- Total Stock = stock + incomingQuantity (Toplam stok)
```

#### 11. **StockMovement** (Stok Hareketleri)
```
StockMovement
├── id (UUID, PK)
├── productId (UUID, FK → Product.id) - ON DELETE CASCADE
├── type (VARCHAR) → 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN'
├── quantity (DECIMAL) → Pozitif veya negatif
├── previousStock (DECIMAL)
├── newStock (DECIMAL)
├── reason (VARCHAR) → 'SATIS' | 'ALIS' | 'DÜZELTME' | 'IADE' | vb.
├── relatedTo (VARCHAR) → 'Invoice' | 'Quote' | vb.
├── relatedId (UUID)
├── notes (TEXT)
├── userId (UUID, FK → User.id) - ON DELETE SET NULL
├── companyId (UUID, FK → Company.id) - ON DELETE CASCADE
└── createdAt

İlişkiler:
├── ← Product (N:1)
├── ← User (N:1)
└── ← Company (N:1)
```

#### 12. **ReservedStock** (Rezerve Stok)
```
ReservedStock
├── id (UUID, PK)
├── productId (UUID, FK → Product.id) - ON DELETE CASCADE
├── quantity (DECIMAL)
├── reason (VARCHAR) → 'QUOTE' | 'PURCHASE_ORDER' | vb.
├── relatedTo (VARCHAR) → 'Quote' | 'PurchaseOrder' | vb.
├── relatedId (UUID)
├── status (VARCHAR) → 'RESERVED' | 'RELEASED' | 'CONSUMED'
├── companyId (UUID, FK → Company.id) - ON DELETE CASCADE
├── createdAt
└── updatedAt

İlişkiler:
├── ← Product (N:1)
└── ← Company (N:1)
```

#### 13. **Finance** (Finans)
```
Finance
├── id (UUID, PK)
├── type (VARCHAR) → 'INCOME' | 'EXPENSE'
├── amount (DECIMAL)
├── relatedTo (VARCHAR) → 'Invoice' | 'Payment' | vb.
├── relatedId (UUID)
├── companyId (UUID, FK → Company.id) - ON DELETE CASCADE
├── createdAt
└── updatedAt

İlişkiler:
└── ← Company (N:1)
```

#### 14. **Task** (Görevler)
```
Task
├── id (UUID, PK)
├── title (VARCHAR)
├── status (VARCHAR) → 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED'
├── assignedTo (UUID, FK → User.id) - ON DELETE SET NULL
├── companyId (UUID, FK → Company.id) - ON DELETE CASCADE
├── createdAt
└── updatedAt

İlişkiler:
├── ← Company (N:1)
└── ← User (N:1)
```

#### 15. **Ticket** (Destek Talepleri)
```
Ticket
├── id (UUID, PK)
├── subject (VARCHAR)
├── status (VARCHAR) → 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
├── priority (VARCHAR) → 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
├── companyId (UUID, FK → Company.id) - ON DELETE CASCADE
├── customerId (UUID, FK → Customer.id) - ON DELETE SET NULL
├── createdAt
└── updatedAt

İlişkiler:
├── ← Company (N:1)
└── ← Customer (N:1)
```

#### 16. **Shipment** (Sevkiyatlar)
```
Shipment
├── id (UUID, PK)
├── tracking (VARCHAR)
├── status (VARCHAR) → 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED'
├── invoiceId (UUID, FK → Invoice.id) - ON DELETE SET NULL
├── companyId (UUID, FK → Company.id) - ON DELETE CASCADE
├── createdAt
└── updatedAt

İlişkiler:
├── ← Company (N:1)
└── ← Invoice (N:1)
```

#### 17. **ActivityLog** (Aktivite Logları)
```
ActivityLog
├── id (UUID, PK)
├── entity (VARCHAR) → 'Customer' | 'Deal' | 'Quote' | vb.
├── action (VARCHAR) → 'CREATE' | 'UPDATE' | 'DELETE'
├── description (TEXT)
├── meta (JSONB) → Detaylı bilgiler JSON formatında
├── userId (UUID, FK → User.id) - ON DELETE SET NULL
├── companyId (UUID, FK → Company.id) - ON DELETE CASCADE
└── createdAt

İlişkiler:
├── ← Company (N:1)
└── ← User (N:1)
```

---

## 🔐 YETKİ YÖNETİMİ TABLOLARI

#### 18. **Module** (Modüller)
```
Module
├── id (UUID, PK)
├── code (VARCHAR, UNIQUE) → 'dashboard' | 'companies' | 'vendors' | vb.
├── name (VARCHAR) → 'Dashboard' | 'Firmalar' | 'Tedarikçiler' | vb.
├── description (TEXT)
├── icon (VARCHAR) → lucide-react icon name
├── isActive (BOOLEAN)
├── displayOrder (INTEGER)
├── createdAt
└── updatedAt

İlişkiler:
├── → CompanyModulePermission (1:N) - moduleId, ON DELETE CASCADE
└── → RolePermission (1:N) - moduleId, ON DELETE CASCADE
```

#### 19. **Role** (Roller)
```
Role
├── id (UUID, PK)
├── code (VARCHAR, UNIQUE) → 'SUPER_ADMIN' | 'ADMIN' | 'SALES' | 'USER'
├── name (VARCHAR) → 'Süper Admin' | 'Admin' | 'Satış Temsilcisi' | 'Kullanıcı'
├── description (TEXT)
├── isSystemRole (BOOLEAN) → Sistem rolü mü? (SUPER_ADMIN gibi)
├── isActive (BOOLEAN)
├── createdAt
└── updatedAt

İlişkiler:
├── → User (1:N) - roleId, ON DELETE SET NULL
└── → RolePermission (1:N) - roleId, ON DELETE CASCADE
```

#### 20. **CompanyModulePermission** (Kurum Modül İzinleri)
```
CompanyModulePermission
├── id (UUID, PK)
├── companyId (UUID, FK → Company.id) - ON DELETE CASCADE
├── moduleId (UUID, FK → Module.id) - ON DELETE CASCADE
├── enabled (BOOLEAN) → Modül aktif mi?
├── createdAt
└── updatedAt

İlişkiler:
├── ← Company (N:1)
└── ← Module (N:1)

Özel: UNIQUE(companyId, moduleId) - Her kurum için her modül sadece bir kez tanımlanabilir
```

#### 21. **RolePermission** (Rol Modül İzinleri)
```
RolePermission
├── id (UUID, PK)
├── roleId (UUID, FK → Role.id) - ON DELETE CASCADE
├── moduleId (UUID, FK → Module.id) - ON DELETE CASCADE
├── canCreate (BOOLEAN) → Oluşturma yetkisi
├── canRead (BOOLEAN) → Okuma yetkisi
├── canUpdate (BOOLEAN) → Güncelleme yetkisi
├── canDelete (BOOLEAN) → Silme yetkisi
├── createdAt
└── updatedAt

İlişkiler:
├── ← Role (N:1)
└── ← Module (N:1)

Özel: UNIQUE(roleId, moduleId) - Her rol için her modül sadece bir kez tanımlanabilir
```

#### 22. **UserPermission** (Kullanıcı Özel İzinleri - Opsiyonel)
```
UserPermission
├── id (UUID, PK)
├── userId (UUID, FK → User.id) - ON DELETE CASCADE
├── companyId (UUID, FK → Company.id) - ON DELETE CASCADE
├── module (VARCHAR) → 'customer' | 'deal' | 'quote' | vb.
├── canCreate (BOOLEAN)
├── canRead (BOOLEAN)
├── canUpdate (BOOLEAN)
├── canDelete (BOOLEAN)
├── createdAt
└── updatedAt

İlişkiler:
├── ← User (N:1)
└── ← Company (N:1)

Özel: UNIQUE(userId, companyId, module) - Her kullanıcı için her modül sadece bir kez tanımlanabilir
```

---

## 🔄 İLİŞKİ AKIŞI (İş Akışı)

### Satış Akışı
```
Customer → Deal → Quote → Invoice → Shipment
   ↓         ↓       ↓        ↓         ↓
Company   Company  Company  Company  Company
```

### Stok Akışı
```
Product → InvoiceItem → StockMovement
   ↓           ↓            ↓
Company     Invoice      Company
```

### Finans Akışı
```
Invoice (PAID) → Finance (INCOME)
PurchaseOrder (PAID) → Finance (EXPENSE)
```

### Rezerve Stok Akışı
```
Quote → ReservedStock → Product (stock düşer)
PurchaseOrder → ReservedStock → Product (stock düşer)
```

---

## 📊 ÖZEL İLİŞKİLER VE KURALLAR

### 1. Multi-Tenant Yapı
- **Tüm tablolar** `companyId` kolonu ile bir şirkete bağlı
- **ON DELETE CASCADE**: Company silinince tüm veriler silinir
- **RLS**: Kullanıcılar sadece kendi şirketinin verisini görür

### 2. Yetki Kontrolü
- **2 Seviyeli Kontrol**:
  1. `CompanyModulePermission` → Kurum modül izni var mı?
  2. `RolePermission` → Rol modül izni var mı?
- **SUPER_ADMIN**: Her zaman bypass (tüm yetkilere sahip)
- **ADMIN**: Kendi şirketi için tüm yetkilere sahip

### 3. Otomasyonlar ve Trigger'lar

**Satış Akışı:**
- **InvoiceItem INSERT** → Product.reservedQuantity artar (stok düşmez)
- **InvoiceItem DELETE** → Product.reservedQuantity azalır
- **Shipment APPROVED** → Product.stock düşer + Product.reservedQuantity azalır + StockMovement oluştur

**Alış Akışı:**
- **InvoiceItem INSERT (PURCHASE)** → Product.incomingQuantity artar (stok artmaz)
- **InvoiceItem DELETE (PURCHASE)** → Product.incomingQuantity azalır
- **PurchaseTransaction APPROVED** → Product.stock artar + Product.incomingQuantity azalır + StockMovement oluştur

**Diğer:**
- **Quote ACCEPTED** → Invoice oluştur + ActivityLog
- **Invoice PAID** → Finance kaydı oluştur + ActivityLog
- **Shipment DELIVERED** → ActivityLog yaz

### 4. Trigger'lar

**Satış Trigger'ları:**
- `restore_reserved_on_invoice_item_delete()` → InvoiceItem silindiğinde rezerve miktarı geri ekle
- `update_stock_on_shipment_approval()` → Shipment onaylandığında stok düş ve rezerve miktarı azalt

**Alış Trigger'ları:**
- `restore_incoming_on_invoice_item_delete()` → InvoiceItem silindiğinde (PURCHASE) incomingQuantity geri ekle
- `update_stock_on_purchase_approval()` → PurchaseTransaction onaylandığında stok art ve incomingQuantity azalt

---

## 🎯 ÖZET

**Toplam Tablo Sayısı**: 24 tablo
- **Ana İş Tabloları**: 19 tablo
- **Yetki Yönetimi Tabloları**: 5 tablo

**Modül Sayısı**: 10 modül
- Dashboard, Firmalar, Tedarikçiler, Müşteriler, Teklifler, Ürünler, Finans, Raporlar, Sevkiyatlar, Stok

**Rol Sayısı**: 4 rol
- SUPER_ADMIN, ADMIN, SALES, USER

**Ana İlişki**: Company (Multi-tenant root) → Tüm tablolar

**Yetki Sistemi**: 2 seviyeli (Kurum Modül İzni + Rol Modül İzni)

