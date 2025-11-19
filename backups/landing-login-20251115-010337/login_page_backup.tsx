'use client'

import React, { useState, useEffect, memo, useCallback } from 'react'
import { useSession } from '@/hooks/useSession'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Mail,
  Lock,
  Loader2,
  Eye,
  EyeOff,
  Sparkles,
  Shield,
  TrendingUp,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import GradientText from '@/components/GradientText'

function LoginPage() {
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
      router.replace('/tr/dashboard')
    }
  }, [status, session, router])

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
      const trimmedEmail = email.trim()

      if (!trimmedEmail || !password) {
        setError('E-posta ve şifre gereklidir')
        setLoading(false)
        return
      }

      // Supabase Auth ile login - direkt API endpoint'e POST yap
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Cookie'ler için gerekli
        body: JSON.stringify({
          email: trimmedEmail,
          password: password,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.error || 'E-posta veya şifre hatalı')
        setLoading(false)
        return
      }

      // Başarılı login - dashboard'a yönlendir
      router.prefetch('/tr/dashboard')
      window.location.href = '/tr/dashboard'
    } catch (err: any) {
      console.error('Login error:', err)
      if (err?.message?.includes('fetch') || err?.message?.includes('network')) {
        setError('Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.')
      } else {
        setError('Giriş yapılırken bir hata oluştu')
      }
      setLoading(false)
    }
  }, [email, password, router])

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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-4 relative overflow-hidden">
      {/* Premium Animated Background - Premium Güven Veren Mavi Tema */}
      <div 
        className="absolute inset-0 overflow-hidden pointer-events-none" 
        style={{ 
          willChange: 'transform',
          contain: 'layout style paint',
          isolation: 'isolate',
        }}
      >
        {/* Premium Animated gradient blobs - Premium Indigo & Orchid */}
        <div 
          className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            animation: 'blob-premium 20s ease-in-out infinite',
            transform: 'translate3d(0, 0, 0)',
            willChange: 'transform',
            contain: 'layout style paint',
          }}
        />
        <div 
          className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          style={{
            background: 'linear-gradient(135deg, #8b5cf6, #312e81)',
            animation: 'blob-premium 25s ease-in-out infinite 2s',
            transform: 'translate3d(0, 0, 0)',
            willChange: 'transform',
            contain: 'layout style paint',
          }}
        />
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full mix-blend-multiply filter blur-3xl opacity-15"
          style={{
            background: 'linear-gradient(135deg, #312e81, #6366f1)',
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
            background: '#6366f1',
            animation: 'blob-premium 15s ease-in-out infinite 1s',
            transform: 'translate3d(0, 0, 0)',
            willChange: 'transform',
          }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-3 h-3 rounded-full opacity-25 blur-sm"
          style={{
            background: '#8b5cf6',
            animation: 'blob-premium 18s ease-in-out infinite 3s',
            transform: 'translate3d(0, 0, 0)',
            willChange: 'transform',
          }}
        />
        <div 
          className="absolute top-1/2 right-1/3 w-1.5 h-1.5 rounded-full opacity-30 blur-sm"
          style={{
            background: '#312e81',
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
                background: 'linear-gradient(to right, #6366f1, #8b5cf6, #ec4899)',
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
                      background: 'linear-gradient(to right, #6366f1, #8b5cf6, #ec4899)',
                      animation: 'gradient-shift 5s ease-in-out infinite',
                      transform: 'translate3d(0, 0, 0)',
                      willChange: 'background-position',
                    }}
                  />
                  {/* Glow effect - Premium Sky Blue */}
                  <div className="absolute inset-0 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'linear-gradient(to right, rgba(99, 102, 241, 0.5), rgba(139, 92, 246, 0.5), rgba(236, 72, 153, 0.5))' }} />
                  <Sparkles className="relative z-10 h-10 w-10 text-white drop-shadow-lg" />
                </motion.div>
                <CardTitle className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  CRM Enterprise V3
                </CardTitle>
                <CardDescription className="text-base text-gray-600 font-medium">
                  Hoş Geldiniz! Hesabınıza giriş yapın ve işinizi yönetmeye başlayın
                </CardDescription>
              </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email - Premium Input */}
                <motion.div variants={itemVariants} className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Mail className="h-4 w-4 text-indigo-500" />
                    E-posta
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-indigo-500 z-10" />
                    <Input
                      type="email"
                      placeholder="ornek@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="h-12 rounded-xl border-2 border-gray-200 bg-white/80 pl-10 text-sm font-medium text-slate-700 shadow-inner transition-all duration-300 hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 backdrop-blur-sm"
                      required
                    />
                    {/* Focus glow effect - Premium Sky Blue */}
                    <div 
                      className="absolute inset-0 rounded-md opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"
                      style={{ 
                        background: 'linear-gradient(to right, rgba(99, 102, 241, 0), rgba(99, 102, 241, 0.12), rgba(99, 102, 241, 0))',
                        transform: 'translate3d(0, 0, 0)' 
                      }}
                    />
                  </div>
                </motion.div>

                {/* Password - Premium Input */}
                <motion.div variants={itemVariants} className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Lock className="h-4 w-4 text-indigo-500" />
                    Şifre
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-indigo-500 z-10" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="h-12 rounded-xl border-2 border-gray-200 bg-white/80 pl-10 pr-10 text-sm font-medium text-slate-700 shadow-inner transition-all duration-300 hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 backdrop-blur-sm"
                      required
                    />
                    {/* Focus glow effect - Premium Sky Blue */}
                    <div 
                      className="absolute inset-0 rounded-md opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"
                      style={{ 
                        background: 'linear-gradient(to right, rgba(99, 102, 241, 0), rgba(99, 102, 241, 0.12), rgba(99, 102, 241, 0))',
                        transform: 'translate3d(0, 0, 0)' 
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-indigo-500 focus:outline-none z-10"
                      disabled={loading}
                      aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
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
                    {/* Glow effect - Premium Sky Blue */}
                    <div 
                      className="absolute -inset-1 rounded-lg blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500"
                      style={{
                        background: 'linear-gradient(to right, #6366f1, #8b5cf6, #ec4899)',
                        transform: 'translate3d(0, 0, 0)',
                        willChange: 'opacity',
                      }}
                    />
                    <Button
                      type="submit"
                      className="relative w-full h-14 text-white font-bold text-base shadow-2xl hover:shadow-indigo-500/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 overflow-hidden"
                      disabled={loading}
                      style={{
                        background: 'linear-gradient(to right, #6366f1, #8b5cf6, #ec4899)',
                        transform: 'translate3d(0, 0, 0)',
                        willChange: 'transform',
                      }}
                    >
                      {/* Animated gradient overlay - Premium Sky Blue */}
                      <div 
                        className="absolute inset-0 bg-[length:200%_100%] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{
                          background: 'linear-gradient(to right, #6366f1, #8b5cf6, #ec4899, #6366f1)',
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
                            Giriş yapılıyor...
                          </>
                        ) : (
                          <>
                            Giriş Yap
                            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </span>
                    </Button>
                  </div>
                </motion.div>

                {/* Welcome Message */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                  transition={{ delay: 0.5 }}
                  className="rounded-xl bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border border-indigo-200/50 p-5 text-center"
                >
                  <div className="flex flex-col items-center gap-3">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 3
                      }}
                      className="relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full blur-xl opacity-30 animate-pulse" />
                      <Sparkles className="relative h-8 w-8 text-indigo-600" />
                    </motion.div>
                    <div>
                      <p className="text-sm font-bold text-gray-800 mb-1">
                        İşinizi Yönetmenin En İyi Yolu
                      </p>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Modern CRM çözümü ile müşterilerinizi, satışlarınızı ve iş süreçlerinizi tek bir platformda yönetin.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </form>
            </CardContent>
          </Card>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

// Memoize - re-render'ları önle
export default memo(LoginPage)

