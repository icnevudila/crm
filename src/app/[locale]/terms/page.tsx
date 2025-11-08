'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Bell, Shield, CheckCircle2 } from 'lucide-react'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import Breadcrumbs from '@/components/layout/Breadcrumbs'

const terms = [
  {
    title: 'Hizmet Kullanım Şartları',
    content: [
      'CRM Enterprise V3 platformunu kullanarak, aşağıdaki şartları kabul etmiş sayılırsınız:',
      '• Platformu yalnızca yasal ve meşru amaçlar için kullanacaksınız.',
      '• Başka kullanıcıların hesaplarına erişmeye çalışmayacaksınız.',
      '• Platformun güvenliğini tehlikeye atacak herhangi bir faaliyette bulunmayacaksınız.',
      '• Telif hakkı veya fikri mülkiyet haklarını ihlal eden içerik paylaşmayacaksınız.',
      '• Platformu zararlı yazılım yaymak veya spam göndermek için kullanmayacaksınız.',
    ],
  },
  {
    title: 'Bildirim Şartları',
    content: [
      'Sistemimiz aşağıdaki durumlarda otomatik bildirimler gönderir:',
      '• Size görev atandığında',
      '• Teklifleriniz güncellendiğinde',
      '• Faturalarınız ödendiğinde',
      '• Önemli işlemler gerçekleştiğinde',
      '',
      'Bildirim tercihlerinizi profil sayfanızdan yönetebilirsiniz.',
      'Bildirimler e-posta ve sistem içi bildirimler olarak gönderilir.',
    ],
  },
  {
    title: 'Veri Güvenliği',
    content: [
      'Verilerinizin güvenliği bizim için önceliklidir:',
      '• Tüm veriler şifrelenmiş olarak saklanır.',
      '• Row-Level Security (RLS) ile şirket bazlı veri izolasyonu sağlanır.',
      '• Düzenli yedeklemeler alınır.',
      '• Güvenlik açıkları tespit edildiğinde anında müdahale edilir.',
      '• Verileriniz yalnızca yasal zorunluluklar gerektirdiğinde paylaşılır.',
    ],
  },
  {
    title: 'Kullanıcı Sorumlulukları',
    content: [
      'Kullanıcılar olarak sizlerin sorumlulukları:',
      '• Hesap bilgilerinizi güvende tutmak',
      '• Şifrenizi düzenli olarak güncellemek',
      '• Şüpheli aktiviteleri derhal bildirmek',
      '• Platform kurallarına uymak',
      '• Verilerinizi doğru ve güncel tutmak',
    ],
  },
  {
    title: 'Hizmet Kesintileri',
    content: [
      'Sistem bakımı veya güncellemeler sırasında hizmet kesintileri yaşanabilir:',
      '• Planlı bakımlar önceden duyurulur.',
      '• Acil durumlarda en kısa sürede müdahale edilir.',
      '• %99.9 uptime garantisi sunulur.',
      '• Kesintiler sırasında veri kaybı yaşanmaz.',
    ],
  },
  {
    title: 'Fikri Mülkiyet',
    content: [
      'Platform ve içeriği:',
      '• Tüm hakları saklıdır.',
      '• Platform kodları, tasarımları ve içerikleri telif hakkı koruması altındadır.',
      '• İzinsiz kopyalama, dağıtma veya kullanım yasaktır.',
      '• Ticari markalar ve logolar korunmaktadır.',
    ],
  },
]

export default function TermsPage() {
  const locale = useLocale()
  
  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Şartlar ve Koşullar', href: `/${locale}/terms` },
        ]}
      />

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg">
          <FileText className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Şartlar ve Koşullar</h1>
          <p className="text-gray-600 mt-1">Hizmet kullanım şartları ve bildirim politikaları</p>
        </div>
      </div>

      {/* Last Updated */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-blue-700">
            <CheckCircle2 className="h-5 w-5" />
            <p className="font-medium">Son Güncelleme: {new Date().toLocaleDateString('tr-TR')}</p>
          </div>
        </CardContent>
      </Card>

      {/* Terms */}
      <div className="space-y-6">
        {terms.map((term, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {index === 1 ? (
                  <Bell className="h-6 w-6 text-purple-600" />
                ) : index === 2 ? (
                  <Shield className="h-6 w-6 text-green-600" />
                ) : (
                  <FileText className="h-6 w-6 text-primary-600" />
                )}
                {term.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {term.content.map((item, itemIndex) => (
                  <li
                    key={itemIndex}
                    className={`${
                      item.startsWith('•') ? 'pl-4' : item === '' ? 'hidden' : ''
                    } text-gray-700 leading-relaxed`}
                  >
                    {item || '\u00A0'}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Contact */}
      <Card className="bg-gradient-to-br from-primary-50 to-secondary-50 border-primary-200">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Sorularınız mı var?
            </h3>
            <p className="text-gray-600 mb-4">
              Şartlar ve koşullar hakkında sorularınız için bizimle iletişime geçin.
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


