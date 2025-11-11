'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { translateStage, getStageMessage } from '@/lib/stageTranslations'
import { isDealImmutable, isQuoteImmutable, isInvoiceImmutable, isContractImmutable } from '@/lib/stageValidation'

interface StatusInfoNoteProps {
  entityType: 'deal' | 'quote' | 'invoice' | 'contract'
  status: string
  stage?: string
  relatedRecords?: {
    type: string
    count: number
    message?: string
  }[]
}

export default function StatusInfoNote({
  entityType,
  status,
  stage,
  relatedRecords = [],
}: StatusInfoNoteProps) {
  const currentStatus = stage || status
  const translatedStatus = translateStage(currentStatus, entityType)

  // Immutable kontrolü
  let isImmutable = false
  let immutableMessage = ''

  switch (entityType) {
    case 'deal':
      isImmutable = isDealImmutable(currentStatus)
      break
    case 'quote':
      isImmutable = isQuoteImmutable(currentStatus)
      break
    case 'invoice':
      isImmutable = isInvoiceImmutable(currentStatus)
      break
    case 'contract':
      isImmutable = isContractImmutable(currentStatus)
      break
  }

  if (isImmutable) {
    const message = getStageMessage(currentStatus, entityType, 'immutable')
    immutableMessage = message.description
  }

  // İlişkili kayıt mesajları
  const relatedMessages: string[] = []
  relatedRecords.forEach((record) => {
    if (record.count > 0 && record.message) {
      relatedMessages.push(record.message)
    }
  })

  // Eğer immutable değilse ve ilişkili kayıt yoksa, bilgi notu gösterme
  if (!isImmutable && relatedMessages.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      {/* Immutable Durum Uyarısı */}
      {isImmutable && (
        <Alert className="border-amber-300 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-900 font-semibold">
            {translatedStatus} Durumundaki Kayıt
          </AlertTitle>
          <AlertDescription className="text-amber-800 text-sm mt-1">
            {immutableMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* İlişkili Kayıt Bilgileri */}
      {relatedMessages.length > 0 && (
        <Alert className="border-indigo-300 bg-indigo-50">
          <Info className="h-4 w-4 text-indigo-600" />
          <AlertTitle className="text-indigo-900 font-semibold">
            İlişkili Kayıtlar
          </AlertTitle>
          <AlertDescription className="text-indigo-800 text-sm mt-1">
            <ul className="list-disc list-inside space-y-1">
              {relatedMessages.map((msg, index) => (
                <li key={index}>{msg}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Yeni Oluşturulmuş Bilgisi */}
      {!isImmutable && relatedMessages.length === 0 && (
        <Alert className="border-blue-300 bg-blue-50">
          <CheckCircle className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-900 font-semibold">
            Kayıt Durumu
          </AlertTitle>
          <AlertDescription className="text-blue-800 text-sm mt-1">
            Bu kayıt <strong>{translatedStatus}</strong> durumunda ve değiştirilebilir.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}


