-- ============================================
-- Backfill Durum Kontrolü
-- ============================================
-- Bu script, backfill script'inin neden kayıt oluşturmadığını kontrol eder
-- ============================================

-- 1. ApprovalRequest tablosu var mı?
SELECT 
  'ApprovalRequest Tablosu' as kontrol,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ApprovalRequest')
    THEN '✅ Var'
    ELSE '❌ Yok'
  END as durum;

-- 2. Quote tablosunda kayıt var mı?
SELECT 
  'Quote Kayıtları' as kontrol,
  COUNT(*) as kayit_sayisi,
  COUNT(CASE WHEN status IN ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'DECLINED', 'WAITING') THEN 1 END) as uygun_kayit_sayisi
FROM "Quote";

-- 3. Deal tablosunda kayıt var mı?
SELECT 
  'Deal Kayıtları' as kontrol,
  COUNT(*) as kayit_sayisi,
  COUNT(CASE WHEN stage IN ('PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST') THEN 1 END) as uygun_kayit_sayisi
FROM "Deal";

-- 4. Invoice tablosunda kayıt var mı?
SELECT 
  'Invoice Kayıtları' as kontrol,
  COUNT(*) as kayit_sayisi,
  COUNT(CASE WHEN status IN ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED') THEN 1 END) as uygun_kayit_sayisi
FROM "Invoice";

-- 5. Contract tablosu var mı ve kayıt var mı?
SELECT 
  'Contract Tablosu' as kontrol,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Contract')
    THEN '✅ Var'
    ELSE '❌ Yok'
  END as tablo_durumu,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Contract')
    THEN (SELECT COUNT(*) FROM "Contract")
    ELSE 0
  END as kayit_sayisi;

-- 6. Quote tablosunda totalAmount/total kolonu var mı?
SELECT 
  'Quote Kolonları' as kontrol,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Quote' AND column_name = 'totalAmount')
    THEN '✅ totalAmount var'
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Quote' AND column_name = 'total')
    THEN '✅ total var'
    ELSE '❌ Hiçbiri yok'
  END as kolon_durumu;

-- 7. Invoice tablosunda totalAmount/total kolonu var mı?
SELECT 
  'Invoice Kolonları' as kontrol,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Invoice' AND column_name = 'totalAmount')
    THEN '✅ totalAmount var'
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Invoice' AND column_name = 'total')
    THEN '✅ total var'
    ELSE '❌ Hiçbiri yok'
  END as kolon_durumu;

-- 8. Deal tablosunda createdBy/assignedTo kolonu var mı?
SELECT 
  'Deal Kullanıcı Kolonları' as kontrol,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Deal' AND column_name = 'createdBy')
    THEN '✅ createdBy var'
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Deal' AND column_name = 'assignedTo')
    THEN '✅ assignedTo var'
    ELSE '❌ Hiçbiri yok'
  END as kolon_durumu;

-- 9. Quote tablosunda createdBy/assignedTo kolonu var mı?
SELECT 
  'Quote Kullanıcı Kolonları' as kontrol,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Quote' AND column_name = 'createdBy')
    THEN '✅ createdBy var'
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Quote' AND column_name = 'assignedTo')
    THEN '✅ assignedTo var'
    ELSE '❌ Hiçbiri yok'
  END as kolon_durumu;

-- 10. Invoice tablosunda createdBy/assignedTo kolonu var mı?
SELECT 
  'Invoice Kullanıcı Kolonları' as kontrol,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Invoice' AND column_name = 'createdBy')
    THEN '✅ createdBy var'
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Invoice' AND column_name = 'assignedTo')
    THEN '✅ assignedTo var'
    ELSE '❌ Hiçbiri yok'
  END as kolon_durumu;

-- 11. Contract tablosunda createdBy/assignedTo kolonu var mı?
SELECT 
  'Contract Kullanıcı Kolonları' as kontrol,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Contract' AND column_name = 'createdBy')
    THEN '✅ createdBy var'
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Contract' AND column_name = 'assignedTo')
    THEN '✅ assignedTo var'
    ELSE '❌ Hiçbiri yok'
  END as kolon_durumu;

-- 12. ApprovalRequest tablosunda kayıt var mı?
SELECT 
  'ApprovalRequest Kayıtları' as kontrol,
  COUNT(*) as toplam_kayit,
  COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as approved_kayit,
  COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_kayit,
  COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) as rejected_kayit
FROM "ApprovalRequest";

-- 13. Örnek Quote kayıtları (ilk 5) - totalAmount varsa onu kullan
SELECT 
  'Örnek Quote Kayıtları' as kontrol,
  id,
  title,
  status,
  "totalAmount" as amount,
  "companyId",
  "createdAt"
FROM "Quote"
WHERE status IN ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'DECLINED', 'WAITING')
ORDER BY "createdAt" DESC
LIMIT 5;

-- 14. Örnek Deal kayıtları (ilk 5)
SELECT 
  'Örnek Deal Kayıtları' as kontrol,
  id,
  title,
  stage,
  value,
  "companyId",
  "createdAt"
FROM "Deal"
WHERE stage IN ('PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST')
ORDER BY "createdAt" DESC
LIMIT 5;

-- 15. Örnek Invoice kayıtları (ilk 5) - totalAmount varsa onu kullan
SELECT 
  'Örnek Invoice Kayıtları' as kontrol,
  id,
  title,
  status,
  "totalAmount" as amount,
  "companyId",
  "createdAt"
FROM "Invoice"
WHERE status IN ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED')
ORDER BY "createdAt" DESC
LIMIT 5;

