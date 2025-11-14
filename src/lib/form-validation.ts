/**
 * Form validation utilities
 * Toast mesajı ve otomatik scroll için yardımcı fonksiyonlar
 */

import React from 'react'
import { toast } from './toast'
import { FieldErrors } from 'react-hook-form'

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
  const errorMessage = getErrorMessage(errors[firstError])
  
  // Toast mesajı göster
  toast.error(
    'Form Hatası',
    errorMessage || 'Lütfen tüm zorunlu alanları doldurun.'
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
function getErrorMessage(error: any): string {
  if (!error) return ''
  
  if (typeof error.message === 'string') {
    return error.message
  }
  
  if (error.type === 'required') {
    return 'Bu alan zorunludur.'
  }
  
  if (error.type === 'min') {
    return `Minimum ${error.minimum || error.min} karakter gerekli.`
  }
  
  if (error.type === 'max') {
    return `Maksimum ${error.maximum || error.max} karakter olabilir.`
  }
  
  return 'Geçersiz değer.'
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


