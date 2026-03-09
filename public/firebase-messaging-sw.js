importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDjmWYMd8r1mcGJhDbyV4NzU7JNyHNF4ow",
  authDomain: "westside-crm.firebaseapp.com",
  projectId: "westside-crm",
  storageBucket: "westside-crm.firebasestorage.app",
  messagingSenderId: "980085644101",
  appId: "1:980085644101:web:cd13a0158c5c832f743c2c"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: '/android-chrome-192x192.png',
    badge: '/android-chrome-192x192.png',
    data: payload.data,
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/crm';
  event.waitUntil(clients.openWindow(url));
});
