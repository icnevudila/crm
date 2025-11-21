# 🔐 Vercel Environment Variables - HEMEN EKLEYİN!

## ❌ SORUN
Build başarılı ama environment variables eksik olduğu için runtime'da hata veriyor.

## ✅ ÇÖZÜM

Vercel Dashboard'a gidin ve şu environment variables'ları **HEMEN** ekleyin:

### Adımlar:

1. **Vercel Dashboard'a gidin:** https://vercel.com/alis-projects-a7c43f3e/crm-enterprise-v3
2. **Settings** → **Environment Variables** bölümüne gidin
3. Şu 6 değişkeni ekleyin (her birini **Production, Preview, Development** için işaretleyin):

---

### 1. NEXT_PUBLIC_SUPABASE_URL
```
https://serlpsputsdqkgtzclnn.supabase.co
```

### 2. NEXT_PUBLIC_SUPABASE_ANON_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcmxwc3B1dHNkcWtndHpjbG5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwOTUzNTgsImV4cCI6MjA3NzY3MTM1OH0.ozlEJkOCkFt8Yl40gdXP7UPqZEtmDawSTqMqhjiR4xQ
```

### 3. SUPABASE_SERVICE_ROLE_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcmxwc3B1dHNkcWtndHpjbG5uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjA5NTM1OCwiZXhwIjoyMDc3NjcxMzU4fQ.6UINwDcWZW1qklOKb8Ls8Z2veO0gbcT9RCNbleuOzuU
```

### 4. DATABASE_URL
```
postgresql://postgres:WnC0jpTEVNEbn56I@db.serlpsputsdqkgtzclnn.supabase.co:5432/postgres
```

### 5. NEXTAUTH_SECRET
```
hyYhWb1EG0PVXSV9vlY4g/EFJAL02Dwqm/vpS1QzcaM=
```

### 6. NEXTAUTH_URL
```
https://crm-enterprise-v3-7bivtsem9-alis-projects-a7c43f3e.vercel.app
```
**Not:** Deploy sonrası Vercel'in verdiği production URL'i buraya yazın.

### 7. GROQ_API_KEY (AI Bot için)
```
your_groq_api_key_here
```
**Not:** 
- Groq Console'dan alın: https://console.groq.com
- API Keys → Create API Key
- Ücretsiz tier: 14,400 request/gün

---

## ⚠️ ÖNEMLİ

- Her değişkeni ekledikten sonra **Production, Preview, Development** seçeneklerini işaretleyin
- Tüm değişkenleri ekledikten sonra **mutlaka redeploy edin** (Deployments → ... → Redeploy)

## 🔄 Redeploy

Environment variables ekledikten sonra:

1. Vercel Dashboard → **Deployments** sekmesi
2. En son deployment'ın yanındaki **...** (üç nokta) menüsüne tıklayın
3. **Redeploy** seçeneğini seçin
4. **Use existing Build Cache** seçeneğini **KAPATIN** (environment variables'ların yüklenmesi için)
5. **Redeploy** butonuna tıklayın

---

## ✅ Kontrol

Deploy tamamlandıktan sonra:
- Ana sayfa: `https://crm-enterprise-v3-7bivtsem9-alis-projects-a7c43f3e.vercel.app/tr`
- Login: `https://crm-enterprise-v3-7bivtsem9-alis-projects-a7c43f3e.vercel.app/tr/login`

Eğer hata alırsanız, Vercel Dashboard → **Logs** sekmesinden runtime loglarını kontrol edin.

