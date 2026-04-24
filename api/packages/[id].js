/**
 * PATCH  /api/packages/:id  — Update a package (admin only)
 * DELETE /api/packages/:id  — Delete a package (admin only)
 *
 * Thin handler — delegates to PackageService.
 */

import { supabaseAdmin, verifyAuth, isAdmin, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';
import { updatePackage, deletePackage } from '../_core/package.service.js';
import { mapToHttpStatus } from '../_core/http-mapper.js';

export const config = { runtime: 'edge' };

export default withCors(async function handler(req) {
  const { user, error: authError } = await verifyAuth(req);
  if (authError) return errorResponse(authError, 401);
  if (!(await isAdmin(user.id))) return errorResponse('Forbidden', 403);

  const url = new URL(req.url);
  const id = url.pathname.split('/').pop();
  if (!id || id === 'packages') return errorResponse('Package id is required', 400);

  // ── PATCH ──────────────────────────────────────────────────────────────────
  if (req.method === 'PATCH') {
    try {
      const body = await req.json();
      const result = await updatePackage(supabaseAdmin, id, body);

      if (!result.success) return errorResponse(result.error, mapToHttpStatus(result.statusHint));
      return jsonResponse({ success: true, data: result.data });
    } catch (err) {
      return errorResponse(err.message || 'Internal server error', 500);
    }
  }

  // ── DELETE ─────────────────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    try {
      const result = await deletePackage(supabaseAdmin, id);

      if (!result.success) return errorResponse(result.error, mapToHttpStatus(result.statusHint));
      return jsonResponse({ success: true, message: 'Package deleted' });
    } catch (err) {
      return errorResponse(err.message || 'Internal server error', 500);
    }
  }

  return errorResponse('Method not allowed', 405);
});
