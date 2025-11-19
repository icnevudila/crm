/**
 * Web Push Notifications Helper
 * Browser Push API entegrasyonu için helper fonksiyonlar
 */

interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

/**
 * Service Worker'ı kaydet
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.warn('[Push] Service Worker desteklenmiyor')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    })

    console.log('[Push] Service Worker kaydedildi:', registration.scope)

    // Service Worker güncellemelerini kontrol et
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[Push] Yeni Service Worker yüklendi, sayfayı yenileyin')
          }
        })
      }
    })

    return registration
  } catch (error) {
    console.error('[Push] Service Worker kayıt hatası:', error)
    return null
  }
}

/**
 * Push notification izni iste
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('[Push] Browser notifications desteklenmiyor')
    return 'denied'
  }

  if (Notification.permission === 'granted') {
    return 'granted'
  }

  if (Notification.permission === 'denied') {
    console.warn('[Push] Notification izni reddedilmiş')
    return 'denied'
  }

  try {
    const permission = await Notification.requestPermission()
    console.log('[Push] Notification izni:', permission)
    return permission
  } catch (error) {
    console.error('[Push] Notification izni hatası:', error)
    return 'denied'
  }
}

/**
 * Push subscription oluştur
 */
export async function createPushSubscription(
  registration: ServiceWorkerRegistration
): Promise<PushSubscription | null> {
  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
      ),
    })

    console.log('[Push] Push subscription oluşturuldu:', subscription.endpoint)
    return subscription
  } catch (error) {
    console.error('[Push] Push subscription hatası:', error)
    return null
  }
}

/**
 * Push subscription'ı al (varsa)
 */
export async function getPushSubscription(
  registration: ServiceWorkerRegistration
): Promise<PushSubscription | null> {
  try {
    const subscription = await registration.pushManager.getSubscription()
    return subscription
  } catch (error) {
    console.error('[Push] Push subscription alma hatası:', error)
    return null
  }
}

/**
 * Push subscription'ı sil
 */
export async function unsubscribePush(
  registration: ServiceWorkerRegistration
): Promise<boolean> {
  try {
    const subscription = await registration.pushManager.getSubscription()
    if (subscription) {
      await subscription.unsubscribe()
      console.log('[Push] Push subscription silindi')
      return true
    }
    return false
  } catch (error) {
    console.error('[Push] Push subscription silme hatası:', error)
    return false
  }
}

/**
 * Push subscription'ı API'ye kaydet
 */
export async function savePushSubscription(
  subscription: PushSubscription
): Promise<boolean> {
  try {
    const subscriptionData: PushSubscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
        auth: arrayBufferToBase64(subscription.getKey('auth')!),
      },
    }

    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscriptionData),
    })

    if (!response.ok) {
      throw new Error('Push subscription kaydedilemedi')
    }

    console.log('[Push] Push subscription API\'ye kaydedildi')
    return true
  } catch (error) {
    console.error('[Push] Push subscription kayıt hatası:', error)
    return false
  }
}

/**
 * Push subscription'ı API'den sil
 */
export async function removePushSubscription(): Promise<boolean> {
  try {
    const response = await fetch('/api/push/unsubscribe', {
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error('Push subscription silinemedi')
    }

    console.log('[Push] Push subscription API\'den silindi')
    return true
  } catch (error) {
    console.error('[Push] Push subscription silme hatası:', error)
    return false
  }
}

/**
 * VAPID public key'i Uint8Array'e çevir
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/**
 * ArrayBuffer'ı base64'e çevir
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}

/**
 * Push notification'ı test et
 */
export async function testPushNotification(): Promise<boolean> {
  try {
    const response = await fetch('/api/push/test', {
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error('Test push notification gönderilemedi')
    }

    console.log('[Push] Test push notification gönderildi')
    return true
  } catch (error) {
    console.error('[Push] Test push notification hatası:', error)
    return false
  }
}


 * Web Push Notifications Helper
 * Browser Push API entegrasyonu için helper fonksiyonlar
 */

interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

/**
 * Service Worker'ı kaydet
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.warn('[Push] Service Worker desteklenmiyor')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    })

    console.log('[Push] Service Worker kaydedildi:', registration.scope)

    // Service Worker güncellemelerini kontrol et
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[Push] Yeni Service Worker yüklendi, sayfayı yenileyin')
          }
        })
      }
    })

    return registration
  } catch (error) {
    console.error('[Push] Service Worker kayıt hatası:', error)
    return null
  }
}

/**
 * Push notification izni iste
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('[Push] Browser notifications desteklenmiyor')
    return 'denied'
  }

  if (Notification.permission === 'granted') {
    return 'granted'
  }

  if (Notification.permission === 'denied') {
    console.warn('[Push] Notification izni reddedilmiş')
    return 'denied'
  }

  try {
    const permission = await Notification.requestPermission()
    console.log('[Push] Notification izni:', permission)
    return permission
  } catch (error) {
    console.error('[Push] Notification izni hatası:', error)
    return 'denied'
  }
}

/**
 * Push subscription oluştur
 */
export async function createPushSubscription(
  registration: ServiceWorkerRegistration
): Promise<PushSubscription | null> {
  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
      ),
    })

    console.log('[Push] Push subscription oluşturuldu:', subscription.endpoint)
    return subscription
  } catch (error) {
    console.error('[Push] Push subscription hatası:', error)
    return null
  }
}

/**
 * Push subscription'ı al (varsa)
 */
export async function getPushSubscription(
  registration: ServiceWorkerRegistration
): Promise<PushSubscription | null> {
  try {
    const subscription = await registration.pushManager.getSubscription()
    return subscription
  } catch (error) {
    console.error('[Push] Push subscription alma hatası:', error)
    return null
  }
}

/**
 * Push subscription'ı sil
 */
export async function unsubscribePush(
  registration: ServiceWorkerRegistration
): Promise<boolean> {
  try {
    const subscription = await registration.pushManager.getSubscription()
    if (subscription) {
      await subscription.unsubscribe()
      console.log('[Push] Push subscription silindi')
      return true
    }
    return false
  } catch (error) {
    console.error('[Push] Push subscription silme hatası:', error)
    return false
  }
}

/**
 * Push subscription'ı API'ye kaydet
 */
export async function savePushSubscription(
  subscription: PushSubscription
): Promise<boolean> {
  try {
    const subscriptionData: PushSubscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
        auth: arrayBufferToBase64(subscription.getKey('auth')!),
      },
    }

    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscriptionData),
    })

    if (!response.ok) {
      throw new Error('Push subscription kaydedilemedi')
    }

    console.log('[Push] Push subscription API\'ye kaydedildi')
    return true
  } catch (error) {
    console.error('[Push] Push subscription kayıt hatası:', error)
    return false
  }
}

/**
 * Push subscription'ı API'den sil
 */
export async function removePushSubscription(): Promise<boolean> {
  try {
    const response = await fetch('/api/push/unsubscribe', {
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error('Push subscription silinemedi')
    }

    console.log('[Push] Push subscription API\'den silindi')
    return true
  } catch (error) {
    console.error('[Push] Push subscription silme hatası:', error)
    return false
  }
}

/**
 * VAPID public key'i Uint8Array'e çevir
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/**
 * ArrayBuffer'ı base64'e çevir
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}

/**
 * Push notification'ı test et
 */
export async function testPushNotification(): Promise<boolean> {
  try {
    const response = await fetch('/api/push/test', {
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error('Test push notification gönderilemedi')
    }

    console.log('[Push] Test push notification gönderildi')
    return true
  } catch (error) {
    console.error('[Push] Test push notification hatası:', error)
    return false
  }
}

