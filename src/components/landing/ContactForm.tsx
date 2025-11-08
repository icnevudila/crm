'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const contactSchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalıdır'),
  email: z.string().email('Geçerli bir email adresi giriniz'),
  phone: z.string().optional(),
  company: z.string().optional(),
  message: z.string().min(10, 'Mesaj en az 10 karakter olmalıdır'),
})

type ContactFormData = z.infer<typeof contactSchema>

interface ContactFormProps {
  open: boolean
  onClose: () => void
}

export default function ContactForm({ open, onClose }: ContactFormProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  })

  const onSubmit = async (data: ContactFormData) => {
    setLoading(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Mesaj gönderilemedi')
      }

      setSuccess(true)
      reset()
      
      // 3 saniye sonra kapat
      setTimeout(() => {
        setSuccess(false)
        onClose()
      }, 3000)
    } catch (error: any) {
      alert(error?.message || 'Bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            Bize Ulaşın
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Size en kısa sürede dönüş yapacağız
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4"
              >
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </motion.div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Mesajınız Gönderildi!
              </h3>
              <p className="text-gray-600">
                En kısa sürede size dönüş yapacağız.
              </p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    İsim Soyisim *
                  </label>
                  <Input
                    {...register('name')}
                    placeholder="Adınız ve soyadınız"
                    disabled={loading}
                    className="h-11"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Email *
                  </label>
                  <Input
                    {...register('email')}
                    type="email"
                    placeholder="email@example.com"
                    disabled={loading}
                    className="h-11"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Telefon
                  </label>
                  <Input
                    {...register('phone')}
                    type="tel"
                    placeholder="+90 555 123 45 67"
                    disabled={loading}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Şirket
                  </label>
                  <Input
                    {...register('company')}
                    placeholder="Şirket adı"
                    disabled={loading}
                    className="h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Mesajınız *
                </label>
                <Textarea
                  {...register('message')}
                  placeholder="Mesajınızı buraya yazın..."
                  rows={5}
                  disabled={loading}
                  className="resize-none"
                />
                {errors.message && (
                  <p className="text-sm text-red-600">{errors.message.message}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                  className="px-6"
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-6 hover:shadow-lg transition-all duration-300"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gönderiliyor...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Gönder
                    </>
                  )}
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}




