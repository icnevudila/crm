'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Zap, ArrowRight, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'

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
    <Card className={cn('border-indigo-200/70 bg-indigo-50/40 backdrop-blur-sm shadow-sm shadow-indigo-100/40', className)}>
      <Accordion type="single" collapsible defaultValue={undefined}>
        <AccordionItem value="automation-info" className="border-none">
          <AccordionTrigger className="px-4 py-3 transition hover:no-underline data-[state=closed]:bg-indigo-100/40 data-[state=open]:bg-white/80">
            <div className="flex items-center gap-3 text-left">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500/40">
                <Zap className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-indigo-900">{title}</p>
                  <Badge variant="secondary" className="border border-indigo-300 bg-indigo-100 text-[11px] text-indigo-800">
                    Otomasyon
                  </Badge>
                </div>
                <p className="text-xs text-indigo-700">
                  Otomatik işlemleri görmek için tıklayın
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-3">
              {automations.map((automation, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-indigo-200 bg-white/90 p-3 shadow-sm shadow-indigo-100/40"
                >
                  <div className="flex items-start gap-2">
                    <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-700" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium text-indigo-900">
                        <span className="text-indigo-800">{automation.action}</span>
                        {' → '}
                        <span className="text-indigo-900">{automation.result}</span>
                      </p>
                      {automation.details && automation.details.length > 0 && (
                        <ul className="mt-2 space-y-1 pl-4">
                          {automation.details.map((detail, detailIndex) => (
                            <li key={detailIndex} className="flex items-start gap-1.5 text-xs text-indigo-700">
                              <Info className="mt-0.5 h-3 w-3 flex-shrink-0" />
                              <span>{detail}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  )
}




