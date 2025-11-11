'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface GoalAchievementLineChartProps {
  data: Array<{
    month: string
    goal: number
    actual: number
  }>
}

export default function GoalAchievementLineChart({ data }: GoalAchievementLineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        <p>Henüz hedef verisi yok</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
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
            if (name === 'goal') {
              return [`₺${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(value)}`, 'Hedef']
            }
            if (name === 'actual') {
              return [`₺${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(value)}`, 'Gerçekleşen']
            }
            return [value, name]
          }}
          labelStyle={{ fontWeight: 600, color: '#1F2937' }}
          cursor={{ stroke: '#6366f1', strokeWidth: 2 }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="goal"
          stroke="#8b5cf6"
          strokeWidth={2}
          name="Hedef"
          dot={{ fill: '#8b5cf6', r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="actual"
          stroke="#6366f1"
          strokeWidth={2}
          name="Gerçekleşen"
          dot={{ fill: '#6366f1', r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}












