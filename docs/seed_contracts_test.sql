-- ============================================
-- CONTRACT MODÜLÜ TEST VERİLERİ
-- ============================================
-- Bu dosyayı Supabase Dashboard → SQL Editor'de çalıştırın
-- ============================================

-- ÖNCE: Mevcut bir customer ve company ID'sini alalım
DO $$
DECLARE
  test_company_id UUID;
  test_customer_id UUID;
  test_customer_company_id UUID;
  test_user_id UUID;
  test_deal_id UUID;
  contract1_id UUID;
  contract2_id UUID;
  contract3_id UUID;
  contract4_id UUID;
  contract5_id UUID;
BEGIN
  -- İlk company'yi al
  SELECT id INTO test_company_id FROM "Company" LIMIT 1;
  
  IF test_company_id IS NULL THEN
    RAISE NOTICE 'HATA: Hiç Company bulunamadı. Önce Company oluşturun!';
    RETURN;
  END IF;
  
  -- İlk customer'ı al
  SELECT id INTO test_customer_id FROM "Customer" WHERE "companyId" = test_company_id LIMIT 1;
  
  -- İlk customer company'yi al
  SELECT id INTO test_customer_company_id FROM "CustomerCompany" WHERE "companyId" = test_company_id LIMIT 1;
  
  -- İlk user'ı al
  SELECT id INTO test_user_id FROM "User" WHERE "companyId" = test_company_id LIMIT 1;
  
  -- İlk deal'i al
  SELECT id INTO test_deal_id FROM "Deal" WHERE "companyId" = test_company_id LIMIT 1;
  
  RAISE NOTICE '============================================';
  RAISE NOTICE 'TEST VERİLERİ OLUŞTURULUYOR...';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Company ID: %', test_company_id;
  RAISE NOTICE 'Customer ID: %', test_customer_id;
  RAISE NOTICE 'User ID: %', test_user_id;
  RAISE NOTICE '============================================';
  
  -- ============================================
  -- TEST CONTRACT 1: Aktif Yıllık Bakım Sözleşmesi
  -- ============================================
  INSERT INTO "Contract" (
    "contractNumber",
    title,
    description,
    "customerId",
    "customerCompanyId",
    type,
    category,
    "startDate",
    "endDate",
    "signedDate",
    "renewalType",
    "renewalNoticeDays",
    "autoRenewEnabled",
    "billingCycle",
    "paymentTerms",
    value,
    currency,
    "taxRate",
    "totalValue",
    status,
    terms,
    notes,
    "companyId"
  )
  VALUES (
    'SOZL-2024-0001',
    'Yıllık Yazılım Bakım Sözleşmesi',
    'CRM yazılımı için 7/24 teknik destek ve bakım hizmeti',
    test_customer_id,
    test_customer_company_id,
    'MAINTENANCE',
    'Yazılım',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '1 year',
    CURRENT_DATE - INTERVAL '5 days',
    'MANUAL',
    30,
    false,
    'YEARLY',
    30,
    50000.00,
    'TRY',
    18.00,
    59000.00,
    'ACTIVE',
    'Bakım kapsamı: Bug fix, güncelleme, 7/24 destek',
    'İlk yıl sözleşmesi',
    test_company_id
  )
  RETURNING id INTO contract1_id;
  
  RAISE NOTICE '✅ Contract 1 oluşturuldu: % (ACTIVE)', contract1_id;
  
  -- ============================================
  -- TEST CONTRACT 2: Yakında Dolacak Abonelik (30 gün içinde)
  -- ============================================
  INSERT INTO "Contract" (
    "contractNumber",
    title,
    description,
    "customerId",
    type,
    category,
    "startDate",
    "endDate",
    "signedDate",
    "renewalType",
    "renewalNoticeDays",
    "autoRenewEnabled",
    "billingCycle",
    "billingDay",
    "paymentTerms",
    value,
    currency,
    "taxRate",
    "totalValue",
    status,
    "companyId"
  )
  VALUES (
    'SOZL-2024-0002',
    'Premium SaaS Aboneliği',
    'Aylık 10 kullanıcı premium paket',
    test_customer_id,
    'SUBSCRIPTION',
    'SaaS',
    CURRENT_DATE - INTERVAL '11 months',
    CURRENT_DATE + INTERVAL '25 days', -- 25 gün sonra bitecek (bildirim gelmeli)
    CURRENT_DATE - INTERVAL '11 months',
    'AUTO',
    30,
    true, -- Otomatik yenilenecek
    'MONTHLY',
    1, -- Her ayın 1'inde faturalandırma
    15,
    10000.00,
    'TRY',
    18.00,
    11800.00,
    'ACTIVE',
    test_company_id
  )
  RETURNING id INTO contract2_id;
  
  RAISE NOTICE '✅ Contract 2 oluşturuldu: % (Yakında dolacak - 25 gün)', contract2_id;
  
  -- ============================================
  -- TEST CONTRACT 3: Taslak Proje Sözleşmesi
  -- ============================================
  INSERT INTO "Contract" (
    "contractNumber",
    title,
    description,
    "customerId",
    "dealId",
    type,
    category,
    "startDate",
    "endDate",
    "renewalType",
    "billingCycle",
    "paymentTerms",
    value,
    currency,
    "taxRate",
    "totalValue",
    status,
    notes,
    "companyId"
  )
  VALUES (
    'SOZL-2024-0003',
    'Mobil Uygulama Geliştirme Projesi',
    'iOS ve Android için e-ticaret uygulaması',
    test_customer_id,
    test_deal_id,
    'SERVICE',
    'Yazılım Geliştirme',
    CURRENT_DATE + INTERVAL '1 month',
    CURRENT_DATE + INTERVAL '7 months',
    'NONE',
    'ONE_TIME',
    30,
    150000.00,
    'TRY',
    18.00,
    177000.00,
    'DRAFT',
    'Müşteri onayı bekleniyor',
    test_company_id
  )
  RETURNING id INTO contract3_id;
  
  RAISE NOTICE '✅ Contract 3 oluşturuldu: % (DRAFT)', contract3_id;
  
  -- Contract 3 için milestone'lar ekle
  INSERT INTO "ContractMilestone" (
    "contractId",
    title,
    description,
    "dueDate",
    value,
    "paymentDue",
    status,
    "progressPercent",
    "companyId"
  )
  VALUES
    (
      contract3_id,
      'Analiz ve Tasarım',
      'UI/UX tasarımı ve teknik analiz',
      CURRENT_DATE + INTERVAL '2 months',
      30000.00,
      30000.00,
      'PENDING',
      0,
      test_company_id
    ),
    (
      contract3_id,
      'Frontend Geliştirme',
      'React Native ile mobil uygulama geliştirme',
      CURRENT_DATE + INTERVAL '4 months',
      60000.00,
      60000.00,
      'PENDING',
      0,
      test_company_id
    ),
    (
      contract3_id,
      'Backend API',
      'REST API ve veritabanı',
      CURRENT_DATE + INTERVAL '5 months',
      40000.00,
      40000.00,
      'PENDING',
      0,
      test_company_id
    ),
    (
      contract3_id,
      'Test ve Yayın',
      'QA, store yayını',
      CURRENT_DATE + INTERVAL '7 months',
      20000.00,
      20000.00,
      'PENDING',
      0,
      test_company_id
    );
  
  RAISE NOTICE '  ↳ 4 milestone eklendi';
  
  -- ============================================
  -- TEST CONTRACT 4: Süresi Dolmuş Sözleşme
  -- ============================================
  INSERT INTO "Contract" (
    "contractNumber",
    title,
    description,
    "customerId",
    type,
    "startDate",
    "endDate",
    "signedDate",
    "renewalType",
    value,
    currency,
    "taxRate",
    "totalValue",
    status,
    "companyId"
  )
  VALUES (
    'SOZL-2023-0099',
    '2023 Yılı Danışmanlık Sözleşmesi',
    'İş süreçleri optimizasyonu',
    test_customer_id,
    'CONSULTING',
    CURRENT_DATE - INTERVAL '18 months',
    CURRENT_DATE - INTERVAL '6 months',
    CURRENT_DATE - INTERVAL '18 months',
    'MANUAL',
    75000.00,
    'TRY',
    18.00,
    88500.00,
    'EXPIRED',
    test_company_id
  )
  RETURNING id INTO contract4_id;
  
  RAISE NOTICE '✅ Contract 4 oluşturuldu: % (EXPIRED)', contract4_id;
  
  -- ============================================
  -- TEST CONTRACT 5: 7 Gün İçinde Otomatik Yenilenecek
  -- ============================================
  INSERT INTO "Contract" (
    "contractNumber",
    title,
    description,
    "customerId",
    type,
    "startDate",
    "endDate",
    "signedDate",
    "renewalType",
    "renewalNoticeDays",
    "autoRenewEnabled",
    "billingCycle",
    value,
    currency,
    "taxRate",
    "totalValue",
    status,
    notes,
    "companyId"
  )
  VALUES (
    'SOZL-2024-0004',
    'Lisans Sözleşmesi - Enterprise',
    '100 kullanıcı için yıllık lisans',
    test_customer_id,
    'LICENSE',
    CURRENT_DATE - INTERVAL '358 days',
    CURRENT_DATE + INTERVAL '5 days', -- 5 gün sonra otomatik yenilenecek
    CURRENT_DATE - INTERVAL '358 days',
    'AUTO',
    30,
    true,
    'YEARLY',
    25000.00,
    'USD',
    18.00,
    29500.00,
    'ACTIVE',
    'Otomatik yenileme testi için',
    test_company_id
  )
  RETURNING id INTO contract5_id;
  
  RAISE NOTICE '✅ Contract 5 oluşturuldu: % (Auto-renew 5 gün içinde)', contract5_id;
  
  -- ============================================
  -- ÖZET
  -- ============================================
  RAISE NOTICE '============================================';
  RAISE NOTICE 'TEST VERİLERİ BAŞARIYLA OLUŞTURULDU! 🎉';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Toplam 5 sözleşme:';
  RAISE NOTICE '  1. SOZL-2024-0001 → ACTIVE (Yıllık bakım)';
  RAISE NOTICE '  2. SOZL-2024-0002 → ACTIVE (25 gün kala bildirim gelmeli)';
  RAISE NOTICE '  3. SOZL-2024-0003 → DRAFT (4 milestone ile)';
  RAISE NOTICE '  4. SOZL-2023-0099 → EXPIRED';
  RAISE NOTICE '  5. SOZL-2024-0004 → ACTIVE (5 gün kala auto-renew)';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'TEST KOMUTLARI:';
  RAISE NOTICE '';
  RAISE NOTICE '-- Sözleşmeleri görmek için:';
  RAISE NOTICE 'SELECT "contractNumber", title, status, "endDate" FROM "Contract" ORDER BY "createdAt" DESC;';
  RAISE NOTICE '';
  RAISE NOTICE '-- Yenileme bildirimlerini test et:';
  RAISE NOTICE 'SELECT create_renewal_notifications();';
  RAISE NOTICE '';
  RAISE NOTICE '-- Otomatik yenilemeyi test et:';
  RAISE NOTICE 'SELECT auto_renew_contracts();';
  RAISE NOTICE '';
  RAISE NOTICE '-- Customer stats kontrol et:';
  RAISE NOTICE 'SELECT name, "activeContractsCount", "totalContractValue" FROM "Customer" LIMIT 5;';
  RAISE NOTICE '';
  RAISE NOTICE '-- MRR/ARR hesapla:';
  RAISE NOTICE 'SELECT calculate_mrr() as "MRR", calculate_arr() as "ARR";';
  RAISE NOTICE '============================================';
  
END $$;

-- ============================================
-- HEMEN TEST ET!
-- ============================================

-- 1. Sözleşmeleri görüntüle
SELECT 
  "contractNumber",
  title,
  type,
  status,
  value,
  "startDate",
  "endDate",
  "autoRenewEnabled"
FROM "Contract"
ORDER BY "createdAt" DESC
LIMIT 10;

-- 2. Customer stats güncellenmiş mi?
SELECT 
  name,
  "activeContractsCount",
  "totalContractValue",
  "lastContractDate"
FROM "Customer"
WHERE "activeContractsCount" > 0
LIMIT 5;

-- 3. Milestone'ları kontrol et
SELECT 
  c."contractNumber",
  m.title as "milestoneName",
  m."dueDate",
  m.value,
  m.status
FROM "ContractMilestone" m
JOIN "Contract" c ON c.id = m."contractId"
ORDER BY m."dueDate";



