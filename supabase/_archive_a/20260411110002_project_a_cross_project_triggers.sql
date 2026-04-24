-- SiFatih Project A: Cross-Project Point Award Logic
-- Description: Automatically awards points to technicians in Project B when a WO is closed in Project A.
-- Date: 2026-04-11
-- Target: Run on Project A (Core)

-- 1. Trigger Function: Award Points to Vault
CREATE OR REPLACE FUNCTION public.trg_fn_award_points_to_vault()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_base_point INTEGER;
    v_assignment RECORD;
BEGIN
    -- Only act when transitioning INTO 'closed' status
    IF NEW.status = 'closed' AND OLD.status IS DISTINCT FROM 'closed' THEN
        
        -- Get base point from Project A's local master_queue_types
        SELECT base_point INTO v_base_point
        FROM public.master_queue_types
        WHERE id = NEW.type_id;

        -- For each technician assigned to this work order
        FOR v_assignment IN 
            SELECT employee_id, assignment_role 
            FROM public.work_order_assignments 
            WHERE work_order_id = NEW.id
        LOOP
            -- Calculate individual points (example logic: lead gets full, member gets 70%)
            -- This logic can be refined as per business rules
            DECLARE
                v_earned_points INTEGER;
            BEGIN
                IF v_assignment.assignment_role = 'lead' THEN
                    v_earned_points := v_base_point;
                ELSE
                    v_earned_points := (v_base_point * 0.7)::INTEGER;
                END IF;

                -- PUSH data to Project B via FDW
                INSERT INTO remote_vault.technician_points_ledger (
                    employee_id,
                    work_order_id,
                    points,
                    description
                ) VALUES (
                    v_assignment.employee_id,
                    NEW.id,
                    v_earned_points,
                    'Points for ' || NEW.title || ' (Role: ' || v_assignment.assignment_role || ')'
                );
            END;
        END LOOP;
        
        -- Update cached points in Project A for quick UI reference
        NEW.points := v_base_point; 
    END IF;

    RETURN NEW;
END;
$$;

-- 2. Bind Trigger to work_orders
DROP TRIGGER IF EXISTS trg_ps_work_order_closed ON public.work_orders;
CREATE TRIGGER trg_ps_work_order_closed
    BEFORE UPDATE ON public.work_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_fn_award_points_to_vault();
