'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowRight, FileText, Calendar, CheckCircle, XCircle, Send, Package, Truck } from 'lucide-react'
import { translateStage } from '@/lib/stageTranslations'
import { isValidDealTransition, isValidQuoteTransition, isValidInvoiceTransition } from '@/lib/stageValidation'

interface NextStepButton {
  id: string
  label: string
  icon: React.ReactNode
  onClick: () => void
  variant?: 'default' | 'outline' | 'secondary'
  priority?: 'high' | 'medium' | 'low'
}

interface NextStepButtonsProps {
  entityType: 'deal' | 'quote' | 'invoice'
  currentStatus: string
  onAction: (actionId: string) => void
  onCreateRelated?: (type: string) => void
}

export default function NextStepButtons({
  entityType,
  currentStatus,
  onAction,
  onCreateRelated,
}: NextStepButtonsProps) {
  const translatedStatus = translateStage(currentStatus, entityType)

  // Her entity type için sonraki adım butonları
  const getNextSteps = (): NextStepButton[] => {
    const steps: NextStepButton[] = []

    switch (entityType) {
      case 'deal':
        switch (currentStatus) {
          case 'LEAD':
            steps.push({
              id: 'contact',
              label: 'İletişime Geç',
              icon: <Calendar className="h-4 w-4" />,
              onClick: () => onAction('CONTACTED'),
              variant: 'default',
              priority: 'high',
            })
            if (onCreateRelated) {
              steps.push({
                id: 'create-meeting',
                label: 'Görüşme Planla',
                icon: <Calendar className="h-4 w-4" />,
                onClick: () => onCreateRelated('meeting'),
                variant: 'outline',
                priority: 'medium',
              })
            }
            break

          case 'CONTACTED':
            steps.push({
              id: 'proposal',
              label: 'Teklif Hazırla',
              icon: <FileText className="h-4 w-4" />,
              onClick: () => onAction('PROPOSAL'),
              variant: 'default',
              priority: 'high',
            })
            if (onCreateRelated) {
              steps.push({
                id: 'create-quote',
                label: 'Teklif Oluştur',
                icon: <FileText className="h-4 w-4" />,
                onClick: () => onCreateRelated('quote'),
                variant: 'outline',
                priority: 'high',
              })
            }
            break

          case 'PROPOSAL':
            steps.push({
              id: 'negotiation',
              label: 'Pazarlığa Geç',
              icon: <ArrowRight className="h-4 w-4" />,
              onClick: () => onAction('NEGOTIATION'),
              variant: 'default',
              priority: 'high',
            })
            if (onCreateRelated) {
              steps.push({
                id: 'create-meeting',
                label: 'Pazarlık Görüşmesi',
                icon: <Calendar className="h-4 w-4" />,
                onClick: () => onCreateRelated('meeting'),
                variant: 'outline',
                priority: 'medium',
              })
            }
            break

          case 'NEGOTIATION':
            steps.push(
              {
                id: 'won',
                label: 'Kazanıldı',
                icon: <CheckCircle className="h-4 w-4" />,
                onClick: () => onAction('WON'),
                variant: 'default',
                priority: 'high',
              },
              {
                id: 'lost',
                label: 'Kaybedildi',
                icon: <XCircle className="h-4 w-4" />,
                onClick: () => onAction('LOST'),
                variant: 'outline',
                priority: 'medium',
              }
            )
            break
        }
        break

      case 'quote':
        switch (currentStatus) {
          case 'DRAFT':
            steps.push({
              id: 'send',
              label: 'Gönder',
              icon: <Send className="h-4 w-4" />,
              onClick: () => onAction('SENT'),
              variant: 'default',
              priority: 'high',
            })
            break

          case 'SENT':
            steps.push(
              {
                id: 'accept',
                label: 'Kabul Et',
                icon: <CheckCircle className="h-4 w-4" />,
                onClick: () => onAction('ACCEPTED'),
                variant: 'default',
                priority: 'high',
              },
              {
                id: 'reject',
                label: 'Reddet',
                icon: <XCircle className="h-4 w-4" />,
                onClick: () => onAction('REJECTED'),
                variant: 'outline',
                priority: 'medium',
              }
            )
            break
        }
        break

      case 'invoice':
        switch (currentStatus) {
          case 'DRAFT':
            steps.push({
              id: 'send',
              label: 'Gönder',
              icon: <Send className="h-4 w-4" />,
              onClick: () => onAction('SENT'),
              variant: 'default',
              priority: 'high',
            })
            steps.push({
              id: 'cancel',
              label: 'İptal Et',
              icon: <XCircle className="h-4 w-4" />,
              onClick: () => onAction('CANCELLED'),
              variant: 'outline',
              priority: 'low',
            })
            break

          case 'SENT':
            steps.push(
              {
                id: 'mark-shipped',
                label: 'Sevkiyat Yapıldı',
                icon: <Truck className="h-4 w-4" />,
                onClick: () => onAction('SHIPPED'),
                variant: 'default',
                priority: 'high',
              },
              {
                id: 'mark-received',
                label: 'Mal Kabul Edildi',
                icon: <Package className="h-4 w-4" />,
                onClick: () => onAction('RECEIVED'),
                variant: 'outline',
                priority: 'medium',
              },
              {
                id: 'mark-paid',
                label: 'Ödendi Olarak İşaretle',
                icon: <CheckCircle className="h-4 w-4" />,
                onClick: () => onAction('PAID'),
                variant: 'outline',
                priority: 'medium',
              },
              {
                id: 'cancel',
                label: 'İptal Et',
                icon: <XCircle className="h-4 w-4" />,
                onClick: () => onAction('CANCELLED'),
                variant: 'outline',
                priority: 'low',
              }
            )
            if (onCreateRelated) {
              steps.push({
                id: 'create-shipment',
                label: 'Sevkiyat Oluştur',
                icon: <Package className="h-4 w-4" />,
                onClick: () => onCreateRelated('shipment'),
                variant: 'outline',
                priority: 'medium',
              })
            }
            break

          case 'SHIPPED':
            steps.push(
              {
                id: 'mark-received',
                label: 'Mal Kabul Edildi',
                icon: <Package className="h-4 w-4" />,
                onClick: () => onAction('RECEIVED'),
                variant: 'default',
                priority: 'high',
              },
              {
                id: 'mark-paid',
                label: 'Ödendi Olarak İşaretle',
                icon: <CheckCircle className="h-4 w-4" />,
                onClick: () => onAction('PAID'),
                variant: 'outline',
                priority: 'medium',
              },
              {
                id: 'cancel',
                label: 'İptal Et',
                icon: <XCircle className="h-4 w-4" />,
                onClick: () => onAction('CANCELLED'),
                variant: 'outline',
                priority: 'low',
              }
            )
            break

          case 'RECEIVED':
            steps.push(
              {
                id: 'mark-paid',
                label: 'Ödendi Olarak İşaretle',
                icon: <CheckCircle className="h-4 w-4" />,
                onClick: () => onAction('PAID'),
                variant: 'default',
                priority: 'high',
              },
              {
                id: 'cancel',
                label: 'İptal Et',
                icon: <XCircle className="h-4 w-4" />,
                onClick: () => onAction('CANCELLED'),
                variant: 'outline',
                priority: 'low',
              }
            )
            break

          case 'OVERDUE':
            steps.push(
              {
                id: 'mark-paid',
                label: 'Ödendi Olarak İşaretle',
                icon: <CheckCircle className="h-4 w-4" />,
                onClick: () => onAction('PAID'),
                variant: 'default',
                priority: 'high',
              },
              {
                id: 'cancel',
                label: 'İptal Et',
                icon: <XCircle className="h-4 w-4" />,
                onClick: () => onAction('CANCELLED'),
                variant: 'outline',
                priority: 'low',
              }
            )
            break
        }
        break
    }

    return steps
  }

  const nextSteps = getNextSteps()

  if (nextSteps.length === 0) {
    return null
  }

  const highPrioritySteps = nextSteps.filter((s) => s.priority === 'high')
  const otherSteps = nextSteps.filter((s) => s.priority !== 'high')

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <ArrowRight className="h-5 w-5 text-indigo-600" />
        Sonraki Adımlar
      </h3>
      <div className="space-y-3">
        {/* Yüksek öncelikli butonlar */}
        {highPrioritySteps.map((step) => (
          <Button
            key={step.id}
            onClick={step.onClick}
            variant={step.variant || 'default'}
            className="w-full justify-start"
            size="lg"
          >
            {step.icon}
            <span className="ml-2">{step.label}</span>
            <ArrowRight className="h-4 w-4 ml-auto" />
          </Button>
        ))}

        {/* Diğer butonlar */}
        {otherSteps.map((step) => (
          <Button
            key={step.id}
            onClick={step.onClick}
            variant={step.variant || 'outline'}
            className="w-full justify-start"
            size="lg"
          >
            {step.icon}
            <span className="ml-2">{step.label}</span>
          </Button>
        ))}
      </div>
    </Card>
  )
}


