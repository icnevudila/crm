'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useLocale } from 'next-intl'
import Link from 'next/link'

interface CustomerCityBarChartProps {
  data: Array<{ city: string; count: number }>
}

export default function CustomerCityBarChart({ data }: CustomerCityBarChartProps) {
  const locale = useLocale()
  
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        <p>Henüz şehir verisi yok</p>
      </div>
    )
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis type="number" tick={{ fill: '#6B7280', fontSize: 12 }} />
          <YAxis 
            type="category" 
            dataKey="city" 
            tick={{ fill: '#6B7280', fontSize: 12 }}
            width={100}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              padding: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            formatter={(value: number) => [`${value} müşteri`, 'Müşteri Sayısı']}
            labelStyle={{ fontWeight: 600, color: '#1F2937' }}
            cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
          />
          <Bar
            dataKey="count"
            fill="#10b981"
            radius={[0, 8, 8, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
      
      {/* Detay linkleri */}
      <div className="mt-4 flex flex-wrap gap-2">
        {data.slice(0, 5).map((item) => (
          <Link
            key={item.city}
            href={`/${locale}/customers?city=${encodeURIComponent(item.city)}`}
            className="text-xs text-primary-600 hover:text-primary-700 hover:underline"
          >
            {item.city}: {item.count} müşteri →
          </Link>
        ))}
      </div>
    </div>
  )
}



