import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 30,
    borderBottom: '1 solid #e5e7eb',
    paddingBottom: 15,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  logoContainer: {
    width: 60,
    height: 60,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 8,
    color: '#9ca3af',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 20,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 5,
  },
  companyInfo: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 3,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 5,
  },
  documentDate: {
    fontSize: 9,
    color: '#6b7280',
  },
  recordNumber: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 5,
  },
  mainContent: {
    marginTop: 30,
  },
  card: {
    backgroundColor: '#f9fafb',
    border: '1 solid #e5e7eb',
    borderRadius: 4,
    padding: 15,
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 6,
    borderBottom: '1 solid #e5e7eb',
  },
  infoLabel: {
    fontSize: 9,
    color: '#6b7280',
    width: '40%',
  },
  infoValue: {
    fontSize: 9,
    color: '#111827',
    width: '60%',
    fontWeight: 'bold',
    textAlign: 'right',
  },
  amountSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#ffffff',
    border: '2 solid #e5e7eb',
    borderRadius: 4,
  },
  amountLabel: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 5,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    paddingTop: 20,
    borderTop: '1 solid #e5e7eb',
    textAlign: 'center',
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
    lineHeight: 1.5,
  },
  footerWarning: {
    fontSize: 8,
    color: '#dc2626',
    fontWeight: 'bold',
    marginTop: 5,
  },
})

interface DealRecordPDFProps {
  deal: {
    id: string
    title: string
    stage: string
    value?: number
    createdAt: string
    updatedAt?: string
    lostReason?: string
    description?: string
    Customer?: {
      id: string
      name: string
      email?: string
      phone?: string
      city?: string
      address?: string
      CustomerCompany?: {
        id: string
        name: string
        address?: string
        city?: string
      }
    }
    Company?: {
      id: string
      name?: string
      city?: string
      address?: string
      phone?: string
      email?: string
    }
  }
}

const stageLabels: Record<string, string> = {
  LEAD: 'Potansiyel',
  CONTACTED: 'İletişimde',
  DEMO: 'Demo',
  PROPOSAL: 'Teklif',
  NEGOTIATION: 'Pazarlık',
  WON: 'Kazanıldı',
  LOST: 'Kaybedildi',
}

export default function DealRecordPDF({ deal }: DealRecordPDFProps) {
  const company = deal.Company || {}
  const customer = deal.Customer || {}
  const customerCompany = customer?.CustomerCompany || {}
  
  const dealValue = deal.value || 0
  
  const formattedAmount = new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(dealValue)

  const formattedDate = new Date(deal.createdAt).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const formattedUpdatedDate = deal.updatedAt
    ? new Date(deal.updatedAt).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  const stageLabel = stageLabels[deal.stage] || deal.stage

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>LOGO</Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.companyName}>
                {company.name || 'Firma Adı'}
              </Text>
              {company.address && (
                <Text style={styles.companyInfo}>
                  {company.address}
                </Text>
              )}
              {company.city && (
                <Text style={styles.companyInfo}>
                  {company.city}
                </Text>
              )}
              {company.phone && (
                <Text style={styles.companyInfo}>
                  Tel: {company.phone}
                </Text>
              )}
              {company.email && (
                <Text style={styles.companyInfo}>
                  E-posta: {company.email}
                </Text>
              )}
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.documentTitle}>Kayıt Özeti</Text>
              <Text style={styles.documentDate}>{formattedDate}</Text>
              <Text style={styles.recordNumber}>
                Kayıt No: {deal.id.substring(0, 8)}
              </Text>
            </View>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* İşlem Bilgileri */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>İşlem Bilgileri</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Başlık:</Text>
              <Text style={styles.infoValue}>{deal.title}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Durum:</Text>
              <Text style={styles.infoValue}>{stageLabel}</Text>
            </View>
            {dealValue > 0 && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Değer:</Text>
                <Text style={styles.infoValue}>{formattedAmount}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>İşlem Tarihi:</Text>
              <Text style={styles.infoValue}>{formattedDate}</Text>
            </View>
            {formattedUpdatedDate && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Son Güncelleme:</Text>
                <Text style={styles.infoValue}>{formattedUpdatedDate}</Text>
              </View>
            )}
          </View>

          {/* Müşteri Bilgileri */}
          {(customerCompany.name || customer.name) && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Müşteri Bilgileri</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Müşteri:</Text>
                <Text style={styles.infoValue}>
                  {customerCompany.name || customer.name}
                </Text>
              </View>
              {(customerCompany.address || customer.address) && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Adres:</Text>
                  <Text style={styles.infoValue}>
                    {customerCompany.address || customer.address}
                  </Text>
                </View>
              )}
              {(customerCompany.city || customer.city) && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Şehir:</Text>
                  <Text style={styles.infoValue}>
                    {customerCompany.city || customer.city}
                  </Text>
                </View>
              )}
              {customer.phone && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Telefon:</Text>
                  <Text style={styles.infoValue}>{customer.phone}</Text>
                </View>
              )}
              {customer.email && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>E-posta:</Text>
                  <Text style={styles.infoValue}>{customer.email}</Text>
                </View>
              )}
            </View>
          )}

          {/* Açıklama */}
          {deal.description && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Açıklama</Text>
              <Text style={{ fontSize: 9, color: '#374151', lineHeight: 1.5 }}>
                {deal.description}
              </Text>
            </View>
          )}

          {/* Kayıp Sebebi */}
          {deal.stage === 'LOST' && deal.lostReason && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Kayıp Sebebi</Text>
              <Text style={{ fontSize: 9, color: '#374151', lineHeight: 1.5 }}>
                {deal.lostReason}
              </Text>
            </View>
          )}

          {/* Değer */}
          {dealValue > 0 && (
            <View style={styles.amountSection}>
              <Text style={styles.amountLabel}>Fırsat Değeri</Text>
              <Text style={styles.amountValue}>{formattedAmount}</Text>
            </View>
          )}
        </View>

        {/* Footer - MUTLAKA OLACAK */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Bu belge resmî bir fatura değildir. Hiçbir resmi geçerliliği yoktur.
          </Text>
          <Text style={styles.footerWarning}>
            İç kullanım amaçlı hazırlanmıştır.
          </Text>
        </View>
      </Page>
    </Document>
  )
}

























