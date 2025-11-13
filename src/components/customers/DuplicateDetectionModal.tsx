'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { AlertTriangle, Merge, X, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/lib/toast'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'

interface DuplicateCustomer {
  id: string
  name: string
  email?: string
  phone?: string
  city?: string
  sector?: string
  similarity: number
  matchReason: string
}

interface DuplicateGroup {
  group: number
  customers: DuplicateCustomer[]
}

interface DuplicatesResponse {
  duplicates: DuplicateGroup[]
  totalDuplicates: number
  totalCustomers: number
}

interface DuplicateDetectionModalProps {
  open: boolean
  onClose: () => void
  onMergeComplete?: () => void
}

export default function DuplicateDetectionModal({
  open,
  onClose,
  onMergeComplete,
}: DuplicateDetectionModalProps) {
  const t = useTranslations('customers')
  const tCommon = useTranslations('common')
  const [loading, setLoading] = useState(false)
  const [merging, setMerging] = useState<string | null>(null) // Merging group ID

  // Duplicate'leri çek
  const { data: duplicatesData, isLoading, error, mutate: mutateDuplicates } = useData<DuplicatesResponse>(
    open ? '/api/customers/duplicates' : null,
    {
      dedupingInterval: 0, // Her açılışta fresh data
      revalidateOnFocus: false,
    }
  )

  const duplicates = duplicatesData?.duplicates || []

  // Merge işlemi
  const handleMerge = async (keepId: string, removeId: string, groupNumber: number) => {
    if (!(await window.confirm('Bu müşterileri birleştirmek istediğinize emin misiniz? Bu işlem geri alınamaz.'))) {
      return
    }

    setMerging(`group-${groupNumber}`)
    try {
      const res = await fetch('/api/customers/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keepId, removeId }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Birleştirme başarısız oldu')
      }

      const result = await res.json()
      toast.success('Başarılı', result.message || 'Müşteriler başarıyla birleştirildi')

      // Duplicate listesini yenile
      await mutateDuplicates(undefined, { revalidate: true })

      // Customer listesini yenile
      await Promise.all([
        mutate('/api/customers', undefined, { revalidate: true }),
        mutate('/api/customers?', undefined, { revalidate: true }),
        mutate('/api/stats/customers', undefined, { revalidate: true }),
      ])

      if (onMergeComplete) {
        onMergeComplete()
      }
    } catch (error: any) {
      console.error('Merge error:', error)
      toast.error('Hata', error?.message || 'Birleştirme işlemi başarısız oldu')
    } finally {
      setMerging(null)
    }
  }

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Tekrar Eden Müşteriler
          </DialogTitle>
          <DialogDescription>
            Benzer müşteriler tespit edildi. İsterseniz bunları birleştirebilirsiniz.
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            <span className="ml-2 text-gray-600">Tekrarlar taranıyor...</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">Hata: {error.message || 'Tekrarlar yüklenemedi'}</p>
          </div>
        )}

        {!isLoading && !error && duplicates.length === 0 && (
          <div className="p-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <p className="text-gray-600 text-lg font-medium">Tebrikler!</p>
            <p className="text-gray-500 mt-2">Tekrar eden müşteri bulunamadı.</p>
          </div>
        )}

        {!isLoading && !error && duplicates.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div>
                <p className="font-semibold text-yellow-900">
                  {duplicates.length} grup tekrar eden müşteri bulundu
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Toplam {duplicatesData?.totalCustomers || 0} müşteri içinde
                </p>
              </div>
            </div>

            {duplicates.map((group) => (
              <Card key={group.group} className="border-yellow-200">
                <CardHeader>
                  <CardTitle className="text-sm text-gray-600">
                    Grup {group.group} - {group.customers.length} müşteri
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {group.customers.map((customer, index) => (
                      <div
                        key={customer.id}
                        className={`p-4 rounded-lg border ${
                          index === 0
                            ? 'bg-indigo-50 border-indigo-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-gray-900">{customer.name}</h4>
                              {index === 0 && (
                                <Badge className="bg-indigo-600 text-white">Ana Kayıt</Badge>
                              )}
                              {index > 0 && (
                                <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                                  %{customer.similarity} Benzer
                                </Badge>
                              )}
                            </div>
                            <div className="space-y-1 text-sm text-gray-600">
                              {customer.email && (
                                <p>
                                  <span className="font-medium">Email:</span> {customer.email}
                                </p>
                              )}
                              {customer.phone && (
                                <p>
                                  <span className="font-medium">Telefon:</span> {customer.phone}
                                </p>
                              )}
                              {customer.city && (
                                <p>
                                  <span className="font-medium">Şehir:</span> {customer.city}
                                </p>
                              )}
                              {customer.sector && (
                                <p>
                                  <span className="font-medium">Sektör:</span> {customer.sector}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 mt-2">
                                Eşleşme: {customer.matchReason}
                              </p>
                            </div>
                          </div>
                          {index > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMerge(group.customers[0].id, customer.id, group.group)}
                              disabled={merging === `group-${group.group}`}
                              className="ml-4"
                            >
                              {merging === `group-${group.group}` ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Birleştiriliyor...
                                </>
                              ) : (
                                <>
                                  <Merge className="h-4 w-4 mr-2" />
                                  Birleştir
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

