-- Project B (Vault)
-- Migration: Create Attendance Records Table
-- Created: 2026-04-14

CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL, -- Refers to Project A employees.id
    
    attendance_date DATE NOT NULL,
    check_in_time TIME,
    check_out_time TIME,
    
    -- Lateness
    late_minutes INTEGER DEFAULT 0,
    is_absent BOOLEAN DEFAULT false,
    deduction_amount INTEGER DEFAULT 0,
    
    -- Source
    source TEXT DEFAULT 'manual', -- 'manual' | 'imported' | 'fingerprint'
    external_id TEXT,
    notes TEXT,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID, -- Refers to Project A employees.id
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE (employee_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_employee ON public.attendance_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance_records(attendance_date);

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for authenticated" ON public.attendance_records FOR SELECT USING (true);
