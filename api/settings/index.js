/**
 * GET   /api/settings   — List all app settings (public, no auth)
 * PATCH /api/settings   — Update a setting by key (admin only)
 *
 * Thin handler — delegates to SettingService.
 */

import { supabaseAdmin, verifyAuth, isAdmin, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';
import { listSettings, updateSetting } from '../_core/setting.service.js';
import { mapToHttpStatus } from '../_core/http-mapper.js';

export const config = { runtime: 'edge' };

export default withCors(async function handler(req) {
  // ── GET ────────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const result = await listSettings(supabaseAdmin);

    if (!result.success) return errorResponse(result.error, mapToHttpStatus(result.statusHint));
    return jsonResponse({ data: result.data }, 200, { 'Cache-Control': 's-maxage=120' });
  }

  // ── PATCH ──────────────────────────────────────────────────────────────────
  if (req.method === 'PATCH') {
    const { user, error: authError } = await verifyAuth(req);
    if (authError) return errorResponse(authError, 401);
    if (!(await isAdmin(user.id))) return errorResponse('Forbidden', 403);

    try {
      const body = await req.json();
      const result = await updateSetting(supabaseAdmin, body);

      if (!result.success) return errorResponse(result.error, mapToHttpStatus(result.statusHint));
      return jsonResponse({ success: true, data: result.data });
    } catch (err) {
      return errorResponse(err.message || 'Internal server error', 500);
    }
  }

  return errorResponse('Method not allowed', 405);
});
