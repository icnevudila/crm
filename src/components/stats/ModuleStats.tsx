/**
 * Modül İstatistikleri Component'i
 * Her modül için anlık istatistikler gösterir
 */
'use client'

import { useMemo } from 'react'
import { useData } from '@/hooks/useData'
import StatsCard from './StatsCard'
import { Users, Store, Briefcase, FileText, Receipt, Package } from 'lucide-react'

interface ModuleStatsProps {
  module: 'customers' | 'vendors' | 'deals' | 'quotes' | 'invoices' | 'products'
  statsUrl: string
  filterStatus?: string
  onFilterChange?: (filter: { type: string; value?: string }) => void
}

const iconMap = {
  customers: Users,
  vendors: Store,
  deals: Briefcase,
  quotes: FileText,
  invoices: Receipt,
  products: Package,
}

export default function ModuleStats({ module, statsUrl, filterStatus, onFilterChange }: ModuleStatsProps) {
  const { data: stats, isLoading, error } = useData<any>(statsUrl, {
    dedupingInterval: 5000, // 5 saniye cache (daha kısa - güncellemeler daha hızlı)
    revalidateOnFocus: false,
    refreshInterval: 0, // Auto refresh YOK - manual refresh
  })

  // CRITICAL: Development'ta log ekle - KPI sorununu debug etmek için
  if (process.env.NODE_ENV === 'development') {
    console.log('ModuleStats - Request:', {
      module,
      statsUrl,
      isLoading,
      hasStats: !!stats,
      stats,
      error,
      errorMessage: error?.message,
      errorStatus: error?.status,
    })
  }
  
  // Filtreleme yapıldığında KPI'ları güncelle - sadece filtrelenmiş veriyi göster
  const filteredStats = useMemo(() => {
    if (!stats || !filterStatus) return stats
    
    // Products için status filtresi YOK - sadece stock filtresi kullan
    if (module === 'products') {
      // Products için stock filtresi (status değil)
      if (filterStatus === 'inStock') {
        return {
          ...stats,
          total: stats.active || 0,
        }
      } else if (filterStatus === 'lowStock') {
        return {
          ...stats,
          total: stats.lowStock || 0,
        }
      } else if (filterStatus === 'outOfStock') {
        return {
          ...stats,
          total: stats.outOfStock || 0,
        }
      }
      return stats
    }
    
    // Diğer modüller için status filtresi
    if (filterStatus === 'PAID') {
      return {
        ...stats,
        total: stats.paid || 0,
        // totalValue hesaplaması API'den geliyor, burada sadece total'i güncelle
      }
    } else if (filterStatus === 'DRAFT') {
      return {
        ...stats,
        total: stats.draft || 0,
      }
    } else if (filterStatus === 'SENT') {
      return {
        ...stats,
        total: stats.sent || 0,
      }
    } else if (filterStatus === 'OVERDUE') {
      return {
        ...stats,
        total: stats.overdue || 0,
      }
    } else if (filterStatus === 'CANCELLED') {
      return {
        ...stats,
        total: stats.cancelled || 0,
      }
    }
    
    return stats
  }, [stats, filterStatus, module])

  // Debug: Development'ta log ekle
  if (process.env.NODE_ENV === 'development') {
    console.log('ModuleStats - Render:', {
      module,
      statsUrl,
      isLoading,
      hasStats: !!stats,
      stats,
      error,
      timestamp: new Date().toISOString(),
    })
  }

  if (isLoading) {
    console.log('ModuleStats - Loading state')
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (!stats) {
    console.log('ModuleStats - No stats, returning null')
    return null
  }

  const Icon = iconMap[module]
  const displayStats = filteredStats || stats

  // Filtreleme fonksiyonları
  const handleCardClick = (filterType: string, filterValue?: string) => {
    if (onFilterChange) {
      onFilterChange({ type: filterType, value: filterValue })
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      <StatsCard
        title="Toplam"
        value={displayStats.total || 0}
        icon={Icon}
        gradient="primary"
        onClick={() => handleCardClick('all')}
      />
      {/* Aktif - sadece products için stock filtresi kullan */}
      {module === 'products' ? (
        <StatsCard
          title="Stokta Var"
          value={displayStats.active || 0}
          icon={Icon}
          gradient="secondary"
          onClick={() => handleCardClick('stock', 'inStock')}
        />
      ) : (
        <StatsCard
          title="Aktif"
          value={displayStats.active || 0}
          icon={Icon}
          gradient="secondary"
          onClick={() => handleCardClick('status', 'OPEN')}
        />
      )}
      {stats.totalValue !== undefined && (
        <StatsCard
          title="Toplam Değer"
          value={displayStats.totalValue || 0}
          prefix="₺"
          icon={Icon}
          gradient="accent"
        />
      )}
      {stats.activeValue !== undefined && (
        <StatsCard
          title="Aktif Tutar"
          value={displayStats.activeValue || 0}
          prefix="₺"
          icon={Icon}
          gradient="secondary"
          onClick={() => handleCardClick('status', 'OPEN')}
        />
      )}
      {stats.avgValue !== undefined && stats.avgValue > 0 && (
        <StatsCard
          title="Ortalama Değer"
          value={displayStats.avgValue || 0}
          prefix="₺"
          icon={Icon}
          gradient="primary"
        />
      )}
      {stats.inactive !== undefined && (
        <StatsCard
          title="Pasif"
          value={displayStats.inactive || 0}
          icon={Icon}
          gradient="secondary"
          onClick={() => handleCardClick('status', 'INACTIVE')}
        />
      )}
      {stats.pending !== undefined && (
        <StatsCard
          title="Bekleyen"
          value={displayStats.pending || 0}
          icon={Icon}
          gradient="primary"
          onClick={() => handleCardClick('status', 'PENDING')}
        />
      )}
      {stats.completed !== undefined && (
        <StatsCard
          title="Tamamlanan"
          value={displayStats.completed || 0}
          icon={Icon}
          gradient="secondary"
          onClick={() => handleCardClick('status', 'COMPLETED')}
        />
      )}
      {stats.paid !== undefined && (
        <StatsCard
          title="Ödenen"
          value={displayStats.paid || 0}
          icon={Icon}
          gradient="accent"
          onClick={() => handleCardClick('status', 'PAID')}
        />
      )}
      {stats.unpaid !== undefined && (
        <StatsCard
          title="Ödenmemiş"
          value={displayStats.unpaid || 0}
          icon={Icon}
          gradient="primary"
          onClick={() => handleCardClick('status', 'UNPAID')}
        />
      )}
      {stats.overdue !== undefined && (
        <StatsCard
          title="Vadesi Geçmiş"
          value={displayStats.overdue || 0}
          icon={Icon}
          gradient="accent"
          onClick={() => handleCardClick('status', 'OVERDUE')}
        />
      )}
      {stats.draft !== undefined && (
        <StatsCard
          title="Taslak"
          value={displayStats.draft || 0}
          icon={Icon}
          gradient="primary"
          onClick={() => handleCardClick('status', 'DRAFT')}
        />
      )}
      {stats.cancelled !== undefined && (
        <StatsCard
          title="İptal"
          value={displayStats.cancelled || 0}
          icon={Icon}
          gradient="secondary"
          onClick={() => handleCardClick('status', 'CANCELLED')}
        />
      )}
      {stats.sent !== undefined && (
        <StatsCard
          title="Gönderildi"
          value={displayStats.sent || 0}
          icon={Icon}
          gradient="primary"
          onClick={() => handleCardClick('status', 'SENT')}
        />
      )}
      {stats.lowStock !== undefined && (
        <StatsCard
          title="Düşük Stok"
          value={displayStats.lowStock || 0}
          icon={Icon}
          gradient="accent"
          onClick={() => handleCardClick('stock', 'LOW')}
        />
      )}
      {stats.outOfStock !== undefined && (
        <StatsCard
          title="Stokta Yok"
          value={displayStats.outOfStock || 0}
          icon={Icon}
          gradient="primary"
          onClick={() => handleCardClick('stock', 'OUT')}
        />
      )}
      {stats.thisMonth !== undefined && (
        <StatsCard
          title="Bu Ay"
          value={displayStats.thisMonth || 0}
          icon={Icon}
          gradient="accent"
          onClick={() => handleCardClick('period', 'thisMonth')}
        />
      )}
    </div>
  )
}

