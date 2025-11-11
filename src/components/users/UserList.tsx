'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from '@/lib/toast'
import { useSession } from 'next-auth/react'
import { useLocale } from 'next-intl'
import { Plus, Search, Edit, Trash2, Eye, User as UserIcon } from 'lucide-react'
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
import UserForm from './UserForm'
import SkeletonList from '@/components/skeletons/SkeletonList'
import Link from 'next/link'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'

interface User {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
}

export default function UserList() {
  const locale = useLocale()
  const { data: session } = useSession()
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'

  // Debounced search - performans için (kullanıcı yazmayı bitirdikten 300ms sonra arama)
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300) // 300ms debounce - her harfte arama yapılmaz
    
    return () => clearTimeout(timer)
  }, [search])

  // SWR ile veri çekme (repo kurallarına uygun) - debounced search kullanıyoruz
  const params = new URLSearchParams()
  if (debouncedSearch) params.append('search', debouncedSearch)
  if (role) params.append('role', role)
  
  const apiUrl = `/api/users?${params.toString()}`
  const { data: users = [], isLoading, error, mutate: mutateUsers } = useData<User[]>(apiUrl, {
    dedupingInterval: 5000, // 5 saniye cache (daha kısa - güncellemeler daha hızlı)
    revalidateOnFocus: false, // Focus'ta yeniden fetch yapma
  })

  const handleDelete = useCallback(async (id: string, name: string) => {
    if (!confirm(`${name} kullanıcısını silmek istediğinize emin misiniz?`)) {
      return
    }

    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete user')
      }
      
      // Optimistic update - silinen kaydı listeden kaldır
      const updatedUsers = users.filter((u) => u.id !== id)
      
      // Cache'i güncelle - yeni listeyi hemen göster
      await mutateUsers(updatedUsers, { revalidate: false })
      
      // Tüm diğer user URL'lerini de güncelle
      await Promise.all([
        mutate('/api/users', updatedUsers, { revalidate: false }),
        mutate('/api/users?', updatedUsers, { revalidate: false }),
        mutate(apiUrl, updatedUsers, { revalidate: false }),
      ])
    } catch (error: any) {
      // Production'da console.error kaldırıldı
      if (process.env.NODE_ENV === 'development') {
        console.error('Delete error:', error)
      }
      toast.error('Silinemedi', error?.message)
    }
  }, [users, mutateUsers, apiUrl])

  const handleAdd = useCallback(() => {
    setSelectedUser(null)
    setFormOpen(true)
  }, [])

  const handleEdit = useCallback((user: User) => {
    setSelectedUser(user)
    setFormOpen(true)
  }, [])

  const handleFormClose = useCallback(() => {
    setFormOpen(false)
    setSelectedUser(null)
    // Form kapanırken cache'i güncelleme yapılmaz - onSuccess callback'te zaten yapılıyor
  }, [])

  const roleLabels: Record<string, string> = {
    SUPER_ADMIN: 'Süper Admin',
    ADMIN: 'Admin',
    SALES: 'Satış',
  }

  const roleColors: Record<string, string> = {
    SUPER_ADMIN: 'bg-purple-100 text-purple-800',
    ADMIN: 'bg-blue-100 text-blue-800',
    SALES: 'bg-green-100 text-green-800',
  }

  if (isLoading) {
    return <SkeletonList />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kullanıcılar</h1>
          <p className="mt-2 text-gray-600">
            Toplam {users.length} kullanıcı
          </p>
        </div>
        {isSuperAdmin && (
          <Button
            onClick={handleAdd}
            className="bg-gradient-primary text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Yeni Kullanıcı
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder="Ara (isim, email)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={role || 'all'} onValueChange={(v) => setRole(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="SUPER_ADMIN">Süper Admin</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="SALES">Satış</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ad Soyad</TableHead>
              <TableHead>E-posta</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Tarih</TableHead>
              {isSuperAdmin && <TableHead className="text-right">İşlemler</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isSuperAdmin ? 5 : 4} className="text-center py-8 text-gray-500">
                  Kullanıcı bulunamadı
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-gray-400" />
                    {user.name}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge className={roleColors[user.role] || 'bg-gray-100 text-gray-800'}>
                      {roleLabels[user.role] || user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                  </TableCell>
                  {isSuperAdmin && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/${locale}/users/${user.id}`} prefetch={true}>
                          <Button variant="ghost" size="icon" aria-label={`${user.name} kullanıcısını görüntüle`}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(user)}
                          aria-label={`${user.name} kullanıcısını düzenle`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(user.id, user.name)}
                          className="text-red-600 hover:text-red-700"
                          aria-label={`${user.name} kullanıcısını sil`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Form Modal */}
      {formOpen && isSuperAdmin && (
        <UserForm
          user={selectedUser || undefined}
          open={formOpen}
          onClose={handleFormClose}
          onSuccess={async (savedUser: User) => {
            // Optimistic update - yeni/ güncellenmiş kaydı hemen cache'e ekle ve UI'da göster
            // Böylece form kapanmadan önce kullanıcı listede görünür
            
            let updatedUsers: User[]
            
            if (selectedUser) {
              // UPDATE: Mevcut kaydı güncelle
              updatedUsers = users.map((u) =>
                u.id === savedUser.id ? savedUser : u
              )
            } else {
              // CREATE: Yeni kaydı listenin başına ekle
              updatedUsers = [savedUser, ...users]
            }
            
            // Cache'i güncelle - optimistic update'i hemen uygula ve koru
            // revalidate: false = background refetch yapmaz, optimistic update korunur
            await mutateUsers(updatedUsers, { revalidate: false })
            
            // Tüm diğer user URL'lerini de güncelle (optimistic update)
            await Promise.all([
              mutate('/api/users', updatedUsers, { revalidate: false }),
              mutate('/api/users?', updatedUsers, { revalidate: false }),
              mutate(apiUrl, updatedUsers, { revalidate: false }),
            ])
          }}
        />
      )}
    </div>
  )
}





