/**
 * GET  /api/roles   — List all roles (public, no auth required)
 * POST /api/roles   — Create a role (super-admin only)
 *
 * Thin handler — delegates to RoleService.
 */

import { supabaseAdmin, verifyAuth, hasRole, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';
import { listRoles, createRole } from '../_core/role.service.js';
import { mapToHttpStatus } from '../_core/http-mapper.js';

export const config = { runtime: 'edge' };

export default withCors(async function handler(req) {
  // ── GET ────────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const result = await listRoles(supabaseAdmin);

    if (!result.success) return errorResponse(result.error, mapToHttpStatus(result.statusHint));
    return jsonResponse({ data: result.data }, 200, { 'Cache-Control': 's-maxage=120' });
  }

  // ── POST ───────────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { user, error: authError } = await verifyAuth(req);
    if (authError) return errorResponse(authError, 401);
    // Only super-admins and owners may create roles
    const allowed = await hasRole(user.id, ['S_ADM', 'OWNER']);
    if (!allowed) return errorResponse('Forbidden: Super-admin access required', 403);

    try {
      const body = await req.json();
      const result = await createRole(supabaseAdmin, body);

      if (!result.success) return errorResponse(result.error, mapToHttpStatus(result.statusHint));
      return jsonResponse({ success: true, data: result.data }, 201);
    } catch (err) {
      return errorResponse(err.message || 'Internal server error', 500);
    }
  }

  return errorResponse('Method not allowed', 405);
});
