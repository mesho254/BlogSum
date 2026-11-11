import axiosInstance from '../axiosConfig';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new (window.Uint8Array)(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push messaging is not supported in this browser');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    return registration;
  } catch (error) {
    console.warn('Service Worker registration failed:', error);
    return null;
  }
}

export async function subscribeToPushNotifications(userToken) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { success: false, reason: 'unsupported' };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, reason: 'denied' };
    }

    const registration = await navigator.serviceWorker.ready;
    const { data } = await axiosInstance.get('/api/notifications/vapid-public-key');
    const vapidPublicKey = data?.publicKey;

    if (!vapidPublicKey) {
      return { success: false, reason: 'missing_key' };
    }

    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey,
    });

    await axiosInstance.post(
      '/api/notifications/push-subscribe',
      { subscription },
      { headers: { Authorization: `Bearer ${userToken}` } }
    );

    return { success: true };
  } catch (err) {
    console.error('Error subscribing to push notifications:', err);
    return { success: false, error: err.message };
  }
}
