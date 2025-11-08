'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface DealStageAreaChartProps {
  data: Array<{ stage: string; count: number }>
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444']

export default function DealStageAreaChart({ data }: DealStageAreaChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        <p>Henüz fırsat verisi yok</p>
      </div>
    )
  }

  // İlk 5 aşamayı al
  const chartData = data.slice(0, 5)

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          {chartData.map((entry, index) => (
            <linearGradient key={`color-${index}`} id={`color-${index}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0}/>
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.3} />
        <XAxis 
          dataKey="stage" 
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
          formatter={(value: number) => [`${value} fırsat`, 'Fırsat Sayısı']}
          labelStyle={{ fontWeight: 600, color: '#1F2937' }}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#6366f1"
          fillOpacity={1}
          fill="url(#color-0)"
          name="Fırsat Sayısı"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}



