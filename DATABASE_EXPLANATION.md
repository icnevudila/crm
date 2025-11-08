# 📊 Veritabanı Yapısı - Company ve companyId İlişkisi

## 🏢 Multi-Tenant Yapı (Çoklu Şirket)

### Ana Mantık:
- **Company** tablosu → Ana şirket bilgileri (Tipplus Medikal, Global Un, ZahirTech)
- Her tablo → `companyId` kolonu ile bir şirkete bağlı
- Kullanıcı giriş yapınca → Sadece kendi şirketinin verisini görür

---

## 📋 Tablo Yapısı

### 1. Company Tablosu (Ana Tablo)
```sql
Company
├── id (UUID)                    -- Örnek: "abc-123-def-456"
├── name                         -- "Tipplus Medikal"
├── sector                       -- "Sağlık"
├── city                         -- "Ankara"
└── status                       -- "ACTIVE"
```

**Örnek Veri:**
| id | name | sector | city |
|----|------|--------|------|
| abc-123 | Tipplus Medikal | Sağlık | Ankara |
| def-456 | Global Un | Gıda | Konya |
| ghi-789 | ZahirTech | Yazılım | İstanbul |

---

### 2. User Tablosu (Her kullanıcı bir şirkete bağlı)
```sql
User
├── id (UUID)
├── name                         -- "Ahmet Yılmaz"
├── email                        -- "admin@tipplusmedikal.com"
├── password                     -- "demo123"
├── role                         -- "ADMIN" veya "SALES"
└── companyId (FK)               -- "abc-123" → Company.id'ye bağlı ⚠️
```

**Örnek Veri:**
| id | name | email | companyId |
|----|------|-------|-----------|
| user-1 | Tipplus Admin | admin@tipplusmedikal.com | **abc-123** |
| user-2 | Global Un Admin | admin@globalun.com | **def-456** |
| user-3 | Tipplus Sales | sales@tipplusmedikal.com | **abc-123** |

**⚠️ ÖNEMLİ:** `companyId` kolonu, kullanıcının hangi şirkete ait olduğunu gösterir!

---

### 3. Customer Tablosu (Her müşteri bir şirkete ait)
```sql
Customer
├── id (UUID)
├── name                         -- "Güneş Kuruyemiş"
├── email                        -- "info@guneskuruyemis.com"
├── phone                        -- "+90 312 123 4567"
└── companyId (FK)               -- "abc-123" → Hangi şirkete ait? ⚠️
```

