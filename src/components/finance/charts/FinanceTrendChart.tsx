'use client'

import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface FinanceTrendChartProps {
  data: Array<{
    type: string
    amount: number
    createdAt: string
  }>
}

export default function FinanceTrendChart({ data }: FinanceTrendChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return []
    }

    // Tarihe göre grupla (günlük)
    const grouped: Record<string, { date: string; income: number; expense: number }> = {}
    
    data.forEach((record) => {
      const date = new Date(record.createdAt).toLocaleDateString('tr-TR', { 
        day: '2-digit', 
        month: '2-digit' 
      })
      
      if (!grouped[date]) {
        grouped[date] = { date, income: 0, expense: 0 }
      }
      
      if (record.type === 'INCOME') {
        grouped[date].income += record.amount || 0
      } else {
        grouped[date].expense += record.amount || 0
      }
    })

    return Object.values(grouped)
      .sort((a, b) => {
        const dateA = new Date(a.date.split('.').reverse().join('-'))
        const dateB = new Date(b.date.split('.').reverse().join('-'))
        return dateA.getTime() - dateB.getTime()
      })
      .slice(-30) // Son 30 gün
  }, [data])

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        <p>Henüz finans verisi yok</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis 
          dataKey="date" 
          tick={{ fill: '#6B7280', fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis 
          tick={{ fill: '#6B7280', fontSize: 12 }}
          tickFormatter={(value) => {
            if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`
            if (value >= 1000) return `€${(value / 1000).toFixed(0)}k`
            return `€${value}`
          }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1F2937',
            border: 'none',
            borderRadius: '8px',
            color: '#F9FAFB',
          }}
          formatter={(value: number) => formatCurrency(value)}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="income" 
          stroke="#10B981" 
          strokeWidth={2}
          name="Gelir"
          dot={{ r: 4 }}
        />
        <Line 
          type="monotone" 
          dataKey="expense" 
          stroke="#EF4444" 
          strokeWidth={2}
          name="Gider"
          dot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}


























