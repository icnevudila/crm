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
  typeBadge: {
    padding: 4,
    borderRadius: 3,
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  typeIncome: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  typeExpense: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
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

interface FinancialRecordPDFProps {
  finance: {
    id: string
    type: 'INCOME' | 'EXPENSE'
    amount: number
    category?: string
    description?: string
    paymentMethod?: string
    paymentDate?: string
    createdAt: string
    updatedAt?: string
    CustomerCompany?: {
      id: string
      name: string
    }
    Company?: {
      id: string
      name: string
      address?: string
      city?: string
      phone?: string
      email?: string
    }
  }
}

const categoryLabels: Record<string, string> = {
  SALARY: 'Maaş',
  RENT: 'Kira',
  UTILITIES: 'Faturalar',
  MARKETING: 'Pazarlama',
  TRAVEL: 'Seyahat',
  OFFICE_SUPPLIES: 'Ofis Malzemeleri',
  SHIPPING: 'Kargo',
  TAX: 'Vergi',
  INSURANCE: 'Sigorta',
  MAINTENANCE: 'Bakım',
  OTHER: 'Diğer',
  INVOICE_INCOME: 'Fatura Geliri',
  SERVICE: 'Hizmet Geliri',
  PRODUCT_SALE: 'Ürün Satışı',
  FUEL: 'Yakıt',
  ACCOMMODATION: 'Konaklama',
  FOOD: 'Yemek',
  TRANSPORT: 'Ulaşım',
  OFFICE: 'Ofis',
}

const paymentMethodLabels: Record<string, string> = {
  CASH: 'Nakit',
  CARD: 'Kart',
  TRANSFER: 'Havale/EFT',
  CHECK: 'Çek',
  OTHER: 'Diğer',
}

export default function FinancialRecordPDF({ finance }: FinancialRecordPDFProps) {
  const company = finance.Company || {}
  const customerCompany = finance.CustomerCompany
  const isIncome = finance.type === 'INCOME'
  
  const formattedAmount = new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(finance.amount || 0)

  const formattedDate = new Date(finance.createdAt).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const formattedPaymentDate = finance.paymentDate
    ? new Date(finance.paymentDate).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '-'

  const categoryLabel = finance.category
    ? categoryLabels[finance.category] || finance.category
    : '-'

  const paymentMethodLabel = finance.paymentMethod
    ? paymentMethodLabels[finance.paymentMethod] || finance.paymentMethod
    : '-'

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
              <Text style={styles.documentTitle}>Finansal Kayıt Özeti</Text>
              <Text style={styles.documentDate}>{formattedDate}</Text>
              <Text style={styles.recordNumber}>Kayıt No: {finance.id.substring(0, 8)}</Text>
            </View>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* İşlem Türü ve Tutar */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>İşlem Bilgileri</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>İşlem Türü:</Text>
              <View style={[
                styles.typeBadge,
                isIncome ? styles.typeIncome : styles.typeExpense
              ]}>
                <Text>{isIncome ? 'Gelir' : 'Gider'}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Kategori:</Text>
              <Text style={styles.infoValue}>{categoryLabel}</Text>
            </View>
            {customerCompany && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Müşteri Firma:</Text>
                <Text style={styles.infoValue}>{customerCompany.name}</Text>
              </View>
            )}
            {finance.paymentMethod && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ödeme Yöntemi:</Text>
                <Text style={styles.infoValue}>{paymentMethodLabel}</Text>
              </View>
            )}
            {finance.paymentDate && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ödeme Tarihi:</Text>
                <Text style={styles.infoValue}>{formattedPaymentDate}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>İşlem Tarihi:</Text>
              <Text style={styles.infoValue}>{formattedDate}</Text>
            </View>
          </View>

          {/* Açıklama */}
          {finance.description && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Açıklama</Text>
              <Text style={{ fontSize: 9, color: '#374151', lineHeight: 1.5 }}>
                {finance.description}
              </Text>
            </View>
          )}

          {/* Tutar */}
          <View style={styles.amountSection}>
            <Text style={styles.amountLabel}>
              {isIncome ? 'Gelir Tutarı' : 'Gider Tutarı'}
            </Text>
            <Text style={[
              styles.amountValue,
              { color: isIncome ? '#065f46' : '#991b1b' }
            ]}>
              {formattedAmount}
            </Text>
          </View>
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

















