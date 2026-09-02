// Firebase Cloud Messaging Service Worker for background push notifications
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// Initialize Firebase inside the Service Worker
firebase.initializeApp({
  apiKey: "AIzaSyBYSp8NGhg_CXDhbGqc74jW58PfQjS3wEI",
  authDomain: "saltdistribute-2026.firebaseapp.com",
  projectId: "saltdistribute-2026",
  storageBucket: "saltdistribute-2026.firebasestorage.app",
  messagingSenderId: "307526299576",
  appId: "1:307526299576:web:d5cf416af5f366fd87a94d",
});

const messaging = firebase.messaging();

// Handle background push messages
messaging.onBackgroundMessage((payload) => {
  console.log("[FCM-SW] Received background push message:", payload);
  
  const notificationTitle = payload.notification?.title || payload.data?.title || "SaltDistribute Update";
  const notificationBody = payload.notification?.body || payload.data?.body || "Ada pembaruan status pesanan garam Anda.";
  
  const notificationOptions = {
    body: notificationBody,
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    vibrate: [200, 100, 200],
    data: {
      url: payload.data?.url || "/",
      bookingId: payload.data?.bookingId || null,
      ...payload.data,
    },
    actions: [
      { action: "open", title: "Buka Aplikasi" },
      { action: "close", title: "Tutup" },
    ],
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Notification click event handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  
  if (event.action === "close") {
    return;
  }

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open, focus it
      for (const client of windowClients) {
        if ("focus" in client) {
          if (client.url.includes(self.registration.scope)) {
            return client.focus();
          }
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
