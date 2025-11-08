'use client'

import { useEffect, useState, memo } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  ArrowRight,
  BarChart3,
  Users,
  Briefcase,
  FileText,
  ShoppingCart,
  Zap,
  Shield,
  Globe,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  Rocket,
  Award,
  Clock,
  Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import ContactForm from '@/components/landing/ContactForm'

const AnimatedCounter = dynamic(() => import('@/components/ui/AnimatedCounter'), {
  ssr: false,
  loading: () => <span className="text-4xl font-bold animate-pulse">0</span>,
})
const stats = [
  { label: 'Aktif Kullanıcı', value: 1250, icon: Users, color: 'from-primary-500 to-primary-600' },
  { label: 'Tamamlanan Proje', value: 3400, icon: CheckCircle2, color: 'from-secondary-500 to-secondary-600' },
  { label: 'Müşteri Memnuniyeti', value: 98, suffix: '%', icon: TrendingUp, color: 'from-accent-500 to-accent-600' },
  { label: 'Uptime', value: 99.9, suffix: '%', icon: Zap, color: 'from-green-500 to-green-600' },
]

const features = [
  {
    icon: BarChart3,
    title: 'Güçlü Analitik',
    description: 'Gerçek zamanlı dashboard ve detaylı raporlama ile işinizi her açıdan takip edin.',
    gradient: 'from-primary-500 to-secondary-500',
    delay: 0.1,
  },
  {
    icon: Users,
    title: 'Müşteri Yönetimi',
    description: 'Müşteri ilişkilerinizi tek bir platformda yönetin, takip edin ve geliştirin.',
    gradient: 'from-secondary-500 to-accent-500',
    delay: 0.2,
  },
  {
    icon: Briefcase,
    title: 'Fırsat Takibi',
    description: 'Deal pipeline\'ınızı görselleştirin ve satış süreçlerinizi optimize edin.',
    gradient: 'from-accent-500 to-pink-500',
    delay: 0.3,
  },
  {
    icon: FileText,
    title: 'Teklif & Fatura',
    description: 'Profesyonel teklifler oluşturun, faturaları yönetin ve ödemeleri takip edin.',
    gradient: 'from-primary-500 to-accent-500',
    delay: 0.4,
  },
  {
    icon: ShoppingCart,
    title: 'Stok Yönetimi',
    description: 'Ürün envanterinizi gerçek zamanlı takip edin ve otomatik bildirimler alın.',
    gradient: 'from-secondary-500 to-primary-500',
    delay: 0.5,
  },
  {
    icon: Shield,
    title: 'Güvenli & Güvenilir',
    description: 'Enterprise-grade güvenlik ve %99.9 uptime garantisi ile verileriniz güvende.',
    gradient: 'from-accent-500 to-secondary-500',
    delay: 0.6,
  },
]

const benefits = [
  { icon: Zap, text: 'Gerçek zamanlı veri senkronizasyonu', color: 'text-yellow-500' },
  { icon: Globe, text: 'Çoklu şirket desteği (Multi-tenant)', color: 'text-blue-500' },
  { icon: Rocket, text: 'Mobil uyumlu responsive tasarım', color: 'text-purple-500' },
  { icon: Globe, text: 'Türkçe ve İngilizce dil desteği', color: 'text-green-500' },
  { icon: Award, text: 'API entegrasyonu ve özelleştirme', color: 'text-pink-500' },
  { icon: Clock, text: '7/24 teknik destek', color: 'text-indigo-500' },
]

const keyFeatures = [
  { 
    icon: Zap, 
    text: 'Kesintisiz Deneyim', 
    description: 'Anında yanıt veren, akıcı çalışan platform',
    color: 'from-yellow-400 to-yellow-600',
    shape: 'circle',
    animation: 'pulse'
  },
  { 
    icon: Rocket, 
    text: 'Kolay Başlangıç', 
    description: 'Sezgisel arayüz ile hemen üretken olun',
    color: 'from-blue-400 to-blue-600',
    shape: 'star',
    animation: 'bounce'
  },
  { 
    icon: Shield, 
    text: 'Güvenilir Hizmet', 
    description: 'Her zaman erişilebilir, her zaman güvenilir',
    color: 'from-green-400 to-green-600',
    shape: 'hexagon',
    animation: 'float'
  },
  { 
    icon: Lock, 
    text: 'Maksimum Güvenlik', 
    description: 'Verileriniz korunur, işiniz güvende',
    color: 'from-purple-400 to-purple-600',
    shape: 'diamond',
    animation: 'rotate'
  },
]

