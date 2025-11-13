/**
 * İş Akışı Adımları - Her modül için workflow tanımları
 */

// Deal Workflow Steps
export function getDealWorkflowSteps(currentStage: string) {
  const stages = ['LEAD', 'CONTACTED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']
  const currentIndex = stages.indexOf(currentStage)

  return [
    {
      id: 'lead',
      label: 'Potansiyel',
      description: 'Yeni fırsat',
      status:
        currentStage === 'LEAD'
          ? 'current'
          : currentIndex > 0
          ? 'completed'
          : 'upcoming',
      requirements:
        currentStage === 'LEAD' ? ['Müşteri bilgilerini ekleyin'] : undefined,
    },
    {
      id: 'contacted',
      label: 'İletişimde',
      description: 'Müşteri ile görüşüldü',
      status:
        currentStage === 'CONTACTED'
          ? 'current'
          : currentIndex > stages.indexOf('CONTACTED')
          ? 'completed'
          : currentIndex < stages.indexOf('CONTACTED')
          ? 'locked'
          : 'upcoming',
      requirements:
        currentStage === 'CONTACTED'
          ? ['Müşteri seçimi zorunlu', 'İletişim notlarını ekleyin']
          : undefined,
    },
    {
      id: 'proposal',
      label: 'Teklif',
      description: 'Teklif hazırlandı',
      status:
        currentStage === 'PROPOSAL'
          ? 'current'
          : currentIndex > stages.indexOf('PROPOSAL')
          ? 'completed'
          : currentIndex < stages.indexOf('PROPOSAL')
          ? 'locked'
          : 'upcoming',
      requirements:
        currentStage === 'PROPOSAL'
          ? ['Quote modülünden teklif oluşturun', 'Fiyat ve ürünleri belirleyin']
          : undefined,
    },
    {
      id: 'negotiation',
      label: 'Pazarlık',
      description: 'Müzakere aşaması',
      status:
        currentStage === 'NEGOTIATION'
          ? 'current'
          : currentIndex > stages.indexOf('NEGOTIATION')
          ? 'completed'
          : currentIndex < stages.indexOf('NEGOTIATION')
          ? 'locked'
          : 'upcoming',
      requirements:
        currentStage === 'NEGOTIATION'
          ? ['Fiyat görüşmelerini tamamlayın', 'Şartları netleştirin']
          : undefined,
    },
    {
      id: 'won',
      label: 'Kazanıldı',
      description: 'Fırsat kazanıldı',
      status:
        currentStage === 'WON'
          ? 'current'
          : currentStage === 'LOST'
          ? 'locked'
          : 'upcoming',
      requirements:
        currentStage === 'NEGOTIATION'
          ? ['Fırsat değerini (value) girin', 'Sözleşme imzalatın']
          : undefined,
    },
  ]
}

// Quote Workflow Steps
export function getQuoteWorkflowSteps(currentStatus: string) {
  const statuses = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED']
  const currentIndex = statuses.indexOf(currentStatus)

  return [
    {
      id: 'draft',
      label: 'Taslak',
      description: 'Teklif hazırlanıyor',
      status:
        currentStatus === 'DRAFT'
          ? 'current'
          : currentIndex > 0
          ? 'completed'
          : 'upcoming',
      requirements:
        currentStatus === 'DRAFT'
          ? [
              'Müşteri seçin',
              'En az 1 ürün ekleyin',
              'Toplam tutarı hesaplayın',
              'Teklif detaylarını doldurun',
            ]
          : undefined,
    },
    {
      id: 'sent',
      label: 'Gönderildi',
      description: 'Müşteriye iletildi',
      status:
        currentStatus === 'SENT'
          ? 'current'
          : currentIndex > statuses.indexOf('SENT')
          ? 'completed'
          : currentIndex < statuses.indexOf('SENT')
          ? 'locked'
          : 'upcoming',
      requirements:
        currentStatus === 'SENT'
          ? ['Müşteri onayını bekleyin', 'Takip görüşmesi yapın']
          : undefined,
    },
    {
      id: 'accepted',
      label: 'Onaylandı',
      description: 'Müşteri onayladı',
      status:
        currentStatus === 'ACCEPTED'
          ? 'current'
          : currentStatus === 'REJECTED' || currentStatus === 'EXPIRED'
          ? 'locked'
          : 'upcoming',
      requirements:
        currentStatus === 'SENT'
          ? [
              'Müşteri onayını alın',
              'Otomatik: Fatura oluşturulacak',
              'Otomatik: Sözleşme oluşturulacak',
            ]
          : undefined,
    },
  ]
}

