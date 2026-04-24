-- Migration: Create Technician Performance view
-- Purpose: Aggregate points for the performance leaderboard

CREATE OR REPLACE VIEW public.technician_performance_stats AS
SELECT 
    e.id AS employee_id,
    e.name,
    e.employee_id AS employee_code,
    COALESCE(SUM(woa.points_earned), 0) AS total_points,
    COUNT(woa.id) AS total_jobs,
    -- Simple Leveling logic: 500 points per level
    CASE 
        WHEN COALESCE(SUM(woa.points_earned), 0) = 0 THEN 1
        ELSE FLOOR(COALESCE(SUM(woa.points_earned), 0) / 500) + 1 
    END AS level,
    -- XP is the remainder points towards next level
    (COALESCE(SUM(woa.points_earned), 0) % 500) * 100 / 500 AS xp_percentage
FROM 
    public.employees e
LEFT JOIN 
    public.work_order_assignments woa ON e.id = woa.employee_id
GROUP BY 
    e.id, e.name, e.employee_id;

-- Grant access
GRANT SELECT ON public.technician_performance_stats TO authenticated;
GRANT SELECT ON public.technician_performance_stats TO anon;
