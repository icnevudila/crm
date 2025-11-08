'use client'

import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface FinancialIncomeExpenseComposedChartProps {
  data: Array<{ month: string; income: number; expense: number }>
}

export default function FinancialIncomeExpenseComposedChart({ data }: FinancialIncomeExpenseComposedChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        <p>Henüz finansal veri yok</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
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
          formatter={(value: number, name: string) => {
            return [`₺${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(value)}`, name === 'income' ? 'Gelir' : 'Gider']
          }}
          labelStyle={{ fontWeight: 600, color: '#1F2937' }}
        />
        <Legend />
        <Bar 
          dataKey="income" 
          fill="#10b981" 
          name="Gelir"
          radius={[8, 8, 0, 0]}
        />
        <Bar 
          dataKey="expense" 
          fill="#ef4444" 
          name="Gider"
          radius={[8, 8, 0, 0]}
        />
        <Line 
          type="monotone" 
          dataKey="income" 
          stroke="#10b981" 
          strokeWidth={2}
          dot={false}
          name="Gelir Trendi"
        />
        <Line 
          type="monotone" 
          dataKey="expense" 
          stroke="#ef4444" 
          strokeWidth={2}
          dot={false}
          name="Gider Trendi"
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}



