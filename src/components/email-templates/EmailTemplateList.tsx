'use client'

import { useState, useEffect } from 'react'
import { toast } from '@/lib/toast'
import { useLocale } from 'next-intl'
import { Plus, Search, Edit, Trash2, Eye, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import EmailTemplateForm from './EmailTemplateForm'
import SkeletonList from '@/components/skeletons/SkeletonList'
import Link from 'next/link'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'

interface EmailTemplate {
  id: string
  name: string
  subject: string | null
  body: string
  variables: string[]
  category: string | null
  isActive: boolean
  companyId: string
  createdAt: string
  updatedAt: string
}

export default function EmailTemplateList() {
  const locale = useLocale()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [isActive, setIsActive] = useState<string>('')
  const [formOpen, setFormOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)

  // Debounced search - performans için
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    
    return () => clearTimeout(timer)
  }, [search])

  // SWR ile veri çekme
  const params = new URLSearchParams()
  if (debouncedSearch) params.append('search', debouncedSearch)
  if (category) params.append('category', category)
  if (isActive !== '') params.append('isActive', isActive)
  
  const apiUrl = `/api/email-templates?${params.toString()}`
  const { data: templates = [], isLoading, error, mutate: mutateTemplates } = useData<EmailTemplate[]>(apiUrl, {
    dedupingInterval: 5000,
    revalidateOnFocus: false,
  })

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setFormOpen(true)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`${name} şablonunu silmek istediğinize emin misiniz?`)) {
      return
    }

    try {
      const res = await fetch(`/api/email-templates/${id}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete email template')
      }
      
      // Optimistic update
      const updatedTemplates = templates.filter((item) => item.id !== id)
      
      await mutateTemplates(updatedTemplates, { revalidate: false })
      
      await Promise.all([
        mutate('/api/email-templates', updatedTemplates, { revalidate: false }),
        mutate('/api/email-templates?', updatedTemplates, { revalidate: false }),
        mutate(apiUrl, updatedTemplates, { revalidate: false }),
      ])
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error('Silinemedi', error?.message)
    }
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setSelectedTemplate(null)
  }

  const categoryLabels: Record<string, string> = {
    QUOTE: 'Teklif',
    INVOICE: 'Fatura',
    DEAL: 'Fırsat',
    CUSTOMER: 'Müşteri',
    GENERAL: 'Genel',
  }

  if (isLoading) {
    return <SkeletonList />
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        Şablonlar yüklenirken bir hata oluştu
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">E-posta Şablonları</h1>
          <p className="mt-2 text-gray-600">Toplam {templates.length} şablon</p>
        </div>
        <Button
          onClick={() => {
            setSelectedTemplate(null)
            setFormOpen(true)
          }}
          className="bg-gradient-primary text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Yeni Şablon
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder="Şablon ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={category || 'all'} onValueChange={(v) => setCategory(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Kategoriler</SelectItem>
            <SelectItem value="QUOTE">Teklif</SelectItem>
            <SelectItem value="INVOICE">Fatura</SelectItem>
            <SelectItem value="DEAL">Fırsat</SelectItem>
            <SelectItem value="CUSTOMER">Müşteri</SelectItem>
            <SelectItem value="GENERAL">Genel</SelectItem>
          </SelectContent>
        </Select>
        <Select value={isActive || 'all'} onValueChange={(v) => setIsActive(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Durum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="true">Aktif</SelectItem>
            <SelectItem value="false">Pasif</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ad</TableHead>
              <TableHead>Konu</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Değişkenler</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  Şablon bulunamadı
                </TableCell>
              </TableRow>
            ) : (
              templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {template.subject || '-'}
                  </TableCell>
                  <TableCell>
                    {template.category ? (
                      <Badge className="bg-blue-100 text-blue-800">
                        {categoryLabels[template.category] || template.category}
                      </Badge>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {Array.isArray(template.variables) && template.variables.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {template.variables.slice(0, 3).map((variable, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs text-gray-700 border-gray-300">
                            {variable}
                          </Badge>
                        ))}
                        {template.variables.length > 3 && (
                          <Badge variant="outline" className="text-xs text-gray-700 border-gray-300">
                            +{template.variables.length - 3}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={template.isActive ? 'default' : 'secondary'}>
                      {template.isActive ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(template.createdAt).toLocaleDateString('tr-TR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(template.id, template.name)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Form Modal */}
      <EmailTemplateForm
        template={selectedTemplate || undefined}
        open={formOpen}
        onClose={handleFormClose}
        onSuccess={async (savedTemplate: EmailTemplate) => {
          let updatedTemplates: EmailTemplate[]
          
          if (selectedTemplate) {
            // UPDATE
            updatedTemplates = templates.map((item) =>
              item.id === savedTemplate.id ? savedTemplate : item
            )
          } else {
            // CREATE
            updatedTemplates = [savedTemplate, ...templates]
          }
          
          await mutateTemplates(updatedTemplates, { revalidate: false })
          
          await Promise.all([
            mutate('/api/email-templates', updatedTemplates, { revalidate: false }),
            mutate('/api/email-templates?', updatedTemplates, { revalidate: false }),
            mutate(apiUrl, updatedTemplates, { revalidate: false }),
          ])
        }}
      />
    </div>
  )
}

