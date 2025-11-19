'use client'

import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Users,
  TrendingUp,
  FileText,
  Receipt,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useData } from '@/hooks/useData'

interface ContextualWizardProps {
  trigger: 'first-customer' | 'first-deal' | 'first-quote' | 'first-invoice'
  open: boolean
  onClose: () => void
}

const WIZARD_CONFIGS = {
  'first-customer': {
    title: 'İlk Müşterinizi Ekleyin 👤',
    description: 'Sisteminizi kullanmaya başlamak için ilk müşterinizi ekleyin.',
    steps: [
      {
        title: 'Müşteri Bilgileri',
        description: 'Müşteri adı, email ve telefon numarası gibi temel bilgileri girin.',
        icon: <Users className="h-6 w-6 text-indigo-600" />,
      },
      {
        title: 'Müşteri Tipi',
        description: 'Müşteri tipini seçin (Aktif, Pasif, Potansiyel).',
        icon: <CheckCircle2 className="h-6 w-6 text-indigo-600" />,
      },
      {
        title: 'Kaydet',
        description: 'Müşteri bilgilerini kaydedin ve fırsat oluşturmaya başlayın.',
        icon: <ArrowRight className="h-6 w-6 text-indigo-600" />,
      },
    ],
    actionUrl: '/customers',
    actionLabel: 'Müşteri Ekle',
  },
  'first-deal': {
    title: 'İlk Fırsatınızı Oluşturun 💼',
    description: 'Müşteriniz için bir fırsat oluşturun ve satış sürecinizi başlatın.',
    steps: [
      {
        title: 'Müşteri Seçimi',
        description: 'Fırsat için müşteri seçin.',
        icon: <Users className="h-6 w-6 text-indigo-600" />,
      },
      {
        title: 'Fırsat Detayları',
        description: 'Fırsat başlığı, değeri ve aşamasını belirleyin.',
        icon: <TrendingUp className="h-6 w-6 text-indigo-600" />,
      },
      {
        title: 'Kaydet',
        description: 'Fırsatı kaydedin ve teklif oluşturmaya başlayın.',
        icon: <ArrowRight className="h-6 w-6 text-indigo-600" />,
      },
    ],
    actionUrl: '/deals',
    actionLabel: 'Fırsat Oluştur',
  },
  'first-quote': {
    title: 'İlk Teklifinizi Hazırlayın 📝',
    description: 'Fırsatınız için bir teklif hazırlayın ve müşterinize gönderin.',
    steps: [
      {
        title: 'Fırsat Seçimi',
        description: 'Teklif için fırsat seçin.',
        icon: <TrendingUp className="h-6 w-6 text-indigo-600" />,
      },
      {
        title: 'Ürün Ekleme',
        description: 'Teklif için ürün ekleyin ve fiyatlandırın.',
        icon: <FileText className="h-6 w-6 text-indigo-600" />,
      },
      {
        title: 'Kaydet',
        description: 'Teklifi kaydedin ve müşterinize gönderin.',
        icon: <ArrowRight className="h-6 w-6 text-indigo-600" />,
      },
    ],
    actionUrl: '/quotes',
    actionLabel: 'Teklif Oluştur',
  },
  'first-invoice': {
    title: 'İlk Faturanızı Oluşturun 🧾',
    description: 'Teklif kabul edildiğinde otomatik olarak fatura oluşturulur.',
    steps: [
      {
        title: 'Teklif Seçimi',
        description: 'Fatura için kabul edilmiş teklif seçin.',
        icon: <FileText className="h-6 w-6 text-indigo-600" />,
      },
      {
        title: 'Fatura Detayları',
        description: 'Fatura bilgilerini kontrol edin ve gerekirse düzenleyin.',
        icon: <Receipt className="h-6 w-6 text-indigo-600" />,
      },
      {
        title: 'Kaydet',
        description: 'Faturayı kaydedin ve müşterinize gönderin.',
        icon: <ArrowRight className="h-6 w-6 text-indigo-600" />,
      },
    ],
    actionUrl: '/invoices',
    actionLabel: 'Fatura Oluştur',
  },
}

export default function ContextualWizard({
  trigger,
  open,
  onClose,
}: ContextualWizardProps) {
  const locale = useLocale()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)

  const config = WIZARD_CONFIGS[trigger]
  const progress = ((currentStep + 1) / config.steps.length) * 100
  const currentStepData = config.steps[currentStep]

  const handleNext = () => {
    if (currentStep < config.steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    localStorage.setItem(`contextual-wizard-${trigger}-completed`, 'true')
    onClose()
  }

  const handleAction = () => {
    router.push(`/${locale}${config.actionUrl}`)
  }

  // Modal kapandığında adımı sıfırla
  useEffect(() => {
    if (!open) {
      setCurrentStep(0)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2 text-2xl">
                <Sparkles className="h-6 w-6 text-indigo-600" />
                {config.title}
              </DialogTitle>
              <DialogDescription>{config.description}</DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">İlerleme</span>
            <span className="font-semibold text-indigo-600">
              Adım {currentStep + 1} / {config.steps.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-2 border-indigo-100">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
                    {currentStepData.icon}
                  </div>
                  <div>
                    <CardTitle className="text-xl">{currentStepData.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {currentStepData.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Action Button */}
                {currentStep === config.steps.length - 1 && (
                  <Button
                    onClick={handleAction}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all"
                  >
                    {config.actionLabel}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-4 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={cn(
              'flex items-center gap-2',
              currentStep === 0 && 'opacity-50 cursor-not-allowed'
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            Önceki
          </Button>

          {/* Step Indicators */}
          <div className="flex items-center gap-2">
            {config.steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={cn(
                  'h-2 rounded-full transition-all',
                  currentStep === index
                    ? 'w-8 bg-indigo-600'
                    : currentStep > index
                      ? 'w-2 bg-green-500'
                      : 'w-2 bg-gray-300 hover:bg-gray-400'
                )}
                aria-label={`Adım ${index + 1}`}
              />
            ))}
          </div>

          <Button
            onClick={handleNext}
            className={cn(
              'flex items-center gap-2',
              currentStep === config.steps.length - 1
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-indigo-600 hover:bg-indigo-700'
            )}
          >
            {currentStep === config.steps.length - 1 ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Tamamla
              </>
            ) : (
              <>
                Sonraki
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}


