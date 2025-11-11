-- ============================================
-- 048_fix_notification_insert.sql
-- 046 Migration'daki Notification INSERT Hatasını Düzelt
-- ============================================

-- Hatalı bildirimi temizle (eğer varsa)
DELETE FROM "Notification" 
WHERE title = '🗓️ Yeni Özellik: Otomatik Hatırlatıcılar!'
  AND "createdAt" > NOW() - INTERVAL '1 hour';

-- Doğru şekilde bildirim oluştur
INSERT INTO "Notification" (
  "userId",
  "companyId",
  title,
  message,
  type,
  "relatedTo",
  "relatedId",
  link
)
SELECT 
  u.id,
  u."companyId",
  '🗓️ Yeni Özellik: Otomatik Hatırlatıcılar!',
  'Görev tarihleri için 1 gün önce hatırlatıcı' || E'\n' ||
  'Görüşme saatleri için 1 gün ve 1 saat önce hatırlatıcı' || E'\n' ||
  'Günlük özet bildirimleri' || E'\n' ||
  'Artık hiçbir önemli tarihi kaçırmazsınız!',
  'success',
  'User',
  u.id,
  '/tr/dashboard'
FROM "User" u
WHERE u.role IN ('ADMIN', 'SALES', 'SUPER_ADMIN')
ON CONFLICT DO NOTHING;

-- ============================================
-- Migration tamamlandı!
-- ============================================

