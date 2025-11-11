'use client'

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts'
import { Card } from '@/components/ui/card'

interface DealStatusChartProps {
  data: Array<{
    stage: string
    count: number
    totalValue: number
  }>
  onStageClick?: (stage: string) => void
}

const stageLabels: Record<string, string> = {
  LEAD: 'Potansiyel',
  CONTACTED: 'İletişimde',
  PROPOSAL: 'Teklif',
  NEGOTIATION: 'Pazarlık',
  WON: 'Kazanıldı',
  LOST: 'Kaybedildi',
}

const stageColors: Record<string, string> = {
  LEAD: '#3B82F6', // blue
  CONTACTED: '#8B5CF6', // purple
  PROPOSAL: '#F59E0B', // yellow
  NEGOTIATION: '#F97316', // orange
  WON: '#10B981', // green
  LOST: '#EF4444', // red
}

export default function DealStatusChart({ data, onStageClick }: DealStatusChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return []
    }

    return data
      .filter((item) => item.count > 0) // Sadece fırsat olan stage'leri göster
      .map((item) => ({
        name: stageLabels[item.stage] || item.stage,
        stage: item.stage,
        count: item.count,
        totalValue: item.totalValue || 0,
      }))
      .sort((a, b) => {
        // Sıralama: WON, NEGOTIATION, PROPOSAL, CONTACTED, LEAD, LOST
        const order: Record<string, number> = {
          WON: 1,
          NEGOTIATION: 2,
          PROPOSAL: 3,
          CONTACTED: 4,
          LEAD: 5,
          LOST: 6,
        }
        return (order[a.stage] || 99) - (order[b.stage] || 99)
      })
  }, [data])

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        <p>Henüz fırsat verisi yok</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={chartData}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        layout="vertical"
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis 
          type="number" 
          tick={{ fill: '#6B7280', fontSize: 12 }} 
          tickFormatter={(value) => Math.round(value).toString()} // Tam sayı göster
          allowDecimals={false} // Ondalık sayıları gösterme
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: '#6B7280', fontSize: 12 }}
          width={120}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
          formatter={(value: number, name: string, props: any) => {
            if (name === 'count') {
              return [`${value} fırsat`, 'Fırsat Sayısı']
            }
            if (name === 'totalValue') {
              return [
                new Intl.NumberFormat('tr-TR', {
                  style: 'currency',
                  currency: 'TRY',
                }).format(value),
                'Toplam Tutar',
              ]
            }
            return [value, name]
          }}
          labelStyle={{ fontWeight: 600, color: '#1F2937' }}
          cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
        />
        <Bar
          dataKey="count"
          radius={[0, 8, 8, 0]}
          onClick={(data: any) => {
            if (onStageClick && data?.stage) {
              onStageClick(data.stage)
            }
          }}
          shape={(props: any) => {
            const { payload, x, y, width, height } = props
            const color = stageColors[payload.stage] || '#6B7280'
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
                onClick={() => {
                  if (onStageClick && payload?.stage) {
                    onStageClick(payload.stage)
                  }
                }}
              />
            )
          }}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={stageColors[entry.stage] || '#6B7280'} />
          ))}
          {/* Bar'ların üzerine tam sayıları göster */}
          <LabelList
            dataKey="count"
            position="right"
            style={{ fill: '#374151', fontSize: '12px', fontWeight: 600 }}
            formatter={(value: number) => `${value}`} // Tam sayı göster
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}


