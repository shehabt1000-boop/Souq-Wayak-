// 1. استيراد مكتبات Firebase (ضروري لكي يعمل والنت مفصول أو التطبيق مغلق)
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// 2. إعدادات مشروعك الحقيقية (تم دمج البيانات التي أرسلتها)
const firebaseConfig = {
  apiKey: "AIzaSyCTo8DhvaAmNtV9OIgY5eLOeVgF7iQqlYk",
  authDomain: "faculty-of-commerce-2025.firebaseapp.com",
  databaseURL: "https://faculty-of-commerce-2025-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "faculty-of-commerce-2025",
  storageBucket: "faculty-of-commerce-2025.firebasestorage.app",
  messagingSenderId: "312259778835",
  appId: "1:312259778835:web:504299bb2de918596b62e6",
  measurementId: "G-QJZB7E2D5R"
};

// 3. تهيئة Firebase والمراسلة
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// 4. دالة التعامل مع الإشعارات في الخلفية (Background Handler)
// هذه الدالة هي المسؤولة عن إظهار الإشعار حتى لو التطبيق مغلق تماماً (Dead State)
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  // استخراج البيانات من الإشعار
  const notificationTitle = payload.notification.title || 'Wolf TraVal';
  const notificationOptions = {
    body: payload.notification.body,
    icon: 'https://raw.githubusercontent.com/shehabt1000-boop/-/8feac62d11c707c07fd2d22afba278c69070d152/Wolf%20TraVal%20.jpg', // أيقونة التطبيق
    badge: 'https://raw.githubusercontent.com/shehabt1000-boop/-/8feac62d11c707c07fd2d22afba278c69070d152/Wolf%20TraVal%20.jpg',
    // حفظ الرابط لفتحه عند الضغط
    data: { url: payload.data?.url || './index.html' } 
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// ====================================================
// إعدادات الكاش والـ PWA (App Capabilities)
// ====================================================

const CACHE_NAME = 'wolf-traval-v7'; // تم التحديث لضمان وصول التعديلات للمستخدمين
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap',
  'https://raw.githubusercontent.com/shehabt1000-boop/-/8feac62d11c707c07fd2d22afba278c69070d152/Wolf%20TraVal%20.jpg'
];

// تثبيت الـ Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// تفعيل وتنظيف الكاش القديم
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

// استراتيجية جلب البيانات (Network First for HTML, Cache First for Assets)
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // تجاهل طلبات Google/Firebase لأن المكتبة تتكفل بها
  if (requestUrl.href.includes('firebase') || requestUrl.href.includes('googleapis') || requestUrl.href.includes('firestore')) {
    return;
  }

  // ميزة Share Target (لو حد شارك حاجة لتطبيقك)
  if (event.request.method === 'POST' && requestUrl.pathname.includes('share-target')) {
    event.respondWith(Response.redirect('./index.html?action=shared'));
    return;
  }

  // للصفحات (HTML): حاول الاتصال بالإنترنت أولاً للحصول على أحدث نسخة
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('./index.html');
      })
    );
    return;
  }

  // للملفات (صور، CSS، JS): الكاش أولاً للسرعة
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// التعامل مع الضغط على الإشعار (مهم جداً لفتح التطبيق من الخلفية)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // جلب الرابط المراد فتحه من بيانات الإشعار
  const urlToOpen = (event.notification.data && event.notification.data.url) ? event.notification.data.url : './index.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // 1. إذا كان التطبيق مفتوحاً بالفعل، قم بالتركيز عليه
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // 2. إذا كان التطبيق مغلقاً، افتح نافذة جديدة
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// المزامنة الخلفية (Background Sync) - مطلوب للـ PWA القوي
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offers') {
    console.log('Syncing data in background...');
  }
});

// المزامنة الدورية (Periodic Sync)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-check') {
    console.log('Performing periodic check...');
  }
});