# 🔗 Git Repository + Vercel Bağlama Rehberi

## 📋 Adım 1: Git Repository Oluşturma

### GitHub Kullanıyorsanız:

1. **GitHub'da yeni repository oluşturun:**
   - https://github.com/new adresine gidin
   - Repository name: `crm-enterprise-v3` (veya istediğiniz isim)
   - Public veya Private seçin
   - **"Initialize this repository with a README" seçeneğini KAPATIN**
   - "Create repository" butonuna tıklayın

2. **GitHub'dan repository URL'ini kopyalayın:**
   - Örnek: `https://github.com/kullaniciadi/crm-enterprise-v3.git`

### GitLab Kullanıyorsanız:

1. **GitLab'da yeni project oluşturun:**
   - https://gitlab.com/projects/new adresine gidin
   - Project name: `crm-enterprise-v3`
   - "Create blank project" seçin
   - "Create project" butonuna tıklayın

2. **GitLab'dan repository URL'ini kopyalayın:**
   - Örnek: `https://gitlab.com/kullaniciadi/crm-enterprise-v3.git`

---

## 📋 Adım 2: Local Git Repository Hazırlama

Terminal'de şu komutları çalıştırın:

```bash
# 1. Tüm değişiklikleri stage'e ekle
git add .

# 2. Commit yap
git commit -m "Deploy optimizasyonları ve build düzeltmeleri"

# 3. Main branch'e geç (eğer değilseniz)
git checkout -b main

# 4. Remote repository ekle (GitHub URL'inizi kullanın)
git remote add origin https://github.com/KULLANICIADI/crm-enterprise-v3.git

# 5. Push yap
git push -u origin main
```

**Not:** `KULLANICIADI` ve repository ismini kendi bilgilerinizle değiştirin.

---

## 📋 Adım 3: Vercel'e Git Bağlama

### Yöntem 1: Vercel Dashboard'dan

1. **Vercel Dashboard'a gidin:**
   - https://vercel.com/alis-projects-a7c43f3e/crm-enterprise-v3

2. **Settings → Git** sekmesine gidin

3. **"Connect Git Repository"** butonuna tıklayın

4. **Git provider'ınızı seçin** (GitHub, GitLab, Bitbucket)

5. **Repository'nizi seçin** (`crm-enterprise-v3`)

6. **"Connect"** butonuna tıklayın

### Yöntem 2: Vercel CLI ile

```bash
# Git repository'yi Vercel'e bağla
vercel git connect
```

---

## ✅ Sonuç

Git bağlantısı yapıldıktan sonra:

- ✅ Her `git push` otomatik deploy olacak
- ✅ Main branch → Production deployment
- ✅ Diğer branch'ler → Preview deployments
- ✅ Pull Request'ler → Preview deployments

---

## 🔄 İlk Push Sonrası

Git push yaptıktan sonra Vercel otomatik olarak:
1. Repository'yi çekecek
2. Build yapacak
3. Deploy edecek

Environment variables zaten eklendi, bu yüzden build başarılı olacak!

---

## 📝 Notlar

- Environment variables Git'e push edilmez (güvenlik için)
- `.env.local` dosyası `.gitignore`'da olmalı
- Vercel Dashboard'dan environment variables'ları yönetmeye devam edin

