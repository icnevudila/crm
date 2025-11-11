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
  statusBadge: {
    backgroundColor: '#10b981',
    color: '#fff',
    padding: 5,
    borderRadius: 3,
    textAlign: 'center',
    fontSize: 9,
    fontWeight: 'bold',
  },
})

interface InvoicePDFProps {
  invoice: {
    id: string
    title: string
    status: string
    totalAmount: number
    total?: number // Backward compatibility
    invoiceNumber?: string
    createdAt: string
    dueDate?: string
    paymentDate?: string
    taxRate?: number
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
          taxNumber?: string
          CustomerCompany?: {
            id: string
            name: string
            taxNumber?: string
            address?: string
            city?: string
          }
        }
      }
    }
    Company?: {
      id: string
      name: string
      taxNumber?: string
      address?: string
      city?: string
      phone?: string
      email?: string
    }
  }
}

export default function InvoicePDF({ invoice }: InvoicePDFProps) {
  // Türkiye Fatura Mevzuatına Uygun Hesaplamalar
  const taxRate = invoice.taxRate || 18 // Varsayılan %18 KDV
  const totalAmount = invoice.totalAmount || invoice.total || 0
  // KDV dahil toplamdan KDV hariç tutarı hesapla
  const subtotal = totalAmount / (1 + taxRate / 100)
  const kdv = totalAmount - subtotal
  const total = totalAmount

  const company = invoice.Company || {}
  const customer = invoice.Quote?.Deal?.Customer || {}
  const customerCompany = customer.CustomerCompany || {}

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header - Satıcı Bilgileri (Türkiye Fatura Mevzuatına Uygun) */}
        <View style={styles.header}>
          <Text style={styles.companyName}>
            {company.name || 'Şirket Adı'}
          </Text>
          {company.taxNumber && (
            <Text style={styles.companyInfo}>
              VKN: {company.taxNumber}
            </Text>
          )}
          {company.address && (
            <Text style={styles.companyInfo}>
              Adres: {company.address}
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

        {/* Title */}
        <Text style={styles.title}>FATURA</Text>

        {/* Fatura Bilgileri (Türkiye Fatura Mevzuatına Uygun) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fatura Bilgileri</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Fatura No:</Text>
            <Text style={styles.value}>
              {invoice.invoiceNumber || invoice.id.substring(0, 8).toUpperCase()}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fatura Tarihi:</Text>
            <Text style={styles.value}>
              {new Date(invoice.createdAt).toLocaleDateString('tr-TR')}
            </Text>
          </View>
          {invoice.dueDate && (
            <View style={styles.row}>
              <Text style={styles.label}>Vade Tarihi:</Text>
              <Text style={styles.value}>
                {new Date(invoice.dueDate).toLocaleDateString('tr-TR')}
              </Text>
            </View>
          )}
          {invoice.paymentDate && (
            <View style={styles.row}>
              <Text style={styles.label}>Ödeme Tarihi:</Text>
              <Text style={styles.value}>
                {new Date(invoice.paymentDate).toLocaleDateString('tr-TR')}
              </Text>
            </View>
          )}
        </View>

        {/* Alıcı Bilgileri (Türkiye Fatura Mevzuatına Uygun) */}
        {(customerCompany.name || customer.name) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Alıcı Bilgileri</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Ünvan/Ad Soyad:</Text>
              <Text style={styles.value}>
                {customerCompany.name || customer.name}
              </Text>
            </View>
            {(customerCompany.taxNumber || customer.taxNumber) && (
              <View style={styles.row}>
                <Text style={styles.label}>
                  {customerCompany.taxNumber ? 'VKN' : 'TCKN'}:
                </Text>
                <Text style={styles.value}>
                  {customerCompany.taxNumber || customer.taxNumber}
                </Text>
              </View>
            )}
            {(customerCompany.address || customer.address) && (
              <View style={styles.row}>
                <Text style={styles.label}>Adres:</Text>
                <Text style={styles.value}>
                  {customerCompany.address || customer.address}
                </Text>
              </View>
            )}
            {(customerCompany.city || customer.city) && (
              <View style={styles.row}>
                <Text style={styles.label}>Şehir:</Text>
                <Text style={styles.value}>
                  {customerCompany.city || customer.city}
                </Text>
              </View>
            )}
            {customer.phone && (
              <View style={styles.row}>
                <Text style={styles.label}>Telefon:</Text>
                <Text style={styles.value}>{customer.phone}</Text>
              </View>
            )}
            {customer.email && (
              <View style={styles.row}>
                <Text style={styles.label}>E-posta:</Text>
                <Text style={styles.value}>{customer.email}</Text>
              </View>
            )}
          </View>
        )}

        {/* Ürün/Hizmet Listesi (Türkiye Fatura Mevzuatına Uygun) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ürün/Hizmet Listesi</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, styles.col1]}>Açıklama</Text>
              <Text style={[styles.tableCell, styles.col2]}>Miktar</Text>
              <Text style={[styles.tableCell, styles.col3]}>Birim Fiyat (KDV Hariç)</Text>
              <Text style={[styles.tableCell, styles.col4]}>Toplam (KDV Hariç)</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.col1]}>
                {invoice.description || invoice.title}
              </Text>
              <Text style={[styles.tableCell, styles.col2]}>1</Text>
              <Text style={[styles.tableCell, styles.col3]}>
                {subtotal.toFixed(2)} ₺
              </Text>
              <Text style={[styles.tableCell, styles.col4]}>
                {subtotal.toFixed(2)} ₺
              </Text>
            </View>
          </View>
        </View>

        {/* Toplam Bölümü (Türkiye Fatura Mevzuatına Uygun) */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>KDV Hariç Toplam:</Text>
            <Text style={styles.totalValue}>{subtotal.toFixed(2)} ₺</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>KDV Matrahı:</Text>
            <Text style={styles.totalValue}>{subtotal.toFixed(2)} ₺</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>KDV Oranı (%{String(taxRate)}):</Text>
            <Text style={styles.totalValue}>{kdv.toFixed(2)} ₺</Text>
          </View>
          <View style={[styles.totalRow, { marginTop: 10, borderTop: '1 solid #ddd', paddingTop: 10 }]}>
            <Text style={[styles.totalLabel, { fontSize: 14 }]}>KDV Dahil Toplam:</Text>
            <Text style={[styles.totalValue, { fontSize: 16 }]}>
              {total.toFixed(2)} ₺
            </Text>
          </View>
        </View>

        {/* Payment Info */}
        {invoice.status === 'PAID' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ödeme Bilgileri</Text>
            <Text style={{ fontSize: 9, color: '#666' }}>
              Bu fatura ödenmiştir. Ödeme tarihi:{' '}
              {new Date(invoice.createdAt).toLocaleDateString('tr-TR')}
            </Text>
          </View>
        )}

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
            Bu fatura {new Date(invoice.createdAt).toLocaleDateString('tr-TR')} tarihinde
            hazırlanmıştır.
          </Text>
        </View>
      </Page>
    </Document>
  )
}

