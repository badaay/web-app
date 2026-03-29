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

import { supabaseAdmin, verifyAuth, isAdmin, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';
import { getTokenConfig, sendWhatsApp } from '../_lib/fonnte.js';

export const config = { runtime: 'edge' };

const PHONE_RE = /^62\d{8,13}$/;

export default withCors(async function handler(req) {
    if (req.method !== 'POST') {
        return errorResponse('Method not allowed', 405);
    }

    try {
        const { user, error: authError } = await verifyAuth(req);
        if (authError) return errorResponse(authError, 401);
        if (!(await isAdmin(user.id))) return errorResponse('Forbidden: Hanya admin yang dapat mengirim pesan langsung.', 403);

        const { target, message, customer_id } = await req.json();

        if (!target || !PHONE_RE.test(target)) {
            return errorResponse('Format nomor tidak valid. Gunakan format 62xxxxxxxxxx (contoh: 6281234567890).', 400);
        }
        if (!message || message.trim().length === 0) {
            return errorResponse('Pesan tidak boleh kosong.', 400);
        }
        if (message.length > 1000) {
            return errorResponse('Pesan terlalu panjang. Maksimal 1000 karakter.', 400);
        }

        const cfg = await getTokenConfig();
        if (!cfg?.token) {
            return errorResponse('Token Fonnte belum dikonfigurasi. Silakan atur di halaman Settings \u2192 WhatsApp.', 400);
        }

        const result = await sendWhatsApp({
            token: cfg.token,
            target,
            message,
            delay: '0',
            typingDuration: 0,
        });

        if (!result.success) {
            return errorResponse(`Gagal mengirim pesan: ${result.error}`, 502);
        }

        // Increment daily counter (non-blocking)
        supabaseAdmin
            .from('app_settings')
            .select('setting_value')
            .eq('setting_key', 'FONNTE_SENT_TODAY')
            .single()
            .then(({ data }) => {
                const current = parseInt(data?.setting_value) || 0;
                return supabaseAdmin
                    .from('app_settings')
                    .update({ setting_value: String(current + 1) })
                    .eq('setting_key', 'FONNTE_SENT_TODAY');
            })
            .catch(() => {
                // silently fail - non-critical operation
            });

        // Log to notification_queue for history (non-blocking)
        supabaseAdmin.from('notification_queue').insert({
            recipient: target,
            message_type: 'direct_admin',
            payload: { message },
            status: 'sent',
            sent_at: new Date().toISOString(),
            ref_id: customer_id || null,
            dedup_hash: btoa(`${target}:direct_admin:${Date.now()}`),
            scheduled_at: new Date().toISOString(),
        }).then(() => {
            // inserted successfully
        }).catch(() => {
            // silently fail - non-critical operation
        });

        return jsonResponse({ success: true, message: `Pesan berhasil dikirim ke ${target}` });

    } catch (err) {
        console.error('[Direct Send Error]:', err);
        return errorResponse(err.message || 'Internal server error', 500);
    }
});
