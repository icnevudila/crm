'use client'

import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, Receipt, Truck, Plus } from 'lucide-react'
import Link from 'next/link'
import { useLocale } from 'next-intl'

interface QuickActionsProps {
  entityType: 'quote' | 'invoice' | 'shipment'
  entityId: string
  status: string
  relatedId?: string // quoteId for invoice, invoiceId for shipment
}

/**
 * QuickActions - Duruma göre hızlı işlem butonları
 * Teklif sayfasında durum ACCEPTED olduğunda "Fatura Oluştur" butonu parlar
 * Faturada "Sevkiyat Hazırla" butonu aktifleşir
 */
export default function QuickActions({
  entityType,
  entityId,
  status,
  relatedId,
}: QuickActionsProps) {
  const locale = useLocale()

  const actions = useMemo(() => {
    const actionList: Array<{
      label: string
      href: string
      icon: React.ReactNode
      variant: 'default' | 'outline' | 'secondary'
      glow?: boolean
    }> = []

    // Teklif ACCEPTED ise Fatura Oluştur butonu
    if (entityType === 'quote' && status === 'ACCEPTED') {
      actionList.push({
        label: 'Fatura Oluştur',
        href: `/${locale}/invoices/new?quoteId=${entityId}`,
        icon: <Receipt className="h-4 w-4" />,
        variant: 'default',
        glow: true, // Parlayan buton
      })
    }

    // Fatura SENT/PAID ise Sevkiyat Hazırla butonu
    if (entityType === 'invoice' && (status === 'SENT' || status === 'PAID')) {
      actionList.push({
        label: 'Sevkiyat Hazırla',
        href: `/${locale}/shipments/new?invoiceId=${entityId}`,
        icon: <Truck className="h-4 w-4" />,
        variant: 'default',
        glow: true,
      })
    }

    // Sevkiyat PENDING ise Onayla butonu
    if (entityType === 'shipment' && status === 'PENDING') {
      actionList.push({
        label: 'Sevkiyatı Onayla',
        href: `/${locale}/shipments/${entityId}`,
        icon: <Truck className="h-4 w-4" />,
        variant: 'default',
        glow: true,
      })
    }

    return actionList
  }, [entityType, status, entityId, locale])

  if (actions.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {actions.map((action, index) => (
        <Link key={index} href={action.href} prefetch={true}>
          <Button
            variant={action.variant}
            className={`flex items-center gap-2 ${
              action.glow
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50 hover:shadow-indigo-500/70 transition-all duration-300 animate-pulse'
                : ''
            }`}
          >
            {action.icon}
            {action.label}
          </Button>
        </Link>
      ))}
    </div>
  )
}



import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, Receipt, Truck, Plus } from 'lucide-react'
import Link from 'next/link'
import { useLocale } from 'next-intl'

interface QuickActionsProps {
  entityType: 'quote' | 'invoice' | 'shipment'
  entityId: string
  status: string
  relatedId?: string // quoteId for invoice, invoiceId for shipment
}

/**
 * QuickActions - Duruma göre hızlı işlem butonları
 * Teklif sayfasında durum ACCEPTED olduğunda "Fatura Oluştur" butonu parlar
 * Faturada "Sevkiyat Hazırla" butonu aktifleşir
 */
export default function QuickActions({
  entityType,
  entityId,
  status,
  relatedId,
}: QuickActionsProps) {
  const locale = useLocale()

  const actions = useMemo(() => {
    const actionList: Array<{
      label: string
      href: string
      icon: React.ReactNode
      variant: 'default' | 'outline' | 'secondary'
      glow?: boolean
    }> = []

    // Teklif ACCEPTED ise Fatura Oluştur butonu
    if (entityType === 'quote' && status === 'ACCEPTED') {
      actionList.push({
        label: 'Fatura Oluştur',
        href: `/${locale}/invoices/new?quoteId=${entityId}`,
        icon: <Receipt className="h-4 w-4" />,
        variant: 'default',
        glow: true, // Parlayan buton
      })
    }

    // Fatura SENT/PAID ise Sevkiyat Hazırla butonu
    if (entityType === 'invoice' && (status === 'SENT' || status === 'PAID')) {
      actionList.push({
        label: 'Sevkiyat Hazırla',
        href: `/${locale}/shipments/new?invoiceId=${entityId}`,
        icon: <Truck className="h-4 w-4" />,
        variant: 'default',
        glow: true,
      })
    }

    // Sevkiyat PENDING ise Onayla butonu
    if (entityType === 'shipment' && status === 'PENDING') {
      actionList.push({
        label: 'Sevkiyatı Onayla',
        href: `/${locale}/shipments/${entityId}`,
        icon: <Truck className="h-4 w-4" />,
        variant: 'default',
        glow: true,
      })
    }

    return actionList
  }, [entityType, status, entityId, locale])

  if (actions.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {actions.map((action, index) => (
        <Link key={index} href={action.href} prefetch={true}>
          <Button
            variant={action.variant}
            className={`flex items-center gap-2 ${
              action.glow
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50 hover:shadow-indigo-500/70 transition-all duration-300 animate-pulse'
                : ''
            }`}
          >
            {action.icon}
            {action.label}
          </Button>
        </Link>
      ))}
    </div>
  )
}

































































