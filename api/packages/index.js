/**
 * GET  /api/packages        — List all internet packages
 * POST /api/packages        — Create a package (admin only)
 *
 * Thin handler — delegates to PackageService.
 */

import { supabaseAdmin, verifyAuth, isAdmin, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';
import { listPackages, createPackage } from '../_core/package.service.js';
import { mapToHttpStatus } from '../_core/http-mapper.js';

export const config = { runtime: 'edge' };

export default withCors(async function handler(req) {
  // ── GET ────────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const result = await listPackages(supabaseAdmin);

    if (!result.success) return errorResponse(result.error, mapToHttpStatus(result.statusHint));
    return jsonResponse({ data: result.data }, 200, { 'Cache-Control': 's-maxage=60' });
  }

  // ── POST ───────────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { user, error: authError } = await verifyAuth(req);
    if (authError) return errorResponse(authError, 401);
    if (!(await isAdmin(user.id))) return errorResponse('Forbidden', 403);

    try {
      const body = await req.json();
      const result = await createPackage(supabaseAdmin, body);

      if (!result.success) return errorResponse(result.error, mapToHttpStatus(result.statusHint));
      return jsonResponse({ success: true, data: result.data }, 201);
    } catch (err) {
      return errorResponse(err.message || 'Internal server error', 500);
    }
  }

  return errorResponse('Method not allowed', 405);
});
