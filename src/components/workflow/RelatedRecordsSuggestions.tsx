'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, FileText, Calendar, Package, Users, Briefcase } from 'lucide-react'
import Link from 'next/link'
import { useLocale } from 'next-intl'

interface RelatedRecord {
  id: string
  type: string
  title: string
  link: string
  icon?: React.ReactNode
}

interface MissingRecord {
  type: string
  label: string
  icon: React.ReactNode
  onCreate: () => void
  description?: string
}

interface RelatedRecordsSuggestionsProps {
  entityType: 'deal' | 'quote' | 'invoice' | 'customer'
  entityId: string
  relatedRecords?: RelatedRecord[]
  missingRecords?: MissingRecord[]
}

export default function RelatedRecordsSuggestions({
  entityType,
  entityId,
  relatedRecords = [],
  missingRecords = [],
}: RelatedRecordsSuggestionsProps) {
  const locale = useLocale()

  if (relatedRecords.length === 0 && missingRecords.length === 0) {
    return null
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'quote':
        return <FileText className="h-4 w-4" />
      case 'invoice':
        return <FileText className="h-4 w-4" />
      case 'meeting':
        return <Calendar className="h-4 w-4" />
      case 'shipment':
        return <Package className="h-4 w-4" />
      case 'customer':
        return <Users className="h-4 w-4" />
      case 'deal':
        return <Briefcase className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-4">
      {/* Eksik Kayıtlar */}
      {missingRecords.length > 0 && (
        <Card className="p-6 border-amber-200 bg-amber-50">
          <h3 className="text-lg font-semibold mb-4 text-amber-900">
            Önerilen İşlemler
          </h3>
          <div className="space-y-2">
            {missingRecords.map((record) => (
              <div
                key={record.type}
                className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-200"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                    {record.icon}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{record.label}</p>
                    {record.description && (
                      <p className="text-sm text-gray-600">{record.description}</p>
                    )}
                  </div>
                </div>
                <Button
                  onClick={record.onCreate}
                  variant="outline"
                  size="sm"
                  className="border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Oluştur
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* İlişkili Kayıtlar */}
      {relatedRecords.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">İlişkili Kayıtlar</h3>
          <div className="space-y-2">
            {relatedRecords.map((record, index) => (
              <Link
                key={record.id ? `${record.type}-${record.id}` : `${record.type}-${index}`}
                href={record.link}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                  {record.icon || getIcon(record.type)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{record.title}</p>
                  <p className="text-sm text-gray-600 capitalize">{record.type}</p>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}


