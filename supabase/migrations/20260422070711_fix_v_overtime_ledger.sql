-- Fix for v_overtime_ledger to match overtime_records schema and API requirements
-- This view bridges Project B assignments with Project A employee names

CREATE OR REPLACE VIEW v_overtime_ledger WITH (security_invoker = true) AS
SELECT 
    oa.id,
    oa.overtime_id,
    oa.employee_id,
    oa.amount_earned,
    e.name as employee_name,
    e.employee_id as employee_code,
    oa.created_at
FROM public.overtime_assignments oa
LEFT JOIN public.employees e ON oa.employee_id = e.id;

-- Ensure permissions are set
GRANT SELECT ON public.v_overtime_ledger TO authenticated;
GRANT SELECT ON public.v_overtime_ledger TO service_role;
