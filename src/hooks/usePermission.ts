'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useData } from './useData'

export interface PermissionCheck {
  canRead: boolean
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
}

/**
 * Client-side permission hook - gerçek zamanlı yetki kontrolü
 * @param module - Modül kodu (customer, deal, quote, invoice, etc.)
 * @param options - Hook seçenekleri
 */
export function usePermission(
  module: string,
  options: {
    redirectOnNoAccess?: boolean
    redirectTo?: string
    checkInterval?: number // Polling interval (ms) - yetki değişikliklerini dinle
  } = {}
) {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [permissions, setPermissions] = useState<PermissionCheck>({
    canRead: false,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
  })
  const [loading, setLoading] = useState(true)

  const {
    redirectOnNoAccess = false,
    redirectTo = '/dashboard',
    checkInterval = 10000, // 10 saniyede bir kontrol et
  } = options

  // Yetkileri çek
  const { data: permissionData, mutate } = useData<PermissionCheck>(
    session?.user?.id ? `/api/permissions/check?module=${module}` : null,
    {
      dedupingInterval: 5000, // 5 saniye cache
      revalidateOnFocus: true, // Focus'ta yeniden kontrol et
      refreshInterval: checkInterval, // Polling - yetki değişikliklerini dinle
    }
  )

  useEffect(() => {
    if (!session?.user?.id) {
      setLoading(false)
      return
    }

    if (permissionData) {
      setPermissions(permissionData)
      setLoading(false)

      // Yetki yoksa ve redirect isteniyorsa, yönlendir
      if (redirectOnNoAccess && !permissionData.canRead) {
        router.push(redirectTo)
      }
    }
  }, [permissionData, session, redirectOnNoAccess, redirectTo, router])

  // Pathname değiştiğinde yetkileri yeniden kontrol et
  useEffect(() => {
    if (pathname && session?.user?.id) {
      mutate()
    }
  }, [pathname, session, mutate])

  return {
    permissions,
    loading,
    canRead: permissions.canRead,
    canCreate: permissions.canCreate,
    canUpdate: permissions.canUpdate,
    canDelete: permissions.canDelete,
    refetch: mutate,
  }
}












