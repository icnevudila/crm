'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Target, Users, Award, Rocket, Shield } from 'lucide-react'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import Breadcrumbs from '@/components/layout/Breadcrumbs'

const values = [
  {
    icon: Target,
    title: 'Müşteri Odaklı',
    description: 'Müşterilerimizin başarısı bizim başarımızdır. Her kararımızı müşteri memnuniyetini ön planda tutarak alıyoruz.',
    color: 'from-blue-500 to-blue-600',
  },
  {
    icon: Rocket,
    title: 'İnovasyon',
    description: 'Sürekli gelişen teknoloji ile en son yenilikleri sistemimize entegre ediyoruz.',
    color: 'from-purple-500 to-purple-600',
  },
  {
    icon: Shield,
    title: 'Güvenilirlik',
    description: 'Enterprise-grade güvenlik standartları ile verilerinizi koruyoruz.',
    color: 'from-green-500 to-green-600',
  },
  {
    icon: Users,
    title: 'Ekip Çalışması',
    description: 'Müşterilerimizle birlikte çalışarak en iyi çözümleri üretiyoruz.',
    color: 'from-orange-500 to-orange-600',
  },
]

const team = [
  {
    name: 'Geliştirme Ekibi',
    role: 'Yazılım Geliştirme',
    description: 'Deneyimli yazılım geliştiricilerimiz, modern teknolojiler kullanarak sistemimizi sürekli geliştiriyor.',
  },
  {
    name: 'Tasarım Ekibi',
    role: 'Kullanıcı Deneyimi',
    description: 'Kullanıcı dostu arayüzler tasarlayarak en iyi deneyimi sunuyoruz.',
  },
  {
    name: 'Destek Ekibi',
    role: 'Teknik Destek',
    description: '7/24 teknik destek hizmeti ile yanınızdayız.',
  },
]

export default function AboutPage() {
  const locale = useLocale()
  
  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Hakkımızda', href: `/${locale}/about` },
        ]}
      />

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg">
          <Building2 className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hakkımızda</h1>
          <p className="text-gray-600 mt-1">CRM Enterprise V3 hakkında bilgi edinin</p>
        </div>
      </div>

      {/* Mission */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-6 w-6 text-primary-600" />
            Misyonumuz
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed text-lg">
            İşletmelerin müşteri ilişkilerini yönetmelerine, satış süreçlerini optimize etmelerine ve 
            büyümelerine yardımcı olmak için modern, güvenilir ve kullanıcı dostu CRM çözümleri sunmak.
          </p>
        </CardContent>
      </Card>

      {/* Vision */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-6 w-6 text-secondary-600" />
            Vizyonumuz
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed text-lg">
            Türkiye&apos;nin en güvenilir ve kullanıcı dostu CRM platformu olmak, işletmelerin dijital 
            dönüşümüne öncülük etmek ve müşteri başarısını desteklemek.
          </p>
        </CardContent>
      </Card>

      {/* Values */}
      <Card>
        <CardHeader>
          <CardTitle>Değerlerimiz</CardTitle>
          <CardDescription>Çalışma prensiplerimiz ve değerlerimiz</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((value, index) => {
              const Icon = value.icon
              return (
                <div
                  key={index}
                  className="p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow"
                >
                  <div className={`p-3 bg-gradient-to-r ${value.color} rounded-lg w-fit mb-4`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{value.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{value.description}</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Team */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6 text-accent-600" />
            Ekibimiz
          </CardTitle>
          <CardDescription>Deneyimli ve uzman ekibimiz</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {team.map((member, index) => (
              <div
                key={index}
                className="p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow text-center"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-sm text-primary-600 font-medium mb-3">{member.role}</p>
                <p className="text-gray-600 text-sm leading-relaxed">{member.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Technology */}
      <Card>
        <CardHeader>
          <CardTitle>Teknoloji</CardTitle>
          <CardDescription>Kullandığımız modern teknolojiler</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Next.js 15', 'TypeScript', 'Supabase', 'Tailwind CSS', 'React', 'PostgreSQL', 'Edge Runtime', 'SWR'].map(
              (tech, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 text-center"
                >
                  <p className="font-medium text-gray-900">{tech}</p>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card className="bg-gradient-to-br from-primary-50 to-secondary-50 border-primary-200">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Bizimle İletişime Geçin
            </h3>
            <p className="text-gray-600 mb-4">
              Sorularınız, önerileriniz veya destek talepleriniz için bize ulaşabilirsiniz.
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


