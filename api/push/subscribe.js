import { getSupabase, jsonResponse, errorResponse, handleCors } from '../_supabase.js';

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  // Handle CORS
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  if (request.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    const body = await request.json();
    const { device_id, subscription } = body;

    if (!device_id || !subscription) {
      return errorResponse('device_id and subscription are required', 400);
    }

    // Validate subscription object has required fields
    if (!subscription.endpoint || !subscription.keys) {
      return errorResponse('Invalid subscription object', 400);
    }

    const supabase = getSupabase();

    // Upsert: update if exists, insert if not
    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          device_id,
          subscription,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'device_id',
          ignoreDuplicates: false,
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error.message);
      return errorResponse('Failed to save subscription', 500);
    }

    return jsonResponse({ success: true, id: data.id });
  } catch (err) {
    console.error('API error:', err.message);
    return errorResponse('Internal server error', 500);
  }
}
