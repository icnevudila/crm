'use client'

import { useState, useEffect } from 'react'
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
  'DanÄ±ÅŸmanlÄ±k',
  'Ãœretim',
  'TarÄ±m',
  'Kimya',
  'Tekstil',
  'Ä°laÃ§',
  'TelekomÃ¼nikasyon',
  'Gayrimenkul',
  'Emlak',
  'Hukuk',
  'Muhasebe',
  'Pazarlama',
  'Reklam',
  'TasarÄ±m',
  'MimarlÄ±k',
  'MÃ¼hendislik',
  'DiÄŸer',
]

// TÃ¼rkiye ÅŸehirleri
const CITIES = [
  'Adana', 'AdÄ±yaman', 'Afyonkarahisar', 'AÄŸrÄ±', 'Amasya', 'Ankara', 'Antalya', 'Artvin',
  'AydÄ±n', 'BalÄ±kesir', 'Bilecik', 'BingÃ¶l', 'Bitlis', 'Bolu', 'Burdur', 'Bursa',
  'Ã‡anakkale', 'Ã‡ankÄ±rÄ±', 'Ã‡orum', 'Denizli', 'DiyarbakÄ±r', 'Edirne', 'ElazÄ±ÄŸ', 'Erzincan',
  'Erzurum', 'EskiÅŸehir', 'Gaziantep', 'Giresun', 'GÃ¼mÃ¼ÅŸhane', 'Hakkari', 'Hatay', 'Isparta',
  'Ä°Ã§el (Mersin)', 'Ä°stanbul', 'Ä°zmir', 'Kars', 'Kastamonu', 'Kayseri', 'KÄ±rklareli', 'KÄ±rÅŸehir',
  'Kocaeli', 'Konya', 'KÃ¼tahya', 'Malatya', 'Manisa', 'KahramanmaraÅŸ', 'Mardin', 'MuÄŸla',
  'MuÅŸ', 'NevÅŸehir', 'NiÄŸde', 'Ordu', 'Rize', 'Sakarya', 'Samsun', 'Siirt',
  'Sinop', 'Sivas', 'TekirdaÄŸ', 'Tokat', 'Trabzon', 'Tunceli', 'ÅanlÄ±urfa', 'UÅŸak',
  'Van', 'Yozgat', 'Zonguldak', 'Aksaray', 'Bayburt', 'Karaman', 'KÄ±rÄ±kkale', 'Batman',
  'ÅÄ±rnak', 'BartÄ±n', 'Ardahan', 'IÄŸdÄ±r', 'Yalova', 'KarabÃ¼k', 'Kilis', 'Osmaniye', 'DÃ¼zce'
]

