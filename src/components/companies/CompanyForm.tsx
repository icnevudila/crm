'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from '@/lib/toast'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { X, Upload, Image as ImageIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { handleFormValidationErrors } from '@/lib/form-validation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CountryCodeSelector } from '@/components/ui/country-code-selector'
import { useLocale } from 'next-intl'

const companySchema = z.object({
  name: z.string().min(1, 'Firma adı gereklidir'),
  contactPerson: z.string().min(1, 'Kontak kişi gereklidir'),
  phone: z.string().min(1, 'Telefon gereklidir'),
  countryCode: z.string().default('+90'),
  taxOffice: z.string().min(1, 'Vergi dairesi gereklidir'),
  taxNumber: z.string().min(1, 'Vergi numarası gereklidir'),
  sector: z.string().optional(),
  city: z.string().optional(),
  // district kolonu veritabanında yok, bu yüzden kaldırıldı
  address: z.string().optional(),
  email: z.string().email('Geçerli bir email adresi giriniz').optional().or(z.literal('')),
  website: z.string().url('Geçerli bir website adresi giriniz').optional().or(z.literal('')),
  description: z.string().optional(),
  status: z.enum(['POT', 'MUS', 'ALT', 'PAS']).default('POT'),
  logoUrl: z.string().url('Geçerli bir URL girin').optional().or(z.literal('')),
})

type CompanyFormData = z.infer<typeof companySchema>

interface CompanyFormProps {
  company?: any
  open: boolean
  onClose: () => void
  onSuccess?: (savedCompany: any) => void | Promise<void>
}

// Önceden tanımlı sektörler
const SECTORS = [
  'Teknoloji',
  'Yazılım',
  'Sağlık',
  'Eğitim',
  'Gıda',
  'İnşaat',
  'Otomotiv',
  'Enerji',
  'Finans',
  'Perakende',
  'Lojistik',
  'Turizm',
  'Medya',
  'Danışmanlık',
  'Üretim',
  'Tarım',
  'Kimya',
  'Tekstil',
  'İlaç',
  'Telekomünikasyon',
  'Gayrimenkul',
  'Emlak',
  'Hukuk',
  'Muhasebe',
  'Pazarlama',
  'Reklam',
  'Tasarım',
  'Mimarlık',
  'Mühendislik',
  'Diğer',
]

// Türkiye şehirleri
const CITIES = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Amasya', 'Ankara', 'Antalya', 'Artvin',
  'Aydın', 'Balıkesir', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa',
  'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır', 'Edirne', 'Elazığ', 'Erzincan',
  'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari', 'Hatay', 'Isparta',
  'İçel (Mersin)', 'İstanbul', 'İzmir', 'Kars', 'Kastamonu', 'Kayseri', 'Kırklareli', 'Kırşehir',
  'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Kahramanmaraş', 'Mardin', 'Muğla',
  'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Rize', 'Sakarya', 'Samsun', 'Siirt',
  'Sinop', 'Sivas', 'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Şanlıurfa', 'Uşak',
  'Van', 'Yozgat', 'Zonguldak', 'Aksaray', 'Bayburt', 'Karaman', 'Kırıkkale', 'Batman',
  'Şırnak', 'Bartın', 'Ardahan', 'Iğdır', 'Yalova', 'Karabük', 'Kilis', 'Osmaniye', 'Düzce'
]

