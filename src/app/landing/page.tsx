'use client'

/* eslint-disable react/no-unescaped-entities */

import { useState, memo, useEffect } from 'react'
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight,
  BarChart3,
  Shield,
  RefreshCw,
  Smartphone,
  Users,
  Settings,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  Send,
  Sparkles,
  Zap,
  TrendingUp,
  Globe,
  Lock,
  Rocket,
  Database,
  Cloud,
  Workflow,
  Briefcase,
  FileText,
  Package,
  Truck,
  Receipt,
  Target,
  Calendar,
  Bell,
  Search,
  Filter,
  Activity,
  Building2,
  ShoppingCart,
  Star,
  Award,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import LandingHeader from '@/components/landing/LandingHeader'
import ContactForm from '@/components/landing/ContactForm'
import GradientCard from '@/components/ui/GradientCard'
import HeroShowcase from '@/components/landing/HeroShowcase'

const faqItems = [
  {
    question: 'Nasıl çalışır?',
    answer:
      'Bulut tabanlı bir platform. Web tarayıcınızdan erişebilir, müşteri ilişkilerinizi, satış süreçlerinizi, stok yönetiminizi ve daha fazlasını tek bir platformda yönetebilirsiniz. Kurulum gerektirmez, hemen kullanmaya başlayabilirsiniz.',
  },
  {
    question: 'Verilerim güvende mi?',
    answer:
      'Evet, verileriniz endüstri standardı şifreleme ile korunur. Tüm verileriniz düzenli olarak yedeklenir ve SSL sertifikası ile güvenli bağlantı sağlanır. Ayrıca rol tabanlı erişim kontrolü ile sadece yetkili kullanıcılar verilerinize erişebilir.',
  },
  {
    question: 'Mobil uygulama var mı?',
    answer:
      'Enterprise V3 tamamen responsive tasarıma sahiptir. Mobil cihazlardan, tabletlerden ve masaüstü bilgisayarlardan sorunsuz bir şekilde erişebilirsiniz. Ayrıca PWA (Progressive Web App) desteği sayesinde uygulama gibi kullanabilirsiniz.',
  },
  {
    question: 'Fiyatlandırma nasıl?',
    answer:
      'Esnek fiyatlandırma seçeneklerimiz var. İhtiyacınıza göre özelleştirilmiş paketler sunuyoruz. Detaylı bilgi için bizimle iletişime geçebilirsiniz. Ayrıca ücretsiz deneme süremiz mevcuttur.',
  },
  {
    question: 'Destek alabilir miyim?',
    answer:
      'Evet, 7/24 teknik destek ekibimiz yanınızda. E-posta, telefon ve canlı destek kanallarımızdan bize ulaşabilirsiniz. Ayrıca kapsamlı dokümantasyon ve video eğitimlerimiz mevcuttur.',
  },
]

interface FAQItem {
  question: string
  answer: string
}

interface LandingFeatureModule {
  icon: LucideIcon
  title: string
  features: string[]
  gradient: 'primary' | 'info'
}

const CRM_FEATURES: LandingFeatureModule[] = [
  {
    icon: Users,
    title: 'Müşteri Yönetimi',
    features: [
      'Müşteri ve firma bilgileri',
      'İletişim kişileri yönetimi',
      'Toplu işlemler (Bulk operations)',
      'Import/Export (Excel, CSV)',
      'Dosya ekleme ve yönetimi',
    ],
    gradient: 'primary',
  },
  {
    icon: Briefcase,
    title: 'Fırsat Yönetimi',
    features: [
      'Satış pipeline takibi',
      'Stage yönetimi (LEAD → WON/LOST)',
      'Win probability takibi',
      'Kanban board görünümü',
      'Değer ve kazanç analizi',
    ],
    gradient: 'info',
  },
  {
    icon: FileText,
    title: 'Teklif Sistemi',
    features: [
      'Profesyonel teklif oluşturma',
      'PDF export özelliği',
      'Durum takibi (DRAFT → ACCEPTED)',
      'Revize sistemi',
      'Otomatik fatura oluşturma',
    ],
    gradient: 'primary',
  },
  {
    icon: Receipt,
    title: 'Fatura Yönetimi',
    features: [
      'Satış ve alış faturaları',
      'PDF oluşturma ve indirme',
      'Ödeme takibi',
      'Durum yönetimi',
      'Otomatik sevkiyat oluşturma',
    ],
    gradient: 'info',
  },
  {
    icon: Package,
    title: 'Stok Yönetimi',
    features: [
      'Gerçek zamanlı stok takibi',
      'Rezerve ve gelen stok yönetimi',
      'Stok hareketleri kaydı',
      'Düşük stok uyarıları',
      'Kategori ve SKU yönetimi',
    ],
    gradient: 'primary',
  },
  {
    icon: Truck,
    title: 'Sevkiyat Takibi',
    features: [
      'Sevkiyat oluşturma ve takibi',
      'Durum yönetimi',
      'Onay sistemi',
      'Otomatik stok düşürme',
      'Tracking numarası yönetimi',
    ],
    gradient: 'info',
  },
  {
    icon: BarChart3,
    title: 'Raporlama ve Analitik',
    features: [
      'Gerçek zamanlı dashboard',
      'Satış performans raporları',
      'Müşteri aktivite analizleri',
      'Stok ve ürün raporları',
      'Excel, PDF, CSV export',
    ],
    gradient: 'primary',
  },
  {
    icon: Target,
    title: 'Görev Yönetimi',
    features: [
      'Görev oluşturma ve atama',
      'Durum ve öncelik takibi',
      'Hatırlatıcı sistemi',
      'Müşteri ve fırsat ilişkilendirme',
      'Tamamlanma takibi',
    ],
    gradient: 'info',
  },
  {
    icon: Calendar,
    title: 'Toplantı Yönetimi',
    features: [
      'Toplantı planlama ve takvim entegrasyonu',
      'Hatırlatma bildirimleri',
      'Toplantı notları ve aksiyon maddeleri',
      'Müşteri ve fırsat ilişkilendirme',
      'Toplantı geçmişi takibi',
    ],
    gradient: 'primary',
  },
  {
    icon: FileText,
    title: 'Sözleşme Yönetimi',
    features: [
      'Sözleşme oluşturma ve takibi',
      'Otomatik yenileme bildirimleri',
      'Milestone ve ödeme takibi',
      'MRR/ARR hesaplama',
      'Sözleşme PDF export',
    ],
    gradient: 'info',
  },
  {
    icon: Database,
    title: 'Doküman Yönetimi',
    features: [
      'Dosya yükleme ve indirme',
      'Klasör sistemi',
      'Erişim kontrolü (VIEW, DOWNLOAD, EDIT)',
      'Müşteri, fırsat, sözleşme ilişkilendirme',
      'Süre dolumu takibi',
    ],
    gradient: 'primary',
  },
  {
    icon: Shield,
    title: 'Onay Yönetimi',
    features: [
      'Çoklu onaylayıcı sistemi',
      'Onay talepleri ve red nedenleri',
      'Öncelik seviyeleri (LOW, NORMAL, HIGH, URGENT)',
      'Teklif, sözleşme, indirim onayları',
      'Otomatik hatırlatıcılar',
    ],
    gradient: 'info',
  },
  {
    icon: Bell,
    title: 'Bildirim Sistemi',
    features: [
      'Gerçek zamanlı bildirimler',
      'E-posta ve sistem bildirimleri',
      'Okundu/okunmadı takibi',
      'Bildirim kategorileri',
      'Toplu işlemler',
    ],
    gradient: 'primary',
  },
  {
    icon: Activity,
    title: 'Aktivite Takibi',
    features: [
      'Tüm CRUD işlemlerinin otomatik kaydı',
      'Meta JSON ile detaylı loglama',
      'Kullanıcı bazlı aktivite geçmişi',
      'Modül bazlı filtreleme',
      'TR/EN otomatik çeviri',
    ],
    gradient: 'info',
  },
  {
    icon: Building2,
    title: 'Firma Yönetimi',
    features: [
      'Firma ve müşteri hiyerarşisi',
      'Durum yönetimi (POT, MUS, ALT, PAS)',
      'Firma detay sayfası ve istatistikler',
      'Hızlı işlem butonları',
      'Görüşme, teklif, görev ilişkilendirme',
    ],
    gradient: 'primary',
  },
  {
    icon: Package,
    title: 'Ürün Kataloğu',
    features: [
      'Ürün ekleme ve düzenleme',
      'Kategori yönetimi',
      'SKU ve barcode yönetimi',
      'Fiyat yönetimi',
      'Ürün görselleri yönetimi',
    ],
    gradient: 'info',
  },
  {
    icon: Search,
    title: 'Gelişmiş Arama',
    features: [
      'Global arama özelliği',
      'Filtreleme ve sıralama',
      'Sayfalama (10-20-50-100 kayıt)',
      'Toplu işlemler',
      'Export (Excel, PDF, CSV)',
    ],
    gradient: 'primary',
  },
]

