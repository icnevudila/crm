-- CRM V3 - Index Improvements
-- Eksik index'leri ekler (performans için)
-- Quote validUntil, Task dueDate index'leri

-- ============================================
-- 1. QUOTE → VALIDUNTIL INDEX
-- ============================================
-- Quote tablosunda validUntil kolonu varsa index ekle
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Quote' 
    AND column_name = 'validUntil'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_quote_valid_until ON "Quote"("validUntil") WHERE "validUntil" IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_quote_status_valid_until ON "Quote"("status", "validUntil") WHERE "validUntil" IS NOT NULL AND status = 'SENT';
  END IF;
END $$;

-- ============================================
-- 2. TASK → DUEDATE INDEX
-- ============================================
-- Task tablosunda dueDate kolonu varsa index ekle
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'Task' 
    AND column_name = 'dueDate'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_task_due_date ON "Task"("dueDate") WHERE "dueDate" IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_task_status_due_date ON "Task"("status", "dueDate") WHERE "dueDate" IS NOT NULL AND status != 'DONE';
  END IF;
END $$;

-- ============================================
-- 3. TICKET → CREATEDAT INDEX (Geç kaldı kontrolü için)
-- ============================================
-- Ticket tablosunda createdAt kolonu için index ekle (geç kaldı kontrolü için)
CREATE INDEX IF NOT EXISTS idx_ticket_created_at ON "Ticket"("createdAt");
CREATE INDEX IF NOT EXISTS idx_ticket_status_created_at ON "Ticket"("status", "createdAt") WHERE status NOT IN ('RESOLVED', 'CLOSED');

-- ============================================
-- 4. COMMENT'LER
-- ============================================
COMMENT ON INDEX idx_quote_valid_until IS 'Quote validUntil index - süre dolmak üzere kontrolü için';
COMMENT ON INDEX idx_task_due_date IS 'Task dueDate index - geç kaldı/yaklaşıyor kontrolü için';
COMMENT ON INDEX idx_ticket_created_at IS 'Ticket createdAt index - geç kaldı kontrolü için';











