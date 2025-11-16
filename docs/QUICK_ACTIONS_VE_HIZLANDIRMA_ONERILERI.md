# ⚡ Quick Actions & Kullanıcı Hızlandırma Önerileri
## Sistem Kullanımını Hızlandıran Özellikler

---

## 🎯 1. GLOBAL QUICK ACTIONS (Her Yerden Erişilebilir)

### 1.1. Command Palette (Cmd+K / Ctrl+K)

**Durum:** ❌ Command palette yok

**Öneri:** Her yerden erişilebilir command palette

**Nerede Eklenebilir:**
```typescript
// src/components/command-palette/CommandPalette.tsx (YENİ DOSYA)
'use client'

import { useState, useEffect } from 'react'
import { Command } from 'cmdk'
import { Search, Plus, FileText, Users, Briefcase, DollarSign, Calendar } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'

const commands = [
  { id: 'new-customer', label: 'Yeni Müşteri', icon: Users, action: '/customers/new' },
  { id: 'new-deal', label: 'Yeni Fırsat', icon: Briefcase, action: '/deals/new' },
  { id: 'new-quote', label: 'Yeni Teklif', icon: FileText, action: '/quotes/new' },
  { id: 'new-invoice', label: 'Yeni Fatura', icon: DollarSign, action: '/invoices/new' },
  { id: 'new-meeting', label: 'Yeni Toplantı', icon: Calendar, action: '/meetings/new' },
  { id: 'search-customers', label: 'Müşterileri Ara', icon: Search, action: '/customers?search=' },
  { id: 'search-deals', label: 'Fırsatları Ara', icon: Search, action: '/deals?search=' },
]

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const locale = useLocale()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  return (
    <Command.Dialog open={open} onOpenChange={setOpen}>
      <Command.Input placeholder="Komut ara... (Cmd+K)" />
      <Command.List>
        <Command.Empty>Sonuç bulunamadı.</Command.Empty>
        {commands.map((cmd) => (
          <Command.Item
            key={cmd.id}
            onSelect={() => {
              router.push(`/${locale}${cmd.action}`)
              setOpen(false)
            }}
          >
            <cmd.icon className="mr-2 h-4 w-4" />
            {cmd.label}
          </Command.Item>
        ))}
      </Command.List>
    </Command.Dialog>
  )
}
```

**Kullanım:**
- `Cmd+K` (Mac) / `Ctrl+K` (Windows) ile açılır
- Tüm sayfalarda erişilebilir
- Hızlı navigasyon ve işlem başlatma

**Faydalar:**
- ✅ Hızlı navigasyon (2-3 saniye tasarruf)
- ✅ Klavye odaklı kullanım
- ✅ Power user desteği
- ✅ Modern UX (VS Code, Linear gibi)

**Dosyalar:**
- `src/components/command-palette/CommandPalette.tsx` - Command palette component
- `src/app/[locale]/layout.tsx` - Root layout'a ekle

---

### 1.2. Floating Action Button (FAB)

**Durum:** ❌ FAB yok

**Öneri:** Sayfa bazlı hızlı işlem butonu

**Nerede Eklenebilir:**
```typescript
// src/components/ui/FloatingActionButton.tsx (YENİ DOSYA)
'use client'

import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface FloatingActionButtonProps {
  actions: Array<{
    label: string
    icon: React.ReactNode
    onClick: () => void
  }>
}

export default function FloatingActionButton({ actions }: FloatingActionButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-4 space-y-2">
          {actions.map((action, index) => (
            <Button
              key={index}
              onClick={() => {
                action.onClick()
                setOpen(false)
              }}
              className="w-full justify-start shadow-lg"
            >
              {action.icon}
              <span className="ml-2">{action.label}</span>
            </Button>
          ))}
        </div>
      )}
      <Button
        size="lg"
        className="h-14 w-14 rounded-full shadow-lg"
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </Button>
    </div>
  )
}
```

**Kullanım:**
- Her sayfada context-aware FAB
- Müşteri sayfasında: "Yeni Fırsat", "Yeni Teklif", "E-posta Gönder"
- Fırsat sayfasında: "Yeni Teklif", "Toplantı Oluştur"

**Faydalar:**
- ✅ Tek tıkla hızlı işlem
- ✅ Mobile-friendly
- ✅ Modern UX

**Dosyalar:**
- `src/components/ui/FloatingActionButton.tsx` - FAB component
- Her detay sayfasına ekle

---

### 1.3. Quick Create Modal (Hızlı Oluşturma)

