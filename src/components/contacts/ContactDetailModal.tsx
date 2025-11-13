'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Edit, Trash2, Mail, Phone, Building2, User, Briefcase, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import DetailModal from '@/components/ui/DetailModal'
import { toast } from '@/lib/toast'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import dynamic from 'next/dynamic'

const ContactForm = dynamic(() => import('./ContactForm'), {
  ssr: false,
  loading: () => null,
})

interface ContactDetailModalProps {
  contactId: string | null
  open: boolean
  onClose: () => void
  initialData?: any
}

export default function ContactDetailModal({
  contactId,
  open,
  onClose,
  initialData,
}: ContactDetailModalProps) {
  const router = useRouter()
  const locale = useLocale()
  const [formOpen, setFormOpen] = useState(false)

  const { data: contact, isLoading, error, mutate: mutateContact } = useData<any>(
    contactId && open ? `/api/contacts/${contactId}` : null,
    {
      dedupingInterval: 5000,
      revalidateOnFocus: false,
      fallbackData: initialData,
    }
  )

  const displayContact = contact || initialData

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'DECISION_MAKER':
        return 'bg-purple-600 text-white border-purple-700'
      case 'INFLUENCER':
        return 'bg-blue-600 text-white border-blue-700'
      case 'END_USER':
        return 'bg-green-600 text-white border-green-700'
      case 'GATEKEEPER':
        return 'bg-orange-600 text-white border-orange-700'
      default:
        return 'bg-gray-600 text-white border-gray-700'
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'DECISION_MAKER':
        return 'Karar Verici'
      case 'INFLUENCER':
        return 'Etkileyici'
      case 'END_USER':
        return 'Son Kullanıcı'
      case 'GATEKEEPER':
        return 'Kapı Bekçisi'
      default:
        return 'Diğer'
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`${displayContact?.firstName} ${displayContact?.lastName || ''} kişisini silmek istediğinize emin misiniz?`)) {
      return
    }

    const toastId = toast.loading('Siliniyor...')
    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete contact')
      }

      await mutate('/api/contacts')
      toast.dismiss(toastId)
      toast.success('Silindi', 'Kişi başarıyla silindi.')
      onClose()
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.dismiss(toastId)
      toast.error('Silme başarısız', error?.message || 'Silme işlemi sırasında bir hata oluştu.')
    }
  }

  if (!open || !contactId) return null

  if (isLoading && !initialData && !displayContact) {
    return (
      <DetailModal open={open} onClose={onClose} title="Kişi Detayları" size="md">
        <div className="p-4">Yükleniyor...</div>
      </DetailModal>
    )
  }

  if (error && !initialData && !displayContact) {
    return (
      <DetailModal open={open} onClose={onClose} title="Hata" size="md">
        <div className="p-4 text-center">
          <p className="text-gray-500 mb-4">Kişi yüklenemedi</p>
          <Button onClick={onClose}>Kapat</Button>
        </div>
      </DetailModal>
    )
  }

  if (!displayContact) {
    return (
      <DetailModal open={open} onClose={onClose} title="Kişi Bulunamadı" size="md">
        <div className="p-4 text-center">
          <p className="text-gray-500 mb-4">Kişi bulunamadı</p>
          <Button onClick={onClose}>Kapat</Button>
        </div>
      </DetailModal>
    )
  }

  return (
    <>
      <DetailModal
        open={open}
        onClose={onClose}
        title={`${displayContact?.firstName || ''} ${displayContact?.lastName || ''}`.trim() || 'Kişi Detayları'}
        description={displayContact?.title || displayContact?.CustomerCompany?.name || undefined}
        size="md"
      >
        <div className="space-y-6">
          {/* Header Actions */}
          <div className="flex justify-end gap-2 pb-4 border-b">
            {displayContact?.isPrimary && (
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-300">
                Ana Kişi
              </Badge>
            )}
            <Badge className={displayContact?.status === 'ACTIVE' ? 'bg-green-600 text-white border-green-700' : 'bg-gray-600 text-white border-gray-700'}>
              {displayContact?.status === 'ACTIVE' ? 'Aktif' : 'Pasif'}
            </Badge>
            <Button
              variant="outline"
              onClick={() => setFormOpen(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Düzenle
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Sil
            </Button>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Kişi Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Ad Soyad</p>
                    <p className="font-medium">{displayContact?.firstName} {displayContact?.lastName || ''}</p>
                  </div>
                </div>
                {displayContact?.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">E-posta</p>
                      <a href={`mailto:${displayContact.email}`} className="font-medium text-indigo-600 hover:text-indigo-700">
                        {displayContact.email}
                      </a>
                    </div>
                  </div>
                )}
                {displayContact?.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Telefon</p>
                      <a href={`tel:${displayContact.phone}`} className="font-medium text-indigo-600 hover:text-indigo-700">
                        {displayContact.phone}
                      </a>
                    </div>
                  </div>
                )}
                {displayContact?.title && (
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Ünvan</p>
                      <p className="font-medium">{displayContact.title}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  İlişkili Bilgiler
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {displayContact?.CustomerCompany && (
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Müşteri Firma</p>
                      <div
                        className="text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer font-medium"
                        onClick={() => {
                          onClose()
                          router.push(`/${locale}/companies/${displayContact.customerCompanyId}`)
                        }}
                      >
                        {displayContact.CustomerCompany.name}
                      </div>
                      {displayContact.CustomerCompany.sector && (
                        <p className="text-xs text-gray-500 mt-1">{displayContact.CustomerCompany.sector}</p>
                      )}
                      {displayContact.CustomerCompany.city && (
                        <p className="text-xs text-gray-500">{displayContact.CustomerCompany.city}</p>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Briefcase className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Rol</p>
                    <Badge className={getRoleBadgeColor(displayContact?.role)}>
                      {getRoleText(displayContact?.role)}
                    </Badge>
                  </div>
                </div>
                {displayContact?.createdAt && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Oluşturulma Tarihi</p>
                      <p className="font-medium">
                        {new Date(displayContact.createdAt).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DetailModal>

      {/* Edit Form Modal */}
      {formOpen && displayContact && (
        <ContactForm
          contact={displayContact}
          open={formOpen}
          onClose={() => {
            setFormOpen(false)
          }}
          onSuccess={async (savedContact) => {
            await mutateContact()
            await mutate('/api/contacts')
            setFormOpen(false)
          }}
        />
      )}
    </>
  )
}









