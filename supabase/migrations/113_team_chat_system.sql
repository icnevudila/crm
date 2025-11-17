-- ============================================
-- 113_team_chat_system.sql
-- TAKIM SOHBETİ SİSTEMİ
-- ============================================
-- Bu dosya şunları yapar:
-- 1. ChatMessage tablosu - Sohbet mesajları
-- 2. ChatChannel tablosu - Sohbet kanalları (müşteri/deal bazlı)
-- 3. RLS policies - Güvenlik
-- 4. Indexes - Performans
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
-- PART 1: CHAT CHANNEL TABLOSU
-- ============================================
CREATE TABLE IF NOT EXISTS "ChatChannel" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "entityType" VARCHAR(50) NOT NULL, -- 'Customer', 'Deal', 'Quote', 'Invoice', 'General'
  "entityId" UUID, -- İlgili kayıt ID (müşteri, deal, vb.)
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdBy" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Aynı entity için tek kanal
  UNIQUE("entityType", "entityId", "companyId")
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chatchannel_entity ON "ChatChannel"("entityType", "entityId", "companyId");
CREATE INDEX IF NOT EXISTS idx_chatchannel_company ON "ChatChannel"("companyId");

-- RLS Policies
ALTER TABLE "ChatChannel" ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar kendi şirketlerinin kanallarını görebilir
CREATE POLICY "Users can view their company channels"
  ON "ChatChannel" FOR SELECT
  USING (
    "companyId" = (SELECT "companyId" FROM "User" WHERE id = auth.uid())
  );

-- Kullanıcılar kendi şirketlerinde kanal oluşturabilir
CREATE POLICY "Users can create channels"
  ON "ChatChannel" FOR INSERT
  WITH CHECK (
    "companyId" = (SELECT "companyId" FROM "User" WHERE id = auth.uid())
    AND "createdBy" = auth.uid()
  );

-- ============================================
-- PART 2: CHAT MESSAGE TABLOSU
-- ============================================
CREATE TABLE IF NOT EXISTS "ChatMessage" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "channelId" UUID NOT NULL REFERENCES "ChatChannel"(id) ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "message" TEXT NOT NULL,
  "fileUrl" TEXT, -- Dosya URL'i (opsiyonel)
  "fileName" VARCHAR(255), -- Dosya adı (opsiyonel)
  "fileType" VARCHAR(50), -- Dosya tipi (opsiyonel)
  "replyToId" UUID REFERENCES "ChatMessage"(id) ON DELETE SET NULL, -- Yanıt mesajı ID
  "companyId" UUID NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chatmessage_channel ON "ChatMessage"("channelId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_chatmessage_user ON "ChatMessage"("userId");
CREATE INDEX IF NOT EXISTS idx_chatmessage_company ON "ChatMessage"("companyId");

-- RLS Policies
ALTER TABLE "ChatMessage" ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar kendi şirketlerinin mesajlarını görebilir
CREATE POLICY "Users can view their company messages"
  ON "ChatMessage" FOR SELECT
  USING (
    "companyId" = (SELECT "companyId" FROM "User" WHERE id = auth.uid())
  );

-- Kullanıcılar kendi şirketlerinde mesaj gönderebilir
CREATE POLICY "Users can send messages"
  ON "ChatMessage" FOR INSERT
  WITH CHECK (
    "companyId" = (SELECT "companyId" FROM "User" WHERE id = auth.uid())
    AND "userId" = auth.uid()
  );

-- Kullanıcılar kendi mesajlarını düzenleyebilir
CREATE POLICY "Users can update their own messages"
  ON "ChatMessage" FOR UPDATE
  USING (
    "companyId" = (SELECT "companyId" FROM "User" WHERE id = auth.uid())
    AND "userId" = auth.uid()
  );

-- Kullanıcılar kendi mesajlarını silebilir
CREATE POLICY "Users can delete their own messages"
  ON "ChatMessage" FOR DELETE
  USING (
    "companyId" = (SELECT "companyId" FROM "User" WHERE id = auth.uid())
    AND "userId" = auth.uid()
  );

-- ============================================
-- PART 3: CHAT CHANNEL MEMBER TABLOSU (Opsiyonel - gelecekte eklenebilir)
-- ============================================
-- Şimdilik tüm şirket kullanıcıları kanala erişebilir
-- Gelecekte özel kanallar için member sistemi eklenebilir

-- ============================================
-- PART 4: TRIGGERS
-- ============================================
-- UpdatedAt trigger
CREATE OR REPLACE FUNCTION update_chatchannel_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chatchannel_updated_at
  BEFORE UPDATE ON "ChatChannel"
  FOR EACH ROW
  EXECUTE FUNCTION update_chatchannel_updated_at();

CREATE TRIGGER chatmessage_updated_at
  BEFORE UPDATE ON "ChatMessage"
  FOR EACH ROW
  EXECUTE FUNCTION update_chatchannel_updated_at();

-- ============================================
-- PART 5: COMMENTS
-- ============================================
COMMENT ON TABLE "ChatChannel" IS 'Sohbet kanalları - Müşteri, Deal, Quote, Invoice veya genel kanallar';
COMMENT ON TABLE "ChatMessage" IS 'Sohbet mesajları - Kanal bazlı mesajlar';
COMMENT ON COLUMN "ChatChannel"."entityType" IS 'Entity tipi: Customer, Deal, Quote, Invoice, General';
COMMENT ON COLUMN "ChatChannel"."entityId" IS 'Entity ID (müşteri, deal, vb.)';

