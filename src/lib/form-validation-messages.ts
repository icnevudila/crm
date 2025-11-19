/**
 * Form Validation Mesajları
 * Zod schema'larında kullanılabilecek kullanıcı dostu Türkçe mesajlar
 */

/**
 * Alan adına göre kullanıcı dostu mesajlar
 */
export const FIELD_NAMES: Record<string, string> = {
  // Genel
  name: 'Ad',
  title: 'Başlık',
  description: 'Açıklama',
  email: 'E-posta',
  phone: 'Telefon',
  status: 'Durum',
  
  // Müşteri
  customerId: 'Müşteri',
  customerCompanyId: 'Müşteri Firma',
  
  // Fırsat
  dealId: 'Fırsat',
  stage: 'Aşama',
  value: 'Değer',
  priority: 'Öncelik',
  
  // Teklif
  quoteId: 'Teklif',
  total: 'Toplam',
  discount: 'İndirim',
  taxRate: 'KDV Oranı',
  validUntil: 'Geçerlilik Tarihi',
  vendorId: 'Tedarikçi',
  
  // Fatura
  invoiceId: 'Fatura',
  invoiceNumber: 'Fatura No',
  dueDate: 'Vade Tarihi',
  paidDate: 'Ödeme Tarihi',
  
  // Ürün
  productId: 'Ürün',
  price: 'Fiyat',
  stock: 'Stok',
  category: 'Kategori',
  sku: 'SKU',
  barcode: 'Barkod',
  minStock: 'Min Stok',
  maxStock: 'Max Stok',
  unit: 'Birim',
  
  // Görev
  taskId: 'Görev',
  assignedTo: 'Atanan',
  dueDate: 'Bitiş Tarihi',
  
  // Toplantı
  meetingDate: 'Toplantı Tarihi',
  meetingDuration: 'Süre',
  location: 'Konum',
  meetingUrl: 'Toplantı URL',
  meetingPassword: 'Toplantı Şifresi',
  
  // Diğer
  notes: 'Notlar',
  address: 'Adres',
  city: 'Şehir',
  country: 'Ülke',
  postalCode: 'Posta Kodu',
}

/**
 * Alan adını kullanıcı dostu formata çevirir
 */
export function getFieldName(fieldName: string): string {
  return FIELD_NAMES[fieldName] || fieldName
}

/**
 * Zorunlu alan mesajı
 */
export function requiredMessage(fieldName: string): string {
  const name = getFieldName(fieldName)
  return `${name} alanı zorunludur.`
}

/**
 * Minimum uzunluk mesajı
 */
export function minLengthMessage(fieldName: string, min: number): string {
  const name = getFieldName(fieldName)
  return `${name} en az ${min} karakter olmalıdır.`
}

/**
 * Maksimum uzunluk mesajı
 */
export function maxLengthMessage(fieldName: string, max: number): string {
  const name = getFieldName(fieldName)
  return `${name} en fazla ${max} karakter olabilir.`
}

/**
 * Minimum değer mesajı
 */
export function minValueMessage(fieldName: string, min: number): string {
  const name = getFieldName(fieldName)
  return `${name} en az ${min} olmalıdır.`
}

/**
 * Maksimum değer mesajı
 */
export function maxValueMessage(fieldName: string, max: number): string {
  const name = getFieldName(fieldName)
  return `${name} en fazla ${max} olabilir.`
}

/**
 * Email format mesajı
 */
export function emailMessage(): string {
  return 'Geçerli bir e-posta adresi girin.'
}

/**
 * URL format mesajı
 */
export function urlMessage(): string {
  return 'Geçerli bir URL girin.'
}

/**
 * Tarih mesajı
 */
export function dateMessage(): string {
  return 'Geçerli bir tarih seçin.'
}

/**
 * Gelecek tarih mesajı
 */
export function futureDateMessage(fieldName: string): string {
  const name = getFieldName(fieldName)
  return `${name} gelecek bir tarih olmalıdır.`
}

/**
 * Geçmiş tarih mesajı
 */
export function pastDateMessage(fieldName: string): string {
  const name = getFieldName(fieldName)
  return `${name} geçmiş bir tarih olmalıdır.`
}

/**
 * Pozitif sayı mesajı
 */
export function positiveNumberMessage(fieldName: string): string {
  const name = getFieldName(fieldName)
  return `${name} 0'dan büyük olmalıdır.`
}

/**
 * Negatif olmayan sayı mesajı
 */
export function nonNegativeNumberMessage(fieldName: string): string {
  const name = getFieldName(fieldName)
  return `${name} 0'dan küçük olamaz.`
}

/**
 * Yüzde mesajı
 */
export function percentageMessage(fieldName: string): string {
  const name = getFieldName(fieldName)
  return `${name} 0 ile 100 arasında olmalıdır.`
}

/**
 * Seçim mesajı
 */
export function selectMessage(fieldName: string): string {
  const name = getFieldName(fieldName)
  return `Lütfen bir ${name.toLowerCase()} seçin.`
}

/**
 * Helper text oluşturur
 */
export function createHelperText(
  fieldName: string,
  options?: {
    required?: boolean
    min?: number
    max?: number
    example?: string
    hint?: string
  }
): string {
  const name = getFieldName(fieldName)
  const parts: string[] = []
  
  if (options?.required) {
    parts.push('Zorunlu alan')
  }
  
  if (options?.min && options?.max) {
    parts.push(`${options.min}-${options.max} karakter`)
  } else if (options?.min) {
    parts.push(`En az ${options.min} karakter`)
  } else if (options?.max) {
    parts.push(`En fazla ${options.max} karakter`)
  }
  
  if (options?.example) {
    parts.push(`Örnek: ${options.example}`)
  }
  
  if (options?.hint) {
    parts.push(options.hint)
  }
  
  return parts.join(' • ')
}



