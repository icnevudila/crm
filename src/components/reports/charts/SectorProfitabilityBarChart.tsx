'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface SectorProfitabilityBarChartProps {
  data: Array<{
    sector: string
    profitability: number
    sales: number
    averageOrderValue: number
  }>
}

export default function SectorProfitabilityBarChart({ data }: SectorProfitabilityBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        <p>Henüz sektör verisi yok</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.3} />
        <XAxis 
          dataKey="sector" 
          tick={{ fill: '#6B7280', fontSize: 11 }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis 
          tick={{ fill: '#6B7280', fontSize: 11 }}
          yAxisId="left"
          tickFormatter={(value) => `%${value.toFixed(0)}`}
        />
        <YAxis 
          tick={{ fill: '#6B7280', fontSize: 11 }}
          yAxisId="right"
          orientation="right"
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
          formatter={(value: number, name: string) => {
            if (name === 'profitability') {
              return [`%${value.toFixed(1)}`, 'Karlılık']
            }
            if (name === 'sales') {
              return [`₺${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(value)}`, 'Satış']
            }
            if (name === 'averageOrderValue') {
              return [`₺${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(value)}`, 'Ortalama Sipariş']
            }
            return [value, name]
          }}
          labelStyle={{ fontWeight: 600, color: '#1F2937' }}
          cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
        />
        <Legend />
        <Bar yAxisId="left" dataKey="profitability" fill="#6366f1" name="Karlılık" radius={[8, 8, 0, 0]} />
        <Bar yAxisId="right" dataKey="sales" fill="#8b5cf6" name="Satış" radius={[8, 8, 0, 0]} />
        <Bar yAxisId="right" dataKey="averageOrderValue" fill="#ec4899" name="Ortalama Sipariş" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
















