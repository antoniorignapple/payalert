import { getSupabase, jsonResponse, errorResponse } from '../_supabase.js';
import webpush from 'web-push';

export const config = {
  runtime: 'nodejs',
  maxDuration: 10,
};

export default async function handler(request, response) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return response.status(500).json({ error: 'CRON_SECRET not configured' });
  }

  // Get query params from request.query (Node.js style)
  const { secret: querySecret, device_id: deviceId } = request.query;

  if (querySecret !== cronSecret) {
    return response.status(401).json({ error: 'Unauthorized' });
  }

  if (!deviceId) {
    return response.status(400).json({ error: 'device_id is required' });
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

    const { data: subData, error: subError } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('device_id', deviceId)
      .maybeSingle();

    if (subError) {
      return response.status(500).json({ error: 'Database error' });
    }

    if (!subData?.subscription) {
      return response.status(404).json({ error: 'No push subscription found for this device' });
    }

    const payload = JSON.stringify({
      title: '🎉 Test PayAlert',
      body: 'Le notifiche funzionano correttamente!',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: '/', test: true },
    });

    await webpush.sendNotification(subData.subscription, payload);

    return response.status(200).json({
      success: true,
      message: 'Test notification sent!',
      device_id: deviceId,
    });

  } catch (err) {
    console.error('Push error:', err.message);
    return response.status(500).json({ error: `Push failed: ${err.message}` });
  }
}