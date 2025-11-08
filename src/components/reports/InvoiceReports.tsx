'use client'

import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Receipt, DollarSign, Calendar } from 'lucide-react'
import dynamic from 'next/dynamic'
import SkeletonList from '@/components/skeletons/SkeletonList'

const InvoicePaymentBarChart = dynamic(() => import('@/components/reports/charts/InvoicePaymentBarChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

const InvoiceMonthlyAreaChart = dynamic(() => import('@/components/reports/charts/InvoiceMonthlyAreaChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

async function fetchInvoiceReports() {
  const res = await fetch('/api/reports/invoices', {
    cache: 'no-store',
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch invoice reports')
  return res.json()
}

export default function InvoiceReports() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['invoice-reports'],
    queryFn: fetchInvoiceReports,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
  })

  if (isLoading) return <SkeletonList />
  if (error) return <div className="text-red-600">Rapor yüklenirken hata oluştu</div>

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-orange-50 border-orange-200">
        <div className="flex items-start gap-3">
          <Receipt className="h-5 w-5 text-orange-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Fatura Raporları</h3>
            <p className="text-sm text-gray-600">
              Fatura bazlı detaylı analizler. Ödeme durumu, aylık trend ve 
              tahsilat oranlarını görüntüleyin. Tüm veriler anlık olarak güncellenir.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Ödeme Durumu Dağılımı</h3>
              <p className="text-sm text-gray-500 mt-1">Durum bazlı fatura dağılımı</p>
            </div>
            <DollarSign className="h-5 w-5 text-primary-600" />
          </div>
          <InvoicePaymentBarChart data={data?.paymentDistribution || []} />
          <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
            <strong>Açıklama:</strong> Faturaların ödeme durumuna göre dağılımı. 
            Ödenen, bekleyen ve gecikmiş faturaların sayılarını görüntüleyin.
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Aylık Fatura Trendi</h3>
              <p className="text-sm text-gray-500 mt-1">Aylık fatura oluşturma trendi</p>
            </div>
            <Calendar className="h-5 w-5 text-primary-600" />
          </div>
          <InvoiceMonthlyAreaChart data={data?.monthlyTrend || []} />
          <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
            <strong>Açıklama:</strong> Aylık bazda fatura oluşturma trendi. 
            Hangi aylarda daha fazla fatura oluşturulduğunu görüntüleyin.
          </div>
        </Card>
      </div>
    </div>
  )
}



