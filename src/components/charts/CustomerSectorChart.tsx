'use client'

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Users, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useLocale } from 'next-intl'

interface Customer {
  id: string
  name: string
}

interface CustomerSectorChartProps {
  data: Array<{ 
    name: string
    value: number
    customers?: Customer[]
    totalCustomers?: number
  }>
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#06b6d4']

// Sektör adını kısalt (max 25 karakter)
const truncateName = (name: string, maxLength: number = 25) => {
  if (name.length <= maxLength) return name
  return name.substring(0, maxLength) + '...'
}

export default function CustomerSectorChart({ data }: CustomerSectorChartProps) {
  const locale = useLocale()
  const [selectedSector, setSelectedSector] = useState<string | null>(null)

  // Eğer data yoksa veya boşsa placeholder göster
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        <p>Henüz sektör dağılım verisi yok</p>
      </div>
    )
  }

  // Toplam müşteri sayısını hesapla
  const total = data.reduce((sum, item) => sum + item.value, 0)

  // Veriyi yüzde ile zenginleştir
  const enrichedData = data.map((item) => ({
    ...item,
    percent: total > 0 ? (item.value / total) * 100 : 0,
    displayName: truncateName(item.name),
  }))

  const selectedData = enrichedData.find((item) => item.name === selectedSector)

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={enrichedData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis type="number" tick={{ fill: '#6B7280', fontSize: 12 }} />
          <YAxis 
            type="category" 
            dataKey="displayName" 
            tick={{ fill: '#6B7280', fontSize: 12 }}
            width={120}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              padding: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            formatter={(value: number, name: string, props: any) => [
              `${value} müşteri (${props.payload.percent.toFixed(1)}%)`,
              'Müşteri Sayısı',
            ]}
            labelStyle={{ fontWeight: 600, color: '#1F2937' }}
            cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
          />
          <Bar
            dataKey="value"
            radius={[0, 8, 8, 0]}
            onClick={(data: any) => setSelectedSector(data.name)}
            shape={(props: any) => {
              const { payload, x, y, width, height } = props
              const index = enrichedData.findIndex((item) => item.name === payload.name)
              const color = COLORS[index % COLORS.length]
              const opacity = selectedSector && selectedSector !== payload.name ? 0.3 : 1
              
              return (
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  fill={color}
                  opacity={opacity}
                  rx={8}
                  ry={8}
                  style={{ transition: 'opacity 0.2s', cursor: 'pointer' }}
                />
              )
            }}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Sektör Listesi ve Müşteri Detayları */}
      <div className="space-y-3">
        {/* Sektör Listesi */}
        <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
          {enrichedData.map((entry, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-3 p-2 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => setSelectedSector(entry.name === selectedSector ? null : entry.name)}
              style={{
                backgroundColor: selectedSector === entry.name ? '#F3F4F6' : 'transparent',
              }}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm font-medium text-gray-700 truncate" title={entry.name}>
                  {entry.displayName}
                </span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <Badge variant="secondary" className="text-xs">
                  {entry.value} müşteri
                </Badge>
                <span className="text-sm font-semibold text-gray-900">
                  {entry.percent.toFixed(1)}%
                </span>
                <ChevronRight 
                  className={`h-4 w-4 text-gray-400 transition-transform ${
                    selectedSector === entry.name ? 'rotate-90' : ''
                  }`}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Seçili Sektörün Müşterileri */}
        {selectedData && selectedData.customers && selectedData.customers.length > 0 && (
          <Card className="p-4 border-2 border-primary-200 bg-primary-50/50">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-5 w-5 text-primary-600" />
              <h3 className="font-semibold text-gray-900">
                {selectedData.name} Sektörü
              </h3>
              <Badge variant="secondary" className="ml-auto">
                {selectedData.totalCustomers || selectedData.value} müşteri
              </Badge>
            </div>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {selectedData.customers.map((customer) => (
                <Link
                  key={customer.id}
                  href={`/${locale}/customers/${customer.id}`}
                  prefetch={true}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-white transition-colors group"
                >
                  <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700 group-hover:text-primary-600 transition-colors">
                    {customer.name}
                  </span>
                  <ChevronRight className="h-3 w-3 text-gray-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
              {selectedData.totalCustomers && selectedData.totalCustomers > selectedData.customers.length && (
                <div className="text-xs text-gray-500 text-center pt-2 border-t">
                  +{selectedData.totalCustomers - selectedData.customers.length} müşteri daha...
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

