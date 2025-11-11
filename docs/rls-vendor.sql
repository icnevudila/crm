-- Vendor (Tedarikçi) RLS Policies

ALTER TABLE "Vendor" ENABLE ROW LEVEL SECURITY;

-- Vendor Policies
CREATE POLICY "vendor_company_isolation" ON "Vendor"
  FOR ALL
  USING (
    "companyId" = (
      SELECT "companyId" FROM "User" WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    )
  );





