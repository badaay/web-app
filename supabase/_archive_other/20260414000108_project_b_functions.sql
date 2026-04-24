-- Project B (Vault)
-- Migration: Create Financial Functions and RPCs
-- Created: 2026-04-14

-- 1. Calculate Late Deduction
CREATE OR REPLACE FUNCTION public.calculate_late_deduction(
    p_check_in_time TIME,
    p_is_absent BOOLEAN DEFAULT false,
    p_work_start TIME DEFAULT '08:00',
    p_rate_per_hour INTEGER DEFAULT 20000,
    p_max_daily INTEGER DEFAULT 20000
) RETURNS INTEGER AS $$
DECLARE
    v_late_minutes INTEGER;
    v_deduction INTEGER;
BEGIN
    IF p_is_absent OR p_check_in_time IS NULL THEN
        RETURN p_max_daily;
    END IF;

    IF p_check_in_time <= p_work_start THEN
        RETURN 0;
    END IF;

    v_late_minutes := EXTRACT(EPOCH FROM (p_check_in_time - p_work_start)) / 60;
    v_deduction := FLOOR((v_late_minutes::DECIMAL / 60) * p_rate_per_hour);

    RETURN LEAST(v_deduction, p_max_daily);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Point Deduction RPC
-- Note: This RPC technically needs to know Work Order points.
-- Since Work Orders are in Project A and this is Project B, 
-- this function might rely on data synced to Project B or be moved to Project A.
-- However, for the Reorganization MVP, we define the signature in Project B 
-- to allow the Payroll Engine to call it locally if points are synced.
CREATE OR REPLACE FUNCTION public.calculate_point_deduction(
    p_target_points INTEGER,
    p_actual_points INTEGER,
    p_rate_per_point INTEGER DEFAULT 11600
) RETURNS TABLE (
    target_points INTEGER,
    actual_points INTEGER,
    point_shortage INTEGER,
    deduction_amount INTEGER
) AS $$
BEGIN
    RETURN QUERY SELECT
        p_target_points,
        p_actual_points,
        CASE WHEN p_actual_points < p_target_points THEN p_target_points - p_actual_points ELSE 0 END,
        CASE WHEN p_actual_points < p_target_points THEN (p_target_points - p_actual_points) * p_rate_per_point ELSE 0 END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
