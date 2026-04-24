-- Migration: Create Activity View for Work Orders
-- Description: Aggregates work orders with their relations (customers, employees, types, monitorings, assignments) into a single view for better performance.
-- Date: 2026-04-16

CREATE OR REPLACE VIEW public.v_activity_work_orders 
WITH (security_invoker = true)
AS
SELECT 
    wo.id,
    wo.title,
    wo.status,
    wo.description,
    wo.created_at,
    wo.claimed_at,
    wo.completed_at,
    wo.customer_id,
    wo.employee_id,
    wo.type_id,
    wo.claimed_by,
    wo.points,
    wo.ket,
    -- Relation: customers (1:1)
    (SELECT json_build_object(
        'name', c.name,
        'address', c.address,
        'phone', c.phone,
        'lat', c.lat,
        'lng', c.lng
    ) FROM public.customers c WHERE c.id = wo.customer_id) AS customers,
    -- Relation: installation_monitorings (1:N, schema says work_order_id unique so 1:1)
    COALESCE(
        (SELECT json_agg(im) FROM (
            SELECT *
            FROM public.installation_monitorings 
            WHERE work_order_id = wo.id
        ) im),
        '[]'::json
    ) AS installation_monitorings,
    -- Relation: employees (1:1) - Assigned Employee
    (SELECT json_build_object('name', e.name) 
     FROM public.employees e 
     WHERE e.id = wo.employee_id) AS employees,
    -- Relation: master_queue_types (1:1)
    (SELECT row_to_json(mqt) FROM (
        SELECT name, color, icon 
        FROM public.master_queue_types 
        WHERE id = wo.type_id
    ) mqt) AS master_queue_types,
    -- Relation: work_order_assignments (1:N)
    COALESCE(
        (SELECT json_agg(wa) FROM (
            SELECT 
                woa.id, 
                woa.employee_id, 
                woa.assignment_role, 
                woa.points_earned,
                (SELECT json_build_object('name', emp_assign.name) 
                 FROM public.employees emp_assign 
                 WHERE emp_assign.id = woa.employee_id) AS employees
            FROM public.work_order_assignments woa
            WHERE woa.work_order_id = wo.id
        ) wa),
        '[]'::json
    ) AS work_order_assignments
FROM public.work_orders wo;

-- Grant access to authenticated users
GRANT SELECT ON public.v_activity_work_orders TO authenticated;
GRANT SELECT ON public.v_activity_work_orders TO service_role;
    