-- ============================================
-- ADVANCED CRM FEATURES - TEST SCRIPT
-- ============================================

-- Test Company ve User oluştur (eğer yoksa)
DO $$
DECLARE
  test_company_id UUID;
  test_user_id UUID;
BEGIN
  -- Test Company
  INSERT INTO "Company" (name, domain, status)
  VALUES ('Test Şirketi A.Ş.', 'test.com', 'ACTIVE')
  ON CONFLICT DO NOTHING
  RETURNING id INTO test_company_id;

  IF test_company_id IS NULL THEN
    SELECT id INTO test_company_id FROM "Company" WHERE domain = 'test.com' LIMIT 1;
  END IF;

  -- Test User
  INSERT INTO "User" (email, name, password, role, "companyId", status)
  VALUES ('test@test.com', 'Test User', 'hashed', 'ADMIN', test_company_id, 'ACTIVE')
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO test_user_id;

  RAISE NOTICE 'Test Company ID: %', test_company_id;
  RAISE NOTICE 'Test User ID: %', test_user_id;
END $$;

-- ============================================
-- TEST 1: DOCUMENT MANAGEMENT
-- ============================================

-- Doküman ekle
INSERT INTO "Document" (
  title, description, "fileUrl", "fileName", "fileSize", "fileType",
  "relatedTo", "relatedId", folder,
  "companyId", "uploadedBy"
)
SELECT 
  'Test Sözleşme 2024',
  'Yıllık sözleşme dökümanı',
  'https://storage.supabase.co/documents/contract_2024.pdf',
  'contract_2024.pdf',
  102400,
  'application/pdf',
  'Contract',
  NULL,
  'Contracts',
  c.id,
  u.id
FROM "Company" c, "User" u
WHERE c.domain = 'test.com' AND u.email = 'test@test.com'
LIMIT 1;

-- Document Access ekle
INSERT INTO "DocumentAccess" (
  "documentId", "userId", "accessLevel", "companyId"
)
SELECT 
  d.id,
  u.id,
  'VIEW',
  c.id
FROM "Document" d, "Company" c, "User" u
WHERE c.domain = 'test.com' 
  AND u.email = 'test@test.com'
  AND d.title = 'Test Sözleşme 2024'
LIMIT 1;

SELECT 
  '✅ Document Management Test' as test_name,
  COUNT(*) as document_count 
FROM "Document" 
WHERE "companyId" = (SELECT id FROM "Company" WHERE domain = 'test.com');

-- ============================================
-- TEST 2: APPROVAL WORKFLOW
-- ============================================

-- Onay talebi ekle
INSERT INTO "ApprovalRequest" (
  title, description,
  "relatedTo", "relatedId",
  "requestedBy", "approverIds",
  status, priority,
  "companyId"
)
SELECT 
  '100,000 TL Teklif Onayı',
  'ABC Teknoloji için özel indirim talebi',
  'Quote',
  NULL,
  u.id,
  ARRAY[u.id],
  'PENDING',
  'HIGH',
  c.id
FROM "Company" c, "User" u
WHERE c.domain = 'test.com' AND u.email = 'test@test.com'
LIMIT 1;

SELECT 
  '✅ Approval Workflow Test' as test_name,
  COUNT(*) as approval_count 
FROM "ApprovalRequest" 
WHERE "companyId" = (SELECT id FROM "Company" WHERE domain = 'test.com');

-- ============================================
-- TEST 3: EMAIL CAMPAIGN
-- ============================================

-- Email kampanyası ekle
INSERT INTO "EmailCampaign" (
  name, subject, body,
  "targetSegment", status,
  "companyId", "createdBy"
)
SELECT 
  'Yaz İndirimi 2024',
  'Sadece sizin için %30 indirim!',
  '<html><body><h1>Özel Teklif</h1></body></html>',
  'VIP',
  'DRAFT',
  c.id,
  u.id
FROM "Company" c, "User" u
WHERE c.domain = 'test.com' AND u.email = 'test@test.com'
LIMIT 1;

