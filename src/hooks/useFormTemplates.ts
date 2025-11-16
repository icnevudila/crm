/**
 * Form Templates Hook
 * Hazır form şablonları için - localStorage ile hafif saklama
 * Multi-tenant desteği - companyId ile izolasyon
 */

import { useState, useEffect, useCallback } from 'react'
import { useSession } from './useSession'

export interface FormTemplate {
  id: string
  name: string
  formType: 'customer' | 'deal' | 'quote' | 'invoice' | 'task' | 'ticket'
  data: Record<string, any> // Form verileri
  createdAt: number
  updatedAt: number
}

interface UseFormTemplatesOptions {
  /**
   * Form tipi (opsiyonel - filtreleme için)
   */
  formType?: FormTemplate['formType']
  
  /**
   * Maksimum şablon sayısı (performans için)
   */
  maxTemplates?: number
}

/**
 * Form Templates Hook
 * localStorage ile hafif saklama
 */
export function useFormTemplates({
  formType,
  maxTemplates = 20, // Performans için maksimum 20 şablon
}: UseFormTemplatesOptions = {}) {
  const { data: session } = useSession()
  const companyId = session?.user?.companyId || 'default'
  // Multi-tenant desteği - her şirket için ayrı localStorage key
  const storageKey = `crm_form_templates_${companyId}`
  
  const [templates, setTemplates] = useState<FormTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // localStorage'dan yükle (sadece client-side)
  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoading(false)
      return
    }

    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsed = JSON.parse(stored) as FormTemplate[]
        
        // Form tipine göre filtrele
        let filtered = parsed
        if (formType) {
          filtered = parsed.filter((template) => template.formType === formType)
        }
        
        // Maksimum sayıyı kontrol et
        const limited = filtered.slice(0, maxTemplates)
        
        setTemplates(limited)
      }
    } catch (e) {
      console.error('Failed to load form templates:', e)
    } finally {
      setIsLoading(false)
    }
  }, [formType, maxTemplates, storageKey, companyId])

  // localStorage'a kaydet
  const saveToStorage = useCallback(
    (templatesToSave: FormTemplate[]) => {
      if (typeof window === 'undefined') return

      try {
        // Tüm şablonları al
        const allStored = localStorage.getItem(storageKey)
        let allTemplates: FormTemplate[] = []
        
        if (allStored) {
          allTemplates = JSON.parse(allStored)
        }

        // Şablonları güncelle veya ekle
        templatesToSave.forEach((template) => {
          const index = allTemplates.findIndex((t) => t.id === template.id)
          if (index >= 0) {
            allTemplates[index] = template
          } else {
            allTemplates.push(template)
          }
        })

        // Maksimum sayıyı kontrol et (en yeni şablonları tut)
        const sorted = allTemplates.sort((a, b) => b.updatedAt - a.updatedAt)
        const limited = sorted.slice(0, maxTemplates * 2) // Global max

        localStorage.setItem(storageKey, JSON.stringify(limited))
      } catch (e) {
        console.error('Failed to save form templates:', e)
      }
    },
    [maxTemplates, storageKey, companyId]
  )

  // Şablon ekle
  const addTemplate = useCallback(
    (name: string, formType: FormTemplate['formType'], data: Record<string, any>) => {
      const newTemplate: FormTemplate = {
        id: `${Date.now()}-${Math.random()}`,
        name,
        formType,
        data,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      setTemplates((prev) => {
        const updated = [...prev, newTemplate].slice(0, maxTemplates)
        saveToStorage(updated)
        return updated
      })

      return newTemplate.id
    },
    [formType, maxTemplates, saveToStorage]
  )

  // Şablon güncelle
  const updateTemplate = useCallback(
    (id: string, updates: Partial<Pick<FormTemplate, 'name' | 'data'>>) => {
      setTemplates((prev) => {
        const updated = prev.map((template) =>
          template.id === id
            ? { ...template, ...updates, updatedAt: Date.now() }
            : template
        )
        saveToStorage(updated)
        return updated
      })
    },
    [saveToStorage]
  )

  // Şablon sil
  const deleteTemplate = useCallback(
    (id: string) => {
      setTemplates((prev) => {
        const updated = prev.filter((template) => template.id !== id)
        saveToStorage(updated)
        return updated
      })
    },
    [saveToStorage]
  )

  // Tüm şablonları temizle
  const clearTemplates = useCallback(() => {
    setTemplates([])
    if (typeof window !== 'undefined') {
      if (formType) {
        // Sadece bu form tipindeki şablonları temizle
        const allStored = localStorage.getItem(storageKey)
        if (allStored) {
          const allTemplates = JSON.parse(allStored) as FormTemplate[]
          const filtered = allTemplates.filter((t) => t.formType !== formType)
          localStorage.setItem(storageKey, JSON.stringify(filtered))
        }
      } else {
        localStorage.removeItem(storageKey)
      }
    }
  }, [formType, storageKey, companyId])

  return {
    templates,
    isLoading,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    clearTemplates,
  }
}





