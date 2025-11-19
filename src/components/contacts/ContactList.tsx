'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useSession } from '@/hooks/useSession'
import { Plus, Search, Edit, Trash2, Eye, User } from 'lucide-react'
import Link from 'next/link'
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
import SkeletonList from '@/components/skeletons/SkeletonList'
import EmptyState from '@/components/ui/EmptyState'
import Pagination from '@/components/ui/Pagination'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import { toast, confirm } from '@/lib/toast'
import dynamic from 'next/dynamic'

// Lazy load ContactForm
const ContactForm = dynamic(() => import('./ContactForm'), {
  ssr: false,
  loading: () => null,
})

const ContactDetailModal = dynamic(() => import('./ContactDetailModal'), {
  ssr: false,
  loading: () => null,
})

interface Contact {
  id: string
  firstName: string
  lastName?: string
  email?: string
  phone?: string
  title?: string
  role: string
  isPrimary: boolean
  status: string
  createdAt: string
  customerCompanyId?: string
  CustomerCompany?: {
    id: string
    name: string
    sector?: string
    city?: string
  }
}

export default function ContactList() {
  const locale = useLocale()
  const t = useTranslations('contacts')
  const tCommon = useTranslations('common')
  const { data: session } = useSession()
  
  // SuperAdmin kontrolü
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'
  
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [role, setRole] = useState('')
  const [filterCompanyId, setFilterCompanyId] = useState('') // SuperAdmin için firma filtresi
  const [formOpen, setFormOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
  const [selectedContactData, setSelectedContactData] = useState<Contact | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // SuperAdmin için firmaları çek
  const { data: companiesData } = useData<{ companies: Array<{ id: string; name: string }> }>(
    isSuperAdmin ? '/api/superadmin/companies' : null,
    { dedupingInterval: 60000, revalidateOnFocus: false }
  )
  // Duplicate'leri filtrele - aynı id'ye sahip kayıtları tekilleştir
  const companies = (companiesData?.companies || []).filter((company, index, self) => 
    index === self.findIndex((c) => c.id === company.id)
  )

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setCurrentPage(1) // Arama değiştiğinde ilk sayfaya dön
    }, 300)
    
    return () => clearTimeout(timer)
  }, [search])

  // SWR ile veri çekme
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (debouncedSearch) params.append('search', debouncedSearch)
    if (status) params.append('status', status)
    if (role) params.append('role', role)
    if (isSuperAdmin && filterCompanyId) params.append('filterCompanyId', filterCompanyId)
    params.append('page', currentPage.toString())
    params.append('pageSize', pageSize.toString())
    return `/api/contacts?${params.toString()}`
  }, [debouncedSearch, status, role, isSuperAdmin, filterCompanyId, currentPage, pageSize])
  
  const { data: response, isLoading, error, mutate: mutateContacts } = useData<any>(apiUrl, {
    dedupingInterval: 5000,
    revalidateOnFocus: false,
  })

  const contacts = useMemo(() => {
    if (!response) return []
    if (Array.isArray(response)) return response
    if (response.data && Array.isArray(response.data)) return response.data
    return []
  }, [response])
  
  const pagination = useMemo(() => {
    if (!response || Array.isArray(response)) return null
    return response.pagination || null
  }, [response])

  const handleDelete = useCallback(async (id: string, name: string) => {
    if (!(await confirm(t('deleteConfirm', { name })))) {
      return
    }

    try {
      const res = await fetch(`/api/contacts/${id}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete contact')
      }
      
      // Optimistic update
      const updatedContacts = contacts.filter((c: Contact) => c.id !== id)
      
      await mutateContacts(updatedContacts, { revalidate: false })
      
      await Promise.all([
        mutate('/api/contacts', updatedContacts, { revalidate: false }),
        mutate('/api/contacts?', updatedContacts, { revalidate: false }),
        mutate(apiUrl, updatedContacts, { revalidate: false }),
      ])
      
      // Başarı toast'ı göster
      toast.success('Firma yetkilisi silindi', { description: `${name} başarıyla silindi.` })
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error(t('deleteFailed'), { description: error?.message || 'Bir hata oluştu' })
    }
  }, [contacts, mutateContacts, apiUrl])

  const handleEdit = useCallback((contact: Contact) => {
    setSelectedContact(contact)
    setFormOpen(true)
  }, [])

  const handleAdd = useCallback(() => {
    setSelectedContact(null)
    setFormOpen(true)
  }, [])

  const handleFormClose = useCallback(() => {
    setFormOpen(false)
    setSelectedContact(null)
  }, [])

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'DECISION_MAKER':
        return 'bg-purple-100 text-purple-800'
      case 'INFLUENCER':
        return 'bg-blue-100 text-blue-800'
      case 'END_USER':
        return 'bg-green-100 text-green-800'
      case 'GATEKEEPER':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'DECISION_MAKER':
        return t('roleDecisionMaker')
      case 'INFLUENCER':
        return t('roleInfluencer')
      case 'END_USER':
        return t('roleEndUser')
      case 'GATEKEEPER':
        return t('roleGatekeeper')
      default:
        return t('roleOther')
    }
  }

  if (isLoading) {
    return <SkeletonList />
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        <p>{tCommon('error')}: {error.message || t('errorLoading')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('title')}</h2>
          <p className="text-sm text-gray-600">{t('description')}</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          {t('newContact')}
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative col-span-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {isSuperAdmin && (
          <Select value={filterCompanyId || 'all'} onValueChange={(value) => {
            setFilterCompanyId(value === 'all' ? '' : value)
            setCurrentPage(1) // Filtre değiştiğinde ilk sayfaya dön
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Tüm Firmalar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Firmalar</SelectItem>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
        <Select value={status || 'all'} onValueChange={(value) => {
          setStatus(value === 'all' ? '' : value)
          setCurrentPage(1) // Filtre değiştiğinde ilk sayfaya dön
        }}>
          <SelectTrigger>
            <SelectValue placeholder={t('allStatuses')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allStatuses')}</SelectItem>
            <SelectItem value="ACTIVE">{tCommon('active')}</SelectItem>
            <SelectItem value="INACTIVE">{tCommon('inactive')}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={role || 'all'} onValueChange={(value) => {
          setRole(value === 'all' ? '' : value)
          setCurrentPage(1) // Filtre değiştiğinde ilk sayfaya dön
        }}>
          <SelectTrigger>
            <SelectValue placeholder={t('allRoles')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allRoles')}</SelectItem>
            <SelectItem value="DECISION_MAKER">{t('roleDecisionMaker')}</SelectItem>
            <SelectItem value="INFLUENCER">{t('roleInfluencer')}</SelectItem>
            <SelectItem value="END_USER">{t('roleEndUser')}</SelectItem>
            <SelectItem value="GATEKEEPER">{t('roleGatekeeper')}</SelectItem>
            <SelectItem value="OTHER">{t('roleOther')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {contacts.length === 0 ? (
        <EmptyState
          icon={User}
          title={t('noContactsFound')}
          description={t('noContactsDescription')}
          action={{
            label: t('newContact'),
            onClick: handleAdd,
          }}
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('tableHeaders.name')}</TableHead>
                <TableHead>{t('tableHeaders.email')}</TableHead>
                <TableHead>{t('tableHeaders.phone')}</TableHead>
                <TableHead>{t('tableHeaders.title')}</TableHead>
                <TableHead>{t('tableHeaders.role')}</TableHead>
                <TableHead>{t('tableHeaders.customerCompany')}</TableHead>
                {isSuperAdmin && <TableHead>Firma</TableHead>}
                <TableHead>{t('tableHeaders.status')}</TableHead>
                <TableHead className="text-right">{t('tableHeaders.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact: Contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {contact.isPrimary && (
                        <Badge variant="outline" className="text-xs">
                          Ana
                        </Badge>
                      )}
                      {contact.firstName} {contact.lastName}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {contact.email || '-'}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {contact.phone || '-'}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {contact.title || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(contact.role)}>
                      {getRoleText(contact.role)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {contact.CustomerCompany?.name || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={contact.status === 'ACTIVE' ? 'default' : 'secondary'}
                    >
                      {contact.status === 'ACTIVE' ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/${locale}/contacts/${contact.id}`} prefetch={true}>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4 text-gray-600" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(contact)}
                      >
                        <Edit className="h-4 w-4 text-gray-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleDelete(
                            contact.id,
                            `${contact.firstName} ${contact.lastName || ''}`
                          )
                        }
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
              </Table>
            </div>
            {/* Pagination */}
            {pagination && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                pageSize={pagination.pageSize}
                totalItems={pagination.totalItems}
                onPageChange={(page) => setCurrentPage(page)}
                onPageSizeChange={(size) => {
                  setPageSize(size)
                  setCurrentPage(1)
                }}
              />
            )}
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {contacts.map((contact: Contact) => (
              <div
                key={contact.id}
                className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {contact.isPrimary && (
                        <Badge variant="outline" className="text-xs">
                          Ana
                        </Badge>
                      )}
                      <h3 className="font-semibold text-gray-900 truncate">
                        {contact.firstName} {contact.lastName}
                      </h3>
                    </div>
                    <div className="space-y-1">
                      {contact.email && (
                        <p className="text-xs text-gray-600 truncate">{contact.email}</p>
                      )}
                      {contact.phone && (
                        <p className="text-xs text-gray-600">{contact.phone}</p>
                      )}
                      {contact.title && (
                        <p className="text-xs text-gray-500">{contact.title}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge className={getRoleBadgeColor(contact.role)}>
                        {getRoleText(contact.role)}
                      </Badge>
                      <Badge
                        variant={contact.status === 'ACTIVE' ? 'default' : 'secondary'}
                      >
                        {contact.status === 'ACTIVE' ? 'Aktif' : 'Pasif'}
                      </Badge>
                      {contact.CustomerCompany?.name && (
                        <Badge variant="outline" className="text-xs">
                          {contact.CustomerCompany.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Link href={`/${locale}/contacts/${contact.id}`} prefetch={true}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(contact)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600"
                      onClick={() =>
                        handleDelete(
                          contact.id,
                          `${contact.firstName} ${contact.lastName || ''}`
                        )
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Form Modal */}
      {formOpen && (
        <ContactForm
          contact={selectedContact || undefined}
          open={formOpen}
          onClose={handleFormClose}
          onSuccess={async (savedContact: Contact) => {
            let updatedContacts: Contact[]
            
            if (selectedContact) {
              updatedContacts = contacts.map((c: Contact) =>
                c.id === savedContact.id ? savedContact : c
              )
            } else {
              updatedContacts = [savedContact, ...contacts]
            }
            
            await mutateContacts(updatedContacts, { revalidate: false })
            
            await Promise.all([
              mutate('/api/contacts', updatedContacts, { revalidate: false }),
              mutate('/api/contacts?', updatedContacts, { revalidate: false }),
              mutate(apiUrl, updatedContacts, { revalidate: false }),
            ])
          }}
        />
      )}

      {/* Detail Modal */}
      {selectedContactId && (
        <ContactDetailModal
          contactId={selectedContactId}
          open={detailModalOpen}
          onClose={() => {
            setDetailModalOpen(false)
            setSelectedContactId(null)
            setSelectedContactData(null)
          }}
          initialData={selectedContactData || undefined}
        />
      )}
    </div>
  )
}



