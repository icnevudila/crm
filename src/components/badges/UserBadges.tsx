'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import { Trophy, Star, Zap, Target, Award, Crown, Sparkles, Info, ExternalLink, X } from 'lucide-react'
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

interface UserBadge {
  id: string
  badgeType: string
  earnedAt: string
  metadata?: {
    dealId?: string
    quoteId?: string
  }
}

interface BadgeConfig {
  type: string
  name: string
  description: string
  howToEarn: string
  icon: React.ReactNode
  color: string
  bgColor: string
  linkTo?: string // Yönlendirme linki
}

const BADGE_CONFIGS: BadgeConfig[] = [
  {
    type: 'FIRST_SALE',
    name: 'İlk Satış',
    description: 'İlk deal\'ini kazandın!',
    howToEarn: 'Bir Deal oluşturup stage\'ini WON (Kazanıldı) yaptığınızda bu rozeti kazanırsınız. Satış = Deal\'in WON olması demektir.',
    icon: <Trophy className="h-5 w-5" />,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 border-yellow-200',
    linkTo: '/deals?stage=WON',
  },
  {
    type: 'TEN_SALES',
    name: '10 Satış',
    description: '10 deal kazandın!',
    howToEarn: 'Toplam 10 Deal\'in stage\'ini WON yaptığınızda bu rozeti kazanırsınız.',
    icon: <Star className="h-5 w-5" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
    linkTo: '/deals?stage=WON',
  },
  {
    type: 'FIFTY_SALES',
    name: '50 Satış',
    description: '50 deal kazandın!',
    howToEarn: 'Toplam 50 Deal\'in stage\'ini WON yaptığınızda bu rozeti kazanırsınız.',
    icon: <Zap className="h-5 w-5" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200',
    linkTo: '/deals?stage=WON',
  },
  {
    type: 'HUNDRED_SALES',
    name: '100 Satış',
    description: '100 deal kazandın!',
    howToEarn: 'Toplam 100 Deal\'in stage\'ini WON yaptığınızda bu rozeti kazanırsınız.',
    icon: <Crown className="h-5 w-5" />,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 border-indigo-200',
    linkTo: '/deals?stage=WON',
  },
  {
    type: 'QUOTE_MASTER_10',
    name: 'Teklif Ustası',
    description: '10 teklif kabul edildi!',
    howToEarn: 'Toplam 10 Quote\'un status\'ünü ACCEPTED (Kabul Edildi) yaptığınızda bu rozeti kazanırsınız.',
    icon: <Target className="h-5 w-5" />,
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
    linkTo: '/quotes?status=ACCEPTED',
  },
]

