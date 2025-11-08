'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Lock, Eye, FileCheck, Database, UserCheck } from 'lucide-react'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import Breadcrumbs from '@/components/layout/Breadcrumbs'

const sections = [
  {
    icon: Database,
    title: 'Toplanan Veriler',
    content: [
      'Sistemimiz aşağıdaki verileri toplar ve işler:',
      '• Kişisel bilgiler (ad, soyad, e-posta, telefon)',
      '• Şirket bilgileri (şirket adı, sektör, adres)',
      '• İş verileri (müşteriler, fırsatlar, teklifler, faturalar)',
      '• Kullanım verileri (giriş kayıtları, işlem geçmişi)',
      '• Teknik veriler (IP adresi, tarayıcı bilgisi, cihaz bilgisi)',
    ],
  },
  {
    icon: Lock,
    title: 'Veri Güvenliği',
    content: [
      'Verilerinizin güvenliği için:',
      '• Tüm veriler şifrelenmiş olarak saklanır (SSL/TLS)',
      '• Veritabanı erişimleri şifrelenir',
      '• Düzenli güvenlik denetimleri yapılır',
      '• Güvenlik açıkları tespit edildiğinde anında müdahale edilir',
      '• Erişim logları tutulur ve izlenir',
    ],
  },
  {
    icon: Eye,
    title: 'Veri Kullanımı',
    content: [
      'Toplanan veriler aşağıdaki amaçlarla kullanılır:',
      '• CRM hizmetlerinin sağlanması',
      '• Kullanıcı deneyiminin iyileştirilmesi',
      '• Teknik destek sağlanması',
      '• Yasal yükümlülüklerin yerine getirilmesi',
      '• Güvenlik ve dolandırıcılık önleme',
      '• İstatistiksel analizler (anonim veriler)',
    ],
  },
  {
    icon: UserCheck,
    title: 'Veri Paylaşımı',
    content: [
      'Verileriniz aşağıdaki durumlarda paylaşılabilir:',
      '• Yasal zorunluluklar gerektirdiğinde',
      '• Mahkeme kararı ile',
      '• Güvenlik tehditlerine karşı',
      '• İş ortakları ile (sadece gerekli veriler)',
      '• Kullanıcı onayı ile',
      '',
      'Verileriniz asla üçüncü taraflara satılmaz veya pazarlama amaçlı kullanılmaz.',
    ],
  },
  {
    icon: FileCheck,
    title: 'KVKK Haklarınız',
    content: [
      '6698 sayılı KVKK kapsamında sahip olduğunuz haklar:',
      '• Kişisel verilerinizin işlenip işlenmediğini öğrenme',
      '• İşlenen verileriniz hakkında bilgi talep etme',
      '• Verilerinizin silinmesini veya düzeltilmesini talep etme',
      '• Verilerinizin aktarıldığı üçüncü kişileri bilme',
      '• Verilerinizin kanuna aykırı işlenmesi nedeniyle zarara uğramanız halinde zararın giderilmesini talep etme',
      '• Verilerinizin münhasıran otomatik sistemler ile analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme',
    ],
  },
  {
    icon: Shield,
    title: 'Çerezler (Cookies)',
    content: [
      'Platformumuz aşağıdaki çerezleri kullanır:',
      '• Oturum çerezleri (giriş durumunu korumak için)',
      '• Güvenlik çerezleri (güvenli oturum için)',
      '• Analitik çerezler (kullanım istatistikleri için)',
      '• Tercih çerezleri (kullanıcı ayarlarını kaydetmek için)',
      '',
      'Çerezleri tarayıcı ayarlarınızdan yönetebilirsiniz.',
    ],
  },
]

export default function PrivacyPage() {
  const locale = useLocale()
  
  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Gizlilik Politikası', href: `/${locale}/privacy` },
        ]}
      />

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg">
          <Shield className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gizlilik Politikası</h1>
          <p className="text-gray-600 mt-1">KVKK uyumlu gizlilik politikamız</p>
        </div>
      </div>

      {/* KVKK Notice */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-6 w-6 text-green-600 mt-1" />
            <div>
              <h3 className="font-semibold text-green-900 mb-2">KVKK Uyumluluğu</h3>
              <p className="text-green-700 text-sm leading-relaxed">
                Sistemimiz 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) ve Avrupa Birliği 
                Genel Veri Koruma Tüzüğü (GDPR) ile tam uyumludur. Verilerinizin güvenliği ve gizliliği 
                bizim için önceliklidir.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sections */}
      <div className="space-y-6">
        {sections.map((section, index) => {
          const Icon = section.icon
          return (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-6 w-6 text-primary-600" />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {section.content.map((item, itemIndex) => (
                    <li
                      key={itemIndex}
                      className={`${
                        item.startsWith('•') ? 'pl-4' : item === '' ? 'hidden' : 'font-medium'
                      } text-gray-700 leading-relaxed`}
                    >
                      {item || '\u00A0'}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Data Retention */}
      <Card>
        <CardHeader>
          <CardTitle>Veri Saklama Süresi</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed">
            Verileriniz, hizmet sağlama süresi boyunca ve yasal saklama yükümlülükleri gerektirdiği 
            sürece saklanır. Hesabınızı silmeniz durumunda, verileriniz 30 gün içinde kalıcı olarak 
            silinir. Yasal saklama yükümlülükleri gerektirdiği durumlarda, veriler yasal süre boyunca 
            saklanabilir.
          </p>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card className="bg-gradient-to-br from-primary-50 to-secondary-50 border-primary-200">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Gizlilik ile ilgili sorularınız mı var?
            </h3>
            <p className="text-gray-600 mb-4">
              Gizlilik politikamız hakkında sorularınız için bizimle iletişime geçin.
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


