// Service Worker for Web Push Notifications
// CRM Enterprise V3

const CACHE_NAME = 'crm-v3-cache-v1'
const STATIC_CACHE_NAME = 'crm-v3-static-v1'

// Install event - Cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...')
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets')
      return cache.addAll([
        '/',
        '/manifest.json',
      ])
    })
  )
  self.skipWaiting()
})

// Activate event - Clean old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME
          })
          .map((cacheName) => {
            console.log('[Service Worker] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          })
      )
    })
  )
  return self.clients.claim()
})

// Push event - Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event)

  let notificationData = {
    title: 'CRM Bildirimi',
    body: 'Yeni bir bildiriminiz var',
    icon: '/icon-192x192.png',
    badge: '/icon-96x96.png',
    tag: 'crm-notification',
    data: {},
  }

  if (event.data) {
    try {
      const data = event.data.json()
      notificationData = {
        title: data.title || notificationData.title,
        body: data.message || data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        tag: data.tag || data.id || notificationData.tag,
        data: {
          url: data.url || data.link || '/',
          relatedTo: data.relatedTo,
          relatedId: data.relatedId,
          type: data.type || 'info',
        },
        requireInteraction: data.priority === 'high' || data.priority === 'critical',
        vibrate: data.priority === 'critical' ? [200, 100, 200] : [200],
        timestamp: Date.now(),
      }
    } catch (e) {
      console.error('[Service Worker] Error parsing push data:', e)
      notificationData.body = event.data.text() || notificationData.body
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      requireInteraction: notificationData.requireInteraction,
      vibrate: notificationData.vibrate,
      timestamp: notificationData.timestamp,
      actions: notificationData.data.url
        ? [
            {
              action: 'open',
              title: 'Aç',
            },
            {
              action: 'close',
              title: 'Kapat',
            },
          ]
        : [],
    })
  )
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event)

  event.notification.close()

  if (event.action === 'close') {
    return
  }

  const urlToOpen = event.notification.data?.url || '/'

  event.waitUntil(
    clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // Eğer açık bir pencere varsa, ona odaklan
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i]
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus()
          }
        }
        // Yoksa yeni pencere aç
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
  )
})

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification closed:', event)
})

// Message event - Handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data)

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})


// CRM Enterprise V3

const CACHE_NAME = 'crm-v3-cache-v1'
const STATIC_CACHE_NAME = 'crm-v3-static-v1'

// Install event - Cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...')
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets')
      return cache.addAll([
        '/',
        '/manifest.json',
      ])
    })
  )
  self.skipWaiting()
})

// Activate event - Clean old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME
          })
          .map((cacheName) => {
            console.log('[Service Worker] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          })
      )
    })
  )
  return self.clients.claim()
})

// Push event - Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event)

  let notificationData = {
    title: 'CRM Bildirimi',
    body: 'Yeni bir bildiriminiz var',
    icon: '/icon-192x192.png',
    badge: '/icon-96x96.png',
    tag: 'crm-notification',
    data: {},
  }

  if (event.data) {
    try {
      const data = event.data.json()
      notificationData = {
        title: data.title || notificationData.title,
        body: data.message || data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        tag: data.tag || data.id || notificationData.tag,
        data: {
          url: data.url || data.link || '/',
          relatedTo: data.relatedTo,
          relatedId: data.relatedId,
          type: data.type || 'info',
        },
        requireInteraction: data.priority === 'high' || data.priority === 'critical',
        vibrate: data.priority === 'critical' ? [200, 100, 200] : [200],
        timestamp: Date.now(),
      }
    } catch (e) {
      console.error('[Service Worker] Error parsing push data:', e)
      notificationData.body = event.data.text() || notificationData.body
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      requireInteraction: notificationData.requireInteraction,
      vibrate: notificationData.vibrate,
      timestamp: notificationData.timestamp,
      actions: notificationData.data.url
        ? [
            {
              action: 'open',
              title: 'Aç',
            },
            {
              action: 'close',
              title: 'Kapat',
            },
          ]
        : [],
    })
  )
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event)

  event.notification.close()

  if (event.action === 'close') {
    return
  }

  const urlToOpen = event.notification.data?.url || '/'

  event.waitUntil(
    clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // Eğer açık bir pencere varsa, ona odaklan
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i]
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus()
          }
        }
        // Yoksa yeni pencere aç
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
  )
})

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification closed:', event)
})

// Message event - Handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data)

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

