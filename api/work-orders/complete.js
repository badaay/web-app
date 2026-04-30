import { verifyAuth, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';
import { completeWorkOrder } from '../_core/work-order.service.js';
import { mapToHttpStatus } from '../_core/http-mapper.js';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method === 'OPTIONS') return withCors(new Response(null, { status: 204 }));
  if (req.method !== 'POST') return withCors(errorResponse('Method not allowed', 405));

  const { dbClient, user, error: authError } = await verifyAuth(req);
  if (authError) return withCors(authError);

  try {
    const { id } = await req.json();
    const result = await completeWorkOrder(dbClient, id, user);
    if (!result.success) return withCors(errorResponse(result.error, mapToHttpStatus(result.statusHint)));
    return withCors(jsonResponse(result.data));
  } catch (err) {
    return withCors(errorResponse(err.message, 400));
  }
}
