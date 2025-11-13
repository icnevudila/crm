'use client'

/* eslint-disable react/no-unescaped-entities */

import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { Crown, Building2, Users, Lock, Edit, Trash2, Plus, Loader2, Check, X } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import SkeletonList from '@/components/skeletons/SkeletonList'
import { motion } from 'framer-motion'

interface Company {
  id: string
  name: string
  sector?: string
  city?: string
  status: string
  createdAt: string
  moduleIds?: string[]
  modules?: Module[]
}

interface Module {
  id: string
  code: string
  name: string
  description?: string
  icon?: string
  isActive: boolean
  displayOrder: number
}

interface Role {
  id: string
  code: string
  name: string
  description?: string
  isSystemRole: boolean
  isActive: boolean
  permissions?: RolePermission[]
}

interface RolePermission {
  moduleId: string
  canCreate: boolean
  canRead: boolean
  canUpdate: boolean
  canDelete: boolean
}

interface User {
  id: string
  name: string
  email: string
  role: string
  companyId: string
  roleId?: string
  Company?: {
    id: string
    name: string
  }
  Role?: {
    id: string
    code: string
    name: string
  }
}

export default function SuperAdminPage() {
  const locale = useLocale()
  const [activeTab, setActiveTab] = useState('companies')
  
  // Companies Tab State
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [companyFormOpen, setCompanyFormOpen] = useState(false)
  const [companyFormData, setCompanyFormData] = useState<Partial<Company>>({})
  const [companyModuleIds, setCompanyModuleIds] = useState<string[]>([])
  const [savingCompany, setSavingCompany] = useState(false)
  const [deletingCompany, setDeletingCompany] = useState<string | null>(null)
  // Admin atama için state
  const [adminData, setAdminData] = useState({
    adminName: '',
    adminEmail: '',
    adminPassword: '',
  })

  // Roles Tab State
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [rolePermissions, setRolePermissions] = useState<Record<string, RolePermission>>({})
  const [savingRole, setSavingRole] = useState(false)

  // Users Tab State
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userRoleId, setUserRoleId] = useState<string>('')
  const [userCompanyId, setUserCompanyId] = useState<string>('')
  const [savingUser, setSavingUser] = useState(false)
  const [userFormOpen, setUserFormOpen] = useState(false)
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: '',
    roleId: '',
    companyId: '',
  })

  // Data fetching
  const { data: companiesData, isLoading: companiesLoading, mutate: mutateCompanies } = useData<{
    companies: Company[]
    modules: Module[]
  }>('/api/superadmin/companies', {
    dedupingInterval: 5000,
    revalidateOnFocus: false,
  })

  const { data: rolesData, isLoading: rolesLoading, mutate: mutateRoles } = useData<{
    roles: Role[]
    modules: Module[]
  }>('/api/superadmin/roles', {
      dedupingInterval: 5000,
      revalidateOnFocus: false,
  })

  const { data: usersData, isLoading: usersLoading, mutate: mutateUsers } = useData<{
    users: User[]
    companies: Company[]
    roles: Role[]
  }>('/api/superadmin/users', {
      dedupingInterval: 5000,
      revalidateOnFocus: false,
  })

  const companies = companiesData?.companies || []
  const modules = companiesData?.modules || []
  const roles = rolesData?.roles || []
  const roleModules = rolesData?.modules || []
  const users = usersData?.users || []
  const userCompanies = usersData?.companies || []
  const userRoles = usersData?.roles || []

  // Company form handlers
  const handleOpenCompanyForm = (company?: Company) => {
    if (company) {
      setCompanyFormData(company)
      setCompanyModuleIds(company.moduleIds || [])
      setAdminData({ adminName: '', adminEmail: '', adminPassword: '' }) // Düzenleme modunda admin bilgileri gösterilmez
    } else {
      setCompanyFormData({})
      setCompanyModuleIds([])
      setAdminData({ adminName: '', adminEmail: '', adminPassword: '' }) // Yeni kurum için admin bilgileri temizle
    }
    setCompanyFormOpen(true)
  }

  const handleSaveCompany = async () => {
    if (!companyFormData.name?.trim()) {
      alert('Şirket adı gereklidir')
      return
    }

    setSavingCompany(true)
    try {
      // Önce şirketi kaydet
      const url = companyFormData.id
        ? `/api/companies/${companyFormData.id}`
        : '/api/companies'
      const method = companyFormData.id ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: companyFormData.name.trim(),
          sector: companyFormData.sector,
          city: companyFormData.city,
          status: companyFormData.status || 'ACTIVE',
          maxUsers: companyFormData.maxUsers || null,
          maxModules: companyFormData.maxModules || null,
          adminUserLimit: companyFormData.adminUserLimit || null,
          // Yeni kurum oluştururken admin bilgileri gönder
          ...(method === 'POST' && adminData.adminEmail && adminData.adminName && adminData.adminPassword ? {
            adminName: adminData.adminName,
            adminEmail: adminData.adminEmail,
            adminPassword: adminData.adminPassword,
          } : {}),
        }),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to save company')
      }

      const savedCompany = await res.json()

      // Modül izinlerini güncelle
      const permRes = await fetch('/api/superadmin/companies', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
          companyId: savedCompany.id,
          moduleIds: companyModuleIds,
          }),
        })

      if (!permRes.ok) {
        throw new Error('Modül izinleri güncellenemedi')
      }
      
      // Cache'i güncelle
      await mutateCompanies()
      await mutate('/api/superadmin/companies')

      setCompanyFormOpen(false)
      setCompanyFormData({})
      setCompanyModuleIds([])
      setAdminData({ adminName: '', adminEmail: '', adminPassword: '' })
      alert('Şirket başarıyla kaydedildi!')
    } catch (error: any) {
      console.error('Error saving company:', error)
      alert(error?.message || 'Şirket kaydedilemedi')
    } finally {
      setSavingCompany(false)
    }
  }

  const handleDeleteCompany = async (id: string, name: string) => {
    if (!confirm(`${name} şirketini silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`)) {
      return
    }

    setDeletingCompany(id)
    try {
      const res = await fetch(`/api/companies/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to delete company')
      }

      await mutateCompanies()
      await mutate('/api/superadmin/companies')
      alert('Şirket başarıyla silindi!')
    } catch (error: any) {
      console.error('Error deleting company:', error)
      alert(error?.message || 'Şirket silinemedi')
    } finally {
      setDeletingCompany(null)
    }
  }

  // Role handlers
  const handleSelectRole = (role: Role) => {
    setSelectedRole(role)
    // Role permissions'ı state'e yükle
    const perms: Record<string, RolePermission> = {}
    if (role.permissions) {
      role.permissions.forEach((perm) => {
        perms[perm.moduleId] = perm
      })
    }
    setRolePermissions(perms)
  }

  const handleUpdateRolePermission = (moduleId: string, field: keyof RolePermission, value: boolean) => {
    setRolePermissions((prev) => ({
        ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [field]: value,
        canRead: field === 'canRead' ? value : prev[moduleId]?.canRead || false,
        },
      }))
  }

  const handleSaveRole = async () => {
    if (!selectedRole) return

    // Sistem rolü kontrolü
    if (selectedRole.isSystemRole) {
      alert('Sistem rolleri değiştirilemez')
      return
    }

    setSavingRole(true)
    try {
      const permissions = roleModules.map((module) => ({
        moduleId: module.id,
        canCreate: rolePermissions[module.id]?.canCreate || false,
        canRead: rolePermissions[module.id]?.canRead || false,
        canUpdate: rolePermissions[module.id]?.canUpdate || false,
        canDelete: rolePermissions[module.id]?.canDelete || false,
      }))

      const res = await fetch('/api/superadmin/roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId: selectedRole.id,
          permissions,
        }),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to save role permissions')
      }

      await mutateRoles()
      await mutate('/api/superadmin/roles')
      alert('Rol izinleri başarıyla güncellendi!')
    } catch (error: any) {
      console.error('Error saving role:', error)
      alert(error?.message || 'Rol izinleri güncellenemedi')
    } finally {
      setSavingRole(false)
    }
  }

  // User handlers
  const handleSelectUser = (user: User) => {
    setSelectedUser(user)
    setUserRoleId(user.roleId || '')
    setUserCompanyId(user.companyId || '')
  }

  const handleSaveUser = async () => {
    if (!selectedUser) return

    setSavingUser(true)
    try {
      const res = await fetch('/api/superadmin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          roleId: userRoleId && userRoleId.trim() !== '' ? userRoleId : null,
          companyId: userCompanyId,
        }),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to update user')
      }

      await mutateUsers()
      await mutate('/api/superadmin/users')
      setSelectedUser(null)
      alert('Kullanıcı başarıyla güncellendi!')
    } catch (error: any) {
      console.error('Error saving user:', error)
      alert(error?.message || 'Kullanıcı güncellenemedi')
    } finally {
      setSavingUser(false)
    }
  }

  const handleCreateUser = async () => {
    if (!newUserData.name?.trim() || !newUserData.email?.trim()) {
      alert('Ad ve e-posta gereklidir')
      return
    }

    if (!newUserData.companyId) {
      alert('Kurum seçimi zorunludur')
      return
    }

    setSavingUser(true)
    try {
      // Role tablosundan role code'unu al
      let roleCode = 'USER'
      if (newUserData.roleId) {
        const selectedRole = userRoles.find(r => r.id === newUserData.roleId)
        if (selectedRole) {
          roleCode = selectedRole.code
        }
      }

      // Şifre boşsa rastgele şifre oluştur
      let password = newUserData.password
      if (!password || password.trim() === '') {
        // Rastgele 12 karakterlik şifre oluştur
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        password = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
      }

      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUserData.name.trim(),
          email: newUserData.email.trim(),
          password: password,
          role: roleCode,
          companyId: newUserData.companyId,
        }),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to create user')
      }

      const savedUser = await res.json()

      // Eğer roleId seçildiyse, kullanıcı oluşturulduktan sonra roleId'yi güncelle
      if (newUserData.roleId && savedUser.id) {
        const roleUpdateRes = await fetch('/api/superadmin/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: savedUser.id,
            roleId: newUserData.roleId,
            companyId: newUserData.companyId,
          }),
        })

        if (!roleUpdateRes.ok) {
          console.warn('Kullanıcı oluşturuldu ancak rol ataması yapılamadı')
        }
      }

      await mutateUsers()
      await mutate('/api/superadmin/users')
      
      setUserFormOpen(false)
      
      // Şifre otomatik oluşturulduysa kullanıcıya göster
      const generatedPassword = !newUserData.password || newUserData.password.trim() === '' ? password : null
      
      setNewUserData({
        name: '',
        email: '',
        password: '',
        roleId: '',
        companyId: '',
      })
      
      if (generatedPassword) {
        alert(`Kullanıcı başarıyla oluşturuldu!\n\nGeçici şifre: ${generatedPassword}\n\nLütfen bu şifreyi kullanıcıyla paylaşın.`)
      } else {
        alert('Kullanıcı başarıyla oluşturuldu!')
      }
    } catch (error: any) {
      console.error('Error creating user:', error)
      alert(error?.message || 'Kullanıcı oluşturulamadı')
    } finally {
      setSavingUser(false)
    }
  }

  if (companiesLoading || rolesLoading || usersLoading) {
    return <SkeletonList />
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Crown className="h-8 w-8 text-purple-600" />
            Süper Admin Paneli
          </h1>
          <p className="mt-2 text-gray-600">
            Tüm kurumları, rolleri ve kullanıcıları yönetin
          </p>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="companies">
            <Building2 className="h-4 w-4 mr-2" />
            Kurumlar
          </TabsTrigger>
          <TabsTrigger value="roles">
            <Lock className="h-4 w-4 mr-2" />
            Roller
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Kullanıcılar
          </TabsTrigger>
        </TabsList>

        {/* Kurumlar Tab */}
        <TabsContent value="companies" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Kurumlar</CardTitle>
              <CardDescription>
                    Tüm kurumları görüntüleyin ve modül izinlerini yönetin
              </CardDescription>
                </div>
                <Button onClick={() => handleOpenCompanyForm()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Kurum
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-white rounded-lg shadow-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kurum Adı</TableHead>
                      <TableHead>Sektör</TableHead>
                      <TableHead>Şehir</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Modüller</TableHead>
                      <TableHead>Limitasyonlar</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          Kurum bulunamadı
                        </TableCell>
                      </TableRow>
                    ) : (
                      companies.map((company) => (
                        <TableRow key={company.id}>
                          <TableCell className="font-medium">{company.name}</TableCell>
                          <TableCell>{company.sector || '-'}</TableCell>
                          <TableCell>{company.city || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={company.status === 'ACTIVE' ? 'default' : 'secondary'}>
                              {company.status === 'ACTIVE' ? 'Aktif' : 'Pasif'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {company.modules?.slice(0, 3).map((module) => (
                                <Badge key={module.id} variant="outline" className="text-xs">
                                  {module.name}
                                </Badge>
                              ))}
                              {company.modules && company.modules.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{company.modules.length - 3}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs space-y-1">
                              {company.maxUsers && (
                                <div className="text-gray-600">
                                  Kullanıcı: <span className="font-medium">{company.maxUsers}</span>
                                </div>
                              )}
                              {company.maxModules && (
                                <div className="text-gray-600">
                                  Modül: <span className="font-medium">{company.maxModules}</span>
                                </div>
                              )}
                              {company.adminUserLimit && (
                                <div className="text-gray-600">
                                  Admin Limit: <span className="font-medium">{company.adminUserLimit}</span>
                                </div>
                              )}
                              {!company.maxUsers && !company.maxModules && !company.adminUserLimit && (
                                <span className="text-gray-400">Sınırsız</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenCompanyForm(company)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteCompany(company.id, company.name)}
                                className="text-red-600 hover:text-red-700"
                                disabled={deletingCompany === company.id}
                              >
                                {deletingCompany === company.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
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
        </TabsContent>

        {/* Roller Tab */}
        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Roller ve İzinler</CardTitle>
              <CardDescription>
                Her rolün modül bazlı izinlerini yönetin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Roller Listesi */}
                <div className="lg:col-span-1">
                  <h3 className="text-sm font-medium mb-3">Roller</h3>
                  <div className="space-y-2">
                    {roles.map((role) => (
                      <div
                        key={role.id}
                        onClick={() => handleSelectRole(role)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedRole?.id === role.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{role.name}</p>
                            <p className="text-xs text-gray-500">{role.code}</p>
                </div>
                          {role.isSystemRole && (
                            <Badge variant="outline" className="text-xs">
                              Sistem
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* İzin Tablosu */}
                <div className="lg:col-span-2">
                  {selectedRole ? (
                    <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                          <h3 className="text-lg font-semibold">{selectedRole.name}</h3>
                          <p className="text-sm text-gray-500">{selectedRole.description}</p>
                      </div>
                        {!selectedRole.isSystemRole && (
                          <Button onClick={handleSaveRole} disabled={savingRole}>
                            {savingRole ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Kaydediliyor...
                              </>
                            ) : (
                              'Kaydet'
                            )}
                      </Button>
                        )}
                    </div>

                      {selectedRole.isSystemRole && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                          Sistem rolleri değiştirilemez
                  </div>
                      )}

                  <div className="bg-white rounded-lg shadow-card overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Modül</TableHead>
                              <TableHead className="text-center">Oluştur</TableHead>
                              <TableHead className="text-center">Oku</TableHead>
                              <TableHead className="text-center">Güncelle</TableHead>
                              <TableHead className="text-center">Sil</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                            {roleModules.map((module) => {
                              const perm = rolePermissions[module.id] || {
                                canCreate: false,
                                canRead: false,
                                canUpdate: false,
                                canDelete: false,
                              }
                          return (
                                <TableRow key={module.id}>
                                  <TableCell className="font-medium">{module.name}</TableCell>
                              <TableCell className="text-center">
                                    <Checkbox
                                      checked={perm.canCreate}
                                      onCheckedChange={(checked) =>
                                        handleUpdateRolePermission(module.id, 'canCreate', checked === true)
                                      }
                                      disabled={selectedRole.isSystemRole}
                                    />
                              </TableCell>
                              <TableCell className="text-center">
                                    <Checkbox
                                      checked={perm.canRead}
                                      onCheckedChange={(checked) =>
                                        handleUpdateRolePermission(module.id, 'canRead', checked === true)
                                      }
                                      disabled={selectedRole.isSystemRole}
                                    />
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Checkbox
                                      checked={perm.canUpdate}
                                      onCheckedChange={(checked) =>
                                        handleUpdateRolePermission(module.id, 'canUpdate', checked === true)
                                      }
                                      disabled={selectedRole.isSystemRole}
                                    />
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Checkbox
                                      checked={perm.canDelete}
                                      onCheckedChange={(checked) =>
                                        handleUpdateRolePermission(module.id, 'canDelete', checked === true)
                                      }
                                      disabled={selectedRole.isSystemRole}
                                    />
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Lock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>İzin yönetmek için bir rol seçin</p>
                    </div>
              )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Kullanıcılar Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Kullanıcılar</CardTitle>
                  <CardDescription>
                    Kullanıcıların rol ve kurum atamalarını yönetin
                  </CardDescription>
                </div>
                <Button onClick={() => setUserFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Kullanıcı
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Kullanıcı Listesi */}
                <div className="lg:col-span-1">
                  <h3 className="text-sm font-medium mb-3">Kullanıcılar</h3>
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => handleSelectUser(user)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedUser?.id === user.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        <div className="flex gap-1 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {user.Role?.name || user.role}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {user.Company?.name || 'Kurum yok'}
                          </Badge>
                </div>
                      </div>
                    ))}
                    </div>
                  </div>

                {/* Rol Atama Formu */}
                <div className="lg:col-span-2">
                  {selectedUser ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                        <p className="text-sm text-gray-500">{selectedUser.email}</p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Kurum</label>
                          <Select
                            value={userCompanyId}
                            onValueChange={setUserCompanyId}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Kurum seçin" />
                            </SelectTrigger>
                            <SelectContent>
                              {userCompanies.map((company) => (
                                <SelectItem key={company.id} value={company.id}>
                                  {company.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Rol</label>
                          <Select
                            value={userRoleId || undefined}
                            onValueChange={(value) => setUserRoleId(value || '')}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Rol seçin" />
                            </SelectTrigger>
                            <SelectContent>
                              {userRoles.map((role) => (
                                <SelectItem key={role.id} value={role.id}>
                                  {role.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <Button onClick={handleSaveUser} disabled={savingUser} className="w-full">
                          {savingUser ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Kaydediliyor...
                                      </>
                                    ) : (
                            'Kaydet'
                                    )}
                                  </Button>
                    </div>
                </div>
                  ) : (
                <div className="text-center py-12 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>Rol atamak için bir kullanıcı seçin</p>
                </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Kurum Form Dialog */}
      <Dialog open={companyFormOpen} onOpenChange={setCompanyFormOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {companyFormData.id ? 'Kurum Düzenle' : 'Yeni Kurum'}
            </DialogTitle>
            <DialogDescription>
              {companyFormData.id
                ? 'Kurum bilgilerini ve modül izinlerini güncelleyin'
                : 'Yeni kurum ekleyin ve modül izinlerini ayarlayın'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Kurum Adı *</label>
              <Input
                value={companyFormData.name || ''}
                onChange={(e) =>
                  setCompanyFormData({ ...companyFormData, name: e.target.value })
                }
                placeholder="Kurum adı"
                disabled={savingCompany}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sektör</label>
              <Input
                value={companyFormData.sector || ''}
                onChange={(e) =>
                  setCompanyFormData({ ...companyFormData, sector: e.target.value })
                }
                placeholder="Sektör"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Şehir</label>
              <Input
                value={companyFormData.city || ''}
                onChange={(e) =>
                  setCompanyFormData({ ...companyFormData, city: e.target.value })
                }
                placeholder="Şehir"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Durum</label>
              <Select
                value={companyFormData.status || 'ACTIVE'}
                onValueChange={(value) =>
                  setCompanyFormData({ ...companyFormData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Aktif</SelectItem>
                  <SelectItem value="INACTIVE">Pasif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Limitasyonlar - Hem yeni kurum hem de düzenleme için */}
            <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900">Limitasyonlar</h3>
              <div className="space-y-2">
                <label className="text-sm font-medium">Maksimum Kullanıcı Sayısı</label>
                <Input
                  type="number"
                  value={companyFormData.maxUsers || ''}
                  onChange={(e) =>
                    setCompanyFormData({ ...companyFormData, maxUsers: e.target.value ? parseInt(e.target.value) : null })
                  }
                  placeholder="Sınırsız için boş bırakın"
                  min="1"
                />
                <p className="text-xs text-gray-500">Kurumun ekleyebileceği maksimum kullanıcı sayısı (boş = sınırsız)</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Maksimum Modül Sayısı</label>
                <Input
                  type="number"
                  value={companyFormData.maxModules || ''}
                  onChange={(e) =>
                    setCompanyFormData({ ...companyFormData, maxModules: e.target.value ? parseInt(e.target.value) : null })
                  }
                  placeholder="Sınırsız için boş bırakın"
                  min="1"
                />
                <p className="text-xs text-gray-500">Kurumun kullanabileceği maksimum modül sayısı (boş = sınırsız)</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Admin Kullanıcı Limiti</label>
                <Input
                  type="number"
                  value={companyFormData.adminUserLimit || ''}
                  onChange={(e) =>
                    setCompanyFormData({ ...companyFormData, adminUserLimit: e.target.value ? parseInt(e.target.value) : null })
                  }
                  placeholder="Sınırsız için boş bırakın"
                  min="1"
                />
                <p className="text-xs text-gray-500">Admin rolündeki kullanıcıların ekleyebileceği maksimum kullanıcı sayısı (boş = sınırsız)</p>
              </div>
            </div>

            {/* Admin Atama - Sadece yeni kurum oluştururken */}
            {!companyFormData.id && (
              <div className="space-y-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <h3 className="text-sm font-semibold text-indigo-900">Kurum Admin'i Atama (Opsiyonel)</h3>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Admin Adı</label>
                  <Input
                    value={adminData.adminName}
                    onChange={(e) => setAdminData({ ...adminData, adminName: e.target.value })}
                    placeholder="Admin kullanıcı adı"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Admin E-posta</label>
                  <Input
                    type="email"
                    value={adminData.adminEmail}
                    onChange={(e) => setAdminData({ ...adminData, adminEmail: e.target.value })}
                    placeholder="admin@kurum.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Admin Şifre</label>
                  <Input
                    type="password"
                    value={adminData.adminPassword}
                    onChange={(e) => setAdminData({ ...adminData, adminPassword: e.target.value })}
                    placeholder="En az 6 karakter"
                  />
                </div>
                <p className="text-xs text-gray-600">Kurum oluşturulduktan sonra bu bilgilerle admin kullanıcısı otomatik oluşturulacak</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Modül İzinleri</label>
              <div className="border rounded-lg p-4 max-h-[300px] overflow-y-auto">
                <div className="space-y-2">
                  {modules.map((module) => (
                    <div key={module.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`module-${module.id}`}
                        checked={companyModuleIds.includes(module.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setCompanyModuleIds([...companyModuleIds, module.id])
                          } else {
                            setCompanyModuleIds(companyModuleIds.filter((id) => id !== module.id))
                          }
                        }}
                      />
                      <label
                        htmlFor={`module-${module.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {module.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setCompanyFormOpen(false)
                  setCompanyFormData({})
                  setCompanyModuleIds([])
                }}
                disabled={savingCompany}
              >
                İptal
              </Button>
              <Button onClick={handleSaveCompany} disabled={savingCompany}>
                {savingCompany ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  'Kaydet'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Yeni Kullanıcı Form Dialog */}
      <Dialog open={userFormOpen} onOpenChange={setUserFormOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni Kullanıcı</DialogTitle>
            <DialogDescription>
              Yeni kullanıcı ekleyin ve kurum/rol ataması yapın
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Ad Soyad *</label>
              <Input
                value={newUserData.name}
                onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                placeholder="Ad Soyad"
                disabled={savingUser}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">E-posta *</label>
              <Input
                type="email"
                value={newUserData.email}
                onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                placeholder="kullanici@example.com"
                disabled={savingUser}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Şifre</label>
              <Input
                type="password"
                value={newUserData.password}
                onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                placeholder="Boş bırakılırsa otomatik oluşturulur"
                disabled={savingUser}
              />
              <p className="text-xs text-gray-500">Boş bırakılırsa rastgele şifre oluşturulur</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Kurum *</label>
              <Select
                value={newUserData.companyId}
                onValueChange={(value) => setNewUserData({ ...newUserData, companyId: value })}
                disabled={savingUser}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kurum seçin" />
                </SelectTrigger>
                <SelectContent>
                  {userCompanies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Rol</label>
              <Select
                value={newUserData.roleId}
                onValueChange={(value) => setNewUserData({ ...newUserData, roleId: value })}
                disabled={savingUser}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Rol seçin (opsiyonel)" />
                </SelectTrigger>
                <SelectContent>
                  {userRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">Boş bırakılırsa varsayılan USER rolü atanır</p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setUserFormOpen(false)
                  setNewUserData({
                    name: '',
                    email: '',
                    password: '',
                    roleId: '',
                    companyId: '',
                  })
                }}
                disabled={savingUser}
              >
                İptal
              </Button>
              <Button onClick={handleCreateUser} disabled={savingUser}>
                {savingUser ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Oluşturuluyor...
                  </>
                ) : (
                  'Oluştur'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
