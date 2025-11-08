'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface QuoteTrendLineChartProps {
  data: Array<{ month: string; count: number }>
}

export default function QuoteTrendLineChart({ data }: QuoteTrendLineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        <p>Henüz teklif verisi yok</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.3} />
        <XAxis 
          dataKey="month" 
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
          formatter={(value: number) => [`${value} teklif`, 'Teklif Sayısı']}
          labelStyle={{ fontWeight: 600, color: '#1F2937' }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="count"
          stroke="#8b5cf6"
          strokeWidth={2}
          dot={{ fill: '#8b5cf6', r: 4 }}
          activeDot={{ r: 6 }}
          name="Teklif Sayısı"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}