// Åehirlere gÃ¶re ilÃ§eler (en popÃ¼ler ilÃ§eler)
const DISTRICTS_BY_CITY: Record<string, string[]> = {
  'Ä°stanbul': [
    'Adalar', 'ArnavutkÃ¶y', 'AtaÅŸehir', 'AvcÄ±lar', 'BaÄŸcÄ±lar', 'BahÃ§elievler', 'BakÄ±rkÃ¶y',
    'BaÅŸakÅŸehir', 'BayrampaÅŸa', 'BeÅŸiktaÅŸ', 'Beykoz', 'BeylikdÃ¼zÃ¼', 'BeyoÄŸlu', 'BÃ¼yÃ¼kÃ§ekmece',
    'Ã‡atalca', 'Ã‡ekmekÃ¶y', 'Esenler', 'Esenyurt', 'EyÃ¼psultan', 'Fatih', 'GaziosmanpaÅŸa',
    'GÃ¼ngÃ¶ren', 'KadÄ±kÃ¶y', 'KaÄŸÄ±thane', 'Kartal', 'KÃ¼Ã§Ã¼kÃ§ekmece', 'Maltepe', 'Pendik',
    'Sancaktepe', 'SarÄ±yer', 'Silivri', 'Sultanbeyli', 'Sultangazi', 'Åile', 'ÅiÅŸli',
    'Tuzla', 'Ãœmraniye', 'ÃœskÃ¼dar', 'Zeytinburnu'
  ],
  'Ankara': [
    'AltÄ±ndaÄŸ', 'AyaÅŸ', 'Bala', 'BeypazarÄ±', 'Ã‡amlÄ±dere', 'Ã‡ankaya', 'Ã‡ubuk', 'ElmadaÄŸ',
    'GÃ¼dÃ¼l', 'Haymana', 'Kalecik', 'KÄ±zÄ±lcahamam', 'NallÄ±han', 'PolatlÄ±', 'ÅereflikoÃ§hisar',
    'Yenimahalle', 'Akyurt', 'Etimesgut', 'Evren', 'GÃ¶lbaÅŸÄ±', 'KeÃ§iÃ¶ren', 'Mamak', 'Sincan',
    'Kazan', 'Pursaklar'
  ],
  'Ä°zmir': [
    'AliaÄŸa', 'BayÄ±ndÄ±r', 'Bergama', 'Bornova', 'Ã‡eÅŸme', 'Dikili', 'FoÃ§a', 'Karaburun',
    'KarÅŸÄ±yaka', 'KemalpaÅŸa', 'KÄ±nÄ±k', 'Kiraz', 'Menemen', 'Ã–demiÅŸ', 'Seferihisar', 'SelÃ§uk',
    'Tire', 'TorbalÄ±', 'Urla', 'BeydaÄŸ', 'Buca', 'Konak', 'Menderes', 'BalÃ§ova', 'Ã‡iÄŸli',
    'Gaziemir', 'NarlÄ±dere', 'GÃ¼zelbahÃ§e', 'BayraklÄ±', 'KarabaÄŸlar'
  ],
  'Bursa': [
    'BÃ¼yÃ¼korhan', 'Gemlik', 'GÃ¼rsu', 'HarmancÄ±k', 'Ä°negÃ¶l', 'Ä°znik', 'Karacabey', 'Keles',
    'Kestel', 'Mudanya', 'MustafakemalpaÅŸa', 'NilÃ¼fer', 'Orhaneli', 'Orhangazi', 'Osmangazi',
    'YeniÅŸehir', 'YÄ±ldÄ±rÄ±m'
  ],
  'Antalya': [
    'Akseki', 'Alanya', 'ElmalÄ±', 'Finike', 'GazipaÅŸa', 'GÃ¼ndoÄŸmuÅŸ', 'KaÅŸ', 'Kemer',
    'Korkuteli', 'Kumluca', 'Manavgat', 'Serik', 'Demre', 'Ä°bradÄ±', 'Kale', 'Aksu',
    'DÃ¶ÅŸemealtÄ±', 'Kepez', 'KonyaaltÄ±', 'MuratpaÅŸa'
  ],
  'Adana': [
    'AladaÄŸ', 'Ceyhan', 'Feke', 'KaraisalÄ±', 'KarataÅŸ', 'Kozan', 'PozantÄ±', 'Saimbeyli',
    'Tufanbeyli', 'YumurtalÄ±k', 'YÃ¼reÄŸir', 'SarÄ±Ã§am', 'Ã‡ukurova', 'Seyhan', 'Ä°mamoÄŸlu'
  ],
  'Kocaeli': [
    'BaÅŸiskele', 'Ã‡ayÄ±rova', 'DarÄ±ca', 'Derince', 'DilovasÄ±', 'Gebze', 'GÃ¶lcÃ¼k', 'Ä°zmit',
    'KandÄ±ra', 'KaramÃ¼rsel', 'Kartepe', 'KÃ¶rfez'
  ],
  'Gaziantep': [
    'Araban', 'Ä°slahiye', 'KarkamÄ±ÅŸ', 'Nizip', 'NurdaÄŸÄ±', 'OÄŸuzeli', 'Åahinbey', 'Åehitkamil',
    'Yavuzeli', 'Ä°slahiye', 'Kilis'
  ],
  'Konya': [
    'AhÄ±rlÄ±', 'AkÃ¶ren', 'AkÅŸehir', 'AltÄ±nekin', 'BeyÅŸehir', 'BozkÄ±r', 'Cihanbeyli', 'Ã‡eltik',
    'Ã‡umra', 'Derbent', 'Derebucak', 'DoÄŸanhisar', 'Emirgazi', 'EreÄŸli', 'GÃ¼neysinir', 'Hadim',
    'HalkapÄ±nar', 'HÃ¼yÃ¼k', 'IlgÄ±n', 'KadÄ±nhanÄ±', 'KarapÄ±nar', 'Karatay', 'Kulu', 'Meram',
    'SarayÃ¶nÃ¼', 'SelÃ§uklu', 'SeydiÅŸehir', 'TaÅŸkent', 'TuzlukÃ§u', 'YalÄ±hÃ¼yÃ¼k', 'Yunak'
  ],
  'Mersin': [
    'Anamur', 'AydÄ±ncÄ±k', 'BozyazÄ±', 'Ã‡amlÄ±yayla', 'Erdemli', 'GÃ¼lnar', 'Mut', 'Silifke',
    'Tarsus', 'Akdeniz', 'Mezitli', 'Toroslar', 'YeniÅŸehir'
  ],
  'DiyarbakÄ±r': [
    'Bismil', 'Ã‡ermik', 'Ã‡Ä±nar', 'Ã‡Ã¼ngÃ¼ÅŸ', 'Dicle', 'EÄŸil', 'Ergani', 'Hani', 'Hazro',
    'KocakÃ¶y', 'Kulp', 'Lice', 'Silvan', 'Sur', 'YeniÅŸehir', 'BaÄŸlar', 'KayapÄ±nar'
  ],
  'Hatay': [
    'AltÄ±nÃ¶zÃ¼', 'Antakya', 'Belen', 'DÃ¶rtyol', 'Erzin', 'Hassa', 'Ä°skenderun', 'KÄ±rÄ±khan',
    'Kumlu', 'ReyhanlÄ±', 'SamandaÄŸ', 'YayladaÄŸÄ±', 'Arsuz', 'Defne', 'Payas'
  ],
  'Manisa': [
    'Ahmetli', 'Akhisar', 'AlaÅŸehir', 'Demirci', 'GÃ¶lmarmara', 'GÃ¶rdes', 'KÄ±rkaÄŸaÃ§', 'KÃ¶prÃ¼baÅŸÄ±',
    'Kula', 'Salihli', 'SarÄ±gÃ¶l', 'SaruhanlÄ±', 'Selendi', 'Soma', 'Åehzadeler', 'Turgutlu',
    'Yunusemre', 'Akhisar', 'Soma'
  ],
  'Kayseri': [
    'AkkÄ±ÅŸla', 'BÃ¼nyan', 'Develi', 'Felahiye', 'Ä°ncesu', 'PÄ±narbaÅŸÄ±', 'SarÄ±oÄŸlan', 'SarÄ±z',
    'Tomarza', 'YahyalÄ±', 'YeÅŸilhisar', 'Melikgazi', 'Kocasinan', 'Talas', 'HacÄ±lar', 'Ã–zvatan'
  ],
  'Samsun': [
    'AlaÃ§am', 'AsarcÄ±k', 'AyvacÄ±k', 'Bafra', 'Ã‡arÅŸamba', 'Havza', 'Kavak', 'Ladik', 'OndokuzmayÄ±s',
    'SalÄ±pazarÄ±', 'TekkekÃ¶y', 'Terme', 'VezirkÃ¶prÃ¼', 'Yakakent', 'Atakum', 'Canik', 'Ä°lkadÄ±m'
  ],
  'BalÄ±kesir': [
    'AltÄ±eylÃ¼l', 'AyvalÄ±k', 'Balya', 'BandÄ±rma', 'BigadiÃ§', 'Burhaniye', 'Dursunbey', 'Edremit',
    'Erdek', 'GÃ¶meÃ§', 'GÃ¶nen', 'Havran', 'Ä°vrindi', 'Karesi', 'Kepsut', 'Manyas', 'Marmara',
    'SavaÅŸtepe', 'SÄ±ndÄ±rgÄ±', 'Susurluk'
  ],
  'KahramanmaraÅŸ': [
    'AfÅŸin', 'AndÄ±rÄ±n', 'Ã‡aÄŸlayancerit', 'EkinÃ¶zÃ¼', 'Elbistan', 'GÃ¶ksun', 'Nurhak', 'PazarcÄ±k',
    'TÃ¼rkoÄŸlu', 'OnikiÅŸubat', 'DulkadiroÄŸlu'
  ],
  'Van': [
    'BahÃ§esaray', 'BaÅŸkale', 'Ã‡aldÄ±ran', 'Ã‡atak', 'Edremit', 'ErciÅŸ', 'GevaÅŸ', 'GÃ¼rpÄ±nar',
    'Muradiye', 'Ã–zalp', 'Saray', 'Ä°pekyolu', 'TuÅŸba'
  ],
  'AydÄ±n': [
    'BozdoÄŸan', 'Buharkent', 'Ã‡ine', 'Didim', 'Efeler', 'Germencik', 'Ä°ncirliova', 'Karacasu',
    'Karpuzlu', 'KoÃ§arlÄ±', 'KÃ¶ÅŸk', 'KuÅŸadasÄ±', 'Kuyucak', 'Nazilli', 'SÃ¶ke', 'Sultanhisar', 'Yenipazar'
  ],
  'TekirdaÄŸ': [
    'Ã‡erkezkÃ¶y', 'Ã‡orlu', 'Ergene', 'Hayrabolu', 'KapaklÄ±', 'Malkara', 'MarmaraereÄŸlisi',
    'MuratlÄ±', 'Saray', 'SÃ¼leymanpaÅŸa', 'ÅarkÃ¶y'
  ],
  'Trabzon': [
    'AkÃ§aabat', 'AraklÄ±', 'Arsin', 'BeÅŸikdÃ¼zÃ¼', 'Ã‡arÅŸÄ±baÅŸÄ±', 'Ã‡aykara', 'DernekpazarÄ±',
    'DÃ¼zkÃ¶y', 'Hayrat', 'KÃ¶prÃ¼baÅŸÄ±', 'MaÃ§ka', 'Of', 'ÅalpazarÄ±', 'SÃ¼rmene', 'Tonya', 'VakfÄ±kebir',
    'Yomra', 'Ortahisar'
  ],
  'Ordu': [
    'AkkuÅŸ', 'AltÄ±nordu', 'AybastÄ±', 'Ã‡amaÅŸ', 'Ã‡atalpÄ±nar', 'Ã‡aybaÅŸÄ±', 'Fatsa', 'GÃ¶lkÃ¶y',
    'GÃ¼lyalÄ±', 'GÃ¼rgentepe', 'Ä°kizce', 'KabadÃ¼z', 'KabataÅŸ', 'Korgan', 'Kumru', 'Mesudiye',
    'PerÅŸembe', 'Ulubey', 'Ãœnye'
  ],
  'Denizli': [
    'AcÄ±payam', 'BabadaÄŸ', 'Baklan', 'Bekilli', 'BeyaÄŸaÃ§', 'Bozkurt', 'Buldan', 'Ã‡al',
    'Ã‡ameli', 'Ã‡ardak', 'Ã‡ivril', 'GÃ¼ney', 'Honaz', 'Kale', 'Merkezefendi', 'Pamukkale',
    'SaraykÃ¶y', 'Serinhisar', 'Tavas'
  ],
  'Malatya': [
    'AkÃ§adaÄŸ', 'Arapgir', 'Arguvan', 'Battalgazi', 'Darende', 'DoÄŸanÅŸehir', 'DoÄŸanyol',
    'Hekimhan', 'Kale', 'Kuluncak', 'PÃ¼tÃ¼rge', 'YazÄ±han', 'YeÅŸilyurt'
  ],
  'Erzurum': [
    'AÅŸkale', 'Aziziye', 'Ã‡at', 'HÄ±nÄ±s', 'Horasan', 'Ä°spir', 'KaraÃ§oban', 'KarayazÄ±',
    'KÃ¶prÃ¼kÃ¶y', 'Narman', 'Oltu', 'Olur', 'PalandÃ¶ken', 'Pasinler', 'Pazaryolu', 'Åenkaya',
    'Tekman', 'Tortum', 'Uzundere', 'Yakutiye'
  ],
  'Afyonkarahisar': [
    'BaÅŸmakÃ§Ä±', 'Bayat', 'Bolvadin', 'Ã‡ay', 'Ã‡obanlar', 'DazkÄ±rÄ±', 'Dinar', 'EmirdaÄŸ',
    'Evciler', 'Hocalar', 'Ä°hsaniye', 'Ä°scehisar', 'KÄ±zÄ±lÃ¶ren', 'Merkez', 'SandÄ±klÄ±',
    'SinanpaÅŸa', 'SultandaÄŸÄ±', 'Åuhut'
  ],
  'Aksaray': [
    'AÄŸaÃ§Ã¶ren', 'Eskil', 'GÃ¼laÄŸaÃ§', 'GÃ¼zelyurt', 'Merkez', 'OrtakÃ¶y', 'SarÄ±yahÅŸi'
  ],
  'Amasya': [
    'GÃ¶ynÃ¼cek', 'GÃ¼mÃ¼ÅŸhacÄ±kÃ¶y', 'HamamÃ¶zÃ¼', 'Merzifon', 'Suluova', 'TaÅŸova'
  ],
  'Artvin': [
    'ArdanuÃ§', 'Arhavi', 'BorÃ§ka', 'Hopa', 'Murgul', 'ÅavÅŸat', 'Yusufeli', 'Merkez'
  ]
}

