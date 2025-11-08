'use client'

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface UserPerformanceChartProps {
  data: Array<{ user: string; sales: number; quotes: number; deals: number }>
}

export default function UserPerformanceChart({ data }: UserPerformanceChartProps) {
  // Eğer data yoksa veya boşsa placeholder göster
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[350px] text-gray-500">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-sm font-medium">Henüz performans verisi yok</p>
        <p className="text-xs text-gray-400 mt-1">Kullanıcı aktiviteleri görüntülendiğinde burada görünecek</p>
      </div>
    )
  }

  // Data formatını düzelt - RadarChart için doğru formata çevir
  // Kullanıcı isimlerini kısalt ve temizle
  const chartData = data
    .map((item) => ({
      user: (item.user || 'Kullanıcı').substring(0, 12).trim(), // Kısa isim, max 12 karakter
      sales: Math.max(0, item.sales || 0),
      quotes: Math.max(0, item.quotes || 0),
      deals: Math.max(0, item.deals || 0),
    }))
    // Maksimum 10 kullanıcı göster - performans için
    .filter((item, index) => index < 10)
    // Kullanıcı isimlerini benzersiz yap - aynı isim varsa numara ekle
    .map((item, index, arr) => {
      const sameNameCount = arr.filter((i, idx) => idx < index && i.user === item.user).length
      return {
        ...item,
        user: sameNameCount > 0 ? `${item.user} ${sameNameCount + 1}` : item.user,
      }
    })

  // Eğer hiç veri yoksa placeholder göster
  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[350px] text-gray-500">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-sm font-medium">Henüz performans verisi yok</p>
        <p className="text-xs text-gray-400 mt-1">Kullanıcı aktiviteleri görüntülendiğinde burada görünecek</p>
      </div>
    )
  }

  // Maksimum değeri hesapla - domain için
  const allValues = chartData.flatMap(item => [item.sales, item.quotes, item.deals])
  const maxValue = Math.max(...allValues, 1) // En az 1 olsun
  
  // Domain'i yuvarlat - daha temiz görünüm için
  // Eğer tüm değerler 0 ise, domain'i 10 yap ki grafik görünsün
  const domainMax = maxValue > 0 ? Math.ceil(maxValue * 1.2) : 10

  return (
    <div className="w-full h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart 
          data={chartData} 
          margin={{ top: 30, right: 40, bottom: 30, left: 40 }}
        >
          <PolarGrid 
            stroke="#E5E7EB" 
            strokeWidth={1}
            strokeDasharray="3 3"
          />
          <PolarAngleAxis 
            dataKey="user" 
            tick={{ 
              fill: '#4B5563', 
              fontSize: 11, 
              fontWeight: 600,
              textAnchor: 'middle'
            }}
            className="text-xs"
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, domainMax]} 
            tick={{ 
              fill: '#9CA3AF', 
              fontSize: 10,
              fontWeight: 500
            }}
            tickCount={6}
            tickFormatter={(value) => {
              if (value >= 1000) return `${(value / 1000).toFixed(1)}k`
              return value.toString()
            }}
          />
          <Radar
            name="Satış"
            dataKey="sales"
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={0.6}
            strokeWidth={3}
            dot={{ r: 5, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 7 }}
            isAnimationActive={true}
          />
          <Radar
            name="Teklifler"
            dataKey="quotes"
            stroke="#8b5cf6"
            fill="#8b5cf6"
            fillOpacity={0.6}
            strokeWidth={3}
            dot={{ r: 5, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 7 }}
            isAnimationActive={true}
          />
          <Radar
            name="Fırsatlar"
            dataKey="deals"
            stroke="#ec4899"
            fill="#ec4899"
            fillOpacity={0.6}
            strokeWidth={3}
            dot={{ r: 5, fill: '#ec4899', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 7 }}
            isAnimationActive={true}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            labelStyle={{ 
              fontWeight: 600, 
              marginBottom: '6px',
              color: '#111827',
              fontSize: '13px'
            }}
            formatter={(value: number, name: string) => {
              if (name === 'Satış') return [`₺${value.toLocaleString('tr-TR')}`, name]
              return [value.toLocaleString('tr-TR'), name]
            }}
          />
          <Legend 
            wrapperStyle={{ 
              paddingTop: '24px',
              fontSize: '12px',
              fontWeight: 500
            }}
            iconType="circle"
            iconSize={10}
            formatter={(value) => <span style={{ color: '#4B5563' }}>{value}</span>}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}