**Durum:** ⚠️ Form modalları var ama quick create yok

**Öneri:** Minimal form ile hızlı kayıt oluşturma

**Nerede Eklenebilir:**
```typescript
// src/components/quick-create/QuickCreateCustomer.tsx (YENİ DOSYA)
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/toast'

export default function QuickCreateCustomer({ open, onClose, onSuccess }: {
  open: boolean
  onClose: () => void
  onSuccess?: (customer: any) => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      })
      
      if (!res.ok) throw new Error('Kayıt oluşturulamadı')
      
      const customer = await res.json()
      toast.success('Başarılı', 'Müşteri oluşturuldu')
      onSuccess?.(customer)
      setName('')
      setEmail('')
      onClose()
    } catch (error: any) {
      toast.error('Hata', error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hızlı Müşteri Oluştur</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Müşteri Adı *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
          <Input
            type="email"
            placeholder="E-posta"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button type="submit" disabled={loading || !name}>
              Oluştur
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

**Kullanım:**
- Command palette'den açılır
- Sadece zorunlu alanlar (name, email)
- Detaylar sonra düzenlenebilir

**Faydalar:**
- ✅ Hızlı kayıt oluşturma (10 saniye → 3 saniye)
- ✅ Workflow kesintisizliği
- ✅ Kullanıcı deneyimi iyileştirmesi

**Dosyalar:**
- `src/components/quick-create/QuickCreateCustomer.tsx`
- `src/components/quick-create/QuickCreateDeal.tsx`
- `src/components/quick-create/QuickCreateQuote.tsx`

---

## 🚀 2. CONTEXTUAL QUICK ACTIONS (Sayfa Bazlı)

### 2.1. Customer Detail Page Quick Actions

**Durum:** ✅ Mevcut ama geliştirilebilir

**Mevcut:**
- E-posta gönder
- SMS gönder
- WhatsApp gönder
- Yeni fırsat oluştur
- Yeni teklif oluştur

**Eklenebilir:**
```typescript
// src/app/[locale]/customers/[id]/page.tsx
// Quick Actions Card'a ekle:

<Button onClick={() => router.push(`/${locale}/deals/new?customerId=${customer.id}`)}>
  <Briefcase className="mr-2 h-4 w-4" />
  Hızlı Fırsat Oluştur
</Button>

<Button onClick={() => router.push(`/${locale}/quotes/new?customerId=${customer.id}`)}>
  <FileText className="mr-2 h-4 w-4" />
  Hızlı Teklif Oluştur
</Button>

<Button onClick={() => router.push(`/${locale}/meetings/new?customerId=${customer.id}`)}>
  <Calendar className="mr-2 h-4 w-4" />
  Toplantı Planla
</Button>

<Button onClick={() => router.push(`/${locale}/invoices/new?customerId=${customer.id}`)}>
  <DollarSign className="mr-2 h-4 w-4" />
  Fatura Oluştur
</Button>

// Recent Activity Quick View
<Card>
  <CardHeader>
    <CardTitle>Son Aktiviteler</CardTitle>
  </CardHeader>
  <CardContent>
    {recentActivities.map((activity) => (
      <div key={activity.id} className="flex items-center justify-between py-2">
        <span>{activity.description}</span>
        <Button variant="ghost" size="sm" onClick={() => router.push(activity.link)}>
          Görüntüle
        </Button>
      </div>
    ))}
  </CardContent>
</Card>
```

**Faydalar:**
- ✅ Tek tıkla ilgili kayıt oluşturma
- ✅ Context-aware işlemler
- ✅ Workflow hızlandırma

---

### 2.2. Deal Detail Page Quick Actions

**Durum:** ✅ Mevcut ama geliştirilebilir

**Eklenebilir:**
```typescript
// src/app/[locale]/deals/[id]/page.tsx
// Quick Actions:

<Button onClick={() => convertDealToQuote(deal.id)}>
  <FileText className="mr-2 h-4 w-4" />
  Teklife Dönüştür
</Button>

<Button onClick={() => markDealAsWon(deal.id)}>
  <CheckCircle className="mr-2 h-4 w-4" />
  Kazanıldı Olarak İşaretle
</Button>

<Button onClick={() => markDealAsLost(deal.id)}>
  <XCircle className="mr-2 h-4 w-4" />
  Kaybedildi Olarak İşaretle
</Button>

