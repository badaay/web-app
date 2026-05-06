-- Migration: 20260505151800_fix_assignment_points_columns.sql
-- Description: Ensures work_order_assignments has all required points columns.
-- Date: 2026-05-05

ALTER TABLE public.work_order_assignments
ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bonus_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS deduction_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS adjustment_reason TEXT;

-- Update the view to include these columns in the JSON output
CREATE OR REPLACE VIEW public.v_activity_work_orders AS
SELECT 
    wo.*,
    qt.name as type_name,
    qt.color as type_color,
    qt.icon as type_icon,
    -- Master Queue Type (Object)
    jsonb_build_object(
        'id', qt.id,
        'name', qt.name,
        'color', qt.color,
        'icon', qt.icon,
        'base_point', qt.base_point
    ) as master_queue_types,
    -- Customer (Object)
    jsonb_build_object(
        'id', c.id,
        'name', c.name,
        'address', c.address,
        'phone', c.phone,
        'lat', c.lat,
        'lng', c.lng,
        'packet', c.packet,
        'customer_code', c.customer_code
    ) as customers,
    -- Assignments (Array)
    COALESCE(
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', a.id,
                    'employee_id', a.employee_id,
                    'assignment_role', a.assignment_role,
                    'employee_name', e.name,
                    'points_earned', a.points_earned,
                    'bonus_points', a.bonus_points,
                    'deduction_points', a.deduction_points,
                    'adjustment_reason', a.adjustment_reason
                )
            )
            FROM public.work_order_assignments a
            JOIN public.employees e ON a.employee_id = e.id
            WHERE a.work_order_id = wo.id
        ),
        '[]'::jsonb
    ) as work_order_assignments,
    -- Monitorings (Array)
    COALESCE(
        (
            SELECT jsonb_agg(m.*)
            FROM public.installation_monitorings m
            WHERE m.work_order_id = wo.id
        ),
        '[]'::jsonb
    ) as installation_monitorings
FROM public.work_orders wo
LEFT JOIN public.master_queue_types qt ON wo.type_id = qt.id
LEFT JOIN public.customers c ON wo.customer_id = c.id;

GRANT SELECT ON public.v_activity_work_orders TO authenticated;
GRANT SELECT ON public.v_activity_work_orders TO service_role;
