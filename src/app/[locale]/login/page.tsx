'use client'

import React, { useState, useEffect, memo, useCallback } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import {
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Premium Animated Title - Premium Sky Blue & Deep Space Blue
function AnimatedTitle({ text }: { text: string }) {
  return (
    <span
      className="bg-clip-text text-transparent"
      style={{
        backgroundImage: 'linear-gradient(to right, #00AEEF, #1890FF, #1B263B)',
        animation: 'color-shift 4s ease-in-out infinite',
        backgroundSize: '200% 100%',
        willChange: 'background-position',
      }}
    >
      {text}
    </span>
  )
}

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
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      router.replace(`/${locale}/dashboard`)
    }
  }, [status, session, router, locale])

  useEffect(() => {
    setMounted(true)
    // Agresif prefetch - dashboard ve diğer sayfalar
    router.prefetch(`/${locale}/dashboard`)
    router.prefetch(`/${locale}/customers`)
    router.prefetch(`/${locale}/deals`)
  }, [router, locale])

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      if (result?.ok) {
        // Başarılı giriş - window.location kullan (daha hızlı)
        router.prefetch(`/${locale}/dashboard`)
        window.location.href = `/${locale}/dashboard`
      } else {
        setError(t('loginFailed'))
        setLoading(false)
      }
    } catch (err) {
      setError(t('loginError'))
      setLoading(false)
    }
  }, [email, password, router, locale, t])

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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4 relative overflow-hidden">
      {/* Premium Animated Background - Premium Güven Veren Mavi Tema */}
      <div 
        className="absolute inset-0 overflow-hidden pointer-events-none" 
        style={{ 
          willChange: 'transform',
          contain: 'layout style paint',
          isolation: 'isolate',
        }}
      >
        {/* Premium Animated gradient blobs - Sky Blue & Deep Space Blue */}
        <div 
          className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          style={{
            background: 'linear-gradient(135deg, #00AEEF, #1890FF)',
            animation: 'blob-premium 20s ease-in-out infinite',
            transform: 'translate3d(0, 0, 0)',
            willChange: 'transform',
            contain: 'layout style paint',
          }}
        />
        <div 
          className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          style={{
            background: 'linear-gradient(135deg, #1890FF, #1B263B)',
            animation: 'blob-premium 25s ease-in-out infinite 2s',
            transform: 'translate3d(0, 0, 0)',
            willChange: 'transform',
            contain: 'layout style paint',
          }}
        />
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full mix-blend-multiply filter blur-3xl opacity-15"
          style={{
            background: 'linear-gradient(135deg, #1B263B, #00AEEF)',
            animation: 'blob-premium 30s ease-in-out infinite 4s',
            transform: 'translate3d(0, 0, 0)',
            willChange: 'transform',
            contain: 'layout style paint',
          }}
        />
        {/* Floating particles effect - Premium Sky Blue & Deep Space Blue */}
        <div 
          className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full opacity-30 blur-sm"
          style={{
            background: '#00AEEF',
            animation: 'blob-premium 15s ease-in-out infinite 1s',
            transform: 'translate3d(0, 0, 0)',
            willChange: 'transform',
          }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-3 h-3 rounded-full opacity-25 blur-sm"
          style={{
            background: '#1890FF',
            animation: 'blob-premium 18s ease-in-out infinite 3s',
            transform: 'translate3d(0, 0, 0)',
            willChange: 'transform',
          }}
        />
        <div 
          className="absolute top-1/2 right-1/3 w-1.5 h-1.5 rounded-full opacity-30 blur-sm"
          style={{
            background: '#1B263B',
            animation: 'blob-premium 22s ease-in-out infinite 5s',
            transform: 'translate3d(0, 0, 0)',
            willChange: 'transform',
          }}
        />
        {/* Subtle grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            willChange: 'auto',
          }}
        />
      </div>

      <motion.div
        initial="hidden"
        animate={mounted ? 'visible' : 'hidden'}
        variants={containerVariants}
        className="relative z-10 w-full max-w-md"
      >
        <motion.div variants={itemVariants}>
          {/* Premium Glassmorphism Card with Glow */}
          <div className="relative">
            {/* Glow effect - Premium Sky Blue & Deep Space Blue */}
            <div 
              className="absolute -inset-1 rounded-2xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"
              style={{
                background: 'linear-gradient(to right, #00AEEF, #1890FF, #1B263B)',
                transform: 'translate3d(0, 0, 0)',
                willChange: 'opacity',
                isolation: 'isolate',
              }}
            />
            <Card 
              className="relative border-0 shadow-2xl bg-white/90 backdrop-blur-xl hover:bg-white/95 transition-all duration-500 overflow-hidden"
              style={{
                contain: 'layout style paint',
                isolation: 'isolate',
              }}
            >
              {/* Shine effect on hover - CSS only */}
              <div 
                className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                style={{
                  background: 'linear-gradient(110deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)',
                  transform: 'translate3d(-100%, 0, 0)',
                  transition: 'transform 1s ease-in-out, opacity 0.7s ease-in-out',
                  willChange: 'transform, opacity',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translate3d(100%, 0, 0)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translate3d(-100%, 0, 0)'
                }}
              />
              
              <CardHeader className="space-y-4 text-center pb-6 relative z-10">
                {/* Premium Icon with animated gradient */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={mounted ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
                  transition={{ type: 'spring', duration: 0.6, delay: 0.2, bounce: 0.4 }}
                  className="relative inline-flex items-center justify-center w-20 h-20 mx-auto mb-4 rounded-2xl overflow-hidden group"
                  style={{
                    transform: 'translate3d(0, 0, 0)',
                    willChange: 'transform',
                  }}
                >
                  {/* Animated gradient background - Premium Sky Blue */}
                  <div 
                    className="absolute inset-0 bg-[length:200%_100%]"
                    style={{
                      background: 'linear-gradient(to right, #00AEEF, #1890FF, #096DD9)',
                      animation: 'gradient-shift 5s ease-in-out infinite',
                      transform: 'translate3d(0, 0, 0)',
                      willChange: 'background-position',
                    }}
                  />
                  {/* Glow effect - Premium Sky Blue */}
                  <div className="absolute inset-0 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'linear-gradient(to right, rgba(0, 174, 239, 0.5), rgba(24, 144, 255, 0.5), rgba(9, 109, 217, 0.5))' }} />
                  <Sparkles className="relative z-10 h-10 w-10 text-white drop-shadow-lg" />
                </motion.div>
                <CardTitle className="text-4xl font-extrabold tracking-tight">
                  <AnimatedTitle text="CRM Enterprise V3" />
                </CardTitle>
                <CardDescription className="text-base text-gray-600 font-medium">
                  {t('description')}
                </CardDescription>
              </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email - Premium Input */}
                <motion.div variants={itemVariants} className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary-600" />
                    {t('email')}
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600 transition-colors z-10" />
                    <Input
                      type="email"
                      placeholder={t('emailPlaceholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="pl-10 h-12 border-2 border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-300 hover:border-primary-400 bg-white/80 backdrop-blur-sm"
                      required
                    />
                    {/* Focus glow effect */}
                    <div 
                      className="absolute inset-0 rounded-md bg-gradient-to-r from-primary-500/0 via-primary-500/10 to-primary-500/0 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"
                      style={{ transform: 'translate3d(0, 0, 0)' }}
                    />
                  </div>
                </motion.div>

                {/* Password - Premium Input */}
                <motion.div variants={itemVariants} className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-primary-600" />
                    {t('password')}
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600 transition-colors z-10" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="pl-10 pr-10 h-12 border-2 border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-300 hover:border-primary-400 bg-white/80 backdrop-blur-sm"
                      required
                    />
                    {/* Focus glow effect */}
                    <div 
                      className="absolute inset-0 rounded-md bg-gradient-to-r from-primary-500/0 via-primary-500/10 to-primary-500/0 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"
                      style={{ transform: 'translate3d(0, 0, 0)' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-600 focus:outline-none transition-colors z-10"
                      disabled={loading}
                      aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                      style={{ transform: 'translate3d(0, -50%, 0)' }}
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

                {/* Submit Button - Premium with Shine */}
                <motion.div variants={itemVariants}>
                  <div className="relative group">
                    {/* Glow effect */}
                    <div 
                      className="absolute -inset-1 bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-600 rounded-lg blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500"
                      style={{
                        transform: 'translate3d(0, 0, 0)',
                        willChange: 'opacity',
                      }}
                    />
                    <Button
                      type="submit"
                      className="relative w-full h-14 bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-600 text-white font-bold text-base shadow-2xl hover:shadow-primary-500/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 overflow-hidden"
                      disabled={loading}
                      style={{
                        transform: 'translate3d(0, 0, 0)',
                        willChange: 'transform',
                      }}
                    >
                      {/* Animated gradient overlay */}
                      <div 
                        className="absolute inset-0 bg-gradient-to-r from-primary-600 via-secondary-600 via-accent-600 to-primary-600 bg-[length:200%_100%] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{
                          animation: 'gradient-shift 3s ease-in-out infinite',
                          transform: 'translate3d(0, 0, 0)',
                          willChange: 'background-position',
                        }}
                      />
                      {/* Shine effect */}
                      <div 
                        className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        style={{
                          transform: 'translate3d(-100%, 0, 0)',
                          willChange: 'transform',
                        }}
                      />
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {loading ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            {t('loggingIn')}
                          </>
                        ) : (
                          <>
                            {t('login')}
                            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </span>
                    </Button>
                  </div>
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
                      <p className="font-semibold mb-1">{t('demoLogin')}:</p>
                      <p>
                        {t('demoPassword')}:{' '}
                        <code className="font-mono bg-white px-2 py-1 rounded border">demo123</code>
                      </p>
                    </div>
                  </div>
                </motion.div>
              </form>
            </CardContent>
          </Card>
          </div>

          {/* Features Preview - Premium Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.6 }}
            className="mt-8 grid grid-cols-3 gap-4 text-center"
          >
            <motion.div
              whileHover={{ scale: 1.08, y: -4 }}
              className="relative p-5 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden group"
              style={{
                transform: 'translate3d(0, 0, 0)',
                willChange: 'transform',
                contain: 'layout style paint',
              }}
            >
              {/* Gradient background on hover */}
              <div 
                className="absolute inset-0 bg-gradient-to-br from-primary-500/0 to-secondary-500/0 group-hover:from-primary-500/10 group-hover:to-secondary-500/10 transition-all duration-500"
                style={{ transform: 'translate3d(0, 0, 0)' }}
              />
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="relative z-10"
                style={{ transform: 'translate3d(0, 0, 0)' }}
              >
                <Zap className="h-7 w-7 text-primary-600 mx-auto mb-3 drop-shadow-lg" />
                <p className="text-sm font-bold text-gray-800">{t('features.fast')}</p>
                <p className="text-xs text-gray-600 mt-1 font-medium">&lt;300ms</p>
              </motion.div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.08, y: -4 }}
              className="relative p-5 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden group"
              style={{
                transform: 'translate3d(0, 0, 0)',
                willChange: 'transform',
                contain: 'layout style paint',
              }}
            >
              <div 
                className="absolute inset-0 bg-gradient-to-br from-secondary-500/0 to-accent-500/0 group-hover:from-secondary-500/10 group-hover:to-accent-500/10 transition-all duration-500"
                style={{ transform: 'translate3d(0, 0, 0)' }}
              />
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="relative z-10"
                style={{ transform: 'translate3d(0, 0, 0)' }}
              >
                <Shield className="h-7 w-7 text-secondary-600 mx-auto mb-3 drop-shadow-lg" />
                <p className="text-sm font-bold text-gray-800">{t('features.secure')}</p>
                <p className="text-xs text-gray-600 mt-1 font-medium">Enterprise</p>
              </motion.div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.08, y: -4 }}
              className="relative p-5 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden group"
              style={{
                transform: 'translate3d(0, 0, 0)',
                willChange: 'transform',
                contain: 'layout style paint',
              }}
            >
              <div 
                className="absolute inset-0 bg-gradient-to-br from-accent-500/0 to-primary-500/0 group-hover:from-accent-500/10 group-hover:to-primary-500/10 transition-all duration-500"
                style={{ transform: 'translate3d(0, 0, 0)' }}
              />
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="relative z-10"
                style={{ transform: 'translate3d(0, 0, 0)' }}
              >
                <TrendingUp className="h-7 w-7 text-accent-600 mx-auto mb-3 drop-shadow-lg" />
                <p className="text-sm font-bold text-gray-800">{t('features.reliable')}</p>
                <p className="text-xs text-gray-600 mt-1 font-medium">%99.9</p>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}

// Memoize - re-render'ları önle
export default memo(LoginPage)


