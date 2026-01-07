import { getSupabase, jsonResponse, errorResponse } from '../_supabase.js';
import webpush from 'web-push';

export const config = {
  runtime: 'nodejs',
  maxDuration: 30,
};

function getDaysUntil(dueDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + 'T00:00:00');
  const diffTime = due - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getReminderKind(daysUntil, mode) {
  // mode: 'afternoon' (15:00), 'evening' (20:00), 'morning' (09:00)
  
  if (mode === 'afternoon' && daysUntil === 1) return 'd1_afternoon';
  if (mode === 'evening' && daysUntil === 1) return 'd1_evening';
  if (mode === 'morning' && daysUntil === 0) return 'd0_morning';
  
  return null;
}

export default async function handler(request, response) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return response.status(500).json({ error: 'CRON_SECRET not configured' });
  }

  const { secret: querySecret, mode = 'morning' } = request.query;

  if (querySecret !== cronSecret) {
    return response.status(401).json({ error: 'Unauthorized' });
  }

  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

  if (!vapidPublicKey || !vapidPrivateKey) {
    return response.status(500).json({ error: 'VAPID keys not configured' });
  }

  webpush.setVapidDetails(
    'mailto:admin@payalert.app',
    vapidPublicKey,
    vapidPrivateKey
  );

  try {
    const supabase = getSupabase();
    const results = { checked: 0, sent: 0, skipped: 0, errors: [] };

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('is_paid', false)
      .gte('due_date', today.toISOString().split('T')[0])
      .lte('due_date', tomorrow.toISOString().split('T')[0]);

    if (paymentsError) {
      return response.status(500).json({ error: 'Failed to fetch payments' });
    }

    results.checked = payments?.length || 0;

    for (const payment of payments || []) {
      const daysUntil = getDaysUntil(payment.due_date);
      const kind = getReminderKind(daysUntil, mode);

      if (!kind) continue;

      const { data: existingLog } = await supabase
        .from('notification_log')
        .select('id')
        .eq('device_id', payment.device_id)
        .eq('payment_id', payment.id)
        .eq('kind', kind)
        .maybeSingle();

      if (existingLog) {
        results.skipped++;
        continue;
      }

      const { data: subData } = await supabase
        .from('push_subscriptions')
        .select('subscription')
        .eq('device_id', payment.device_id)
        .maybeSingle();

      if (!subData?.subscription) {
        results.skipped++;
        continue;
      }

      const titleMap = {
        d1_afternoon: '🔔 Pagamento domani',
        d1_evening: '⚠️ Ricorda: pagamento domani',
        d0_morning: '🚨 Pagamento oggi',
      };

      const bodyMap = {
        d1_afternoon: `${payment.title} scade domani`,
        d1_evening: `${payment.title} scade domani`,
        d0_morning: `${payment.title} scade oggi`,
      };

      const payload = JSON.stringify({
        title: titleMap[kind],
        body: bodyMap[kind],
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        data: { url: '/', paymentId: payment.id },
      });

      try {
        await webpush.sendNotification(subData.subscription, payload);

        await supabase.from('notification_log').insert({
          device_id: payment.device_id,
          payment_id: payment.id,
          kind,
        });

        results.sent++;
      } catch (pushError) {
        if (pushError.statusCode === 410 || pushError.statusCode === 404) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('device_id', payment.device_id);
        }
        results.errors.push({ paymentId: payment.id, error: pushError.message });
      }
    }

    return response.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      mode,
      results,
    });
  } catch (err) {
    return response.status(500).json({ error: 'Internal server error' });
  }
}