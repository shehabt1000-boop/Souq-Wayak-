const CACHE_NAME = 'wolf-traval-ultimate-v8';

// قائمة الملفات الكاملة للتخزين المؤقت (Offline)
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap',
  // الصور المطلوبة
  'https://raw.githubusercontent.com/shehabt1000-boop/-/8feac62d11c707c07fd2d22afba278c69070d152/Wolf%20TraVal%20.jpg',
  'https://raw.githubusercontent.com/shehabt1000-boop/Wolf-TraVal/6073c5902f1c027d11188f41f9196e7329a5bfac/Wolf.png',
  'https://raw.githubusercontent.com/shehabt1000-boop/Wolf-TraVal/6073c5902f1c027d11188f41f9196e7329a5bfac/Wolf2.png'
];

// ---------------------------
// 1. التثبيت (Install Event)
// ---------------------------
self.addEventListener('install', (event) => {
  self.skipWaiting(); // تفعيل فوري للكود الجديد
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching all assets for offline support');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// ---------------------------
// 2. التفعيل (Activate Event)
// ---------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// ---------------------------
// 3. جلب البيانات (Fetch & Offline Support)
// ---------------------------
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // >> ميزة Share Target: استقبال الملفات
  if (event.request.method === 'POST' && requestUrl.pathname.includes('/index.html')) {
    event.respondWith(
      Response.redirect('./index.html?share=success')
    );
    return;
  }

  // تجاهل الروابط الخارجية الديناميكية (مثل فايربيس)
  if (requestUrl.href.includes('firebase') || requestUrl.href.includes('firestore') || requestUrl.href.includes('googleapis')) {
    return;
  }

  // >> استراتيجية Offline Support الكاملة:
  // 1. للصفحات (HTML): حاول النت أولاً، لو فشل هات من الكاش، لو فشل اعرض الصفحة الرئيسية
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request).then((response) => {
          return response || caches.match('./index.html');
        });
      })
    );
    return;
  }

  // 2. للملفات (CSS, JS, Images): الكاش أولاً للسرعة، ثم النت
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// ---------------------------
// 4. الإشعارات (Push Notifications)
// ---------------------------
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received.');
  const data = event.data ? event.data.json() : {};
  
  const title = data.title || 'Wolf TraVal';
  const options = {
    body: data.body || 'عرض جديد متاح الآن!',
    icon: 'https://raw.githubusercontent.com/shehabt1000-boop/Wolf-TraVal/6073c5902f1c027d11188f41f9196e7329a5bfac/Wolf.png',
    badge: 'https://raw.githubusercontent.com/shehabt1000-boop/Wolf-TraVal/6073c5902f1c027d11188f41f9196e7329a5bfac/Wolf.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || './index.html' },
    actions: [
      { action: 'explore', title: 'مشاهدة العرض' },
      { action: 'close', title: 'إغلاق' }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// النقر على الإشعار
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'close') return;

  const urlToOpen = event.notification.data ? event.notification.data.url : './index.html';

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

// ---------------------------
// 5. Background Sync (مزامنة الخلفية)
// ---------------------------
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background Sync fired', event.tag);
  if (event.tag === 'sync-data') {
    // كود مزامنة البيانات
  }
});

// ---------------------------
// 6. Periodic Sync (مزامنة دورية)
// ---------------------------
self.addEventListener('periodicsync', (event) => {
  console.log('[Service Worker] Periodic Sync fired', event.tag);
  if (event.tag === 'daily-offers') {
    // كود تحديث المحتوى يومياً
  }
});