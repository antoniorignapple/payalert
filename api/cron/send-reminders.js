import { getSupabase, jsonResponse, errorResponse } from '../_supabase.js';

export const config = {
  runtime: 'edge',
};

// VAPID helper for web-push
const VAPID_SUBJECT = 'mailto:admin@payalert.app';

/**
 * Send web push notification
 */
async function sendPushNotification(subscription, payload) {
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

  if (!vapidPublicKey || !vapidPrivateKey) {
    throw new Error('VAPID keys not configured');
  }

  // Import web-push dynamically (not available in edge runtime natively)
  // For Vercel Edge, we need to use the fetch API with the push endpoint directly
  // This is a simplified implementation - for production, consider using a Node.js runtime

  const response = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      TTL: '86400',
      Urgency: 'normal',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Push failed: ${response.status}`);
  }

  return true;
}

/**
 * Calculate days until due date
 */
function getDaysUntil(dueDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + 'T00:00:00');
  const diffTime = due - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get reminder kind based on days until
 */
function getReminderKind(daysUntil) {
  if (daysUntil === 0) return 'd0';
  if (daysUntil === 1) return 'd1';
  if (daysUntil === 3) return 'd3';
  if (daysUntil === 7) return 'd7';
  return null;
}

export default async function handler(request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return errorResponse('CRON_SECRET not configured', 500);
  }

  // Check both Authorization header and query param (Vercel Cron uses header)
  const url = new URL(request.url);
  const querySecret = url.searchParams.get('secret');
  const headerSecret = authHeader?.replace('Bearer ', '');

  if (headerSecret !== cronSecret && querySecret !== cronSecret) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const supabase = getSupabase();
    const results = {
      checked: 0,
      sent: 0,
      skipped: 0,
      errors: [],
    };

    // Get all payments with due dates in the reminder window
    const today = new Date();
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 7);

    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .gte('due_date', today.toISOString().split('T')[0])
      .lte('due_date', maxDate.toISOString().split('T')[0]);

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError.message);
      return errorResponse('Failed to fetch payments', 500);
    }

    results.checked = payments?.length || 0;

    // Process each payment
    for (const payment of payments || []) {
      const daysUntil = getDaysUntil(payment.due_date);
      const kind = getReminderKind(daysUntil);

      if (!kind) continue; // Not a reminder day

      // Check if notification already sent
      const { data: existingLog } = await supabase
        .from('notification_log')
        .select('id')
        .eq('device_id', payment.device_id)
        .eq('payment_id', payment.id)
        .eq('kind', kind)
        .single();

      if (existingLog) {
        results.skipped++;
        continue;
      }

      // Get push subscription for device
      const { data: subscription } = await supabase
        .from('push_subscriptions')
        .select('subscription')
        .eq('device_id', payment.device_id)
        .single();

      if (!subscription) {
        results.skipped++;
        continue;
      }

      // Prepare notification payload
      const dueDate = new Date(payment.due_date + 'T00:00:00');
      const formattedDate = dueDate.toLocaleDateString('it-IT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });

      const titleMap = {
        d7: '⏰ Promemoria pagamento',
        d3: '⚠️ Pagamento in arrivo',
        d1: '🔔 Pagamento domani',
        d0: '🚨 Pagamento oggi',
      };

      const payload = {
        title: titleMap[kind],
        body: `${payment.title} scade ${kind === 'd0' ? 'oggi' : formattedDate}`,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        data: {
          url: '/',
          paymentId: payment.id,
        },
      };

      try {
        // Try to send push (this is simplified - see note above)
        await sendPushNotification(subscription.subscription, payload);

        // Log the sent notification
        await supabase.from('notification_log').insert({
          device_id: payment.device_id,
          payment_id: payment.id,
          kind,
        });

        results.sent++;
      } catch (pushError) {
        results.errors.push({
          paymentId: payment.id,
          error: pushError.message,
        });
      }
    }

    return jsonResponse({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (err) {
    console.error('Cron error:', err.message);
    return errorResponse('Internal server error', 500);
  }
}
