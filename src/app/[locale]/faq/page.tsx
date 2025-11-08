'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { HelpCircle, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import Breadcrumbs from '@/components/layout/Breadcrumbs'

const faqCategories = [
  {
    id: 'general',
    title: 'Genel Sorular',
    icon: '📋',
    questions: [
      {
        q: 'CRM sistemi nedir ve ne işe yarar?',
        a: 'CRM (Customer Relationship Management) sistemi, müşteri ilişkilerinizi yönetmek, satış süreçlerinizi takip etmek ve işinizi büyütmek için kullanılan kapsamlı bir platformdur. Müşteri bilgilerini, fırsatları, teklifleri, faturaları ve tüm iş süreçlerinizi tek bir yerden yönetmenizi sağlar.',
      },
      {
        q: 'Sisteme nasıl giriş yapabilirim?',
        a: 'Sisteminize giriş yapmak için login sayfasından e-posta adresiniz ve şifreniz ile giriş yapabilirsiniz. Eğer şifrenizi unuttuysanız, "Şifremi Unuttum" linkini kullanarak yeni şifre oluşturabilirsiniz.',
      },
      {
        q: 'Birden fazla şirket için kullanabilir miyim?',
        a: 'Evet, sistemimiz multi-tenant yapısına sahiptir. Her şirket kendi verilerini görür ve yönetir. SuperAdmin rolüne sahipseniz tüm şirketleri görüntüleyebilir ve yönetebilirsiniz.',
      },
      {
        q: 'Mobil cihazlardan kullanabilir miyim?',
        a: 'Evet, sistemimiz tam responsive tasarıma sahiptir. Mobil cihazlardan, tabletlerden ve masaüstü bilgisayarlardan sorunsuz bir şekilde kullanabilirsiniz.',
      },
    ],
  },
  {
    id: 'features',
    title: 'Özellikler',
    icon: '⚙️',
    questions: [
      {
        q: 'Hangi modülleri kullanabilirim?',
        a: 'Sistemimizde müşteri yönetimi, fırsat takibi, teklif oluşturma, fatura yönetimi, ürün yönetimi, stok takibi, görev yönetimi, destek talepleri, sevkiyat takibi, finans yönetimi ve detaylı raporlama modülleri bulunmaktadır.',
      },
      {
        q: 'PDF teklif ve fatura oluşturabilir miyim?',
        a: 'Evet, teklif ve fatura detay sayfalarından "PDF İndir" butonuna tıklayarak profesyonel PDF belgeleri oluşturabilir ve indirebilirsiniz.',
      },
      {
        q: 'Raporlar nasıl oluşturulur?',
        a: 'Raporlar sayfasından tarih aralığı, kullanıcı, firma ve modül bazlı filtreleme yaparak detaylı raporlar oluşturabilirsiniz. Raporları Excel, PDF veya CSV formatında dışa aktarabilirsiniz.',
      },
      {
        q: 'Bildirimler nasıl çalışır?',
        a: 'Size atanan görevler, güncellenen teklifler ve önemli işlemler için otomatik bildirimler alırsınız. Bildirimler header\'daki zil ikonundan görüntülenebilir.',
      },
    ],
  },
  {
    id: 'permissions',
    title: 'Yetkiler ve Güvenlik',
    icon: '🔐',
    questions: [
      {
        q: 'Kullanıcı yetkileri nasıl yönetilir?',
        a: 'Admin rolüne sahip kullanıcılar, Admin panelinden kurum içi kullanıcıların modül bazlı yetkilerini (Görüntüle, Oluştur, Düzenle, Sil) yönetebilir.',
      },
      {
        q: 'SuperAdmin ne yapabilir?',
        a: 'SuperAdmin tüm şirketleri görüntüleyebilir, şirket bazlı modül açma/kapama yapabilir, şirket özellik yetkilerini yönetebilir ve sistem genelinde tüm işlemleri gerçekleştirebilir.',
      },
      {
        q: 'Verilerim güvende mi?',
        a: 'Evet, sistemimiz enterprise-grade güvenlik standartlarına sahiptir. Tüm veriler şifrelenir, Row-Level Security (RLS) ile şirket bazlı izolasyon sağlanır ve düzenli yedeklemeler alınır.',
      },
      {
        q: 'Verilerim başka şirketler tarafından görülebilir mi?',
        a: 'Hayır, sistemimiz multi-tenant yapısına sahiptir. Her şirket sadece kendi verilerini görür. SuperAdmin dışında hiçbir kullanıcı başka şirketlerin verilerine erişemez.',
      },
    ],
  },
  {
    id: 'technical',
    title: 'Teknik Destek',
    icon: '🛠️',
    questions: [
      {
        q: 'Sistem yavaş çalışıyor, ne yapmalıyım?',
        a: 'Öncelikle tarayıcı cache\'inizi temizleyin ve sayfayı yenileyin. Eğer sorun devam ederse, internet bağlantınızı kontrol edin. Hala sorun yaşıyorsanız teknik destek ekibimizle iletişime geçin.',
      },
      {
        q: 'Veri kaybı yaşadım, ne yapmalıyım?',
        a: 'Sistemimiz otomatik yedekleme yapmaktadır. Veri kaybı durumunda teknik destek ekibimizle iletişime geçerek yedekten geri yükleme talep edebilirsiniz.',
      },
      {
        q: 'API entegrasyonu yapabilir miyim?',
        a: 'Evet, sistemimiz RESTful API desteği sunmaktadır. API dokümantasyonu ve erişim bilgileri için teknik destek ekibimizle iletişime geçin.',
      },
      {
        q: 'Özelleştirme yapabilir miyim?',
        a: 'Sistemimiz esnek bir yapıya sahiptir. Özel alanlar, iş akışı otomasyonları ve entegrasyonlar için teknik destek ekibimizle iletişime geçebilirsiniz.',
      },
    ],
  },
]

export default function FAQPage() {
  const locale = useLocale()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCategories = faqCategories.map((category) => ({
    ...category,
    questions: category.questions.filter(
      (item) =>
        item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.a.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((category) => category.questions.length > 0)

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Sık Sorulan Sorular', href: `/${locale}/faq` },
        ]}
      />

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg">
          <HelpCircle className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sık Sorulan Sorular</h1>
          <p className="text-gray-600 mt-1">Merak ettiğiniz soruların cevaplarını burada bulabilirsiniz</p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Sorular arasında arama yapın..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* FAQ Categories */}
      <div className="space-y-6">
        {filteredCategories.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">Arama kriterinize uygun soru bulunamadı.</p>
            </CardContent>
          </Card>
        ) : (
          filteredCategories.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">{category.icon}</span>
                  {category.title}
                </CardTitle>
                <CardDescription>
                  {category.questions.length} soru
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {category.questions.map((item, index) => (
                    <AccordionItem key={index} value={`${category.id}-${index}`}>
                      <AccordionTrigger className="text-left font-medium">
                        {item.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-600 leading-relaxed">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Contact Support */}
      <Card className="bg-gradient-to-br from-primary-50 to-secondary-50 border-primary-200">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Sorunuzun cevabını bulamadınız mı?
            </h3>
            <p className="text-gray-600 mb-4">
              Teknik destek ekibimizle iletişime geçmek için yardım sayfasını ziyaret edin.
            </p>
            <Link
              href={`/${locale}/help`}
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
            >
              Yardım Sayfasına Git
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
