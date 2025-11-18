/**
 * Quick Action Helper
 * Kayıt oluşturulduktan sonra "Detay sayfasına gitmek ister misiniz?" toast'u gösterir
 */

'use client'

import { toast } from '@/lib/toast'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'

/**
 * Entity tipine göre Türkçe isim döndürür
 */
const getEntityName = (entityType: string): string => {
  const entityNames: Record<string, string> = {
    deal: 'Fırsat',
    quote: 'Teklif',
    invoice: 'Fatura',
    meeting: 'Toplantı',
    task: 'Görev',
    shipment: 'Sevkiyat',
    customer: 'Müşteri',
    product: 'Ürün',
    ticket: 'Destek Talebi',
    contract: 'Sözleşme',
    finance: 'Finans Kaydı',
    vendor: 'Tedarikçi',
  }
  return entityNames[entityType] || entityType
}

/**
 * Kayıt oluşturulduktan sonra detay sayfasına gitmek isteyip istemediğini sorar
 * @param entityType - Entity tipi (deal, quote, invoice, meeting, task, vb.)
 * @param entityId - Oluşturulan kaydın ID'si
 * @param entityTitle - Oluşturulan kaydın başlığı (toast mesajında gösterilir)
 * @param locale - Locale (tr/en)
 * @param router - Next.js router instance
 */
export function showNavigateToDetailToast(
  entityType: string,
  entityId: string,
  entityTitle: string,
  locale: string,
  router: ReturnType<typeof useRouter>
) {
  const entityName = getEntityName(entityType)
  
  // Güvenlik: entityTitle undefined veya null ise varsayılan değer kullan
  const safeEntityTitle = entityTitle || entityName || 'Kayıt'

  toast.success(
    `${entityName} oluşturuldu`,
    `${safeEntityTitle} başarıyla oluşturuldu. Detay sayfasına gitmek ister misiniz?`,
    {
      duration: 6000, // 6 saniye - kullanıcının karar vermesi için yeterli süre
      action: {
        label: 'Evet, Git',
        onClick: () => {
          // Entity tipine göre URL oluştur (çoğul form)
          // Güvenlik: entityId ve locale kontrolü
          if (entityId && locale) {
            const entityTypePlural = entityType === 'finance' ? 'finance' : `${entityType}s`
            router.push(`/${locale}/${entityTypePlural}/${entityId}`)
          }
        },
      },
      cancel: {
        label: 'Hayır',
        onClick: () => {
          // Kullanıcı "Hayır" dedi, hiçbir şey yapma
        },
      },
    }
  )
}

/**
 * Hook versiyonu - component içinde kullanım için
 */
export function useNavigateToDetailToast() {
  const router = useRouter()
  const locale = useLocale()

  return (entityType: string, entityId: string, entityTitle: string) => {
    showNavigateToDetailToast(entityType, entityId, entityTitle, locale, router)
  }
}

/**
 * Quick Action Success Handler Hook
 * Quick action işlemlerinden sonra kullanılır
 */
export function useQuickActionSuccess() {
  const router = useRouter()
  const locale = useLocale()

  const handleQuickActionSuccess = (params: { entityType: string; entityName?: string; entityId: string; entityTitle?: string }) => {
    const entityTitle = params.entityTitle || params.entityName || params.entityId
    showNavigateToDetailToast(params.entityType, params.entityId, entityTitle, locale, router)
  }

  return { handleQuickActionSuccess }
}

