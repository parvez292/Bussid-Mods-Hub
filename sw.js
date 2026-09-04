/* ═══════════════════════════════════════════════
   Bussid Mods Hub — Service Worker
   - Offline caching for the PWA shell
   - Firebase Cloud Messaging background push notifications
   ═══════════════════════════════════════════════ */

const CACHE_NAME = 'bussid-mods-v5.4.1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});

/* ═══════════════════════════════════════════════
   FIREBASE CLOUD MESSAGING — background push
   This lets the app show a real OS-level notification even when
   the app/tab isn't open, AS LONG AS a server (Cloud Function or
   other backend) actually sends the push via FCM. This service
   worker only handles RECEIVING and DISPLAYING it.
   ═══════════════════════════════════════════════ */
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCTxSS7k6R3aA3kWR6r6YUWzrNkahjptwQ",
  authDomain: "bussid-mods-hub.firebaseapp.com",
  projectId: "bussid-mods-hub",
  storageBucket: "bussid-mods-hub.firebasestorage.app",
  messagingSenderId: "235067322832",
  appId: "1:235067322832:web:2bbcf9f37c92487e32c9d5"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = (payload.notification && payload.notification.title) || (payload.data && payload.data.title) || 'Bussid Mods Hub';
  const body = (payload.notification && payload.notification.body) || (payload.data && payload.data.body) || '';
  const clickUrl = (payload.data && payload.data.click_action) || './index.html';

  self.registration.showNotification(title, {
    body,
    icon: './icon-192.png',
    badge: './icon-192.png',
    data: { url: clickUrl },
    vibrate: [120, 60, 120]
  });
});

// Tapping the notification focuses an existing tab if one is open,
// otherwise opens a new one.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || './index.html';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
