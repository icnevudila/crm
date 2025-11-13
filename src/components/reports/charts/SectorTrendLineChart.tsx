'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface SectorTrendLineChartProps {
  data: Array<{
    sector: string
    trend: Array<{
      month: string
      sales: number
    }>
  }>
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#a855f7', '#f43f5e']

export default function SectorTrendLineChart({ data }: SectorTrendLineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        <p>Henüz sektör verisi yok</p>
      </div>
    )
  }

  // Tüm sektörlerin trend verilerini birleştir
  const allMonths = new Set<string>()
  data.forEach(sector => {
    sector.trend.forEach(item => allMonths.add(item.month))
  })
  const sortedMonths = Array.from(allMonths).sort()

  // Her ay için sektör bazlı satış verisi oluştur
  const chartData = sortedMonths.map(month => {
    const monthData: Record<string, number> = { month }
    data.forEach(sector => {
      const monthTrend = sector.trend.find(t => t.month === month)
      monthData[sector.sector] = monthTrend?.sales || 0
    })
    return monthData
  })

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
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
          formatter={(value: number, name: string) => [
            `₺${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(value)}`,
            name === 'month' ? 'Ay' : name,
          ]}
          labelStyle={{ fontWeight: 600, color: '#1F2937' }}
          cursor={{ stroke: '#6366f1', strokeWidth: 2 }}
        />
        <Legend />
        {data.map((sector, index) => (
          <Line
            key={sector.sector}
            type="monotone"
            dataKey={sector.sector}
            stroke={COLORS[index % COLORS.length]}
            strokeWidth={2}
            name={sector.sector}
            dot={{ fill: COLORS[index % COLORS.length], r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

