// Durum etiketleri
const statusLabels: Record<string, string> = {
  POT: 'Potansiyel',
  MUS: 'MÃ¼ÅŸteri',
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
      // district kolonu veritabanÄ±nda yok, bu yÃ¼zden kaldÄ±rÄ±ldÄ±
      address: '',
      email: '',
      website: '',
      description: '',
      status: 'POT',
      logoUrl: '',
    },
  })

  // Form'u company prop'u ile doldur (edit modu iÃ§in)
  // open deÄŸiÅŸtiÄŸinde form'u gÃ¼ncelle - sadece modal aÃ§Ä±ldÄ±ÄŸÄ±nda
  useEffect(() => {
    if (!open) return // Modal kapalÄ±ysa hiÃ§bir ÅŸey yapma
    
    if (company) {
      // DÃ¼zenleme modu - firma bilgilerini yÃ¼kle
      reset({
        name: company.name || '',
        contactPerson: company.contactPerson || '',
        phone: company.phone || '',
        countryCode: company.countryCode || '+90',
        taxOffice: company.taxOffice || '',
        taxNumber: company.taxNumber || '',
        sector: company.sector || '',
        city: company.city || '',
        // district kolonu veritabanÄ±nda yok, bu yÃ¼zden kaldÄ±rÄ±ldÄ±
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
      // Yeni kayÄ±t modu - form'u temizle
      reset({
        name: '',
        contactPerson: '',
        phone: '',
        countryCode: '+90',
        taxOffice: '',
        taxNumber: '',
        sector: '',
        city: '',
        // district kolonu veritabanÄ±nda yok, bu yÃ¼zden kaldÄ±rÄ±ldÄ±
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
  }, [open, company, reset]) // open deÄŸiÅŸtiÄŸinde tetikle

  const status = watch('status')
  const city = watch('city')

  const mutation = useMutation({
    mutationFn: async (data: CompanyFormData) => {
      // KURUM Ä°Ã‡Ä° FÄ°RMA YÃ–NETÄ°MÄ°: TÃ¼m kullanÄ±cÄ±lar CustomerCompany endpoint'ini kullanÄ±r
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
          credentials: 'include', // Session cookie'lerini gÃ¶nder
        })

        if (!res.ok) {
          // Response body'yi parse etmeye Ã§alÄ±ÅŸ
          let errorData
          try {
            errorData = await res.json()
          } catch {
            // JSON parse edilemezse status text kullan
            errorData = { error: res.statusText || 'Failed to save company' }
          }
          
          // Duplicate kontrolÃ¼ hatasÄ±
          if (errorData.error?.includes('vergi dairesi') || errorData.error?.includes('vergi numarasÄ±') || errorData.error?.includes('zaten kayÄ±tlÄ±')) {
            throw new Error('Bu vergi dairesi ve vergi numarasÄ± kombinasyonu zaten kayÄ±tlÄ±. LÃ¼tfen farklÄ± bir firma girin.')
          }
          
          throw new Error(errorData.error || errorData.message || 'Failed to save company')
        }

        return await res.json()
      } catch (fetchError: any) {
        // Network hatasÄ± veya diÄŸer fetch hatalarÄ±
        console.error('CompanyForm fetch error:', fetchError)
        throw new Error(fetchError?.message || 'Network error: Failed to fetch')
      }
    },
    onSuccess: async (savedCompany) => {
      // Debug: Development'ta log ekle
      if (process.env.NODE_ENV === 'development') {
        console.log('CompanyForm onSuccess:', savedCompany)
      }
      
      // Kontak kiÅŸi otomatik mÃ¼ÅŸteri olarak kaydedilsin
      if (savedCompany?.contactPerson && savedCompany?.id) {
        try {
          const contactPersonData = {
            name: savedCompany.contactPerson,
            phone: savedCompany.phone || '',
            email: savedCompany.email || '',
            city: savedCompany.city || '',
            customerCompanyId: savedCompany.id, // Hangi firmada Ã§alÄ±ÅŸÄ±yor
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
            // KullanÄ±cÄ±ya bilgi ver
            toast.info(
              'Ä°lgili kiÅŸi otomatik oluÅŸturuldu',
              `${savedCompany.contactPerson} isimli yetkili kiÅŸi, bu firma iÃ§in otomatik olarak mÃ¼ÅŸteriler bÃ¶lÃ¼mÃ¼ne eklendi.`
            )
            
            // Debug: Development'ta log ekle
            if (process.env.NODE_ENV === 'development') {
              console.log('Auto-created customer:', newCustomer)
            }
          } else {
            // Hata durumunda sessizce devam et (kritik deÄŸil)
            if (process.env.NODE_ENV === 'development') {
              console.warn('Failed to auto-create customer:', await customerRes.json())
            }
          }
        } catch (error) {
          // Hata durumunda sessizce devam et (kritik deÄŸil)
          if (process.env.NODE_ENV === 'development') {
            console.error('Error auto-creating customer:', error)
          }
        }
      }
      
      // onSuccess callback'i Ã§aÄŸÄ±r - optimistic update iÃ§in
      // Ã–nce callback'i Ã§aÄŸÄ±r, sonra form'u kapat
      if (onSuccess) {
        await onSuccess(savedCompany)
      }
      
      // Form'u temizle ve kapat
      reset()
      onClose()
      
      // Yeni firma kaydedildiÄŸinde detay sayfasÄ±na yÃ¶nlendirme YOK
      // KullanÄ±cÄ± listede gÃ¶rmek istiyor, detay sayfasÄ±na yÃ¶nlendirme yapmÄ±yoruz
    },
    onError: (error: any) => {
      console.error('CompanyForm mutation error:', error)
      // Daha detaylÄ± hata mesajÄ± gÃ¶ster
      const errorMessage = error?.message || error?.error || 'Bilinmeyen bir hata oluÅŸtu'
      toast.error(
        'Firma kaydedilemedi',
        errorMessage + ' LÃ¼tfen tÃ¼m alanlarÄ± kontrol edip tekrar deneyin.'
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

  // Logo yÃ¼kleme handler (gelecekte Supabase Storage'a yÃ¼klenecek)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // GeÃ§ici olarak base64 preview gÃ¶ster (gelecekte Supabase Storage'a yÃ¼klenecek)
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
            {company ? 'Firma DÃ¼zenle' : 'Yeni Firma'}
          </DialogTitle>
          <DialogDescription>
            {company ? 'Firma bilgilerini gÃ¼ncelleyin' : 'Yeni firma ekleyin. Zorunlu alanlar: Firma AdÄ±, Kontak KiÅŸi, Telefon, Vergi Dairesi, Vergi No'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                        Logo YÃ¼kle
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            </div>

            {/* Name - ZORUNLU */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Firma AdÄ± *</label>
              <Input
                {...register('name')}
                placeholder="Firma adÄ±"
                disabled={loading}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Contact Person - ZORUNLU */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Kontak KiÅŸi *</label>
              <Input
                {...register('contactPerson')}
                placeholder="Kontak kiÅŸi adÄ±"
                disabled={loading}
              />
              {errors.contactPerson && (
                <p className="text-sm text-red-600">{errors.contactPerson.message}</p>
              )}
            </div>

            {/* Phone - ZORUNLU (Ãœlke kodu ile) */}
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
                placeholder="KadÄ±kÃ¶y Vergi Dairesi"
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
                  <SelectItem value="MUS">MÃ¼ÅŸteri</SelectItem>
                  <SelectItem value="ALT">Alt Bayi</SelectItem>
                  <SelectItem value="PAS">Pasif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">SektÃ¶r</label>
              <Select
                value={watch('sector') || 'none'}
                onValueChange={(value) => setValue('sector', value === 'none' ? '' : value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="SektÃ¶r seÃ§in" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">SektÃ¶r SeÃ§ilmedi</SelectItem>
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
              <label className="text-sm font-medium">Åehir</label>
              <Select
                value={city || 'none'}
                onValueChange={(value) => {
                  setValue('city', value === 'none' ? '' : value)
                }}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Åehir seÃ§in" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Åehir SeÃ§ilmedi</SelectItem>
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
              <label className="text-sm font-medium">AÃ§Ä±klama</label>
              <Textarea
                {...register('description')}
                placeholder="Firma hakkÄ±nda detaylÄ± bilgi"
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
              Ä°ptal
            </Button>
            <Button
              type="submit"
              className="bg-gradient-primary text-white"
              disabled={loading}
            >
              {loading ? 'Kaydediliyor...' : company ? 'GÃ¼ncelle' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
