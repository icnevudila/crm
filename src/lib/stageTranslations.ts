/**
 * Stage/Status Türkçe Çevirileri
 * Tüm İngilizce stage isimlerini Türkçe'ye çevirir
 */

// Deal Stage Çevirileri
export const DEAL_STAGE_TRANSLATIONS: Record<string, string> = {
  LEAD: 'Potansiyel',
  CONTACTED: 'İletişimde',
  PROPOSAL: 'Teklif',
  NEGOTIATION: 'Pazarlık',
  WON: 'Kazanıldı',
  LOST: 'Kaybedildi',
}

// Quote Status Çevirileri
export const QUOTE_STATUS_TRANSLATIONS: Record<string, string> = {
  DRAFT: 'Taslak',
  SENT: 'Gönderildi',
  ACCEPTED: 'Kabul Edildi',
  REJECTED: 'Reddedildi',
  EXPIRED: 'Süresi Doldu',
  WAITING: 'Beklemede',
}

// Invoice Status Çevirileri
export const INVOICE_STATUS_TRANSLATIONS: Record<string, string> = {
  DRAFT: 'Taslak',
  SENT: 'Gönderildi',
  PAID: 'Ödendi',
  OVERDUE: 'Vadesi Geçti',
  CANCELLED: 'İptal Edildi',
  SHIPPED: 'Sevk Edildi',
  RECEIVED: 'Teslim Alındı',
}

// Contract Status Çevirileri
export const CONTRACT_STATUS_TRANSLATIONS: Record<string, string> = {
  DRAFT: 'Taslak',
  ACTIVE: 'Aktif',
  EXPIRED: 'Süresi Doldu',
  TERMINATED: 'Feshedildi',
}

// Genel çeviri fonksiyonu
export function translateStage(
  stage: string,
  type: 'deal' | 'quote' | 'invoice' | 'contract' = 'deal'
): string {
  const translations: Record<string, Record<string, string>> = {
    deal: DEAL_STAGE_TRANSLATIONS,
    quote: QUOTE_STATUS_TRANSLATIONS,
    invoice: INVOICE_STATUS_TRANSLATIONS,
    contract: CONTRACT_STATUS_TRANSLATIONS,
  }

  return translations[type]?.[stage] || stage
}

// Çoklu stage çevirisi (array için)
export function translateStages(
  stages: string[],
  type: 'deal' | 'quote' | 'invoice' | 'contract' = 'deal'
): string[] {
  return stages.map((stage) => translateStage(stage, type))
}

// Stage çevirisi ile mesaj oluşturma
export function getStageMessage(
  stage: string,
  type: 'deal' | 'quote' | 'invoice' | 'contract',
  context: 'immutable' | 'transition' | 'delete' = 'immutable'
): { title: string; description: string } {
  const translatedStage = translateStage(stage, type)

  switch (context) {
    case 'immutable':
      return {
        title: `${translatedStage} durumundaki kayıtlar taşınamaz`,
        description: getImmutableDescription(stage, type),
      }
    case 'transition':
      return {
        title: `Geçiş yapılamıyor`,
        description: getTransitionDescription(stage, type),
      }
    case 'delete':
      return {
        title: `${translatedStage} durumundaki kayıtlar silinemez`,
        description: getDeleteDescription(stage, type),
      }
    default:
      return { title: '', description: '' }
  }
}

// Immutable açıklama mesajları
function getImmutableDescription(
  stage: string,
  type: 'deal' | 'quote' | 'invoice' | 'contract'
): string {
  const messages: Record<string, Record<string, string>> = {
    deal: {
      WON: 'Bu fırsat kazanıldı ve sözleşme oluşturuldu. Değişiklik yapmak için önce sözleşmeyi iptal edin.',
      LOST: 'Bu fırsat kaybedildi ve işlem tamamlandı. Yeni bir fırsat oluşturmanız gerekiyor.',
    },
    quote: {
      ACCEPTED: 'Bu teklif kabul edildi ve faturası oluşturuldu. Değişiklik yapmak için önce faturayı iptal edin.',
      REJECTED: 'Bu teklif reddedildi ve işlem tamamlandı. Yeni bir teklif oluşturmanız gerekiyor.',
      EXPIRED: 'Bu teklif süresi doldu. Yeni bir teklif oluşturmanız gerekiyor.',
    },
    invoice: {
      PAID: 'Bu fatura ödendiği için değiştirilemez. İptal etmek için önce ödemeyi geri alın.',
      CANCELLED: 'Bu fatura iptal edildi. Yeni bir fatura oluşturmanız gerekiyor.',
    },
    contract: {
      ACTIVE: 'Bu sözleşme aktif olduğu için değiştirilemez. Feshetmek için sözleşme sonlandırma işlemini yapın.',
      EXPIRED: 'Bu sözleşme süresi doldu. Yeni bir sözleşme oluşturmanız gerekiyor.',
      TERMINATED: 'Bu sözleşme feshedildi. Yeni bir sözleşme oluşturmanız gerekiyor.',
    },
  }

  return messages[type]?.[stage] || 'Bu kayıt değiştirilemez durumda.'
}

// Transition açıklama mesajları
function getTransitionDescription(
  stage: string,
  type: 'deal' | 'quote' | 'invoice' | 'contract'
): string {
  const messages: Record<string, Record<string, string>> = {
    deal: {
      LEAD: 'Önce İletişimde aşamasına geçmelisiniz.',
      CONTACTED: 'Önce Teklif aşamasına geçmelisiniz.',
      PROPOSAL: 'Önce Pazarlık aşamasına geçmelisiniz.',
      NEGOTIATION: 'Fırsatı Kazanıldı veya Kaybedildi olarak işaretleyebilirsiniz.',
    },
    quote: {
      DRAFT: 'Teklifi Gönderildi olarak işaretleyin.',
      SENT: 'Teklifi Kabul Edildi, Reddedildi veya Süresi Doldu olarak işaretleyebilirsiniz.',
    },
    invoice: {
      DRAFT: 'Faturayı Gönderildi olarak işaretleyin.',
      SENT: 'Faturayı Ödendi, Vadesi Geçti veya İptal Edildi olarak işaretleyebilirsiniz.',
    },
  }

  return messages[type]?.[stage] || 'Geçersiz geçiş. Lütfen sırayla ilerleyin.'
}

// Delete açıklama mesajları
function getDeleteDescription(
  stage: string,
  type: 'deal' | 'quote' | 'invoice' | 'contract'
): string {
  const messages: Record<string, Record<string, string>> = {
    deal: {
      WON: 'Kazanılan fırsatlar silinemez. Önce sözleşmeyi iptal edin.',
      LOST: 'Kaybedilen fırsatlar silinemez.',
    },
    quote: {
      ACCEPTED: 'Kabul edilen teklifler silinemez. Önce faturayı iptal edin.',
      REJECTED: 'Reddedilen teklifler silinemez.',
    },
    invoice: {
      PAID: 'Ödenen faturalar silinemez.',
      CANCELLED: 'İptal edilen faturalar silinemez.',
    },
    contract: {
      ACTIVE: 'Aktif sözleşmeler silinemez. Önce sözleşmeyi sonlandırın.',
      EXPIRED: 'Süresi dolan sözleşmeler silinemez.',
      TERMINATED: 'Feshedilen sözleşmeler silinemez.',
    },
  }

  return messages[type]?.[stage] || 'Bu kayıt silinemez durumda.'
}


