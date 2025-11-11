-- ============================================
-- CRM V3 - ADVANCED MODULES SEED DATA
-- Amaç: Yeni modüller için test verisi
-- ============================================

-- Not: Bu script'i çalıştırmadan önce:
-- 1. Mevcut bir User ID'si alın: SELECT id FROM "User" LIMIT 1;
-- 2. Mevcut bir Company ID'si alın: SELECT id FROM "Company" LIMIT 1;
-- 3. Aşağıdaki değişkenleri güncelleyin

-- DEĞIŞKENLER (Kendi ID'lerinizi buraya yazın!)
DO $$
DECLARE
  v_company_id UUID;
  v_user_id UUID;
  v_customer_id UUID;
  v_deal_id UUID;
  v_quote_id UUID;
  v_invoice_id UUID;
  
  -- Yeni oluşturulacak ID'ler
  v_doc_id UUID;
  v_approval_id UUID;
  v_campaign_id UUID;
  v_segment_id UUID;
  v_competitor_id UUID;
BEGIN
  -- Mevcut Company ve User'ı al
  SELECT id INTO v_company_id FROM "Company" LIMIT 1;
  SELECT id INTO v_user_id FROM "User" WHERE "companyId" = v_company_id LIMIT 1;
  SELECT id INTO v_customer_id FROM "Customer" WHERE "companyId" = v_company_id LIMIT 1;
  SELECT id INTO v_deal_id FROM "Deal" WHERE "companyId" = v_company_id LIMIT 1;
  SELECT id INTO v_quote_id FROM "Quote" WHERE "companyId" = v_company_id LIMIT 1;
  SELECT id INTO v_invoice_id FROM "Invoice" WHERE "companyId" = v_company_id LIMIT 1;

  IF v_company_id IS NULL OR v_user_id IS NULL THEN
    RAISE EXCEPTION 'Company veya User bulunamadı! Önce login olun.';
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Company ID: %', v_company_id;
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE '========================================';

  -- ============================================
  -- 1. MÜŞTERİ SEGMENTLERİ
  -- ============================================
  
  RAISE NOTICE '1. Müşteri Segmentleri oluşturuluyor...';
  
  -- VIP Müşteriler
  INSERT INTO "CustomerSegment" (name, description, criteria, "autoAssign", color, "companyId", "memberCount")
  VALUES 
    ('VIP Müşteriler', 'Yüksek cirolu premium müşteriler', '{"totalRevenue":{"gte":100000}}', true, '#FFD700', v_company_id, 0),
    ('Yeni Müşteriler', 'Son 3 ay içinde kayıt olan müşteriler', '{"createdAt":{"gte":"2024-01-01"}}', true, '#4CAF50', v_company_id, 0),
    ('Riskli Müşteriler', 'Churn riski yüksek müşteriler', '{"churnRisk":"HIGH"}', true, '#F44336', v_company_id, 0),
    ('Orta Segment', 'Orta gelir grubu müşteriler', '{"totalRevenue":{"gte":10000,"lte":100000}}', false, '#2196F3', v_company_id, 0),
    ('Potansiyel Büyüme', 'Büyüme potansiyeli yüksek', '{}', false, '#9C27B0', v_company_id, 0)
  RETURNING id INTO v_segment_id;

  -- Müşterileri segmentlere ekle (eğer customer varsa)
  IF v_customer_id IS NOT NULL THEN
    INSERT INTO "SegmentMember" ("segmentId", "customerId", "companyId")
    SELECT id, v_customer_id, v_company_id 
    FROM "CustomerSegment" 
    WHERE "companyId" = v_company_id
    LIMIT 3;
  END IF;

  -- ============================================
  -- 2. RAKİP ANALİZİ
  -- ============================================
  
  RAISE NOTICE '2. Rakip analizi oluşturuluyor...';
  
  INSERT INTO "Competitor" (name, website, description, strengths, weaknesses, "marketShare", "pricingStrategy", "companyId")
  VALUES 
    ('TechCorp Solutions', 'https://techcorp.com', 'Teknoloji odaklı rekabet', 
     'Güçlü Ar-Ge ekibi, Hızlı teslimat, 7/24 destek', 
     'Yüksek fiyat, Sınırlı yerel ofis', 
     25.5, 'Premium fiyatlandırma stratejisi', v_company_id),
    
    ('Global Dynamics', 'https://globaldynamics.com', 'Uluslararası oyuncu', 
     'Geniş ürün portföyü, Düşük fiyat, Global network', 
     'Yavaş müşteri hizmetleri, Kalite sorunları', 
     18.3, 'Düşük fiyat stratejisi', v_company_id),
    
    ('LocalPro Ltd', 'https://localpro.com.tr', 'Yerel güçlü rakip', 
     'Yerel pazar bilgisi, Hızlı destek, Özelleştirme', 
     'Küçük ekip, Sınırlı kaynak', 
     12.7, 'Orta segment fiyatlandırma', v_company_id),
    
    ('Innovation Inc', NULL, 'Yenilikçi startup', 
     'Yenilikçi çözümler, Esnek yapı, Hızlı karar alma', 
     'Deneyimsizlik, Finansal istikrarsızlık', 
     8.2, 'Agresif fiyatlandırma', v_company_id),
    
    ('Enterprise Systems', 'https://enterprisesys.com', 'Kurumsal çözüm sağlayıcı', 
     'Kurumsal deneyim, Büyük referanslar, Kapsamlı destek', 
     'Yavaş adaptasyon, Pahalı', 
     15.9, 'Value-based pricing', v_company_id)
  RETURNING id INTO v_competitor_id;

  -- ============================================
  -- 3. DÖKÜMANLAR
  -- ============================================
  
  RAISE NOTICE '3. Dökümanlar oluşturuluyor...';
  
  INSERT INTO "Document" (title, description, "fileUrl", "fileName", "fileSize", "fileType", "relatedTo", "relatedId", folder, tags, "uploadedBy", "companyId")
  VALUES 
    ('Şirket Sunumu 2024', 'Q1 şirket performans sunumu', 
     'https://example.com/files/sunum-2024.pdf', 'sunum-2024.pdf', 2457600, 'application/pdf', 
     NULL, NULL, 'Presentations', ARRAY['sunum', '2024', 'q1'], v_user_id, v_company_id),
    
    ('Fiyat Listesi', 'Güncel ürün fiyat listesi', 
     'https://example.com/files/fiyat-listesi.xlsx', 'fiyat-listesi.xlsx', 524288, 'application/vnd.ms-excel', 
     'Product', NULL, 'Pricing', ARRAY['fiyat', 'ürün'], v_user_id, v_company_id),
    
    ('Sözleşme Şablonu', 'Standart müşteri sözleşme şablonu', 
     'https://example.com/files/sozlesme-sablonu.docx', 'sozlesme-sablonu.docx', 102400, 'application/msword', 
     NULL, NULL, 'Contracts', ARRAY['şablon', 'sözleşme', 'legal'], v_user_id, v_company_id),
    
    ('Ürün Kataloğu', '2024 ürün kataloğu ve teknik dökümanlar', 
     'https://example.com/files/katalog-2024.pdf', 'katalog-2024.pdf', 5242880, 'application/pdf', 
     NULL, NULL, 'Proposals', ARRAY['katalog', 'ürün'], v_user_id, v_company_id);
  
  -- Quote'a bağlı döküman (eğer quote varsa)
  IF v_quote_id IS NOT NULL THEN
    INSERT INTO "Document" (title, description, "fileUrl", "fileName", "fileSize", "fileType", "relatedTo", "relatedId", folder, "uploadedBy", "companyId")
    VALUES 
      ('Teklif Eki', 'Teknik şartname ve referanslar', 
       'https://example.com/files/teklif-ek.pdf', 'teklif-ek.pdf', 1048576, 'application/pdf', 
       'Quote', v_quote_id, 'Proposals', v_user_id, v_company_id);
  END IF;

  -- ============================================
  -- 4. ONAY TALEPLERİ
  -- ============================================
  
  RAISE NOTICE '4. Onay talepleri oluşturuluyor...';
  
  -- Quote için onay talebi (eğer quote varsa)
  IF v_quote_id IS NOT NULL THEN
    INSERT INTO "ApprovalRequest" (title, description, "relatedTo", "relatedId", "requestedBy", "approverIds", status, priority, "companyId")
    VALUES 
      ('Yüksek Değerli Teklif Onayı', '250.000 TL tutarındaki teklif yönetici onayı bekliyor', 
       'Quote', v_quote_id::TEXT, v_user_id, ARRAY[v_user_id], 'PENDING', 'HIGH', v_company_id);
  END IF;

  -- Deal için onay talebi (eğer deal varsa)
  IF v_deal_id IS NOT NULL THEN
    INSERT INTO "ApprovalRequest" (title, description, "relatedTo", "relatedId", "requestedBy", "approverIds", status, priority, "approvedBy", "approvedAt", "companyId")
    VALUES 
      ('Özel İndirim Onayı', '%15 özel indirim yetkisi talep ediliyor', 
       'Deal', v_deal_id::TEXT, v_user_id, ARRAY[v_user_id], 'APPROVED', 'NORMAL', v_user_id, NOW(), v_company_id),
      
      ('Ödeme Planı Onayı', '12 ay vade talebi', 
       'Deal', v_deal_id::TEXT, v_user_id, ARRAY[v_user_id], 'REJECTED', 'LOW', NULL, NULL, v_company_id);
  END IF;

  -- Genel onay talebi
  INSERT INTO "ApprovalRequest" (title, description, "relatedTo", "relatedId", "requestedBy", "approverIds", status, priority, "companyId")
  VALUES 
    ('Bütçe Artırımı', 'Q2 pazarlama bütçesi %20 artırım talebi', 
     'Other', gen_random_uuid()::TEXT, v_user_id, ARRAY[v_user_id], 'PENDING', 'URGENT', v_company_id);

  -- ============================================
  -- 5. EMAIL KAMPANYALARI
  -- ============================================
  
  RAISE NOTICE '5. Email kampanyaları oluşturuluyor...';
  
  INSERT INTO "EmailCampaign" (name, subject, body, status, "targetSegment", "scheduledAt", "sentAt", "totalRecipients", "totalSent", "totalOpened", "totalClicked", "totalBounced", "createdBy", "companyId")
  VALUES 
    ('Yaz Kampanyası 2024', '☀️ Yaz İndirimleri Başladı!', 
     '<h1>Yaz Fırsatları</h1><p>Tüm ürünlerde %30''a varan indirimler...</p>', 
     'SENT', 'VIP Müşteriler', NULL, NOW() - INTERVAL '5 days', 1250, 1250, 456, 89, 12, v_user_id, v_company_id),
    
    ('Ürün Lansmanı', '🚀 Yeni Ürün Tanıtımı', 
     '<h1>Yeni Ürünümüz</h1><p>Sektörde ilk kez...</p>', 
     'SENT', 'Tüm Müşteriler', NULL, NOW() - INTERVAL '12 days', 3420, 3420, 1205, 234, 45, v_user_id, v_company_id),
    
    ('Müşteri Memnuniyeti Anketi', 'Görüşünüz Bizim İçin Değerli', 
     '<p>Merhaba,<br>Hizmet kalitemizi değerlendirmenizi rica ederiz...</p>', 
     'SCHEDULED', 'Orta Segment', NOW() + INTERVAL '3 days', NULL, 0, 0, 0, 0, 0, v_user_id, v_company_id),
    
    ('Black Friday Özel', '⚡ Black Friday: %50 İndirim!', 
     '<h1>Muhteşem Fırsatlar</h1><p>Sadece 24 saat...</p>', 
     'DRAFT', NULL, NULL, NULL, 0, 0, 0, 0, 0, v_user_id, v_company_id),
    
    ('Yıl Sonu Teşekkür', 'Teşekkür Ederiz 🎉', 
     '<p>2024 yılında bizimle olduğunuz için...</p>', 
     'FAILED', 'VIP Müşteriler', NOW() - INTERVAL '2 days', NULL, 0, 0, 0, 0, 0, v_user_id, v_company_id);

  -- Email log kayıtları (ilk 2 kampanya için)
  INSERT INTO "EmailLog" ("campaignId", "recipientEmail", "recipientName", status, "sentAt", "openedAt", "clickedAt", "companyId")
  SELECT 
    c.id,
    'musteri' || g.n || '@example.com',
    'Müşteri ' || g.n,
    CASE 
      WHEN g.n % 3 = 0 THEN 'CLICKED'
      WHEN g.n % 2 = 0 THEN 'OPENED'
      ELSE 'SENT'
    END,
    NOW() - INTERVAL '5 days',
    CASE WHEN g.n % 2 = 0 THEN NOW() - INTERVAL '4 days' ELSE NULL END,
    CASE WHEN g.n % 3 = 0 THEN NOW() - INTERVAL '3 days' ELSE NULL END,
    v_company_id
  FROM "EmailCampaign" c, generate_series(1, 20) g(n)
  WHERE c.status = 'SENT' AND c."companyId" = v_company_id
  LIMIT 40;

  -- ============================================
  -- BAŞARI MESAJI
  -- ============================================
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ TEST VERİLERİ BAŞARIYLA EKLENDİ!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 Oluşturulan:';
  RAISE NOTICE '  - 5 Müşteri Segmenti';
  RAISE NOTICE '  - 5 Rakip Kaydı';
  RAISE NOTICE '  - 5 Döküman';
  RAISE NOTICE '  - 4 Onay Talebi';
  RAISE NOTICE '  - 5 Email Kampanyası';
  RAISE NOTICE '  - 40 Email Log Kaydı';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🚀 Şimdi sayfaları test edebilirsiniz!';
  RAISE NOTICE '========================================';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ HATA: %', SQLERRM;
    RAISE EXCEPTION 'Seed data eklenirken hata oluştu!';
END $$;


