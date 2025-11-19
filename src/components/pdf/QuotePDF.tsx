import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

// Türkçe sayı formatlaması için helper fonksiyon
function formatNumber(num: number): string {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

function formatCurrency(num: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

// Font register (opsiyonel - daha iyi görünüm için)
// Font.register({
//   family: 'Roboto',
//   src: 'https://fonts.gstatic.com/s/roboto/v20/KFOmCnqEu92Fr1Mu4mxP.ttf',
// })

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
  table: {
    marginTop: 20,
    border: '1 solid #ddd',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#6366f1',
    color: '#fff',
    padding: 10,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #ddd',
    padding: 10,
  },
  tableCell: {
    fontSize: 9,
  },
  col1: { width: '50%' },
  col2: { width: '20%', textAlign: 'right' },
  col3: { width: '15%', textAlign: 'right' },
  col4: { width: '15%', textAlign: 'right' },
  totalSection: {
    marginTop: 20,
    borderTop: '2 solid #6366f1',
    paddingTop: 15,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6366f1',
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

interface QuotePDFProps {
  quote: {
    id: string
    title: string
    status: string
    total: number
    createdAt: string
    Deal?: {
      title: string
      Customer?: {
        name: string
        email?: string
        phone?: string
        city?: string
      }
    }
    Company?: {
      name: string
      city?: string
      sector?: string
    }
  }
}

export default function QuotePDF({ quote }: QuotePDFProps) {
  const subtotal = quote.totalAmount || 0
  const kdv = subtotal * 0.18 // %18 KDV
  const total = subtotal + kdv

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>
            {quote.Company?.name || 'Şirket Adı'}
          </Text>
          <Text style={styles.companyInfo}>
            {quote.Company?.city || ''} {quote.Company?.sector || ''}
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>TEKLİF</Text>

        {/* Quote Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Teklif Bilgileri</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Teklif No:</Text>
            <Text style={styles.value}>{quote.id.substring(0, 8).toUpperCase()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tarih:</Text>
            <Text style={styles.value}>
              {new Date(quote.createdAt).toLocaleDateString('tr-TR')}
            </Text>
          </View>
          {/* ENTERPRISE: Otomatik son geçerlilik tarihi (bugün + 15 gün) */}
          <View style={styles.row}>
            <Text style={styles.label}>Son Geçerlilik Tarihi:</Text>
            <Text style={styles.value}>
              {(() => {
                const today = new Date()
                const validUntil = new Date(today)
                validUntil.setDate(today.getDate() + 15) // Bugün + 15 gün
                return validUntil.toLocaleDateString('tr-TR')
              })()}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Durum:</Text>
            <Text style={styles.value}>
              {quote.status === 'DRAFT'
                ? 'Taslak'
                : quote.status === 'SENT'
                  ? 'Gönderildi'
                  : quote.status === 'ACCEPTED'
                    ? 'Kabul Edildi'
                    : quote.status === 'DECLINED'
                      ? 'Reddedildi'
                      : quote.status}
            </Text>
          </View>
        </View>

        {/* Customer Info */}
        {quote.Deal?.Customer && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Müşteri Bilgileri</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Müşteri:</Text>
              <Text style={styles.value}>{quote.Deal.Customer.name}</Text>
            </View>
            {quote.Deal.Customer.email && (
              <View style={styles.row}>
                <Text style={styles.label}>E-posta:</Text>
                <Text style={styles.value}>{quote.Deal.Customer.email}</Text>
              </View>
            )}
            {quote.Deal.Customer.phone && (
              <View style={styles.row}>
                <Text style={styles.label}>Telefon:</Text>
                <Text style={styles.value}>{quote.Deal.Customer.phone}</Text>
              </View>
            )}
            {quote.Deal.Customer.city && (
              <View style={styles.row}>
                <Text style={styles.label}>Şehir:</Text>
                <Text style={styles.value}>{quote.Deal.Customer.city}</Text>
              </View>
            )}
          </View>
        )}

        {/* Products Table - Placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ürün/Hizmet Listesi</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, styles.col1]}>Açıklama</Text>
              <Text style={[styles.tableCell, styles.col2]}>Miktar</Text>
              <Text style={[styles.tableCell, styles.col3]}>Birim Fiyat</Text>
              <Text style={[styles.tableCell, styles.col4]}>Toplam</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.col1]}>{quote.title}</Text>
              <Text style={[styles.tableCell, styles.col2]}>1</Text>
              <Text style={[styles.tableCell, styles.col3]}>
                {formatNumber(subtotal)}
              </Text>
              <Text style={[styles.tableCell, styles.col4]}>
                {formatNumber(subtotal)}
              </Text>
            </View>
          </View>
        </View>

        {/* Total Section */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Ara Toplam:</Text>
            <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>KDV (%18):</Text>
            <Text style={styles.totalValue}>{formatCurrency(kdv)}</Text>
          </View>
          <View style={[styles.totalRow, { marginTop: 10 }]}>
            <Text style={[styles.totalLabel, { fontSize: 14 }]}>GENEL TOPLAM:</Text>
            <Text style={[styles.totalValue, { fontSize: 16 }]}>
              {formatCurrency(total)}
            </Text>
          </View>
        </View>

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
            Bu teklif {new Date(quote.createdAt).toLocaleDateString('tr-TR')} tarihinde
            hazırlanmıştır.
          </Text>
          <Text style={{ marginTop: 5, fontWeight: 'bold' }}>
            Son geçerlilik tarihi:{' '}
            {(() => {
              const today = new Date()
              const validUntil = new Date(today)
              validUntil.setDate(today.getDate() + 15) // Bugün + 15 gün
              return validUntil.toLocaleDateString('tr-TR')
            })()}
          </Text>
        </View>
      </Page>
    </Document>
  )
}