SELECT 
  '✅ Email Campaign Test' as test_name,
  COUNT(*) as campaign_count 
FROM "EmailCampaign" 
WHERE "companyId" = (SELECT id FROM "Company" WHERE domain = 'test.com');

-- ============================================
-- TEST 4: SALES QUOTA
-- ============================================

-- Satış hedefi ekle
INSERT INTO "SalesQuota" (
  "userId", period, year, month,
  "revenueTarget", "dealsTarget", "newCustomersTarget",
  "companyId"
)
SELECT 
  u.id,
  'MONTHLY',
  2024,
  11,
  500000,
  10,
  5,
  c.id
FROM "Company" c, "User" u
WHERE c.domain = 'test.com' AND u.email = 'test@test.com'
LIMIT 1
ON CONFLICT ("userId", period, year, month, quarter, "companyId") DO NOTHING;

SELECT 
  '✅ Sales Quota Test' as test_name,
  COUNT(*) as quota_count 
FROM "SalesQuota" 
WHERE "companyId" = (SELECT id FROM "Company" WHERE domain = 'test.com');

-- ============================================
-- TEST 5: CUSTOMER SEGMENTATION
-- ============================================

-- Segment ekle
INSERT INTO "CustomerSegment" (
  name, description, criteria, "autoAssign", color, "companyId"
)
SELECT 
  'VIP Müşteriler',
  '100K+ gelir getiren müşteriler',
  '{"totalRevenue": {"gte": 100000}}'::jsonb,
  true,
  'gold',
  c.id
FROM "Company" c
WHERE c.domain = 'test.com'
LIMIT 1;

SELECT 
  '✅ Customer Segmentation Test' as test_name,
  COUNT(*) as segment_count 
FROM "CustomerSegment" 
WHERE "companyId" = (SELECT id FROM "Company" WHERE domain = 'test.com');

-- ============================================
-- TEST 6: PRODUCT BUNDLE
-- ============================================

-- Product Bundle ekle
INSERT INTO "ProductBundle" (
  name, description,
  "bundlePrice", "regularPrice", "discountPercent",
  "isActive", "companyId"
)
SELECT 
  'Enterprise Yıllık Paket',
  'Tüm özellikler + Premium destek',
  50000,
  60000,
  16.67,
  true,
  c.id
FROM "Company" c
WHERE c.domain = 'test.com'
LIMIT 1;

SELECT 
  '✅ Product Bundle Test' as test_name,
  COUNT(*) as bundle_count 
FROM "ProductBundle" 
WHERE "companyId" = (SELECT id FROM "Company" WHERE domain = 'test.com');

-- ============================================
-- TEST 7: COMPETITOR ANALYSIS
-- ============================================

-- Rakip ekle
INSERT INTO "Competitor" (
  name, description, website,
  strengths, weaknesses,
  "averagePrice", "marketShare",
  "companyId"
)
SELECT 
  'XYZ Yazılım A.Ş.',
  'Rakip yazılım şirketi',
  'https://xyz.com',
  ARRAY['Düşük fiyat', 'Hızlı teslimat'],
  ARRAY['Destek zayıf', 'Özellik eksik'],
  45000,
  15.5,
  c.id
FROM "Company" c
WHERE c.domain = 'test.com'
LIMIT 1;

SELECT 
  '✅ Competitor Analysis Test' as test_name,
  COUNT(*) as competitor_count 
FROM "Competitor" 
WHERE "companyId" = (SELECT id FROM "Company" WHERE domain = 'test.com');

-- ============================================
-- TEST 8: OTHER MODULES
-- ============================================

-- Territory
INSERT INTO "Territory" (name, region, "companyId")
SELECT 'İstanbul Bölgesi', 'Marmara', c.id
FROM "Company" c WHERE c.domain = 'test.com' LIMIT 1;

-- Partner
INSERT INTO "Partner" (name, type, "commissionRate", status, "companyId")
SELECT 'ABC Partner Ltd.', 'RESELLER', 10.00, 'ACTIVE', c.id
FROM "Company" c WHERE c.domain = 'test.com' LIMIT 1;

