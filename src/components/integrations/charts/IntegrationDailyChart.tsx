'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface IntegrationDailyChartProps {
  data: Array<{
    date: string
    email: number
    sms: number
    whatsapp: number
    calendar: number
    total: number
    failed: number
  }>
}

export default function IntegrationDailyChart({ data }: IntegrationDailyChartProps) {
  // Tarih formatını düzenle (YYYY-MM-DD -> DD/MM)
  const formattedData = data.map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }),
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={formattedData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="email" stroke="#6366f1" name="E-posta" strokeWidth={2} />
        <Line type="monotone" dataKey="sms" stroke="#3b82f6" name="SMS" strokeWidth={2} />
        <Line type="monotone" dataKey="whatsapp" stroke="#10b981" name="WhatsApp" strokeWidth={2} />
        <Line type="monotone" dataKey="calendar" stroke="#8b5cf6" name="Takvim" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  )
}

