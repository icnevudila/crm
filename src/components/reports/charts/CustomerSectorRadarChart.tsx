'use client'

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from 'recharts'
import { useLocale } from 'next-intl'
import Link from 'next/link'

interface CustomerSectorRadarChartProps {
  data: Array<{ name: string; value: number }>
}

export default function CustomerSectorRadarChart({ data }: CustomerSectorRadarChartProps) {
  const locale = useLocale()
  
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
    <div>
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
      
      {/* Detay linkleri */}
      <div className="mt-4 flex flex-wrap gap-2">
        {chartData.slice(0, 5).map((item) => (
          <Link
            key={item.fullName}
            href={`/${locale}/customers?sector=${encodeURIComponent(item.fullName)}`}
            className="text-xs text-primary-600 hover:text-primary-700 hover:underline"
          >
            {item.fullName}: {item.value} müşteri →
          </Link>
        ))}
      </div>
    </div>
  )
}