function FAQAccordionItem({ faq, index }: { faq: FAQItem; index: number }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.01 }}
    >
      <GradientCard gradient="primary" className="overflow-hidden">
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-full p-6 text-left flex items-center justify-between group"
        >
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
            {faq.question}
          </h3>
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
            <ChevronDown className="h-6 w-6 text-gray-600 group-hover:text-blue-600 transition-colors duration-300" />
          </motion.div>
        </button>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6 text-gray-600 leading-relaxed">{faq.answer}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </GradientCard>
    </motion.div>
  )
}

function LandingPage() {
  const [contactOpen, setContactOpen] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const { scrollY } = useScroll()
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0])
  const heroScale = useTransform(scrollY, [0, 500], [1, 0.95])
  const heroY = useTransform(scrollY, [0, 500], [0, 100])
  const springConfig = { stiffness: 100, damping: 30, restDelta: 0.001 }
  const heroYSpring = useSpring(heroY, springConfig)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id.replace('#', ''))
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 overflow-hidden">
      <LandingHeader />

      {/* Hero Section - Premium Showcase with Gradient Background */}
      <section
        id="home"
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Background Layer */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-[#d8defa] via-[#c6d4ff] to-[#dbe7ff]"
          style={{
            x: useTransform(scrollY, [0, 1000], [0, mousePosition.x * 0.2]),
            y: useTransform(scrollY, [0, 1000], [0, mousePosition.y * 0.2]),
          }}
        >
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.05]" />
          <motion.div
            className="absolute top-16 left-16 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-indigo-400/30 via-sky-400/20 to-transparent blur-[110px]"
            animate={{
              x: [0, 55, 0],
              y: [0, -30, 0],
              scale: [1, 1.08, 1],
              opacity: [0.22, 0.32, 0.22],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute bottom-20 right-[12%] h-[480px] w-[480px] rounded-full bg-gradient-to-tr from-cyan-400/25 via-indigo-300/18 to-transparent blur-[120px]"
            animate={{
              x: [0, -65, 0],
              y: [0, 40, 0],
              scale: [1, 1.1, 1],
              opacity: [0.18, 0.3, 0.18],
            }}
            transition={{
              duration: 22,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/45 to-white/25" />
        </motion.div>

        {/* Content with Premium Animations */}
        <motion.div
          style={{
            opacity: heroOpacity,
            scale: heroScale,
            y: heroYSpring,
          }}
          className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        >
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-10 text-center lg:text-left"
            >
              <div className="mx-auto w-full max-w-xl rounded-[26px] border border-white/70 bg-white/65 p-8 shadow-[0_35px_65px_-35px_rgba(79,102,183,0.45)] backdrop-blur-xl lg:mx-0">
                {/* Premium Badge */}
                <motion.div
                  variants={itemVariants}
                  whileHover={{ scale: 1.05, y: -1 }}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-all duration-300"
                >
                  <Sparkles className="h-4 w-4 text-indigo-500" />
                  CRM & İş Süreçleri Platformu
                </motion.div>

                {/* Main Title */}
                <motion.h1
                  variants={itemVariants}
                  className="mt-6 text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl lg:text-[3.4rem] lg:leading-[1.08]"
                >
                  <span className="block text-slate-900/85">Tüm müşteri ve satış süreçleriniz</span>
                  <span className="block bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    tek platformda birleşsin
                  </span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                  variants={itemVariants}
                  className="mt-5 text-lg leading-relaxed text-slate-600 lg:text-[1.1rem]"
                >
                  Satış ekiplerinizi hızlandırın, müşteri deneyimini güçlendirin ve tüm işinizi gerçek zamanlı olarak görün. Tek bir platformla tekliften faturaya tüm yolculuğu yönetin.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                  variants={itemVariants}
                  className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start"
                >
                  <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      size="lg"
                      onClick={() => scrollToSection('#contact')}
                      className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 via-cyan-500 to-indigo-500 px-10 py-6 text-base font-semibold text-white shadow-[0_25px_60px_-20px_rgba(59,130,246,0.55)] transition-all duration-300 hover:shadow-[0_30px_70px_-20px_rgba(59,130,246,0.65)]"
                    >
                      <span className="relative z-10 flex items-center gap-3">
                        Ücretsiz Başla
                        <motion.div
                          animate={{ x: [0, 6, 0] }}
                          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                        >
                          <ArrowRight className="h-5 w-5" />
                        </motion.div>
                      </span>
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                        initial={false}
                      />
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => scrollToSection('#features')}
                      className="rounded-2xl border-2 border-slate-300/70 bg-white/90 px-10 py-6 text-base font-semibold text-slate-800 shadow-[0_18px_40px_-25px_rgba(79,102,183,0.55)] backdrop-blur-lg transition-all duration-300 hover:bg-white hover:border-slate-400/70"
                    >
                      Daha Fazla Bilgi
                    </Button>
                  </motion.div>
                </motion.div>

                {/* Supporting points */}
                <motion.div
                  variants={itemVariants}
                  className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-slate-500 lg:justify-start"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    14 gün ücretsiz deneyin
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Kurulum gerekmez
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Gerçek zamanlı raporlama
                  </div>
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8, ease: [0.215, 0.61, 0.355, 1] }}
              className="hidden lg:block"
            >
              <HeroShowcase />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mt-12 lg:hidden"
          >
            <HeroShowcase />
          </motion.div>
        </motion.div>

        {/* Premium Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="absolute bottom-12 left-1/2 z-10 hidden -translate-x-1/2 lg:block"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            whileHover={{ scale: 1.1 }}
            className="group flex h-14 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-white/50 bg-white/10 backdrop-blur"
          >
            <motion.div
              animate={{ y: [0, 16, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="relative z-10 h-4 w-1.5 rounded-full bg-white/80"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Hızlı Kazanımlar Section - Premium Highlights */}
      <section
        id="stats"
        className="relative overflow-hidden bg-gradient-to-b from-white via-blue-50/30 to-indigo-50/20 px-4 py-20 sm:px-6 lg:px-8"
      >
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mb-16 text-center"
          >
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
              Sonuç Odaklı Yaklaşım
            </h2>
            <p className="text-lg md:text-xl font-light text-gray-600 max-w-3xl mx-auto">
              Enterprise V3; satış, operasyon ve müşteri ekiplerini tek çatı altında buluşturarak ekiplerinizin daha az çaba ile daha çok değer üretmesine odaklanır.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 md:gap-8"
          >
            {[
              {
                title: 'Ekipler Arası Uyum',
                description:
                  'CRM, teklif, stok ve finans verileri tek platformda birleşir; satış ve operasyon ekipleri gerçek zamanlı çalışır.',
                icon: Users,
                gradient: 'primary' as const,
              },
              {
                title: 'Süreç Otomasyonu',
                description:
                  'Hazır otomasyon şablonları ve AI önerileri ile onay, bildirim, hatırlatıcı akışları otomatik ilerler.',
                icon: Workflow,
                gradient: 'info' as const,
              },
              {
                title: 'Güvenli İş Süreçleri',
                description:
                  'Rol bazlı yetkilendirme ve RLS ile çoklu şirket yapılarında bile veri izolasyonu ve güven sağlanır.',
                icon: Shield,
                gradient: 'primary' as const,
              },
              {
                title: 'Ölçülebilir Büyüme',
                description:
                  'KPI panoları ve gerçek zamanlı raporlar sayesinde ekip performansını anında ölçün ve optimize edin.',
                icon: TrendingUp,
                gradient: 'info' as const,
              },
            ].map((stat, index) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.05 }}
                  className="group"
                >
                  <GradientCard gradient={stat.gradient} className="relative overflow-hidden p-8">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-indigo-500/0 transition-all duration-500 group-hover:from-blue-500/10 group-hover:to-indigo-500/10" />
                    <motion.div
                      whileHover={{ rotate: 360, scale: 1.15 }}
                      transition={{ duration: 0.6 }}
                      className="inline-flex p-4 rounded-2xl bg-white/80 shadow-lg transition-all duration-300 group-hover:shadow-xl"
                    >
                      <Icon className="h-8 w-8 text-blue-600" />
                    </motion.div>
                    <div className="relative z-10">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 transition-colors duration-300 group-hover:text-blue-600">
                        {stat.title}
                      </h3>
                      <p className="text-sm md:text-base font-medium leading-relaxed text-gray-600">
                        {stat.description}
                      </p>
                    </div>
                  </GradientCard>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* Hakkımızda Section - Premium Narrative */}
      <section
        id="about"
        className="relative overflow-hidden bg-gradient-to-b from-indigo-50/30 via-white to-indigo-50/20 px-4 py-32 sm:px-6 lg:px-8"
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-16 h-[360px] w-[360px] rounded-full bg-gradient-to-br from-indigo-400/30 via-purple-400/20 to-transparent blur-[120px]" />
          <div className="absolute top-1/2 right-10 h-[260px] w-[260px] -translate-y-1/2 rounded-full bg-gradient-to-tr from-purple-400/25 via-pink-400/20 to-transparent blur-[110px]" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.04]" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-120px' }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full border border-indigo-200/70 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-indigo-500 shadow-sm backdrop-blur"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Yeni Nesil Yaklaşım
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, scale: 0.94 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-[3.2rem]"
            >
              <span className="block text-slate-900/85">İşiniz İçin</span>
              <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Neler Sunuyoruz?
              </span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-slate-600"
            >
              Operasyon, satış ve müşteri ekiplerinizi aynı vizyonda buluşturan, ölçeklenebilir ve güvenli bir CRM motoru sunuyoruz. Süreçlerinizi dijitalleştirirken premium kullanıcı deneyimi ve yüksek performans önceliğimiz.
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-16 grid gap-6 md:grid-cols-2"
          >
            {[
              {
                icon: Workflow,
                title: 'Uçtan Uca Süreçler',
                description:
                  'Tekliften faturaya kadar tüm iş akışlarını tek platformda yönetin, otomasyon senaryolarıyla manuel işleri ortadan kaldırın.',
              },
              {
                icon: Shield,
                title: 'Kurumsal Güvenlik',
                description:
                  'RLS, rol bazlı yetki ve audit log’lar ile verilerinizi güvenle saklayın; çoklu şirket mimarisinde bile izolasyonu koruyun.',
              },
              {
                icon: Sparkles,
                title: 'AI Destekli Kararlar',
                description:
                  'Akıllı içgörüler ve öneriler ile fırsatları önceliklendirin, satış dönüşümlerinizi gerçek zamanlı olarak takip edin.',
              },
              {
                icon: TrendingUp,
                title: 'Ölçülebilir Büyüme',
                description:
                  'Canlı dashboard’lar, KPI panoları ve ileri raporlama araçları ile ekip performansını anında izleyin ve optimize edin.',
              },
            ].map(({ icon: Icon, title, description }) => (
              <motion.div
                key={title}
                whileHover={{ y: -8, scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="group relative overflow-hidden rounded-3xl border border-indigo-100/70 bg-white/80 p-8 shadow-[0_20px_70px_-40px_rgba(99,102,241,0.45)] backdrop-blur transition"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-purple-500/0 to-pink-500/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="relative flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/15 via-purple-500/15 to-pink-500/20 text-indigo-500 shadow-inner">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">{description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-16 flex flex-col items-center justify-between gap-6 rounded-3xl border border-indigo-100/70 bg-white/85 p-8 shadow-[0_30px_90px_-45px_rgba(99,102,241,0.45)] backdrop-blur lg:flex-row"
          >
            <div className="text-center lg:text-left">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-500">
                Dijital dönüşüm
              </p>
              <h3 className="mt-3 text-2xl font-bold text-slate-900">
                İş süreçlerinizi premium bir deneyimle hızlandırmaya hazır mısınız?
              </h3>
              <p className="mt-3 text-sm text-slate-600">
                Demo ekibimiz, çoklu şirket mimarisi ve otomasyon senaryoları ile sizi dakikalar içinde
                canlı sisteme taşıyabilir.
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => scrollToSection('#contact')}
              className="group rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-8 py-6 text-sm font-semibold text-white shadow-[0_18px_45px_-20px_rgba(99,102,241,0.65)] transition hover:shadow-[0_22px_65px_-20px_rgba(99,102,241,0.55)]"
            >
              <span className="flex items-center gap-3">
                Demo Talep Et
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <ArrowRight className="h-5 w-5" />
                </motion.div>
              </span>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Özellikler Section - Premium Grid with Hover Effects */}
      <section
        id="features"
        className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-blue-50/40 to-indigo-50/30"
      >
        <div className="max-w-7xl mx-auto">
                          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <motion.h2
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6"
            >
              Size Ne Kazandırıyor?
            </motion.h2>
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: 120 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 mx-auto rounded-full shadow-lg mb-6"
            />
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-xl text-gray-600 max-w-2xl mx-auto font-light"
            >
              Zamanınızı kazandıran, satışlarınızı artıran ve işinizi kolaylaştıran araçlar
            </motion.p>
                        </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {[
              {
                icon: BarChart3,
                title: 'Daha İyi Kararlar Alın',
                description: 'Gerçek zamanlı verilerle iş performansınızı görün, hızlı kararlar alın ve satışlarınızı artırın',
                gradient: 'primary' as const,
                color: 'blue',
              },
              {
                icon: Shield,
                title: 'Verileriniz Güvende',
                description: 'Verileriniz endüstri standardı güvenlik ile korunur, siz rahatça işinize odaklanın',
                gradient: 'info' as const,
                color: 'indigo',
              },
              {
                icon: RefreshCw,
                title: 'Kolay Geçiş',
                description: 'Mevcut sistemlerinizle sorunsuz entegrasyon, veri kaybı olmadan hızlı geçiş yapın',
                gradient: 'primary' as const,
                color: 'cyan',
              },
              {
                icon: Smartphone,
                title: 'Her Yerden Çalışın',
                description: 'Ofis dışından da işlerinizi yönetin, seyahat ederken bile bağlı kalın',
                gradient: 'info' as const,
                color: 'blue',
              },
            ].map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  variants={itemVariants}
                  whileHover={{ y: -10, scale: 1.02, rotateY: 2 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="group"
                >
                  <GradientCard gradient={feature.gradient} className="h-full p-8 group relative overflow-hidden">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-cyan-500/0 group-hover:from-blue-500/10 group-hover:to-cyan-500/10 transition-all duration-500"
                      initial={false}
                    />
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-indigo-500/0 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                      initial={false}
                    />
                    <div className="text-center relative z-10">
                      <motion.div
                        whileHover={{ rotate: [0, -5, 5, 0], scale: 1.15 }}
                        transition={{ duration: 0.4, type: 'spring' }}
                        className="inline-flex p-5 rounded-3xl bg-gradient-to-br from-blue-100 to-indigo-100 mb-6 shadow-lg group-hover:shadow-2xl transition-all duration-300 relative overflow-hidden"
                      >
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-blue-200/50 to-indigo-200/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          initial={false}
                        />
                        <Icon className="h-10 w-10 text-blue-600 relative z-10" />
                      </motion.div>
                      <motion.h3
                        className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300"
                        whileHover={{ scale: 1.05 }}
                      >
                        {feature.title}
                      </motion.h3>
                      <p className="text-gray-600 text-sm leading-relaxed font-light">
                        {feature.description}
                      </p>
                    </div>
                  </GradientCard>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* Ürünler Section - Premium Cards */}
      <section
        id="products"
        className="py-32 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto">
                      <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <motion.h2
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6"
            >
              İhtiyacınıza Göre Modüller
            </motion.h2>
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: 120 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 mx-auto rounded-full shadow-lg mb-6"
            />
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-xl text-gray-600 max-w-2xl mx-auto font-light"
            >
              İşinize değer katan, sadece ihtiyacınız olan modülleri seçin
            </motion.p>
                      </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Enterprise V3 CRM Card */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -10, scale: 1.02 }}
            >
              <GradientCard gradient="primary" className="h-full p-10 group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-indigo-500/0 group-hover:from-blue-500/10 group-hover:to-indigo-500/10 transition-all duration-500" />
                <div className="text-center mb-8 relative z-10">
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                    className="inline-flex p-6 rounded-3xl bg-gradient-to-br from-blue-100 to-indigo-100 mb-6 shadow-xl"
                  >
                    <Users className="h-12 w-12 text-blue-600" />
                  </motion.div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                    Müşteri Yönetimi
                  </h3>
                  <p className="text-gray-600 text-lg font-light">
                    Müşteri ilişkilerinizi güçlendirin, satışlarınızı artırın ve daha fazla kazanç elde edin
                  </p>
                </div>
                <ul className="space-y-4 relative z-10">
                  {[
                    'Müşteri ve firma yönetimi',
                    'Teklif ve fırsat takibi',
                    'Toplantı ve görüşme planlama',
                    'Sevkiyat ve sipariş takibi',
                  ].map((item, idx) => (
                    <motion.li
                      key={item}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: idx * 0.1 }}
                      className="flex items-center gap-3 text-gray-700 group/item"
                    >
                      <motion.div
                        whileHover={{ scale: 1.2, rotate: 360 }}
                        transition={{ duration: 0.3 }}
                      >
                        <CheckCircle2 className="h-6 w-6 text-blue-600 flex-shrink-0" />
                      </motion.div>
                      <span className="font-medium group-hover/item:text-blue-600 transition-colors duration-300">
                        {item}
                      </span>
                    </motion.li>
                  ))}
                </ul>
              </GradientCard>
            </motion.div>

            {/* Enterprise V3 ERP Card */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -10, scale: 1.02 }}
            >
              <GradientCard gradient="info" className="h-full p-10 group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-cyan-500/0 group-hover:from-indigo-500/10 group-hover:to-cyan-500/10 transition-all duration-500" />
                <div className="text-center mb-8 relative z-10">
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                    className="inline-flex p-6 rounded-3xl bg-gradient-to-br from-indigo-100 to-cyan-100 mb-6 shadow-xl"
                  >
                    <Settings className="h-12 w-12 text-indigo-600" />
                  </motion.div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors duration-300">
                    İş Süreçleri Yönetimi
                  </h3>
                  <p className="text-gray-600 text-lg font-light">
                    Stok, üretim ve finans süreçlerinizi otomatikleştirin, operasyonel maliyetlerinizi düşürün
                  </p>
                </div>
                <ul className="space-y-4 relative z-10">
                  {[
                    'Stok ve envanter yönetimi',
                    'Ürün kataloğu yönetimi',
                    'Üretim planlama ve kontrol',
                    'Gelişmiş raporlama sistemi',
                  ].map((item, idx) => (
                    <motion.li
                      key={item}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: idx * 0.1 }}
                      className="flex items-center gap-3 text-gray-700 group/item"
                    >
                      <motion.div
                        whileHover={{ scale: 1.2, rotate: 360 }}
                        transition={{ duration: 0.3 }}
                      >
                        <CheckCircle2 className="h-6 w-6 text-indigo-600 flex-shrink-0" />
                      </motion.div>
                      <span className="font-medium group-hover/item:text-indigo-600 transition-colors duration-300">
                        {item}
                      </span>
                    </motion.li>
                  ))}
                </ul>
              </GradientCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CRM Özellikleri Section - Enhanced with More Details */}
      <section
        id="crm-features"
        className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50/40 via-indigo-50/30 to-white"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <motion.h2
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6"
            >
              Size Ne Sunuyoruz?
            </motion.h2>
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: 120 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 mx-auto rounded-full shadow-lg mb-6"
            />
                      <motion.p
                        initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-xl text-gray-600 max-w-2xl mx-auto font-light"
            >
              İşinizi büyütmenize yardımcı olacak özellikler
                      </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
            {/* Left: Module Preview Cards */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-6"
            >
              {/* Fırsat Yönetimi Card */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2, type: 'spring', stiffness: 300, damping: 20 }}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <GradientCard gradient="primary" className="p-8 group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-indigo-500/0 group-hover:from-blue-500/10 group-hover:to-indigo-500/10 transition-all duration-500" />
                  <motion.h3
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3 relative z-10"
                  >
                    <motion.div
                      whileHover={{ rotate: [0, -10, 10, 0], scale: 1.15 }}
                      transition={{ duration: 0.4 }}
                    >
                      <Briefcase className="h-6 w-6 text-blue-600" />
                    </motion.div>
                    Fırsat Yönetimi
                  </motion.h3>
                  <motion.ul
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="space-y-2 relative z-10"
                  >
                    {['Satış pipeline takibi', 'Stage yönetimi', 'Kanban board', 'Win probability'].map((item, idx) => (
                      <motion.li
                        key={item}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.4 + idx * 0.1 }}
                        className="flex items-center gap-2 text-sm text-gray-700"
                      >
                        <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        <span>{item}</span>
                      </motion.li>
                    ))}
                  </motion.ul>
                </GradientCard>
              </motion.div>

              {/* Teklif Sistemi Card */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4, type: 'spring', stiffness: 300, damping: 20 }}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <GradientCard gradient="info" className="p-8 group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-cyan-500/0 group-hover:from-indigo-500/10 group-hover:to-cyan-500/10 transition-all duration-500" />
                  <motion.h3
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3 relative z-10"
                  >
                    <motion.div
                      whileHover={{ rotate: [0, -10, 10, 0], scale: 1.15 }}
                      transition={{ duration: 0.4 }}
                    >
                      <FileText className="h-6 w-6 text-indigo-600" />
                    </motion.div>
                    Teklif Sistemi
                  </motion.h3>
                  <motion.ul
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="space-y-2 relative z-10"
                  >
                    {['Profesyonel teklif oluşturma', 'PDF export', 'Durum takibi', 'Otomatik fatura'].map((item, idx) => (
                      <motion.li
                        key={item}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.6 + idx * 0.1 }}
                        className="flex items-center gap-2 text-sm text-gray-700"
                      >
                        <CheckCircle2 className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                        <span>{item}</span>
                      </motion.li>
                    ))}
                  </motion.ul>
                </GradientCard>
              </motion.div>
            </motion.div>

            {/* Right: Features List */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], type: 'spring', stiffness: 300, damping: 20 }}
              whileHover={{ y: -8, scale: 1.01 }}
            >
              <GradientCard gradient="info" className="h-full p-10 group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-cyan-500/0 group-hover:from-indigo-500/10 group-hover:to-cyan-500/10 transition-all duration-500" />
                <motion.h3
                  initial={{ opacity: 0, y: -20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-4xl font-bold text-gray-900 mb-8 group-hover:text-indigo-600 transition-colors duration-300 relative z-10"
                >
                  Müşterilerinizi Daha İyi Tanıyın
                </motion.h3>
                <ul className="space-y-5 relative z-10">
                  {[
                    'Müşterilerinizi daha iyi tanıyın - tüm iletişim geçmişi tek yerde',
                    'Şirket yapılarını kolayca yönetin - hiyerarşik görünüm',
                    'Müşterilerinizi akıllıca kategorize edin - daha hedefli satış',
                    'İhtiyacınıza göre özelleştirin - esnek veri yapısı',
                  ].map((feature, idx) => (
                    <motion.li
                      key={feature}
                      initial={{ opacity: 0, x: 30, scale: 0.9 }}
                      whileInView={{ opacity: 1, x: 0, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ 
                        duration: 0.6, 
                        delay: idx * 0.15,
                        type: 'spring',
                        stiffness: 200,
                        damping: 20
                      }}
                      whileHover={{ x: 5, scale: 1.02 }}
                      className="flex items-start gap-4 text-gray-700 group/item"
                    >
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        whileInView={{ scale: 1, rotate: 0 }}
                        viewport={{ once: true }}
                        transition={{ 
                          duration: 0.5, 
                          delay: idx * 0.15 + 0.2,
                          type: 'spring',
                          stiffness: 200
                        }}
                        whileHover={{ scale: 1.3, rotate: 360 }}
                      >
                        <CheckCircle2 className="h-6 w-6 text-purple-600 flex-shrink-0 mt-0.5" />
                      </motion.div>
                      <motion.span
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: idx * 0.15 + 0.3 }}
                        className="text-lg font-medium group-hover/item:text-purple-600 transition-colors duration-300"
                      >
                        {feature}
                      </motion.span>
                    </motion.li>
                  ))}
                </ul>
              </GradientCard>
            </motion.div>
          </div>

          {/* Detaylı CRM Özellikleri Grid - Enhanced */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {CRM_FEATURES.map((module, index) => {
              const Icon = module.icon
              return (
                <motion.div
                  key={module.title}
                  variants={itemVariants}
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <GradientCard gradient={module.gradient} className="h-full p-8 group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-cyan-500/0 group-hover:from-blue-500/10 group-hover:to-cyan-500/10 transition-all duration-500" />
                    <div className="mb-6 relative z-10">
                      <motion.div
                        whileHover={{ rotate: 360, scale: 1.15 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 mb-4 shadow-lg group-hover:shadow-xl transition-shadow duration-300"
                      >
                        <Icon className="h-7 w-7 text-blue-600" />
                      </motion.div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">
                        {module.title}
                      </h3>
                    </div>
                    <ul className="space-y-3 relative z-10">
                      {module.features.map((feature, idx) => (
                        <motion.li
                          key={feature}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.3, delay: idx * 0.05 }}
                          className="flex items-start gap-3 text-sm text-gray-700 group/item"
                        >
                          <motion.div
                            whileHover={{ scale: 1.3, rotate: 360 }}
                            transition={{ duration: 0.3 }}
                          >
                            <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          </motion.div>
                          <span className="font-medium group-hover/item:text-blue-600 transition-colors duration-300">
                            {feature}
                          </span>
                        </motion.li>
                      ))}
                    </ul>
                  </GradientCard>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* Avantajlar Section - Premium Design */}
      <section
        id="advantages"
        className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-900 via-indigo-900 to-cyan-900 relative overflow-hidden"
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
            animate={{
              x: [0, 100, 0],
              y: [0, 50, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
          <motion.div
            className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
            animate={{
              x: [0, -100, 0],
              y: [0, -50, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <motion.h2 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-5xl md:text-6xl font-extrabold text-white mb-6"
            >
              Size Nasıl Yardımcı Oluyoruz?
            </motion.h2>
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: 120 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="h-1.5 bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 mx-auto rounded-full shadow-lg mb-6"
            />
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-xl text-white/90 max-w-2xl mx-auto font-light"
            >
              İşinizi büyütmenize yardımcı olacak her şey tek platformda
            </motion.p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {[
              {
                icon: Zap,
                title: 'Hemen Başlayın',
                description: '5 dakikada kurulum, bugün kullanmaya başlayın',
                gradient: 'primary' as const,
              },
              {
                icon: Cloud,
                title: 'Her Yerden Erişin',
                description: 'Bulut tabanlı sistem, verileriniz her zaman yanınızda',
                gradient: 'info' as const,
              },
              {
                icon: Lock,
                title: 'Güvenli Sistem',
                description: 'Verileriniz endüstri standardı güvenlik ile korunur',
                gradient: 'primary' as const,
              },
              {
                icon: TrendingUp,
                title: 'Birlikte Büyüyün',
                description: 'İşletmeniz büyüdükçe sistem de birlikte büyür',
                gradient: 'info' as const,
              },
              {
                icon: Globe,
                title: 'Dil Desteği',
                description: 'Türkçe ve İngilizce tam destek, uluslararası işler için',
                gradient: 'primary' as const,
              },
              {
                icon: Rocket,
                title: 'Sürekli Gelişim',
                description: 'Yeni özellikler eklenir, sisteminiz her zaman güncel kalır',
                gradient: 'info' as const,
              },
              {
                icon: Users,
                title: 'Ekip Çalışması',
                description: 'Ekibinizle gerçek zamanlı çalışın, daha verimli olun',
                gradient: 'primary' as const,
              },
              {
                icon: Shield,
                title: 'Yanınızdayız',
                description: '7/24 destek, sorunlarınızda yanınızdayız',
                gradient: 'info' as const,
              },
            ].map((advantage, index) => {
              const Icon = advantage.icon
              return (
                <motion.div
                  key={advantage.title}
                  variants={itemVariants}
                  whileHover={{ y: -10, scale: 1.05, rotateY: 5 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <div className="h-full p-8 bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-3xl shadow-2xl hover:bg-white/15 hover:border-white/30 transition-all duration-300 group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-cyan-500/0 group-hover:from-blue-500/20 group-hover:to-cyan-500/20 transition-all duration-500" />
                    <div className="text-center relative z-10">
                      <motion.div
                        whileHover={{ rotate: 360, scale: 1.2 }}
                        transition={{ duration: 0.6 }}
                        className="inline-flex p-5 rounded-3xl bg-white/20 mb-6 shadow-xl group-hover:bg-white/30 transition-all duration-300"
                      >
                        <Icon className="h-10 w-10 text-white" />
                      </motion.div>
                      <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-cyan-300 transition-colors duration-300">
                        {advantage.title}
                      </h3>
                      <p className="text-white/80 text-sm leading-relaxed font-light">
                        {advantage.description}
                      </p>
                      </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* Müşteri Yorumları Section - Premium Testimonials */}
      <section
        id="testimonials"
        className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-indigo-50/30 via-white to-blue-50/30"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <motion.h2
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6"
            >
              Müşterilerimiz Ne Diyor?
            </motion.h2>
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: 120 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 mx-auto rounded-full shadow-lg mb-6"
            />
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-xl text-gray-600 max-w-2xl mx-auto font-light"
            >
              Binlerce mutlu müşterimizden bazı görüşler
            </motion.p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {[
              {
                name: 'Ahmet Yılmaz',
                company: 'Tech Solutions A.Ş.',
                role: 'Genel Müdür',
                content: 'Müşteri ilişkilerimizi profesyonelce yönetiyoruz. Satış süreçlerimiz %40 daha hızlı ilerliyor, bu da bize daha fazla zaman kazandırıyor.',
                rating: 5,
                avatar: '👨‍💼',
              },
              {
                name: 'Ayşe Demir',
                company: 'Global Trade Ltd.',
                role: 'Satış Müdürü',
                content: 'Teklif ve fatura süreçlerimiz artık çok daha kolay. Tüm metrikleri tek bakışta görebiliyoruz ve bu sayede daha hızlı karar alabiliyoruz.',
                rating: 5,
                avatar: '👩‍💼',
              },
              {
                name: 'Mehmet Kaya',
                company: 'Innovation Corp.',
                role: 'İş Geliştirme Uzmanı',
                content: 'Stok yönetimi ve sevkiyat takibi özellikleri işimizi çok kolaylaştırdı. Operasyonel hatalarımız %60 azaldı, müşteri memnuniyetimiz arttı.',
                rating: 5,
                avatar: '👨‍🔧',
              },
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -10, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <GradientCard gradient="primary" className="h-full p-8 group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-indigo-500/0 group-hover:from-blue-500/10 group-hover:to-indigo-500/10 transition-all duration-500" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.3, delay: index * 0.1 + i * 0.1 }}
                        >
                          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        </motion.div>
                      ))}
                    </div>
                    <p className="text-gray-700 mb-6 leading-relaxed font-light italic">
                      "{testimonial.content}"
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-2xl shadow-lg">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{testimonial.name}</p>
                        <p className="text-sm text-gray-600">{testimonial.role}</p>
                        <p className="text-xs text-gray-500">{testimonial.company}</p>
                      </div>
                    </div>
                  </div>
                </GradientCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ Section - Premium Accordion */}
      <section
        id="faq"
        className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-indigo-50/20 to-white"
      >
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <motion.h2
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6"
            >
              Sık Sorulan Sorular
            </motion.h2>
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: 120 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 mx-auto rounded-full shadow-lg mb-6"
            />
          </motion.div>

          <div className="space-y-4">
            {faqItems.map((faq, index) => (
              <FAQAccordionItem key={faq.question} faq={faq} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section - Premium Design */}
      <section
        id="final-cta"
        className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 relative overflow-hidden"
      >
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"
            animate={{
              x: [0, 100, 0],
              y: [0, 50, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
          <motion.div
            className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"
            animate={{
              x: [0, -100, 0],
              y: [0, -50, 0],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <motion.h2
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6"
            >
              Hemen Başlamaya Hazır mısınız?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl md:text-2xl text-white/90 mb-10 font-light max-w-2xl mx-auto"
            >
              İşinizi büyütmek için doğru adımı atın. Hemen ücretsiz deneyin ve farkı görün.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  size="lg"
                  onClick={() => scrollToSection('#contact')}
                  className="bg-white text-blue-600 hover:bg-blue-50 px-10 py-7 text-lg font-bold rounded-2xl shadow-2xl hover:shadow-white/50 transition-all duration-300"
                >
                  <span className="flex items-center gap-3">
                    Ücretsiz Başla
                    <ArrowRight className="h-5 w-5" />
                  </span>
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => scrollToSection('#features')}
                  className="bg-white/10 backdrop-blur-xl border-2 border-white/40 text-white hover:bg-white/20 px-10 py-7 text-lg font-bold rounded-2xl transition-all duration-300"
                >
                  Daha Fazla Bilgi
                </Button>
              </motion.div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-12 flex items-center justify-center gap-8 text-white/80 text-sm"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <span>Kredi kartı gerekmez</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <span>14 gün ücretsiz deneme</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <span>İstediğiniz zaman iptal</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* İletişim Section - Premium Design */}
      <section
        id="contact"
        className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-blue-50/40 to-indigo-50/30"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <motion.h2
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6"
            >
              Bize Ulaşın
            </motion.h2>
                <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: 120 }}
                  viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 mx-auto rounded-full shadow-lg mb-6"
            />
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-xl text-gray-600 max-w-2xl mx-auto font-light"
            >
              Sorularınız için bizimle iletişime geçin, size yardımcı olmaktan mutluluk duyarız
            </motion.p>
                </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Left: Contact Form */}
          <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.8 }}
              whileHover={{ y: -5 }}
            >
              <GradientCard gradient="primary" className="p-10 group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-indigo-500/0 group-hover:from-blue-500/10 group-hover:to-indigo-500/10 transition-all duration-500" />
                <h3 className="text-3xl font-bold text-gray-900 mb-8 group-hover:text-blue-600 transition-colors duration-300 relative z-10">
                  Mesaj Gönderin
                </h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    setContactOpen(true)
                  }}
                  className="space-y-5 relative z-10"
                >
                  <motion.div
                    whileFocus={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Input
                      placeholder="Adınız Soyadınız"
                      className="bg-white border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl h-12 text-base transition-all duration-300"
                    />
                  </motion.div>
                  <motion.div
                    whileFocus={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Input
                      type="email"
                      placeholder="E-posta Adresiniz"
                      className="bg-white border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl h-12 text-base transition-all duration-300"
                    />
                  </motion.div>
                  <motion.div
                    whileFocus={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Input
                      type="tel"
                      placeholder="Telefon Numaranız"
                      className="bg-white border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl h-12 text-base transition-all duration-300"
                    />
                  </motion.div>
                  <motion.div
                    whileFocus={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Textarea
                      placeholder="Mesajınız"
                      rows={6}
                      className="bg-white border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl resize-none text-base transition-all duration-300"
                    />
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-700 hover:via-indigo-700 hover:to-cyan-700 text-white h-14 text-lg font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300"
                    >
                      <Send className="mr-2 h-5 w-5" />
                      Mesaj Gönder
                    </Button>
                  </motion.div>
                </form>
              </GradientCard>
          </motion.div>

            {/* Right: Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.8 }}
              whileHover={{ y: -5 }}
            >
              <GradientCard gradient="info" className="h-full p-10 group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-cyan-500/0 group-hover:from-indigo-500/10 group-hover:to-cyan-500/10 transition-all duration-500" />
                <h3 className="text-4xl font-bold text-gray-900 mb-10 group-hover:text-indigo-600 transition-colors duration-300 relative z-10">
                  İletişim Bilgileri
                </h3>
                <div className="space-y-8 relative z-10">
                  {[
                    {
                      icon: Mail,
                      title: 'E-posta',
                      values: ['destek@enterprisev3.com', 'info@enterprisev3.com'],
                      color: 'blue',
                    },
                    {
                      icon: Phone,
                      title: 'Telefon',
                      values: ['+90 (212) XXX XX XX', '+90 (532) XXX XX XX'],
                      color: 'indigo',
                    },
                    {
                      icon: MapPin,
                      title: 'Adres',
                      values: ['İstanbul, Türkiye'],
                      color: 'cyan',
                    },
                    {
                      icon: Globe,
                      title: 'Web Sitesi',
                      values: ['www.enterprisev3.com'],
                      color: 'blue',
                    },
                  ].map((contact, idx) => {
                    const Icon = contact.icon
              return (
                <motion.div
                        key={contact.title}
                        initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: idx * 0.1 }}
                        whileHover={{ x: 5 }}
                        className="flex items-start gap-5 group/item"
                      >
                        <motion.div
                          whileHover={{ rotate: 360, scale: 1.15 }}
                          transition={{ duration: 0.5 }}
                          className={`p-4 rounded-2xl bg-gradient-to-br from-${contact.color}-100 to-${contact.color === 'blue' ? 'indigo' : contact.color === 'cyan' ? 'blue' : 'cyan'}-100 shadow-lg group-hover/item:shadow-xl transition-shadow duration-300`}
                        >
                          <Icon className={`h-7 w-7 text-${contact.color}-600`} />
                        </motion.div>
                        <div>
                          <p className="text-gray-700 font-bold text-lg mb-2 group-hover/item:text-blue-600 transition-colors duration-300">
                            {contact.title}
                          </p>
                          {contact.values.map((value, i) => (
                            <p key={i} className="text-gray-600 text-base font-medium">
                              {value}
                            </p>
                          ))}
                  </div>
                </motion.div>
              )
            })}
                </div>
              </GradientCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer - Premium Design */}
      <footer className="bg-gradient-to-b from-blue-900 via-indigo-900 to-cyan-900 text-white py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                İşinizi Büyütün
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed font-light">
                İş süreçlerinizi kolaylaştıran, zamanınızı kazandıran ve satışlarınızı artıran modern platform.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h3 className="text-2xl font-bold mb-6">Hızlı Erişim</h3>
              <ul className="space-y-3 text-sm text-gray-300">
                {[
                  { label: 'Ana Sayfa', id: 'home' },
                  { label: 'Size Ne Sunuyoruz?', id: 'about' },
                  { label: 'Modüller', id: 'products' },
                  { label: 'İletişim', id: 'contact' },
                ].map((link) => (
                  <li key={link.id}>
                    <motion.button
                      whileHover={{ x: 5, color: '#60a5fa' }}
                      onClick={() => scrollToSection(`#${link.id}`)}
                      className="text-left transition-colors duration-300 font-medium"
                    >
                      {link.label}
                    </motion.button>
                  </li>
                ))}
              </ul>
            </motion.div>
                <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h3 className="text-2xl font-bold mb-6">İletişim</h3>
              <p className="text-gray-300 text-sm mb-2 font-medium">destek@enterprisev3.com</p>
              <p className="text-gray-300 text-sm font-medium">+90 (212) XXX XX XX</p>
          </motion.div>
        </div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="border-t border-blue-800/50 pt-8 text-center"
          >
            <p className="text-sm text-gray-400 font-light">
              © {new Date().getFullYear()} Tüm hakları saklıdır.
            </p>
          </motion.div>
        </div>
      </footer>

      {/* Contact Form Modal */}
      <ContactForm open={contactOpen} onClose={() => setContactOpen(false)} />
    </div>
  )
}

export default memo(LandingPage)