-- Tax Rate
INSERT INTO "TaxRate" (name, rate, type, "isDefault", "isActive", "companyId")
SELECT 'KDV %20', 20.00, 'VAT', true, true, c.id
FROM "Company" c WHERE c.domain = 'test.com' LIMIT 1;

-- Promotion
INSERT INTO "Promotion" (
  name, code, type, value,
  "validFrom", "validUntil", "isActive",
  "companyId"
)
SELECT 
  'Yaz İndirimi',
  'YAZ30',
  'PERCENTAGE',
  30.00,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  true,
  c.id
FROM "Company" c WHERE c.domain = 'test.com' LIMIT 1;

-- Survey
INSERT INTO "Survey" (
  title, description, questions, "isActive", "companyId"
)
SELECT 
  'Müşteri Memnuniyeti Anketi',
  'Hizmetlerimiz hakkında görüşleriniz',
  '[
    {"id": 1, "question": "Ürün kalitesinden memnun musunuz?", "type": "rating"},
    {"id": 2, "question": "Destek hizmetini nasıl değerlendirirsiniz?", "type": "rating"}
  ]'::jsonb,
  true,
  c.id
FROM "Company" c WHERE c.domain = 'test.com' LIMIT 1;

-- ============================================
-- ÖZET RAPOR
-- ============================================

SELECT '============================================' as separator;
SELECT '📊 TEST SONUÇLARI - ÖZET RAPOR' as title;
SELECT '============================================' as separator;

SELECT 
  'Document' as module,
  COUNT(*) as record_count
FROM "Document"
WHERE "companyId" = (SELECT id FROM "Company" WHERE domain = 'test.com')

UNION ALL

SELECT 
  'ApprovalRequest',
  COUNT(*)
FROM "ApprovalRequest"
WHERE "companyId" = (SELECT id FROM "Company" WHERE domain = 'test.com')

UNION ALL

SELECT 
  'EmailCampaign',
  COUNT(*)
FROM "EmailCampaign"
WHERE "companyId" = (SELECT id FROM "Company" WHERE domain = 'test.com')

UNION ALL

SELECT 
  'SalesQuota',
  COUNT(*)
FROM "SalesQuota"
WHERE "companyId" = (SELECT id FROM "Company" WHERE domain = 'test.com')

UNION ALL

SELECT 
  'CustomerSegment',
  COUNT(*)
FROM "CustomerSegment"
WHERE "companyId" = (SELECT id FROM "Company" WHERE domain = 'test.com')

UNION ALL

SELECT 
  'ProductBundle',
  COUNT(*)
FROM "ProductBundle"
WHERE "companyId" = (SELECT id FROM "Company" WHERE domain = 'test.com')

UNION ALL

SELECT 
  'Competitor',
  COUNT(*)
FROM "Competitor"
WHERE "companyId" = (SELECT id FROM "Company" WHERE domain = 'test.com')

UNION ALL

SELECT 
  'Territory',
  COUNT(*)
FROM "Territory"
WHERE "companyId" = (SELECT id FROM "Company" WHERE domain = 'test.com')

UNION ALL

SELECT 
  'Partner',
  COUNT(*)
FROM "Partner"
WHERE "companyId" = (SELECT id FROM "Company" WHERE domain = 'test.com')

UNION ALL

SELECT 
  'TaxRate',
  COUNT(*)
FROM "TaxRate"
WHERE "companyId" = (SELECT id FROM "Company" WHERE domain = 'test.com')

UNION ALL

SELECT 
  'Promotion',
  COUNT(*)
FROM "Promotion"
WHERE "companyId" = (SELECT id FROM "Company" WHERE domain = 'test.com')

UNION ALL

SELECT 
  'Survey',
  COUNT(*)
FROM "Survey"
WHERE "companyId" = (SELECT id FROM "Company" WHERE domain = 'test.com');

SELECT '============================================' as separator;
SELECT '✅ TÜM TESTLER TAMAMLANDI!' as result;
SELECT '============================================' as separator;


