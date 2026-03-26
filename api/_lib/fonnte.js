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
export async function enqueueNotification({ recipient, messageType, payload = {}, priority = 2, scheduledAt, refId }) {
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
                scheduled_at: scheduledAt || new Date().toISOString()
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
 * Fetches required data (customer, technician, package) and sends WA.
 * Non-blocking: failures are logged but don't throw.
 */
export async function notifyWorkOrderEvent(workOrderId, eventType) {
    try {
        const cfg = await getTokenConfig();
        if (!cfg?.token) return;

        // Fetch WO details including associations
        const { data: wo, error } = await supabaseAdmin
            .from('work_orders')
            .select('*, customers(*), employees!employee_id(name), internet_packages(name)')
            .eq('id', workOrderId)
            .single();

        if (error || !wo || !wo.customers?.phone) {
            console.warn(`[notifyWorkOrderEvent] Skip: WO not found or no phone. ID: ${workOrderId}`);
            return;
        }

        const customer = wo.customers;
        const variables = {
            name: customer.name,
            queue_number: wo.id.slice(0, 8).toUpperCase(),
            technician_name: wo.employees?.name ?? 'Tim Teknisi',
            package_name: wo.internet_packages?.name ?? 'Internet'
        };

        if (eventType === 'wo_closed') {
            // Special case: send two messages sequentially
            await sendWhatsApp({
                token: cfg.token,
                target: customer.phone,
                message: formatMessage('wo_closed', variables),
                delay: '3-8',
                typingDuration: 3,
            });
            await sendWhatsApp({
                token: cfg.token,
                target: customer.phone,
                message: formatMessage('welcome_installed', variables),
                delay: '10-20',
                typingDuration: 4,
            });
        } else {
            // Standard single message
            await sendWhatsApp({
                token: cfg.token,
                target: customer.phone,
                message: formatMessage(eventType, variables),
                delay: '5-15',
                typingDuration: 3,
            });
        }
    } catch (err) {
        console.error(`[Fonnte Notify Error] ${eventType}:`, err.message);
    }
}
