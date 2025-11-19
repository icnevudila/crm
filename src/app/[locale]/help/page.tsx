'use client'

import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  BookOpen,
  FileText,
  Video,
  MessageCircle,
  Mail,
  HelpCircle,
  ArrowRight,
  Zap,
  Link as LinkIcon,
  Calendar,
  Phone,
  Keyboard,
  Lightbulb,
  Rocket,
  AlertTriangle,
  CheckCircle2,
  PlayCircle,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function HelpPage() {
  const t = useTranslations('help')

  const helpSections = [
    {
      id: 'getting-started',
      title: 'Başlangıç Rehberi',
      description: 'Sisteme ilk kez giriş yapan kullanıcılar için temel bilgiler',
      icon: Rocket,
      color: 'from-indigo-500 to-purple-500',
      items: [
        {
          title: 'Hızlı Başlangıç (5 Dakikada Başlayın)',
          link: '/help/getting-started/quick-start',
        },
        {
          title: 'İlk Giriş ve Hesap Kurulumu',
          link: '/help/getting-started/login',
        },
        {
          title: 'Dashboard Kullanımı',
          link: '/help/getting-started/dashboard',
        },
        {
          title: 'Temel Navigasyon',
          link: '/help/getting-started/navigation',
        },
      ],
    },
    {
      id: 'modules',
      title: 'Modül Kılavuzları',
      description: 'Her modülün detaylı kullanım kılavuzu',
      icon: FileText,
      color: 'from-purple-500 to-pink-500',
      items: [
        {
          title: 'Müşteri Yönetimi',
          link: '/help/modules/customers',
        },
        {
          title: 'Satış Süreci (Fırsatlar, Teklifler)',
          link: '/help/modules/sales',
        },
        {
          title: 'Fatura ve Finans',
          link: '/help/modules/invoices',
        },
        {
          title: 'Görevler ve Takvim',
          link: '/help/modules/tasks',
        },
        {
          title: 'Raporlar',
          link: '/help/modules/reports',
        },
      ],
    },
    {
      id: 'integrations',
      title: 'Entegrasyonlar',
      description: 'Video toplantılar, e-posta, SMS ve WhatsApp entegrasyonları',
      icon: LinkIcon,
      color: 'from-blue-500 to-cyan-500',
      items: [
        {
          title: 'Video Toplantı Entegrasyonları (Zoom, Google Meet, Teams)',
          link: '/help/integrations/video-meetings',
        },
        {
          title: 'E-posta Entegrasyonu (Resend)',
          link: '/help/integrations/email',
        },
        {
          title: 'SMS ve WhatsApp Entegrasyonu (Twilio)',
          link: '/help/integrations/messaging',
        },
        {
          title: 'Google Calendar Entegrasyonu',
          link: '/help/integrations/calendar',
        },
      ],
    },
    {
      id: 'automations',
      title: 'Otomasyonlar ve İş Akışları',
      description: 'Otomatik işlemler ve sistem otomasyonları hakkında bilgiler',
      icon: Zap,
      color: 'from-yellow-500 to-orange-500',
      items: [
        {
          title: 'Otomatik İş Akışları (Deal, Quote, Invoice)',
          link: '/help/automations/workflows',
        },
        {
          title: 'Otomatik Bildirimler ve Yönlendirmeler',
          link: '/help/automations/notifications',
        },
        {
          title: 'Modül İlişkileri ve Otomatik Bağlantılar',
          link: '/help/automations/relationships',
        },
      ],
    },
    {
      id: 'tips',
      title: 'İpuçları ve Püf Noktaları',
      description: 'Sistemi daha verimli kullanmak için ipuçları ve best practices',
      icon: Lightbulb,
      color: 'from-yellow-500 to-amber-500',
      items: [
        {
          title: 'Hızlı İşlemler ve Klavye Kısayolları',
          link: '/help/tips/shortcuts',
        },
        {
          title: 'Sık Yapılan Hatalar ve Çözümleri',
          link: '/help/tips/common-mistakes',
        },
        {
          title: 'Verimlilik İpuçları',
          link: '/help/tips/productivity',
        },
        {
          title: 'Best Practices (En İyi Uygulamalar)',
          link: '/help/tips/best-practices',
        },
      ],
    },
    {
      id: 'examples',
      title: 'Örnek Senaryolar',
      description: 'Gerçek hayat senaryoları ve adım adım çözümler',
      icon: PlayCircle,
      color: 'from-green-500 to-emerald-500',
      items: [
        {
          title: 'Yeni Müşteri → Satış Süreci',
          link: '/help/examples/customer-to-sale',
        },
        {
          title: 'Teklif Hazırlama ve Gönderme',
          link: '/help/examples/quote-process',
        },
        {
          title: 'Toplantı Planlama ve Takip',
          link: '/help/examples/meeting-workflow',
        },
        {
          title: 'Fatura ve Ödeme Takibi',
          link: '/help/examples/invoice-tracking',
        },
      ],
    },
    {
      id: 'troubleshooting',
      title: 'Sorun Giderme',
      description: 'Yaygın sorunlar ve çözümleri',
      icon: AlertTriangle,
      color: 'from-pink-500 to-red-500',
      items: [
        {
          title: 'Giriş Sorunları',
          link: '/help/troubleshooting/login',
        },
        {
          title: 'Veri Görüntüleme Sorunları',
          link: '/help/troubleshooting/data',
        },
        {
          title: 'Performans Sorunları',
          link: '/help/troubleshooting/performance',
        },
        {
          title: 'Entegrasyon Sorunları',
          link: '/help/troubleshooting/integrations',
        },
        {
          title: 'Sık Karşılaşılan Hatalar',
          link: '/help/troubleshooting/common-errors',
        },
      ],
    },
  ]

  const quickLinks = [
    {
      title: 'Hızlı Başlangıç',
      description: '5 dakikada sistemi öğrenin',
      icon: Rocket,
      link: '/help/getting-started/quick-start',
      external: false,
    },
    {
      title: 'Kullanım Kılavuzu',
      description: 'Detaylı sistem kullanım kılavuzu',
      icon: BookOpen,
      link: '/kullanim-kilavuzu',
      external: false,
    },
    {
      title: 'Sık Sorulan Sorular',
      description: 'SSS sayfasına git',
      icon: HelpCircle,
      link: '/faq',
      external: false,
    },
    {
      title: 'Entegrasyon Kurulum Rehberi',
      description: 'Zoom, Google Meet, Teams ve diğer entegrasyonlar',
      icon: LinkIcon,
      link: '/help/integrations/setup',
      external: false,
    },
    {
      title: 'Klavye Kısayolları',
      description: 'Hızlı işlemler için kısayollar',
      icon: Keyboard,
      link: '/help/tips/shortcuts',
      external: false,
    },
    {
      title: 'Video Eğitimler',
      description: 'Yakında...',
      icon: Video,
      link: '#',
      external: false,
      disabled: true,
    },
  ]

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg"
          >
            <BookOpen className="w-8 h-8" />
          </motion.div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Yardım Merkezi
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            CRM Enterprise V3 kullanımı hakkında ihtiyacınız olan tüm bilgilere buradan ulaşabilirsiniz.
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickLinks.map((link, index) => (
            <motion.div
              key={link.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <Card
                className={`p-6 border-2 hover:border-indigo-300 transition-all cursor-pointer ${
                  link.disabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                    <link.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800 mb-1">
                      {link.title}
                    </h3>
                    <p className="text-sm text-slate-600">{link.description}</p>
                    {!link.disabled && (
                      <Link
                        href={link.link}
                        className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 mt-2 font-medium"
                      >
                        Devam et <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Help Sections */}
        <div className="space-y-6">
          {helpSections.map((section, sectionIndex) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + sectionIndex * 0.1 }}
            >
              <Card className="p-6 border-2 border-slate-200 shadow-sm">
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className={`p-3 rounded-lg bg-gradient-to-br ${section.color} text-white shadow-md`}
                  >
                    <section.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-slate-800 mb-1">
                      {section.title}
                    </h2>
                    <p className="text-slate-600 text-sm">
                      {section.description}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 pl-16">
                  {section.items.map((item, itemIndex) => (
                    <Link
                      key={itemIndex}
                      href={item.link}
                      className="block p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-slate-700 group-hover:text-indigo-600 font-medium">
                          {item.title}
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Contact Support */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center pt-8"
        >
          <Card className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200">
            <div className="flex items-center justify-center gap-3 mb-4">
              <MessageCircle className="w-6 h-6 text-indigo-600" />
              <h3 className="text-lg font-semibold text-slate-800">
                Hala Yardıma İhtiyacınız mı Var?
              </h3>
            </div>
            <p className="text-slate-600 mb-4">
              Destek ekibimizle iletişime geçmek için aşağıdaki kanalları kullanabilirsiniz.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button
                variant="outline"
                className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                asChild
              >
                <Link href="/faq">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  SSS
                </Link>
              </Button>
              <Button
                variant="outline"
                className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                asChild
              >
                <a href="mailto:support@yourdomain.com">
                  <Mail className="w-4 h-4 mr-2" />
                  E-posta Gönder
                </a>
              </Button>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}
