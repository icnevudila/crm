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
    borderBottom: '3 solid #6366f1',
    paddingBottom: 20,
  },
  companyName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 8,
  },
  companyInfo: {
    fontSize: 9,
    color: '#666',
    marginTop: 5,
    lineHeight: 1.4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#6366f1',
    borderBottom: '1 solid #e5e7eb',
    paddingBottom: 5,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1f2937',
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderRadius: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingVertical: 4,
  },
  rowTwoColumn: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  label: {
    color: '#666',
    width: '35%',
    fontSize: 9,
  },
  value: {
    color: '#000',
    width: '65%',
    fontWeight: 'bold',
    fontSize: 9,
  },
  table: {
    marginTop: 15,
    border: '1 solid #e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
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
    borderBottom: '1 solid #e5e7eb',
    padding: 10,
    backgroundColor: '#ffffff',
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottom: '1 solid #e5e7eb',
    padding: 10,
    backgroundColor: '#f9fafb',
  },
  tableCell: {
    fontSize: 9,
  },
  colModule: { width: '40%' },
  colDesc: { width: '35%' },
  colPrice: { width: '25%', textAlign: 'right' },
  colFeature: { width: '60%' },
  colIncluded: { width: '40%', textAlign: 'center' },
  totalSection: {
    marginTop: 25,
    borderTop: '3 solid #6366f1',
    paddingTop: 15,
    backgroundColor: '#f9fafb',
    padding: 15,
    borderRadius: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#374151',
  },
  totalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  grandTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  featureList: {
    marginTop: 10,
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 6,
    fontSize: 9,
  },
  featureBullet: {
    color: '#6366f1',
    marginRight: 8,
    fontWeight: 'bold',
  },
  featureText: {
    color: '#374151',
    flex: 1,
  },
  packageCard: {
    border: '2 solid #6366f1',
    borderRadius: 6,
    padding: 15,
    marginBottom: 15,
    backgroundColor: '#ffffff',
  },
  packageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 10,
  },
  packagePrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 10,
  },
  packageDescription: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 10,
    lineHeight: 1.5,
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTop: '1 solid #e5e7eb',
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af',
  },
  signature: {
    marginTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '45%',
    borderTop: '2 solid #6366f1',
    paddingTop: 8,
    textAlign: 'center',
    fontSize: 9,
  },
  signatureLabel: {
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 5,
  },
  termsSection: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
    border: '1 solid #e5e7eb',
  },
  termsTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1f2937',
  },
  termsText: {
    fontSize: 8,
    color: '#6b7280',
    lineHeight: 1.4,
    marginBottom: 5,
  },
  highlightBox: {
    backgroundColor: '#fef3c7',
    border: '1 solid #fbbf24',
    borderRadius: 4,
    padding: 12,
    marginTop: 15,
  },
  highlightText: {
    fontSize: 9,
    color: '#92400e',
    fontWeight: 'bold',
  },
})

interface SystemProposalPDFProps {
  proposal: {
    id: string
    title: string
    proposalNumber?: string
    createdAt: string
    validUntil?: string
    customer?: {
      name: string
      companyName?: string
      email?: string
      phone?: string
      address?: string
      city?: string
      taxNumber?: string
    }
    company?: {
      name: string
      taxNumber?: string
      address?: string
      city?: string
      phone?: string
      email?: string
      website?: string
    }
    packages?: Array<{
      name: string
      description: string
      price: number
      period?: string // 'monthly' | 'yearly' | 'one-time'
      features: string[]
    }>
    modules?: Array<{
      name: string
      description: string
      price?: number
    }>
    totalAmount?: number
    discount?: number
    taxRate?: number
    notes?: string
    terms?: string[]
  }
}

