'use client'

import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface DealValueComposedChartProps {
  data: Array<{ month: string; count: number; totalValue: number }>
}

export default function DealValueComposedChart({ data }: DealValueComposedChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        <p>Henüz fırsat verisi yok</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.3} />
        <XAxis 
          dataKey="month" 
          tick={{ fill: '#6B7280', fontSize: 11 }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis 
          yAxisId="left"
          tick={{ fill: '#6B7280', fontSize: 11 }}
          label={{ value: 'Fırsat Sayısı', angle: -90, position: 'insideLeft' }}
        />
        <YAxis 
          yAxisId="right"
          orientation="right"
          tick={{ fill: '#6B7280', fontSize: 11 }}
          tickFormatter={(value) => {
            if (value >= 1000000) return `₺${(value / 1000000).toFixed(1)}M`
            if (value >= 1000) return `₺${(value / 1000).toFixed(0)}k`
            return `₺${value}`
          }}
          label={{ value: 'Toplam Değer', angle: 90, position: 'insideRight' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            padding: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
          formatter={(value: number, name: string) => {
            if (name === 'count') return [`${value} fırsat`, 'Fırsat Sayısı']
            return [`₺${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(value)}`, 'Toplam Değer']
          }}
          labelStyle={{ fontWeight: 600, color: '#1F2937' }}
        />
        <Legend />
        <Bar 
          yAxisId="left"
          dataKey="count" 
          fill="#6366f1" 
          name="Fırsat Sayısı"
          radius={[8, 8, 0, 0]}
        />
        <Line 
          yAxisId="right"
          type="monotone" 
          dataKey="totalValue" 
          stroke="#ec4899" 
          strokeWidth={2}
          dot={{ fill: '#ec4899', r: 4 }}
          name="Toplam Değer"
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}



