'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { useLocale } from 'next-intl'
import Link from 'next/link'

interface QuoteStatusPieChartProps {
  data: Array<{ name: string; value: number }>
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6']

const statusLabels: Record<string, string> = {
  DRAFT: 'Taslak',
  SENT: 'Gönderildi',
  ACCEPTED: 'Kabul Edildi',
  DECLINED: 'Reddedildi',
  WAITING: 'Beklemede',
}

export default function QuoteStatusPieChart({ data }: QuoteStatusPieChartProps) {
  const locale = useLocale()
  
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        <p>Henüz teklif verisi yok</p>
      </div>
    )
  }

  const formattedData = data.map((item) => ({
    ...item,
    label: statusLabels[item.name] || item.name,
  }))

  const total = formattedData.reduce((sum, item) => sum + item.value, 0)

  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={formattedData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ label, percent }) => `${label}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {formattedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              padding: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            formatter={(value: number, name: string, props: any) => [
              `${value} teklif (${((value / total) * 100).toFixed(1)}%)`,
              props.payload.label,
            ]}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
            formatter={(value, entry: any) => entry.payload.label}
          />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Detay linkleri */}
      <div className="mt-4 flex flex-wrap gap-2">
        {formattedData.map((item) => (
          <Link
            key={item.name}
            href={`/${locale}/quotes?status=${item.name}`}
            className="text-xs text-primary-600 hover:text-primary-700 hover:underline"
          >
            {item.label}: {item.value} teklif →
          </Link>
        ))}
      </div>
    </div>
  )
}



