# 📁 DÖKÜMANLAR SAYFA HATASI ÇÖZÜMÜ

## ❌ Sorun
- "Dosya Yükle" butonu görünmüyor
- Sayfa yenilendiğinde hata veriyor

## 🔍 Olası Nedenler

### 1. API Hatası
Documents API'si hata veriyor olabilir.

### 2. Interface Uyumsuzluğu
API'den dönen veri ile component beklentisi uyuşmuyor olabilir.

### 3. Authentication Hatası  
Session veya auth sorunu olabilir.

---

## 🚀 HIZLI ÇÖZÜM

### Adım 1: Dev Server'ı Yeniden Başlat

```bash
# Ctrl+C ile durdur
# Sonra:
npm run dev
```

### Adım 2: Browser Console'ı Aç

1. `F12` bas (Developer Tools)
2. **Console** sekmesine git
3. Sayfayı yenile (`F5`)
4. Kırmızı hataları kopyala

### Adım 3: Network Tab'ı Kontrol Et

1. **Network** sekmesine git
2. Sayfayı yenile
3. `/api/documents` isteğine tıkla
4. **Response** tab'ına bak
5. Hata mesajını kopyala

---

## 🔧 MUHTEMEL ÇÖZÜMLER

### Çözüm 1: API Interface Düzeltmesi

Documents API'si eksik alanlar döndürüyor olabilir.

**Düzeltme:** `src/app/api/documents/route.ts` dosyasını kontrol et

```typescript
// ŞU ALANLARIN HEPSI DÖNMELİ:
select(`
  id, title, description, fileUrl, fileName, fileSize, fileType,
  relatedTo, relatedId, folder, tags, createdAt,
  uploadedBy:User!Document_uploadedBy_fkey(id, name, email)
`)
```

### Çözüm 2: Null Check Ekle

Component'e null check ekle:

```typescript
// src/app/[locale]/documents/page.tsx
interface Document {
  id: string
  title: string
  fileName: string
  fileSize: number | null  // ← null olabilir!
  fileType: string | null  // ← null olabilir!
  fileUrl: string
  folder: string | null    // ← null olabilir!
  relatedTo: string | null // ← null olabilir!
  createdAt: string
  uploadedBy: { name: string; email: string } | null  // ← null olabilir!
}
```

### Çözüm 3: Default Values Ekle

```typescript
const formatFileSize = (bytes: number | null) => {
  if (!bytes) return '0 B'  // ← null kontrolü
  // ...
}
```

---

## 🧪 TEST KOMUTU

Bu komutu çalıştır ve sonucu gönder:

```bash
curl http://localhost:3000/api/documents
```

VEYA

Supabase Studio'da şunu çalıştır:

```sql
SELECT 
  id, title, description, fileUrl, fileName, fileSize, fileType,
  relatedTo, relatedId, folder, tags, createdAt, uploadedBy
FROM "Document"
WHERE "companyId" = 'SENIN_COMPANY_ID'
LIMIT 1;
```

---

## 📸 HATA EKRAN GÖRÜNTÜSÜ ALMAM GEREKEN

Lütfen şunların ekran görüntüsünü at:

1. ✅ Browser Console (F12 → Console)
2. ✅ Network Tab (F12 → Network → /api/documents)
3. ✅ Terminal'deki hata mesajı (varsa)

---

## ⚡ HIZLI FIX

Eğer yukarıdakiler işe yaramazsa, şunu dene:

### Option 1: Interface'i Genişlet

```typescript
// src/app/[locale]/documents/page.tsx
interface Document {
  id: string
  title: string
  description?: string | null
  fileName: string
  fileSize?: number | null
  fileType?: string | null
  fileUrl: string
  folder?: string | null
  relatedTo?: string | null
  relatedId?: string | null
  tags?: string[] | null
  createdAt: string
  uploadedBy?: { name: string; email: string } | null
}
```

### Option 2: Try-Catch Ekle

```typescript
export default function DocumentsPage() {
  const [search, setSearch] = useState('')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const apiUrl = `/api/documents${search ? `?search=${search}` : ''}`
  const { data: documents = [], isLoading, error: swrError } = useData<Document[]>(apiUrl)

  if (swrError) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">Hata: {swrError.message}</p>
        <p className="text-sm text-gray-500 mt-2">Console'u kontrol edin</p>
      </div>
    )
  }
  
  // ... rest of code
}
```

---

## 🎯 BEKLENTİ

Düzgün çalışırsa görmen gereken:

1. ✅ "Dosya Yükle" butonu sağ üstte
2. ✅ Tablo boş gösterir (henüz döküman yok)
3. ✅ "Henüz dosya yüklenmemiş" mesajı
4. ✅ Console'da hata YOK

---

## 📞 SONRAKI ADIM

Şunu yap ve sonucu gönder:

1. Dev server'ı yeniden başlat (`npm run dev`)
2. Sayfayı aç: http://localhost:3000/tr/documents
3. F12 → Console'daki HATALARI KOPYALA
4. Bana gönder!

Ben hemen çözerim! 🚀


