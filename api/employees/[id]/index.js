/**
 * PATCH /api/employees/[id]
 * DELETE /api/employees/[id]
 *
 * Delegates to EmployeeService.
 */

import { supabaseAdmin, withCors, jsonResponse, errorResponse, verifyAuth, isAdmin } from '../../_lib/supabase.js';
import { updateEmployee, deleteEmployee } from '../../_core/employee.service.js';
import { mapToHttpStatus } from '../../_core/http-mapper.js';

export const config = { runtime: 'edge' };

export default withCors(async (req) => {
  const { user, error: authErr } = await verifyAuth(req);
  if (authErr) return errorResponse(authErr, 401);

  const url = new URL(req.url);
  const pathParts = url.pathname.split('/');
  // Path format: /api/employees/[id]
  const empIdx = pathParts.indexOf('employees');
  const employeeId = pathParts[empIdx + 1];

  if (!employeeId) return errorResponse('Employee ID is required', 400);

  if (req.method === 'PATCH') {
    const adminCheck = await isAdmin(user.id);
    if (!adminCheck) return errorResponse('Forbidden: Admin access required', 403);

    const body = await req.json();
    const result = await updateEmployee(supabaseAdmin, employeeId, body);
    
    if (!result.success) return errorResponse(result.error, mapToHttpStatus(result.statusHint));
    return jsonResponse(result.data);
  }

  if (req.method === 'DELETE') {
    const adminCheck = await isAdmin(user.id);
    if (!adminCheck) return errorResponse('Forbidden: Admin access required', 403);

    const result = await deleteEmployee(supabaseAdmin, employeeId);
    
    if (!result.success) return errorResponse(result.error, mapToHttpStatus(result.statusHint));
    return jsonResponse(result.data);
  }

  return errorResponse('Method not allowed', 405);
});
