'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

const userSchema = z.object({
  name: z.string().min(1, 'Ad soyad gereklidir'),
  email: z.string().email('Geçerli bir email adresi giriniz'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır').optional(),
  role: z.enum(['ADMIN', 'SALES', 'SUPER_ADMIN']).default('SALES'),
})

type UserFormData = z.infer<typeof userSchema>

interface UserFormProps {
  user?: any
  open: boolean
  onClose: () => void
  onSuccess?: (savedUser: any) => void | Promise<void>
}

export default function UserForm({ user, open, onClose, onSuccess }: UserFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: user || {
      name: '',
      email: '',
      password: '',
      role: 'SALES',
    },
  })

  const role = watch('role')

  // User prop değiştiğinde veya modal açıldığında form'u güncelle
  useEffect(() => {
    if (open) {
      if (user) {
        // Düzenleme modu - user bilgilerini yükle
        reset({
          name: user.name || '',
          email: user.email || '',
          password: '', // Şifreyi gösterme
          role: user.role || 'SALES',
        })
      } else {
        // Yeni kayıt modu - form'u temizle
        reset({
          name: '',
          email: '',
          password: '',
          role: 'SALES',
        })
      }
    }
  }, [user, open, reset])

  const mutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const url = user ? `/api/users/${user.id}` : '/api/users'
      const method = user ? 'PUT' : 'POST'

      // Güncellemede şifre yoksa kaldır
      if (user && !data.password) {
        const { password, ...rest } = data
        data = rest as any
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to save user')
      }

      return res.json()
    },
    onSuccess: (savedUser) => {
      // onSuccess callback'i çağır - optimistic update için
      if (onSuccess) {
        onSuccess(savedUser)
      }
      reset()
      onClose()
    },
    onError: (error: any) => {
      console.error('Error:', error)
      alert(error.message || 'Kullanıcı kaydedilemedi')
    },
  })

  const onSubmit = async (data: UserFormData) => {
    setLoading(true)
    try {
      await mutation.mutateAsync(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{user ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}</DialogTitle>
          <DialogDescription>
            {user ? 'Kullanıcı bilgilerini güncelleyin' : 'Yeni kullanıcı ekleyin'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Ad Soyad *</label>
            <Input
              {...register('name')}
              placeholder="Ad soyad"
              disabled={loading}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">E-posta *</label>
            <Input
              type="email"
              {...register('email')}
              placeholder="email@example.com"
              disabled={loading || !!user}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
            {user && (
              <p className="text-xs text-gray-500">E-posta değiştirilemez</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Şifre {user ? '(değiştirmek için doldurun)' : '*'}
            </label>
            <Input
              type="password"
              {...register('password')}
              placeholder={user ? 'Yeni şifre (opsiyonel)' : 'Şifre'}
              disabled={loading}
            />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Rol *</label>
            <Select
              value={role}
              onValueChange={(value) => setValue('role', value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SALES">Satış</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="SUPER_ADMIN">Süper Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Kaydediliyor...' : user ? 'Güncelle' : 'Oluştur'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}






