-- ============================================
-- 112_sales_badges_and_streaks.sql
-- SATIŞ ROZETLERİ VE STREAK SİSTEMİ
-- ============================================
-- Bu dosya şunları yapar:
-- 1. UserBadge tablosu - Kullanıcı rozetleri
-- 2. UserStreak tablosu - Günlük/haftalık/aylık streak takibi
-- 3. Badge otomasyonları - Otomatik rozet kazanma
-- 4. Streak otomasyonları - Otomatik streak güncelleme
-- ============================================

-- ============================================
-- PART 0: TABLO KONTROLLERİ (Eğer yoksa oluştur)
-- ============================================
-- Company ve User tabloları başka migration'larda oluşturulmuş olmalı
-- Eğer yoksa burada oluşturuyoruz (fallback)

-- Company tablosu kontrolü
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Company') THEN
    CREATE TABLE "Company" (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      sector VARCHAR(100),
      city VARCHAR(100),
      status VARCHAR(20) DEFAULT 'ACTIVE',
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_company_status ON "Company"("status");
    ALTER TABLE "Company" ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- User tablosu kontrolü
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'User') THEN
    CREATE TABLE "User" (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255),
      role VARCHAR(20) DEFAULT 'USER',
      "companyId" UUID REFERENCES "Company"(id) ON DELETE CASCADE,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_user_company ON "User"("companyId");
    CREATE INDEX IF NOT EXISTS idx_user_email ON "User"("email");
    ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ============================================
-- PART 1: USER BADGE TABLOSU
-- ============================================
CREATE TABLE IF NOT EXISTS "UserBadge" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "badgeType" VARCHAR(50) NOT NULL,
  "earnedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "metadata" JSONB DEFAULT '{}'::jsonb,
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Aynı rozeti aynı kullanıcıya birden fazla kez verme (opsiyonel - bazı rozetler tekrar kazanılabilir)
  UNIQUE("userId", "badgeType", "companyId")
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_userbadge_user ON "UserBadge"("userId", "companyId");
CREATE INDEX IF NOT EXISTS idx_userbadge_type ON "UserBadge"("badgeType");
CREATE INDEX IF NOT EXISTS idx_userbadge_earned ON "UserBadge"("earnedAt" DESC);

-- RLS Policies
ALTER TABLE "UserBadge" ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi rozetlerini görebilir
CREATE POLICY "Users can view their own badges"
  ON "UserBadge" FOR SELECT
  USING (
    "companyId" = (SELECT "companyId" FROM "User" WHERE id = auth.uid())
    AND (
      "userId" = auth.uid()
      OR EXISTS (
        SELECT 1 FROM "User" 
        WHERE id = auth.uid() 
        AND ("role" = 'ADMIN' OR "role" = 'SUPER_ADMIN')
      )
    )
  );

-- Admin'ler rozet ekleyebilir (otomasyonlar için)
CREATE POLICY "Admins can insert badges"
  ON "UserBadge" FOR INSERT
  WITH CHECK (
    "companyId" = (SELECT "companyId" FROM "User" WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid() 
      AND ("role" = 'ADMIN' OR "role" = 'SUPER_ADMIN')
    )
  );

-- ============================================
-- PART 2: USER STREAK TABLOSU
-- ============================================
CREATE TABLE IF NOT EXISTS "UserStreak" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "dailyStreak" INTEGER DEFAULT 0,
  "weeklyStreak" INTEGER DEFAULT 0,
  "monthlyStreak" INTEGER DEFAULT 0,
  "lastActivityDate" DATE DEFAULT CURRENT_DATE,
  "lastWeeklyActivityDate" DATE,
  "lastMonthlyActivityDate" DATE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Her kullanıcı için tek streak kaydı
  UNIQUE("userId", "companyId")
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_userstreak_user ON "UserStreak"("userId", "companyId");
CREATE INDEX IF NOT EXISTS idx_userstreak_daily ON "UserStreak"("dailyStreak" DESC);
CREATE INDEX IF NOT EXISTS idx_userstreak_weekly ON "UserStreak"("weeklyStreak" DESC);
CREATE INDEX IF NOT EXISTS idx_userstreak_monthly ON "UserStreak"("monthlyStreak" DESC);

