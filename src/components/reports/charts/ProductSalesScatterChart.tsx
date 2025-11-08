'use client'

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface ProductSalesScatterChartProps {
  data: Array<{ price: number; stock: number; name: string }>
}

export default function ProductSalesScatterChart({ data }: ProductSalesScatterChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        <p>Henüz ürün verisi yok</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ScatterChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.3} />
        <XAxis 
          type="number"
          dataKey="price"
          name="Fiyat"
          unit="₺"
          tick={{ fill: '#6B7280', fontSize: 11 }}
          tickFormatter={(value) => {
            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
            if (value >= 1000) return `${(value / 1000).toFixed(0)}k`
            return `${value}`
          }}
        />
        <YAxis 
          type="number"
          dataKey="stock"
          name="Stok"
          tick={{ fill: '#6B7280', fontSize: 11 }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            padding: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
          cursor={{ stroke: '#6366f1', strokeWidth: 1 }}
          formatter={(value: number, name: string, props: any) => {
            if (name === 'price') {
              return [`₺${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(value)}`, 'Fiyat']
            }
            return [value, 'Stok']
          }}
          labelFormatter={(label, payload: any) => payload?.[0]?.payload?.name || ''}
        />
        <Legend />
        <Scatter
          name="Ürün"
          data={data}
          fill="#6366f1"
          shape="circle"
        />
      </ScatterChart>
    </ResponsiveContainer>
  )
}



