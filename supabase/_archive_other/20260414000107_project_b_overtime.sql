-- Project B (Vault)
-- Migration: Create Overtime Records and Assignments
-- Created: 2026-04-14

CREATE TABLE IF NOT EXISTS public.overtime_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    overtime_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    description TEXT NOT NULL,
    overtime_type TEXT, -- 'psb' | 'backbone' | 'repair' | 'cable_pull' | 'other'
    
    total_hours DECIMAL(5,2) NOT NULL,
    hourly_rate INTEGER NOT NULL,
    total_amount INTEGER NOT NULL,
    
    work_order_id UUID, -- Refers to Project A work_orders.id
    
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID, -- Refers to Project A employees.id
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_overtime_date ON public.overtime_records(overtime_date);

-- Overtime Assignments
CREATE TABLE IF NOT EXISTS public.overtime_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    overtime_id UUID NOT NULL REFERENCES public.overtime_records(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL, -- Refers to Project A employees.id
    
    amount_earned INTEGER NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE (overtime_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_overtime_assignments_employee ON public.overtime_assignments(employee_id);

ALTER TABLE public.overtime_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overtime_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for authenticated" ON public.overtime_records FOR SELECT USING (true);
CREATE POLICY "Allow read for authenticated" ON public.overtime_assignments FOR SELECT USING (true);
