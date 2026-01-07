import { getSupabase, jsonResponse, errorResponse, handleCors } from './_supabase.js';

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  // Handle CORS
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  const url = new URL(request.url);
  const method = request.method;

  try {
    const supabase = getSupabase();

    // GET /api/payments?device_id=...
    if (method === 'GET') {
      const deviceId = url.searchParams.get('device_id');

      if (!deviceId) {
        return errorResponse('device_id is required', 400);
      }

      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('device_id', deviceId)
        .order('due_date', { ascending: true });

      if (error) {
        console.error('Supabase error:', error.message);
        return errorResponse('Database error', 500);
      }

      return jsonResponse(data);
    }

    // POST /api/payments
    if (method === 'POST') {
      const body = await request.json();
      const { device_id, title, due_date, amount_cents, notes } = body;

      if (!device_id || !title || !due_date) {
        return errorResponse('device_id, title, and due_date are required', 400);
      }

      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(due_date)) {
        return errorResponse('Invalid date format. Use YYYY-MM-DD', 400);
      }

      const { data, error } = await supabase
        .from('payments')
        .insert({
          device_id,
          title: title.trim(),
          due_date,
          amount_cents: amount_cents || null,
          notes: notes || null,
          is_paid: false,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error.message);
        return errorResponse('Failed to create payment', 500);
      }

      return jsonResponse(data, 201);
    }

    // PUT /api/payments - Update payment
    if (method === 'PUT') {
      const body = await request.json();
      const { id, device_id, title, due_date, amount_cents, notes, is_paid } = body;

      if (!id || !device_id) {
        return errorResponse('id and device_id are required', 400);
      }

      // Build update object with only provided fields
      const updateData = {};
      if (title !== undefined) updateData.title = title.trim();
      if (due_date !== undefined) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(due_date)) {
          return errorResponse('Invalid date format. Use YYYY-MM-DD', 400);
        }
        updateData.due_date = due_date;
      }
      if (amount_cents !== undefined) updateData.amount_cents = amount_cents;
      if (notes !== undefined) updateData.notes = notes;
      if (is_paid !== undefined) updateData.is_paid = is_paid;

      const { data, error } = await supabase
        .from('payments')
        .update(updateData)
        .eq('id', id)
        .eq('device_id', device_id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error.message);
        return errorResponse('Failed to update payment', 500);
      }

      return jsonResponse(data);
    }

    // DELETE /api/payments?id=...&device_id=...
    if (method === 'DELETE') {
      const paymentId = url.searchParams.get('id');
      const deviceId = url.searchParams.get('device_id');

      if (!paymentId || !deviceId) {
        return errorResponse('id and device_id are required', 400);
      }

      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', paymentId)
        .eq('device_id', deviceId);

      if (error) {
        console.error('Supabase error:', error.message);
        return errorResponse('Failed to delete payment', 500);
      }

      return jsonResponse({ success: true });
    }

    return errorResponse('Method not allowed', 405);
  } catch (err) {
    console.error('API error:', err.message);
    return errorResponse('Internal server error', 500);
  }
}