'use client'

/* eslint-disable react/no-unescaped-entities */

import React, { useState } from 'react'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { Download, BookOpen, Users, Shield, Building2, FileText, Package, Truck, ShoppingCart, BarChart3, CheckSquare, HelpCircle, Calendar, Briefcase, Receipt, Store, Activity, UserCog, Settings, Crown, Info, LayoutDashboard, Video, Mail, Phone, MessageSquare, Zap, Link as LinkIcon, Keyboard, Lightbulb, Rocket, AlertTriangle, CheckCircle2, PlayCircle, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { toastError } from '@/lib/toast'

export default function KullanimKilavuzuPage() {
  const t = useTranslations('common')
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true)
    try {
      const response = await fetch('/api/pdf/kullanim-kilavuzu', {
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error('PDF oluşturulamadı')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `CRM-Kullanim-Kilavuzu-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }, 100)
    } catch (error: any) {
      console.error('PDF indirme hatası:', error)
      toastError('PDF oluşturulurken bir hata oluştu', error?.message || 'Bilinmeyen hata')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-indigo-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Kullanım Kılavuzu</h1>
              <p className="text-gray-600 mt-1">CRM Enterprise V3 - Detaylı Sistem Kullanım Kılavuzu</p>
            </div>
          </div>
          <Button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Download className="h-4 w-4 mr-2" />
            {isGeneratingPDF ? 'PDF Oluşturuluyor...' : 'PDF İndir'}
          </Button>
        </div>
      </motion.div>

      {/* İçindekiler */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>İçindekiler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <a href="#genel-bakis" className="text-indigo-600 hover:underline">1. Genel Bakış</a>
            <a href="#giris-ve-yetkilendirme" className="text-indigo-600 hover:underline">2. Giriş ve Yetkilendirme</a>
            <a href="#moduller" className="text-indigo-600 hover:underline">3. Modüller ve Kullanım</a>
            <a href="#veri-akisi" className="text-indigo-600 hover:underline">4. Veri Akışı ve İlişkiler</a>
            <a href="#ozellikler" className="text-indigo-600 hover:underline">5. Özellikler</a>
            <a href="#entegrasyonlar" className="text-indigo-600 hover:underline">6. Entegrasyonlar</a>
            <a href="#otomasyonlar" className="text-indigo-600 hover:underline">7. Otomasyonlar ve İş Akışları</a>
            <a href="#hizli-baslangic" className="text-indigo-600 hover:underline">8. Hızlı Başlangıç (5 Dakikada)</a>
            <a href="#ipuclari" className="text-indigo-600 hover:underline">9. İpuçları ve Püf Noktaları</a>
            <a href="#ornek-senaryolar" className="text-indigo-600 hover:underline">10. Örnek Senaryolar</a>
            <a href="#raporlar" className="text-indigo-600 hover:underline">11. Raporlar ve Analitik</a>
            <a href="#sik-sorulan-sorular" className="text-indigo-600 hover:underline">12. Sık Sorulan Sorular</a>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="genel" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="genel">Genel</TabsTrigger>
          <TabsTrigger value="moduller">Modüller</TabsTrigger>
          <TabsTrigger value="ozellikler">Özellikler</TabsTrigger>
          <TabsTrigger value="entegrasyonlar">Entegrasyonlar</TabsTrigger>
          <TabsTrigger value="ipuclari">İpuçları</TabsTrigger>
          <TabsTrigger value="teknik">Teknik</TabsTrigger>
        </TabsList>

        {/* GENEL BAKIŞ */}
        <TabsContent value="genel" className="space-y-6">
          <section id="genel-bakis">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  1. Genel Bakış
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Sistem Hakkında</h3>
                  <p className="text-gray-700">
                    CRM Enterprise V3, multi-tenant yapıda, kurumsal seviyede bir müşteri ilişkileri yönetim sistemidir. 
                    Sistem, satış, pazarlama, stok, finans ve raporlama modüllerini içeren kapsamlı bir çözümdür.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Teknoloji Stack</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li><strong>Frontend:</strong> Next.js 15 (App Router), React 18, TypeScript</li>
                    <li><strong>Backend:</strong> Supabase (PostgreSQL, Auth, Storage)</li>
                    <li><strong>UI:</strong> Tailwind CSS, shadcn/ui components</li>
                    <li><strong>Animasyon:</strong> Framer Motion</li>
                    <li><strong>State Management:</strong> SWR (data fetching)</li>
                    <li><strong>PDF:</strong> @react-pdf/renderer</li>
                    <li><strong>Locale:</strong> next-intl (TR/EN)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Sistem Mimarisi</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-semibold mb-2">Multi-Tenant Yapı:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li><strong>Ana Tablo:</strong> Company (Multi-tenant root)</li>
                      <li><strong>Tüm tablolar:</strong> companyId kolonu ile bir şirkete bağlı</li>
                      <li><strong>RLS (Row-Level Security):</strong> Kullanıcılar sadece kendi şirketinin verisini görür</li>
                      <li><strong>SUPER_ADMIN:</strong> Tüm şirketleri görebilir ve yönetebilir</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section id="giris-ve-yetkilendirme">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  2. Giriş ve Yetkilendirme
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Giriş Yapma</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li>Tarayıcınızda sisteme giriş sayfasına gidin</li>
                    <li>E-posta adresinizi ve şifrenizi girin</li>
                    <li>"Giriş Yap" butonuna tıklayın</li>
                    <li>Başarılı giriş sonrası Dashboard sayfasına yönlendirilirsiniz</li>
                  </ol>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Roller ve Yetkiler</h3>
                  <div className="space-y-3">
                    <div className="border-l-4 border-red-500 pl-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Crown className="h-4 w-4 text-red-600" />
                        <strong className="text-red-600">SUPER_ADMIN</strong>
                      </div>
                      <p className="text-gray-700 text-sm">Sistem yöneticisi - Tüm şirketleri görebilir ve yönetebilir. Tüm yetkilere sahiptir.</p>
                    </div>

                    <div className="border-l-4 border-blue-500 pl-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <strong className="text-blue-600">ADMIN</strong>
                      </div>
                      <p className="text-gray-700 text-sm">Şirket yöneticisi - Kendi şirketi için tüm yetkilere sahiptir. Kullanıcı yönetimi, modül izinleri yapabilir.</p>
                    </div>

                    <div className="border-l-4 border-green-500 pl-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Briefcase className="h-4 w-4 text-green-600" />
                        <strong className="text-green-600">SALES</strong>
                      </div>
                      <p className="text-gray-700 text-sm">Satış Temsilcisi - Satış işlemleri yapabilir. Müşteri, teklif, fırsat yönetimi yapabilir.</p>
                    </div>

                    <div className="border-l-4 border-gray-500 pl-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="h-4 w-4 text-gray-600" />
                        <strong className="text-gray-600">USER</strong>
                      </div>
                      <p className="text-gray-700 text-sm">Temel kullanıcı - Sınırlı yetkilere sahiptir. Genellikle görüntüleme ve temel işlemler yapabilir.</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">2 Seviyeli Yetki Kontrolü</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p className="font-semibold">Seviye 1: Kurum Modül İzni (CompanyModulePermission)</p>
                    <p className="text-sm text-gray-700">Her kurumun hangi modülleri kullanabileceği belirlenir. Modül aktif/pasif yapılabilir.</p>
                    
                    <p className="font-semibold mt-4">Seviye 2: Rol Modül İzni (RolePermission)</p>
                    <p className="text-sm text-gray-700">Her rolün modül bazlı CRUD yetkileri (Create, Read, Update, Delete) belirlenir.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </TabsContent>

        {/* MODÜLLER */}
        <TabsContent value="moduller" className="space-y-6">
          <section id="moduller">
            <Card>
              <CardHeader>
                <CardTitle>3. Modüller ve Kullanım</CardTitle>
                <CardDescription>Tüm modüllerin detaylı kullanım kılavuzu</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Dashboard */}
                <div className="border-l-4 border-indigo-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <LayoutDashboard className="h-5 w-5 text-indigo-600" />
                    <h3 className="font-semibold text-lg">Dashboard (Gösterge Paneli)</h3>
                  </div>
                  <p className="text-gray-700 mb-3">
                    Ana gösterge paneli. Sistemin genel durumunu, KPI'ları ve grafikleri gösterir.
                  </p>
                  <div className="bg-gray-50 p-3 rounded space-y-2">
                    <p className="font-semibold text-sm">Özellikler:</p>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      <li>6 KPI kartı (Toplam Müşteri, Aktif Fırsatlar, Bekleyen Teklifler, Toplam Gelir, Bu Ay Satış, Tamamlanan Görevler)</li>
                      <li>5 grafik (Satış Trendi, Ürün Satışları, Fırsat Durumları, Aylık Karşılaştırma, Kanban Board)</li>
                      <li>Real-time güncellemeler (30 saniyede bir)</li>
                      <li>Son aktiviteler listesi</li>
                    </ul>
                    <p className="font-semibold text-sm mt-3">Kim Kullanabilir:</p>
                    <p className="text-sm text-gray-700">Tüm kullanıcılar (okuma yetkisi olanlar)</p>
                  </div>
                </div>

                {/* Companies */}
                <div className="border-l-4 border-blue-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-lg">Firmalar</h3>
                  </div>
                  <p className="text-gray-700 mb-3">
                    Müşteri firmalarını yönetir. Her firma için görüşme, teklif, görev oluşturulabilir.
                  </p>
                  <div className="bg-gray-50 p-3 rounded space-y-2">
                    <p className="font-semibold text-sm">Özellikler:</p>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      <li>Firma ekleme, düzenleme, silme</li>
                      <li>Durum yönetimi (POT: Potansiyel, MUS: Müşteri, ALT: Alt Bayi, PAS: Pasif)</li>
                      <li>Firma detay sayfası (istatistikler, görüşmeler, teklifler, görevler)</li>
                      <li>Hızlı işlem butonları (Görüşme, Teklif, Görev oluştur)</li>
                      <li>Arama ve filtreleme</li>
                    </ul>
                    <p className="font-semibold text-sm mt-3">Veri Akışı:</p>
                    <p className="text-sm text-gray-700">Company → Customer → Deal → Quote → Invoice</p>
                  </div>
                </div>

                {/* Customers */}
                <div className="border-l-4 border-green-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-lg">Müşteriler</h3>
                  </div>
                  <p className="text-gray-700 mb-3">
                    Müşteri ilişkileri yönetimi. Müşteri bilgileri, iletişim, adres yönetimi.
                  </p>
                  <div className="bg-gray-50 p-3 rounded space-y-2">
                    <p className="font-semibold text-sm">Özellikler:</p>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      <li>CRUD işlemleri (Create, Read, Update, Delete)</li>
                      <li>Toplu işlemler (Bulk operations)</li>
                      <li>Import/Export (Excel, CSV)</li>
                      <li>Dosya ekleme (max 10MB)</li>
                      <li>Yorum/Not sistemi</li>
                      <li>Sayfalama (10-20-50-100 kayıt)</li>
                      <li>Arama ve filtreleme</li>
                    </ul>
                  </div>
                </div>

                {/* Deals */}
                <div className="border-l-4 border-purple-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-lg">Fırsatlar</h3>
                  </div>
                  <p className="text-gray-700 mb-3">
                    Satış fırsatları yönetimi. Stage yönetimi, win probability takibi.
                  </p>
                  <div className="bg-gray-50 p-3 rounded space-y-2">
                    <p className="font-semibold text-sm">Özellikler:</p>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      <li>Stage yönetimi (LEAD, QUALIFIED, PROPOSAL, NEGOTIATION, WON, LOST)</li>
                      <li>Win probability takibi</li>
                      <li>Kanban board görünümü</li>
                      <li>Müşteri ile ilişkilendirme</li>
                      <li>Teklif oluşturma</li>
                    </ul>
                  </div>
                </div>

                {/* Quotes */}
                <div className="border-l-4 border-orange-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5 text-orange-600" />
                    <h3 className="font-semibold text-lg">Teklifler</h3>
                  </div>
                  <p className="text-gray-700 mb-3">
                    Teklif yönetimi. PDF oluşturma, revize sistemi, durum takibi.
                  </p>
                  <div className="bg-gray-50 p-3 rounded space-y-2">
                    <p className="font-semibold text-sm">Özellikler:</p>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      <li>Teklif oluşturma ve düzenleme</li>
                      <li>PDF oluşturma ve indirme</li>
                      <li>Durum yönetimi (DRAFT, SENT, ACCEPTED, REJECTED)</li>
                      <li>Revize sistemi</li>
                      <li>Fırsat ile ilişkilendirme</li>
                      <li>Teklif kabul edildiğinde otomatik fatura oluşturma</li>
                    </ul>
                  </div>
                </div>

                {/* Invoices */}
                <div className="border-l-4 border-red-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Receipt className="h-5 w-5 text-red-600" />
                    <h3 className="font-semibold text-lg">Faturalar</h3>
                  </div>
                  <p className="text-gray-700 mb-3">
                    Fatura yönetimi. PDF oluşturma, ödeme takibi, sevkiyat ilişkilendirme.
                  </p>
                  <div className="bg-gray-50 p-3 rounded space-y-2">
                    <p className="font-semibold text-sm">Özellikler:</p>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      <li>Fatura oluşturma (SALE/PURCHASE tipi)</li>
                      <li>PDF oluşturma ve indirme</li>
                      <li>Durum yönetimi (DRAFT, SENT, PAID, OVERDUE, CANCELLED)</li>
                      <li>Ödeme takibi</li>
                      <li>Sevkiyat ilişkilendirme</li>
                      <li>Fatura ödendiğinde otomatik finans kaydı oluşturma</li>
                    </ul>
                  </div>
                </div>

                {/* Products */}
                <div className="border-l-4 border-teal-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-5 w-5 text-teal-600" />
                    <h3 className="font-semibold text-lg">Ürünler</h3>
                  </div>
                  <p className="text-gray-700 mb-3">
                    Ürün kataloğu. Stok yönetimi, kategori, SKU yönetimi.
                  </p>
                  <div className="bg-gray-50 p-3 rounded space-y-2">
                    <p className="font-semibold text-sm">Özellikler:</p>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      <li>Ürün ekleme, düzenleme, silme</li>
                      <li>Stok yönetimi (stock, reservedQuantity, incomingQuantity)</li>
                      <li>Kategori yönetimi</li>
                      <li>SKU ve barcode yönetimi</li>
                      <li>Fiyat yönetimi</li>
                      <li>Stok hareketleri takibi</li>
                    </ul>
                  </div>
                </div>

                {/* Shipments */}
                <div className="border-l-4 border-cyan-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="h-5 w-5 text-cyan-600" />
                    <h3 className="font-semibold text-lg">Sevkiyatlar</h3>
                  </div>
                  <p className="text-gray-700 mb-3">
                    Satış sevkiyatları takibi. Onay sistemi, stok düşürme.
                  </p>
                  <div className="bg-gray-50 p-3 rounded space-y-2">
                    <p className="font-semibold text-sm">Özellikler:</p>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      <li>Sevkiyat oluşturma ve takibi</li>
                      <li>Durum yönetimi (PENDING, IN_TRANSIT, DELIVERED, CANCELLED)</li>
                      <li>Onay sistemi (onaylandığında stok düşer)</li>
                      <li>Fatura ile ilişkilendirme</li>
                      <li>Tracking numarası yönetimi</li>
                    </ul>
                  </div>
                </div>

                {/* Finance */}
                <div className="border-l-4 border-yellow-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingCart className="h-5 w-5 text-yellow-600" />
                    <h3 className="font-semibold text-lg">Finans</h3>
                  </div>
                  <p className="text-gray-700 mb-3">
                    Gelir-gider takibi. Kategori, döviz desteği.
                  </p>
                  <div className="bg-gray-50 p-3 rounded space-y-2">
                    <p className="font-semibold text-sm">Özellikler:</p>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      <li>Gelir/Gider kayıtları</li>
                      <li>Kategori yönetimi</li>
                      <li>Döviz desteği</li>
                      <li>Fatura ile ilişkilendirme</li>
                      <li>Raporlama</li>
                    </ul>
                  </div>
                </div>

                {/* Tasks */}
                <div className="border-l-4 border-pink-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckSquare className="h-5 w-5 text-pink-600" />
                    <h3 className="font-semibold text-lg">Görevler</h3>
                  </div>
                  <p className="text-gray-700 mb-3">
                    Görev yönetimi. Durum, öncelik, atama.
                  </p>
                  <div className="bg-gray-50 p-3 rounded space-y-2">
                    <p className="font-semibold text-sm">Özellikler:</p>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      <li>Görev oluşturma ve atama</li>
                      <li>Durum yönetimi (TODO, IN_PROGRESS, DONE, CANCELLED)</li>
                      <li>Öncelik yönetimi</li>
                      <li>Kullanıcı atama</li>
                    </ul>
                  </div>
                </div>

                {/* Meetings */}
                <div className="border-l-4 border-violet-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Video className="h-5 w-5 text-violet-600" />
                    <h3 className="font-semibold text-lg">Toplantılar</h3>
                  </div>
                  <p className="text-gray-700 mb-3">
                    Toplantı yönetimi. Video toplantı entegrasyonları, takvim entegrasyonu.
                  </p>
                  <div className="bg-gray-50 p-3 rounded space-y-2">
                    <p className="font-semibold text-sm">Özellikler:</p>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      <li>Toplantı oluşturma ve yönetimi</li>
                      <li>Zoom, Google Meet, Microsoft Teams entegrasyonu</li>
                      <li>Otomatik toplantı linki oluşturma</li>
                      <li>Google Calendar entegrasyonu</li>
                      <li>Toplantı katılımcıları yönetimi</li>
                      <li>Toplantı notları ve takibi</li>
                    </ul>
                  </div>
                </div>

                {/* Tickets */}
                <div className="border-l-4 border-rose-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-5 w-5 text-rose-600" />
                    <h3 className="font-semibold text-lg">Destek Talepleri</h3>
                  </div>
                  <p className="text-gray-700 mb-3">
                    Müşteri destek talepleri yönetimi. Durum takibi, atama sistemi.
                  </p>
                  <div className="bg-gray-50 p-3 rounded space-y-2">
                    <p className="font-semibold text-sm">Özellikler:</p>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      <li>Destek talebi oluşturma</li>
                      <li>Durum yönetimi (OPEN, IN_PROGRESS, RESOLVED, CLOSED)</li>
                      <li>Kullanıcı atama sistemi</li>
                      <li>Öncelik yönetimi</li>
                      <li>Müşteri ile ilişkilendirme</li>
                    </ul>
                  </div>
                </div>

                {/* Contracts */}
                <div className="border-l-4 border-amber-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5 text-amber-600" />
                    <h3 className="font-semibold text-lg">Sözleşmeler</h3>
                  </div>
                  <p className="text-gray-700 mb-3">
                    Sözleşme yönetimi. Otomatik oluşturma, yenileme takibi.
                  </p>
                  <div className="bg-gray-50 p-3 rounded space-y-2">
                    <p className="font-semibold text-sm">Özellikler:</p>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      <li>Sözleşme oluşturma ve yönetimi</li>
                      <li>Otomatik sözleşme oluşturma (Quote ACCEPTED)</li>
                      <li>Yenileme takibi</li>
                      <li>Fatura ve sevkiyat ile ilişkilendirme</li>
                      <li>Sözleşme durumu yönetimi</li>
                    </ul>
                  </div>
                </div>

                {/* Reports */}
                <div className="border-l-4 border-indigo-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-5 w-5 text-indigo-600" />
                    <h3 className="font-semibold text-lg">Raporlar</h3>
                  </div>
                  <p className="text-gray-700 mb-3">
                    Detaylı raporlar ve analitik. Filtreleme, export.
                  </p>
                  <div className="bg-gray-50 p-3 rounded space-y-2">
                    <p className="font-semibold text-sm">Özellikler:</p>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      <li>Müşteri raporları</li>
                      <li>Satış raporları</li>
                      <li>Finansal raporlar</li>
                      <li>Ürün raporları</li>
                      <li>Performans raporları</li>
                      <li>Excel, PDF, CSV export</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </TabsContent>

        {/* ÖZELLİKLER */}
        <TabsContent value="ozellikler" className="space-y-6">
          <section id="ozellikler">
            <Card>
              <CardHeader>
                <CardTitle>5. Özellikler</CardTitle>
                <CardDescription>Sistemin tüm özellikleri ve kullanımları</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">CRUD İşlemleri</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div>
                      <p className="font-semibold mb-1">Create (Oluşturma):</p>
                      <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1 ml-4">
                        <li>Liste sayfasında "+ Yeni" butonuna tıklayın</li>
                        <li>Form alanlarını doldurun</li>
                        <li>"Kaydet" butonuna tıklayın</li>
                        <li>Kayıt oluşturulur ve listede görünür</li>
                      </ol>
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Read (Okuma):</p>
                      <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1 ml-4">
                        <li>Liste sayfasında kayıtları görüntüleyin</li>
                        <li>Detay sayfasına gitmek için "Görüntüle" butonuna tıklayın</li>
                        <li>Kayıt bilgileri read-only olarak görüntülenir</li>
                      </ol>
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Update (Güncelleme):</p>
                      <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1 ml-4">
                        <li>Liste sayfasında "Düzenle" butonuna tıklayın</li>
                        <li>Form açılır ve mevcut bilgiler yüklenir</li>
                        <li>Değişiklikleri yapın</li>
                        <li>"Kaydet" butonuna tıklayın</li>
                        <li>Değişiklikler kaydedilir ve listede güncellenir</li>
                      </ol>
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Delete (Silme):</p>
                      <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1 ml-4">
                        <li>Liste sayfasında "Sil" butonuna tıklayın</li>
                        <li>Onay mesajı görüntülenir</li>
                        <li>Onaylarsanız kayıt silinir</li>
                        <li>Silinen kayıt listeden kaldırılır</li>
                      </ol>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Toplu İşlemler (Bulk Operations)</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 mb-2">
                      Birden fazla kaydı seçip toplu işlem yapabilirsiniz:
                    </p>
                    <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1 ml-4">
                      <li>Liste sayfasında kayıtların yanındaki checkbox'ları işaretleyin</li>
                      <li>Üstte "Toplu İşlemler" butonu görünür</li>
                      <li>"Toplu Sil" veya "Toplu Güncelle" seçeneklerinden birini seçin</li>
                      <li>İşlem tüm seçili kayıtlara uygulanır</li>
                    </ol>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Import/Export</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div>
                      <p className="font-semibold mb-1">Import (İçe Aktarma):</p>
                      <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1 ml-4">
                        <li>Liste sayfasında "İçe Aktar" butonuna tıklayın</li>
                        <li>Excel (.xlsx, .xls) veya CSV dosyası seçin</li>
                        <li>Dosya yüklenir ve veriler otomatik eşleştirilir</li>
                        <li>Geçersiz kayıtlar filtrelenir</li>
                        <li>Geçerli kayıtlar sisteme eklenir</li>
                      </ol>
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Export (Dışa Aktarma):</p>
                      <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1 ml-4">
                        <li>Liste sayfasında "Dışa Aktar" butonuna tıklayın</li>
                        <li>Format seçin (Excel, PDF, CSV)</li>
                        <li>Dosya indirilir</li>
                      </ol>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Dosya Ekleme</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1 ml-4">
                      <li>Detay sayfasında "Dosya Ekle" butonuna tıklayın</li>
                      <li>Dosya seçin (max 10MB)</li>
                      <li>Dosya Supabase Storage'a yüklenir</li>
                      <li>Yüklenen dosyalar detay sayfasında görüntülenir</li>
                      <li>Dosyaları görüntüleyebilir veya silebilirsiniz</li>
                    </ol>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Yorum/Not Sistemi</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1 ml-4">
                      <li>Detay sayfasında "Yorumlar" sekmesine gidin</li>
                      <li>Yorum alanına yazın</li>
                      <li>"Yorum Ekle" butonuna tıklayın</li>
                      <li>Yorum eklenir ve listede görünür</li>
                      <li>Yorum sahibi ve tarih bilgisi otomatik eklenir</li>
                    </ol>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">PDF Oluşturma</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1 ml-4">
                      <li>Teklif veya Fatura detay sayfasına gidin</li>
                      <li>"PDF İndir" butonuna tıklayın</li>
                      <li>PDF oluşturulur ve indirilir</li>
                      <li>PDF'de şirket logosu, müşteri bilgileri, ürün listesi, KDV hesaplama bulunur</li>
                    </ol>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Modül İlişkileri</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 mb-2">
                      Tüm modüller birbiriyle ilişkilendirilebilir. Örneğin:
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-4">
                      <li><strong>Görevler (Task):</strong> Müşteri, Fırsat, Teklif, Fatura, Sözleşme, Toplantı, Destek Talebi ile ilişkilendirilebilir</li>
                      <li><strong>Toplantılar (Meeting):</strong> Müşteri, Fırsat, Teklif, Fatura, Sözleşme, Destek Talebi ile ilişkilendirilebilir</li>
                      <li><strong>Finans (Finance):</strong> Fatura, Sevkiyat, Görev, Toplantı, Destek Talebi, Ürün, Fırsat, Teklif, Sözleşme ile ilişkilendirilebilir</li>
                      <li><strong>Dökümanlar (Document):</strong> Tüm modüllerle ilişkilendirilebilir</li>
                      <li><strong>Destek Talepleri (Ticket):</strong> Müşteri, Fırsat, Teklif, Fatura, Sözleşme, Toplantı, Ürün ile ilişkilendirilebilir</li>
                    </ul>
                    <p className="text-sm text-gray-700 mt-3">
                      Bu sayede her kayıt için ilgili tüm bilgilere tek yerden erişebilirsiniz.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </TabsContent>

        {/* ENTEGRASYONLAR */}
        <TabsContent value="entegrasyonlar" className="space-y-6">
          <section id="entegrasyonlar">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="h-5 w-5" />
                  6. Entegrasyonlar
                </CardTitle>
                <CardDescription>Video toplantılar, e-posta, SMS ve WhatsApp entegrasyonları</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Video Toplantı Entegrasyonları */}
                <div className="border-l-4 border-blue-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Video className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-lg">Video Toplantı Entegrasyonları</h3>
                  </div>
                  <p className="text-gray-700 mb-3">
                    Zoom, Google Meet ve Microsoft Teams ile entegrasyon. Toplantı linklerini otomatik oluşturun.
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div>
                      <p className="font-semibold mb-2">Zoom Entegrasyonu:</p>
                      <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1 ml-4">
                        <li>SuperAdmin {'>'} Entegrasyonlar {'>'} Video Toplantılar sekmesine gidin</li>
                        <li>Zoom Account ID, Client ID ve Client Secret bilgilerini girin</li>
                        <li>Toplantı oluştururken "Toplantı Tipi" olarak "Zoom" seçin</li>
                        <li>"Otomatik Oluştur" butonuna tıklayın</li>
                        <li>Toplantı linki ve şifre otomatik oluşturulur</li>
                      </ol>
                    </div>
                    <div>
                      <p className="font-semibold mb-2">Google Meet Entegrasyonu:</p>
                      <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1 ml-4">
                        <li>SuperAdmin {'>'} Entegrasyonlar {'>'} Google Calendar sekmesine gidin</li>
                        <li>Google Calendar Client ID ve Client Secret bilgilerini girin</li>
                        <li>Kullanıcı Entegrasyonları sayfasından Google hesabınızı bağlayın</li>
                        <li>Toplantı oluştururken "Google Meet" seçin</li>
                        <li>Toplantı otomatik olarak Google Calendar'a eklenir</li>
                      </ol>
                    </div>
                    <div>
                      <p className="font-semibold mb-2">Microsoft Teams Entegrasyonu:</p>
                      <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1 ml-4">
                        <li>SuperAdmin {'>'} Entegrasyonlar {'>'} Video Toplantılar sekmesine gidin</li>
                        <li>Microsoft Teams entegrasyonunu aktifleştirin</li>
                        <li>Kullanıcı Entegrasyonları sayfasından Microsoft hesabınızı bağlayın</li>
                        <li>Toplantı oluştururken "Teams" seçin</li>
                        <li>Toplantı linki otomatik oluşturulur</li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* E-posta Entegrasyonu */}
                <div className="border-l-4 border-green-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-lg">E-posta Entegrasyonu (Resend)</h3>
                  </div>
                  <p className="text-gray-700 mb-3">
                    Resend ile e-posta gönderimi. Müşterilere doğrudan e-posta gönderebilirsiniz.
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1 ml-4">
                        <li>SuperAdmin {'>'} Entegrasyonlar {'>'} Email sekmesine gidin</li>
                      <li>Resend API Key'i girin (Resend.com'dan alabilirsiniz)</li>
                      <li>Müşteri detay sayfasında "E-posta Gönder" butonuna tıklayın</li>
                      <li>Konu ve içerik girip gönderin</li>
                      <li>E-posta müşteriye otomatik gönderilir</li>
                    </ol>
                    <p className="text-sm text-gray-700 mt-3 font-semibold">
                      Ücretsiz Limit: Ayda 3,000 e-posta (kredi kartı gerekmez)
                    </p>
                  </div>
                </div>

                {/* SMS ve WhatsApp Entegrasyonu */}
                <div className="border-l-4 border-purple-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-lg">SMS ve WhatsApp Entegrasyonu (Twilio)</h3>
                  </div>
                  <p className="text-gray-700 mb-3">
                    Twilio ile SMS ve WhatsApp gönderimi. Müşterilere doğrudan mesaj gönderebilirsiniz.
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div>
                      <p className="font-semibold mb-2">SMS Entegrasyonu:</p>
                      <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1 ml-4">
                        <li>SuperAdmin {'>'} Entegrasyonlar {'>'} SMS sekmesine gidin</li>
                        <li>Twilio Account SID, Auth Token ve Telefon Numarası bilgilerini girin</li>
                        <li>Müşteri detay sayfasında "SMS Gönder" butonuna tıklayın</li>
                        <li>Mesaj girip gönderin</li>
                      </ol>
                      <p className="text-sm text-gray-700 mt-2 font-semibold">
                        Ücretsiz Trial: $15.50 kredi (yaklaşık 1,000 SMS)
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold mb-2">WhatsApp Entegrasyonu:</p>
                      <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1 ml-4">
                        <li>SuperAdmin {'>'} Entegrasyonlar {'>'} WhatsApp sekmesine gidin</li>
                        <li>Twilio Account SID, Auth Token ve WhatsApp Numarası bilgilerini girin</li>
                        <li>Müşteri detay sayfasında "WhatsApp Gönder" butonuna tıklayın</li>
                        <li>Mesaj girip gönderin</li>
                      </ol>
                      <p className="text-sm text-gray-700 mt-2 font-semibold">
                        Ücretsiz Sandbox: Sınırsız mesaj (sadece kayıtlı numaralara)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Google Calendar Entegrasyonu */}
                <div className="border-l-4 border-orange-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-5 w-5 text-orange-600" />
                    <h3 className="font-semibold text-lg">Google Calendar Entegrasyonu</h3>
                  </div>
                  <p className="text-gray-700 mb-3">
                    Toplantılarınızı otomatik olarak Google Calendar'a ekleyin.
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1 ml-4">
                      <li>SuperAdmin {'>'} Entegrasyonlar {'>'} Google Calendar sekmesine gidin</li>
                      <li>Google Calendar Client ID ve Client Secret bilgilerini girin</li>
                      <li>Kullanıcı Entegrasyonları sayfasından Google hesabınızı bağlayın</li>
                      <li>Toplantı oluşturduğunuzda otomatik olarak Google Calendar'a eklenir</li>
                      <li>Toplantı linki ve şifre açıklamada yer alır</li>
                    </ol>
                    <p className="text-sm text-gray-700 mt-3 font-semibold">
                      Tamamen Ücretsiz: Sınırsız kullanım
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </TabsContent>

        {/* İPUÇLARI VE PÜF NOKTALARI */}
        <TabsContent value="ipuclari" className="space-y-6">
          {/* Hızlı Başlangıç */}
          <section id="hizli-baslangic">
            <Card className="border-l-4 border-indigo-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-indigo-600" />
                  Hızlı Başlangıç (5 Dakikada Başlayın)
                </CardTitle>
                <CardDescription>İlk kez kullanıyorsanız bu rehberi takip edin</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-200">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-sm">1</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 mb-1">Hesabınıza Giriş Yapın</h4>
                        <p className="text-sm text-gray-700">E-posta ve şifrenizle sisteme giriş yapın. İlk girişte Dashboard'a yönlendirilirsiniz.</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-white font-bold text-sm">2</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 mb-1">İlk Müşterinizi Ekleyin</h4>
                        <p className="text-sm text-gray-700">Müşteriler {'>'} Yeni Müşteri {'>'} İsim, e-posta ve telefon bilgilerini girin {'>'} Kaydet</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-pink-50 to-orange-50 p-4 rounded-lg border border-pink-200">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-600 text-white font-bold text-sm">3</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 mb-1">İlk Fırsatınızı Oluşturun</h4>
                        <p className="text-sm text-gray-700">Fırsatlar {'>'} Yeni Fırsat {'>'} Müşteriyi seçin {'>'} Başlık ve değer girin {'>'} Kaydet</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-4 rounded-lg border border-orange-200">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-600 text-white font-bold text-sm">4</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 mb-1">Dashboard'u Keşfedin</h4>
                        <p className="text-sm text-gray-700">Dashboard sayfasında KPI'ları, grafikleri ve son aktiviteleri görüntüleyin.</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-yellow-50 to-green-50 p-4 rounded-lg border border-yellow-200">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-600 text-white font-bold text-sm">5</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 mb-1">İlk Teklifinizi Hazırlayın</h4>
                        <p className="text-sm text-gray-700">Teklifler {'>'} Yeni Teklif {'>'} Fırsatı seçin {'>'} Ürünler ekleyin {'>'} Gönderin</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section id="ipuclari">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  8. İpuçları ve Püf Noktaları
                </CardTitle>
                <CardDescription>Sistemi daha verimli kullanmak için ipuçları ve best practices</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Hızlı İşlemler */}
                <div className="border-l-4 border-indigo-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Keyboard className="h-5 w-5 text-indigo-600" />
                    <h3 className="font-semibold text-lg">Hızlı İşlemler</h3>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p className="text-sm text-gray-700 font-semibold mb-2">Klavye Kısayolları:</p>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-4">
                      <li><strong>Ctrl + K:</strong> Global arama (yakında)</li>
                      <li><strong>Ctrl + N:</strong> Yeni kayıt oluştur (yakında)</li>
                      <li><strong>Esc:</strong> Modal'ı kapat</li>
                      <li><strong>Enter:</strong> Form gönder</li>
                    </ul>
                    <p className="text-sm text-gray-700 font-semibold mt-3 mb-2">Hızlı Erişim:</p>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-4">
                      <li>Detay sayfalarında "Hızlı İşlemler" butonlarını kullanın</li>
                      <li>Müşteri detay sayfasından direkt teklif, görev veya toplantı oluşturabilirsiniz</li>
                      <li>Kanban board'larda drag & drop ile hızlı durum değişikliği yapabilirsiniz</li>
                    </ul>
                  </div>
                </div>

                {/* Verimlilik İpuçları */}
                <div className="border-l-4 border-green-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-lg">Verimlilik İpuçları</h3>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div>
                      <p className="font-semibold mb-2 text-sm text-gray-800">1. Toplu İşlemler:</p>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-4">
                        <li>Birden fazla kaydı seçip toplu silme veya güncelleme yapabilirsiniz</li>
                        <li>Excel'den toplu import yaparak zaman kazanın</li>
                        <li>Filtreleme ile istediğiniz kayıtları bulup toplu işlem yapın</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold mb-2 text-sm text-gray-800">2. Modül İlişkileri:</p>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-4">
                        <li>Görevleri müşteri, fırsat veya teklif ile ilişkilendirin - tek yerden tüm bilgilere erişin</li>
                        <li>Toplantıları ilgili kayıtlarla bağlayın - geçmiş görüşmeleri kolayca bulun</li>
                        <li>Dökümanları tüm modüllerle ilişkilendirin - merkezi dokümantasyon</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold mb-2 text-sm text-gray-800">3. Otomasyonları Kullanın:</p>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-4">
                        <li>Teklif kabul edildiğinde otomatik fatura oluşur - manuel işlem yapmayın</li>
                        <li>Fatura ödendiğinde otomatik finans kaydı oluşur</li>
                        <li>İş akışı şemalarını takip edin - sistem sizi yönlendirir</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Sık Yapılan Hatalar */}
                <div className="border-l-4 border-red-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <h3 className="font-semibold text-lg">Sık Yapılan Hatalar ve Çözümleri</h3>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div>
                      <p className="font-semibold mb-2 text-sm text-red-800">❌ Hata: Teklif göndermek için en az 1 ürün eklenmeli</p>
                      <p className="text-sm text-gray-700 ml-4">
                        ✅ <strong>Çözüm:</strong> Teklif detay sayfasına gidin, "Ürün Ekle" butonuna tıklayın ve en az 1 ürün ekleyin.
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold mb-2 text-sm text-red-800">❌ Hata: Fırsat kazanmak için değer (value) girmelisiniz</p>
                      <p className="text-sm text-gray-700 ml-4">
                        ✅ <strong>Çözüm:</strong> Deal'i düzenleyin, "Değer" alanına tutarı girin ve kaydedin. Sonra WON yapabilirsiniz.
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold mb-2 text-sm text-red-800">❌ Hata: Görevi başlatmak için önce bir kullanıcıya atamanız gerekiyor</p>
                      <p className="text-sm text-gray-700 ml-4">
                        ✅ <strong>Çözüm:</strong> Task'ı düzenleyin, "Atanan Kullanıcı" alanından bir kullanıcı seçin ve kaydedin.
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold mb-2 text-sm text-red-800">❌ Hata: LEAD aşamasından direkt WON yapılamaz</p>
                      <p className="text-sm text-gray-700 ml-4">
                        ✅ <strong>Çözüm:</strong> İş akışını takip edin: LEAD → CONTACTED → PROPOSAL → NEGOTIATION → WON. Her adımı sırayla tamamlayın.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Best Practices */}
                <div className="border-l-4 border-blue-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-lg">Best Practices (En İyi Uygulamalar)</h3>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div>
                      <p className="font-semibold mb-2 text-sm text-gray-800">✅ Deal Yönetimi:</p>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-4">
                        <li>Deal oluştururken müşteriyi hemen seçin</li>
                        <li>Stage'leri sırayla ilerletin (atlama yapmayın)</li>
                        <li>WON yapmadan önce mutlaka değer (value) girin</li>
                        <li>LOST yaparken kayıp sebebini (lostReason) mutlaka yazın</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold mb-2 text-sm text-gray-800">✅ Quote Yönetimi:</p>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-4">
                        <li>Ürün eklemeden SENT yapmayın</li>
                        <li>Müşteri seçmeyi unutmayın</li>
                        <li>Quote ACCEPTED olduktan sonra otomatik oluşan Invoice'u kontrol edin</li>
                        <li>ACCEPTED sonrası Quote'u düzenlemeyin (immutable)</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold mb-2 text-sm text-gray-800">✅ Invoice Yönetimi:</p>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-4">
                        <li>Fatura numarasını mutlaka girin</li>
                        <li>PAID yapmadan önce ödeme tarihini kontrol edin</li>
                        <li>PAID sonrası faturayı değiştirmeyin (immutable)</li>
                        <li>Ödeme geldiğinde hemen PAID yapın - otomatik finans kaydı oluşur</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold mb-2 text-sm text-gray-800">✅ Genel:</p>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-4">
                        <li>Her kayıt için açıklayıcı başlık ve notlar kullanın</li>
                        <li>İlgili kayıtları birbiriyle ilişkilendirin</li>
                        <li>Düzenli olarak raporları kontrol edin</li>
                        <li>Dashboard'u günlük olarak takip edin</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Performans İpuçları */}
                <div className="border-l-4 border-cyan-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-cyan-600" />
                    <h3 className="font-semibold text-lg">Performans İpuçları</h3>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p className="text-sm text-gray-700 font-semibold mb-2">Sistemi Daha Hızlı Kullanmak İçin:</p>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-4">
                      <li><strong>Filtreleme kullanın:</strong> Arama ve filtrelerle istediğiniz kayıtları hızlıca bulun</li>
                      <li><strong>Sayfalama:</strong> Büyük listelerde sayfalama kullanarak performansı artırın</li>
                      <li><strong>Cache:</strong> Sistem otomatik cache kullanır - aynı sayfaya tekrar geldiğinizde hızlı yüklenir</li>
                      <li><strong>Debounced Search:</strong> Arama yaparken yazmayı bitirdikten sonra otomatik arama yapılır</li>
                      <li><strong>Optimistic Updates:</strong> Kayıt ekleme/düzenleme işlemleri anında görünür - beklemenize gerek yok</li>
                    </ul>
                  </div>
                </div>

                {/* Güvenlik İpuçları */}
                <div className="border-l-4 border-emerald-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-5 w-5 text-emerald-600" />
                    <h3 className="font-semibold text-lg">Güvenlik İpuçları</h3>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-4">
                      <li><strong>Şifre Güvenliği:</strong> Güçlü şifre kullanın ve düzenli olarak değiştirin</li>
                      <li><strong>Oturum Yönetimi:</strong> İşiniz bitince çıkış yapın, özellikle paylaşımlı bilgisayarlarda</li>
                      <li><strong>Yetki Kontrolü:</strong> Her kullanıcının sadece yetkili olduğu modüllere erişebildiğini bilin</li>
                      <li><strong>Veri Gizliliği:</strong> Hassas bilgileri paylaşırken dikkatli olun</li>
                      <li><strong>Multi-Tenant:</strong> Sistem otomatik olarak şirket verilerini izole eder - başka şirket verilerini göremezsiniz</li>
                    </ul>
                  </div>
                </div>

                {/* Mobil Kullanım */}
                <div className="border-l-4 border-teal-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="h-5 w-5 text-teal-600" />
                    <h3 className="font-semibold text-lg">Mobil Kullanım</h3>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p className="text-sm text-gray-700 mb-2">Sistemi mobil cihazlarda kullanırken:</p>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-4">
                      <li>Tüm sayfalar mobil uyumludur - responsive tasarım</li>
                      <li>Touch-friendly butonlar - kolay dokunma için optimize edilmiş</li>
                      <li>Hamburger menü - mobilde sidebar yerine hamburger menü kullanılır</li>
                      <li>Kanban board'lar mobilde scrollable - kaydırarak görüntüleyebilirsiniz</li>
                      <li>Form'lar mobilde tek sütun - kolay doldurma</li>
                    </ul>
                  </div>
                </div>

                {/* Raporlama Rehberi */}
                <div className="border-l-4 border-violet-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-5 w-5 text-violet-600" />
                    <h3 className="font-semibold text-lg">Raporlama Rehberi</h3>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div>
                      <p className="font-semibold mb-2 text-sm text-gray-800">Rapor Oluşturma:</p>
                      <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1 ml-4">
                        <li>Raporlar sayfasına gidin</li>
                        <li>Rapor tipini seçin (Müşteri, Satış, Finansal, Ürün, Performans)</li>
                        <li>Filtreleri ayarlayın (Tarih, Kullanıcı, Firma, Modül)</li>
                        <li>Raporu görüntüleyin veya export edin</li>
                      </ol>
                    </div>
                    <div>
                      <p className="font-semibold mb-2 text-sm text-gray-800">Export Seçenekleri:</p>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-4">
                        <li><strong>Excel (.xlsx):</strong> Detaylı veri analizi için</li>
                        <li><strong>PDF:</strong> Sunum ve paylaşım için</li>
                        <li><strong>CSV:</strong> Veri import/export için</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold mb-2 text-sm text-gray-800">Filtreleme Stratejileri:</p>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-4">
                        <li>Tarih aralığı seçerek belirli dönemleri analiz edin</li>
                        <li>Kullanıcı filtresi ile kişi bazlı performans görün</li>
                        <li>Modül filtresi ile belirli modüllere odaklanın</li>
                        <li>Birden fazla filtreyi kombinleyerek detaylı analiz yapın</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Örnek Senaryolar */}
          <section id="ornek-senaryolar">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlayCircle className="h-5 w-5" />
                  9. Örnek Senaryolar
                </CardTitle>
                <CardDescription>Gerçek hayat senaryoları ve adım adım çözümler</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Senaryo 1 */}
                <Card className="border-l-4 border-indigo-500">
                  <CardHeader>
                    <CardTitle className="text-base">Senaryo 1: Yeni Müşteri → Satış Süreci</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">1</div>
                        <div>
                          <p className="font-semibold text-sm text-gray-800">Müşteri Oluştur</p>
                          <p className="text-sm text-gray-700">Müşteriler {'>'} Yeni Müşteri {'>'} İsim, e-posta, telefon bilgilerini girin {'>'} Kaydet</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">2</div>
                        <div>
                          <p className="font-semibold text-sm text-gray-800">Fırsat Oluştur</p>
                          <p className="text-sm text-gray-700">Fırsatlar {'>'} Yeni Fırsat {'>'} Müşteriyi seçin {'>'} Başlık ve değer girin {'>'} Stage: LEAD {'>'} Kaydet</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">3</div>
                        <div>
                          <p className="font-semibold text-sm text-gray-800">İletişime Geç</p>
                          <p className="text-sm text-gray-700">Fırsat detay sayfası {'>'} Stage'i CONTACTED yapın {'>'} Sistem bildirim gönderir</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">4</div>
                        <div>
                          <p className="font-semibold text-sm text-gray-800">Teklif Hazırla</p>
                          <p className="text-sm text-gray-700">Teklifler {'>'} Yeni Teklif {'>'} Fırsatı seçin {'>'} Ürünler ekleyin {'>'} SENT yapın</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">5</div>
                        <div>
                          <p className="font-semibold text-sm text-gray-800">Teklifi Kabul Et</p>
                          <p className="text-sm text-gray-700">Teklif detay sayfası {'>'} ACCEPTED yapın {'>'} Otomatik Invoice ve Contract oluşur!</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Senaryo 2 */}
                <Card className="border-l-4 border-green-500">
                  <CardHeader>
                    <CardTitle className="text-base">Senaryo 2: Toplantı Planlama ve Takip</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-700 text-xs font-semibold">1</div>
                        <div>
                          <p className="font-semibold text-sm text-gray-800">Toplantı Oluştur</p>
                          <p className="text-sm text-gray-700">Toplantılar {'>'} Yeni Toplantı {'>'} Müşteri ve tarih seçin</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-700 text-xs font-semibold">2</div>
                        <div>
                          <p className="font-semibold text-sm text-gray-800">Video Toplantı Linki Oluştur</p>
                          <p className="text-sm text-gray-700">Toplantı Tipi: Zoom/Google Meet/Teams seçin {'>'} "Otomatik Oluştur" tıklayın {'>'} Link oluşturulur</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-700 text-xs font-semibold">3</div>
                        <div>
                          <p className="font-semibold text-sm text-gray-800">Toplantı Linkini Gönder</p>
                          <p className="text-sm text-gray-700">Toplantı detay sayfası {'>'} "Toplantı Linki Gönder" {'>'} E-posta veya WhatsApp seçin {'>'} Gönder</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-700 text-xs font-semibold">4</div>
                        <div>
                          <p className="font-semibold text-sm text-gray-800">Google Calendar'a Ekle</p>
                          <p className="text-sm text-gray-700">Google Calendar entegrasyonu aktifse otomatik eklenir. Calendar'ınızı kontrol edin!</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Senaryo 3 */}
                <Card className="border-l-4 border-purple-500">
                  <CardHeader>
                    <CardTitle className="text-base">Senaryo 3: Fatura ve Ödeme Takibi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">1</div>
                        <div>
                          <p className="font-semibold text-sm text-gray-800">Fatura Oluştur</p>
                          <p className="text-sm text-gray-700">Faturalar {'>'} Yeni Fatura {'>'} Tekliften oluştur veya manuel oluştur {'>'} Ürünler ekle {'>'} Fatura numarası ver</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">2</div>
                        <div>
                          <p className="font-semibold text-sm text-gray-800">Faturayı Gönder</p>
                          <p className="text-sm text-gray-700">Fatura detay sayfası {'>'} SENT yapın {'>'} Müşteriye PDF gönderin (E-posta entegrasyonu ile)</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">3</div>
                        <div>
                          <p className="font-semibold text-sm text-gray-800">Ödeme Geldiğinde</p>
                          <p className="text-sm text-gray-700">Fatura detay sayfası {'>'} PAID yapın {'>'} Ödeme tarihini girin {'>'} Otomatik Finance kaydı oluşur!</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">4</div>
                        <div>
                          <p className="font-semibold text-sm text-gray-800">Finans Takibi</p>
                          <p className="text-sm text-gray-700">Finans sayfasından otomatik oluşan kaydı görüntüleyin. Raporlardan gelir analizi yapın.</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </section>
        </TabsContent>

        {/* TEKNİK */}
        <TabsContent value="teknik" className="space-y-6">
          <section id="veri-akisi">
            <Card>
              <CardHeader>
                <CardTitle>4. Veri Akışı ve İlişkiler</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Satış Akışı</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 mb-2 font-semibold">Akış Sırası:</p>
                    <p className="text-sm text-gray-700">Customer → Deal → Quote → Invoice → Shipment</p>
                    <p className="text-sm text-gray-700 mt-3">
                      <strong>1. Customer (Müşteri):</strong> Müşteri bilgileri oluşturulur
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>2. Deal (Fırsat):</strong> Müşteri için satış fırsatı oluşturulur
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>3. Quote (Teklif):</strong> Fırsat için teklif hazırlanır
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>4. Invoice (Fatura):</strong> Teklif kabul edildiğinde otomatik fatura oluşturulur
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>5. Shipment (Sevkiyat):</strong> Fatura için sevkiyat oluşturulur ve onaylandığında stok düşer
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Stok Akışı</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 mb-2 font-semibold">Satış Stok Akışı:</p>
                    <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1 ml-4">
                      <li>InvoiceItem oluşturulduğunda → Product.reservedQuantity artar (stok düşmez)</li>
                      <li>Shipment onaylandığında → Product.stock düşer + Product.reservedQuantity azalır + StockMovement oluştur</li>
                    </ol>
                    <p className="text-sm text-gray-700 mt-3 mb-2 font-semibold">Alış Stok Akışı:</p>
                    <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1 ml-4">
                      <li>InvoiceItem oluşturulduğunda (PURCHASE) → Product.incomingQuantity artar (stok artmaz)</li>
                      <li>PurchaseTransaction onaylandığında → Product.stock artar + Product.incomingQuantity azalır + StockMovement oluştur</li>
                    </ol>
                  </div>
                </div>

                {/* Otomasyonlar - Accordion */}
                <div>
                  <Card className="border-indigo-200/70 bg-indigo-50/40 shadow-sm">
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="basic-automations" className="border-none">
                        <AccordionTrigger className="px-4 py-3 hover:no-underline data-[state=closed]:bg-indigo-100/40 data-[state=open]:bg-white/80">
                          <div className="flex items-center gap-3 text-left">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500/40">
                              <Zap className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-indigo-900">Temel Otomasyonlar</p>
                              <p className="text-xs text-indigo-700">Otomatik işlemleri görmek için tıklayın</p>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="space-y-2 bg-white/90 rounded-lg p-3 border border-indigo-200">
                            <p className="text-sm text-gray-700">
                              <strong className="text-indigo-800">Quote ACCEPTED:</strong> Otomatik Invoice oluştur + ActivityLog
                            </p>
                            <p className="text-sm text-gray-700">
                              <strong className="text-indigo-800">Invoice PAID:</strong> Otomatik Finance kaydı oluştur + ActivityLog
                            </p>
                            <p className="text-sm text-gray-700">
                              <strong className="text-indigo-800">Shipment DELIVERED:</strong> ActivityLog yaz
                            </p>
                            <p className="text-sm text-gray-700">
                              <strong className="text-indigo-800">Tüm CRUD:</strong> ActivityLog'a meta JSON ile kaydet
                            </p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </Card>
                </div>

                {/* İş Akışı Otomasyonları - Accordion */}
                <div>
                  <Card className="border-purple-200/70 bg-purple-50/40 shadow-sm">
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="workflow-automations" className="border-none">
                        <AccordionTrigger className="px-4 py-3 hover:no-underline data-[state=closed]:bg-purple-100/40 data-[state=open]:bg-white/80">
                          <div className="flex items-center gap-3 text-left">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-purple-700 ring-2 ring-purple-500/40">
                              <Zap className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-purple-900">İş Akışı Otomasyonları</p>
                              <p className="text-xs text-purple-700">Detaylı iş akışlarını görmek için tıklayın</p>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="space-y-4 bg-white/90 rounded-lg p-4 border border-purple-200">
                            <div className="border-l-4 border-indigo-500 pl-3">
                              <p className="font-semibold mb-2 text-sm text-gray-800">Fırsat (Deal) İş Akışı:</p>
                              <p className="text-sm text-gray-700 mb-2">Akış Sırası: LEAD → CONTACTED → PROPOSAL → NEGOTIATION → WON/LOST</p>
                              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-2">
                                <li><strong>WON:</strong> Otomatik Contract DRAFT oluşturulur</li>
                                <li><strong>LOST:</strong> Kayıp sebebi (lostReason) zorunlu</li>
                                <li>Her aşama değişiminde bildirim gönderilir</li>
                              </ul>
                            </div>
                            <div className="border-l-4 border-orange-500 pl-3">
                              <p className="font-semibold mb-2 text-sm text-gray-800">Teklif (Quote) İş Akışı:</p>
                              <p className="text-sm text-gray-700 mb-2">Akış Sırası: DRAFT → SENT → ACCEPTED/REJECTED</p>
                              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-2">
                                <li><strong>ACCEPTED:</strong> Otomatik Invoice DRAFT + Contract DRAFT oluşturulur</li>
                                <li><strong>REJECTED:</strong> Revizyon görevi otomatik oluşturulur</li>
                                <li>SENT için en az 1 ürün, müşteri ve toplam tutar zorunlu</li>
                              </ul>
                            </div>
                            <div className="border-l-4 border-red-500 pl-3">
                              <p className="font-semibold mb-2 text-sm text-gray-800">Fatura (Invoice) İş Akışı:</p>
                              <p className="text-sm text-gray-700 mb-2">Akış Sırası: DRAFT → SENT → PAID</p>
                              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-2">
                                <li><strong>PAID:</strong> Otomatik Finance INCOME kaydı oluşturulur</li>
                                <li><strong>PAID:</strong> Fatura değiştirilemez (immutable)</li>
                                <li>SENT için en az 1 ürün, müşteri ve fatura numarası zorunlu</li>
                              </ul>
                            </div>
                            <div className="border-l-4 border-amber-500 pl-3">
                              <p className="font-semibold mb-2 text-sm text-gray-800">Sözleşme (Contract) İş Akışı:</p>
                              <p className="text-sm text-gray-700 mb-2">Akış Sırası: DRAFT → ACTIVE</p>
                              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-2">
                                <li><strong>ACTIVE:</strong> Otomatik Invoice oluşturulur</li>
                                <li><strong>ACTIVE:</strong> Sözleşme değiştirilemez (immutable)</li>
                                <li>ACTIVE için müşteri, tarihler, değer ve sözleşme numarası zorunlu</li>
                              </ul>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </Card>
                </div>

                {/* Otomatik Bildirimler - Accordion */}
                <div>
                  <Card className="border-pink-200/70 bg-pink-50/40 shadow-sm">
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="notifications" className="border-none">
                        <AccordionTrigger className="px-4 py-3 hover:no-underline data-[state=closed]:bg-pink-100/40 data-[state=open]:bg-white/80">
                          <div className="flex items-center gap-3 text-left">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-100 text-pink-700 ring-2 ring-pink-500/40">
                              <Zap className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-pink-900">Otomatik Bildirimler ve Yönlendirmeler</p>
                              <p className="text-xs text-pink-700">Bildirim sistemini görmek için tıklayın</p>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="bg-white/90 rounded-lg p-4 border border-pink-200 space-y-2">
                            <p className="text-sm text-gray-700">
                              Sistem, her aşama değişiminde otomatik bildirimler gönderir:
                            </p>
                            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-4">
                              <li><strong className="text-pink-800">Sonraki adım önerisi:</strong> Bir sonraki yapılması gereken işlem önerilir</li>
                              <li><strong className="text-pink-800">Tebrikler mesajı:</strong> Başarılı işlemler için kutlama mesajı</li>
                              <li><strong className="text-pink-800">Uyarı mesajı:</strong> Eksik bilgiler veya hatalar için uyarı</li>
                              <li><strong className="text-pink-800">Yönlendirme linki:</strong> İlgili sayfaya direkt yönlendirme butonu</li>
                            </ul>
                            <p className="text-sm text-gray-700 mt-3">
                              Detay sayfalarında görsel iş akışı şemaları ile nerede olduğunuzu görebilirsiniz.
                            </p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </section>

          <section id="sik-sorulan-sorular">
            <Card>
              <CardHeader>
                <CardTitle>9. Sık Sorulan Sorular</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">S: Stok nasıl yönetilir?</h3>
                  <p className="text-sm text-gray-700">
                    C: Stok yönetimi otomatiktir. Satış faturası oluşturulduğunda rezerve edilir, sevkiyat onaylandığında stok düşer. 
                    Alış faturası onaylandığında stok artar.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">S: Teklif nasıl faturaya dönüşür?</h3>
                  <p className="text-sm text-gray-700">
                    C: Teklif durumu "ACCEPTED" yapıldığında otomatik olarak fatura oluşturulur.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">S: Kim ne yapabilir?</h3>
                  <p className="text-sm text-gray-700">
                    C: SUPER_ADMIN tüm yetkilere sahiptir. ADMIN kendi şirketi için tüm yetkilere sahiptir. 
                    SALES satış işlemleri yapabilir. USER sınırlı yetkilere sahiptir.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">S: Veriler nerede saklanır?</h3>
                  <p className="text-sm text-gray-700">
                    C: Tüm veriler Supabase (PostgreSQL) veritabanında saklanır. Dosyalar Supabase Storage'da saklanır.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">S: Video toplantı linki nasıl oluşturulur?</h3>
                  <p className="text-sm text-gray-700">
                    C: Toplantı oluştururken "Toplantı Tipi" seçin (Zoom, Google Meet veya Teams) ve "Otomatik Oluştur" butonuna tıklayın. 
                    Link otomatik oluşturulur ve toplantı bilgilerine eklenir.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">S: Müşteriye nasıl e-posta gönderirim?</h3>
                  <p className="text-sm text-gray-700">
                    C: Müşteri detay sayfasında "E-posta Gönder" butonuna tıklayın. Resend entegrasyonu aktifse doğrudan gönderebilirsiniz. 
                    Ücretsiz limit: Ayda 3,000 e-posta.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">S: Otomatik iş akışları nasıl çalışır?</h3>
                  <p className="text-sm text-gray-700">
                    C: Sistem, belirli durum değişikliklerinde otomatik işlemler yapar. Örneğin, teklif kabul edildiğinde otomatik fatura oluşturulur. 
                    Detay sayfalarında "Otomasyon Bilgileri" bölümünden hangi otomasyonların aktif olduğunu görebilirsiniz.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">S: Modüller arası ilişkiler nasıl çalışır?</h3>
                  <p className="text-sm text-gray-700">
                    C: Tüm modüller birbiriyle ilişkilendirilebilir. Örneğin, bir görevi müşteri, fırsat, teklif veya fatura ile ilişkilendirebilirsiniz. 
                    Bu sayede ilgili tüm bilgilere tek yerden erişebilirsiniz.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">S: Hızlı işlemler için ne yapabilirim?</h3>
                  <p className="text-sm text-gray-700">
                    C: Detay sayfalarındaki "Hızlı İşlemler" butonlarını kullanın. Müşteri detay sayfasından direkt teklif, görev veya toplantı oluşturabilirsiniz. 
                    Kanban board'larda drag & drop ile hızlı durum değişikliği yapabilirsiniz.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">S: Toplu işlem nasıl yapılır?</h3>
                  <p className="text-sm text-gray-700">
                    C: Liste sayfasında kayıtların yanındaki checkbox'ları işaretleyin. Üstte "Toplu İşlemler" butonu görünür. 
                    Toplu silme veya güncelleme yapabilirsiniz. Excel'den toplu import da yapabilirsiniz.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">S: İş akışı şemaları nerede görünür?</h3>
                  <p className="text-sm text-gray-700">
                    C: Deal, Quote, Invoice ve Contract detay sayfalarında görsel iş akışı şemaları bulunur. 
                    Nerede olduğunuzu, sonraki adımı ve gereklilikleri görebilirsiniz.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  )
}

