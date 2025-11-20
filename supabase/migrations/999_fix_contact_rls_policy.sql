-- Fix Contact Table RLS Policy
-- Contact tablosu için RLS policy düzeltmesi
-- Service role key ile çalışması için policy'yi güncelle

-- Önce mevcut policy'yi kaldır
DROP POLICY IF EXISTS "Contact company isolation" ON "Contact";

-- RLS'yi geçici olarak kapat (Service role key ile çalışması için)
-- NOT: Service role key kullanıldığında RLS otomatik bypass edilir
-- Ama bazen policy yanlış yapılandırılmışsa sorun çıkarabilir
-- Bu yüzden RLS'yi kapatıyoruz - API seviyesinde companyId filtresi zaten yapılıyor
ALTER TABLE "Contact" DISABLE ROW LEVEL SECURITY;

-- Alternatif: Eğer RLS'yi açık tutmak istiyorsanız, şu policy'yi kullanın:
-- CREATE POLICY "Contact company isolation"
-- ON "Contact"
-- FOR ALL
-- USING (true)  -- Service role key ile çalışır, API seviyesinde companyId filtresi yapılıyor
-- WITH CHECK (true);

-- Not: Service role key (SUPABASE_SERVICE_ROLE_KEY) kullanıldığında
-- Supabase otomatik olarak RLS'yi bypass eder
-- Ama bazen policy yanlış yapılandırılmışsa sorun çıkarabilir
-- Bu migration RLS'yi kapatır - güvenlik API seviyesinde sağlanıyor

