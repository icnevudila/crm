# 🔧 Vercel Build Memory Hatası Çözümü

## ❌ Sorun
```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

## ✅ Çözüm 1: Build Command'i Güncelle (YAPILDI)

`package.json`'da memory limit 4096'den 8192'ye çıkarıldı:
```json
"build": "cross-env NODE_OPTIONS=--max-old-space-size=8192 next build"
```

## ✅ Çözüm 2: Vercel Dashboard'da Build Command Override

Vercel Dashboard'da:
1. **Settings** → **General** → **Build & Development Settings**
2. **Build Command** alanını bulun
3. Şu komutu yazın:
   ```
   NODE_OPTIONS=--max-old-space-size=8192 npm run build
   ```
4. **Save** butonuna tıklayın

## ✅ Çözüm 3: Vercel Pro Plan (Opsiyonel)

Eğer hala yeterli değilse, Vercel Pro plan'a geçin:
- Daha fazla build memory
- Daha hızlı build süreleri
- Daha fazla build dakikası

## 🔄 Redeploy

Değişikliklerden sonra:
1. **Deployments** → En son deployment → **Redeploy**
2. **"Use existing Build Cache"** seçeneğini **KAPATIN**
3. **Redeploy** butonuna tıklayın

## 📝 Notlar

- Memory limit 8GB'ye çıkarıldı (önceden 4GB)
- `swcMinify` deprecated uyarısı kaldırıldı (Next.js 15'te varsayılan)
- Build süresi biraz artabilir ama başarılı olmalı

