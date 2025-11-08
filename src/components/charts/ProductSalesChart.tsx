'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface ProductSalesChartProps {
  data: Array<{ name: string; value: number }>
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#06b6d4']

// Ürün adını kısalt (max 20 karakter)
const truncateName = (name: string, maxLength: number = 20) => {
  if (name.length <= maxLength) return name
  return name.substring(0, maxLength) + '...'
}

export default function ProductSalesChart({ data }: ProductSalesChartProps) {
  // Eğer data yoksa veya boşsa placeholder göster
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        <p>Henüz ürün satış verisi yok</p>
      </div>
    )
  }

  // Toplam değeri hesapla (yüzde için)
  const total = data.reduce((sum, item) => sum + item.value, 0)

  // Veriyi yüzde ile zenginleştir
  const enrichedData = data.map((item) => ({
    ...item,
    percent: total > 0 ? (item.value / total) * 100 : 0,
    displayName: truncateName(item.name),
  }))

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={enrichedData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            type="number" 
            tick={{ fill: '#6B7280', fontSize: 12 }}
            tickFormatter={(value) => {
              if (value >= 1000000) return `₺${(value / 1000000).toFixed(1)}M`
              if (value >= 1000) return `₺${(value / 1000).toFixed(0)}k`
              return `₺${value}`
            }}
          />
          <YAxis 
            type="category" 
            dataKey="displayName" 
            tick={{ fill: '#6B7280', fontSize: 12 }}
            width={120}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              padding: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            formatter={(value: number, name: string, props: any) => [
              `₺${new Intl.NumberFormat('tr-TR').format(value)} (${props.payload.percent.toFixed(1)}%)`,
              'Satış Tutarı',
            ]}
            labelStyle={{ fontWeight: 600, color: '#1F2937' }}
            cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
          />
          <Bar
            dataKey="value"
            radius={[0, 8, 8, 0]}
            shape={(props: any) => {
              const { payload, x, y, width, height } = props
              const index = enrichedData.findIndex((item) => item.name === payload.name)
              const color = COLORS[index % COLORS.length]
              
              return (
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  fill={color}
                  rx={8}
                  ry={8}
                  style={{ transition: 'opacity 0.2s', cursor: 'pointer' }}
                />
              )
            }}
          />
        </BarChart>
      </ResponsiveContainer>
      
      {/* Custom Legend - Daha düzenli ve scrollable */}
      <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
        <div className="grid grid-cols-1 gap-2">
          {enrichedData.map((entry, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-3 p-2 rounded-md hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm font-medium text-gray-700 truncate" title={entry.name}>
                  {entry.displayName}
                </span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-sm font-semibold text-gray-900">
                  {entry.percent.toFixed(1)}%
                </span>
                <span className="text-xs text-gray-500">
                  ₺{new Intl.NumberFormat('tr-TR').format(entry.value)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}





