import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import InvoicePDF from '@/components/pdf/InvoicePDF'

// @react-pdf/renderer için React.createElement kullanılmalı

// Edge Runtime desteklemiyor, Node.js runtime kullan
// export const runtime = 'edge'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
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
      console.log('Invoice PDF GET request:', {
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
      console.log('Invoice PDF GET - basic data:', {
        invoiceFound: !!invoiceData,
        invoiceId: invoiceData?.id,
        invoiceTitle: invoiceData?.title,
        error: invoiceError?.message,
      })
    }

    if (invoiceError || !invoiceData) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Invoice PDF GET error:', {
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
            Deal (
              id,
              title,
              Customer (
                id,
                name,
                email,
                phone,
                city,
                address,
                taxNumber,
                CustomerCompany (
                  id,
                  name,
                  taxNumber,
                  address,
                  city
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
        .select('id, name, taxNumber, address, city, phone, email')
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
      console.log('Invoice PDF GET result:', {
        invoiceFound: !!invoice,
        invoiceId: invoice?.id,
        invoiceTitle: invoice?.title,
        hasQuote: !!quoteData,
        hasCompany: !!companyData,
      })
    }

    // PDF oluştur
    if (process.env.NODE_ENV === 'development') {
      console.log('Invoice PDF - creating PDF buffer:', {
        invoiceId: invoice?.id,
        invoiceTitle: invoice?.title,
        hasCompany: !!invoice?.Company,
        hasQuote: !!invoice?.Quote,
      })
    }

    let pdfBuffer: Buffer
    try {
      // @react-pdf/renderer için React.createElement kullan
      // InvoicePDF component'ini doğru şekilde oluştur
      const InvoicePDFComponent = InvoicePDF as React.ComponentType<{ invoice: any }>
      const pdfElement = React.createElement(InvoicePDFComponent, { invoice })
      pdfBuffer = await renderToBuffer(pdfElement)
    } catch (renderError: any) {
      console.error('PDF renderToBuffer error:', {
        message: renderError?.message,
        stack: renderError?.stack,
        invoiceId: invoice?.id,
        invoiceTitle: invoice?.title,
        errorDetails: renderError,
      })
      throw new Error(`PDF render error: ${renderError?.message || 'Unknown error'}`)
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Invoice PDF - PDF buffer created:', {
        bufferSize: pdfBuffer?.length,
      })
    }

    // PDF response döndür
    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="fatura-${invoice.id.substring(0, 8)}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate PDF',
        ...(process.env.NODE_ENV === 'development' && {
          message: error?.message || 'Unknown error',
          stack: error?.stack,
        }),
      },
      { status: 500 }
    )
  }
}

