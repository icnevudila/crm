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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
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
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #ddd',
    padding: 8,
    fontSize: 8,
  },
  tableCell: {
    fontSize: 8,
    color: '#333',
  },
  col1: { width: '20%' }, // Tarih
  col2: { width: '15%' }, // Modül
  col3: { width: '15%' }, // İşlem
  col4: { width: '35%' }, // Açıklama
  col5: { width: '15%' }, // Kullanıcı
  footer: {
    marginTop: 30,
    paddingTop: 20,
    borderTop: '1 solid #ddd',
    fontSize: 8,
    color: '#666',
    textAlign: 'center',
  },
})

interface ReportsPDFProps {
  reports: Array<{
    createdAt: string
    entity: string
    action: string
    description: string
    User?: {
      name?: string
      email?: string
    }
  }>
  filters?: {
    startDate?: string
    endDate?: string
    module?: string
    userId?: string
  }
}

export default function ReportsPDF({ reports, filters }: ReportsPDFProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>CRM Raporları</Text>
          <Text style={styles.subtitle}>
            {filters?.startDate && filters?.endDate
              ? `${formatDate(filters.startDate)} - ${formatDate(filters.endDate)}`
              : 'Tüm Zamanlar'}
            {filters?.module && filters.module !== 'all' && ` • Modül: ${filters.module}`}
          </Text>
        </View>

        {/* Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, styles.col1]}>Tarih</Text>
            <Text style={[styles.tableCell, styles.col2]}>Modül</Text>
            <Text style={[styles.tableCell, styles.col3]}>İşlem</Text>
            <Text style={[styles.tableCell, styles.col4]}>Açıklama</Text>
            <Text style={[styles.tableCell, styles.col5]}>Kullanıcı</Text>
          </View>

          {/* Table Rows */}
          {reports.map((report, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.col1]}>
                {formatDate(report.createdAt)}
              </Text>
              <Text style={[styles.tableCell, styles.col2]}>
                {report.entity || '-'}
              </Text>
              <Text style={[styles.tableCell, styles.col3]}>
                {report.action || '-'}
              </Text>
              <Text style={[styles.tableCell, styles.col4]}>
                {report.description || '-'}
              </Text>
              <Text style={[styles.tableCell, styles.col5]}>
                {report.User?.name || report.User?.email || '-'}
              </Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Toplam {reports.length} kayıt • Oluşturulma: {new Date().toLocaleString('tr-TR')}
          </Text>
        </View>
      </Page>
    </Document>
  )
}



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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
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
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #ddd',
    padding: 8,
    fontSize: 8,
  },
  tableCell: {
    fontSize: 8,
    color: '#333',
  },
  col1: { width: '20%' }, // Tarih
  col2: { width: '15%' }, // Modül
  col3: { width: '15%' }, // İşlem
  col4: { width: '35%' }, // Açıklama
  col5: { width: '15%' }, // Kullanıcı
  footer: {
    marginTop: 30,
    paddingTop: 20,
    borderTop: '1 solid #ddd',
    fontSize: 8,
    color: '#666',
    textAlign: 'center',
  },
})

interface ReportsPDFProps {
  reports: Array<{
    createdAt: string
    entity: string
    action: string
    description: string
    User?: {
      name?: string
      email?: string
    }
  }>
  filters?: {
    startDate?: string
    endDate?: string
    module?: string
    userId?: string
  }
}

export default function ReportsPDF({ reports, filters }: ReportsPDFProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>CRM Raporları</Text>
          <Text style={styles.subtitle}>
            {filters?.startDate && filters?.endDate
              ? `${formatDate(filters.startDate)} - ${formatDate(filters.endDate)}`
              : 'Tüm Zamanlar'}
            {filters?.module && filters.module !== 'all' && ` • Modül: ${filters.module}`}
          </Text>
        </View>

        {/* Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, styles.col1]}>Tarih</Text>
            <Text style={[styles.tableCell, styles.col2]}>Modül</Text>
            <Text style={[styles.tableCell, styles.col3]}>İşlem</Text>
            <Text style={[styles.tableCell, styles.col4]}>Açıklama</Text>
            <Text style={[styles.tableCell, styles.col5]}>Kullanıcı</Text>
          </View>

          {/* Table Rows */}
          {reports.map((report, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.col1]}>
                {formatDate(report.createdAt)}
              </Text>
              <Text style={[styles.tableCell, styles.col2]}>
                {report.entity || '-'}
              </Text>
              <Text style={[styles.tableCell, styles.col3]}>
                {report.action || '-'}
              </Text>
              <Text style={[styles.tableCell, styles.col4]}>
                {report.description || '-'}
              </Text>
              <Text style={[styles.tableCell, styles.col5]}>
                {report.User?.name || report.User?.email || '-'}
              </Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Toplam {reports.length} kayıt • Oluşturulma: {new Date().toLocaleString('tr-TR')}
          </Text>
        </View>
      </Page>
    </Document>
  )
}

