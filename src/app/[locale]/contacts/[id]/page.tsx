'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { ArrowLeft, Edit, Trash2, Mail, Phone, Building2, Briefcase, Linkedin, User, Star, FileText } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import ActivityTimeline from '@/components/ui/ActivityTimeline'
import SkeletonDetail from '@/components/skeletons/SkeletonDetail'
import ContactForm from '@/components/contacts/ContactForm'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import { toastError, toastSuccess } from '@/lib/toast'
import ContextualActionsBar from '@/components/ui/ContextualActionsBar'
import SendEmailButton from '@/components/integrations/SendEmailButton'
import SendSmsButton from '@/components/integrations/SendSmsButton'
import SendWhatsAppButton from '@/components/integrations/SendWhatsAppButton'
import Image from 'next/image'

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
  linkedin?: string
  notes?: string
  imageUrl?: string
  customerCompanyId?: string
  createdAt: string
  updatedAt?: string
  CustomerCompany?: {
    id: string
    name: string
    sector?: string
    city?: string
  }
}

const roleLabels: Record<string, string> = {
  DECISION_MAKER: 'Karar Verici',
  INFLUENCER: 'Etkileyici',
  END_USER: 'Son Kullanıcı',
  GATEKEEPER: 'Kapı Bekçisi',
  OTHER: 'Diğer',
}

const roleColors: Record<string, string> = {
  DECISION_MAKER: 'bg-purple-100 text-purple-800',
  INFLUENCER: 'bg-blue-100 text-blue-800',
  END_USER: 'bg-green-100 text-green-800',
  GATEKEEPER: 'bg-yellow-100 text-yellow-800',
  OTHER: 'bg-gray-100 text-gray-800',
}

