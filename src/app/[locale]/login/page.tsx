'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Mail, Lock, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const locale = useLocale()
  const t = useTranslations('login')
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const trimmedEmail = email.trim()

      if (!trimmedEmail || !password) {
        setError(t('emailRequired'))
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
        setError(data.error || t('invalidCredentials'))
        setLoading(false)
        return
      }

      // Başarılı login - dashboard'a yönlendir
      window.location.href = `/${locale}/dashboard`
    } catch (err: any) {
      console.error('Login error:', err)
      if (err?.message?.includes('fetch') || err?.message?.includes('network')) {
        setError(t('networkError'))
      } else {
        setError(t('loginError'))
      }
      setLoading(false)
    }
  }, [email, password, locale])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-950 to-purple-950 p-4">
      <Card className="w-full max-w-md border-slate-200/80 bg-white/95 backdrop-blur">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">CRM Enterprise V3</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('email')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('password')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('loggingIn')}
                </>
              ) : (
                t('login')
              )}
            </Button>

            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700">
              <p className="font-semibold mb-1">{t('demoLogin')}:</p>
              <p>{t('demoPasswordLabel')} <code className="font-mono bg-white px-2 py-1 rounded border">demo123</code></p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
