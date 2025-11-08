-- Company tablosu için login sayfasında tüm şirketlerin görünmesi için policy
-- Login sayfası için SELECT policy (herkes görebilir)

-- Önce mevcut policy'yi kaldır (eğer varsa)
DROP POLICY IF EXISTS "company_isolation" ON "Company";
DROP POLICY IF EXISTS "company_select_public" ON "Company";

-- Login sayfası için SELECT policy (herkes okuyabilir)
CREATE POLICY "company_select_public" ON "Company"
  FOR SELECT
  USING (true); -- Herkes görebilir (login sayfası için)

-- UPDATE, INSERT, DELETE için company isolation (mevcut mantık)
CREATE POLICY "company_isolation_write" ON "Company"
  FOR ALL
  USING (
    id = (
      SELECT "companyId" FROM "User" WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    )
  )
  WITH CHECK (
    id = (
      SELECT "companyId" FROM "User" WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    )
  );







