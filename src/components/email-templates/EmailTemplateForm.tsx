'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

const templateSchema = z.object({
  name: z.string().min(1, 'Şablon adı gereklidir'),
  subject: z.string().optional(),
  body: z.string().min(1, 'Şablon içeriği gereklidir'),
  category: z.enum(['QUOTE', 'INVOICE', 'DEAL', 'CUSTOMER', 'GENERAL']).optional(),
  isActive: z.boolean().default(true),
})

type TemplateFormData = z.infer<typeof templateSchema>

interface EmailTemplateFormProps {
  template?: any
  open: boolean
  onClose: () => void
  onSuccess?: (savedTemplate: any) => void
}

const commonVariables = [
  'customerName',
  'dealTitle',
  'dealValue',
  'quoteTitle',
  'quoteTotal',
  'invoiceTitle',
  'invoiceTotal',
  'companyName',
  'userName',
]

export default function EmailTemplateForm({
  template,
  open,
  onClose,
  onSuccess,
}: EmailTemplateFormProps) {
  const [loading, setLoading] = useState(false)
  const [variables, setVariables] = useState<string[]>([])
  const [newVariable, setNewVariable] = useState('')

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: '',
      subject: '',
      body: '',
      category: 'GENERAL',
      isActive: true,
    },
  })

  const category = watch('category')

  // Template prop değiştiğinde veya modal açıldığında form'u güncelle
  useEffect(() => {
    if (open) {
      if (template) {
        // Düzenleme modu
        reset({
          name: template.name || '',
          subject: template.subject || '',
          body: template.body || '',
          category: template.category || 'GENERAL',
          isActive: template.isActive !== undefined ? template.isActive : true,
        })
        setVariables(Array.isArray(template.variables) ? template.variables : [])
      } else {
        // Yeni kayıt modu
        reset({
          name: '',
          subject: '',
          body: '',
          category: 'GENERAL',
          isActive: true,
        })
        setVariables([])
      }
    }
  }, [template, open, reset])

  const addVariable = (variable: string) => {
    if (variable && !variables.includes(variable)) {
      setVariables([...variables, variable])
      // Body'ye değişkeni ekle
      const currentBody = watch('body')
      setValue('body', currentBody + `{{${variable}}}`)
    }
  }

  const removeVariable = (variable: string) => {
    setVariables(variables.filter((v) => v !== variable))
  }

  const onSubmit = async (data: TemplateFormData) => {
    setLoading(true)
    try {
      const url = template
        ? `/api/email-templates/${template.id}`
        : '/api/email-templates'
      const method = template ? 'PUT' : 'POST'

      const payload = {
        ...data,
        variables: variables,
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to save email template')
      }

      const savedTemplate = await res.json()
      
      if (onSuccess) {
        onSuccess(savedTemplate)
      }
      
      reset()
      setVariables([])
      onClose()
    } catch (error: any) {
      console.error('Error:', error)
      toast.error('Kaydedilemedi', error?.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? 'E-posta Şablonu Düzenle' : 'Yeni E-posta Şablonu'}
          </DialogTitle>
          <DialogDescription>
            {template ? 'Şablon bilgilerini güncelleyin' : 'Yeni e-posta şablonu oluşturun'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Şablon Adı *</label>
              <Input
                {...register('name')}
                placeholder="Örn: Teklif Kabul Edildi"
                disabled={loading}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Kategori</label>
              <Select
                value={category || 'GENERAL'}
                onValueChange={(value) => setValue('category', value as TemplateFormData['category'])}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="QUOTE">Teklif</SelectItem>
                  <SelectItem value="INVOICE">Fatura</SelectItem>
                  <SelectItem value="DEAL">Fırsat</SelectItem>
                  <SelectItem value="CUSTOMER">Müşteri</SelectItem>
                  <SelectItem value="GENERAL">Genel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Is Active */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Durum</label>
              <Select
                value={watch('isActive') ? 'true' : 'false'}
                onValueChange={(value) => setValue('isActive', value === 'true')}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Aktif</SelectItem>
                  <SelectItem value="false">Pasif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">E-posta Konusu</label>
              <Input
                {...register('subject')}
                placeholder="Örn: Teklif {{quoteTitle}} kabul edildi"
                disabled={loading}
              />
              <p className="text-xs text-gray-500">
                Değişkenler için: {'{{variableName}}'} formatını kullanın
              </p>
            </div>

            {/* Body */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">E-posta İçeriği *</label>
              <Textarea
                {...register('body')}
                placeholder="E-posta içeriği..."
                rows={8}
                disabled={loading}
                className="font-mono text-sm"
              />
              {errors.body && (
                <p className="text-sm text-red-600">{errors.body.message}</p>
              )}
              <p className="text-xs text-gray-500">
                Değişkenler için: {'{{variableName}}'} formatını kullanın
              </p>
            </div>

            {/* Variables */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Değişkenler</label>
              <div className="space-y-2">
                {/* Common Variables */}
                <div className="flex flex-wrap gap-2">
                  {commonVariables.map((variable) => (
                    <Button
                      key={variable}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addVariable(variable)}
                      disabled={loading || variables.includes(variable)}
                    >
                      {variable}
                    </Button>
                  ))}
                </div>
                {/* Selected Variables */}
                {variables.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded">
                    {variables.map((variable) => (
                      <Badge key={variable} variant="default" className="flex items-center gap-1">
                        {variable}
                        <button
                          type="button"
                          onClick={() => removeVariable(variable)}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                {/* Custom Variable */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Özel değişken adı..."
                    value={newVariable}
                    onChange={(e) => setNewVariable(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (newVariable.trim()) {
                          addVariable(newVariable.trim())
                          setNewVariable('')
                        }
                      }
                    }}
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (newVariable.trim()) {
                        addVariable(newVariable.trim())
                        setNewVariable('')
                      }
                    }}
                    disabled={loading}
                  >
                    Ekle
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              İptal
            </Button>
            <Button
              type="submit"
              className="bg-gradient-primary text-white"
              disabled={loading}
            >
              {loading ? 'Kaydediliyor...' : template ? 'Güncelle' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}



