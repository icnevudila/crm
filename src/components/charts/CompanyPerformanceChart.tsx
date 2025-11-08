'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface CompanyPerformanceChartProps {
  data: Array<{ user: string; sales: number; quotes: number; deals: number }>
}

export default function CompanyPerformanceChart({ data }: CompanyPerformanceChartProps) {
  // Eğer data yoksa veya boşsa placeholder göster
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <p className="text-sm font-medium">Henüz kurum performans verisi yok</p>
        <p className="text-xs text-gray-400 mt-1">Kurum aktiviteleri görüntülendiğinde burada görünecek</p>
      </div>
    )
  }

  // Data formatını düzelt - BarChart için doğru formata çevir
  // Kullanıcı isimlerini kısalt ve temizle (kurum isimleri olarak)
  const chartData = data
    .map((item) => ({
      company: (item.user || 'Kurum').substring(0, 15).trim(), // Kısa isim, max 15 karakter
      sales: Math.max(0, item.sales || 0),
      quotes: Math.max(0, item.quotes || 0),
      deals: Math.max(0, item.deals || 0),
    }))
    // Maksimum 8 kurum göster - performans için
    .filter((item, index) => index < 8)
    // Kurum isimlerini benzersiz yap - aynı isim varsa numara ekle
    .map((item, index, arr) => {
      const sameNameCount = arr.filter((i, idx) => idx < index && i.company === item.company).length
      return {
        ...item,
        company: sameNameCount > 0 ? `${item.company} ${sameNameCount + 1}` : item.company,
      }
    })

  // Eğer hiç veri yoksa placeholder göster
  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <p className="text-sm font-medium">Henüz kurum performans verisi yok</p>
        <p className="text-xs text-gray-400 mt-1">Kurum aktiviteleri görüntülendiğinde burada görünecek</p>
      </div>
    )
  }

  // Maksimum değeri hesapla - Y ekseni için
  const allValues = chartData.flatMap(item => [item.sales, item.quotes, item.deals])
  const maxValue = Math.max(...allValues, 1) // En az 1 olsun
  const yAxisMax = Math.ceil(maxValue * 1.2) // %20 padding

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart 
        data={chartData} 
        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
        <XAxis 
          dataKey="company" 
          className="text-xs"
          tick={{ fill: '#6B7280', fontSize: 11 }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis 
          className="text-xs"
          tick={{ fill: '#6B7280', fontSize: 11 }}
          tickFormatter={(value) => {
            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
            if (value >= 1000) return `${(value / 1000).toFixed(0)}k`
            return value.toString()
          }}
          domain={[0, yAxisMax]}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            padding: '10px 14px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
          labelStyle={{ fontWeight: 600, marginBottom: '6px', color: '#111827' }}
          formatter={(value: number, name: string) => {
            if (name === 'Satış') return [`₺${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(value)}`, name]
            return [value.toLocaleString('tr-TR'), name]
          }}
        />
        <Legend 
          wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
          iconType="rect"
        />
        <Bar
          dataKey="sales"
          name="Satış"
          fill="#6366f1"
          radius={[8, 8, 0, 0]}
          className="hover:opacity-80 transition-opacity"
        />
        <Bar
          dataKey="quotes"
          name="Teklifler"
          fill="#8b5cf6"
          radius={[8, 8, 0, 0]}
          className="hover:opacity-80 transition-opacity"
        />
        <Bar
          dataKey="deals"
          name="Fırsatlar"
          fill="#ec4899"
          radius={[8, 8, 0, 0]}
          className="hover:opacity-80 transition-opacity"
        />
      </BarChart>
    </ResponsiveContainer>
  )
}