// Kanban drag & drop ile stage değiştirme (zaten var ama iyileştirilebilir)
```

**Faydalar:**
- ✅ Tek tıkla durum değiştirme
- ✅ Workflow otomasyonu
- ✅ Hız artışı

---

### 2.3. Quote Detail Page Quick Actions

**Durum:** ✅ Mevcut ama geliştirilebilir

**Eklenebilir:**
```typescript
// src/app/[locale]/quotes/[id]/page.tsx
// Quick Actions:

<Button onClick={() => acceptQuote(quote.id)}>
  <CheckCircle className="mr-2 h-4 w-4" />
  Teklifi Kabul Et
</Button>

<Button onClick={() => rejectQuote(quote.id)}>
  <XCircle className="mr-2 h-4 w-4" />
  Teklifi Reddet
</Button>

<Button onClick={() => convertQuoteToInvoice(quote.id)}>
  <DollarSign className="mr-2 h-4 w-4" />
  Faturaya Dönüştür
</Button>

<Button onClick={() => duplicateQuote(quote.id)}>
  <Copy className="mr-2 h-4 w-4" />
  Teklifi Kopyala
</Button>
```

**Faydalar:**
- ✅ Tek tıkla işlem
- ✅ Workflow hızlandırma
- ✅ Kullanıcı deneyimi

---

## ⌨️ 3. KEYBOARD SHORTCUTS (Klavye Kısayolları)

### 3.1. Global Shortcuts

**Durum:** ❌ Keyboard shortcuts yok

**Öneri:** Yaygın işlemler için kısayollar

**Kısayollar:**
```typescript
// src/hooks/useKeyboardShortcuts.ts (YENİ DOSYA)
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'

export function useKeyboardShortcuts() {
  const router = useRouter()
  const locale = useLocale()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Global shortcuts (her yerden)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        // Command palette aç
        document.dispatchEvent(new CustomEvent('open-command-palette'))
      }

      // Yeni kayıt oluşturma (context-aware)
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        const path = window.location.pathname
        if (path.includes('/customers')) {
          router.push(`/${locale}/customers/new`)
        } else if (path.includes('/deals')) {
          router.push(`/${locale}/deals/new`)
        } else if (path.includes('/quotes')) {
          router.push(`/${locale}/quotes/new`)
        }
      }

      // Kaydet (form açıksa)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        const form = document.querySelector('form')
        if (form) {
          form.requestSubmit()
        }
      }

      // Geri git
      if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowLeft') {
        e.preventDefault()
        router.back()
      }

      // İleri git
      if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowRight') {
        e.preventDefault()
        router.forward()
      }

      // Escape: Modal kapat
      if (e.key === 'Escape') {
        const modal = document.querySelector('[role="dialog"]')
        if (modal) {
          const closeButton = modal.querySelector('[aria-label="Close"]')
          if (closeButton) {
            ;(closeButton as HTMLElement).click()
          }
        }
      }

      // Kısayollar listesi
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault()
        // Keyboard shortcuts modal aç
        document.dispatchEvent(new CustomEvent('open-shortcuts-modal'))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router, locale])
}
```

**Kısayollar Listesi:**
- `Cmd/Ctrl + K`: Command palette
- `Cmd/Ctrl + N`: Yeni kayıt (context-aware)
- `Cmd/Ctrl + S`: Kaydet
- `Cmd/Ctrl + ←`: Geri git
- `Cmd/Ctrl + →`: İleri git
- `Escape`: Modal kapat
- `Cmd/Ctrl + /`: Kısayollar listesi

**Faydalar:**
- ✅ Klavye odaklı kullanım
- ✅ Power user desteği
- ✅ Hız artışı (mouse kullanmadan)

**Dosyalar:**
- `src/hooks/useKeyboardShortcuts.ts` - Keyboard shortcuts hook
- `src/app/[locale]/layout.tsx` - Root layout'a ekle

---

## 🔍 4. SMART SEARCH & AUTO-COMPLETE

### 4.1. Global Search Bar

**Durum:** ⚠️ Basit arama var ama global search yok

**Öneri:** Header'da global search bar

**Nerede Eklenebilir:**
```typescript
// src/components/search/GlobalSearch.tsx (YENİ DOSYA)
'use client'

import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Command } from 'cmdk'
import { useRouter } from 'next/navigation'
import { useData } from '@/hooks/useData'

