// api/_lib/fonnte.js
import { supabaseAdmin } from './supabase.js';

const FONNTE_API_URL = 'https://api.fonnte.com/send';

/**
 * Message templates in Bahasa Indonesia with Spintax support.
 */
export const TEMPLATES = {
    wo_created:
        '{Halo|Hai|Selamat datang} *${name}*! Tiket pemasangan internet Anda berhasil dibuat dengan nomor: *${queue_number}*. Tim kami akan segera memproses. Terima kasih! 🙏',

    wo_confirmed:
        '{Halo|Kabar baik untuk} *${name}*! Pesanan Anda telah *dikonfirmasi* oleh admin. Teknisi *${technician_name}* akan segera dijadwalkan ke lokasi Anda.',

    wo_open:
        '{Halo|Hai} *${name}*, teknisi kami *${technician_name}* sedang dalam perjalanan menuju lokasi Anda. 🔧 Mohon siapkan akses ke titik instalasi.',

    wo_closed:
        'Proses instalasi di lokasi Anda telah *selesai*, *${name}*! Terima kasih telah mempercayakan layanan internet kepada kami. 🎉',

    welcome_installed:
        'Selamat, *${name}*! Layanan internet paket *${package_name}* Anda kini *aktif*. Semoga betah dan nikmati koneksinya! 🚀',

    payment_due_soon:
        '📅 Pengingat tagihan untuk *${name}*: tagihan internet Anda sebesar *Rp${amount}* akan jatuh tempo pada *${due_date}*. Mohon segera lakukan pembayaran.',

    payment_overdue:
        '⚠️ *${name}*, tagihan internet Anda sebesar *Rp${amount}* telah _melewati jatuh tempo_ *${due_date}*. Mohon segera lakukan pembayaran.',
};

/**
 * Reads FONNTE_* config from app_settings.
 * Returns null if token is not configured.
 */
export async function getTokenConfig() {
    try {
        const { data, error } = await supabaseAdmin
            .from('app_settings')
            .select('setting_key, setting_value')
            .eq('setting_group', 'whatsapp');

        if (error || !data) return null;

        const config = {};
        data.forEach(item => {
            config[item.setting_key] = item.setting_value;
        });

        if (!config.FONNTE_TOKEN) return null;

        return {
            token: config.FONNTE_TOKEN,
            dailyLimit: parseInt(config.FONNTE_DAILY_LIMIT) || 500,
            warnThreshold: parseFloat(config.FONNTE_WARN_THRESHOLD) || 0.8,
            sentToday: parseInt(config.FONNTE_SENT_TODAY) || 0,
            lastReset: config.FONNTE_LAST_RESET
        };
    } catch (err) {
        console.error('[Fonnte Config Error]:', err);
        return null;
    }
}

/**
 * Sends a single WhatsApp message via Fonnte.
 * Uses application/x-www-form-urlencoded as required by Fonnte.
 */
export async function sendWhatsApp({ token, target, message, delay = '30-120', typingDuration = 5 }) {
    try {
        const body = new URLSearchParams({
            target,
            message,
            delay,
            typing: 'true',
            duration: String(typingDuration)
        });

        const response = await fetch(FONNTE_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: body.toString()
        });

        const result = await response.json();

        if (!response.ok || !result.status) {
            console.error('[Fonnte Send Error]:', result);
            return { success: false, error: result.reason || 'Unknown error' };
        }

        return { success: true, raw: result };
    } catch (err) {
        console.error('[Fonnte Network Error]:', err);
        return { success: false, error: err.message };
    }
}

/**
 * Deterministic dedup fingerprint.
 */
export function buildDedupHash(recipient, messageType, refId) {
    const raw = `${recipient}:${messageType}:${refId || ''}`;
    // Simple btoa for edge runtime compatibility
    return btoa(raw);
}

/**
 * Formats a template string by replacing variables and resolving Spintax.
 */
export function formatMessage(templateKey, data) {
    let msg = TEMPLATES[templateKey] || '';
    if (!msg) return '';

    // Pass 1: Variable substitution ${name}
    msg = msg.replace(/\${(\w+)}/g, (_, key) => data[key] ?? '');

    // Pass 2: Spintax resolver {A|B|C}
    msg = msg.replace(/\{([^{}]+)\}/g, (_, options) => {
        const choices = options.split('|');
        return choices[Math.floor(Math.random() * choices.length)];
    });

    return msg;
}

/**
 * Enqueues a notification into the queue table.
 * Handles duplicate hash violations silently.
 */
export async function enqueueNotification({ recipient, messageType, payload = {}, priority = 2, scheduledAt, refId, sourceId }) {
    // refId  → arbitrary string used only as the dedup hash seed
    // sourceId → valid UUID stored in the ref_id column (e.g. workOrderId, customerId)
    try {
        const dedup_hash = buildDedupHash(recipient, messageType, refId);

        const { data, error } = await supabaseAdmin
            .from('notification_queue')
            .insert({
                recipient,
                message_type: messageType,
                payload,
                priority,
                status: 'pending',
                dedup_hash,
                scheduled_at: scheduledAt || new Date().toISOString(),
                ref_id: sourceId || null  // must be a UUID or null
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                return { queued: false, reason: 'duplicate' };
            }
            console.error('[Enqueue Error]:', error);
            throw error;
        }

        return { queued: true, id: data.id };
    } catch (err) {
        console.error('[Enqueue Exception]:', err);
        return { queued: false, error: err.message };
    }
}

