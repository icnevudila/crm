import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #6366f1',
    paddingBottom: 20,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 5,
  },
  companyInfo: {
    fontSize: 9,
    color: '#666',
    marginTop: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    paddingVertical: 3,
  },
  label: {
    color: '#666',
    width: '40%',
  },
  value: {
    color: '#000',
    width: '60%',
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTop: '1 solid #ddd',
    textAlign: 'center',
    fontSize: 8,
    color: '#999',
  },
  signature: {
    marginTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '45%',
    borderTop: '1 solid #333',
    paddingTop: 5,
    textAlign: 'center',
    fontSize: 9,
  },
})

interface DealPDFProps {
  deal: {
    id: string
    title: string
    stage: string
    value?: number
    createdAt: string
    updatedAt?: string
    lostReason?: string
    Customer?: {
      id: string
      name: string
      email?: string
      phone?: string
      city?: string
    }
    Company?: {
      id: string
      name?: string
      city?: string
      address?: string
      phone?: string
      email?: string
      taxNumber?: string
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

export default function DealPDF({ deal }: DealPDFProps) {
  const company = deal.Company || {}
  const customer = deal.Customer || {}
  const dealValue = deal.value || 0

  // Tarih formatlamalarını component dışında yap - InvoicePDF pattern'i
  const createdAtDate = deal.createdAt ? new Date(deal.createdAt).toLocaleDateString('tr-TR') : ''
  const updatedAtDate = deal.updatedAt ? new Date(deal.updatedAt).toLocaleDateString('tr-TR') : ''
  const dealValueFormatted = dealValue.toFixed(2)
  const stageLabel = stageLabels[deal.stage] || deal.stage
  const dealIdShort = deal.id ? deal.id.substring(0, 8).toUpperCase() : ''

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>
            {company.name || 'Şirket Adı'}
          </Text>
          <Text style={styles.companyInfo}>
            {company.city || ''} {company.address || ''}
          </Text>
          {company.taxNumber && (
            <Text style={styles.companyInfo}>
              VKN: {company.taxNumber}
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

        {/* Title */}
        <Text style={styles.title}>FIRSAT RAPORU</Text>

        {/* Deal Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fırsat Bilgileri</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Fırsat No:</Text>
            <Text style={styles.value}>{dealIdShort}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Başlık:</Text>
            <Text style={styles.value}>{deal.title || ''}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Durum:</Text>
            <Text style={styles.value}>{stageLabel}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Değer:</Text>
            <Text style={styles.value}>{dealValueFormatted} ₺</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tarih:</Text>
            <Text style={styles.value}>{createdAtDate}</Text>
          </View>
          {updatedAtDate && (
            <View style={styles.row}>
              <Text style={styles.label}>Son Güncelleme:</Text>
              <Text style={styles.value}>{updatedAtDate}</Text>
            </View>
          )}
        </View>

        {/* Customer Info */}
        {customer && customer.name && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Müşteri Bilgileri</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Müşteri:</Text>
              <Text style={styles.value}>{customer.name}</Text>
            </View>
            {customer.email && (
              <View style={styles.row}>
                <Text style={styles.label}>E-posta:</Text>
                <Text style={styles.value}>{customer.email}</Text>
              </View>
            )}
            {customer.phone && (
              <View style={styles.row}>
                <Text style={styles.label}>Telefon:</Text>
                <Text style={styles.value}>{customer.phone}</Text>
              </View>
            )}
            {customer.city && (
              <View style={styles.row}>
                <Text style={styles.label}>Şehir:</Text>
                <Text style={styles.value}>{customer.city}</Text>
              </View>
            )}
          </View>
        )}

        {/* Lost Reason */}
        {deal.stage === 'LOST' && deal.lostReason ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kayıp Sebebi</Text>
            <View style={styles.row}>
              <Text style={styles.value}>{deal.lostReason}</Text>
            </View>
          </View>
        ) : null}

        {/* Signature */}
        <View style={styles.signature}>
          <View style={styles.signatureBox}>
            <Text>Hazırlayan</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text>Onaylayan</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Bu rapor {createdAtDate} tarihinde hazırlanmıştır.
          </Text>
        </View>
      </Page>
    </Document>
  )
}
