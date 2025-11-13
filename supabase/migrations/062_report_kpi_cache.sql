-- Report and KPI cache tables for precomputed analytics
-- Performance improvement: cache heavy report payloads and dashboard KPIs

BEGIN;

CREATE TABLE IF NOT EXISTS "ReportCache" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "companyId" uuid REFERENCES "Company"("id") ON DELETE CASCADE,
  "isGlobal" boolean NOT NULL DEFAULT false,
  "reportType" text NOT NULL,
  "payload" jsonb NOT NULL,
  "computedAt" timestamptz NOT NULL DEFAULT timezone('utc', now()),
  "createdAt" timestamptz NOT NULL DEFAULT timezone('utc', now()),
  "updatedAt" timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS "KpiCache" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "companyId" uuid REFERENCES "Company"("id") ON DELETE CASCADE,
  "isGlobal" boolean NOT NULL DEFAULT false,
  "payload" jsonb NOT NULL,
  "computedAt" timestamptz NOT NULL DEFAULT timezone('utc', now()),
  "createdAt" timestamptz NOT NULL DEFAULT timezone('utc', now()),
  "updatedAt" timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_reportcache_scope_type
  ON "ReportCache"("reportType", "isGlobal", "companyId");
CREATE INDEX IF NOT EXISTS idx_reportcache_computed_at
  ON "ReportCache"("computedAt");

CREATE UNIQUE INDEX IF NOT EXISTS idx_kpicache_scope
  ON "KpiCache"("isGlobal", "companyId");
CREATE INDEX IF NOT EXISTS idx_kpicache_computed_at
  ON "KpiCache"("computedAt");

ALTER TABLE "ReportCache" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "KpiCache" ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "ReportCache service role access"
  ON "ReportCache"
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "KpiCache service role access"
  ON "KpiCache"
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Trigger to keep updatedAt in sync
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW."updatedAt" = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS reportcache_set_updated_at ON "ReportCache";
CREATE TRIGGER reportcache_set_updated_at
  BEFORE UPDATE ON "ReportCache"
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS kpicache_set_updated_at ON "KpiCache";
CREATE TRIGGER kpicache_set_updated_at
  BEFORE UPDATE ON "KpiCache"
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

COMMIT;





