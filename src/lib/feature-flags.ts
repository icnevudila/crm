/**
 * Feature Flags - Güvenli özellik açma/kapama sistemi
 * 
 * Yeni özellikler eklerken mevcut sistemi bozmamak için feature flags kullanıyoruz.
 * Vercel'de environment variable olarak ayarlanır:
 * 
 * NEXT_PUBLIC_FEATURE_GLOBAL_SEARCH=true
 * NEXT_PUBLIC_FEATURE_SMART_SUGGESTIONS=false
 * 
 * Varsayılan: false (özellikler kapalı - güvenli)
 */

export const FEATURE_FLAGS = {
  // Global Search - Tüm modüllerde arama
  GLOBAL_SEARCH: process.env.NEXT_PUBLIC_FEATURE_GLOBAL_SEARCH === 'true',
  
  // Smart Suggestions - Akıllı öneriler widget'ı
  SMART_SUGGESTIONS: process.env.NEXT_PUBLIC_FEATURE_SMART_SUGGESTIONS === 'true',
  
  // Real-time Notifications - Gerçek zamanlı bildirimler
  REALTIME_NOTIFICATIONS: process.env.NEXT_PUBLIC_FEATURE_REALTIME_NOTIFICATIONS === 'true',
  
  // Activity Feed - Dashboard aktivite akışı
  ACTIVITY_FEED: process.env.NEXT_PUBLIC_FEATURE_ACTIVITY_FEED === 'true',
  
  // Notification Center - Üst menüde bildirim merkezi
  NOTIFICATION_CENTER: process.env.NEXT_PUBLIC_FEATURE_NOTIFICATION_CENTER === 'true',
  
  // Keyboard Shortcuts - Kısayollar ve command palette
  KEYBOARD_SHORTCUTS: process.env.NEXT_PUBLIC_FEATURE_KEYBOARD_SHORTCUTS === 'true',
} as const

/**
 * Feature flag kontrolü - Type-safe helper
 */
export function isFeatureEnabled(feature: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[feature] ?? false
}

/**
 * Development mode'da hangi feature'ların açık olduğunu göster
 */
if (process.env.NODE_ENV === 'development') {
  const enabledFeatures = Object.entries(FEATURE_FLAGS)
    .filter(([_, enabled]) => enabled)
    .map(([name]) => name)
  
  if (enabledFeatures.length > 0) {
    console.log('🚀 Enabled Features:', enabledFeatures.join(', '))
  }
}
