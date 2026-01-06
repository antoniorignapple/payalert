import { v4 as uuidv4 } from 'uuid';

const DEVICE_ID_KEY = 'payalert_device_id';

/**
 * Get or create a unique device ID
 * @returns {string} The device UUID
 */
export function getDeviceId() {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  
  if (!deviceId) {
    deviceId = uuidv4();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  
  return deviceId;
}

/**
 * Get shortened device ID for display
 * @returns {string} First 8 characters of device ID
 */
export function getShortDeviceId() {
  return getDeviceId().substring(0, 8);
}
