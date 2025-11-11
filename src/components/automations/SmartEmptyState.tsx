'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, FileText, Users, Receipt, Briefcase } from 'lucide-react'
import Link from 'next/link'
import { useLocale } from 'next-intl'

interface SmartEmptyStateProps {
  entityType: 'quotes' | 'customers' | 'invoices' | 'deals' | 'products'
  onCreateClick?: () => void
}

/**
 * SmartEmptyState - Boş ekranlarda akıllı öneri
 * "Hiç teklif yok." yazmak yerine:
 * "Henüz teklif oluşturmadın, bir tane oluşturmak ister misin?" + "Teklif Oluştur" butonu
 */
export default function SmartEmptyState({
  entityType,
  onCreateClick,
}: SmartEmptyStateProps) {
  const locale = useLocale()

  const config = {
    quotes: {
      icon: FileText,
      title: 'Henüz teklif oluşturmadın',
      message: 'İlk teklifini oluşturarak müşterilerine profesyonel teklifler sunmaya başla.',
      buttonText: 'Teklif Oluştur',
      href: `/${locale}/quotes/new`,
    },
    customers: {
      icon: Users,
      title: 'Henüz müşteri eklemedin',
      message: 'İlk müşterini ekleyerek CRM sistemini kullanmaya başla.',
      buttonText: 'Müşteri Ekle',
      href: `/${locale}/customers/new`,
    },
    invoices: {
      icon: Receipt,
      title: 'Henüz fatura oluşturmadın',
      message: 'İlk faturanı oluşturarak satış sürecini başlat.',
      buttonText: 'Fatura Oluştur',
      href: `/${locale}/invoices/new`,
    },
    deals: {
      icon: Briefcase,
      title: 'Henüz fırsat oluşturmadın',
      message: 'İlk fırsatını oluşturarak satış sürecini takip etmeye başla.',
      buttonText: 'Fırsat Oluştur',
      href: `/${locale}/deals/new`,
    },
    products: {
      icon: Plus,
      title: 'Henüz ürün eklemedin',
      message: 'İlk ürününü ekleyerek ürün kataloğunu oluşturmaya başla.',
      buttonText: 'Ürün Ekle',
      href: `/${locale}/products/new`,
    },
  }

  const entityConfig = config[entityType]
  const Icon = entityConfig.icon

  return (
    <Card className="p-8 text-center bg-gradient-to-br from-slate-50 to-indigo-50 border-indigo-100">
      <div className="flex flex-col items-center gap-4">
        <div className="p-4 rounded-full bg-indigo-100">
          <Icon className="h-8 w-8 text-indigo-600" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-gray-900">
            {entityConfig.title}
          </h3>
          <p className="text-gray-600 max-w-md">
            {entityConfig.message}
          </p>
        </div>

        {onCreateClick ? (
          <Button
            onClick={onCreateClick}
            className="mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            {entityConfig.buttonText}
          </Button>
        ) : (
          <Link href={entityConfig.href} prefetch={true}>
            <Button className="mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              {entityConfig.buttonText}
            </Button>
          </Link>
        )}
      </div>
    </Card>
  )
}



import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, FileText, Users, Receipt, Briefcase } from 'lucide-react'
import Link from 'next/link'
import { useLocale } from 'next-intl'

interface SmartEmptyStateProps {
  entityType: 'quotes' | 'customers' | 'invoices' | 'deals' | 'products'
  onCreateClick?: () => void
}

/**
 * SmartEmptyState - Boş ekranlarda akıllı öneri
 * "Hiç teklif yok." yazmak yerine:
 * "Henüz teklif oluşturmadın, bir tane oluşturmak ister misin?" + "Teklif Oluştur" butonu
 */
export default function SmartEmptyState({
  entityType,
  onCreateClick,
}: SmartEmptyStateProps) {
  const locale = useLocale()

  const config = {
    quotes: {
      icon: FileText,
      title: 'Henüz teklif oluşturmadın',
      message: 'İlk teklifini oluşturarak müşterilerine profesyonel teklifler sunmaya başla.',
      buttonText: 'Teklif Oluştur',
      href: `/${locale}/quotes/new`,
    },
    customers: {
      icon: Users,
      title: 'Henüz müşteri eklemedin',
      message: 'İlk müşterini ekleyerek CRM sistemini kullanmaya başla.',
      buttonText: 'Müşteri Ekle',
      href: `/${locale}/customers/new`,
    },
    invoices: {
      icon: Receipt,
      title: 'Henüz fatura oluşturmadın',
      message: 'İlk faturanı oluşturarak satış sürecini başlat.',
      buttonText: 'Fatura Oluştur',
      href: `/${locale}/invoices/new`,
    },
    deals: {
      icon: Briefcase,
      title: 'Henüz fırsat oluşturmadın',
      message: 'İlk fırsatını oluşturarak satış sürecini takip etmeye başla.',
      buttonText: 'Fırsat Oluştur',
      href: `/${locale}/deals/new`,
    },
    products: {
      icon: Plus,
      title: 'Henüz ürün eklemedin',
      message: 'İlk ürününü ekleyerek ürün kataloğunu oluşturmaya başla.',
      buttonText: 'Ürün Ekle',
      href: `/${locale}/products/new`,
    },
  }

  const entityConfig = config[entityType]
  const Icon = entityConfig.icon

  return (
    <Card className="p-8 text-center bg-gradient-to-br from-slate-50 to-indigo-50 border-indigo-100">
      <div className="flex flex-col items-center gap-4">
        <div className="p-4 rounded-full bg-indigo-100">
          <Icon className="h-8 w-8 text-indigo-600" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-gray-900">
            {entityConfig.title}
          </h3>
          <p className="text-gray-600 max-w-md">
            {entityConfig.message}
          </p>
        </div>

        {onCreateClick ? (
          <Button
            onClick={onCreateClick}
            className="mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            {entityConfig.buttonText}
          </Button>
        ) : (
          <Link href={entityConfig.href} prefetch={true}>
            <Button className="mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              {entityConfig.buttonText}
            </Button>
          </Link>
        )}
      </div>
    </Card>
  )
}









