**Örnek Veri:**
| id | name | companyId |
|----|------|-----------|
| cust-1 | Güneş Kuruyemiş | **abc-123** (Tipplus'a ait) |
| cust-2 | Eti Gıda | **abc-123** (Tipplus'a ait) |
| cust-3 | Başka Müşteri | **def-456** (Global Un'a ait) |

---

### 4. Quote Tablosu (Her teklif bir şirkete ait)
```sql
Quote
├── id (UUID)
├── title                        -- "Teklif - Güneş Kuruyemiş"
├── status                       -- "SENT"
├── total                        -- 15000
├── dealId (FK)                  -- Deal'e bağlı
└── companyId (FK)               -- "abc-123" → Hangi şirkete ait? ⚠️
```

**Örnek Veri:**
| id | title | total | companyId |
|----|-------|-------|-----------|
| quote-1 | Teklif - Güneş | 15000 | **abc-123** |
| quote-2 | Teklif - Eti | 48000 | **abc-123** |
| quote-3 | Teklif - Başka | 20000 | **def-456** |

---

## 🔗 İlişki Diyagramı

```
Company (Ana Tablo)
│
├── id: "abc-123" (Tipplus Medikal)
│   │
│   ├── User
│   │   ├── user-1 (companyId: "abc-123") ✅
│   │   └── user-3 (companyId: "abc-123") ✅
│   │
│   ├── Customer
│   │   ├── cust-1 (companyId: "abc-123") ✅
│   │   └── cust-2 (companyId: "abc-123") ✅
│   │
│   ├── Quote
│   │   ├── quote-1 (companyId: "abc-123") ✅
│   │   └── quote-2 (companyId: "abc-123") ✅
│   │
│   ├── Invoice
│   │   └── invoice-1 (companyId: "abc-123") ✅
│   │
│   └── Product
│       └── product-1 (companyId: "abc-123") ✅
│
├── id: "def-456" (Global Un)
│   │
│   ├── User
│   │   └── user-2 (companyId: "def-456") ✅
│   │
│   ├── Customer
│   │   └── cust-3 (companyId: "def-456") ✅
│   │
│   └── Quote
│       └── quote-3 (companyId: "def-456") ✅
│
└── id: "ghi-789" (ZahirTech)
    └── ...
```

---

## 🔐 RLS (Row-Level Security) Nasıl Çalışır?

### Senaryo: Tipplus Medikal Kullanıcısı Giriş Yapınca

**1. Kullanıcı giriş yapar:**
- Email: `admin@tipplusmedikal.com`
- Şifre: `demo123`
- Sistem: Kullanıcının `companyId` = `"abc-123"` olduğunu bulur

**2. Veritabanı sorgusu:**
```sql
-- Kullanıcı Quote'ları görünce:
SELECT * FROM "Quote" 
WHERE "companyId" = 'abc-123'  -- ⚠️ Sadece kendi şirketinin verisi
```

**3. Sonuç:**
- ✅ `quote-1` (companyId: "abc-123") → GÖRÜR
- ✅ `quote-2` (companyId: "abc-123") → GÖRÜR
- ❌ `quote-3` (companyId: "def-456") → GÖRMEZ! (Başka şirket)

---

## 💡 Örnek Senaryo

### Senaryo: Yeni Teklif Oluşturma

**1. Kullanıcı:** Tipplus Medikal Admin (companyId: "abc-123")

**2. Yeni Quote oluştururken:**
```javascript
{
  title: "Yeni Teklif",
  total: 25000,
  companyId: "abc-123"  // ⚠️ Otomatik olarak session'dan alınır
}
```

**3. Veritabanına kayıt:**
```sql
INSERT INTO "Quote" (title, total, "companyId")
VALUES ('Yeni Teklif', 25000, 'abc-123')
```

**4. Sonuç:**
- ✅ Sadece Tipplus Medikal kullanıcıları bu Quote'u görür
- ❌ Global Un kullanıcıları görmez (farklı companyId)

---

## 🎯 Özet

### ✅ Ne Var:
- **Company** tablosu → Ana şirket bilgileri
- Her tablo → `companyId` kolonu ile Company'ye bağlı
- **Foreign Key** → `companyId` → `Company.id`
- **RLS Policies** → Kullanıcı sadece kendi şirketinin verisini görür

### ❌ Ne Yok:
- Company tablosunda `companyId` yok (çünkü Company kendi başına ana tablo)
- Company'ye bağlı tablolarda `companyId` ZORUNLU (multi-tenant için)

---

## 📝 Tablolar ve companyId Durumu

| Tablo | companyId Var mı? | Açıklama |
|-------|------------------|----------|
| **Company** | ❌ HAYIR | Ana tablo, kendisi şirket |
| **User** | ✅ VAR | Her kullanıcı bir şirkete ait |
| **Customer** | ✅ VAR | Her müşteri bir şirkete ait |
| **Deal** | ✅ VAR | Her fırsat bir şirkete ait |
| **Quote** | ✅ VAR | Her teklif bir şirkete ait |
| **Invoice** | ✅ VAR | Her fatura bir şirkete ait |
| **Product** | ✅ VAR | Her ürün bir şirkete ait |
| **Finance** | ✅ VAR | Her finans kaydı bir şirkete ait |
| **Task** | ✅ VAR | Her görev bir şirkete ait |
| **Ticket** | ✅ VAR | Her destek talebi bir şirkete ait |
| **Shipment** | ✅ VAR | Her sevkiyat bir şirkete ait |
| **ActivityLog** | ✅ VAR | Her log bir şirkete ait |

---

## 🔍 Örnek SQL Sorguları

### 1. Tüm şirketleri listele:
```sql
SELECT * FROM "Company"
-- Sonuç: Tipplus Medikal, Global Un, ZahirTech
```

### 2. Bir şirkete ait kullanıcıları bul:
```sql
SELECT * FROM "User" 
WHERE "companyId" = 'abc-123'
-- Sonuç: Sadece Tipplus Medikal kullanıcıları
```

### 3. Bir şirkete ait tüm teklifleri bul:
```sql
SELECT * FROM "Quote" 
WHERE "companyId" = 'abc-123'
-- Sonuç: Sadece Tipplus Medikal teklifleri
```

### 4. Şirket bilgisiyle birlikte Quote'ları getir:
```sql
SELECT q.*, c.name as "companyName"
FROM "Quote" q
JOIN "Company" c ON q."companyId" = c.id
WHERE q."companyId" = 'abc-123'
```

---

## ✅ Sonuç

**companyId = Şirket Kimliği**

- Her kayıt (User, Customer, Quote, vb.) bir şirkete ait
- `companyId` kolonu, o kaydın hangi şirkete ait olduğunu gösterir
- RLS ile kullanıcılar sadece kendi şirketinin verisini görür
- **Company tablosunda companyId yok** çünkü o zaten şirket tablosu!







