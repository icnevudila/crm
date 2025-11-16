'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { useSession } from '@/hooks/useSession'
import { createClientSupabase } from '@/lib/supabase'

interface KPIData {
  totalSales: number
  totalQuotes: number
  successRate: number
  activeCompanies: number
  recentActivity: number
  totalInvoices: number
  monthlyKPIs?: Array<{
    month: string
    sales: number
    quotes: number
    invoices: number
    deals: number
    acceptedQuotes: number
  }>
}

/**
 * Supabase Realtime ile KPI'ları dinle
 * Invoice, Quote, ActivityLog tablolarında değişiklik olduğunda otomatik güncellenir
 * OPTİMİZE: Realtime subscription lazy - sadece gerekli olduğunda aktif
 */
export function useRealtimeKPIs(initialData: KPIData) {
  const { data: session } = useSession()
  const [kpis, setKpis] = useState<KPIData>(initialData)
  const channelsRef = useRef<any[]>([])
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Initial data'yı serialize edip karşılaştır (deep compare için)
  const initialDataKey = useMemo(() => {
    return JSON.stringify(initialData)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]) // initialData objesi referans olarak değiştiğinde güncelle

  useEffect(() => {
    // Sadece gerçek değer değişikliği olduğunda güncelle
    setKpis(initialData)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDataKey])

  useEffect(() => {
    if (!session?.user?.companyId) return

    // Realtime subscription'ı lazy başlat - dashboard yüklendikten SONRA
    // Bu sayede login sonrası ilk render hızlı olur
    const timeoutId = setTimeout(() => {
      const supabase = createClientSupabase()
      const companyId = session.user.companyId

      // Debounced KPI fetch - çok sık çağrılmaz
      const debouncedFetchKPIs = () => {
        if (fetchTimeoutRef.current) {
          clearTimeout(fetchTimeoutRef.current)
        }
        fetchTimeoutRef.current = setTimeout(async () => {
          try {
            const res = await fetch('/api/analytics/kpis', {
              credentials: 'include',
              cache: 'no-store',
            })
            
            if (!res.ok) {
              // Hata sessizce ignore edilir - initial data kullanılır
              return
            }
            
            const contentType = res.headers.get('content-type')
            if (!contentType || !contentType.includes('application/json')) {
              // Invalid response type - sessizce ignore et
              return
            }
            
            const data = await res.json()
            setKpis(data)
          } catch (err) {
            // Network hatası veya diğer hatalar - sessizce ignore edilir
            // Initial data kullanılır
          }
        }, 1000) // 1 saniye debounce
      }

      // Invoice tablosunu dinle (PAID durumundaki değişiklikler)
      const invoiceChannel = supabase
        .channel(`invoice-changes-${companyId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'Invoice',
            filter: `companyId=eq.${companyId}`,
          },
          debouncedFetchKPIs
        )
        .subscribe()

      // Quote tablosunu dinle (status değişiklikleri)
      const quoteChannel = supabase
        .channel(`quote-changes-${companyId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'Quote',
            filter: `companyId=eq.${companyId}`,
          },
          debouncedFetchKPIs
        )
        .subscribe()

      // ActivityLog tablosunu dinle (recent activity için)
      const activityChannel = supabase
        .channel(`activity-changes-${companyId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'ActivityLog',
            filter: `companyId=eq.${companyId}`,
          },
          debouncedFetchKPIs
        )
        .subscribe()

      // Channels'ı sakla cleanup için
      channelsRef.current = [invoiceChannel, quoteChannel, activityChannel]
    }, 2000) // 2 saniye sonra realtime başlat (dashboard önce yüklensin)

    return () => {
      // Timeout'u iptal et
      clearTimeout(timeoutId)
      
      // Fetch timeout'u temizle
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
        fetchTimeoutRef.current = null
      }
      
      // Channels'ları temizle - güvenli cleanup
      // Timeout henüz çalışmadıysa channel'lar oluşmamış olabilir
      if (channelsRef.current && channelsRef.current.length > 0) {
        const supabase = createClientSupabase()
        channelsRef.current.forEach((channel) => {
          try {
            if (channel && typeof channel === 'object' && channel !== null) {
              // Channel unsubscribe et (eğer varsa)
              if (typeof channel.unsubscribe === 'function') {
                channel.unsubscribe().catch(() => {
                  // Unsubscribe hatası kritik değil
                })
              }
              // destroy() metodu varsa çağır (bazı Supabase versiyonlarında)
              if (typeof (channel as any).destroy === 'function') {
                try {
                  (channel as any).destroy()
                } catch {
                  // destroy hatası kritik değil
                }
              }
              // Channel'ı kaldır
              try {
                supabase.removeChannel(channel)
              } catch {
                // removeChannel hatası kritik değil
              }
            }
          } catch (error) {
            // Cleanup hatası kritik değil, sessizce ignore et
            if (process.env.NODE_ENV === 'development') {
              console.warn('Channel cleanup error:', error)
            }
          }
        })
        channelsRef.current = []
      }
    }
  }, [session?.user?.companyId])

  return kpis
}
