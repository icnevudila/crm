'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import { Flame, Calendar, TrendingUp, Award, Info, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useData } from '@/hooks/useData'
import SkeletonList from '@/components/skeletons/SkeletonList'
import Link from 'next/link'

interface UserStreak {
  dailyStreak: number
  weeklyStreak: number
  monthlyStreak: number
  lastActivityDate: string
}

export default function UserStreak() {
  const router = useRouter()
  const locale = useLocale()
  const [showInfo, setShowInfo] = useState(false)
  
  const { data: streak, isLoading } = useData<UserStreak>(
    '/api/streaks',
    {
      dedupingInterval: 600000, // 10 dakika cache - refresh'i azalt
      revalidateOnFocus: false,
      revalidateIfStale: false, // Cache'deki veri sıcaksa kullan
      refreshInterval: 0, // Otomatik refresh yok
    }
  )

  const streakData = streak || {
    dailyStreak: 0,
    weeklyStreak: 0,
    monthlyStreak: 0,
    lastActivityDate: new Date().toISOString().split('T')[0],
  }

  const isStreakActive = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    return streakData.lastActivityDate === today || streakData.lastActivityDate === yesterday
  }, [streakData.lastActivityDate])

  const streakEmojis = useMemo(() => {
    const count = Math.min(streakData.dailyStreak, 10)
    return '🔥'.repeat(count)
  }, [streakData.dailyStreak])

  if (isLoading) {
    return (
      <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50/50 to-red-50/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-lg">Satış Streak'iniz</CardTitle>
          </div>
          <CardDescription>Aktivite serinizi takip edin</CardDescription>
        </CardHeader>
        <CardContent>
          <SkeletonList count={3} />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`border-2 ${isStreakActive ? 'border-orange-300 bg-gradient-to-br from-orange-50/50 to-red-50/50' : 'border-gray-200 bg-gradient-to-br from-gray-50/50 to-slate-50/50'} shadow-lg`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className={`h-5 w-5 ${isStreakActive ? 'text-orange-600' : 'text-gray-400'}`} />
            <CardTitle className="text-lg">Satış Streak'iniz</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowInfo(true)}
              title="Streak hakkında bilgi"
            >
              <Info className="h-4 w-4 text-gray-400" />
            </Button>
          </div>
          {isStreakActive && (
            <Badge className="bg-orange-100 text-orange-800 border-orange-300">
              Aktif
            </Badge>
          )}
        </div>
        <CardDescription>
          {isStreakActive && streakData.dailyStreak > 0
            ? `${streakData.dailyStreak} günlük seri devam ediyor!`
            : streakData.dailyStreak === 0
            ? 'Streak\'inizi başlatmak için bugün aktivite yapın'
            : 'Son aktivitenizden bu yana streak kırıldı. Yeni bir seri başlatın'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Günlük Streak */}
          <Link href={`/${locale}/deals`} prefetch={true}>
            <div className="flex items-center justify-between p-4 rounded-lg bg-white border-2 border-gray-200 hover:border-orange-300 hover:shadow-md transition-all cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${isStreakActive ? 'bg-orange-100' : 'bg-gray-100'} group-hover:scale-110 transition-transform`}>
                  <Calendar className={`h-5 w-5 ${isStreakActive ? 'text-orange-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <p className="font-semibold text-sm">Günlük Streak</p>
                  <p className="text-xs text-gray-600">Ardışık günlerde aktivite yapma</p>
                </div>
              </div>
              <div className="text-right flex items-center gap-2">
                <div>
                  <p className={`text-2xl font-bold ${isStreakActive ? 'text-orange-600' : 'text-gray-400'}`}>
                    {streakData.dailyStreak}
                  </p>
                  <p className="text-xs text-gray-500">gün</p>
                </div>
                <ExternalLink className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </Link>

          {/* Streak Göstergesi */}
          {isStreakActive && streakData.dailyStreak > 0 && (
            <div className="text-center py-2">
              <p className="text-2xl mb-2">{streakEmojis}</p>
              <p className="text-sm text-gray-600">
                {streakData.dailyStreak} günlük seri devam ediyor!
              </p>
            </div>
          )}

          {/* Haftalık ve Aylık Streak */}
          <div className="grid grid-cols-2 gap-3">
            <Link href={`/${locale}/deals`} prefetch={true}>
              <div className="p-3 rounded-lg bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <p className="text-xs font-semibold text-gray-700">Haftalık</p>
                </div>
                <p className="text-xl font-bold text-blue-600">{streakData.weeklyStreak}</p>
                <p className="text-xs text-gray-500">hafta</p>
              </div>
            </Link>
            <Link href={`/${locale}/deals`} prefetch={true}>
              <div className="p-3 rounded-lg bg-white border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer group">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-4 w-4 text-purple-600" />
                  <p className="text-xs font-semibold text-gray-700">Aylık</p>
                </div>
                <p className="text-xl font-bold text-purple-600">{streakData.monthlyStreak}</p>
                <p className="text-xs text-gray-500">ay</p>
              </div>
            </Link>
          </div>

          {/* Son Aktivite */}
          <div className="text-center pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Son Aktivite:{' '}
              <span className="font-medium">
                {new Date(streakData.lastActivityDate).toLocaleDateString('tr-TR')}
              </span>
            </p>
            {!isStreakActive && streakData.dailyStreak > 0 && (
              <p className="text-xs text-orange-600 mt-1 font-medium">
                Streak kırıldı. Yeni bir seri başlatın
              </p>
            )}
          </div>
        </div>
      </CardContent>

      {/* Streak Bilgi Modal */}
      <Dialog open={showInfo} onOpenChange={setShowInfo}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-orange-100">
                <Flame className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">Satış Streak Nedir?</DialogTitle>
                <DialogDescription className="text-base mt-1">
                  Aktivite serinizi takip edin ve motivasyonunuzu artırın
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Streak Açıklaması */}
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-blue-900 mb-2">Streak Nasıl Çalışır?</p>
                  <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside">
                    <li><strong>Günlük Streak:</strong> Ardışık günlerde aktivite yaptığınızda artar. Deal kazandığınızda, müşteri oluşturduğunuzda veya görev tamamladığınızda güncellenir.</li>
                    <li><strong>Haftalık Streak:</strong> Ardışık haftalarda aktivite yaptığınızda artar.</li>
                    <li><strong>Aylık Streak:</strong> Ardışık aylarda aktivite yaptığınızda artar.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Aktivite Türleri */}
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <p className="font-semibold text-sm text-green-900 mb-2">Streak'i Artıran Aktiviteler:</p>
              <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
                <li>Deal kazanma (stage = WON)</li>
                <li>Yeni müşteri oluşturma</li>
                <li>Görev tamamlama (status = COMPLETED)</li>
                <li>Teklif kabul edilmesi (status = ACCEPTED)</li>
              </ul>
            </div>

            {/* Yönlendirme */}
            <div className="flex flex-col gap-2">
              <Link href={`/${locale}/deals`} prefetch={true}>
                <Button className="w-full" variant="default">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Deal'leri Gör ve Streak'i Artır
                </Button>
              </Link>
              <Link href={`/${locale}/customers`} prefetch={true}>
                <Button className="w-full" variant="outline">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Müşteri Oluştur
                </Button>
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

