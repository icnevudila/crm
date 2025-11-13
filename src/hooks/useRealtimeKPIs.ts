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
      let fetchTimeout: NodeJS.Timeout
      const debouncedFetchKPIs = () => {
        clearTimeout(fetchTimeout)
        fetchTimeout = setTimeout(() => {
          fetch('/api/analytics/kpis')
            .then((res) => res.json())
            .then((data) => setKpis(data))
            .catch(() => {
              // Hata sessizce ignore edilir - initial data kullanılır
            })
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

      // Cleanup timeout'u da sakla
      return () => {
        clearTimeout(fetchTimeout)
      }
    }, 2000) // 2 saniye sonra realtime başlat (dashboard önce yüklensin)

    return () => {
      clearTimeout(timeoutId)
      // Channels'ları temizle
      const supabase = createClientSupabase()
      channelsRef.current.forEach((channel) => {
        if (channel) {
          supabase.removeChannel(channel)
        }
      })
      channelsRef.current = []
    }
  }, [session?.user?.companyId])

  return kpis
}
