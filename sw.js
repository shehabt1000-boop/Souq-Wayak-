const CACHE_NAME = 'wolf-traval-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Clearing old cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Fetch Event - Cache First Strategy
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch new
      return response || fetch(event.request);
    })
  );
});


// =========================================================
// إضافة دعم الإشعارات الخارجية (Push Notifications)
// =========================================================

self.addEventListener('push', (event) => {
  let data;
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: 'Wolf TraVal | تنبيه', body: 'يوجد تحديث جديد في الرحلات!', url: '/' };
  }
  
  const title = data.title || 'Wolf TraVal';
  const options = {
    body: data.body || 'لا تفوت أحدث العروض!',
    icon: 'https://img.icons8.com/fluency/512/airplane-take-off.png', // استخدم أيقونة مناسبة
    badge: 'https://img.icons8.com/fluency/512/Wolf.png', // أيقونة صغيرة
    tag: 'trip-update-notification',
    data: {
        url: data.url || '/' 
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// حدث النقر على الإشعار
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const targetUrl = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // إذا لم يكن هناك نافذة مفتوحة تطابق، افتح نافذة جديدة
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});