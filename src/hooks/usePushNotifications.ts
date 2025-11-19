'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  registerServiceWorker,
  requestNotificationPermission,
  createPushSubscription,
  getPushSubscription,
  unsubscribePush,
  savePushSubscription,
  removePushSubscription,
  testPushNotification,
} from '@/lib/push-notifications'

interface PushNotificationState {
  isSupported: boolean
  isRegistered: boolean
  permission: NotificationPermission
  isSubscribed: boolean
  isLoading: boolean
  error: string | null
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isRegistered: false,
    permission: 'default',
    isSubscribed: false,
    isLoading: true,
    error: null,
  })

  // Browser desteğini kontrol et
  useEffect(() => {
    const isSupported =
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window

    setState((prev) => ({
      ...prev,
      isSupported,
      permission: typeof window !== 'undefined' ? Notification.permission : 'default',
      isLoading: false,
    }))
  }, [])

  // Service Worker'ı kaydet ve subscription durumunu kontrol et
  useEffect(() => {
    if (!state.isSupported || state.isLoading) return

    let mounted = true

    const init = async () => {
      try {
        const registration = await registerServiceWorker()
        if (!mounted || !registration) return

        setState((prev) => ({ ...prev, isRegistered: !!registration }))

        // Mevcut subscription'ı kontrol et
        const subscription = await getPushSubscription(registration)
        if (mounted) {
          setState((prev) => ({ ...prev, isSubscribed: !!subscription }))
        }
      } catch (error: any) {
        if (mounted) {
          setState((prev) => ({
            ...prev,
            error: error?.message || 'Service Worker kayıt hatası',
          }))
        }
      }
    }

    init()

    return () => {
      mounted = false
    }
  }, [state.isSupported, state.isLoading])

  // Push notification'ı aktif et
  const enable = useCallback(async () => {
    if (!state.isSupported) {
      setState((prev) => ({
        ...prev,
        error: 'Browser push notifications desteklenmiyor',
      }))
      return false
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      // 1. İzin iste
      const permission = await requestNotificationPermission()
      if (permission !== 'granted') {
        setState((prev) => ({
          ...prev,
          permission,
          isLoading: false,
          error: 'Notification izni reddedildi',
        }))
        return false
      }

      // 2. Service Worker'ı kaydet
      const registration = await registerServiceWorker()
      if (!registration) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Service Worker kaydedilemedi',
        }))
        return false
      }

      // 3. Push subscription oluştur
      let subscription = await getPushSubscription(registration)
      if (!subscription) {
        subscription = await createPushSubscription(registration)
        if (!subscription) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: 'Push subscription oluşturulamadı',
          }))
          return false
        }
      }

      // 4. Subscription'ı API'ye kaydet
      const saved = await savePushSubscription(subscription)
      if (!saved) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Push subscription kaydedilemedi',
        }))
        return false
      }

      setState((prev) => ({
        ...prev,
        permission: 'granted',
        isRegistered: true,
        isSubscribed: true,
        isLoading: false,
        error: null,
      }))

      return true
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error?.message || 'Push notification aktifleştirme hatası',
      }))
      return false
    }
  }, [state.isSupported])

  // Push notification'ı devre dışı bırak
  const disable = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const registration = await navigator.serviceWorker.ready
      await unsubscribePush(registration)
      await removePushSubscription()

      setState((prev) => ({
        ...prev,
        isSubscribed: false,
        isLoading: false,
        error: null,
      }))

      return true
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error?.message || 'Push notification devre dışı bırakma hatası',
      }))
      return false
    }
  }, [])

  // Test push notification gönder
  const test = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const success = await testPushNotification()
      setState((prev) => ({ ...prev, isLoading: false }))
      return success
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error?.message || 'Test push notification hatası',
      }))
      return false
    }
  }, [])

  return {
    ...state,
    enable,
    disable,
    test,
  }
}



import { useEffect, useState, useCallback } from 'react'
import {
  registerServiceWorker,
  requestNotificationPermission,
  createPushSubscription,
  getPushSubscription,
  unsubscribePush,
  savePushSubscription,
  removePushSubscription,
  testPushNotification,
} from '@/lib/push-notifications'

interface PushNotificationState {
  isSupported: boolean
  isRegistered: boolean
  permission: NotificationPermission
  isSubscribed: boolean
  isLoading: boolean
  error: string | null
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isRegistered: false,
    permission: 'default',
    isSubscribed: false,
    isLoading: true,
    error: null,
  })

  // Browser desteğini kontrol et
  useEffect(() => {
    const isSupported =
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window

    setState((prev) => ({
      ...prev,
      isSupported,
      permission: typeof window !== 'undefined' ? Notification.permission : 'default',
      isLoading: false,
    }))
  }, [])

  // Service Worker'ı kaydet ve subscription durumunu kontrol et
  useEffect(() => {
    if (!state.isSupported || state.isLoading) return

    let mounted = true

    const init = async () => {
      try {
        const registration = await registerServiceWorker()
        if (!mounted || !registration) return

        setState((prev) => ({ ...prev, isRegistered: !!registration }))

        // Mevcut subscription'ı kontrol et
        const subscription = await getPushSubscription(registration)
        if (mounted) {
          setState((prev) => ({ ...prev, isSubscribed: !!subscription }))
        }
      } catch (error: any) {
        if (mounted) {
          setState((prev) => ({
            ...prev,
            error: error?.message || 'Service Worker kayıt hatası',
          }))
        }
      }
    }

    init()

    return () => {
      mounted = false
    }
  }, [state.isSupported, state.isLoading])

  // Push notification'ı aktif et
  const enable = useCallback(async () => {
    if (!state.isSupported) {
      setState((prev) => ({
        ...prev,
        error: 'Browser push notifications desteklenmiyor',
      }))
      return false
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      // 1. İzin iste
      const permission = await requestNotificationPermission()
      if (permission !== 'granted') {
        setState((prev) => ({
          ...prev,
          permission,
          isLoading: false,
          error: 'Notification izni reddedildi',
        }))
        return false
      }

      // 2. Service Worker'ı kaydet
      const registration = await registerServiceWorker()
      if (!registration) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Service Worker kaydedilemedi',
        }))
        return false
      }

      // 3. Push subscription oluştur
      let subscription = await getPushSubscription(registration)
      if (!subscription) {
        subscription = await createPushSubscription(registration)
        if (!subscription) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: 'Push subscription oluşturulamadı',
          }))
          return false
        }
      }

      // 4. Subscription'ı API'ye kaydet
      const saved = await savePushSubscription(subscription)
      if (!saved) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Push subscription kaydedilemedi',
        }))
        return false
      }

      setState((prev) => ({
        ...prev,
        permission: 'granted',
        isRegistered: true,
        isSubscribed: true,
        isLoading: false,
        error: null,
      }))

      return true
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error?.message || 'Push notification aktifleştirme hatası',
      }))
      return false
    }
  }, [state.isSupported])

  // Push notification'ı devre dışı bırak
  const disable = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const registration = await navigator.serviceWorker.ready
      await unsubscribePush(registration)
      await removePushSubscription()

      setState((prev) => ({
        ...prev,
        isSubscribed: false,
        isLoading: false,
        error: null,
      }))

      return true
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error?.message || 'Push notification devre dışı bırakma hatası',
      }))
      return false
    }
  }, [])

  // Test push notification gönder
  const test = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const success = await testPushNotification()
      setState((prev) => ({ ...prev, isLoading: false }))
      return success
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error?.message || 'Test push notification hatası',
      }))
      return false
    }
  }, [])

  return {
    ...state,
    enable,
    disable,
    test,
  }
}

