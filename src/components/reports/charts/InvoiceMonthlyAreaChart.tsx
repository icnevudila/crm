'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface InvoiceMonthlyAreaChartProps {
  data: Array<{ month: string; count: number }>
}

export default function InvoiceMonthlyAreaChart({ data }: InvoiceMonthlyAreaChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        <p>Henüz fatura verisi yok</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 60 }}>
        <defs>
          <linearGradient id="colorInvoice" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
          </linearGradient>
        </defs>
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
          formatter={(value: number) => [`${value} fatura`, 'Fatura Sayısı']}
          labelStyle={{ fontWeight: 600, color: '#1F2937' }}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#f59e0b"
          fillOpacity={1}
          fill="url(#colorInvoice)"
          name="Fatura Sayısı"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}



