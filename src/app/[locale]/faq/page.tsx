'use client'

import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { HelpCircle, ChevronDown } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Card } from '@/components/ui/card'

export default function FAQPage() {
  const t = useTranslations('faq')

  const faqCategories = [
    {
      id: 'general',
      title: 'Genel Sorular',
      items: [
        {
          q: 'Şifremi unuttum, ne yapmalıyım?',
          a: 'Sistem yöneticinizle iletişime geçin. Şifre sıfırlama işlemi yönetici tarafından yapılır.',
        },
        {
          q: 'Birden fazla şirketi yönetebilir miyim?',
          a: 'SuperAdmin yetkisiyle tüm şirketleri görüntüleyebilirsiniz. Normal kullanıcılar sadece kendi şirketlerini görür.',
        },
        {
          q: 'Verilerim güvende mi?',
          a: 'Evet. Sistem Row-Level Security (RLS) ile çoklu şirket verilerini birbirinden izole eder. Her kullanıcı sadece kendi şirketinin verilerini görür.',
        },
        {
          q: 'Sistem hangi dilleri destekliyor?',
          a: 'Sistem şu anda Türkçe ve İngilizce dillerini desteklemektedir. Dil seçiminizi sağ üst köşedeki dil değiştirici butondan yapabilirsiniz.',
        },
      ],
    },
    {
      id: 'technical',
      title: 'Teknik Sorular',
      items: [
        {
          q: 'Mobil cihazlardan kullanabilir miyim?',
          a: 'Evet, sistem responsive tasarıma sahiptir. Mobil tarayıcılardan rahatlıkla kullanabilirsiniz.',
        },
        {
          q: 'Offline çalışır mı?',
          a: 'Hayır, sistem internet bağlantısı gerektirir. Veriler Supabase bulut veritabanında saklanır.',
        },
        {
          q: 'Verilerimi dışa aktarabilir miyim?',
          a: 'Evet, raporlar modülünden Excel, PDF veya CSV formatında dışa aktarabilirsiniz.',
        },
        {
          q: 'Tarayıcı uyumluluğu nedir?',
          a: 'Sistem modern tarayıcıları destekler: Chrome, Firefox, Safari, Edge (son 2 versiyon).',
        },
      ],
    },
    {
      id: 'workflow',
      title: 'İş Akışı Soruları',
      items: [
        {
          q: 'Teklif kabul edildiğinde ne olur?',
          a: 'Teklif "ACCEPTED" durumuna geçtiğinde otomatik olarak fatura oluşturulur ve stok düşülür (ürün ise).',
        },
        {
          q: 'Fatura ödendiğinde ne olur?',
          a: 'Fatura "PAID" durumuna geçtiğinde otomatik olarak finans modülüne gelir kaydı eklenir.',
        },
        {
          q: 'Görev atandığında bildirim gelir mi?',
          a: 'Evet, görev atanan kullanıcıya otomatik bildirim gönderilir.',
        },
        {
          q: 'Pipeline aşamalarını değiştirebilir miyim?',
          a: 'Evet, Admin yetkisiyle pipeline aşamalarını özelleştirebilirsiniz. Ancak sistem varsayılan aşamaları önerir.',
        },
      ],
    },
    {
      id: 'permissions',
      title: 'Yetki ve Güvenlik',
      items: [
        {
          q: 'Modül yetkileri nasıl çalışır?',
          a: 'Her modül için READ, CREATE, UPDATE, DELETE yetkileri ayrı ayrı tanımlanabilir. Admin panelinden kullanıcı bazlı yetkilendirme yapabilirsiniz.',
        },
        {
          q: 'SuperAdmin ve Admin arasındaki fark nedir?',
          a: 'SuperAdmin tüm şirketleri görüntüleyebilir ve yeni kullanıcılar oluşturabilir. Admin sadece kendi şirketindeki kullanıcıları yönetebilir ve yetkilendirme yapabilir.',
        },
        {
          q: 'Verilerim başka şirketler tarafından görülebilir mi?',
          a: 'Hayır. Row-Level Security (RLS) sayesinde her şirket sadece kendi verilerini görür. Veri izolasyonu veritabanı seviyesinde garanti edilir.',
        },
      ],
    },
  ]

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
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
            <HelpCircle className="w-8 h-8" />
          </motion.div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Sık Sorulan Sorular
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            CRM Enterprise V3 hakkında merak ettiğiniz soruların yanıtlarını burada bulabilirsiniz.
          </p>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-6">
          {faqCategories.map((category, categoryIndex) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + categoryIndex * 0.1 }}
            >
              <Card className="p-6 border-2 border-slate-200 shadow-sm">
                <h2 className="text-xl font-semibold mb-4 text-slate-800">
                  {category.title}
                </h2>
                <Accordion type="single" collapsible className="w-full">
                  {category.items.map((item, itemIndex) => (
                    <AccordionItem
                      key={itemIndex}
                      value={`${category.id}-${itemIndex}`}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <AccordionTrigger className="text-left font-medium text-slate-700 hover:text-indigo-600 py-4">
                        {item.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-slate-600 pt-2 pb-4">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Contact Support */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center pt-8"
        >
          <Card className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200">
            <h3 className="text-lg font-semibold mb-2 text-slate-800">
              Sorunuzun yanıtını bulamadınız mı?
            </h3>
            <p className="text-slate-600 mb-4">
              Destek ekibimizle iletişime geçmek için{' '}
              <a
                href="/help"
                className="text-indigo-600 hover:text-indigo-700 font-medium underline"
              >
                Yardım Merkezi
              </a>
              'ni ziyaret edin.
            </p>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}
