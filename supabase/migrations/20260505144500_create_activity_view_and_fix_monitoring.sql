-- Migration: 20260505144500_create_activity_view_and_fix_monitoring.sql
-- Description: Recreates the missing v_activity_work_orders view and adds missing columns to installation_monitorings.
-- Date: 2026-05-05

-- 1. Fix installation_monitorings table
ALTER TABLE public.installation_monitorings
ADD COLUMN IF NOT EXISTS photo_proof TEXT,
ADD COLUMN IF NOT EXISTS actual_date DATE,
ADD COLUMN IF NOT EXISTS activation_date DATE;

-- 2. Create the unified activity view
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
                    'points_earned', a.points_earned
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

-- 3. Grant access
GRANT SELECT ON public.v_activity_work_orders TO authenticated;
GRANT SELECT ON public.v_activity_work_orders TO service_role;
