'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { useLocale } from 'next-intl'
import Link from 'next/link'

interface SalesByStatusPieChartProps {
  data: Array<{ name: string; value: number }>
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444']

const statusLabels: Record<string, string> = {
  PAID: 'Ödendi',
  PENDING: 'Beklemede',
  OVERDUE: 'Gecikmiş',
  CANCELLED: 'İptal Edildi',
  DRAFT: 'Taslak',
}

export default function SalesByStatusPieChart({ data }: SalesByStatusPieChartProps) {
  const locale = useLocale()
  
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        <p>Henüz fatura verisi yok</p>
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
              `${value} fatura (${((value / total) * 100).toFixed(1)}%)`,
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
            href={`/${locale}/invoices?status=${item.name}`}
            className="text-xs text-primary-600 hover:text-primary-700 hover:underline"
          >
            {item.label}: {item.value} fatura →
          </Link>
        ))}
      </div>
    </div>
  )
}