export default function UserBadges() {
  const router = useRouter()
  const locale = useLocale()
  const [selectedBadge, setSelectedBadge] = useState<BadgeConfig | null>(null)
  const [selectedBadgeData, setSelectedBadgeData] = useState<UserBadge | null>(null)
  
  const { data: badges = [], isLoading } = useData<UserBadge[]>(
    '/api/badges',
    {
      dedupingInterval: 600000, // 10 dakika cache - refresh'i azalt
      revalidateOnFocus: false,
      revalidateIfStale: false, // Cache'deki veri sıcaksa kullan
      refreshInterval: 0, // Otomatik refresh yok
    }
  )

  const badgeMap = useMemo(() => {
    const map = new Map<string, UserBadge>()
    badges.forEach((badge) => {
      map.set(badge.badgeType, badge)
    })
    return map
  }, [badges])

  const earnedBadges = useMemo(() => {
    return BADGE_CONFIGS.filter((config) => badgeMap.has(config.type))
  }, [badgeMap])

  const lockedBadges = useMemo(() => {
    return BADGE_CONFIGS.filter((config) => !badgeMap.has(config.type))
  }, [badgeMap])

  if (isLoading) {
    return (
      <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-purple-50/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-indigo-600" />
            <CardTitle className="text-lg">Satış Rozetleriniz</CardTitle>
          </div>
          <CardDescription>Başarılarınızı görüntüleyin</CardDescription>
        </CardHeader>
        <CardContent>
          <SkeletonList count={3} />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-indigo-600" />
            <CardTitle className="text-lg">Satış Rozetleriniz</CardTitle>
          </div>
          <Badge variant="outline" className="bg-white">
            {earnedBadges.length}/{BADGE_CONFIGS.length}
          </Badge>
        </div>
        <CardDescription>Başarılarınızı görüntüleyin ve yeni rozetler kazanın</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Kazanılan Rozetler */}
          {earnedBadges.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Kazanılan Rozetler</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {earnedBadges.map((config, index) => {
                  const badge = badgeMap.get(config.type)!
                  return (
                    <motion.div
                      key={config.type}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <div
                        className={`p-4 rounded-lg border-2 ${config.bgColor} ${config.color} transition-all hover:shadow-md cursor-pointer group`}
                        onClick={() => {
                          setSelectedBadge(config)
                          setSelectedBadgeData(badge)
                        }}
                        title="Detayları görmek için tıklayın"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className={`p-2 rounded-full ${config.bgColor} group-hover:scale-110 transition-transform`}>
                            {config.icon}
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-sm">{config.name}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              {new Date(badge.earnedAt).toLocaleDateString('tr-TR')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Kilitli Rozetler */}
          {lockedBadges.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Kilitli Rozetler ({lockedBadges.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {lockedBadges.map((config, index) => (
                  <motion.div
                    key={config.type}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <div
                      className="p-4 rounded-lg border-2 border-gray-200 bg-gray-50 opacity-60 transition-all cursor-pointer hover:opacity-80 group"
                      onClick={() => {
                        setSelectedBadge(config)
                        setSelectedBadgeData(null)
                      }}
                      title="Nasıl kazanılır? Tıklayın"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="p-2 rounded-full bg-gray-100 text-gray-400 group-hover:scale-110 transition-transform">
                          {config.icon}
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-sm text-gray-500">{config.name}</p>
                          <p className="text-xs text-gray-400 mt-1">Kilitli</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Boş Durum */}
          {earnedBadges.length === 0 && lockedBadges.length === 0 && (
            <div className="text-center py-8">
              <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Henüz rozet kazanmadınız</p>
              <p className="text-sm text-gray-400 mt-2">İlk satışınızı yaparak başlayın!</p>
            </div>
          )}
        </div>
      </CardContent>

      {/* Badge Detay Modal */}
      <Dialog open={!!selectedBadge} onOpenChange={() => setSelectedBadge(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              {selectedBadge && (
                <div className={`p-3 rounded-full ${selectedBadge.bgColor}`}>
                  <div className={selectedBadge.color}>
                    {selectedBadge.icon}
                  </div>
                </div>
              )}
              <div>
                <DialogTitle className="text-xl">
                  {selectedBadge?.name}
                </DialogTitle>
                <DialogDescription className="text-base mt-1">
                  {selectedBadge?.description}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Nasıl Kazanılır */}
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-blue-900 mb-1">Nasıl Kazanılır?</p>
                  <p className="text-sm text-blue-800">{selectedBadge?.howToEarn}</p>
                </div>
              </div>
            </div>

            {/* Kazanma Tarihi */}
            {selectedBadgeData && (
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Kazanma Tarihi:</span>{' '}
                  {new Date(selectedBadgeData.earnedAt).toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            )}

            {/* Yönlendirme Butonları */}
            {selectedBadge && (
              <div className="flex flex-col gap-2">
                {selectedBadge.linkTo && (
                  <Link href={`/${locale}${selectedBadge.linkTo}`} prefetch={true}>
                    <Button className="w-full" variant="default">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      {selectedBadge.type.includes('QUOTE') ? 'Teklifleri Gör' : 'Satışları Gör'}
                    </Button>
                  </Link>
                )}
                {selectedBadgeData?.metadata?.dealId && (
                  <Link href={`/${locale}/deals/${selectedBadgeData.metadata.dealId}`} prefetch={true}>
                    <Button className="w-full" variant="outline">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Bu Rozeti Kazandıran Deal'i Gör
                    </Button>
                  </Link>
                )}
                {selectedBadgeData?.metadata?.quoteId && (
                  <Link href={`/${locale}/quotes/${selectedBadgeData.metadata.quoteId}`} prefetch={true}>
                    <Button className="w-full" variant="outline">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Bu Rozeti Kazandıran Teklifi Gör
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