// Şehirlere göre ilçeler (en popüler ilçeler)
const DISTRICTS_BY_CITY: Record<string, string[]> = {
  'İstanbul': [
    'Adalar', 'Arnavutköy', 'Ataşehir', 'Avcılar', 'Bağcılar', 'Bahçelievler', 'Bakırköy',
    'Başakşehir', 'Bayrampaşa', 'Beşiktaş', 'Beykoz', 'Beylikdüzü', 'Beyoğlu', 'Büyükçekmece',
    'Çatalca', 'Çekmeköy', 'Esenler', 'Esenyurt', 'Eyüpsultan', 'Fatih', 'Gaziosmanpaşa',
    'Güngören', 'Kadıköy', 'Kağıthane', 'Kartal', 'Küçükçekmece', 'Maltepe', 'Pendik',
    'Sancaktepe', 'Sarıyer', 'Silivri', 'Sultanbeyli', 'Sultangazi', 'Şile', 'Şişli',
    'Tuzla', 'Ümraniye', 'Üsküdar', 'Zeytinburnu'
  ],
  'Ankara': [
    'Altındağ', 'Ayaş', 'Bala', 'Beypazarı', 'Çamlıdere', 'Çankaya', 'Çubuk', 'Elmadağ',
    'Güdül', 'Haymana', 'Kalecik', 'Kızılcahamam', 'Nallıhan', 'Polatlı', 'Şereflikoçhisar',
    'Yenimahalle', 'Akyurt', 'Etimesgut', 'Evren', 'Gölbaşı', 'Keçiören', 'Mamak', 'Sincan',
    'Kazan', 'Pursaklar'
  ],
  'İzmir': [
    'Aliağa', 'Bayındır', 'Bergama', 'Bornova', 'Çeşme', 'Dikili', 'Foça', 'Karaburun',
    'Karşıyaka', 'Kemalpaşa', 'Kınık', 'Kiraz', 'Menemen', 'Ödemiş', 'Seferihisar', 'Selçuk',
    'Tire', 'Torbalı', 'Urla', 'Beydağ', 'Buca', 'Konak', 'Menderes', 'Balçova', 'Çiğli',
    'Gaziemir', 'Narlıdere', 'Güzelbahçe', 'Bayraklı', 'Karabağlar'
  ],
  'Bursa': [
    'Büyükorhan', 'Gemlik', 'Gürsu', 'Harmancık', 'İnegöl', 'İznik', 'Karacabey', 'Keles',
    'Kestel', 'Mudanya', 'Mustafakemalpaşa', 'Nilüfer', 'Orhaneli', 'Orhangazi', 'Osmangazi',
    'Yenişehir', 'Yıldırım'
  ],
  'Antalya': [
    'Akseki', 'Alanya', 'Elmalı', 'Finike', 'Gazipaşa', 'Gündoğmuş', 'Kaş', 'Kemer',
    'Korkuteli', 'Kumluca', 'Manavgat', 'Serik', 'Demre', 'İbradı', 'Kale', 'Aksu',
    'Döşemealtı', 'Kepez', 'Konyaaltı', 'Muratpaşa'
  ],
  'Adana': [
    'Aladağ', 'Ceyhan', 'Feke', 'Karaisalı', 'Karataş', 'Kozan', 'Pozantı', 'Saimbeyli',
    'Tufanbeyli', 'Yumurtalık', 'Yüreğir', 'Sarıçam', 'Çukurova', 'Seyhan', 'İmamoğlu'
  ],
  'Kocaeli': [
    'Başiskele', 'Çayırova', 'Darıca', 'Derince', 'Dilovası', 'Gebze', 'Gölcük', 'İzmit',
    'Kandıra', 'Karamürsel', 'Kartepe', 'Körfez'
  ],
  'Gaziantep': [
    'Araban', 'İslahiye', 'Karkamış', 'Nizip', 'Nurdağı', 'OİŸuzeli', 'Şahinbey', 'Şehitkamil',
    'Yavuzeli', 'İslahiye', 'Kilis'
  ],
  'Konya': [
    'Ahırlı', 'Akören', 'Akşehir', 'Altınekin', 'Beyşehir', 'Bozkır', 'Cihanbeyli', 'Çeltik',
    'Çumra', 'Derbent', 'Derebucak', 'Doğanhisar', 'Emirgazi', 'Ereğli', 'Güneysinir', 'Hadim',
    'Halkapınar', 'Hüyük', 'Ilgın', 'Kadınhanı', 'Karapınar', 'Karatay', 'Kulu', 'Meram',
    'Sarayönü', 'Selçuklu', 'Seydişehir', 'Taşkent', 'Tuzlukçu', 'Yalıhüyük', 'Yunak'
  ],
  'Mersin': [
    'Anamur', 'Aydıncık', 'Bozyazı', 'Çamlıyayla', 'Erdemli', 'Gülnar', 'Mut', 'Silifke',
    'Tarsus', 'Akdeniz', 'Mezitli', 'Toroslar', 'Yenişehir'
  ],
  'Diyarbakır': [
    'Bismil', 'Çermik', 'Çınar', 'Çüngüş', 'Dicle', 'Eğil', 'Ergani', 'Hani', 'Hazro',
    'Kocaköy', 'Kulp', 'Lice', 'Silvan', 'Sur', 'Yenişehir', 'Bağlar', 'Kayapınar'
  ],
  'Hatay': [
    'Altınözü', 'Antakya', 'Belen', 'Dörtyol', 'Erzin', 'Hassa', 'İskenderun', 'Kırıkhan',
    'Kumlu', 'Reyhanlı', 'SamandaİŸ', 'YayladaİŸı', 'Arsuz', 'Defne', 'Payas'
  ],
  'Manisa': [
    'Ahmetli', 'Akhisar', 'Alaşehir', 'Demirci', 'Gölmarmara', 'Gördes', 'KırkaİŸaç', 'Köprübaşı',
    'Kula', 'Salihli', 'Sarıgöl', 'Saruhanlı', 'Selendi', 'Soma', 'Şehzadeler', 'Turgutlu',
    'Yunusemre', 'Akhisar', 'Soma'
  ],
  'Kayseri': [
    'Akkışla', 'Bünyan', 'Develi', 'Felahiye', 'İ°ncesu', 'Pınarbaşı', 'SarıoİŸlan', 'Sarız',
    'Tomarza', 'Yahyalı', 'Yeşilhisar', 'Melikgazi', 'Kocasinan', 'Talas', 'Hacılar', 'Özvatan'
  ],
  'Samsun': [
    'Alaçam', 'Asarcık', 'Ayvacık', 'Bafra', 'Çarşamba', 'Havza', 'Kavak', 'Ladik', 'Ondokuzmayıs',
    'Salıpazarı', 'Tekkeköy', 'Terme', 'Vezirköprü', 'Yakakent', 'Atakum', 'Canik', 'İ°lkadım'
  ],
  'Balıkesir': [
    'Altıeylül', 'Ayvalık', 'Balya', 'Bandırma', 'Bigadiç', 'Burhaniye', 'Dursunbey', 'Edremit',
    'Erdek', 'Gömeç', 'Gönen', 'Havran', 'İ°vrindi', 'Karesi', 'Kepsut', 'Manyas', 'Marmara',
    'Savaştepe', 'Sındırgı', 'Susurluk'
  ],
  'Kahramanmaraş': [
    'Afşin', 'Andırın', 'ÇaİŸlayancerit', 'Ekinözü', 'Elbistan', 'Göksun', 'Nurhak', 'Pazarcık',
    'TürkoİŸlu', 'Onikişubat', 'DulkadiroİŸlu'
  ],
  'Van': [
    'Bahçesaray', 'Başkale', 'Çaldıran', 'Çatak', 'Edremit', 'Erciş', 'Gevaş', 'Gürpınar',
    'Muradiye', 'Özalp', 'Saray', 'İ°pekyolu', 'Tuşba'
  ],
  'Aydın': [
    'BozdoİŸan', 'Buharkent', 'Çine', 'Didim', 'Efeler', 'Germencik', 'İ°ncirliova', 'Karacasu',
    'Karpuzlu', 'Koçarlı', 'Köşk', 'Kuşadası', 'Kuyucak', 'Nazilli', 'Söke', 'Sultanhisar', 'Yenipazar'
  ],
  'Tekirdağ': [
    'Çerkezköy', 'Çorlu', 'Ergene', 'Hayrabolu', 'Kapaklı', 'Malkara', 'MarmaraereİŸlisi',
    'Muratlı', 'Saray', 'Süleymanpaşa', 'Şarköy'
  ],
  'Trabzon': [
    'Akçaabat', 'Araklı', 'Arsin', 'Beşikdüzü', 'Çarşıbaşı', 'Çaykara', 'Dernekpazarı',
    'Düzköy', 'Hayrat', 'Köprübaşı', 'Maçka', 'Of', 'Şalpazarı', 'Sürmene', 'Tonya', 'Vakfıkebir',
    'Yomra', 'Ortahisar'
  ],
  'Ordu': [
    'Akkuş', 'Altınordu', 'Aybastı', 'Çamaş', 'Çatalpınar', 'Çaybaşı', 'Fatsa', 'Gölköy',
    'Gülyalı', 'Gürgentepe', 'İ°kizce', 'Kabadüz', 'Kabataş', 'Korgan', 'Kumru', 'Mesudiye',
    'Perşembe', 'Ulubey', 'Ünye'
  ],
  'Denizli': [
    'Acıpayam', 'BabadaİŸ', 'Baklan', 'Bekilli', 'BeyaİŸaç', 'Bozkurt', 'Buldan', 'Çal',
    'Çameli', 'Çardak', 'Çivril', 'Güney', 'Honaz', 'Kale', 'Merkezefendi', 'Pamukkale',
    'Sarayköy', 'Serinhisar', 'Tavas'
  ],
  'Malatya': [
    'AkçadaİŸ', 'Arapgir', 'Arguvan', 'Battalgazi', 'Darende', 'DoİŸanŞehir', 'DoİŸanyol',
    'Hekimhan', 'Kale', 'Kuluncak', 'Pütürge', 'Yazıhan', 'Yeşilyurt'
  ],
  'Erzurum': [
    'Aşkale', 'Aziziye', 'Çat', 'Hınıs', 'Horasan', 'İ°spir', 'Karaçoban', 'Karayazı',
    'Köprüköy', 'Narman', 'Oltu', 'Olur', 'Palandöken', 'Pasinler', 'Pazaryolu', 'Şenkaya',
    'Tekman', 'Tortum', 'Uzundere', 'Yakutiye'
  ],
  'Afyonkarahisar': [
    'Başmakçı', 'Bayat', 'Bolvadin', 'Çay', 'Çobanlar', 'Dazkırı', 'Dinar', 'EmirdaİŸ',
    'Evciler', 'Hocalar', 'İ°hsaniye', 'İ°scehisar', 'Kızılören', 'Merkez', 'Sandıklı',
    'Sinanpaşa', 'SultandaİŸı', 'Şuhut'
  ],
  'Aksaray': [
    'AİŸaçören', 'Eskil', 'GülaİŸaç', 'Güzelyurt', 'Merkez', 'Ortaköy', 'Sarıyahşi'
  ],
  'Amasya': [
    'Göynücek', 'Gümüşhacıköy', 'Hamamözü', 'Merzifon', 'Suluova', 'Taşova'
  ],
  'Artvin': [
    'Ardanuç', 'Arhavi', 'Borçka', 'Hopa', 'Murgul', 'Şavşat', 'Yusufeli', 'Merkez'
  ]
}

