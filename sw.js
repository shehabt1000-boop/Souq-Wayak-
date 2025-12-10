const CACHE_NAME = 'wolf-traval-v3'; // تغيير الرقم لتحديث الصورة الجديدة عند المستخدمين
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap',
  // تمت إضافة رابط صورتك هنا لكي يتم تحميلها بسرعة
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

  // تجاهل كاش فايربيس
  if (requestUrl.href.includes('firebase') || requestUrl.href.includes('firestore') || requestUrl.href.includes('googleapis')) {
    return;
  }

  // للصفحة الرئيسية: حاول النت أولاً، ثم الكاش
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('./index.html');
      })
    );
    return;
  }

  // للملفات والصور: الكاش أولاً
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// 4. التعامل مع الضغط على الإشعار (مهم جداً لفتح التطبيق)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // الحصول على الرابط من بيانات الإشعار
  const urlToOpen = event.notification.data ? event.notification.data.url : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // إذا كان التطبيق مفتوحاً، ركز عليه
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // إذا كان مغلقاً، افتحه
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});