'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Book,
  FileText,
  Shield,
  Settings,
  Users,
  Briefcase,
  FileCheck,
  BarChart3,
  Search,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
}

const faqData: FAQItem[] = [
  // Genel Sorular
  {
    id: '1',
    question: 'CRM sistemi nedir ve ne işe yarar?',
    answer: 'CRM (Customer Relationship Management) sistemi, müşteri ilişkilerinizi yönetmek, satış süreçlerinizi takip etmek ve iş operasyonlarınızı optimize etmek için kullanılan kapsamlı bir yönetim sistemidir. Müşteri bilgileri, fırsatlar, teklifler, faturalar ve tüm iş süreçlerinizi tek bir platformda toplar.',
    category: 'genel',
  },
  {
    id: '2',
    question: 'Sisteme nasıl giriş yapabilirim?',
    answer: 'Sisteme giriş yapmak için login sayfasındaki email ve şifrenizi kullanarak giriş yapabilirsiniz. Eğer hesabınız yoksa, sistem yöneticinizden hesap oluşturmasını talep edebilirsiniz.',
    category: 'genel',
  },
  {
    id: '3',
    question: 'Şifremi unuttum, ne yapmalıyım?',
    answer: 'Şifrenizi unuttuysanız, login sayfasındaki "Şifremi Unuttum" linkine tıklayarak şifre sıfırlama işlemini başlatabilirsiniz. Email adresinize şifre sıfırlama linki gönderilecektir.',
    category: 'genel',
  },
  // Müşteri Yönetimi
  {
    id: '4',
    question: 'Yeni müşteri nasıl eklerim?',
    answer: 'Müşteriler sayfasına gidin ve "Yeni Müşteri" butonuna tıklayın. Müşteri bilgilerini (ad, email, telefon, adres vb.) doldurup kaydedin. Müşteri otomatik olarak sisteminize eklenir.',
    category: 'musteri',
  },
  {
    id: '5',
    question: 'Müşteri bilgilerini nasıl düzenlerim?',
    answer: 'Müşteriler listesinden düzenlemek istediğiniz müşteriye tıklayın. Detay sayfasında "Düzenle" butonuna tıklayarak bilgileri güncelleyebilirsiniz.',
    category: 'musteri',
  },
  // Fırsat ve Teklif Yönetimi
  {
    id: '6',
    question: 'Fırsat (Deal) nasıl oluşturulur?',
    answer: 'Fırsatlar sayfasına gidin ve "Yeni Fırsat" butonuna tıklayın. Müşteriyi seçin, fırsat başlığı, değer, aşama ve diğer bilgileri doldurun. Fırsat otomatik olarak pipeline\'a eklenir.',
    category: 'firsat',
  },
  {
    id: '7',
    question: 'Teklif nasıl hazırlanır?',
    answer: 'Teklifler sayfasından "Yeni Teklif" butonuna tıklayın. İlgili fırsatı seçin, ürünleri ekleyin, fiyatları ve indirimleri belirleyin. Teklif hazır olduğunda müşteriye gönderebilirsiniz.',
    category: 'teklif',
  },
  {
    id: '8',
    question: 'Teklif PDF\'ini nasıl indiririm?',
    answer: 'Teklif detay sayfasında "PDF İndir" butonuna tıklayarak teklifinizi PDF formatında indirebilirsiniz. PDF, profesyonel bir formatta hazırlanır ve müşteriye gönderilebilir.',
    category: 'teklif',
  },
  // Fatura Yönetimi
  {
    id: '9',
    question: 'Fatura nasıl oluşturulur?',
    answer: 'Kabul edilen bir tekliften otomatik olarak fatura oluşturulabilir veya Faturalar sayfasından manuel olarak yeni fatura oluşturabilirsiniz. Fatura numarası, tarih ve ödeme bilgilerini doldurun.',
    category: 'fatura',
  },
  {
    id: '10',
    question: 'Fatura durumunu nasıl güncellerim?',
    answer: 'Fatura detay sayfasında durum alanını değiştirerek fatura durumunu (Taslak, Gönderildi, Ödendi vb.) güncelleyebilirsiniz.',
    category: 'fatura',
  },
  // Ürün Yönetimi
  {
    id: '11',
    question: 'Ürün nasıl eklenir?',
    answer: 'Ürünler sayfasına gidin ve "Yeni Ürün" butonuna tıklayın. Ürün adı, fiyat, stok miktarı ve diğer bilgileri doldurun. Ürün otomatik olarak kataloğunuza eklenir.',
    category: 'urun',
  },
  {
    id: '12',
    question: 'Stok takibi nasıl yapılır?',
    answer: 'Ürünler sayfasında her ürünün stok miktarı görüntülenir. Stok seviyesi düşük ürünler için uyarılar gösterilir. Stok giriş/çıkış işlemleri otomatik olarak takip edilir.',
    category: 'urun',
  },
  // Raporlar ve Analitik
  {
    id: '13',
    question: 'Dashboard\'da hangi bilgileri görebilirim?',
    answer: 'Dashboard\'da toplam satış, teklif sayısı, başarı oranı, aktif müşteriler, fırsatlar ve diğer önemli KPI\'ları görebilirsiniz. Ayrıca grafikler ve trend analizleri de mevcuttur.',
    category: 'rapor',
  },
  {
    id: '14',
    question: 'Raporları nasıl oluştururum?',
    answer: 'Raporlar sayfasına gidin, modül, tarih aralığı ve diğer filtreleri seçin. Rapor otomatik olarak oluşturulur ve Excel, PDF veya CSV formatında dışa aktarabilirsiniz.',
    category: 'rapor',
  },
  // Yetki ve Güvenlik
  {
    id: '15',
    question: 'Kullanıcı yetkileri nasıl yönetilir?',
    answer: 'Admin panelinden kullanıcıların modül bazlı yetkilerini (okuma, yazma, düzenleme, silme) yönetebilirsiniz. Her kullanıcı için ayrı ayrı yetki tanımlaması yapabilirsiniz.',
    category: 'yetki',
  },
  {
    id: '16',
    question: 'Admin ve SuperAdmin arasındaki fark nedir?',
    answer: 'Admin, kendi kurumundaki kullanıcıları ve yetkileri yönetebilir. SuperAdmin ise tüm kurumları, kurum yetkilerini ve sistem genelindeki ayarları yönetebilir.',
    category: 'yetki',
  },
  // Teknik Sorular
  {
    id: '17',
    question: 'Sistem gereksinimleri nelerdir?',
    answer: 'Sistem modern bir web tarayıcısı (Chrome, Firefox, Safari, Edge) gerektirir. Mobil cihazlardan da erişilebilir. İnternet bağlantısı gereklidir.',
    category: 'teknik',
  },
  {
    id: '18',
    question: 'Verilerim güvende mi?',
    answer: 'Evet, tüm verileriniz şifrelenmiş olarak saklanır. Multi-tenant yapı sayesinde her kurumun verileri birbirinden izole edilmiştir. Düzenli yedeklemeler yapılmaktadır.',
    category: 'teknik',
  },
]

