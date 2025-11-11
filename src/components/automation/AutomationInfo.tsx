'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Zap, ArrowRight, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AutomationItem {
  action: string // "Bunu yaparsan"
  result: string // "Burada kayıt açılır"
  details?: string[] // Ek detaylar
}

interface AutomationInfoProps {
  title: string
  automations: AutomationItem[]
  className?: string
}

export function AutomationInfo({ title, automations, className }: AutomationInfoProps) {
  if (!automations || automations.length === 0) return null

  return (
    <Card className={cn('border-yellow-200 bg-yellow-50/50', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-700" />
          <CardTitle className="text-base font-semibold text-yellow-900">
            {title}
          </CardTitle>
        </div>
        <CardDescription className="text-yellow-800">
          Bu modülde yapacağın işlemler otomatik olarak başka kayıtlar oluşturur
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {automations.map((automation, index) => (
          <div key={index} className="rounded-lg bg-white p-3 border border-yellow-200">
            <div className="flex items-start gap-2">
              <ArrowRight className="h-4 w-4 mt-0.5 flex-shrink-0 text-yellow-700" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-yellow-900">
                  <span className="text-yellow-800">{automation.action}</span>
                  {' → '}
                  <span className="text-yellow-900">{automation.result}</span>
                </p>
                {automation.details && automation.details.length > 0 && (
                  <ul className="space-y-1 pl-4 mt-2">
                    {automation.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="text-xs text-yellow-800 flex items-start gap-1.5">
                        <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}




