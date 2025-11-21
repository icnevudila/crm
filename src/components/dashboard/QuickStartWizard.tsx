'use client'

import { useState, useEffect } from 'react'
import { useLocale, useTranslations } from 'next-intl'
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
import { Checkbox } from '@/components/ui/checkbox'
import {
  ChevronRight,
  ChevronLeft,
  Sparkles,
  CheckCircle2,
  X,
  Zap,
  Users,
  FileText,
  TrendingUp,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface WizardStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  action?: {
    label: string
    href: string
  }
  tips?: string[]
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'welcome',
    title: 'Hoş Geldiniz! 🎉',
    description: 'CRM sisteminize hoş geldiniz. Hızlı başlangıç için birkaç adım atalım.',
    icon: <Sparkles className="h-8 w-8 text-indigo-600" />,
    tips: [
      'Dashboard\'dan tüm sisteminizi tek bakışta görebilirsiniz',
      'KPI kartlarına tıklayarak ilgili modüllere hızlıca geçebilirsiniz',
      'Akıllı öneriler size bir sonraki adımı gösterir',
    ],
  },
  {
    id: 'customer',
    title: 'İlk Müşterinizi Ekleyin 👤',
    description: 'Sisteminizi kullanmaya başlamak için ilk müşterinizi ekleyin.',
    icon: <Users className="h-8 w-8 text-indigo-600" />,
    action: {
      label: 'Müşteri Ekle',
      href: '/customers',
    },
    tips: [
      'Müşteri ekledikten sonra fırsat oluşturabilirsiniz',
      'Müşteri bilgilerini daha sonra güncelleyebilirsiniz',
      'Müşteri firmaları da ekleyebilirsiniz',
    ],
  },
  {
    id: 'deal',
    title: 'İlk Fırsatınızı Oluşturun 💼',
    description: 'Müşteriniz için bir fırsat oluşturun ve satış sürecinizi başlatın.',
    icon: <TrendingUp className="h-8 w-8 text-indigo-600" />,
    action: {
      label: 'Fırsat Oluştur',
      href: '/deals',
    },
    tips: [
      'Fırsat aşamalarını takip edebilirsiniz',
      'Fırsat kazanıldığında otomatik olarak sözleşme oluşturulur',
      'Kanban tahtasında fırsatlarınızı görselleştirebilirsiniz',
    ],
  },
  {
    id: 'quote',
    title: 'Teklif Hazırlayın 📝',
    description: 'Fırsatınız için bir teklif hazırlayın ve müşterinize gönderin.',
    icon: <FileText className="h-8 w-8 text-indigo-600" />,
    action: {
      label: 'Teklif Oluştur',
      href: '/quotes',
    },
    tips: [
      'Teklif kabul edildiğinde otomatik olarak fatura oluşturulur',
      'Teklifleri PDF olarak indirebilirsiniz',
      'Teklif durumlarını takip edebilirsiniz',
    ],
  },
  {
    id: 'complete',
    title: 'Harika! 🎊',
    description: 'Temel kurulum tamamlandı. Artık sisteminizi kullanmaya başlayabilirsiniz.',
    icon: <CheckCircle2 className="h-8 w-8 text-green-600" />,
    tips: [
      'Dashboard\'dan tüm aktivitelerinizi takip edebilirsiniz',
      'Akıllı öneriler size yardımcı olacak',
      'Herhangi bir sorunuz olursa yardım menüsünden destek alabilirsiniz',
    ],
  },
]

interface QuickStartWizardProps {
  open: boolean
  onClose: () => void
}

export default function QuickStartWizard({ open, onClose }: QuickStartWizardProps) {
  const locale = useLocale()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  const currentStepData = WIZARD_STEPS[currentStep]
  const progress = ((currentStep + 1) / WIZARD_STEPS.length) * 100

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
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
    localStorage.setItem('quick-start-wizard-completed', 'true')
    onClose()
  }

  const handleAction = () => {
    if (currentStepData.action) {
      router.push(`/${locale}${currentStepData.action.href}`)
      // Wizard'ı kapatmadan devam et
    }
  }

  const handleStepComplete = (stepIndex: number) => {
    const newCompleted = new Set(completedSteps)
    if (newCompleted.has(stepIndex)) {
      newCompleted.delete(stepIndex)
    } else {
      newCompleted.add(stepIndex)
    }
    setCompletedSteps(newCompleted)
  }

  // localStorage'dan tamamlanma durumunu kontrol et
  useEffect(() => {
    const completed = localStorage.getItem('quick-start-wizard-completed')
    if (completed === 'true' && open) {
      // Eğer tamamlanmışsa ve tekrar açılmışsa, baştan başlat
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
                Hızlı Başlangıç Rehberi
              </DialogTitle>
              <DialogDescription>
                CRM sisteminizi kullanmaya başlamak için adım adım ilerleyin
              </DialogDescription>
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
              Adım {currentStep + 1} / {WIZARD_STEPS.length}
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
                <div className="flex items-start justify-between">
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
                  {currentStep < WIZARD_STEPS.length - 1 && (
                    <Checkbox
                      checked={completedSteps.has(currentStep)}
                      onCheckedChange={() => handleStepComplete(currentStep)}
                      className="h-5 w-5"
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Tips */}
                {currentStepData.tips && currentStepData.tips.length > 0 && (
                  <div className="space-y-2 rounded-lg bg-indigo-50 p-4 border border-indigo-100">
                    <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700">
                      <Zap className="h-4 w-4" />
                      İpuçları:
                    </div>
                    <ul className="space-y-2 pl-6">
                      {currentStepData.tips.map((tip, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-indigo-900">
                          <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-indigo-500" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Button */}
                {currentStepData.action && (
                  <Button
                    onClick={handleAction}
                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all"
                  >
                    {currentStepData.action.label}
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
            {WIZARD_STEPS.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={cn(
                  'h-2 rounded-full transition-all',
                  currentStep === index
                    ? 'w-8 bg-indigo-600'
                    : completedSteps.has(index)
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
              currentStep === WIZARD_STEPS.length - 1
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-indigo-600 hover:bg-indigo-700'
            )}
          >
            {currentStep === WIZARD_STEPS.length - 1 ? (
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


