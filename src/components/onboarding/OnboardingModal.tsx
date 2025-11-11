'use client'

import React, { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import {
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  CheckCircle2,
  Circle,
  MapPin,
  CheckSquare,
  Sparkles,
  Zap,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Step {
  id: string
  title: string
  module: string
  moduleLabel: string // Sidebar'daki Türkçe isim
  whereToStart: string[]
  whatToDo: string[]
  whatHappens: string[]
  automations?: string[] // Otomatik işlemler
  nextStep?: string
  quickLink: string
  icon?: string
}

const steps: Step[] = [
  {
    id: '1',
    title: 'Müşteri Ekleme',
    module: 'customers',
    moduleLabel: 'Bireysel Müşteriler',
    whereToStart: [
      'Sol menüden "Bireysel Müşteriler" sekmesine tıkla',
      'Sağ üstteki "+ Yeni Müşteri" butonuna tıkla',
    ],
    whatToDo: [
      'Müşteri adını gir (zorunlu alan)',
      'Email adresini gir (zorunlu alan)',
      'Telefon numarasını gir (opsiyonel)',
      'Müşteri tipini seç: "Aktif Müşteri" (sistemde aktif olarak görünür)',
      'Adres bilgilerini gir (opsiyonel)',
      'Notlar ekle (opsiyonel)',
      '"Kaydet" butonuna tıkla',
    ],
    whatHappens: [
      'Müşteri başarıyla oluşturulur',
      'Müşteriler listesinde görünür',
      'Müşteri detay sayfasına gidebilirsin',
      'Artık bu müşteri için fırsat oluşturabilirsin',
      'Müşteriye bağlı tüm kayıtları (fırsat, teklif, fatura) görebilirsin',
    ],
    nextStep: '2',
    quickLink: '/customers',
    icon: '👤',
  },
  {
    id: '2',
    title: 'Fırsat Oluşturma',
    module: 'deals',
    moduleLabel: 'Fırsatlar',
    whereToStart: [
      'Sol menüden "Fırsatlar" sekmesine tıkla',
      'Sağ üstteki "+ Yeni Fırsat" butonuna tıkla',
    ],
    whatToDo: [
      'Müşteri seç (ADIM 1\'de oluşturduğun müşteriyi seç)',
      'Fırsat başlığını gir (örn: "Q1 Satış Fırsatı", "Web Sitesi Projesi")',
      'Fırsat değerini gir (örn: 50000 TL) - bu satış tutarı',
      'Aşamayı seç: "Potansiyel" (ilk aşama - yeni fırsat)',
      'Beklenen kapanış tarihini seç (ne zaman kapanmasını bekliyorsun)',
      'Kazanma olasılığını gir (opsiyonel, %0-100)',
      'Notlar ekle (opsiyonel)',
      '"Kaydet" butonuna tıkla',
    ],
    whatHappens: [
      'Fırsat başarıyla oluşturulur',
      'Kanban tahtasında "Potansiyel" sütununda görünür',
      'Fırsat detay sayfasına gidebilirsin',
      'Bu fırsat için teklif oluşturabilirsin',
      'Fırsat aşamalarını ilerletebilirsin: Potansiyel → İletişimde → Teklif → Pazarlık → Kazanıldı',
    ],
    automations: [
      'Fırsatı "Kazanıldı" yaparsan → Otomatik olarak "Sözleşmeler" sayfasında yeni bir sözleşme kaydı açılır (Taslak durumunda)',
      'Fırsatı "Kazanıldı" yaparsan → Sözleşme numarası otomatik oluşturulur (SOZL-2024-0001 formatında)',
      'Fırsatı "Kazanıldı" yaparsan → Sözleşme başlangıç tarihi bugün, bitiş tarihi 1 yıl sonra otomatik ayarlanır',
      'Fırsatı "Kazanıldı" yaparsan → "Aktiviteler" sayfasında otomasyon kaydı görünür',
      'Fırsatı "Kazanıldı" yaparsan → Sistem içi kullanıcılara (Admin, Sales) bildirim gönderilir',
      'Fırsatı "Kaybedildi" yaparsan → Kayıp sebebi girilmesi zorunludur (sistem izin vermez)',
      'Fırsatı "Kaybedildi" yaparsan → "Aktiviteler" sayfasında kayıp kaydı görünür',
    ],
    nextStep: '3',
    quickLink: '/deals',
    icon: '💼',
  },
  {
    id: '3',
    title: 'Teklif Hazırlama',
    module: 'quotes',
    moduleLabel: 'Teklifler',
    whereToStart: [
      'Sol menüden "Teklifler" sekmesine tıkla',
      'Sağ üstteki "+ Yeni Teklif" butonuna tıkla',
    ],
    whatToDo: [
      'Fırsat seç (ADIM 2\'de oluşturduğun fırsatı seç)',
      'Teklif başlığını gir (örn: "Web Sitesi Teklifi")',
      'Ürün ekle (en az 1 ürün zorunlu)',
      '  → "Ürün Ekle" butonuna tıkla',
      '  → Ürün seç (ürünler listesinden)',
      '  → Miktar gir (kaç adet)',
      '  → Birim fiyat gir (TL)',
      '  → İndirim ekle (opsiyonel)',
      'KDV oranını kontrol et (varsayılan %18)',
      'Geçerlilik tarihi seç (teklif ne kadar süre geçerli)',
      'Notlar ekle (opsiyonel)',
      '"Kaydet" butonuna tıkla',
    ],
    whatHappens: [
      'Teklif başarıyla oluşturulur',
      'Kanban tahtasında "Taslak" sütununda görünür',
      'Teklif detay sayfasına gidebilirsin',
      'PDF olarak indirebilirsin (müşteriye göndermek için)',
      'Teklif durumunu değiştirebilirsin: Taslak → Gönderildi → Kabul Edildi / Reddedildi',
    ],
    automations: [
      'Teklifi "Gönderildi" yaparsan → Sistem içi kullanıcılara (Admin, Sales) bildirim gönderilir',
      'Teklifi "Gönderildi" yaparsan → "Aktiviteler" sayfasında gönderim kaydı görünür',
      'Teklifi "Kabul Edildi" yaparsan → Otomatik olarak "Faturalar" sayfasında yeni bir fatura kaydı açılır (Taslak durumunda)',
      'Teklifi "Kabul Edildi" yaparsan → Fatura numarası otomatik oluşturulur (INV-2024-0001 formatında)',
      'Teklifi "Kabul Edildi" yaparsan → Fatura vade tarihi 30 gün sonra otomatik ayarlanır',
      'Teklifi "Kabul Edildi" yaparsan → Otomatik olarak "Sözleşmeler" sayfasında sözleşme oluşturulur (eğer daha önce oluşturulmamışsa)',
      'Teklifi "Kabul Edildi" yaparsan → "Ürünler" sayfasındaki ilgili ürünlerin stokları otomatik olarak rezerve edilir (rezerve miktar artar)',
      'Teklifi "Kabul Edildi" yaparsan → "Aktiviteler" sayfasında kabul kaydı görünür',
      'Teklifi "Kabul Edildi" yaparsan → Sistem içi kullanıcılara (Admin, Sales) bildirim gönderilir',
      'Teklifi "Reddedildi" yaparsan → Red sebebi girilmesi zorunludur',
      'Teklifi "Reddedildi" yaparsan → "Aktiviteler" sayfasında red kaydı görünür',
    ],
    nextStep: '4',
    quickLink: '/quotes',
    icon: '📝',
  },
  {
    id: '4',
    title: 'Fatura Oluşturma',
    module: 'invoices',
    moduleLabel: 'Faturalar',
    whereToStart: [
      'Sol menüden "Faturalar" sekmesine tıkla',
      'Sağ üstteki "+ Yeni Fatura" butonuna tıkla (veya tekliften otomatik oluşturulmuş faturayı bul)',
    ],
    whatToDo: [
      'Teklif seç (ADIM 3\'te oluşturduğun teklifi seç - "Kabul Edildi" durumunda olmalı)',
      'Fatura başlığını gir (örn: "Web Sitesi Faturası")',
      'Fatura numarasını kontrol et (sistem otomatik oluşturur: INV-2024-0001 formatında)',
      'Vade tarihi seç (faturanın ödeme tarihi, varsayılan 30 gün sonra)',
      'Detayları kontrol et:',
      '  → Müşteri bilgileri doğru mu?',
      '  → Ürünler ve miktarlar doğru mu?',
      '  → Toplam tutar doğru mu?',
      '  → KDV hesaplaması doğru mu?',
      'Notlar ekle (opsiyonel)',
      '"Kaydet" butonuna tıkla',
    ],
    whatHappens: [
      'Fatura başarıyla oluşturulur',
      'Kanban tahtasında "Taslak" sütununda görünür',
      'Fatura detay sayfasına gidebilirsin',
      'PDF olarak indirebilirsin (müşteriye göndermek için)',
      'Fatura durumunu değiştirebilirsin: Taslak → Gönderildi → Ödendi',
    ],
    automations: [
      'Faturayı "Gönderildi" yaparsan → Sistem içi kullanıcılara (Admin, Sales) bildirim gönderilir',
      'Faturayı "Gönderildi" yaparsan → "Aktiviteler" sayfasında gönderim kaydı görünür',
      'Faturayı "Gönderildi" yaparsan → Otomatik olarak "Sevkiyatlar" sayfasında yeni bir sevkiyat kaydı açılır (Beklemede durumunda)',
      'Faturayı "Ödendi" yaparsan → Otomatik olarak "Finans" sayfasında yeni bir gelir kaydı açılır (GELİR tipinde)',
      'Faturayı "Ödendi" yaparsan → Finans kaydı tutarı fatura tutarı ile aynı olur',
      'Faturayı "Ödendi" yaparsan → Finans kaydı tarihi bugün olarak ayarlanır',
      'Faturayı "Ödendi" yaparsan → "Ürünler" sayfasındaki ilgili ürünlerin stokları otomatik olarak düşer (stok miktarı azalır)',
      'Faturayı "Ödendi" yaparsan → Rezerve edilmiş stoklar otomatik olarak serbest bırakılır (rezerve miktar azalır)',
      'Faturayı "Ödendi" yaparsan → "Aktiviteler" sayfasında ödeme kaydı görünür',
      'Faturayı "Ödendi" yaparsan → Sistem içi kullanıcılara (Admin, Sales) bildirim gönderilir',
    ],
    nextStep: '5',
    quickLink: '/invoices',
    icon: '🧾',
  },
  {
    id: '5',
    title: 'Sevkiyat Takibi',
    module: 'shipments',
    moduleLabel: 'Sevkiyatlar',
    whereToStart: [
      'Sol menüden "Sevkiyatlar" sekmesine tıkla',
      'Sağ üstteki "+ Yeni Sevkiyat" butonuna tıkla',
    ],
    whatToDo: [
      'Fatura seç (ADIM 4\'te oluşturduğun faturayı seç)',
      'Kargo firması seç (veya manuel gir)',
      'Takip numarası gir (kargo takip kodu)',
      'Teslimat adresini kontrol et (müşteri adresi otomatik gelir)',
      'Sevkiyat tarihi seç (ne zaman gönderildi)',
      'Beklenen teslimat tarihi seç (ne zaman teslim edilecek)',
      'Durumu seç: "Beklemede" (henüz gönderilmedi)',
      'Notlar ekle (opsiyonel)',
      '"Kaydet" butonuna tıkla',
    ],
    whatHappens: [
      'Sevkiyat başarıyla oluşturulur',
      'Sevkiyat listesinde görünür',
      'Sevkiyat detay sayfasına gidebilirsin',
      'Durumunu değiştirebilirsin: Beklemede → Onaylandı → Gönderildi → Teslim Edildi',
      'Kargo takip numarası ile takip edebilirsin',
    ],
    automations: [
      'Sevkiyatı "Onaylandı" yaparsan → "Ürünler" sayfasındaki ilgili ürünlerin stokları otomatik olarak rezerve edilir (rezerve miktar artar)',
      'Sevkiyatı "Gönderildi" yaparsan → "Ürünler" sayfasındaki ilgili ürünlerin stokları otomatik olarak düşer (stok miktarı azalır)',
      'Sevkiyatı "Gönderildi" yaparsan → Rezerve edilmiş stoklar otomatik olarak serbest bırakılır (rezerve miktar azalır)',
      'Sevkiyatı "Gönderildi" yaparsan → "Aktiviteler" sayfasında gönderim kaydı görünür',
      'Sevkiyatı "Teslim Edildi" yaparsan → Sistem içi kullanıcılara (Admin, Sales) bildirim gönderilir',
      'Sevkiyatı "Teslim Edildi" yaparsan → "Aktiviteler" sayfasında teslimat kaydı görünür',
      'Sevkiyatı "Teslim Edildi" yaparsan → Sistem içi kullanıcılara (Admin, Sales) bildirim gönderilir',
    ],
    nextStep: '6',
    quickLink: '/shipments',
    icon: '🚚',
  },
  {
    id: '6',
    title: 'Dashboard Kullanımı',
    module: 'dashboard',
    moduleLabel: 'Dashboard',
    whereToStart: [
      'Sol menüden "Dashboard" sekmesine tıkla (genelde ilk açılan sayfa)',
      'Ana sayfada KPI kartlarını ve grafikleri gör',
    ],
    whatToDo: [
      'KPI kartlarını incele:',
      '  → Toplam Fırsat sayısı',
      '  → Toplam Teklif sayısı ve değeri',
      '  → Toplam Fatura sayısı ve değeri',
      '  → Toplam Müşteri sayısı',
      '  → Bu ay satış tutarı',
      '  → Bekleyen görevler',
      'Grafikleri kontrol et:',
      '  → Satış trendi (aylık/haftalık)',
      '  → Durum dağılımı (fırsat, teklif, fatura durumları)',
      '  → Müşteri segmentleri',
      '  → Ürün satış performansı',
      'Son aktiviteleri görüntüle (kim ne yaptı, ne zaman)',
      'Hızlı aksiyon butonlarını kullan (yeni fırsat, teklif, fatura oluştur)',
    ],
    whatHappens: [
      'Tüm sistem özetini görürsün (tek bakışta)',
      'Performans metriklerini takip edebilirsin',
      'Hızlıca ilgili modüllere geçebilirsin (KPI kartlarına tıklayarak)',
      'Grafiklerden detaylı analiz yapabilirsin',
      'Son aktivitelerden sistemdeki değişiklikleri takip edebilirsin',
    ],
    nextStep: '7',
    quickLink: '/dashboard',
    icon: '📊',
  },
  {
    id: '7',
    title: 'Müşteri Firmaları Ekleme',
    module: 'companies',
    moduleLabel: 'Müşteri Firmalar',
    whereToStart: [
      'Sol menüden "Müşteri Firmalar" sekmesine tıkla',
      'Sağ üstteki "+ Yeni Firma" butonuna tıkla',
    ],
    whatToDo: [
      'Firma adını gir (zorunlu alan)',
      'Firma tipini seç (Şirket, Limited, Anonim vb.)',
      'Vergi numarası gir (opsiyonel)',
      'Email adresini gir (firma e-posta adresi)',
      'Telefon numarasını gir (firma telefonu)',
      'Adres bilgilerini gir (firma adresi)',
      'Web sitesi gir (opsiyonel)',
      'Notlar ekle (opsiyonel)',
      '"Kaydet" butonuna tıkla',
    ],
    whatHappens: [
      'Firma başarıyla oluşturulur',
      'Firmalar listesinde görünür',
      'Firma detay sayfasına gidebilirsin',
      'Bu firma için yetkili kişi (Firma Yetkilileri) ekleyebilirsin',
      'Bu firma için fırsat oluşturabilirsin',
      'Firmaya bağlı tüm kayıtları (fırsat, teklif, fatura) görebilirsin',
    ],
    nextStep: '8',
    quickLink: '/companies',
    icon: '🏢',
  },
  {
    id: '8',
    title: 'Firma Yetkilileri Ekleme',
    module: 'contacts',
    moduleLabel: 'Firma Yetkilileri',
    whereToStart: [
      'Sol menüden "Firma Yetkilileri" sekmesine tıkla',
      'Sağ üstteki "+ Yeni Yetkili" butonuna tıkla',
    ],
    whatToDo: [
      'Müşteri firması seç (ADIM 7\'de oluşturduğun firmayı seç)',
      'Yetkili adını gir (zorunlu alan)',
      'Soyadını gir (zorunlu alan)',
      'Email adresini gir (zorunlu alan)',
      'Telefon numarasını gir (opsiyonel)',
      'Pozisyonu gir (örn: Genel Müdür, Satış Müdürü)',
      'Rol seç (Karar Verici, Etkileyici, Kullanıcı vb.)',
      'Durum seç: "Aktif" (sistemde aktif olarak görünür)',
      'Notlar ekle (opsiyonel)',
      '"Kaydet" butonuna tıkla',
    ],
    whatHappens: [
      'Yetkili başarıyla oluşturulur',
      'Yetkililer listesinde görünür',
      'Yetkili detay sayfasına gidebilirsin',
      'Bu yetkili ile görüşme planlayabilirsin',
      'Bu yetkiliye e-posta gönderebilirsin',
      'Yetkiliye bağlı tüm kayıtları (görüşme, fırsat) görebilirsin',
    ],
    nextStep: '9',
    quickLink: '/contacts',
    icon: '👔',
  },
  {
    id: '9',
    title: 'Görüşme Planlama',
    module: 'meetings',
    moduleLabel: 'Görüşmeler',
    whereToStart: [
      'Sol menüden "Görüşmeler" sekmesine tıkla',
      'Sağ üstteki "+ Yeni Görüşme" butonuna tıkla',
    ],
    whatToDo: [
      'Müşteri seç (bireysel müşteri veya firma yetkilisi)',
      'Fırsat seç (opsiyonel - ilgili fırsat varsa)',
      'Görüşme başlığını gir (örn: "Satış Görüşmesi", "Teknik Sunum")',
      'Görüşme tarihi seç (ne zaman yapılacak)',
      'Görüşme saatini seç (başlangıç ve bitiş saati)',
      'Görüşme tipini seç (Yüz yüze, Telefon, Video konferans)',
      'Konum gir (yüz yüze görüşmeler için)',
      'Açıklama ekle (görüşme konusu, gündem maddeleri)',
      'Notlar ekle (opsiyonel)',
      '"Kaydet" butonuna tıkla',
    ],
    whatHappens: [
      'Görüşme başarıyla oluşturulur',
      'Görüşmeler listesinde görünür',
      'Görüşme detay sayfasına gidebilirsin',
      'Görüşme takviminde görünür',
      'Görüşme tarihinden 1 gün önce hatırlatıcı bildirimi alırsın',
    ],
    automations: [
      'Görüşme oluşturulduğunda → Hatırlatıcı bildirimi ayarlanır',
      'Görüşme tarihinden 1 gün önce → Sistem içi kullanıcılara (Admin, Sales) bildirim gönderilir',
      'Görüşme tamamlandığında → "Aktiviteler" sayfasında tamamlanma kaydı görünür',
      'Görüşme tamamlandığında → İlgili modüle (Deal, Customer) bağlıysa bilgilendirme yapılır',
    ],
    nextStep: '10',
    quickLink: '/meetings',
    icon: '📅',
  },
  {
    id: '10',
    title: 'Sözleşme Yönetimi',
    module: 'contracts',
    moduleLabel: 'Sözleşmeler',
    whereToStart: [
      'Sol menüden "Sözleşmeler" sekmesine tıkla',
      'Sağ üstteki "+ Yeni Sözleşme" butonuna tıkla (veya fırsattan otomatik oluşturulmuş sözleşmeyi bul)',
    ],
    whatToDo: [
      'Fırsat seç (ADIM 2\'de "Kazanıldı" yaptığın fırsatı seç - otomatik oluşturulmuş olabilir)',
      'Sözleşme başlığını gir (örn: "Yıllık Hizmet Sözleşmesi")',
      'Sözleşme numarasını kontrol et (sistem otomatik oluşturur: SOZL-2024-0001 formatında)',
      'Başlangıç tarihi seç (sözleşme ne zaman başlayacak)',
      'Bitiş tarihi seç (sözleşme ne zaman bitecek)',
      'Sözleşme tipini seç (Hizmet, Ürün, Karma)',
      'Durum seç: "Taslak" (henüz imzalanmadı)',
      'Otomatik yenileme aktif mi? (süre dolunca otomatik yenilensin mi?)',
      'Sözleşme detaylarını gir (maddeler, koşullar)',
      'Notlar ekle (opsiyonel)',
      '"Kaydet" butonuna tıkla',
    ],
    whatHappens: [
      'Sözleşme başarıyla oluşturulur',
      'Sözleşmeler listesinde görünür',
      'Sözleşme detay sayfasına gidebilirsin',
      'PDF olarak indirebilirsin (imzalamak için)',
      'Sözleşme durumunu değiştirebilirsin: Taslak → Aktif → Süresi Doldu / Yenilendi',
    ],
    automations: [
      'Sözleşmeyi "Aktif" yaparsan → Sözleşme başlar ve takip edilir',
      'Sözleşmeyi "Aktif" yaparsan → Sözleşme başlangıç tarihi bugün olarak ayarlanır',
      'Sözleşmeyi "Aktif" yaparsan → Yenileme bildirimleri aktif olur (30 gün önce)',
      'Sözleşmeyi "Aktif" yaparsan → "Aktiviteler" sayfasında aktivasyon kaydı görünür',
      'Sözleşme süresi dolduğunda (otomatik) → Sözleşme otomatik olarak "Süresi Doldu" durumuna geçer',
      'Sözleşme süresi dolduğunda (otomatik) → Sistem günlük kontrol eder (cron job)',
      'Sözleşme süresi dolduğunda (otomatik) → Sistem içi kullanıcılara (Admin, Sales) bildirim gönderilir',
      'Otomatik yenileme aktifse (autoRenewEnabled = true) → Sözleşme otomatik olarak yenilenir',
      'Otomatik yenileme aktifse → Yeni sözleşme kaydı otomatik oluşturulur (Taslak durumunda)',
      'Otomatik yenileme aktifse → Eski sözleşme "Yenilendi" durumuna geçer',
    ],
    nextStep: '11',
    quickLink: '/contracts',
    icon: '📄',
  },
  {
    id: '11',
    title: 'Ürün Yönetimi',
    module: 'products',
    moduleLabel: 'Ürünler',
    whereToStart: [
      'Sol menüden "Ürünler" sekmesine tıkla',
      'Sağ üstteki "+ Yeni Ürün" butonuna tıkla',
    ],
    whatToDo: [
      'Ürün adını gir (zorunlu alan)',
      'Ürün kodu gir (opsiyonel - SKU, barkod vb.)',
      'Ürün kategorisini seç (Kategori, Alt kategori)',
      'Birim fiyat gir (TL)',
      'KDV oranı seç (varsayılan %18)',
      'Stok miktarı gir (kaç adet var)',
      'Minimum stok seviyesi gir (kritik seviye)',
      'Rezerve miktar kontrol et (rezerve edilmiş ürünler)',
      'Ürün açıklaması gir (ürün özellikleri, detaylar)',
      'Ürün fotoğrafı yükle (opsiyonel)',
      'Durum seç: "Aktif" (satışa hazır)',
      'Notlar ekle (opsiyonel)',
      '"Kaydet" butonuna tıkla',
    ],
    whatHappens: [
      'Ürün başarıyla oluşturulur',
      'Ürünler listesinde görünür',
      'Ürün detay sayfasına gidebilirsin',
      'Bu ürünü teklif ve faturalara ekleyebilirsin',
      'Stok takibini yapabilirsin (giriş, çıkış, rezerve)',
      'Stok seviyesi kritik seviyenin altına düşerse uyarı alırsın',
    ],
    automations: [
      'Teklif "Kabul Edildi" yapıldığında (otomatik) → "Ürünler" sayfasındaki ilgili ürünlerin stokları rezerve edilir',
      'Teklif "Kabul Edildi" yapıldığında → Rezerve miktar artar (ürünler rezerve edilir)',
      'Teklif "Kabul Edildi" yapıldığında → Stok miktarı değişmez, sadece rezerve miktar artar',
      'Fatura "Ödendi" yapıldığında (otomatik) → "Ürünler" sayfasındaki ilgili ürünlerin stokları düşer',
      'Fatura "Ödendi" yapıldığında → Stok miktarı azalır (ürünler satıldı)',
      'Fatura "Ödendi" yapıldığında → Rezerve edilmiş stoklar otomatik olarak serbest bırakılır',
      'Sevkiyat "Gönderildi" yapıldığında (otomatik) → "Ürünler" sayfasındaki ilgili ürünlerin stokları düşer',
      'Sevkiyat "Gönderildi" yapıldığında → Stok miktarı azalır (ürünler gönderildi)',
      'Stok kritik seviyeye düştüğünde (otomatik) → Sistem içi kullanıcılara (Admin, Sales) bildirim gönderilir',
      'Stok kritik seviyeye düştüğünde → Minimum stok seviyesinin altına düşen ürünler için uyarı',
      'Stok kritik seviyeye düştüğünde → "Aktiviteler" sayfasında stok uyarısı kaydı görünür',
    ],
    nextStep: '12',
    quickLink: '/products',
    icon: '📦',
  },
  {
    id: '12',
    title: 'Finans Yönetimi',
    module: 'finance',
    moduleLabel: 'Finans',
    whereToStart: [
      'Sol menüden "Finans" sekmesine tıkla',
      'Sağ üstteki "+ Yeni Finans Kaydı" butonuna tıkla (veya faturadan otomatik oluşturulmuş kaydı bul)',
    ],
    whatToDo: [
      'Finans tipini seç: "GELİR" (para girişi) veya "GİDER" (para çıkışı)',
      'Fatura seç (opsiyonel - eğer faturadan kaynaklanıyorsa)',
      'Tutar gir (TL)',
      'Tarih seç (işlem tarihi)',
      'Kategori seç (Satış, Hizmet, Masraf, Gider vb.)',
      'Açıklama gir (işlem detayı)',
      'Ödeme yöntemi seç (Nakit, Kredi Kartı, Banka Transferi vb.)',
      'Notlar ekle (opsiyonel)',
      '"Kaydet" butonuna tıkla',
    ],
    whatHappens: [
      'Finans kaydı başarıyla oluşturulur',
      'Finans listesinde görünür',
      'Finans detay sayfasına gidebilirsin',
      'Gelir/Gider raporlarında görünür',
      'Finans durumunu takip edebilirsin (toplam gelir, toplam gider, kar/zarar)',
    ],
    automations: [
      'Fatura "Ödendi" yapıldığında (otomatik) → Otomatik olarak "Finans" sayfasında yeni bir gelir kaydı açılır',
      'Fatura "Ödendi" yapıldığında → Finans kaydı tipi "GELİR" olarak ayarlanır',
      'Fatura "Ödendi" yapıldığında → Finans kaydı tutarı fatura tutarı ile aynı olur',
      'Fatura "Ödendi" yapıldığında → Finans kaydı tarihi bugün olarak ayarlanır',
      'Fatura "Ödendi" yapıldığında → "Aktiviteler" sayfasında finans kaydı görünür',
      'Manuel finans kaydı oluşturduğunda → Finans kaydı oluşturulur ve takip edilir',
      'Manuel finans kaydı oluşturduğunda → Gelir veya gider olarak kaydedilir',
      'Manuel finans kaydı oluşturduğunda → "Aktiviteler" sayfasında kayıt görünür',
      'Manuel finans kaydı oluşturduğunda → Finans raporlarında görünür',
    ],
    nextStep: '13',
    quickLink: '/finance',
    icon: '💰',
  },
  {
    id: '13',
    title: 'Görev Yönetimi',
    module: 'tasks',
    moduleLabel: 'Görevler',
    whereToStart: [
      'Sol menüden "Görevler" sekmesine tıkla',
      'Sağ üstteki "+ Yeni Görev" butonuna tıkla',
    ],
    whatToDo: [
      'Görev başlığını gir (zorunlu alan)',
      'Görev açıklaması gir (ne yapılacak)',
      'İlgili modül seç (opsiyonel - Fırsat, Müşteri, Teklif, Fatura vb.)',
      'İlgili kayıt seç (seçtiğin modüle ait kayıt)',
      'Atanan kişi seç (kime atanacak)',
      'Öncelik seç (Düşük, Orta, Yüksek, Acil)',
      'Durum seç: "Beklemede" (henüz başlanmadı)',
      'Başlangıç tarihi seç (ne zaman başlayacak)',
      'Bitiş tarihi seç (ne zaman tamamlanacak)',
      'Notlar ekle (opsiyonel)',
      '"Kaydet" butonuna tıkla',
    ],
    whatHappens: [
      'Görev başarıyla oluşturulur',
      'Görevler listesinde görünür',
      'Görev detay sayfasına gidebilirsin',
      'Kanban tahtasında görünür (Beklemede, Devam Ediyor, Tamamlandı)',
      'Görev durumunu değiştirebilirsin: Beklemede → Devam Ediyor → Tamamlandı',
      'Görev son tarihi yaklaştığında hatırlatıcı bildirimi alırsın',
    ],
    automations: [
      'Görevi "Tamamlandı" yaparsan → Görev tamamlanır ve takip edilir',
      'Görevi "Tamamlandı" yaparsan → "Aktiviteler" sayfasında tamamlanma kaydı görünür',
      'Görevi "Tamamlandı" yaparsan → İlgili modüle (Deal, Customer, Quote) bağlıysa bilgilendirme yapılır',
      'Görev son tarihi yaklaştığında (otomatik) → Hatırlatıcı bildirimi gönderilir',
      'Görev son tarihi yaklaştığında → Son tarihten 1 gün önce sistem içi kullanıcılara (Admin, Sales) bildirim gönderilir',
      'Görev son tarihi yaklaştığında → "Aktiviteler" sayfasında hatırlatıcı kaydı görünür',
    ],
    nextStep: '14',
    quickLink: '/tasks',
    icon: '✅',
  },
  {
    id: '14',
    title: 'Destek Talebi Yönetimi',
    module: 'tickets',
    moduleLabel: 'Destek Talepleri',
    whereToStart: [
      'Sol menüden "Destek Talepleri" sekmesine tıkla',
      'Sağ üstteki "+ Yeni Destek Talebi" butonuna tıkla',
    ],
    whatToDo: [
      'Müşteri seç (hangi müşteriden gelen talep)',
      'Talep başlığını gir (zorunlu alan)',
      'Talep açıklaması gir (ne sorun var, ne isteniyor)',
      'Öncelik seç (Düşük, Orta, Yüksek, Acil)',
      'Kategori seç (Teknik Destek, Satış, Fatura, Ürün vb.)',
      'Atanan kişi seç (kime atanacak)',
      'Durum seç: "Açık" (henüz çözülmedi)',
      'Notlar ekle (opsiyonel)',
      '"Kaydet" butonuna tıkla',
    ],
    whatHappens: [
      'Destek talebi başarıyla oluşturulur',
      'Destek talepleri listesinde görünür',
      'Destek talebi detay sayfasına gidebilirsin',
      'Kanban tahtasında görünür (Açık, Devam Ediyor, Çözüldü, Kapatıldı)',
      'Destek talebi durumunu değiştirebilirsin: Açık → Devam Ediyor → Çözüldü → Kapatıldı',
      'Yanıtlanmayan talepler otomatik yükseltilir',
    ],
    automations: [
      'Destek talebini "Kapatıldı" yaparsan → Talep kapatılır ve arşivlenir',
      'Destek talebini "Kapatıldı" yaparsan → "Aktiviteler" sayfasında kapanış kaydı görünür',
      'Destek talebini "Kapatıldı" yaparsan → Müşteri memnuniyeti takibi yapılabilir',
      'Destek talebi yanıtlanmadığında (otomatik) → Yükseltme (escalation) bildirimi gönderilir',
      'Destek talebi yanıtlanmadığında → Belirli süre yanıtlanmayan talepler otomatik yükseltilir',
      'Destek talebi yanıtlanmadığında → Sistem içi kullanıcılara (Admin, Sales) bildirim gönderilir',
      'Destek talebi yanıtlanmadığında → "Aktiviteler" sayfasında yükseltme kaydı görünür',
    ],
    nextStep: '15',
    quickLink: '/tickets',
    icon: '🎫',
  },
  {
    id: '15',
    title: 'Tedarikçi Yönetimi',
    module: 'vendors',
    moduleLabel: 'Tedarikçiler',
    whereToStart: [
      'Sol menüden "Tedarikçiler" sekmesine tıkla',
      'Sağ üstteki "+ Yeni Tedarikçi" butonuna tıkla',
    ],
    whatToDo: [
      'Tedarikçi adını gir (zorunlu alan)',
      'Tedarikçi tipini seç (Şirket, Bireysel, Yurtdışı)',
      'Vergi numarası gir (opsiyonel)',
      'Email adresini gir (tedarikçi e-posta adresi)',
      'Telefon numarasını gir (tedarikçi telefonu)',
      'Adres bilgilerini gir (tedarikçi adresi)',
      'Web sitesi gir (opsiyonel)',
      'İletişim kişisi gir (tedarikçi iletişim kişisi)',
      'Notlar ekle (opsiyonel)',
      '"Kaydet" butonuna tıkla',
    ],
    whatHappens: [
      'Tedarikçi başarıyla oluşturulur',
      'Tedarikçiler listesinde görünür',
      'Tedarikçi detay sayfasına gidebilirsin',
      'Bu tedarikçiye teklif gönderebilirsin',
      'Bu tedarikçiden ürün satın alabilirsin',
      'Tedarikçiye bağlı tüm kayıtları (teklif, satın alma) görebilirsin',
    ],
    nextStep: '16',
    quickLink: '/vendors',
    icon: '🏪',
  },
  {
    id: '16',
    title: 'Raporlar ve Analizler',
    module: 'reports',
    moduleLabel: 'Raporlar',
    whereToStart: [
      'Sol menüden "Raporlar" sekmesine tıkla',
      'Rapor türünü seç (Satış Raporu, Müşteri Raporu, Ürün Raporu vb.)',
    ],
    whatToDo: [
      'Tarih aralığı seç (başlangıç ve bitiş tarihi)',
      'Filtreleri uygula:',
      '  → Müşteri seç (belirli müşteri veya tümü)',
      '  → Ürün seç (belirli ürün veya tümü)',
      '  → Durum seç (Taslak, Gönderildi, Ödendi vb.)',
      '  → Kullanıcı seç (kimin kayıtları)',
      'Raporu görüntüle (tablo formatında)',
      'Raporu dışa aktar:',
      '  → Excel olarak indir (.xlsx)',
      '  → PDF olarak indir (.pdf)',
      '  → CSV olarak indir (.csv)',
    ],
    whatHappens: [
      'Detaylı raporlar görüntülenir (tüm kayıtlar, toplamlar, istatistikler)',
      'Analiz yapabilirsin (hangi müşteri daha çok satın alıyor, hangi ürün daha çok satılıyor)',
      'Raporları dışa aktarabilirsin (Excel, PDF, CSV)',
      'Raporları yazdırabilirsin',
      'Raporları e-posta ile paylaşabilirsin',
    ],
    quickLink: '/reports',
    icon: '📈',
  },
]

interface OnboardingModalProps {
  open: boolean
  onClose: () => void
}

export function OnboardingModal({ open, onClose }: OnboardingModalProps) {
  const locale = useLocale()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  const currentStepData = steps.find((s) => s.id === String(currentStep)) || steps[0]
  const progress = (currentStep / steps.length) * 100

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleQuickLink = () => {
    // Yeni sekmede aç - kılavuz açık kalsın
    window.open(`/${locale}${currentStepData.quickLink}`, '_blank')
  }

  const handleStepComplete = (stepId: number) => {
    const newCompleted = new Set(completedSteps)
    if (newCompleted.has(stepId)) {
      newCompleted.delete(stepId)
    } else {
      newCompleted.add(stepId)
    }
    setCompletedSteps(newCompleted)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-6 w-6 text-indigo-600" />
            Sistem Rehberi - Adım Adım Kılavuz
          </DialogTitle>
          <DialogDescription>
            CRM sistemini kullanmaya başlamak için adım adım talimatları takip et
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">İlerleme</span>
            <span className="font-semibold text-indigo-600">
              Adım {currentStep} / {steps.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Navigation Buttons - ÜSTTE */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={cn(
                "flex items-center gap-2",
                currentStep === 1 ? "opacity-50 cursor-not-allowed" : "text-gray-700 hover:text-indigo-600"
              )}
            >
              <ChevronLeft className="h-4 w-4" />
              Önceki Sayfa
            </Button>
            <Button
              variant="outline"
              onClick={handleQuickLink}
              className="flex items-center gap-2 text-indigo-700 hover:text-indigo-800 border-indigo-200 hover:border-indigo-300"
            >
              <ExternalLink className="h-4 w-4" />
              Hızlı Git →
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {currentStep < steps.length ? (
              <Button 
                onClick={handleNext} 
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Sonraki Sayfa
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={onClose} 
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle2 className="h-4 w-4" />
                Tamamlandı
              </Button>
            )}
          </div>
        </div>

        {/* Current Step Card */}
        <Card className="border-2 border-indigo-100">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-2xl">
                  {currentStepData.icon || '📍'}
                </div>
                <div>
                  <CardTitle className="text-xl">
                    ADIM {currentStep}: {currentStepData.title}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {currentStepData.moduleLabel || currentStepData.module} modülü
                  </CardDescription>
                </div>
              </div>
              <Checkbox
                checked={completedSteps.has(currentStep)}
                onCheckedChange={() => handleStepComplete(currentStep)}
                className="h-5 w-5"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Nereden Başla */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700">
                <MapPin className="h-4 w-4" />
                NEREDEN BAŞLA:
              </div>
              <ul className="space-y-1.5 pl-6">
                {currentStepData.whereToStart.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <Circle className="h-3 w-3 mt-1.5 flex-shrink-0 text-indigo-500 fill-current" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Ne Yapacaksın */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-green-700">
                <CheckSquare className="h-4 w-4" />
                NE YAPACAKSIN:
              </div>
              <ol className="space-y-1.5 pl-6">
                {currentStepData.whatToDo.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-xs font-semibold text-green-700 flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Sonra Ne Olur */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-purple-700">
                <Sparkles className="h-4 w-4" />
                SONRA NE OLUR:
              </div>
              <ul className="space-y-1.5 pl-6">
                {currentStepData.whatHappens.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-purple-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Otomatik İşlemler */}
            {currentStepData.automations && currentStepData.automations.length > 0 && (
              <div className="space-y-2 rounded-lg bg-yellow-50 p-4 border border-yellow-200">
                <div className="flex items-center gap-2 text-sm font-semibold text-yellow-800">
                  <Zap className="h-4 w-4" />
                  OTOMATİK İŞLEMLER (Bunu Yaparsan Bu Olur):
                </div>
                <ul className="space-y-2 pl-6">
                  {currentStepData.automations.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-yellow-900">
                      <ArrowRight className="h-4 w-4 mt-0.5 flex-shrink-0 text-yellow-700" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Next Step Hint */}
            {currentStepData.nextStep && (
              <div className="rounded-lg bg-indigo-50 p-3 border border-indigo-100">
                <p className="text-sm text-indigo-700 flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  <strong>Sonraki Adım:</strong> ADIM {currentStepData.nextStep} -{' '}
                  {steps.find((s) => s.id === currentStepData.nextStep)?.title}
                </p>
              </div>
            )}
          </CardContent>
        </Card>


        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-2 pt-4 border-t">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(index + 1)}
              className={cn(
                'h-2 w-2 rounded-full transition-all',
                currentStep === index + 1
                  ? 'bg-indigo-600 w-8'
                  : completedSteps.has(index + 1)
                    ? 'bg-green-500'
                    : 'bg-gray-300 hover:bg-gray-400'
              )}
              aria-label={`Adım ${index + 1}: ${step.title}`}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