// Durum etiketleri
const statusLabels: Record<string, string> = {
  POT: 'Potansiyel',
  MUS: 'Müşteri',
  ALT: 'Alt Bayi',
  PAS: 'Pasif',
}

export default function CompanyForm({
  company,
  open,
  onClose,
  onSuccess,
}: CompanyFormProps) {
  const router = useRouter()
  const locale = useLocale()
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [countryCode, setCountryCode] = useState(company?.countryCode || '+90')
  const [logoPreview, setLogoPreview] = useState(company?.logoUrl || '')

  const formRef = useRef<HTMLFormElement>(null)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: company || {
      name: '',
      contactPerson: '',
      phone: '',
      countryCode: '+90',
      taxOffice: '',
      taxNumber: '',
      sector: '',
      city: '',
      // district kolonu veritabanında yok, bu yüzden kaldırıldı
      address: '',
      email: '',
      website: '',
      description: '',
      status: 'POT',
      logoUrl: '',
    },
  })

  // Form'u company prop'u ile doldur (edit modu için)
  // open değiştiğinde form'u güncelle - sadece modal açıldığında
  useEffect(() => {
    if (!open) return // Modal kapalıysa hiçbir şey yapma
    
    if (company) {
      // Düzenleme modu - firma bilgilerini yükle
      reset({
        name: company.name || '',
        contactPerson: company.contactPerson || '',
        phone: company.phone || '',
        countryCode: company.countryCode || '+90',
        taxOffice: company.taxOffice || '',
        taxNumber: company.taxNumber || '',
        sector: company.sector || '',
        city: company.city || '',
        // district kolonu veritabanında yok, bu yüzden kaldırıldı
        address: company.address || '',
        email: company.email || '',
        website: company.website || '',
        description: company.description || '',
        status: company.status || 'POT',
        logoUrl: company.logoUrl || '',
      })
      setCountryCode(company.countryCode || '+90')
      setLogoPreview(company.logoUrl || '')
    } else {
      // Yeni kayıt modu - form'u temizle
      reset({
        name: '',
        contactPerson: '',
        phone: '',
        countryCode: '+90',
        taxOffice: '',
        taxNumber: '',
        sector: '',
        city: '',
        // district kolonu veritabanında yok, bu yüzden kaldırıldı
        address: '',
        email: '',
        website: '',
        description: '',
        status: 'POT',
        logoUrl: '',
      })
      setCountryCode('+90')
      setLogoPreview('')
    }
  }, [open, company, reset]) // open değiştiğinde tetikle

  const status = watch('status')
  const city = watch('city')

  const mutation = useMutation({
    mutationFn: async (data: CompanyFormData) => {
      // KURUM İÇİ FİRMA YÖNETİMİ: Tüm kullanıcılar CustomerCompany endpoint'ini kullanır
      const baseUrl = '/api/customer-companies'
      const url = company
        ? `${baseUrl}/${company.id}`
        : baseUrl
      const method = company ? 'PUT' : 'POST'

      try {
        // countryCode'u data'ya ekle
        const submitData = {
          ...data,
          countryCode,
        }

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData),
          credentials: 'include', // Session cookie'lerini gönder
        })

        if (!res.ok) {
          // Response body'yi parse etmeye çalış
          let errorData
          try {
            errorData = await res.json()
          } catch {
            // JSON parse edilemezse status text kullan
            errorData = { error: res.statusText || 'Failed to save company' }
          }
          
          // Duplicate kontrolü hatası
          if (errorData.error?.includes('vergi dairesi') || errorData.error?.includes('vergi numarası') || errorData.error?.includes('zaten kayıtlı')) {
            throw new Error('Bu vergi dairesi ve vergi numarası kombinasyonu zaten kayıtlı. Lütfen farklı bir firma girin.')
          }
          
          throw new Error(errorData.error || errorData.message || 'Failed to save company')
        }

        return await res.json()
      } catch (fetchError: any) {
        // Network hatası veya diğer fetch hataları
        console.error('CompanyForm fetch error:', fetchError)
        throw new Error(fetchError?.message || 'Network error: Failed to fetch')
      }
    },
    onSuccess: async (savedCompany) => {
      // Debug: Development'ta log ekle
      if (process.env.NODE_ENV === 'development') {
        console.log('CompanyForm onSuccess:', savedCompany)
      }
      
      // Kontak kişi otomatik müşteri olarak kaydedilsin
      if (savedCompany?.contactPerson && savedCompany?.id) {
        try {
          const contactPersonData = {
            name: savedCompany.contactPerson,
            phone: savedCompany.phone || '',
            email: savedCompany.email || '',
            city: savedCompany.city || '',
            customerCompanyId: savedCompany.id, // Hangi firmada çalışıyor
            status: 'ACTIVE',
          }

          const customerRes = await fetch('/api/customers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(contactPersonData),
            credentials: 'include',
          })

          if (customerRes.ok) {
            const newCustomer = await customerRes.json()
            // Kullanıcıya bilgi ver
            toast.info(
              'İlgili kişi otomatik oluşturuldu',
              `${savedCompany.contactPerson} isimli yetkili kişi, bu firma için otomatik olarak müşteriler bölümüne eklendi.`
            )
            
            // Debug: Development'ta log ekle
            if (process.env.NODE_ENV === 'development') {
              console.log('Auto-created customer:', newCustomer)
            }
          } else {
            // Hata durumunda sessizce devam et (kritik değil)
            if (process.env.NODE_ENV === 'development') {
              console.warn('Failed to auto-create customer:', await customerRes.json())
            }
          }
        } catch (error) {
          // Hata durumunda sessizce devam et (kritik deİŸil)
          if (process.env.NODE_ENV === 'development') {
            console.error('Error auto-creating customer:', error)
          }
        }
      }
      
      // onSuccess callback'i çağır - optimistic update için
      // Önce callback'i çağır, sonra form'u kapat
      if (onSuccess) {
        await onSuccess(savedCompany)
      }
      
      // Form'u temizle ve kapat
      reset()
      onClose()
      
      // Yeni firma kaydedildiğinde detay sayfasına yönlendirme YOK
      // Kullanıcı listede görmek istiyor, detay sayfasına yönlendirme yapmıyoruz
    },
    onError: (error: any) => {
      console.error('CompanyForm mutation error:', error)
      // Daha detaylı hata mesajı göster
      const errorMessage = error?.message || error?.error || 'Bilinmeyen bir hata oluştu'
      toast.error(
        'Firma kaydedilemedi',
        errorMessage + ' Lütfen tüm alanları kontrol edip tekrar deneyin.'
      )
    },
  })

  const onSubmit = async (data: CompanyFormData) => {
    setLoading(true)
    try {
      await mutation.mutateAsync(data)
    } finally {
      setLoading(false)
    }
  }

  // Form validation errors için onError handler
  const onError = (errors: any) => {
    handleFormValidationErrors(errors, formRef)
  }

  // Logo yükleme handler (gelecekte Supabase Storage'a yüklenecek)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Geçici olarak base64 preview göster (gelecekte Supabase Storage'a yüklenecek)
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setLogoPreview(base64String)
        setValue('logoUrl', base64String)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {company ? 'Firma Düzenle' : 'Yeni Firma'}
          </DialogTitle>
          <DialogDescription>
            {company ? 'Firma bilgilerini güncelleyin' : 'Yeni firma ekleyin. Zorunlu alanlar: Firma Adı, Kontak Kişi, Telefon, Vergi Dairesi, Vergi No'}
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit(onSubmit, onError)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Logo Upload */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Firma Logosu</label>
              <div className="flex items-center gap-4">
                {logoPreview && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-200"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                )}
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={loading}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label htmlFor="logo-upload">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full cursor-pointer"
                      disabled={loading}
                      asChild
                    >
                      <span>
                        <Upload className="mr-2 h-4 w-4" />
                        Logo Yükle
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            </div>

            {/* Name - ZORUNLU */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Firma Adı *</label>
              <Input
                {...register('name')}
                placeholder="Firma adı"
                disabled={loading}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Contact Person - ZORUNLU */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Kontak Kişi *</label>
              <Input
                {...register('contactPerson')}
                placeholder="Kontak kişi adı"
                disabled={loading}
              />
              {errors.contactPerson && (
                <p className="text-sm text-red-600">{errors.contactPerson.message}</p>
              )}
            </div>

            {/* Phone - ZORUNLU (Ülke kodu ile) */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Telefon *</label>
              <div className="flex gap-2">
                <CountryCodeSelector
                  value={countryCode}
                  onValueChange={(value) => {
                    setCountryCode(value)
                    setValue('countryCode', value)
                  }}
                  disabled={loading}
                />
                <Input
                  {...register('phone')}
                  placeholder="555 123 45 67"
                  disabled={loading}
                  className="flex-1"
                />
              </div>
              {errors.phone && (
                <p className="text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            {/* Tax Office - ZORUNLU */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Vergi Dairesi *</label>
              <Input
                {...register('taxOffice')}
                placeholder="Kadıköy Vergi Dairesi"
                disabled={loading}
              />
              {errors.taxOffice && (
                <p className="text-sm text-red-600">{errors.taxOffice.message}</p>
              )}
            </div>

            {/* Tax Number - ZORUNLU */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Vergi No *</label>
              <Input
                {...register('taxNumber')}
                placeholder="1234567890"
                disabled={loading}
              />
              {errors.taxNumber && (
                <p className="text-sm text-red-600">{errors.taxNumber.message}</p>
              )}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Durum</label>
              <Select
                value={status}
                onValueChange={(value) => setValue('status', value as 'POT' | 'MUS' | 'ALT' | 'PAS')}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POT">Potansiyel</SelectItem>
                  <SelectItem value="MUS">Müşteri</SelectItem>
                  <SelectItem value="ALT">Alt Bayi</SelectItem>
                  <SelectItem value="PAS">Pasif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Sektör</label>
              <Select
                value={watch('sector') || 'none'}
                onValueChange={(value) => setValue('sector', value === 'none' ? '' : value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sektör seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sektör Seçilmedi</SelectItem>
                  {SECTORS.map((sector) => (
                    <SelectItem key={sector} value={sector}>
                      {sector}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* City - Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Şehir</label>
              <Select
                value={city || 'none'}
                onValueChange={(value) => {
                  setValue('city', value === 'none' ? '' : value)
                }}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Şehir seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Şehir Seçilmedi</SelectItem>
                  {CITIES.map((cityName) => (
                    <SelectItem key={cityName} value={cityName}>
                      {cityName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium">E-posta</label>
              <Input
                type="email"
                {...register('email')}
                placeholder="info@firma.com"
                disabled={loading}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Website */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Website</label>
              <Input
                {...register('website')}
                placeholder="https://www.firma.com"
                disabled={loading}
              />
              {errors.website && (
                <p className="text-sm text-red-600">{errors.website.message}</p>
              )}
            </div>

            {/* Address */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Adres</label>
              <Textarea
                {...register('address')}
                placeholder="Tam adres bilgisi"
                disabled={loading}
                rows={3}
              />
            </div>

            {/* Description */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Açıklama</label>
              <Textarea
                {...register('description')}
                placeholder="Firma hakkında detaylı bilgi"
                disabled={loading}
                rows={4}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              İptal
            </Button>
            <Button
              type="submit"
              className="bg-gradient-primary text-white"
              disabled={loading}
            >
              {loading ? 'Kaydediliyor...' : company ? 'Güncelle' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
