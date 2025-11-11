'use client'

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface TeamPerformanceComparisonChartProps {
  data: Array<{
    name: string
    totalSales: number
    goalAchievement: number
    averageOrderValue: number
    winRate: number
  }>
}

export default function TeamPerformanceComparisonChart({ data }: TeamPerformanceComparisonChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        <p>Henüz ekip performans verisi yok</p>
      </div>
    )
  }

  // Radar chart için veriyi normalize et (0-100 arası)
  const maxValues = {
    totalSales: Math.max(...data.map(d => d.totalSales)),
    goalAchievement: Math.max(...data.map(d => d.goalAchievement)),
    averageOrderValue: Math.max(...data.map(d => d.averageOrderValue)),
    winRate: Math.max(...data.map(d => d.winRate)),
  }

  const radarData = data.map(user => ({
    name: user.name,
    'Toplam Satış': (user.totalSales / maxValues.totalSales) * 100,
    'Hedef Gerçekleşme': user.goalAchievement,
    'Ortalama Sipariş': (user.averageOrderValue / maxValues.averageOrderValue) * 100,
    'Kazanma Oranı': user.winRate,
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={radarData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <PolarGrid stroke="#E5E7EB" />
        <PolarAngleAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 11 }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 11 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            padding: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
          formatter={(value: number, name: string) => [`%${value.toFixed(1)}`, name]}
        />
        <Legend />
        <Radar
          name="Performans"
          dataKey="Toplam Satış"
          stroke="#6366f1"
          fill="#6366f1"
          fillOpacity={0.6}
        />
        <Radar
          name="Hedef"
          dataKey="Hedef Gerçekleşme"
          stroke="#8b5cf6"
          fill="#8b5cf6"
          fillOpacity={0.6}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}










