'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'

export default function ProductBundlesPage() {
  const router = useRouter()
  const locale = useLocale()
  const searchParams = useSearchParams()
  const bundleId = searchParams.get('bundleId')

  useEffect(() => {
    // Ürünler sayfasına yönlendir, bundles tab'ını aç
    if (bundleId) {
      // Detay sayfası için - detay sayfasına yönlendir
      router.replace(`/${locale}/product-bundles/${bundleId}`)
    } else {
      // Liste sayfası için - ürünler sayfasına yönlendir
      router.replace(`/${locale}/products?tab=bundles`)
    }
  }, [router, locale, bundleId])

  return null // Yönlendirme yapılırken hiçbir şey gösterme
}


