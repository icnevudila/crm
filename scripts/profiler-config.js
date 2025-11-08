/**
 * React Profiler Configuration
 * Performans ölçümleri için React Profiler setup
 */

export const profilerConfig = {
  // Profiler ayarları
  onRenderCallback: (id, phase, actualDuration) => {
    // Production'da console.log'u kaldır, sadece development'ta kullan
    if (process.env.NODE_ENV === 'development') {
      console.log('Component:', id, 'Phase:', phase, 'Duration:', actualDuration.toFixed(2), 'ms')
    }
  },
  
  // Performance threshold'ları
  thresholds: {
    // Component render < 16ms (60fps)
    componentRender: 16,
    // Page load < 500ms
    pageLoad: 500,
    // Route transition < 300ms
    routeTransition: 300,
  },
}







