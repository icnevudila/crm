'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Ülke kodları ve bayrakları (emoji)
const COUNTRIES = [
  { code: '+90', name: 'Türkiye', flag: '🇹🇷' },
  { code: '+1', name: 'ABD/Kanada', flag: '🇺🇸' },
  { code: '+44', name: 'Birleşik Krallık', flag: '🇬🇧' },
  { code: '+49', name: 'Almanya', flag: '🇩🇪' },
  { code: '+33', name: 'Fransa', flag: '🇫🇷' },
  { code: '+39', name: 'İtalya', flag: '🇮🇹' },
  { code: '+34', name: 'İspanya', flag: '🇪🇸' },
  { code: '+31', name: 'Hollanda', flag: '🇳🇱' },
  { code: '+32', name: 'Belçika', flag: '🇧🇪' },
  { code: '+41', name: 'İsviçre', flag: '🇨🇭' },
  { code: '+43', name: 'Avusturya', flag: '🇦🇹' },
  { code: '+46', name: 'İsveç', flag: '🇸🇪' },
  { code: '+47', name: 'Norveç', flag: '🇳🇴' },
  { code: '+45', name: 'Danimarka', flag: '🇩🇰' },
  { code: '+358', name: 'Finlandiya', flag: '🇫🇮' },
  { code: '+7', name: 'Rusya', flag: '🇷🇺' },
  { code: '+86', name: 'Çin', flag: '🇨🇳' },
  { code: '+81', name: 'Japonya', flag: '🇯🇵' },
  { code: '+82', name: 'Güney Kore', flag: '🇰🇷' },
  { code: '+91', name: 'Hindistan', flag: '🇮🇳' },
  { code: '+971', name: 'BAE', flag: '🇦🇪' },
  { code: '+966', name: 'Suudi Arabistan', flag: '🇸🇦' },
  { code: '+20', name: 'Mısır', flag: '🇪🇬' },
  { code: '+27', name: 'Güney Afrika', flag: '🇿🇦' },
  { code: '+61', name: 'Avustralya', flag: '🇦🇺' },
  { code: '+64', name: 'Yeni Zelanda', flag: '🇳🇿' },
  { code: '+55', name: 'Brezilya', flag: '🇧🇷' },
  { code: '+52', name: 'Meksika', flag: '🇲🇽' },
  { code: '+54', name: 'Arjantin', flag: '🇦🇷' },
  { code: '+351', name: 'Portekiz', flag: '🇵🇹' },
  { code: '+30', name: 'Yunanistan', flag: '🇬🇷' },
]

interface CountryCodeSelectorProps {
  value?: string
  onValueChange: (value: string) => void
  disabled?: boolean
}

export function CountryCodeSelector({
  value = '+90',
  onValueChange,
  disabled = false,
}: CountryCodeSelectorProps) {
  const selectedCountry = COUNTRIES.find((c) => c.code === value) || COUNTRIES[0]

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className="w-[140px]">
        <div className="flex items-center gap-2">
          <span className="text-lg">{selectedCountry.flag}</span>
          <SelectValue placeholder={selectedCountry.code} />
        </div>
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        {COUNTRIES.map((country) => (
          <SelectItem key={country.code} value={country.code}>
            <span className="flex items-center gap-2">
              <span className="text-lg">{country.flag}</span>
              <span className="font-medium">{country.code}</span>
              <span className="text-sm text-gray-500">{country.name}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

