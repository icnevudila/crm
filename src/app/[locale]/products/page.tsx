'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Package, Layers } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import ModuleSection from '@/components/layout/ModuleSection'
import SkeletonList from '@/components/skeletons/SkeletonList'

const ProductList = dynamic(() => import('@/components/products/ProductList'), {
  ssr: false,
  loading: () => <SkeletonList />,
})

const ProductBundleList = dynamic(() => import('@/components/product-bundles/ProductBundleList'), {
  ssr: false,
  loading: () => <SkeletonList />,
})

export default function ProductsPage() {
  const tNav = useTranslations('nav')
  const tProducts = useTranslations('productsPage')
  const tBundles = useTranslations('productBundles')
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  
  // URL parametresinden tab'ı belirle, yoksa varsayılan olarak "products"
  const [defaultTab, setDefaultTab] = useState<'products' | 'bundles'>(
    tabParam === 'bundles' ? 'bundles' : 'products'
  )

  // URL parametresi değiştiğinde tab'ı güncelle
  useEffect(() => {
    if (tabParam === 'bundles') {
      setDefaultTab('bundles')
    } else {
      setDefaultTab('products')
    }
  }, [tabParam])

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
        {({ isOpen }) => (
          <Tabs value={defaultTab} onValueChange={(v) => setDefaultTab(v as 'products' | 'bundles')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="products" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                {tNav('products')}
              </TabsTrigger>
              <TabsTrigger value="bundles" className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                {tNav('productBundles')}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="products" className="mt-0">
              <ProductList isOpen={isOpen} />
            </TabsContent>
            
            <TabsContent value="bundles" className="mt-0">
              <ProductBundleList />
            </TabsContent>
          </Tabs>
        )}
      </ModuleSection>
    </div>
  )
}





