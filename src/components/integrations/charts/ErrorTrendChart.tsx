'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface ErrorTrendChartProps {
  data: Array<{
    date: string
    count: number
    type: string
  }>
}

export default function ErrorTrendChart({ data }: ErrorTrendChartProps) {
  // Tarih bazlı gruplama
  const groupedData = data.reduce((acc, item) => {
    const date = new Date(item.date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })
    if (!acc[date]) {
      acc[date] = { date, count: 0 }
    }
    acc[date].count += item.count
    return acc
  }, {} as Record<string, { date: string; count: number }>)

  const chartData = Object.values(groupedData).sort((a, b) => a.date.localeCompare(b.date))

  if (chartData.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-gray-500">
        Hata kaydı yok
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="count" fill="#ef4444" name="Hata Sayısı" />
      </BarChart>
    </ResponsiveContainer>
  )
}

