'use client'

import { useState } from 'react'
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
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, ChevronRight, ChevronLeft, Users, Briefcase, FileText } from 'lucide-react'
import CustomerForm from '@/components/customers/CustomerForm'
import DealForm from '@/components/deals/DealForm'
import QuoteForm from '@/components/quotes/QuoteForm'
import { toast } from '@/lib/toast'
import { mutate } from 'swr'

interface SalesProcessWizardProps {
  open: boolean
  onClose: () => void
}

const STEPS = [
  { id: 1, title: 'Müşteri Oluştur', icon: Users, description: 'Yeni müşteri bilgilerini girin' },
  { id: 2, title: 'Fırsat Oluştur', icon: Briefcase, description: 'Satış fırsatı bilgilerini girin' },
  { id: 3, title: 'Teklif Hazırla', icon: FileText, description: 'Teklif detaylarını girin' },
]

export default function SalesProcessWizard({ open, onClose }: SalesProcessWizardProps) {
  const locale = useLocale()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  
  // Her adımda oluşturulan kayıtları sakla
  const [createdCustomer, setCreatedCustomer] = useState<any>(null)
  const [createdDeal, setCreatedDeal] = useState<any>(null)
  const [createdQuote, setCreatedQuote] = useState<any>(null)

  const progress = (currentStep / STEPS.length) * 100
  const currentStepData = STEPS.find((s) => s.id === currentStep) || STEPS[0]

  const handleClose = () => {
    // Reset state
    setCurrentStep(1)
    setCompletedSteps(new Set())
    setCreatedCustomer(null)
    setCreatedDeal(null)
    setCreatedQuote(null)
    onClose()
  }

  const handleCustomerSuccess = (customer: any) => {
    setCreatedCustomer(customer)
    const newCompleted = new Set(completedSteps)
    newCompleted.add(1)
    setCompletedSteps(newCompleted)
    setCurrentStep(2)
    toast.success('Müşteri oluşturuldu', { description: 'Fırsat oluşturma adımına geçiliyor...' })
    
    // Cache'i güncelle
    mutate('/api/customers')
  }

  const handleDealSuccess = (deal: any) => {
    setCreatedDeal(deal)
    const newCompleted = new Set(completedSteps)
    newCompleted.add(2)
    setCompletedSteps(newCompleted)
    setCurrentStep(3)
    toast.success('Fırsat oluşturuldu', { description: 'Teklif hazırlama adımına geçiliyor...' })
    
    // Cache'i güncelle
    mutate('/api/deals')
  }

  const handleQuoteSuccess = (quote: any) => {
    setCreatedQuote(quote)
    const newCompleted = new Set(completedSteps)
    newCompleted.add(3)
    setCompletedSteps(newCompleted)
    
    // Cache'i güncelle
    mutate('/api/quotes')
    
    toast.success(
      'Satış süreci tamamlandı!',
      `Müşteri "${createdCustomer?.name}", fırsat "${createdDeal?.title}" ve teklif "${quote.title}" başarıyla oluşturuldu.`,
      {
        action: {
          label: 'Teklifi Görüntüle',
          onClick: () => {
            handleClose()
            router.push(`/${locale}/quotes/${quote.id}`)
          },
        },
      }
    )
    
    // 2 saniye sonra modal'ı kapat
    setTimeout(() => {
      handleClose()
    }, 2000)
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
      toast.info('Adım atlandı', { description: 'Bu adımı daha sonra tamamlayabilirsiniz.' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Yeni Satış Süreci</DialogTitle>
          <DialogDescription>
            Müşteri → Fırsat → Teklif adımlarını tamamlayarak satış sürecini başlatın
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Adım {currentStep} / {STEPS.length}</span>
            <span>%{Math.round(progress)}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Steps Indicator */}
        <div className="flex items-center justify-between mb-6">
          {STEPS.map((step, index) => {
            const Icon = step.icon
            const isCompleted = completedSteps.has(step.id)
            const isCurrent = currentStep === step.id
            const isUpcoming = currentStep < step.id

            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all
                      ${
                        isCompleted
                          ? 'bg-green-500 border-green-500 text-white'
                          : isCurrent
                          ? 'bg-indigo-500 border-indigo-500 text-white'
                          : isUpcoming
                          ? 'bg-gray-100 border-gray-300 text-gray-400'
                          : 'bg-gray-100 border-gray-300 text-gray-400'
                      }
                    `}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : (
                      <Icon className="h-6 w-6" />
                    )}
                  </div>
                  <p
                    className={`
                      mt-2 text-xs font-medium text-center
                      ${isCurrent ? 'text-indigo-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}
                    `}
                  >
                    {step.title}
                  </p>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`
                      flex-1 h-0.5 mx-2 transition-all
                      ${completedSteps.has(step.id) ? 'bg-green-500' : 'bg-gray-200'}
                    `}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Form Content */}
        <div className="min-h-[400px]">
          {currentStep === 1 && (
            <CustomerForm
              key="customer"
              customer={undefined}
              open={true}
              onClose={() => {}} // Wizard içinde kapatma butonu yok
              onSuccess={handleCustomerSuccess}
              skipDialog={true}
            />
          )}

          {currentStep === 2 && (
            <DealForm
              key="deal"
              deal={undefined}
              open={true}
              onClose={() => {}}
              onSuccess={handleDealSuccess}
              customerId={createdCustomer?.id}
              customerCompanyId={createdCustomer?.customerCompanyId}
              customerCompanyName={createdCustomer?.CustomerCompany?.name}
              skipDialog={true}
            />
          )}

          {currentStep === 3 && (
            <QuoteForm
              key="quote"
              quote={undefined}
              open={true}
              onClose={() => {}}
              onSuccess={handleQuoteSuccess}
              dealId={createdDeal?.id}
              customerId={createdCustomer?.id}
              customerCompanyId={createdCustomer?.customerCompanyId}
              customerCompanyName={createdCustomer?.CustomerCompany?.name}
              skipDialog={true}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button variant="outline" onClick={handlePrevious}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Geri
              </Button>
            )}
            {currentStep < STEPS.length && (
              <Button variant="ghost" onClick={handleSkip}>
                Bu Adımı Atla
              </Button>
            )}
          </div>
          <Button variant="outline" onClick={handleClose}>
            İptal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