export default function HelpPage() {
  const locale = useLocale()
  const [searchQuery, setSearchQuery] = useState('')
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems)
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id)
    } else {
      newOpenItems.add(id)
    }
    setOpenItems(newOpenItems)
  }

  const filteredFAQs = faqData.filter((faq) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      faq.question.toLowerCase().includes(query) ||
      faq.answer.toLowerCase().includes(query) ||
      faq.category.toLowerCase().includes(query)
    )
  })

  const categories = [
    { value: 'all', label: 'Tümü', icon: FileText },
    { value: 'genel', label: 'Genel', icon: HelpCircle },
    { value: 'musteri', label: 'Müşteri', icon: Users },
    { value: 'firsat', label: 'Fırsat', icon: Briefcase },
    { value: 'teklif', label: 'Teklif', icon: FileCheck },
    { value: 'fatura', label: 'Fatura', icon: FileText },
    { value: 'urun', label: 'Ürün', icon: Briefcase },
    { value: 'rapor', label: 'Rapor', icon: BarChart3 },
    { value: 'yetki', label: 'Yetki', icon: Shield },
    { value: 'teknik', label: 'Teknik', icon: Settings },
  ]

  const [selectedCategory, setSelectedCategory] = useState('all')

  const categoryFilteredFAQs =
    selectedCategory === 'all'
      ? filteredFAQs
      : filteredFAQs.filter((faq) => faq.category === selectedCategory)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <HelpCircle className="h-8 w-8 text-indigo-600" />
            Yardım ve Destek
          </h1>
          <p className="mt-2 text-gray-600">
            Sık sorulan sorular, kullanım kılavuzu ve sistem bilgileri
          </p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Sorunuzu arayın..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="faq" className="space-y-4">
        <TabsList>
          <TabsTrigger value="faq">
            <HelpCircle className="h-4 w-4 mr-2" />
            Sık Sorulan Sorular
          </TabsTrigger>
          <TabsTrigger value="guide">
            <Book className="h-4 w-4 mr-2" />
            Kullanım Kılavuzu
          </TabsTrigger>
          <TabsTrigger value="terms">
            <FileText className="h-4 w-4 mr-2" />
            Şartlar ve Koşullar
          </TabsTrigger>
        </TabsList>

        {/* FAQ Tab */}
        <TabsContent value="faq" className="space-y-4">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const Icon = cat.icon
              return (
                    <Button
                  key={cat.value}
                  variant={selectedCategory === cat.value ? 'default' : 'outline'}
                      size="sm"
                  onClick={() => setSelectedCategory(cat.value)}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {cat.label}
                </Button>
              )
            })}
          </div>

          {/* FAQ List */}
          <div className="space-y-4">
            {categoryFilteredFAQs.length > 0 ? (
              categoryFilteredFAQs.map((faq) => {
                const isOpen = openItems.has(faq.id)
                return (
                  <Card key={faq.id} className="hover:shadow-md transition-shadow">
                    <CardHeader
                      className="cursor-pointer"
                      onClick={() => toggleItem(faq.id)}
                    >
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{faq.question}</CardTitle>
                        {isOpen ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </div>
                      <CardDescription>
                        <Badge variant="outline" className="mt-2">
                          {categories.find((c) => c.value === faq.category)?.label || faq.category}
                        </Badge>
                      </CardDescription>
                    </CardHeader>
                    {isOpen && (
                      <CardContent>
                        <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                      </CardContent>
                    )}
                  </Card>
                )
              })
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500">Aradığınız soru bulunamadı.</p>
            </CardContent>
          </Card>
            )}
          </div>
        </TabsContent>

        {/* Kullanım Kılavuzu Tab */}
        <TabsContent value="guide" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hızlı Başlangıç</CardTitle>
              <CardDescription>CRM sistemini kullanmaya başlamak için adım adım kılavuz</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">1. Müşteri Ekleme</h3>
                <p className="text-gray-600">
                  Müşteriler sayfasından yeni müşteri ekleyerek başlayın. Müşteri bilgileri (ad, email, telefon) sistemde saklanır.
                </p>
                        </div>
              <div>
                <h3 className="font-semibold mb-2">2. Fırsat Oluşturma</h3>
                <p className="text-gray-600">
                  Müşteriye bağlı bir fırsat oluşturun. Fırsat değeri, aşama ve kazanma olasılığını belirleyin.
                </p>
                      </div>
              <div>
                <h3 className="font-semibold mb-2">3. Teklif Hazırlama</h3>
                <p className="text-gray-600">
                  Fırsattan teklif oluşturun, ürünleri ekleyin ve fiyatlandırın. Teklifi PDF olarak indirip müşteriye gönderin.
                </p>
                    </div>
              <div>
                <h3 className="font-semibold mb-2">4. Fatura Oluşturma</h3>
                <p className="text-gray-600">
                  Kabul edilen tekliften otomatik olarak fatura oluşturulur veya manuel olarak fatura oluşturabilirsiniz.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Şartlar ve Koşullar Tab */}
        <TabsContent value="terms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Kullanım Şartları</CardTitle>
              <CardDescription>CRM sistemini kullanırken uymanız gereken kurallar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Veri Güvenliği</h3>
                <p className="text-gray-600">
                  Tüm verileriniz şifrelenmiş olarak saklanır. Verilerinizin güvenliği bizim önceliğimizdir.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Kullanıcı Sorumlulukları</h3>
                <p className="text-gray-600">
                  Kullanıcılar, sistemdeki verilerin doğruluğundan ve güncelliğinden sorumludur.
                    </p>
                  </div>
              <div>
                <h3 className="font-semibold mb-2">Gizlilik</h3>
                <p className="text-gray-600">
                  Müşteri bilgileri ve iş verileri gizli tutulur. Yetkisiz erişim engellenir.
                </p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">Detaylı bilgi için:</p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/${locale}/terms`}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Şartlar ve Koşullar
                  </Link>
                  <span className="text-gray-400">•</span>
                  <Link
                    href={`/${locale}/privacy`}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Gizlilik Politikası
                  </Link>
                  <span className="text-gray-400">•</span>
                  <Link
                    href={`/${locale}/faq`}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Sık Sorulan Sorular
                  </Link>
                  <span className="text-gray-400">•</span>
                  <Link
                    href={`/${locale}/about`}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Hakkımızda
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
