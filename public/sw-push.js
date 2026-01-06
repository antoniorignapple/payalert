/// <reference lib="webworker" />

// This service worker handles push notifications
// It's imported by the PWA plugin's service worker

self.addEventListener('push', (event) => {
  if (!event.data) {
    console.log('Push event but no data');
    return;
  }

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    data = {
      title: 'PayAlert',
      body: event.data.text(),
    };
  }

  const options = {
    body: data.body || 'Nuovo promemoria',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    vibrate: [100, 50, 100],
    data: data.data || { url: '/' },
    actions: [
      {
        action: 'open',
        title: 'Apri',
      },
      {
        action: 'dismiss',
        title: 'Ignora',
      },
    ],
    tag: data.data?.paymentId || 'payalert-notification',
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'PayAlert', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if (client.navigate) {
            client.navigate(urlToOpen);
          }
          return;
        }
      }
      // Open new window if none found
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed', event.notification.tag);
});