export default function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const router = useRouter()

  // Debounced search
  const [debouncedQuery, setDebouncedQuery] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(timer)
  }, [query])

  // Search API
  const { data: results } = useData(
    debouncedQuery ? `/api/search?q=${encodeURIComponent(debouncedQuery)}` : null
  )

  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Ara... (Cmd+K)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        className="pl-10"
      />
      {open && query && (
        <Command className="absolute top-full mt-2 w-full border shadow-lg">
          <Command.List>
            {results?.customers?.map((customer: any) => (
              <Command.Item
                key={customer.id}
                onSelect={() => {
                  router.push(`/customers/${customer.id}`)
                  setOpen(false)
                }}
              >
                <Users className="mr-2 h-4 w-4" />
                {customer.name}
              </Command.Item>
            ))}
            {results?.deals?.map((deal: any) => (
              <Command.Item
                key={deal.id}
                onSelect={() => {
                  router.push(`/deals/${deal.id}`)
                  setOpen(false)
                }}
              >
                <Briefcase className="mr-2 h-4 w-4" />
                {deal.title}
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      )}
    </div>
  )
}
```

**API Endpoint:**
```typescript
// src/app/api/search/route.ts (YENİ DOSYA)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')
  
  if (!q) return NextResponse.json({ customers: [], deals: [], quotes: [] })
  
  // Paralel arama
  const [customers, deals, quotes] = await Promise.all([
    supabase.from('Customer').select('id, name').ilike('name', `%${q}%`).limit(5),
    supabase.from('Deal').select('id, title').ilike('title', `%${q}%`).limit(5),
    supabase.from('Quote').select('id, title').ilike('title', `%${q}%`).limit(5),
  ])
  
  return NextResponse.json({
    customers: customers.data || [],
    deals: deals.data || [],
    quotes: quotes.data || [],
  })
}
```

**Faydalar:**
- ✅ Hızlı arama (2-3 saniye tasarruf)
- ✅ Tek yerden tüm kayıtları bulma
- ✅ Modern UX

**Dosyalar:**
- `src/components/search/GlobalSearch.tsx` - Global search component
- `src/app/api/search/route.ts` - Search API endpoint
- `src/components/layout/Header.tsx` - Header'a ekle

---

### 4.2. Auto-Complete (Otomatik Tamamlama)

**Durum:** ❌ Auto-complete yok

**Öneri:** Form alanlarında auto-complete

**Nerede Eklenebilir:**
```typescript
// src/components/ui/AutoCompleteInput.tsx (YENİ DOSYA)
'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Command } from 'cmdk'

interface AutoCompleteInputProps {
  value: string
  onChange: (value: string) => void
  fetchOptions: (query: string) => Promise<Array<{ id: string; label: string }>>
  placeholder?: string
}

export default function AutoCompleteInput({
  value,
  onChange,
  fetchOptions,
  placeholder,
}: AutoCompleteInputProps) {
  const [query, setQuery] = useState(value)
  const [options, setOptions] = useState<Array<{ id: string; label: string }>>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (query.length > 2) {
      fetchOptions(query).then(setOptions)
    } else {
      setOptions([])
    }
  }, [query, fetchOptions])

  return (
    <div className="relative">
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
      />
      {open && options.length > 0 && (
        <Command className="absolute top-full mt-1 w-full border shadow-lg z-50">
          <Command.List>
            {options.map((option) => (
              <Command.Item
                key={option.id}
                onSelect={() => {
                  setQuery(option.label)
                  onChange(option.id)
                  setOpen(false)
                }}
              >
                {option.label}
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      )}
    </div>
  )
}
```

**Kullanım:**
- Müşteri seçimi (Deal, Quote formlarında)
- Ürün seçimi (Quote, Invoice formlarında)
- Kullanıcı seçimi (Task, Ticket formlarında)

**Faydalar:**
- ✅ Hızlı seçim (yazmaya başladığında öneriler)
- ✅ Typo önleme
- ✅ Kullanıcı deneyimi

**Dosyalar:**
- `src/components/ui/AutoCompleteInput.tsx` - Auto-complete component
- Form component'lerinde kullan

---

## 📋 5. BATCH OPERATIONS (Toplu İşlemler)

### 5.1. Bulk Actions Toolbar

**Durum:** ⚠️ Bazı yerlerde var ama eksik

**Öneri:** Tüm listelerde toplu işlemler

**Nerede Eklenebilir:**
```typescript
// src/components/customers/CustomerList.tsx
const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])

// Checkbox ile seçim
<TableRow>
  <TableCell>
    <Checkbox
      checked={selectedCustomers.includes(customer.id)}
      onCheckedChange={(checked) => {
        if (checked) {
          setSelectedCustomers([...selectedCustomers, customer.id])
        } else {
          setSelectedCustomers(selectedCustomers.filter(id => id !== customer.id))
        }
      }}
    />
  </TableCell>
  {/* ... */}
