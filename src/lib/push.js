import { subscribePush } from './api';

/**
 * Check if push notifications are supported
 * @returns {boolean}
 */
export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Get current notification permission status
 * @returns {string} 'granted' | 'denied' | 'default'
 */
export function getPermissionStatus() {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Request notification permission
 * @returns {Promise<string>} Permission status
 */
export async function requestPermission() {
  if (!isPushSupported()) {
    throw new Error('Push notifications non supportate');
  }
  
  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * URL-safe base64 to Uint8Array (FIXED VERSION)
 * @param {string} base64String - Base64 URL-safe encoded string
 * @returns {Uint8Array}
 */
function urlBase64ToUint8Array(base64String) {
  // Add padding if needed
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  
  // Convert URL-safe base64 to standard base64
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  // Decode base64 to binary string
  const rawData = atob(base64);
  
  // Convert to Uint8Array
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

/**
 * Subscribe to push notifications
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function subscribeToNotifications() {
  if (!isPushSupported()) {
    return { success: false, message: 'Push notifications non supportate su questo browser' };
  }

  try {
    // Request permission first
    const permission = await requestPermission();
    
    if (permission !== 'granted') {
      return { success: false, message: 'Permesso notifiche negato' };
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;
    
    // VAPID public key - hardcoded for reliability
    const vapidPublicKey = 'BCHtq2xDB0GnAahvOEg4CMz3DV-5e8uf0Va57Qc5soe0nhEEI-XvIH0qIApAK7xS51zfFIjfP0N1yOnV259FZQ';
    
    console.log('Using VAPID key, length:', vapidPublicKey.length);

    // Convert and subscribe
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
    console.log('Converted key length:', applicationServerKey.length);

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey,
    });

    console.log('Subscription created:', subscription);

    // Send subscription to server
    await subscribePush(subscription);

    return { success: true, message: 'Notifiche attivate!' };
  } catch (error) {
    console.error('Push subscription error:', error);
    return { 
      success: false, 
      message: error.message || 'Errore durante l\'attivazione delle notifiche' 
    };
  }
}

/**
 * Check if currently subscribed to push
 * @returns {Promise<boolean>}
 */
export async function isSubscribed() {
  if (!isPushSupported()) return false;
  
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch {
    return false;
  }
}