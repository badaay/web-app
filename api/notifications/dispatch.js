/**
 * POST /api/notifications/dispatch
 *
 * Manually processes up to 10 pending notification_queue items in one run.
 * Accepts admin JWT OR x-cron-secret header (future-proofing for cron wiring).
 *
 * Returns: { dispatched, failed, usage_ratio, daily_remaining }
 */

import { supabaseAdmin, verifyAuth, isAdmin, withCors, jsonResponse, errorResponse } from '../_lib/supabase.js';
import { getTokenConfig, sendWhatsApp, formatMessage } from '../_lib/fonnte.js';

export const config = { runtime: 'edge' };

const BATCH_SIZE = 10;

// Convert UTC date to WIB (UTC+7)
function toWIB(date = new Date()) {
  return new Date(date.getTime() + 7 * 60 * 60 * 1000);
}

function getWIBDateString(date = new Date()) {
  return toWIB(date).toISOString().slice(0, 10);
}

function getWIBHour(date = new Date()) {
  return toWIB(date).getUTCHours();
}

export default withCors(async function handler(req) {
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405);

  // Dual auth: admin JWT or cron-secret header (for future Vercel/GitHub Actions cron)
  let authorized = false;

  const cronSecret = req.headers.get('x-cron-secret');
  const envCronSecret = process.env.CRON_SECRET;
  if (envCronSecret && cronSecret === envCronSecret) {
    authorized = true;
  } else {
    const { user, error: authError } = await verifyAuth(req);
    if (!authError && user) {
      authorized = await isAdmin(user.id);
    }
  }

  if (!authorized) return errorResponse('Forbidden', 403);

  try {
    const cfg = await getTokenConfig();
    if (!cfg?.token) {
      return jsonResponse({ skipped: true, reason: 'Token Fonnte belum dikonfigurasi.' });
    }

    const now = new Date();
    const todayWIB = getWIBDateString(now);
    const lastResetDate = cfg.lastReset ? cfg.lastReset.slice(0, 10) : null;

    // WIB-aware daily counter reset
    if (lastResetDate !== todayWIB) {
      await supabaseAdmin
        .from('app_settings')
        .update({ setting_value: '0' })
        .eq('setting_key', 'FONNTE_SENT_TODAY');
      await supabaseAdmin
        .from('app_settings')
        .update({ setting_value: now.toISOString() })
        .eq('setting_key', 'FONNTE_LAST_RESET');
      cfg.sentToday = 0;
    }

    // Pre-flight: halt at 95% daily usage
    const currentRatio = cfg.sentToday / cfg.dailyLimit;
    if (currentRatio >= 0.95) {
      return jsonResponse({
        paused: true,
        reason: 'Batas harian hampir tercapai (≥95%). Dispatcher dihentikan sementara.',
        usage_ratio: Math.round(currentRatio * 1000) / 1000,
        daily_remaining: Math.max(0, cfg.dailyLimit - cfg.sentToday),
      });
    }

    // Night window: P3 (bulk) blocked 21:00–06:59 WIB
    const wibHour = getWIBHour(now);
    const isNightWindow = wibHour >= 21 || wibHour < 7;

    // Optional: target specific IDs (manual retry of selected items)
    let body = {};
    try { body = await req.json(); } catch (_) {}
    const targetIds = Array.isArray(body.ids) && body.ids.length > 0 ? body.ids : null;

    let items, fetchError;

    if (targetIds) {
      // Targeted retry: reset status to pending for the specified IDs first
      await supabaseAdmin
        .from('notification_queue')
        .update({ status: 'pending', error_msg: null })
        .in('id', targetIds);

      const result = await supabaseAdmin
        .from('notification_queue')
        .select('id, recipient, message_type, payload, priority')
        .in('id', targetIds)
        .limit(BATCH_SIZE);
      items = result.data;
      fetchError = result.error;
    } else {
      // Normal batch: next pending items ordered by priority + scheduled_at
      let query = supabaseAdmin
        .from('notification_queue')
        .select('id, recipient, message_type, payload, priority')
        .eq('status', 'pending')
        .lte('scheduled_at', now.toISOString())
        .order('priority', { ascending: true })
        .order('scheduled_at', { ascending: true })
        .limit(BATCH_SIZE);

      if (isNightWindow) {
        query = query.in('priority', [1, 2]);
      }

      const result = await query;
      items = result.data;
      fetchError = result.error;
    }
    if (fetchError) return errorResponse(`Queue fetch error: ${fetchError.message}`, 500);

    if (!items || items.length === 0) {
      return jsonResponse({
        dispatched: 0,
        failed: 0,
        usage_ratio: Math.round(currentRatio * 1000) / 1000,
        daily_remaining: Math.max(0, cfg.dailyLimit - cfg.sentToday),
        night_window: isNightWindow,
      });
    }

    let dispatched = 0;
    let failed = 0;
    let sentToday = cfg.sentToday;

    for (const item of items) {
      // Atomic lock: only process if still 'pending' (prevents race conditions)
      const { error: lockErr } = await supabaseAdmin
        .from('notification_queue')
        .update({ status: 'processing' })
        .eq('id', item.id)
        .eq('status', 'pending');

      if (lockErr) continue; // Already claimed by another runner

      try {
        const message = formatMessage(item.message_type, item.payload || {});
        if (!message) {
          await supabaseAdmin
            .from('notification_queue')
            .update({ status: 'failed', error_msg: `Unknown template: ${item.message_type}` })
            .eq('id', item.id);
          failed++;
          continue;
        }

        const result = await sendWhatsApp({
          token: cfg.token,
          target: item.recipient,
          message,
          delay: '5-15',
          typingDuration: 3,
        });

        if (result.success) {
          await supabaseAdmin
            .from('notification_queue')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('id', item.id);
          sentToday++;
          dispatched++;
        } else {
          await supabaseAdmin
            .from('notification_queue')
            .update({ status: 'failed', error_msg: result.error || 'Fonnte API error' })
            .eq('id', item.id);
          failed++;
        }
      } catch (itemErr) {
        await supabaseAdmin
          .from('notification_queue')
          .update({ status: 'failed', error_msg: itemErr.message || 'Processing error' })
          .eq('id', item.id);
        failed++;
      }
    }

    // Persist updated daily counter
    if (dispatched > 0) {
      await supabaseAdmin
        .from('app_settings')
        .update({ setting_value: String(sentToday) })
        .eq('setting_key', 'FONNTE_SENT_TODAY');
    }

    const newRatio = sentToday / cfg.dailyLimit;
    return jsonResponse({
      dispatched,
      failed,
      usage_ratio: Math.round(newRatio * 1000) / 1000,
      daily_remaining: Math.max(0, cfg.dailyLimit - sentToday),
      night_window: isNightWindow,
    });
  } catch (err) {
    return errorResponse(err.message || 'Internal server error', 500);
  }
});
