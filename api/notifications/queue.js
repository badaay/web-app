/**
 * GET /api/notifications/queue
 * Paginated list of notification_queue items. Admin only.
 * NOTE: `payload` field is intentionally excluded — may contain customer PII.
 */

import { supabaseAdmin, verifyAuth, isAdmin, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';

export const config = { runtime: 'edge' };

export default withCors(async function handler(req) {
  if (req.method !== 'GET') return errorResponse('Method not allowed', 405);

  const { user, error: authError } = await verifyAuth(req);
  if (authError) return errorResponse(authError, 401);
  if (!(await isAdmin(user.id))) return errorResponse('Forbidden', 403);

  try {
    const url = new URL(req.url);
    const status = url.searchParams.get('status') || 'all';
    const message_type = url.searchParams.get('message_type') || null;
    const limit = Math.min(parseInt(url.searchParams.get('limit')) || 50, 100);
    const offset = parseInt(url.searchParams.get('offset')) || 0;

    let query = supabaseAdmin
      .from('notification_queue')
      .select(
        'id, recipient, message_type, priority, status, scheduled_at, sent_at, error_msg, ref_id, created_at',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== 'all') query = query.eq('status', status);
    if (message_type) query = query.eq('message_type', message_type);

    const { data, error, count } = await query;
    if (error) return errorResponse(`Database error: ${error.message}`, 500);

    return jsonResponse({ data, count, limit, offset }, 200, { 'Cache-Control': 'no-store' });
  } catch (err) {
    return errorResponse(err.message || 'Internal server error', 500);
  }
});