function LandingPage() {
  const router = useRouter()
  const [contactOpen, setContactOpen] = useState(false)
  const { scrollY } = useScroll()
  const opacity = useTransform(scrollY, [0, 300], [1, 0])
  const scale = useTransform(scrollY, [0, 300], [1, 0.95])

  useEffect(() => {
    // Prefetch routes
    router.prefetch('/login')
    router.prefetch('/tr/dashboard')
  }, [router])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03,
        delayChildren: 0.05,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.2,
        ease: 'easeOut',
      },
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ willChange: 'transform' }}>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-accent-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          style={{ opacity, scale }}
          className="relative z-10 max-w-7xl mx-auto"
        >
          {/* Hero Content */}
          <motion.div variants={itemVariants} className="text-center">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', duration: 0.3, delay: 0.05 }}
              className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-gradient-to-r from-primary-100 to-secondary-100 border border-primary-200 backdrop-blur-sm shadow-lg"
            >
              <Sparkles className="h-4 w-4 text-primary-600" />
              <span className="text-sm font-semibold text-primary-700">
                Enterprise CRM Çözümü
              </span>
            </motion.div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              <motion.span
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-600 bg-clip-text text-transparent"
              >
                İşinizi
              </motion.span>
              <br />
              <motion.span
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
              >
                Bir Üst Seviyeye Taşıyın
              </motion.span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed"
            >
              Modern ve güvenilir CRM platformu ile müşteri ilişkilerinizi yönetin,
              <br className="hidden sm:block" />
              satışlarınızı artırın ve işinizi büyütün.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <Link href="/login" prefetch={true}>
                  <Button
                    size="lg"
                    className="group bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-8 py-6 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden"
                  >
                    {/* Shimmer effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      animate={{
                        x: ['-100%', '200%'],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                    />
                    <span className="relative z-10 flex items-center">
                      Hemen Başla
                      <motion.div
                        className="ml-2"
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ArrowRight className="h-5 w-5" />
                      </motion.div>
                    </span>
                  </Button>
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="px-8 py-6 text-lg font-semibold border-2 hover:bg-gray-50 hover:border-primary-500 transition-all duration-300"
                  onClick={() => {
                    const element = document.getElementById('features')
                    element?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  Daha Fazla Bilgi
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Stats Section */}
          <motion.div
            variants={itemVariants}
            className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 30, scale: 0.8, rotate: -5 }}
                  animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                  transition={{ 
                    delay: 0.3 + index * 0.1, 
                    duration: 0.5,
                    type: 'spring',
                    stiffness: 100,
                    damping: 15
                  }}
                  whileHover={{ 
                    scale: 1.08, 
                    y: -8,
                    rotate: 2,
                    transition: { duration: 0.3 }
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white/95 backdrop-blur-sm group cursor-pointer overflow-hidden relative">
                    {/* Gradient overlay on hover */}
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                      initial={false}
                    />
                    <CardContent className="p-6 text-center relative z-10">
                      <motion.div
                        className="flex justify-center mb-4"
                        whileHover={{ scale: 1.2, rotate: 360 }}
                        transition={{ duration: 0.5 }}
                      >
                        <motion.div
                          className={`p-4 rounded-full bg-gradient-to-r ${stat.color} shadow-xl group-hover:shadow-2xl transition-all duration-300 relative overflow-hidden`}
                          whileHover={{ scale: 1.15 }}
                        >
                          {/* Shimmer effect */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                            animate={{
                              x: ['-100%', '200%'],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: 'linear',
                            }}
                          />
                          <Icon className="h-7 w-7 text-white relative z-10" />
                        </motion.div>
                      </motion.div>
                      <motion.div
                        className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.4 + index * 0.1, type: 'spring', stiffness: 200 }}
                      >
                        <AnimatedCounter
                          value={stat.value}
                          suffix={stat.suffix}
                          decimals={stat.suffix === '%' ? 1 : 0}
                          duration={2}
                        />
                      </motion.div>
                      <motion.p
                        className="text-sm text-gray-600 font-medium"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                      >
                        {stat.label}
                      </motion.p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        </motion.div>
      </section>

      {/* Key Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-600 relative overflow-hidden">
        {/* Animated background shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              x: [0, 100, 0],
              y: [0, 50, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"
          />
          <motion.div
            animate={{
              x: [0, -80, 0],
              y: [0, 100, 0],
              rotate: [360, 180, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="absolute bottom-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"
          />
        </div>
        
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3 }}
            className="text-center mb-16"
          >
            <motion.h2 
              className="text-4xl sm:text-5xl font-bold text-white mb-4"
              initial={{ scale: 0.9 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              Güçlü Özellikler
            </motion.h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              İşinizi büyütmek için ihtiyacınız olan tüm araçlar tek bir platformda
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {keyFeatures.map((feature, index) => {
              const Icon = feature.icon
              const shapeClass = {
                circle: 'rounded-full',
                star: 'rounded-full transform rotate-45',
                hexagon: 'rounded-lg transform rotate-12',
                diamond: 'rounded-lg transform rotate-45',
              }[feature.shape] || 'rounded-full'
              
              const animationVariants = {
                pulse: {
                  scale: [1, 1.1, 1],
                  transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
                },
                bounce: {
                  y: [0, -10, 0],
                  transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
                },
                float: {
                  y: [0, -15, 0],
                  rotate: [0, 5, -5, 0],
                  transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
                },
                rotate: {
                  rotate: [0, 360],
                  transition: { duration: 8, repeat: Infinity, ease: 'linear' },
                },
              }
              
              return (
                <motion.div
                  key={feature.text}
                  initial={{ opacity: 0, y: 30, scale: 0.8 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ 
                    delay: index * 0.1, 
                    duration: 0.4,
                    type: 'spring',
                    stiffness: 100
                  }}
                  whileHover={{ scale: 1.05, y: -8, rotate: 2 }}
                  className="relative"
                >
                  <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm hover:bg-white transition-all duration-300 overflow-hidden group">
                    {/* Decorative gradient overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                    
                    <CardContent className="p-8 text-center relative z-10">
                      {/* Animated icon container with shape */}
                      <motion.div
                        className={`w-20 h-20 mx-auto mb-6 ${shapeClass} bg-gradient-to-r ${feature.color} flex items-center justify-center shadow-2xl relative overflow-hidden`}
                        animate={animationVariants[feature.animation as keyof typeof animationVariants]}
                      >
                        {/* Shimmer effect */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                          animate={{
                            x: ['-100%', '200%'],
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: 'linear',
                          }}
                        />
                        <Icon className="h-10 w-10 text-white relative z-10" />
                      </motion.div>
                      
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                        {feature.text}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {feature.description}
                      </p>
                      
                      {/* Decorative dots */}
                      <div className="flex justify-center gap-2 mt-4">
                        {[0, 1, 2].map((dot) => (
                          <motion.div
                            key={dot}
                            className={`w-2 h-2 rounded-full bg-gradient-to-r ${feature.color}`}
                            animate={{
                              scale: [1, 1.3, 1],
                              opacity: [0.5, 1, 0.5],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              delay: dot * 0.2,
                            }}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Floating particles effect */}
                  {[0, 1, 2].map((particle) => (
                    <motion.div
                      key={particle}
                      className={`absolute w-2 h-2 rounded-full bg-gradient-to-r ${feature.color} opacity-30`}
                      initial={{
                        x: '50%',
                        y: '50%',
                        scale: 0,
                      }}
                      animate={{
                        x: ['50%', `${50 + (particle - 1) * 30}%`],
                        y: ['50%', `${50 + (particle - 1) * 20}%`],
                        scale: [0, 1, 0],
                        opacity: [0, 0.5, 0],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: particle * 0.5,
                        ease: 'easeOut',
                      }}
                    />
                  ))}
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Güçlü Özellikler
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              İşinizi büyütmek için ihtiyacınız olan tüm araçlar tek bir platformda
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                  whileHover={{ scale: 1.02, y: -3 }}
                >
                  <Card className="h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-300 group cursor-pointer bg-white/95 backdrop-blur-sm">
                    <CardHeader>
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${feature.gradient} p-3 mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                      <CardTitle className="text-2xl font-bold text-gray-900">
                        {feature.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-gray-600 text-base leading-relaxed">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Neden Bizi Seçmelisiniz?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Modern teknoloji ve kullanıcı odaklı tasarım ile işinizi kolaylaştırıyoruz
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <motion.div
                  key={benefit.text}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                  whileHover={{ scale: 1.02, x: 3 }}
                  className="flex items-center gap-4 p-5 rounded-xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Icon className={`h-6 w-6 ${benefit.color}`} />
                  </div>
                  <span className="text-gray-700 font-semibold text-base">{benefit.text}</span>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Hemen Başlamaya Hazır mısınız?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              İşinizi büyütmek için doğru adımı atın. Hemen ücretsiz deneyin.
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <Button
                size="lg"
                onClick={() => setContactOpen(true)}
                className="bg-white text-primary-600 px-8 py-6 text-lg font-semibold shadow-2xl hover:shadow-3xl transition-all duration-300 hover:bg-gray-50 relative overflow-hidden group"
              >
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-100/30 to-transparent"
                  animate={{
                    x: ['-100%', '200%'],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />
                <span className="relative z-10 flex items-center">
                  Ücretsiz Başla
                  <motion.div
                    className="ml-2"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="h-5 w-5" />
                  </motion.div>
                </span>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm">
            © {new Date().getFullYear()} CRM Enterprise V3. Tüm hakları saklıdır.
          </p>
        </div>
      </footer>

      {/* Contact Form Modal */}
      <ContactForm open={contactOpen} onClose={() => setContactOpen(false)} />
    </div>
  )
}

// Memoize - re-render'ları önle
export default memo(LandingPage)
