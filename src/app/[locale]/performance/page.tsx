'use client'

import { useEffect, useState } from 'react'
import { usePerformance } from '@/hooks/usePerformance'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react'

interface Metric {
  name: string
  value: number
  threshold: number
  unit: string
  status: 'good' | 'warning' | 'error'
}

export default function PerformancePage() {
  const { metrics } = usePerformance()
  const [performanceMetrics, setPerformanceMetrics] = useState<Metric[]>([])

  useEffect(() => {
    // Performance metriklerini hesapla
    const calculatedMetrics: Metric[] = [
      {
        name: 'Page Load Time',
        value: metrics.pageLoadTime,
        threshold: 500,
        unit: 'ms',
        status: metrics.pageLoadTime === 0 ? 'good' : metrics.pageLoadTime < 500 ? 'good' : metrics.pageLoadTime < 1000 ? 'warning' : 'error',
      },
      {
        name: 'Route Transition',
        value: metrics.routeTransition,
        threshold: 300,
        unit: 'ms',
        status: metrics.routeTransition === 0 ? 'good' : metrics.routeTransition < 300 ? 'good' : metrics.routeTransition < 500 ? 'warning' : 'error',
      },
      {
        name: 'Prefetch Time',
        value: metrics.prefetchTime,
        threshold: 200,
        unit: 'ms',
        status: metrics.prefetchTime === 0 ? 'good' : metrics.prefetchTime < 200 ? 'good' : metrics.prefetchTime < 500 ? 'warning' : 'error',
      },
      {
        name: 'API Response Time',
        value: metrics.apiResponseTime,
        threshold: 200,
        unit: 'ms',
        status: metrics.apiResponseTime === 0 ? 'good' : metrics.apiResponseTime < 200 ? 'good' : metrics.apiResponseTime < 1000 ? 'warning' : 'error',
      },
    ]

    setPerformanceMetrics(calculatedMetrics)
  }, [metrics])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'good':
        return <Badge className="bg-green-500">İyi</Badge>
      case 'warning':
        return <Badge className="bg-yellow-500">Uyarı</Badge>
      case 'error':
        return <Badge className="bg-red-500">Kötü</Badge>
      default:
        return <Badge>Bilinmiyor</Badge>
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Performance Monitoring</h1>
        <p className="text-muted-foreground mt-2">
          Gerçek zamanlı performans metrikleri ve ölçümler
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {performanceMetrics.map((metric) => (
          <Card key={metric.name}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{metric.name}</CardTitle>
                {getStatusIcon(metric.status)}
              </div>
              <CardDescription>Hedef: &lt; {metric.threshold}{metric.unit}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {metric.value > 0 ? `${metric.value.toFixed(2)}` : '0.00'}
                    <span className="text-sm text-muted-foreground ml-1">{metric.unit}</span>
                  </span>
                  {getStatusBadge(metric.status)}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      metric.status === 'good'
                        ? 'bg-green-500'
                        : metric.status === 'warning'
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{
                      width: `${Math.min((metric.value / metric.threshold) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Hedefleri</CardTitle>
          <CardDescription>CRM sisteminin performans hedefleri</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-semibold">Sekme Geçişi</p>
                <p className="text-sm text-muted-foreground">Hedef: &lt; 300ms</p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-semibold">Dashboard İlk Render</p>
                <p className="text-sm text-muted-foreground">Hedef: &lt; 500ms</p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-semibold">API Response (Cache Hit)</p>
                <p className="text-sm text-muted-foreground">Hedef: &lt; 200ms</p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-semibold">API Response (Cache Miss)</p>
                <p className="text-sm text-muted-foreground">Hedef: &lt; 1000ms</p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-semibold">Lighthouse Performance</p>
                <p className="text-sm text-muted-foreground">Hedef: &gt; 95</p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}




