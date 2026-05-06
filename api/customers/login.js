/**
 * POST /api/customers/login
 *
 * Delegates to CustomerService.
 */

import { supabaseAdmin, supabase, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';
import { loginCustomer } from '../_core/customer.service.js';
import { mapToHttpStatus } from '../_core/http-mapper.js';

export const config = { runtime: 'edge' };

export default withCors(async (req) => {
  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    const { phone, password } = await req.json();
    const result = await loginCustomer(supabaseAdmin, supabase, phone, password);

    if (!result.success) {
      return errorResponse(result.error, mapToHttpStatus(result.statusHint));
    }

    return jsonResponse(result.data, 200);
  } catch (error) {
    console.error('Customer login error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
});