export default function ContactDetailPage() {
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const id = params.id as string
  const [formOpen, setFormOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // useData hook ile veri çekme (SWR cache) - standardize edilmiş veri çekme stratejisi
  const { data: contact, isLoading, error, mutate: mutateContact } = useData<Contact>(
    id ? `/api/contacts/${id}` : null,
    {
      dedupingInterval: 30000, // 30 saniye cache (detay sayfası için optimal)
      revalidateOnFocus: false, // Focus'ta revalidate yapma (instant navigation)
    }
  )

  // İlgili Deal'ları çek (bu contact ile ilişkili fırsatlar)
  const { data: relatedDeals = [] } = useData<any[]>(
    id ? `/api/deals?contactId=${id}` : null,
    {
      dedupingInterval: 30000, // 30 saniye cache
      revalidateOnFocus: false,
    }
  )

  if (isLoading) {
    return <SkeletonDetail />
  }

  if (error || !contact) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-gray-500">İletişim kaydı bulunamadı</p>
        <Button onClick={() => router.push(`/${locale}/contacts`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Geri Dön
        </Button>
      </div>
    )
  }

  const handleDelete = async () => {
    if (!confirm(`${contact.firstName} ${contact.lastName || ''} kişisini silmek istediğinize emin misiniz?`)) {
      return
    }

    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/contacts/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete contact')
      }

      // Cache'i temizle
      await mutate('/api/contacts')
      await mutate(`/api/contacts/${id}`)

      toastSuccess('İletişim kaydı başarıyla silindi')
      router.push(`/${locale}/contacts`)
    } catch (error: any) {
      console.error('Delete error:', error)
      toastError(error?.message || 'Silme işlemi başarısız oldu')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleFormClose = () => {
    setFormOpen(false)
    mutateContact() // Veriyi yenile
  }

  const fullName = `${contact.firstName} ${contact.lastName || ''}`.trim()

  return (
    <div className="space-y-6">
      {/* Contextual Actions Bar */}
      <ContextualActionsBar
        entityType="contact"
        entityId={id}
        onEdit={() => setFormOpen(true)}
        onDelete={handleDelete}
        deleteLoading={deleteLoading}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/${locale}/contacts`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-4">
            {contact.imageUrl ? (
              <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-indigo-500">
                <Image
                  src={contact.imageUrl}
                  alt={fullName}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center border-2 border-indigo-500">
                <User className="h-8 w-8 text-indigo-600" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold text-gray-900">{fullName}</h1>
                {contact.isPrimary && (
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                )}
              </div>
              {contact.title && (
                <p className="mt-1 text-gray-600">{contact.title}</p>
              )}
              {contact.CustomerCompany && (
                <Link
                  href={`/${locale}/customer-companies/${contact.CustomerCompany.id}`}
                  className="mt-1 text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <Building2 className="h-4 w-4" />
                  {contact.CustomerCompany.name}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* İletişim Bilgileri */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Mail className="h-5 w-5 text-indigo-500" />
            İletişim Bilgileri
          </h2>
          <div className="space-y-4">
            {contact.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <a
                  href={`mailto:${contact.email}`}
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  {contact.email}
                </a>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <a
                  href={`tel:${contact.phone}`}
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  {contact.phone}
                </a>
              </div>
            )}
            {contact.linkedin && (
              <div className="flex items-center gap-2">
                <Linkedin className="h-4 w-4 text-gray-400" />
                <a
                  href={contact.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  LinkedIn Profili
                </a>
              </div>
            )}
            {!contact.email && !contact.phone && !contact.linkedin && (
              <p className="text-gray-500 text-sm">İletişim bilgisi eklenmemiş</p>
            )}
          </div>
        </Card>

        {/* Rol ve Durum */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-purple-500" />
            Rol ve Durum
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Rol</p>
              <Badge className={`mt-1 ${roleColors[contact.role] || roleColors.OTHER}`}>
                {roleLabels[contact.role] || contact.role}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600">Durum</p>
              <Badge
                className={`mt-1 ${
                  contact.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {contact.status === 'ACTIVE' ? 'Aktif' : 'Pasif'}
              </Badge>
            </div>
            {contact.isPrimary && (
              <div>
                <p className="text-sm text-gray-600">Öncelik</p>
                <Badge className="mt-1 bg-yellow-100 text-yellow-800 flex items-center gap-1 w-fit">
                  <Star className="h-3 w-3 fill-yellow-600" />
                  Birincil İletişim
                </Badge>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Oluşturulma Tarihi</p>
              <p className="font-medium mt-1">
                {new Date(contact.createdAt).toLocaleDateString('tr-TR')}
              </p>
            </div>
          </div>
        </Card>

        {/* Notlar */}
        {contact.notes && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Notlar
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap">{contact.notes}</p>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      {(contact.email || contact.phone) && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Hızlı İşlemler</h2>
          <div className="flex flex-wrap gap-3">
            {contact.email && (
              <SendEmailButton
                to={contact.email}
                subject={`İletişim: ${fullName}`}
                html={`
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">
                      İletişim Bilgileri
                    </h2>
                    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 20px;">
                      <p><strong>İsim:</strong> ${fullName}</p>
                      ${contact.title ? `<p><strong>Ünvan:</strong> ${contact.title}</p>` : ''}
                      ${contact.email ? `<p><strong>E-posta:</strong> ${contact.email}</p>` : ''}
                      ${contact.phone ? `<p><strong>Telefon:</strong> ${contact.phone}</p>` : ''}
                      ${contact.CustomerCompany ? `<p><strong>Firma:</strong> ${contact.CustomerCompany.name}</p>` : ''}
                    </div>
                  </div>
                `}
                category="CONTACT"
                entityData={contact}
              />
            )}
            {contact.phone && (
              <>
                <SendSmsButton
                  to={contact.phone}
                  message={`Merhaba ${contact.firstName}, size ulaşmak istiyoruz. Lütfen bize dönüş yapın.`}
                />
                <SendWhatsAppButton
                  to={contact.phone}
                  message={`Merhaba ${contact.firstName}, size ulaşmak istiyoruz. Lütfen bize dönüş yapın.`}
                />
              </>
            )}
          </div>
        </Card>
      )}

      {/* İlgili Deal'lar */}
      {relatedDeals.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">İlgili Fırsatlar</h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Başlık</TableHead>
                  <TableHead>Aşama</TableHead>
                  <TableHead>Değer</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Oluşturulma</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relatedDeals.map((deal) => (
                  <TableRow key={deal.id}>
                    <TableCell className="font-medium">{deal.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{deal.stage || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('tr-TR', {
                        style: 'currency',
                        currency: 'TRY',
                      }).format(deal.value || 0)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          deal.status === 'WON'
                            ? 'default'
                            : deal.status === 'LOST'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {deal.status || 'OPEN'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(deal.createdAt).toLocaleDateString('tr-TR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/${locale}/deals/${deal.id}`} prefetch={true}>
                        <Button variant="ghost" size="sm">
                          Görüntüle
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Activity Timeline */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Aktivite Geçmişi</h2>
        <ActivityTimeline
          entityType="Contact"
          entityId={id}
        />
      </Card>

      {/* Form Modal */}
      <ContactForm
        contact={contact}
        open={formOpen}
        onClose={handleFormClose}
        onSuccess={async (savedContact: Contact) => {
          // Optimistic update
          await mutateContact(savedContact, { revalidate: false })
          await mutate('/api/contacts', undefined, { revalidate: false })
          toastSuccess('İletişim kaydı başarıyla güncellendi')
          handleFormClose()
        }}
      />
    </div>
  )
}













