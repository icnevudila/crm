'use client'

import dynamic from 'next/dynamic'
import { Package } from 'lucide-react'
import { useTranslations } from 'next-intl'

import ModuleSection from '@/components/layout/ModuleSection'
import SkeletonList from '@/components/skeletons/SkeletonList'

const ProductList = dynamic(() => import('@/components/products/ProductList'), {
  ssr: false,
  loading: () => <SkeletonList />,
})

export default function ProductsPage() {
  const tNav = useTranslations('nav')
  const tProducts = useTranslations('productsPage')

  return (
    <div className="space-y-4 p-4">
      <ModuleSection
        storageKey="products-section"
        title={tNav('products')}
        description={tProducts('description', {
          defaultMessage: 'Ürünleri stok durumuna göre yönetin, fiyat ve kategorilere göre filtreleyin.',
        })}
        icon={Package}
        defaultOpen
      >
        {({ isOpen }) => <ProductList isOpen={isOpen} />}
      </ModuleSection>
    </div>
  )
}





