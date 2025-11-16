# 🔐 Multi-Tenant & SuperAdmin Kontrolü - ZORUNLU KURALLAR

## ⚠️ ÖNEMLİ: HER YENİ ÖZELLİK İÇİN KONTROL ET!

**Her yeni özellik eklerken MUTLAKA şunları kontrol et:**

---

## ✅ 1. API Endpoint'leri - Multi-Tenant Kontrolü

### Zorunlu Kontroller:

```typescript
// ✅ DOĞRU - Her API endpoint'te
export async function GET(request: Request) {
  const { session, error: sessionError } = await getSafeSession(request)
  
  if (!session?.user?.companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
  const companyId = session.user.companyId
  const supabase = getSupabaseWithServiceRole()
  
  // SuperAdmin için firma filtresi (opsiyonel)
  const filterCompanyId = searchParams.get('filterCompanyId') || ''
  
  let query = supabase.from('TableName').select('*')
  
  // ÖNCE companyId filtresi (SuperAdmin değilse veya SuperAdmin firma filtresi seçtiyse)
  if (!isSuperAdmin) {
    query = query.eq('companyId', companyId) // Normal kullanıcı sadece kendi şirketini görür
  } else if (filterCompanyId) {
    // SuperAdmin firma filtresi seçtiyse sadece o firmayı göster
    query = query.eq('companyId', filterCompanyId)
  }
  // SuperAdmin ve firma filtresi yoksa tüm firmaları göster (bypass)
  
  // ... diğer filtreler
}
```

### ❌ YANLIŞ Örnekler:

```typescript
// ❌ YANLIŞ - companyId kontrolü yok!
export async function GET() {
  const { data } = await supabase.from('TableName').select('*')
  return NextResponse.json(data)
}

// ❌ YANLIŞ - SuperAdmin kontrolü yok!
export async function GET(request: Request) {
  const { session } = await getSafeSession(request)
  const query = supabase.from('TableName').select('*').eq('companyId', session.user.companyId)
  // SuperAdmin tüm şirketleri göremiyor!
}
```

---

## ✅ 2. Client-Side Component'ler - Multi-Tenant Kontrolü

### localStorage Kullanımı:

```typescript
// ✅ DOĞRU - companyId ile izolasyon
import { useSession } from '@/hooks/useSession'

export function useCustomHook() {
  const { data: session } = useSession()
  const companyId = session?.user?.companyId || 'default'
  
  // Her şirket için ayrı localStorage key
  const storageKey = `crm_feature_${companyId}`
  
  useEffect(() => {
    const stored = localStorage.getItem(storageKey)
    // ...
  }, [companyId])
}

// ❌ YANLIŞ - companyId yok, tüm şirketler aynı veriyi görür!
const storageKey = 'crm_feature' // Şirketler birbirinin verisini görür!
```

### API Çağrıları:

```typescript
// ✅ DOĞRU - API endpoint'leri zaten companyId filtreliyor
const { data } = useData('/api/resource') // API otomatik filtreliyor

// ❌ YANLIŞ - Client-side filtreleme yapma, API'ye bırak!
const { data: allData } = useData('/api/resource')
const filtered = allData.filter(item => item.companyId === companyId) // Gereksiz!
```

---

## ✅ 3. SuperAdmin Muafiyeti

### SuperAdmin Kuralları:

1. **SuperAdmin tüm şirketleri görebilir** (filtre yoksa)
2. **SuperAdmin firma filtresi seçebilir** (`filterCompanyId` parametresi ile)
3. **SuperAdmin normal kullanıcı gibi davranabilir** (filtre seçerse)

### Örnek:

```typescript
// SuperAdmin kontrolü
const isSuperAdmin = session.user.role === 'SUPER_ADMIN'

if (!isSuperAdmin) {
  // Normal kullanıcı - sadece kendi şirketi
  query = query.eq('companyId', companyId)
} else if (filterCompanyId) {
  // SuperAdmin - belirli bir şirketi seçti
  query = query.eq('companyId', filterCompanyId)
}
// SuperAdmin - filtre yoksa tüm şirketleri göster (bypass)
```

---

## ✅ 4. Performans Optimizasyonu

### Cache Stratejisi:

```typescript
// ✅ DOĞRU - Multi-tenant cache
const cacheKey = `/api/resource?companyId=${companyId}` // Şirket bazlı cache

// ❌ YANLIŞ - Global cache (şirketler birbirinin cache'ini görür!)
const cacheKey = '/api/resource'
```

### SWR Cache:

```typescript
// ✅ DOĞRU - companyId ile cache key
const { data } = useData(`/api/resource?companyId=${companyId}`, {
  dedupingInterval: 30000,
  revalidateOnFocus: false,
})

// API endpoint zaten companyId filtreliyor, ama cache key'e eklemek güvenlik için iyi
```

---

## ✅ 5. Checklist - Her Yeni Özellik İçin

### API Endpoint Kontrolü:
- [ ] `getSafeSession()` ile session kontrolü var mı?
- [ ] `companyId` kontrolü var mı?
- [ ] `isSuperAdmin` kontrolü var mı?
- [ ] `filterCompanyId` parametresi destekleniyor mu? (SuperAdmin için)
- [ ] Query'de `companyId` filtresi var mı? (SuperAdmin değilse)
- [ ] SuperAdmin bypass doğru çalışıyor mu?

### Client Component Kontrolü:
- [ ] `localStorage` kullanıyorsa `companyId` ile izolasyon var mı?
- [ ] API çağrıları doğru endpoint'lere mi gidiyor?
- [ ] Cache key'lerinde `companyId` var mı?
- [ ] Session bilgisi kullanılıyor mu?

### Test Senaryoları:
- [ ] Normal kullanıcı sadece kendi şirketini görüyor mu?
- [ ] SuperAdmin tüm şirketleri görebiliyor mu?
- [ ] SuperAdmin firma filtresi çalışıyor mu?
- [ ] localStorage izolasyonu çalışıyor mu? (farklı şirketler farklı veri görüyor mu?)

---

## 📋 Örnek Dosyalar

### Doğru API Endpoint:
- `src/app/api/quotes/route.ts` ✅
- `src/app/api/invoices/route.ts` ✅
- `src/app/api/deals/route.ts` ✅

### Doğru Hook:
- `src/hooks/useStickyNotes.ts` ✅ (companyId ile localStorage izolasyonu)

### Doğru Component:
- `src/components/suggestions/NextBestAction.tsx` ✅ (API endpoint'leri zaten filtreliyor)

---

## ⚠️ YAPILMAYACAKLAR

1. ❌ **Client-side filtreleme yapma** - API'ye bırak
2. ❌ **Global localStorage key kullanma** - companyId ekle
3. ❌ **SuperAdmin kontrolünü atlama** - Her zaman kontrol et
4. ❌ **companyId kontrolünü atlama** - Her API endpoint'te zorunlu
5. ❌ **Cache key'lerinde companyId kullanmama** - Performans için önemli

---

## 🎯 Özet

**Her yeni özellik eklerken:**

1. ✅ API endpoint'te `companyId` filtresi var mı?
2. ✅ SuperAdmin bypass çalışıyor mu?
3. ✅ localStorage kullanıyorsa `companyId` ile izolasyon var mı?
4. ✅ Cache key'lerinde `companyId` var mı?
5. ✅ Test ettin mi? (Normal kullanıcı + SuperAdmin)

**Bu kuralları unutma! Her agent bunu kontrol etmeli!**

---

**Son Güncelleme:** 2024
**Versiyon:** 1.0.0





