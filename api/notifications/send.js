/**
 * POST /api/notifications/send
 * 
 * Direct send a WhatsApp message from the Admin Panel.
 * Requires Admin or Supervisor role.
 * 
 * Body:
 * {
 *   "target": "phone_number",
 *   "message": "The message text",
 *   "customer_id": "optional uuid for logging"
 * }
 */

import { supabaseAdmin, verifyAuth, hasRole, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';
import { getTokenConfig, sendWhatsApp } from '../_lib/fonnte.js';

export const config = { runtime: 'edge' };

export default withCors(async function handler(req) {
    if (req.method !== 'POST') {
        return errorResponse('Method not allowed', 405);
    }

    try {
        const { user, error: authError } = await verifyAuth(req);
        if (authError) return errorResponse(authError, 401);

        const authorized = await hasRole(user.id, ['S_ADM', 'OWNER', 'ADM', 'SPV_TECH']);
        if (!authorized) return errorResponse('Forbidden: Insufficient permissions', 403);

        const { target, message, customer_id } = await req.json();

        if (!target || !message) {
            return errorResponse('Missing target or message', 400);
        }

        const cfg = await getTokenConfig();
        if (!cfg?.token) {
            return errorResponse('WhatsApp API not configured (Token missing)', 500);
        }

        const result = await sendWhatsApp({
            token: cfg.token,
            target,
            message,
            delay: '2-5',
            typingDuration: 3
        });

        if (!result.success) {
            return errorResponse(`Fonnte Error: ${result.error}`, 502);
        }

        // Optional: Log to notification_queue as "sent" for history
        if (customer_id) {
            await supabaseAdmin.from('notification_queue').insert({
                recipient: target,
                message_type: 'direct_admin',
                payload: { message },
                status: 'sent',
                sent_at: new Date().toISOString()
            });
        }

        return jsonResponse({ success: true, raw: result.raw });

    } catch (err) {
        console.error('[Direct Send Error]:', err);
        return errorResponse(err.message || 'Internal server error', 500);
    }
});
