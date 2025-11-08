import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Dynamic route - POST/PUT sonrası fresh data için cache'i kapat
export const dynamic = 'force-dynamic'

// Türkiye Fatura Mevzuatına Uygun XML Export (UBL-TR Formatı)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Session kontrolü
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Invoice Export API session error:', sessionError)
      }
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Failed to get session' },
        { status: 500 }
      )
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = getSupabaseWithServiceRole()

    // SuperAdmin tüm şirketlerin verilerini görebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId

    if (process.env.NODE_ENV === 'development') {
      console.log('Invoice Export GET request:', {
        invoiceId: id,
        companyId,
        isSuperAdmin,
        userId: session.user.id,
      })
    }

    // Invoice'u önce sadece temel verilerle çek (ilişkiler olmadan)
    let query = supabase
      .from('Invoice')
      .select('*')
      .eq('id', id)

    if (!isSuperAdmin) {
      query = query.eq('companyId', companyId)
    }

    const { data: invoiceData, error: invoiceError } = await query.single()

    if (process.env.NODE_ENV === 'development') {
      console.log('Invoice Export GET - basic data:', {
        invoiceFound: !!invoiceData,
        invoiceId: invoiceData?.id,
        invoiceTitle: invoiceData?.title,
        error: invoiceError?.message,
      })
    }

    if (invoiceError || !invoiceData) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Invoice Export GET error:', {
          invoiceId: id,
          companyId,
          isSuperAdmin,
          error: invoiceError?.message,
        })
      }
      return NextResponse.json({ error: 'Invoice not found', details: invoiceError?.message }, { status: 404 })
    }

    // İlişkili verileri ayrı ayrı çek (hata olsa bile invoice'ı döndür)
    let quoteData = null
    let companyData = null

    // Quote verisini çek (varsa)
    if (invoiceData.quoteId) {
      try {
        const { data: quote, error: quoteError } = await supabase
          .from('Quote')
          .select(
            `
            id,
            title,
            total,
            Deal (
              id,
              title,
              Customer (
                id,
                name,
                email,
                phone,
                address,
                taxNumber,
                CustomerCompany (
                  id,
                  name,
                  taxNumber,
                  address
                )
              )
            )
          `
          )
          .eq('id', invoiceData.quoteId)
          .eq('companyId', companyId)
          .maybeSingle()
        
        if (!quoteError && quote) {
          quoteData = quote
        }
      } catch (quoteErr) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Quote fetch error:', quoteErr)
        }
      }
    }

    // Company verisini çek
    try {
      const { data: company, error: companyError } = await supabase
        .from('Company')
        .select('id, name, taxNumber, address, phone, email')
        .eq('id', companyId)
        .maybeSingle()
      
      if (!companyError && company) {
        companyData = company
      }
    } catch (companyErr) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Company fetch error:', companyErr)
      }
    }

    // Invoice verisini ilişkili verilerle birleştir
    const invoice = {
      ...invoiceData,
      Quote: quoteData,
      Company: companyData,
    } as any

    if (process.env.NODE_ENV === 'development') {
      console.log('Invoice Export GET result:', {
        invoiceFound: !!invoice,
        invoiceId: invoice?.id,
        invoiceTitle: invoice?.title,
        hasQuote: !!quoteData,
        hasCompany: !!companyData,
      })
    }

    // UBL-TR XML formatı oluştur
    const xml = generateUBLTRXML(invoice)

    // XML dosyası olarak döndür
    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Disposition': `attachment; filename="fatura_${invoice.invoiceNumber || invoice.id}.xml"`,
      },
    })
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Invoice Export error:', error)
    }
    return NextResponse.json(
      {
        error: 'Failed to export invoice',
        ...(process.env.NODE_ENV === 'development' && {
          message: error?.message || 'Unknown error',
        }),
      },
      { status: 500 }
    )
  }
}

