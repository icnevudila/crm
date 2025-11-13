'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface DailyTrendLineChartProps {
  data: Array<{
    day: string
    sales: number
    customers: number
    deals: number
  }>
}

export default function DailyTrendLineChart({ data }: DailyTrendLineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        <p>Henüz günlük veri yok</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.3} />
        <XAxis 
          dataKey="day" 
          tick={{ fill: '#6B7280', fontSize: 10 }}
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
            return [value, name === 'customers' ? 'Müşteri' : 'Fırsat']
          }}
          labelStyle={{ fontWeight: 600, color: '#1F2937' }}
          cursor={{ stroke: '#6366f1', strokeWidth: 2 }}
        />
        <Legend />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="sales"
          stroke="#6366f1"
          strokeWidth={2}
          name="Satış"
          dot={{ fill: '#6366f1', r: 3 }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="customers"
          stroke="#8b5cf6"
          strokeWidth={2}
          name="Müşteri"
          dot={{ fill: '#8b5cf6', r: 3 }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="deals"
          stroke="#ec4899"
          strokeWidth={2}
          name="Fırsat"
          dot={{ fill: '#ec4899', r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
















