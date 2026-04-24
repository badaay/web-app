-- Final Sync: Align overtime_records with Modern Form Requirements
-- Target: Project B (Vault)

ALTER TABLE public.overtime_records 
  -- 1. Date & Time (Standardizing names)
  ADD COLUMN IF NOT EXISTS overtime_date  DATE,
  ADD COLUMN IF NOT EXISTS start_time     TIME,
  ADD COLUMN IF NOT EXISTS end_time       TIME,
  
  -- Relaxing legacy constraints from original vault schema
  ALTER COLUMN employee_id DROP NOT NULL,
  ALTER COLUMN date        DROP NOT NULL,
  
  -- 2. Meta & Categorization
  ADD COLUMN IF NOT EXISTS description     TEXT,
  ADD COLUMN IF NOT EXISTS overtime_type    TEXT,
  
  -- 3. Financials & Precision
  ADD COLUMN IF NOT EXISTS total_hours      DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS hourly_rate      INTEGER,
  ADD COLUMN IF NOT EXISTS total_amount     INTEGER,
  ADD COLUMN IF NOT EXISTS amount_earned    INTEGER DEFAULT 0, -- Per person fallback
  
  -- 4. Relations & Audit
  ADD COLUMN IF NOT EXISTS work_order_id    UUID,
  ADD COLUMN IF NOT EXISTS created_by       UUID,
  ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMPTZ DEFAULT now();

-- 5. Data Migration (Optional: Sync 'date' to 'overtime_date' if data exists)
UPDATE public.overtime_records 
SET overtime_date = date 
WHERE overtime_date IS NULL AND date IS NOT NULL;

-- 6. Cleanup (Making critical columns NOT NULL after sync if possible, but keeping optional for safety now)
COMMENT ON COLUMN public.overtime_records.created_by IS 'Refers to the admin/SPV who recorded this entry';
