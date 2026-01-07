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
 * URL-safe base64 to Uint8Array
 * @param {string} base64String - Base64 encoded string
 * @returns {Uint8Array}
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
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
    
    // Get VAPID public key from env
    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    
    // DEBUG: Log the key
    console.log('VAPID from env:', vapidPublicKey);
    console.log('Type:', typeof vapidPublicKey);
    console.log('Length:', vapidPublicKey ? vapidPublicKey.length : 'undefined');
    
    if (!vapidPublicKey) {
      console.error('VAPID public key not configured');
      return { success: false, message: 'Configurazione push non completa' };
    }

    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

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