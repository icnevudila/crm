'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface InvoicePaymentBarChartProps {
  data: Array<{ status: string; count: number }>
}

const statusLabels: Record<string, string> = {
  PAID: 'Ödendi',
  PENDING: 'Beklemede',
  OVERDUE: 'Gecikmiş',
  CANCELLED: 'İptal Edildi',
  DRAFT: 'Taslak',
}

const COLORS: Record<string, string> = {
  PAID: '#10b981',
  PENDING: '#f59e0b',
  OVERDUE: '#ef4444',
  CANCELLED: '#6B7280',
  DRAFT: '#9CA3AF',
}

export default function InvoicePaymentBarChart({ data }: InvoicePaymentBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        <p>Henüz fatura verisi yok</p>
      </div>
    )
  }

  const formattedData = data.map((item) => ({
    ...item,
    label: statusLabels[item.status] || item.status,
    color: COLORS[item.status] || '#6366f1',
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={formattedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.3} />
        <XAxis 
          dataKey="label" 
          tick={{ fill: '#6B7280', fontSize: 11 }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            padding: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
          formatter={(value: number) => [`${value} fatura`, 'Fatura Sayısı']}
          labelStyle={{ fontWeight: 600, color: '#1F2937' }}
          cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
        />
        <Legend />
        <Bar
          dataKey="count"
          radius={[8, 8, 0, 0]}
          shape={(props: any) => {
            const { payload, x, y, width, height } = props
            return (
              <rect
                x={x}
                y={y}
                width={width}
                height={height}
                fill={payload.color}
                rx={8}
                ry={8}
                style={{ transition: 'opacity 0.2s' }}
              />
            )
          }}
          name="Fatura Sayısı"
        />
      </BarChart>
    </ResponsiveContainer>
  )
}



