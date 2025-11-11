'use client'

import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { useSession } from 'next-auth/react'
import { Shield, Users, Settings, Lock, Check, X, Eye, Loader2, BarChart3, TrendingUp, DollarSign, FileText, Briefcase, ShoppingCart, Plus, Edit, Trash2, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import SkeletonList from '@/components/skeletons/SkeletonList'
import Link from 'next/link'
import UserForm from '@/components/users/UserForm'

interface User {
  id: string
  name: string
  email: string
  role: string
  companyId: string
}

interface UserPermission {
  id: string
  userId: string
  companyId: string
  module: string
  canCreate: boolean
  canRead: boolean
  canUpdate: boolean
  canDelete: boolean
}

const MODULES = [
  { value: 'customer', label: 'Müşteriler' },
  { value: 'deal', label: 'Fırsatlar' },
  { value: 'quote', label: 'Teklifler' },
  { value: 'invoice', label: 'Faturalar' },
  { value: 'contract', label: 'Sözleşmeler' },
  { value: 'product', label: 'Ürünler' },
  { value: 'finance', label: 'Finans' },
  { value: 'task', label: 'Görevler' },
  { value: 'ticket', label: 'Destek Talepleri' },
  { value: 'shipment', label: 'Sevkiyatlar' },
  { value: 'activity', label: 'Aktiviteler' }, // Meetings için activity modülü kullanılıyor
  { value: 'report', label: 'Raporlar' },
  { value: 'lead-scoring', label: 'Lead Scoring' }, // Lead scoring yetkisi (migration 024)
  { value: 'email-templates', label: 'E-posta Şablonları' }, // Email templates yetkisi (migration 026)
  { value: 'segment', label: 'Müşteri Segmentleri' }, // Segment yetkisi
  { value: 'competitor', label: 'Rakip Analizi' }, // Competitor yetkisi
  { value: 'email-campaign', label: 'Email Kampanyaları' }, // Email campaign yetkisi
]

export default function AdminPage() {
  const locale = useLocale()
  const { data: session } = useSession()
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [permissions, setPermissions] = useState<Record<string, Partial<UserPermission>>>({})
  const [moduleVisibility, setModuleVisibility] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null) // SuperAdmin için kurum seçimi

  // SuperAdmin için kurumları çek
  const { data: companies = [] } = useData<any[]>(
    isSuperAdmin ? '/api/companies' : null,
    {
      dedupingInterval: 30000,
      revalidateOnFocus: false,
    }
  )

  // Kullanıcıları çek - SuperAdmin için companyId parametresi ile
  const usersUrl = isSuperAdmin && selectedCompanyId 
    ? `/api/users?companyId=${selectedCompanyId}`
    : '/api/users'
  
  const { data: users = [], isLoading: usersLoading, mutate: mutateUsers } = useData<User[]>(
    usersUrl,
    {
      dedupingInterval: 5000,
      revalidateOnFocus: false,
    }
  )

  // Seçili kullanıcının yetkilerini çek - SuperAdmin için companyId parametresi ile
  const permissionsUrl = selectedUser 
    ? (isSuperAdmin && selectedUser.companyId 
        ? `/api/permissions?userId=${selectedUser.id}&companyId=${selectedUser.companyId}`
        : `/api/permissions?userId=${selectedUser.id}`)
    : null
  
  const { data: userPermissions = [], isLoading: permissionsLoading, mutate: mutatePermissions } = useData<UserPermission[]>(
    permissionsUrl,
    {
      dedupingInterval: 5000,
      revalidateOnFocus: false,
    }
  )

  // Metrikleri çek
  const { data: metrics, isLoading: metricsLoading } = useData<any>('/api/analytics/kpis', {
    dedupingInterval: 30000, // 30 saniye cache
    revalidateOnFocus: false,
  })

  // Yetkileri state'e yükle - infinite loop'u önlemek için
  useEffect(() => {
    if (!selectedUser) {
      setPermissions({})
      setModuleVisibility({})
      return
    }

    if (userPermissions.length > 0) {
      const permsMap: Record<string, Partial<UserPermission>> = {}
      const visibilityMap: Record<string, boolean> = {}
      userPermissions.forEach((perm) => {
        permsMap[perm.module] = perm
        visibilityMap[perm.module] = perm.canRead || false
      })
      setPermissions(permsMap)
      setModuleVisibility(visibilityMap)
    } else if (selectedUser) {
      // Yeni kullanıcı için varsayılan yetkiler - sadece selectedUser değiştiğinde
      const defaultPerms: Record<string, Partial<UserPermission>> = {}
      const defaultVisibility: Record<string, boolean> = {}
      MODULES.forEach((mod) => {
        defaultPerms[mod.value] = {
          module: mod.value,
          canCreate: false,
          canRead: false,
          canUpdate: false,
          canDelete: false,
        }
        defaultVisibility[mod.value] = false
      })
      setPermissions(defaultPerms)
      setModuleVisibility(defaultVisibility)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPermissions.length, selectedUser?.id]) // Sadece length ve id'yi dependency olarak kullan

  const handlePermissionChange = (
    module: string,
    permission: 'canCreate' | 'canRead' | 'canUpdate' | 'canDelete',
    value: boolean
  ) => {
    setPermissions((prev) => ({
      ...prev,
      [module]: {
        ...prev[module],
        module,
        [permission]: value,
      },
    }))
    
    // canRead değiştiğinde modül görünürlüğünü de güncelle
    if (permission === 'canRead') {
      setModuleVisibility((prev) => ({
        ...prev,
        [module]: value,
      }))
    }
  }

  // Modül görünürlük değiştiğinde canRead'i güncelle
  const handleModuleVisibilityChange = (module: string, visible: boolean) => {
    setModuleVisibility((prev) => ({
      ...prev,
      [module]: visible,
    }))
    
    setPermissions((prev) => ({
      ...prev,
      [module]: {
        ...prev[module],
        module,
        canRead: visible,
        // Modül görünür değilse diğer yetkileri de kapat
        ...(visible ? {} : {
          canCreate: false,
          canUpdate: false,
          canDelete: false,
        }),
      },
    }))
  }

  // View-only seçeneği: canRead true, diğerleri false
  const handleViewOnly = (module: string) => {
    setPermissions((prev) => ({
      ...prev,
      [module]: {
        ...prev[module],
        module,
        canRead: true,
        canCreate: false,
        canUpdate: false,
        canDelete: false,
      },
    }))
    
    setModuleVisibility((prev) => ({
      ...prev,
      [module]: true,
    }))
  }

  const handleSavePermissions = async () => {
    if (!selectedUser) return

    setSaving(true)
    setError(null)

    try {
      // Her modül için yetki kaydet/güncelle
      const savePromises = MODULES.map(async (module) => {
        const perm = permissions[module.value]
        if (!perm) return

        const existingPerm = userPermissions.find((p) => p.module === module.value)

        const permissionData = {
          userId: selectedUser.id,
          companyId: selectedUser.companyId,
          module: module.value,
          canCreate: perm.canCreate || false,
          canRead: perm.canRead || false,
          canUpdate: perm.canUpdate || false,
          canDelete: perm.canDelete || false,
        }

        if (existingPerm) {
          // Güncelle
          const res = await fetch(`/api/permissions/${existingPerm.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(permissionData),
          })

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}))
            throw new Error(errorData.error || `Failed to update permission for ${module.label}`)
          }

          return await res.json()
        } else {
          // Oluştur
          const res = await fetch('/api/permissions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(permissionData),
          })

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}))
            throw new Error(errorData.error || `Failed to create permission for ${module.label}`)
          }

          return await res.json()
        }
      })

      await Promise.all(savePromises)

      // Optimistic update - cache'i güncelle
      await mutatePermissions()
      await mutate(`/api/permissions?userId=${selectedUser.id}`)

      alert('Yetkiler başarıyla kaydedildi!')
      setSelectedUser(null) // Başarılı kayıt sonrası seçimi temizle
    } catch (error: any) {
      console.error('Error saving permissions:', error)
      setError(error?.message || 'Yetkiler kaydedilemedi')
      alert(error?.message || 'Yetkiler kaydedilemedi')
    } finally {
      setSaving(false)
    }
  }

  if (usersLoading) {
    return <SkeletonList />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-8 w-8 text-indigo-600" />
            Admin Paneli
          </h1>
          <p className="mt-2 text-gray-600">
            Kurum içi kullanıcı yetkilerini detaylı yönetin
          </p>
        </div>
      </div>

      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="metrics">
            <Settings className="h-4 w-4 mr-2" />
            Metrikler
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Kullanıcılar
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <Lock className="h-4 w-4 mr-2" />
            Yetki Yönetimi
          </TabsTrigger>
        </TabsList>

        {/* Metrikler Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Kurum Metrikleri</CardTitle>
              <CardDescription>
                Şirketinizin genel performans metrikleri
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="p-6 bg-gradient-to-br from-primary-50 to-primary-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-primary-600 rounded-lg">
                        <DollarSign className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Toplam Satış</p>
                    <p className="text-3xl font-bold text-gray-900">
                      ₺{metrics?.totalSales?.toLocaleString('tr-TR') || '0'}
                    </p>
                  </Card>

                  <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-purple-600 rounded-lg">
                        <FileText className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Toplam Teklif</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {metrics?.totalQuotes || 0}
                    </p>
                  </Card>

                  <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-blue-600 rounded-lg">
                        <Briefcase className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Aktif Fırsatlar</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {metrics?.activeDeals || 0}
                    </p>
                  </Card>

                  <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-green-600 rounded-lg">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Toplam Müşteri</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {metrics?.totalCustomers || 0}
                    </p>
                  </Card>

                  <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-orange-600 rounded-lg">
                        <ShoppingCart className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Toplam Ürün</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {metrics?.totalProducts || 0}
                    </p>
                  </Card>

                  <Card className="p-6 bg-gradient-to-br from-pink-50 to-pink-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-pink-600 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Büyüme Oranı</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {metrics?.growthRate?.toFixed(1) || '0'}%
                    </p>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Kullanıcılar Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {isSuperAdmin ? 'Tüm Kurumların Kullanıcıları' : 'Kurum İçi Kullanıcılar'}
                  </CardTitle>
                  <CardDescription>
                    {isSuperAdmin 
                      ? 'Tüm kurumların kullanıcılarını görüntüleyin ve yönetin'
                      : 'Şirketinizdeki tüm kullanıcıları görüntüleyin ve yönetin'}
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setEditingUser(null)
                    setFormOpen(true)
                  }}
                  className="bg-gradient-primary text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Yeni Kullanıcı
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* SuperAdmin için kurum seçimi */}
              {isSuperAdmin && (
                <div className="mb-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <label className="text-sm font-medium text-indigo-900 mb-2 block">
                    Kurum Seçin
                  </label>
                  <Select
                    value={selectedCompanyId || ''}
                    onValueChange={(value) => {
                      setSelectedCompanyId(value)
                      setSelectedUser(null) // Kurum değiştiğinde seçili kullanıcıyı temizle
                    }}
                  >
                    <SelectTrigger className="w-full max-w-md">
                      <SelectValue placeholder="Tüm kurumları görmek için bir kurum seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tüm Kurumlar</SelectItem>
                      {companies.map((company: any) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name} {company.city ? `(${company.city})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCompanyId && (
                    <p className="text-xs text-indigo-700 mt-2">
                      Seçili kurum: {companies.find((c: any) => c.id === selectedCompanyId)?.name}
                    </p>
                  )}
                </div>
              )}
              <div className="bg-white rounded-lg shadow-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {isSuperAdmin && <TableHead>Kurum</TableHead>}
                      <TableHead>İsim</TableHead>
                      <TableHead>E-posta</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead className="text-right">İşlem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isSuperAdmin ? 5 : 4} className="text-center py-8 text-gray-500">
                          {isSuperAdmin && !selectedCompanyId 
                            ? 'Kurum seçin veya kullanıcı bulunamadı'
                            : 'Kullanıcı bulunamadı'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.id}>
                          {isSuperAdmin && (
                            <TableCell>
                              {companies.find((c: any) => c.id === user.companyId)?.name || 'Bilinmeyen Kurum'}
                            </TableCell>
                          )}
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                user.role === 'ADMIN'
                                  ? 'default'
                                  : user.role === 'SUPER_ADMIN'
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {user.role === 'ADMIN'
                                ? 'Admin'
                                : user.role === 'SUPER_ADMIN'
                                ? 'Süper Admin'
                                : 'Satış'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Link href={`/${locale}/users/${user.id}`} prefetch={true}>
                                <Button variant="ghost" size="icon" title="Görüntüle">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingUser(user)
                                  setFormOpen(true)
                                }}
                                title="Düzenle"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={async () => {
                                  if (!confirm(`${user.name} kullanıcısını silmek istediğinize emin misiniz?`)) {
                                    return
                                  }
                                  
                                  try {
                                    const res = await fetch(`/api/users/${user.id}`, {
                                      method: 'DELETE',
                                    })
                                    
                                    if (!res.ok) {
                                      const errorData = await res.json().catch(() => ({}))
                                      throw new Error(errorData.error || 'Failed to delete user')
                                    }
                                    
                                    // Optimistic update
                                    const updatedUsers = users.filter((u) => u.id !== user.id)
                                    await mutateUsers(updatedUsers, { revalidate: false })
                                    await Promise.all([
                                      mutate('/api/users', updatedUsers, { revalidate: false }),
                                      mutate('/api/users?', updatedUsers, { revalidate: false }),
                                    ])
                                  } catch (error: any) {
                                    console.error('Delete error:', error)
                                    alert(error?.message || 'Silme işlemi başarısız oldu')
                                  }
                                }}
                                className="text-red-600 hover:text-red-700"
                                title="Sil"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user)
                                  // Yetki Yönetimi tab'ına geç - client-side'da çalışır
                                  if (typeof window !== 'undefined') {
                                    const tabs = document.querySelector('[role="tablist"]')
                                    const permissionsTab = tabs?.querySelector('[value="permissions"]') as HTMLButtonElement
                                    permissionsTab?.click()
                                  }
                                }}
                              >
                                Yetkileri Düzenle
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          
          {/* User Form Modal */}
          <UserForm
            user={editingUser || undefined}
            open={formOpen}
            onClose={() => {
              setFormOpen(false)
              setEditingUser(null)
            }}
            onSuccess={async (savedUser: User) => {
              // Optimistic update
              let updatedUsers: User[]
              
              if (editingUser) {
                updatedUsers = users.map((u) =>
                  u.id === savedUser.id ? savedUser : u
                )
              } else {
                updatedUsers = [savedUser, ...users]
              }
              
              await mutateUsers(updatedUsers, { revalidate: false })
              await Promise.all([
                mutate('/api/users', updatedUsers, { revalidate: false }),
                mutate('/api/users?', updatedUsers, { revalidate: false }),
              ])
              
              setFormOpen(false)
              setEditingUser(null)
            }}
          />
        </TabsContent>

        {/* Yetki Yönetimi Tab */}
        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Kullanıcı Yetki Yönetimi</CardTitle>
              <CardDescription>
                {selectedUser
                  ? `${selectedUser.name} (${companies.find((c: any) => c.id === selectedUser.companyId)?.name || 'Bilinmeyen Kurum'}) için yetkileri düzenleyin`
                  : isSuperAdmin
                  ? 'Yetki düzenlemek için bir kurum seçin ve kullanıcı seçin'
                  : 'Yetki düzenlemek için bir kullanıcı seçin'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isSuperAdmin && !selectedCompanyId ? (
                <div className="text-center py-12 text-gray-500">
                  <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Önce &quot;Kullanıcılar&quot; sekmesinden bir kurum seçin</p>
                </div>
              ) : !selectedUser ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Yetki düzenlemek için &quot;Kullanıcılar&quot; sekmesinden bir kullanıcı seçin</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Seçili Kullanıcı Bilgisi */}
                  <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-indigo-900">{selectedUser.name}</h3>
                        <p className="text-sm text-indigo-700">{selectedUser.email}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedUser(null)}
                      >
                        Kapat
                      </Button>
                    </div>
                  </div>

                  {/* İki Seviyeli Yetki Yönetimi */}
                  {permissionsLoading ? (
                    <SkeletonList />
                  ) : (
                    <div className="space-y-6">
                      {/* 1. Yetki: Modül Görünürlük Kontrolü */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Yetki - Modül Görünürlük</CardTitle>
                          <CardDescription>
                            Kullanıcının hangi sayfaları görebileceğini belirleyin
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="bg-white rounded-lg shadow-card overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Modül</TableHead>
                                  <TableHead className="text-center">Görünürlük</TableHead>
                                  <TableHead className="text-center">Hızlı İşlem</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {MODULES.map((module) => {
                                  const isVisible = moduleVisibility[module.value] || false
                                  const perm = permissions[module.value] || {
                                    canRead: false,
                                    canCreate: false,
                                    canUpdate: false,
                                    canDelete: false,
                                  }
                                  const isViewOnly = perm.canRead && !perm.canCreate && !perm.canUpdate && !perm.canDelete
                                  
                                  return (
                                    <TableRow key={module.value}>
                                      <TableCell className="font-medium">{module.label}</TableCell>
                                      <TableCell className="text-center">
                                        <Button
                                          variant={isVisible ? 'default' : 'outline'}
                                          size="icon"
                                          onClick={() =>
                                            handleModuleVisibilityChange(module.value, !isVisible)
                                          }
                                          className={isVisible ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
                                          disabled={!isVisible && !perm.canRead}
                                        >
                                          {isVisible ? (
                                            <Check className="h-4 w-4 text-white" />
                                          ) : (
                                            <X className="h-4 w-4 text-gray-500" />
                                          )}
                                        </Button>
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <div className="flex justify-center gap-2">
                                          <Button
                                            variant={isViewOnly ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => handleViewOnly(module.value)}
                                            className={isViewOnly ? 'bg-green-600 hover:bg-green-700' : ''}
                                            disabled={!isVisible}
                                          >
                                            {isViewOnly ? '✓ View Only' : 'View Only'}
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  )
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </CardContent>
                      </Card>

                      {/* 2. Detay Yetkiler: CRUD Yetkileri */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Detay Yetkiler - CRUD İşlemleri</CardTitle>
                          <CardDescription>
                            Her modül için görüntüle, oluştur, düzenle ve sil yetkilerini belirleyin
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="bg-white rounded-lg shadow-card overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Modül</TableHead>
                                  <TableHead className="text-center">Görüntüle</TableHead>
                                  <TableHead className="text-center">Oluştur</TableHead>
                                  <TableHead className="text-center">Düzenle</TableHead>
                                  <TableHead className="text-center">Sil</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {MODULES.map((module) => {
                                  const perm = permissions[module.value] || {
                                    canRead: false,
                                    canCreate: false,
                                    canUpdate: false,
                                    canDelete: false,
                                  }
                                  const canRead = perm?.canRead === true
                                  const canCreate = perm?.canCreate === true
                                  const canUpdate = perm?.canUpdate === true
                                  const canDelete = perm?.canDelete === true
                                  const isVisible = moduleVisibility[module.value] || false
                                  
                                  return (
                                    <TableRow 
                                      key={module.value}
                                      className={!isVisible ? 'opacity-50' : ''}
                                    >
                                      <TableCell className="font-medium">{module.label}</TableCell>
                                      <TableCell className="text-center">
                                        <Button
                                          variant={canRead ? 'default' : 'outline'}
                                          size="icon"
                                          onClick={() =>
                                            handlePermissionChange(module.value, 'canRead', !canRead)
                                          }
                                          className={canRead ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
                                          disabled={!isVisible}
                                        >
                                          {canRead ? (
                                            <Check className="h-4 w-4 text-white" />
                                          ) : (
                                            <X className="h-4 w-4 text-gray-500" />
                                          )}
                                        </Button>
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <Button
                                          variant={canCreate ? 'default' : 'outline'}
                                          size="icon"
                                          onClick={() =>
                                            handlePermissionChange(
                                              module.value,
                                              'canCreate',
                                              !canCreate
                                            )
                                          }
                                          className={canCreate ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
                                          disabled={!isVisible || !canRead}
                                        >
                                          {canCreate ? (
                                            <Check className="h-4 w-4 text-white" />
                                          ) : (
                                            <X className="h-4 w-4 text-gray-500" />
                                          )}
                                        </Button>
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <Button
                                          variant={canUpdate ? 'default' : 'outline'}
                                          size="icon"
                                          onClick={() =>
                                            handlePermissionChange(
                                              module.value,
                                              'canUpdate',
                                              !canUpdate
                                            )
                                          }
                                          className={canUpdate ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
                                          disabled={!isVisible || !canRead}
                                        >
                                          {canUpdate ? (
                                            <Check className="h-4 w-4 text-white" />
                                          ) : (
                                            <X className="h-4 w-4 text-gray-500" />
                                          )}
                                        </Button>
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <Button
                                          variant={canDelete ? 'default' : 'outline'}
                                          size="icon"
                                          onClick={() =>
                                            handlePermissionChange(
                                              module.value,
                                              'canDelete',
                                              !canDelete
                                            )
                                          }
                                          className={canDelete ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
                                          disabled={!isVisible || !canRead}
                                        >
                                          {canDelete ? (
                                            <Check className="h-4 w-4 text-white" />
                                          ) : (
                                            <X className="h-4 w-4 text-gray-500" />
                                          )}
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  )
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Hata Mesajı */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                      {error}
                    </div>
                  )}

                  {/* Kaydet Butonu */}
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSelectedUser(null)
                        setError(null)
                      }}
                      disabled={saving}
                    >
                      İptal
                    </Button>
                    <Button 
                      onClick={handleSavePermissions} 
                      className="bg-gradient-primary"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Kaydediliyor...
                        </>
                      ) : (
                        'Yetkileri Kaydet'
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

