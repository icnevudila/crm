import jsPDF from 'jspdf'

// Türkçe karakter desteği için encoding helper
// jsPDF UTF-8 destekler, sadece string olarak geçiriyoruz
export const encodeTurkish = (text: string): string => {
  if (!text) return ''
  // jsPDF UTF-8 destekler, direkt döndürüyoruz
  // Eğer sorun olursa: return text.replace(/ı/g, 'i').replace(/İ/g, 'I') vb.
  return String(text)
}

// Tarih formatla (dd.mm.yyyy)
export const formatDate = (date: string | Date): string => {
  if (!date) return ''
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return ''
  
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}.${month}.${year}`
}

// Para birimi formatla (19.500,00 TL)
export const formatCurrency = (amount: number): string => {
  if (amount === null || amount === undefined || isNaN(amount)) return '0,00 TL'
  return `${amount.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')} TL`
}

// Ortak PDF stil yardımcıları
export const PDFStyles = {
  colors: {
    primary: [99, 102, 241], // Indigo-500
    primaryDark: [79, 70, 229], // Indigo-600
    gray: [102, 102, 102],
    grayLight: [153, 153, 153],
    grayDark: [51, 51, 51],
    red: [220, 38, 38],
    redLight: [254, 242, 242],
    green: [34, 197, 94],
    background: [248, 250, 252], // Slate-50
    border: [200, 200, 200],
  },
  fonts: {
    title: 22,
    subtitle: 14,
    body: 10,
    small: 9,
    tiny: 8,
  },
  spacing: {
    margin: 20,
    sectionGap: 15,
    itemGap: 7,
    lineHeight: 5,
  },
}

// Ortak header çiz
export const drawHeader = (doc: jsPDF, pageWidth: number, companyName: string, companyInfo?: any) => {
  let yPos = 25

  // Üst border
  doc.setDrawColor(...PDFStyles.colors.primary)
  doc.setLineWidth(2)
  doc.line(PDFStyles.spacing.margin, 18, pageWidth - PDFStyles.spacing.margin, 18)

  // Şirket adı
  doc.setFontSize(20)
  doc.setTextColor(...PDFStyles.colors.primary)
  doc.setFont('helvetica', 'bold')
  doc.text(encodeTurkish(companyName || 'Şirket Adı'), PDFStyles.spacing.margin, yPos)
  yPos += 12

  // Şirket bilgileri
  if (companyInfo) {
    doc.setFontSize(PDFStyles.fonts.small)
    doc.setTextColor(...PDFStyles.colors.gray)
    doc.setFont('helvetica', 'normal')

    if (companyInfo.taxNumber) {
      doc.text(`VKN: ${companyInfo.taxNumber}`, PDFStyles.spacing.margin, yPos)
      yPos += PDFStyles.spacing.lineHeight
    }
    if (companyInfo.address) {
      doc.text(`Adres: ${encodeTurkish(companyInfo.address)}`, PDFStyles.spacing.margin, yPos)
      yPos += PDFStyles.spacing.lineHeight
    }
    if (companyInfo.city) {
      doc.text(encodeTurkish(companyInfo.city), PDFStyles.spacing.margin, yPos)
      yPos += PDFStyles.spacing.lineHeight
    }
    if (companyInfo.phone) {
      doc.text(`Tel: ${companyInfo.phone}`, PDFStyles.spacing.margin, yPos)
      yPos += PDFStyles.spacing.lineHeight
    }
    if (companyInfo.email) {
      doc.text(`E-posta: ${companyInfo.email}`, PDFStyles.spacing.margin, yPos)
      yPos += PDFStyles.spacing.lineHeight
    }
  }

  return yPos + PDFStyles.spacing.sectionGap
}

// Ortak başlık çiz
export const drawTitle = (doc: jsPDF, pageWidth: number, title: string, yPos: number): number => {
  doc.setFontSize(PDFStyles.fonts.title)
  doc.setTextColor(...PDFStyles.colors.primary)
  doc.setFont('helvetica', 'bold')
  doc.text(encodeTurkish(title), pageWidth / 2, yPos, { align: 'center' })
  yPos += 12

  // Alt çizgi
  doc.setDrawColor(...PDFStyles.colors.primary)
  doc.setLineWidth(1)
  doc.line(60, yPos, pageWidth - 60, yPos)
  yPos += 18

  return yPos
}

// Box içinde section çiz
export const drawSectionBox = (
  doc: jsPDF,
  pageWidth: number,
  yPos: number,
  title: string,
  items: Array<[string, string]>,
  boxHeight?: number
): number => {
  const startY = yPos - 10
  const calculatedHeight = boxHeight || Math.max(40, items.length * 7 + 20)
  
  // Box background
  doc.setDrawColor(...PDFStyles.colors.border)
  doc.setFillColor(...PDFStyles.colors.background)
  doc.roundedRect(
    PDFStyles.spacing.margin,
    startY,
    pageWidth - PDFStyles.spacing.margin * 2,
    calculatedHeight,
    3,
    3,
    'FD'
  )

  // Section başlığı
  doc.setFontSize(PDFStyles.fonts.subtitle)
  doc.setTextColor(...PDFStyles.colors.primary)
  doc.setFont('helvetica', 'bold')
  doc.text(encodeTurkish(title), PDFStyles.spacing.margin + 5, yPos)
  yPos += 12

  // Items
  doc.setFontSize(PDFStyles.fonts.body)
  doc.setFont('helvetica', 'normal')

  items.forEach(([label, value]) => {
    doc.setTextColor(...PDFStyles.colors.gray)
    doc.text(encodeTurkish(label), PDFStyles.spacing.margin + 5, yPos)
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'bold')
    const labelWidth = doc.getTextWidth(label)
    const valueX = Math.max(110, PDFStyles.spacing.margin + 5 + labelWidth + 15)
    doc.text(encodeTurkish(value), valueX, yPos)
    doc.setFont('helvetica', 'normal')
    yPos += PDFStyles.spacing.itemGap
  })

  return yPos + 12
}

// Footer çiz
export const drawFooter = (doc: jsPDF, pageWidth: number, pageHeight: number, reportDate: string) => {
  const yPos = pageHeight - 12

  // Footer çizgisi
  doc.setDrawColor(...PDFStyles.colors.border)
  doc.line(PDFStyles.spacing.margin, yPos - 8, pageWidth - PDFStyles.spacing.margin, yPos - 8)

  // Footer text
  doc.setFontSize(PDFStyles.fonts.tiny)
  doc.setTextColor(...PDFStyles.colors.grayLight)
  const footerText = `Bu rapor ${reportDate} tarihinde hazırlanmıştır.`
  doc.text(encodeTurkish(footerText), pageWidth / 2, yPos, { align: 'center' })
}

// İmza alanı çiz
export const drawSignatureArea = (doc: jsPDF, pageWidth: number, yPos: number) => {
  // İmza çizgileri
  doc.setDrawColor(...PDFStyles.colors.border)
  doc.setLineWidth(0.5)
  doc.line(35, yPos, 75, yPos)
  doc.line(pageWidth - 75, yPos, pageWidth - 35, yPos)

  // İmza labels
  doc.setFontSize(PDFStyles.fonts.small)
  doc.setTextColor(...PDFStyles.colors.gray)
  doc.setFont('helvetica', 'normal')
  doc.text(encodeTurkish('Hazırlayan'), 55, yPos - 5, { align: 'center' })
  doc.text(encodeTurkish('Onaylayan'), pageWidth - 55, yPos - 5, { align: 'center' })
}

