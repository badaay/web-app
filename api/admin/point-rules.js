/**
 * GET/POST /api/admin/point-rules
 * Manage point conversion rules (Admin Only)
 */
import { supabaseAdmin, verifyAuth, isAdmin, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';

export const config = { runtime: 'edge' };

async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });

  const { user, error: authError } = await verifyAuth(req);
  if (authError) return errorResponse(authError, 401);
  
  const authorized = await isAdmin(user.id);
  if (!authorized) return errorResponse('Admin access required', 403);

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('point_conversion_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return jsonResponse(data);
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { id, rule_name, rule_type, trigger_metric, trigger_unit, amount_per_unit, is_multiplier } = body;

      if (!rule_name || !rule_type || !trigger_metric || !trigger_unit || amount_per_unit === undefined) {
        return errorResponse('Missing required fields', 400);
      }

      const payload = {
        rule_name,
        rule_type,
        trigger_metric,
        trigger_unit,
        amount_per_unit,
        is_multiplier: is_multiplier !== false,
        updated_at: new Date().toISOString()
      };

      let result;
      if (id) {
        result = await supabaseAdmin.from('point_conversion_rules').update(payload).eq('id', id).select().single();
      } else {
        result = await supabaseAdmin.from('point_conversion_rules').insert(payload).select().single();
      }

      if (result.error) throw result.error;
      return jsonResponse(result.data);
    }

    if (req.method === 'DELETE') {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get('id');
      if (!id) return errorResponse('Missing id', 400);

      const { error } = await supabaseAdmin.from('point_conversion_rules').delete().eq('id', id);
      if (error) throw error;
      return jsonResponse({ success: true });
    }

    return errorResponse('Method not allowed', 405);
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}

export default withCors(handler);
