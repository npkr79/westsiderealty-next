// Push notifications disabled
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/crm';
  event.waitUntil(clients.openWindow(url));
});
