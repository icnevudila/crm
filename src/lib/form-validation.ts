/**
 * Form validation utilities
 * Toast mesajı ve otomatik scroll için yardımcı fonksiyonlar
 */

import React from 'react'
import { toast } from './toast'
import { FieldErrors } from 'react-hook-form'

/**
 * Alan adlarını Türkçe'ye çevir
 */
const fieldLabels: Record<string, string> = {
  name: 'İsim',
  firstName: 'Ad',
  lastName: 'Soyad',
  email: 'E-posta',
  phone: 'Telefon',
  title: 'Ünvan',
  company: 'Şirket',
  companyName: 'Şirket Adı',
  customerCompanyId: 'Müşteri Firması',
  dealId: 'Fırsat',
  quoteId: 'Teklif',
  invoiceId: 'Fatura',
  vendorId: 'Tedarikçi',
  productId: 'Ürün',
  status: 'Durum',
  stage: 'Aşama',
  value: 'Değer',
  total: 'Toplam',
  description: 'Açıklama',
  notes: 'Notlar',
  address: 'Adres',
  city: 'Şehir',
  country: 'Ülke',
  taxNumber: 'Vergi Numarası',
  taxOffice: 'Vergi Dairesi',
  sector: 'Sektör',
  meetingDate: 'Toplantı Tarihi',
  meetingTime: 'Toplantı Saati',
  validUntil: 'Geçerlilik Tarihi',
  discount: 'İndirim',
  taxRate: 'KDV Oranı',
  quantity: 'Miktar',
  price: 'Fiyat',
  password: 'Şifre',
  confirmPassword: 'Şifre Tekrar',
  role: 'Rol',
  isPrimary: 'Birincil',
  linkedin: 'LinkedIn',
  website: 'Web Sitesi',
  imageUrl: 'Görsel URL',
  logoUrl: 'Logo URL',
}

/**
 * Alan adını Türkçe'ye çevir
 */
function getFieldLabel(fieldName: string): string {
  return fieldLabels[fieldName] || fieldName
}

/**
 * Form hatalarını kontrol et ve kullanıcıya göster
 * @param errors - react-hook-form errors objesi
 * @param formRef - Form element referansı (scroll için)
 */
export function handleFormValidationErrors(
  errors: FieldErrors<any>,
  formRef?: React.RefObject<HTMLFormElement>
) {
  // İlk hatayı bul
  const firstError = Object.keys(errors)[0]
  
  if (!firstError) {
    return false
  }

  // Hata mesajını al
  const errorMessage = getErrorMessage(errors[firstError], firstError)
  const fieldLabel = getFieldLabel(firstError)
  
  // Toast mesajı göster - alan adını da göster
  toast.error(
    'Form Hatası',
    errorMessage || `${fieldLabel} alanı zorunludur.`
  )

  // İlk hatalı alana scroll yap
  if (formRef?.current) {
    scrollToFirstError(formRef.current, firstError)
  } else {
    // Form ref yoksa document'ten bul
    scrollToFirstErrorInDocument(firstError)
  }

  return true
}

/**
 * Hata mesajını çıkar
 */
function getErrorMessage(error: any, fieldName: string): string {
  if (!error) return ''
  
  const fieldLabel = getFieldLabel(fieldName)
  
  if (typeof error.message === 'string' && error.message.trim()) {
    // Eğer mesaj zaten alan adını içeriyorsa olduğu gibi döndür
    if (error.message.toLowerCase().includes(fieldLabel.toLowerCase()) || 
        error.message.toLowerCase().includes(fieldName.toLowerCase())) {
      return error.message
    }
    // Mesaj alan adını içermiyorsa ekle
    return `${fieldLabel}: ${error.message}`
  }
  
  if (error.type === 'required') {
    return `${fieldLabel} alanı zorunludur.`
  }
  
  if (error.type === 'min') {
    const min = error.minimum || error.min
    if (typeof min === 'number') {
      return `${fieldLabel} alanı en az ${min} karakter olmalıdır.`
    }
    return `${fieldLabel} alanı minimum değer gereksinimini karşılamıyor.`
  }
  
  if (error.type === 'max') {
    const max = error.maximum || error.max
    if (typeof max === 'number') {
      return `${fieldLabel} alanı en fazla ${max} karakter olabilir.`
    }
    return `${fieldLabel} alanı maksimum değer gereksinimini aşıyor.`
  }
  
  if (error.type === 'email') {
    return `${fieldLabel} alanı geçerli bir e-posta adresi olmalıdır.`
  }
  
  if (error.type === 'invalid_type') {
    return `${fieldLabel} alanı geçersiz formatta.`
  }
  
  return `${fieldLabel} alanında hata var.`
}

/**
 * Form içinde ilk hatalı alana scroll yap
 */
function scrollToFirstError(formElement: HTMLFormElement, fieldName: string) {
  // Input, select, textarea elementini bul
  const fieldElement = formElement.querySelector<HTMLElement>(
    `[name="${fieldName}"], 
     [id="${fieldName}"], 
     input[name="${fieldName}"], 
     select[name="${fieldName}"], 
     textarea[name="${fieldName}"]`
  )

  if (fieldElement) {
    // Scroll yap
    fieldElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
    
    // Focus yap (kullanıcı görebilsin)
    setTimeout(() => {
      if (fieldElement instanceof HTMLInputElement || 
          fieldElement instanceof HTMLSelectElement || 
          fieldElement instanceof HTMLTextAreaElement) {
        fieldElement.focus()
      }
    }, 300)
  }
}

/**
 * Document içinde ilk hatalı alana scroll yap (form ref yoksa)
 */
function scrollToFirstErrorInDocument(fieldName: string) {
  const fieldElement = document.querySelector<HTMLElement>(
    `[name="${fieldName}"], 
     [id="${fieldName}"], 
     input[name="${fieldName}"], 
     select[name="${fieldName}"], 
     textarea[name="${fieldName}"]`
  )

  if (fieldElement) {
    fieldElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
    
    setTimeout(() => {
      if (fieldElement instanceof HTMLInputElement || 
          fieldElement instanceof HTMLSelectElement || 
          fieldElement instanceof HTMLTextAreaElement) {
        fieldElement.focus()
      }
    }, 300)
  }
}


