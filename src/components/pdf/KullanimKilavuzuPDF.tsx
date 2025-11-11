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
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  section: {
    marginBottom: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    borderBottom: '1 solid #ddd',
    paddingBottom: 5,
  },
  subsectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 12,
    color: '#444',
  },
  paragraph: {
    fontSize: 10,
    color: '#333',
    marginBottom: 8,
    lineHeight: 1.5,
  },
  list: {
    marginLeft: 20,
    marginBottom: 8,
  },
  listItem: {
    fontSize: 10,
    color: '#333',
    marginBottom: 4,
    lineHeight: 1.4,
  },
  table: {
    marginTop: 10,
    marginBottom: 10,
    border: '1 solid #ddd',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #ddd',
    padding: 8,
  },
  tableHeader: {
    backgroundColor: '#6366f1',
    color: '#fff',
    fontWeight: 'bold',
  },
  tableCell: {
    fontSize: 9,
    flex: 1,
  },
  highlight: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 4,
    marginBottom: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#666',
    borderTop: '1 solid #ddd',
    paddingTop: 10,
  },
})

interface KullanimKilavuzuPDFProps {
  companyName?: string
}

export default function KullanimKilavuzuPDF({ companyName = 'CRM Enterprise V3' }: KullanimKilavuzuPDFProps) {
  return (
    <Document>
      {/* Sayfa 1: Genel Bakış */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>KULLANIM KILAVUZU</Text>
          <Text style={styles.subtitle}>CRM Enterprise V3 - Detaylı Sistem Kullanım Kılavuzu</Text>
          <Text style={styles.subtitle}>{new Date().toLocaleDateString('tr-TR')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. GENEL BAKIŞ</Text>
          <Text style={styles.paragraph}>
            CRM Enterprise V3, multi-tenant yapıda, kurumsal seviyede bir müşteri ilişkileri yönetim sistemidir. 
            Sistem, satış, pazarlama, stok, finans ve raporlama modüllerini içeren kapsamlı bir çözümdür.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.subsectionTitle}>Teknoloji Stack</Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• Frontend: Next.js 15 (App Router), React 18, TypeScript</Text>
            <Text style={styles.listItem}>• Backend: Supabase (PostgreSQL, Auth, Storage)</Text>
            <Text style={styles.listItem}>• UI: Tailwind CSS, shadcn/ui components</Text>
            <Text style={styles.listItem}>• Animasyon: Framer Motion</Text>
            <Text style={styles.listItem}>• State Management: SWR (data fetching)</Text>
            <Text style={styles.listItem}>• PDF: @react-pdf/renderer</Text>
            <Text style={styles.listItem}>• Locale: next-intl (TR/EN)</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.subsectionTitle}>Sistem Mimarisi</Text>
          <View style={styles.highlight}>
            <Text style={styles.paragraph}>
              <Text style={{ fontWeight: 'bold' }}>Multi-Tenant Yapı:</Text>
            </Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>• Ana Tablo: Company (Multi-tenant root)</Text>
              <Text style={styles.listItem}>• Tüm tablolar: companyId kolonu ile bir şirkete bağlı</Text>
              <Text style={styles.listItem}>• RLS (Row-Level Security): Kullanıcılar sadece kendi şirketinin verisini görür</Text>
              <Text style={styles.listItem}>• SUPER_ADMIN: Tüm şirketleri görebilir ve yönetebilir</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Sayfa 1 / 10 - CRM Enterprise V3 Kullanım Kılavuzu</Text>
        </View>
      </Page>

      {/* Sayfa 2: Giriş ve Yetkilendirme */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>GİRİŞ VE YETKİLENDİRME</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. GİRİŞ YAPMA</Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>1. Tarayıcınızda sisteme giriş sayfasına gidin</Text>
            <Text style={styles.listItem}>2. E-posta adresinizi ve şifrenizi girin</Text>
            <Text style={styles.listItem}>3. "Giriş Yap" butonuna tıklayın</Text>
            <Text style={styles.listItem}>4. Başarılı giriş sonrası Dashboard sayfasına yönlendirilirsiniz</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. ROLLER VE YETKİLER</Text>
          
          <View style={styles.highlight}>
            <Text style={styles.subsectionTitle}>SUPER_ADMIN</Text>
            <Text style={styles.paragraph}>
              Sistem yöneticisi - Tüm şirketleri görebilir ve yönetebilir. Tüm yetkilere sahiptir.
            </Text>
          </View>

          <View style={styles.highlight}>
            <Text style={styles.subsectionTitle}>ADMIN</Text>
            <Text style={styles.paragraph}>
              Şirket yöneticisi - Kendi şirketi için tüm yetkilere sahiptir. Kullanıcı yönetimi, modül izinleri yapabilir.
            </Text>
          </View>

          <View style={styles.highlight}>
            <Text style={styles.subsectionTitle}>SALES</Text>
            <Text style={styles.paragraph}>
              Satış Temsilcisi - Satış işlemleri yapabilir. Müşteri, teklif, fırsat yönetimi yapabilir.
            </Text>
          </View>

          <View style={styles.highlight}>
            <Text style={styles.subsectionTitle}>USER</Text>
            <Text style={styles.paragraph}>
              Temel kullanıcı - Sınırlı yetkilere sahiptir. Genellikle görüntüleme ve temel işlemler yapabilir.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.subsectionTitle}>2 Seviyeli Yetki Kontrolü</Text>
          <View style={styles.highlight}>
            <Text style={styles.paragraph}>
              <Text style={{ fontWeight: 'bold' }}>Seviye 1: Kurum Modül İzni (CompanyModulePermission)</Text>
            </Text>
            <Text style={styles.paragraph}>
              Her kurumun hangi modülleri kullanabileceği belirlenir. Modül aktif/pasif yapılabilir.
            </Text>
            <Text style={styles.paragraph} style={{ marginTop: 8 }}>
              <Text style={{ fontWeight: 'bold' }}>Seviye 2: Rol Modül İzni (RolePermission)</Text>
            </Text>
            <Text style={styles.paragraph}>
              Her rolün modül bazlı CRUD yetkileri (Create, Read, Update, Delete) belirlenir.
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Sayfa 2 / 10 - CRM Enterprise V3 Kullanım Kılavuzu</Text>
        </View>
      </Page>

      {/* Sayfa 3: Modüller - Dashboard, Companies, Customers */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>MODÜLLER VE KULLANIM</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. DASHBOARD (GÖSTERGE PANELİ)</Text>
          <Text style={styles.paragraph}>
            Ana gösterge paneli. Sistemin genel durumunu, KPI'ları ve grafikleri gösterir.
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• 6 KPI kartı (Toplam Müşteri, Aktif Fırsatlar, Bekleyen Teklifler, Toplam Gelir, Bu Ay Satış, Tamamlanan Görevler)</Text>
            <Text style={styles.listItem}>• 5 grafik (Satış Trendi, Ürün Satışları, Fırsat Durumları, Aylık Karşılaştırma, Kanban Board)</Text>
            <Text style={styles.listItem}>• Real-time güncellemeler (30 saniyede bir)</Text>
            <Text style={styles.listItem}>• Son aktiviteler listesi</Text>
          </View>
          <Text style={styles.paragraph} style={{ marginTop: 8 }}>
            <Text style={{ fontWeight: 'bold' }}>Kim Kullanabilir:</Text> Tüm kullanıcılar (okuma yetkisi olanlar)
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. FİRMALAR</Text>
          <Text style={styles.paragraph}>
            Müşteri firmalarını yönetir. Her firma için görüşme, teklif, görev oluşturulabilir.
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• Firma ekleme, düzenleme, silme</Text>
            <Text style={styles.listItem}>• Durum yönetimi (POT: Potansiyel, MUS: Müşteri, ALT: Alt Bayi, PAS: Pasif)</Text>
            <Text style={styles.listItem}>• Firma detay sayfası (istatistikler, görüşmeler, teklifler, görevler)</Text>
            <Text style={styles.listItem}>• Hızlı işlem butonları (Görüşme, Teklif, Görev oluştur)</Text>
            <Text style={styles.listItem}>• Arama ve filtreleme</Text>
          </View>
          <Text style={styles.paragraph} style={{ marginTop: 8 }}>
            <Text style={{ fontWeight: 'bold' }}>Veri Akışı:</Text> Company → Customer → Deal → Quote → Invoice
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. MÜŞTERİLER</Text>
          <Text style={styles.paragraph}>
            Müşteri ilişkileri yönetimi. Müşteri bilgileri, iletişim, adres yönetimi.
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• CRUD işlemleri (Create, Read, Update, Delete)</Text>
            <Text style={styles.listItem}>• Toplu işlemler (Bulk operations)</Text>
            <Text style={styles.listItem}>• Import/Export (Excel, CSV)</Text>
            <Text style={styles.listItem}>• Dosya ekleme (max 10MB)</Text>
            <Text style={styles.listItem}>• Yorum/Not sistemi</Text>
            <Text style={styles.listItem}>• Sayfalama (10-20-50-100 kayıt)</Text>
            <Text style={styles.listItem}>• Arama ve filtreleme</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Sayfa 3 / 10 - CRM Enterprise V3 Kullanım Kılavuzu</Text>
        </View>
      </Page>

      {/* Sayfa 4: Modüller - Deals, Quotes, Invoices */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>MODÜLLER (DEVAM)</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. FIRSATLAR</Text>
          <Text style={styles.paragraph}>
            Satış fırsatları yönetimi. Stage yönetimi, win probability takibi.
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• Stage yönetimi (LEAD, QUALIFIED, PROPOSAL, NEGOTIATION, WON, LOST)</Text>
            <Text style={styles.listItem}>• Win probability takibi</Text>
            <Text style={styles.listItem}>• Kanban board görünümü</Text>
            <Text style={styles.listItem}>• Müşteri ile ilişkilendirme</Text>
            <Text style={styles.listItem}>• Teklif oluşturma</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. TEKLİFLER</Text>
          <Text style={styles.paragraph}>
            Teklif yönetimi. PDF oluşturma, revize sistemi, durum takibi.
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• Teklif oluşturma ve düzenleme</Text>
            <Text style={styles.listItem}>• PDF oluşturma ve indirme</Text>
            <Text style={styles.listItem}>• Durum yönetimi (DRAFT, SENT, ACCEPTED, REJECTED)</Text>
            <Text style={styles.listItem}>• Revize sistemi</Text>
            <Text style={styles.listItem}>• Fırsat ile ilişkilendirme</Text>
            <Text style={styles.listItem}>• Teklif kabul edildiğinde otomatik fatura oluşturma</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. FATURALAR</Text>
          <Text style={styles.paragraph}>
            Fatura yönetimi. PDF oluşturma, ödeme takibi, sevkiyat ilişkilendirme.
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• Fatura oluşturma (SALE/PURCHASE tipi)</Text>
            <Text style={styles.listItem}>• PDF oluşturma ve indirme</Text>
            <Text style={styles.listItem}>• Durum yönetimi (DRAFT, SENT, PAID, OVERDUE, CANCELLED)</Text>
            <Text style={styles.listItem}>• Ödeme takibi</Text>
            <Text style={styles.listItem}>• Sevkiyat ilişkilendirme</Text>
            <Text style={styles.listItem}>• Fatura ödendiğinde otomatik finans kaydı oluşturma</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Sayfa 4 / 10 - CRM Enterprise V3 Kullanım Kılavuzu</Text>
        </View>
      </Page>

      {/* Sayfa 5: Modüller - Products, Shipments, Finance, Tasks, Reports */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>MODÜLLER (DEVAM)</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. ÜRÜNLER</Text>
          <Text style={styles.paragraph}>
            Ürün kataloğu. Stok yönetimi, kategori, SKU yönetimi.
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• Ürün ekleme, düzenleme, silme</Text>
            <Text style={styles.listItem}>• Stok yönetimi (stock, reservedQuantity, incomingQuantity)</Text>
            <Text style={styles.listItem}>• Kategori yönetimi</Text>
            <Text style={styles.listItem}>• SKU ve barcode yönetimi</Text>
            <Text style={styles.listItem}>• Fiyat yönetimi</Text>
            <Text style={styles.listItem}>• Stok hareketleri takibi</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. SEVKİYATLAR</Text>
          <Text style={styles.paragraph}>
            Satış sevkiyatları takibi. Onay sistemi, stok düşürme.
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• Sevkiyat oluşturma ve takibi</Text>
            <Text style={styles.listItem}>• Durum yönetimi (PENDING, IN_TRANSIT, DELIVERED, CANCELLED)</Text>
            <Text style={styles.listItem}>• Onay sistemi (onaylandığında stok düşer)</Text>
            <Text style={styles.listItem}>• Fatura ile ilişkilendirme</Text>
            <Text style={styles.listItem}>• Tracking numarası yönetimi</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. FİNANS</Text>
          <Text style={styles.paragraph}>
            Gelir-gider takibi. Kategori, döviz desteği.
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• Gelir/Gider kayıtları</Text>
            <Text style={styles.listItem}>• Kategori yönetimi</Text>
            <Text style={styles.listItem}>• Döviz desteği</Text>
            <Text style={styles.listItem}>• Fatura ile ilişkilendirme</Text>
            <Text style={styles.listItem}>• Raporlama</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>13. GÖREVLER</Text>
          <Text style={styles.paragraph}>
            Görev yönetimi. Durum, öncelik, atama.
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• Görev oluşturma ve atama</Text>
            <Text style={styles.listItem}>• Durum yönetimi (TODO, IN_PROGRESS, DONE, CANCELLED)</Text>
            <Text style={styles.listItem}>• Öncelik yönetimi</Text>
            <Text style={styles.listItem}>• Kullanıcı atama</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>14. RAPORLAR</Text>
          <Text style={styles.paragraph}>
            Detaylı raporlar ve analitik. Filtreleme, export.
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• Müşteri raporları</Text>
            <Text style={styles.listItem}>• Satış raporları</Text>
            <Text style={styles.listItem}>• Finansal raporlar</Text>
            <Text style={styles.listItem}>• Ürün raporları</Text>
            <Text style={styles.listItem}>• Performans raporları</Text>
            <Text style={styles.listItem}>• Excel, PDF, CSV export</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Sayfa 5 / 10 - CRM Enterprise V3 Kullanım Kılavuzu</Text>
        </View>
      </Page>

      {/* Sayfa 6: Özellikler - CRUD */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>ÖZELLİKLER</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>15. CRUD İŞLEMLERİ</Text>
          
          <Text style={styles.subsectionTitle}>Create (Oluşturma):</Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>1. Liste sayfasında "+ Yeni" butonuna tıklayın</Text>
            <Text style={styles.listItem}>2. Form alanlarını doldurun</Text>
            <Text style={styles.listItem}>3. "Kaydet" butonuna tıklayın</Text>
            <Text style={styles.listItem}>4. Kayıt oluşturulur ve listede görünür</Text>
          </View>

          <Text style={styles.subsectionTitle}>Read (Okuma):</Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>1. Liste sayfasında kayıtları görüntüleyin</Text>
            <Text style={styles.listItem}>2. Detay sayfasına gitmek için "Görüntüle" butonuna tıklayın</Text>
            <Text style={styles.listItem}>3. Kayıt bilgileri read-only olarak görüntülenir</Text>
          </View>

          <Text style={styles.subsectionTitle}>Update (Güncelleme):</Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>1. Liste sayfasında "Düzenle" butonuna tıklayın</Text>
            <Text style={styles.listItem}>2. Form açılır ve mevcut bilgiler yüklenir</Text>
            <Text style={styles.listItem}>3. Değişiklikleri yapın</Text>
            <Text style={styles.listItem}>4. "Kaydet" butonuna tıklayın</Text>
            <Text style={styles.listItem}>5. Değişiklikler kaydedilir ve listede güncellenir</Text>
          </View>

          <Text style={styles.subsectionTitle}>Delete (Silme):</Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>1. Liste sayfasında "Sil" butonuna tıklayın</Text>
            <Text style={styles.listItem}>2. Onay mesajı görüntülenir</Text>
            <Text style={styles.listItem}>3. Onaylarsanız kayıt silinir</Text>
            <Text style={styles.listItem}>4. Silinen kayıt listeden kaldırılır</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>16. TOPLU İŞLEMLER</Text>
          <Text style={styles.paragraph}>
            Birden fazla kaydı seçip toplu işlem yapabilirsiniz:
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>1. Liste sayfasında kayıtların yanındaki checkbox'ları işaretleyin</Text>
            <Text style={styles.listItem}>2. Üstte "Toplu İşlemler" butonu görünür</Text>
            <Text style={styles.listItem}>3. "Toplu Sil" veya "Toplu Güncelle" seçeneklerinden birini seçin</Text>
            <Text style={styles.listItem}>4. İşlem tüm seçili kayıtlara uygulanır</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Sayfa 6 / 10 - CRM Enterprise V3 Kullanım Kılavuzu</Text>
        </View>
      </Page>

      {/* Sayfa 7: Özellikler - Import/Export, Dosya, Yorum */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>ÖZELLİKLER (DEVAM)</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>17. IMPORT/EXPORT</Text>
          
          <Text style={styles.subsectionTitle}>Import (İçe Aktarma):</Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>1. Liste sayfasında "İçe Aktar" butonuna tıklayın</Text>
            <Text style={styles.listItem}>2. Excel (.xlsx, .xls) veya CSV dosyası seçin</Text>
            <Text style={styles.listItem}>3. Dosya yüklenir ve veriler otomatik eşleştirilir</Text>
            <Text style={styles.listItem}>4. Geçersiz kayıtlar filtrelenir</Text>
            <Text style={styles.listItem}>5. Geçerli kayıtlar sisteme eklenir</Text>
          </View>

          <Text style={styles.subsectionTitle}>Export (Dışa Aktarma):</Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>1. Liste sayfasında "Dışa Aktar" butonuna tıklayın</Text>
            <Text style={styles.listItem}>2. Format seçin (Excel, PDF, CSV)</Text>
            <Text style={styles.listItem}>3. Dosya indirilir</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>18. DOSYA EKLEME</Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>1. Detay sayfasında "Dosya Ekle" butonuna tıklayın</Text>
            <Text style={styles.listItem}>2. Dosya seçin (max 10MB)</Text>
            <Text style={styles.listItem}>3. Dosya Supabase Storage'a yüklenir</Text>
            <Text style={styles.listItem}>4. Yüklenen dosyalar detay sayfasında görüntülenir</Text>
            <Text style={styles.listItem}>5. Dosyaları görüntüleyebilir veya silebilirsiniz</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>19. YORUM/NOT SİSTEMİ</Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>1. Detay sayfasında "Yorumlar" sekmesine gidin</Text>
            <Text style={styles.listItem}>2. Yorum alanına yazın</Text>
            <Text style={styles.listItem}>3. "Yorum Ekle" butonuna tıklayın</Text>
            <Text style={styles.listItem}>4. Yorum eklenir ve listede görünür</Text>
            <Text style={styles.listItem}>5. Yorum sahibi ve tarih bilgisi otomatik eklenir</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>20. PDF OLUŞTURMA</Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>1. Teklif veya Fatura detay sayfasına gidin</Text>
            <Text style={styles.listItem}>2. "PDF İndir" butonuna tıklayın</Text>
            <Text style={styles.listItem}>3. PDF oluşturulur ve indirilir</Text>
            <Text style={styles.listItem}>4. PDF'de şirket logosu, müşteri bilgileri, ürün listesi, KDV hesaplama bulunur</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Sayfa 7 / 10 - CRM Enterprise V3 Kullanım Kılavuzu</Text>
        </View>
      </Page>

      {/* Sayfa 8: Veri Akışı */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>VERİ AKIŞI VE İLİŞKİLER</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>21. SATIŞ AKIŞI</Text>
          <View style={styles.highlight}>
            <Text style={styles.paragraph} style={{ fontWeight: 'bold', marginBottom: 8 }}>
              Akış Sırası: Customer → Deal → Quote → Invoice → Shipment
            </Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>
                <Text style={{ fontWeight: 'bold' }}>1. Customer (Müşteri):</Text> Müşteri bilgileri oluşturulur
              </Text>
              <Text style={styles.listItem}>
                <Text style={{ fontWeight: 'bold' }}>2. Deal (Fırsat):</Text> Müşteri için satış fırsatı oluşturulur
              </Text>
              <Text style={styles.listItem}>
                <Text style={{ fontWeight: 'bold' }}>3. Quote (Teklif):</Text> Fırsat için teklif hazırlanır
              </Text>
              <Text style={styles.listItem}>
                <Text style={{ fontWeight: 'bold' }}>4. Invoice (Fatura):</Text> Teklif kabul edildiğinde otomatik fatura oluşturulur
              </Text>
              <Text style={styles.listItem}>
                <Text style={{ fontWeight: 'bold' }}>5. Shipment (Sevkiyat):</Text> Fatura için sevkiyat oluşturulur ve onaylandığında stok düşer
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>22. STOK AKIŞI</Text>
          
          <Text style={styles.subsectionTitle}>Satış Stok Akışı:</Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>
              1. InvoiceItem oluşturulduğunda → Product.reservedQuantity artar (stok düşmez)
            </Text>
            <Text style={styles.listItem}>
              2. Shipment onaylandığında → Product.stock düşer + Product.reservedQuantity azalır + StockMovement oluştur
            </Text>
          </View>

          <Text style={styles.subsectionTitle}>Alış Stok Akışı:</Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>
              1. InvoiceItem oluşturulduğunda (PURCHASE) → Product.incomingQuantity artar (stok artmaz)
            </Text>
            <Text style={styles.listItem}>
              2. PurchaseTransaction onaylandığında → Product.stock artar + Product.incomingQuantity azalır + StockMovement oluştur
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>23. OTOMASYONLAR</Text>
          <View style={styles.highlight}>
            <View style={styles.list}>
              <Text style={styles.listItem}>
                <Text style={{ fontWeight: 'bold' }}>Quote ACCEPTED:</Text> Otomatik Invoice oluştur + ActivityLog
              </Text>
              <Text style={styles.listItem}>
                <Text style={{ fontWeight: 'bold' }}>Invoice PAID:</Text> Otomatik Finance kaydı oluştur + ActivityLog
              </Text>
              <Text style={styles.listItem}>
                <Text style={{ fontWeight: 'bold' }}>Shipment DELIVERED:</Text> ActivityLog yaz
              </Text>
              <Text style={styles.listItem}>
                <Text style={{ fontWeight: 'bold' }}>Tüm CRUD:</Text> ActivityLog'a meta JSON ile kaydet
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Sayfa 8 / 10 - CRM Enterprise V3 Kullanım Kılavuzu</Text>
        </View>
      </Page>

      {/* Sayfa 9: SSS */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>SIK SORULAN SORULAR</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>24. SIK SORULAN SORULAR</Text>
          
          <View style={styles.highlight}>
            <Text style={styles.subsectionTitle}>S: Stok nasıl yönetilir?</Text>
            <Text style={styles.paragraph}>
              C: Stok yönetimi otomatiktir. Satış faturası oluşturulduğunda rezerve edilir, sevkiyat onaylandığında stok düşer. 
              Alış faturası onaylandığında stok artar.
            </Text>
          </View>

          <View style={styles.highlight}>
            <Text style={styles.subsectionTitle}>S: Teklif nasıl faturaya dönüşür?</Text>
            <Text style={styles.paragraph}>
              C: Teklif durumu "ACCEPTED" yapıldığında otomatik olarak fatura oluşturulur.
            </Text>
          </View>

          <View style={styles.highlight}>
            <Text style={styles.subsectionTitle}>S: Kim ne yapabilir?</Text>
            <Text style={styles.paragraph}>
              C: SUPER_ADMIN tüm yetkilere sahiptir. ADMIN kendi şirketi için tüm yetkilere sahiptir. 
              SALES satış işlemleri yapabilir. USER sınırlı yetkilere sahiptir.
            </Text>
          </View>

          <View style={styles.highlight}>
            <Text style={styles.subsectionTitle}>S: Veriler nerede saklanır?</Text>
            <Text style={styles.paragraph}>
              C: Tüm veriler Supabase (PostgreSQL) veritabanında saklanır. Dosyalar Supabase Storage'da saklanır.
            </Text>
          </View>

          <View style={styles.highlight}>
            <Text style={styles.subsectionTitle}>S: Multi-tenant yapı nedir?</Text>
            <Text style={styles.paragraph}>
              C: Her şirket kendi verilerini görür. Tüm tablolar companyId ile bir şirkete bağlıdır. 
              RLS (Row-Level Security) ile veri izolasyonu sağlanır.
            </Text>
          </View>

          <View style={styles.highlight}>
            <Text style={styles.subsectionTitle}>S: PDF nasıl oluşturulur?</Text>
            <Text style={styles.paragraph}>
              C: Teklif veya Fatura detay sayfasında "PDF İndir" butonuna tıklayın. 
              PDF @react-pdf/renderer ile oluşturulur ve indirilir.
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Sayfa 9 / 10 - CRM Enterprise V3 Kullanım Kılavuzu</Text>
        </View>
      </Page>

      {/* Sayfa 10: Son Notlar */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>SON NOTLAR</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>25. PERFORMANS HEDEFLERİ</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, { width: '40%' }]}>Metrik</Text>
              <Text style={[styles.tableCell, { width: '30%' }]}>Hedef</Text>
              <Text style={[styles.tableCell, { width: '30%' }]}>Ölçüm</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '40%' }]}>Sekme geçişi</Text>
              <Text style={[styles.tableCell, { width: '30%' }]}>{"<300ms"}</Text>
              <Text style={[styles.tableCell, { width: '30%' }]}>Link click → render</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '40%' }]}>Dashboard ilk render</Text>
              <Text style={[styles.tableCell, { width: '30%' }]}>{"<500ms"}</Text>
              <Text style={[styles.tableCell, { width: '30%' }]}>Page load → visible</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '40%' }]}>API response (cache hit)</Text>
              <Text style={[styles.tableCell, { width: '30%' }]}>{"<200ms"}</Text>
              <Text style={[styles.tableCell, { width: '30%' }]}>Request → response</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '40%' }]}>API response (cache miss)</Text>
              <Text style={[styles.tableCell, { width: '30%' }]}>{"<1000ms"}</Text>
              <Text style={[styles.tableCell, { width: '30%' }]}>Request → response</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>26. İLETİŞİM VE DESTEK</Text>
          <Text style={styles.paragraph}>
            Sistem hakkında sorularınız için yardım sayfasını ziyaret edebilir veya destek ekibi ile iletişime geçebilirsiniz.
          </Text>
          <Text style={styles.paragraph} style={{ marginTop: 10 }}>
            <Text style={{ fontWeight: 'bold' }}>Not:</Text> Bu kılavuz sistemin güncel durumunu yansıtmaktadır. 
            Sistem sürekli geliştirilmekte ve yeni özellikler eklenmektedir.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>27. SÜRÜM BİLGİSİ</Text>
          <View style={styles.highlight}>
            <Text style={styles.paragraph}>
              <Text style={{ fontWeight: 'bold' }}>Versiyon:</Text> 3.0.0
            </Text>
            <Text style={styles.paragraph}>
              <Text style={{ fontWeight: 'bold' }}>Tarih:</Text> {new Date().toLocaleDateString('tr-TR')}
            </Text>
            <Text style={styles.paragraph}>
              <Text style={{ fontWeight: 'bold' }}>Teknoloji:</Text> Next.js 15, Supabase, TypeScript
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Sayfa 10 / 10 - CRM Enterprise V3 Kullanım Kılavuzu</Text>
          <Text style={{ marginTop: 5, fontSize: 8 }}>
            © {new Date().getFullYear()} CRM Enterprise V3. Tüm hakları saklıdır.
          </Text>
        </View>
      </Page>
    </Document>
  )
}

