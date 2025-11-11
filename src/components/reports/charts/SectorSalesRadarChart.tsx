'use client'

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface SectorSalesRadarChartProps {
  data: Array<{
    sector: string
    sales: number
    customers: number
    deals: number
  }>
}

export default function SectorSalesRadarChart({ data }: SectorSalesRadarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        <p>Henüz sektör verisi yok</p>
      </div>
    )
  }

  // Radar chart için veriyi normalize et (0-100 arası)
  const maxValues = {
    sales: Math.max(...data.map(d => d.sales)),
    customers: Math.max(...data.map(d => d.customers)),
    deals: Math.max(...data.map(d => d.deals)),
  }

  const radarData = data.map(sector => ({
    sector: sector.sector,
    'Satış': (sector.sales / maxValues.sales) * 100,
    'Müşteri': (sector.customers / maxValues.customers) * 100,
    'Fırsat': (sector.deals / maxValues.deals) * 100,
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={radarData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <PolarGrid stroke="#E5E7EB" />
        <PolarAngleAxis dataKey="sector" tick={{ fill: '#6B7280', fontSize: 11 }} />
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
          name="Satış"
          dataKey="Satış"
          stroke="#6366f1"
          fill="#6366f1"
          fillOpacity={0.6}
        />
        <Radar
          name="Müşteri"
          dataKey="Müşteri"
          stroke="#8b5cf6"
          fill="#8b5cf6"
          fillOpacity={0.6}
        />
        <Radar
          name="Fırsat"
          dataKey="Fırsat"
          stroke="#ec4899"
          fill="#ec4899"
          fillOpacity={0.6}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}










