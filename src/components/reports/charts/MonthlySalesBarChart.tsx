'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface MonthlySalesBarChartProps {
  data: Array<{ month: string; total?: number; total_sales?: number }>
}

export default function MonthlySalesBarChart({ data }: MonthlySalesBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        <p>Henüz satış verisi yok</p>
      </div>
    )
  }

  // total_sales field'ını total'e normalize et
  const normalizedData = data.map((item) => ({
    ...item,
    total: item.total || item.total_sales || 0,
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={normalizedData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.3} />
        <XAxis 
          dataKey="month" 
          tick={{ fill: '#6B7280', fontSize: 11 }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis 
          tick={{ fill: '#6B7280', fontSize: 11 }}
          tickFormatter={(value) => {
            if (value >= 1000000) return `₺${(value / 1000000).toFixed(1)}M`
            if (value >= 1000) return `₺${(value / 1000).toFixed(0)}k`
            return `₺${value}`
          }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            padding: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
          formatter={(value: number) => [
            `₺${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(value)}`,
            'Toplam Satış',
          ]}
          labelStyle={{ fontWeight: 600, color: '#1F2937' }}
          cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
        />
        <Bar
          dataKey="total"
          fill="#6366f1"
          radius={[8, 8, 0, 0]}
          style={{ transition: 'opacity 0.2s' }}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}



