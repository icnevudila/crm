'use client'

import { useState, useEffect } from 'react'
import { toast } from '@/lib/toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'

interface DocumentAccess {
  id: string
  userId: string | null
  customerId: string | null
  accessLevel: 'VIEW' | 'DOWNLOAD' | 'EDIT'
  expiresAt: string | null
  User?: { id: string; name: string; email: string } | null
  Customer?: { id: string; name: string } | null
}

interface DocumentAccessFormProps {
  documentId: string
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function DocumentAccessForm({
  documentId,
  open,
  onClose,
  onSuccess,
}: DocumentAccessFormProps) {
  const [loading, setLoading] = useState(false)
  const [accessType, setAccessType] = useState<'USER' | 'CUSTOMER'>('USER')
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const [accessLevel, setAccessLevel] = useState<'VIEW' | 'DOWNLOAD' | 'EDIT'>('VIEW')
  const [expiresAt, setExpiresAt] = useState<string>('')

  // Load users and customers
  const { data: users = [] } = useData<Array<{ id: string; name: string; email: string }>>('/api/users', {
    dedupingInterval: 60000,
  })
  const { data: customers = [] } = useData<Array<{ id: string; name: string }>>('/api/customers', {
    dedupingInterval: 60000,
  })

  // Load existing access
  const { data: document, mutate: mutateDocument } = useData<{
    id: string
    access: DocumentAccess[]
  }>(open ? `/api/documents/${documentId}` : null, {
    dedupingInterval: 5000,
  })

  useEffect(() => {
    if (!open) {
      setAccessType('USER')
      setSelectedUserId('')
      setSelectedCustomerId('')
      setAccessLevel('VIEW')
      setExpiresAt('')
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (accessType === 'USER' && !selectedUserId) {
      toast.warning('Kullanıcı seçiniz')
      return
    }
    
    if (accessType === 'CUSTOMER' && !selectedCustomerId) {
      toast.warning('Müşteri seçiniz')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/documents/${documentId}/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: accessType === 'USER' ? selectedUserId : null,
          customerId: accessType === 'CUSTOMER' ? selectedCustomerId : null,
          accessLevel,
          expiresAt: expiresAt || null,
        }),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Erişim eklenemedi')
      }

      toast.success('Erişim başarıyla eklendi')
      
      // Cache'i güncelle
      await mutateDocument()
      await mutate(`/api/documents/${documentId}`)
      
      if (onSuccess) {
        onSuccess()
      }
      
      onClose()
    } catch (error: any) {
      console.error('Access add error:', error)
      toast.error('Erişim eklenemedi', error?.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccess = async (accessId: string) => {
    if (!confirm('Bu erişimi kaldırmak istediğinize emin misiniz?')) {
      return
    }

    try {
      const res = await fetch(`/api/documents/${documentId}/access/${accessId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Erişim kaldırılamadı')
      }

      toast.success('Erişim kaldırıldı')
      
      // Cache'i güncelle
      await mutateDocument()
      await mutate(`/api/documents/${documentId}`)
    } catch (error: any) {
      console.error('Access delete error:', error)
      toast.error('Erişim kaldırılamadı', error?.message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Döküman Erişim Yönetimi</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Yeni Erişim Ekleme Formu */}
          <form onSubmit={handleSubmit} className="space-y-4 border-b pb-4">
            <div className="space-y-2">
              <Label>Erişim Tipi</Label>
              <Select value={accessType} onValueChange={(value: 'USER' | 'CUSTOMER') => setAccessType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">Kullanıcı</SelectItem>
                  <SelectItem value="CUSTOMER">Müşteri</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {accessType === 'USER' && (
              <div className="space-y-2">
                <Label htmlFor="userId">Kullanıcı Seç</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kullanıcı seçiniz..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {accessType === 'CUSTOMER' && (
              <div className="space-y-2">
                <Label htmlFor="customerId">Müşteri Seç</Label>
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Müşteri seçiniz..." />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="accessLevel">Erişim Seviyesi</Label>
              <Select value={accessLevel} onValueChange={(value: 'VIEW' | 'DOWNLOAD' | 'EDIT') => setAccessLevel(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIEW">Görüntüle</SelectItem>
                  <SelectItem value="DOWNLOAD">İndir</SelectItem>
                  <SelectItem value="EDIT">Düzenle</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiresAt">Son Geçerlilik Tarihi (Opsiyonel)</Label>
              <Input
                id="expiresAt"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Ekleniyor...' : 'Erişim Ekle'}
            </Button>
          </form>

          {/* Mevcut Erişimler Listesi */}
          <div className="space-y-2">
            <Label>Mevcut Erişimler</Label>
            {document?.access && document.access.length > 0 ? (
              <div className="space-y-2">
                {document.access.map((access) => (
                  <div
                    key={access.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium">
                        {access.User ? `${access.User.name} (${access.User.email})` : access.Customer?.name || 'Bilinmeyen'}
                      </div>
                      <div className="text-sm text-gray-500">
                        Seviye: {access.accessLevel === 'VIEW' ? 'Görüntüle' : access.accessLevel === 'DOWNLOAD' ? 'İndir' : 'Düzenle'}
                        {access.expiresAt && ` • Son geçerlilik: ${new Date(access.expiresAt).toLocaleDateString('tr-TR')}`}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAccess(access.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Kaldır
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 italic p-3 border rounded-lg">
                Henüz erişim tanımlanmamış
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Kapat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

