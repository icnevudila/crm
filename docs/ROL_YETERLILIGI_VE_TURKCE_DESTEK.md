# 🔐 Rol Yeterliliği ve Türkçe Destek Analizi

**Tarih:** 2024  
**Durum:** ✅ Tamamlandı

---

## 📊 Mevcut Roller

### ✅ Temel Roller (4 Adet)
1. **SUPER_ADMIN** - Süper Admin
2. **ADMIN** - Yönetici
3. **SALES** - Satış Temsilcisi
4. **USER** - Kullanıcı

---

## 🎯 Rol Yeterliliği Analizi

### ✅ Mevcut Roller Yeterli mi?

**Kısa Cevap:** Temel CRM işlemleri için **YETERLİ**, ancak **genişletilebilir**.

### 📋 Önerilen Ek Roller

CRM sistemleri için genelde şu roller de eklenir:

#### 1. **MANAGER** (Müdür) - ÖNERİLEN ✅
- **Amaç:** Ekip yönetimi
- **Yetkiler:** 
  - Ekibinin verilerini görebilir
  - Raporları görüntüleyebilir
  - Kullanıcı atamaları yapabilir
- **Öncelik:** Yüksek

#### 2. **ACCOUNTANT** (Muhasebeci) - ÖNERİLEN ✅
- **Amaç:** Muhasebe işlemleri
- **Yetkiler:**
  - Faturaları görüntüleyebilir/düzenleyebilir
  - Finans kayıtlarını yönetebilir
  - Raporları görüntüleyebilir
- **Öncelik:** Yüksek

#### 3. **SUPPORT** (Destek) - ÖNERİLEN ✅
- **Amaç:** Müşteri desteği
- **Yetkiler:**
  - Ticket'ları yönetebilir
  - Müşteri bilgilerini görebilir
  - Görevler oluşturabilir
- **Öncelik:** Orta

#### 4. **MARKETING** (Pazarlama) - OPSİYONEL ⚠️
- **Amaç:** Pazarlama işlemleri
- **Yetkiler:**
  - Email kampanyaları yönetebilir
  - Müşteri segmentlerini görebilir
  - Raporları görüntüleyebilir
- **Öncelik:** Düşük

#### 5. **PURCHASE** (Satın Alma) - OPSİYONEL ⚠️
- **Amaç:** Satın alma işlemleri
- **Yetkiler:**
  - Tedarikçileri yönetebilir
  - Mal kabul işlemlerini yapabilir
  - Satın alma faturalarını görebilir
- **Öncelik:** Düşük

#### 6. **WAREHOUSE** (Depo) - OPSİYONEL ⚠️
- **Amaç:** Depo işlemleri
- **Yetkiler:**
  - Ürünleri yönetebilir
  - Sevkiyatları yönetebilir
  - Stok hareketlerini görebilir
- **Öncelik:** Düşük

---

## ✅ Türkçe Destek Eklendi

### 1. Rol Çevirileri

**Dosya:** `src/lib/roleTranslations.ts`

```typescript
// Türkçe çeviriler
ROLE_TRANSLATIONS_TR = {
  SUPER_ADMIN: 'Süper Admin',
  ADMIN: 'Yönetici',
  SALES: 'Satış Temsilcisi',
  USER: 'Kullanıcı',
  MANAGER: 'Müdür',
  ACCOUNTANT: 'Muhasebeci',
  SUPPORT: 'Destek',
  MARKETING: 'Pazarlama',
  PURCHASE: 'Satın Alma',
  WAREHOUSE: 'Depo',
}
```

### 2. Locale Dosyaları

**Dosyalar:**
- `src/locales/tr.json` - Türkçe çeviriler
- `src/locales/en.json` - İngilizce çeviriler

**Kullanım:**
```typescript
import { useTranslations } from 'next-intl'

const t = useTranslations('roles')
const roleLabel = t('SALES') // "Satış Temsilcisi"
```

### 3. Yardımcı Fonksiyonlar

```typescript
import { getRoleLabel, getRoleColor } from '@/lib/roleTranslations'

// Türkçe rol ismi
const label = getRoleLabel('SALES', 'tr') // "Satış Temsilcisi"

// Rol rengi (Badge için)
const color = getRoleColor('SALES') // "bg-blue-100 text-blue-800..."
```

---

## 📋 Kullanım Örnekleri

### 1. Component'te Rol Gösterme

