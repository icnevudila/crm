'use client'

import { useState, memo, useEffect } from 'react'
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion'
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

      {/* Hero Section - Premium Video Background with Parallax */}
      <section
        id="home"
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Animated Gradient Background with Parallax */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-600"
          style={{
            x: useTransform(scrollY, [0, 1000], [0, mousePosition.x * 0.5]),
            y: useTransform(scrollY, [0, 1000], [0, mousePosition.y * 0.5]),
          }}
        >
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          {/* Enhanced Animated Blobs */}
          <motion.div
            className="absolute top-20 left-20 w-96 h-96 bg-blue-400/40 rounded-full blur-3xl"
            animate={{
              x: [0, 100, 0],
              y: [0, 50, 0],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
          <motion.div
            className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-400/40 rounded-full blur-3xl"
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
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-400/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.3, 0.6, 0.3],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </motion.div>

        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          <div
            className="w-full h-full bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-600"
            style={{
              backgroundImage: 'url("https://images.unsplash.com/photo-1551434678-e076c223a692?w=1920&q=80")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            style={{ display: 'none' }}
            onLoadedData={(e) => {
              const target = e.target as HTMLVideoElement
              target.style.display = 'block'
              const fallback = target.previousElementSibling as HTMLElement
              if (fallback) fallback.style.display = 'none'
            }}
            onError={(e) => {
              const target = e.target as HTMLVideoElement
              target.style.display = 'none'
              const fallback = target.previousElementSibling as HTMLElement
              if (fallback) fallback.style.display = 'block'
            }}
          >
            <source src="/videos/business-hero.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/80 via-indigo-900/80 to-cyan-900/80 backdrop-blur-[1px]" />
      </div>

        {/* Content with Premium Animations */}
        <motion.div
          style={{ 
            opacity: heroOpacity, 
            scale: heroScale,
            y: heroYSpring,
          }}
          className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          <motion.div
            variants={containerVariants}
          initial="hidden"
          animate="visible"
            className="space-y-8"
        >
            {/* Premium Badge */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.05, y: -2 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/15 backdrop-blur-xl border border-white/30 shadow-2xl hover:bg-white/20 transition-all duration-300 relative overflow-hidden group"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                initial={false}
              />
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="relative z-10"
              >
                <Sparkles className="h-4 w-4 text-white" />
              </motion.div>
              <span className="text-sm font-bold text-white tracking-wide relative z-10">Yeni Nesil İş Yönetim Platformu</span>
            </motion.div>

            {/* Main Title with Gradient Text Animation */}
            <motion.h1
              variants={itemVariants}
              className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold text-white leading-tight"
            >
              <motion.span
                className="block mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                İş Süreçlerinizi
              </motion.span>
              <motion.span
                className="block bg-gradient-to-r from-cyan-300 via-blue-300 via-indigo-300 to-purple-300 bg-clip-text text-transparent relative"
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                  opacity: 1,
                  scale: 1,
                }}
                initial={{ opacity: 0, scale: 0.9 }}
                transition={{
                  backgroundPosition: {
                    duration: 5,
                    repeat: Infinity,
                    ease: 'linear',
                  },
                  opacity: { duration: 0.8, delay: 0.4 },
                  scale: { duration: 0.8, delay: 0.4 },
                }}
                style={{
                  backgroundSize: '200% 200%',
                }}
              >
                <motion.span
                  className="absolute inset-0 bg-gradient-to-r from-cyan-300 via-blue-300 via-indigo-300 to-purple-300 bg-clip-text text-transparent blur-xl opacity-50"
                  animate={{
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  style={{
                    backgroundSize: '200% 200%',
                  }}
                >
                  Dijitalleştirin
                </motion.span>
                <span className="relative z-10">Dijitalleştirin</span>
              </motion.span>
            </motion.h1>

            {/* Subtitle with Fade In */}
            <motion.p
              variants={itemVariants}
              className="text-xl md:text-2xl lg:text-3xl text-white/95 max-w-3xl mx-auto leading-relaxed font-light"
            >
              Enterprise V3 ile müşteri ilişkilerinden stok yönetimine, teklif ve fatura süreçlerinden raporlamaya kadar tüm iş süreçlerinizi tek bir platformda birleştirin
            </motion.p>

            {/* Premium CTA Buttons */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                  <Button
                    size="lg"
                  onClick={() => scrollToSection('#contact')}
                  className="group relative bg-white text-blue-600 hover:bg-blue-50 px-10 py-7 text-lg font-bold rounded-2xl shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 overflow-hidden"
                  >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    initial={false}
                  />
                  <span className="relative z-10 flex items-center gap-3">
                    Hemen Başlayın
                    <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <ArrowRight className="h-5 w-5" />
                      </motion.div>
                    </span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    initial={false}
                  />
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
                  className="group relative bg-white/10 backdrop-blur-xl border-2 border-white/40 text-white hover:bg-white/20 px-10 py-7 text-lg font-bold rounded-2xl transition-all duration-300 shadow-xl hover:shadow-white/20 overflow-hidden"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    initial={false}
                  />
                  <span className="relative z-10">Daha Fazla Bilgi</span>
                </Button>
              </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>

        {/* Premium Scroll Indicator */}
          <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10"
        >
                <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            whileHover={{ scale: 1.1 }}
            className="w-8 h-14 border-2 border-white/60 rounded-full flex justify-center backdrop-blur-sm bg-white/10 group cursor-pointer relative overflow-hidden"
          >
                    <motion.div
              className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              initial={false}
            />
                    <motion.div
              animate={{ y: [0, 16, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-1.5 h-4 bg-white/80 rounded-full mt-3 relative z-10"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Hakkımızda Section - Premium Design */}
      <section
        id="about"
        className="py-32 px-4 sm:px-6 lg:px-8 relative"
      >
        <div className="max-w-6xl mx-auto">
                      <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-20"
          >
            <motion.h2
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6"
            >
              Neden Enterprise V3?
            </motion.h2>
                        <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: 120 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 mx-auto rounded-full shadow-lg"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <GradientCard gradient="primary" className="p-10 md:p-16 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <p className="text-xl md:text-2xl text-gray-700 leading-relaxed text-center relative z-10 font-light">
                Enterprise V3, işletmelerin dijital dönüşüm ihtiyaçlarını karşılamak üzere geliştirilmiş, kapsamlı bir iş yönetim platformudur. Müşteri ilişkileri yönetiminden başlayarak, stok takibi, teklif ve fatura süreçleri, sevkiyat yönetimi ve detaylı raporlama gibi tüm kritik iş süreçlerinizi tek bir çatı altında toplar. Bulut tabanlı altyapımız sayesinde verilerinize her yerden güvenli bir şekilde erişebilir, ekip üyelerinizle gerçek zamanlı işbirliği yapabilirsiniz. Ölçeklenebilir yapımız sayesinde küçük işletmelerden büyük kurumsal şirketlere kadar her ölçekteki işletmeye hizmet verebiliriz.
              </p>
            </GradientCard>
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
              Güçlü Özellikler
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
              İşinizi büyütmek için ihtiyacınız olan tüm araçlar tek bir platformda
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
                title: 'Gelişmiş Analitik',
                description: 'Gerçek zamanlı veri analizi ve özelleştirilebilir raporlama araçları ile iş performansınızı detaylı şekilde takip edin',
                gradient: 'primary' as const,
                color: 'blue',
              },
              {
                icon: Shield,
                title: 'Üstün Güvenlik',
                description: 'Rol tabanlı erişim kontrolü ve endüstri standardı şifreleme ile verileriniz her zaman korunur',
                gradient: 'info' as const,
                color: 'indigo',
              },
              {
                icon: RefreshCw,
                title: 'Kolay Entegrasyon',
                description: 'Mevcut sistemlerinizle sorunsuz entegrasyon imkanı ile veri kaybı yaşamadan geçiş yapın',
                gradient: 'primary' as const,
                color: 'cyan',
              },
              {
                icon: Smartphone,
                title: 'Her Yerden Erişim',
                description: 'Mobil uyumlu arayüz sayesinde işinizi ofis dışından da yönetebilir, her zaman bağlı kalın',
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
              Çözümlerimiz
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
              İş süreçlerinizi optimize eden modüler çözümler
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
                    CRM Modülü
                  </h3>
                  <p className="text-gray-600 text-lg font-light">
                    Müşteri ilişkilerinizi profesyonelce yönetin ve satış süreçlerinizi optimize edin
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
                    ERP Modülü
                  </h3>
                  <p className="text-gray-600 text-lg font-light">
                    İş süreçlerinizi entegre edin ve operasyonel verimliliğinizi artırın
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
              CRM Özellikleri
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
              Kapsamlı müşteri yönetim sistemi ile işinizi büyütün
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
                  Müşteri Yönetim Sistemi
                </motion.h3>
                <ul className="space-y-5 relative z-10">
                  {[
                    'Kapsamlı müşteri profilleri ve iletişim geçmişi kayıtları',
                    'Şirket ve kişi bazlı hiyerarşik yapı yönetimi',
                    'Akıllı müşteri segmentasyonu ve kategorilendirme',
                    'Esnek ve özelleştirilebilir veri alanları',
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
            {[
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
                gradient: 'primary' as const,
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
                gradient: 'info' as const,
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
                gradient: 'primary' as const,
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
                gradient: 'info' as const,
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
                gradient: 'primary' as const,
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
                gradient: 'info' as const,
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
                gradient: 'primary' as const,
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
                gradient: 'info' as const,
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
                gradient: 'primary' as const,
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
                gradient: 'info' as const,
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
                gradient: 'primary' as const,
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
                gradient: 'info' as const,
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
                gradient: 'primary' as const,
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
                gradient: 'info' as const,
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
                gradient: 'primary' as const,
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
                gradient: 'info' as const,
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
                gradient: 'primary' as const,
              },
            ].map((module, index) => {
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
              Neden Enterprise V3?
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
              İşletmenizi büyütmek için ihtiyacınız olan her şey tek platformda
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
                title: 'Hızlı Kurulum',
                description: '5 dakikada kurulum, hemen kullanmaya başlayın',
                gradient: 'primary' as const,
              },
              {
                icon: Cloud,
                title: 'Bulut Tabanlı',
                description: 'Her yerden erişim, verileriniz güvende',
                gradient: 'info' as const,
              },
              {
                icon: Lock,
                title: 'Güvenli Altyapı',
                description: 'Endüstri standardı şifreleme ve yedekleme',
                gradient: 'primary' as const,
              },
              {
                icon: TrendingUp,
                title: 'Ölçeklenebilir',
                description: 'Küçük işletmeden büyük kurumsal şirketlere',
                gradient: 'info' as const,
              },
              {
                icon: Globe,
                title: 'Çoklu Dil',
                description: 'Türkçe ve İngilizce tam destek',
                gradient: 'primary' as const,
              },
              {
                icon: Rocket,
                title: 'Sürekli Güncelleme',
                description: 'Yeni özellikler ve iyileştirmeler düzenli olarak eklenir',
                gradient: 'info' as const,
              },
              {
                icon: Users,
                title: 'Ekip İşbirliği',
                description: 'Gerçek zamanlı işbirliği ve paylaşım',
                gradient: 'primary' as const,
              },
              {
                icon: Shield,
                title: '7/24 Destek',
                description: 'Profesyonel teknik destek ekibimiz yanınızda',
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
                Enterprise V3
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed font-light">
                Modern ve güvenilir iş yönetim platformu ile işinizi büyütün.
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
                  { label: 'Hakkımızda', id: 'about' },
                  { label: 'Çözümler', id: 'products' },
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
              © {new Date().getFullYear()} Enterprise V3. Tüm hakları saklıdır.
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
