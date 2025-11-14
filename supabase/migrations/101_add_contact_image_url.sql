-- ============================================
-- CRM V3 - Add Image URL to Contact
-- Migration: 101
-- Tarih: 2024
-- Amaç: Contact tablosuna imageUrl kolonu ekleme (profil fotoğrafı için)
-- ============================================

-- Contact tablosuna imageUrl kolonu ekle
ALTER TABLE "Contact" 
ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;

-- Index ekle (imageUrl NULL olabilir, index gerekmez ama performans için ekleyebiliriz)
-- CREATE INDEX IF NOT EXISTS idx_contact_image_url ON "Contact"("imageUrl") WHERE "imageUrl" IS NOT NULL;

-- ============================================
-- MIGRATION TAMAMLANDI
-- ============================================



