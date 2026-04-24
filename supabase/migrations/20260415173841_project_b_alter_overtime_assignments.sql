-- 1. Add all missing fields to the physical table
ALTER TABLE public.overtime_assignments 
ADD COLUMN IF NOT EXISTS assignment_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS task_description TEXT,
ADD COLUMN IF NOT EXISTS duration_hours NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0;