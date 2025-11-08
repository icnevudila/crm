'use client'

import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Building2, TrendingUp, BarChart3 } from 'lucide-react'
import dynamic from 'next/dynamic'
import SkeletonList from '@/components/skeletons/SkeletonList'

async function fetchSectorReports() {
  const res = await fetch('/api/reports/sector', {
    cache: 'no-store',
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch sector reports')
  return res.json()
}

export default function SectorReports() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['sector-reports'],
    queryFn: fetchSectorReports,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
  })

  if (isLoading) return <SkeletonList />
  if (error) return <div className="text-red-600">Rapor yüklenirken hata oluştu</div>

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-violet-50 border-violet-200">
        <div className="flex items-start gap-3">
          <Building2 className="h-5 w-5 text-violet-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Sektör Raporları</h3>
            <p className="text-sm text-gray-600">
              Sektör bazlı detaylı analizler. Sektör performansı, karşılaştırmalar ve 
              trend analizlerini görüntüleyin. Tüm veriler anlık olarak güncellenir.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Sektör Raporları</h3>
              <p className="text-sm text-gray-500 mt-1">Yakında eklenecek</p>
            </div>
            <Building2 className="h-5 w-5 text-primary-600" />
          </div>
          <div className="h-[300px] flex items-center justify-center text-gray-400">
            <p>Sektör raporları yakında eklenecek</p>
          </div>
        </Card>
      </div>
    </div>
  )
}