// UBL-TR XML formatı oluştur (Türkiye Fatura Mevzuatına Uygun)
function generateUBLTRXML(invoice: any): string {
  const company = invoice.Company || {}
  const customer = invoice.Quote?.Deal?.Customer || {}
  const customerCompany = customer.CustomerCompany || {}
  
  // Fatura tarihi
  const invoiceDate = invoice.createdAt
    ? new Date(invoice.createdAt).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0]
  
  // Vade tarihi
  const dueDate = invoice.dueDate
    ? new Date(invoice.dueDate).toISOString().split('T')[0]
    : invoiceDate

  // UBL-TR XML formatı
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionContent/>
    </ext:UBLExtension>
  </ext:UBLExtensions>
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>TR1.2</cbc:CustomizationID>
  <cbc:ProfileID>TEMELFATURA</cbc:ProfileID>
  <cbc:ID>${invoice.invoiceNumber || invoice.id}</cbc:ID>
  <cbc:CopyIndicator>false</cbc:CopyIndicator>
  <cbc:UUID>${invoice.id}</cbc:UUID>
  <cbc:IssueDate>${invoiceDate}</cbc:IssueDate>
  <cbc:IssueTime>${new Date(invoice.createdAt || new Date()).toISOString().split('T')[1].split('.')[0]}</cbc:IssueTime>
  <cbc:InvoiceTypeCode>SATIS</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>TRY</cbc:DocumentCurrencyCode>
  <cbc:LineCountNumeric>1</cbc:LineCountNumeric>
  
  <!-- Fatura Edilen (Satıcı) -->
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cbc:WebsiteURI>${company.website || ''}</cbc:WebsiteURI>
      <cac:PartyIdentification>
        <cbc:ID schemeID="VKN">${company.taxNumber || ''}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>${escapeXML(company.name || '')}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${escapeXML(company.address || '')}</cbc:StreetName>
        <cbc:CityName>${escapeXML(company.city || '')}</cbc:CityName>
        <cbc:PostalZone>${company.postalCode || ''}</cbc:PostalZone>
        <cac:Country>
          <cbc:Name>Türkiye</cbc:Name>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cac:TaxScheme>
          <cbc:Name>Vergi Dairesi</cbc:Name>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:Contact>
        <cbc:Telephone>${company.phone || ''}</cbc:Telephone>
        <cbc:ElectronicMail>${company.email || ''}</cbc:ElectronicMail>
      </cac:Contact>
    </cac:Party>
  </cac:AccountingSupplierParty>
  
  <!-- Fatura Edilen (Alıcı) -->
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="${customerCompany.taxNumber ? 'VKN' : 'TCKN'}">${customerCompany.taxNumber || customer.taxNumber || ''}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>${escapeXML(customerCompany.name || customer.name || '')}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${escapeXML(customerCompany.address || customer.address || '')}</cbc:StreetName>
        <cbc:CityName>${escapeXML(customerCompany.city || customer.city || '')}</cbc:CityName>
        <cac:Country>
          <cbc:Name>Türkiye</cbc:Name>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cac:TaxScheme>
          <cbc:Name>Vergi Dairesi</cbc:Name>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:Contact>
        <cbc:Telephone>${customer.phone || ''}</cbc:Telephone>
        <cbc:ElectronicMail>${customer.email || ''}</cbc:ElectronicMail>
      </cac:Contact>
    </cac:Party>
  </cac:AccountingCustomerParty>
  
  <!-- Fatura Satırları -->
  <cac:InvoiceLine>
    <cbc:ID>1</cbc:ID>
    <cbc:InvoicedQuantity unitCode="C62">1</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="TRY">${(invoice.total || 0).toFixed(2)}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>${escapeXML(invoice.title || 'Fatura')}</cbc:Name>
      <cbc:Description>${escapeXML(invoice.description || '')}</cbc:Description>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="TRY">${(invoice.total || 0).toFixed(2)}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>
  
  <!-- Vergi Bilgileri -->
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="TRY">${((invoice.total || 0) * (invoice.taxRate || 0) / 100).toFixed(2)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="TRY">${((invoice.total || 0) / (1 + (invoice.taxRate || 0) / 100)).toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="TRY">${((invoice.total || 0) * (invoice.taxRate || 0) / 100).toFixed(2)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cac:TaxScheme>
          <cbc:Name>KDV</cbc:Name>
          <cbc:TaxTypeCode>0015</cbc:TaxTypeCode>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  
  <!-- Toplam Tutar -->
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="TRY">${((invoice.total || 0) / (1 + (invoice.taxRate || 0) / 100)).toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="TRY">${((invoice.total || 0) / (1 + (invoice.taxRate || 0) / 100)).toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="TRY">${(invoice.total || 0).toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="TRY">${(invoice.total || 0).toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  
  <!-- Ödeme Bilgileri -->
  <cac:PaymentTerms>
    <cbc:Note>Vade Tarihi: ${dueDate}</cbc:Note>
  </cac:PaymentTerms>
</Invoice>`

  return xml
}

// XML escape fonksiyonu
function escapeXML(str: string): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

