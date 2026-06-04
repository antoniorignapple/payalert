import { getSupabase } from '../_supabase.js';
import webpush from 'web-push';

export const config = {
  runtime: 'nodejs',
  maxDuration: 30,
};

function getDaysUntil(dueDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + 'T00:00:00');
  return Math.round((due - today) / (1000 * 60 * 60 * 24));
}

// Evening run handles upcoming reminders (7/3/1 days before).
// Morning run handles same-day reminders (0 days).
function getReminderKind(daysUntil, mode) {
  if (mode === 'evening') {
    if (daysUntil === 7) return 'd7';
    if (daysUntil === 3) return 'd3';
    if (daysUntil === 1) return 'd1';
  }
  if (mode === 'morning') {
    if (daysUntil === 0) return 'd0';
  }
  return null;
}

export default async function handler(request, response) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return response.status(500).json({ error: 'CRON_SECRET not configured' });

  const { secret: querySecret, mode = 'evening' } = request.query;
  if (querySecret !== cronSecret) return response.status(401).json({ error: 'Unauthorized' });

  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  if (!vapidPublicKey || !vapidPrivateKey) return response.status(500).json({ error: 'VAPID keys not configured' });

  webpush.setVapidDetails('mailto:admin@payalert.app', vapidPublicKey, vapidPrivateKey);

  try {
    const supabase = getSupabase();
    const results = { mode, checked: 0, sent: 0, skipped: 0, errors: [] };

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const horizon = new Date(today); horizon.setDate(horizon.getDate() + 7);
    const toIso = (d) => d.toISOString().split('T')[0];

    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .eq('is_paid', false)
      .gte('due_date', toIso(today))
      .lte('due_date', toIso(horizon));

    if (error) return response.status(500).json({ error: 'Failed to fetch payments' });
    results.checked = payments?.length || 0;

    const fmtAmount = (cents) =>
      cents == null ? '' : ' · €' + (cents / 100).toLocaleString('it-IT', { minimumFractionDigits: 2 });

    for (const p of payments || []) {
      const daysUntil = getDaysUntil(p.due_date);
      const kind = getReminderKind(daysUntil, mode);
      if (!kind) continue;

      // dedupe
      const { data: existing } = await supabase
        .from('notification_log')
        .select('id')
        .eq('device_id', p.device_id)
        .eq('payment_id', p.id)
        .eq('kind', kind)
        .maybeSingle();
      if (existing) { results.skipped++; continue; }

      const { data: subData } = await supabase
        .from('push_subscriptions')
        .select('subscription')
        .eq('device_id', p.device_id)
        .maybeSingle();
      if (!subData?.subscription) { results.skipped++; continue; }

      const titleMap = {
        d7: '🗓️ Pagamento tra 7 giorni',
        d3: '🔔 Pagamento tra 3 giorni',
        d1: '⚠️ Pagamento domani',
        d0: '🚨 Pagamento oggi',
      };
      const whenMap = { d7: 'tra 7 giorni', d3: 'tra 3 giorni', d1: 'domani', d0: 'oggi' };

      const payload = JSON.stringify({
        title: titleMap[kind],
        body: `${p.title} scade ${whenMap[kind]}${fmtAmount(p.amount_cents)}`,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        data: { url: '/', paymentId: p.id },
      });

      try {
        await webpush.sendNotification(subData.subscription, payload);
        await supabase.from('notification_log').insert({ device_id: p.device_id, payment_id: p.id, kind });
        results.sent++;
      } catch (pushErr) {
        if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
          await supabase.from('push_subscriptions').delete().eq('device_id', p.device_id);
        }
        results.errors.push({ paymentId: p.id, error: pushErr.message });
      }
    }

    return response.status(200).json({ success: true, timestamp: new Date().toISOString(), results });
  } catch (err) {
    return response.status(500).json({ error: 'Internal server error' });
  }
}
