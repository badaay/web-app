-- Migration: 029_point_system_automation_and_performance.sql
-- Description: Implement set-based point distribution and optimized payroll metrics.
--              Follows supabase-postgres-best-practices (Priority 1: Query Performance).
--              Ensures all point math is integer-based (SIFATIH_PRD Rule).

-- 1. Optimized Point Distribution Function
-- This handles the distribution of base_point / total_participants
CREATE OR REPLACE FUNCTION public.distribute_work_order_points(p_work_order_id UUID)
RETURNS VOID AS $$
DECLARE
    v_base_point INTEGER;
    v_participant_count INTEGER;
    v_point_per_person INTEGER;
BEGIN
    -- Get base point from work order (already stamped by trigger 010)
    SELECT points INTO v_base_point 
    FROM public.work_orders 
    WHERE id = p_work_order_id;

    -- Count participants
    SELECT COUNT(*) INTO v_participant_count
    FROM public.work_order_assignments
    WHERE work_order_id = p_work_order_id;

    IF v_participant_count > 0 AND v_base_point > 0 THEN
        -- Mandatory Integer math: Floor rounding
        v_point_per_person := FLOOR(v_base_point / v_participant_count);

        -- Set-based update (Best Practice: Avoid loops)
        UPDATE public.work_order_assignments
        SET 
            points_earned = v_point_per_person,
            updated_at = now()
        WHERE work_order_id = p_work_order_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update existing trigger handle_work_order_closed to call distribution
CREATE OR REPLACE FUNCTION public.handle_work_order_closed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only act when transitioning INTO 'closed' status
  IF NEW.status = 'closed' AND OLD.status IS DISTINCT FROM 'closed' THEN
    -- Stamp completion timestamp
    IF NEW.completed_at IS NULL THEN
      NEW.completed_at := now();
    END IF;

    -- Look up the canonical base_point from the queue type
    IF NEW.type_id IS NOT NULL THEN
      SELECT base_point
        INTO NEW.points
        FROM public.master_queue_types
       WHERE id = NEW.type_id;
    END IF;

    -- DISTRIBUTE points to assignments automatically (New Story 1.2 Automation)
    -- This happens in a sub-transaction
    PERFORM public.distribute_work_order_points(NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Optimized Payroll Metrics View
-- Aggregates all employee performance data in one go (Best Practice: Priority 1 Query Performance)
CREATE OR REPLACE VIEW public.v_payroll_ready_metrics AS
WITH monthly_attendance AS (
    SELECT 
        employee_id,
        EXTRACT(YEAR FROM attendance_date) as year,
        EXTRACT(MONTH FROM attendance_date) as month,
        SUM(COALESCE(late_minutes, 0)) as total_late_minutes,
        COUNT(*) FILTER (WHERE is_absent = true) as total_absent_days,
        COUNT(*) FILTER (WHERE late_minutes > 0) as total_late_days,
        COUNT(*) FILTER (WHERE NOT is_absent) as total_present_days
    FROM public.attendance_records
    GROUP BY employee_id, EXTRACT(YEAR FROM attendance_date), EXTRACT(MONTH FROM attendance_date)
),
monthly_points AS (
    SELECT 
        employee_id,
        EXTRACT(YEAR FROM created_at) as year,
        EXTRACT(MONTH FROM created_at) as month,
        SUM(GREATEST(0, points_earned + bonus_points - deduction_points)) as actual_points
    FROM public.work_order_assignments
    GROUP BY employee_id, EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at)
)
SELECT 
    e.id as employee_id,
    e.name as employee_name,
    e.target_monthly_points as target_points,
    COALESCE(ma.year, mp.year) as year,
    COALESCE(ma.month, mp.month) as month,
    COALESCE(ma.total_late_minutes, 0) as total_late_minutes,
    COALESCE(ma.total_late_days, 0) as total_late_days,
    COALESCE(ma.total_absent_days, 0) as total_absent_days,
    COALESCE(ma.total_present_days, 0) as total_present_days,
    COALESCE(mp.actual_points, 0) as actual_points,
    GREATEST(0, e.target_monthly_points - COALESCE(mp.actual_points, 0)) as point_shortage
FROM public.employees e
LEFT JOIN monthly_attendance ma ON e.id = ma.employee_id
LEFT JOIN monthly_points mp ON e.id = mp.employee_id AND ma.year = mp.year AND ma.month = mp.month;

-- 4. Rules-based Payroll Adjustment Calculation (RPC)
-- This replaces the JS loop in point.service.js with a single database call
CREATE OR REPLACE FUNCTION public.calculate_all_payroll_adjustments(p_month INTEGER, p_year INTEGER)
RETURNS TABLE (
    employee_id UUID,
    rule_id UUID,
    adjustment_type VARCHAR,
    component_code VARCHAR,
    amount INTEGER,
    details TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH metrics AS (
        SELECT * FROM public.v_payroll_ready_metrics 
        WHERE year = p_year AND month = p_month
    ),
    rules AS (
        SELECT * FROM public.point_conversion_rules
    )
    SELECT 
        m.employee_id,
        r.id as rule_id,
        r.rule_type as adjustment_type,
        CASE 
            WHEN r.trigger_metric = 'minutes_late' THEN 'LATE_DEDUCTION'
            WHEN r.trigger_metric = 'points_shortage' THEN 'POINT_SHORTAGE'
            WHEN r.trigger_metric = 'points_earned' THEN 'POINT_BONUS'
            ELSE 'OTHER_ADJ'
        END as component_code,
        -- Calculate nominal based on rule (is_multiplier check)
        CASE 
            WHEN r.is_multiplier THEN 
                CASE 
                    WHEN r.trigger_metric = 'minutes_late' THEN (m.total_late_minutes / r.trigger_unit) * r.amount_per_unit
                    WHEN r.trigger_metric = 'points_shortage' THEN (m.point_shortage / r.trigger_unit) * r.amount_per_unit
                    WHEN r.trigger_metric = 'points_earned' THEN (m.actual_points / r.trigger_unit) * r.amount_per_unit
                    ELSE 0
                END
            ELSE 
                CASE 
                    WHEN r.trigger_metric = 'minutes_late' AND m.total_late_minutes >= r.trigger_unit THEN r.amount_per_unit
                    WHEN r.trigger_metric = 'points_shortage' AND m.point_shortage >= r.trigger_unit THEN r.amount_per_unit
                    WHEN r.trigger_metric = 'points_earned' AND m.actual_points >= r.trigger_unit THEN r.amount_per_unit
                    ELSE 0
                END
        END::INTEGER as amount,
        CASE 
            WHEN r.trigger_metric = 'minutes_late' THEN m.total_late_minutes || ' mins late'
            WHEN r.trigger_metric = 'points_shortage' THEN 'Shortage: ' || m.point_shortage || ' pts'
            WHEN r.trigger_metric = 'points_earned' THEN 'Earned: ' || m.actual_points || ' pts'
        END as details
    FROM metrics m
    CROSS JOIN rules r
    WHERE 
        (r.trigger_metric = 'minutes_late' AND m.total_late_minutes >= r.trigger_unit) OR
        (r.trigger_metric = 'points_shortage' AND m.point_shortage >= r.trigger_unit) OR
        (r.trigger_metric = 'points_earned' AND m.actual_points >= r.trigger_unit);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.calculate_all_payroll_adjustments IS 'Set-based payroll adjustment engine. Follows SIFATIH best practices for performance and integer math.';
