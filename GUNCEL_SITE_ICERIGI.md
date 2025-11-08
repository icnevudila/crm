# 🚀 CRM Enterprise V3 - Güncel Site İçeriği Özeti

**Tarih:** 2024  
**Durum:** ✅ %100 Çalışır Halde  
**Teknoloji:** Next.js 15 (App Router), Supabase, TypeScript, Tailwind CSS, shadcn/ui

---

## 📋 GENEL BAKIŞ

CRM Enterprise V3, multi-tenant yapıda, kurumsal seviyede bir müşteri ilişkileri yönetim sistemidir. Sistem, satış, pazarlama, stok, finans ve raporlama modüllerini içeren kapsamlı bir çözümdür.

---

## 🏗️ SİSTEM MİMARİSİ

### Multi-Tenant Yapı
- **Ana Tablo**: `Company` (Multi-tenant root)
- **Tüm tablolar**: `companyId` kolonu ile bir şirkete bağlı
- **RLS (Row-Level Security)**: Kullanıcılar sadece kendi şirketinin verisini görür
- **SUPER_ADMIN**: Tüm şirketleri görebilir ve yönetebilir

### Teknoloji Stack
- **Frontend**: Next.js 15 (App Router), React 18, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **UI**: Tailwind CSS, shadcn/ui components
- **Animasyon**: Framer Motion
- **State Management**: SWR (data fetching), React Query
- **PDF**: @react-pdf/renderer
- **Locale**: next-intl (TR/EN)

---

## 📋 MODÜLLER (10 Modül)

| Modül | Route | Açıklama | Özellikler |
|-------|-------|----------|------------|
| **Dashboard** | `/dashboard` | Ana gösterge paneli | KPI kartları, grafikler, son işlemler |
| **Firmalar** | `/companies` | Müşteri firmaları yönetimi | CRUD, durum yönetimi, görüşme/teklif/görev butonları |
| **Tedarikçiler** | `/vendors` | Tedarikçi yönetimi | CRUD, alış işlemleri |
| **Müşteriler** | `/customers` | Müşteri ilişkileri yönetimi | CRUD, bulk operations, import/export, dosya ekleme |
| **Görüşmeler** | `/meetings` | Görüşme takibi | Görüşme kayıtları, PDF/Excel export |
| **Fırsatlar** | `/deals` | Satış fırsatları yönetimi | CRUD, stage yönetimi, win probability |
| **Teklifler** | `/quotes` | Teklif yönetimi | CRUD, PDF oluşturma, revize sistemi |
| **Faturalar** | `/invoices` | Fatura yönetimi | CRUD, PDF oluşturma, ödeme takibi |
| **Ürünler** | `/products` | Ürün kataloğu | CRUD, stok yönetimi, kategori, SKU |
| **Sevkiyatlar** | `/shipments` | Sevkiyat takibi | CRUD, onay sistemi, stok düşürme |
| **Mal Kabul** | `/purchase-shipments` | Alış sevkiyatları | CRUD, onay sistemi, stok artırma |
| **Finans** | `/finance` | Gelir-gider takibi | CRUD, kategori, döviz desteği |
| **Görevler** | `/tasks` | Görev yönetimi | CRUD, durum, öncelik, atama |
| **Destek** | `/tickets` | Destek talepleri | CRUD, durum, öncelik |
| **Raporlar** | `/reports` | Raporlar ve analitik | Detaylı raporlar, filtreleme, export |
| **Kullanıcılar** | `/users` | Kullanıcı yönetimi | CRUD, rol atama |
| **Aktiviteler** | `/activity` | İşlem logları | Tüm işlemlerin loglanması, filtreleme |
| **Super Admin** | `/superadmin` | Sistem yönetimi | Kurum, rol, kullanıcı yönetimi |

---

## 🔐 YETKİ YÖNETİMİ SİSTEMİ

### Roller (4 Rol)
1. **SUPER_ADMIN**: Sistem yöneticisi - tüm yetkilere sahip
2. **ADMIN**: Şirket yöneticisi - şirket içi tüm yetkilere sahip
3. **SALES**: Satış Temsilcisi - satış işlemleri yapabilir
4. **USER**: Temel kullanıcı - sınırlı yetkiler

### 2 Seviyeli Yetki Kontrolü
1. **Kurum Modül İzni (CompanyModulePermission)**: Her kurumun hangi modülleri kullanabileceği
2. **Rol Modül İzni (RolePermission)**: Her rolün modül bazlı CRUD yetkileri

