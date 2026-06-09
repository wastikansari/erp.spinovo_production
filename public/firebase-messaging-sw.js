importScripts(
  "https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js",
);

firebase.initializeApp({
  apiKey: "AIzaSyAUhwXHGIVVu3MfIhf5lDrd9hZde-pjVI4",
  authDomain: "spinovo-customer-app.firebaseapp.com",
  projectId: "spinovo-customer-app",
  storageBucket: "spinovo-customer-app.firebasestorage.app",
  messagingSenderId: "673804462989",
  appId: "1:673804462989:web:89f4f01b8f0172ebdcebc4",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message received:', JSON.stringify(payload, null, 2));
  const title = payload.notification?.title || payload.data?.title || 'New Notification';
  const body = payload.notification?.body || payload.data?.body || '';
  console.log('[SW] Showing notification — title:', title, '| body:', body);
  self.registration.showNotification(title, {
    body,
    data: payload.data,
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if ("focus" in client) return client.focus();
        }
        if (clients.openWindow)
          return clients.openWindow("/dashboard/notifications");
      }),
  );
});
