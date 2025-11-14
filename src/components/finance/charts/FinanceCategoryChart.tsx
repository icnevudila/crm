'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface FinanceCategoryChartProps {
  incomeData: Record<string, number>
  expenseData: Record<string, number>
  categoryLabels: Record<string, string>
}

const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#EF4444', '#6366F1', '#14B8A6']

export default function FinanceCategoryChart({ 
  incomeData, 
  expenseData, 
  categoryLabels 
}: FinanceCategoryChartProps) {
  const chartData = useMemo(() => {
    const income = Object.entries(incomeData)
      .map(([category, amount]) => ({
        name: categoryLabels[category] || category,
        value: amount,
        type: 'Gelir',
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 8) // En büyük 8 kategori

    const expense = Object.entries(expenseData)
      .map(([category, amount]) => ({
        name: categoryLabels[category] || category,
        value: amount,
        type: 'Gider',
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 8) // En büyük 8 kategori

    return { income, expense }
  }, [incomeData, expenseData, categoryLabels])

  if (chartData.income.length === 0 && chartData.expense.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        <p>Henüz kategori verisi yok</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {chartData.income.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Gelir Kategorileri</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartData.income}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.income.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#F9FAFB',
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {chartData.expense.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Gider Kategorileri</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartData.expense}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.expense.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#F9FAFB',
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}




















