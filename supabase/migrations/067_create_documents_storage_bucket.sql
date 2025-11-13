-- ============================================
-- CRM V3 - Documents Storage Bucket & Policies
-- Migration: 067
-- Tarih: 2024
-- Amaç: Documents modülü için Supabase Storage bucket ve RLS policies oluşturma
-- ============================================

-- ============================================
-- 1. STORAGE BUCKET OLUŞTURMA
-- ============================================

-- Documents bucket'ı oluştur (eğer yoksa)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false, -- Private bucket (RLS ile kontrol edilecek)
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

-- Policy: Kullanıcılar kendi şirketlerinin dosyalarını görebilir
CREATE POLICY "Users can view their company documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  (
    -- Dosya yolu: companyId/entityType/entityId/filename formatında
    (storage.foldername(name))[1] IN (
      SELECT "companyId"::text FROM "User" WHERE id::text = auth.uid()::text
    )
    OR
    -- SuperAdmin tüm dosyaları görebilir
    EXISTS (
      SELECT 1 FROM "User" 
      WHERE id::text = auth.uid()::text 
      AND role = 'SUPER_ADMIN'
    )
  )
);

-- Policy: Kullanıcılar kendi şirketlerine dosya yükleyebilir
CREATE POLICY "Users can upload to their company folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  (
    -- Dosya yolu: companyId/entityType/entityId/filename formatında
    (storage.foldername(name))[1] IN (
      SELECT "companyId"::text FROM "User" WHERE id::text = auth.uid()::text
    )
    OR
    -- SuperAdmin tüm şirketlere yükleyebilir
    EXISTS (
      SELECT 1 FROM "User" 
      WHERE id::text = auth.uid()::text 
      AND role = 'SUPER_ADMIN'
    )
  )
);

-- Policy: Kullanıcılar kendi şirketlerinin dosyalarını güncelleyebilir
CREATE POLICY "Users can update their company documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documents' AND
  (
    (storage.foldername(name))[1] IN (
      SELECT "companyId"::text FROM "User" WHERE id::text = auth.uid()::text
    )
    OR
    EXISTS (
      SELECT 1 FROM "User" 
      WHERE id::text = auth.uid()::text 
      AND role = 'SUPER_ADMIN'
    )
  )
);

-- Policy: Kullanıcılar kendi şirketlerinin dosyalarını silebilir
CREATE POLICY "Users can delete their company documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' AND
  (
    (storage.foldername(name))[1] IN (
      SELECT "companyId"::text FROM "User" WHERE id::text = auth.uid()::text
    )
    OR
    EXISTS (
      SELECT 1 FROM "User" 
      WHERE id::text = auth.uid()::text 
      AND role = 'SUPER_ADMIN'
    )
  )
);

-- ============================================
-- 3. COMMENT'LER
-- ============================================

COMMENT ON POLICY "Users can view their company documents" ON storage.objects IS 
'Kullanıcılar sadece kendi şirketlerinin dosyalarını görebilir. SuperAdmin tüm dosyaları görebilir.';

COMMENT ON POLICY "Users can upload to their company folder" ON storage.objects IS 
'Kullanıcılar sadece kendi şirketlerine dosya yükleyebilir. SuperAdmin tüm şirketlere yükleyebilir.';

COMMENT ON POLICY "Users can update their company documents" ON storage.objects IS 
'Kullanıcılar sadece kendi şirketlerinin dosyalarını güncelleyebilir. SuperAdmin tüm dosyaları güncelleyebilir.';

COMMENT ON POLICY "Users can delete their company documents" ON storage.objects IS 
'Kullanıcılar sadece kendi şirketlerinin dosyalarını silebilir. SuperAdmin tüm dosyaları silebilir.';

-- ============================================
-- MIGRATION TAMAMLANDI
-- ============================================

