import { createAdminClient, verifyAuth, isAdmin, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';
import { verifyWorkOrder } from '../_core/work-order.service.js';
import { mapToHttpStatus } from '../_core/http-mapper.js';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method === 'OPTIONS') return withCors(new Response(null, { status: 204 }));
  if (req.method !== 'POST') return withCors(errorResponse('Method not allowed', 405));

  const { dbClient, user, error: authError } = await verifyAuth(req);
  if (authError) return withCors(authError);

  // Security Check: Only Admin-class can verify
  if (!await isAdmin(user.id)) {
    return withCors(errorResponse('Forbidden: Admin access required', 403));
  }

  try {
    const { id, adjustments, closeData } = await req.json();
    const authClient = createAdminClient(); // Service role for customer creation
    const result = await verifyWorkOrder(dbClient, authClient, id, { adjustments, closeData }, user);
    if (!result.success) return withCors(errorResponse(result.error, mapToHttpStatus(result.statusHint)));
    return withCors(jsonResponse(result.data));
  } catch (err) {
    return withCors(errorResponse(err.message, 400));
  }
}
