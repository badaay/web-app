import { supabaseAdmin, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';

export const config = { runtime: 'edge' };

export default withCors(async function handler(req) {
  if (req.method !== 'GET') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return errorResponse('Missing tracking token', 400);
    }

    // Query the psb_registrations table using the secret token
    const { data: psbData, error: psbError } = await supabaseAdmin
      .from('psb_registrations')
      .select('name, phone, status, created_at, updated_at, address, packet')
      .eq('secret_token', token)
      .maybeSingle();

    if (psbError) {
      return errorResponse(`Database error: ${psbError.message}`, 500);
    }

    if (!psbData) {
      return errorResponse('Valid token not found or registration does not exist', 404);
    }

    // Try to find a customer linked by phone number to get installation scheduled date
    let scheduledDate = null;
    let workOrderStatus = null;
    if (psbData.phone) {
      const { data: customer } = await supabaseAdmin
        .from('customers')
        .select('id')
        .eq('phone', psbData.phone)
        .maybeSingle();

      if (customer) {
        // Get latest work order for this customer
        const { data: wo } = await supabaseAdmin
          .from('work_orders')
          .select('id, status')
          .eq('customer_id', customer.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (wo) {
          workOrderStatus = wo.status;
          // Get planned installation date from monitoring record
          const { data: monitoring } = await supabaseAdmin
            .from('installation_monitorings')
            .select('planned_date, actual_date')
            .eq('work_order_id', wo.id)
            .maybeSingle();

          if (monitoring) {
            scheduledDate = monitoring.actual_date || monitoring.planned_date || null;
          }
        }
      }
    }

    return jsonResponse({
        success: true,
        data: {
          name: psbData.name,
          status: psbData.status,
          address: psbData.address,
          packet: psbData.packet,
          registration_date: psbData.created_at,
          updated_at: psbData.updated_at,
          scheduled_date: scheduledDate,
          work_order_status: workOrderStatus,
        }
    }, 200);

  } catch (error) {
    console.error('Tracking endpoint error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
});
