-- Bridge View for Flat Overtime Records
-- This solves the cross-project relationship issue by performing the join in a view.

CREATE OR REPLACE VIEW public.v_overtime_records_expanded WITH (security_invoker = true) AS
SELECT 
    ot.*,
    e.name AS technician_name,
    e.employee_id AS technician_code
FROM public.overtime_records ot
LEFT JOIN public.employees e ON ot.employee_id = e.id;

-- Grant access
GRANT SELECT ON public.v_overtime_records_expanded TO authenticated;
GRANT SELECT ON public.v_overtime_records_expanded TO service_role;