-- RLS Policies
ALTER TABLE "UserStreak" ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi streak'lerini görebilir
CREATE POLICY "Users can view their own streaks"
  ON "UserStreak" FOR SELECT
  USING (
    "companyId" = (SELECT "companyId" FROM "User" WHERE id = auth.uid())
    AND (
      "userId" = auth.uid()
      OR EXISTS (
        SELECT 1 FROM "User" 
        WHERE id = auth.uid() 
        AND ("role" = 'ADMIN' OR "role" = 'SUPER_ADMIN')
      )
    )
  );

-- Admin'ler streak güncelleyebilir (otomasyonlar için)
CREATE POLICY "Admins can update streaks"
  ON "UserStreak" FOR UPDATE
  USING (
    "companyId" = (SELECT "companyId" FROM "User" WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid() 
      AND ("role" = 'ADMIN' OR "role" = 'SUPER_ADMIN')
    )
  );

CREATE POLICY "Admins can insert streaks"
  ON "UserStreak" FOR INSERT
  WITH CHECK (
    "companyId" = (SELECT "companyId" FROM "User" WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid() 
      AND ("role" = 'ADMIN' OR "role" = 'SUPER_ADMIN')
    )
  );

-- ============================================
-- PART 3: STREAK GÜNCELLEME FONKSİYONU
-- ============================================
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID, p_company_id UUID)
RETURNS VOID AS $$
DECLARE
  v_current_date DATE := CURRENT_DATE;
  v_last_activity_date DATE;
  v_daily_streak INTEGER;
  v_weekly_streak INTEGER;
  v_monthly_streak INTEGER;
  v_last_weekly_date DATE;
  v_last_monthly_date DATE;
  v_current_week_start DATE;
  v_current_month_start DATE;
BEGIN
  -- Mevcut streak kaydını al veya oluştur
  SELECT 
    "dailyStreak",
    "weeklyStreak",
    "monthlyStreak",
    "lastActivityDate",
    "lastWeeklyActivityDate",
    "lastMonthlyActivityDate"
  INTO 
    v_daily_streak,
    v_weekly_streak,
    v_monthly_streak,
    v_last_activity_date,
    v_last_weekly_date,
    v_last_monthly_date
  FROM "UserStreak"
  WHERE "userId" = p_user_id AND "companyId" = p_company_id;

  -- Streak kaydı yoksa oluştur
  IF NOT FOUND THEN
    INSERT INTO "UserStreak" ("userId", "companyId", "dailyStreak", "lastActivityDate")
    VALUES (p_user_id, p_company_id, 1, v_current_date)
    ON CONFLICT ("userId", "companyId") DO NOTHING;
    RETURN;
  END IF;

  -- Günlük Streak Hesaplama
  IF v_last_activity_date IS NULL OR v_last_activity_date < v_current_date THEN
    -- Son aktivite bugünden önceyse streak sıfırlanır veya artırılır
    IF v_last_activity_date = v_current_date - INTERVAL '1 day' THEN
      -- Ardışık gün - streak artır
      v_daily_streak := v_daily_streak + 1;
    ELSIF v_last_activity_date < v_current_date - INTERVAL '1 day' THEN
      -- Streak kırıldı - sıfırla
      v_daily_streak := 1;
    END IF;
    
    -- Bugün aktivite var - streak'i güncelle
    v_last_activity_date := v_current_date;
  END IF;

  -- Haftalık Streak Hesaplama
  v_current_week_start := DATE_TRUNC('week', v_current_date)::DATE;
  
  IF v_last_weekly_date IS NULL OR v_last_weekly_date < v_current_week_start THEN
    -- Bu hafta ilk aktivite
    IF v_last_weekly_date IS NOT NULL AND v_last_weekly_date >= v_current_week_start - INTERVAL '7 days' THEN
      -- Geçen hafta aktivite vardı - streak artır
      v_weekly_streak := COALESCE(v_weekly_streak, 0) + 1;
    ELSE
      -- Streak kırıldı - sıfırla
      v_weekly_streak := 1;
    END IF;
    
    v_last_weekly_date := v_current_date;
  END IF;

  -- Aylık Streak Hesaplama
  v_current_month_start := DATE_TRUNC('month', v_current_date)::DATE;
  
  IF v_last_monthly_date IS NULL OR v_last_monthly_date < v_current_month_start THEN
    -- Bu ay ilk aktivite
    IF v_last_monthly_date IS NOT NULL AND v_last_monthly_date >= v_current_month_start - INTERVAL '1 month' THEN
      -- Geçen ay aktivite vardı - streak artır
      v_monthly_streak := COALESCE(v_monthly_streak, 0) + 1;
    ELSE
      -- Streak kırıldı - sıfırla
      v_monthly_streak := 1;
    END IF;
    
    v_last_monthly_date := v_current_date;
  END IF;

  -- Streak'i güncelle
  UPDATE "UserStreak"
  SET 
    "dailyStreak" = v_daily_streak,
    "weeklyStreak" = v_weekly_streak,
    "monthlyStreak" = v_monthly_streak,
    "lastActivityDate" = v_last_activity_date,
    "lastWeeklyActivityDate" = v_last_weekly_date,
    "lastMonthlyActivityDate" = v_last_monthly_date,
    "updatedAt" = NOW()
  WHERE "userId" = p_user_id AND "companyId" = p_company_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 4: BADGE KAZANMA FONKSİYONU
