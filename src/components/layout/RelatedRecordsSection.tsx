'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, Plus } from 'lucide-react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import type { LucideIcon } from 'lucide-react'

interface RelatedRecord {
  id: string
  title: string
  subtitle?: string
  status?: string
  amount?: number
  date?: string
  href: string
}

interface RelatedRecordsSectionProps {
  title: string
  icon?: LucideIcon
  records: RelatedRecord[]
  onCreateNew?: () => void
  onCreateLabel?: string
  viewAllUrl?: string
  emptyMessage?: string
}

/**
 * QuickBooks tarzı ilişkili kayıtlar bölümü
 * Detay sayfalarında hızlı erişim için mini kartlar
 */
export default function RelatedRecordsSection({
  title,
  icon: Icon,
  records,
  onCreateNew,
  onCreateLabel = 'Yeni Oluştur',
  viewAllUrl,
  emptyMessage = 'Henüz kayıt yok',
}: RelatedRecordsSectionProps) {
  const locale = useLocale()

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-2.5 px-3">
        <div className="flex items-center gap-1.5">
          {Icon && <Icon className="h-3.5 w-3.5 text-indigo-600" />}
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          {records.length > 0 && (
            <span className="text-xs text-gray-500">({records.length})</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {onCreateNew && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCreateNew}
              className="h-7 text-xs px-1.5"
            >
              <Plus className="h-3 w-3 mr-0.5" />
              {onCreateLabel}
            </Button>
          )}
          {viewAllUrl && (
            <Button variant="ghost" size="sm" asChild className="h-7 text-xs px-1.5">
              <Link href={viewAllUrl}>
                Tümü
                <ArrowRight className="ml-0.5 h-3 w-3" />
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        {records.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <p className="text-xs">{emptyMessage}</p>
            {onCreateNew && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCreateNew}
                className="mt-2 h-7 text-xs"
              >
                <Plus className="mr-1 h-3 w-3" />
                {onCreateLabel}
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {records.slice(0, 6).map((record, index) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/${locale}${record.href}`}>
                  <Card className="border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200 cursor-pointer h-full">
                    <CardContent className="p-2.5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-xs text-gray-900 truncate">
                            {record.title}
                          </h4>
                          {record.subtitle && (
                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                              {record.subtitle}
                            </p>
                          )}
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            {record.status && (
                              <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-700">
                                {record.status}
                              </span>
                            )}
                            {record.amount && (
                              <span className="text-xs font-medium text-gray-900">
                                {new Intl.NumberFormat('tr-TR', {
                                  style: 'currency',
                                  currency: 'TRY',
                                  maximumFractionDigits: 0,
                                }).format(record.amount)}
                              </span>
                            )}
                          </div>
                          {record.date && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Date(record.date).toLocaleDateString('tr-TR', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

