'use client'

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from 'recharts'

interface CustomerSectorRadarChartProps {
  data: Array<{ name: string; value: number }>
}

export default function CustomerSectorRadarChart({ data }: CustomerSectorRadarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        <p>Henüz sektör verisi yok</p>
      </div>
    )
  }

  // İlk 8 sektörü al (radar chart için)
  const chartData = data.slice(0, 8).map((item) => ({
    sector: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
    value: item.value,
    fullName: item.name,
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={chartData}>
        <PolarGrid />
        <PolarAngleAxis 
          dataKey="sector" 
          tick={{ fill: '#6B7280', fontSize: 11 }}
        />
        <PolarRadiusAxis 
          angle={90} 
          domain={[0, 'dataMax']}
          tick={{ fill: '#6B7280', fontSize: 10 }}
        />
        <Radar
          name="Müşteri Sayısı"
          dataKey="value"
          stroke="#6366f1"
          fill="#6366f1"
          fillOpacity={0.6}
        />
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  )
}



