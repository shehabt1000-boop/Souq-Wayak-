const CACHE_NAME = 'wolf-traval-v2'; // قمت بتغيير الإصدار لتحديث الكاش عند المستخدمين
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap'
];

// 1. تثبيت التطبيق وتخزين الملفات الأساسية
self.addEventListener('install', (event) => {
  self.skipWaiting(); // تفعيل التحديث فوراً
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Wolf TraVal: Caching assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. تفعيل وحذف الكاش القديم
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Wolf TraVal: Clearing old cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// 3. استراتيجية جلب البيانات (Network First for HTML, Cache First for Assets)
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // استثناء طلبات Firebase والبيانات الديناميكية من الكاش لتجنب الأخطاء
  if (requestUrl.href.includes('firebase') || requestUrl.href.includes('firestore') || requestUrl.href.includes('googleapis')) {
    return; // دع المتصفح والـ SDK يتعاملون مع الشبكة مباشرة
  }

  // للصفحة الرئيسية (HTML): حاول جلب الأحدث من الشبكة، إذا فشل استخدم الكاش
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('./index.html');
      })
    );
    return;
  }

  // للملفات الثابتة (صور، خطوط، CSS): استخدم الكاش أولاً
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// 4. أهم جزء: ماذا يحدث عند الضغط على الإشعار؟
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked', event);
  
  event.notification.close(); // إغلاق الإشعار من شريط التنبيهات

  // جلب الرابط المرفق مع الإشعار (data.url) الذي وضعناه في ملف HTML
  const urlToOpen = event.notification.data ? event.notification.data.url : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // إذا كان التطبيق مفتوحاً بالفعل، قم بالتركيز عليه
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // إذا لم يكن مفتوحاً، افتح نافذة جديدة
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});