export default function SystemProposalPDF({ proposal }: SystemProposalPDFProps) {
  const taxRate = proposal.taxRate || 18
  const subtotal = proposal.totalAmount || 0
  const discount = proposal.discount || 0
  const subtotalAfterDiscount = subtotal - discount
  const kdv = subtotalAfterDiscount * (taxRate / 100)
  const total = subtotalAfterDiscount + kdv

  const defaultModules = [
    { name: 'Dashboard', description: 'Ana gösterge paneli ve KPI metrikleri' },
    { name: 'Firmalar', description: 'Müşteri firmaları yönetimi' },
    { name: 'Tedarikçiler', description: 'Tedarikçi yönetimi' },
    { name: 'Müşteriler', description: 'Müşteri ilişkileri yönetimi' },
    { name: 'Teklifler', description: 'Teklif oluşturma ve yönetimi' },
    { name: 'Ürünler', description: 'Ürün kataloğu ve yönetimi' },
    { name: 'Finans', description: 'Gelir-gider takibi' },
    { name: 'Raporlar', description: 'Detaylı analiz ve raporlar' },
    { name: 'Sevkiyatlar', description: 'Sevkiyat takibi' },
    { name: 'Stok', description: 'Stok yönetimi ve hareket takibi' },
  ]

  const modules = proposal.modules || defaultModules

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header - Satıcı Bilgileri */}
        <View style={styles.header}>
          <Text style={styles.companyName}>
            {proposal.company?.name || 'CRM Enterprise V3'}
          </Text>
          {proposal.company?.taxNumber && (
            <Text style={styles.companyInfo}>VKN: {proposal.company.taxNumber}</Text>
          )}
          {proposal.company?.address && (
            <Text style={styles.companyInfo}>Adres: {proposal.company.address}</Text>
          )}
          {proposal.company?.city && (
            <Text style={styles.companyInfo}>{proposal.company.city}</Text>
          )}
          {proposal.company?.phone && (
            <Text style={styles.companyInfo}>Tel: {proposal.company.phone}</Text>
          )}
          {proposal.company?.email && (
            <Text style={styles.companyInfo}>E-posta: {proposal.company.email}</Text>
          )}
          {proposal.company?.website && (
            <Text style={styles.companyInfo}>Web: {proposal.company.website}</Text>
          )}
        </View>

        {/* Title */}
        <Text style={styles.title}>SİSTEM SATIŞ/KİRALAMA TEKLİFİ</Text>

        {/* Proposal Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Teklif Bilgileri</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Teklif No:</Text>
            <Text style={styles.value}>
              {proposal.proposalNumber || proposal.id.substring(0, 8).toUpperCase()}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tarih:</Text>
            <Text style={styles.value}>
              {new Date(proposal.createdAt).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
          {proposal.validUntil && (
            <View style={styles.row}>
              <Text style={styles.label}>Geçerlilik Tarihi:</Text>
              <Text style={styles.value}>
                {new Date(proposal.validUntil).toLocaleDateString('tr-TR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
          )}
        </View>

        {/* Customer Info */}
        {proposal.customer && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Müşteri Bilgileri</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Firma/Ad Soyad:</Text>
              <Text style={styles.value}>
                {proposal.customer.companyName || proposal.customer.name}
              </Text>
            </View>
            {proposal.customer.taxNumber && (
              <View style={styles.row}>
                <Text style={styles.label}>VKN/TCKN:</Text>
                <Text style={styles.value}>{proposal.customer.taxNumber}</Text>
              </View>
            )}
            {proposal.customer.address && (
              <View style={styles.row}>
                <Text style={styles.label}>Adres:</Text>
                <Text style={styles.value}>{proposal.customer.address}</Text>
              </View>
            )}
            {proposal.customer.city && (
              <View style={styles.row}>
                <Text style={styles.label}>Şehir:</Text>
                <Text style={styles.value}>{proposal.customer.city}</Text>
              </View>
            )}
            {proposal.customer.phone && (
              <View style={styles.row}>
                <Text style={styles.label}>Telefon:</Text>
                <Text style={styles.value}>{proposal.customer.phone}</Text>
              </View>
            )}
            {proposal.customer.email && (
              <View style={styles.row}>
                <Text style={styles.label}>E-posta:</Text>
                <Text style={styles.value}>{proposal.customer.email}</Text>
              </View>
            )}
          </View>
        )}

        {/* System Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sistem Özeti</Text>
          <Text style={styles.featureText}>
            CRM Enterprise V3, modern web teknolojileri ile geliştirilmiş, multi-tenant
            yapıda, kurumsal seviyede bir müşteri ilişkileri yönetim sistemidir. Sistem,
            satış, pazarlama, stok, finans ve raporlama modüllerini içeren kapsamlı bir
            çözümdür.
          </Text>
        </View>

        {/* Modules Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sistem Modülleri</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, styles.colModule]}>Modül</Text>
              <Text style={[styles.tableCell, styles.colDesc]}>Açıklama</Text>
              {proposal.modules?.some((m) => m.price) && (
                <Text style={[styles.tableCell, styles.colPrice]}>Fiyat</Text>
              )}
            </View>
            {modules.map((module, index) => (
              <View
                key={index}
                style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
              >
                <Text style={[styles.tableCell, styles.colModule]}>{module.name}</Text>
                <Text style={[styles.tableCell, styles.colDesc]}>
                  {module.description}
                </Text>
                {module.price !== undefined && (
                  <Text style={[styles.tableCell, styles.colPrice]}>
                    {module.price.toFixed(2)} ₺
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Packages */}
        {proposal.packages && proposal.packages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Paket Seçenekleri</Text>
            {proposal.packages.map((pkg, index) => (
              <View key={index} style={styles.packageCard}>
                <Text style={styles.packageTitle}>{pkg.name}</Text>
                <Text style={styles.packagePrice}>
                  {pkg.price.toFixed(2)} ₺
                  {pkg.period === 'monthly' && ' / Aylık'}
                  {pkg.period === 'yearly' && ' / Yıllık'}
                  {pkg.period === 'one-time' && ' (Tek Seferlik)'}
                </Text>
                <Text style={styles.packageDescription}>{pkg.description}</Text>
                {pkg.features && pkg.features.length > 0 && (
                  <View style={styles.featureList}>
                    {pkg.features.map((feature, fIndex) => (
                      <View key={fIndex} style={styles.featureItem}>
                        <Text style={styles.featureBullet}>✓</Text>
                        <Text style={styles.featureText}>{feature}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Key Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Temel Özellikler</Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>•</Text>
              <Text style={styles.featureText}>
                Multi-tenant yapı: Her şirket kendi verisini görür
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>•</Text>
              <Text style={styles.featureText}>
                Rol bazlı yetki yönetimi: Admin, Sales, User rolleri
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>•</Text>
              <Text style={styles.featureText}>
                Gerçek zamanlı dashboard ve KPI metrikleri
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>•</Text>
              <Text style={styles.featureText}>
                Otomatik stok yönetimi ve rezerve stok sistemi
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>•</Text>
              <Text style={styles.featureText}>
                PDF teklif ve fatura oluşturma
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>•</Text>
              <Text style={styles.featureText}>
                Detaylı raporlama ve analitik
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>•</Text>
              <Text style={styles.featureText}>
                TR/EN çoklu dil desteği
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>•</Text>
              <Text style={styles.featureText}>
                Responsive tasarım: Mobil, tablet, desktop uyumlu
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>•</Text>
              <Text style={styles.featureText}>
                Yüksek performans: &lt;300ms sayfa geçişi, &lt;500ms dashboard yükleme
              </Text>
            </View>
          </View>
        </View>

        {/* Pricing */}
        {proposal.totalAmount !== undefined && (
          <View style={styles.totalSection}>
            <Text style={styles.sectionTitle}>Fiyatlandırma</Text>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Ara Toplam:</Text>
              <Text style={styles.totalValue}>{subtotal.toFixed(2)} ₺</Text>
            </View>
            {discount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>İndirim:</Text>
                <Text style={styles.totalValue}>-{discount.toFixed(2)} ₺</Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>KDV Hariç Toplam:</Text>
              <Text style={styles.totalValue}>
                {subtotalAfterDiscount.toFixed(2)} ₺
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>KDV (%{taxRate}):</Text>
              <Text style={styles.totalValue}>{kdv.toFixed(2)} ₺</Text>
            </View>
            <View style={[styles.totalRow, { marginTop: 10, borderTop: '2 solid #6366f1', paddingTop: 10 }]}>
              <Text style={[styles.totalLabel, styles.grandTotal]}>GENEL TOPLAM:</Text>
              <Text style={[styles.totalValue, styles.grandTotal]}>
                {total.toFixed(2)} ₺
              </Text>
            </View>
          </View>
        )}

        {/* Terms & Conditions */}
        {proposal.terms && proposal.terms.length > 0 && (
          <View style={styles.termsSection}>
            <Text style={styles.termsTitle}>Şartlar ve Koşullar</Text>
            {proposal.terms.map((term, index) => (
              <Text key={index} style={styles.termsText}>
                {index + 1}. {term}
              </Text>
            ))}
          </View>
        )}

        {/* Notes */}
        {proposal.notes && (
          <View style={styles.highlightBox}>
            <Text style={styles.highlightText}>Notlar:</Text>
            <Text style={styles.termsText}>{proposal.notes}</Text>
          </View>
        )}

        {/* Signature */}
        <View style={styles.signature}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Hazırlayan</Text>
            <Text style={{ fontSize: 8, color: '#9ca3af', marginTop: 20 }}>
              İmza
            </Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Onaylayan</Text>
            <Text style={{ fontSize: 8, color: '#9ca3af', marginTop: 20 }}>
              İmza
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Bu teklif {new Date(proposal.createdAt).toLocaleDateString('tr-TR')}{' '}
            tarihinde hazırlanmıştır.
          </Text>
          {proposal.validUntil && (
            <Text style={{ marginTop: 5 }}>
              Geçerlilik süresi:{' '}
              {new Date(proposal.validUntil).toLocaleDateString('tr-TR')}
            </Text>
          )}
        </View>
      </Page>
    </Document>
  )
}