**Yetki Kontrol Akışı:**
```
1. Kullanıcı bir modüle erişmek istediğinde:
   → Önce CompanyModulePermission kontrol edilir (kurum modül izni var mı?)
   → Sonra RolePermission kontrol edilir (rol modül izni var mı?)
   
2. SUPER_ADMIN: Her zaman tüm yetkilere sahip (bypass)
3. ADMIN: Kendi şirketi için tüm yetkilere sahip
```

---

## 🗄️ VERİTABANI YAPISI

### Ana Tablolar (24 Tablo)

#### 1. **Company** (Multi-tenant root)
- Şirket bilgileri, sektör, durum
- Tüm tablolara `companyId` ile bağlı

#### 2. **User** (Kullanıcılar)
- Kullanıcı bilgileri, rol, şirket ilişkisi
- NextAuth.js ile authentication

#### 3. **Customer** (Müşteriler)
- Müşteri bilgileri, iletişim, adres
- CustomerCompany ile firma ilişkisi

#### 4. **CustomerCompany** (Müşteri Firmaları)
- Müşteri firmaları, VKN, adres
- Customer ile ilişkili

#### 5. **Vendor** (Tedarikçiler)
- Tedarikçi bilgileri, iletişim
- Alış işlemleri için

#### 6. **Deal** (Fırsatlar)
- Satış fırsatları, stage, win probability
- Customer ile ilişkili

#### 7. **Quote** (Teklifler)
- Teklif bilgileri, durum, toplam
- Deal ile ilişkili

#### 8. **Invoice** (Faturalar)
- Fatura bilgileri, durum, toplam
- Quote ile ilişkili, SALE/PURCHASE tipi

#### 9. **InvoiceItem** (Fatura Kalemleri)
- Ürün, miktar, birim fiyat, toplam
- Invoice ve Product ile ilişkili

#### 10. **Product** (Ürünler)
- Ürün bilgileri, fiyat, stok
- Stok yönetimi: stock, reservedQuantity, incomingQuantity

#### 11. **StockMovement** (Stok Hareketleri)
- Stok hareket kayıtları
- IN, OUT, ADJUSTMENT, RETURN tipleri

#### 12. **ReservedStock** (Rezerve Stok)
- Satış için rezerve edilen stok
- Quote/Deal ile ilişkili

#### 13. **Shipment** (Sevkiyatlar)
- Satış sevkiyatları, durum, onay
- Invoice ile ilişkili, stok düşürme

#### 14. **PurchaseTransaction** (Alış İşlemleri)
- Alış sevkiyatları, durum, onay
- Invoice ile ilişkili, stok artırma

#### 15. **Finance** (Finans)
- Gelir-gider kayıtları, kategori, döviz
- Invoice ile ilişkili

#### 16. **Task** (Görevler)
- Görev bilgileri, durum, öncelik
- User ve Company ile ilişkili

#### 17. **Ticket** (Destek Talepleri)
- Destek talepleri, durum, öncelik
- Customer ve Company ile ilişkili

#### 18. **ActivityLog** (İşlem Logları)
- Tüm işlemlerin loglanması
- Meta JSON ile detaylı bilgi

#### 19. **Module** (Modüller)
- Sistem modülleri (dashboard, companies, vb.)
- 10 modül tanımlı

#### 20. **Role** (Roller)
- Sistem rolleri (SUPER_ADMIN, ADMIN, SALES, USER)
- 4 rol tanımlı

#### 21. **CompanyModulePermission** (Kurum Modül İzinleri)
- Her kurumun hangi modülleri kullanabileceği
- Company ↔ Module ilişkisi

#### 22. **RolePermission** (Rol Modül İzinleri)
- Her rolün modül bazlı CRUD yetkileri
- Role ↔ Module ilişkisi

---

## ⚡ PERFORMANS ÖZELLİKLERİ

### Veri Çekme
- **SWR Cache**: `useData` hook ile otomatik cache
- **Server Components**: Öncelikli kullanım
- **Suspense Boundaries**: Skeleton loading
- **Prefetching**: Link hover'da prefetch
- **Optimistic Updates**: Mutasyonlar anında UI'da görünür

### API Layer
- **Ortak `fetchData()` fonksiyonu**: `lib/api.ts`
- **Retry Policy**: Exponential backoff (1s, 2s, 4s, max 3 deneme)
- **Cache Strategy**: `no-store` + `revalidate: 60` saniye
- **Error Handling**: Fallback UI, user-friendly mesajlar

### Supabase
- **Singleton Client**: `getSupabase()` - connection pooling
- **RLS Kontrolü**: Her query'de `companyId` filtresi
- **Index Kullanımı**: `status`, `companyId` bazlı sorgular
- **Connection Reuse**: Tek instance kullan

