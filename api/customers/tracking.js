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
      .select('name, status, created_at, address, packet')
      .eq('secret_token', token)
      .maybeSingle();

    if (psbError) {
      return errorResponse(`Database error: ${psbError.message}`, 500);
    }

    if (!psbData) {
      return errorResponse('Valid token not found or registration does not exist', 404);
    }

    // If there is an integration with work orders in the future, we can augment scheduled_date here.
    // For now we just return the registration details.
    
    return jsonResponse({
        success: true,
        data: {
          name: psbData.name,
          status: psbData.status,
          address: psbData.address,
          packet: psbData.packet,
          registration_date: psbData.created_at,
          scheduled_date: null // Placeholder for C04-03 scheduled_date requirement
        }
    }, 200);

  } catch (error) {
    console.error('Tracking endpoint error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
});
