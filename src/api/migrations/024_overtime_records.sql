-- Migration: 024_overtime_records.sql
-- Task 1.5: Create overtime tables (records + assignments)
-- Ref: pre-planning/03-data-model-proposal.md#23-overtime-records

-- TODO: Implement

-- Table 1: Overtime Events
-- CREATE TABLE IF NOT EXISTS public.overtime_records (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     
--     overtime_date DATE NOT NULL,
--     start_time TIME NOT NULL,
--     end_time TIME NOT NULL,
--     
--     description TEXT NOT NULL,
--     overtime_type TEXT,  -- 'psb' | 'backbone' | 'repair' | 'cable_pull' | 'other'
--     
--     total_hours DECIMAL(5,2) NOT NULL,
--     hourly_rate INTEGER NOT NULL,
--     total_amount INTEGER NOT NULL,
--     
--     work_order_id UUID REFERENCES public.work_orders(id),
--     
--     created_at TIMESTAMPTZ DEFAULT now(),
--     created_by UUID REFERENCES public.employees(id),
--     updated_at TIMESTAMPTZ DEFAULT now()
-- );

-- Table 2: Per-Technician Assignments
-- CREATE TABLE IF NOT EXISTS public.overtime_assignments (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     overtime_id UUID NOT NULL REFERENCES public.overtime_records(id) ON DELETE CASCADE,
--     employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
--     
--     amount_earned INTEGER NOT NULL,
--     
--     created_at TIMESTAMPTZ DEFAULT now(),
--     
--     UNIQUE (overtime_id, employee_id)
-- );

-- Indexes
-- CREATE INDEX idx_overtime_date ON public.overtime_records(overtime_date);
-- CREATE INDEX idx_overtime_assignments_employee ON public.overtime_assignments(employee_id);

-- RLS Policies
-- ALTER TABLE public.overtime_records ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.overtime_assignments ENABLE ROW LEVEL SECURITY;
