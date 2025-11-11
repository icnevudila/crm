# ⚠️ EKSİK ENVIRONMENT VARIABLES

## 🔴 HEMEN EKLEMENİZ GEREKEN 2 DEĞİŞKEN:

### 1. NEXT_PUBLIC_SUPABASE_URL
**Key:** `NEXT_PUBLIC_SUPABASE_URL`  
**Value:** `https://serlpsputsdqkgtzclnn.supabase.co`  
**Environments:** ✅ Production, ✅ Preview, ✅ Development

### 2. NEXT_PUBLIC_SUPABASE_ANON_KEY
**Key:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
**Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcmxwc3B1dHNkcWtndHpjbG5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwOTUzNTgsImV4cCI6MjA3NzY3MTM1OH0.ozlEJkOCkFt8Yl40gdXP7UPqZEtmDawSTqMqhjiR4xQ`  
**Environments:** ✅ Production, ✅ Preview, ✅ Development

## 📝 Adımlar:

1. Vercel Dashboard → **Settings** → **Environment Variables**
2. **Add New** butonuna tıklayın
3. İlk değişkeni ekleyin:
   - Key: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://serlpsputsdqkgtzclnn.supabase.co`
   - Environments: Production, Preview, Development (hepsini seçin)
   - **Save**
4. İkinci değişkeni ekleyin:
   - Key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcmxwc3B1dHNkcWtndHpjbG5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwOTUzNTgsImV4cCI6MjA3NzY3MTM1OH0.ozlEJkOCkFt8Yl40gdXP7UPqZEtmDawSTqMqhjiR4xQ`
   - Environments: Production, Preview, Development (hepsini seçin)
   - **Save**

## 🔄 Redeploy

Değişkenleri ekledikten sonra:
1. **Deployments** sekmesine gidin
2. En son deployment'ın yanındaki **...** menüsüne tıklayın
3. **Redeploy** seçin
4. **Use existing Build Cache** seçeneğini **KAPATIN**
5. **Redeploy** butonuna tıklayın

## ✅ Kontrol

Ekledikten sonra toplam **6 environment variable** olmalı:
- ✅ NEXT_PUBLIC_SUPABASE_URL
- ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
- ✅ SUPABASE_SERVICE_ROLE_KEY
- ✅ DATABASE_URL
- ✅ NEXTAUTH_SECRET
- ✅ NEXTAUTH_URL