-- ============================================
CREATE OR REPLACE FUNCTION award_badge(
  p_user_id UUID,
  p_company_id UUID,
  p_badge_type VARCHAR,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN AS $$
DECLARE
  v_badge_exists BOOLEAN;
BEGIN
  -- Rozet zaten var mı kontrol et
  SELECT EXISTS(
    SELECT 1 FROM "UserBadge"
    WHERE "userId" = p_user_id
      AND "companyId" = p_company_id
      AND "badgeType" = p_badge_type
  ) INTO v_badge_exists;

  -- Rozet yoksa ekle
  IF NOT v_badge_exists THEN
    INSERT INTO "UserBadge" ("userId", "companyId", "badgeType", "metadata")
    VALUES (p_user_id, p_company_id, p_badge_type, p_metadata)
    ON CONFLICT ("userId", "badgeType", "companyId") DO NOTHING;
    
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 5: DEAL WON → ROZET KAZANMA OTOMASYONU
-- ============================================
CREATE OR REPLACE FUNCTION check_deal_badges()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_company_id UUID;
  v_deal_count INTEGER;
  v_first_deal BOOLEAN;
BEGIN
  -- Deal WON olduğunda
  IF NEW.stage = 'WON' AND (OLD.stage IS NULL OR OLD.stage != 'WON') THEN
    v_user_id := NEW."createdBy";
    v_company_id := NEW."companyId";

    -- İlk Satış Rozeti
    SELECT COUNT(*) INTO v_deal_count
    FROM "Deal"
    WHERE "createdBy" = v_user_id
      AND "companyId" = v_company_id
      AND stage = 'WON';

    IF v_deal_count = 1 THEN
      -- İlk satış rozeti kazanıldı
      PERFORM award_badge(v_user_id, v_company_id, 'FIRST_SALE', jsonb_build_object('dealId', NEW.id));
    END IF;

    -- 10 Satış Rozeti
    IF v_deal_count = 10 THEN
      PERFORM award_badge(v_user_id, v_company_id, 'TEN_SALES', jsonb_build_object('dealId', NEW.id));
    END IF;

    -- 50 Satış Rozeti
    IF v_deal_count = 50 THEN
      PERFORM award_badge(v_user_id, v_company_id, 'FIFTY_SALES', jsonb_build_object('dealId', NEW.id));
    END IF;

    -- 100 Satış Rozeti
    IF v_deal_count = 100 THEN
      PERFORM award_badge(v_user_id, v_company_id, 'HUNDRED_SALES', jsonb_build_object('dealId', NEW.id));
    END IF;

    -- Streak güncelle
    PERFORM update_user_streak(v_user_id, v_company_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger oluştur
DROP TRIGGER IF EXISTS deal_won_badge_check ON "Deal";
CREATE TRIGGER deal_won_badge_check
  AFTER UPDATE OF stage
  ON "Deal"
  FOR EACH ROW
  WHEN (NEW.stage = 'WON' AND (OLD.stage IS NULL OR OLD.stage != 'WON'))
  EXECUTE FUNCTION check_deal_badges();

-- ============================================
-- PART 6: QUOTE ACCEPTED → ROZET KAZANMA
-- ============================================
CREATE OR REPLACE FUNCTION check_quote_badges()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_company_id UUID;
  v_quote_count INTEGER;
BEGIN
  -- Quote ACCEPTED olduğunda
  IF NEW.status = 'ACCEPTED' AND (OLD.status IS NULL OR OLD.status != 'ACCEPTED') THEN
    v_user_id := NEW."createdBy";
    v_company_id := NEW."companyId";

    -- Teklif Ustası Rozeti - En yüksek acceptance rate
    SELECT COUNT(*) INTO v_quote_count
    FROM "Quote"
    WHERE "createdBy" = v_user_id
      AND "companyId" = v_company_id
      AND status = 'ACCEPTED';

    -- 10 kabul edilen teklif
    IF v_quote_count = 10 THEN
      PERFORM award_badge(v_user_id, v_company_id, 'QUOTE_MASTER_10', jsonb_build_object('quoteId', NEW.id));
    END IF;

    -- Streak güncelle
    PERFORM update_user_streak(v_user_id, v_company_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger oluştur
DROP TRIGGER IF EXISTS quote_accepted_badge_check ON "Quote";
CREATE TRIGGER quote_accepted_badge_check
  AFTER UPDATE OF status
  ON "Quote"
  FOR EACH ROW
  WHEN (NEW.status = 'ACCEPTED' AND (OLD.status IS NULL OR OLD.status != 'ACCEPTED'))
  EXECUTE FUNCTION check_quote_badges();

-- ============================================
-- PART 7: CUSTOMER CREATED → STREAK GÜNCELLEME
-- ============================================
CREATE OR REPLACE FUNCTION update_streak_on_customer_create()
RETURNS TRIGGER AS $$
BEGIN
  -- Yeni müşteri oluşturulduğunda streak güncelle
  PERFORM update_user_streak(NEW."createdBy", NEW."companyId");
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger oluştur
DROP TRIGGER IF EXISTS customer_create_streak_update ON "Customer";
CREATE TRIGGER customer_create_streak_update
  AFTER INSERT
  ON "Customer"
  FOR EACH ROW
  EXECUTE FUNCTION update_streak_on_customer_create();

-- ============================================
-- PART 8: TASK COMPLETED → STREAK GÜNCELLEME
-- ============================================
CREATE OR REPLACE FUNCTION update_streak_on_task_complete()
RETURNS TRIGGER AS $$
BEGIN
  -- Görev tamamlandığında streak güncelle
  IF NEW.status = 'COMPLETED' AND (OLD.status IS NULL OR OLD.status != 'COMPLETED') THEN
    PERFORM update_user_streak(NEW."assignedTo", NEW."companyId");
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger oluştur
DROP TRIGGER IF EXISTS task_complete_streak_update ON "Task";
CREATE TRIGGER task_complete_streak_update
  AFTER UPDATE OF status
  ON "Task"
  FOR EACH ROW
  WHEN (NEW.status = 'COMPLETED' AND (OLD.status IS NULL OR OLD.status != 'COMPLETED'))
  EXECUTE FUNCTION update_streak_on_task_complete();

-- ============================================
-- PART 9: COMMENTS
-- ============================================
COMMENT ON TABLE "UserBadge" IS 'Kullanıcı rozetleri - Satış başarıları için rozetler';
COMMENT ON TABLE "UserStreak" IS 'Kullanıcı streak takibi - Günlük/haftalık/aylık aktivite serileri';
COMMENT ON FUNCTION update_user_streak IS 'Kullanıcı streak''ini günceller';
COMMENT ON FUNCTION award_badge IS 'Kullanıcıya rozet verir (duplicate kontrolü ile)';