// Invoice Workflow Steps
export function getInvoiceWorkflowSteps(
  currentStatus: string,
  invoiceType?: 'SALES' | 'PURCHASE' | 'SERVICE_SALES' | 'SERVICE_PURCHASE'
) {
  // Fatura tipine göre status sırası belirle
  let statuses: string[]
  if (invoiceType === 'SALES') {
    statuses = ['DRAFT', 'SENT', 'SHIPPED', 'PAID', 'OVERDUE', 'CANCELLED']
  } else if (invoiceType === 'PURCHASE') {
    statuses = ['DRAFT', 'SENT', 'RECEIVED', 'PAID', 'OVERDUE', 'CANCELLED']
  } else {
    // Hizmet faturaları veya tip belirtilmemişse SHIPPED/RECEIVED yok
    statuses = ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']
  }

  const currentIndex = statuses.indexOf(currentStatus)

  const steps: Array<{
    id: string
    label: string
    description: string
    status: 'current' | 'completed' | 'upcoming' | 'locked'
    requirements?: string[]
  }> = [
    {
      id: 'draft',
      label: 'Taslak',
      description: 'Fatura hazırlanıyor',
      status:
        currentStatus === 'DRAFT'
          ? 'current'
          : currentIndex > 0
          ? 'completed'
          : 'upcoming',
      requirements:
        currentStatus === 'DRAFT'
          ? [
              'Müşteri/Tedarikçi seçin',
              invoiceType === 'SERVICE_SALES' || invoiceType === 'SERVICE_PURCHASE'
                ? 'Hizmet açıklaması girin'
                : 'En az 1 ürün ekleyin',
              'Fatura numarası girin',
              'Vade tarihi belirleyin',
              'Toplam tutarı hesaplayın',
            ]
          : undefined,
    },
    {
      id: 'sent',
      label: 'Gönderildi',
      description: 'Müşteriye/Tedarikçiye iletildi',
      status:
        currentStatus === 'SENT'
          ? 'current'
          : currentIndex > statuses.indexOf('SENT') && currentStatus !== 'OVERDUE'
          ? 'completed'
          : currentIndex < statuses.indexOf('SENT')
          ? 'locked'
          : 'upcoming',
      requirements:
        currentStatus === 'SENT'
          ? invoiceType === 'SALES'
            ? [
                'Sevkiyat yapılmasını bekleyin',
                'Sevkiyat tamamlandığında "Sevkiyat Yapıldı" statüsüne geçin',
                'Vade tarihini takip edin',
              ]
            : invoiceType === 'PURCHASE'
            ? [
                'Mal kabul edilmesini bekleyin',
                'Mal kabul tamamlandığında "Mal Kabul Edildi" statüsüne geçin',
                'Vade tarihini takip edin',
              ]
            : [
                'Ödeme yapılmasını bekleyin',
                'Vade tarihini takip edin',
                'Gerekirse hatırlatma gönderin',
              ]
          : undefined,
    },
  ]

  // Satış faturaları için SHIPPED adımı ekle
  if (invoiceType === 'SALES') {
    steps.push({
      id: 'shipped',
      label: 'Sevkiyat Yapıldı',
      description: 'Ürünler sevk edildi',
      status:
        currentStatus === 'SHIPPED'
          ? 'current'
          : currentIndex > statuses.indexOf('SHIPPED')
          ? 'completed'
          : currentIndex < statuses.indexOf('SHIPPED')
          ? 'locked'
          : 'upcoming',
      requirements:
        currentStatus === 'SHIPPED'
          ? [
              'Sevkiyat onaylandı',
              'Stoktan düşüldü',
              'Müşteriye teslim edilmesini bekleyin',
            ]
          : undefined,
    })
  }

  // Alış faturaları için RECEIVED adımı ekle
  if (invoiceType === 'PURCHASE') {
    steps.push({
      id: 'received',
      label: 'Mal Kabul Edildi',
      description: 'Ürünler teslim alındı',
      status:
        currentStatus === 'RECEIVED'
          ? 'current'
          : currentIndex > statuses.indexOf('RECEIVED')
          ? 'completed'
          : currentIndex < statuses.indexOf('RECEIVED')
          ? 'locked'
          : 'upcoming',
      requirements:
        currentStatus === 'RECEIVED'
          ? [
              'Mal kabul onaylandı',
              'Stoğa giriş yapıldı',
              'Ödeme yapılmasını bekleyin',
            ]
          : undefined,
    })
  }

  steps.push({
    id: 'paid',
    label: 'Ödendi',
    description: 'Tahsilat yapıldı',
    status:
      currentStatus === 'PAID'
        ? 'current'
        : currentStatus === 'CANCELLED'
        ? 'locked'
        : 'upcoming',
    requirements:
      currentStatus === 'SENT' ||
      currentStatus === 'SHIPPED' ||
      currentStatus === 'RECEIVED' ||
      currentStatus === 'OVERDUE'
        ? [
            'Ödeme tarihi girin',
            'Otomatik: Finance kaydı oluşturulacak',
            'Makbuz/dekont ekleyin',
          ]
        : undefined,
  })

  return steps
}

