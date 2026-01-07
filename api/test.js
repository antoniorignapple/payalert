import { getSupabase, jsonResponse, errorResponse } from '../_supabase.js';
import webpush from 'web-push';

// Use Node.js runtime (web-push requires it)
export const config = {
  runtime: 'nodejs',
  maxDuration: 10,
};

export default async function handler(request) {
  // Only allow POST
  if (request.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  // Verify cron secret (reuse for security)
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return errorResponse('CRON_SECRET not configured', 500);
  }

  const url = new URL(request.url);
  const querySecret = url.searchParams.get('secret');

  if (querySecret !== cronSecret) {
    return errorResponse('Unauthorized', 401);
  }

  // Get device_id from query or body
  let deviceId = url.searchParams.get('device_id');
  
  if (!deviceId) {
    try {
      const body = await request.json();
      deviceId = body.device_id;
    } catch (e) {
      // ignore
    }
  }

  if (!deviceId) {
    return errorResponse('device_id is required', 400);
  }

  // Configure web-push
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

  if (!vapidPublicKey || !vapidPrivateKey) {
    return errorResponse('VAPID keys not configured', 500);
  }

  webpush.setVapidDetails(
    'mailto:admin@payalert.app',
    vapidPublicKey,
    vapidPrivateKey
  );

  try {
    const supabase = getSupabase();

    // Get push subscription for device
    const { data: subData, error: subError } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('device_id', deviceId)
      .maybeSingle();

    if (subError) {
      console.error('Supabase error:', subError.message);
      return errorResponse('Database error', 500);
    }

    if (!subData?.subscription) {
      return errorResponse('No push subscription found for this device', 404);
    }

    // Send test notification
    const payload = JSON.stringify({
      title: '🎉 Test PayAlert',
      body: 'Le notifiche funzionano correttamente!',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: {
        url: '/',
        test: true,
      },
    });

    await webpush.sendNotification(subData.subscription, payload);

    return jsonResponse({
      success: true,
      message: 'Test notification sent!',
      device_id: deviceId,
    });

  } catch (err) {
    console.error('Push error:', err.message);
    return errorResponse(`Push failed: ${err.message}`, 500);
  }
}