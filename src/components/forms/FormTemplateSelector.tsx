'use client'

import { useState } from 'react'
import { FileText, Plus, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useFormTemplates, type FormTemplate } from '@/hooks/useFormTemplates'
import { toast } from '@/lib/toast'

interface FormTemplateSelectorProps {
  /**
   * Form tipi
   */
  formType: FormTemplate['formType']
  
  /**
   * Şablon seçildiğinde çağrılır
   */
  onSelectTemplate: (template: FormTemplate) => void
  
  /**
   * Mevcut form verileri (şablon olarak kaydetmek için)
   */
  currentFormData?: Record<string, any>
  
  /**
   * Şablon kaydetme callback'i
   */
  onSaveTemplate?: (name: string, data: Record<string, any>) => void
  
  /**
   * ClassName
   */
  className?: string
}

/**
 * Form Template Selector Component
 * Hazır form şablonlarını seçme ve kaydetme
 */
export default function FormTemplateSelector({
  formType,
  onSelectTemplate,
  currentFormData,
  onSaveTemplate,
  className,
}: FormTemplateSelectorProps) {
  const { templates, isLoading, addTemplate, deleteTemplate } = useFormTemplates({ formType })
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [templateName, setTemplateName] = useState('')

  // Şablon seç
  const handleSelectTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId)
    if (template) {
      onSelectTemplate(template)
      toast.success('Şablon yüklendi', { description: 'Form şablonu başarıyla yüklendi.' })
    }
  }


  // Şablon kaydet
  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      toast.error('Şablon adı gereklidir')
      return
    }

    if (!currentFormData || Object.keys(currentFormData).length === 0) {
      toast.error('Form verisi bulunamadı')
      return
    }

    try {
      addTemplate(templateName.trim(), formType, currentFormData)
      toast.success('Şablon kaydedildi', { description: 'Form şablonu başarıyla kaydedildi.' })
      setTemplateName('')
      setSaveDialogOpen(false)
      
      if (onSaveTemplate) {
        onSaveTemplate(templateName.trim(), currentFormData)
      }
    } catch (error: any) {
      toast.error('Şablon kaydedilemedi', error?.message || 'Bir hata oluştu.')
    }
  }

  // Şablon sil
  const handleDeleteTemplate = (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Bu şablonu silmek istediğinize emin misiniz?')) {
      deleteTemplate(templateId)
      toast.success('Şablon silindi', { description: 'Form şablonu başarıyla silindi.' })
    }
  }

  if (isLoading) {
    return (
      <div className={className}>
        <Button variant="outline" size="sm" disabled>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Yükleniyor...
        </Button>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Şablon Seçici */}
      {templates.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <FileText className="mr-2 h-4 w-4" />
              Şablon Seç ({templates.length})
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64">
            {templates.map((template) => (
              <DropdownMenuItem
                key={template.id}
                onClick={() => handleSelectTemplate(template.id)}
                className="flex items-center justify-between"
              >
                <span>{template.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteTemplate(template.id, e)
                  }}
                >
                  <Trash2 className="h-3 w-3 text-red-500" />
                </Button>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Şablon Kaydet */}
      {currentFormData && Object.keys(currentFormData).length > 0 && (
        <DropdownMenu open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Şablon Kaydet
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 p-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Şablon Adı</label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Örn: Standart Müşteri"
                className="w-full px-2 py-1 text-sm border rounded"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveTemplate()
                  }
                }}
              />
              <div className="flex gap-2 pt-2">
                <Button size="sm" onClick={handleSaveTemplate} className="flex-1">
                  Kaydet
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSaveDialogOpen(false)
                    setTemplateName('')
                  }}
                >
                  İptal
                </Button>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