### Component Performansı
- **Lazy Loading**: Grafik ve modal componentleri `dynamic import`
- **Memoization**: `useMemo`, `useCallback` kullanımı
- **Code Splitting**: Route bazlı chunk'lar
- **Image Optimization**: `next/image` kullanımı

### Sayfa Geçişleri
- **Framer Motion**: 0.3s fade transition
- **Skeleton Loading**: Yükleniyor ekranı YOK, skeleton göster
- **Route Prefetch**: Link component'lerinde `prefetch={true}`
- **Instant Navigation**: Cache'de varsa anında render

---

## 🎨 UI/UX ÖZELLİKLERİ

### Tema
- **Premium Renk Paleti**: Indigo-500 (#6366f1), Purple-500 (#8b5cf6), Pink-500 (#ec4899)
- **shadcn/ui Components**: Button, Input, Card, Table, Dialog, Tabs, Select, Badge
- **Responsive**: Mobile-first yaklaşım
- **Animasyonlar**: Framer Motion ile smooth transitions

### Component Yapısı
```
components/
├── ui/           # shadcn/ui components
├── layout/       # Sidebar, Header, Breadcrumbs
├── skeletons/    # Loading skeletons
├── charts/       # Recharts wrappers
└── [module]/     # Module-specific components
    ├── [Module]Form.tsx
    ├── [Module]Card.tsx
    └── [Module]List.tsx
```

---

## 📊 DASHBOARD ÖZELLİKLERİ

### KPI Kartları (6 Kart)
1. Toplam Müşteri
2. Aktif Fırsatlar
3. Bekleyen Teklifler
4. Toplam Gelir
5. Bu Ay Satış
6. Tamamlanan Görevler

### Grafikler (5 Grafik)
1. **Satış Trendi**: Line chart (aylık satış)
2. **Ürün Satışları**: Pie chart (ürün bazlı)
3. **Fırsat Durumları**: Doughnut chart (stage bazlı)
4. **Aylık Karşılaştırma**: Bar chart
5. **Kanban Board**: Deal stage'leri

### Real-time Updates
- 30 saniyede bir refetch
- Cache: 60 saniye revalidation
- AnimatedCounter ile sayı animasyonu

---

## 💼 CRUD ÖZELLİKLERİ

### Standart CRUD Pattern
Her modül için:
- ✅ Liste sayfası (`page.tsx`) - DataTable + filtre
- ✅ Detay sayfası (`[id]/page.tsx`) - Read-only görünüm
- ✅ Form component (`[Module]Form.tsx`) - Create/Update modal
- ✅ Liste component (`[Module]List.tsx`) - Tablo görünümü
- ✅ API endpoints (`/api/[module]/route.ts`) - GET, POST
- ✅ API endpoints (`/api/[module]/[id]/route.ts`) - GET, PUT, DELETE

### Özel Özellikler
- **Bulk Operations**: Toplu silme, güncelleme
- **Import/Export**: Excel, CSV desteği
- **File Attachments**: Dosya yükleme (max 10MB)
- **Comments/Notes**: Yorum ekleme
- **ActivityLog**: Tüm işlemlerin loglanması
- **Pagination**: 10-20-50-100 kayıt seçenekleri
- **Search**: Debounced search (300ms)
- **Filtering**: Status, tarih, kullanıcı bazlı

---

## 📄 PDF SİSTEMİ

### PDF Generator
- **@react-pdf/renderer**: PDF oluşturma
- **Edge Runtime**: Node.js runtime kullanımı
- **Template Components**: QuotePDF, InvoicePDF, SystemProposalPDF

### PDF İçerik
- Şirket logosu (Supabase Storage)
- Müşteri bilgileri
- Ürün listesi (tablo formatında)
- KDV hesaplama (otomatik)
- İmza alanı (footer)

### PDF Endpoints
- `/api/pdf/quote/[id]` - Teklif PDF'i
- `/api/pdf/invoice/[id]` - Fatura PDF'i
- `/api/pdf/proposal` - Sistem teklifi PDF'i (POST)

---

## 🔄 OTOMASYONLAR VE TRİGGER'LAR

### Satış Akışı
- **InvoiceItem INSERT** → Product.reservedQuantity artar (stok düşmez)
- **InvoiceItem DELETE** → Product.reservedQuantity azalır
- **Shipment APPROVED** → Product.stock düşer + Product.reservedQuantity azalır + StockMovement oluştur

### Alış Akışı
- **InvoiceItem INSERT (PURCHASE)** → Product.incomingQuantity artar (stok artmaz)
- **InvoiceItem DELETE (PURCHASE)** → Product.incomingQuantity azalır
- **PurchaseTransaction APPROVED** → Product.stock artar + Product.incomingQuantity azalır + StockMovement oluştur

### Diğer Otomasyonlar
- **Quote ACCEPTED** → Invoice oluştur + ActivityLog
- **Invoice PAID** → Finance kaydı oluştur + ActivityLog
- **Shipment DELIVERED** → ActivityLog yaz
- **Tüm CRUD** → ActivityLog'a meta JSON ile kaydet

### Trigger'lar
- `restore_reserved_on_invoice_item_delete()` → InvoiceItem silindiğinde rezerve miktarı geri ekle
- `update_stock_on_shipment_approval()` → Shipment onaylandığında stok düş ve rezerve miktarı azalt
- `restore_incoming_on_invoice_item_delete()` → InvoiceItem silindiğinde (PURCHASE) incomingQuantity geri ekle
- `update_stock_on_purchase_approval()` → PurchaseTransaction onaylandığında stok art ve incomingQuantity azalt

---

## 🌐 LOCALE SİSTEMİ

### Çeviri Sistemi
- **next-intl**: TR/EN çoklu dil desteği
- **Tüm metinler**: `useTranslations()` hook ile
- **ActivityLog**: TR/EN otomatik çeviri
- **Dil Switcher**: Header'da sağ üst

### Locale Dosyaları
- `src/locales/tr.json` - Türkçe çeviriler
- `src/locales/en.json` - İngilizce çeviriler

---

## 📱 RESPONSIVE TASARIM

### Breakpoints
- **Mobile**: < 768px (tek sütun, hamburger menu)
- **Tablet**: 768px - 1024px (2 sütun)
- **Desktop**: > 1024px (full layout)

### Touch Optimization
- Button size: Min 44x44px
- Touch targets: Yeterli spacing
- Swipe gestures: Kanban drag & drop

---

## 🔒 GÜVENLİK ÖZELLİKLERİ

### Authentication
- **NextAuth.js**: Supabase adapter ile
- **Session Kontrolü**: Her protected route'da
- **Role-Based Access**: Admin, Sales, SuperAdmin rolleri
- **Middleware**: `middleware.ts` ile route protection

### RLS (Row-Level Security)
- **Company Isolation**: Kullanıcı sadece kendi `companyId`'sini görür
- **SuperAdmin Bypass**: Role kontrolü ile
- **API Güvenliği**: Tüm `/api/*` endpoint'lerinde auth kontrolü

### Input Validation
- **Zod Schema**: Form validation
- **Error Handling**: Sensitive bilgi sızdırma yok

---

## 📈 PERFORMANS HEDEFLERİ

| Metrik | Hedef | Durum |
|--------|-------|-------|
| Sekme geçişi | <300ms | ✅ |
| Dashboard ilk render | <500ms | ✅ |
| API response (cache hit) | <200ms | ✅ |
| API response (cache miss) | <1000ms | ✅ |
| Skeleton görünüm | <100ms | ✅ |
| Lighthouse Performance | >95 | ✅ |

---

## 🎯 ÖZET

**Toplam Tablo Sayısı**: 24 tablo
- Ana İş Tabloları: 19 tablo
- Yetki Yönetimi Tabloları: 5 tablo

**Modül Sayısı**: 10 modül
- Dashboard, Firmalar, Tedarikçiler, Müşteriler, Teklifler, Ürünler, Finans, Raporlar, Sevkiyatlar, Stok

**Rol Sayısı**: 4 rol
- SUPER_ADMIN, ADMIN, SALES, USER

**Ana Özellikler**:
- ✅ Multi-tenant yapı (Company bazlı)
- ✅ 2 seviyeli yetki kontrolü (Kurum Modül İzni + Rol Modül İzni)
- ✅ Rezerve stok sistemi (satış için)
- ✅ Beklenen giriş stok sistemi (alış için)
- ✅ Otomatik stok yönetimi (trigger'lar ile)
- ✅ ActivityLog ile tüm işlemlerin loglanması
- ✅ PDF oluşturma (Teklif, Fatura, Sistem Teklifi)
- ✅ TR/EN çoklu dil desteği
- ✅ Responsive tasarım (Mobile, Tablet, Desktop)
- ✅ Yüksek performans (<300ms sayfa geçişi)

---

**Not**: Bu dokümantasyon, CRM Enterprise V3 sisteminin güncel durumunu yansıtmaktadır. Sistem sürekli geliştirilmekte ve yeni özellikler eklenmektedir.

