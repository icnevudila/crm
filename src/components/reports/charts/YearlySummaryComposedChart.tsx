'use client'

import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface YearlySummaryComposedChartProps {
  data: Array<{
    year: string
    sales: number
    customers: number
    deals: number
    invoices: number
  }>
}

export default function YearlySummaryComposedChart({ data }: YearlySummaryComposedChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        <p>Henüz yıllık veri yok</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.3} />
        <XAxis 
          dataKey="year" 
          tick={{ fill: '#6B7280', fontSize: 11 }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis 
          tick={{ fill: '#6B7280', fontSize: 11 }}
          yAxisId="left"
          tickFormatter={(value) => {
            if (value >= 1000000) return `₺${(value / 1000000).toFixed(1)}M`
            if (value >= 1000) return `₺${(value / 1000).toFixed(0)}k`
            return `₺${value}`
          }}
        />
        <YAxis 
          tick={{ fill: '#6B7280', fontSize: 11 }}
          yAxisId="right"
          orientation="right"
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
            if (name === 'sales') {
              return [`₺${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(value)}`, 'Satış']
            }
            return [value, name === 'customers' ? 'Müşteri' : name === 'deals' ? 'Fırsat' : 'Fatura']
          }}
          labelStyle={{ fontWeight: 600, color: '#1F2937' }}
          cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
        />
        <Legend />
        <Bar yAxisId="left" dataKey="sales" fill="#6366f1" name="Satış" radius={[8, 8, 0, 0]} />
        <Line yAxisId="right" type="monotone" dataKey="customers" stroke="#8b5cf6" strokeWidth={2} name="Müşteri" dot={{ fill: '#8b5cf6', r: 4 }} />
        <Line yAxisId="right" type="monotone" dataKey="deals" stroke="#ec4899" strokeWidth={2} name="Fırsat" dot={{ fill: '#ec4899', r: 4 }} />
        <Line yAxisId="right" type="monotone" dataKey="invoices" stroke="#f59e0b" strokeWidth={2} name="Fatura" dot={{ fill: '#f59e0b', r: 4 }} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

















