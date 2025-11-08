'use client'

import React, { useState, useEffect, memo, useCallback } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Building2,
  Mail,
  Lock,
  Loader2,
  Eye,
  EyeOff,
  Sparkles,
  Zap,
  Shield,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Rocket,
  Award,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Company {
  id: string
  name: string
  sector: string
  city: string
}

// Optimize edilmiş fetch - agresif cache
async function fetchCompanies(): Promise<Company[]> {
  const res = await fetch('/api/companies', {
    cache: 'force-cache', // Aggressive cache
    next: { revalidate: 300 }, // 5 dakika cache
  })
  if (!res.ok) throw new Error('Failed to fetch companies')
  return res.json()
}

function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  // Şirketleri çek - agresif cache (5 dakika)
  const { data: companies = [], isLoading: companiesLoading, error: companiesError } = useQuery({
    queryKey: ['companies'],
    queryFn: fetchCompanies,
    retry: 1, // Sadece 1 retry (hızlı)
    staleTime: 5 * 60 * 1000, // 5 dakika cache
    gcTime: 10 * 60 * 1000, // 10 dakika garbage collection
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })

  useEffect(() => {
    setMounted(true)
    // Agresif prefetch - dashboard ve diğer sayfalar
    router.prefetch('/tr/dashboard')
    router.prefetch('/tr/customers')
    router.prefetch('/tr/deals')
  }, [router])

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        companyId,
        redirect: false,
      })

      if (result?.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      if (result?.ok) {
        // Başarılı giriş - window.location kullan (daha hızlı)
        router.prefetch('/tr/dashboard')
        window.location.href = '/tr/dashboard'
      } else {
        setError('Giriş başarısız oldu')
        setLoading(false)
      }
    } catch (err) {
      setError('Giriş yapılırken bir hata oluştu')
      setLoading(false)
    }
  }, [email, password, companyId, router])

  // Animation variants - optimize edilmiş
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: 'easeOut',
      },
    },
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-4 relative overflow-hidden">
      {/* Animated background gradient - performans için will-change */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ willChange: 'transform' }}>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      <motion.div
        initial="hidden"
        animate={mounted ? 'visible' : 'hidden'}
        variants={containerVariants}
        className="relative z-10 w-full max-w-md"
      >
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm hover:shadow-3xl transition-all duration-300">
            <CardHeader className="space-y-4 text-center pb-6">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={mounted ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
                transition={{ type: 'spring', duration: 0.6, delay: 0.2 }}
                className="inline-flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-primary-600 to-secondary-600 shadow-xl"
              >
                <Sparkles className="h-8 w-8 text-white" />
              </motion.div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                CRM Enterprise V3
              </CardTitle>
              <CardDescription className="text-base text-gray-600">
                Hesabınıza giriş yapın ve işinizi yönetmeye başlayın
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Company Selection */}
                <motion.div variants={itemVariants} className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary-600" />
                    Şirket
                  </label>
                  <Select
                    value={companyId}
                    onValueChange={setCompanyId}
                    disabled={companiesLoading || loading}
                  >
                    <SelectTrigger className="w-full h-11 border-2 focus:border-primary-500 transition-colors hover:border-primary-400">
                      <SelectValue placeholder="Şirket seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-primary-600" />
                            <span className="font-medium">{company.name}</span>
                            <span className="text-xs text-gray-500">({company.city})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {companiesError && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-red-600 mt-1 flex items-center gap-1"
                    >
                      <Shield className="h-3 w-3" />
                      Şirketler yüklenemedi. Lütfen sayfayı yenileyin.
                    </motion.p>
                  )}
                  {companiesLoading && (
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Şirketler yükleniyor...
                    </p>
                  )}
                </motion.div>

                {/* Email */}
                <motion.div variants={itemVariants} className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary-600" />
                    E-posta
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                      type="email"
                      placeholder="ornek@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="pl-10 h-11 border-2 focus:border-primary-500 transition-colors hover:border-primary-400"
                      required
                    />
                  </div>
                </motion.div>

                {/* Password */}
                <motion.div variants={itemVariants} className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-primary-600" />
                    Şifre
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="pl-10 pr-10 h-11 border-2 focus:border-primary-500 transition-colors hover:border-primary-400"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                      disabled={loading}
                      aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </motion.div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600 flex items-center gap-2"
                  >
                    <Shield className="h-4 w-4" />
                    {error}
                  </motion.div>
                )}

                {/* Submit Button */}
                <motion.div variants={itemVariants}>
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    disabled={loading || !companyId}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Giriş yapılıyor...
                      </>
                    ) : (
                      <>
                        Giriş Yap
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </motion.div>

                {/* Demo Info */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={mounted ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ delay: 0.5 }}
                  className="rounded-lg bg-gradient-to-r from-blue-50 to-primary-50 border border-blue-200 p-4 text-xs text-blue-700"
                >
                  <div className="flex items-start gap-2">
                    <Zap className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold mb-1">Demo Girişi:</p>
                      <p>
                        Seed&apos;den oluşturulan kullanıcılar için şifre:{' '}
                        <code className="font-mono bg-white px-2 py-1 rounded border">demo123</code>
                      </p>
                    </div>
                  </div>
                </motion.div>
              </form>
            </CardContent>
          </Card>

          {/* Features Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.6 }}
            className="mt-6 grid grid-cols-3 gap-4 text-center"
          >
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              className="p-4 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
            >
              <Zap className="h-6 w-6 text-primary-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-700">Hızlı</p>
              <p className="text-xs text-gray-500 mt-1">&lt;300ms</p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              className="p-4 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
            >
              <Shield className="h-6 w-6 text-primary-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-700">Güvenli</p>
              <p className="text-xs text-gray-500 mt-1">Enterprise</p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              className="p-4 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
            >
              <TrendingUp className="h-6 w-6 text-primary-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-700">Güvenilir</p>
              <p className="text-xs text-gray-500 mt-1">%99.9</p>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}

// Memoize - re-render'ları önle
export default memo(LoginPage)
