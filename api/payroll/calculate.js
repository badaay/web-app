/**
 * POST /api/payroll/calculate
 *
 * Delegates to PayrollService.
 */

import { supabaseAdmin, verifyAuth, isAdmin, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';
import { calculatePayroll } from '../_core/payroll.service.js';
import { mapToHttpStatus } from '../_core/http-mapper.js';

export const config = { runtime: 'edge' };

export default withCors(async (req) => {
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405);

  const { user, error: authErr } = await verifyAuth(req);
  if (authErr) return errorResponse(authErr, 401);

  const adminCheck = await isAdmin(user.id);
  if (!adminCheck) return errorResponse('Forbidden: Admin access required', 403);

  try {
    const { period_id } = await req.json();
    if (!period_id) return errorResponse('period_id is required', 400);

    const result = await calculatePayroll(supabaseAdmin, period_id, user.id);

    if (!result.success) {
      return errorResponse(result.error, mapToHttpStatus(result.statusHint));
    }

    return jsonResponse(result.data);
  } catch (err) {
    console.error('Payroll handler error:', err);
    return errorResponse(err.message || 'Internal server error', 500);
  }
});
