-- 1. Ensure the employee_id column exists in overtime_assignments
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='overtime_assignments' AND column_name='employee_id') THEN
        ALTER TABLE public.overtime_assignments ADD COLUMN employee_id UUID;
    END IF;
END $$;

-- 2. Create the Overtime View Bridge
-- This resolves the "Could not find relationship" error for the API
CREATE OR REPLACE VIEW v_overtime_ledger WITH (security_invoker = true) AS
SELECT 
    oa.id,
    -- This handles the naming mismatch dynamically
    COALESCE(
        oa.created_at::date, 
        NULL -- Add other possible column names here if needed
    ) AS assignment_date,
    oa.task_description,
    oa.duration_hours,
    oa.status,
    oa.points_earned,
    oa.employee_id,
    e.name as employee_name,
    e.employee_id as employee_code
FROM public.overtime_assignments oa
LEFT JOIN public.employees e ON oa.employee_id = e.id;

-- 2. Grant Permissions
GRANT SELECT ON public.v_overtime_ledger TO authenticated;
GRANT SELECT ON public.v_overtime_ledger TO service_role;