/**
 * High-level helper to notify a customer about a Work Order event.
 * Fetches required data (customer, technician) and sends WA directly.
 * All outcomes — success, send failure, fetch failure — are logged to notification_queue.
 *
 * On send failure: queued as 'pending' so the dispatcher can retry automatically.
 * On WO/phone fetch failure: queued as 'failed' for admin visibility.
 * Non-blocking: outer catch swallows any unexpected exception.
 */
export async function notifyWorkOrderEvent(workOrderId, eventType) {
    try {
        const cfg = await getTokenConfig();
        if (!cfg?.token) return;

        // ── Fetch WO data ──────────────────────────────────────────────────────
        // NOTE: internet_packages is NOT joined here — work_orders.package_id has no
        // FK defined in the schema so PostgREST cannot resolve the relationship.
        // Package name fetched separately below if needed.
        const { data: wo, error: woError } = await supabaseAdmin
            .from('work_orders')
            .select('*, customers(*), assigned:employees!employee_id(name)')
            .eq('id', workOrderId)
            .single();

        // ── Guard: WO fetch failed ─────────────────────────────────────────────
        if (woError || !wo) {
            const errMsg = woError?.message ?? 'Work order not found';
            console.error(`[notifyWorkOrderEvent] WO fetch error (${eventType}) ID:${workOrderId} — ${errMsg}`);
            // Log as failed so admin can see it in the queue panel
            await supabaseAdmin.from('notification_queue').insert({
                recipient: 'unknown',
                message_type: eventType,
                payload: { workOrderId, eventType },
                priority: 1,
                status: 'failed',
                error_msg: `WO fetch failed: ${errMsg}`,
                dedup_hash: buildDedupHash('unknown', eventType, workOrderId + '-fetch-fail'),
                ref_id: workOrderId,
            }); // ignore insert error (e.g. duplicate hash)
            return;
        }

        // ── Guard: customer has no phone ───────────────────────────────────────
        if (!wo.customers?.phone) {
            console.warn(`[notifyWorkOrderEvent] No phone on customer for WO ${workOrderId}`);
            await supabaseAdmin.from('notification_queue').insert({
                recipient: wo.customer_id ?? workOrderId,
                message_type: eventType,
                payload: { workOrderId, customer_id: wo.customer_id, name: wo.customers?.name },
                priority: 1,
                status: 'failed',
                error_msg: 'Customer has no phone number configured',
                dedup_hash: buildDedupHash(wo.customer_id ?? workOrderId, eventType, workOrderId + '-no-phone'),
                ref_id: workOrderId,
            }); // ignore insert error (e.g. duplicate hash)
            return;
        }

        // ── Resolve technician name (employee_id join, fall back to claimed_by) ─
        let technicianName = wo.assigned?.name;
        if (!technicianName && wo.claimed_by) {
            const { data: tech } = await supabaseAdmin
                .from('employees')
                .select('name')
                .eq('id', wo.claimed_by)
                .single();
            if (tech) technicianName = tech.name;
        }

        // ── Resolve package name separately (no FK → can't join) ──────────────
        let packageName = 'Internet';
        if (wo.package_id) {
            const { data: pkg } = await supabaseAdmin
                .from('internet_packages')
                .select('name')
                .eq('id', wo.package_id)
                .single();
            if (pkg?.name) packageName = pkg.name;
        }

        const customer = wo.customers;
        const variables = {
            name: customer.name,
            queue_number: wo.id.slice(0, 8).toUpperCase(),
            technician_name: technicianName ?? 'Tim Teknisi',
            package_name: packageName,
        };

        // ── Send helper: logs result to queue, queues as pending on failure ────
        async function sendAndLog(msgType, waOptions) {
            const message = formatMessage(msgType, variables);
            const result = await sendWhatsApp({ ...waOptions, token: cfg.token, target: customer.phone, message });

            if (result.success) {
                // Log as sent (dedup on workOrderId+eventType prevents duplicate log entries on retries)
                await supabaseAdmin.from('notification_queue').insert({
                    recipient: customer.phone,
                    message_type: msgType,
                    payload: variables,
                    priority: 1,
                    status: 'sent',
                    sent_at: new Date().toISOString(),
                    dedup_hash: buildDedupHash(customer.phone, msgType, workOrderId + '-sent'),
                    ref_id: workOrderId,
                }); // ignore insert error (e.g. duplicate hash on retry)
            } else {
                // Send failed → queue as pending so dispatcher retries automatically
                console.error(`[Fonnte] Direct send failed for ${msgType} (WO: ${workOrderId}). Queuing for retry.`);
                await enqueueNotification({
                    recipient: customer.phone,
                    messageType: msgType,
                    payload: variables,
                    priority: 1,
                    refId: workOrderId + '-retry-' + msgType, // dedup seed (string)
                    sourceId: workOrderId,                    // UUID stored in ref_id column
                });
            }
        }

        // ── Dispatch by event type ─────────────────────────────────────────────
        if (eventType === 'wo_closed') {
            await sendAndLog('wo_closed',       { delay: '3-8',   typingDuration: 3 });
            await sendAndLog('welcome_installed', { delay: '10-20', typingDuration: 4 });
        } else {
            await sendAndLog(eventType, { delay: '5-15', typingDuration: 3 });
        }

    } catch (err) {
        console.error(`[Fonnte Notify Error] ${eventType} (WO: ${workOrderId}):`, err.message);
    }
}
