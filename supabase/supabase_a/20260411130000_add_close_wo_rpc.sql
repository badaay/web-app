-- SiFatih Project A: Add close_work_order_with_points RPC
-- Description: Creates the stored procedure called by api/work-orders/close.js
-- The existing trigger (trg_fn_award_points_to_vault) handles FDW point push automatically.
-- Date: 2026-04-11
-- Target: Run on Project A (Core)

CREATE OR REPLACE FUNCTION public.close_work_order_with_points(
    p_work_order_id UUID,
    p_close_data    JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_wo    public.work_orders%ROWTYPE;
    result  JSONB;
BEGIN
    -- Update work order to closed (trigger fires automatically → pushes to Vault)
    UPDATE public.work_orders
    SET
        status       = 'closed',
        completed_at = now(),
        updated_at   = now(),
        photo_url    = COALESCE(p_close_data->>'photo_proof', photo_url),
        ket          = COALESCE(p_close_data->>'notes', ket)
    WHERE id = p_work_order_id
    RETURNING * INTO v_wo;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Work order % not found', p_work_order_id;
    END IF;

    -- Update customer data from close_data if provided
    IF (p_close_data->>'mac_address') IS NOT NULL AND v_wo.customer_id IS NOT NULL THEN
        UPDATE public.customers
        SET
            mac_address = p_close_data->>'mac_address',
            damping     = p_close_data->>'damping'
        WHERE id = v_wo.customer_id;
    END IF;

    result := jsonb_build_object(
        'id',           v_wo.id,
        'status',       v_wo.status,
        'completed_at', v_wo.completed_at,
        'points',       v_wo.points
    );

    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.close_work_order_with_points(UUID, JSONB) TO service_role;
