'use client'

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Card } from '@/components/ui/card'

interface InvoiceStatusChartProps {
  data: Array<{
    status: string
    count: number
    totalValue: number
  }>
  onStatusClick?: (status: string) => void
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Taslak',
  SENT: 'Gönderildi',
  PAID: 'Ödendi',
  OVERDUE: 'Vadesi Geçmiş',
  CANCELLED: 'İptal',
}

const statusColors: Record<string, string> = {
  DRAFT: '#6B7280', // gray
  SENT: '#3B82F6', // blue
  PAID: '#10B981', // green
  OVERDUE: '#EF4444', // red
  CANCELLED: '#F59E0B', // yellow
}

export default function InvoiceStatusChart({ data, onStatusClick }: InvoiceStatusChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return []
    }

    return data
      .filter((item) => item.count > 0) // Sadece fatura olan status'leri göster
      .map((item) => ({
        name: statusLabels[item.status] || item.status,
        status: item.status,
        count: item.count,
        totalValue: item.totalValue || 0,
      }))
      .sort((a, b) => {
        // Sıralama: PAID, SENT, DRAFT, OVERDUE, CANCELLED
        const order: Record<string, number> = {
          PAID: 1,
          SENT: 2,
          DRAFT: 3,
          OVERDUE: 4,
          CANCELLED: 5,
        }
        return (order[a.status] || 99) - (order[b.status] || 99)
      })
  }, [data])

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        <p>Henüz fatura verisi yok</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={chartData}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        layout="vertical"
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis type="number" tick={{ fill: '#6B7280', fontSize: 12 }} />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: '#6B7280', fontSize: 12 }}
          width={120}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
          formatter={(value: number, name: string, props: any) => {
            if (name === 'count') {
              return [`${value} fatura`, 'Fatura Sayısı']
            }
            if (name === 'totalValue') {
              return [
                new Intl.NumberFormat('tr-TR', {
                  style: 'currency',
                  currency: 'TRY',
                }).format(value),
                'Toplam Tutar',
              ]
            }
            return [value, name]
          }}
          labelStyle={{ fontWeight: 600, color: '#1F2937' }}
          cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
        />
        <Bar
          dataKey="count"
          radius={[0, 8, 8, 0]}
          onClick={(data: any) => {
            if (onStatusClick && data?.status) {
              onStatusClick(data.status)
            }
          }}
          shape={(props: any) => {
            const { payload, x, y, width, height } = props
            const color = statusColors[payload.status] || '#6B7280'
            return (
              <rect
                x={x}
                y={y}
                width={width}
                height={height}
                fill={color}
                rx={8}
                ry={8}
                style={{ transition: 'opacity 0.2s', cursor: 'pointer' }}
                onClick={() => {
                  if (onStatusClick && payload?.status) {
                    onStatusClick(payload.status)
                  }
                }}
              />
            )
          }}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={statusColors[entry.status] || '#6B7280'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

