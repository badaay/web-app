import { supabaseAdmin, verifyAuth, isAdmin, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';
import { requestRevision } from '../_core/work-order.service.js';
import { mapToHttpStatus } from '../_core/http-mapper.js';

export const config = { runtime: 'edge' };

async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405);

  const { user, error: authError } = await verifyAuth(req);
  if (authError) return errorResponse(authError, 401);

  // Security Check: Only Admin-class can request revision
  if (!await isAdmin(user.id)) {
    return errorResponse('Forbidden: Admin access required', 403);
  }

  try {
    const { id, reason } = await req.json();
    const result = await requestRevision(supabaseAdmin, id, reason, user);
    if (!result.success) return errorResponse(result.error, mapToHttpStatus(result.statusHint));
    return jsonResponse(result.data);
  } catch (err) {
    return errorResponse(err.message, 400);
  }
}

export default withCors(handler);
