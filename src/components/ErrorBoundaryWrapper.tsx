'use client'

import { ErrorBoundary } from './ErrorBoundary'
import { ReactNode } from 'react'

interface ErrorBoundaryWrapperProps {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * ErrorBoundary wrapper - Server Component'lerden kullanılabilir
 * ErrorBoundary zaten Client Component, bu wrapper sadece import'u kolaylaştırır
 */
export default function ErrorBoundaryWrapper({
  children,
  fallback,
}: ErrorBoundaryWrapperProps) {
  return <ErrorBoundary fallback={fallback}>{children}</ErrorBoundary>
}






















