'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Edit, Trash2, MoreVertical, Home } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface DetailPageLayoutProps {
  // Hero Section
  title: string
  subtitle?: string
  icon?: ReactNode
  imageUrl?: string
  badge?: ReactNode
  backUrl?: string // Optional - modal için gerekli değil
  onClose?: () => void // Modal için kapatma callback'i
  isModal?: boolean // Modal modunda mı?
  
  // Breadcrumb
  breadcrumbs?: BreadcrumbItem[]
  
  // Quick Actions
  onEdit?: () => void
  onDelete?: () => void
  quickActions?: ReactNode
  moreActions?: {
    label: string
    icon?: ReactNode
    onClick: () => void
    variant?: 'default' | 'destructive'
  }[]
  
  // Tabs
  tabs?: {
    id: string
    label: string
    icon?: ReactNode
    content: ReactNode
  }[]
  
  // Content (if no tabs)
  children?: ReactNode
  
  // Overview Cards (Hero altında)
  overviewCards?: ReactNode
  overviewCollapsible?: boolean
  overviewDefaultOpen?: boolean
  
  // Related Records (Hızlı erişim)
  relatedRecords?: ReactNode
  relatedCollapsible?: boolean
  relatedDefaultOpen?: boolean
}

/**
 * QuickBooks tarzı standart detay sayfası layout'u
 * Tüm modül detay sayfalarında kullanılacak tutarlı şema
 */
export default function DetailPageLayout({
  title,
  subtitle,
  icon,
  imageUrl,
  badge,
  backUrl,
  onClose,
  isModal = false,
  breadcrumbs,
  onEdit,
  onDelete,
  quickActions,
  moreActions,
  tabs,
  children,
  overviewCards,
  overviewCollapsible = false,
  overviewDefaultOpen = true,
  relatedRecords,
  relatedCollapsible = false,
  relatedDefaultOpen = true,
}: DetailPageLayoutProps) {
  const router = useRouter()
  const locale = useLocale()

  // Modal modunda backUrl yerine onClose kullan
  const handleBack = () => {
    if (isModal && onClose) {
      onClose()
    } else if (backUrl) {
      router.push(backUrl)
    }
  }

  return (
    <div className="space-y-2.5">
      {/* Breadcrumb Navigation - Monday.com tarzı - Modal'da gizle */}
      {!isModal && breadcrumbs && breadcrumbs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1.5 text-xs text-gray-500 px-1"
        >
          <Link href={`/${locale}/dashboard`} className="hover:text-indigo-600 transition-colors">
            <Home className="h-3.5 w-3.5" />
          </Link>
          {breadcrumbs.map((crumb, index) => (
            <span key={index} className="flex items-center gap-1.5">
              <span className="text-gray-300">/</span>
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="hover:text-indigo-600 transition-colors truncate max-w-[120px]"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-gray-700 font-medium truncate max-w-[120px]">{crumb.label}</span>
              )}
            </span>
          ))}
        </motion.div>
      )}

      {/* Hero Section - Ultra Kompakt Monday.com tarzı */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-lg bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-100 p-2.5 shadow-sm"
      >
        {/* Arka plan pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgb(99, 102, 241) 1px, transparent 0)`,
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <div className="relative">
          {/* Single Row - Ultra Kompakt Monday.com tarzı */}
          <div className="flex items-center justify-between gap-2">
            {/* Left: Back + Icon + Title */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {(backUrl || (isModal && onClose)) && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBack}
                    className="h-8 w-8 bg-white/80 hover:bg-white shadow-sm"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </Button>
                </motion.div>
              )}

              {/* Icon/Image - Ultra küçük */}
              {imageUrl ? (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="relative w-10 h-10 rounded-md bg-white border border-indigo-200 shadow-sm flex items-center justify-center overflow-hidden flex-shrink-0"
                >
                  <img
                    src={imageUrl}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              ) : icon ? (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="w-10 h-10 rounded-md bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-sm flex-shrink-0"
                >
                  <div className="scale-70">{icon}</div>
                </motion.div>
              ) : null}

              {/* Title & Subtitle - Ultra Kompakt */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent truncate">
                    {title}
                  </h1>
                  {badge}
                </div>
                {subtitle && (
                  <p className="text-xs text-gray-600 truncate mt-0.5">{subtitle}</p>
                )}
              </div>
            </div>

            {/* Right: Quick Actions - Ultra Kompakt ve Belirgin */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {onEdit && (
                <Button 
                  variant="outline" 
                  onClick={onEdit} 
                  size="sm" 
                  className="h-8 text-xs px-2 bg-white hover:bg-indigo-50 border-indigo-200 hover:border-indigo-300"
                >
                  <Edit className="h-3.5 w-3.5 mr-1" />
                  Düzenle
                </Button>
              )}
              {quickActions}
              {(onDelete || moreActions) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 bg-white hover:bg-gray-50"
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {moreActions?.map((action, index) => (
                      <DropdownMenuItem
                        key={index}
                        onClick={action.onClick}
                        className={cn(
                          action.variant === 'destructive' && 'text-red-600 focus:text-red-600'
                        )}
                      >
                        {action.icon && <span className="mr-2">{action.icon}</span>}
                        {action.label}
                      </DropdownMenuItem>
                    ))}
                    {onDelete && (
                      <DropdownMenuItem
                        onClick={onDelete}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Sil
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Overview Cards - Hero altında (opsiyonel) - Organize Grup - Collapsible */}
      {overviewCards && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {overviewCollapsible ? (
            <Accordion
              type="single"
              collapsible
              defaultValue={overviewDefaultOpen ? 'overview' : undefined}
              className="space-y-1.5"
            >
              <AccordionItem value="overview" className="border-0">
                <AccordionTrigger className="py-1 px-1 hover:no-underline [&>svg]:h-3 [&>svg]:w-3">
                  <div className="flex items-center gap-2 w-full">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Özet</span>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-1.5 pb-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {overviewCards}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 px-1">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Özet</span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {overviewCards}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Related Records - Hızlı erişim (opsiyonel) - Organize Grup - Collapsible */}
      {relatedRecords && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          {relatedCollapsible ? (
            <Accordion
              type="single"
              collapsible
              defaultValue={relatedDefaultOpen ? 'related' : undefined}
              className="space-y-1.5"
            >
              <AccordionItem value="related" className="border-0">
                <AccordionTrigger className="py-1 px-1 hover:no-underline [&>svg]:h-3 [&>svg]:w-3">
                  <div className="flex items-center gap-2 w-full">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">İlişkili Kayıtlar</span>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-1.5 pb-0">
                  {relatedRecords}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 px-1">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">İlişkili Kayıtlar</span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
              </div>
              {relatedRecords}
            </div>
          )}
        </motion.div>
      )}

      {/* Main Content - Tabs veya Direct Content - Organize */}
      {tabs && tabs.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-2 px-1">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Detaylar</span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
          </div>
          <Tabs defaultValue={tabs[0]?.id} className="space-y-2">
            <TabsList className="grid w-full grid-cols-auto gap-1 bg-white border border-gray-200 rounded-md p-0.5 shadow-sm h-auto">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded transition-all"
                >
                  {tab.icon && <span className="scale-75">{tab.icon}</span>}
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {tabs.map((tab) => (
              <TabsContent key={tab.id} value={tab.id} className="mt-2">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {tab.content}
                </motion.div>
              </TabsContent>
            ))}
          </Tabs>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-2 px-1">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Detaylar</span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
          </div>
          {children}
        </motion.div>
      )}
    </div>
  )
}

