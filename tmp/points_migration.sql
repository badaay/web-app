-- 1. Add total_points column to employees table (if not done)
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;

-- 2. Create the unified close function with CORRECT column mapping
CREATE OR REPLACE FUNCTION public.close_work_order_with_points(
    p_work_order_id UUID,
    p_close_data JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_base_point INTEGER;
    v_type_id UUID;
    v_customer_id UUID;
BEGIN
    -- 1. Get work order info
    SELECT type_id, customer_id INTO v_type_id, v_customer_id
    FROM public.work_orders
    WHERE id = p_work_order_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Work order not found');
    END IF;

    -- 2. Get base points for this type
    SELECT base_point INTO v_base_point
    FROM public.master_queue_types
    WHERE id = v_type_id;

    -- 3. Update work order status and metadata
    UPDATE public.work_orders
    SET 
        status = 'closed',
        completed_at = now(),
        points = COALESCE(v_base_point, 0),
        updated_at = now()
    WHERE id = p_work_order_id;

    -- 4. Update installation_monitorings (where mac and notes actually live)
    UPDATE public.installation_monitorings
    SET
        mac_address = COALESCE((p_close_data->>'mac_address'), mac_address),
        notes = COALESCE((p_close_data->>'notes'), notes),
        photo_proof = COALESCE((p_close_data->>'photo_proof'), photo_proof),
        actual_date = COALESCE((p_close_data->>'actual_date')::DATE, now()::DATE),
        updated_at = now()
    WHERE work_order_id = p_work_order_id;

    -- 5. Update customer technical data (damping lives here)
    IF v_customer_id IS NOT NULL THEN
        UPDATE public.customers
        SET 
            mac_address = COALESCE((p_close_data->>'mac_address'), mac_address),
            damping = COALESCE((p_close_data->>'damping'), damping)
        WHERE id = v_customer_id;
    END IF;

    -- 6. Distribute points to assigned technicians
    UPDATE public.work_order_assignments
    SET points_earned = COALESCE(v_base_point, 0)
    WHERE work_order_id = p_work_order_id;

    -- 7. Aggregate points to employee profile
    UPDATE public.employees e
    SET total_points = e.total_points + COALESCE(v_base_point, 0)
    FROM public.work_order_assignments a
    WHERE a.work_order_id = p_work_order_id
      AND a.employee_id = e.id;

    RETURN jsonb_build_object(
        'success', true, 
        'points_awarded', v_base_point,
        'message', 'Work order closed and points distributed'
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