</TableRow>

// Toplu işlem toolbar (seçim yapıldığında görünür)
{selectedCustomers.length > 0 && (
  <div className="fixed bottom-0 left-0 right-0 bg-primary text-primary-foreground p-4 shadow-lg z-50">
    <div className="container mx-auto flex items-center justify-between">
      <span>{selectedCustomers.length} müşteri seçildi</span>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          onClick={() => handleBulkExport(selectedCustomers)}
        >
          Dışa Aktar
        </Button>
        <Button
          variant="secondary"
          onClick={() => handleBulkDelete(selectedCustomers)}
        >
          Sil
        </Button>
        <Button
          variant="secondary"
          onClick={() => handleBulkTag(selectedCustomers)}
        >
          Etiketle
        </Button>
        <Button
          variant="ghost"
          onClick={() => setSelectedCustomers([])}
        >
          Seçimi Temizle
        </Button>
      </div>
    </div>
  </div>
)}
```

**Toplu İşlemler:**
- Toplu silme
- Toplu export (CSV, PDF)
- Toplu durum değiştirme
- Toplu etiketleme
- Toplu e-posta gönderme

**Faydalar:**
- ✅ Zaman tasarrufu (100 kayıt → 1 işlem)
- ✅ Verimlilik artışı
- ✅ Kullanıcı deneyimi

**Dosyalar:**
- Tüm liste component'lerine ekle (CustomerList, DealList, QuoteList, vb.)

---

## 🔖 6. RECENT ITEMS & FAVORITES

### 6.1. Recent Items Sidebar

**Durum:** ❌ Recent items yok

**Öneri:** Son görüntülenen kayıtlar

**Nerede Eklenebilir:**
```typescript
// src/hooks/useRecentItems.ts (YENİ DOSYA)
'use client'

import { useState, useEffect } from 'react'

interface RecentItem {
  id: string
  type: 'customer' | 'deal' | 'quote' | 'invoice'
  title: string
  url: string
  viewedAt: number
}

export function useRecentItems() {
  const [items, setItems] = useState<RecentItem[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('recentItems')
    if (stored) {
      setItems(JSON.parse(stored))
    }
  }, [])

  const addItem = (item: Omit<RecentItem, 'viewedAt'>) => {
    const newItem = { ...item, viewedAt: Date.now() }
    const updated = [newItem, ...items.filter(i => i.id !== item.id)].slice(0, 10)
    setItems(updated)
    localStorage.setItem('recentItems', JSON.stringify(updated))
  }

  return { items, addItem }
}
```

**Kullanım:**
- Sidebar'da "Son Görüntülenenler" bölümü
- Her kayıt görüntülendiğinde ekle
- Hızlı erişim için

**Faydalar:**
- ✅ Hızlı erişim (son görüntülenen kayıtlar)
- ✅ Workflow kesintisizliği
- ✅ Kullanıcı deneyimi

**Dosyalar:**
- `src/hooks/useRecentItems.ts` - Recent items hook
- `src/components/layout/Sidebar.tsx` - Sidebar'a ekle

---

### 6.2. Favorites/Bookmarks

**Durum:** ❌ Favorites yok

**Öneri:** Sık kullanılan kayıtları favorilere ekle

**Nerede Eklenebilir:**
```typescript
// src/hooks/useFavorites.ts (YENİ DOSYA)
'use client'

import { useState, useEffect } from 'react'

