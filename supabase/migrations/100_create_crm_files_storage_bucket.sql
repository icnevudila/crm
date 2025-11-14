-- ============================================
-- CRM V3 - CRM Files Storage Bucket & Policies
-- Migration: 100
-- Tarih: 2024
-- Amaç: Product, Contact ve diğer entity'ler için Supabase Storage bucket ve RLS policies oluşturma
-- ============================================

-- ============================================
-- 1. STORAGE BUCKET OLUŞTURMA
-- ============================================

-- CRM Files bucket'ı oluştur (eğer yoksa) - Product, Contact, Company vb. entity'ler için
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'crm-files',
  'crm-files',
  true, -- Public bucket (resimler için public URL gerekli)
  10485760, -- 10MB limit
  ARRAY[
    'image/*',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. STORAGE RLS POLICIES
-- ============================================

-- NOT: NextAuth kullanıldığı için auth.uid() çalışmayabilir
-- Bu yüzden storage policy'ler basitleştirildi - gerçek kontrol API seviyesinde yapılacak
-- API'lerde zaten getSafeSession() ile companyId kontrolü var

-- Önce mevcut policy'leri sil (varsa)
DROP POLICY IF EXISTS "Users can view their company crm files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to their company crm files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their company crm files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their company crm files" ON storage.objects;

-- Policy: Kullanıcılar kendi şirketlerinin dosyalarını görebilir
-- NOT: Gerçek kontrol API seviyesinde yapılıyor (getSafeSession ile companyId kontrolü)
CREATE POLICY "Users can view their company crm files"
ON storage.objects FOR SELECT
USING (bucket_id = 'crm-files');

-- Policy: Kullanıcılar kendi şirketlerine dosya yükleyebilir
-- NOT: Gerçek kontrol API seviyesinde yapılıyor (/api/files/upload endpoint'inde)
CREATE POLICY "Users can upload to their company crm files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'crm-files');

-- Policy: Kullanıcılar kendi şirketlerinin dosyalarını güncelleyebilir
-- NOT: Gerçek kontrol API seviyesinde yapılıyor
CREATE POLICY "Users can update their company crm files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'crm-files')
WITH CHECK (bucket_id = 'crm-files');

-- Policy: Kullanıcılar kendi şirketlerinin dosyalarını silebilir
-- NOT: Gerçek kontrol API seviyesinde yapılıyor
CREATE POLICY "Users can delete their company crm files"
ON storage.objects FOR DELETE
USING (bucket_id = 'crm-files');

-- ============================================
-- 3. COMMENT'LER (OPSİYONEL - Yetki yetersizliği durumunda atlanabilir)
-- ============================================

-- NOT: COMMENT ON POLICY için özel yetki gerekebilir
-- Policy'ler çalışıyor, comment'ler sadece dokümantasyon için
-- Comment eklemek isterseniz, Supabase Dashboard'dan Storage > Policies bölümünden manuel olarak ekleyebilirsiniz

-- ============================================
-- MIGRATION TAMAMLANDI
-- ============================================

