'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface IntegrationPieChartProps {
  email: number
  sms: number
  whatsapp: number
  calendar: number
}

const COLORS = {
  email: '#6366f1',
  sms: '#3b82f6',
  whatsapp: '#10b981',
  calendar: '#8b5cf6',
}

export default function IntegrationPieChart({ email, sms, whatsapp, calendar }: IntegrationPieChartProps) {
  const data = [
    { name: 'E-posta', value: email, color: COLORS.email },
    { name: 'SMS', value: sms, color: COLORS.sms },
    { name: 'WhatsApp', value: whatsapp, color: COLORS.whatsapp },
    { name: 'Takvim', value: calendar, color: COLORS.calendar },
  ].filter((item) => item.value > 0) // Sadece değeri olanları göster

  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-gray-500">
        Henüz veri yok
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

