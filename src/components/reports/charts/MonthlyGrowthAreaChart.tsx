'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface MonthlyGrowthAreaChartProps {
  data: Array<{
    month: string
    sales: number
    customers: number
    deals: number
    growth: number
  }>
}

export default function MonthlyGrowthAreaChart({ data }: MonthlyGrowthAreaChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        <p>Henüz aylık veri yok</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <defs>
          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorCustomers" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
          </linearGradient>
        </defs>
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
          formatter={(value: number, name: string) => {
            if (name === 'sales') {
              return [`₺${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(value)}`, 'Satış']
            }
            if (name === 'growth') {
              return [`%${value.toFixed(1)}`, 'Büyüme']
            }
            return [value, name === 'customers' ? 'Müşteri' : 'Fırsat']
          }}
          labelStyle={{ fontWeight: 600, color: '#1F2937' }}
          cursor={{ stroke: '#6366f1', strokeWidth: 2 }}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="sales"
          stroke="#6366f1"
          fillOpacity={1}
          fill="url(#colorSales)"
          name="Satış"
        />
        <Area
          type="monotone"
          dataKey="customers"
          stroke="#8b5cf6"
          fillOpacity={1}
          fill="url(#colorCustomers)"
          name="Müşteri"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}


























