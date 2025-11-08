'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface ProductTopSellersBarChartProps {
  data: Array<{ name: string; value: number; stock: number }>
}

export default function ProductTopSellersBarChart({ data }: ProductTopSellersBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        <p>Henüz ürün verisi yok</p>
      </div>
    )
  }

  const formattedData = data.map((item) => ({
    ...item,
    displayName: item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name,
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={formattedData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.3} />
        <XAxis 
          dataKey="displayName" 
          tick={{ fill: '#6B7280', fontSize: 10 }}
          angle={-45}
          textAnchor="end"
          height={100}
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
          formatter={(value: number, name: string, props: any) => {
            if (name === 'value') {
              return [`₺${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(value)}`, 'Fiyat']
            }
            return [value, 'Stok']
          }}
          labelStyle={{ fontWeight: 600, color: '#1F2937' }}
          cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
        />
        <Legend />
        <Bar
          dataKey="value"
          fill="#6366f1"
          radius={[8, 8, 0, 0]}
          name="Fiyat"
        />
        <Bar
          dataKey="stock"
          fill="#10b981"
          radius={[8, 8, 0, 0]}
          name="Stok"
        />
      </BarChart>
    </ResponsiveContainer>
  )
}



