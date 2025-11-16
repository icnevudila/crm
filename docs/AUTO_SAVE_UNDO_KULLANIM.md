# 💾 Otomatik Kaydetme & Geri Alma Sistemi - Kullanım Kılavuzu

**Tarih:** 2024  
**Durum:** ✅ Tamamlandı

---

## 📋 ÖZELLİKLER

### 1. ✅ Otomatik Kaydetme (Auto-Save)

Form değişiklikleri otomatik olarak kaydedilir (2 saniye debounce).

**Özellikler:**
- 2 saniye debounce (kullanıcı yazmayı bitirdikten sonra kaydeder)
- "Kaydediliyor..." göstergesi
- Tarayıcı kapanmadan önce uyarı (kaydedilmemiş değişiklikler varsa)
- Sessiz kaydetme (kullanıcıyı rahatsız etmez)

### 2. ✅ Geri Alma Sistemi (Undo/Redo)

Son 10 işlemi geri alabilirsiniz.

**Klavye Kısayolları:**
- `Ctrl+Z` (Windows) veya `Cmd+Z` (Mac) - Geri Al
- `Ctrl+Shift+Z` veya `Ctrl+Y` - İleri Al

**Özellikler:**
- Son 10 işlemi saklar
- Undo/Redo desteği
- Toast bildirimleri

---

## 🚀 KULLANIM

### Form'larda Otomatik Kaydetme

```typescript
'use client'

import { useAutoSave } from '@/hooks/useAutoSave'
import { useState } from 'react'
import AutoSaveIndicator from '@/components/ui/AutoSaveIndicator'

export default function MyForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  })
  const [isSaving, setIsSaving] = useState(false)

  // Otomatik kaydetme
  const { saveNow } = useAutoSave({
    onSave: async (data) => {
      // API'ye kaydet
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Kaydetme başarısız')
    },
    data: formData,
    enabled: true,
    debounceMs: 2000, // 2 saniye
    showToast: false, // İlk kayıt hariç toast göster
    onSavingChange: setIsSaving,
  })

  return (
    <form>
      <input
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      
      {/* Otomatik kaydetme göstergesi */}
      <AutoSaveIndicator isSaving={isSaving} isSaved={!isSaving} />
      
      {/* Manuel kaydetme butonu (opsiyonel) */}
      <button type="button" onClick={saveNow}>
        Şimdi Kaydet
      </button>
    </form>
  )
}
```

### Undo Stack Kullanımı

```typescript
'use client'

import { useUndoStackContext } from '@/components/providers/UndoStackProvider'
import { toastSuccess } from '@/lib/toast'

export default function MyComponent() {
  const { push, undo, redo, canUndo, canRedo } = useUndoStackContext()

  const handleDelete = async (id: string) => {
    // Silinen veriyi sakla
    const deletedData = await fetch(`/api/items/${id}`).then(r => r.json())

    // Silme işlemi
    await fetch(`/api/items/${id}`, { method: 'DELETE' })

    // Undo stack'e ekle
    push({
      type: 'delete',
      description: 'Öğe silindi',
      undo: async () => {
        // Geri yükle
        await fetch('/api/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(deletedData),
        })
        toastSuccess('Geri yüklendi')
      },
      redo: async () => {
        // Tekrar sil
        await fetch(`/api/items/${id}`, { method: 'DELETE' })
        toastSuccess('Tekrar silindi')
      },
    })

    toastSuccess('Silindi', undefined, {
      action: {
        label: 'Geri Al',
        onClick: async () => {
          await undo()
        },
      },
    })
  }

  return (
    <div>
      <button onClick={handleDelete}>Sil</button>
      <button onClick={undo} disabled={!canUndo}>
        Geri Al (Ctrl+Z)
      </button>
      <button onClick={redo} disabled={!canRedo}>
        İleri Al (Ctrl+Shift+Z)
      </button>
    </div>
  )
}
```

---

## ⌨️ KLAVYE KISAYOLLARI

### Global Kısayollar

| Kısayol | Açıklama |
|---------|----------|
| `Ctrl+Z` / `Cmd+Z` | Geri Al (Undo) |
| `Ctrl+Shift+Z` / `Ctrl+Y` | İleri Al (Redo) |
| `Ctrl+S` / `Cmd+S` | Kaydet (Form sayfalarında) |
| `N` | Yeni Kayıt (Liste sayfalarında) |
| `Cmd+K` / `Ctrl+K` | Komut Paleti |
| `?` | Tüm kısayolları göster |

### Kullanım Notları

- Kısayollar sadece input/textarea dışındayken çalışır
- Form sayfalarında `Ctrl+S` form'u kaydeder
- Liste sayfalarında `N` yeni kayıt sayfasına gider

---

## 🎯 ÖRNEK UYGULAMA

### CustomerForm'a Auto-Save Ekleme

```typescript
// src/components/customers/CustomerForm.tsx

import { useAutoSave } from '@/hooks/useAutoSave'
import AutoSaveIndicator from '@/components/ui/AutoSaveIndicator'

export default function CustomerForm({ customer, onSuccess }: Props) {
  const { register, watch, formState } = useForm()
  const [isSaving, setIsSaving] = useState(false)
  
  const formData = watch()

  // Otomatik kaydetme (sadece düzenleme modunda)
  useAutoSave({
    onSave: async (data) => {
      if (!customer?.id) return // Yeni kayıt için auto-save yok
      
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Kaydetme başarısız')
    },
    data: formData,
    enabled: !!customer?.id, // Sadece düzenleme modunda
    debounceMs: 2000,
    showToast: false,
    onSavingChange: setIsSaving,
  })

  return (
    <form>
      {/* Form alanları */}
      
      {/* Auto-save göstergesi */}
      {customer?.id && (
        <div className="mt-4">
          <AutoSaveIndicator isSaving={isSaving} isSaved={!isSaving} />
        </div>
      )}
    </form>
  )
}
```

---

## ⚠️ DİKKAT EDİLMESİ GEREKENLER

### Auto-Save

1. **Yeni kayıtlar için auto-save kullanmayın** - Sadece düzenleme modunda kullanın
2. **Debounce süresini ayarlayın** - Çok kısa süre çok fazla API çağrısı yapar
3. **Toast gösterimi** - İlk kayıt hariç toast gösterin (kullanıcıyı rahatsız etmemek için)

### Undo Stack

1. **Maksimum boyut** - Varsayılan 10 işlem (performans için)
2. **Memory kullanımı** - Büyük veriler için dikkatli kullanın
3. **Async işlemler** - Undo/Redo fonksiyonları async olabilir

---

## 📊 PERFORMANS

### Auto-Save

- **Debounce:** 2 saniye (gereksiz API çağrılarını önler)
- **Memory:** Minimal (sadece son kaydedilen veriyi saklar)
- **Network:** Sadece değişiklik olduğunda API çağrısı

### Undo Stack

- **Memory:** Son 10 işlem (yaklaşık 50-100KB)
- **CPU:** Minimal (sadece stack yönetimi)
- **Network:** Undo/Redo sırasında API çağrısı yapılabilir

---

**Son Güncelleme:** 2024  
**Durum:** ✅ Tamamlandı ve Test Edildi






