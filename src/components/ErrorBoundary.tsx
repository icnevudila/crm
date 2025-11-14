'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { captureException } from '@/lib/sentry'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Sentry'ye gönder
    captureException(error, {
      errorInfo,
      componentStack: errorInfo.componentStack,
    })

    // Development'da console'a yazdır
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Card className="p-8 m-8 text-center">
          <h2 className="text-2xl font-bold mb-4 text-red-600">Bir Hata Oluştu</h2>
          <p className="text-gray-600 mb-6">
            {this.state.error?.message || 'Beklenmeyen bir hata oluştu. Lütfen sayfayı yenileyin.'}
          </p>
          <Button
            onClick={() => {
              this.setState({ hasError: false, error: undefined })
              window.location.reload()
            }}
          >
            Sayfayı Yenile
          </Button>
        </Card>
      )
    }

    return this.props.children
  }
}

// Default export
export default ErrorBoundary

// Named export (backward compatibility)
export { ErrorBoundary }

