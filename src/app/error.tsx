'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    // Log error to error reporting service
    if (process.env.NODE_ENV === 'development') {
      console.error('Error:', error)
    }
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 p-6">
      <Card className="p-8 max-w-md w-full text-center">
        <h1 className="text-4xl font-bold mb-4 text-red-600">Bir Hata Oluştu</h1>
        <p className="text-gray-600 mb-2">
          {error.message || 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.'}
        </p>
        {error.digest && (
          <p className="text-sm text-gray-500 mb-6">Hata Kodu: {error.digest}</p>
        )}
        <div className="flex gap-3 justify-center">
          <Button
            onClick={reset}
            className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white"
            aria-label="Sayfayı yeniden yükle"
          >
            Tekrar Dene
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/tr/dashboard')}
            aria-label="Dashboard'a dön"
          >
            Dashboard&apos;a Dön
          </Button>
        </div>
      </Card>
    </div>
  )
}





