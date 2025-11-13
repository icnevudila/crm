'use client'

/* eslint-disable react/no-unescaped-entities */

import React, { useState } from 'react'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { Download, BookOpen, Users, Shield, Building2, FileText, Package, Truck, ShoppingCart, BarChart3, CheckSquare, HelpCircle, Calendar, Briefcase, Receipt, Store, Activity, UserCog, Settings, Crown, Info, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
      alert('PDF oluşturulurken bir hata oluştu:\n\n' + (error?.message || 'Bilinmeyen hata'))
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
            <a href="#raporlar" className="text-indigo-600 hover:underline">6. Raporlar ve Analitik</a>
            <a href="#sik-sorulan-sorular" className="text-indigo-600 hover:underline">7. Sık Sorulan Sorular</a>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="genel" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="genel">Genel</TabsTrigger>
          <TabsTrigger value="moduller">Modüller</TabsTrigger>
          <TabsTrigger value="ozellikler">Özellikler</TabsTrigger>
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

                <div>
                  <h3 className="font-semibold text-lg mb-2">Otomasyonlar</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p className="text-sm text-gray-700">
                      <strong>Quote ACCEPTED:</strong> Otomatik Invoice oluştur + ActivityLog
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Invoice PAID:</strong> Otomatik Finance kaydı oluştur + ActivityLog
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Shipment DELIVERED:</strong> ActivityLog yaz
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Tüm CRUD:</strong> ActivityLog'a meta JSON ile kaydet
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section id="sik-sorulan-sorular">
            <Card>
              <CardHeader>
                <CardTitle>7. Sık Sorulan Sorular</CardTitle>
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
              </CardContent>
            </Card>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  )
}

