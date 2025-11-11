# 🎯 Vercel'de Doğru Projeyi Seçme Rehberi

## ❌ Sorun
Vercel'de birden fazla projeniz var ve environment variables eklerken yanlış projeye bakıyorsunuz.

## ✅ Çözüm

### 1. Doğru Projeyi Bulun

Vercel Dashboard'da:
1. Sol üstteki **"Projects"** dropdown'una tıklayın
2. Projelerin listesini görün
3. **"crm-enterprise-v3"** veya **"crm"** projesini bulun
4. Projeye tıklayın

### 2. Proje URL'si

Doğru proje URL'si şöyle olmalı:
```
https://vercel.com/[team-name]/crm-enterprise-v3
```
veya
```
https://vercel.com/[team-name]/crm
```

### 3. Environment Variables Ekleyin

**Doğru projede olduğunuzdan emin olun:**
1. Sol menüden **"Settings"** seçin
2. **"Environment Variables"** sekmesine tıklayın
3. Şu anda hangi projede olduğunuzu kontrol edin (üstte proje adı görünmeli)

### 4. Proje Adını Kontrol Edin

Vercel Dashboard'da üst kısımda şu bilgiler görünmeli:
- Proje adı: `crm-enterprise-v3` veya `crm`
- Team: `alis-projects-a7c43f3e` veya başka bir team adı

### 5. CLI ile Kontrol

Terminal'de şu komutu çalıştırın:
```bash
vercel ls
```

Bu komut tüm projelerinizi listeler. `crm-enterprise-v3` projesini bulun.

### 6. CLI ile Proje Seçimi

Eğer CLI kullanıyorsanız:
```bash
vercel link
```

Bu komut size projeleri listeler ve birini seçmenizi ister.

## 🔍 Hangi Projede Olduğunuzu Anlama

Vercel Dashboard'da:
- URL'de proje adı görünür: `vercel.com/.../crm-enterprise-v3`
- Sol üstte proje adı yazılı
- Settings → General'da proje adı ve ID görünür

## ⚠️ Önemli

- Her projenin kendi environment variables'ları vardır
- Bir projeye eklediğiniz variables başka projede görünmez
- Mutlaka **crm-enterprise-v3** veya **crm** projesinde olduğunuzdan emin olun

## 📝 Adımlar

1. Vercel Dashboard'a gidin
2. Sol üstteki **"Projects"** dropdown'una tıklayın
3. **crm-enterprise-v3** veya **crm** projesini seçin
4. **Settings** → **Environment Variables**
5. Değişkenleri ekleyin

