-- CRM V3 - Raporlar Modülü için Kapsamlı Seed Data
-- Tüm modüller için gerçekçi veri (farklı tarihler, durumlar, sektörler, şehirler)
-- Bu seed data tüm raporların veri çekebilmesi için gerekli

-- ============================================
-- 1. COMPANY (Şirketleri oluştur - yoksa ekle)
-- ============================================
-- Company'ler yoksa oluştur (seed_superadmin.sql'de de var ama burada da kontrol ediyoruz)
INSERT INTO "Company" (id, name, sector, city, status) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Tipplus Medikal', 'Sağlık', 'Ankara', 'ACTIVE'),
  ('00000000-0000-0000-0000-000000000002', 'Global Un', 'Gıda', 'Konya', 'ACTIVE'),
  ('00000000-0000-0000-0000-000000000003', 'ZahirTech', 'Yazılım', 'İstanbul', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. USER (monthlyGoal ile kullanıcılar)
-- ============================================
-- Mevcut kullanıcıları güncelle (monthlyGoal ekle)
UPDATE "User" 
SET "monthlyGoal" = CASE 
  WHEN role = 'ADMIN' THEN 500000.00
  WHEN role = 'SALES' THEN 300000.00
  ELSE 100000.00
END
WHERE "monthlyGoal" IS NULL OR "monthlyGoal" = 0;

-- Ek kullanıcılar ekle (performans raporları için)
-- Email unique constraint olduğu için ON CONFLICT (email) kullanıyoruz
INSERT INTO "User" (id, name, email, password, role, "companyId", "monthlyGoal", "createdAt") VALUES
  ('20000000-0000-0000-0000-000000000001', 'Ahmet Yılmaz', 'ahmet@tipplusmedikal.com', '$2a$10$rOzJqJqJqJqJqJqJqJqJqOeJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq', 'SALES', '00000000-0000-0000-0000-000000000001', 250000.00, NOW() - INTERVAL '6 months'),
  ('20000000-0000-0000-0000-000000000002', 'Ayşe Demir', 'ayse@tipplusmedikal.com', '$2a$10$rOzJqJqJqJqJqJqJqJqJqOeJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq', 'SALES', '00000000-0000-0000-0000-000000000001', 350000.00, NOW() - INTERVAL '4 months'),
  ('20000000-0000-0000-0000-000000000003', 'Mehmet Kaya', 'mehmet@tipplusmedikal.com', '$2a$10$rOzJqJqJqJqJqJqJqJqJqOeJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq', 'SALES', '00000000-0000-0000-0000-000000000001', 200000.00, NOW() - INTERVAL '8 months')
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- 3. CUSTOMER (Sektör bazlı müşteriler)
-- ============================================
INSERT INTO "Customer" (id, name, email, phone, city, sector, status, "companyId", "createdAt") VALUES
  -- Sağlık Sektörü
  ('30000000-0000-0000-0000-000000000001', 'Ankara Hastanesi', 'info@ankarahastanesi.com', '+90 312 123 4567', 'Ankara', 'Sağlık', 'ACTIVE', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '12 months'),
  ('30000000-0000-0000-0000-000000000002', 'İstanbul Tıp Merkezi', 'info@istanbultip.com', '+90 212 234 5678', 'İstanbul', 'Sağlık', 'ACTIVE', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '10 months'),
  ('30000000-0000-0000-0000-000000000003', 'Bursa Sağlık Grubu', 'info@bursasaglik.com', '+90 224 345 6789', 'Bursa', 'Sağlık', 'ACTIVE', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '8 months'),
  ('30000000-0000-0000-0000-000000000004', 'Antalya Medikal', 'info@antalyamedikal.com', '+90 242 456 7890', 'Antalya', 'Sağlık', 'ACTIVE', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '6 months'),
  ('30000000-0000-0000-0000-000000000005', 'İzmir Hastanesi', 'info@izmirhastanesi.com', '+90 232 567 8901', 'İzmir', 'Sağlık', 'ACTIVE', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '4 months'),
  
  -- Gıda Sektörü
  ('30000000-0000-0000-0000-000000000006', 'Eti Gıda', 'info@etigida.com', '+90 312 678 9012', 'Ankara', 'Gıda', 'ACTIVE', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '11 months'),
  ('30000000-0000-0000-0000-000000000007', 'Ülker Gıda', 'info@ulkergida.com', '+90 212 789 0123', 'İstanbul', 'Gıda', 'ACTIVE', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '9 months'),
  ('30000000-0000-0000-0000-000000000008', 'Pınar Gıda', 'info@pinargida.com', '+90 232 890 1234', 'İzmir', 'Gıda', 'ACTIVE', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '7 months'),
  ('30000000-0000-0000-0000-000000000009', 'Sütaş Gıda', 'info@sutasgida.com', '+90 224 901 2345', 'Bursa', 'Gıda', 'ACTIVE', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '5 months'),
  ('30000000-0000-0000-0000-000000000010', 'Yıldız Holding', 'info@yildizholding.com', '+90 212 012 3456', 'İstanbul', 'Gıda', 'ACTIVE', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '3 months'),
  
  -- Teknoloji Sektörü
  ('30000000-0000-0000-0000-000000000011', 'Turkcell Teknoloji', 'info@turkcelltech.com', '+90 212 123 4567', 'İstanbul', 'Teknoloji', 'ACTIVE', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '10 months'),
  ('30000000-0000-0000-0000-000000000012', 'Vodafone Teknoloji', 'info@vodafonetech.com', '+90 212 234 5678', 'İstanbul', 'Teknoloji', 'ACTIVE', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '8 months'),
  ('30000000-0000-0000-0000-000000000013', 'Microsoft Türkiye', 'info@microsofttr.com', '+90 212 345 6789', 'İstanbul', 'Teknoloji', 'ACTIVE', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '6 months'),
  ('30000000-0000-0000-0000-000000000014', 'Oracle Türkiye', 'info@oracletr.com', '+90 212 456 7890', 'İstanbul', 'Teknoloji', 'ACTIVE', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '4 months'),
  ('30000000-0000-0000-0000-000000000015', 'IBM Türkiye', 'info@ibmtr.com', '+90 212 567 8901', 'İstanbul', 'Teknoloji', 'ACTIVE', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '2 months'),
  
  -- Eğitim Sektörü
  ('30000000-0000-0000-0000-000000000016', 'ODTÜ', 'info@metu.edu.tr', '+90 312 210 2000', 'Ankara', 'Eğitim', 'ACTIVE', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '9 months'),
  ('30000000-0000-0000-0000-000000000017', 'Boğaziçi Üniversitesi', 'info@boun.edu.tr', '+90 212 359 5400', 'İstanbul', 'Eğitim', 'ACTIVE', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '7 months'),
  ('30000000-0000-0000-0000-000000000018', 'İTÜ', 'info@itu.edu.tr', '+90 212 285 3000', 'İstanbul', 'Eğitim', 'ACTIVE', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '5 months'),
  ('30000000-0000-0000-0000-000000000019', 'Hacettepe Üniversitesi', 'info@hacettepe.edu.tr', '+90 312 305 3000', 'Ankara', 'Eğitim', 'ACTIVE', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '3 months'),
  ('30000000-0000-0000-0000-000000000020', 'Koç Üniversitesi', 'info@ku.edu.tr', '+90 212 338 1000', 'İstanbul', 'Eğitim', 'ACTIVE', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '1 months')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 4. PRODUCT (Ürünler)
-- ============================================
INSERT INTO "Product" (id, name, price, stock, description, category, "companyId", "createdAt") VALUES
  ('40000000-0000-0000-0000-000000000001', 'Tıbbi Cihaz A', 15000.00, 50, 'Yüksek kaliteli tıbbi cihaz', 'Tıbbi Cihaz', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '12 months'),
  ('40000000-0000-0000-0000-000000000002', 'Tıbbi Cihaz B', 25000.00, 30, 'Profesyonel tıbbi cihaz', 'Tıbbi Cihaz', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '10 months'),
  ('40000000-0000-0000-0000-000000000003', 'Tıbbi Cihaz C', 35000.00, 20, 'Premium tıbbi cihaz', 'Tıbbi Cihaz', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '8 months'),
  ('40000000-0000-0000-0000-000000000004', 'Tıbbi Malzeme X', 500.00, 200, 'Tek kullanımlık tıbbi malzeme', 'Tıbbi Malzeme', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '6 months'),
  ('40000000-0000-0000-0000-000000000005', 'Tıbbi Malzeme Y', 750.00, 150, 'Yüksek kaliteli tıbbi malzeme', 'Tıbbi Malzeme', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '4 months'),
  ('40000000-0000-0000-0000-000000000006', 'Tıbbi Malzeme Z', 1000.00, 100, 'Premium tıbbi malzeme', 'Tıbbi Malzeme', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '2 months')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 5. DEAL (Fırsatlar - Farklı tarihler ve durumlar)
-- ============================================
-- Son 12 ay için farklı durumlarda deal'lar oluştur
DO $$
DECLARE
  customer_ids UUID[];
  user_ids UUID[];
  stages TEXT[] := ARRAY['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];
  statuses TEXT[] := ARRAY['OPEN', 'WON', 'LOST'];
  i INTEGER;
  deal_date TIMESTAMP WITH TIME ZONE;
  deal_stage TEXT;
  deal_status TEXT;
  deal_value DECIMAL(15, 2);
  customer_id UUID;
  user_id UUID;
BEGIN
  -- Customer ID'lerini dinamik olarak al
  SELECT ARRAY_AGG(id) INTO customer_ids
  FROM "Customer"
  WHERE "companyId" = '00000000-0000-0000-0000-000000000001'
  LIMIT 20;
  
  -- User ID'lerini dinamik olarak al
  SELECT ARRAY_AGG(id) INTO user_ids
  FROM "User"
  WHERE "companyId" = '00000000-0000-0000-0000-000000000001'
  LIMIT 10;
  
  -- Eğer customer veya user yoksa çık
  IF customer_ids IS NULL OR array_length(customer_ids, 1) = 0 OR
     user_ids IS NULL OR array_length(user_ids, 1) = 0 THEN
    RAISE NOTICE 'Customer veya User bulunamadı, Deal oluşturulamıyor';
    RETURN;
  END IF;
  FOR i IN 1..120 LOOP
    -- Son 12 ay içinde rastgele tarih
    deal_date := NOW() - (RANDOM() * INTERVAL '365 days');
    
    -- Rastgele stage ve status
    deal_stage := stages[1 + floor(random() * array_length(stages, 1))::int];
    deal_status := statuses[1 + floor(random() * array_length(statuses, 1))::int];
    
    -- Eğer WON ise stage de WON yap
    IF deal_status = 'WON' THEN
      deal_stage := 'WON';
    ELSIF deal_status = 'LOST' THEN
      deal_stage := 'LOST';
    END IF;
    
    -- Rastgele değer (50,000 - 500,000 arası)
    deal_value := 50000 + (RANDOM() * 450000);
    
    -- Rastgele customer ve user
    customer_id := customer_ids[1 + floor(random() * array_length(customer_ids, 1))::int];
    user_id := user_ids[1 + floor(random() * array_length(user_ids, 1))::int];
    
    -- Customer ve User'ın var olduğundan emin ol
    IF customer_id IS NOT NULL AND user_id IS NOT NULL AND
       EXISTS (SELECT 1 FROM "Customer" WHERE id = customer_id AND "companyId" = '00000000-0000-0000-0000-000000000001') AND
       EXISTS (SELECT 1 FROM "User" WHERE id = user_id AND "companyId" = '00000000-0000-0000-0000-000000000001') THEN
      INSERT INTO "Deal" (id, title, stage, value, status, "companyId", "customerId", "assignedTo", "createdAt")
      VALUES (
        gen_random_uuid(),
        'Fırsat - ' || i || ' - ' || deal_date::date,
        deal_stage,
        deal_value,
        deal_status,
        '00000000-0000-0000-0000-000000000001',
        customer_id,
        user_id,
        deal_date
      );
    END IF;
  END LOOP;
END $$;

-- ============================================
-- 6. QUOTE (Teklifler - Deal'lara bağlı)
-- ============================================
-- WON ve OPEN deal'lar için quote oluştur
INSERT INTO "Quote" (id, title, status, total, "dealId", "companyId", "assignedTo", "createdAt")
SELECT 
  gen_random_uuid(),
  'Teklif - ' || d.title,
  CASE 
    WHEN d.status = 'WON' THEN 'ACCEPTED'
    WHEN d.stage IN ('PROPOSAL', 'NEGOTIATION') THEN 'SENT'
    ELSE 'DRAFT'
  END,
  d.value * (0.9 + RANDOM() * 0.2), -- Deal değerinin %90-110'u
  d.id,
  d."companyId",
  d."assignedTo",
  d."createdAt" + INTERVAL '1 day'
FROM "Deal" d
WHERE d.status IN ('WON', 'OPEN') AND d."companyId" = '00000000-0000-0000-0000-000000000001'
LIMIT 80;

-- ============================================
-- 7. INVOICE (Faturalar - Quote'lara bağlı, PAID status)
-- ============================================
-- ACCEPTED quote'lar için invoice oluştur
INSERT INTO "Invoice" (id, title, status, total, "quoteId", "companyId", "assignedTo", "createdAt", "paymentDate")
SELECT 
  gen_random_uuid(),
  'Fatura - ' || q.title,
  CASE 
    WHEN q."createdAt" < NOW() - INTERVAL '30 days' THEN 'PAID'
    WHEN q."createdAt" < NOW() - INTERVAL '15 days' THEN 'SENT'
    ELSE 'DRAFT'
  END,
  q.total,
  q.id,
  q."companyId",
  q."assignedTo",
  q."createdAt" + INTERVAL '2 days',
  CASE 
    WHEN q."createdAt" < NOW() - INTERVAL '30 days' THEN q."createdAt" + INTERVAL '15 days'
    ELSE NULL
  END
FROM "Quote" q
WHERE q.status = 'ACCEPTED' AND q."companyId" = '00000000-0000-0000-0000-000000000001'
LIMIT 50;

-- Ek PAID invoice'lar ekle (farklı tarihler için)
DO $$
DECLARE
  quote_ids UUID[];
  i INTEGER;
  invoice_date TIMESTAMP WITH TIME ZONE;
  payment_date TIMESTAMP WITH TIME ZONE;
  invoice_value DECIMAL(15, 2);
  user_ids UUID[];
  user_id UUID;
BEGIN
  -- User ID'lerini dinamik olarak al
  SELECT ARRAY_AGG(id) INTO user_ids
  FROM "User"
  WHERE "companyId" = '00000000-0000-0000-0000-000000000001'
  LIMIT 10;
  
  -- Eğer user yoksa çık
  IF user_ids IS NULL OR array_length(user_ids, 1) = 0 THEN
    RAISE NOTICE 'User bulunamadı, Invoice oluşturulamıyor';
    RETURN;
  END IF;
  -- Son 12 ay için PAID invoice'lar
  FOR i IN 1..100 LOOP
    invoice_date := NOW() - (RANDOM() * INTERVAL '365 days');
    payment_date := invoice_date + INTERVAL '10 days' + (RANDOM() * INTERVAL '20 days');
    invoice_value := 10000 + (RANDOM() * 490000);
    user_id := user_ids[1 + floor(random() * array_length(user_ids, 1))::int];
    
    -- User'ın var olduğundan emin ol
    IF user_id IS NOT NULL AND EXISTS (SELECT 1 FROM "User" WHERE id = user_id AND "companyId" = '00000000-0000-0000-0000-000000000001') THEN
      INSERT INTO "Invoice" (id, title, status, total, "companyId", "assignedTo", "createdAt", "paymentDate")
      VALUES (
        gen_random_uuid(),
        'Fatura - ' || i || ' - ' || invoice_date::date,
        'PAID',
        invoice_value,
        '00000000-0000-0000-0000-000000000001',
        user_id,
        invoice_date,
        payment_date
      );
    END IF;
  END LOOP;
END $$;

-- ============================================
-- 8. FINANCE (Finans kayıtları - Invoice'lara bağlı)
-- ============================================
-- PAID invoice'lar için finance kaydı oluştur
INSERT INTO "Finance" (id, type, amount, "relatedTo", "companyId", "createdAt")
SELECT 
  gen_random_uuid(),
  'INCOME',
  i.total,
  'Invoice',
  i."companyId",
  i."paymentDate"
FROM "Invoice" i
WHERE i.status = 'PAID' AND i."paymentDate" IS NOT NULL AND i."companyId" = '00000000-0000-0000-0000-000000000001'
LIMIT 150;

-- ============================================
-- 9. TASK (Görevler)
-- ============================================
DO $$
DECLARE
  user_ids UUID[];
  statuses TEXT[] := ARRAY['TODO', 'IN_PROGRESS', 'DONE'];
  priorities TEXT[] := ARRAY['LOW', 'MEDIUM', 'HIGH'];
  i INTEGER;
  task_date TIMESTAMP WITH TIME ZONE;
  task_status TEXT;
  task_priority TEXT;
  user_id UUID;
BEGIN
  -- User ID'lerini dinamik olarak al
  SELECT ARRAY_AGG(id) INTO user_ids
  FROM "User"
  WHERE "companyId" = '00000000-0000-0000-0000-000000000001'
  LIMIT 10;
  
  -- Eğer user yoksa çık
  IF user_ids IS NULL OR array_length(user_ids, 1) = 0 THEN
    RAISE NOTICE 'User bulunamadı, Task oluşturulamıyor';
    RETURN;
  END IF;
  FOR i IN 1..80 LOOP
    task_date := NOW() - (RANDOM() * INTERVAL '180 days');
    task_status := statuses[1 + floor(random() * array_length(statuses, 1))::int];
    task_priority := priorities[1 + floor(random() * array_length(priorities, 1))::int];
    user_id := user_ids[1 + floor(random() * array_length(user_ids, 1))::int];
    
    -- User'ın var olduğundan emin ol
    IF user_id IS NOT NULL AND EXISTS (SELECT 1 FROM "User" WHERE id = user_id AND "companyId" = '00000000-0000-0000-0000-000000000001') THEN
      INSERT INTO "Task" (id, title, status, priority, "assignedTo", "companyId", "createdAt")
      VALUES (
        gen_random_uuid(),
        'Görev - ' || i || ' - ' || task_date::date,
        task_status,
        task_priority,
        user_id,
        '00000000-0000-0000-0000-000000000001',
        task_date
      );
    END IF;
  END LOOP;
END $$;

-- ============================================
-- 10. TICKET (Destek Talepleri)
-- ============================================
DO $$
DECLARE
  customer_ids UUID[];
  statuses TEXT[] := ARRAY['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
  priorities TEXT[] := ARRAY['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
  i INTEGER;
  ticket_date TIMESTAMP WITH TIME ZONE;
  ticket_status TEXT;
  ticket_priority TEXT;
  customer_id UUID;
BEGIN
  -- Customer ID'lerini dinamik olarak al
  SELECT ARRAY_AGG(id) INTO customer_ids
  FROM "Customer"
  WHERE "companyId" = '00000000-0000-0000-0000-000000000001'
  LIMIT 20;
  
  -- Eğer customer yoksa çık
  IF customer_ids IS NULL OR array_length(customer_ids, 1) = 0 THEN
    RAISE NOTICE 'Customer bulunamadı, Ticket oluşturulamıyor';
    RETURN;
  END IF;
  FOR i IN 1..60 LOOP
    ticket_date := NOW() - (RANDOM() * INTERVAL '120 days');
    ticket_status := statuses[1 + floor(random() * array_length(statuses, 1))::int];
    ticket_priority := priorities[1 + floor(random() * array_length(priorities, 1))::int];
    customer_id := customer_ids[1 + floor(random() * array_length(customer_ids, 1))::int];
    
    -- Customer'ın var olduğundan emin ol
    IF customer_id IS NOT NULL AND EXISTS (SELECT 1 FROM "Customer" WHERE id = customer_id AND "companyId" = '00000000-0000-0000-0000-000000000001') THEN
      INSERT INTO "Ticket" (id, subject, status, priority, "customerId", "companyId", "createdAt")
      VALUES (
        gen_random_uuid(),
        'Destek Talebi - ' || i || ' - ' || ticket_date::date,
        ticket_status,
        ticket_priority,
        customer_id,
        '00000000-0000-0000-0000-000000000001',
        ticket_date
      );
    END IF;
  END LOOP;
END $$;

-- ============================================
-- 11. SHIPMENT (Sevkiyatlar - Invoice'lara bağlı)
-- ============================================
-- PAID invoice'lar için shipment oluştur
INSERT INTO "Shipment" (id, tracking, status, "invoiceId", "companyId", "createdAt")
SELECT 
  gen_random_uuid(),
  'TRK' || LPAD(ROW_NUMBER() OVER ()::text, 8, '0'),
  CASE 
    WHEN i."createdAt" < NOW() - INTERVAL '30 days' THEN 'DELIVERED'
    WHEN i."createdAt" < NOW() - INTERVAL '15 days' THEN 'IN_TRANSIT'
    ELSE 'PENDING'
  END,
  i.id,
  i."companyId",
  i."createdAt" + INTERVAL '3 days'
FROM "Invoice" i
WHERE i.status = 'PAID' AND i."companyId" = '00000000-0000-0000-0000-000000000001'
LIMIT 100;

-- ============================================
-- 12. ACTIVITYLOG (İşlem Logları)
-- ============================================
-- Tüm modüller için activity log oluştur
DO $$
DECLARE
  user_ids UUID[];
  entities TEXT[] := ARRAY['Customer', 'Deal', 'Quote', 'Invoice', 'Product', 'Task', 'Ticket'];
  actions TEXT[] := ARRAY['create', 'update', 'delete', 'view'];
  i INTEGER;
  log_date TIMESTAMP WITH TIME ZONE;
  entity TEXT;
  action TEXT;
  user_id UUID;
BEGIN
  -- User ID'lerini dinamik olarak al
  SELECT ARRAY_AGG(id) INTO user_ids
  FROM "User"
  WHERE "companyId" = '00000000-0000-0000-0000-000000000001'
  LIMIT 10;
  
  -- Eğer user yoksa çık
  IF user_ids IS NULL OR array_length(user_ids, 1) = 0 THEN
    RAISE NOTICE 'User bulunamadı, ActivityLog oluşturulamıyor';
    RETURN;
  END IF;
  FOR i IN 1..200 LOOP
    log_date := NOW() - (RANDOM() * INTERVAL '365 days');
    entity := entities[1 + floor(random() * array_length(entities, 1))::int];
    action := actions[1 + floor(random() * array_length(actions, 1))::int];
    user_id := user_ids[1 + floor(random() * array_length(user_ids, 1))::int];
    
    -- User'ın var olduğundan emin ol
    IF user_id IS NOT NULL AND EXISTS (SELECT 1 FROM "User" WHERE id = user_id AND "companyId" = '00000000-0000-0000-0000-000000000001') THEN
      INSERT INTO "ActivityLog" (id, entity, action, description, meta, "userId", "companyId", "createdAt")
      VALUES (
        gen_random_uuid(),
        entity,
        action,
        entity || ' ' || action || ' işlemi gerçekleştirildi',
        jsonb_build_object('entityId', gen_random_uuid()::text, 'timestamp', log_date::text),
        user_id,
        '00000000-0000-0000-0000-000000000001',
        log_date
      );
    END IF;
  END LOOP;
END $$;

-- ============================================
-- SEED DATA TAMAMLANDI
-- ============================================
-- Bu seed data ile tüm raporlar veri çekebilir:
-- - Performance Reports: User performans metrikleri, hedef gerçekleşme
-- - Time-Based Reports: Günlük, haftalık, aylık, yıllık trendler
-- - Sector Reports: Sektör bazlı satış, karlılık, müşteri dağılımı
-- - Sales Reports: Satış trendleri, durum dağılımı
-- - Customer Reports: Müşteri büyüme, sektör dağılımı
-- - Deal Reports: Fırsat aşama dağılımı, değer trendi
-- - Quote Reports: Teklif durum dağılımı, trend analizi
-- - Invoice Reports: Ödeme durumu, aylık trend
-- - Product Reports: En çok satan ürünler, fiyat-performans
-- - Financial Reports: Gelir-gider karşılaştırması

