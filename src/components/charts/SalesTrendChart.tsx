'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface SalesTrendChartProps {
  data: Array<{ month: string; total_sales: number }>
}

export default function SalesTrendChart({ data }: SalesTrendChartProps) {
  // Debug: Gelen veriyi logla
  if (process.env.NODE_ENV === 'development') {
    console.log('SalesTrendChart - Received data:', data)
    console.log('SalesTrendChart - Data length:', data?.length || 0)
    console.log('SalesTrendChart - Data sample:', data?.slice(0, 3))
  }

  // Eğer data yoksa veya boşsa placeholder göster
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-sm font-medium">Henüz satış trend verisi yok</p>
        <p className="text-xs text-gray-400 mt-1">Fatura verileri görüntülendiğinde burada görünecek</p>
      </div>
    )
  }

  // Veriyi formatla - month formatını düzelt
  const formattedData = data.map((item) => ({
    month: item.month?.substring(0, 7) || item.month || 'N/A', // YYYY-MM formatı
    total_sales: Math.max(0, item.total_sales || 0),
  }))

  // Debug: Formatlanmış veriyi logla
  if (process.env.NODE_ENV === 'development') {
    console.log('SalesTrendChart - Formatted data:', formattedData)
    console.log('SalesTrendChart - Formatted data sample:', formattedData.slice(0, 3))
    console.log('SalesTrendChart - Total sales sum:', formattedData.reduce((sum, item) => sum + item.total_sales, 0))
  }

  // Maksimum değeri hesapla - Y ekseni için
  const maxValue = Math.max(...formattedData.map(item => item.total_sales), 1)
  const yAxisMax = Math.ceil(maxValue * 1.2) // %20 padding

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart 
        data={formattedData} 
        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" opacity={0.3} />
        <XAxis 
          dataKey="month" 
          className="text-xs"
          tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 500 }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis 
          className="text-xs"
          tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 500 }}
          tickFormatter={(value) => {
            if (value >= 1000000) return `₺${(value / 1000000).toFixed(1)}M`
            if (value >= 1000) return `₺${(value / 1000).toFixed(0)}k`
            return `₺${value}`
          }}
          domain={[0, yAxisMax]}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            padding: '12px 16px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            fontSize: '13px',
          }}
          labelStyle={{ fontWeight: 600, marginBottom: '8px', color: '#111827', fontSize: '14px' }}
          formatter={(value: number) => [
            `₺${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(value)}`,
            'Aylık Satış'
          ]}
          cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
        />
        <Legend 
          wrapperStyle={{ paddingTop: '16px', fontSize: '12px', fontWeight: 500 }}
          iconType="rect"
          iconSize={12}
        />
        <Bar
          dataKey="total_sales"
          name="Aylık Satış"
          fill="url(#colorGradient)"
          radius={[12, 12, 0, 0]}
          className="hover:opacity-90 transition-opacity"
        >
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.8} />
            </linearGradient>
          </defs>
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}







