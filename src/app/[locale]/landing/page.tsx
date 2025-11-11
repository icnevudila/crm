'use client'

import { useEffect, useState, memo } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BarChart3,
  Shield,
  RefreshCw,
  Smartphone,
  Users,
  Settings,
  FileText,
  Package,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  Send,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import LandingHeader from '@/components/landing/LandingHeader'
import LogoCarousel from '@/components/landing/LogoCarousel'
import ContactForm from '@/components/landing/ContactForm'

// Referans logoları
const referenceLogos = [
  { name: 'PFEUFFER', alt: 'PFEUFFER Turk' },
  { name: 'VETERİNER', alt: 'VETERİNER MEDİKAL DEPOSU' },
  { name: 'AKILLIM.NET', alt: 'SMART IN MINUTES' },
  { name: 'PFEUFFER', alt: 'PFEUFFER Turk' },
  { name: 'VETERİNER', alt: 'VETERİNER MEDİKAL DEPOSU' },
  { name: 'AKILLIM.NET', alt: 'SMART IN MINUTES' },
]

function LandingPage() {
  const [contactOpen, setContactOpen] = useState(false)

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id.replace('#', ''))
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <LandingHeader />

      {/* Hero Section - Video Background */}
      <section
        id="home"
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          {/* Fallback background image - video yoksa gösterilir */}
          <div
            className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
          style={{ 
              backgroundImage: 'url("https://images.unsplash.com/photo-1551434678-e076c223a692?w=1920&q=80")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          {/* Video - varsa gösterilir */}
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            style={{ display: 'none' }}
            onLoadedData={(e) => {
              // Video yüklendiğinde göster
              const target = e.target as HTMLVideoElement
              target.style.display = 'block'
              // Fallback'i gizle
              const fallback = target.previousElementSibling as HTMLElement
              if (fallback) fallback.style.display = 'none'
            }}
            onError={(e) => {
              // Video yüklenemezse fallback göster
              const target = e.target as HTMLVideoElement
              target.style.display = 'none'
              const fallback = target.previousElementSibling as HTMLElement
              if (fallback) fallback.style.display = 'block'
            }}
          >
            <source src="/videos/business-hero.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/60" />
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-gray-900/70 backdrop-blur-sm rounded-2xl p-8 md:p-12"
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
            >
              İşletmenizi Geleceğe Taşıyın
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl md:text-2xl text-white/90 mb-8"
            >
              Enterprise V3 ile işletmenizi dijital dönüşüm yolculuğunda bir adım öne taşıyın
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
                  <Button
                    size="lg"
                onClick={() => scrollToSection('#contact')}
                className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-6 text-lg font-semibold rounded-lg"
              >
                Bizimle İletişime Geçin
                </Button>
            </motion.div>
          </motion.div>
                    </div>
      </section>

      {/* Hakkımızda Section */}
      <section
        id="about"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-800 to-gray-700"
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold text-white mb-8"
          >
            Hakkımızda
            </motion.h2>
          <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-white/90 leading-relaxed"
          >
            Enterprise V3 olarak, işletmelerin dijital dönüşüm yolculuklarında güçlü bir partner olarak konumlanıyoruz. Yeni nesil CRM, ERP ve e-ticaret çözümlerimizle, iş süreçlerinizi optimize ediyor, geleceğe yönelik büyüme potansiyelinizi uygun maliyetlerle maksimize ediyoruz. Yenilikçi yaklaşımımız ve yapay zeka destekli analiz süreçlerimiz sayesinde, işletmenizin verimliliğini artırmanın ötesinde, pazar dinamiklerini önceden görmenizi ve rekabette fark yaratmanızı sağlıyoruz. Üstelik, bütçe dostu fiyatlandırma modelimizle yüksek teknolojiye erişimi herkes için mümkün kılıyoruz. Enterprise V3 ile sadece bugünün değil, yarının da teknolojisine sahip olun.
          </motion.p>
        </div>
      </section>

      {/* Özellikler Section */}
      <section
        id="features"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-800 to-gray-700"
      >
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold text-white text-center mb-12"
          >
            Özellikler
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: BarChart3,
                title: 'Gelişmiş Raporlama',
                description: 'Detaylı analiz ve raporlama araçlarıyla verilerinizi',
              },
              {
                icon: Shield,
                title: 'Güvenlik',
                description: 'Rol tabanlı yetkilendirme sistemi ile verileriniz',
              },
              {
                icon: RefreshCw,
                title: 'Entegrasyon',
                description: 'Mevcut sistemlerinizle sorunsuz entegrasyon',
              },
              {
                icon: Smartphone,
                title: 'Mobil Uyumlu',
                description: 'Her cihazdan erişim imkanı',
              },
            ].map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-4 inline-block">
                    <Icon className="h-12 w-12 text-white" />
                      </div>
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-white/80">{feature.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Ürünler Section */}
      <section
        id="products"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-800 to-gray-700"
      >
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold text-white text-center mb-12"
          >
            Ürünlerimiz
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Enterprise V3 CRM Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Card className="bg-blue-600/20 backdrop-blur-sm border-blue-500/30 h-full">
                <CardContent className="p-8">
                  <div className="flex items-center justify-center mb-6">
                    <div className="bg-white/20 rounded-lg p-4">
                      <Users className="h-12 w-12 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white text-center mb-4">
                    Enterprise V3 CRM
                  </h3>
                  <p className="text-white/90 text-center mb-6">
                    Müşteri ilişkilerini profesyonelce yönetin
                  </p>
                  <ul className="space-y-3">
                    {[
                      'Müşteri Takibi',
                      'Teklif Yönetimi',
                      'Toplantı Planlaması',
                      'Sevkiyat Takibi',
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-white/90">
                        <CheckCircle2 className="h-5 w-5 text-white flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
          </motion.div>
          
            {/* Enterprise V3 ERP Card */}
                <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Card className="bg-blue-600/20 backdrop-blur-sm border-blue-500/30 h-full">
                <CardContent className="p-8">
                  <div className="flex items-center justify-center mb-6">
                    <div className="bg-white/20 rounded-lg p-4">
                      <Settings className="h-12 w-12 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white text-center mb-4">
                    Enterprise V3 ERP
                  </h3>
                  <p className="text-white/90 text-center mb-6">
                    İş süreçlerinizi entegre edin
                  </p>
                  <ul className="space-y-3">
                    {[
                      'Stok Yönetimi',
                      'Finans Takibi',
                      'Üretim Planlama',
                      'Raporlama',
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-white/90">
                        <CheckCircle2 className="h-5 w-5 text-white flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
                </motion.div>
          </div>
        </div>
      </section>

      {/* CRM Özellikleri Section */}
      <section
        id="crm-features"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-800 to-gray-700"
      >
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold text-white text-center mb-12"
          >
            Enterprise V3 CRM Özellikleri
          </motion.h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: UI Preview Card */}
              <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              >
              <Card className="bg-white h-full">
                  <CardContent className="p-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Görüşmeler</h3>
                      <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                        Görüşme örnekleri burada gösterilebilir
                    </div>
                      </div>
                      <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4">İletişim Kişileri</h3>
                      <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                        İletişim kişileri örnekleri burada gösterilebilir
                      </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

            {/* Right: Features List */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Card className="bg-blue-600/20 backdrop-blur-sm border-blue-500/30 h-full">
                <CardContent className="p-8">
                  <h3 className="text-3xl font-bold text-white mb-6">
                    Müşteri İlişkileri Yönetimi
                  </h3>
                  <ul className="space-y-4">
                    {[
                      'Detaylı müşteri profili ve iletişim geçmişi',
                      'Şirket ve kontak yönetimi',
                      'Müşteri segmentasyonu ve kategorizasyon',
                      'Özelleştirilebilir müşteri alanları',
                    ].map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-white/90">
                        <CheckCircle2 className="h-6 w-6 text-white flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Referanslar Section */}
      <section
        id="references"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-black"
      >
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold text-white text-center mb-12"
          >
            Referanslarımız
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <LogoCarousel logos={referenceLogos} />
          </motion.div>
        </div>
      </section>

      {/* İletişim Section */}
      <section
        id="contact"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-800 to-gray-700"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Card className="bg-gray-900/70 backdrop-blur-sm border-gray-700">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-white mb-6">Bize Ulaşın</h3>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      setContactOpen(true)
                    }}
                    className="space-y-4"
                  >
                    <Input
                      placeholder="Adınız Soyadınız"
                      className="bg-white/10 border-gray-600 text-white placeholder:text-gray-400"
                    />
                    <Input
                      type="email"
                      placeholder="E-posta Adresiniz"
                      className="bg-white/10 border-gray-600 text-white placeholder:text-gray-400"
                    />
                    <Input
                      type="tel"
                      placeholder="Telefon Numaranız"
                      className="bg-white/10 border-gray-600 text-white placeholder:text-gray-400"
                    />
                    <Textarea
                      placeholder="Mesajınız"
                      rows={5}
                      className="bg-white/10 border-gray-600 text-white placeholder:text-gray-400 resize-none"
                    />
              <Button
                      type="submit"
                      className="w-full bg-gray-800 hover:bg-gray-700 text-white"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Gönder
              </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>

            {/* Right: Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Card className="bg-gray-900/70 backdrop-blur-sm border-gray-700 h-full">
                <CardContent className="p-8">
                  <h3 className="text-3xl font-bold text-white mb-8">İletişim Bilgileri</h3>
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <Mail className="h-6 w-6 text-white flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-white/90">info@enterprisev3.com</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <Phone className="h-6 w-6 text-white flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-white/90">+90 (538) 832 40 41</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <MapPin className="h-6 w-6 text-white flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-white/90">
                          Yukarıbahçelievler Mah. Azerbaycan Cad. 06490 Ankara, Türkiye
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
          </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Enterprise V3</h3>
              <p className="text-gray-400 text-sm">
                Modern ve güvenilir CRM platformu ile işinizi büyütün.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Hızlı Linkler</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <button
                    onClick={() => scrollToSection('#home')}
                    className="hover:text-white transition-colors"
                  >
                    Anasayfa
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('#about')}
                    className="hover:text-white transition-colors"
                  >
                    Hakkımızda
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('#products')}
                    className="hover:text-white transition-colors"
                  >
                    Ürünler
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('#contact')}
                    className="hover:text-white transition-colors"
                  >
                    İletişim
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">İletişim</h3>
              <p className="text-gray-400 text-sm">info@enterprisev3.com</p>
              <p className="text-gray-400 text-sm">+90 (538) 832 40 41</p>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} Enterprise V3. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </footer>

      {/* Contact Form Modal */}
      <ContactForm open={contactOpen} onClose={() => setContactOpen(false)} />
    </div>
  )
}

export default memo(LandingPage)