```typescript
import { useRoleTranslation, getRoleColor } from '@/lib/roleTranslations'
import { Badge } from '@/components/ui/badge'

export default function UserCard({ user }) {
  const { getRoleLabel } = useRoleTranslation()
  
  return (
    <div>
      <Badge className={getRoleColor(user.role)}>
        {getRoleLabel(user.role)}
      </Badge>
    </div>
  )
}
```

### 2. Select Dropdown'da Rol Seçimi

```typescript
import { useTranslations } from 'next-intl'

const t = useTranslations('roles')

<Select>
  <SelectContent>
    <SelectItem value="SALES">{t('SALES')}</SelectItem>
    <SelectItem value="ADMIN">{t('ADMIN')}</SelectItem>
    <SelectItem value="USER">{t('USER')}</SelectItem>
  </SelectContent>
</Select>
```

---

## 🎨 Rol Renkleri

| Rol | Renk | Badge Class |
|-----|------|-------------|
| SUPER_ADMIN | Mor | `bg-purple-100 text-purple-800` |
| ADMIN | İndigo | `bg-indigo-100 text-indigo-800` |
| SALES | Mavi | `bg-blue-100 text-blue-800` |
| USER | Gri | `bg-gray-100 text-gray-800` |
| MANAGER | Yeşil | `bg-green-100 text-green-800` |
| ACCOUNTANT | Sarı | `bg-yellow-100 text-yellow-800` |
| SUPPORT | Turuncu | `bg-orange-100 text-orange-800` |
| MARKETING | Pembe | `bg-pink-100 text-pink-800` |
| PURCHASE | Teal | `bg-teal-100 text-teal-800` |
| WAREHOUSE | Cyan | `bg-cyan-100 text-cyan-800` |

---

## 🔧 Yeni Rol Ekleme

### Adım 1: Database'e Rol Ekle

```sql
INSERT INTO "Role" (code, name, description, "isSystemRole", "isActive") VALUES
  ('MANAGER', 'Müdür', 'Yönetici - ekibi yönetebilir', false, true)
ON CONFLICT (code) DO NOTHING;
```

### Adım 2: Locale Dosyalarına Ekle

**tr.json:**
```json
{
  "roles": {
    "MANAGER": "Müdür",
    "MANAGER_description": "Yönetici - ekibi yönetebilir"
  }
}
```

**en.json:**
```json
{
  "roles": {
    "MANAGER": "Manager",
    "MANAGER_description": "Manager - can manage team"
  }
}
```

### Adım 3: roleTranslations.ts'e Ekle

```typescript
export const ROLE_TRANSLATIONS_TR: Record<string, string> = {
  // ...
  MANAGER: 'Müdür',
}
```

### Adım 4: workflows.ts'e Önceliklendirme Ekle

```typescript
if (role === 'MANAGER') {
  return {
    dashboard: 'high',
    customers: 'high',
    // ...
  }
}
```

---

## ✅ Checklist

### Türkçe Destek
- [x] `roleTranslations.ts` oluşturuldu
- [x] `tr.json` ve `en.json` locale dosyalarına eklendi
- [x] `workflows.ts` güncellendi (Türkçe rol desteği)
- [x] Yardımcı fonksiyonlar eklendi

### Rol Yeterliliği
- [x] Mevcut 4 rol analiz edildi
- [x] 6 ek rol önerildi
- [x] Önceliklendirme yapıldı (Yüksek/Orta/Düşük)
- [x] Rol bazlı menü önceliklendirme eklendi

---

## 🎯 Sonuç ve Öneriler

### ✅ Yapılanlar
1. ✅ Türkçe locale desteği eklendi
2. ✅ Rol çeviri sistemi kuruldu
3. ✅ Rol renkleri ve ikonları tanımlandı
4. ✅ 6 ek rol için hazırlık yapıldı

### 📋 Öneriler

#### Kısa Vadede (1-2 Hafta)
1. ✅ **MANAGER** rolü ekle (ekip yönetimi için)
2. ✅ **ACCOUNTANT** rolü ekle (muhasebe için)

#### Orta Vadede (1 Ay)
3. ⚠️ **SUPPORT** rolü ekle (müşteri desteği için)
4. ⚠️ **MARKETING** rolü ekle (pazarlama için)

#### Uzun Vadede (İhtiyaç Halinde)
5. ⚠️ **PURCHASE** rolü ekle (satın alma için)
6. ⚠️ **WAREHOUSE** rolü ekle (depo için)

---

**Son Güncelleme:** 2024  
**Durum:** ✅ Türkçe Destek Aktif, Rol Sistemi Genişletilebilir





