/**
 * GET   /api/settings   — List all app settings (public, no auth)
 * PATCH /api/settings   — Update a setting by key (admin only)
 *
 * PATCH Body:
 * {
 *   "setting_key"   : "APP_NAME",
 *   "setting_value" : "SiFatih",
 *   "description"   : "optional"
 * }
 */

import { supabaseAdmin, verifyAuth, isAdmin, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';

export const config = { runtime: 'edge' };

export default withCors(async function handler(req) {
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseAdmin
        .from('app_settings')
        .select('*')
        .order('setting_key');
      if (error) return errorResponse(`Database error: ${error.message}`, 500);
      return jsonResponse({ data }, 200, { 'Cache-Control': 's-maxage=120' });
    } catch (err) {
      return errorResponse(err.message || 'Internal server error', 500);
    }
  }

  if (req.method === 'PATCH') {
    try {
      const { user, error: authError } = await verifyAuth(req);
      if (authError) return errorResponse(authError, 401);
      if (!(await isAdmin(user.id))) return errorResponse('Forbidden', 403);

      const body = await req.json();
      const { setting_key, setting_value, description } = body;
      if (!setting_key || setting_value === undefined) {
        return errorResponse('setting_key and setting_value are required', 400);
      }

      const updates = { setting_value };
      if (description !== undefined) updates.description = description;

      const { data, error } = await supabaseAdmin
        .from('app_settings')
        .update(updates)
        .eq('setting_key', setting_key)
        .select()
        .single();

      if (error) return errorResponse(`Database error: ${error.message}`, 500);
      if (!data) return errorResponse('Setting not found', 404);

      return jsonResponse({ success: true, data });
    } catch (err) {
      return errorResponse(err.message || 'Internal server error', 500);
    }
  }

  return errorResponse('Method not allowed', 405);
});
