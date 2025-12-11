const CACHE_NAME = 'wolf-traval-v5'; // تحديث الإصدار لضمان تحميل الأيقونات الجديدة
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap',
  // تأكد من أن هذا الرابط هو نفسه المستخدم في المانيفست
  'https://raw.githubusercontent.com/shehabt1000-boop/-/8feac62d11c707c07fd2d22afba278c69070d152/Wolf%20TraVal%20.jpg'
];

// 1. التثبيت
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. التفعيل وتنظيف القديم
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// 3. جلب البيانات (Fetch)
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  if (requestUrl.href.includes('firebase') || requestUrl.href.includes('firestore') || requestUrl.href.includes('googleapis')) {
    return;
  }

  // Share Target
  if (event.request.method === 'POST' && requestUrl.pathname.includes('share-target')) {
    event.respondWith(Response.redirect('./index.html?action=shared'));
    return;
  }

  // الصفحة الرئيسية
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('./index.html');
      })
    );
    return;
  }

  // الكاش أولاً للملفات
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// 4. Push Notification
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Wolf TraVal';
  const options = {
    body: data.body || 'لديك عرض جديد!',
    icon: 'https://raw.githubusercontent.com/shehabt1000-boop/-/8feac62d11c707c07fd2d22afba278c69070d152/Wolf%20TraVal%20.jpg',
    badge: 'https://raw.githubusercontent.com/shehabt1000-boop/-/8feac62d11c707c07fd2d22afba278c69070d152/Wolf%20TraVal%20.jpg',
    data: { url: data.url || '/' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// 5. Notification Click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data ? event.notification.data.url : '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// 6. Sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offers') {
    console.log('Background Syncing Offers...');
  }
});

// 7. Periodic Sync
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-offers-check') {
    console.log('Periodic Sync Check...');
  }
});