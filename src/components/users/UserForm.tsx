'use client'

import { useState, useEffect } from 'react'
import { toast, handleApiError } from '@/lib/toast'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { useTranslations } from 'next-intl'
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

interface UserFormProps {
  user?: any
  open: boolean
  onClose: () => void
  onSuccess?: (savedUser: any) => void | Promise<void>
}

export default function UserForm({ user, open, onClose, onSuccess }: UserFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const t = useTranslations('users')
  const tCommon = useTranslations('common')
  const [loading, setLoading] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null)
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'

  // SuperAdmin iÃ§in kurumlarÄ± Ã§ek - her zaman Ã§ek (hem SuperAdmin hem de normal admin iÃ§in)
  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await fetch('/api/companies')
      if (!res.ok) throw new Error('Failed to fetch companies')
      return res.json()
    },
    enabled: open && isSuperAdmin,
  })

  // Schema'yÄ± dinamik olarak oluÅŸtur (SuperAdmin kontrolÃ¼ iÃ§in)
  // Validation mesajlarÄ± locale'den alÄ±nÄ±yor
  const createUserSchema = () => {
    if (isSuperAdmin) {
      return z.object({
        name: z.string().min(1, t('form.nameRequired')),
        email: z.string().email(t('form.emailRequired')),
        password: z.string().min(6, t('form.passwordMin')).optional(),
        role: z.enum(['USER', 'ADMIN', 'SALES', 'SUPER_ADMIN']).default('USER'),
        companyId: z.string().min(1, t('form.companyRequired')), // SuperAdmin iÃ§in kurum seÃ§imi zorunlu
      })
    } else {
      return z.object({
        name: z.string().min(1, t('form.nameRequired')),
        email: z.string().email(t('form.emailRequired')),
        password: z.string().min(6, t('form.passwordMin')).optional(),
        role: z.enum(['USER', 'SALES']).default('USER'),
        companyId: z.string().optional(), // Normal admin iÃ§in companyId session'dan gelir
      })
    }
  }

  const userSchema = createUserSchema()
  type UserFormData = z.infer<typeof userSchema>

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
      role: 'USER',
      companyId: '',
    },
  })

  const role = watch('role')
  const companyId = watch('companyId')

  // User prop deÄŸiÅŸtiÄŸinde veya modal aÃ§Ä±ldÄ±ÄŸÄ±nda form'u gÃ¼ncelle
  useEffect(() => {
    if (open) {
      if (user) {
        // DÃ¼zenleme modu - user bilgilerini yÃ¼kle
        reset({
          name: user.name || '',
          email: user.email || '',
          password: '', // Åifreyi gÃ¶sterme
          role: user.role || 'SALES',
          companyId: user.companyId || '',
        })
      } else {
        // Yeni kayÄ±t modu - form'u temizle
        reset({
          name: '',
          email: '',
          password: '',
          role: 'SALES',
          companyId: isSuperAdmin ? '' : (session?.user?.companyId || ''),
        })
      }
    }
  }, [user, open, reset, isSuperAdmin, session?.user?.companyId])

  const mutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const url = user ? `/api/users/${user.id}` : '/api/users'
      const method = user ? 'PUT' : 'POST'

      // GÃ¼ncellemede ÅŸifre yoksa kaldÄ±r
      if (user && !data.password) {
        const { password, ...rest } = data
        data = rest as any
      }

      // SuperAdmin deÄŸilse companyId'yi session'dan al
      if (!isSuperAdmin) {
        data.companyId = session?.user?.companyId
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
      // onSuccess callback'i Ã§aÄŸÄ±r - optimistic update iÃ§in
      if (onSuccess) {
        onSuccess(savedUser)
      }
      reset()
      onClose()
      if (generatedPassword) {
        toast.success(t('form.userCreated'), t('form.tempPassword', { password: generatedPassword }))
        setGeneratedPassword(null)
      } else {
        toast.success(user ? t('form.userUpdated') : t('form.userCreated'))
      }
    },
    onError: (error: any) => {
      console.error('Error:', error)
      handleApiError(error, t('form.saveFailed'), error.message)
    },
  })

  const onSubmit = async (data: UserFormData) => {
    setLoading(true)
    try {
      if (!user) {
        const trimmedPassword = data.password?.trim()
        if (!trimmedPassword) {
          const generated = Math.random().toString(36).slice(-4) + Math.random().toString(36).slice(-6)
          data.password = generated
          setGeneratedPassword(generated)
        } else {
          data.password = trimmedPassword
          setGeneratedPassword(null)
        }
      } else if (data.password && data.password.trim() !== '') {
        setGeneratedPassword(null)
        data.password = data.password.trim()
      } else {
        setGeneratedPassword(null)
      }

      await mutation.mutateAsync(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{user ? t('editUser') : t('newUser')}</DialogTitle>
          <DialogDescription>
            {user ? t('userDetails') : t('addUser')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('form.nameLabel')} *</label>
            <Input
              {...register('name')}
              placeholder={t('form.namePlaceholder')}
              disabled={loading}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t('form.emailLabel')} *</label>
            <Input
              type="email"
              {...register('email')}
              placeholder={t('form.emailPlaceholder')}
              disabled={loading || !!user}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
            {user && (
              <p className="text-xs text-gray-500">{t('form.emailCannotChange')}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t('form.passwordLabel')} {user ? t('form.passwordChange') : '*'}
            </label>
            <Input
              type="password"
              {...register('password')}
              placeholder={user ? t('form.newPasswordOptional') : t('form.passwordPlaceholder')}
              disabled={loading}
            />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t('form.roleLabel')} *</label>
            <Select
              value={role}
              onValueChange={(value) => setValue('role', value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('form.selectRole')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">{t('form.standardUser')}</SelectItem>
                <SelectItem value="SALES">{t('sales')}</SelectItem>
                {isSuperAdmin && (
                  <>
                    <SelectItem value="ADMIN">{t('admin')}</SelectItem>
                    <SelectItem value="SUPER_ADMIN">{t('superAdmin')}</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* SuperAdmin iÃ§in kurum seÃ§imi - ZORUNLU */}
          {isSuperAdmin && (
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('form.companyLabel')} *</label>
              <Select
                value={companyId || ''}
                onValueChange={(value) => setValue('companyId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('form.selectCompany')} />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company: any) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name} {company.city ? `(${company.city})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.companyId && (
                <p className="text-sm text-red-600">{errors.companyId.message}</p>
              )}
              {!companyId && (
                <p className="text-xs text-gray-500">{t('superAdminNote')}</p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('saving') : user ? t('update') : t('create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}






