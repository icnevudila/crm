import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 11,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 25,
    paddingBottom: 15,
    borderBottom: '2 solid #e5e7eb',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  companySection: {
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  companyInfo: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 4,
    lineHeight: 1.4,
  },
  documentInfo: {
    alignItems: 'flex-end',
  },
  documentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  documentSubtitle: {
    fontSize: 9,
    color: '#9ca3af',
    marginTop: 5,
    textAlign: 'center',
  },
  disclaimer: {
    fontSize: 8,
    color: '#dc2626',
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
    padding: 8,
    backgroundColor: '#fef2f2',
    borderRadius: 4,
  },
  mainContent: {
    marginTop: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 12,
    paddingBottom: 6,
    borderBottom: '1 solid #e5e7eb',
  },
  infoGrid: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 10,
    color: '#6b7280',
    width: '35%',
  },
  infoValue: {
    fontSize: 10,
    color: '#111827',
    width: '65%',
    fontWeight: '600',
  },
  amountBox: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f9fafb',
    border: '1 solid #e5e7eb',
    borderRadius: 6,
  },
  amountLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 30,
    right: 30,
    paddingTop: 15,
    borderTop: '1 solid #e5e7eb',
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 1.5,
  },
  footerWarning: {
    fontSize: 8,
    color: '#dc2626',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 5,
  },
})

interface InvoiceRecordPDFProps {
  invoice: {
    id: string
    title: string
    status: string
    totalAmount: number
    total?: number
    invoiceNumber?: string
    createdAt: string
    dueDate?: string
    paymentDate?: string
    description?: string
    Quote?: {
      id: string
      title: string
      Deal?: {
        id: string
        title: string
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
      }
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

export default function InvoiceRecordPDF({ invoice }: InvoiceRecordPDFProps) {
  const company = invoice.Company || {}
  const customer = invoice.Quote?.Deal?.Customer || {}
  const customerCompany = customer?.CustomerCompany || {}
  
  const totalAmount = invoice.totalAmount || invoice.total || 0
  
  const formattedAmount = new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(totalAmount)

  const formattedDate = new Date(invoice.createdAt).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const formattedDueDate = invoice.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  const formattedPaymentDate = invoice.paymentDate
    ? new Date(invoice.paymentDate).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  const statusLabels: Record<string, string> = {
    DRAFT: 'Taslak',
    SENT: 'Gönderildi',
    PAID: 'Ödendi',
    OVERDUE: 'Vadesi Geçti',
    CANCELLED: 'İptal Edildi',
  }

  const statusLabel = statusLabels[invoice.status] || invoice.status

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header - Minimalist */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.companySection}>
              <Text style={styles.companyName}>
                {company.name || 'Firma'}
              </Text>
              {company.address && (
                <Text style={styles.companyInfo}>{company.address}</Text>
              )}
              {company.city && (
                <Text style={styles.companyInfo}>{company.city}</Text>
              )}
              {company.phone && (
                <Text style={styles.companyInfo}>Tel: {company.phone}</Text>
              )}
              {company.email && (
                <Text style={styles.companyInfo}>E-posta: {company.email}</Text>
              )}
            </View>
            <View style={styles.documentInfo}>
              <Text style={styles.documentTitle}>İşlem Özeti</Text>
              <Text style={styles.documentSubtitle}>
                {formattedDate}
              </Text>
              <Text style={styles.documentSubtitle}>
                Kayıt No: {invoice.invoiceNumber || invoice.id.substring(0, 8)}
              </Text>
            </View>
          </View>
          <Text style={styles.disclaimer}>
            Bu belge resmî bir fatura değildir. Yalnızca iç raporlama amacıyla oluşturulmuştur.
          </Text>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* İşlem Bilgileri */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>İşlem Bilgileri</Text>
            <View style={styles.infoGrid}>
              <Text style={styles.infoLabel}>Başlık:</Text>
              <Text style={styles.infoValue}>{invoice.title}</Text>
            </View>
            <View style={styles.infoGrid}>
              <Text style={styles.infoLabel}>Durum:</Text>
              <Text style={styles.infoValue}>{statusLabel}</Text>
            </View>
            {formattedDueDate && (
              <View style={styles.infoGrid}>
                <Text style={styles.infoLabel}>Vade Tarihi:</Text>
                <Text style={styles.infoValue}>{formattedDueDate}</Text>
              </View>
            )}
            {formattedPaymentDate && (
              <View style={styles.infoGrid}>
                <Text style={styles.infoLabel}>Ödeme Tarihi:</Text>
                <Text style={styles.infoValue}>{formattedPaymentDate}</Text>
              </View>
            )}
            <View style={styles.infoGrid}>
              <Text style={styles.infoLabel}>İşlem Tarihi:</Text>
              <Text style={styles.infoValue}>{formattedDate}</Text>
            </View>
            {invoice.description && (
              <View style={styles.infoGrid}>
                <Text style={styles.infoLabel}>Açıklama:</Text>
                <Text style={styles.infoValue}>{invoice.description}</Text>
              </View>
            )}
          </View>

          {/* Müşteri Bilgileri */}
          {(customerCompany.name || customer.name) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Müşteri Bilgileri</Text>
              <View style={styles.infoGrid}>
                <Text style={styles.infoLabel}>Müşteri:</Text>
                <Text style={styles.infoValue}>
                  {customerCompany.name || customer.name}
                </Text>
              </View>
              {(customerCompany.address || customer.address) && (
                <View style={styles.infoGrid}>
                  <Text style={styles.infoLabel}>Adres:</Text>
                  <Text style={styles.infoValue}>
                    {customerCompany.address || customer.address}
                  </Text>
                </View>
              )}
              {(customerCompany.city || customer.city) && (
                <View style={styles.infoGrid}>
                  <Text style={styles.infoLabel}>Şehir:</Text>
                  <Text style={styles.infoValue}>
                    {customerCompany.city || customer.city}
                  </Text>
                </View>
              )}
              {customer.phone && (
                <View style={styles.infoGrid}>
                  <Text style={styles.infoLabel}>Telefon:</Text>
                  <Text style={styles.infoValue}>{customer.phone}</Text>
                </View>
              )}
              {customer.email && (
                <View style={styles.infoGrid}>
                  <Text style={styles.infoLabel}>E-posta:</Text>
                  <Text style={styles.infoValue}>{customer.email}</Text>
                </View>
              )}
            </View>
          )}

          {/* Tutar */}
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Toplam Tutar</Text>
            <Text style={styles.amountValue}>{formattedAmount}</Text>
          </View>
        </View>

        {/* Footer */}
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












