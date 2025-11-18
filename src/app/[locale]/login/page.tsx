'use client'

import React, { useState, useEffect, memo, useCallback } from 'react'
import { useSession } from '@/hooks/useSession'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Mail,
  Lock,
  Loader2,
  Eye,
  EyeOff,
  Shield,
  ArrowRight,
  CheckCircle2,
  Zap,
  Users,
  BarChart3,
  Globe,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function LoginPage() {
  const locale = useLocale()
  const t = useTranslations('login')
  const router = useRouter()
  const { data: session, status } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  // Zaten login olmuş kullanıcıları dashboard'a yönlendir
  // ÖNEMLİ: Sadece loading tamamlandıktan SONRA ve gerçekten authenticated ise yönlendir
  useEffect(() => {
    // Loading durumunda yönlendirme yapma (cache'den eski session okunabilir)
    if (status === 'loading') {
      return
    }
    
    // Sadece gerçekten authenticated ve user varsa yönlendir
    if (status === 'authenticated' && session?.user?.id) {
      router.replace(`/${locale}/dashboard`)
    }
  }, [status, session, router, locale])

  useEffect(() => {
    setMounted(true)
    router.prefetch(`/${locale}/dashboard`)
    router.prefetch(`/${locale}/customers`)
    router.prefetch(`/${locale}/deals`)
  }, [router, locale])

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const trimmedEmail = email.trim()

      if (!trimmedEmail || !password) {
          setError(t('emailRequired') || 'E-posta ve şifre gereklidir')
        setLoading(false)
        return
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
          credentials: 'include',
        body: JSON.stringify({
          email: trimmedEmail,
          password: password,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
          setError(data.error || t('invalidCredentials') || 'E-posta veya şifre hatalı')
        setLoading(false)
        return
      }

        router.prefetch(`/${locale}/dashboard`)
      window.location.href = `/${locale}/dashboard`
    } catch (err: any) {
      console.error('Login error:', err)
      if (err?.message?.includes('fetch') || err?.message?.includes('network')) {
          setError(t('networkError') || 'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.')
      } else {
          setError(t('loginError') || 'Giriş yapılırken bir hata oluştu')
      }
      setLoading(false)
    }
    },
    [email, password, router, locale, t]
  )

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-950 via-slate-950 to-purple-950">
      {/* Left Side - Branding & Features (Zoho Style Ultra Clean) */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={mounted ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
        transition={{ duration: 0.8 }}
        className="hidden md:flex md:w-1/2 flex-col justify-between p-8 md:p-16 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 relative overflow-hidden"
      >
        {/* Ultra Subtle Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-20 right-20 w-[600px] h-[600px] bg-white/5 rounded-full blur-[150px]"
            animate={{
              scale: [1, 1.1, 1],
              x: [0, 30, 0],
              y: [0, 30, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute bottom-20 left-20 w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px]"
            animate={{
              scale: [1, 1.15, 1],
              x: [0, -30, 0],
              y: [0, -30, 0],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>

        <div className="relative z-10">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
            transition={{ delay: 0.3 }}
            className="mb-12"
          >
            <motion.div
              className="flex items-center gap-3"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/20"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <BarChart3 className="h-6 w-6 text-white" />
              </motion.div>
              <span className="text-xl font-semibold text-white">CRM Enterprise</span>
            </motion.div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={mounted ? 'visible' : 'hidden'}
            className="space-y-8"
          >
            <motion.div variants={itemVariants}>
              <h1 className="text-5xl font-bold text-white mb-6 leading-tight tracking-tight">
                İşinizi Yönetmenin
                <br />
                <span className="text-blue-100">En İyi Yolu</span>
              </h1>
              <p className="text-lg text-white/90 leading-relaxed font-light">
                Müşterilerinizi, satışlarınızı ve tüm iş süreçlerinizi tek bir platformda yönetin.
              </p>
            </motion.div>

            {/* Features */}
            <motion.div variants={itemVariants} className="space-y-4 pt-8">
              {[
                { icon: Zap, text: 'Hızlı ve kolay kurulum' },
                { icon: Shield, text: 'Güvenli ve güvenilir' },
                { icon: Users, text: 'Ekip çalışması için tasarlandı' },
                { icon: Globe, text: 'Her yerden erişim' },
              ].map((feature, index) => {
                const Icon = feature.icon
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={mounted ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    whileHover={{ x: 4 }}
                    className="flex items-center gap-4 cursor-default"
                  >
                    <motion.div
                      className="w-9 h-9 bg-white/10 backdrop-blur-sm rounded-md flex items-center justify-center border border-white/20"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Icon className="h-4 w-4 text-white" />
                    </motion.div>
                    <span className="text-white/90 text-base font-medium">{feature.text}</span>
                  </motion.div>
                )
              })}
            </motion.div>
          </motion.div>

        </div>
      </motion.div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                CRM Enterprise V3
              </span>
            </div>
          </div>

          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={mounted ? { scale: 1, opacity: 1 } : { scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            whileHover={{ scale: 1.01 }}
          >
            <Card className="border border-slate-200 shadow-lg bg-white/95 backdrop-blur overflow-hidden">
              <CardHeader className="space-y-1 pb-8">
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
                  transition={{ delay: 0.4 }}
                >
                  <CardTitle className="text-2xl font-bold text-gray-900">{t('welcome') || 'Hoş Geldiniz'}</CardTitle>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
                  transition={{ delay: 0.5 }}
                >
                  <CardDescription className="text-sm text-gray-500">
                    {t('description') || 'Hesabınıza giriş yapın ve işinizi yönetmeye başlayın'}
                  </CardDescription>
                </motion.div>
        </CardHeader>
        <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Email */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={mounted ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                    transition={{ delay: 0.6 }}
                    className="space-y-2"
                  >
                    <motion.label
                      className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                      whileHover={{ x: 2 }}
                      transition={{ duration: 0.2 }}
                    >
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      >
                        <Mail className="h-4 w-4 text-blue-600" />
                      </motion.div>
                      {t('email') || 'E-posta Adresi'}
                    </motion.label>
              <div className="relative">
                <Input
                  type="email"
                        placeholder={t('emailPlaceholder') || 'ornek@email.com'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                        className="h-11 rounded-md border border-gray-300 bg-white text-gray-900 transition-all duration-200 hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:shadow-sm"
                  required
                />
              </div>
                  </motion.div>

                  {/* Password */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={mounted ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                    transition={{ delay: 0.7 }}
                    className="space-y-2"
                  >
                    <motion.label
                      className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                      whileHover={{ x: 2 }}
                      transition={{ duration: 0.2 }}
                    >
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, delay: 0.5 }}
                      >
                        <Lock className="h-4 w-4 text-blue-600" />
                      </motion.div>
                      {t('password') || 'Şifre'}
                    </motion.label>
              <div className="relative">
                <Input
                        type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                        className="h-11 rounded-md border border-gray-300 bg-white text-gray-900 pr-10 transition-all duration-200 hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:shadow-sm"
                  required
                />
                      <motion.button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={loading}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </motion.button>
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
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ delay: 0.8 }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
            <Button
              type="submit"
              disabled={loading}
                        className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                        <span className="flex items-center justify-center gap-2">
              {loading ? (
                <>
                              <Loader2 className="h-5 w-5 animate-spin" />
                              {t('loggingIn') || 'Giriş yapılıyor...'}
                </>
              ) : (
                            <>
                              {t('login') || 'Giriş Yap'}
                              <motion.div
                                animate={{ x: [0, 4, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
                              >
                                <ArrowRight className="h-5 w-5" />
                              </motion.div>
                            </>
              )}
                        </span>
            </Button>
                    </motion.div>
                  </motion.div>

                  {/* Demo Info */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ delay: 0.9 }}
                    whileHover={{ scale: 1.01 }}
                    className="rounded-lg bg-blue-50 border border-blue-200 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
                      >
                        <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      </motion.div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-blue-900 mb-1">{t('demoLogin') || 'Demo Hesabı'}</p>
                        <p className="text-xs text-blue-700">
                          {t('demoPasswordLabel') || 'Test için demo hesabı kullanabilirsiniz. Şifre:'} <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-blue-200">demo123</code>
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Footer Links */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={mounted ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ delay: 1 }}
                    className="pt-4 border-t border-gray-200"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <motion.div whileHover={{ x: 2 }} transition={{ duration: 0.2 }}>
                        <Link
                          href={`/${locale}/landing`}
                          className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                        >
                          {t('backToHome') || 'Ana Sayfaya Dön'}
                        </Link>
                      </motion.div>
                      <motion.div whileHover={{ x: -2 }} transition={{ duration: 0.2 }}>
                        <Link
                          href="#"
                          className="text-gray-600 hover:text-gray-900 transition-colors"
                        >
                          {t('forgotPassword') || 'Şifremi Unuttum'}
                        </Link>
                      </motion.div>
            </div>
                  </motion.div>
          </form>
        </CardContent>
      </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default memo(LoginPage)
