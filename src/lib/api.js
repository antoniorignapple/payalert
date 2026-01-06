import { getDeviceId } from './device';

const API_BASE = '/api';

/**
 * Custom API Error
 */
export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      throw new ApiError(
        data?.error || `HTTP Error ${response.status}`,
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error.message || 'Errore di rete',
      0,
      null
    );
  }
}

/**
 * Fetch all payments for current device
 * @returns {Promise<Array>} List of payments
 */
export async function getPayments() {
  const deviceId = getDeviceId();
  try {
    const result = await apiFetch(`/payments?device_id=${encodeURIComponent(deviceId)}`);
    // Ensure we always return an array
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error('Failed to fetch payments:', error);
    throw error;
  }
}

/**
 * Create a new payment
 * @param {Object} payment - Payment data
 * @param {string} payment.title - Payment title
 * @param {string} payment.due_date - Due date (YYYY-MM-DD)
 * @param {number} [payment.amount_cents] - Amount in cents
 * @param {string} [payment.notes] - Optional notes
 * @returns {Promise<Object>} Created payment
 */
export async function createPayment({ title, due_date, amount_cents, notes }) {
  const deviceId = getDeviceId();
  
  return apiFetch('/payments', {
    method: 'POST',
    body: JSON.stringify({
      device_id: deviceId,
      title,
      due_date,
      amount_cents: amount_cents || null,
      notes: notes || null,
    }),
  });
}

/**
 * Delete a payment
 * @param {string} paymentId - Payment UUID
 * @returns {Promise<Object>} Response
 */
export async function deletePayment(paymentId) {
  const deviceId = getDeviceId();
  
  return apiFetch(`/payments?id=${encodeURIComponent(paymentId)}&device_id=${encodeURIComponent(deviceId)}`, {
    method: 'DELETE',
  });
}

/**
 * Subscribe to push notifications
 * @param {PushSubscription} subscription - Web Push subscription object
 * @returns {Promise<Object>} Response
 */
export async function subscribePush(subscription) {
  const deviceId = getDeviceId();
  
  return apiFetch('/push/subscribe', {
    method: 'POST',
    body: JSON.stringify({
      device_id: deviceId,
      subscription: subscription.toJSON(),
    }),
  });
}

/**
 * Convert euros to cents
 * @param {string|number} euros - Amount in euros
 * @returns {number|null} Amount in cents or null
 */
export function eurosToCents(euros) {
  if (!euros && euros !== 0) return null;
  const parsed = parseFloat(String(euros).replace(',', '.'));
  if (isNaN(parsed)) return null;
  return Math.round(parsed * 100);
}

/**
 * Convert cents to euros string
 * @param {number} cents - Amount in cents
 * @returns {string} Formatted euro amount
 */
export function centsToEuros(cents) {
  if (cents === null || cents === undefined) return '';
  return (cents / 100).toFixed(2).replace('.', ',') + ' €';
}