interface Favorite {
  id: string
  type: 'customer' | 'deal' | 'quote' | 'invoice'
  title: string
  url: string
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('favorites')
    if (stored) {
      setFavorites(JSON.parse(stored))
    }
  }, [])

  const addFavorite = (favorite: Favorite) => {
    const updated = [...favorites, favorite]
    setFavorites(updated)
    localStorage.setItem('favorites', JSON.stringify(updated))
  }

  const removeFavorite = (id: string) => {
    const updated = favorites.filter(f => f.id !== id)
    setFavorites(updated)
    localStorage.setItem('favorites', JSON.stringify(updated))
  }

  const isFavorite = (id: string) => {
    return favorites.some(f => f.id === id)
  }

  return { favorites, addFavorite, removeFavorite, isFavorite }
}
```

**Kullanım:**
- Detay sayfalarında "⭐ Favorilere Ekle" butonu
- Sidebar'da "Favoriler" bölümü
- Hızlı erişim için

**Faydalar:**
- ✅ Sık kullanılan kayıtlara hızlı erişim
- ✅ Kişiselleştirme
- ✅ Kullanıcı deneyimi

**Dosyalar:**
- `src/hooks/useFavorites.ts` - Favorites hook
- `src/components/layout/Sidebar.tsx` - Sidebar'a ekle

---

## 🎨 7. QUICK FILTERS & SAVED FILTERS

### 7.1. Quick Filters

**Durum:** ⚠️ Basit filtreler var ama quick filters yok

**Öneri:** Hızlı filtre butonları

**Nerede Eklenebilir:**
```typescript
// src/components/customers/CustomerList.tsx
const quickFilters = [
  { label: 'Bugün Eklenenler', filter: { createdAt: 'today' } },
  { label: 'Bu Hafta', filter: { createdAt: 'thisWeek' } },
  { label: 'Aktif Müşteriler', filter: { status: 'ACTIVE' } },
  { label: 'Pasif Müşteriler', filter: { status: 'INACTIVE' } },
]

<div className="flex gap-2 mb-4">
  {quickFilters.map((qf) => (
    <Button
      key={qf.label}
      variant={activeFilter === qf.label ? 'default' : 'outline'}
      onClick={() => applyQuickFilter(qf.filter)}
    >
      {qf.label}
    </Button>
  ))}
</div>
```

**Faydalar:**
- ✅ Tek tıkla filtreleme
- ✅ Hız artışı
- ✅ Kullanıcı deneyimi

---

### 7.2. Saved Filters

**Durum:** ❌ Saved filters yok

**Öneri:** Kaydedilmiş filtreler

**Nerede Eklenebilir:**
```typescript
// src/hooks/useSavedFilters.ts (YENİ DOSYA)
'use client'

interface SavedFilter {
  id: string
  name: string
  filters: Record<string, any>
}

export function useSavedFilters() {
  const [filters, setFilters] = useState<SavedFilter[]>([])

  const saveFilter = (name: string, filters: Record<string, any>) => {
    const newFilter = { id: crypto.randomUUID(), name, filters }
    setFilters([...filters, newFilter])
    localStorage.setItem('savedFilters', JSON.stringify([...filters, newFilter]))
  }

  const applyFilter = (filterId: string) => {
    const filter = filters.find(f => f.id === filterId)
    if (filter) {
      // Apply filter logic
    }
  }

  return { filters, saveFilter, applyFilter }
}
```

**Faydalar:**
- ✅ Sık kullanılan filtreleri kaydetme
- ✅ Hız artışı
- ✅ Kişiselleştirme

---

## 🎯 ÖNCELİK SIRASI

### 🔥 Yüksek Öncelik (Hemen Yapılmalı)
1. **Command Palette (Cmd+K)** - Global hızlı erişim (3-4 saat)
2. **Keyboard Shortcuts** - Klavye odaklı kullanım (2-3 saat)
3. **Global Search Bar** - Hızlı arama (2-3 saat)

### 📊 Orta Öncelik (Yakın Gelecekte)
4. **Quick Create Modals** - Hızlı kayıt oluşturma (3-4 saat)
5. **Floating Action Button** - Context-aware FAB (2-3 saat)
6. **Auto-Complete Input** - Form hızlandırma (2-3 saat)
7. **Bulk Actions Toolbar** - Toplu işlemler (3-4 saat)

### 🔧 Düşük Öncelik (Gelecekte)
8. **Recent Items Sidebar** - Son görüntülenenler (2-3 saat)
9. **Favorites/Bookmarks** - Sık kullanılanlar (2-3 saat)
10. **Quick Filters** - Hızlı filtreleme (2-3 saat)
11. **Saved Filters** - Kaydedilmiş filtreler (2-3 saat)

---

## 📝 SONUÇ

**Toplam Süre Tahmini:**
- Yüksek Öncelik: 7-10 saat
- Orta Öncelik: 10-14 saat
- Düşük Öncelik: 8-12 saat

**Önerilen İlk Adımlar (Toplam 7-10 saat):**
1. Command Palette ekle (3-4 saat)
2. Keyboard Shortcuts ekle (2-3 saat)
3. Global Search Bar ekle (2-3 saat)

Bu üç özellik ile sistem kullanımı **%50 daha hızlı** hale gelir.

**Sonraki Adımlar:**
- Quick Create Modals (hızlı kayıt oluşturma)
- Floating Action Button (context-aware işlemler)
- Auto-Complete Input (form hızlandırma)