// Contract Workflow Steps
export function getContractWorkflowSteps(currentStatus: string) {
  const statuses = ['DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED']
  const currentIndex = statuses.indexOf(currentStatus)

  return [
    {
      id: 'draft',
      label: 'Taslak',
      description: 'Sözleşme hazırlanıyor',
      status:
        currentStatus === 'DRAFT'
          ? 'current'
          : currentIndex > 0
          ? 'completed'
          : 'upcoming',
      requirements:
        currentStatus === 'DRAFT'
          ? [
              'Müşteri seçin',
              'Başlangıç ve bitiş tarihi belirleyin',
              'Sözleşme değeri girin',
              'Sözleşme numarası girin',
              'Şartları ve maddeleri ekleyin',
            ]
          : undefined,
    },
    {
      id: 'active',
      label: 'Aktif',
      description: 'Sözleşme yürürlükte',
      status:
        currentStatus === 'ACTIVE'
          ? 'current'
          : currentIndex > statuses.indexOf('ACTIVE')
          ? 'completed'
          : currentIndex < statuses.indexOf('ACTIVE')
          ? 'locked'
          : 'upcoming',
      requirements:
        currentStatus === 'ACTIVE'
          ? [
              'Periyodik faturaları takip edin',
              'Yenileme tarihini izleyin',
              'Müşteri memnuniyetini ölçün',
            ]
          : undefined,
    },
    {
      id: 'completed',
      label: 'Tamamlandı',
      description: 'Sözleşme bitti',
      status:
        currentStatus === 'EXPIRED' || currentStatus === 'TERMINATED'
          ? 'current'
          : 'upcoming',
      requirements:
        currentStatus === 'ACTIVE'
          ? ['Yenileme görüşmesi yapın', 'Kapanış işlemlerini tamamlayın']
          : undefined,
    },
  ]
}

// Task Workflow Steps
export function getTaskWorkflowSteps(currentStatus: string) {
  return [
    {
      id: 'todo',
      label: 'Yapılacak',
      description: 'Beklemede',
      status: currentStatus === 'TODO' ? 'current' : currentStatus !== 'TODO' ? 'completed' : 'upcoming',
      requirements:
        currentStatus === 'TODO' ? ['Bir kullanıcıya atayın', 'Öncelik belirleyin'] : undefined,
    },
    {
      id: 'in_progress',
      label: 'Devam Ediyor',
      description: 'Üzerinde çalışılıyor',
      status:
        currentStatus === 'IN_PROGRESS'
          ? 'current'
          : currentStatus === 'DONE' || currentStatus === 'CANCELLED'
          ? 'completed'
          : currentStatus === 'TODO'
          ? 'locked'
          : 'upcoming',
      requirements:
        currentStatus === 'IN_PROGRESS'
          ? ['Görevi tamamlayın', 'İlerleme notları ekleyin']
          : undefined,
    },
    {
      id: 'done',
      label: 'Tamamlandı',
      description: 'Görev bitti',
      status: currentStatus === 'DONE' ? 'current' : 'upcoming',
      requirements:
        currentStatus === 'IN_PROGRESS'
          ? ['Sonuç notları ekleyin', 'Kapanış onayı alın']
          : undefined,
    },
  ]
}

// Ticket Workflow Steps
export function getTicketWorkflowSteps(currentStatus: string) {
  return [
    {
      id: 'open',
      label: 'Açık',
      description: 'Yeni talep',
      status: currentStatus === 'OPEN' ? 'current' : currentStatus !== 'OPEN' ? 'completed' : 'upcoming',
      requirements:
        currentStatus === 'OPEN'
          ? ['Destek ekibine atayın', 'Öncelik belirleyin', 'İlk yanıtı verin']
          : undefined,
    },
    {
      id: 'in_progress',
      label: 'İşlemde',
      description: 'Çözüm aranıyor',
      status:
        currentStatus === 'IN_PROGRESS'
          ? 'current'
          : currentStatus === 'RESOLVED' || currentStatus === 'CLOSED'
          ? 'completed'
          : currentStatus === 'OPEN'
          ? 'locked'
          : 'upcoming',
      requirements:
        currentStatus === 'IN_PROGRESS'
          ? ['Sorunu analiz edin', 'Çözüm uygulayın', 'Müşteri ile iletişimde kalın']
          : undefined,
    },
    {
      id: 'resolved',
      label: 'Çözüldü',
      description: 'Sorun giderildi',
      status: currentStatus === 'RESOLVED' || currentStatus === 'CLOSED' ? 'current' : 'upcoming',
      requirements:
        currentStatus === 'IN_PROGRESS'
          ? ['Çözümü test edin', 'Müşteri onayı alın', 'Kapanış notları ekleyin']
          : undefined,
    },
  ]
}

